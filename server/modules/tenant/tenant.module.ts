import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { TenantDatabaseProvider, TENANT_DATABASE } from '../../common/tenant-database.provider';

@Global()
@Module({
  controllers: [TenantController],
  providers: [
    TenantService,
    TenantConnectionService,
    TenantDatabaseProvider,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  exports: [TenantService, TenantConnectionService, TENANT_DATABASE],
})
export class TenantModule {}
