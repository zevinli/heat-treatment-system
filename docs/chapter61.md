

---

## 第61章 API 层完整接口清单

### 61.1 接口分类总览

| 模块 | 前缀 | 接口数 | 说明 |
|------|------|--------|------|
| 客户管理 | `/api/customers` | 7 | CRUD + 搜索 + 历史 |
| 产品管理 | `/api/products` | 7 | CRUD + 搜索 + 记录 |
| 入库管理 | `/api/inbound` | 8 | CRUD + 导入 + 打印 |
| 出库管理 | `/api/outbound` | 8 | CRUD + 打印 + 关单 |
| 库存管理 | `/api/inventory` | 6 | 列表 + 调整 + 历史 |
| 对账管理 | `/api/reconciliation` | 8 | CRUD + 审批 + 打印 |
| 统计报表 | `/api/statistics` | 6 | 各维度统计 |
| 组织管理 | `/api/organizations` | 7 | CRUD + 成员 |
| 权限管理 | `/api/rbac` | 9 | 角色 + 权限 + 成员 |
| 打印模板 | `/api/print-templates` | 7 | CRUD + 预览 |
| 工作台 | `/api/dashboard` | 4 | 概览 + 待办 + 图表 |
| 健康检查 | `/api/health` | 1 | 存活检查 |
| **合计** | | **78** | |

### 61.2 客户管理接口

```
GET    /api/customers                    列表（分页+搜索+筛选）
GET    /api/customers/:id                详情
POST   /api/customers                    创建
PUT    /api/customers/:id                更新
DELETE /api/customers/:id                删除
GET    /api/customers/search             搜索（下拉列表）
GET    /api/customers/:id/history        历史记录
```

### 61.3 产品管理接口

```
GET    /api/products                     列表（分页+搜索+筛选）
GET    /api/products/:id                  详情（含库存+记录）
POST   /api/products                      创建
PUT    /api/products/:id                  更新
DELETE /api/products/:id                  删除
GET    /api/products/search               搜索（下拉列表）
GET    /api/products/:id/records          收发货记录
```

### 61.4 入库管理接口

```
GET    /api/inbound                       列表（分页+搜索+筛选）
GET    /api/inbound/:id                   详情
POST   /api/inbound                       创建
PUT    /api/inbound/:id                   更新
DELETE /api/inbound/:id                   删除
POST   /api/inbound/import                Excel 批量导入
GET    /api/inbound/:id/print             打印标识卡
PATCH  /api/inbound/:id/status            状态变更
```

### 61.5 出库管理接口

```
GET    /api/outbound                      列表（分页+搜索+筛选）
GET    /api/outbound/:id                  详情
POST   /api/outbound                      创建
PUT    /api/outbound/:id                  更新
DELETE /api/outbound/:id                  删除
GET    /api/outbound/:id/print            打印送货单
PATCH  /api/outbound/:id/status           状态变更（发货/完成/取消）
POST   /api/outbound/:id/close            关单平账
```

### 61.6 库存管理接口

```
GET    /api/inventory                     列表（分页+搜索+筛选）
GET    /api/inventory/overview            概览（KPI）
GET    /api/inventory/product/:productId  按产品查询
POST   /api/inventory/adjust              库存调整
GET    /api/inventory/:productId/history  变动历史
GET    /api/inventory/export              导出
```

### 61.7 对账管理接口

```
GET    /api/reconciliation                列表（分页+搜索+筛选）
GET    /api/reconciliation/:id            详情
POST   /api/reconciliation                创建（自动生成）
PUT    /api/reconciliation/:id            更新
DELETE /api/reconciliation/:id            删除
PATCH  /api/reconciliation/:id/status     状态变更（确认/驳回/结清）
GET    /api/reconciliation/:id/print      打印对账单
GET    /api/reconciliation/preview         预览（生成前预览数据）
```

### 61.8 统计报表接口

```
GET    /api/statistics/overview           总览（KPI 卡片）
GET    /api/statistics/inbound            入库统计（按日/周/月）
GET    /api/statistics/outbound           出库统计（按日/周/月）
GET    /api/statistics/inventory          库存统计
GET    /api/statistics/customer           客户统计
GET    /api/statistics/reconciliation     对账统计
```

### 61.9 组织管理接口

```
GET    /api/organizations/my              我的组织列表
GET    /api/organizations/current          当前组织信息
POST   /api/organizations/:code/select     选择组织
POST   /api/organizations                  创建组织
GET    /api/organizations/:id/members      成员列表
POST   /api/organizations/:id/members/invite  邀请成员
DELETE /api/organizations/:id/members/:userId 移除成员
```

### 61.10 权限管理接口

```
GET    /api/rbac/roles                    角色列表
POST   /api/rbac/roles                    创建角色
PUT    /api/rbac/roles/:id                更新角色
DELETE /api/rbac/roles/:id                删除角色
GET    /api/rbac/permissions/tree         权限树
PUT    /api/rbac/roles/:id/permissions     更新角色权限
GET    /api/rbac/roles/:id/members        角色成员列表
POST   /api/rbac/roles/:id/members        添加成员
DELETE /api/rbac/roles/:id/members/:userId 移除成员
POST   /api/rbac/mock                     模拟角色
```

### 61.11 打印模板接口

```
GET    /api/print-templates               模板列表
GET    /api/print-templates/:id           模板详情
POST   /api/print-templates               创建模板
PUT    /api/print-templates/:id           更新模板
DELETE /api/print-templates/:id           删除模板
PATCH  /api/print-templates/:id/toggle    启用/禁用
POST   /api/print-templates/:id/preview   预览模板
```

### 61.12 工作台接口

```
GET    /api/dashboard/overview            概览数据
GET    /api/dashboard/pending             待办事项
GET    /api/dashboard/charts              图表数据
GET    /api/dashboard/recent              最近操作
```

### 61.13 健康检查接口

```
GET    /api/health                        存活检查
```

### 61.14 接口请求/响应规范

#### 统一响应格式

```typescript
// 成功响应
{
  // 直接返回数据，不包裹
  id: "rec_123",
  name: "客户A",
  ...
}

// 分页响应
{
  items: [...],
  total: 100,
  page: 1,
  pageSize: 20,
}

// 游标分页响应
{
  items: [...],
  nextCursor: "cursor_xxx",
  hasMore: true,
}

// 错误响应
{
  success: false,
  code: "NOT_FOUND",
  message: "资源不存在",
  timestamp: "2024-01-15T10:00:00.000Z",
  path: "/api/customers/123",
}
```

#### 请求头

```http
Content-Type: application/json
x-org-code: <组织编码>
Cookie: <认证 Cookie>
```

#### 分页参数

```typescript
// 传统分页
GET /api/customers?page=1&pageSize=20&search=keyword

// 游标分页
GET /api/inbound?cursor=xxx&limit=20
```

### 61.15 接口版本管理

当前所有接口为 v1 版本，不加版本前缀。未来如有 breaking change，将引入 `/api/v2/` 前缀。

### 61.16 OpenAPI 文档

对外开放接口（`/openapi` 前缀）需同步维护 `docs/openapi.json`，包含：
- 接口路径
- 请求/响应 Schema
- 鉴权方式
- 示例数据

```bash
# 查看 OpenAPI 文档
cat docs/openapi.json | jq '.paths | keys'
```
