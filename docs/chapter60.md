

---

## 第60章 测试规范与质量保障

### 60.1 测试策略

#### 测试分层

| 层级 | 范围 | 工具 | 目标 |
|------|------|------|------|
| 单元测试 | Service / 工具函数 | Jest | 核心逻辑正确性 |
| 集成测试 | API 接口 | api_request | 接口可用性 |
| E2E 测试 | 关键业务流程 | Playwright | 用户场景验证 |

### 60.2 单元测试

#### Service 测试

```typescript
describe('InboundService', () => {
  let service: InboundService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 'test-id' }]),
    };

    const module = await Test.createTestingModule({
      providers: [
        InboundService,
        { provide: DRIZZLE_DATABASE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<InboundService>(InboundService);
  });

  describe('create', () => {
    it('should create inbound record', async () => {
      const dto = {
        batchNo: 'BATCH001',
        customerId: 'cust-1',
        items: [{ productId: 'p-1', qty: 10, weight: 100 }],
      };

      const result = await service.create(dto, 'org-1');
      expect(result).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockDb.select.mockReturnValueOnce({
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.create({ customerId: 'not-exist' }, 'org-1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

#### 工具函数测试

```typescript
describe('formatCurrency', () => {
  it('should format positive amount', () => {
    expect(formatCurrency(1234.56)).toBe('¥1,234.56');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('¥0.00');
  });

  it('should format negative amount', () => {
    expect(formatCurrency(-100)).toBe('-¥100.00');
  });
});

describe('formatWeight', () => {
  it('should format kg', () => {
    expect(formatWeight(500)).toBe('500.00 kg');
  });

  it('should format ton when >= 1000', () => {
    expect(formatWeight(1500)).toBe('1.50 吨');
  });
});
```

### 60.3 API 测试

#### 接口测试工具

使用 `api_request` 工具进行接口测试：

```typescript
// GET 测试
api_request({
  url: '/api/customers?page=1&pageSize=20',
  method: 'GET',
});

// POST 测试
api_request({
  url: '/api/customers',
  method: 'POST',
  body: JSON.stringify({
    name: '[API_TEST] 测试客户',
    contactPerson: '测试联系人',
    phone: '13800138000',
  }),
  safe: true,
});

// PUT 测试
api_request({
  url: '/api/customers/test-id',
  method: 'PUT',
  body: JSON.stringify({ name: '[API_TEST] 更新名称' }),
  safe: true,
});

