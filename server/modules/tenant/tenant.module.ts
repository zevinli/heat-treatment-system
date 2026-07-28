import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { TenantMiddleware } from '../../common/middleware/tenant.middleware';

@Module({
  controllers: [TenantController],
  providers: [
    TenantService,
    TenantConnectionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  exports: [TenantService, TenantConnectionService],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
