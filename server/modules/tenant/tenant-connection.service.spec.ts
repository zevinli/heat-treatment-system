import { TenantConnectionService } from './tenant-connection.service';

describe('TenantConnectionService', () => {
  it('同一租户的并发首请求只创建一次数据库连接', async () => {
    const config = {
      id: '11111111-1111-4111-8111-111111111111',
      code: 'concurrent-tenant',
      dbName: 'db_tenant_concurrent_tenant',
      dbHost: 'db.internal',
      dbPort: 5432,
      dbUser: 'tenant_user',
      dbPassword: 'tenant_password',
    };
    const query = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([config]),
    };
    const masterDb = { select: jest.fn().mockReturnValue(query) };
    const service = new TenantConnectionService(masterDb as any);
    const tenantDb = { marker: 'isolated-db' };
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const createSpy = jest.spyOn(service as any, 'createTenantConnection')
      .mockImplementation(async () => {
        await gate;
        return { db: tenantDb, client: { end: jest.fn() } };
      });

    const requests = Array.from({ length: 8 }, () => service.getTenantDb(config.code, masterDb));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(createSpy).toHaveBeenCalledTimes(1);

    release();
    await expect(Promise.all(requests)).resolves.toEqual(Array(8).fill(tenantDb));
    expect(masterDb.select).toHaveBeenCalledTimes(1);
    expect(service.getCachedConnectionCount()).toBe(1);
  });
});
