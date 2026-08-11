import { BitableSyncService } from './bitable-sync.service';
import { FEISHU_FIELD_TYPES } from './constants';

describe('BitableSyncService', () => {
  const config = {
    orgCode: 'tenant-a',
    bitableAppToken: 'app-token-a',
    baseUrl: 'https://example.feishu.cn/base/app-token-a',
    isActive: true,
    tableInbound: 'tbl-inbound',
    tableOutbound: 'tbl-outbound',
    tableInventory: 'tbl-inventory',
    tableCustomer: 'tbl-customer',
    tableReconciliation: 'tbl-reconciliation',
    tableQuality: 'tbl-quality',
    tableProcess: 'tbl-process',
  };

  function setup(configOverrides: Partial<typeof config> = {}) {
    const client = {
      get: jest.fn().mockResolvedValue({ data: { code: 0, data: { items: [] } } }),
      post: jest.fn().mockResolvedValue({ data: { code: 0, data: { record: { record_id: 'rec-new' } } } }),
      put: jest.fn().mockResolvedValue({ data: { code: 0 } }),
      delete: jest.fn().mockResolvedValue({ data: { code: 0 } }),
    };
    const auth = {
      isConfigured: () => true,
      getAuthorizedClient: jest.fn().mockResolvedValue(client),
    };
    const tenantConfig = { getConfig: jest.fn().mockResolvedValue({ ...config, ...configOverrides }) };
    return {
      client,
      service: new BitableSyncService(auth as any, tenantConfig as any),
    };
  }

  test('inbound upsert matches order and product and lets axios encode formula once', async () => {
    const { service, client } = setup();
    const result = await service.syncInbound({
      orderId: 'LH/中文"1',
      customerName: '客户甲',
      productName: '齿轮 A',
      quantity: 10,
      weight: 20,
      createdAt: '2026-08-10T08:00:00.000Z',
      createdBy: '张三',
      status: '待处理',
    }, 'tenant-a');

    expect(result).toMatchObject({ action: 'create', affected: 1 });
    const [, requestConfig] = client.get.mock.calls[0];
    expect(requestConfig.params.filter).toContain('CurrentValue.[来货单号] = "LH/中文\\"1"');
    expect(requestConfig.params.filter).toContain('CurrentValue.[产品名称] = "齿轮 A"');
    expect(requestConfig.params.filter).not.toContain('%25');
    expect(client.post).toHaveBeenCalledTimes(1);
  });

  test('existing outbound line updates instead of overwriting another product line', async () => {
    const { service, client } = setup();
    client.get.mockResolvedValueOnce({ data: { code: 0, data: { items: [{ record_id: 'rec-existing' }] } } });
    const result = await service.syncOutbound({
      orderId: 'CK001', customerName: '客户甲', productName: '轴套',
      quantity: 2, weight: 5, batchNo: 'B001', createdAt: '2026-08-10', status: '待对账',
    }, 'tenant-a');

    expect(result).toMatchObject({ action: 'update', affected: 1 });
    expect(client.put).toHaveBeenCalledWith(expect.stringContaining('/rec-existing'), expect.any(Object));
    expect(client.post).not.toHaveBeenCalled();
    expect(client.get.mock.calls[0][1].params.filter).toContain('CurrentValue.[批次号] = "B001"');
  });

  test('inbound photos upload to the same Bitable before attachment tokens are written', async () => {
    const { service, client } = setup();
    client.post
      .mockResolvedValueOnce({ data: { code: 0, data: { file_token: 'file-token-1' } } })
      .mockResolvedValueOnce({ data: { code: 0, data: { record: { record_id: 'rec-new' } } } });
    const result = await service.syncInbound({
      orderId: 'LH001', customerName: '客户甲', productName: '齿轮', quantity: 1,
      weight: 1, createdAt: '2026-08-10', createdBy: '张三', status: '已入库',
      attachments: ['data:image/png;base64,aGVsbG8='],
    }, 'tenant-a');

    expect(result).toMatchObject({ action: 'create', affected: 1 });
    expect(client.post.mock.calls[0][0]).toContain('/drive/v1/medias/upload_all');
    expect(client.post.mock.calls[0][1]).toBeInstanceOf(FormData);
    expect(client.post.mock.calls[1][1].fields['附件']).toEqual([{ file_token: 'file-token-1' }]);
  });

  test('query failure never falls through to create a duplicate record', async () => {
    const { service, client } = setup();
    client.get.mockResolvedValueOnce({ data: { code: 1254000, msg: 'invalid filter' } });
    const result = await service.syncInbound({
      orderId: 'LH001', customerName: '客户甲', productName: '齿轮', quantity: 1,
      weight: 1, createdAt: '2026-08-10', createdBy: '张三', status: '待处理',
    }, 'tenant-a');

    expect(result.affected).toBe(0);
    expect(result.error).toContain('查询飞书记录失败');
    expect(client.post).not.toHaveBeenCalled();
  });

  test('a malformed create response is reported as failed rather than affected=1', async () => {
    const { service, client } = setup();
    client.post.mockResolvedValueOnce({ data: { code: 0, data: {} } });
    const result = await service.syncCustomer({
      code: 'KH001', name: '客户甲', contact: '', phone: '', address: '', totalInbound: 0,
      totalOutbound: 0, paymentRate: 0, lastTradeDate: '',
    }, 'tenant-a');
    expect(result).toMatchObject({ action: 'skip', affected: 0 });
    expect(result.error).toContain('record_id');
  });

  test('reconciliation idempotency uses the immutable reconciliation number', async () => {
    const { service, client } = setup();
    await service.syncReconciliation({
      reconciliationNo: 'RZ001', date: '2026-08', customerName: '客户甲', outboundAmount: 100,
      invoicedAmount: 80, receivedAmount: 30, paymentStatus: '部分回款',
    }, 'tenant-a');
    const filter = client.get.mock.calls[0][1].params.filter as string;
    expect(filter).toBe('CurrentValue.[对账单号] = "RZ001"');
  });

  test('table validation reports field type mismatches, not only missing names', async () => {
    const { service, client } = setup({
      tableOutbound: '', tableInventory: '', tableCustomer: '',
      tableReconciliation: '', tableQuality: '', tableProcess: '',
    });
    client.get.mockResolvedValueOnce({
      data: { code: 0, data: { items: [
        { field_name: '来货单号', type: 1 },
        { field_name: '来货数量', type: 1 },
      ] } },
    });

    const result = await service.validateTenantConfig('tenant-a');
    expect(result.valid).toBe(false);
    const inbound = (result.tables as any).inbound;
    expect(inbound.missingFields).toContain('客户名称');
    expect(inbound.typeMismatches).toContain('来货数量（应为类型2，当前为1）');
  });

  test('field repair only batch-creates missing fields and never deletes existing data', async () => {
    const { service, client } = setup({
      tableOutbound: '', tableInventory: '', tableCustomer: '',
      tableReconciliation: '', tableQuality: '', tableProcess: '',
    });
    client.get.mockResolvedValue({
      data: { code: 0, data: { items: [{ field_name: '来货单号', type: 1 }] } },
    });

    const result = await service.repairTenantFields('tenant-a');
    expect(result.addedCount).toBe(8);
    expect(client.post).toHaveBeenCalledWith(
      expect.stringContaining('/tbl-inbound/fields/batch_create'),
      expect.objectContaining({ fields: expect.arrayContaining([
        expect.objectContaining({ field_name: '来货数量', type: 2, ui_type: 'Number' }),
        expect.objectContaining({ field_name: '附件', type: 17, ui_type: 'Attachment' }),
      ]) }),
    );
    expect(client.delete).not.toHaveBeenCalled();
  });

  test('a pasted Bitable link discovers numbered core and optional tables automatically', async () => {
    const { service, client } = setup();
    client.get.mockResolvedValueOnce({ data: { code: 0, data: { items: [
      { table_id: 'tbl-in', name: '01 来货登记' },
      { table_id: 'tbl-out', name: '02 发货记录' },
      { table_id: 'tbl-stock', name: '03 库存快照' },
      { table_id: 'tbl-customer', name: '04 客户总览' },
      { table_id: 'tbl-recon', name: '05 对账与回款' },
      { table_id: 'tbl-quality', name: '06 质检记录' },
      { table_id: 'tbl-process', name: '07 工艺参数' },
    ] } } });

    const result = await service.discoverTables('https://tenant.feishu.cn/base/app-token-a?table=tbl-in');
    expect(result.appToken).toBe('app-token-a');
    expect(result.baseUrl).toBe('https://tenant.feishu.cn/base/app-token-a');
    expect(result.tables).toEqual({
      inbound: 'tbl-in', outbound: 'tbl-out', inventory: 'tbl-stock',
      customer: 'tbl-customer', reconciliation: 'tbl-recon',
      quality: 'tbl-quality', process: 'tbl-process',
    });
    expect(result.missing).toEqual([]);
  });

  test('optional quality and process tables do not block core table validation', async () => {
    const { service, client } = setup({ tableQuality: '', tableProcess: '' });
    client.get.mockImplementation((url: string) => {
      const fieldsByTable: Record<string, Record<string, number>> = {
        'tbl-inbound': FEISHU_FIELD_TYPES.inbound,
        'tbl-outbound': FEISHU_FIELD_TYPES.outbound,
        'tbl-inventory': FEISHU_FIELD_TYPES.inventory,
        'tbl-customer': FEISHU_FIELD_TYPES.customer,
        'tbl-reconciliation': FEISHU_FIELD_TYPES.reconciliation,
      };
      const tableId = Object.keys(fieldsByTable).find(id => url.includes(id))!;
      return Promise.resolve({ data: { code: 0, data: { items: Object.entries(fieldsByTable[tableId]).map(([field_name, type]) => ({ field_name, type })) } } });
    });

    const result = await service.validateTenantConfig('tenant-a');
    expect(result.valid).toBe(true);
    expect(result.tables).not.toHaveProperty('quality');
    expect(result.tables).not.toHaveProperty('process');
  });
});
