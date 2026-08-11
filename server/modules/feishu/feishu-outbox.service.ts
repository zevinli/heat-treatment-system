import { Injectable, Logger } from '@nestjs/common';
import { and, asc, eq, inArray, lte, or, sql } from 'drizzle-orm';
import { integrationSyncJobTable } from '../../database/schema';
import { BitableSyncService, type SyncResult } from './bitable-sync.service';

export type FeishuSyncTopic = 'inbound' | 'outbound' | 'customer' | 'reconciliation';

/**
 * Transactional outbox for Feishu writes.
 *
 * Business services enqueue through the same transaction used to save their
 * order/customer. A process crash or a temporary Feishu outage therefore does
 * not silently lose synchronization work.
 */
@Injectable()
export class FeishuOutboxService {
  private readonly logger = new Logger(FeishuOutboxService.name);

  constructor(private readonly sync: BitableSyncService) {}

  async enqueue(
    db: any,
    topic: FeishuSyncTopic,
    aggregateKey: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await db.insert(integrationSyncJobTable).values({
      topic,
      aggregateKey,
      payload,
      status: 'pending',
      attemptCount: 0,
      nextAttemptAt: new Date(),
      lockedAt: null,
      completedAt: null,
      lastError: null,
    }).onConflictDoUpdate({
      target: [integrationSyncJobTable.topic, integrationSyncJobTable.aggregateKey],
      set: {
        payload,
        status: 'pending',
        attemptCount: 0,
        nextAttemptAt: new Date(),
        lockedAt: null,
        completedAt: null,
        lastError: null,
        updatedAt: new Date(),
      },
    });
  }

  async processTenant(orgCode: string, db: any, batchSize = 30): Promise<{ completed: number; failed: number }> {
    const staleLockBefore = new Date(Date.now() - 10 * 60 * 1000);
    const candidates = await db.select().from(integrationSyncJobTable).where(and(
      lte(integrationSyncJobTable.nextAttemptAt, new Date()),
      or(
        inArray(integrationSyncJobTable.status, ['pending', 'failed']),
        and(
          eq(integrationSyncJobTable.status, 'processing'),
          sql`${integrationSyncJobTable.lockedAt} < ${staleLockBefore}`,
        ),
      ),
    )).orderBy(asc(integrationSyncJobTable.nextAttemptAt)).limit(batchSize);

    let completed = 0;
    let failed = 0;
    for (const candidate of candidates) {
      const claimTime = new Date();
      const [claimed] = await db.update(integrationSyncJobTable).set({
        status: 'processing',
        lockedAt: claimTime,
        updatedAt: claimTime,
      }).where(and(
        eq(integrationSyncJobTable.id, candidate.id),
        // Another application instance may have claimed the row after our select.
        sql`(${integrationSyncJobTable.status} IN ('pending', 'failed') OR ${integrationSyncJobTable.lockedAt} < ${staleLockBefore})`,
      )).returning({ id: integrationSyncJobTable.id });
      if (!claimed) continue;

      try {
        const result = await this.dispatch(candidate.topic as FeishuSyncTopic, candidate.payload as any, orgCode);
        if (result.error) throw new Error(result.error);
        const [settled] = await db.update(integrationSyncJobTable).set({
          status: 'completed',
          completedAt: new Date(),
          lockedAt: null,
          lastError: null,
          updatedAt: new Date(),
        }).where(and(
          eq(integrationSyncJobTable.id, candidate.id),
          eq(integrationSyncJobTable.status, 'processing'),
          eq(integrationSyncJobTable.lockedAt, claimTime),
        )).returning({ id: integrationSyncJobTable.id });
        // 业务在同步期间可能又写入同一聚合键；enqueue 会把任务重新置为 pending。
        // 此时绝不能用旧 payload 把新任务覆盖成 completed。
        if (settled) completed += 1;
      } catch (error: any) {
        const attemptCount = Number(candidate.attemptCount || 0) + 1;
        const delayMs = Math.min(60 * 60 * 1000, 1000 * (2 ** Math.min(attemptCount, 12)));
        const message = String(error?.message || error || '未知同步错误').slice(0, 2000);
        const [settled] = await db.update(integrationSyncJobTable).set({
          status: 'failed',
          attemptCount,
          nextAttemptAt: new Date(Date.now() + delayMs),
          lockedAt: null,
          lastError: message,
          updatedAt: new Date(),
        }).where(and(
          eq(integrationSyncJobTable.id, candidate.id),
          eq(integrationSyncJobTable.status, 'processing'),
          eq(integrationSyncJobTable.lockedAt, claimTime),
        )).returning({ id: integrationSyncJobTable.id });
        if (settled) {
          this.logger.warn(`[${orgCode}] 飞书 ${candidate.topic}/${candidate.aggregateKey} 同步失败（第 ${attemptCount} 次）：${message}`);
          failed += 1;
        }
      }
    }
    return { completed, failed };
  }

  async getSummary(db: any) {
    const rows = await db.select({
      status: integrationSyncJobTable.status,
      count: sql<number>`count(*)::int`,
    }).from(integrationSyncJobTable).groupBy(integrationSyncJobTable.status);
    const summary: Record<string, number> = { pending: 0, processing: 0, failed: 0, completed: 0 };
    for (const row of rows) summary[row.status] = Number(row.count || 0);
    return summary;
  }

  async retryFailed(db: any): Promise<number> {
    const rows = await db.update(integrationSyncJobTable).set({
      status: 'pending',
      nextAttemptAt: new Date(),
      lockedAt: null,
      updatedAt: new Date(),
    }).where(eq(integrationSyncJobTable.status, 'failed')).returning({ id: integrationSyncJobTable.id });
    return rows.length;
  }

  private dispatch(topic: FeishuSyncTopic, payload: any, orgCode: string): Promise<SyncResult> {
    switch (topic) {
      case 'inbound': return this.sync.syncInbound(payload, orgCode);
      case 'outbound': return this.sync.syncOutbound(payload, orgCode);
      case 'customer': return this.sync.syncCustomer(payload, orgCode);
      case 'reconciliation': return this.sync.syncReconciliation(payload, orgCode);
      default: throw new Error(`不支持的飞书同步主题：${topic}`);
    }
  }
}
