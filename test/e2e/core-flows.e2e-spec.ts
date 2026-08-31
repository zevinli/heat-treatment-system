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
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
    // 超过 Express 默认 100KB，防止“预览成功但带照片保存 500”回归。
    const photographedPng = `data:image/png;base64,${Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(120 * 1024, 0),
    ]).toString('base64')}`;

    expectStatus(await request('/api/auth/register', {
      method: 'POST', body: { username: 'ab', password, name: '无效账号' },
    }), 400);
    expectStatus(await request('/api/auth/register', {
      method: 'POST', body: { username: `short_${suffix}`, password: '123', name: '无效密码' },
    }), 400);
    expectStatus(await request('/api/auth/register', {
      method: 'POST', body: { username: `long_${suffix}`, password: 'x'.repeat(129), name: '超长密码' },
    }), 400);

    const registeredA = expectStatus(await request('/api/auth/register', {
      method: 'POST', body: { username: userA, password, name: '租户甲管理员' },
    }), 201).data;
    const registeredB = expectStatus(await request('/api/auth/register', {
      method: 'POST', body: { username: userB, password, name: '租户乙管理员' },
    }), 201).data;
    // 注册必须直接返回可用会话，前端才能无缝进入组织选择而不是再次登录。
    expect(registeredA.token).toEqual(expect.any(String));
    expect(registeredB.token).toEqual(expect.any(String));
    expect(registeredA.user.username).toBe(userA);
    expect(registeredB.user.username).toBe(userB);

    // 用户名大小写不应造成“注册成功但登录失败”的体验割裂。
    expectStatus(await request('/api/auth/register', {
      method: 'POST', body: { username: userA.toUpperCase(), password, name: '重复账号' },
    }), 409);

    const loginA = expectStatus(await request('/api/auth/login', {
      method: 'POST', body: { username: userA.toUpperCase(), password, deviceName: 'e2e' },
    }), 201).data;
    const loginB = expectStatus(await request('/api/auth/login', {
      method: 'POST', body: { username: userB, password, deviceName: 'e2e' },
    }), 201).data;
    expect(loginA.token).toEqual(expect.any(String));
    expect(loginB.token).toEqual(expect.any(String));
    expectStatus(await request('/api/auth/me', { token: loginA.token }), 200);
    expectStatus(await request('/api/auth/me/password', {
      method: 'PUT', token: loginA.token, body: { currentPassword: password, newPassword: 'x'.repeat(129) },
    }), 400);
    expectStatus(await request('/api/auth/me', {
      method: 'PUT', token: loginA.token, body: { email: 'not-an-email' },
    }), 400);
    const updatedProfile = expectStatus(await request('/api/auth/me', {
      method: 'PUT', token: loginA.token,
      body: { email: 'audit@example.com', phone: '+86 138-0000-0000', avatar: tinyPng },
    }), 200).data;
    expect(updatedProfile).toMatchObject({ email: 'audit@example.com', phone: '+86 138-0000-0000', avatar: tinyPng });
    expectStatus(await request('/api/auth/me', {
      method: 'PUT', token: loginA.token, body: { avatar: 'javascript:alert(1)' },
    }), 400);
    expectStatus(await request('/api/auth/me', {
      method: 'PUT', token: loginA.token,
      body: { avatar: 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIi8+' },
    }), 400);
    expectStatus(await request('/api/voice/parse', {
      method: 'POST', body: { text: '入库齿轮十件，单价二十五元' },
    }), 401);
    expectStatus(await request('/api/auth/login', {
      method: 'POST', body: { username: userA, password: 'WrongPassword123' },
    }), 401);

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
    expectStatus(await request('/api/customers?page=1&pageSize=10', { token: loginA.token }), 401);
    const product = expectStatus(await request('/api/products', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        code: `P-${suffix}`, name: '接口隔离产品', customerCode: customer.code,
        customerName: customer.name, unit: '件', unitPrice: 10,
        warningThreshold: 5, status: 'complete',
      },
    }), 201).data;

    // 错误筛选条件必须给出明确 400，不能静默退化为“全部数据”或触发数据库 500。
    for (const path of [
      '/api/inbound?status=unknown',
      '/api/outbound?status=unknown',
      '/api/inbound?startDate=2026-02-30',
      '/api/outbound?endDate=2026-02-30',
      '/api/inventory/summary?minStock=abc',
      '/api/inventory/records?changeType=unknown',
      '/api/inventory/records?startDate=2026-02-30',
      '/api/reconciliations?status=unknown',
      '/api/reconciliations?month=2026-13',
    ]) {
      expectStatus(await request(path, { token: loginA.token, orgCode: orgA }), 400);
    }

    const kgProduct = expectStatus(await request('/api/products', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        code: `PKG-${suffix}`, name: '接口重量产品', customerCode: customer.code,
        customerName: customer.name, unit: 'kg', unitPrice: 6,
        warningThreshold: 5, status: 'complete',
      },
    }), 201).data;

    const voice = expectStatus(await request('/api/voice/parse', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: { text: '来货轴套两百件，单价三十元一件，三十公斤，淬火处理', context: 'inbound' },
    }), 201).data;
    expect(voice).toMatchObject({
      success: true,
      data: { productName: '轴套', quantity: 200, weight: 30, unit: '件', unitPrice: 30, process: '淬火' },
    });

    const invalidInboundBase = {
      customerId: customer.id, customerName: customer.name, customerCode: customer.code,
      inboundDate: '2026-08-11', creator: '接口制单人', totalAmount: 0,
      totalQuantity: 1, totalWeight: 0,
    };
    expectStatus(await request('/api/inbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        ...invalidInboundBase,
        inboundDate: 'not-a-date',
        details: [{ productId: product.id, productName: product.name, unit: '件', unitPrice: 10, quantity: 1, weight: 0, amount: 10 }],
      },
    }), 400);
    expectStatus(await request('/api/inbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        ...invalidInboundBase,
        details: [{ productId: product.id, productName: product.name, unit: '件', unitPrice: 10, quantity: 1.5, weight: 0, amount: 15 }],
      },
    }), 400);
    expectStatus(await request('/api/inbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        ...invalidInboundBase,
        details: [{ productId: kgProduct.id, productName: kgProduct.name, unit: 'kg', unitPrice: 6, quantity: 1, weight: 0, amount: 0 }],
      },
    }), 400);
    expectStatus(await request('/api/inbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        ...invalidInboundBase,
        details: [{ productId: product.id, productName: product.name, unit: '件', unitPrice: 10, quantity: 1, weight: 0, amount: 10, attachments: [tinyPng, tinyPng, tinyPng, tinyPng] }],
      },
    }), 400);
    expectStatus(await request('/api/inbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        ...invalidInboundBase,
        details: [{ productId: product.id, productName: product.name, unit: '件', unitPrice: 10, quantity: 1, weight: 0, amount: 10, attachments: ['data:text/plain;base64,SGVsbG8='] }],
      },
    }), 400);
    expectStatus(await request('/api/inbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        ...invalidInboundBase,
        details: [
          { productId: product.id, productName: product.name, unit: '件', unitPrice: 10, quantity: 1, weight: 0, amount: 10 },
          { productId: product.id, productName: product.name, unit: '件', unitPrice: 10, quantity: 1, weight: 0, amount: 10 },
        ],
      },
    }), 400);

    const inbound = expectStatus(await request('/api/inbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code,
        inboundDate: '2026-08-11', creator: '接口制单人', totalAmount: 100,
        totalQuantity: 999, totalWeight: 999,
        details: [{
          productId: product.id, productName: product.name, unit: '件', unitPrice: 10,
          quantity: 10, weight: 0, amount: 100, inboundType: 'normal', attachments: [photographedPng],
        }],
      },
    }), 201).data.data;
    expect(inbound.totalQuantity).toBe(10);
    expect(inbound.totalWeight).toBe(0);
    const inboundDetail = expectStatus(await request(`/api/inbound/${inbound.id}`, {
      token: loginA.token, orgCode: orgA,
    }), 200).data;
    expect(inboundDetail.details[0].attachments).toEqual([photographedPng]);

    // 并发入库同一产品不能覆盖彼此库存增量。
    const concurrentProduct = expectStatus(await request('/api/products', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        code: `PCON-${suffix}`, name: '并发入库产品', customerCode: customer.code,
        customerName: customer.name, unit: '件', unitPrice: 2, status: 'complete',
      },
    }), 201).data;
    const concurrentInboundBody = (quantity: number) => ({
      customerId: customer.id, customerName: customer.name, customerCode: customer.code,
      inboundDate: '2026-08-10',
      details: [{ productId: concurrentProduct.id, productName: concurrentProduct.name, quantity, weight: 0 }],
    });
    const concurrentInbounds = await Promise.all([
      request('/api/inbound', { method: 'POST', token: loginA.token, orgCode: orgA, body: concurrentInboundBody(3) }),
      request('/api/inbound', { method: 'POST', token: loginA.token, orgCode: orgA, body: concurrentInboundBody(4) }),
    ]);
    concurrentInbounds.forEach(result => expectStatus(result, 201));
    const concurrentStock = expectStatus(await request('/api/inventory/summary?pageSize=100', {
      token: loginA.token, orgCode: orgA,
    }), 200).data.items.find((item: any) => item.id === concurrentProduct.id);
    expect(concurrentStock.stock).toBe(7);

    // 批次日期驱动 FIFO，并且后端实际批次必须返回给打印端。
    const fifoProduct = expectStatus(await request('/api/products', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        code: `PFIFO-${suffix}`, name: '先进先出产品', customerCode: customer.code,
        customerName: customer.name, unit: '件', unitPrice: 3, status: 'complete',
      },
    }), 201).data;
    for (const [date, batchNo] of [['2026-08-01', `FIFO-OLD-${suffix}`], ['2026-08-09', `FIFO-NEW-${suffix}`]]) {
      expectStatus(await request('/api/inbound', {
        method: 'POST', token: loginA.token, orgCode: orgA,
        body: {
          customerId: customer.id, customerName: customer.name, customerCode: customer.code, inboundDate: date,
          details: [{ productId: fifoProduct.id, productName: fifoProduct.name, quantity: 5, weight: 0, batchNo: `  ${batchNo}  ` }],
        },
      }), 201);
    }
    expectStatus(await request('/api/inbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code, inboundDate: '2026-08-10',
        details: [{ productId: fifoProduct.id, productName: fifoProduct.name, quantity: 1, weight: 0, batchNo: `FIFO-OLD-${suffix}` }],
      },
    }), 409);
    const fifoOutbound = expectStatus(await request('/api/outbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code, outboundDate: '2026-08-11',
        details: [{ productId: fifoProduct.id, productName: fifoProduct.name, quantity: 4, weight: 0 }],
      },
    }), 201).data;
    expect(fifoOutbound.details[0].batchNo).toBe(`FIFO-OLD-${suffix}`);
    expect(new Date(fifoOutbound.details[0].inboundDate).toISOString().slice(0, 10)).toBe('2026-08-01');

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
    expectStatus(await request('/api/outbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code,
        outboundDate: '2026-08-11', creator: '接口制单人',
        details: [{ productId: product.id, productName: product.name, quantity: 1.5, weight: 0 }],
      },
    }), 400);
    expectStatus(await request('/api/outbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code,
        outboundDate: 'not-a-date', creator: '接口制单人',
        details: [{ productId: product.id, productName: product.name, quantity: 1, weight: 0 }],
      },
    }), 400);
    expectStatus(await request('/api/outbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code,
        outboundDate: '2026-08-11', creator: '接口制单人',
        details: [{ productId: kgProduct.id, productName: kgProduct.name, quantity: 1, weight: 0 }],
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
          quantity: 4, weight: 0, amount: 40, closeOrder: true,
        }],
      },
    }), 201).data;
    expect(outbound.totalQuantity).toBe(4);

    const inventory = expectStatus(await request('/api/inventory/summary', {
      token: loginA.token, orgCode: orgA,
    }), 200).data;
    const inventoryItem = inventory.items.find((item: any) => item.id === product.id);
    // “本行完成”只标记业务结束，不得静默清零剩余库存。
    expect(inventoryItem.stock).toBe(6);

    const reconciliation = expectStatus(await request('/api/reconciliations', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        reconciliationNo: '', customerId: customer.id, customerName: customer.name,
        customerCode: customer.code, month: '2026-08', outboundOrderIds: [outbound.id],
      },
    }), 201).data;
    expect(reconciliation.status).toBe('confirmed');
    const audited = expectStatus(await request(`/api/reconciliations/${reconciliation.id}/audit`, {
      method: 'PUT', token: loginA.token, orgCode: orgA, body: { auditor: '接口审核人' },
    }), 200).data;
    expect(audited.auditor).toBe(loginA.user.id);
    const invoiced = expectStatus(await request(`/api/reconciliations/${reconciliation.id}/invoice`, {
      method: 'PUT', token: loginA.token, orgCode: orgA, body: { amount: 40 },
    }), 200).data;
    expect(invoiced.invoiceRecords[0].operator).toBe(loginA.user.id);
    const partialPaid = expectStatus(await request(`/api/reconciliations/${reconciliation.id}/receipt`, {
      method: 'PUT', token: loginA.token, orgCode: orgA, body: { amount: 20 },
    }), 200).data;
    expect(partialPaid.status).toBe('partial_paid');
    expect(partialPaid.unreceivedAmount).toBe(20);
    expect(partialPaid.receiptRecords[0].operator).toBe(loginA.user.id);
    expectStatus(await request(`/api/reconciliations/${reconciliation.id}/receipt`, {
      method: 'PUT', token: loginA.token, orgCode: orgA, body: { amount: 21 },
    }), 400);
    expectStatus(await request(`/api/reconciliations/${reconciliation.id}/invoice`, {
      method: 'PUT', token: loginA.token, orgCode: orgA, body: { amount: 1 },
    }), 400);

    // 报表的五类读取与每日汇总均基于真实收发货、对账数据执行，不只验证空页面。
    for (const path of [
      '/api/statistics/overview?startDate=2026-08-01&endDate=2026-08-31',
      '/api/statistics/customers?startDate=2026-08-01&endDate=2026-08-31&limit=20',
      '/api/statistics/products?startDate=2026-08-01&endDate=2026-08-31&limit=20',
      '/api/statistics/inventory',
      '/api/statistics/finance?startDate=2026-08-01&endDate=2026-08-31',
    ]) {
      expectStatus(await request(path, { token: loginA.token, orgCode: orgA }), 200);
    }
    expectStatus(await request('/api/statistics/generate', {
      method: 'POST', token: loginA.token, orgCode: orgA, body: { date: '2026-08-11' },
    }), 201);
    expectStatus(await request('/api/statistics/generate', {
      method: 'POST', token: loginA.token, orgCode: orgA, body: { date: 'not-a-date' },
    }), 400);

    const reconciledUndoCheck = expectStatus(await request(`/api/undo/outbound/${outbound.id}/can-undo`, {
      token: loginA.token, orgCode: orgA,
    }), 200).data;
    expect(reconciledUndoCheck).toMatchObject({ canUndo: false });
    expect(String(reconciledUndoCheck.reason)).toContain('对账');

    // 撤销采用独立产品验证：短原因被拒绝、恢复库存、重复撤销幂等阻止、再撤销入库归零。
    const undoProduct = expectStatus(await request('/api/products', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        code: `PUNDO-${suffix}`, name: '接口撤销产品', customerCode: customer.code,
        customerName: customer.name, unit: '件', unitPrice: 8, warningThreshold: 1, status: 'complete',
      },
    }), 201).data;
    const undoInbound = expectStatus(await request('/api/inbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code,
        inboundDate: '2026-08-12', creator: '接口制单人',
        details: [{ productId: undoProduct.id, productName: undoProduct.name, quantity: 7, weight: 0 }],
      },
    }), 201).data.data;
    const undoOutbound = expectStatus(await request('/api/outbound', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: {
        customerId: customer.id, customerName: customer.name, customerCode: customer.code,
        outboundDate: '2026-08-12', creator: '接口制单人',
        details: [{ productId: undoProduct.id, productName: undoProduct.name, quantity: 2, weight: 0 }],
      },
    }), 201).data;
    const outboundUndoCheck = expectStatus(await request(`/api/undo/outbound/${undoOutbound.id}/can-undo`, {
      token: loginA.token, orgCode: orgA,
    }), 200).data;
    expect(outboundUndoCheck).toMatchObject({ canUndo: true });
    expectStatus(await request(`/api/undo/outbound/${undoOutbound.id}`, {
      method: 'POST', token: loginA.token, orgCode: orgA, body: { reason: '短' },
    }), 400);
    expectStatus(await request(`/api/undo/outbound/${undoOutbound.id}`, {
      method: 'POST', token: loginA.token, orgCode: orgA, body: { reason: '端到端撤销出库测试' },
    }), 201);
    expectStatus(await request(`/api/undo/outbound/${undoOutbound.id}`, {
      method: 'POST', token: loginA.token, orgCode: orgA, body: { reason: '不允许重复撤销测试' },
    }), 400);
    let undoStock = expectStatus(await request('/api/inventory/summary', {
      token: loginA.token, orgCode: orgA,
    }), 200).data.items.find((item: any) => item.id === undoProduct.id);
    expect(undoStock.stock).toBe(7);
    expect(expectStatus(await request(`/api/undo/inbound/${undoInbound.id}/can-undo`, {
      token: loginA.token, orgCode: orgA,
    }), 200).data.canUndo).toBe(true);
    expectStatus(await request(`/api/undo/inbound/${undoInbound.id}`, {
      method: 'POST', token: loginA.token, orgCode: orgA, body: { reason: '端到端撤销入库测试' },
    }), 201);
    undoStock = expectStatus(await request('/api/inventory/summary', {
      token: loginA.token, orgCode: orgA,
    }), 200).data.items.find((item: any) => item.id === undoProduct.id);
    expect(undoStock.stock).toBe(0);

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
    expectStatus(await request('/api/inventory/increase', {
      method: 'POST', token: loginB.token, orgCode: orgA,
      body: { productId: product.id, quantity: 100, referenceNo: `BYPASS-${suffix}` },
    }), 403);
    expectStatus(await request('/api/inventory/decrease', {
      method: 'POST', token: loginA.token, orgCode: orgA,
      body: { productId: product.id, quantity: -1, referenceNo: `NEG-${suffix}` },
    }), 400);
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