// DELETE 测试
api_request({
  url: '/api/customers/test-id',
  method: 'DELETE',
  safe: true,
});
```

#### 测试数据规范

- 所有测试数据必须包含 `[API_TEST]` 或 `[E2E_TEST]` 标识
- 测试完成后清理创建的测试数据
- 禁止删除预置数据或真实业务数据

### 60.4 E2E 测试

#### 测试场景

```typescript
const E2E_SCENARIOS = {
  // P0 核心流程
  inbound_flow: {
    name: '来货登记完整流程',
    steps: [
      '登录并选择组织',
      '进入来货登记页面',
      '填写入库表单（客户、产品、数量、重量）',
      '保存入库记录',
      '打印标识卡',
      '验证库存增加',
    ],
  },
  outbound_flow: {
    name: '快速发货完整流程',
    steps: [
      '进入快速发货页面',
      '选择入库记录',
      '填写发货信息',
      '保存发货记录',
      '打印送货单',
      '验证库存减少',
    ],
  },
  reconciliation_flow: {
    name: '智能对账完整流程',
    steps: [
      '进入智能对账页面',
      '选择客户和对账期间',
      '生成对账单',
      '审核对账单',
      '打印对账单',
    ],
  },

  // P1 辅助功能
  customer_management: {
    name: '客户管理流程',
    steps: [
      '进入客户列表',
      '创建新客户',
      '编辑客户信息',
      '查看客户详情',
      '删除客户',
    ],
  },
  product_management: {
    name: '产品管理流程',
    steps: [
      '进入产品列表',
      '创建新产品',
      '编辑产品信息',
      '查看产品详情',
      '删除产品',
    ],
  },
  excel_import: {
    name: 'Excel 导入流程',
    steps: [
      '进入来货登记',
      '点击 Excel 导入',
      '上传 Excel 文件',
      '预览导入数据',
      '确认导入',
      '验证数据正确',
    ],
  },

  // P2 系统功能
  template_config: {
    name: '打印模板配置',
    steps: [
      '进入系统设置',
      '编辑打印模板',
      '预览模板效果',
      '保存模板',
    ],
  },
  permission_management: {
    name: '权限管理',
    steps: [
      '进入权限管理',
      '查看角色列表',
      '编辑角色权限',
      '查看角色成员',
    ],
  },
};
```

#### E2E 测试执行

使用 Task 工具派发 E2E 子 agent：

```typescript
task({
  subagent_type: 'E2E',
  prompt: '验证来货登记完整流程：登录 → 选择组织 → 进入来货登记 → 填写表单 → 保存 → 打印标识卡 → 验证库存',
  description: '来货登记E2E测试',
});
```

### 60.5 提交前检查清单

#### 代码检查

- [ ] ESLint 无错误
- [ ] TypeScript 编译无错误
- [ ] 无 `console.log`（前端用 `logger`，后端用 `Logger`）
- [ ] 无 `any` 类型
- [ ] 无硬编码用户 ID / 组织 ID

#### 接口测试

- [ ] 新增接口已用 `api_request` 测试
- [ ] 写操作（POST/PUT/PATCH/DELETE）已测试
- [ ] 测试数据已清理
- [ ] 返回值结构与 `shared/api.interface.ts` 一致

#### 日志检查

- [ ] 客户端 devServer 日志无错误
- [ ] 服务端 devServer 日志无错误
- [ ] 服务端运行时日志无异常

#### 数据一致性

- [ ] 前后端类型定义一致
- [ ] API 路径前后端一致
- [ ] HTTP 方法前后端一致
- [ ] 数据库 Schema 已同步

### 60.6 测试数据管理

#### 测试数据标识

```typescript
const TEST_PREFIX = '[API_TEST]';
const E2E_PREFIX = '[E2E_TEST]';

function createTestCustomer() {
  return {
    name: `${TEST_PREFIX} 测试客户 ${Date.now()}`,
    contactPerson: '测试联系人',
    phone: '13800138000',
  };
}
```

#### 测试数据清理

```typescript
async function cleanupTestData() {
  // 清理 API 测试数据
  const testCustomers = await customerApi.search({ search: TEST_PREFIX });
  for (const c of testCustomers) {
    await customerApi.delete(c.id);
  }

  // 清理 E2E 测试数据
  const e2eCustomers = await customerApi.search({ search: E2E_PREFIX });
  for (const c of e2eCustomers) {
    await customerApi.delete(c.id);
  }
}
```

### 60.7 性能测试

#### 响应时间基准

| 操作 | P50 目标 | P99 目标 |
|------|---------|---------|
| 列表查询 | < 200ms | < 500ms |
| 详情查询 | < 100ms | < 300ms |
| 创建记录 | < 300ms | < 800ms |
| 批量操作 | < 500ms | < 2s |
| 报表统计 | < 1s | < 3s |
| Excel 导入 | < 2s | < 5s |

#### 数据量基准

| 场景 | 数据量 | 目标 |
|------|--------|------|
| 列表分页 | 10万条 | < 500ms |
| 库存查询 | 1万条 | < 200ms |
| 对账生成 | 5万条 | < 3s |
| 统计报表 | 10万条 | < 2s |

### 60.8 质量指标

| 指标 | 目标 | 监控工具 |
|------|------|---------|
| API 可用性 | > 99.9% | miaoda observability |
| API P99 响应 | < 500ms | miaoda observability |
| 前端 FCP | < 1.5s | Lighthouse |
| 前端 LCP | < 2.5s | Lighthouse |
| 错误率 | < 0.1% | miaoda observability |
| 用户满意度 | > 90% | 用户反馈 |
