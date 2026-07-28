import { INestApplication, Injectable, SetMetadata } from '@nestjs/common';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { join } from 'path';

// ===== configureApp =====
export async function configureApp(app: INestApplication, _options?: { disableSwagger?: boolean }): Promise<void> {
  app.enableCors({ origin: true, credentials: true });
  
  const expressApp = app.getHttpAdapter().getInstance();
  const express = require('express');
  expressApp.use(express.static(join(process.cwd(), 'dist/client')));
}

// ===== DRIZZLE_DATABASE token =====
export const DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';

// ===== PostgresJsDatabase type stub =====
export type PostgresJsDatabase<T = any> = any;

// ===== NeedLogin decorator =====
export const IS_PUBLIC_KEY = 'isPublic';
export const NeedLogin = () => SetMetadata(IS_PUBLIC_KEY, true);

// ===== CanRole decorator =====
export const CanRole = (...roles: string[]) => SetMetadata('roles', roles);

// ===== CapabilityService =====
@Injectable()
export class CapabilityService {
  load(_capabilityId: string): { call: (method: string, params?: Record<string, unknown>) => Promise<any> } {
    return {
      call: async (method: string, _params?: Record<string, unknown>) => {
        console.log('[CapabilityService] Calling', method);
        return { success: false, message: 'Capability service not configured' };
      },
    };
  }
  async runCapability(capabilityId: string, _params?: Record<string, unknown>): Promise<any> {
    console.log('[CapabilityService] Running:', capabilityId);
    return { success: false, message: 'Capability service not configured' };
  }
}

// ===== Database factory: 自动选择 PostgreSQL 或 PGlite =====
function createDb() {
  // Railway / 生产环境: 用 DATABASE_URL 连接真实 PostgreSQL
  const databaseUrl = process.env.DATABASE_URL || process.env.SUDA_DATABASE_URL;

  if (databaseUrl) {
    console.log('[DB] Using real PostgreSQL:', databaseUrl.replace(/\/\/.*@/, '//***@'));
    const postgres = require('postgres');
    const { drizzle } = require('drizzle-orm/postgres-js');
    const client = postgres(databaseUrl, { max: 10 });
    return drizzle(client);
  }

  // 本地开发: 用 PGlite（内存 PostgreSQL）
  console.log('[DB] Using PGlite (in-memory)');
  const { PGlite } = require('@electric-sql/pglite');
  const { drizzle } = require('drizzle-orm/pglite');
  const pgClient = new PGlite(join(process.cwd(), 'data'));
  return drizzle(pgClient);
}

// ===== PlatformModule =====
@Global()
@Module({
  providers: [
    { provide: DRIZZLE_DATABASE, useFactory: createDb },
    CapabilityService,
  ],
  exports: [DRIZZLE_DATABASE, CapabilityService],
})
class PlatformCoreModule {}

export const PlatformModule = {
  forRoot: (): DynamicModule => ({
    module: PlatformCoreModule,
    providers: [
      { provide: DRIZZLE_DATABASE, useFactory: createDb },
      CapabilityService,
    ],
    exports: [DRIZZLE_DATABASE, CapabilityService],
  }),
};
