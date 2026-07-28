import { INestApplication, Injectable, SetMetadata } from '@nestjs/common';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { join } from 'path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

// ===== configureApp =====
export async function configureApp(app: INestApplication, _options?: { disableSwagger?: boolean }): Promise<void> {
  app.enableCors({ origin: true, credentials: true });
  
  // Serve static files from dist/client (production build)
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

// ===== Create PGlite database instance =====
function createPGliteDb() {
  const pgClient = new PGlite(join(process.cwd(), 'data'));
  const db = drizzle(pgClient);
  return db;
}

// ===== PlatformModule =====
@Global()
@Module({
  providers: [
    { provide: DRIZZLE_DATABASE, useFactory: createPGliteDb },
    CapabilityService,
  ],
  exports: [DRIZZLE_DATABASE, CapabilityService],
})
class PlatformCoreModule {}

export const PlatformModule = {
  forRoot: (): DynamicModule => ({
    module: PlatformCoreModule,
    providers: [
      { provide: DRIZZLE_DATABASE, useFactory: createPGliteDb },
      CapabilityService,
    ],
    exports: [DRIZZLE_DATABASE, CapabilityService],
  }),
};
