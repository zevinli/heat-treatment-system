const BASE_URL = process.env.CORE_E2E_BASE_URL || 'http://127.0.0.1:3100';

type RequestOptions = {
  method?: string;
  token?: string;
  orgCode?: string;
  body?: unknown;
};

async function request(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.orgCode) headers['X-Organization-Code'] = options.orgCode;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: response.status, data };
}

function expectStatus<T extends { status: number; data: any }>(result: T, status: number): T {
  if (result.status !== status) {
    throw new Error(`Expected HTTP ${status}, got ${result.status}: ${JSON.stringify(result.data)}`);
  }
  return result;
}

describe('生产接口核心流程与多租户隔离', () => {
  it('完成注册、组织、收发货、对账并阻止跨租户和平台越权', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const password = 'E2eAuditPass123';
    const userA = `e2e_a_${suffix}`;
    const userB = `e2e_b_${suffix}`;
    const orgA = `e2e-a-${suffix}`.toLowerCase();
    const orgB = `e2e-b-${suffix}`.toLowerCase();

    expectStatus(await request('/api/auth/register', {
      method: 'POST', body: { username: userA, password, name: '租户甲管理员' },
    }), 201);
    expectStatus(await request('/api/auth/register', {
      method: 'POST', body: { username: userB, password, name: '租户乙管理员' },
    }), 201);

    const loginA = expectStatus(await request('/api/auth/login', {
      method: 'POST', body: { username: userA, password, deviceName: 'e2e' },
    }), 201).data;
    const loginB = expectStatus(await request('/api/auth/login', {
      method: 'POST', body: { username: userB, password, deviceName: 'e2e' },
    }), 201).data;
    expect(loginA.token).toEqual(expect.any(String));
    expect(loginB.token).toEqual(expect.any(String));

    const createdOrgA = expectStatus(await request('/api/tenant/organizations', {
      method: 'POST', token: loginA.token, body: { code: orgA, name: '接口审查甲企业' },
    }), 201).data;
    const createdOrgB = expectStatus(await request('/api/tenant/organizations', {
      method: 'POST', token: loginB.token, body: { code: orgB, name: '接口审查乙企业' },
    }), 201).data;

    const initialFeishu = expectStatus(await request('/api/integration/feishu/current/tables', {
      token: loginA.token, orgCode: orgA,
    }), 200).data;
    expect(initialFeishu).toMatchObject({ configured: false, orgCode: orgA, tables: {} });
    expectStatus(await request(`/api/integration/feishu/org/${orgB}/config`, {
      token: loginA.token, orgCode: orgA,
    }), 403);

    // 组织管理员只是租户管理员，不能读取平台全局账号或全部组织。
    expectStatus(await request('/api/auth/users', { token: loginA.token }), 403);
    expectStatus(await request('/api/tenant/organizations', { token: loginA.token }), 403);

    // 模拟工作台首开并发加载，租户数据库只能初始化/建连一次且所有请求都应成功。
    const concurrentTenantReads = await Promise.all([
      '/api/customers?page=1&pageSize=10',
      '/api/products?page=1&pageSize=10',
      '/api/inbound?page=1&pageSize=10',
      '/api/outbound?page=1&pageSize=10',
      '/api/reconciliations?page=1&pageSize=10',
      '/api/inventory/summary',
    ].map(path => request(path, { token: loginB.token, orgCode: orgB })));
    concurrentTenantReads.forEach(result => expectStatus(result, 200));

    const customer = expectStatus(await request('/api/customers', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: { code: `C-${suffix}`, name: '接口隔离客户', status: 'active' },
    }), 201).data;
    expectStatus(await request('/api/customers', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: { code: customer.code, name: '重复编码客户', status: 'active' },
    }), 409);
    const product = expectStatus(await request('/api/products', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        code: `P-${suffix}`, name: '接口隔离产品', customerCode: customer.code,
        customerName: customer.name, unit: '件', unitPrice: 10,
        warningThreshold: 5, status: 'complete',
      },
    }), 201).data;

    const inbound = expectStatus(await request('/api/inbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code,
        inboundDate: '2026-08-11', creator: '接口制单人', totalAmount: 100,
        totalQuantity: 10, totalWeight: 0,
        details: [{
          productId: product.id, productName: product.name, unit: '件', unitPrice: 10,
          quantity: 10, weight: 0, amount: 100, inboundType: 'normal',
        }],
      },
    }), 201).data.data;
    expect(inbound.totalQuantity).toBe(10);

    // 边界失败必须保持事务原子性：超库存出库被拒绝，库存仍是 10。
    expectStatus(await request('/api/outbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code,
        outboundDate: '2026-08-11', creator: '接口制单人', totalAmount: 110,
        totalQuantity: 11, totalWeight: 0,
        details: [{
          productId: product.id, productName: product.name, unit: '件', unitPrice: 10,
          quantity: 11, weight: 0, amount: 110,
        }],
      },
    }), 400);
    const stockAfterRejectedOutbound = expectStatus(await request('/api/inventory/summary', {
      token: loginA.token, orgCode: orgA,
    }), 200).data.items.find((item: any) => item.id === product.id);
    expect(stockAfterRejectedOutbound.stock).toBe(10);

    const outbound = expectStatus(await request('/api/outbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code,
        outboundDate: '2026-08-11', creator: '接口制单人', totalAmount: 40,
        totalQuantity: 4, totalWeight: 0,
        details: [{
          productId: product.id, productName: product.name, unit: '件', unitPrice: 10,
          quantity: 4, weight: 0, amount: 40,
        }],
      },
    }), 201).data;
    expect(outbound.totalQuantity).toBe(4);

    const inventory = expectStatus(await request('/api/inventory/summary', {
      token: loginA.token, orgCode: orgA,
    }), 200).data;
    const inventoryItem = inventory.items.find((item: any) => item.id === product.id);
    expect(inventoryItem.stock).toBe(6);

    const reconciliation = expectStatus(await request('/api/reconciliations', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        reconciliationNo: '', customerId: customer.id, customerName: customer.name,
        customerCode: customer.code, month: '2026-08', outboundOrderIds: [outbound.id],
      },
    }), 201).data;
    expect(reconciliation.status).toBe('confirmed');
    expectStatus(await request(`/api/reconciliations/${reconciliation.id}/audit`, {
      method: 'PUT', token: loginA.token, orgCode: orgA, body: { auditor: '接口审核人' },
    }), 200);
    expectStatus(await request(`/api/reconciliations/${reconciliation.id}/invoice`, {
      method: 'PUT', token: loginA.token, orgCode: orgA, body: { amount: 40 },
    }), 200);
    const partialPaid = expectStatus(await request(`/api/reconciliations/${reconciliation.id}/receipt`, {
      method: 'PUT', token: loginA.token, orgCode: orgA, body: { amount: 20 },
    }), 200).data;
    expect(partialPaid.status).toBe('partial_paid');
    expect(partialPaid.unreceivedAmount).toBe(20);
    expectStatus(await request(`/api/reconciliations/${reconciliation.id}/receipt`, {
      method: 'PUT', token: loginA.token, orgCode: orgA, body: { amount: 21 },
    }), 400);

    // 业务先保存到租户数据库，再进入该租户自己的可靠飞书队列；未连接飞书也不丢任务。
    const syncJobs = expectStatus(await request('/api/integration/feishu/current/jobs', {
      token: loginA.token, orgCode: orgA,
    }), 200).data.items;
    expect(syncJobs.map((job: any) => job.topic)).toEqual(expect.arrayContaining(['customer', 'inbound', 'outbound', 'reconciliation']));

    // 物理隔离：乙组织看不到甲组织创建的客户；甲用户也不能借请求头访问乙组织。
    const orgBCustomers = expectStatus(await request('/api/customers?page=1&pageSize=100', {
      token: loginB.token, orgCode: orgB,
    }), 200).data;
    expect(orgBCustomers.items).toHaveLength(0);
    expectStatus(await request('/api/customers?page=1&pageSize=100', {
      token: loginA.token, orgCode: orgB,
    }), 403);

    // 邀请加入后，业务角色按组织生效，且成员姓名目录可供单据展示使用。
    const invite = expectStatus(await request(`/api/tenant/organizations/${createdOrgA.id}/invite-codes`, {
      method: 'POST', token: loginA.token,
      body: { role: 'member', businessRole: 'operator', maxUses: 1, expiresDays: 1 },
    }), 201).data;
    expectStatus(await request('/api/tenant/join', {
      method: 'POST', token: loginB.token, body: { inviteCode: invite.inviteCode },
    }), 201);
    const permissionsB = expectStatus(await request('/api/permissions/me', {
      token: loginB.token, orgCode: orgA,
    }), 200).data;
    expect(permissionsB.roles).toContain('operator');
    expect(permissionsB.roles).not.toContain('admin');
    expectStatus(await request('/api/reconciliations', {
      method: 'POST', token: loginB.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code,
        month: '2026-08', outboundOrderIds: [outbound.id],
      },
    }), 403);
    const directory = expectStatus(await request(`/api/tenant/organizations/${createdOrgA.id}/member-directory`, {
      token: loginB.token, orgCode: orgA,
    }), 200).data;
    expect(directory.items.map((item: any) => item.name)).toEqual(expect.arrayContaining(['租户甲管理员', '租户乙管理员']));

    expect(createdOrgB.code).toBe(orgB);
  });
});
