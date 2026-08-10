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

// ===== Authentication decorators =====
export const IS_PUBLIC_KEY = 'isPublic';
export const AUTH_REQUIRED_KEY = 'authRequired';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const NeedLogin = () => SetMetadata(AUTH_REQUIRED_KEY, true);

// ===== CanRole decorator =====
export const CanRole = (...roles: string[]) => SetMetadata('roles', roles);

// ===== CapabilityService =====
@Injectable()
export class CapabilityService {
  load(_capabilityId: string) {
    return {
      call: async (method: string, _params?: Record<string, unknown>) => {
        console.log('[CapabilityService] Calling', method);
        return { success: false };
      },
    };
  }
  async runCapability(capabilityId: string, _params?: Record<string, unknown>) {
    return { success: false };
  }
}

// ===== Database factory =====
function createDb() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUDA_DATABASE_URL;

  if (databaseUrl) {
    try {
      const masked = databaseUrl.replace(/\/\/.*@/, '//***@');
      console.log('[DB] Connecting to PostgreSQL:', masked);
      const postgres = require('postgres');
      const { drizzle } = require('drizzle-orm/postgres-js');
      const client = postgres(databaseUrl, {
        max: 5,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      return drizzle(client);
    } catch (err: any) {
      console.error('[DB] PostgreSQL connection failed:', err.message);
      throw err;
    }
  }

  // 本地开发用 PGlite（不是回退方案，只在无 DATABASE_URL 时）
  try {
    console.log('[DB] Using PGlite (local dev)');
    const { PGlite } = require('@electric-sql/pglite');
    const { drizzle } = require('drizzle-orm/pglite');
    const pgClient = new PGlite(process.env.PGLITE_DATA_DIR || join(process.cwd(), 'data'));
    return drizzle(pgClient);
  } catch (err: any) {
    console.error('[DB] PGlite init failed:', err.message);
    throw new Error('DATABASE_URL is not set and PGlite failed. Please add PostgreSQL in Railway.');
  }
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
