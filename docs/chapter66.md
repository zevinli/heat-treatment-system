

---

## 第66章 后端 Service 层完整实现参考

### 66.1 入库 Service

```typescript
@Injectable()
export class InboundService {
  private readonly logger = new Logger(InboundService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase,
  ) {}

  async findAll(orgId: string, params: InboundListParams): Promise<PaginatedResponse<InboundRecord>> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [eq(inboundRecords.orgId, orgId)];
    if (params.status) conditions.push(eq(inboundRecords.status, params.status));
    if (params.customerId) conditions.push(eq(inboundRecords.customerId, params.customerId));
    if (params.startDate) conditions.push(gte(inboundRecords.inboundDate, new Date(params.startDate)));
    if (params.endDate) conditions.push(lte(inboundRecords.inboundDate, new Date(params.endDate)));

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      this.db.select().from(inboundRecords)
        .where(where)
        .orderBy(desc(inboundRecords.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(inboundRecords).where(where),
    ]);

    const itemsWithDetails = await this.batchLoadItems(items);

    return {
      items: itemsWithDetails,
      total: Number(count),
      page,
      pageSize,
    };
  }

  async findById(id: string, orgId: string): Promise<InboundRecord> {
    const [record] = await this.db.select().from(inboundRecords)
      .where(and(eq(inboundRecords.id, id), eq(inboundRecords.orgId, orgId)))
      .limit(1);

    if (!record) throw new NotFoundException('入库记录不存在');

    const items = await this.db.select().from(inboundItems)
      .where(eq(inboundItems.inboundId, id));

    return { ...record, items } as InboundRecord;
  }

  async create(dto: CreateInboundRequest, orgId: string, userId: string): Promise<InboundRecord> {
    // 验证客户
    if (dto.customerId) {
      const customer = await this.db.select().from(customers)
        .where(and(eq(customers.id, dto.customerId), eq(customers.orgId, orgId)))
        .limit(1);
      if (!customer[0]) throw new NotFoundException('客户不存在');
    }

    // 验证产品
    for (const item of dto.items) {
      if (item.productId) {
        const product = await this.db.select().from(products)
          .where(and(eq(products.id, item.productId), eq(products.orgId, orgId)))
          .limit(1);
        if (!product[0]) throw new NotFoundException(`产品 ${item.productName} 不存在`);
      }
      if (parseFloat(item.qty) <= 0) {
        throw new BadRequestException(`${item.productName} 数量必须大于0`);
      }
      if (parseFloat(item.weight) <= 0) {
        throw new BadRequestException(`${item.productName} 重量必须大于0`);
      }
    }

    // 计算汇总
    const totalQty = dto.items.reduce((sum, item) => sum + parseFloat(item.qty), 0);
    const totalWeight = dto.items.reduce((sum, item) => sum + parseFloat(item.weight), 0);

    return this.db.transaction(async (tx) => {
      // 创建入库记录
      const [record] = await tx.insert(inboundRecords).values({
        orgId,
        batchNo: dto.batchNo,
        customerId: dto.customerId,
        customerName: dto.customerName,
        inboundDate: new Date(dto.inboundDate),
        status: 'completed',
        totalQty: totalQty.toString(),
        totalWeight: totalWeight.toString(),
        photos: dto.photos?.join(','),
        remark: dto.remark,
        createdBy: userId,
      }).returning();

      // 创建入库明细
      const itemValues = dto.items.map(item => ({
        orgId,
        inboundId: record.id,
        productId: item.productId,
        productName: item.productName,
        material: item.material,
        process: item.process,
        specification: item.specification,
        qty: item.qty,
        weight: item.weight,
        unit: item.unit,
        unitPrice: item.unitPrice,
        location: item.location,
        remark: item.remark,
      }));
      await tx.insert(inboundItems).values(itemValues);

      // 更新库存（原子操作）
      for (const item of dto.items) {
        if (item.productId) {
          const [existing] = await tx.select().from(inventory)
            .where(and(
              eq(inventory.productId, item.productId),
              eq(inventory.orgId, orgId),
            ))
            .limit(1);

          if (existing) {
            await tx.update(inventory)
              .set({
                currentQty: sql`${inventory.currentQty} + ${item.qty}`,
                currentWeight: sql`${inventory.currentWeight} + ${item.weight}`,
                updatedAt: new Date(),
              })
              .where(eq(inventory.id, existing.id));
          } else {
            await tx.insert(inventory).values({
              orgId,
              productId: item.productId,
              productName: item.productName,
              material: item.material,
              specification: item.specification,
              currentQty: item.qty,
              currentWeight: item.weight,
              unit: item.unit,
              location: item.location,
              batchNo: dto.batchNo,
              inboundDate: new Date(dto.inboundDate),
              status: 'normal',
            });
          }

          // 记录库存变动
          await tx.insert(inventoryHistory).values({
            orgId,
            productId: item.productId,
            type: 'inbound',
            qty: item.qty,
            afterQty: item.qty,
            source: 'inbound',
            refId: record.id,
            operator: userId,
          });
        }
      }

      return record;
    });
  }

  async update(id: string, dto: UpdateInboundRequest, orgId: string, userId: string): Promise<InboundRecord> {
    const [existing] = await this.db.select().from(inboundRecords)
      .where(and(eq(inboundRecords.id, id), eq(inboundRecords.orgId, orgId)))
      .limit(1);

    if (!existing) throw new NotFoundException('入库记录不存在');
    if (existing.status !== 'draft') {
      throw new BadRequestException('只能编辑草稿状态的记录');
    }

    const [updated] = await this.db.update(inboundRecords)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(inboundRecords.id, id))
      .returning();

    return updated;
  }

  async remove(id: string, orgId: string): Promise<{ id: string }> {
    const [existing] = await this.db.select().from(inboundRecords)
      .where(and(eq(inboundRecords.id, id), eq(inboundRecords.orgId, orgId)))
      .limit(1);

    if (!existing) throw new NotFoundException('入库记录不存在');
    if (existing.status !== 'draft') {
      throw new BadRequestException('只能删除草稿状态的记录');
    }

    await this.db.transaction(async (tx) => {
      await tx.delete(inboundItems).where(eq(inboundItems.inboundId, id));
      await tx.delete(inboundRecords).where(eq(inboundRecords.id, id));
    });

    return { id };
  }

  async updateStatus(id: string, status: InboundStatus, orgId: string, userId: string): Promise<InboundRecord> {
    const [updated] = await this.db.update(inboundRecords)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(inboundRecords.id, id), eq(inboundRecords.orgId, orgId)))
      .returning();

    if (!updated) throw new NotFoundException('入库记录不存在');
    return updated;
  }

  private async batchLoadItems(records: InboundRecord[]): Promise<InboundRecord[]> {
    if (records.length === 0) return records;

    const ids = records.map(r => r.id);
    const allItems = await this.db.select().from(inboundItems)
      .where(inArray(inboundItems.inboundId, ids));

    const itemsByInbound = new Map<string, InboundItem[]>();
    for (const item of allItems) {
      const list = itemsByInbound.get(item.inboundId) ?? [];
      list.push(item);
      itemsByInbound.set(item.inboundId, list);
    }

    return records.map(record => ({
      ...record,
      items: itemsByInbound.get(record.id) ?? [],
    }));
  }
}
```

