import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MiddlewareConsumer } from '@nestjs/common';

import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PlatformModule } from '../_shims/@lark-apaas/fullstack-nestjs-core/index';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OutboundModule } from './modules/outbound/outbound.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { UndoModule } from './modules/undo/undo.module';
import { BatchModule } from './modules/batch/batch.module';
import { InboundModule } from './modules/inbound/inbound.module';
import { PermissionModule } from './modules/permission/permission.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { VoiceModule } from './modules/voice/voice.module';
import { AdminModule } from './modules/admin/admin.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantConnectionService } from './modules/tenant/tenant-connection.service';
import { AuthMiddleware } from './common/middleware/auth.middleware';

@Module({
  imports: [
    // 平台 Module，提供平台能力
    PlatformModule.forRoot(),
    // ====== @route-section: business-modules START ======
    // Place all business modules here.Do NOT add fallback modules here.
    // 租户模块需要最先加载，用于中间件拦截和上下文设置
    TenantModule,
    CustomerModule,
    ProductModule,
    InventoryModule,
    OutboundModule,
    ReconciliationModule,
    UndoModule,
    BatchModule,
    InboundModule,
    PermissionModule,
    StatisticsModule,
    VoiceModule,
    AdminModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    TenantConnectionService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');
  }}
