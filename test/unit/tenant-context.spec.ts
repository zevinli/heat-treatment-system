import { getCurrentTenantContext, tenantAsyncStorage } from '../../server/common/tenant-context.storage';

describe('tenant async context', () => {
  it('keeps concurrent tenant contexts isolated', async () => {
    const readLater = (orgCode: string, delay: number) => tenantAsyncStorage.run(
      { orgCode, orgId: `${orgCode}-id`, db: {} as any },
      async () => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return getCurrentTenantContext()?.orgCode;
      },
    );
    await expect(Promise.all([readLater('tenant-a', 10), readLater('tenant-b', 1)]))
      .resolves.toEqual(['tenant-a', 'tenant-b']);
    expect(getCurrentTenantContext()).toBeUndefined();
  });
});