### 66.2 出库 Service

```typescript
@Injectable()
export class OutboundService {
  private readonly logger = new Logger(OutboundService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async findAll(orgId: string, params: OutboundListParams): Promise<PaginatedResponse<OutboundRecord>> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [eq(outboundRecords.orgId, orgId)];
    if (params.status) conditions.push(eq(outboundRecords.status, params.status));
    if (params.customerId) conditions.push(eq(outboundRecords.customerId, params.customerId));
    if (params.inboundId) conditions.push(eq(outboundRecords.inboundId, params.inboundId));

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      this.db.select().from(outboundRecords)
        .where(where)
        .orderBy(desc(outboundRecords.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(outboundRecords).where(where),
    ]);

    const itemsWithDetails = await this.batchLoadItems(items);

    return { items: itemsWithDetails, total: Number(count), page, pageSize };
  }

  async findById(id: string, orgId: string): Promise<OutboundRecord> {
    const [record] = await this.db.select().from(outboundRecords)
      .where(and(eq(outboundRecords.id, id), eq(outboundRecords.orgId, orgId)))
      .limit(1);

    if (!record) throw new NotFoundException('出库记录不存在');

    const items = await this.db.select().from(outboundItems)
      .where(eq(outboundItems.outboundId, id));

    return { ...record, items };
  }

  async create(dto: CreateOutboundRequest, orgId: string, userId: string): Promise<OutboundRecord> {
    // 验证入库记录
    if (dto.inboundId) {
      const [inbound] = await this.db.select().from(inboundRecords)
        .where(and(eq(inboundRecords.id, dto.inboundId), eq(inboundRecords.orgId, orgId)))
        .limit(1);
      if (!inbound) throw new NotFoundException('入库记录不存在');
      if (inbound.status !== 'completed') {
        throw new BadRequestException('入库记录未完成，不能发货');
      }
    }

    // 计算汇总
    const totalQty = dto.items.reduce((sum, item) => sum + parseFloat(item.qty), 0);
    const totalWeight = dto.items.reduce((sum, item) => sum + parseFloat(item.weight), 0);
    const totalAmount = dto.items.reduce((sum, item) => {
      const amount = parseFloat(item.qty) * parseFloat(item.unitPrice || '0');
      return sum + amount;
    }, 0);

    return this.db.transaction(async (tx) => {
      // 创建出库记录
      const [record] = await tx.insert(outboundRecords).values({
        orgId,
        inboundId: dto.inboundId,
        customerId: dto.customerId,
        customerName: dto.customerName,
        outboundDate: new Date(dto.outboundDate),
        status: 'completed',
        totalQty: totalQty.toString(),
        totalWeight: totalWeight.toString(),
        totalAmount: totalAmount.toString(),
        deliveredQty: totalQty.toString(),
        remark: dto.remark,
        createdBy: userId,
      }).returning();

      // 创建出库明细
      await tx.insert(outboundItems).values(
        dto.items.map(item => ({
          orgId,
          outboundId: record.id,
          productId: item.productId,
          productName: item.productName,
          qty: item.qty,
          weight: item.weight,
          unit: item.unit,
          unitPrice: item.unitPrice,
          remark: item.remark,
        }))
      );

      // 扣减库存（原子操作，防超卖）
      for (const item of dto.items) {
        if (item.productId) {
          const [updated] = await tx.update(inventory)
            .set({
              currentQty: sql`${inventory.currentQty} - ${item.qty}`,
              currentWeight: sql`${inventory.currentWeight} - ${item.weight}`,
              updatedAt: new Date(),
            })
            .where(and(
              eq(inventory.productId, item.productId),
              eq(inventory.orgId, orgId),
              gte(inventory.currentQty, item.qty),
            ))
            .returning();

          if (!updated) throw new ConflictException(`${item.productName} 库存不足`);

          // 记录库存变动
          await tx.insert(inventoryHistory).values({
            orgId,
            productId: item.productId,
            type: 'outbound',
            qty: `-${item.qty}`,
            afterQty: updated.currentQty,
            source: 'outbound',
            refId: record.id,
            operator: userId,
          });
        }
      }

      return record;
    });
  }

  async close(id: string, orgId: string, userId: string): Promise<OutboundRecord> {
    const [existing] = await this.db.select().from(outboundRecords)
      .where(and(eq(outboundRecords.id, id), eq(outboundRecords.orgId, orgId)))
      .limit(1);

    if (!existing) throw new NotFoundException('出库记录不存在');
    if (existing.status === 'completed') {
      throw new BadRequestException('记录已完成，无需关单');
    }

    const [updated] = await this.db.update(outboundRecords)
      .set({
        status: 'completed',
        deliveredQty: existing.totalQty,
        updatedAt: new Date(),
      })
      .where(eq(outboundRecords.id, id))
      .returning();

    return updated;
  }

  private async batchLoadItems(records: OutboundRecord[]): Promise<OutboundRecord[]> {
    if (records.length === 0) return records;

    const ids = records.map(r => r.id);
    const allItems = await this.db.select().from(outboundItems)
      .where(inArray(outboundItems.outboundId, ids));

    const itemsByOutbound = new Map<string, OutboundItem[]>();
    for (const item of allItems) {
      const list = itemsByOutbound.get(item.outboundId) ?? [];
      list.push(item);
      itemsByOutbound.set(item.outboundId, list);
    }

    return records.map(record => ({
      ...record,
      items: itemsByOutbound.get(record.id) ?? [],
    }));
  }
}
```

### 66.3 库存 Service

```typescript
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async findAll(orgId: string, params: InventoryListParams): Promise<PaginatedResponse<InventoryItem>> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [eq(inventory.orgId, orgId)];
    if (params.material) conditions.push(eq(inventory.material, params.material));
    if (params.batchNo) conditions.push(eq(inventory.batchNo, params.batchNo));
    if (params.status) conditions.push(eq(inventory.status, params.status));

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      this.db.select().from(inventory)
        .where(where)
        .orderBy(desc(inventory.updatedAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(inventory).where(where),
    ]);

    return { items, total: Number(count), page, pageSize };
  }

  async getOverview(orgId: string): Promise<InventoryOverview> {
    const allItems = await this.db.select().from(inventory)
      .where(eq(inventory.orgId, orgId));

    const totalQty = allItems.reduce((sum, item) => sum + parseFloat(item.currentQty), 0);
    const expiredCount = allItems.filter(item => item.status === 'expired').length;
    const lowStockCount = allItems.filter(item => item.status === 'low_stock').length;

    return {
      totalTypes: allItems.length,
      totalQty,
      expiredCount,
      lowStockCount,
    };
  }

  async adjust(dto: AdjustInventoryRequest, orgId: string, userId: string): Promise<InventoryItem> {
    const adjustQty = dto.adjustType === 'out' ? -dto.qty : dto.qty;

    return this.db.transaction(async (tx) => {
      const [updated] = await tx.update(inventory)
        .set({
          currentQty: sql`${inventory.currentQty} + ${adjustQty}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(inventory.productId, dto.productId),
          eq(inventory.orgId, orgId),
          dto.adjustType === 'out'
            ? gte(inventory.currentQty, dto.qty.toString())
            : sql`true`,
        ))
        .returning();

      if (!updated) throw new NotFoundException('库存记录不存在或库存不足');

      await tx.insert(inventoryHistory).values({
        orgId,
        productId: dto.productId,
        type: dto.adjustType === 'in' ? 'adjust_in' : 'adjust_out',
        qty: adjustQty.toString(),
        afterQty: updated.currentQty,
        source: 'manual_adjust',
        operator: userId,
        remark: dto.reason,
      });

      return updated;
    });
  }

  async getHistory(productId: string, orgId: string, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const [items, [{ count }]] = await Promise.all([
      this.db.select().from(inventoryHistory)
        .where(and(
          eq(inventoryHistory.productId, productId),
          eq(inventoryHistory.orgId, orgId),
        ))
        .orderBy(desc(inventoryHistory.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(inventoryHistory)
        .where(and(
          eq(inventoryHistory.productId, productId),
          eq(inventoryHistory.orgId, orgId),
        )),
    ]);

    return { items, total: Number(count), page, pageSize };
  }

  async checkExpiry(orgId: string): Promise<void> {
    const allItems = await this.db.select().from(inventory)
      .where(and(
        eq(inventory.orgId, orgId),
        eq(inventory.status, 'normal'),
      ));

    const expiredIds: string[] = [];
    const lowStockIds: string[] = [];
    const now = new Date();

    for (const item of allItems) {
      if (item.inboundDate) {
        const days = Math.floor((now.getTime() - new Date(item.inboundDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days > 90) {
          expiredIds.push(item.id);
          continue;
        }
      }
      if (parseFloat(item.currentQty) < 10) {
        lowStockIds.push(item.id);
      }
    }

    if (expiredIds.length > 0) {
      await this.db.update(inventory)
        .set({ status: 'expired', updatedAt: now })
        .where(inArray(inventory.id, expiredIds));
    }

    if (lowStockIds.length > 0) {
      await this.db.update(inventory)
        .set({ status: 'low_stock', updatedAt: now })
        .where(inArray(inventory.id, lowStockIds));
    }
  }
}
```

### 66.4 对账 Service

```typescript
@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async create(dto: CreateReconciliationRequest, orgId: string, userId: string): Promise<ReconciliationRecord> {
    // 检查重复
    const [existing] = await this.db.select().from(reconciliationRecords)
      .where(and(
        eq(reconciliationRecords.orgId, orgId),
        eq(reconciliationRecords.customerId, dto.customerId),
        eq(reconciliationRecords.periodYear, dto.periodYear),
        eq(reconciliationRecords.periodMonth, dto.periodMonth),
      ))
      .limit(1);

    if (existing) throw new ConflictException('该客户在此期间已有对账记录');

    // 获取客户信息
    const [customer] = await this.db.select().from(customers)
      .where(and(eq(customers.id, dto.customerId), eq(customers.orgId, orgId)))
      .limit(1);
    if (!customer) throw new NotFoundException('客户不存在');

    // 查询该期间的入库记录
    const startDate = new Date(dto.periodYear, dto.periodMonth - 1, 1);
    const endDate = new Date(dto.periodYear, dto.periodMonth, 0, 23, 59, 59);

    const inboundRecords = await this.db.select().from(inboundRecords)
      .where(and(
        eq(inboundRecords.orgId, orgId),
        eq(inboundRecords.customerId, dto.customerId),
        eq(inboundRecords.status, 'completed'),
        gte(inboundRecords.inboundDate, startDate),
        lte(inboundRecords.inboundDate, endDate),
      ));

    const outboundRecords = await this.db.select().from(outboundRecords)
      .where(and(
        eq(outboundRecords.orgId, orgId),
        eq(outboundRecords.customerId, dto.customerId),
        eq(outboundRecords.status, 'completed'),
        gte(outboundRecords.outboundDate, startDate),
        lte(outboundRecords.outboundDate, endDate),
      ));

    const totalInbound = inboundRecords.reduce((sum, r) => sum + parseFloat(r.totalWeight || '0'), 0);
    const totalOutbound = outboundRecords.reduce((sum, r) => sum + parseFloat(r.totalWeight || '0'), 0);
    const totalAmount = outboundRecords.reduce((sum, r) => sum + parseFloat(r.totalAmount || '0'), 0);

    return this.db.transaction(async (tx) => {
      const [record] = await tx.insert(reconciliationRecords).values({
        orgId,
        reconNo: `RECON-${dto.periodYear}${String(dto.periodMonth).padStart(2, '0')}-${Date.now()}`,
        customerId: dto.customerId,
        customerName: customer.name,
        periodYear: dto.periodYear,
        periodMonth: dto.periodMonth,
        status: 'pending',
        totalInbound: totalInbound.toString(),
        totalOutbound: totalOutbound.toString(),
        totalAmount: totalAmount.toString(),
        paidAmount: '0',
        unpaidAmount: totalAmount.toString(),
        remark: dto.remark,
        createdBy: userId,
      }).returning();

      // 创建对账明细
      const items: Array<NewReconciliationItem> = [
        ...inboundRecords.map(r => ({
          orgId,
          reconciliationId: record.id,
          type: 'inbound' as const,
          refId: r.id,
          refNo: r.batchNo || '',
          date: r.inboundDate,
          productName: '',
          qty: r.totalQty,
          weight: r.totalWeight,
          amount: '0',
        })),
        ...outboundRecords.map(r => ({
          orgId,
          reconciliationId: record.id,
          type: 'outbound' as const,
          refId: r.id,
          refNo: r.outboundNo || '',
          date: r.outboundDate,
          productName: '',
          qty: r.totalQty,
          weight: r.totalWeight,
          amount: r.totalAmount,
        })),
      ];

      if (items.length > 0) {
        await tx.insert(reconciliationItems).values(items);
      }

      return record;
    });
  }

  async updateStatus(id: string, status: ReconciliationStatus, orgId: string, userId: string): Promise<ReconciliationRecord> {
    const [existing] = await this.db.select().from(reconciliationRecords)
      .where(and(eq(reconciliationRecords.id, id), eq(reconciliationRecords.orgId, orgId)))
      .limit(1);

    if (!existing) throw new NotFoundException('对账记录不存在');

    // 状态流转校验
    const validTransitions: Record<string, string[]> = {
      draft: ['pending'],
      pending: ['confirmed', 'rejected'],
      confirmed: ['settled'],
      rejected: [],
      settled: [],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      throw new BadRequestException(`不能从 ${existing.status} 变更为 ${status}`);
    }

    const updateData: Partial<typeof reconciliationRecords.$inferInsert> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
      updateData.confirmedBy = userId;
    }

    const [updated] = await this.db.update(reconciliationRecords)
      .set(updateData)
      .where(eq(reconciliationRecords.id, id))
      .returning();

    return updated;
  }
}
```

### 66.5 统计 Service

```typescript
@Injectable()
export class StatisticsService {
  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async getOverview(orgId: string, params?: StatisticsParams): Promise<StatisticsOverview> {
    const startDate = params?.startDate ? new Date(params.startDate) : new Date(0);
    const endDate = params?.endDate ? new Date(params.endDate) : new Date();

    const [inboundStats] = await this.db.select({
      totalQty: sql<string>`COALESCE(SUM(${inboundRecords.totalQty}), 0)`,
      totalWeight: sql<string>`COALESCE(SUM(${inboundRecords.totalWeight}), 0)`,
      count: count(),
    }).from(inboundRecords)
      .where(and(
        eq(inboundRecords.orgId, orgId),
        eq(inboundRecords.status, 'completed'),
        gte(inboundRecords.inboundDate, startDate),
        lte(inboundRecords.inboundDate, endDate),
      ));

    const [outboundStats] = await this.db.select({
      totalQty: sql<string>`COALESCE(SUM(${outboundRecords.totalQty}), 0)`,
      totalWeight: sql<string>`COALESCE(SUM(${outboundRecords.totalWeight}), 0)`,
      count: count(),
    }).from(outboundRecords)
      .where(and(
        eq(outboundRecords.orgId, orgId),
        eq(outboundRecords.status, 'completed'),
        gte(outboundRecords.outboundDate, startDate),
        lte(outboundRecords.outboundDate, endDate),
      ));

    const [inventoryStats] = await this.db.select({
      totalQty: sql<string>`COALESCE(SUM(${inventory.currentQty}), 0)`,
      totalWeight: sql<string>`COALESCE(SUM(${inventory.currentWeight}), 0)`,
      count: count(),
    }).from(inventory)
      .where(eq(inventory.orgId, orgId));

    const [customerCount] = await this.db.select({ count: count() })
      .from(customers).where(eq(customers.orgId, orgId));

    const [productCount] = await this.db.select({ count: count() })
      .from(products).where(eq(products.orgId, orgId));

    const [pendingRecon] = await this.db.select({ count: count() })
      .from(reconciliationRecords)
      .where(and(
        eq(reconciliationRecords.orgId, orgId),
        inArray(reconciliationRecords.status, ['draft', 'pending']),
      ));

    const [expiredCount] = await this.db.select({ count: count() })
      .from(inventory)
      .where(and(eq(inventory.orgId, orgId), eq(inventory.status, 'expired')));

    const [lowStockCount] = await this.db.select({ count: count() })
      .from(inventory)
      .where(and(eq(inventory.orgId, orgId), eq(inventory.status, 'low_stock')));

    return {
      totalInboundQty: parseFloat(inboundStats.totalQty),
      totalInboundWeight: parseFloat(inboundStats.totalWeight),
      totalOutboundQty: parseFloat(outboundStats.totalQty),
      totalOutboundWeight: parseFloat(outboundStats.totalWeight),
      totalInventoryQty: parseFloat(inventoryStats.totalQty),
      totalInventoryWeight: parseFloat(inventoryStats.totalWeight),
      totalCustomers: Number(customerCount.count),
      totalProducts: Number(productCount.count),
      pendingReconciliation: Number(pendingRecon.count),
      expiredInventory: Number(expiredCount.count),
      lowStockCount: Number(lowStockCount.count),
    };
  }

  async getInboundStats(orgId: string, params?: StatisticsParams): Promise<InboundStatistics[]> {
    const startDate = params?.startDate ? new Date(params.startDate) : dayjs().subtract(30, 'day').toDate();
    const endDate = params?.endDate ? new Date(params.endDate) : new Date();

    const groupBy = params?.groupBy || 'day';
    const dateFormat = groupBy === 'month' ? 'YYYY-MM' : groupBy === 'week' ? 'IYYY-IW' : 'YYYY-MM-DD';

    const results = await this.db.select({
      date: sql<string>`to_char(${inboundRecords.inboundDate}, ${dateFormat})`,
      count: count(),
      totalQty: sql<string>`COALESCE(SUM(${inboundRecords.totalQty}), 0)`,
      totalWeight: sql<string>`COALESCE(SUM(${inboundRecords.totalWeight}), 0)`,
      totalAmount: sql<string>`COALESCE(SUM(${inboundRecords.totalWeight} * COALESCE((SELECT unit_price FROM products WHERE id = ${inboundItems.productId}), 0)), 0)`,
    }).from(inboundRecords)
      .leftJoin(inboundItems, eq(inboundItems.inboundId, inboundRecords.id))
      .where(and(
        eq(inboundRecords.orgId, orgId),
        eq(inboundRecords.status, 'completed'),
        gte(inboundRecords.inboundDate, startDate),
        lte(inboundRecords.inboundDate, endDate),
      ))
      .groupBy(sql`to_char(${inboundRecords.inboundDate}, ${dateFormat})`)
      .orderBy(sql`to_char(${inboundRecords.inboundDate}, ${dateFormat})`);

    return results;
  }

  async getCustomerStats(orgId: string, params?: StatisticsParams): Promise<CustomerStatistics[]> {
    const startDate = params?.startDate ? new Date(params.startDate) : new Date(0);
    const endDate = params?.endDate ? new Date(params.endDate) : new Date();

    const results = await this.db.select({
      customerId: customers.id,
      customerName: customers.name,
      inboundCount: sql<number>`COUNT(DISTINCT CASE WHEN ${inboundRecords.id} IS NOT NULL THEN ${inboundRecords.id} END)`,
      outboundCount: sql<number>`COUNT(DISTINCT CASE WHEN ${outboundRecords.id} IS NOT NULL THEN ${outboundRecords.id} END)`,
      totalAmount: sql<string>`COALESCE(SUM(${outboundRecords.totalAmount}), 0)`,
    }).from(customers)
      .leftJoin(inboundRecords, and(
        eq(inboundRecords.customerId, customers.id),
        eq(inboundRecords.orgId, orgId),
        eq(inboundRecords.status, 'completed'),
        gte(inboundRecords.inboundDate, startDate),
        lte(inboundRecords.inboundDate, endDate),
      ))
      .leftJoin(outboundRecords, and(
        eq(outboundRecords.customerId, customers.id),
        eq(outboundRecords.orgId, orgId),
        eq(outboundRecords.status, 'completed'),
        gte(outboundRecords.outboundDate, startDate),
        lte(outboundRecords.outboundDate, endDate),
      ))
      .where(eq(customers.orgId, orgId))
      .groupBy(customers.id, customers.name)
      .orderBy(desc(sql`COALESCE(SUM(${outboundRecords.totalAmount}), 0)`));

    return results.map(r => ({
      ...r,
      paidAmount: '0',
      unpaidAmount: r.totalAmount,
      paymentRate: 0,
    }));
  }
}
```

### 66.6 Controller 示例

```typescript
@Controller('api/inbound')
export class InboundController {
  constructor(private readonly inboundService: InboundService) {}

  @Get()
  async findAll(@Req() req: Request, @Query() query: InboundListParams) {
    return this.inboundService.findAll(req.userContext.userId, query);
  }

  @Get(':id')
  async findById(@Req() req: Request, @Param('id') id: string) {
    return this.inboundService.findById(id, req.userContext.userId);
  }

  @NeedLogin()
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateInboundRequest) {
    return this.inboundService.create(dto, req.userContext.userId, req.userContext.userId);
  }

  @NeedLogin()
  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateInboundRequest) {
    return this.inboundService.update(id, dto, req.userContext.userId, req.userContext.userId);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    return this.inboundService.remove(id, req.userContext.userId);
  }

  @NeedLogin()
  @Patch(':id/status')
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('status') status: InboundStatus,
  ) {
    return this.inboundService.updateStatus(id, status, req.userContext.userId, req.userContext.userId);
  }
}
```

### 66.7 Module 注册

```typescript
@Module({
  imports: [],
  controllers: [InboundController],
  providers: [InboundService],
  exports: [InboundService],
})
export class InboundModule {}
```

在 `app.module.ts` 中注册（必须在 ViewModule 之前）：

```typescript
@Module({
  imports: [
    // ... 其他模块
    InboundModule,
    OutboundModule,
    InventoryModule,
    ReconciliationModule,
    StatisticsModule,
    CustomerModule,
    ProductModule,
    OrganizationModule,
    RbacModule,
    TemplateModule,
    DashboardModule,
    ViewModule, // 必须在最后
  ],
})
export class AppModule {}
```
