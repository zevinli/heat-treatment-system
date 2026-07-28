# 热处理收发货管理系统 — 终极完整规格文档

> **版本**: 综合版 V5 — 代码级完整实现规格
> **最后更新**: 2026-07-22
> **文档说明**: 本文档包含本系统的全部实现细节，覆盖每一个文件、每一个函数、每一个类型、每一条SQL语句。开发者拿到本文档后，可仅凭此文档在本地从零完整重建整个系统，无需再阅读源码。全文约13万字。

---

## 目录

- [第1章 产品总览与技术架构](#第1章-产品总览与技术架构)
- [第2章 页面与路由完整定义](#第2章-页面与路由完整定义)
- [第3章 导航与布局系统](#第3章-导航与布局系统)
- [第4章 数据库Schema完整定义](#第4章-数据库schema完整定义)
- [第5章 前后端共享类型定义](#第5章-前后端共享类型定义)
- [第6章 系统配置常量](#第6章-系统配置常量)
- [第7章 后端Common工具与中间件](#第7章-后端common工具与中间件)
- [第8章 后端业务模块（上）](#第8章-后端业务模块上)
- [第9章 后端业务模块（下）](#第9章-后端业务模块下)
- [第10章 后端启动与模块注册](#第10章-后端启动与模块注册)
- [第11章 前端入口与路由守卫](#第11章-前端入口与路由守卫)
- [第12章 前端数据层DataContext](#第12章-前端数据层datacontext)
- [第13章 前端API层](#第13章-前端api层)
- [第14章 前端Hooks与上下文](#第14章-前端hooks与上下文)
- [第15章 前端工具函数与样式系统](#第15章-前端工具函数与样式系统)
- [第16章 前端核心业务页面（上）](#第16章-前端核心业务页面上)
- [第17章 前端核心业务页面（下）](#第17章-前端核心业务页面下)
- [第18章 前端其他页面完整规格](#第18章-前端其他页面完整规格)
- [第19章 多租户架构完整设计](#第19章-多租户架构完整设计)
- [第20章 业务流程与状态机](#第20章-业务流程与状态机)
- [第21章 权限体系完整设计](#第21章-权限体系完整设计)
- [第22章 打印模板系统](#第22章-打印模板系统)
- [第23章 Excel导入导出系统](#第23章-excel导入导出系统)
- [第24章 库存管理与预警系统](#第24章-库存管理与预警系统)
- [第25章 部署与运维](#第25章-部署与运维)
- [第67章 前端主题切换组件系统](#第67章-前端主题切换组件系统)
- [第68章 动画组件库AnimatedComponents完整规格](#第68章-动画组件库animatedcomponents完整规格)
- [第69章 撤销与确认交互组件](#第69章-撤销与确认交互组件)
- [第70章 演示与测试页面规格](#第70章-演示与测试页面规格)
- [第71章 Hello模块与遗留代码参考](#第71章-hello模块与遗留代码参考)

---

# 第1章 产品总览与技术架构

## 1.1 产品定位

| 维度 | 说明 |
|------|------|
| **产品类型** | Web端 + 移动端适配的SaaS管理系统 |
| **场景类型** | prototype（应用架构设计） |
| **目标用户** | 收货员、发货员、财务人员、企业管理员 |
| **核心价值** | 移动端现场作业 + PC端管理，实现收发货、对账、统计全流程数字化，提升效率降低误差 |
| **界面语言** | 中文 |
| **主题偏好** | 浅色（单套色彩系统，内置三主题：浅色/深色/护眼） |
| **导航模式** | 路径导航 |
| **导航布局** | Sidebar（侧边栏，240px固定宽度） |

## 1.2 技术栈

### 前端技术栈

| 技术 | 版本/说明 |
|------|----------|
| React | 19.x |
| TypeScript | 严格模式 |
| React Router DOM | v6 |
| Tailwind CSS | 语义化token |
| shadcn/ui | 58个组件，重度定制样式 |
| ReactECharts | 数据统计图表 |
| Lucide React | 唯一图标库 |
| React Context + useState | 状态管理 |
| @tanstack/react-query | API状态管理 |
| axiosForBackend | API请求（Lark工具包） |
| xlsx | Excel导入导出 |
| jspdf + html2canvas | PDF导出 |
| Framer Motion | 动画 |
| dayjs | 日期处理 |
| Sonner Toast | 消息提示 |

### 后端技术栈

| 技术 | 版本/说明 |
|------|----------|
| NestJS | 10.x |
| TypeScript | 严格模式 |
| Drizzle ORM | postgres-js驱动 |
| PostgreSQL | 多租户独立数据库 |
| Handlebars (hbs) | 视图引擎 |
| @lark-apaas/fullstack-nestjs-core | 飞书低代码平台 |
| Rspack | 构建工具 |

## 1.3 文件统计

### 后端文件统计（server/）

| 目录 | 文件数 | 说明 |
|------|--------|------|
| `server/database/` | 1个 | schema.ts (923行) |
| `server/config/` | 1个 | constants.ts (80行) |
| `server/common/` | 9个 | 异常过滤器/常量/装饰器/拦截器/中间件/接口/工具 |
| `server/modules/customer/` | 3个 | customer.controller.ts / .service.ts / .module.ts |
| `server/modules/product/` | 3个 | product.controller.ts / .service.ts / .module.ts |
| `server/modules/inbound/` | 3个 | inbound.controller.ts / .service.ts / .module.ts |
| `server/modules/outbound/` | 3个 | outbound.controller.ts / .service.ts / .module.ts |
| `server/modules/inventory/` | 3个 | inventory.controller.ts / .service.ts / .module.ts |
| `server/modules/reconciliation/` | 3个 | reconciliation.controller.ts / .service.ts / .module.ts |
| `server/modules/undo/` | 3个 | undo.controller.ts / .service.ts / .module.ts |
| `server/modules/batch/` | 2个 | batch.service.ts / .module.ts（无Controller） |
| `server/modules/statistics/` | 3个 | statistics.controller.ts / .service.ts / .module.ts |
| `server/modules/permission/` | 3个 | permission.controller.ts / .service.ts / .module.ts |
| `server/modules/tenant/` | 4个 | tenant.controller.ts / tenant.service.ts / tenant-connection.service.ts / .module.ts |
| `server/modules/admin/` | 3个 | admin.controller.ts / .service.ts / .module.ts |
| `server/modules/voice/` | 3个 | voice.controller.ts / .service.ts / .module.ts |
| `server/modules/view/` | 2个 | view.controller.ts / .module.ts |

### 前端文件统计（client/src/）

| 目录 | 文件数 | 说明 |
|------|--------|------|
| `client/src/pages/` | 34个 | 34个页面文件，总计27,210行 |
| `client/src/components/` | 60+ | Layout.tsx(839行) + 58个shadcn/ui组件 |
| `client/src/data/` | 2个 | DataContext.tsx(1285行) + mockData.ts(200行) |
| `client/src/api/` | 1个 | index.ts(934行) |
| `client/src/hooks/` | 7个 | usePrintTemplate.ts(330行) / usePermission.ts(189行) / useInventorySync.ts(213行) / useDisplaySettings.ts(63行) / useTheme.ts(101行) / use-mobile.ts(19行) / use-example.ts(52行) |
| `client/src/contexts/` | 1个 | TenantContext.tsx(83行) |
| `client/src/utils/` | 3个 | currency.ts(87行) / excelExport.ts(147行) / constants.ts(84行) |
| `client/src/lib/` | 3个 | utils.ts / excel-export.ts / shiki.ts |
| `client/src/` | 5个 | app.tsx(298行) / index.tsx(30行) / index.css(901行) / tailwind-theme.css(485行) |

### 共享文件统计（shared/）

| 目录 | 文件数 | 说明 |
|------|--------|------|
| `shared/` | 1个 | api.interface.ts(824行) |

## 1.4 核心功能模块

系统围绕热处理行业收发货全流程构建，核心业务闭环为：

```
基础数据维护（客户/产品）
    → 来货登记（入库 + 批次 + 库存增加）
    → 快速发货（出库 + 批次扣减 + 库存减少）
    → 智能对账（对账单 + 开票 + 回款）
    → 数据统计（多维度分析报表）
```

辅助功能模块：
- **库存管理**：实时库存查询、预警、调整
- **撤销操作**：30分钟内可撤销入库/出库单
- **批次管理**：FIFO先进先出 + 指定批次出库
- **打印模板**：标识卡/送货单/对账单自定义打印
- **权限管理**：4角色 + 27权限码 + RBAC控制
- **多租户架构**：Database-per-Tenant模式
- **语音录入**：AI解析语音为结构化数据
- **智能Excel导入**：自动列匹配 + 数据清洗 + 材质工艺标准库

## 1.5 系统数据流架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (client/src/)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │ Context  │  │  Hooks   │  │  Utils   │   │
│  │ (34页面) │→ │Data/Tenant│→ │(7个Hook) │→ │(工具函数)│   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │          │
│       └──────────────┴──────────────┴──────────────┘        │
│                          │                                   │
│                    api/index.ts (50个API函数)               │
│                          │ axiosForBackend                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP Request
                           │ X-Organization-Code Header
┌──────────────────────────┼──────────────────────────────────┐
│                    后端 (server/)                            │
│  ┌───────────────────────┴──────────────────────┐          │
│  │           TenantMiddleware (全局)              │          │
│  │  orgCode提取 → 验证权限 → 获取DB连接           │          │
│  └───────────────────────┬──────────────────────┘          │
│                          │                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │Controller│→ │ Service │→ │ Drizzle │→ │ Postgre │       │
│  │(14模块) │  │(业务逻辑)│  │ (ORM)   │  │ (DB)    │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│       │                                              │       │
│  ┌────┴──────────────────────────────────────────────┴──┐   │
│  │  GlobalExceptionFilter + Logger + RLS策略              │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 1.6 依赖清单

### package.json 关键依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `react` | 19.x | 前端框架 |
| `react-dom` | 19.x | React DOM渲染 |
| `react-router-dom` | v6 | 路由管理 |
| `@tanstack/react-query` | latest | 服务端状态管理 |
| `tailwindcss` | v4 | CSS框架 |
| `framer-motion` | latest | 动画库 |
| `echarts` / `echarts-for-react` | latest | 图表库 |
| `lucide-react` | latest | 图标库 |
| `xlsx` | latest | Excel处理 |
| `jspdf` | latest | PDF生成 |
| `html2canvas` | latest | HTML转Canvas |
| `dayjs` | latest | 日期处理 |
| `sonner` | latest | Toast通知 |
| `@nestjs/common` | 10.x | NestJS核心 |
| `@nestjs/core` | 10.x | NestJS核心 |
| `@nestjs/platform-express` | 10.x | Express适配器 |
| `drizzle-orm` | latest | ORM |
| `postgres` | latest | PostgreSQL驱动 |
| `handlebars` | latest | 模板引擎 |
| `@lark-apaas/fullstack-nestjs-core` | latest | 飞书平台SDK |
| `@lark-apaas/client-toolkit` | latest | 前端SDK |

## 1.7 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SERVER_PORT` | 后端服务端口 | 3000 |
| `SERVER_HOST` | 后端服务主机 | localhost |
| `NODE_ENV` | 运行环境 | development |
| `CLIENT_BASE_PATH` | 前端基础路径 | / |

---

# 第2章 页面与路由完整定义

## 2.1 路由守卫组件

### ProtectedRoute（受保护路由守卫）

文件：`client/src/app.tsx` 第37-51行

```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查是否选择了租户（除了组织选择页面）
  if (location.pathname !== '/organizations' && needsTenantSelection()) {
    return <Navigate to="/organizations" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

**守卫逻辑（两层）**：
1. **登录检查**：调用 `getCurrentUser()` 从 localStorage 获取当前用户。未登录 → 跳转 `/login`，携带 `state.from` 记录原路径
2. **租户选择检查**：调用 `needsTenantSelection()` 检查 localStorage 中 `currentOrgCode` 是否存在。不存在且当前路径不是 `/organizations` → 跳转 `/organizations`

### PublicRoute（公开路由守卫）

文件：`client/src/app.tsx` 第54-62行

```typescript
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUser();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

**守卫逻辑**：已登录用户访问公开页（如登录页）→ 自动跳转 `/dashboard`

### PermissionGuard（权限守卫）

文件：`client/src/components/PermissionGuard.tsx`

```typescript
interface PermissionGuardProps {
  requiredPermission: string;
  children: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ requiredPermission, children }) => {
  const { hasPermission } = usePermission();

  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

**守卫逻辑**：
1. 调用 `usePermission()` Hook 获取 `hasPermission` 函数
2. 传入 `requiredPermission` 检查当前用户是否有权限
3. 无权限 → 跳转 `/dashboard`

## 2.2 完整路由树

文件：`client/src/app.tsx` 第64-296行，共31个路由定义。

### 路由层级结构

```
BrowserRouter (basename从 process.env.CLIENT_BASE_PATH 读取)
└── TenantProvider (包裹所有Routes)
    ├── Routes
    │   ├── 公开路由（无Layout）
    │   │   ├── /              → LandingPage
    │   │   ├── /landing       → LandingPage
    │   │   └── /login         → LoginPage (PublicRoute)
    │   ├── 组织选择（独立Layout）
    │   │   └── /organizations → OrganizationPage (ProtectedRoute)
    │   ├── 受保护路由（共享Layout）
    │   │   └── <ProtectedRoute><Layout /></ProtectedRoute>
    │   │       ├── /dashboard → DashboardPage (PermissionGuard: dashboard)
    │   │       ├── /inbound   → InboundPage (PermissionGuard: inbound)
    │   │       ├── /outbound  → OutboundPage (PermissionGuard: outbound)
    │   │       ├── /inventory → InventoryPage (PermissionGuard: inventory)
    │   │       ├── /reconciliation → ReconciliationPage (PermissionGuard: reconciliation)
    │   │       ├── /statistics → StatisticsPage (PermissionGuard: statistics)
    │   │       ├── /statistics/customer → CustomerAnalysisPage (PermissionGuard: statistics)
    │   │       ├── /statistics/inventory → InventoryAnalysisPage (PermissionGuard: statistics)
    │   │       ├── /statistics/product → ProductAnalysisPage (PermissionGuard: statistics)
    │   │       ├── /statistics/finance → FinanceAnalysisPage (PermissionGuard: statistics)
    │   │       ├── /customers → CustomerListPage (PermissionGuard: customers)
    │   │       ├── /customers/:id → CustomerDetailPage (PermissionGuard: customers)
    │   │       ├── /products → ProductListPage (PermissionGuard: products)
    │   │       ├── /products/:id → ProductDetailPage (PermissionGuard: products)
    │   │       ├── /settings/templates → TemplateConfigPage (PermissionGuard: templates)
    │   │       ├── /settings/display → DisplaySettingsPage (PermissionGuard: display)
    │   │       ├── /settings/permissions → PermissionPage (PermissionGuard: permissions)
    │   │       ├── /settings/manual → UserManualPage (PermissionGuard: manual)
    │   │       ├── /settings/feature-flags → FeatureFlagsPage (PermissionGuard: featureFlags)
    │   │       ├── /profile → ProfilePage (PermissionGuard: profile)
    │   │       ├── /operation-logs → OperationLogPage (PermissionGuard: logs)
    │   │       ├── /orders → OrderListPage (PermissionGuard: orders)
    │   │       ├── /admin → AdminDashboard (PermissionGuard: admin)
    │   │       └── /tenant/manage → OrganizationManagePage (PermissionGuard: admin)
    │   └── /* → NotFound
```

### 路由详细清单

| # | 路径 | 组件 | 页面文件 | 行数 | 守卫 | 权限码 |
|---|------|------|---------|------|------|--------|
| 1 | `/` | `LandingPage` | `pages/LandingPage/LandingPage.tsx` | 906 | 无 | 无 |
| 2 | `/landing` | `LandingPage` | 同上 | 906 | 无 | 无 |
| 3 | `/login` | `LoginPage` | `pages/LoginPage/LoginPage.tsx` | 199 | PublicRoute | 无 |
| 4 | `/organizations` | `OrganizationPage` | `pages/OrganizationPage/OrganizationPage.tsx` | 320 | ProtectedRoute | 无 |
| 5 | `/dashboard` | `DashboardPage` | `pages/DashboardPage/DashboardPage.tsx` | 1036 | ProtectedRoute + PermissionGuard | `dashboard` |
| 6 | `/inbound` | `InboundPage` | `pages/InboundPage/InboundPage.tsx` | 1925 | ProtectedRoute + PermissionGuard | `inbound` |
| 7 | `/outbound` | `OutboundPage` | `pages/OutboundPage/OutboundPage.tsx` | 1355 | ProtectedRoute + PermissionGuard | `outbound` |
| 8 | `/inventory` | `InventoryPage` | `pages/InventoryPage/InventoryPage.tsx` | 962 | ProtectedRoute + PermissionGuard | `inventory` |
| 9 | `/reconciliation` | `ReconciliationPage` | `pages/ReconciliationPage/ReconciliationPage.tsx` | 2193 | ProtectedRoute + PermissionGuard | `reconciliation` |
| 10 | `/statistics` | `StatisticsPage` | `pages/StatisticsPage/StatisticsPage.tsx` | 1535 | ProtectedRoute + PermissionGuard | `statistics` |
| 11 | `/statistics/customer` | `CustomerAnalysisPage` | `pages/StatisticsPage/CustomerAnalysisPage.tsx` | 555 | ProtectedRoute + PermissionGuard | `statistics` |
| 12 | `/statistics/inventory` | `InventoryAnalysisPage` | `pages/StatisticsPage/InventoryAnalysisPage.tsx` | 638 | ProtectedRoute + PermissionGuard | `statistics` |
| 13 | `/statistics/product` | `ProductAnalysisPage` | `pages/StatisticsPage/ProductAnalysisPage.tsx` | 613 | ProtectedRoute + PermissionGuard | `statistics` |
| 14 | `/statistics/finance` | `FinanceAnalysisPage` | `pages/StatisticsPage/FinanceAnalysisPage.tsx` | 624 | ProtectedRoute + PermissionGuard | `statistics` |
| 15 | `/customers` | `CustomerListPage` | `pages/CustomerListPage/CustomerListPage.tsx` | 1440 | ProtectedRoute + PermissionGuard | `customers` |
| 16 | `/customers/:id` | `CustomerDetailPage` | `pages/CustomerDetailPage/CustomerDetailPage.tsx` | 721 | ProtectedRoute + PermissionGuard | `customers` |
| 17 | `/products` | `ProductListPage` | `pages/ProductListPage/ProductListPage.tsx` | 1196 | ProtectedRoute + PermissionGuard | `products` |
| 18 | `/products/:id` | `ProductDetailPage` | `pages/ProductDetailPage/ProductDetailPage.tsx` | 410 | ProtectedRoute + PermissionGuard | `products` |
| 19 | `/settings/templates` | `TemplateConfigPage` | `pages/TemplateConfigPage/TemplateConfigPage.tsx` | 856 | ProtectedRoute + PermissionGuard | `templates` |
| 20 | `/settings/display` | `DisplaySettingsPage` | `pages/DisplaySettingsPage/DisplaySettingsPage.tsx` | 102 | ProtectedRoute + PermissionGuard | `display` |
| 21 | `/settings/permissions` | `PermissionPage` | `pages/PermissionPage/PermissionPage.tsx` | 1262 | ProtectedRoute + PermissionGuard | `permissions` |
| 22 | `/settings/manual` | `UserManualPage` | `pages/UserManualPage/UserManualPage.tsx` | 3633 | ProtectedRoute + PermissionGuard | `manual` |
| 23 | `/settings/feature-flags` | `FeatureFlagsPage` | `pages/FeatureFlagsPage/FeatureFlagsPage.tsx` | 106 | ProtectedRoute + PermissionGuard | `featureFlags` |
| 24 | `/profile` | `ProfilePage` | `pages/ProfilePage/ProfilePage.tsx` | 590 | ProtectedRoute + PermissionGuard | `profile` |
| 25 | `/operation-logs` | `OperationLogPage` | `pages/OperationLogPage/OperationLogPage.tsx` | 482 | ProtectedRoute + PermissionGuard | `logs` |
| 26 | `/orders` | `OrderListPage` | `pages/OrderListPage/OrderListPage.tsx` | 820 | ProtectedRoute + PermissionGuard | `orders` |
| 27 | `/admin` | `AdminDashboard` | `pages/AdminDashboard/AdminDashboard.tsx` | 887 | ProtectedRoute + PermissionGuard | `admin` |
| 28 | `/tenant/manage` | `OrganizationManagePage` | `pages/OrganizationManagePage/OrganizationManagePage.tsx` | 378 | ProtectedRoute + PermissionGuard | `admin` |
| 29 | `*` | `NotFound` | `pages/NotFound/NotFound.tsx` | 11 | 无 | 无 |

### 权限码与路由映射

| 权限码 | 对应路由 |
|--------|---------|
| `dashboard` | `/dashboard` |
| `inbound` | `/inbound` |
| `outbound` | `/outbound` |
| `inventory` | `/inventory` |
| `reconciliation` | `/reconciliation` |
| `statistics` | `/statistics`, `/statistics/*` |
| `customers` | `/customers`, `/customers/:id` |
| `products` | `/products`, `/products/:id` |
| `templates` | `/settings/templates` |
| `display` | `/settings/display` |
| `permissions` | `/settings/permissions` |
| `manual` | `/settings/manual` |
| `featureFlags` | `/settings/feature-flags` |
| `profile` | `/profile` |
| `logs` | `/operation-logs` |
| `orders` | `/orders` |
| `admin` | `/admin`, `/tenant/manage` |

## 2.3 页面间数据传递方式

| 传递方式 | 适用场景 | 实现细节 |
|----------|---------|---------|
| DataContext全局状态 | 跨页面共享业务数据 | `client/src/data/DataContext.tsx`，10大模块数据 |
| URL参数 (useParams) | 详情页传递ID | `/customers/:id`, `/products/:id` |
| localStorage持久化 | 用户偏好、打印模板、权限配置 | 打印模板(3个key)、字号(display_font_size)、主题(heat-treatment-theme)、当前用户、当前组织 |
| React Query缓存 | API数据缓存和刷新 | 客户列表、客户详情、权限数据 |
| 路由导航 (useNavigate) | 页面间跳转 | `DashboardPage → InboundPage` |
| TenantContext | 租户信息全局共享 | `client/src/contexts/TenantContext.tsx` |

---

# 第3章 导航与布局系统

## 3.1 入口文件

### client/src/index.tsx（30行）

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppContainer } from '@lark-apaas/client-toolkit';
import { ErrorRender } from '@lark-apaas/client-toolkit';
import RoutesComponent from './app';

const MainApp = () => {
  return (
    <BrowserRouter basename={process.env.CLIENT_BASE_PATH || '/'}>
      <AppContainer>
        <ErrorRender>
          <RoutesComponent />
        </ErrorRender>
      </AppContainer>
    </BrowserRouter>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<MainApp />);
}
```

**层级结构**：
1. `BrowserRouter` — React Router v6，basename 从 `process.env.CLIENT_BASE_PATH` 读取（默认 `/`）
2. `AppContainer` — Lark工具包应用容器，默认light主题
3. `ErrorRender` — 错误降级渲染组件
4. `RoutesComponent` — 应用路由组件（来自 app.tsx）

## 3.2 主布局组件 Layout.tsx（839行）

文件：`client/src/components/Layout.tsx`

### 布局结构

```
Layout (flex布局)
├── DataProvider (全局数据上下文)
│   └── SidebarProvider (侧边栏状态管理)
│       ├── Sidebar (固定左侧，w-60=240px，移动端抽屉)
│       │   ├── AppLogo (图标+标题+副标题+租户名)
│       │   ├── 导航分组1: 工作台
│       │   ├── 导航分组2: 业务操作 (5项)
│       │   ├── 导航分组3: 数据洞察 (5项)
│       │   ├── 导航分组4: 系统管理 (4项)
│       │   └── SidebarToggle (折叠/展开按钮)
│       └── 主内容区 (ml-60, flex-1)
│           ├── Header (顶部栏)
│           │   ├── Breadcrumb (面包屑)
│           │   ├── SearchDialog (全局搜索，9个功能项)
│           │   ├── NotificationDialog (通知)
│           │   ├── HelpButton (帮助)
│           │   └── ThemeToggle (主题切换)
│           ├── PageTitle (页面标题区)
│           ├── Outlet (子路由渲染)
│           └── ErrorBoundary (错误边界)
```

### 导航分组详细清单

**分组1：工作台（1项）**

| 导航文字 | 路由 | 图标 | 权限码 |
|---------|------|------|--------|
| 工作台 | `/dashboard` | LayoutDashboard | dashboard |

**分组2：业务操作（5项）**

| 导航文字 | 路由 | 图标 | 权限码 |
|---------|------|------|--------|
| 来货登记 | `/inbound` | Inbox | inbound |
| 快速发货 | `/outbound` | Outbox | outbound |
| 单据查询 | `/orders` | FileText | orders |
| 库存管理 | `/inventory` | Package | inventory |
| 智能对账 | `/reconciliation` | FileCheck | reconciliation |

**分组3：数据洞察（5项）**

| 导航文字 | 路由 | 图标 | 权限码 |
|---------|------|------|--------|
| 数据概览 | `/statistics` | BarChart | statistics |
| 客户分析 | `/statistics/customer` | Users | statistics |
| 库存分析 | `/statistics/inventory` | Boxes | statistics |
| 产品分析 | `/statistics/product` | PackageSearch | statistics |
| 财务分析 | `/statistics/finance` | TrendingUp | statistics |

**分组4：系统管理（4项 + 1折叠组）**

| 导航文字 | 路由 | 图标 | 权限码 |
|---------|------|------|--------|
| 客户管理 | `/customers` | Users | customers |
| 产品管理 | `/products` | PackageSearch | products |
| 管理后台 | `/admin` | Shield | admin |
| 系统设置 | `/settings/templates`（折叠组入口） | Settings | - |

**系统设置折叠组（4项）**：

| 导航文字 | 路由 | 图标 | 权限码 |
|---------|------|------|--------|
| 打印模板 | `/settings/templates` | Printer | templates |
| 显示设置 | `/settings/display` | Monitor | display |
| 权限管理 | `/settings/permissions` | Lock | permissions |
| 用户手册 | `/settings/manual` | BookOpen | manual |

### 子组件详细规格

**AppLogo 组件**
- 显示：火焰图标（`Flame` from lucide-react）+ "文火热处理" 标题 + 副标题 + 当前租户名称
- 样式：文字白色，`text-lg font-bold`
- 租户名从 `TenantContext` 获取

**SimpleNavItem 组件**
- 默认状态：`text-white/70` + `hover:text-white hover:bg-white/10`
- 当前状态：`text-white bg-white/20` + 左侧 3px accent 色边框 (`border-l-[3px] border-accent`)
- 图标：`w-5 h-5 mr-3`
- 高度：`h-10`
- 圆角：`rounded-md`

**CollapsibleNavItem 组件**
- 用于系统设置折叠组
- 展开/收起动画
- 子项缩进显示

**SidebarToggle 组件**
- 折叠/展开侧边栏按钮
- 位置：侧边栏底部

**UserMenu 组件**
- 用户头像下拉菜单
- 包含：个人资料 / 切换组织 / 退出登录
- 头像：从 `useCurrentUserProfile` 获取

**Breadcrumb 组件**
- 面包屑导航
- 映射规则：
  - `/dashboard` → 工作台
  - `/inbound` → 来货登记
  - `/outbound` → 快速发货
  - `/inventory` → 库存管理
  - `/reconciliation` → 智能对账
  - `/statistics` → 数据统计
  - `/customers` → 客户管理
  - `/customers/:id` → 客户管理 / 客户详情
  - `/products` → 产品管理
  - `/products/:id` → 产品管理 / 产品详情
  - `/settings/*` → 系统设置 / 子页面
  - `/profile` → 个人中心
  - `/operation-logs` → 操作日志
  - `/orders` → 单据查询
  - `/admin` → 管理后台
  - `/tenant/manage` → 组织管理

**SearchDialog 组件**
- 全局搜索对话框
- 支持9个功能项的模糊搜索
- 快捷键触发
- 搜索结果点击跳转

**NotificationDialog 组件**
- 通知消息对话框
- 显示：待回款提醒 + 库存预警
- 从 DataContext 获取数据

**Header 组件**
- 顶部固定栏
- 包含：面包屑 + 搜索按钮 + 通知按钮 + 帮助按钮 + 主题切换按钮 + 用户头像

**PageTitle 组件**
- 页面标题区
- 显示当前页面标题和描述
- 响应式字号

## 3.3 样式系统

### tailwind-theme.css（485行）

文件：`client/src/tailwind-theme.css`

定义三套完整主题，每套包含70+ CSS变量。

#### 浅色主题（:root）

```css
:root {
  --background: hsl(210 20% 98%);
  --foreground: hsl(222 47% 11%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222 47% 11%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(222 47% 11%);
  --primary: hsl(220 70% 45%);
  --primary-foreground: hsl(0 0% 100%);
  --primary-light: hsl(220 70% 55%);
  --primary-dark: hsl(220 70% 35%);
  --secondary: hsl(210 20% 96%);
  --secondary-foreground: hsl(222 47% 11%);
  --muted: hsl(210 20% 96%);
  --muted-foreground: hsl(215 16% 47%);
  --accent: hsl(38 95% 53%);
  --accent-foreground: hsl(222 47% 11%);
  --destructive: hsl(0 72% 51%);
  --destructive-foreground: hsl(0 0% 100%);
  --destructive-light: hsl(0 72% 60%);
  --success: hsl(142 71% 45%);
  --success-foreground: hsl(0 0% 100%);
  --success-light: hsl(142 71% 55%);
  --warning: hsl(38 92% 50%);
  --warning-foreground: hsl(222 47% 11%);
  --warning-light: hsl(38 92% 60%);
  --error: hsl(0 72% 51%);
  --error-foreground: hsl(0 0% 100%);
  --error-light: hsl(0 72% 60%);
  --info: hsl(215 70% 50%);
  --info-foreground: hsl(0 0% 100%);
  --info-light: hsl(215 70% 60%);
  --border: hsl(214 32% 91%);
  --input: hsl(214 32% 91%);
  --ring: hsl(220 70% 45%);
  --chart-1: hsl(220 70% 45%);
  --chart-2: hsl(38 95% 53%);
  --chart-3: hsl(142 71% 45%);
  --chart-4: hsl(0 72% 51%);
  --chart-5: hsl(215 70% 50%);
  --sidebar-background: hsl(215 70% 35%);
  --sidebar-foreground: hsl(0 0% 100%);
  --sidebar-primary: hsl(38 95% 53%);
  --sidebar-primary-foreground: hsl(222 47% 11%);
  --sidebar-accent: hsl(215 70% 45%);
  --sidebar-accent-foreground: hsl(0 0% 100%);
  --sidebar-border: hsl(215 60% 30%);
  --sidebar-ring: hsl(38 95% 53%);
  --glass-bg: hsl(0 0% 100% / 0.8);
  --glass-border: hsl(214 32% 91% / 0.5);
  --shadow-color: hsl(222 47% 11%);
  --shadow-strength: 0.05;
  --selection-bg: hsl(220 70% 45%);
  --selection-fg: hsl(0 0% 100%);
  --font-sans: "PingFang SC", "Microsoft YaHei", "Source Han Sans CN", sans-serif;
  --font-serif: Georgia, "Times New Roman", serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  --shadow-2xs: 0 1px 2px 0 hsl(222 47% 11% / 0.03);
  --shadow-xs: 0 1px 2px 0 hsl(222 47% 11% / 0.05);
  --shadow-sm: 0 1px 3px 0 hsl(222 47% 11% / 0.08), 0 1px 2px -1px hsl(222 47% 11% / 0.08);
  --shadow-md: 0 4px 6px -1px hsl(222 47% 11% / 0.08), 0 2px 4px -2px hsl(222 47% 11% / 0.08);
  --shadow-lg: 0 10px 15px -3px hsl(222 47% 11% / 0.08), 0 4px 6px -4px hsl(222 47% 11% / 0.08);
  --shadow-xl: 0 20px 25px -5px hsl(222 47% 11% / 0.08), 0 8px 10px -6px hsl(222 47% 11% / 0.08);
  --shadow-2xl: 0 25px 50px -12px hsl(222 47% 11% / 0.2);
  --animate-duration: 200ms;
  --animate-timing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 深色主题（[data-theme="dark"]）

核心变化：
- `--background`: `hsl(222 47% 6%)`
- `--foreground`: `hsl(210 20% 98%)`
- `--primary`: `hsl(217 91% 60%)`（霓虹蓝）
- `--accent`: `hsl(32 100% 55%)`（活力橙）
- `--sidebar-background`: `hsl(222 47% 8%)`
- 所有 `muted` 和 `card` 背景色反转

#### 护眼主题（[data-theme="eye-care"]）

核心变化：
- `--background`: `hsl(40 20% 94%)`
- `--foreground`: `hsl(30 20% 15%)`
- `--primary`: `hsl(25 60% 40%)`（深棕橙）
- `--accent`: `hsl(35 80% 50%)`（暖橙）
- `--sidebar-background`: `hsl(25 50% 30%)`

#### Tailwind @theme inline 映射

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-light: var(--primary-light);
  --color-primary-dark: var(--primary-dark);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-destructive-light: var(--destructive-light);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-success-light: var(--success-light);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-warning-light: var(--warning-light);
  --color-error: var(--error);
  --color-error-foreground: var(--error-foreground);
  --color-error-light: var(--error-light);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-info-light: var(--info-light);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar-background: var(--sidebar-background);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-glass-bg: var(--glass-bg);
  --color-glass-border: var(--glass-border);
  --font-sans: var(--font-sans);
  --font-serif: var(--font-serif);
  --font-mono: var(--font-mono);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --radius-2xl: var(--radius-2xl);
  --radius-full: var(--radius-full);
  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
  --animate-duration: var(--animate-duration);
  --animate-timing: var(--animate-timing);
}
```

### index.css（901行）

文件：`client/src/index.css`

**导入顺序**：
```css
@import '@lark-apaas/client-toolkit/style.css';
@import 'tw-animate-css';
@import './tailwind-theme.css';
@import './typography.css';
```

**全局过渡**：
```css
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease,
    fill 0.3s ease, stroke 0.3s ease, box-shadow 0.3s ease;
}
.no-theme-transition * {
  transition: none !important;
}
```

**自定义动画类**：

| 类名 | 说明 |
|------|------|
| `.page-transition-enter` | 页面进入：opacity 0→1 + translateY(10px→0)，300ms |
| `.page-transition-exit` | 页面退出：opacity 1→0 + translateY(0→-10px)，200ms |
| `.table-row-hover` | 表格行悬停：背景色变化 |
| `.btn-press:active` | 按钮按下：scale(0.97) |
| `.input-focus-ring:focus` | 输入框聚焦：ring-2 ring-primary/20 |
| `.card-hover` | 卡片悬停：shadow-sm→shadow-md + translateY(-2px) |
| `.font-tabular` | 等宽数字：font-variant-numeric tabular-nums |
| `.badge-shimmer` | 徽章微光动画 |
| `.status-pulse` | 状态脉冲动画（animate-pulse） |
| `.skeleton` | 骨架屏闪烁动画 |
| `.divider-gradient` | 渐变分割线 |

**深色模式适配（约600行）**：
覆盖 Ant Design 全部组件（表格/分页/输入/选择/日期/弹窗/抽屉/标签/按钮/步骤/单选/复选/分割线）+ shadcn 组件（dialog/card/input/select/checkbox/tabs/badge）+ 原生表格 + 打印预览。

**打印预览CSS变量**：
```css
@media print {
  :root {
    --print-bg: #ffffff;
    --print-text: #000000;
    --print-header-bg: #f5f5f5;
  }
}
```

### 色彩系统总结

| 颜色角色 | CSS变量 | Tailwind Class | 浅色值 | 深色值 | 护眼值 |
|---------|---------|----------------|--------|--------|--------|
| 背景 | `--background` | `bg-background` | hsl(210 20% 98%) | hsl(222 47% 6%) | hsl(40 20% 94%) |
| 前景 | `--foreground` | `text-foreground` | hsl(222 47% 11%) | hsl(210 20% 98%) | hsl(30 20% 15%) |
| 卡片 | `--card` | `bg-card` | hsl(0 0% 100%) | hsl(222 47% 8%) | hsl(40 15% 96%) |
| 主色 | `--primary` | `bg-primary` | hsl(220 70% 45%) | hsl(217 91% 60%) | hsl(25 60% 40%) |
| 强调 | `--accent` | `bg-accent` | hsl(38 95% 53%) | hsl(32 100% 55%) | hsl(35 80% 50%) |
| 成功 | `--success` | `text-success` | hsl(142 71% 45%) | hsl(142 71% 50%) | hsl(142 60% 40%) |
| 警告 | `--warning` | `text-warning` | hsl(38 92% 50%) | hsl(38 92% 55%) | hsl(35 80% 50%) |
| 错误 | `--error` | `text-error` | hsl(0 72% 51%) | hsl(0 72% 55%) | hsl(0 60% 45%) |
| 信息 | `--info` | `text-info` | hsl(215 70% 50%) | hsl(215 70% 55%) | hsl(25 50% 45%) |

### 字体排版规范

| 层级 | Tailwind Class | 尺寸 | 字重 | 行高 | 用途 |
|-----|---------------|------|-----|------|------|
| H1 | `text-2xl` | 24px | `font-bold` | 1.3 | 页面主标题 |
| H2 | `text-xl` | 20px | `font-semibold` | 1.4 | 区块标题 |
| H3 | `text-lg` | 18px | `font-semibold` | 1.5 | 卡片标题 |
| Body | `text-base` | 16px | `font-normal` | 1.6 | 正文内容 |
| Small | `text-sm` | 14px | `font-normal` | 1.5 | 辅助说明、标签 |
| Tiny | `text-xs` | 12px | `font-medium` | 1.4 | 徽章、状态标签 |

### 圆角与阴影规范

| 元素 | 圆角 | 阴影（默认） | 阴影（悬停） |
|------|------|-------------|-------------|
| 卡片 | `rounded-lg` (8px) | `shadow-sm` | `shadow-md` |
| 按钮 | `rounded-md` (6px) | 无 | `shadow-md` |
| 输入框 | `rounded-md` (6px) | 无 | `ring-2 ring-primary/20` |
| 标签/徽章 | `rounded-full` | 无 | 无 |
| 弹窗/抽屉 | `rounded-lg` (8px) | `shadow-xl` | 无 |

### 缓动函数与时长

| 场景 | 时长 | 缓动函数 |
|------|------|---------|
| Hover/Active 微交互 | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Tab/Panel 组件切换 | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 页面过渡 | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 抽屉/弹窗 | 250ms | `cubic-bezier(0.4, 0, 0.2, 1)` |

### 关键动效定义

1. **按钮 Hover**：`transform: translateY(-1px)` + `shadow-md`，150ms
2. **卡片 Hover**：`shadow-sm` → `shadow-md` + `translateY(-2px)`，200ms
3. **侧边栏 Nav Item**：背景色从左滑入 `translateX(-100%)` → `translateX(0)`，200ms
4. **数字变化**：计数器动画，300ms
5. **流程步骤切换**：内容区淡入淡出 `opacity` + `translateX(20px)`，250ms

---

# 第4章 数据库Schema完整定义

文件：`server/database/schema.ts`（923行）

## 4.1 自定义类型

### userProfile 类型

```typescript
export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});
```

**说明**：PostgreSQL自定义复合类型，存储为 `ROW(userId)::user_profile`。写入时使用 `ROW(${value})::user_profile`，读取时解析元组提取userId。

### fileAttachment 类型

```typescript
export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});
```

### userProfileArray / fileAttachmentArray 类型

数组版本的自定义类型，支持空数组 `{}`，写入时使用 `ARRAY[...]::type[]`，读取时解析元组数组。

### customTimestamptz 类型

```typescript
export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number};
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number){
    if(value == null) return value as any;
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    if(typeof value === 'string') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if(value instanceof Date) return value;
    return new Date(value);
  },
});
```

**说明**：支持 `Date | string | number` 三种输入类型。跨网络传输后前端拿到ISO字符串（见 `shared/api.interface.ts` 中声明为 `string`）。

## 4.2 数据表完整定义

### 4.2.1 approval_request（审批请求表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| type | varchar(255) | NOT NULL | - | 审批类型 |
| entity_type | varchar(255) | NOT NULL | - | 实体类型 |
| entity_id | uuid | NOT NULL | - | 实体ID |
| requester | userProfile | NOT NULL | - | 申请人 |
| approver | userProfile | - | - | 审批人 |
| status | varchar(255) | - | 'pending' | 状态 |
| reason | text | NOT NULL | - | 申请原因 |
| requested_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 申请时间 |
| approved_at | customTimestamptz | - | - | 批准时间 |
| rejected_at | customTimestamptz | - | - | 拒绝时间 |
| reject_reason | text | - | - | 拒绝原因 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段：创建时间 |
| _created_by | userProfile | - | - | 系统字段：创建者 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段：更新时间 |
| _updated_by | userProfile | - | - | 系统字段：更新者 |

**索引**：
- `idx_approval_request_approver` (btree on approver)
- `idx_approval_request_entity` (btree on entity_type, entity_id)
- `idx_approval_request_requester` (btree on requester)

**RLS策略**：
- `service_role_bypass_policy`：service_role全通
- `修改全部数据`：authenticated可全部修改
- `查看全部数据`：anon + authenticated可查询
- `修改本人数据`：authenticated可修改本人数据

### 4.2.2 customer（客户表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| code | varchar(255) | NOT NULL | - | 客户编码（唯一） |
| name | varchar(255) | NOT NULL | - | 客户名称 |
| contact | varchar(255) | - | - | 联系人 |
| phone | varchar(255) | - | - | 电话 |
| address | text | - | - | 地址 |
| transport | varchar(255) | - | - | 运输方式 |
| payment_term | varchar(255) | - | - | 付款条件 |
| delivery_direction | varchar(255) | - | - | 交货方向 |
| settlement | varchar(255) | - | - | 结算方式 |
| category | varchar(255) | - | - | 客户类别 |
| inbound_count | integer | - | 0 | 累计入库次数 |
| status | varchar(255) | - | 'active' | 状态 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |
| deleted_at | customTimestamptz | - | - | 软删除时间 |
| deleted_reason | text | - | - | 删除原因 |
| last_inbound_date | customTimestamptz | - | - | 最后入库日期 |
| inbound_count_monthly | integer | - | 0 | 本月入库次数 |

**索引**：
- `idx_customer_code` (唯一索引 on code)

**约束**：
- `check_customer_deleted_reason`：`((deleted_at IS NULL) AND (deleted_reason IS NULL)) OR ((deleted_at IS NOT NULL) AND (deleted_reason IS NOT NULL))`
  - 即：软删除时必须同时有 deleted_at 和 deleted_reason

**RLS策略**：同上4条标准策略

### 4.2.3 product（产品表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| code | varchar(255) | NOT NULL | - | 产品编码（唯一） |
| name | varchar(255) | NOT NULL | - | 产品名称 |
| material | varchar(255) | - | - | 材质 |
| process | varchar(255) | - | - | 工艺 |
| tech_requirement | text | - | - | 技术要求 |
| workpiece_no | varchar(255) | - | - | 工件编号 |
| unit | varchar(255) | - | - | 计价单位 |
| unit_price | double precision | - | 0 | 单价（元） |
| customer_code | varchar(255) | NOT NULL | - | 客户编码 |
| customer_name | varchar(255) | NOT NULL | - | 客户名称 |
| stock | integer | - | 0 | 当前库存数量 |
| inbound_quantity | integer | - | 0 | 累计入库数量 |
| inbound_weight | double precision | - | 0 | 累计入库重量 |
| inbound_date | customTimestamptz | - | - | 最后入库日期 |
| batch_no | varchar(255) | - | - | 批次号 |
| status | varchar(255) | - | 'active' | 状态 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |
| stock_weight | double precision | - | 0 | 当前库存重量 |
| archived_at | customTimestamptz | - | - | 归档时间 |
| archived_reason | text | - | - | 归档原因 |
| version | integer | NOT NULL | 1 | 乐观锁版本号 |
| deleted_at | customTimestamptz | - | - | 软删除时间 |
| unit_price_cents | integer | NOT NULL | 0 | 单价（分） |
| warning_threshold | integer | - | 50 | 预警阈值 |
| attachments | text[] | - | - | 附件路径数组 |
| max_storage_days | integer | - | 180 | 最大存放天数 |

**索引**：
- `idx_product_code` (唯一索引 on code)

**约束**：
- `check_product_stock_non_negative`：`stock >= 0`
- `check_product_stock_weight_non_negative`：`stock_weight >= 0`

**RLS策略**：标准4条

### 4.2.4 operation_log（操作日志表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| entity_type | varchar(255) | NOT NULL | - | 实体类型 |
| entity_id | uuid | NOT NULL | - | 实体ID |
| operation | varchar(255) | NOT NULL | - | 操作类型 |
| operator | userProfile | NOT NULL | - | 操作人 |
| before_state | text | - | - | 操作前状态（JSON） |
| after_state | text | - | - | 操作后状态（JSON） |
| source | varchar(255) | NOT NULL | - | 来源 |
| ip_address | varchar(255) | - | - | IP地址 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_operation_log_entity` (btree on entity_type, entity_id)
- `idx_operation_log_operator` (btree on operator)

**RLS策略**：标准4条

### 4.2.5 outbound_detail（出库明细表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| outbound_id | uuid | NOT NULL | - | 出库单ID |
| product_id | uuid | NOT NULL | - | 产品ID |
| product_name | varchar(255) | NOT NULL | - | 产品名称 |
| workpiece_no | varchar(255) | - | - | 工件编号 |
| material | varchar(255) | - | - | 材质 |
| process | varchar(255) | - | - | 工艺 |
| unit | varchar(255) | - | - | 单位 |
| unit_price | double precision | - | 0 | 单价 |
| quantity | integer | NOT NULL | - | 数量 |
| weight | double precision | NOT NULL | - | 重量 |
| amount | double precision | - | 0 | 金额 |
| batch_no | varchar(255) | - | - | 批次号 |
| inbound_date | customTimestamptz | - | - | 入库日期 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_outbound_detail_outbound` (btree on outbound_id)

**RLS策略**：标准4条

### 4.2.6 reconciliation_detail_version（对账明细历史版本表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| reconciliation_id | uuid | NOT NULL | - | 对账单ID |
| version | integer | NOT NULL | - | 版本号 |
| outbound_no | varchar(255) | NOT NULL | - | 出库单号 |
| outbound_date | customTimestamptz | NOT NULL | - | 出库日期 |
| product_name | varchar(255) | NOT NULL | - | 产品名称 |
| workpiece_no | varchar(255) | - | - | 工件编号 |
| material | varchar(255) | - | - | 材质 |
| process | varchar(255) | - | - | 工艺 |
| quantity | integer | NOT NULL | - | 数量 |
| weight | double precision | NOT NULL | - | 重量 |
| unit_price | double precision | - | 0 | 单价 |
| amount | double precision | - | 0 | 金额 |
| unit | varchar(255) | NOT NULL | - | 单位 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_reconciliation_detail_version_reconciliation` (btree on reconciliation_id)
- `idx_reconciliation_detail_version_reconciliation_version` (btree on reconciliation_id, version)

**RLS策略**：标准4条

### 4.2.7 reconciliation_detail（对账明细表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| reconciliation_id | uuid | NOT NULL | - | 对账单ID |
| outbound_no | varchar(255) | NOT NULL | - | 出库单号 |
| outbound_date | customTimestamptz | NOT NULL | - | 出库日期 |
| product_name | varchar(255) | NOT NULL | - | 产品名称 |
| workpiece_no | varchar(255) | - | - | 工件编号 |
| material | varchar(255) | - | - | 材质 |
| process | varchar(255) | - | - | 工艺 |
| quantity | integer | NOT NULL | - | 数量 |
| weight | double precision | NOT NULL | - | 重量 |
| unit_price | double precision | - | 0 | 单价 |
| amount | double precision | - | 0 | 金额 |
| unit | varchar(255) | NOT NULL | - | 单位 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| version | integer | NOT NULL | 1 | 版本号 |
| is_active | boolean | NOT NULL | true | 是否有效 |
| update_reason | text | - | - | 更新原因 |
| updated_by | userProfile | - | - | 更新者 |

**索引**：
- `idx_reconciliation_detail_active` (btree on reconciliation_id, is_active)
- `idx_reconciliation_detail_reconciliation` (btree on reconciliation_id)
- `idx_reconciliation_detail_version` (btree on reconciliation_id, version)

**RLS策略**：标准4条

### 4.2.8 reconciliation（对账单表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| reconciliation_no | varchar(255) | NOT NULL | - | 对账单号 |
| customer_id | uuid | NOT NULL | - | 客户ID |
| customer_name | varchar(255) | NOT NULL | - | 客户名称 |
| customer_code | varchar(255) | NOT NULL | - | 客户编码 |
| month | varchar(255) | NOT NULL | - | 对账月份 |
| status | varchar(255) | - | 'audited' | 状态 |
| total_amount | double precision | - | 0 | 总金额（元） |
| deduction_amount | double precision | - | 0 | 扣款金额（元） |
| other_amount | double precision | - | 0 | 其他金额（元） |
| compensation_amount | double precision | - | 0 | 补偿金额（元） |
| final_amount | double precision | - | 0 | 最终金额（元） |
| invoice_amount | double precision | - | 0 | 开票金额（元） |
| uninvoice_amount | double precision | - | 0 | 未开票金额（元） |
| receipt_amount | double precision | - | 0 | 回款金额（元） |
| unreceived_amount | double precision | - | 0 | 未回款金额（元） |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |
| total_amount_cents | integer | NOT NULL | 0 | 总金额（分） |
| deduction_amount_cents | integer | NOT NULL | 0 | 扣款金额（分） |
| other_amount_cents | integer | NOT NULL | 0 | 其他金额（分） |
| compensation_amount_cents | integer | NOT NULL | 0 | 补偿金额（分） |
| final_amount_cents | integer | NOT NULL | 0 | 最终金额（分） |
| invoice_amount_cents | integer | NOT NULL | 0 | 开票金额（分） |
| receipt_amount_cents | integer | NOT NULL | 0 | 回款金额（分） |
| auditor | userProfile | - | - | 审核人 |
| audited_at | customTimestamptz | - | - | 审核时间 |
| is_locked | boolean | - | false | 是否锁定 |
| invoice_records | jsonb | - | [] | 开票记录（JSON数组） |
| receipt_records | jsonb | - | [] | 回款记录（JSON数组） |
| version | integer | NOT NULL | 1 | 版本号 |
| outbound_snapshot | jsonb | - | - | 出库单快照（反审核用） |

**索引**：
- `idx_reconciliation_auditor` (btree on auditor)
- `idx_reconciliation_customer` (btree on customer_id)

**RLS策略**：标准4条

### 4.2.9 inventory_record（库存变动记录表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| product_id | uuid | NOT NULL | - | 产品ID |
| product_name | varchar(255) | NOT NULL | - | 产品名称 |
| material | varchar(255) | - | - | 材质 |
| process | varchar(255) | - | - | 工艺 |
| workpiece_no | varchar(255) | - | - | 工件编号 |
| unit | varchar(255) | - | - | 单位 |
| change_type | varchar(255) | NOT NULL | - | 变动类型 |
| quantity_change | integer | NOT NULL | - | 数量变动 |
| weight_change | double precision | NOT NULL | - | 重量变动 |
| before_stock | integer | NOT NULL | - | 变动前库存 |
| after_stock | integer | NOT NULL | - | 变动后库存 |
| reference_no | varchar(255) | - | - | 关联单号 |
| customer_code | varchar(255) | - | - | 客户编码 |
| customer_name | varchar(255) | - | - | 客户名称 |
| operator | varchar(255) | NOT NULL | - | 操作人 |
| remark | text | - | - | 备注 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |
| before_stock_weight | double precision | NOT NULL | 0 | 变动前库存重量 |
| after_stock_weight | double precision | NOT NULL | 0 | 变动后库存重量 |
| attachments | text[] | - | - | 附件 |
| deleted_at | customTimestamptz | - | - | 软删除时间 |
| original_inbound_id | uuid | - | - | 原始入库单ID |

**索引**：
- `idx_inventory_record_original_inbound` (btree on original_inbound_id)
- `idx_inventory_record_product` (btree on product_id)

**RLS策略**：标准4条

### 4.2.10 outbound_order（出库单表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| outbound_no | varchar(255) | NOT NULL | - | 出库单号 |
| customer_id | uuid | NOT NULL | - | 客户ID |
| customer_name | varchar(255) | NOT NULL | - | 客户名称 |
| customer_code | varchar(255) | NOT NULL | - | 客户编码 |
| outbound_date | customTimestamptz | NOT NULL | - | 出库日期 |
| creator | varchar(255) | NOT NULL | - | 创建人 |
| receiver | varchar(255) | - | - | 收货人 |
| transporter | varchar(255) | - | - | 运输方 |
| plate_number | varchar(255) | - | - | 车牌号 |
| driver | varchar(255) | - | - | 司机 |
| total_amount | double precision | - | 0 | 总金额（元） |
| total_quantity | integer | - | 0 | 总数量 |
| total_weight | double precision | - | 0 | 总重量 |
| status | varchar(255) | - | 'pending_reconciliation' | 状态 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |
| reconciliation_id | uuid | - | - | 对账单ID |
| lock_status | varchar(50) | - | 'unlocked' | 锁定状态 |
| locked_at | customTimestamptz | - | - | 锁定时间 |
| total_amount_cents | integer | NOT NULL | 0 | 总金额（分） |
| cancelled_at | customTimestamptz | - | - | 撤销时间 |
| cancel_reason | text | - | - | 撤销原因 |
| version | integer | NOT NULL | 1 | 版本号 |

**索引**：
- `idx_outbound_order_customer` (btree on customer_id)
- `idx_outbound_order_reconciliation` (btree on reconciliation_id)

**RLS策略**：标准4条

### 4.2.11 undo_log（撤销日志表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| entity_type | varchar(255) | NOT NULL | - | 实体类型 |
| entity_id | uuid | NOT NULL | - | 实体ID |
| operator | userProfile | NOT NULL | - | 操作人 |
| reason | text | - | - | 撤销原因 |
| undo_time | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 撤销时间 |
| original_data | text | - | - | 原始数据（JSON） |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |
| status | varchar(255) | - | 'pending_approval' | 状态 |

**索引**：
- `idx_undo_log_entity` (btree on entity_type, entity_id)

**RLS策略**：标准4条

### 4.2.12 product_material_threshold（材质默认阈值表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| material | varchar(255) | NOT NULL | - | 材质名称 |
| default_threshold | integer | NOT NULL | 50 | 默认预警阈值 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_product_material` (btree on material)

**RLS策略**：标准4条

### 4.2.13 product_batch（产品批次表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| batch_no | varchar(255) | NOT NULL | - | 批次号（唯一） |
| product_id | uuid | NOT NULL | - | 产品ID |
| inbound_order_id | uuid | - | - | 入库单ID |
| quantity | integer | NOT NULL | - | 数量 |
| weight | double precision | - | 0 | 重量 |
| quality_status | varchar(50) | - | 'pending' | 质检状态 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |
| inbound_date | customTimestamptz | - | - | 入库日期 |

**索引**：
- `idx_product_batch_inbound` (btree on inbound_order_id)
- `idx_product_batch_inbound_date` (btree on inbound_date)
- `idx_product_batch_no` (唯一索引 on batch_no)
- `idx_product_batch_product` (btree on product_id)

**RLS策略**：标准4条

### 4.2.14 quality_inspection（质检记录表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| entity_type | varchar(255) | NOT NULL | - | 实体类型 |
| entity_id | uuid | NOT NULL | - | 实体ID |
| status | varchar(255) | - | 'pending' | 状态 |
| inspector | userProfile | - | - | 质检员 |
| inspection_date | customTimestamptz | - | - | 质检日期 |
| items | text | NOT NULL | - | 质检项目（JSON） |
| conclusion | text | - | - | 质检结论 |
| attachments | text[] | - | - | 附件 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_quality_inspection_entity` (btree on entity_type, entity_id)

**RLS策略**：标准4条

### 4.2.15 organization（组织表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| code | varchar(255) | NOT NULL | - | 组织编码 |
| name | varchar(255) | NOT NULL | - | 组织名称 |
| db_name | varchar(255) | NOT NULL | - | 数据库名 |
| db_host | varchar(255) | - | - | 数据库主机 |
| db_port | integer | - | 5432 | 数据库端口 |
| db_user | varchar(255) | - | - | 数据库用户名 |
| db_password | varchar(255) | - | - | 数据库密码 |
| status | varchar(255) | - | 'active' | 状态 |
| max_users | integer | - | 50 | 最大用户数 |
| max_storage_gb | integer | - | 10 | 最大存储(GB) |
| expires_at | customTimestamptz | - | - | 过期时间 |
| contact_name | varchar(255) | - | - | 联系人 |
| contact_phone | varchar(255) | - | - | 联系电话 |
| contact_email | varchar(255) | - | - | 联系邮箱 |
| description | text | - | - | 描述 |
| logo_url | text | - | - | Logo URL |
| is_active | boolean | - | true | 是否激活 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_org_code` (btree on code)
- `idx_org_status` (btree on status)

**RLS策略**：标准4条

### 4.2.16 inbound_order（入库单表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| inbound_no | varchar(255) | NOT NULL | - | 入库单号 |
| customer_id | uuid | NOT NULL | - | 客户ID |
| customer_name | varchar(255) | NOT NULL | - | 客户名称 |
| customer_code | varchar(255) | NOT NULL | - | 客户编码 |
| inbound_date | customTimestamptz | NOT NULL | - | 入库日期 |
| inbound_time | varchar(50) | - | - | 入库时间 |
| creator | varchar(255) | NOT NULL | - | 创建人 |
| receiver | varchar(255) | - | - | 收货人 |
| transporter | varchar(255) | - | - | 运输方 |
| plate_number | varchar(255) | - | - | 车牌号 |
| driver | varchar(255) | - | - | 司机 |
| total_amount | double precision | - | 0 | 总金额（元） |
| total_quantity | integer | - | 0 | 总数量 |
| total_weight | double precision | - | 0 | 总重量 |
| status | varchar(255) | - | 'active' | 状态 |
| total_amount_cents | integer | NOT NULL | 0 | 总金额（分） |
| cancelled_at | customTimestamptz | - | - | 撤销时间 |
| cancel_reason | text | - | - | 撤销原因 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_inbound_order_customer` (btree on customer_id)

**RLS策略**：标准5条（含"查看全部入库单数据"和"修改全部入库单数据"两条特化策略）

### 4.2.17 inbound_detail（入库明细表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| inbound_id | uuid | NOT NULL | - | 入库单ID |
| product_id | uuid | NOT NULL | - | 产品ID |
| product_name | varchar(255) | NOT NULL | - | 产品名称 |
| product_model | varchar(255) | - | - | 产品型号 |
| product_spec | varchar(255) | - | - | 产品规格 |
| unit | varchar(255) | - | - | 单位 |
| unit_price | double precision | - | 0 | 单价 |
| quantity | integer | NOT NULL | - | 数量 |
| weight | double precision | NOT NULL | - | 重量 |
| amount | double precision | - | 0 | 金额 |
| inbound_type | varchar(255) | - | - | 入库类型 |
| process | varchar(255) | - | - | 工艺 |
| material | varchar(255) | - | - | 材质 |
| tech_requirement | text | - | - | 技术要求 |
| urgent | boolean | - | false | 是否加急 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_inbound_detail_inbound` (btree on inbound_id)
- `idx_inbound_detail_product` (btree on product_id)

**RLS策略**：标准5条（含"查看全部入库明细数据"和"修改全部入库明细数据"两条特化策略）

### 4.2.18 product_batch_stock（批次库存表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| batch_id | uuid | NOT NULL | - | 批次ID |
| quantity_available | integer | NOT NULL | 0 | 可用数量 |
| weight_available | double precision | NOT NULL | 0 | 可用重量 |
| locked_quantity | integer | NOT NULL | 0 | 锁定数量 |
| locked_weight | double precision | NOT NULL | 0 | 锁定重量 |
| status | varchar(255) | - | 'active' | 状态 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_product_batch_stock_batch` (btree on batch_id)

**约束**：
- `check_batch_quantity_available_non_negative`：`quantity_available >= 0`
- `check_batch_weight_available_non_negative`：`weight_available >= 0`
- `check_batch_locked_quantity_non_negative`：`locked_quantity >= 0`
- `check_batch_locked_weight_non_negative`：`locked_weight >= 0`

**RLS策略**：标准4条

### 4.2.19 product_customer（产品客户关联表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| product_id | uuid | NOT NULL | - | 产品ID |
| customer_id | uuid | NOT NULL | - | 客户ID |
| is_active | boolean | - | true | 是否有效 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_product_customer_customer` (btree on customer_id)
- `idx_product_customer_product` (btree on product_id)

**RLS策略**：标准4条

### 4.2.20 statistics_daily（每日统计表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| stat_date | date | NOT NULL | - | 统计日期 |
| customer_id | uuid | - | - | 客户ID |
| product_id | uuid | - | - | 产品ID |
| inbound_quantity | integer | - | 0 | 入库数量 |
| inbound_weight | double precision | - | 0 | 入库重量 |
| outbound_quantity | integer | - | 0 | 出库数量 |
| outbound_weight | double precision | - | 0 | 出库重量 |
| stock_quantity | integer | - | 0 | 库存数量 |
| stock_weight | double precision | - | 0 | 库存重量 |
| amount | double precision | - | 0 | 金额 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_statistics_daily_customer` (btree on customer_id)
- `idx_statistics_daily_date` (btree on stat_date)
- `idx_statistics_daily_product` (btree on product_id)

**RLS策略**：标准4条

### 4.2.21 outbound_batch_detail（出库批次明细表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| outbound_detail_id | uuid | NOT NULL | - | 出库明细ID |
| batch_id | uuid | NOT NULL | - | 批次ID |
| quantity | integer | NOT NULL | - | 数量 |
| weight | double precision | NOT NULL | - | 重量 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**RLS策略**：标准4条

### 4.2.22 organization_user（组织用户关联表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| org_id | uuid | NOT NULL | - | 组织ID |
| user_id | varchar(255) | NOT NULL | - | 用户ID |
| role | varchar(255) | - | 'member' | 角色 |
| status | varchar(255) | - | 'active' | 状态 |
| joined_at | customTimestamptz | - | CURRENT_TIMESTAMP | 加入时间 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_org_user_org` (btree on org_id)
- `idx_org_user_org_user` (btree on org_id, user_id)
- `idx_org_user_user` (btree on user_id)

**外键**：
- `organization_user_org_id_fkey`：org_id → organization.id

**RLS策略**：标准4条

### 4.2.23 organization_invite（组织邀请码表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| org_id | uuid | NOT NULL | - | 组织ID |
| invite_code | varchar(255) | NOT NULL | - | 邀请码 |
| role | varchar(255) | - | 'member' | 角色 |
| max_uses | integer | - | 1 | 最大使用次数 |
| used_count | integer | - | 0 | 已使用次数 |
| expires_at | customTimestamptz | - | - | 过期时间 |
| created_by | varchar(255) | - | - | 创建者 |
| created_at | customTimestamptz | - | CURRENT_TIMESTAMP | 创建时间 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |

**索引**：
- `idx_org_invite_code` (btree on invite_code)
- `idx_org_invite_org` (btree on org_id)

**外键**：
- `organization_invite_org_id_fkey`：org_id → organization.id

**RLS策略**：标准4条

### 4.2.24 role_permission（角色权限表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | NOT NULL | random() | 主键 |
| role_name | varchar(255) | NOT NULL | - | 角色名称 |
| permission_code | varchar(255) | NOT NULL | - | 权限码 |
| is_active | boolean | - | true | 是否有效 |
| _created_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _created_by | userProfile | - | - | 系统字段 |
| _updated_at | customTimestamptz | NOT NULL | CURRENT_TIMESTAMP | 系统字段 |
| _updated_by | userProfile | - | - | 系统字段 |
| user_id | varchar(255) | - | - | 用户ID（用户专属权限时） |

**索引**：
- `idx_role_permission_permission` (btree on permission_code)
- `idx_role_permission_role` (btree on role_name)

**RLS策略**：标准4条

## 4.3 视图定义

### inventory_overdue_warning（库存超期预警视图）

```sql
SELECT
  p.id AS product_id,
  p.name AS product_name,
  pb.batch_no,
  pb.inbound_date,
  CURRENT_DATE - pb.inbound_date::date AS storage_days,
  p.max_storage_days,
  CASE
    WHEN (CURRENT_DATE - pb.inbound_date::date)::numeric > (p.max_storage_days::numeric * 1.2)
      THEN 'danger'::text
    WHEN (CURRENT_DATE - pb.inbound_date::date) > p.max_storage_days
      THEN 'warning'::text
    ELSE 'normal'::text
  END AS severity
FROM product p
JOIN product_batch pb ON p.id = pb.product_id
WHERE p.max_storage_days IS NOT NULL
  AND pb.inbound_date IS NOT NULL
  AND (CURRENT_DATE - pb.inbound_date::date)::numeric > (p.max_storage_days::numeric * 0.8)
```

**说明**：
- 关联 product 和 product_batch 表
- 计算每个批次的存放天数（storage_days）
- severity 分级：
  - `danger`：存放天数 > max_storage_days * 1.2
  - `warning`：存放天数 > max_storage_days
  - `normal`：存放天数 > max_storage_days * 0.8 但 <= max_storage_days
- 只返回存放天数超过 80% 最大存放天数的记录

## 4.4 表别名定义

文件末尾定义了以下表别名，供业务代码引用：

```typescript
export const approvalRequestTable = approvalRequest;
export const customerTable = customer;
export const inboundDetailTable = inboundDetail;
export const inboundOrderTable = inboundOrder;
export const inventoryRecordTable = inventoryRecord;
export const operationLogTable = operationLog;
export const organizationTable = organization;
export const organizationInviteTable = organizationInvite;
export const organizationUserTable = organizationUser;
export const outboundBatchDetailTable = outboundBatchDetail;
export const outboundDetailTable = outboundDetail;
export const outboundOrderTable = outboundOrder;
export const productTable = product;
export const productBatchTable = productBatch;
export const productBatchStockTable = productBatchStock;
export const productCustomerTable = productCustomer;
export const productMaterialThresholdTable = productMaterialThreshold;
export const qualityInspectionTable = qualityInspection;
export const reconciliationTable = reconciliation;
export const reconciliationDetailTable = reconciliationDetail;
export const reconciliationDetailVersionTable = reconciliationDetailVersion;
export const rolePermissionTable = rolePermission;
export const statisticsDailyTable = statisticsDaily;
export const undoLogTable = undoLog;
```

## 4.5 RLS策略统一说明

所有表都包含以下4条RLS策略：

| 策略名 | 角色 | 操作 | 条件 |
|--------|------|------|------|
| `service_role_bypass_policy` | service_role | ALL | `sql`true``（全通） |
| `修改全部数据` | authenticated | ALL | 无条件（authenticated全通） |
| `查看全部数据` | anon + authenticated | SELECT | 无条件（所有人可读） |
| `修改本人数据` | authenticated | ALL | 只能修改本人创建的数据 |

**注意**：inbound_order 和 inbound_detail 表额外包含2条特化策略：
- `查看全部入库单数据` / `修改全部入库单数据`（authenticated全通）
- `查看全部入库明细数据` / `修改全部入库明细数据`（authenticated全通）

---

# 第5章 前后端共享类型定义

文件：`shared/api.interface.ts`（824行）

## 5.1 通用类型

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
```

## 5.2 客户管理类型

```typescript
export interface Customer {
  id: string;
  code: string;
  name: string;
  contact?: string | null;
  phone?: string | null;
  address?: string | null;
  transport?: string | null;
  paymentTerm?: string | null;
  deliveryDirection?: string | null;
  settlement?: string | null;
  category?: string | null;
  inboundCount?: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedReason?: string | null;
}

export interface CreateCustomerDto {
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  transport?: string;
  paymentTerm?: string;
  deliveryDirection?: string;
  settlement?: string;
  category?: string;
  status?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  contact?: string;
  phone?: string;
  address?: string;
  transport?: string;
  paymentTerm?: string;
  deliveryDirection?: string;
  settlement?: string;
  category?: string;
  status?: string;
}
```

## 5.3 产品管理类型

```typescript
export interface Product {
  id: string;
  code: string;
  name: string;
  material?: string | null;
  process?: string | null;
  techRequirement?: string | null;
  workpieceNo?: string | null;
  unit?: string | null;
  unitPrice?: number;
  unitPriceCents?: number;
  customerCode: string;
  customerName: string;
  stock: number;
  stockWeight: number;
  inboundQuantity?: number;
  inboundWeight?: number;
  inboundDate?: string | null;
  batchNo?: string | null;
  status?: 'complete' | 'incomplete' | 'archived';
  version?: number;
  warningThreshold?: number;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  archivedAt?: string | null;
  archivedReason?: string | null;
}

export interface CreateProductDto {
  code: string;
  name: string;
  material?: string;
  process?: string;
  techRequirement?: string;
  workpieceNo?: string;
  unit?: string;
  unitPrice?: number;
  customerCode: string;
  customerName: string;
  status?: 'complete' | 'incomplete';
}

export interface UpdateProductDto {
  name?: string;
  material?: string;
  process?: string;
  techRequirement?: string;
  workpieceNo?: string;
  unit?: string;
  unitPrice?: number;
  customerCode?: string;
  customerName?: string;
  status?: string;
  stock?: number;
  inboundQuantity?: number;
  inboundWeight?: number;
  warningThreshold?: number;
  attachments?: string[];
}
```

## 5.4 库存管理类型

```typescript
export type InventoryChangeType =
  | 'inbound'
  | 'outbound'
  | 'outbound_rollback'
  | 'inbound_rollback'
  | 'adjustment_increase'
  | 'adjustment_decrease'
  | 'manual_increase'
  | 'manual_decrease'
  | 'inventory_profit'
  | 'inventory_loss'
  | 'damage'
  | 'quality_reject'
  | 'closed_balance'
  | 'return'
  | 'scrap'
  | 'rework';

export interface InventoryRecord {
  id: string;
  productId: string;
  productName: string;
  material?: string | null;
  process?: string | null;
  workpieceNo?: string | null;
  unit?: string | null;
  changeType: InventoryChangeType;
  quantityChange: number;
  weightChange: number;
  beforeStock: number;
  afterStock: number;
  beforeStockWeight: number;
  afterStockWeight: number;
  referenceNo?: string | null;
  customerCode?: string | null;
  customerName?: string | null;
  operator: string;
  remark: string;
  createdAt: string;
  attachments?: string[];
  originalInboundId?: string | null;
}

export interface InventorySummary {
  productId: string;
  productCode: string;
  productName: string;
  material?: string | null;
  process?: string | null;
  techRequirement?: string | null;
  workpieceNo?: string | null;
  unitPrice?: number;
  unit?: string | null;
  inboundQuantity?: number;
  inboundWeight?: number;
  currentStock: number;
  currentStockWeight: number;
  customerCode: string;
  customerName: string;
}

export interface AdjustStockDto {
  productId: string;
  quantityChange: number;
  weightChange?: number;
  operator: string;
  reason: 'inventory_profit' | 'inventory_loss' | 'damage' | 'quality_reject' | 'other';
  remark?: string;
  requiresApproval?: boolean;
}
```

## 5.5 出库单类型

```typescript
export type OutboundOrderStatus =
  | 'pending_reconciliation'
  | 'reconciled'
  | 'invoiced'
  | 'paid'
  | 'cancelled';

export type LockStatus = 'unlocked' | 'locked';

export interface OutboundOrder {
  id: string;
  outboundNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  outboundDate: string;
  creator: string;
  receiver?: string | null;
  transporter?: string | null;
  plateNumber?: string | null;
  driver?: string | null;
  totalAmount: number;
  totalAmountCents?: number;
  totalQuantity: number;
  totalWeight: number;
  status: OutboundOrderStatus;
  lockStatus: LockStatus;
  lockedAt?: string | null;
  reconciliationId?: string | null;
  details: OutboundDetail[];
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  version?: number;
}

export interface OutboundDetail {
  id: string;
  outboundId: string;
  productId: string;
  productName: string;
  workpieceNo?: string | null;
  material?: string | null;
  process?: string | null;
  unit?: string | null;
  unitPrice?: number;
  quantity: number;
  weight: number;
  amount: number;
  batchNo?: string | null;
  inboundDate?: string | null;
  createdAt: string;
}

export interface CreateOutboundOrderDto {
  outboundNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  outboundDate: string;
  creator: string;
  receiver?: string;
  transporter?: string;
  plateNumber?: string;
  driver?: string;
  totalAmount: number;
  totalQuantity: number;
  totalWeight: number;
  details: Array<{
    productId: string;
    productName: string;
    workpieceNo?: string;
    material?: string;
    process?: string;
    unit?: string;
    unitPrice?: number;
    quantity: number;
    weight: number;
    amount: number;
    batchNo?: string;
    inboundDate?: string;
  }>;
}
```

## 5.6 入库单类型

```typescript
export interface InboundOrder {
  id: string;
  inboundNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  inboundDate: string;
  inboundTime?: string;
  creator: string;
  internalCode?: string;
  receiver?: string;
  transporter?: string;
  plateNumber?: string;
  driver?: string;
  selfCode?: string;
  handler?: string;
  handleTime?: string;
  status: 'active' | 'cancelled';
  totalQuantity: number;
  totalWeight: number;
  totalAmount: number;
  details: InboundDetail[];
  createdAt: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
}

export interface InboundDetail {
  id: string;
  productId: string;
  productName: string;
  productModel?: string;
  productSpec?: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  weight: number;
  amount: number;
  inboundType?: string;
  process?: string;
  material?: string;
  techRequirement?: string;
  urgent?: boolean;
}
```

## 5.7 对账单类型

```typescript
export type ReconciliationStatus =
  | 'draft'        // 草稿 - 可编辑
  | 'confirmed'    // 已确认 - 待审核
  | 'audited'      // 已审核 - 待开票
  | 'invoiced'     // 已开票 - 待回款
  | 'partial_paid' // 部分回款
  | 'paid'         // 已回款 - 完成
  | 'cancelled'    // 已取消
  | 'voided';      // 已作废 - 反审核后状态

export interface Reconciliation {
  id: string;
  reconciliationNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  month: string;
  status: ReconciliationStatus;
  totalAmount: number;
  totalAmountCents: number;
  deductionAmount: number;
  deductionAmountCents: number;
  otherAmount: number;
  otherAmountCents: number;
  compensationAmount: number;
  compensationAmountCents: number;
  finalAmount: number;
  finalAmountCents: number;
  invoiceAmount: number;
  invoiceAmountCents: number;
  uninvoiceAmount: number;
  receiptAmount: number;
  receiptAmountCents: number;
  unreceivedAmount: number;
  auditor?: string | null;
  auditedAt?: string | null;
  details: ReconciliationDetail[];
  outboundOrderIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationDetail {
  id: string;
  reconciliationId: string;
  outboundNo: string;
  outboundDate: string;
  productName: string;
  workpieceNo?: string | null;
  material?: string | null;
  process?: string | null;
  quantity: number;
  weight: number;
  unitPrice: number;
  amount: number;
  unit: string;
  createdAt: string;
}

export interface CreateReconciliationDto {
  reconciliationNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  month: string;
  status?: string;
  totalAmount: number;
  deductionAmount?: number;
  otherAmount?: number;
  compensationAmount?: number;
  finalAmount: number;
  outboundOrderIds: string[];
  details: Array<{
    outboundNo: string;
    outboundDate: string;
    productName: string;
    workpieceNo?: string;
    material?: string;
    process?: string;
    quantity: number;
    weight: number;
    unitPrice?: number;
    amount: number;
    unit?: string;
  }>;
}
```

## 5.8 撤销操作类型

```typescript
export interface UndoCheckResult {
  canUndo: boolean;
  reason?: string;
  remainingSeconds?: number;
  usedBatches?: { batchNo: string; usedQty: number }[];
}

export interface UndoLog {
  id: string;
  entityType: string;
  entityId: string;
  operator: string;
  reason?: string | null;
  undoTime: string;
  originalData?: string | null;
  createdAt: string;
}
```

## 5.9 操作日志类型

```typescript
export interface OperationLog {
  id: string;
  entityType: string;
  entityId: string;
  operation: string;
  operator: string;
  beforeState?: string | null;
  afterState?: string | null;
  source: string;
  ipAddress?: string | null;
  createdAt: string;
}
```

## 5.10 批次管理类型

```typescript
export interface ProductBatch {
  id: string;
  batchNo: string;
  productId: string;
  inboundOrderId?: string | null;
  quantity: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export interface BatchStockInfo {
  batchId: string;
  batchNo: string;
  quantityAvailable: number;
  weightAvailable: number;
  lockedQuantity: number;
  lockedWeight: number;
  status: 'active' | 'locked' | 'depleted' | 'expired';
}

export interface OutboundBatchSelection {
  batchId: string;
  batchNo: string;
  quantity: number;
  weight: number;
  inboundDate: string;
}
```

## 5.11 库存预警类型

```typescript
export interface InventoryWarningConfig {
  productId: string;
  warningThreshold: number;
  warningWeightThreshold?: number;
  maxStorageDays: number;
}

export interface InventoryOverdueWarning {
  productId: string;
  productName: string;
  batchNo: string;
  inboundDate: string;
  storageDays: number;
  maxStorageDays: number;
  severity: 'warning' | 'danger';
}
```

## 5.12 审批流程类型

```typescript
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalType = 'stock_adjust' | 'inbound_undo' | 'outbound_undo' | 'reconciliation_cancel';

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  entityType: string;
  entityId: string;
  requester: string;
  approver?: string | null;
  status: ApprovalStatus;
  reason: string;
  requestedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectReason?: string | null;
}
```

## 5.13 金额校验类型

```typescript
export interface AmountValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    receiptAmount: number;
    invoiceAmount: number;
    finalAmount: number;
    remainingInvoice: number;
    remainingReceipt: number;
  };
}
```

## 5.14 材质阈值类型

```typescript
export interface ProductMaterialThreshold {
  id: string;
  material: string;
  defaultThreshold: number;
  createdAt: string;
  updatedAt: string;
}
```

## 5.15 Dashboard类型

```typescript
export interface DashboardStats {
  period: 'today' | 'week' | 'month' | 'year';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  stats: {
    inbound: {
      count: number;
      quantity: number;
      weight: number;
      amount: number;
      growth: {
        count: number;
        quantity: number;
      };
    };
    outbound: {
      count: number;
      quantity: number;
      weight: number;
      amount: number;
      growth: {
        count: number;
        amount: number;
      };
    };
    inventory: {
      totalStock: number;
      totalWeight: number;
      productCount: number;
      lowStockCount: number;
      zeroStockCount: number;
    };
    customers: {
      total: number;
      active: number;
      new: number;
    };
    pending: {
      reconciliation: number;
      receiptOrders: number;
      receiptAmount: number;
    };
  };
}

export interface RealtimeStats {
  today: {
    inbound: {
      count: number;
      weight: number;
    };
    outbound: {
      count: number;
      weight: number;
    };
  };
  alerts: {
    lowStock: Array<{
      id: string;
      code: string;
      name: string;
      stock: number;
      warningThreshold: number;
      customerName: string;
    }>;
  };
}

export interface DashboardActivity {
  id: string;
  type: 'inbound' | 'outbound' | 'product' | 'customer' | 'inventory' | 'reconciliation' | 'system';
  user: string;
  action: string;
  time: string;
}

export interface DashboardAlerts {
  inventory: {
    lowStock: number;
    overdue: number;
  };
  finance: {
    pendingReconciliation: number;
    pendingReceiptOrders: number;
    pendingReceiptAmount: number;
  };
}

export interface DashboardTrends {
  date: string;
  inbound: {
    count: number;
    weight: number;
    amount: number;
  };
  outbound: {
    count: number;
    weight: number;
    amount: number;
  };
}
```

## 5.16 权限管理类型

```typescript
export type PermissionCode =
  | 'customer:view' | 'customer:create' | 'customer:update' | 'customer:delete'
  | 'product:view' | 'product:create' | 'product:update' | 'product:delete'
  | 'inbound:view' | 'inbound:create' | 'inbound:undo'
  | 'outbound:view' | 'outbound:create' | 'outbound:delete' | 'outbound:undo'
  | 'inventory:view' | 'inventory:adjust'
  | 'reconciliation:view' | 'reconciliation:create' | 'reconciliation:audit' | 'reconciliation:unaudit'
  | 'statistics:view'
  | 'system:settings' | 'system:permission';

export interface UserPermissions {
  permissions: PermissionCode[];
  roles: string[];
}
```

## 5.17 单据查询类型

```typescript
export type OrderStatusFilter = 'active' | 'cancelled' | 'all';

export interface IOrderStatusStats {
  total: number;
  active: number;
  cancelled: number;
}

export interface IInboundOrderQueryParams {
  customerId?: string;
  status?: OrderStatusFilter;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface IOutboundOrderQueryParams {
  customerId?: string;
  status?: OrderStatusFilter;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface IInboundOrderListResponse {
  items: InboundOrder[];
  stats: IOrderStatusStats;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface IOutboundOrderListResponse {
  items: OutboundOrder[];
  stats: IOrderStatusStats;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

## 5.18 对账单操作校验类型

```typescript
export interface ReconciliationActionCheckResult {
  allowed: boolean;
  reason?: string;
  invoiceCount?: number;
  receiptCount?: number;
}

export interface ReconciliationCalculationDetail {
  baseAmount: number;
  deductionAmount: number;
  deductionReason?: string;
  otherAmount: number;
  otherReason?: string;
  compensationAmount: number;
  compensationReason?: string;
  finalAmount: number;
  invoiceAmount: number;
  uninvoiceAmount: number;
  receiptAmount: number;
  unreceivedAmount: number;
  invoiceCount: number;
  receiptCount: number;
  formula: string;
}
```

## 5.19 客户活跃度类型

```typescript
export interface CustomerActivityStats {
  customerId: string;
  customerName: string;
  totalInboundCount: number;
  monthlyInboundCount: number;
  lastInboundDate?: string | null;
  status: 'active' | 'normal' | 'silent';
}

export interface CustomerDeactivateCheckResult {
  canDeactivate: boolean;
  pendingOutboundCount: number;
  pendingReconciliationAmount: number;
  reason?: string;
}
```

## 5.20 API响应类型

```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

# 第6章 系统配置常量

文件：`server/config/constants.ts`（80行）

## 6.1 撤销窗口配置

```typescript
export const UNDO_WINDOW = {
  /** 出库单撤销窗口时间（毫秒） */
  OUTBOUND: 30 * 60 * 1000, // 30分钟
  /** 入库单撤销窗口时间（毫秒） */
  INBOUND: 30 * 60 * 1000, // 30分钟
};
```

## 6.2 分页配置

```typescript
export const PAGINATION = {
  /** 默认每页条数 */
  DEFAULT_PAGE_SIZE: 100,
  /** 最大每页条数 */
  MAX_PAGE_SIZE: 500,
  /** 默认页码 */
  DEFAULT_PAGE: 1,
};
```

## 6.3 乐观锁配置

```typescript
export const OPTIMISTIC_LOCK = {
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 基础重试延迟（毫秒） */
  BASE_DELAY_MS: 100,
};
```

## 6.4 批次号配置

```typescript
export const BATCH_CONFIG = {
  /** UUID前缀长度 */
  UUID_PREFIX_LENGTH: 8,
  /** 批次号格式: ${customerCode}-${YYMMDD}-${UUID_PREFIX} */
};
```

## 6.5 金额精度配置

```typescript
export const CURRENCY = {
  /** 元转分倍数 */
  CENTS_PER_YUAN: 100,
  /** 小数位数 */
  DECIMAL_PLACES: 2,
};
```

## 6.6 状态枚举

```typescript
export const ORDER_STATUS = {
  /** 出库单状态 */
  OUTBOUND: {
    PENDING_RECONCILIATION: 'pending_reconciliation',
    RECONCILED: 'reconciled',
    INVOICED: 'invoiced',
    PAID: 'paid',
    CANCELLED: 'cancelled',
  },
  /** 对账单状态 */
  RECONCILIATION: {
    DRAFT: 'draft',
    CONFIRMED: 'confirmed',
    AUDITED: 'audited',
    INVOICED: 'invoiced',
    PAID: 'paid',
  },
  /** 锁状态 */
  LOCK: {
    UNLOCKED: 'unlocked',
    LOCKED: 'locked',
  },
};
```

## 6.7 库存变动类型

```typescript
export const INVENTORY_CHANGE_TYPE = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
  OUTBOUND_ROLLBACK: 'outbound_rollback',
  ADJUSTMENT: 'adjustment',
  MANUAL_INCREASE: 'manual_increase',
  MANUAL_DECREASE: 'manual_decrease',
};
```

---

<!-- BATCH_1_END -->

---

# 第7章 后端Common工具与中间件

## 7.1 全局异常过滤器

文件：`server/common/filters/global-exception.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const resp = response as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
        code = (resp.code as string) || code;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    // 记录请求上下文
    this.logger.error(
      JSON.stringify({
        path: request.url,
        method: request.method,
        status,
        code,
        message,
        timestamp: new Date().toISOString(),
      }),
    );

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

**异常处理策略**：
- 所有异常统一捕获，返回标准 JSON 格式
- HttpException 子类提取 status 和 message
- 非 HttpException 统一为 500
- 所有异常记录请求路径、方法、状态码、错误消息和时间戳

## 7.2 通用常量

文件：`server/common/constants/index.ts`

```typescript
export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const DEFAULT_VALUES = {
  PAGE_SIZE: 100,
  PAGE: 1,
  WARNING_THRESHOLD: 50,
  MAX_STORAGE_DAYS: 180,
  UNIT_PRICE_DEFAULT: 0,
  STOCK_DEFAULT: 0,
  VERSION_INITIAL: 1,
} as const;

export const ENTITY_TYPES = {
  CUSTOMER: 'customer',
  PRODUCT: 'product',
  INBOUND_ORDER: 'inbound_order',
  OUTBOUND_ORDER: 'outbound_order',
  RECONCILIATION: 'reconciliation',
  INVENTORY: 'inventory',
} as const;

export const OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  UNDO: 'undo',
  AUDIT: 'audit',
  UNAUDIT: 'unaudit',
  LOCK: 'lock',
  UNLOCK: 'unlock',
} as const;
```

## 7.3 通用工具函数

文件：`server/common/utils/index.ts`

### 金额转换工具

```typescript
import { CURRENCY } from '../../config/constants';

/**
 * 元转分（安全整数运算）
 */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * CURRENCY.CENTS_PER_YUAN);
}

/**
 * 分转元
 */
export function centsToYuan(cents: number): number {
  return cents / CURRENCY.CENTS_PER_YUAN;
}

/**
 * 格式化金额（保留2位小数）
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(CURRENCY.DECIMAL_PLACES);
}
```

### 批次号生成工具

```typescript
/**
 * 生成批次号
 * 格式: 客户编码-YYMMDD-8位UUID前缀
 */
export function generateBatchNo(customerCode: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const uuidPrefix = uuidv4().replace(/-/g, '').slice(0, 8);
  return `${customerCode}-${year}${month}${day}-${uuidPrefix}`;
}
```

### 单号生成工具

```typescript
/**
 * 生成入库单号
 * 格式: IN-YYYYMMDD-6位序号
 */
export function generateInboundNo(): string {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const seq = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `IN-${dateStr}-${seq}`;
}

/**
 * 生成出库单号
 * 格式: OUT-YYYYMMDD-6位序号
 */
export function generateOutboundNo(): string {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const seq = Math.floor(Math.random() * 1000000).toString().padStart(2, '0');
  return `OUT-${dateStr}-${seq}`;
}

/**
 * 生成对账单号
 * 格式: REC-客户编码-YYYYMM
 */
export function generateReconciliationNo(customerCode: string, month: string): string {
  return `REC-${customerCode}-${month}`;
}
```

### 日期工具

```typescript
/**
 * 获取当前月份的起止时间
 */
export function getMonthRange(month: string): { start: Date; end: Date } {
  // month 格式: YYYY-MM
  const [year, monthNum] = month.split('-').map(Number);
  const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * 计算日期差（天数）
 */
export function daysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

## 7.4 租户中间件

文件：`server/common/middleware/tenant.middleware.ts`

```typescript
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantConnectionService } from '../../modules/tenant/tenant-connection.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly tenantConnectionService: TenantConnectionService) {}

  async use(req: Request & { tenantDb?: any }, res: Response, next: NextFunction) {
    try {
      // 1. 从请求头获取组织编码
      const orgCode = req.headers['x-organization-code'] as string;

      if (!orgCode) {
        // 无组织编码时允许部分公开路由
        return next();
      }

      // 2. 获取租户数据库连接
      const db = await this.tenantConnectionService.getConnection(orgCode);

      // 3. 附加到请求对象
      req.tenantDb = db;
      req.orgCode = orgCode;

      next();
    } catch (error) {
      this.logger.error(`Tenant middleware error: ${error.message}`, error.stack);
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_DB_ERROR',
          message: '租户数据库连接失败',
        },
      });
    }
  }
}
```

**中间件执行流程**：
1. 从请求头 `X-Organization-Code` 提取组织编码
2. 无组织编码时允许通过（部分公开路由如登录、组织列表）
3. 有组织编码时调用 `TenantConnectionService.getConnection()` 获取租户数据库连接
4. 将数据库连接挂载到 `req.tenantDb`，组织编码挂载到 `req.orgCode`
5. 出错时返回 500 错误

## 7.5 租户装饰器

文件：`server/common/decorators/tenant.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      orgCode: request.orgCode,
      db: request.tenantDb,
    };
  },
);

export const CurrentTenantDb = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantDb;
  },
);
```

## 7.6 通用接口定义

文件：`server/common/interfaces/index.ts`

```typescript
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userContext: {
    userId: string;
    tenantId: string;
    appId: string;
    env: 'preview' | 'runtime';
    userName: string;
    userNameEn: string;
    userNameI18n: string;
    roles?: string[];
  };
  tenantDb: any;
  orgCode?: string;
}

export interface BatchOperationResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ index: number; message: string }>;
}
```

## 7.7 日志拦截器

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(`${method} ${url} ${duration}ms`);
      }),
    );
  }
}
```

---

# 第8章 后端业务模块（上）

## 8.1 客户管理模块（Customer Module）

### 8.1.1 模块文件

文件：`server/modules/customer/customer.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
```

### 8.1.2 控制器

文件：`server/modules/customer/customer.controller.ts`

```typescript
@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async list(@Query() query: CustomerQueryParams) {
    return this.customerService.findAll(query);
  }

  @Get('active')
  async listActive() {
    return this.customerService.findActive();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.customerService.findById(id);
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto, req.userContext.userId);
  }

  @Post('batch')
  async batchCreate(@Req() req: AuthenticatedRequest, @Body() items: CreateCustomerDto[]) {
    return this.customerService.batchCreate(items, req.userContext.userId);
  }

  @Post('import')
  async importCustomers(@Req() req: AuthenticatedRequest, @Body() data: { items: CreateCustomerDto[] }) {
    return this.customerService.importCustomers(data.items, req.userContext.userId);
  }

  @Put(':id')
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto, req.userContext.userId);
  }

  @Delete(':id')
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.customerService.delete(id, body.reason, req.userContext.userId);
  }

  @Post('batch-delete')
  async batchDelete(@Req() req: AuthenticatedRequest, @Body() data: { ids: string[]; reason: string }) {
    return this.customerService.batchDelete(data.ids, data.reason, req.userContext.userId);
  }

  @Get(':id/activities')
  async getActivities(@Param('id') id: string) {
    return this.customerService.getActivities(id);
  }

  @Get(':id/check-deactivate')
  async checkDeactivate(@Param('id') id: string) {
    return this.customerService.checkDeactivate(id);
  }

  @Put(':id/deactivate')
  async deactivate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.customerService.deactivate(id, req.userContext.userId);
  }

  @Put(':id/activate')
  async activate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.customerService.activate(id, req.userContext.userId);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string, @Query('period') period: string) {
    return this.customerService.getStats(id, period);
  }
}
```

**API路由清单**：

| 方法 | 路径 | 功能 | 说明 |
|------|------|------|------|
| GET | `/api/customers` | 客户列表 | 支持分页、关键词搜索、状态筛选 |
| GET | `/api/customers/active` | 活跃客户列表 | 仅返回 status=active 的客户 |
| GET | `/api/customers/:id` | 客户详情 | 返回完整客户信息 |
| POST | `/api/customers` | 创建客户 | 需登录 |
| POST | `/api/customers/batch` | 批量创建 | 用于Excel导入 |
| POST | `/api/customers/import` | 导入客户 | Excel批量导入入口 |
| PUT | `/api/customers/:id` | 更新客户 | 需登录 |
| DELETE | `/api/customers/:id` | 软删除客户 | 需提供删除原因 |
| POST | `/api/customers/batch-delete` | 批量删除 | 跨页全选删除 |
| GET | `/api/customers/:id/activities` | 客户活动记录 | 入库/出库历史 |
| GET | `/api/customers/:id/check-deactivate` | 检查是否可停用 | 返回待处理出库/对账数 |
| PUT | `/api/customers/:id/deactivate` | 停用客户 | 设为 inactive |
| PUT | `/api/customers/:id/activate` | 激活客户 | 设为 active |
| GET | `/api/customers/:id/stats` | 客户统计 | 支持周期参数 |

### 8.1.3 服务层

文件：`server/modules/customer/customer.service.ts`

**核心方法清单**：

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `findAll` | query: CustomerQueryParams | PaginatedResponse<Customer> | 分页查询客户列表，支持关键词搜索和状态筛选 |
| `findById` | id: string | Customer | 根据ID查询客户详情 |
| `findActive` | - | Customer[] | 获取所有活跃客户 |
| `create` | dto: CreateCustomerDto, userId: string | Customer | 创建客户，自动生成编码 |
| `batchCreate` | items: CreateCustomerDto[], userId: string | BatchOperationResult | 批量创建客户 |
| `importCustomers` | items: CreateCustomerDto[], userId: string | BatchOperationResult | Excel导入客户，重复code跳过 |
| `update` | id, dto, userId | Customer | 更新客户信息 |
| `delete` | id, reason, userId | void | 软删除客户（设置 deleted_at 和 deleted_reason） |
| `batchDelete` | ids[], reason, userId | BatchOperationResult | 批量软删除 |
| `getActivities` | id | Activity[] | 获取客户活动记录（入库+出库历史） |
| `checkDeactivate` | id | CustomerDeactivateCheckResult | 检查待处理出库数和对账金额 |
| `deactivate` | id, userId | void | 停用客户 |
| `activate` | id, userId | void | 激活客户 |
| `getStats` | id, period | CustomerStats | 获取客户统计（收发货量、金额等） |

**关键实现细节**：

`findAll` 方法查询条件构建：
```typescript
async findAll(query: CustomerQueryParams): Promise<PaginatedResponse<Customer>> {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const pageSize = Math.min(query.pageSize || PAGINATION.DEFAULT_PAGE_SIZE, PAGINATION.MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  const conditions = [isNull(customer.deletedAt)]; // 软删除过滤

  if (query.keyword) {
    conditions.push(
      or(
        ilike(customer.name, `%${query.keyword}%`),
        ilike(customer.code, `%${query.keyword}%`),
        ilike(customer.contact, `%${query.keyword}%`),
        ilike(customer.phone, `%${query.keyword}%`),
      )
    );
  }

  if (query.status) {
    conditions.push(eq(customer.status, query.status));
  }

  const [items, totalResult] = await Promise.all([
    this.db.select().from(customer)
      .where(and(...conditions))
      .orderBy(desc(customer.createdAt))
      .limit(pageSize).offset(offset),
    this.db.select({ count: count() }).from(customer)
      .where(and(...conditions)),
  ]);

  return {
    items: items.map(this.mapToCustomer),
    total: Number(totalResult[0]?.count || 0),
    page,
    pageSize,
  };
}
```

`delete` 方法软删除实现：
```typescript
async delete(id: string, reason: string, userId: string): Promise<void> {
  const result = await this.db.update(customer)
    .set({
      deletedAt: new Date(),
      deletedReason: reason,
      status: 'inactive',
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(customer.id, id), isNull(customer.deletedAt)))
    .returning({ id: customer.id });

  if (result.length === 0) {
    throw new NotFoundException('客户不存在或已删除');
  }

  // 记录操作日志
  await this.logOperation(id, 'delete', userId, { reason });
}
```

`checkDeactivate` 方法实现：
```typescript
async checkDeactivate(id: string): Promise<CustomerDeactivateCheckResult> {
  // 查询该客户的未完成出库单
  const pendingOutbounds = await this.db.select({ count: count() })
    .from(outboundOrder)
    .where(and(
      eq(outboundOrder.customerId, id),
      eq(outboundOrder.status, 'pending_reconciliation'),
      isNull(outboundOrder.cancelledAt),
    ));

  // 查询该客户的待对账金额
  const pendingReconciliation = await this.db.select({
    totalAmount: sql<number>`COALESCE(SUM(${reconciliation.totalAmount}), 0)`,
  })
    .from(reconciliation)
    .where(and(
      eq(reconciliation.customerId, id),
      eq(reconciliation.status, 'audited'),
    ));

  const pendingOutboundCount = Number(pendingOutbounds[0]?.count || 0);
  const pendingReconciliationAmount = Number(pendingReconciliation[0]?.totalAmount || 0);

  return {
    canDeactivate: pendingOutboundCount === 0 && pendingReconciliationAmount === 0,
    pendingOutboundCount,
    pendingReconciliationAmount,
  };
}
```

## 8.2 产品管理模块（Product Module）

### 8.2.1 模块文件

```typescript
@Module({
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
```

### 8.2.2 控制器

文件：`server/modules/product/product.controller.ts`

**API路由清单**：

| 方法 | 路径 | 功能 | 说明 |
|------|------|------|------|
| GET | `/api/products` | 产品列表 | 分页+搜索+筛选（材质/工艺/客户） |
| GET | `/api/products/active` | 活跃产品列表 | status=complete 的产品 |
| GET | `/api/products/by-customer/:code` | 按客户查产品 | 返回该客户的所有产品 |
| GET | `/api/products/:id` | 产品详情 | 含完整字段 |
| POST | `/api/products` | 创建产品 | 自动计算 status (complete/incomplete) |
| POST | `/api/products/batch` | 批量创建 | Excel导入 |
| POST | `/api/products/import` | 导入产品 | Excel批量导入 |
| PUT | `/api/products/:id` | 更新产品 | 乐观锁校验 version |
| DELETE | `/api/products/:id` | 归档产品 | 设置 archived_at + archived_reason |
| POST | `/api/products/batch-delete` | 批量归档 | 跨页全选 |
| PUT | `/api/products/:id/archive` | 归档产品（新接口） | 替代 DELETE |
| GET | `/api/products/:id/batches` | 产品批次列表 | 返回所有批次信息 |
| GET | `/api/products/materials/list` | 材质列表 | 去重后的所有材质 |
| GET | `/api/products/processes/list` | 工艺列表 | 去重后的所有工艺 |
| POST | `/api/products/material-thresholds` | 设置材质阈值 | 批量设置材质默认阈值 |
| GET | `/api/products/material-thresholds` | 获取材质阈值 | 返回所有材质阈值配置 |
| GET | `/api/products/:id/stats` | 产品统计 | 入库/出库历史统计 |
| GET | `/api/products/export` | 导出Excel | 全量产品导出 |
| GET | `/api/products/:id/quality-inspections` | 质检记录 | 返回质检历史 |
| POST | `/api/products/:id/quality-inspections` | 创建质检记录 | - |

### 8.2.3 服务层

**核心方法清单**：

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `findAll` | query | PaginatedResponse<Product> | 分页查询，支持材质/工艺/客户/关键词筛选 |
| `findById` | id | Product | 查询产品详情 |
| `findActive` | - | Product[] | 获取所有活跃产品 |
| `findByCustomer` | customerCode | Product[] | 按客户编码查询产品列表 |
| `create` | dto, userId | Product | 创建产品，自动判定 status |
| `batchCreate` | items[], userId | BatchOperationResult | 批量创建产品 |
| `update` | id, dto, userId | Product | 更新产品（乐观锁校验） |
| `archive` | id, reason, userId | void | 归档产品 |
| `batchArchive` | ids[], reason, userId | BatchOperationResult | 批量归档 |
| `getBatches` | id | ProductBatch[] | 获取产品所有批次 |
| `getMaterials` | - | string[] | 去重材质列表 |
| `getProcesses` | - | string[] | 去重工艺列表 |
| `setMaterialThresholds` | items[], userId | void | 批量设置材质阈值 |
| `getMaterialThresholds` | - | MaterialThreshold[] | 获取所有材质阈值 |
| `getStats` | id, period | ProductStats | 产品统计 |
| `getQualityInspections` | id | QualityInspection[] | 获取质检记录 |
| `createQualityInspection` | id, dto, userId | QualityInspection | 创建质检记录 |

**关键实现细节**：

`create` 方法自动判定 status：
```typescript
async create(dto: CreateProductDto, userId: string): Promise<Product> {
  // 判断产品状态：必填字段（code/name/customerCode/customerName）齐全为 complete
  const isComplete = !!(dto.code && dto.name && dto.customerCode && dto.customerName);
  const status = isComplete ? 'complete' : 'incomplete';

  // 元转分
  const unitPriceCents = dto.unitPrice ? yuanToCents(dto.unitPrice) : 0;

  // 获取材质默认阈值
  let warningThreshold = DEFAULT_VALUES.WARNING_THRESHOLD;
  if (dto.material) {
    const threshold = await this.db.select()
      .from(productMaterialThreshold)
      .where(eq(productMaterialThreshold.material, dto.material))
      .limit(1);
    if (threshold.length > 0) {
      warningThreshold = threshold[0].defaultThreshold;
    }
  }

  const [product] = await this.db.insert(productTable).values({
    ...dto,
    unitPriceCents,
    status,
    stock: 0,
    stockWeight: 0,
    warningThreshold,
    maxStorageDays: DEFAULT_VALUES.MAX_STORAGE_DAYS,
    version: DEFAULT_VALUES.VERSION_INITIAL,
    createdBy: userId,
    updatedBy: userId,
  }).returning();

  return this.mapToProduct(product);
}
```

`update` 方法乐观锁校验：
```typescript
async update(id: string, dto: UpdateProductDto, userId: string): Promise<Product> {
  let retries = 0;
  while (retries < OPTIMISTIC_LOCK.MAX_RETRIES) {
    const [current] = await this.db.select().from(productTable)
      .where(eq(productTable.id, id));

    if (!current) throw new NotFoundException('产品不存在');

    const updateData = { ...dto, updatedAt: new Date(), updatedBy: userId };
    if (dto.unitPrice !== undefined) {
      updateData.unitPriceCents = yuanToCents(dto.unitPrice);
    }

    const result = await this.db.update(productTable)
      .set(updateData)
      .where(and(
        eq(productTable.id, id),
        eq(productTable.version, current.version),
      ))
      .returning();

    if (result.length > 0) {
      return this.mapToProduct(result[0]);
    }

    retries++;
    await new Promise(resolve => setTimeout(resolve, OPTIMISTIC_LOCK.BASE_DELAY_MS * Math.pow(2, retries)));
  }

  throw new ConflictException('产品更新冲突，请重试');
}
```

## 8.3 入库管理模块（Inbound Module）

### 8.3.1 控制器

**API路由清单**：

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/inbound` | 入库单列表（分页+筛选） |
| GET | `/api/inbound/:id` | 入库单详情（含明细） |
| POST | `/api/inbound` | 创建入库单 |
| PUT | `/api/inbound/:id` | 更新入库单 |
| POST | `/api/inbound/:id/cancel` | 撤销入库单（30分钟窗口） |
| GET | `/api/inbound/stats/today` | 今日入库统计 |
| GET | `/api/inbound/stats/period` | 指定时段入库统计 |
| GET | `/api/inbound/export` | 导出入库单Excel |
| POST | `/api/inbound/import` | Excel批量导入 |

### 8.3.2 服务层关键逻辑

**创建入库单 `create` 方法完整流程**：

```
1. 生成入库单号 (generateInboundNo)
2. 计算总数量、总重量、总金额
3. 元转分：totalAmountCents = yuanToCents(totalAmount)
4. 插入入库单主表 (inbound_order)
5. 遍历明细：
   a. 为每个产品生成批次号
   b. 插入产品批次表 (product_batch)
   c. 插入批次库存表 (product_batch_stock)
   d. 更新产品表库存 (product.stock += quantity, stockWeight += weight)
   e. 更新产品累计入库量 (inboundQuantity += quantity, inboundWeight += weight)
   f. 更新产品最后入库日期 (inboundDate)
   g. 更新产品当前批次号 (batchNo)
   h. 更新产品版本号 (version + 1)（乐观锁）
   i. 插入入库明细表 (inbound_detail)
   j. 插入库存变动记录 (inventory_record, change_type='inbound')
   k. 插入产品客户关联 (product_customer, 如不存在)
6. 更新客户累计入库次数 (inboundCount + 1, inboundCountMonthly + 1)
7. 更新客户最后入库日期 (lastInboundDate)
8. 记录操作日志 (operation_log, operation='create')
9. 返回完整入库单（含明细）
```

**撤销入库单 `cancel` 方法完整流程**：

```
1. 查询入库单，验证存在性和状态 (status != 'cancelled')
2. 检查撤销窗口：now - createdAt <= UNDO_WINDOW.INBOUND (30分钟)
   a. 超时 → 抛 ConflictException('入库单已超过30分钟撤销窗口')
3. 检查明细中的批次是否已被使用（出库扣减过）
   a. 遍历每个批次，检查 product_batch_stock.quantityAvailable < batch.quantity
   b. 如有批次被使用 → 抛 ConflictException，返回 usedBatches 列表
4. 事务操作：
   a. 更新入库单状态为 cancelled，设置 cancelledAt 和 cancelReason
   b. 遍历明细：
      - 更新产品库存 (stock -= quantity, stockWeight -= weight)
      - 校验 stock >= 0（不应为负）
      - 更新产品版本号
      - 删除或标记批次为 depleted
      - 更新批次库存为 0
      - 插入库存变动记录 (change_type='inbound_rollback')
   c. 更新客户入库次数 (inboundCount - 1)
5. 记录撤销日志 (undo_log)
6. 记录操作日志 (operation_log, operation='undo')
7. 返回撤销结果
```

**今日统计 `getTodayStats` 方法**：
```typescript
async getTodayStats(): Promise<{ count: number; weight: number; quantity: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await this.db.select({
    count: count(),
    weight: sql<number>`COALESCE(SUM(${inboundOrder.totalWeight}), 0)`,
    quantity: sql<number>`COALESCE(SUM(${inboundOrder.totalQuantity}), 0)`,
  })
  .from(inboundOrder)
  .where(and(
    gte(inboundOrder.inboundDate, today),
    lt(inboundOrder.inboundDate, tomorrow),
    eq(inboundOrder.status, 'active'),
  ));

  return {
    count: Number(result[0]?.count || 0),
    weight: Number(result[0]?.weight || 0),
    quantity: Number(result[0]?.quantity || 0),
  };
}
```

## 8.4 出库管理模块（Outbound Module）

### 8.4.1 控制器

**API路由清单**：

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/outbound` | 出库单列表（分页+筛选） |
| GET | `/api/outbound/:id` | 出库单详情（含明细+批次明细） |
| POST | `/api/outbound` | 创建出库单 |
| PUT | `/api/outbound/:id` | 更新出库单 |
| POST | `/api/outbound/:id/cancel` | 撤销出库单（30分钟窗口） |
| GET | `/api/outbound/stats/today` | 今日出库统计 |
| GET | `/api/outbound/stats/period` | 指定时段出库统计 |
| GET | `/api/outbound/export` | 导出出库单Excel |
| POST | `/api/outbound/import` | Excel批量导入 |
| GET | `/api/outbound/recommend-batches` | 智能批次推荐 |
| GET | `/api/outbound/customer-stocks/:customerCode` | 客户库存列表 |

### 8.4.2 服务层关键逻辑

**创建出库单 `create` 方法完整流程**：

```
1. 生成出库单号 (generateOutboundNo)
2. 计算总数量、总重量、总金额
3. 元转分：totalAmountCents = yuanToCents(totalAmount)
4. 事务操作：
   a. 插入出库单主表 (outbound_order)
   b. 遍历明细：
      i.   查询产品当前库存，校验 stock >= quantity
           - 库存不足 → 抛 ConflictException('库存不足')
      ii.  扣减产品库存 (stock -= quantity, stockWeight -= weight)
           - 原子UPDATE: SET stock = stock - quantity WHERE stock >= quantity
      iii. 更新产品版本号
      iv.  如果指定了 batchNo：
           - 查询批次库存
           - 校验 quantityAvailable >= quantity
           - 扣减批次可用数量，增加锁定数量
           - 插入出库批次明细 (outbound_batch_detail)
      v.   如果未指定 batchNo（FIFO自动分配）：
           - 查询该产品所有可用批次，按入库日期排序
           - 从最早批次开始扣减，直到满足数量需求
           - 可能跨多个批次
      vi.  插入出库明细表 (outbound_detail)
      vii. 插入库存变动记录 (inventory_record, change_type='outbound')
   c. 设置出库单状态为 pending_reconciliation
5. 记录操作日志
6. 返回完整出库单（含明细+批次明细）
```

**撤销出库单 `cancel` 方法完整流程**：

```
1. 查询出库单，验证存在性和状态
2. 检查撤销窗口：now - createdAt <= UNDO_WINDOW.OUTBOUND (30分钟)
   - 超时 → 抛 ConflictException
3. 检查出库单是否已被关联到对账单 (reconciliation_id != null)
   - 已关联 → 抛 ConflictException('出库单已关联对账单，无法撤销')
4. 检查出库单锁定状态 (lock_status = 'locked')
   - 已锁定 → 抛 ConflictException('出库单已锁定')
5. 事务操作：
   a. 更新出库单状态为 cancelled
   b. 遍历明细：
      - 恢复产品库存 (stock += quantity, stockWeight += weight)
      - 更新产品版本号
      - 恢复批次库存（可用数量 += quantity，锁定数量 -= quantity）
      - 插入库存变动记录 (change_type='outbound_rollback')
   c. 更新出库单 cancelledAt 和 cancelReason
6. 记录撤销日志
7. 记录操作日志
8. 返回撤销结果
```

**智能批次推荐 `recommendBatches` 方法**：
```typescript
async recommendBatches(productId: string, requiredQuantity: number): Promise<OutboundBatchSelection[]> {
  // FIFO: 按入库日期从早到晚排序
  const batches = await this.db.select()
    .from(productBatchStock)
    .innerJoin(productBatch, eq(productBatchStock.batchId, productBatch.id))
    .where(and(
      eq(productBatch.productId, productId),
      eq(productBatchStock.status, 'active'),
      gt(productBatchStock.quantityAvailable, 0),
    ))
    .orderBy(asc(productBatch.inboundDate));

  const selections: OutboundBatchSelection[] = [];
  let remaining = requiredQuantity;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const availableQty = Math.min(batch.product_batch_stock.quantityAvailable, remaining);
    selections.push({
      batchId: batch.product_batch.id,
      batchNo: batch.product_batch.batchNo,
      quantity: availableQty,
      weight: (batch.product_batch.weight / batch.product_batch.quantity) * availableQty,
      inboundDate: batch.product_batch.inboundDate,
    });
    remaining -= availableQty;
  }

  if (remaining > 0) {
    throw new ConflictException(`库存不足，缺少 ${remaining} 件`);
  }

  return selections;
}
```

---

# 第9章 后端业务模块（下）

## 9.1 对账管理模块（Reconciliation Module）

### 9.1.1 控制器

**API路由清单**：

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/reconciliation` | 对账单列表（分页+筛选） |
| GET | `/api/reconciliation/:id` | 对账单详情（含明细） |
| POST | `/api/reconciliation` | 创建对账单 |
| PUT | `/api/reconciliation/:id` | 更新对账单（仅 draft 状态可编辑） |
| POST | `/api/reconciliation/:id/confirm` | 确认对账单（draft → confirmed） |
| POST | `/api/reconciliation/:id/audit` | 审核对账单（confirmed → audited） |
| POST | `/api/reconciliation/:id/unaudit` | 反审核对账单（audited → voided，需权限） |
| POST | `/api/reconciliation/:id/lock` | 锁定对账单（防止修改） |
| POST | `/api/reconciliation/:id/unlock` | 解锁对账单 |
| POST | `/api/reconciliation/:id/invoice` | 登记开票 |
| POST | `/api/reconciliation/:id/receipt` | 登记回款 |
| GET | `/api/reconciliation/:id/calculation` | 获取金额计算详情 |
| POST | `/api/reconciliation/:id/check-action` | 检查操作可行性 |
| GET | `/api/reconciliation/export` | 导出对账单Excel |
| POST | `/api/reconciliation/batch-create` | 批量创建对账单 |
| GET | `/api/reconciliation/monthly-summary` | 月度汇总 |

### 9.1.2 服务层关键逻辑

**对账单状态机**：

```
draft → confirmed → audited → invoiced → partial_paid → paid
                                                  ↓
                                            voided (反审核)
```

**状态流转规则**：

| 当前状态 | 允许的操作 | 目标状态 |
---------|-----------|---------|
| draft | confirm, edit, delete | confirmed |
| confirmed | audit, edit | audited |
| audited | invoice, unaudit, lock | invoiced / voided |
| invoiced | receipt | partial_paid / paid |
| partial_paid | receipt | paid |
| paid | - | (终态) |
| voided | - | (终态) |

**创建对账单 `create` 方法完整流程**：

```
1. 生成对账单号 (generateReconciliationNo)
2. 验证出库单列表（outboundOrderIds）：
   a. 查询所有出库单，验证存在性
   b. 验证状态为 pending_reconciliation
   c. 验证客户ID一致
   d. 验证未被其他对账单关联
3. 计算金额：
   a. totalAmount = SUM(outbound.totalAmount)
   b. deductionAmount = dto.deductionAmount || 0
   c. otherAmount = dto.otherAmount || 0
   d. compensationAmount = dto.compensationAmount || 0
   e. finalAmount = totalAmount - deductionAmount + otherAmount + compensationAmount
   f. 元转分：所有金额字段生成对应的 _cents 字段
4. 插入对账单主表 (reconciliation)
5. 遍历出库单明细，插入对账明细 (reconciliation_detail)
6. 更新出库单状态为 reconciled，设置 reconciliation_id
7. 锁定出库单 (lock_status = 'locked')
8. 保存出库单快照到 outbound_snapshot（反审核用）
9. 记录操作日志
10. 返回完整对账单
```

**反审核 `unaudit` 方法完整流程**：

```
1. 验证对账单状态为 audited
2. 验证操作权限（reconciliation:unaudit）
3. 检查是否已有开票或回款记录
   a. 有开票记录 → 抛 ConflictException
   b. 有回款记录 → 抛 ConflictException
4. 事务操作：
   a. 保存当前版本到 reconciliation_detail_version（历史版本）
   b. 更新对账单状态为 voided
   c. 恢复出库单状态为 pending_reconciliation
   d. 解锁出库单 (lock_status = 'unlocked')
   e. 清除出库单的 reconciliation_id
   f. 标记对账明细 is_active = false
5. 记录操作日志
6. 返回反审核结果
```

**金额计算详情 `getCalculation` 方法**：
```typescript
async getCalculation(id: string): Promise<ReconciliationCalculationDetail> {
  const [recon] = await this.db.select().from(reconciliationTable)
    .where(eq(reconciliationTable.id, id));

  if (!recon) throw new NotFoundException('对账单不存在');

  const invoiceRecords = recon.invoiceRecords || [];
  const receiptRecords = recon.receiptRecords || [];

  const invoiceAmount = invoiceRecords.reduce((sum, r) => sum + r.amount, 0);
  const receiptAmount = receiptRecords.reduce((sum, r) => sum + r.amount, 0);

  return {
    baseAmount: recon.totalAmount,
    deductionAmount: recon.deductionAmount,
    otherAmount: recon.otherAmount,
    compensationAmount: recon.compensationAmount,
    finalAmount: recon.finalAmount,
    invoiceAmount,
    uninvoiceAmount: recon.finalAmount - invoiceAmount,
    receiptAmount,
    unreceivedAmount: recon.finalAmount - receiptAmount,
    invoiceCount: invoiceRecords.length,
    receiptCount: receiptRecords.length,
    formula: `${recon.totalAmount} - ${recon.deductionAmount} + ${recon.otherAmount} + ${recon.compensationAmount} = ${recon.finalAmount}`,
  };
}
```

## 9.2 库存管理模块（Inventory Module）

### 9.2.1 控制器

**API路由清单**：

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/inventory` | 库存列表（分页+筛选） |
| GET | `/api/inventory/summary` | 库存汇总 |
| GET | `/api/inventory/records` | 库存变动记录列表 |
| POST | `/api/inventory/adjust` | 库存调整（需审批） |
| GET | `/api/inventory/warnings` | 库存预警列表 |
| GET | `/api/inventory/overdue` | 超期库存列表 |
| GET | `/api/inventory/low-stock` | 低库存列表 |
| GET | `/api/inventory/export` | 导出库存Excel |
| GET | `/api/inventory/:productId/batches` | 产品批次库存详情 |
| GET | `/api/inventory/:productId/records` | 产品库存变动历史 |

### 9.2.2 服务层

**库存调整 `adjust` 方法**：
```typescript
async adjust(dto: AdjustStockDto, userId: string): Promise<InventoryRecord> {
  // 1. 查询产品当前库存
  const [product] = await this.db.select().from(productTable)
    .where(eq(productTable.id, dto.productId));

  if (!product) throw new NotFoundException('产品不存在');

  const beforeStock = product.stock;
  const beforeStockWeight = product.stockWeight;
  const afterStock = beforeStock + dto.quantityChange;
  const afterStockWeight = beforeStockWeight + (dto.weightChange || 0);

  // 2. 校验库存不能为负
  if (afterStock < 0) {
    throw new ConflictException('调整后库存不能为负数');
  }

  // 3. 原子更新库存
  const updateResult = await this.db.update(productTable)
    .set({
      stock: afterStock,
      stockWeight: afterStockWeight,
      version: product.version + 1,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(and(
      eq(productTable.id, dto.productId),
      eq(productTable.version, product.version),
    ))
    .returning({ id: productTable.id });

  if (updateResult.length === 0) {
    throw new ConflictException('库存更新冲突，请重试');
  }

  // 4. 记录库存变动
  const [record] = await this.db.insert(inventoryRecordTable).values({
    productId: dto.productId,
    productName: product.name,
    material: product.material,
    process: product.process,
    workpieceNo: product.workpieceNo,
    unit: product.unit,
    changeType: dto.reason,
    quantityChange: dto.quantityChange,
    weightChange: dto.weightChange || 0,
    beforeStock,
    afterStock,
    beforeStockWeight,
    afterStockWeight,
    operator: userId,
    remark: dto.remark || '',
    createdBy: userId,
    updatedBy: userId,
  }).returning();

  return record;
}
```

**库存预警 `getWarnings` 方法**：
```typescript
async getWarnings(): Promise<{
  lowStock: InventorySummary[];
  overdue: InventoryOverdueWarning[];
}> {
  // 低库存预警：stock <= warningThreshold
  const lowStock = await this.db.select()
    .from(productTable)
    .where(and(
      lte(productTable.stock, productTable.warningThreshold),
      isNull(productTable.deletedAt),
      isNull(productTable.archivedAt),
      gt(productTable.stock, 0),
    ));

  // 超期预警：从 inventory_overdue_warning 视图查询
  const overdue = await this.db.execute(
    sql`SELECT * FROM inventory_overdue_warning ORDER BY storage_days DESC`
  );

  return {
    lowStock: lowStock.map(this.mapToSummary),
    overdue: overdue.rows as InventoryOverdueWarning[],
  };
}
```

## 9.3 撤销操作模块（Undo Module）

### 9.3.1 控制器

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/undo/check/:entityType/:entityId` | 检查是否可撤销 |
| POST | `/api/undo/execute` | 执行撤销 |
| GET | `/api/undo/logs` | 撤销日志列表 |

### 9.3.2 服务层

**检查撤销 `check` 方法**：
```typescript
async check(entityType: string, entityId: string): Promise<UndoCheckResult> {
  if (entityType === 'inbound') {
    return this.checkInboundUndo(entityId);
  } else if (entityType === 'outbound') {
    return this.checkOutboundUndo(entityId);
  }
  throw new BadRequestException('不支持的实体类型');
}

private async checkInboundUndo(entityId: string): Promise<UndoCheckResult> {
  const [order] = await this.db.select().from(inboundOrderTable)
    .where(eq(inboundOrderTable.id, entityId));

  if (!order) throw new NotFoundException('入库单不存在');
  if (order.status === 'cancelled') {
    return { canUndo: false, reason: '入库单已撤销' };
  }

  // 检查撤销窗口
  const elapsed = Date.now() - new Date(order.createdAt).getTime();
  if (elapsed > UNDO_WINDOW.INBOUND) {
    return {
      canUndo: false,
      reason: `已超过${UNDO_WINDOW.INBOUND / 60000}分钟撤销窗口`,
      remainingSeconds: 0,
    };
  }

  // 检查批次是否已被使用
  const details = await this.db.select()
    .from(inboundDetailTable)
    .where(eq(inboundDetailTable.inboundId, entityId));

  const usedBatches = [];
  for (const detail of details) {
    const batches = await this.db.select()
      .from(productBatchTable)
      .leftJoin(productBatchStockTable, eq(productBatchStockTable.batchId, productBatchTable.id))
      .where(and(
        eq(productBatchTable.inboundOrderId, entityId),
        eq(productBatchTable.productId, detail.productId),
      ));

    for (const batch of batches) {
      const originalQty = batch.product_batch.quantity;
      const availableQty = batch.product_batch_stock?.quantityAvailable || 0;
      if (availableQty < originalQty) {
        usedBatches.push({
          batchNo: batch.product_batch.batchNo,
          usedQty: originalQty - availableQty,
        });
      }
    }
  }

  if (usedBatches.length > 0) {
    return {
      canUndo: false,
      reason: '部分批次已被出库使用，无法撤销',
      usedBatches,
    };
  }

  const remainingSeconds = Math.floor((UNDO_WINDOW.INBOUND - elapsed) / 1000);
  return { canUndo: true, remainingSeconds };
}
```

## 9.4 批次管理模块（Batch Module）

### 9.4.1 服务层（无控制器，被其他模块调用）

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `createBatch` | productId, inboundOrderId, quantity, weight, customerCode | ProductBatch | 创建批次记录+批次库存 |
| `getBatchStock` | batchId | BatchStockInfo | 查询批次库存详情 |
| `lockBatch` | batchId, quantity, weight | void | 锁定批次数量（出库用） |
| `unlockBatch` | batchId, quantity, weight | void | 解锁批次数量（撤销出库用） |
| `deductBatch` | batchId, quantity, weight | void | 扣减批次库存（出库确认） |
| `recommendBatches` | productId, requiredQuantity | OutboundBatchSelection[] | FIFO批次推荐 |
| `getProductBatches` | productId | ProductBatch[] | 获取产品所有批次 |

## 9.5 统计模块（Statistics Module）

### 9.5.1 控制器

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/statistics/overview` | 总览数据（收发货量+金额+库存+客户） |
| GET | `/api/statistics/trends` | 趋势数据（按日/月） |
| GET | `/api/statistics/customers` | 客户分析（发货量排行+回款率） |
| GET | `/api/statistics/products` | 产品分析（热力图+加工周期） |
| GET | `/api/statistics/inventory` | 库存分析 |
| GET | `/api/statistics/finance` | 财务分析（收支+开票+回款） |
| GET | `/api/statistics/delay` | 延误分析 |
| GET | `/api/statistics/dashboard/stats` | Dashboard KPI数据 |
| GET | `/api/statistics/dashboard/trends` | Dashboard 趋势数据 |
| GET | `/api/statistics/dashboard/activities` | Dashboard 最近活动 |
| GET | `/api/statistics/dashboard/alerts` | Dashboard 预警数据 |
| GET | `/api/statistics/dashboard/realtime` | Dashboard 实时统计 |

### 9.5.2 统计查询实现

**总览数据查询**：
```typescript
async getOverview(period: 'today' | 'week' | 'month' | 'year'): Promise<StatisticsOverview> {
  const { start, end } = this.getDateRange(period);

  // 并行查询入库/出库/库存/客户数据
  const [inboundStats, outboundStats, inventoryStats, customerStats] = await Promise.all([
    this.getInboundStats(start, end),
    this.getOutboundStats(start, end),
    this.getInventoryStats(),
    this.getCustomerStats(start, end),
  ]);

  // 计算环比增长
  const prevRange = this.getPreviousRange(period);
  const [prevInbound, prevOutbound] = await Promise.all([
    this.getInboundStats(prevRange.start, prevRange.end),
    this.getOutboundStats(prevRange.start, prevRange.end),
  ]);

  return {
    period,
    dateRange: { startDate: start, endDate: end },
    inbound: {
      ...inboundStats,
      growth: {
        count: this.calcGrowthRate(inboundStats.count, prevInbound.count),
        quantity: this.calcGrowthRate(inboundStats.quantity, prevInbound.quantity),
      },
    },
    outbound: {
      ...outboundStats,
      growth: {
        count: this.calcGrowthRate(outboundStats.count, prevOutbound.count),
        amount: this.calcGrowthRate(outboundStats.amount, prevOutbound.amount),
      },
    },
    inventory: inventoryStats,
    customers: customerStats,
  };
}
```

## 9.6 权限模块（Permission Module）

### 9.6.1 控制器

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/permissions/check` | 检查权限（单权限码） |
| POST | `/api/permissions/check-batch` | 批量检查权限 |
| GET | `/api/permissions/user` | 获取当前用户权限列表 |
| GET | `/api/permissions/roles` | 获取角色列表 |
| GET | `/api/permissions/role/:roleName/permissions` | 获取角色权限列表 |
| PUT | `/api/permissions/role/:roleName/permissions` | 更新角色权限 |
| GET | `/api/permissions/definitions` | 获取所有权限定义 |
| GET | `/api/permissions/users` | 获取用户列表（含角色） |
| PUT | `/api/permissions/users/:userId/role` | 更新用户角色 |
| GET | `/api/permissions/users/:userId/permissions` | 获取用户权限详情 |
| PUT | `/api/permissions/users/:userId/permissions` | 更新用户专属权限 |

### 9.6.2 权限定义

```typescript
export const PERMISSION_DEFINITIONS = [
  { code: 'customer:view', name: '查看客户', module: '客户管理' },
  { code: 'customer:create', name: '创建客户', module: '客户管理' },
  { code: 'customer:update', name: '编辑客户', module: '客户管理' },
  { code: 'customer:delete', name: '删除客户', module: '客户管理' },
  { code: 'product:view', name: '查看产品', module: '产品管理' },
  { code: 'product:create', name: '创建产品', module: '产品管理' },
  { code: 'product:update', name: '编辑产品', module: '产品管理' },
  { code: 'product:delete', name: '归档产品', module: '产品管理' },
  { code: 'inbound:view', name: '查看来货登记', module: '来货登记' },
  { code: 'inbound:create', name: '创建入库单', module: '来货登记' },
  { code: 'inbound:undo', name: '撤销入库单', module: '来货登记' },
  { code: 'outbound:view', name: '查看快速发货', module: '快速发货' },
  { code: 'outbound:create', name: '创建出库单', module: '快速发货' },
  { code: 'outbound:delete', name: '删除出库单', module: '快速发货' },
  { code: 'outbound:undo', name: '撤销出库单', module: '快速发货' },
  { code: 'inventory:view', name: '查看库存', module: '库存管理' },
  { code: 'inventory:adjust', name: '库存调整', module: '库存管理' },
  { code: 'reconciliation:view', name: '查看对账', module: '智能对账' },
  { code: 'reconciliation:create', name: '创建对账单', module: '智能对账' },
  { code: 'reconciliation:audit', name: '审核对账单', module: '智能对账' },
  { code: 'reconciliation:unaudit', name: '反审核对账单', module: '智能对账' },
  { code: 'statistics:view', name: '查看数据统计', module: '数据统计' },
  { code: 'system:settings', name: '系统设置', module: '系统管理' },
  { code: 'system:permission', name: '权限管理', module: '系统管理' },
];
```

### 9.6.3 角色权限默认配置

```typescript
export const ROLE_PERMISSIONS = {
  admin: ['*'], // 全部权限
  manager: [
    'customer:*', 'product:*', 'inbound:*', 'outbound:*',
    'inventory:*', 'reconciliation:*', 'statistics:view',
    'system:settings',
  ],
  operator: [
    'customer:view', 'product:view',
    'inbound:view', 'inbound:create',
    'outbound:view', 'outbound:create',
    'inventory:view',
    'reconciliation:view',
    'statistics:view',
  ],
  finance: [
    'customer:view', 'product:view',
    'inbound:view', 'outbound:view',
    'inventory:view',
    'reconciliation:*', 'statistics:view',
  ],
};
```

**权限匹配规则**：
- `*` 匹配所有权限码
- `module:*` 匹配该模块下所有权限码
- 精确匹配：`customer:view` 只匹配 `customer:view`

## 9.7 租户模块（Tenant Module）

### 9.7.1 控制器

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/tenant/organizations` | 获取用户可访问的组织列表 |
| POST | `/api/tenant/organizations` | 创建新组织 |
| GET | `/api/tenant/organizations/:orgCode` | 获取组织详情 |
| PUT | `/api/tenant/organizations/:orgCode` | 更新组织信息 |
| POST | `/api/tenant/organizations/:orgCode/invite` | 生成邀请码 |
| POST | `/api/tenant/organizations/join` | 通过邀请码加入组织 |
| GET | `/api/tenant/organizations/:orgCode/members` | 获取组织成员列表 |
| PUT | `/api/tenant/organizations/:orgCode/members/:userId/role` | 更新成员角色 |
| DELETE | `/api/tenant/organizations/:orgCode/members/:userId` | 移除成员 |
| GET | `/api/tenant/organizations/:orgCode/invites` | 获取组织邀请码列表 |
| POST | `/api/tenant/organizations/:orgCode/switch-db` | 切换组织数据库 |

### 9.7.2 租户连接服务

文件：`server/modules/tenant/tenant-connection.service.ts`

```typescript
@Injectable()
export class TenantConnectionService {
  private readonly connections = new Map<string, PostgresJsDatabase>();
  private readonly logger = new Logger(TenantConnectionService.name);

  async getConnection(orgCode: string): Promise<PostgresJsDatabase> {
    // 1. 检查缓存
    const cached = this.connections.get(orgCode);
    if (cached) return cached;

    // 2. 查询组织数据库配置
    const [org] = await this.masterDb.select()
      .from(organizationTable)
      .where(eq(organizationTable.code, orgCode));

    if (!org) throw new NotFoundException('组织不存在');
    if (!org.isActive) throw new ForbiddenException('组织已停用');

    // 3. 创建新连接
    const connectionString = `postgresql://${org.dbUser}:${org.dbPassword}@${org.dbHost}:${org.dbPort}/${org.dbName}`;
    const queryClient = postgres(connectionString, { max: 10 });
    const db = drizzle(queryClient, { schema });

    // 4. 缓存连接
    this.connections.set(orgCode, db);

    return db;
  }

  clearConnection(orgCode: string) {
    this.connections.delete(orgCode);
  }
}
```

## 9.8 管理后台模块（Admin Module）

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/admin/organizations` | 所有组织列表 |
| POST | `/api/admin/organizations/:orgCode/suspend` | 暂停组织 |
| POST | `/api/admin/organizations/:orgCode/resume` | 恢复组织 |
| GET | `/api/admin/organizations/:orgCode/stats` | 组织统计 |
| GET | `/api/admin/users` | 全部用户列表 |
| GET | `/api/admin/logs` | 系统操作日志 |

## 9.9 语音录入模块（Voice Module）

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/voice/parse` | 解析语音文本为结构化数据 |

**语音解析流程**：
1. 接收语音转文本结果
2. 使用AI插件解析文本为结构化JSON
3. 返回：客户名称、产品名称、数量、重量等字段

---

# 第10章 后端启动与模块注册

## 10.1 入口文件

文件：`server/main.ts`（平台关键文件，不建议修改）

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(3000);
}
bootstrap();
```

## 10.2 根模块

文件：`server/app.module.ts`

```typescript
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantConnectionService } from './modules/tenant/tenant-connection.service';
import { TenantModule } from './modules/tenant/tenant.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { InboundModule } from './modules/inbound/inbound.module';
import { OutboundModule } from './modules/outbound/outbound.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { UndoModule } from './modules/undo/undo.module';
import { BatchModule } from './modules/batch/batch.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { PermissionModule } from './modules/permission/permission.module';
import { AdminModule } from './modules/admin/admin.module';
import { VoiceModule } from './modules/voice/voice.module';
import { ViewModule } from './modules/view/view.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 业务模块（必须在 ViewModule 之前）
    TenantModule,
    CustomerModule,
    ProductModule,
    InboundModule,
    OutboundModule,
    InventoryModule,
    ReconciliationModule,
    UndoModule,
    BatchModule,
    StatisticsModule,
    PermissionModule,
    AdminModule,
    VoiceModule,
    // ViewModule 必须在最后（fallback 路由）
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
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
```

**模块注册顺序（CRITICAL）**：
1. `ConfigModule` — 配置模块，全局可用
2. `TenantModule` — 租户模块（提供连接服务）
3. `CustomerModule` — 客户管理
4. `ProductModule` — 产品管理
5. `InboundModule` — 入库管理
6. `OutboundModule` — 出库管理
7. `InventoryModule` — 库存管理
8. `ReconciliationModule` — 对账管理
9. `UndoModule` — 撤销操作
10. `BatchModule` — 批次管理
11. `StatisticsModule` — 数据统计
12. `PermissionModule` — 权限管理
13. `AdminModule` — 管理后台
14. `VoiceModule` — 语音录入
15. `ViewModule` — 视图模块（必须最后注册，fallback路由）

**全局中间件**：
- `TenantMiddleware` — 应用于所有路由（`forRoutes('*')`）

**全局提供者**：
- `GlobalExceptionFilter` — 全局异常过滤器
- `LoggingInterceptor` — 全局日志拦截器
- `TenantConnectionService` — 租户连接服务

## 10.3 View模块

文件：`server/modules/view/view.module.ts`（平台关键文件）

```typescript
import { Module } from '@nestjs/common';
import { ViewController } from './view.controller';

@Module({
  controllers: [ViewController],
})
export class ViewModule {}
```

ViewController 负责处理前端SPA路由的fallback，将未匹配的API路由返回前端HTML。此模块必须最后注册。

---

<!-- BATCH_2_END -->

---

# 第11章 前端入口与路由守卫

## 11.1 前端入口文件

文件：`client/src/index.tsx`（30行）

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppContainer } from '@lark-apaas/client-toolkit';
import { ErrorRender } from '@lark-apaas/client-toolkit';
import RoutesComponent from './app';

const MainApp: React.FC = () => {
  return (
    <BrowserRouter basename={process.env.CLIENT_BASE_PATH || '/'}>
      <AppContainer>
        <ErrorRender>
          <RoutesComponent />
        </ErrorRender>
      </AppContainer>
    </BrowserRouter>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<MainApp />);
}
```

**组件层级**：
1. `BrowserRouter` — React Router v6路由容器
2. `AppContainer` — Lark工具包应用容器
3. `ErrorRender` — 错误降级渲染组件
4. `RoutesComponent` — 应用路由组件

## 11.2 路由守卫实现

### ProtectedRoute

```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (location.pathname !== '/organizations' && needsTenantSelection()) {
    return <Navigate to="/organizations" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

**守卫逻辑**：
1. 从 localStorage 获取当前用户（`__global_heat_user_info`）
2. 未登录 → 跳转 `/login`，携带来源路径
3. 检查租户选择（`currentOrgCode` 是否存在于 localStorage）
4. 未选择租户且当前路径不是 `/organizations` → 跳转 `/organizations`

### PublicRoute

```typescript
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUser();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};
```

### PermissionGuard

```typescript
interface PermissionGuardProps {
  requiredPermission: string;
  children: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ requiredPermission, children }) => {
  const { hasPermission } = usePermission();
  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};
```

## 11.3 路由配置

文件：`client/src/app.tsx`（298行）

```typescript
const RoutesComponent: React.FC = () => {
  return (
    <TenantProvider>
      <Routes>
        {/* 公开路由 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* 组织选择 */}
        <Route path="/organizations" element={
          <ProtectedRoute><OrganizationPage /></ProtectedRoute>
        } />

        {/* 受保护路由 */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={
            <PermissionGuard requiredPermission="dashboard">
              <DashboardPage />
            </PermissionGuard>
          } />
          {/* ... 其他27个受保护路由 ... */}
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TenantProvider>
  );
};
```

**路由结构**：
- 公开路由（3个）：`/`、`/landing`、`/login`
- 组织选择（1个）：`/organizations`
- 受保护路由（25个）：被 `<Layout />` 包裹，每个路由有 `<PermissionGuard>` 守卫
- 404路由（1个）：`*`

## 11.4 Layout路由

受保护路由使用嵌套路由结构：
```tsx
<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<PermissionGuard requiredPermission="dashboard"><DashboardPage /></PermissionGuard>} />
  <Route path="/inbound" element={<PermissionGuard requiredPermission="inbound"><InboundPage /></PermissionGuard>} />
  // ...
</Route>
```

`<Layout />` 组件内部使用 `<Outlet />` 渲染子路由。

## 11.5 本地存储工具函数

```typescript
export function getCurrentUser(): UserInfo | null {
  const stored = localStorage.getItem('__global_heat_user_info');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function needsTenantSelection(): boolean {
  return !localStorage.getItem('currentOrgCode');
}

export function getCurrentOrgCode(): string | null {
  return localStorage.getItem('currentOrgCode');
}

export function setCurrentOrgCode(code: string): void {
  localStorage.setItem('currentOrgCode', code);
}

export function clearCurrentUser(): void {
  localStorage.removeItem('__global_heat_user_info');
  localStorage.removeItem('currentOrgCode');
}
```

---

# 第12章 前端数据层 DataContext

文件：`client/src/data/DataContext.tsx`（1285行）

## 12.1 架构设计

DataContext 是前端全局数据管理中心，采用 React Context + useState 模式，管理所有跨页面共享的业务数据。

```
DataProvider
  ├── customers[] — 客户列表
  ├── products[] — 产品列表
  ├── inventorySummary[] — 库存汇总
  ├── inboundOrders[] — 入库单列表
  ├── outboundOrders[] — 出库单列表
  ├── reconciliations[] — 对账单列表
  ├── inventoryRecords[] — 库存变动记录
  ├── operationLogs[] — 操作日志
  ├── statistics — 统计数据
  ├── realtimeStats — 实时统计
  ├── dashboardData — Dashboard数据
  └── CRUD方法集
```

## 12.2 类型定义

```typescript
interface DataContextValue {
  // 数据列表
  customers: Customer[];
  products: Product[];
  inventorySummary: InventorySummary[];
  inboundOrders: InboundOrder[];
  outboundOrders: OutboundOrder[];
  reconciliations: Reconciliation[];
  inventoryRecords: InventoryRecord[];
  operationLogs: OperationLog[];

  // 统计数据
  statistics: StatisticsData;
  realtimeStats: RealtimeStats;
  dashboardData: DashboardData;

  // 加载状态
  loading: { [key: string]: boolean };
  error: { [key: string]: string | null };

  // 刷新方法
  refreshCustomers: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  refreshInboundOrders: () => Promise<void>;
  refreshOutboundOrders: () => Promise<void>;
  refreshReconciliations: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // 客户CRUD
  createCustomer: (dto: CreateCustomerDto) => Promise<Customer>;
  updateCustomer: (id: string, dto: UpdateCustomerDto) => Promise<void>;
  deleteCustomer: (id: string, reason: string) => Promise<void>;
  batchDeleteCustomers: (ids: string[], reason: string) => Promise<void>;
  importCustomers: (items: CreateCustomerDto[]) => Promise<BatchOperationResult>;

  // 产品CRUD
  createProduct: (dto: CreateProductDto) => Promise<Product>;
  updateProduct: (id: string, dto: UpdateProductDto) => Promise<void>;
  deleteProduct: (id: string, reason: string) => Promise<void>;
  batchDeleteProducts: (ids: string[], reason: string) => Promise<void>;
  importProducts: (items: CreateProductDto[]) => Promise<BatchOperationResult>;

  // 入库单CRUD
  createInboundOrder: (dto: any) => Promise<InboundOrder>;
  updateInboundOrder: (id: string, dto: any) => Promise<void>;
  cancelInboundOrder: (id: string, reason: string) => Promise<void>;

  // 出库单CRUD
  createOutboundOrder: (dto: any) => Promise<OutboundOrder>;
  updateOutboundOrder: (id: string, dto: any) => Promise<void>;
  cancelOutboundOrder: (id: string, reason: string) => Promise<void>;

  // 对账单CRUD
  createReconciliation: (dto: any) => Promise<Reconciliation>;
  updateReconciliation: (id: string, dto: any) => Promise<void>;
  confirmReconciliation: (id: string) => Promise<void>;
  auditReconciliation: (id: string) => Promise<void>;
  unauditReconciliation: (id: string) => Promise<void>;
  lockReconciliation: (id: string) => Promise<void>;
  unlockReconciliation: (id: string) => Promise<void>;
  invoiceReconciliation: (id: string, data: any) => Promise<void>;
  receiptReconciliation: (id: string, data: any) => Promise<void>;

  // 库存操作
  adjustStock: (dto: AdjustStockDto) => Promise<void>;

  // 导入导出
  exportCustomers: () => Promise<void>;
  exportProducts: () => Promise<void>;
  exportInventory: () => Promise<void>;
  exportInboundOrders: (params: any) => Promise<void>;
  exportOutboundOrders: (params: any) => Promise<void>;
  exportReconciliation: (id: string) => Promise<void>;
}
```

## 12.3 初始化加载

```typescript
const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const orgCode = getCurrentOrgCode();

  useEffect(() => {
    if (orgCode) {
      refreshAll();
    }
  }, [orgCode]);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      refreshCustomers(),
      refreshProducts(),
      refreshInventory(),
      refreshInboundOrders(),
      refreshOutboundOrders(),
      refreshReconciliations(),
    ]);
  }, [orgCode]);

  // ... state and methods ...
};
```

**初始化流程**：
1. 获取当前组织编码
2. 组织编码存在时，调用 `refreshAll()`
3. `refreshAll` 并行刷新6大数据列表
4. 使用 `Promise.allSettled` 确保单个失败不影响其他

## 12.4 数据刷新方法

### refreshCustomers

```typescript
const refreshCustomers = useCallback(async () => {
  setLoading(prev => ({ ...prev, customers: true }));
  try {
    const response = await api.customers.list({ page: 1, pageSize: 500 });
    setCustomers(response.items);
    setError(prev => ({ ...prev, customers: null }));
  } catch (err) {
    setError(prev => ({ ...prev, customers: err.message }));
    logger.error('Failed to refresh customers', err);
  } finally {
    setLoading(prev => ({ ...prev, customers: false }));
  }
}, []);
```

**刷新模式**：
- 所有 refresh 方法遵循相同模式：setLoading → try/catch API → setData/setError → finally setLoading
- 一次加载500条（分页优化，热处理系统通常客户/产品数量在数百级别）

## 12.5 CRUD 方法

### createCustomer

```typescript
const createCustomer = useCallback(async (dto: CreateCustomerDto) => {
  const customer = await api.customers.create(dto);
  setCustomers(prev => [customer, ...prev]);
  return customer;
}, []);
```

### deleteCustomer

```typescript
const deleteCustomer = useCallback(async (id: string, reason: string) => {
  await api.customers.delete(id, reason);
  setCustomers(prev => prev.filter(c => c.id !== id));
}, []);
```

### createInboundOrder

```typescript
const createInboundOrder = useCallback(async (dto: any) => {
  const order = await api.inbound.create(dto);
  // 刷新库存和产品数据（库存已变化）
  await Promise.all([refreshInventory(), refreshProducts()]);
  setInboundOrders(prev => [order, ...prev]);
  return order;
}, []);
```

**注意**：创建入库/出库单后，需要刷新库存和产品数据，因为库存已经变化。

### cancelOutboundOrder

```typescript
const cancelOutboundOrder = useCallback(async (id: string, reason: string) => {
  await api.outbound.cancel(id, reason);
  // 刷新库存和产品数据
  await Promise.all([refreshInventory(), refreshProducts()]);
  setOutboundOrders(prev => prev.map(o =>
    o.id === id ? { ...o, status: 'cancelled', cancelledAt: new Date().toISOString() } : o
  ));
}, []);
```

## 12.6 批量操作

### batchDeleteCustomers

```typescript
const batchDeleteCustomers = useCallback(async (ids: string[], reason: string) => {
  await api.customers.batchDelete(ids, reason);
  const idSet = new Set(ids);
  setCustomers(prev => prev.filter(c => !idSet.has(c.id)));
}, []);
```

### importProducts

```typescript
const importProducts = useCallback(async (items: CreateProductDto[]) => {
  const result = await api.products.import(items);
  // 刷新产品列表
  await refreshProducts();
  return result;
}, []);
```

## 12.7 useDataContext Hook

```typescript
export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return context;
}
```

---

# 第13章 前端 API 层

文件：`client/src/api/index.ts`（934行）

## 13.1 API 客户端配置

```typescript
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

const api = axiosForBackend;

// 请求拦截器：自动添加组织编码
api.interceptors.request.use((config) => {
  const orgCode = localStorage.getItem('currentOrgCode');
  if (orgCode) {
    config.headers['X-Organization-Code'] = orgCode;
  }
  return config;
});

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearCurrentUser();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 13.2 API 模块划分

```typescript
export const apiService = {
  customers: customerApi,
  products: productApi,
  inbound: inboundApi,
  outbound: outboundApi,
  inventory: inventoryApi,
  reconciliation: reconciliationApi,
  statistics: statisticsApi,
  permissions: permissionApi,
  tenant: tenantApi,
  admin: adminApi,
  undo: undoApi,
  voice: voiceApi,
};
```

## 13.3 客户 API

```typescript
const customerApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) =>
    api.get('/api/customers', { params }).then(r => r.data),

  listActive: () =>
    api.get('/api/customers/active').then(r => r.data),

  getById: (id: string) =>
    api.get(`/api/customers/${id}`).then(r => r.data),

  create: (dto: CreateCustomerDto) =>
    api.post('/api/customers', dto).then(r => r.data),

  batchCreate: (items: CreateCustomerDto[]) =>
    api.post('/api/customers/batch', items).then(r => r.data),

  import: (items: CreateCustomerDto[]) =>
    api.post('/api/customers/import', { items }).then(r => r.data),

  update: (id: string, dto: UpdateCustomerDto) =>
    api.put(`/api/customers/${id}`, dto).then(r => r.data),

  delete: (id: string, reason: string) =>
    api.delete(`/api/customers/${id}`, { data: { reason } }).then(r => r.data),

  batchDelete: (ids: string[], reason: string) =>
    api.post('/api/customers/batch-delete', { ids, reason }).then(r => r.data),

  getActivities: (id: string) =>
    api.get(`/api/customers/${id}/activities`).then(r => r.data),

  checkDeactivate: (id: string) =>
    api.get(`/api/customers/${id}/check-deactivate`).then(r => r.data),

  deactivate: (id: string) =>
    api.put(`/api/customers/${id}/deactivate`).then(r => r.data),

  activate: (id: string) =>
    api.put(`/api/customers/${id}/activate`).then(r => r.data),

  getStats: (id: string, period: string) =>
    api.get(`/api/customers/${id}/stats`, { params: { period } }).then(r => r.data),
};
```

## 13.4 产品 API

```typescript
const productApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; material?: string; process?: string; customerCode?: string }) =>
    api.get('/api/products', { params }).then(r => r.data),

  listActive: () =>
    api.get('/api/products/active').then(r => r.data),

  getByCustomer: (customerCode: string) =>
    api.get(`/api/products/by-customer/${customerCode}`).then(r => r.data),

  getById: (id: string) =>
    api.get(`/api/products/${id}`).then(r => r.data),

  create: (dto: CreateProductDto) =>
    api.post('/api/products', dto).then(r => r.data),

  batchCreate: (items: CreateProductDto[]) =>
    api.post('/api/products/batch', items).then(r => r.data),

  import: (items: CreateProductDto[]) =>
    api.post('/api/products/import', { items }).then(r => r.data),

  update: (id: string, dto: UpdateProductDto) =>
    api.put(`/api/products/${id}`, dto).then(r => r.data),

  archive: (id: string, reason: string) =>
    api.put(`/api/products/${id}/archive`, { reason }).then(r => r.data),

  delete: (id: string, reason: string) =>
    api.delete(`/api/products/${id}`, { data: { reason } }).then(r => r.data),

  batchDelete: (ids: string[], reason: string) =>
    api.post('/api/products/batch-delete', { ids, reason }).then(r => r.data),

  getBatches: (id: string) =>
    api.get(`/api/products/${id}/batches`).then(r => r.data),

  getMaterials: () =>
    api.get('/api/products/materials/list').then(r => r.data),

  getProcesses: () =>
    api.get('/api/products/processes/list').then(r => r.data),

  setMaterialThresholds: (items: any[]) =>
    api.post('/api/products/material-thresholds', items).then(r => r.data),

  getMaterialThresholds: () =>
    api.get('/api/products/material-thresholds').then(r => r.data),

  getStats: (id: string, period: string) =>
    api.get(`/api/products/${id}/stats`, { params: { period } }).then(r => r.data),

  export: () =>
    api.get('/api/products/export', { responseType: 'blob' }).then(r => r.data),
};
```

## 13.5 入库 API

```typescript
const inboundApi = {
  list: (params?: IInboundOrderQueryParams) =>
    api.get('/api/inbound', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get(`/api/inbound/${id}`).then(r => r.data),

  create: (dto: any) =>
    api.post('/api/inbound', dto).then(r => r.data),

  update: (id: string, dto: any) =>
    api.put(`/api/inbound/${id}`, dto).then(r => r.data),

  cancel: (id: string, reason: string) =>
    api.post(`/api/inbound/${id}/cancel`, { reason }).then(r => r.data),

  getTodayStats: () =>
    api.get('/api/inbound/stats/today').then(r => r.data),

  getPeriodStats: (startDate: string, endDate: string) =>
    api.get('/api/inbound/stats/period', { params: { startDate, endDate } }).then(r => r.data),

  export: (params: any) =>
    api.get('/api/inbound/export', { params, responseType: 'blob' }).then(r => r.data),

  import: (data: any) =>
    api.post('/api/inbound/import', data).then(r => r.data),
};
```

## 13.6 出库 API

```typescript
const outboundApi = {
  list: (params?: IOutboundOrderQueryParams) =>
    api.get('/api/outbound', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get(`/api/outbound/${id}`).then(r => r.data),

  create: (dto: any) =>
    api.post('/api/outbound', dto).then(r => r.data),

  update: (id: string, dto: any) =>
    api.put(`/api/outbound/${id}`, dto).then(r => r.data),

  cancel: (id: string, reason: string) =>
    api.post(`/api/outbound/${id}/cancel`, { reason }).then(r => r.data),

  getTodayStats: () =>
    api.get('/api/outbound/stats/today').then(r => r.data),

  getPeriodStats: (startDate: string, endDate: string) =>
    api.get('/api/outbound/stats/period', { params: { startDate, endDate } }).then(r => r.data),

  export: (params: any) =>
    api.get('/api/outbound/export', { params, responseType: 'blob' }).then(r => r.data),

  import: (data: any) =>
    api.post('/api/outbound/import', data).then(r => r.data),

  recommendBatches: (params: { productId: string; requiredQuantity: number }) =>
    api.get('/api/outbound/recommend-batches', { params }).then(r => r.data),

  getCustomerStocks: (customerCode: string) =>
    api.get(`/api/outbound/customer-stocks/${customerCode}`).then(r => r.data),
};
```

## 13.7 库存 API

```typescript
const inventoryApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; material?: string }) =>
    api.get('/api/inventory', { params }).then(r => r.data),

  getSummary: () =>
    api.get('/api/inventory/summary').then(r => r.data),

  getRecords: (params?: { page?: number; pageSize?: number; productId?: string; changeType?: string }) =>
    api.get('/api/inventory/records', { params }).then(r => r.data),

  adjust: (dto: AdjustStockDto) =>
    api.post('/api/inventory/adjust', dto).then(r => r.data),

  getWarnings: () =>
    api.get('/api/inventory/warnings').then(r => r.data),

  getOverdue: () =>
    api.get('/api/inventory/overdue').then(r => r.data),

  getLowStock: () =>
    api.get('/api/inventory/low-stock').then(r => r.data),

  export: () =>
    api.get('/api/inventory/export', { responseType: 'blob' }).then(r => r.data),

  getProductBatches: (productId: string) =>
    api.get(`/api/inventory/${productId}/batches`).then(r => r.data),

  getProductRecords: (productId: string) =>
    api.get(`/api/inventory/${productId}/records`).then(r => r.data),
};
```

## 13.8 对账 API

```typescript
const reconciliationApi = {
  list: (params?: { page?: number; pageSize?: number; customerId?: string; month?: string; status?: string }) =>
    api.get('/api/reconciliation', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get(`/api/reconciliation/${id}`).then(r => r.data),

  create: (dto: any) =>
    api.post('/api/reconciliation', dto).then(r => r.data),

  update: (id: string, dto: any) =>
    api.put(`/api/reconciliation/${id}`, dto).then(r => r.data),

  confirm: (id: string) =>
    api.post(`/api/reconciliation/${id}/confirm`).then(r => r.data),

  audit: (id: string) =>
    api.post(`/api/reconciliation/${id}/audit`).then(r => r.data),

  unaudit: (id: string) =>
    api.post(`/api/reconciliation/${id}/unaudit`).then(r => r.data),

  lock: (id: string) =>
    api.post(`/api/reconciliation/${id}/lock`).then(r => r.data),

  unlock: (id: string) =>
    api.post(`/api/reconciliation/${id}/unlock`).then(r => r.data),

  invoice: (id: string, data: any) =>
    api.post(`/api/reconciliation/${id}/invoice`, data).then(r => r.data),

  receipt: (id: string, data: any) =>
    api.post(`/api/reconciliation/${id}/receipt`, data).then(r => r.data),

  getCalculation: (id: string) =>
    api.get(`/api/reconciliation/${id}/calculation`).then(r => r.data),

  checkAction: (id: string, action: string) =>
    api.post(`/api/reconciliation/${id}/check-action`, { action }).then(r => r.data),

  export: (id: string) =>
    api.get(`/api/reconciliation/export`, { params: { id }, responseType: 'blob' }).then(r => r.data),

  batchCreate: (items: any[]) =>
    api.post('/api/reconciliation/batch-create', items).then(r => r.data),

  getMonthlySummary: (params: { customerId?: string; year: string }) =>
    api.get('/api/reconciliation/monthly-summary', { params }).then(r => r.data),
};
```

## 13.9 统计 API

```typescript
const statisticsApi = {
  getOverview: (period: 'today' | 'week' | 'month' | 'year') =>
    api.get('/api/statistics/overview', { params: { period } }).then(r => r.data),

  getTrends: (params: { startDate: string; endDate: string; groupBy?: 'day' | 'month' }) =>
    api.get('/api/statistics/trends', { params }).then(r => r.data),

  getCustomers: (params: { startDate: string; endDate: string }) =>
    api.get('/api/statistics/customers', { params }).then(r => r.data),

  getProducts: (params: { startDate: string; endDate: string }) =>
    api.get('/api/statistics/products', { params }).then(r => r.data),

  getInventory: () =>
    api.get('/api/statistics/inventory').then(r => r.data),

  getFinance: (params: { startDate: string; endDate: string }) =>
    api.get('/api/statistics/finance', { params }).then(r => r.data),

  getDelay: (params: { startDate: string; endDate: string }) =>
    api.get('/api/statistics/delay', { params }).then(r => r.data),

  // Dashboard专用
  getDashboardStats: (period: string) =>
    api.get('/api/statistics/dashboard/stats', { params: { period } }).then(r => r.data),

  getDashboardTrends: (params: { startDate: string; endDate: string }) =>
    api.get('/api/statistics/dashboard/trends', { params }).then(r => r.data),

  getDashboardActivities: (limit?: number) =>
    api.get('/api/statistics/dashboard/activities', { params: { limit } }).then(r => r.data),

  getDashboardAlerts: () =>
    api.get('/api/statistics/dashboard/alerts').then(r => r.data),

  getDashboardRealtime: () =>
    api.get('/api/statistics/dashboard/realtime').then(r => r.data),
};
```

## 13.10 权限 API

```typescript
const permissionApi = {
  check: (permissionCode: string) =>
    api.get('/api/permissions/check', { params: { permissionCode } }).then(r => r.data),

  checkBatch: (permissionCodes: string[]) =>
    api.post('/api/permissions/check-batch', { permissionCodes }).then(r => r.data),

  getUserPermissions: () =>
    api.get('/api/permissions/user').then(r => r.data),

  getRoles: () =>
    api.get('/api/permissions/roles').then(r => r.data),

  getRolePermissions: (roleName: string) =>
    api.get(`/api/permissions/role/${roleName}/permissions`).then(r => r.data),

  updateRolePermissions: (roleName: string, permissionCodes: string[]) =>
    api.put(`/api/permissions/role/${roleName}/permissions`, { permissionCodes }).then(r => r.data),

  getDefinitions: () =>
    api.get('/api/permissions/definitions').then(r => r.data),

  getUsers: () =>
    api.get('/api/permissions/users').then(r => r.data),

  updateUserRole: (userId: string, role: string) =>
    api.put(`/api/permissions/users/${userId}/role`, { role }).then(r => r.data),

  getUserPermissions: (userId: string) =>
    api.get(`/api/permissions/users/${userId}/permissions`).then(r => r.data),

  updateUserPermissions: (userId: string, permissionCodes: string[]) =>
    api.put(`/api/permissions/users/${userId}/permissions`, { permissionCodes }).then(r => r.data),
};
```

## 13.11 租户 API

```typescript
const tenantApi = {
  getOrganizations: () =>
    api.get('/api/tenant/organizations').then(r => r.data),

  createOrganization: (dto: any) =>
    api.post('/api/tenant/organizations', dto).then(r => r.data),

  getOrganization: (orgCode: string) =>
    api.get(`/api/tenant/organizations/${orgCode}`).then(r => r.data),

  updateOrganization: (orgCode: string, dto: any) =>
    api.put(`/api/tenant/organizations/${orgCode}`, dto).then(r => r.data),

  invite: (orgCode: string, role: string) =>
    api.post(`/api/tenant/organizations/${orgCode}/invite`, { role }).then(r => r.data),

  join: (inviteCode: string) =>
    api.post('/api/tenant/organizations/join', { inviteCode }).then(r => r.data),

  getMembers: (orgCode: string) =>
    api.get(`/api/tenant/organizations/${orgCode}/members`).then(r => r.data),

  updateMemberRole: (orgCode: string, userId: string, role: string) =>
    api.put(`/api/tenant/organizations/${orgCode}/members/${userId}/role`, { role }).then(r => r.data),

  removeMember: (orgCode: string, userId: string) =>
    api.delete(`/api/tenant/organizations/${orgCode}/members/${userId}`).then(r => r.data),

  getInvites: (orgCode: string) =>
    api.get(`/api/tenant/organizations/${orgCode}/invites`).then(r => r.data),

  switchDb: (orgCode: string) =>
    api.post(`/api/tenant/organizations/${orgCode}/switch-db`).then(r => r.data),
};
```

## 13.12 撤销 API

```typescript
const undoApi = {
  check: (entityType: string, entityId: string) =>
    api.get(`/api/undo/check/${entityType}/${entityId}`).then(r => r.data),

  execute: (data: { entityType: string; entityId: string; reason: string }) =>
    api.post('/api/undo/execute', data).then(r => r.data),

  getLogs: (params?: { page?: number; pageSize?: number; entityType?: string }) =>
    api.get('/api/undo/logs', { params }).then(r => r.data),
};
```

## 13.13 管理 API

```typescript
const adminApi = {
  getOrganizations: (params?: { page?: number; pageSize?: number }) =>
    api.get('/api/admin/organizations', { params }).then(r => r.data),

  suspendOrganization: (orgCode: string) =>
    api.post(`/api/admin/organizations/${orgCode}/suspend`).then(r => r.data),

  resumeOrganization: (orgCode: string) =>
    api.post(`/api/admin/organizations/${orgCode}/resume`).then(r => r.data),

  getOrganizationStats: (orgCode: string) =>
    api.get(`/api/admin/organizations/${orgCode}/stats`).then(r => r.data),

  getUsers: (params?: { page?: number; pageSize?: number }) =>
    api.get('/api/admin/users', { params }).then(r => r.data),

  getLogs: (params?: { page?: number; pageSize?: number; entityType?: string; startDate?: string; endDate?: string }) =>
    api.get('/api/admin/logs', { params }).then(r => r.data),
};
```

## 13.14 语音 API

```typescript
const voiceApi = {
  parse: (text: string) =>
    api.post('/api/voice/parse', { text }).then(r => r.data),
};
```

---

# 第14章 前端 Hooks 与上下文

## 14.1 usePermission Hook

文件：`client/src/hooks/usePermission.ts`（189行）

```typescript
interface UsePermissionReturn {
  permissions: string[];
  roles: string[];
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function usePermission(): UsePermissionReturn {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await permissionApi.getUserPermissions();
      setPermissions(data.permissions || []);
      setRoles(data.roles || []);
    } catch (err) {
      logger.error('Failed to load permissions', err);
      // 降级：从 localStorage 获取角色信息
      const user = getCurrentUser();
      if (user?.role) {
        setRoles([user.role]);
        setPermissions(ROLE_PERMISSIONS[user.role] || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasPermission = useCallback((code: string) => {
    if (permissions.includes('*')) return true;
    const [module, action] = code.split(':');
    if (permissions.includes(`${module}:*`)) return true;
    return permissions.includes(code);
  }, [permissions]);

  const hasAnyPermission = useCallback((codes: string[]) =>
    codes.some(code => hasPermission(code)), [hasPermission]);

  const hasAllPermissions = useCallback((codes: string[]) =>
    codes.every(code => hasPermission(code)), [hasPermission]);

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
    refresh,
  };
}
```

**权限匹配规则**：
1. `*` 匹配所有权限码
2. `module:*` 匹配该模块下所有权限码（如 `customer:*` 匹配 `customer:view`、`customer:create` 等）
3. 精确匹配：`customer:view` 只匹配 `customer:view`
4. API失败时降级到localStorage中的角色权限

## 14.2 usePrintTemplate Hook

文件：`client/src/hooks/usePrintTemplate.ts`（330行）

```typescript
interface UsePrintTemplateReturn {
  templates: PrintTemplate[];
  currentTemplate: PrintTemplate | null;
  loading: boolean;
  saveTemplate: (template: PrintTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<PrintTemplate>;
  setActiveTemplate: (type: TemplateType, id: string) => Promise<void>;
  getTemplateByType: (type: TemplateType) => PrintTemplate | null;
  previewTemplate: (template: PrintTemplate, data: any) => string;
  printTemplate: (template: PrintTemplate, data: any) => Promise<void>;
  exportPDF: (template: PrintTemplate, data: any) => Promise<void>;
}
```

**模板类型**：
```typescript
type TemplateType = 'identity_card' | 'delivery_note' | 'reconciliation_note';
```

**localStorage 存储键**：
- `__global_heat_print_templates` — 所有打印模板
- `__global_heat_print_active_templates` — 各类型当前激活的模板ID

**模板数据结构**：
```typescript
interface PrintTemplate {
  id: string;
  name: string;
  type: TemplateType;
  paperSize: 'A4' | 'A5' | '80mm' | '58mm' | 'custom';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  fields: TemplateField[];
  header?: string;
  footer?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateField {
  key: string;
  label: string;
  visible: boolean;
  order: number;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: string;
}
```

## 14.3 useInventorySync Hook

文件：`client/src/hooks/useInventorySync.ts`（213行）

```typescript
interface UseInventorySyncReturn {
  summary: InventorySummary[];
  warnings: InventoryWarnings;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastSyncTime: Date | null;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
}
```

**自动刷新机制**：
- 默认关闭自动刷新
- 开启后每 30 秒刷新一次库存数据
- 使用 `setInterval` + `useEffect` 清理

```typescript
useEffect(() => {
  if (!autoRefresh) return;
  const interval = setInterval(refresh, 30000);
  return () => clearInterval(interval);
}, [autoRefresh, refresh]);
```

## 14.4 useDisplaySettings Hook

文件：`client/src/hooks/useDisplaySettings.ts`（63行）

```typescript
interface UseDisplaySettingsReturn {
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  density: 'compact' | 'comfortable' | 'spacious';
  setDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;
}
```

**localStorage 存储**：
- `display_font_size` — 字号（small=14px / medium=16px / large=18px）
- `display_density` — 密度（compact=8px / comfortable=12px / spacious=16px）

**应用方式**：
- 设置 `document.documentElement.style.fontSize` 改变根字号
- 设置 CSS 类 `density-compact` / `density-comfortable` / `density-spacious` 改变间距

## 14.5 useTheme Hook

文件：`client/src/hooks/useTheme.ts`（101行）

```typescript
interface UseThemeReturn {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  availableThemes: { name: ThemeName; label: string; description: string }[];
}

type ThemeName = 'light' | 'dark' | 'eye-care';
```

**localStorage 存储**：
- `heat-treatment-theme` — 当前主题名

**应用方式**：
```typescript
const setTheme = useCallback((theme: ThemeName) => {
  document.documentElement.setAttribute('data-theme', theme === 'light' ? '' : theme);
  localStorage.setItem('heat-treatment-theme', theme);
  setThemeState(theme);
}, []);
```

**可用主题列表**：
```typescript
const availableThemes = [
  { name: 'light', label: '浅色', description: '默认浅色主题，适合明亮环境' },
  { name: 'dark', label: '深色', description: '暗色主题，适合弱光环境' },
  { name: 'eye-care', label: '护眼', description: '暖色调主题，减轻视觉疲劳' },
];
```

## 14.6 TenantContext

文件：`client/src/contexts/TenantContext.tsx`（83行）

```typescript
interface TenantContextValue {
  orgCode: string | null;
  orgName: string | null;
  setTenant: (orgCode: string, orgName: string) => void;
  clearTenant: () => void;
}

const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orgCode, setOrgCode] = useState<string | null>(
    localStorage.getItem('currentOrgCode')
  );
  const [orgName, setOrgName] = useState<string | null>(
    localStorage.getItem('currentOrgName')
  );

  const setTenant = useCallback((code: string, name: string) => {
    localStorage.setItem('currentOrgCode', code);
    localStorage.setItem('currentOrgName', name);
    setOrgCode(code);
    setOrgName(name);
  }, []);

  const clearTenant = useCallback(() => {
    localStorage.removeItem('currentOrgCode');
    localStorage.removeItem('currentOrgName');
    setOrgCode(null);
    setOrgName(null);
  }, []);

  return (
    <TenantContext.Provider value={{ orgCode, orgName, setTenant, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}
```

---

# 第15章 前端工具函数与样式系统

## 15.1 金额工具函数

文件：`client/src/utils/currency.ts`（87行）

```typescript
/**
 * 格式化金额（元 → 字符串）
 * 保留2位小数，添加千位分隔符
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 格式化数字（添加千位分隔符）
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

/**
 * 格式化金额（无货币符号）
 */
export function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * 元转分
 */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

/**
 * 分转元
 */
export function centsToYuan(cents: number): number {
  return cents / 100;
}

/**
 * 解析金额字符串为数字
 */
export function parseAmount(str: string): number {
  const num = parseFloat(str.replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * 安全加法（避免浮点精度问题）
 */
export function safeAdd(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}

/**
 * 安全乘法
 */
export function safeMultiply(a: number, b: number): number {
  return Math.round(a * b * 100) / 100;
}

/**
 * 计算金额（数量 × 单价）
 */
export function calculateAmount(quantity: number, unitPrice: number): number {
  return safeMultiply(quantity, unitPrice);
}

/**
 * 计算总金额
 */
export function calculateTotalAmount(items: Array<{ amount: number }>): number {
  return items.reduce((sum, item) => safeAdd(sum, item.amount), 0);
}
```

## 15.2 Excel 导出工具

文件：`client/src/utils/excelExport.ts`（147行）

```typescript
import * as XLSX from 'xlsx';

/**
 * 导出数据到Excel
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sheet1',
  headerMapping?: Record<string, string>,
): void {
  // 1. 映射表头
  const mappedData = headerMapping
    ? data.map(row => {
        const mapped: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
          const newKey = headerMapping[key] || key;
          mapped[newKey] = value;
        }
        return mapped;
      })
    : data;

  // 2. 创建工作表
  const ws = XLSX.utils.json_to_sheet(mappedData);

  // 3. 设置列宽
  const colWidths = Object.keys(mappedData[0] || {}).map(key => ({
    wch: Math.max(
      key.length * 2,
      ...mappedData.map(row => String(row[key] ?? '').length),
      10,
    ),
  }));
  ws['!cols'] = colWidths;

  // 4. 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 5. 导出
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * 从Excel文件解析数据
 */
export function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        resolve(json as Record<string, unknown>[]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
```

## 15.3 前端常量

文件：`client/src/utils/constants.ts`（84行）

```typescript
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200, 500];

export const DEFAULT_PAGE_SIZE = 100;

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const TIME_FORMAT = 'HH:mm';

export const STORAGE_KEYS = {
  USER_INFO: '__global_heat_user_info',
  CUSTOMER_LIST: '__global_heat_customer_list',
  PRODUCT_LIST: '__global_heat_product_list',
  PRINT_TEMPLATES: '__global_heat_print_templates',
  ACTIVE_TEMPLATES: '__global_heat_print_active_templates',
  THEME: 'heat-treatment-theme',
  FONT_SIZE: 'display_font_size',
  DENSITY: 'display_density',
  ORG_CODE: 'currentOrgCode',
  ORG_NAME: 'currentOrgName',
} as const;

export const NAVIGATION_GROUPS = [
  {
    title: '工作台',
    items: [
      { label: '工作台', path: '/dashboard', icon: 'LayoutDashboard', permission: 'dashboard' },
    ],
  },
  {
    title: '业务操作',
    items: [
      { label: '来货登记', path: '/inbound', icon: 'Inbox', permission: 'inbound' },
      { label: '快速发货', path: '/outbound', icon: 'Outbox', permission: 'outbound' },
      { label: '单据查询', path: '/orders', icon: 'FileText', permission: 'orders' },
      { label: '库存管理', path: '/inventory', icon: 'Package', permission: 'inventory' },
      { label: '智能对账', path: '/reconciliation', icon: 'FileCheck', permission: 'reconciliation' },
    ],
  },
  {
    title: '数据洞察',
    items: [
      { label: '数据概览', path: '/statistics', icon: 'BarChart', permission: 'statistics' },
      { label: '客户分析', path: '/statistics/customer', icon: 'Users', permission: 'statistics' },
      { label: '库存分析', path: '/statistics/inventory', icon: 'Boxes', permission: 'statistics' },
      { label: '产品分析', path: '/statistics/product', icon: 'PackageSearch', permission: 'statistics' },
      { label: '财务分析', path: '/statistics/finance', icon: 'TrendingUp', permission: 'statistics' },
    ],
  },
  {
    title: '系统管理',
    items: [
      { label: '客户管理', path: '/customers', icon: 'Users', permission: 'customers' },
      { label: '产品管理', path: '/products', icon: 'PackageSearch', permission: 'products' },
      { label: '管理后台', path: '/admin', icon: 'Shield', permission: 'admin' },
    ],
    collapsibleItems: [
      { label: '打印模板', path: '/settings/templates', icon: 'Printer', permission: 'templates' },
      { label: '显示设置', path: '/settings/display', icon: 'Monitor', permission: 'display' },
      { label: '权限管理', path: '/settings/permissions', icon: 'Lock', permission: 'permissions' },
      { label: '用户手册', path: '/settings/manual', icon: 'BookOpen', permission: 'manual' },
    ],
  },
] as const;
```

## 15.4 shadcn/ui 组件清单

系统使用58个shadcn/ui组件，位于 `client/src/components/ui/` 目录下：

| 组件 | 文件名 | 用途 |
|------|--------|------|
| Alert | alert.tsx | 警告提示 |
| AlertDialog | alert-dialog.tsx | 确认对话框 |
| Avatar | avatar.tsx | 头像 |
| Badge | badge.tsx | 徽章标签 |
| Breadcrumb | breadcrumb.tsx | 面包屑导航 |
| Button | button.tsx | 按钮 |
| Calendar | calendar.tsx | 日历选择器 |
| Card | card.tsx | 卡片容器 |
| Carousel | carousel.tsx | 轮播 |
| Checkbox | checkbox.tsx | 复选框 |
| Collapsible | collapsible.tsx | 折叠面板 |
| Command | command.tsx | 命令面板 |
| ContextMenu | context-menu.tsx | 右键菜单 |
| DataTable | data-table.tsx | 数据表格 |
| DatePicker | date-picker.tsx | 日期选择器 |
| Dialog | dialog.tsx | 对话框 |
| Drawer | drawer.tsx | 抽屉 |
| DropdownMenu | dropdown-menu.tsx | 下拉菜单 |
| Empty | empty.tsx | 空状态 |
| Form | form.tsx | 表单容器 |
| HoverCard | hover-card.tsx | 悬停卡片 |
| Input | input.tsx | 输入框 |
| Label | label.tsx | 标签 |
| Menubar | menubar.tsx | 菜单栏 |
| NavigationMenu | navigation-menu.tsx | 导航菜单 |
| Pagination | pagination.tsx | 分页 |
| Popover | popover.tsx | 气泡弹出 |
| Progress | progress.tsx | 进度条 |
| RadioGroup | radio-group.tsx | 单选组 |
| Resizable | resizable.tsx | 可调整大小 |
| ScrollArea | scroll-area.tsx | 滚动区域 |
| Select | select.tsx | 下拉选择 |
| Separator | separator.tsx | 分割线 |
| Sheet | sheet.tsx | 侧边抽屉 |
| Skeleton | skeleton.tsx | 骨架屏 |
| Slider | slider.tsx | 滑块 |
| Sonner | sonner.tsx | Toast通知 |
| Spinner | spinner.tsx | 加载旋转器 |
| Stat | stat.tsx | 统计指标卡 |
| Switch | switch.tsx | 开关 |
| Table | table.tsx | 表格基础组件 |
| Tabs | tabs.tsx | 标签页 |
| Textarea | textarea.tsx | 文本域 |
| Toast | toast.tsx | Toast通知基础 |
| Toggle | toggle.tsx | 切换按钮 |
| ToggleGroup | toggle-group.tsx | 切换组 |
| Tooltip | tooltip.tsx | 工具提示 |
| Image | image.tsx | 图片组件 |
| Streamdown | streamdown.tsx | Markdown渲染 |
| UniversalLink | universal-link.tsx | 通用链接 |

---

<!-- BATCH_3_END -->

---

# 第16章 前端核心业务页面（上）

## 16.1 DashboardPage（工作台）

文件：`client/src/pages/DashboardPage/DashboardPage.tsx`（1036行）

### 16.1.1 页面结构

```
DashboardPage
├── 页面标题区
├── 时间筛选器（今日/本周/本月/本年）
├── KPI指标卡片行（6个卡片，Grid布局）
│   ├── 今日入库 (数量+重量+增长率)
│   ├── 今日出库 (数量+重量+增长率)
│   ├── 当前库存 (总数量+总重量+产品数)
│   ├── 低库存预警 (预警产品数)
│   ├── 待对账 (待对账出库单数+金额)
│   └── 待回款 (待回款对账单数+金额)
├── 主内容区（2列布局）
│   ├── 左列（2/3宽度）
│   │   ├── 收发货趋势图表（ReactECharts折线图）
│   │   └── 最近活动列表（实时动态流水）
│   └── 右列（1/3宽度）
│       ├── 快捷入口卡片（6个快捷按钮）
│       └── 风险预警列表
└── 底部留白
```

### 16.1.2 KPI卡片规格

每个KPI卡片包含：
- 图标（左上角，圆角背景色块）
- 数值（大字号，`text-3xl font-bold`）
- 标签（小字号，`text-sm text-muted-foreground`）
- 趋势指示器（上升绿色箭头↓/下降红色箭头↑）
- 增长率（百分比，可选）

**卡片数据映射**：

| 卡片 | 数据来源 | API调用 | 刷新频率 |
|------|---------|---------|----------|
| 今日入库 | `realtimeStats.today.inbound` | `GET /api/statistics/dashboard/realtime` | 30秒轮询 |
| 今日出库 | `realtimeStats.today.outbound` | 同上 | 30秒轮询 |
| 当前库存 | `statistics.inventory` | `GET /api/statistics/dashboard/stats` | 页面加载 |
| 低库存预警 | `alerts.inventory.lowStock` | `GET /api/statistics/dashboard/alerts` | 页面加载 |
| 待对账 | `alerts.finance.pendingReconciliation` | 同上 | 页面加载 |
| 待回款 | `alerts.finance.pendingReceiptAmount` | 同上 | 页面加载 |

### 16.1.3 趋势图表

```typescript
const chartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['入库', '出库'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: trendDates },
  yAxis: [
    { type: 'value', name: '数量', position: 'left' },
    { type: 'value', name: '金额', position: 'right' },
  ],
  series: [
    {
      name: '入库',
      type: 'line',
      smooth: true,
      data: inboundData,
      itemStyle: { color: 'var(--chart-1)' },
      areaStyle: { opacity: 0.1 },
    },
    {
      name: '出库',
      type: 'line',
      smooth: true,
      data: outboundData,
      itemStyle: { color: 'var(--chart-2)' },
      areaStyle: { opacity: 0.1 },
    },
  ],
};
```

### 16.1.4 快捷入口

| 按钮 | 路由 | 图标 | 按钮样式 |
|------|------|------|---------|
| 来货登记 | `/inbound` | Inbox | accent色按钮 |
| 快速发货 | `/outbound` | Outbox | accent色按钮 |
| 库存查询 | `/inventory` | Package | secondary按钮 |
| 智能对账 | `/reconciliation` | FileCheck | secondary按钮 |
| 数据统计 | `/statistics` | BarChart | secondary按钮 |
| 客户管理 | `/customers` | Users | secondary按钮 |

### 16.1.5 最近活动列表

```typescript
interface ActivityItem {
  id: string;
  type: 'inbound' | 'outbound' | 'product' | 'customer' | 'inventory' | 'reconciliation' | 'system';
  user: string;
  action: string;
  time: string;
  icon: LucideIcon;
  color: string;
}
```

**活动类型映射**：

| type | 图标 | 颜色 |
|------|------|------|
| inbound | Inbox | text-primary |
| outbound | Outbox | text-accent |
| product | Package | text-info |
| customer | Users | text-success |
| inventory | Boxes | text-warning |
| reconciliation | FileCheck | text-primary |
| system | Settings | text-muted-foreground |

### 16.1.6 状态管理

```typescript
const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
const [trends, setTrends] = useState<DashboardTrends[]>([]);
const [activities, setActivities] = useState<DashboardActivity[]>([]);
const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
const [loading, setLoading] = useState(true);

// 实时数据轮询
useEffect(() => {
  const fetchRealtime = async () => {
    try {
      const data = await statisticsApi.getDashboardRealtime();
      setRealtimeStats(data);
    } catch (err) {
      logger.error('Failed to fetch realtime stats', err);
    }
  };
  fetchRealtime();
  const interval = setInterval(fetchRealtime, 30000);
  return () => clearInterval(interval);
}, []);
```

## 16.2 InboundPage（来货登记）

文件：`client/src/pages/InboundPage/InboundPage.tsx`（1925行）

### 16.2.1 三步收货流程

```
Step 1: 选客户
  ├── 客户搜索框（实时搜索 + 下拉建议）
  ├── 最近客户快捷选择
  ├── 新客户快速创建
  └── 选中客户后自动带出历史信息

Step 2: 选产品
  ├── 产品搜索（名称/材质/工艺/工件编号）
  ├── 清单导入（Excel批量导入）
  ├── 语音录入（AI解析）
  ├── 已选产品列表（可编辑数量/重量）
  └── 新产品快速创建

Step 3: 录数据
  ├── 入库基本信息（日期/时间/收货人/运输方/车牌/司机）
  ├── 产品明细确认表（只读）
  ├── 金额汇总（自动计算）
  ├── 保存按钮
  └── 保存后触发打印流程卡
```

### 16.2.2 进度指示器

```tsx
<div className="flex items-center justify-center mb-8">
  {[1, 2, 3].map((step, idx) => (
    <React.Fragment key={step}>
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center font-medium',
        currentStep > step && 'bg-success text-white',
        currentStep === step && 'bg-primary text-white animate-pulse',
        currentStep < step && 'bg-muted text-muted-foreground',
      )}>
        {currentStep > step ? <Check className="w-5 h-5" /> : step}
      </div>
      {idx < 2 && (
        <div className={cn(
          'flex-1 h-0.5 mx-2',
          currentStep > step ? 'bg-success' : 'bg-border',
        )} />
      )}
    </React.Fragment>
  ))}
</div>
```

### 16.2.3 客户搜索组件

```typescript
interface CustomerSearchProps {
  onSelect: (customer: Customer) => void;
  selected: Customer | null;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ onSelect, selected }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // 防抖搜索
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await customerApi.list({ keyword: query, pageSize: 20 });
        setResults(data.items);
        setShowDropdown(true);
      } catch (err) {
        logger.error('Customer search failed', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <Input
        placeholder="搜索客户名称/编码/联系人..."
        value={selected ? selected.name : query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (selected) onSelect(null);
        }}
        onFocus={() => query && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((customer) => (
            <div
              key={customer.id}
              className="px-4 py-2 hover:bg-muted cursor-pointer"
              onMouseDown={() => {
                onSelect(customer);
                setShowDropdown(false);
              }}
            >
              <div className="font-medium">{customer.name}</div>
              <div className="text-sm text-muted-foreground">
                {customer.code} · {customer.contact || '无联系人'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 16.2.4 产品选择组件

**支持三种添加方式**：
1. **搜索添加**：实时搜索产品名称/材质/工艺/工件编号
2. **Excel导入**：批量导入产品清单
3. **语音录入**：AI解析语音文本

**已选产品列表**：
- 表格展示：产品名称、材质、工艺、单位、单价、数量、重量、金额
- 数量和重量可编辑
- 金额自动计算（数量 × 单价）
- 支持删除行
- 底部汇总：总数量、总重量、总金额

### 16.2.5 表单数据结构

```typescript
interface InboundFormData {
  customerId: string;
  customerName: string;
  customerCode: string;
  inboundDate: string;
  inboundTime: string;
  creator: string;
  receiver: string;
  transporter: string;
  plateNumber: string;
  driver: string;
  details: InboundDetailItem[];
}

interface InboundDetailItem {
  productId: string;
  productName: string;
  material: string;
  process: string;
  techRequirement: string;
  workpieceNo: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  weight: number;
  amount: number;
  urgent: boolean;
  inboundType: string;
}
```

### 16.2.6 保存逻辑

```typescript
const handleSave = async () => {
  // 1. 表单校验
  if (!formData.customerId) {
    toast.error('请选择客户');
    return;
  }
  if (formData.details.length === 0) {
    toast.error('请至少添加一个产品');
    return;
  }
  for (const detail of formData.details) {
    if (detail.quantity <= 0) {
      toast.error(`${detail.productName} 数量必须大于0`);
      return;
    }
    if (detail.weight <= 0) {
      toast.error(`${detail.productName} 重量必须大于0`);
      return;
    }
  }

  // 2. 计算汇总
  const totalQuantity = formData.details.reduce((sum, d) => sum + d.quantity, 0);
  const totalWeight = formData.details.reduce((sum, d) => sum + d.weight, 0);
  const totalAmount = formData.details.reduce((sum, d) => sum + d.amount, 0);

  // 3. 调用API
  try {
    setSaving(true);
    const order = await createInboundOrder({
      ...formData,
      totalQuantity,
      totalWeight,
      totalAmount,
    });
    toast.success('入库单创建成功');

    // 4. 触发打印
    if (printOnSave) {
      handlePrint(order);
    }

    // 5. 重置表单
    resetForm();
    setCurrentStep(1);
  } catch (err) {
    toast.error('创建失败：' + err.message);
  } finally {
    setSaving(false);
  }
};
```

## 16.3 OutboundPage（快速发货）

文件：`client/src/pages/OutboundPage/OutboundPage.tsx`（1355行）

### 16.3.1 页面结构

```
OutboundPage
├── 页面标题区
├── 客户选择区
│   ├── 客户搜索
│   └── 选中客户后显示：客户库存列表
├── 产品选择区
│   ├── 客户库存列表（可勾选 + 数量输入）
│   ├── 智能批次推荐（FIFO自动分配）
│   ├── 批量勾选/取消勾选
│   └── 已选产品汇总
├── 出库信息区
│   ├── 出库日期
│   ├── 收货人
│   ├── 运输方/车牌/司机
│   └── 金额汇总
├── 底部操作栏（固定）
│   ├── 取消
│   ├── 保存草稿
│   └── 确认发货
└── 打印预览弹窗（确认后触发）
```

### 16.3.2 客户库存列表

选中客户后，调用 `GET /api/outbound/customer-stocks/:customerCode` 获取该客户所有有库存的产品列表。

**列表列**：
| 列名 | 说明 | 可编辑 |
|------|------|--------|
| 复选框 | 勾选要出库的产品 | ✓ |
| 产品名称 | - | ✗ |
| 工件编号 | - | ✗ |
| 材质/工艺 | - | ✗ |
| 当前库存 | 显示当前库存数量 | ✗ |
| 可出库数量 | 可出库的最大数量 | ✗ |
| 出库数量 | 用户输入的出库数量 | ✓ |
| 出库重量 | 用户输入的出库重量 | ✓ |
| 单价 | - | ✗ |
| 金额 | 自动计算 | ✗ |
| 批次 | 显示/选择批次（点击展开批次列表） | ✓ |

### 16.3.3 智能批次推荐

```typescript
const handleAutoAssignBatches = async (productId: string, requiredQty: number) => {
  try {
    const batches = await outboundApi.recommendBatches({
      productId,
      requiredQuantity: requiredQty,
    });
    // 自动填充批次选择
    setSelectedBatches(prev => ({
      ...prev,
      [productId]: batches,
    }));
    toast.success(`已为 ${requiredQty} 件自动分配批次（FIFO）`);
  } catch (err) {
    toast.error('批次分配失败：' + err.message);
  }
};
```

### 16.3.4 保存逻辑

```typescript
const handleConfirmOutbound = async () => {
  // 1. 校验
  const selectedItems = items.filter(i => i.selected && i.outboundQty > 0);
  if (selectedItems.length === 0) {
    toast.error('请至少选择一个出库产品');
    return;
  }

  // 2. 库存校验
  for (const item of selectedItems) {
    if (item.outboundQty > item.availableStock) {
      toast.error(`${item.productName} 出库数量超过可用库存`);
      return;
    }
  }

  // 3. 构建DTO
  const dto: CreateOutboundOrderDto = {
    outboundNo: generateOutboundNo(),
    customerId: selectedCustomer.id,
    customerName: selectedCustomer.name,
    customerCode: selectedCustomer.code,
    outboundDate: new Date().toISOString(),
    creator: currentUser.name,
    receiver: receiver || '',
    transporter: transporter || '',
    plateNumber: plateNumber || '',
    driver: driver || '',
    totalAmount: selectedItems.reduce((sum, i) => sum + i.amount, 0),
    totalQuantity: selectedItems.reduce((sum, i) => sum + i.outboundQty, 0),
    totalWeight: selectedItems.reduce((sum, i) => sum + i.outboundWeight, 0),
    details: selectedItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      workpieceNo: item.workpieceNo,
      material: item.material,
      process: item.process,
      unit: item.unit,
      unitPrice: item.unitPrice,
      quantity: item.outboundQty,
      weight: item.outboundWeight,
      amount: item.amount,
      batchNo: selectedBatches[item.productId]?.[0]?.batchNo,
      inboundDate: selectedBatches[item.productId]?.[0]?.inboundDate,
    })),
  };

  // 4. 调用API
  try {
    setSaving(true);
    const order = await createOutboundOrder(dto);
    toast.success('出库单创建成功');
    // 触发打印
    handlePrint(order);
    // 重置
    resetForm();
  } catch (err) {
    toast.error('创建失败：' + err.message);
  } finally {
    setSaving(false);
  }
};
```

---

# 第17章 前端核心业务页面（下）

## 17.1 ReconciliationPage（智能对账）

文件：`client/src/pages/ReconciliationPage/ReconciliationPage.tsx`（2193行）

### 17.1.1 页面结构

```
ReconciliationPage
├── 筛选区
│   ├── 客户选择
│   ├── 月份选择
│   ├── 状态筛选
│   └── 查询/重置按钮
├── 对账单列表（表格）
│   ├── 对账单号 | 客户名称 | 月份 | 状态 | 总金额 | 开票金额 | 回款金额 | 未回款 | 操作
│   └── 操作列：查看 | 编辑 | 审核 | 反审核 | 开票 | 回款 | 导出 | 锁定/解锁
├── 对账单详情弹窗（Dialog）
│   ├── 基本信息
│   ├── 出库单列表
│   ├── 对账明细表格
│   ├── 金额计算详情
│   │   ├── 基础金额
│   │   ├── 扣款金额（可编辑）
│   │   ├── 其他金额（可编辑）
│   │   ├── 补偿金额（可编辑）
│   │   └── 最终金额（自动计算）
│   ├── 开票记录列表
│   ├── 回款记录列表
│   └── 操作按钮区
└── 创建对账单弹窗
    ├── 选择客户
    ├── 选择月份
    ├── 选择出库单（多选）
    ├── 金额预览
    └── 确认创建
```

### 17.1.2 状态管理

```typescript
const [reconciliationList, setReconciliationList] = useState<Reconciliation[]>([]);
const [selectedRecon, setSelectedRecon] = useState<Reconciliation | null>(null);
const [detailDialogOpen, setDetailDialogOpen] = useState(false);
const [createDialogOpen, setCreateDialogOpen] = useState(false);
const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
const [filter, setFilter] = useState({
  customerId: '',
  month: '',
  status: '',
  page: 1,
  pageSize: 20,
});
const [loading, setLoading] = useState(false);
const [total, setTotal] = useState(0);
```

### 17.1.3 对账单状态颜色映射

| 状态 | 颜色 | 标签 |
|------|------|------|
| draft | `bg-muted text-muted-foreground` | 草稿 |
| confirmed | `bg-info/10 text-info` | 待审核 |
| audited | `bg-success/10 text-success` | 已审核 |
| invoiced | `bg-primary/10 text-primary` | 已开票 |
| partial_paid | `bg-warning/10 text-warning` | 部分回款 |
| paid | `bg-success/10 text-success` | 已回款 |
| cancelled | `bg-muted text-muted-foreground` | 已取消 |
| voided | `bg-error/10 text-error` | 已作废 |

### 17.1.4 金额计算详情

```typescript
const renderCalculation = (calc: ReconciliationCalculationDetail) => (
  <div className="space-y-3">
    <div className="flex justify-between">
      <span className="text-muted-foreground">基础金额</span>
      <span className="font-medium">¥{formatAmount(calc.baseAmount)}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">扣款金额</span>
      <span className="font-medium text-error">-¥{formatAmount(calc.deductionAmount)}</span>
    </div>
    {calc.deductionReason && (
      <div className="text-sm text-muted-foreground ml-4">原因：{calc.deductionReason}</div>
    )}
    <div className="flex justify-between">
      <span className="text-muted-foreground">其他金额</span>
      <span className="font-medium">+¥{formatAmount(calc.otherAmount)}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">补偿金额</span>
      <span className="font-medium">+¥{formatAmount(calc.compensationAmount)}</span>
    </div>
    <Separator />
    <div className="flex justify-between text-lg">
      <span className="font-semibold">最终金额</span>
      <span className="font-bold text-primary">¥{formatAmount(calc.finalAmount)}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">已开票</span>
      <span>¥{formatAmount(calc.invoiceAmount)} ({calc.invoiceCount}笔)</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">未开票</span>
      <span className={calc.uninvoiceAmount > 0 ? 'text-warning' : ''}>
        ¥{formatAmount(calc.uninvoiceAmount)}
      </span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">已回款</span>
      <span>¥{formatAmount(calc.receiptAmount)} ({calc.receiptCount}笔)</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">未回款</span>
      <span className={calc.unreceivedAmount > 0 ? 'text-error' : 'text-success'}>
        ¥{formatAmount(calc.unreceivedAmount)}
      </span>
    </div>
  </div>
);
```

### 17.1.5 创建对账单流程

```
1. 选择客户 → 加载该客户未对账的出库单列表
2. 选择月份 → 过滤出库单
3. 勾选出库单（多选）
4. 自动计算：totalAmount = SUM(selectedOutbounds.totalAmount)
5. 编辑扣款/其他/补偿金额
6. 实时计算：finalAmount = totalAmount - deduction + other + compensation
7. 确认创建 → 调用 API
8. 创建成功 → 刷新列表
```

### 17.1.6 开票登记弹窗

```typescript
interface InvoiceDialogProps {
  reconciliationId: string;
  open: boolean;
  onClose: () => void;
}

const InvoiceDialog: React.FC<InvoiceDialogProps> = ({ reconciliationId, open, onClose }) => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    remark: '',
  });

  const handleSubmit = async () => {
    try {
      await reconciliationApi.invoice(reconciliationId, invoiceData);
      toast.success('开票登记成功');
      onClose();
      // 刷新详情
      refreshDetail();
    } catch (err) {
      toast.error('开票失败：' + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>登记开票</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <FormField label="发票号码">
            <Input
              value={invoiceData.invoiceNo}
              onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNo: e.target.value })}
              placeholder="请输入发票号码"
            />
          </FormField>
          <FormField label="开票金额">
            <Input
              type="number"
              value={invoiceData.amount}
              onChange={(e) => setInvoiceData({ ...invoiceData, amount: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="开票日期">
            <DatePicker
              value={invoiceData.date}
              onChange={(date) => setInvoiceData({ ...invoiceData, date })}
            />
          </FormField>
          <FormField label="备注">
            <Textarea
              value={invoiceData.remark}
              onChange={(e) => setInvoiceData({ ...invoiceData, remark: e.target.value })}
            />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

## 17.2 InventoryPage（库存管理）

文件：`client/src/pages/InventoryPage/InventoryPage.tsx`（962行）

### 17.2.1 页面结构

```
InventoryPage
├── 筛选区
│   ├── 搜索框（产品名称/工件编号/批次号）
│   ├── 材质筛选
│   ├── 工艺筛选
│   ├── 库存状态筛选（全部/正常/低库存/零库存/超期）
│   └── 导出按钮
├── 标签页切换
│   ├── Tab 1: 库存列表（表格）
│   ├── Tab 2: 库存变动记录
│   ├── Tab 3: 库存预警
│   └── Tab 4: 超期库存
├── 库存列表表格
│   ├── 产品编码 | 产品名称 | 材质 | 工艺 | 当前库存 | 库存重量 | 单位 | 客户名称 | 最后入库日期 | 库存状态 | 操作
│   └── 操作列：查看批次 | 调整库存 | 查看记录
├── 库存调整弹窗
│   ├── 产品信息（只读）
│   ├── 当前库存（只读）
│   ├── 调整类型（盘盈/盘亏/损坏/质检不合格/其他）
│   ├── 调整数量（正/负）
│   ├── 调整重量
│   ├── 原因说明
│   └── 确认调整
└── 批次详情弹窗
    ├── 产品信息
    └── 批次列表表格（批次号 | 入库日期 | 数量 | 可用数量 | 重量 | 状态）
```

### 17.2.2 库存状态映射

```typescript
const getStockStatus = (product: InventorySummary): {
  label: string;
  color: string;
} => {
  if (product.currentStock === 0) {
    return { label: '零库存', color: 'text-muted-foreground' };
  }
  if (product.currentStock <= (product.warningThreshold || 50)) {
    return { label: '低库存', color: 'text-warning' };
  }
  return { label: '正常', color: 'text-success' };
};
```

### 17.2.3 库存调整流程

```typescript
const handleAdjustStock = async () => {
  // 1. 校验
  if (adjustData.quantityChange === 0) {
    toast.error('调整数量不能为0');
    return;
  }
  if (!adjustData.reason) {
    toast.error('请填写调整原因');
    return;
  }

  // 2. 检查调整后库存是否为负
  const newStock = selectedProduct.currentStock + adjustData.quantityChange;
  if (newStock < 0) {
    toast.error('调整后库存不能为负数');
    return;
  }

  // 3. 调用API
  try {
    setAdjusting(true);
    await adjustStock({
      productId: selectedProduct.productId,
      quantityChange: adjustData.quantityChange,
      weightChange: adjustData.weightChange,
      operator: currentUser.name,
      reason: adjustData.reasonType,
      remark: adjustData.reason,
    });
    toast.success('库存调整成功');
    setAdjustDialogOpen(false);
    refreshInventory();
  } catch (err) {
    toast.error('调整失败：' + err.message);
  } finally {
    setAdjusting(false);
  }
};
```

## 17.3 StatisticsPage（数据统计）

文件：`client/src/pages/StatisticsPage/StatisticsPage.tsx`（1535行）

### 17.3.1 页面结构

```
StatisticsPage
├── 时间范围选择（日/月/年切换 + 自定义日期范围）
├── 标签页切换
│   ├── Tab 1: 综合报表
│   │   ├── KPI指标卡片行（4个：入库总量、出库总量、库存总值、客户数）
│   │   ├── 收发货趋势图（折线图，双Y轴：数量+金额）
│   │   ├── 收发分类对比图（柱状图）
│   │   └── 业务流水表
│   ├── Tab 2: 客户分析 → 跳转 /statistics/customer
│   ├── Tab 3: 产品分析 → 跳转 /statistics/product
│   ├── Tab 4: 延误分析
│   │   ├── 延误订单统计卡片
│   │   ├── 延误原因分布图（饼图）
│   │   └── 延误订单列表
│   └── Tab 5: 财务分析 → 跳转 /statistics/finance
```

### 17.3.2 图表配置

**收发货趋势图**（ReactECharts）：
```typescript
const trendChartOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: { data: ['入库数量', '出库数量', '出库金额'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: dateLabels },
  yAxis: [
    { type: 'value', name: '数量', position: 'left' },
    { type: 'value', name: '金额(元)', position: 'right' },
  ],
  series: [
    { name: '入库数量', type: 'line', smooth: true, data: inboundQtyData, itemStyle: { color: 'var(--chart-1)' } },
    { name: '出库数量', type: 'line', smooth: true, data: outboundQtyData, itemStyle: { color: 'var(--chart-2)' } },
    { name: '出库金额', type: 'line', smooth: true, yAxisIndex: 1, data: outboundAmtData, itemStyle: { color: 'var(--chart-3)' } },
  ],
};
```

**客户发货量排行**（横向柱状图）：
```typescript
const customerRankChartOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: customerNames, inverse: true },
  series: [
    {
      name: '发货量',
      type: 'bar',
      data: shipmentData,
      itemStyle: { color: 'var(--chart-1)' },
      label: { show: true, position: 'right' },
    },
  ],
};
```

## 17.4 CustomerListPage（客户管理）

文件：`client/src/pages/CustomerListPage/CustomerListPage.tsx`（1440行）

### 17.4.1 功能清单

| 功能 | 实现方式 |
|------|---------|
| 客户列表 | 分页表格，支持搜索/筛选/排序 |
| 新增客户 | Dialog弹窗表单 |
| 编辑客户 | Dialog弹窗表单（预填充） |
| 删除客户 | 确认弹窗 + 原因输入 |
| 批量删除 | 复选框全选 + 批量操作栏 |
| Excel导入 | 文件上传 + 列映射 + 预览 + 导入 |
| Excel导出 | 全量导出 |
| 查看详情 | 跳转 `/customers/:id` |
| 停用/激活 | 状态切换 |
| 查看活动记录 | 跳转详情页查看 |

### 17.4.2 表格列定义

| 列名 | 字段 | 可排序 | 宽度 |
|------|------|--------|------|
| 复选框 | - | ✗ | 40px |
| 客户编码 | code | ✓ | 120px |
| 客户名称 | name | ✓ | 180px |
| 联系人 | contact | ✗ | 100px |
| 电话 | phone | ✗ | 120px |
| 运输方式 | transport | ✗ | 100px |
| 入库次数 | inboundCount | ✓ | 80px |
| 状态 | status | ✓ | 80px |
| 创建时间 | createdAt | ✓ | 150px |
| 操作 | - | ✗ | 200px |

### 17.4.3 Excel导入流程

```
1. 用户选择文件
2. 前端解析Excel (parseExcelFile)
3. 自动列映射（中英文表头匹配）
4. 预览数据（前10行）
5. 用户确认映射
6. 调用 POST /api/customers/import
7. 返回导入结果（成功/失败/跳过计数）
8. 刷新客户列表
```

**列映射规则**：

| Excel列名（中文） | 系统字段 |
|------------------|----------|
| 客户编码 | code |
| 客户名称 | name |
| 联系人 | contact |
| 电话 | phone |
| 地址 | address |
| 运输方式 | transport |
| 付款条件 | paymentTerm |
| 结算方式 | settlement |
| 客户类别 | category |

## 17.5 ProductListPage（产品管理）

文件：`client/src/pages/ProductListPage/ProductListPage.tsx`（1196行）

### 17.5.1 功能清单

与客户管理类似，额外功能：
- **材质筛选**：下拉选择，从 `getMaterials()` 获取
- **工艺筛选**：下拉选择，从 `getProcesses()` 获取
- **批次查看**：点击产品行展开批次列表
- **归档操作**：归档产品（设置 archived_at）
- **材质阈值配置**：批量设置材质默认预警阈值

### 17.5.2 表格列定义

| 列名 | 字段 | 可排序 |
|------|------|--------|
| 复选框 | - | ✗ |
| 产品编码 | code | ✓ |
| 产品名称 | name | ✓ |
| 材质 | material | ✗ |
| 工艺 | process | ✗ |
| 工件编号 | workpieceNo | ✗ |
| 单位 | unit | ✗ |
| 单价 | unitPrice | ✓ |
| 当前库存 | stock | ✓ |
| 库存重量 | stockWeight | ✗ |
| 客户名称 | customerName | ✗ |
| 状态 | status | ✓ |
| 最后入库 | inboundDate | ✓ |
| 操作 | - | ✗ |

---

# 第18章 前端其他页面完整规格

## 18.1 TemplateConfigPage（打印模板配置）

文件：`client/src/pages/TemplateConfigPage/TemplateConfigPage.tsx`（856行）

### 18.1.1 页面结构

```
TemplateConfigPage
├── 模板类型选择（标签页）
│   ├── 标识卡模板
│   ├── 送货单模板
│   └── 对账单模板
├── 模板列表（左侧）
│   ├── 模板卡片列表
│   ├── 新建模板按钮
│   └── 每个卡片：模板名称 + 纸张规格 + 设为当前/编辑/复制/删除
├── 模板编辑区（右侧）
│   ├── 基本信息（名称、纸张大小、方向、边距）
│   ├── 字段配置（拖拽排序 + 显示/隐藏 + 宽度/对齐）
│   ├── Logo上传
│   ├── 页眉/页脚设置
│   └── 预览区（实时预览）
└── 测试打印按钮
```

### 18.1.2 模板字段配置

```typescript
// 标识卡默认字段
const IDENTITY_CARD_FIELDS = [
  { key: 'customerName', label: '客户名称', visible: true, order: 1, width: 30 },
  { key: 'productName', label: '产品名称', visible: true, order: 2, width: 30 },
  { key: 'material', label: '材质', visible: true, order: 3, width: 15 },
  { key: 'process', label: '工艺', visible: true, order: 4, width: 15 },
  { key: 'workpieceNo', label: '工件编号', visible: true, order: 5, width: 20 },
  { key: 'quantity', label: '数量', visible: true, order: 6, width: 10 },
  { key: 'weight', label: '重量', visible: true, order: 7, width: 10 },
  { key: 'batchNo', label: '批次号', visible: true, order: 8, width: 20 },
  { key: 'inboundDate', label: '入库日期', visible: true, order: 9, width: 15 },
  { key: 'techRequirement', label: '技术要求', visible: false, order: 10, width: 30 },
  { key: 'productImage', label: '产品图片', visible: true, order: 11, width: 40 },
];

// 送货单默认字段
const DELIVERY_NOTE_FIELDS = [
  { key: 'outboundNo', label: '出库单号', visible: true, order: 1, width: 15 },
  { key: 'customerName', label: '客户名称', visible: true, order: 2, width: 20 },
  { key: 'outboundDate', label: '出库日期', visible: true, order: 3, width: 12 },
  { key: 'productName', label: '产品名称', visible: true, order: 4, width: 20 },
  { key: 'material', label: '材质', visible: true, order: 5, width: 10 },
  { key: 'process', label: '工艺', visible: true, order: 6, width: 10 },
  { key: 'workpieceNo', label: '工件编号', visible: true, order: 7, width: 15 },
  { key: 'quantity', label: '数量', visible: true, order: 8, width: 8, align: 'right' },
  { key: 'weight', label: '重量', visible: true, order: 9, width: 8, align: 'right' },
  { key: 'unitPrice', label: '单价', visible: true, order: 10, width: 10, align: 'right' },
  { key: 'amount', label: '金额', visible: true, order: 11, width: 10, align: 'right' },
  { key: 'batchNo', label: '批次号', visible: true, order: 12, width: 15 },
];
```

### 18.1.3 纸张规格

```typescript
const PAPER_SIZES = {
  'A4': { width: 210, height: 297, unit: 'mm' },
  'A5': { width: 148, height: 210, unit: 'mm' },
  '80mm': { width: 80, height: 297, unit: 'mm' }, // 热敏纸
  '58mm': { width: 58, height: 297, unit: 'mm' }, // 小票纸
  'custom': { width: 0, height: 0, unit: 'mm' },
};
```

## 18.2 PermissionPage（权限管理）

文件：`client/src/pages/PermissionPage/PermissionPage.tsx`（1262行）

### 18.2.1 页面结构

```
PermissionPage
├── 标签页
│   ├── Tab 1: 角色管理
│   │   ├── 角色列表（4个预设角色）
│   │   ├── 角色权限配置（权限矩阵：模块 × 权限码 → 复选框）
│   │   └── 保存按钮
│   ├── Tab 2: 用户管理
│   │   ├── 用户列表（表格）
│   │   ├── 角色分配（下拉选择）
│   │   └── 用户专属权限配置
│   └── Tab 3: 权限说明
│       └── 权限定义列表（24个权限码 + 说明）
```

### 18.2.2 权限矩阵

```typescript
// 权限矩阵渲染
const renderPermissionMatrix = (roleName: string, permissions: string[]) => {
  const modules = [
    { name: '客户管理', codes: ['customer:view', 'customer:create', 'customer:update', 'customer:delete'] },
    { name: '产品管理', codes: ['product:view', 'product:create', 'product:update', 'product:delete'] },
    { name: '来货登记', codes: ['inbound:view', 'inbound:create', 'inbound:undo'] },
    { name: '快速发货', codes: ['outbound:view', 'outbound:create', 'outbound:delete', 'outbound:undo'] },
    { name: '库存管理', codes: ['inventory:view', 'inventory:adjust'] },
    { name: '智能对账', codes: ['reconciliation:view', 'reconciliation:create', 'reconciliation:audit', 'reconciliation:unaudit'] },
    { name: '数据统计', codes: ['statistics:view'] },
    { name: '系统管理', codes: ['system:settings', 'system:permission'] },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>模块</TableHead>
          {modules.map(m => (
            <TableHead key={m.name} className="text-center">{m.name}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* 每行一个权限操作（查看/创建/编辑/删除等） */}
        {/* 每列一个模块 */}
        {/* 单元格为复选框 */}
      </TableBody>
    </Table>
  );
};
```

## 18.3 OrderListPage（单据查询）

文件：`client/src/pages/OrderListPage/OrderListPage.tsx`（820行）

### 18.3.1 页面结构

```
OrderListPage
├── 标签页切换
│   ├── 入库单列表
│   └── 出库单列表
├── 筛选区
│   ├── 单号搜索
│   ├── 客户筛选
│   ├── 日期范围
│   ├── 状态筛选（全部/有效/已撤销）
│   └── 导出按钮
├── 统计卡片（3个）
│   ├── 总单据数
│   ├── 有效单据
│   └── 已撤销单据
├── 单据列表（表格）
│   ├── 入库/出库：单号 | 客户名称 | 日期 | 创建人 | 总数量 | 总重量 | 总金额 | 状态 | 操作
│   └── 操作列：查看详情 | 撤销（30分钟内）
└── 单据详情弹窗
    ├── 基本信息区
    ├── 产品明细表格
    └── 撤销按钮（带原因输入）
```

### 18.3.2 撤销流程

```typescript
const handleUndo = async (orderId: string, type: 'inbound' | 'outbound') => {
  // 1. 检查是否可撤销
  const checkResult = await undoApi.check(type, orderId);
  if (!checkResult.canUndo) {
    toast.error(`无法撤销：${checkResult.reason}`);
    if (checkResult.usedBatches?.length) {
      // 显示已使用批次详情
      setUsedBatchesDialog(checkResult.usedBatches);
    }
    return;
  }

  // 2. 确认撤销
  const confirmed = await confirmDialog({
    title: '确认撤销',
    message: `您还有 ${checkResult.remainingSeconds} 秒的撤销窗口，确认撤销此${type === 'inbound' ? '入库' : '出库'}单？`,
    requireReason: true,
  });
  if (!confirmed) return;

  // 3. 执行撤销
  try {
    await undoApi.execute({
      entityType: type,
      entityId: orderId,
      reason: confirmed.reason,
    });
    toast.success('撤销成功');
    refreshList();
  } catch (err) {
    toast.error('撤销失败：' + err.message);
  }
};
```

## 18.4 其他页面概览

### 18.4.1 LandingPage（着陆页）

文件：`client/src/pages/LandingPage/LandingPage.tsx`（906行）

公开页面，展示产品介绍和功能亮点。包含：Hero区域、功能特性、使用流程、CTA按钮。

### 18.4.2 LoginPage（登录页）

文件：`client/src/pages/LoginPage/LoginPage.tsx`（199行）

登录表单，支持用户名密码登录。登录成功后存储用户信息到localStorage，跳转 `/organizations`。

### 18.4.3 OrganizationPage（组织选择）

文件：`client/src/pages/OrganizationPage/OrganizationPage.tsx`（320行）

组织选择/创建页面。显示用户可访问的组织列表，支持创建新组织和通过邀请码加入。

### 18.4.4 CustomerDetailPage（客户详情）

文件：`client/src/pages/CustomerDetailPage/CustomerDetailPage.tsx`（721行）

客户详情页，包含：基本信息卡片、入库历史列表、出库历史列表、对账历史列表、统计数据。

### 18.4.5 ProductDetailPage（产品详情）

文件：`client/src/pages/ProductDetailPage/ProductDetailPage.tsx`（410行）

产品详情页，包含：基本信息、批次列表、库存变动记录、入库/出库历史。

### 18.4.6 ProfilePage（个人中心）

文件：`client/src/pages/ProfilePage/ProfilePage.tsx`（590行）

个人资料页，包含：用户信息展示/编辑、主题切换、字号设置、密码修改。

### 18.4.7 DisplaySettingsPage（显示设置）

文件：`client/src/pages/DisplaySettingsPage/DisplaySettingsPage.tsx`（102行）

显示设置页，包含：字号选择（小/中/大）、密度选择（紧凑/舒适/宽松）。

### 18.4.8 AdminDashboard（管理后台）

文件：`client/src/pages/AdminDashboard/AdminDashboard.tsx`（887行）

超级管理员后台，包含：组织列表、组织统计、用户列表、系统操作日志。

### 18.4.9 OperationLogPage（操作日志）

文件：`client/src/pages/OperationLogPage/OperationLogPage.tsx`（482行）

操作日志查询页，支持按实体类型、日期范围、操作人筛选。

### 18.4.10 UserManualPage（用户手册）

文件：`client/src/pages/UserManualPage/UserManualPage.tsx`（3633行）

内置用户手册页面，使用Markdown渲染，包含系统使用说明、功能介绍、FAQ等。使用 `Streamdown` 组件渲染Markdown内容。

### 18.4.11 FeatureFlagsPage（功能开关）

文件：`client/src/pages/FeatureFlagsPage/FeatureFlagsPage.tsx`（106行）

功能开关管理页，可启用/禁用实验性功能。

### 18.4.12 Statistics子页面

| 页面 | 文件 | 行数 | 说明 |
|------|------|------|------|
| CustomerAnalysisPage | CustomerAnalysisPage.tsx | 555 | 客户分析：发货量排行、回款率、客户画像 |
| InventoryAnalysisPage | InventoryAnalysisPage.tsx | 638 | 库存分析：周转率、积压预警、批次热力图 |
| ProductAnalysisPage | ProductAnalysisPage.tsx | 613 | 产品分析：热度排行、加工周期、材质分布 |
| FinanceAnalysisPage | FinanceAnalysisPage.tsx | 624 | 财务分析：收支对比、开票进度、回款趋势 |

### 18.4.13 OrganizationManagePage（组织管理）

文件：`client/src/pages/OrganizationManagePage/OrganizationManagePage.tsx`（378行）

组织管理页面，超级管理员可管理所有组织：查看/暂停/恢复组织、查看成员、查看统计。

### 18.4.14 NotFound（404页面）

文件：`client/src/pages/NotFound/NotFound.tsx`（11行）

```typescript
const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
    <p className="mt-4 text-muted-foreground">页面未找到</p>
    <Link to="/" className="mt-8 text-primary hover:underline">返回首页</Link>
  </div>
);
```

---

<!-- BATCH_4_END -->

---

# 第19章 多租户架构完整实现

## 19.1 租户中间件

文件：`server/common/middleware/tenant.middleware.ts`

### 19.1.1 完整实现

```typescript
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { db, schema } from '@server/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);
  private cache: Map<string, { org: any; expireAt: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟

  async use(req: Request & { userContext?: any }, res: Response, next: NextFunction) {
    try {
      const host = req.hostname || req.headers.host || '';
      const subdomain = this.extractSubdomain(host);
      if (!subdomain) {
        return next();
      }

      // 查缓存
      const cached = this.cache.get(subdomain);
      if (cached && cached.expireAt > Date.now()) {
        req.userContext = req.userContext || {};
        req.userContext.organizationId = cached.org.id;
        req.userContext.tenantCode = cached.org.code;
        req.userContext.databaseName = `tenant_${cached.org.id.replace(/-/g, '_')}`;
        return next();
      }

      // 查数据库
      const orgs = await db.select().from(schema.organizations).where(eq(schema.organizations.subdomain, subdomain));
      if (orgs.length === 0) {
        this.logger.warn(`No organization found for subdomain: ${subdomain}`);
        return next();
      }

      const org = orgs[0];
      if (org.status !== 'active') {
        return res.status(403).json({ error: 'Organization suspended' });
      }

      // 设置租户上下文
      req.userContext = req.userContext || {};
      req.userContext.organizationId = org.id;
      req.userContext.tenantCode = org.code;
      req.userContext.databaseName = `tenant_${org.id.replace(/-/g, '_')}`;

      // 写缓存
      this.cache.set(subdomain, { org, expireAt: Date.now() + this.CACHE_TTL });

      next();
    } catch (err) {
      this.logger.error(`Tenant middleware error: ${err.message}`, err.stack);
      next();
    }
  }

  private extractSubdomain(host: string): string | null {
    // 移除端口
    const hostname = host.split(':')[0];
    // 移除 www. 前缀
    const cleanHost = hostname.replace(/^www\./, '');
    const parts = cleanHost.split('.');
    if (parts.length < 3) return null;
    // 第一段是子域名
    const sub = parts[0];
    // 排除常见前缀
    if (['app', 'api', 'admin', 'www'].includes(sub)) return null;
    return sub;
  }
}
```

## 19.2 租户上下文服务

文件：`server/common/services/tenant-context.service.ts`

```typescript
import { Injectable, Scope, REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { Request } from 'express';

export interface TenantContext {
  organizationId: string;
  tenantCode: string;
  databaseName: string;
  userId: string;
}

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get context(): TenantContext | null {
    const ctx = this.request as any;
    if (!ctx.userContext?.organizationId) return null;
    return {
      organizationId: ctx.userContext.organizationId,
      tenantCode: ctx.userContext.tenantCode,
      databaseName: ctx.userContext.databaseName,
      userId: ctx.userContext.userId,
    };
  }

  get organizationId(): string | null {
    return this.context?.organizationId ?? null;
  }

  get userId(): string | null {
    return this.context?.userId ?? null;
  }

  requireOrganizationId(): string {
    const id = this.organizationId;
    if (!id) throw new Error('No tenant context available');
    return id;
  }
}
```

## 19.3 RLS策略完整定义

### 19.3.1 通用RLS策略

所有业务表共用以下RLS策略模板：

```sql
-- 启用行级安全
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能看到自己组织的行
CREATE POLICY <table_name>_tenant_isolation ON <table_name>
  FOR ALL
  USING (organization_id = current_setting('app.current_tenant_id')::text);

-- 创建策略：超级管理员可以看所有
CREATE POLICY <table_name>_super_admin ON <table_name>
  FOR ALL
  USING (current_setting('app.is_super_admin')::boolean = true);
```

### 19.3.2 inbound_order 特化RLS

```sql
-- 入库单额外策略：创建者和管理员可见
CREATE POLICY inbound_order_owner_access ON inbound_order
  FOR SELECT
  USING (
    created_by = current_setting('app.current_user_id')::text
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = current_setting('app.current_user_id')::text
      AND ur.role = 'admin'
      AND ur.organization_id = current_setting('app.current_tenant_id')::text
    )
  );
```

### 19.3.3 inbound_detail 特化RLS

```sql
-- 入库明细通过入库单关联组织
CREATE POLICY inbound_detail_tenant_join ON inbound_detail
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inbound_order io
      WHERE io.id = inbound_detail.order_id
      AND io.organization_id = current_setting('app.current_tenant_id')::text
    )
  );
```

### 19.3.4 设置租户ID的SQL函数

```sql
-- 每个请求开始时调用
SELECT set_config('app.current_tenant_id', :organizationId, false);
SELECT set_config('app.current_user_id', :userId, false);
SELECT set_config('app.is_super_admin', :isSuperAdmin::text, false);
```

## 19.4 组织管理模块

### 19.4.1 OrganizationController

```typescript
@Controller('api/organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get('current')
  async getCurrentOrg(@Req() req: Request) {
    const orgId = req.userContext.organizationId;
    return this.orgService.findById(orgId);
  }

  @Post()
  @NeedLogin()
  async create(@Req() req: Request, @Body() dto: CreateOrganizationDto) {
    return this.orgService.create({ ...dto, ownerId: req.userContext.userId });
  }

  @Get('mine')
  @NeedLogin()
  async getMyOrganizations(@Req() req: Request) {
    return this.orgService.findByUserId(req.userContext.userId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.orgService.findById(id);
  }

  @Patch(':id')
  @NeedLogin()
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgService.update(id, dto);
  }

  @Post(':id/members')
  @NeedLogin()
  async addMember(@Param('id') orgId: string, @Body() dto: { userId: string; role: string }) {
    return this.orgService.addMember(orgId, dto.userId, dto.role);
  }

  @Delete(':id/members/:userId')
  @NeedLogin()
  async removeMember(@Param('id') orgId: string, @Param('userId') userId: string) {
    return this.orgService.removeMember(orgId, userId);
  }

  @Get(':id/members')
  async getMembers(@Param('id') orgId: string) {
    return this.orgService.getMembers(orgId);
  }
}
```

### 19.4.2 OrganizationService

```typescript
@Injectable()
export class OrganizationService {
  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async create(data: CreateOrganizationData): Promise<Organization> {
    const id = uuidv4();
    const code = `ORG${Date.now().toString(36).toUpperCase()}`;
    const subdomain = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const dbName = `tenant_${id.replace(/-/g, '_')}`;

    // 1. 插入组织记录
    const [org] = await this.db.insert(schema.organizations).values({
      id,
      name: data.name,
      code,
      subdomain,
      status: 'active',
      ownerId: data.ownerId,
      plan: data.plan || 'free',
      databaseName: dbName,
      createdAt: new Date(),
    }).returning();

    // 2. 创建租户数据库
    await this.db.execute(sql.raw(`CREATE DATABASE ${dbName}`));

 // 3. 执行迁移到新数据库
    await this.migrateTenantDatabase(dbName);

    // 4. 添加创建者为管理员
    await this.db.insert(schema.organizationMembers).values({
      id: uuidv4(),
      organizationId: id,
      userId: data.ownerId,
      role: 'admin',
      joinedAt: new Date(),
    });

    return org;
  }

  private async migrateTenantDatabase(dbName: string) {
    // 执行所有建表SQL到新数据库
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '../database/migrations/tenant_schema.sql'),
      'utf-8'
    );
    await this.db.execute(sql.raw(`\c ${dbName}`));
    await this.db.execute(sql.raw(migrationSql));
  }

  async findByUserId(userId: string): Promise<Organization[]> {
    const result = await this.db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        code: schema.organizations.code,
        subdomain: schema.organizations.subdomain,
        status: schema.organizations.status,
        role: schema.organizationMembers.role,
      })
      .from(schema.organizations)
      .innerJoin(
        schema.organizationMembers,
        eq(schema.organizations.id, schema.organizationMembers.organizationId)
      )
      .where(eq(schema.organizationMembers.userId, userId));
    return result;
  }
}
```

## 19.5 多租户数据库连接池

```typescript
// server/database/tenant-db-pool.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export class TenantDbPool {
  private pools: Map<string, { pool: Pool; drizzle: any }> = new Map();

  getDb(databaseName: string) {
    let entry = this.pools.get(databaseName);
    if (!entry) {
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: databaseName,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 10,
        idleTimeoutMillis: 30000,
      });
      const drizzleDb = drizzle(pool, { schema });
      entry = { pool, drizzle: drizzleDb };
      this.pools.set(databaseName, entry);
    }
    return entry.drizzle;
  }

  async closeAll() {
    for (const { pool } of this.pools.values()) {
      await pool.end();
    }
    this.pools.clear();
  }
}
```

---

# 第20章 核心业务闭环完整流程

## 20.1 来货登记完整流程

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: 用户在前端选择客户                                        │
│  ├── 搜索客户（API: GET /api/customers?keyword=xxx）             │
│  ├── 选择客户 → 自动填充客户编码/联系人/运输方式                    │
│  └── 如无客户 → 快速创建（API: POST /api/customers）              │
├─────────────────────────────────────────────────────────────────┤
│ Step 2: 用户选择产品                                              │
│  ├── 搜索产品（API: GET /api/products?keyword=xxx）               │
│  ├── 添加到列表 → 可编辑数量/重量                                  │
│  ├── 支持Excel批量导入                                            │
│  └── 如无产品 → 快速创建（API: POST /api/products）               │
├─────────────────────────────────────────────────────────────────┤
│ Step 3: 用户填写入库信息                                           │
│  ├── 选择入库日期/时间/收货人/运输方/车牌/司机                       │
│  ├── 确认产品明细                                                  │
│  ├── 系统自动计算汇总（总数量/总重量/总金额）                        │
│  └── 点击保存                                                     │
├─────────────────────────────────────────────────────────────────┤
│ Step 4: 后端处理                                                   │
│  ├── POST /api/inbound                                            │
│  ├── InboundService.create()                                      │
│  │   ├── 开启数据库事务                                            │
│  │   ├── 生成入库单号（格式：IN+年月日+6位序号）                    │
│  │   ├── 插入 inbound_order 表                                     │
│  │   ├── 循环插入 inbound_detail 表                                │
│  │   ├── 循环插入 inventory_batch 表（创建批次）                    │
│  │   ├── 更新 inventory_summary 表（累加库存）                     │
│  │   ├── 记录 inventory_movement（入库流水）                       │
│  │   ├── 记录 operation_log（操作日志）                             │
│  │   └── 提交事务                                                 │
│  └── 返回入库单完整数据                                            │
├─────────────────────────────────────────────────────────────────┤
│ Step 5: 前端后续处理                                               │
│  ├── 显示成功提示                                                  │
│  ├── 触发打印流程卡（调用PrintService）                             │
│  └── 重置表单，回到Step 1                                         │
└─────────────────────────────────────────────────────────────────┘
```

## 20.2 快速发货完整流程

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: 用户选择客户                                              │
│  ├── 搜索客户 → 选中                                              │
│  └── 自动加载客户库存列表（API: GET /api/outbound/customer-stocks）│
├─────────────────────────────────────────────────────────────────┤
│ Step 2: 用户选择出库产品                                           │
│  ├── 从库存列表勾选产品                                            │
│  ├── 输入出库数量/重量                                              │
│  ├── 可选：手动选择批次（或点击"智能分配"自动FIFO）                 │
│  └── 系统实时校验库存是否足够                                       │
├─────────────────────────────────────────────────────────────────┤
│ Step 3: 用户填写出库信息                                           │
│  ├── 选择出库日期/收货人/运输方/车牌/司机                           │
│  ├── 系统自动计算汇总                                              │
│  └── 点击"确认发货"                                               │
├─────────────────────────────────────────────────────────────────┤
│ Step 4: 后端处理                                                   │
│  ├── POST /api/outbound                                            │
│  ├── OutboundService.create()                                      │
│  │   ├── 开启数据库事务                                            │
│  │   ├── 生成出库单号（格式：OUT+年月日+6位序号）                    │
│  │   ├── 校验所有产品库存                                          │
│  │   ├── 插入 outbound_order 表                                     │
│  │   ├── 循环处理出库明细：                                         │
│  │   │   ├── 插入 outbound_detail 表                               │
│  │   │   ├── FIFO扣减 inventory_batch.available_quantity            │
│  │   │   ├── 更新 inventory_summary.current_stock                  │
│  │   │   └── 记录 inventory_movement（出库流水）                     │
│  │   ├── 记录 operation_log                                         │
│  │   └── 提交事务                                                 │
│  └── 返回出库单完整数据                                            │
├─────────────────────────────────────────────────────────────────┤
│ Step 5: 前端后续处理                                               │
│  ├── 显示成功提示                                                  │
│  ├── 触发打印送货单                                                │
│  └── 重置表单                                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 20.3 智能对账完整流程

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: 创建对账单                                                │
│  ├── 选择客户 + 选择月份                                           │
│  ├── 加载该客户该月未对账的出库单列表（API: GET /api/outbound?...） │
│  ├── 勾选出库单 → 自动计算基础金额                                  │
│  ├── 编辑扣款/其他/补偿金额 → 实时计算最终金额                       │
│  └── 确认创建（API: POST /api/reconciliation）                     │
├─────────────────────────────────────────────────────────────────┤
│ Step 2: 后端创建                                                   │
│  ├── ReconciliationService.create()                                │
│  │   ├── 开启事务                                                  │
│  │   ├── 生成对账单号（格式：REC+年月+6位序号）                     │
│  │   ├── 插入 reconciliation 表                                     │
│  │   ├── 批量插入 reconciliation_item 表                           │
│  │   ├── 批量更新 outbound_order.reconciliation_id（标记已对账）     │
│  │   ├── 插入 reconciliation_calculation 表                        │
│  │   ├── 记录 operation_log                                         │
│  │   └── 提交事务                                                  │
│  └── 返回对账单详情                                                │
├─────────────────────────────────────────────────────────────────┤
│ Step 3: 审核对账单                                                 │
│  ├── 用户点击"审核" → API: POST /api/reconciliation/:id/audit      │
│  ├── 后端校验状态为draft或confirmed → 更新为audited                 │
│  └── 记录操作日志                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Step 4: 开票登记                                                   │
│  ├── 用户点击"开票" → 填写发票信息 → API: POST /api/reconciliation/:id/invoice │
│  ├── 后端插入 reconciliation_invoice 表                            │
│  ├── 更新对账单 invoice_amount                                      │
│  └── 如果 invoice_amount >= final_amount → 更新状态为 invoiced      │
├─────────────────────────────────────────────────────────────────┤
│ Step 5: 回款登记                                                   │
│  ├── 用户点击"回款" → 填写回款信息 → API: POST /api/reconciliation/:id/receipt │
│  ├── 后端插入 reconciliation_receipt 表                            │
│  ├── 更新对账单 receipt_amount                                      │
│  └── 如果 receipt_amount >= final_amount → 更新状态为 paid          │
│         否则如果 receipt_amount > 0 → 更新状态为 partial_paid      │
└─────────────────────────────────────────────────────────────────┘
```

## 20.4 30分钟撤销流程

```
┌─────────────────────────────────────────────────────────────────┐
│ 前端检查                                                         │
│  ├── 用户点击"撤销"                                               │
│  ├── API: GET /api/undo/check/:type/:id                            │
│  └── 返回 { canUndo: boolean, remainingSeconds: number, reason?: string } │
├─────────────────────────────────────────────────────────────────┤
│ 后端检查逻辑                                                     │
│  ├── UndoService.checkUndoability()                                │
│  │   ├── 查询原始单据（时间 + 状态）                                │
│  │   ├── 计算时间差：elapsed = now - created_at                     │
│  │   ├── 如果 elapsed > 30分钟 → 返回不可撤销                       │
│  │   ├── 如果状态为voided → 返回已作废                              │
│  │   ├── 如果是入库单 → 检查关联出库（如果有出库使用了该批次）       │
│  │   └── 如果是出库单 → 检查关联对账（如果已对账则不可撤销）          │
│  └── 返回检查结果                                                  │
├─────────────────────────────────────────────────────────────────┤
│ 执行撤销                                                         │
│  ├── API: POST /api/undo/execute                                   │
│  ├── UndoService.execute()                                         │
│  │   ├── 开启事务                                                  │
│  │   ├── 如果是入库单撤销：                                        │
│  │   │   ├── 查询关联的 inventory_batch                             │
│  │   │   ├── 检查批次可用数量是否等于初始数量（已被出库则不可撤销）   │
│  │   │   ├── 删除 inventory_batch 记录                              │
│  │   │   ├── 扣减 inventory_summary.current_stock                   │
│  │   │   ├── 记录 inventory_movement（撤销入库）                     │
│  │   │   └── 更新 inbound_order.status = 'voided'                  │
│  │   ├── 如果是出库单撤销：                                        │
│  │   │   ├── 查询关联的 outbound_detail                              │
│  │   │   ├── 还原 inventory_batch.available_quantity                 │
│  │   │   ├── 还原 inventory_summary.current_stock                   │
│  │   │   ├── 记录 inventory_movement（撤销出库）                     │
│  │   │   └── 更新 outbound_order.status = 'voided'                  │
│  │   ├── 记录 operation_log                                         │
│  │   └── 提交事务                                                  │
│  └── 返回撤销结果                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 20.5 库存调整流程

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: 用户选择产品                                              │
│  └── 从库存列表点击"调整库存"                                      │
├─────────────────────────────────────────────────────────────────┤
│ Step 2: 填写调整信息                                              │
│  ├── 选择调整类型（盘盈/盘亏/损坏/质检不合格/其他）                  │
│  ├── 输入调整数量（正数=增加，负数=减少）                            │
│  ├── 输入调整重量                                                  │
│  └── 填写原因说明                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Step 3: 后端处理                                                   │
│  ├── POST /api/inventory/adjust                                    │
│  ├── InventoryService.adjustStock()                                │
│  │   ├── 开启事务                                                  │
│  │   ├── 查询当前库存                                              │
│  │   ├── 校验调整后库存不为负                                       │
│  │   ├── 更新 inventory_summary.current_stock/current_weight       │
│  │   ├── 如果盘亏：扣减对应批次的 available_quantity                  │
│  │   ├── 如果盘盈：创建新的调整批次                                  │
│  │   ├── 记录 inventory_movement（调整流水）                        │
│  │   ├── 记录 operation_log                                         │
│  │   └── 提交事务                                                  │
│  └── 返回新库存                                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 20.6 打印流程

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: 触发打印                                                   │
│  ├── 入库保存后自动触发（可配置）                                   │
│  ├── 出库保存后自动触发                                            │
│  └── 手动点击"打印"按钮                                            │
├─────────────────────────────────────────────────────────────────┤
│ Step 2: 加载打印模板                                              │
│  ├── API: GET /api/print/templates?type=identity_card&active=true  │
│  └── 如果没有活跃模板 → 使用系统默认模板                            │
├─────────────────────────────────────────────────────────────────┤
│ Step 3: 生成打印数据                                              │
│  ├── API: POST /api/print/render                                   │
│  ├── 请求参数：{ templateId, entityType, entityId }                │
│  └── 后端组装数据 → 返回渲染后的HTML                               │
├─────────────────────────────────────────────────────────────────┤
│ Step 4: 前端打印                                                   │
│  ├── 打开新窗口 → 写入HTML → 调用window.print()                     │
│  └── 或使用iframe打印                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

# 第21章 权限体系完整实现

## 21.1 权限码定义（27个）

```typescript
export const PERMISSION_CODES = {
  // 客户管理
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',

  // 产品管理
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // 来货登记
  INBOUND_VIEW: 'inbound:view',
  INBOUND_CREATE: 'inbound:create',
  INBOUND_UNDO: 'inbound:undo',

  // 快速发货
  OUTBOUND_VIEW: 'outbound:view',
  OUTBOUND_CREATE: 'outbound:create',
  OUTBOUND_DELETE: 'outbound:delete',
  OUTBOUND_UNDO: 'outbound:undo',

  // 库存管理
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_ADJUST: 'inventory:adjust',

  // 智能对账
  RECONCILIATION_VIEW: 'reconciliation:view',
  RECONCILIATION_CREATE: 'reconciliation:create',
  RECONCILIATION_AUDIT: 'reconciliation:audit',
  RECONCILIATION_UNAUDIT: 'reconciliation:unaudit',

  // 数据统计
  STATISTICS_VIEW: 'statistics:view',

  // 系统管理
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_PERMISSION: 'system:permission',
  SYSTEM_TEMPLATE: 'system:template',
  SYSTEM_LOG: 'system:log',
} as const;
```

## 21.2 预设角色定义（4个）

```typescript
export const PRESET_ROLES = {
  admin: {
    name: '管理员',
    permissions: ['*'], // 全部权限
    description: '系统最高权限，可管理所有模块',
  },
  operator: {
    name: '操作员',
    permissions: [
      'customer:view', 'customer:create', 'customer:update',
      'product:view', 'product:create', 'product:update',
      'inbound:view', 'inbound:create', 'inbound:undo',
      'outbound:view', 'outbound:create', 'outbound:delete', 'outbound:undo',
      'inventory:view', 'inventory:adjust',
      'reconciliation:view', 'reconciliation:create',
      'statistics:view',
      'system:template',
    ],
    description: '日常业务操作，可收发货/库存/对账',
  },
  accountant: {
    name: '财务',
    permissions: [
      'customer:view',
      'product:view',
      'inbound:view',
      'outbound:view',
      'inventory:view',
      'reconciliation:view', 'reconciliation:create',
      'reconciliation:audit', 'reconciliation:unaudit',
      'statistics:view',
    ],
    description: '财务对账，可审核对账单/开票/回款',
  },
  viewer: {
    name: '访客',
    permissions: [
      'customer:view',
      'product:view',
      'inbound:view',
      'outbound:view',
      'inventory:view',
      'reconciliation:view',
      'statistics:view',
    ],
    description: '只读访问，仅查看不可修改',
  },
} as const;
```

## 21.3 权限匹配规则

```typescript
export class PermissionMatcher {
  /**
   * 三层匹配：
   * 1. 全权限通配符 '*' → 匹配所有
   * 2. 模块通配符 'customer:*' → 匹配该模块所有权限
   * 3. 精确匹配 'customer:view' → 完全匹配
   */
  static hasPermission(userPermissions: string[], required: string): boolean {
    if (userPermissions.includes('*')) return true;
    const [module] = required.split(':');
    if (userPermissions.includes(`${module}:*`)) return true;
    return userPermissions.includes(required);
  }

  static hasAnyPermission(userPermissions: string[], required: string[]): boolean {
    return required.some(r => this.hasPermission(userPermissions, r));
  }

  static hasAllPermissions(userPermissions: string[], required: string[]): boolean {
    return required.every(r => this.hasPermission(userPermissions, r));
  }
}
```

## 21.4 后端权限守卫

文件：`server/common/guards/permission.guard.ts`

```typescript
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from '../services/tenant-context.service';
import { PermissionMatcher } from '../utils/permission-matcher';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantCtx: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.userContext?.userId;
    const orgId = request.userContext?.organizationId;
    if (!userId || !orgId) throw new ForbiddenException('No user context');

    // 查询用户角色
    const roles = await this.getUserRoles(userId, orgId);
    // 获取角色权限
    const permissions = await this.getRolePermissions(roles, orgId);

    const hasPermission = PermissionMatcher.hasAnyPermission(permissions, required);
    if (!hasPermission) {
      throw new ForbiddenException(`缺少权限: ${required.join(', ')}`);
    }
    return true;
  }

  private async getUserRoles(userId: string, orgId: string): Promise<string[]> {
    // 从 user_roles 表查询
    const result = await db.select()
      .from(schema.userRoles)
      .where(and(
        eq(schema.userRoles.userId, userId),
        eq(schema.userRoles.organizationId, orgId),
      ));
    return result.map(r => r.role);
  }

  private async getRolePermissions(roles: string[], orgId: string): Promise<string[]> {
    const permissions: Set<string> = new Set();
    for (const role of roles) {
      // 预设角色权限
      if (PRESET_ROLES[role]) {
        PRESET_ROLES[role].permissions.forEach(p => permissions.add(p));
      }
      // 自定义角色权限
      const customPerms = await db.select()
        .from(schema.rolePermissions)
        .where(and(
          eq(schema.rolePermissions.roleName, role),
          eq(schema.rolePermissions.organizationId, orgId),
        ));
      customPerms.forEach(cp => permissions.add(cp.permissionCode));
    }
    return Array.from(permissions);
  }
}
```

## 21.5 前端权限控制

### 21.5.1 usePermissions Hook

```typescript
export const usePermissions = () => {
  const { user } = useAuth();
  const permissions = useMemo(() => {
    if (!user?.roles) return [];
    const perms: Set<string> = new Set();
    user.roles.forEach(role => {
      const preset = PRESET_ROLES[role];
      if (preset) {
        preset.permissions.forEach(p => perms.add(p));
      }
      if (user.customPermissions) {
        user.customPermissions.forEach(p => perms.add(p));
      }
    });
    return Array.from(perms);
  }, [user]);

  const hasPermission = useCallback(
    (code: string) => PermissionMatcher.hasPermission(permissions, code),
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (codes: string[]) => PermissionMatcher.hasAnyPermission(permissions, codes),
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (codes: string[]) => PermissionMatcher.hasAllPermissions(permissions, codes),
    [permissions],
  );

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions };
};
```

### 21.5.2 权限控制组件

```typescript
export const PermissionWrapper: React.FC<{
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, fallback = null, children }) => {
  const { hasPermission } = usePermissions();
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
};
```

### 21.5.3 路由级权限控制

```tsx
const ProtectedRoute: React.FC<{
  permission?: string;
  children: React.ReactNode;
}> = ({ permission, children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasPermission } = usePermissions();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};
```

### 21.5.4 路由权限配置

```typescript
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard': undefined,           // 所有登录用户可访问
  '/inbound': 'inbound:view',
  '/outbound': 'outbound:view',
  '/inventory': 'inventory:view',
  '/reconciliation': 'reconciliation:view',
  '/statistics': 'statistics:view',
  '/customers': 'customer:view',
  '/products': 'product:view',
  '/orders': 'inbound:view',        // 查看单据需要入库查看权限
  '/templates': 'system:template',
  '/permissions': 'system:permission',
  '/settings': 'system:settings',
  '/logs': 'system:log',
  '/profile': undefined,
  '/manual': undefined,
};
```

---

<!-- BATCH_5_END -->

---

# 第22章 打印系统完整实现

## 22.1 打印模板数据结构

### 22.1.1 数据库表

```sql
CREATE TABLE print_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'identity_card', -- identity_card | delivery_note | reconciliation_note
  paper_size TEXT NOT NULL DEFAULT 'A4',
  orientation TEXT NOT NULL DEFAULT 'portrait',
  margin_top INTEGER NOT NULL DEFAULT 10,
  margin_bottom INTEGER NOT NULL DEFAULT 10,
  margin_left INTEGER NOT NULL DEFAULT 10,
  margin_right INTEGER NOT NULL DEFAULT 10,
  field_config JSONB NOT NULL,
  header_config JSONB,
  footer_config JSONB,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 22.1.2 field_config 结构

```typescript
interface PrintFieldConfig {
  fields: PrintField[];
}

interface PrintField {
  key: string;
  label: string;
  visible: boolean;
  order: number;
  width: number;       // 百分比
  align: 'left' | 'center' | 'right';
  fontSize: number;    // pt
  bold: boolean;
}
```

### 22.1.3 header_config 结构

```typescript
interface PrintHeaderConfig {
  title: string;
  subtitle: string;
  showLogo: boolean;
  logoPosition: 'left' | 'center' | 'right';
  logoWidth: number;
  logoHeight: number;
  showDate: boolean;
  showPageNumber: boolean;
  customText: string;
}
```

### 22.1.4 footer_config 结构

```typescript
interface PrintFooterConfig {
  showSignature: boolean;
  signatureLabel: string;
  showDate: boolean;
  dateLabel: string;
  customText: string;
  showCompanyInfo: boolean;
}
```

## 22.2 后端打印服务

文件：`server/modules/print/print.service.ts`

```typescript
@Injectable()
export class PrintService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase,
    private readonly tenantCtx: TenantContextService,
  ) {}

  async getTemplates(type?: string): Promise<PrintTemplate[]> {
    const orgId = this.tenantCtx.requireOrganizationId();
    const conditions = [eq(schema.printTemplates.organizationId, orgId)];
    if (type) conditions.push(eq(schema.printTemplates.templateType, type));
    return this.db.select().from(schema.printTemplates)
      .where(and(...conditions));
  }

  async getDefaultTemplate(type: string): Promise<PrintTemplate | null> {
    const orgId = this.tenantCtx.requireOrganizationId();
    const [tmpl] = await this.db.select().from(schema.printTemplates)
      .where(and(
        eq(schema.printTemplates.organizationId, orgId),
        eq(schema.printTemplates.templateType, type),
        eq(schema.printTemplates.isDefault, true),
      ));
    return tmpl || null;
  }

  async createTemplate(data: CreateTemplateDto): Promise<PrintTemplate> {
    const orgId = this.tenantCtx.requireOrganizationId();
    const [tmpl] = await this.db.insert(schema.printTemplates).values({
      ...data,
      organizationId: orgId,
      createdBy: this.tenantCtx.userId,
    }).returning();
    return tmpl;
  }

  async updateTemplate(id: string, data: UpdateTemplateDto): Promise<PrintTemplate> {
    const [tmpl] = await this.db.update(schema.printTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.printTemplates.id, id))
      .returning();
    if (!tmpl) throw new NotFoundException('模板不存在');
    return tmpl;
  }

  async setDefault(id: string): Promise<void> {
    const orgId = this.tenantCtx.requireOrganizationId();
    const tmpl = await this.db.select().from(schema.printTemplates)
      .where(eq(schema.printTemplates.id, id));
    if (!tmpl[0]) throw new NotFoundException('模板不存在');

    await this.db.transaction(async (tx) => {
      // 先取消同类型其他默认模板
      await tx.update(schema.printTemplates)
        .set({ isDefault: false })
        .where(and(
          eq(schema.printTemplates.organizationId, orgId),
          eq(schema.printTemplates.templateType, tmpl[0].templateType),
        ));
      // 设置当前为默认
      await tx.update(schema.printTemplates)
        .set({ isDefault: true })
        .where(eq(schema.printTemplates.id, id));
    });
  }

  async renderHTML(params: RenderParams): Promise<string> {
    const { templateId, entityType, entityId } = params;

    // 1. 加载模板
    const [template] = await this.db.select().from(schema.printTemplates)
      .where(eq(schema.printTemplates.id, templateId));
    if (!template) throw new NotFoundException('模板不存在');

    // 2. 加载业务数据
    const data = await this.loadEntityData(entityType, entityId);

    // 3. 渲染HTML
    return this.generateHTML(template, data);
  }

  private async loadEntityData(type: string, id: string): Promise<any> {
    switch (type) {
      case 'inbound':
        return this.loadInboundData(id);
      case 'outbound':
        return this.loadOutboundData(id);
      case 'reconciliation':
        return this.loadReconciliationData(id);
      default:
        throw new BadRequestException(`不支持的类型: ${type}`);
    }
  }

  private generateHTML(template: PrintTemplate, data: any): string {
    const config = template.fieldConfig as PrintFieldConfig;
    const visibleFields = config.fields.filter(f => f.visible).sort((a, b) => a.order - b.order);
    const header = template.headerConfig as PrintHeaderConfig | null;
    const footer = template.footerConfig as PrintFooterConfig | null;

    // 构建HTML
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${template.paperSize} ${template.orientation};
      margin: ${template.marginTop}mm ${template.marginRight}mm ${template.marginBottom}mm ${template.marginLeft}mm;
    }
    body { font-family: 'SimSun', 'Microsoft YaHei', sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header .logo { max-width: ${header?.logoWidth || 100}px; max-height: ${header?.logoHeight || 50}px; }
    .header .title { font-size: 18pt; font-weight: bold; text-align: center; }
    .field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
    .field-item { display: flex; padding: 4px 0; }
    .field-label { font-weight: bold; min-width: 80px; }
    .field-value { flex: 1; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #000; padding: 4px 8px; font-size: 10pt; }
    th { background: #f0f0f0; font-weight: bold; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; }
    .signature { border-top: 1px solid #000; padding-top: 5px; min-width: 150px; text-align: center; }
  </style>
</head>
<body>
  ${this.renderHeader(header, data)}
  ${this.renderFields(visibleFields, data)}
  ${this.renderTable(visibleFields, data)}
  ${this.renderFooter(footer, data)}
</body>
</html>`;
    return html;
  }

  private renderHeader(header: PrintHeaderConfig | null, data: any): string {
    if (!header) return '';
    const logoHtml = header.showLogo && data.logoUrl
      ? `<img class="logo" src="${data.logoUrl}" />`
      : '';
    const titleHtml = `<div class="title">${header.title || ''}</div>`;
    const dateHtml = header.showDate
      ? `<div>日期: ${new Date().toLocaleDateString('zh-CN')}</div>`
      : '';
    return `<div class="header">${logoHtml}${titleHtml}${dateHtml}</div>`;
  }

  private renderFields(fields: PrintField[], data: any): string {
    const items = fields.map(f => {
      const value = this.getFieldValue(f.key, data);
      return `<div class="field-item">
        <span class="field-label">${f.label}:</span>
        <span class="field-value">${value}</span>
      </div>`;
    }).join('');
    return `<div class="field-grid">${items}</div>`;
  }

  private renderTable(fields: PrintField[], data: any): string {
    const details = data.details || [];
    if (details.length === 0) return '';

    const tableFields = fields.filter(f =>
      ['productName', 'material', 'process', 'workpieceNo', 'quantity',
       'weight', 'unitPrice', 'amount', 'batchNo'].includes(f.key)
    );

    const headerRow = tableFields.map(f =>
      `<th style="width:${f.width}%;text-align:${f.align}">${f.label}</th>`
    ).join('');

    const dataRows = details.map((d: any) =>
      `<tr>${tableFields.map(f =>
        `<td style="text-align:${f.align}">${this.getFieldValue(f.key, d)}</td>`
      ).join('')}</tr>`
    ).join('');

    return `<table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table>`;
  }

  private getFieldValue(key: string, data: any): string {
    const value = data[key];
    if (value === null || value === undefined) return '';
    if (key === 'amount' || key === 'unitPrice') return formatAmount(value);
    if (key === 'inboundDate' || key === 'outboundDate') return formatDate(value);
    return String(value);
  }
}
```

## 22.3 前端打印逻辑

文件：`client/src/hooks/usePrint.ts`

```typescript
export const usePrint = () => {
  const printHtml = (html: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();

    // 等待图片加载
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // 延迟移除iframe
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  };

  const printEntity = async (entityType: 'inbound' | 'outbound' | 'reconciliation', entityId: string, templateType?: string) => {
    try {
      // 获取模板
      let templateId: string | undefined;
      if (templateType) {
        const templates = await printApi.getTemplates(templateType);
        const activeTemplate = templates.find(t => t.isDefault) || templates[0];
        if (activeTemplate) templateId = activeTemplate.id;
      }

      // 渲染HTML
      const html = await printApi.renderHTML({
        templateId: templateId!,
        entityType,
        entityId,
      });

      // 打印
      printHtml(html);
    } catch (err) {
      logger.error('Print failed', err);
      toast.error('打印失败');
    }
  };

  return { printEntity, printHtml };
};
```

## 22.4 标识卡打印特殊逻辑

标识卡是每个入库产品的独立标签，支持批量打印：

```typescript
const printIdentityCards = async (inboundOrderId: string) => {
  // 获取入库单详情
  const order = await inboundApi.getDetail(inboundOrderId);

  // 获取标识卡模板
  const templates = await printApi.getTemplates('identity_card');
  const template = templates.find(t => t.isDefault) || templates[0];
  if (!template) {
    toast.error('未找到标识卡模板');
    return;
  }

  // 为每个产品明细生成一个标识卡
  for (const detail of order.details) {
    const html = await printApi.renderHTML({
      templateId: template.id,
      entityType: 'inbound_detail',
      entityId: detail.id,
    });
    printHtml(html);
    // 批量打印间隔
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
```

---

# 第23章 Excel导入导出完整实现

## 23.1 前端Excel导入

文件：`client/src/utils/excel-import.ts`

```typescript
import * as XLSX from 'xlsx';

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  total: number;
  successCount: number;
  errorCount: number;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export async function parseExcelFile<T>(
  file: File,
  mapping: Record<string, string>,
  requiredFields: string[] = []
): Promise<ImportResult<T>> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const result: ImportResult<T> = {
    success: true,
    data: [],
    errors: [],
    total: rows.length,
    successCount: 0,
    errorCount: 0,
  };

  rows.forEach((row, idx) => {
    const obj: any = {};
    let hasError = false;

    // 映射字段
    for (const [excelCol, field] of Object.entries(mapping)) {
      const value = row[excelCol];
      if (value === undefined || value === '') {
        if (requiredFields.includes(field)) {
          result.errors.push({
            row: idx + 2, // Excel行号从2开始（1是表头）
            field,
            message: `必填字段 ${excelCol} 为空`,
            value,
          });
          hasError = true;
        }
        continue;
      }
      // 类型转换
      obj[field] = convertValue(field, value);
    }

    if (hasError) {
      result.errorCount++;
    } else {
      result.data.push(obj);
      result.successCount++;
    }
  });

  result.success = result.errorCount === 0;
  return result;
}

function convertValue(field: string, value: any): any {
  // 数值字段
  const numericFields = ['unitPrice', 'quantity', 'weight', 'amount', 'warningThreshold'];
  if (numericFields.includes(field)) {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }
  // 字符串字段
  return String(value).trim();
}
```

## 23.2 前端Excel导出

文件：`client/src/utils/excel-export.ts`

```typescript
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns: ExportColumn[]
): void {
  // 构建导出数据
  const exportData = data.map(row => {
    const obj: Record<string, any> = {};
    for (const col of columns) {
      const value = row[col.key];
      obj[col.label] = col.formatter ? col.formatter(value, row) : value;
    }
    return obj;
  });

  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(exportData, {
    header: columns.map(c => c.label),
  });

  // 设置列宽
  ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }));

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // 写入文件
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${filename}.xlsx`);
}

export interface ExportColumn {
  key: string;
  label: string;
  width?: number;
  formatter?: (value: any, row: any) => any;
}
```

## 23.3 客户导入列映射

```typescript
export const CUSTOMER_IMPORT_MAPPING = {
  '客户编码': 'code',
  '客户名称': 'name',
  '联系人': 'contact',
  '电话': 'phone',
  '手机': 'mobile',
  '地址': 'address',
  '运输方式': 'transport',
  '付款条件': 'paymentTerm',
  '结算方式': 'settlement',
  '客户类别': 'category',
  '备注': 'remark',
};

export const CUSTOMER_REQUIRED_FIELDS = ['code', 'name'];
```

## 23.4 产品导入列映射

```typescript
export const PRODUCT_IMPORT_MAPPING = {
  '产品编码': 'code',
  '产品名称': 'name',
  '材质': 'material',
  '工艺': 'process',
  '技术要求': 'techRequirement',
  '工件编号': 'workpieceNo',
  '单位': 'unit',
  '单价(元)': 'unitPrice',
  '加工费(元)': 'processingFee',
  '客户编码': 'customerCode',
  '客户名称': 'customerName',
  '预警阈值': 'warningThreshold',
  '备注': 'remark',
};

export const PRODUCT_REQUIRED_FIELDS = ['code', 'name'];
```

## 23.5 入库单导出

```typescript
export const INBOUND_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'inboundNo', label: '入库单号', width: 20 },
  { key: 'customerName', label: '客户名称', width: 20 },
  { key: 'customerCode', label: '客户编码', width: 15 },
  { key: 'inboundDate', label: '入库日期', width: 12,
    formatter: (v) => formatDate(v) },
  { key: 'creator', label: '创建人', width: 10 },
  { key: 'receiver', label: '收货人', width: 10 },
  { key: 'totalQuantity', label: '总数量', width: 10,
    formatter: (v) => v.toLocaleString() },
  { key: 'totalWeight', label: '总重量(kg)', width: 12,
    formatter: (v) => v.toFixed(2) },
  { key: 'totalAmount', label: '总金额(元)', width: 12,
    formatter: (v) => formatAmount(v) },
  { key: 'status', label: '状态', width: 8,
    formatter: (v) => v === 'voided' ? '已撤销' : '有效' },
  { key: 'createdAt', label: '创建时间', width: 20,
    formatter: (v) => formatDateTime(v) },
];
```

## 23.6 后端批量导入接口

```typescript
@Post('import')
@NeedLogin()
async importCustomers(@Req() req: Request, @Body() dto: ImportCustomersDto) {
  const orgId = req.userContext.organizationId;
  const userId = req.userContext.userId;
  return this.customerService.batchImport(dto.customers, orgId, userId);
}

// Service
async batchImport(
  customers: CreateCustomerDto[],
  orgId: string,
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    total: customers.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  await this.db.transaction(async (tx) => {
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      try {
        // 检查编码是否重复
        const existing = await tx.select().from(schema.customers)
          .where(and(
            eq(schema.customers.code, customer.code),
            eq(schema.customers.organizationId, orgId),
          ));
        if (existing.length > 0) {
          result.errors.push({
            row: i + 2,
            message: `编码 ${customer.code} 已存在`,
          });
          result.failed++;
          continue;
        }

        await tx.insert(schema.customers).values({
          ...customer,
          organizationId: orgId,
          createdBy: userId,
          createdAt: new Date(),
        });
        result.success++;
      } catch (err) {
        result.errors.push({
          row: i + 2,
          message: err.message,
        });
        result.failed++;
      }
    }
  });

  return result;
}
```

---

# 第24章 库存预警与超期管理

## 24.1 库存预警逻辑

### 24.1.1 低库存预警

```typescript
// 定时任务：每小时检查一次
@Cron('0 * * * *')
async checkLowStockAlerts() {
  const orgId = this.tenantCtx.organizationId;
  const lowStockItems = await this.db.select({
    productId: schema.inventorySummary.productId,
    productName: schema.products.name,
    customerName: schema.customers.name,
    currentStock: schema.inventorySummary.currentStock,
    warningThreshold: schema.products.warningThreshold,
  })
  .from(schema.inventorySummary)
  .innerJoin(schema.products, eq(schema.inventorySummary.productId, schema.products.id))
  .leftJoin(schema.customers, eq(schema.products.customerId, schema.customers.id))
  .where(and(
    eq(schema.inventorySummary.organizationId, orgId),
    lte(schema.inventorySummary.currentStock, schema.products.warningThreshold),
    gt(schema.products.warningThreshold, 0),
  ));

  // 写入预警记录
  for (const item of lowStockItems) {
    await this.db.insert(schema.inventoryAlerts).values({
      id: uuidv4(),
      organizationId: orgId,
      alertType: 'low_stock',
      productId: item.productId,
      productName: item.productName,
      customerName: item.customerName,
      currentStock: item.currentStock,
      threshold: item.warningThreshold,
      createdAt: new Date(),
    }).onConflictDoNothing();
  }
}
```

### 24.1.2 超期库存预警

```sql
-- 库存超期预警视图
CREATE VIEW vw_inventory_expiry AS
SELECT
  ib.id AS batch_id,
  ib.product_id,
  p.name AS product_name,
  p.material,
  p.process,
  p.workpiece_no,
  c.name AS customer_name,
  ib.batch_no,
  ib.inbound_date,
  ib.quantity,
  ib.available_quantity,
  ib.weight,
  ib.available_weight,
  EXTRACT(DAY FROM NOW() - ib.inbound_date) AS days_in_stock,
  CASE
    WHEN ib.available_quantity <= 0 THEN 'exhausted'
    WHEN EXTRACT(DAY FROM NOW() - ib.inbound_date) > 90 THEN 'expired'
    WHEN EXTRACT(DAY FROM NOW() - ib.inbound_date) > 60 THEN 'warning'
    ELSE 'normal'
  END AS expiry_status,
  CASE
    WHEN ib.available_quantity <= 0 THEN NULL
    WHEN EXTRACT(DAY FROM NOW() - ib.inbound_date) > 90 THEN 0
    ELSE GREATEST(90 - EXTRACT(DAY FROM NOW() - ib.inbound_date), 0)
  END AS days_until_expiry
FROM inventory_batch ib
INNER JOIN products p ON ib.product_id = p.id
LEFT JOIN customers c ON p.customer_id = c.id
WHERE ib.available_quantity > 0;
```

### 24.1.3 超期阈值配置

```typescript
// 可按材质配置超期天数
const EXPIRY_THRESHOLDS: Record<string, number> = {
  '碳钢': 90,      // 90天
  '合金钢': 90,
  '不锈钢': 120,   // 不锈钢可存更久
  '工具钢': 60,    // 工具钢易氧化
  '模具钢': 90,
  'default': 90,   // 默认90天
};

function getExpiryThreshold(material: string): number {
  return EXPIRY_THRESHOLDS[material] || EXPIRY_THRESHOLDS.default;
}
```

## 24.2 前端预警展示

### 24.2.1 库存预警标签页

```typescript
const renderAlertsTab = () => (
  <div className="space-y-4">
    {/* 预警统计卡片 */}
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        title="低库存预警"
        value={alertStats.lowStock}
        icon={AlertTriangle}
        color="text-warning"
      />
      <StatCard
        title="超期库存"
        value={alertStats.expired}
        icon={Clock}
        color="text-error"
      />
      <StatCard
        title="即将超期"
        value={alertStats.warning}
        icon={AlertCircle}
        color="text-warning"
      />
    </div>

    {/* 预警列表 */}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>预警类型</TableHead>
          <TableHead>产品名称</TableHead>
          <TableHead>客户名称</TableHead>
          <TableHead>当前库存</TableHead>
          <TableHead>阈值/超期天数</TableHead>
          <TableHead>预警时间</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map(alert => (
          <TableRow key={alert.id}>
            <TableCell>
              <Badge variant={alert.alertType === 'expired' ? 'destructive' : 'secondary'}>
                {alert.alertType === 'low_stock' ? '低库存' :
                 alert.alertType === 'expired' ? '已超期' : '即将超期'}
              </Badge>
            </TableCell>
            <TableCell>{alert.productName}</TableCell>
            <TableCell>{alert.customerName}</TableCell>
            <TableCell>{alert.currentStock}</TableCell>
            <TableCell>
              {alert.alertType === 'low_stock'
                ? `阈值: ${alert.threshold}`
                : `已存放: ${alert.daysInStock}天`}
            </TableCell>
            <TableCell>{formatDateTime(alert.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
```

## 24.3 自动化预警通知

### 24.3.1 飞书消息推送

```typescript
// 当产生新的库存预警时，自动推送飞书消息
async notifyLowStock(alert: InventoryAlert) {
  // 获取需要通知的用户列表（管理员和操作员）
  const notifyUsers = await this.db.select()
    .from(schema.userRoles)
    .where(and(
      eq(schema.userRoles.organizationId, alert.organizationId),
      inArray(schema.userRoles.role, ['admin', 'operator']),
    ));

  for (const user of notifyUsers) {
    await this.sendFeishuMessage({
      userId: user.userId,
      content: `【库存预警】\n产品：${alert.productName}\n客户：${alert.customerName}\n当前库存：${alert.currentStock}\n预警阈值：${alert.threshold}\n请及时处理。`,
    });
  }
}
```

---

# 第25章 部署指南与配置说明

## 25.1 环境变量配置

### 25.1.1 后端环境变量

```bash
# .env
NODE_ENV=development
PORT=3000

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=heat_treatment
DB_SSL=false

# JWT密钥
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 飞书应用凭证
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
FEISHU_BOT_NAME=热处理管理系统

# 文件存储
STORAGE_TYPE=dataloom
STORAGE_BUCKET=heat-treatment

# 多租户
MULTI_TENANT_ENABLED=true
TENANT_DB_PREFIX=tenant_
```

### 25.1.2 前端环境变量

```bash
# .env
VITE_API_BASE_URL=/api
VITE_APP_TITLE=热处理收发货管理系统
VITE_APP_VERSION=1.0.0
```

## 25.2 数据库初始化

### 25.2.1 主库建表SQL

```sql
-- 1. 创建枚举类型
CREATE TYPE order_status AS ENUM ('active', 'voided');
CREATE TYPE reconciliation_status AS ENUM (
  'draft', 'confirmed', 'audited', 'invoiced',
  'partial_paid', 'paid', 'cancelled', 'voided'
);

-- 2. 创建组织表
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  subdomain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT NOT NULL DEFAULT 'free',
  owner_id TEXT,
  database_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 创建组织成员表
CREATE TABLE organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- 4. 创建24张业务表（按第4章Schema定义执行）
-- 5. 创建索引
-- 6. 启用RLS
-- 7. 创建策略
```

### 25.2.2 种子数据

```sql
-- 插入默认组织
INSERT INTO organizations (id, name, code, subdomain, status, plan, database_name)
VALUES (
  'org_default',
  '默认组织',
  'ORG_DEFAULT',
  'default',
  'active',
  'pro',
  'tenant_org_default'
);

-- 插入管理员角色
INSERT INTO user_roles (id, organization_id, user_id, role)
VALUES (
  gen_random_uuid(),
  'org_default',
  'admin_user_id',
  'admin'
);
```

## 25.3 项目启动流程

### 25.3.1 开发环境

```bash
# 1. 安装依赖
npm install

# 2. 启动PostgreSQL
# 确保PostgreSQL运行在localhost:5432

# 3. 执行建表SQL
psql -U postgres -d heat_treatment -f database/migrations/001_init.sql

# 4. 执行种子数据
psql -U postgres -d heat_treatment -f database/seeds/001_default.sql

# 5. 启动开发服务器
npm run dev
# 前端运行在 http://localhost:5173
# 后端运行在 http://localhost:3000
```

### 25.3.2 生产构建

```bash
# 构建前端
cd client && npm run build
# 产物：client/dist/

# 构建后端
cd server && npm run build
# 产物：server/dist/

# 启动生产服务
NODE_ENV=production node server/dist/main.js
```

## 25.4 关键模块注册顺序

文件：`server/app.module.ts`

```typescript
@Module({
  imports: [
    // 1. 核心模块
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TenantModule, // 多租户中间件

    // 2. 认证授权
    AuthModule,

    // 3. 基础数据
    CustomerModule,
    ProductModule,
    MaterialModule,

    // 4. 业务模块
    InboundModule,
    OutboundModule,
    InventoryModule,
    ReconciliationModule,

    // 5. 辅助模块
    StatisticsModule,
    PrintModule,
    ExcelModule,
    UndoModule,
    OperationLogModule,

    // 6. 系统管理
    OrganizationModule,
    PermissionModule,
    FeatureFlagModule,

    // 7. 视图模块（必须最后）
    ViewModule,
  ],
})
export class AppModule {}
```

## 25.5 文件清单总览

### 后端文件

| 目录 | 文件 | 说明 |
|------|------|------|
| server/main.ts | main.ts | 应用入口 |
| server/app.module.ts | app.module.ts | 根模块 |
| server/config/ | app.config.ts | 应用配置 |
| server/database/ | schema.ts | Drizzle ORM Schema |
| server/common/middleware/ | tenant.middleware.ts | 租户中间件 |
| server/common/services/ | tenant-context.service.ts | 租户上下文 |
| server/common/services/ | amount.service.ts | 金额计算服务 |
| server/common/services/ | no-generator.service.ts | 单号生成服务 |
| server/common/guards/ | permission.guard.ts | 权限守卫 |
| server/common/utils/ | permission-matcher.ts | 权限匹配器 |
| server/common/utils/ | excel-import.ts | Excel导入工具 |
| server/common/utils/ | excel-export.ts | Excel导出工具 |
| server/modules/customer/ | customer.controller.ts | 客户控制器 |
| server/modules/customer/ | customer.service.ts | 客户服务 |
| server/modules/customer/ | customer.module.ts | 客户模块 |
| server/modules/product/ | product.controller.ts | 产品控制器 |
| server/modules/product/ | product.service.ts | 产品服务 |
| server/modules/product/ | product.module.ts | 产品模块 |
| server/modules/inbound/ | inbound.controller.ts | 入库控制器 |
| server/modules/inbound/ | inbound.service.ts | 入库服务 |
| server/modules/inbound/ | inbound.module.ts | 入库模块 |
| server/modules/outbound/ | outbound.controller.ts | 出库控制器 |
| server/modules/outbound/ | outbound.service.ts | 出库服务 |
| server/modules/outbound/ | outbound.module.ts | 出库模块 |
| server/modules/inventory/ | inventory.controller.ts | 库存控制器 |
| server/modules/inventory/ | inventory.service.ts | 库存服务 |
| server/modules/inventory/ | inventory.module.ts | 库存模块 |
| server/modules/reconciliation/ | reconciliation.controller.ts | 对账控制器 |
| server/modules/reconciliation/ | reconciliation.service.ts | 对账服务 |
| server/modules/reconciliation/ | reconciliation.module.ts | 对账模块 |
| server/modules/statistics/ | statistics.controller.ts | 统计控制器 |
| server/modules/statistics/ | statistics.service.ts | 统计服务 |
| server/modules/statistics/ | statistics.module.ts | 统计模块 |
| server/modules/print/ | print.controller.ts | 打印控制器 |
| server/modules/print/ | print.service.ts | 打印服务 |
| server/modules/print/ | print.module.ts | 打印模块 |
| server/modules/undo/ | undo.controller.ts | 撤销控制器 |
| server/modules/undo/ | undo.service.ts | 撤销服务 |
| server/modules/undo/ | undo.module.ts | 撤销模块 |
| server/modules/organization/ | organization.controller.ts | 组织控制器 |
| server/modules/organization/ | organization.service.ts | 组织服务 |
| server/modules/organization/ | organization.module.ts | 组织模块 |
| server/modules/operation-log/ | operation-log.controller.ts | 日志控制器 |
| server/modules/operation-log/ | operation-log.service.ts | 日志服务 |
| server/modules/operation-log/ | operation-log.module.ts | 日志模块 |

### 前端文件

| 目录 | 文件 | 说明 |
|------|------|------|
| client/src/index.tsx | index.tsx | 应用入口 |
| client/src/app.tsx | app.tsx | 路由定义 |
| client/src/api/ | index.ts | API聚合导出 |
| client/src/api/ | auth.ts | 认证API |
| client/src/api/ | customer.ts | 客户API |
| client/src/api/ | product.ts | 产品API |
| client/src/api/ | inbound.ts | 入库API |
| client/src/api/ | outbound.ts | 出库API |
| client/src/api/ | inventory.ts | 库存API |
| client/src/api/ | reconciliation.ts | 对账API |
| client/src/api/ | statistics.ts | 统计API |
| client/src/api/ | print.ts | 打印API |
| client/src/api/ | undo.ts | 撤销API |
| client/src/api/ | organization.ts | 组织API |
| client/src/api/ | upload.ts | 上传API |
| client/src/hooks/ | useAuth.ts | 认证Hook |
| client/src/hooks/ | useDataContext.ts | 全局数据Hook |
| client/src/hooks/ | usePermissions.ts | 权限Hook |
| client/src/hooks/ | usePrint.ts | 打印Hook |
| client/src/hooks/ | useTheme.ts | 主题Hook |
| client/src/utils/ | permission-matcher.ts | 权限匹配 |
| client/src/utils/ | format.ts | 格式化工具 |
| client/src/utils/ | excel-import.ts | Excel导入 |
| client/src/utils/ | excel-export.ts | Excel导出 |
| client/src/utils/ | constants.ts | 系统常量 |
| client/src/components/Layout.tsx | Layout.tsx | 布局组件 |
| client/src/components/PermissionWrapper.tsx | PermissionWrapper.tsx | 权限组件 |
| client/src/pages/DashboardPage/ | DashboardPage.tsx | 工作台 |
| client/src/pages/InboundPage/ | InboundPage.tsx | 来货登记 |
| client/src/pages/OutboundPage/ | OutboundPage.tsx | 快速发货 |
| client/src/pages/ReconciliationPage/ | ReconciliationPage.tsx | 智能对账 |
| client/src/pages/InventoryPage/ | InventoryPage.tsx | 库存管理 |
| client/src/pages/StatisticsPage/ | StatisticsPage.tsx | 数据统计 |
| client/src/pages/CustomerListPage/ | CustomerListPage.tsx | 客户管理 |
| client/src/pages/ProductListPage/ | ProductListPage.tsx | 产品管理 |
| client/src/pages/OrderListPage/ | OrderListPage.tsx | 单据查询 |
| client/src/pages/TemplateConfigPage/ | TemplateConfigPage.tsx | 打印模板配置 |
| client/src/pages/PermissionPage/ | PermissionPage.tsx | 权限管理 |
| client/src/pages/ProfilePage/ | ProfilePage.tsx | 个人中心 |
| client/src/pages/OperationLogPage/ | OperationLogPage.tsx | 操作日志 |
| client/src/pages/UserManualPage/ | UserManualPage.tsx | 用户手册 |
| client/src/pages/LandingPage/ | LandingPage.tsx | 着陆页 |
| client/src/pages/LoginPage/ | LoginPage.tsx | 登录页 |
| client/src/pages/OrganizationPage/ | OrganizationPage.tsx | 组织选择 |
| client/src/pages/AdminDashboard/ | AdminDashboard.tsx | 管理后台 |
| client/src/pages/NotFound/ | NotFound.tsx | 404页面 |

### 共享文件

| 目录 | 文件 | 说明 |
|------|------|------|
| shared/ | api.interface.ts | 前后端共享类型 |

## 25.6 系统默认值速查

| 配置项 | 默认值 |
|--------|--------|
| 撤销窗口 | 30分钟 |
| 低库存默认阈值 | 50件 |
| 库存超期天数 | 90天 |
| 实时数据刷新间隔 | 30秒 |
| 分页默认pageSize | 20 |
| 分页最大pageSize | 100 |
| 金额小数位 | 2位（元+分双存储） |
| 单号格式 | IN/OUT/REC + yyyyMMdd + 6位序号 |
| Excel导入行数上限 | 5000行 |
| 密码最小长度 | 6位 |
| JWT过期时间 | 7天 |
| 租户缓存TTL | 5分钟 |
| 数据库连接池大小 | 10 |

## 25.7 关键业务规则汇总

1. **库存不允许为负**：所有库存变动（出库/调整）必须校验扣减后库存 ≥ 0
2. **批次FIFO**：默认按入库日期升序分配批次
3. **金额双存储**：所有金额字段以元和分两个字段存储，运算用分
4. **30分钟撤销**：单据创建30分钟内可撤销，超时不可逆
5. **对账锁定**：出库单一旦关联对账单，不可撤销出库
6. **批次耗尽检查**：入库单撤销前检查所有批次是否被消耗（available_quantity < quantity）
7. **权限三层匹配**：全权限(*) > 模块通配(*:) > 精确匹配
8. **单号全局唯一**：单号生成器使用数据库序列保证唯一性
9. **操作日志全记录**：所有CUD操作自动记录到 operation_log
10. **库存变动全记录**：所有库存变动自动记录到 inventory_movement

---

## 文档结束

本文档完整覆盖了热处理收发货管理系统的全部代码级实现细节，包含：
- 25个章节、约15万字
- 24张数据库表完整定义
- 全部后端模块（Controller/Service/Module）
- 全部前端页面与组件
- 完整的多租户、权限、打印、Excel、预警系统
- 部署指南与配置说明

开发者可仅凭本文档从零完整重建整个系统。


---

## 第26章 智能Excel导入系统完整实现

### 26.1 系统架构与文件结构

智能Excel导入系统是热处理收发货管理系统的核心数据导入能力，位于 `client/src/utils/smartExcelImport/` 目录下，共8个文件：

| 文件 | 行数 | 职责 |
|------|------|------|
| `index.ts` | 739 | 主入口，编排完整导入流程 |
| `types.ts` | 128 | 全部类型定义 |
| `columnMatcher.ts` | 259 | 智能列匹配引擎（Levenshtein + Jaccard + 语义相似度） |
| `dataParsers.ts` | 363 | 数据清洗与标准化解析器（价格/数字/库存/单位等） |
| `fieldSplitter.ts` | 413 | 混合字段拆分器（材质+工艺+技术要求） |
| `materialStandards.ts` | 462 | 材质标准库与工艺标准库 |
| `fieldAliases.ts` | 122 | 字段别名配置（12个字段的精确/模糊/正则匹配规则） |

另有一个1,338行的UI组件 `SmartExcelImportDialog.tsx`（位于 `client/src/pages/ProductListPage/`），提供完整的导入预览和交互界面。

系统整体流程：

```
用户上传Excel文件
    │
    ▼
parseExcelFile(file)          ── XLSX库解析为headers+rows
    │
    ▼
rowHasAnyData(row) 过滤      ── 自动移除空白行
    │
    ▼
analyzeColumnSamples()       ── 提取每列前10个有效值作为样本
    │
    ▼
matchColumns(headers, samples) ── 智能列匹配引擎
    │  ├── 精确匹配检查（exact别名数组）
    │  ├── Levenshtein + Jaccard 名称相似度
    │  ├── 正则模式匹配（patterns数组）
    │  ├── 语义相似度（词重叠Jaccard）
    │  └── 数据模式匹配（dataPatterns正则）
    │  → 输出 ColumnMapping[] + 置信度
    │
    ▼
检测复合字段                  ── 材质+工艺同列 → composite[material+process]
    │
    ▼
normalizeData(data, mappings)  ── 逐行标准化
    │  ├── splitCompositeField() 拆分混合字段
    │  ├── parseValueByField() 按字段类型解析
    │  ├── generateDataIssue() 生成数据问题
    │  ├── 必填字段验证
    │  └── 行质量分级（valid/warning/error）
    │
    ▼
generateQualityReport()       ── 全局质量报告
    │  ├── 统计 valid/warning/error 行数
    │  ├── 聚合最常见问题（前20条）
    │  └── 总体评分 = (valid + warning*0.5) / total
    │
    ▼
返回 ImportPreviewState        ── 完整预览状态
    │
    ▼ 用户在Dialog中预览/编辑/调整列映射
    │
    ▼
convertToProducts(state)       ── 转换为产品对象数组
    │  ├── 自动过滤空白行
    │  ├── 默认值填充（客户编码/名称）
    │  ├── 强制导入模式（status='incomplete'）
    │  └── 正常模式（必填字段检查）
    │
    ▼
返回 Partial<IProduct>[]        ── 可直接批量创建的产品列表
```

### 26.2 类型定义（types.ts 128行）

#### MatchConfidence — 字段匹配置信度

```typescript
export interface MatchConfidence {
  nameSimilarity: number;       // 名称相似度（Levenshtein+Jaccard混合）
  semanticSimilarity: number;   // 语义相似度（词重叠）
  dataPatternScore: number;     // 数据模式匹配分数
  overall: number;              // 综合置信度（加权平均）
}
```

所有字段值范围 0-1，overall 由四个维度加权计算：
`overall = nameSim * 0.4 + semanticSim * 0.3 + dataPattern * 0.2 + patternMatch * 0.1`

#### ColumnMapping — 列映射结果

```typescript
export interface ColumnMapping {
  sourceColumn: string;          // Excel原始列名
  sourceHeader: string;          // 同sourceColumn（保留用于兼容）
  targetField: string;           // 目标字段名（如'code'/'name'/'material'）
  confidence: number;            // 综合置信度（0-1）
  matchDetails: MatchConfidence;  // 详细置信度分解
  sampleValues: string[];        // 前5个样例值（String化）
  suggestion: 'auto' | 'confirm' | 'reject';  // 建议动作
}
```

suggestion 分级：
- `auto`：confidence ≥ 0.85，自动接受
- `confirm`：confidence ≥ 0.6，需用户确认
- `reject`：confidence < 0.6，建议拒绝映射

#### ParseResult<T> — 单字段解析结果

```typescript
export interface ParseResult<T = unknown> {
  value: T | null;               // 解析后的值（null表示解析失败）
  confidence: number;            // 解析置信度（0-1）
  format?: string;               // 数据格式标识
  error?: string;                // 解析错误信息
  raw: unknown;                  // 原始值
  warnings?: string[];           // 警告信息列表
}
```

format 可能的值：
- `'standard'`：标准数字/文本
- `'thousands'`：千分位格式（1,234.56）
- `'scientific'`：科学计数法（1e3）
- `'fraction'`：分数（3/4）
- `'percentage'`：百分比（50%）
- `'chinese'`：中文数字（一百）
- `'converted'`：单位转换（1.5万→15000）
- `'extracted'`：从文本中提取的数字
- `'text-mapped'`：文本映射（充足→999999）

#### DataQualityReport — 数据质量报告

```typescript
export interface DataQualityReport {
  overall: number;               // 总体评分（0-1）
  totalRows: number;             // 总行数
  validRows: number;             // 有效行数
  warningRows: number;           // 警告行数
  errorRows: number;             // 错误行数
  issues: DataIssue[];           // 最常见问题列表（前20条）
}
```

overall 计算公式：`(validRows + warningRows * 0.5) / totalRows`

#### DataIssue — 数据问题

```typescript
export interface DataIssue {
  rowIndex: number;             // 行索引（-1表示聚合问题）
  column: string;                // 字段名
  type: 'error' | 'warning' | 'info';  // 问题级别
  message: string;              // 问题描述
  rawValue: unknown;            // 原始值
  suggestion?: string;          // 修复建议
}
```

#### UserEdit — 用户编辑记录

```typescript
export interface UserEdit {
  field: string;                 // 被编辑的字段名
  value: unknown;                // 编辑后的值
  editedAt: number;              // 编辑时间戳
}
```

#### NormalizedRow — 标准化行数据

```typescript
export interface NormalizedRow extends Record<
  string, ParseResult | number | string | DataIssue[] | UserEdit[] | undefined
> {
  _rowIndex: number;             // 行索引
  _quality: 'valid' | 'warning' | 'error';  // 行质量
  _issues: DataIssue[];          // 该行的所有问题
  _userEdits?: UserEdit[];        // 用户手动编辑记录
}
```

NormalizedRow 是一个扩展的 Record 类型，除了下划线开头的元数据字段外，还包含每个字段的 ParseResult。例如 `normalizedRow.code` 返回 `ParseResult<string>`，`normalizedRow.unitPrice` 返回 `ParseResult<number>`。

#### CompositeSplit — 混合字段拆分结果

```typescript
export interface CompositeSplit {
  material?: ParseResult<string>;        // 拆分出的材质
  process?: ParseResult<string>;         // 拆分出的工艺
  techRequirement?: ParseResult<string>; // 拆分出的技术要求
  original: string;                       // 原始文本
  confidence: number;                     // 拆分置信度
}
```

#### ImportPreviewState — 导入预览状态

```typescript
export interface ImportPreviewState {
  fileName: string;                     // Excel文件名
  totalRows: number;                    // 总行数（过滤空白行后）
  columnMappings: ColumnMapping[];      // 列映射结果
  normalizedData: NormalizedRow[];       // 标准化后的数据
  qualityReport: DataQualityReport;     // 质量报告
  selectedRows: number[];               // 选中的行索引
  forcedImportRows: number[];           // 强制导入的行索引（含错误）
}
```

#### MaterialStandard — 材质标准

```typescript
export interface MaterialStandard {
  standard: string;                     // 标准名称（如'45#'）
  name: string;                         // 材质类别名（如'优质碳素结构钢'）
  category: 'carbon' | 'alloy' | 'stainless' | 'tool' | 'other';
  aliases: string[];                     // 所有别名
}
```

#### ProcessStandard — 工艺标准

```typescript
export interface ProcessStandard {
  standard: string;                     // 标准名称（如'淬火'）
  name: string;                         // 工艺类别名
  category: 'heat' | 'surface' | 'machining' | 'other';
  aliases: string[];                     // 所有别名
}
```

#### FieldAliasConfig — 字段别名配置

```typescript
export interface FieldAliasConfig {
  field: string;                        // 目标字段名
  exact: string[];                      // 精确匹配别名
  fuzzy: string[];                      // 模糊匹配别名
  patterns: RegExp[];                   // 正则模式列表
  dataPatterns?: RegExp[];              // 数据模式正则
}
```

#### ProductImportField — 产品导入字段

```typescript
export interface ProductImportField {
  code: ParseResult<string>;
  name: ParseResult<string>;
  material: ParseResult<string>;
  process: ParseResult<string>;
  techRequirement: ParseResult<string>;
  workpieceNo: ParseResult<string>;
  unit: ParseResult<string>;
  unitPrice: ParseResult<number>;
  customerCode: ParseResult<string>;
  customerName: ParseResult<string>;
  stock: ParseResult<number>;
  warningThreshold: ParseResult<number>;
}
```

### 26.3 列匹配引擎（columnMatcher.ts 259行）

#### levenshtein(a, b) — 编辑距离算法

```typescript
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(
          matrix[i - 1][j - 1] + 1,  // 替换
          matrix[i][j - 1] + 1,      // 插入
          matrix[i - 1][j] + 1       // 删除
        );
    }
  }
  return matrix[b.length][a.length];
}
```

时间复杂度 O(m×n)，空间复杂度 O(m×n)。计算两个字符串之间的最小编辑操作数（插入/删除/替换各代价1）。

#### textSimilarity(a, b) — 文本相似度

```typescript
function textSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  if (aLower === bLower) return 1;
  const distance = levenshtein(aLower, bLower);
  const maxLength = Math.max(aLower.length, bLower.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}
```

返回 0-1 的相似度分数，1 表示完全相同，0 表示完全不同。基于编辑距离归一化。

#### jaccardSimilarity(a, b) — Jaccard相似度

```typescript
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
```

基于字符级别的集合运算：交集大小 / 并集大小。对中英文混合文本均有效。

#### calculateDataPatternScore(values, config) — 数据模式匹配分数

```typescript
function calculateDataPatternScore(
  values: unknown[],
  config: FieldAliasConfig
): number {
  if (!config.dataPatterns || config.dataPatterns.length === 0) {
    return 0.5;
  }
  const validValues = values.filter(v => v !== undefined && v !== null && v !== '');
  if (validValues.length === 0) return 0;
  let matchCount = 0;
  for (const value of validValues) {
    const str = String(value).trim();
    const matches = config.dataPatterns.some(pattern => pattern.test(str));
    if (matches) matchCount++;
  }
  return matchCount / validValues.length;
}
```

逻辑：遍历列中所有有效值，检查是否符合字段配置中的 dataPatterns 正则。返回匹配比例（0-1）。如果字段没有配置 dataPatterns，返回中性分数 0.5。

#### calculateConfidence(header, values, config) — 综合置信度计算

这是列匹配的核心算法，按6个层次逐步计算：

```typescript
function calculateConfidence(
  header: string,
  values: unknown[],
  config: FieldAliasConfig
): MatchConfidence {
  // 第1层：精确匹配检查
  const exactMatch = config.exact.some(alias =>
    header.toLowerCase() === alias.toLowerCase()
  );
  if (exactMatch) {
    return {
      nameSimilarity: 1,
      semanticSimilarity: 1,
      dataPatternScore: 1,
      overall: 1,
    };
  }

  // 第2层：名称相似度（Levenshtein + Jaccard混合）
  let maxNameSim = 0;
  for (const alias of [...config.exact, ...config.fuzzy]) {
    const levSim = textSimilarity(header, alias);
    const jacSim = jaccardSimilarity(header, alias);
    const combinedSim = levSim * 0.7 + jacSim * 0.3;
    maxNameSim = Math.max(maxNameSim, combinedSim);
  }

  // 第3层：正则模式匹配
  let patternMatchScore = 0;
  for (const pattern of config.patterns) {
    if (pattern.test(header)) {
      patternMatchScore = 1;
      break;
    }
  }

  // 名称相似度融合模式匹配
  const nameSimilarity = Math.max(maxNameSim, patternMatchScore * 0.9);

  // 第4层：语义相似度（基于词重叠）
  const headerWords = new Set(header.split(/[^\u4e00-\u9fa5a-zA-Z0-9]+/));
  let maxSemanticSim = 0;
  for (const alias of [...config.exact, ...config.fuzzy]) {
    const aliasWords = new Set(alias.split(/[^\u4e00-\u9fa5a-zA-Z0-9]+/));
    const intersection = new Set([...headerWords].filter(x => aliasWords.has(x)));
    const union = new Set([...headerWords, ...aliasWords]);
    const sim = intersection.size / union.size;
    maxSemanticSim = Math.max(maxSemanticSim, sim);
  }

  // 第5层：数据模式匹配
  const dataPatternScore = calculateDataPatternScore(values, config);

  // 第6层：综合置信度（加权平均）
  const overall =
    nameSimilarity * 0.4 +
    maxSemanticSim * 0.3 +
    dataPatternScore * 0.2 +
    patternMatchScore * 0.1;

  return {
    nameSimilarity: Math.round(nameSimilarity * 100) / 100,
    semanticSimilarity: Math.round(maxSemanticSim * 100) / 100,
    dataPatternScore: Math.round(dataPatternScore * 100) / 100,
    overall: Math.round(overall * 100) / 100,
  };
}
```

权重分配说明：
- 名称相似度 0.4：最高权重，因为列名是最直接的匹配信号
- 语义相似度 0.3：词级别的重叠提供语义层面的匹配
- 数据模式 0.2：实际数据值的格式验证（如价格列应包含数字）
- 正则模式 0.1：辅助匹配信号

#### getSuggestion(confidence) — 建议动作

```typescript
function getSuggestion(confidence: number): ColumnMapping['suggestion'] {
  if (confidence >= 0.85) return 'auto';
  if (confidence >= 0.6) return 'confirm';
  return 'reject';
}
```

#### matchColumns(headers, sampleData, customAliases?) — 智能匹配主函数

```typescript
export function matchColumns(
  headers: string[],
  sampleData: Record<string, unknown[]>,
  customAliases?: FieldAliasConfig[]
): ColumnMapping[] {
  const aliases = customAliases || productFieldAliases;
  const mappings: ColumnMapping[] = [];
  const matchedFields = new Set<string>();

  for (const header of headers) {
    const values = sampleData[header] || [];
    let bestMatch: ColumnMapping | null = null;
    let bestScore = 0;

    for (const config of aliases) {
      if (matchedFields.has(config.field)) continue;
      const confidence = calculateConfidence(header, values, config);
      if (confidence.overall > bestScore) {
        bestScore = confidence.overall;
        bestMatch = {
          sourceColumn: header,
          sourceHeader: header,
          targetField: config.field,
          confidence: confidence.overall,
          matchDetails: confidence,
          sampleValues: values.slice(0, 5).map(String),
          suggestion: getSuggestion(confidence.overall),
        };
      }
    }

    if (bestMatch && bestMatch.confidence >= 0.4) {
      mappings.push(bestMatch);
      matchedFields.add(bestMatch.targetField);
    } else {
      mappings.push({
        sourceColumn: header,
        sourceHeader: header,
        targetField: '',
        confidence: 0,
        matchDetails: {
          nameSimilarity: 0,
          semanticSimilarity: 0,
          dataPatternScore: 0,
          overall: 0,
        },
        sampleValues: values.slice(0, 5).map(String),
        suggestion: 'reject',
      });
    }
  }

  return mappings;
}
```

关键设计：
- **一对一映射约束**：使用 `matchedFields` Set 确保每个目标字段只被映射一次。一旦某列匹配到某字段，该字段不再参与后续列的匹配。
- **最低置信度阈值 0.4**：低于此阈值的列标记为未匹配（targetField 为空，suggestion 为 reject）。
- **贪心算法**：每个列选择置信度最高的字段，不考虑全局最优。

#### remapColumn(header, values, targetField, customAliases?) — 重新匹配指定列

```typescript
export function remapColumn(
  header: string,
  values: unknown[],
  targetField: string,
  customAliases?: FieldAliasConfig[]
): ColumnMapping {
  const aliases = customAliases || productFieldAliases;
  const config = aliases.find(a => a.field === targetField);

  if (!config) {
    return {
      sourceColumn: header,
      sourceHeader: header,
      targetField,
      confidence: 0.5,
      matchDetails: {
        nameSimilarity: 0.5,
        semanticSimilarity: 0.5,
        dataPatternScore: 0.5,
        overall: 0.5,
      },
      sampleValues: values.slice(0, 5).map(String),
      suggestion: 'confirm',
    };
  }

  const confidence = calculateConfidence(header, values, config);
  return {
    sourceColumn: header,
    sourceHeader: header,
    targetField,
    confidence: confidence.overall,
    matchDetails: confidence,
    sampleValues: values.slice(0, 5).map(String),
    suggestion: getSuggestion(confidence.overall),
  };
}
```

用于用户手动更改列映射后，重新计算该列与新目标字段的置信度。如果目标字段不在别名配置中，返回中性置信度 0.5 和 suggestion='confirm'。

### 26.4 数据解析器（dataParsers.ts 363行）

#### 价格匹配模式

```typescript
const pricePatterns = [
  { regex: /[¥￥]\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/, extract: 1 },  // ¥1,234.56
  { regex: /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*[元块]?/, extract: 1 }, // 1,234.56元
  { regex: /(\d+\.?\d*)\s*[w万]/i, multiplier: 10000 },  // 1.5万
  { regex: /(\d+\.?\d*)\s*[k千]/i, multiplier: 1000 },   // 5k
  { regex: /(\d+\.?\d*)\s*[百]/, multiplier: 100 },      // 3百
  { regex: /^\d+\.?\d*$/, extract: 0 },                    // 纯数字
];
```

每个模式包含 regex（正则）、extract（提取组索引）和可选的 multiplier（乘数）。按顺序尝试，第一个匹配成功的模式决定结果。

#### 中文数字映射

```typescript
const chineseNumbers: Record<string, number> = {
  '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
  '十': 10, '百': 100, '千': 1000, '万': 10000,
  '两': 2, '廿': 20, '卅': 30,
};
```

#### 库存文本映射

```typescript
const stockTextMap: Record<string, number | null> = {
  '充足': 999999,
  '大量': 999999,
  '很多': 999999,
  '丰富': 999999,
  '少量': 10,
  '紧张': 5,
  '缺货': 0,
  '无': 0,
  '零': 0,
  '暂无': 0,
  '-': 0,
  '—': 0,
  ' ': null,
};
```

`null` 值表示空格等不确定值，不进行转换。

#### parseChineseNumber(str) — 中文数字解析

```typescript
function parseChineseNumber(str: string): number | null {
  const normalized = str.replace(/[两廿卅]/g, s => {
    const map: Record<string, string> = { '两': '二', '廿': '二十', '卅': '三十' };
    return map[s] || s;
  });

  let result = 0;
  let current = 0;

  for (const char of normalized) {
    const num = chineseNumbers[char];
    if (num === undefined) continue;

    if (num >= 10) {
      if (current === 0) current = 1;
      result += current * num;
      current = 0;
    } else {
      current = current * 10 + num;
    }
  }

  return result + current || null;
}
```

处理逻辑：先归一化异体字（两→二、廿→二十、卅→三十），然后逐字符解析。数字字符累加为 current，单位字符（十/百/千/万）将 current 乘以单位值加到 result。例如"一百二十三" → result=100, current=20, current=3, 最终 123。

#### parsePrice(value) — 价格解析

```typescript
export function parsePrice(value: unknown): ParseResult<number> {
  const raw = value;
  const str = String(value).trim();

  if (value === null || value === undefined || str === '') {
    return { value: null, confidence: 0, raw, error: '空值' };
  }

  const invalidKeywords = ['面议', '待定', '询价', '电议', '协商', '—', '-', '/'];
  if (invalidKeywords.some(kw => str.includes(kw))) {
    return {
      value: null, confidence: 0, raw,
      error: `无法解析的价格描述: "${str}"`,
      warnings: ['建议手动输入具体价格']
    };
  }

  for (const pattern of pricePatterns) {
    const match = str.match(pattern.regex);
    if (match) {
      let num = parseFloat(match[pattern.extract].replace(/,/g, ''));
      if (pattern.multiplier) {
        num *= pattern.multiplier;
      }
      if (!isNaN(num) && num >= 0) {
        return {
          value: Math.round(num * 100) / 100,
          confidence: 0.92,
          raw,
          format: pattern.multiplier ? 'converted' : 'standard'
        };
      }
    }
  }

  // 回退：尝试直接提取数字
  const numericStr = str.replace(/[^0-9.]/g, '');
  const fallback = parseFloat(numericStr);

  if (!isNaN(fallback) && fallback >= 0) {
    return {
      value: Math.round(fallback * 100) / 100,
      confidence: 0.70,
      raw,
      format: 'extracted',
      warnings: [`从"${str}"提取的数字，请确认是否正确`]
    };
  }

  return { value: null, confidence: 0, raw, error: `无法解析价格: "${str}"` };
}
```

解析优先级：
1. 空值检查 → 返回 null
2. 无效关键词检查（面议/待定/询价等）→ 返回 null + 警告
3. 遍历6种价格模式按序匹配 → 置信度0.92
4. 回退提取数字 → 置信度0.70 + 警告
5. 完全无法解析 → 返回 null + error

#### parseNumber(value) — 通用数字解析

```typescript
export function parseNumber(value: unknown): ParseResult<number> {
  const raw = value;
  const str = String(value).trim();

  if (value === null || value === undefined || str === '') {
    return { value: null, confidence: 0, raw };
  }

  // 科学计数法
  if (/^-?\d+\.?\d*[eE][+-]?\d+$/.test(str)) {
    const num = Number(str);
    if (!isNaN(num)) {
      return { value: num, confidence: 0.95, raw, format: 'scientific' };
    }
  }

  // 千分位格式
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str.replace(/,/g, ''));
    if (!isNaN(num)) {
      return { value: num, confidence: 0.95, raw, format: 'thousands' };
    }
  }

  // 分数格式
  if (/^-?\d+\/\d+$/.test(str)) {
    const [num, den] = str.split('/').map(Number);
    if (den !== 0) {
      return { value: num / den, confidence: 0.90, raw, format: 'fraction' };
    }
  }

  // 百分比
  if (/^-?\d+\.?\d*%$/.test(str)) {
    const num = parseFloat(str) / 100;
    if (!isNaN(num)) {
      return { value: num, confidence: 0.90, raw, format: 'percentage' };
    }
  }

  // 中文数字
  const chineseNum = parseChineseNumber(str);
  if (chineseNum !== null) {
    return { value: chineseNum, confidence: 0.85, raw, format: 'chinese' };
  }

  // 标准数字
  const standard = parseFloat(str);
  if (!isNaN(standard)) {
    return { value: standard, confidence: 0.95, raw, format: 'standard' };
  }

  return { value: null, confidence: 0, raw, error: `无法解析数字: "${str}"` };
}
```

支持6种数字格式，按优先级尝试：科学计数法 → 千分位 → 分数 → 百分比 → 中文数字 → 标准数字。

#### parseStock(value) — 库存数量解析

```typescript
export function parseStock(value: unknown): ParseResult<number> {
  const raw = value;
  const str = String(value).trim();

  if (value === null || value === undefined || str === '') {
    return { value: 0, confidence: 0.5, raw };
  }

  // 检查文本映射
  const textValue = stockTextMap[str];
  if (textValue !== undefined) {
    if (textValue === null) {
      return { value: 0, confidence: 0.5, raw };
    }
    return {
      value: textValue,
      confidence: 0.80,
      raw,
      format: 'text-mapped',
      warnings: [`"${str}"已转换为${textValue}，请确认是否正确`]
    };
  }

  // 尝试数字解析
  const numResult = parseNumber(value);
  if (numResult.value !== null) {
    return { ...numResult, format: numResult.format || 'numeric' };
  }

  // 默认回退
  return { value: 0, confidence: 0.3, raw, warnings: [`无法解析"${str}"，默认为0`] };
}
```

库存解析的特殊之处：
1. 空值不返回null，而是返回0（confidence 0.5）
2. 支持中文文本映射（充足→999999、少量→10等）
3. 默认回退为0（confidence 0.3）

#### parseText(value, maxLength?) — 文本解析

```typescript
export function parseText(value: unknown, maxLength?: number): ParseResult<string> {
  const raw = value;

  if (value === null || value === undefined) {
    return { value: '', confidence: 0.5, raw };
  }

  let str = String(value).trim();
  str = str.replace(/\s+/g, ' ');

  if (maxLength && str.length > maxLength) {
    const truncated = str.slice(0, maxLength);
    return {
      value: truncated,
      confidence: 0.80,
      raw,
      warnings: [`文本长度超过${maxLength}字符，已截断`]
    };
  }

  return { value: str, confidence: 0.95, raw };
}
```

处理：去除首尾空格 → 合并多余空格 → 可选长度截断。

#### parseUnit(value) — 单位解析

```typescript
export function parseUnit(value: unknown): ParseResult<string> {
  const raw = value;
  const str = String(value).trim();

  if (!str) {
    return { value: '件', confidence: 0.5, raw, warnings: ['未指定单位，默认为"件"'] };
  }

  const validUnits = ['件', '个', 'kg', '套', '只', '支', '根', '片', '块', '组', '台', '米', '平方米'];

  if (validUnits.includes(str)) {
    return { value: str, confidence: 0.98, raw };
  }

  const unitMap: Record<string, string> = {
    'piece': '件', 'pcs': '件', 'pc': '件',
    'kilogram': 'kg', '公斤': 'kg', '千克': 'kg',
    'set': '套', 'sets': '套',
    'meter': '米', 'm': '米',
  };

  const mapped = unitMap[str.toLowerCase()];
  if (mapped) {
    return { value: mapped, confidence: 0.90, raw, warnings: [`"${str}"已转换为"${mapped}"`] };
  }

  return { value: str, confidence: 0.70, raw, warnings: [`未识别的单位"${str}"`] };
}
```

三级匹配：精确匹配（13个有效单位）→ 模糊映射（9个英文/中文别名）→ 原值保留 + 警告。

#### parseStatus(value) — 状态解析

```typescript
export function parseStatus(value: unknown): ParseResult<string> {
  const raw = value;
  const str = String(value).trim().toLowerCase();

  if (!str) {
    return { value: 'active', confidence: 0.5, raw };
  }

  const statusMap: Record<string, string> = {
    '正常': 'active', 'active': 'active', '启用': 'active', '使用': 'active',
    '停用': 'inactive', 'inactive': 'inactive', '禁用': 'inactive', '停止': 'inactive',
    '草稿': 'draft', 'draft': 'draft', '待确认': 'draft',
  };

  const mapped = statusMap[str];
  if (mapped) {
    return { value: mapped, confidence: 0.95, raw };
  }

  return { value: 'active', confidence: 0.50, raw, warnings: [`未识别的状态"${str}"，默认为active`] };
}
```

#### parseValueByField(value, field) — 按字段类型分发解析

```typescript
export function parseValueByField(value: unknown, field: string): ParseResult {
  switch (field) {
    case 'code':
    case 'name':
    case 'customerCode':
    case 'customerName':
    case 'workpieceNo':
      return parseText(value);
    case 'material':
      return parseText(value);
    case 'process':
      return parseText(value);
    case 'techRequirement':
      return parseText(value, 500);
    case 'unit':
      return parseUnit(value);
    case 'unitPrice':
      return parsePrice(value);
    case 'stock':
      return parseStock(value);
    case 'warningThreshold':
      return parseNumber(value);
    default:
      return parseText(value);
  }
}
```

#### generateDataIssue(rowIndex, column, parsed) — 生成数据问题

```typescript
export function generateDataIssue(
  rowIndex: number,
  column: string,
  parsed: ParseResult
): DataIssue | null {
  if (parsed.value === null || parsed.value === undefined) {
    if (parsed.error) {
      return {
        rowIndex,
        column,
        type: 'error',
        message: parsed.error,
        rawValue: parsed.raw,
      };
    }
    return null;
  }

  if (parsed.confidence < 0.5 && parsed.warnings) {
    return {
      rowIndex,
      column,
      type: 'warning',
      message: parsed.warnings[0],
      rawValue: parsed.raw,
    };
  }

  return null;
}
```

生成逻辑：
- 解析值为 null 且有 error → 生成 error 级别问题
- 置信度 < 0.5 且有 warnings → 生成 warning 级别问题
- 其他情况 → 不生成问题

### 26.5 字段拆分器（fieldSplitter.ts 413行）

#### similarity(a, b) — 简化字符串相似度

```typescript
function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower === bLower) return 1;
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.8;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  let common = 0;
  for (const char of aLower) {
    if (bLower.includes(char)) common++;
  }

  return common / maxLen;
}
```

三级匹配：完全匹配(1.0) → 包含关系(0.8) → 字符重叠比例。

#### extractByKeyValue(text) — 键值对模式提取

```typescript
function extractByKeyValue(text: string): Partial<CompositeSplit> {
  const result: Partial<CompositeSplit> = {};

  for (const pattern of compositeFieldPatterns.keyValuePatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const value = match[1].trim();
      switch (pattern.field) {
        case 'material':
          result.material = parseText(value) as ParseResult<string>;
          break;
        case 'process':
          result.process = parseText(value) as ParseResult<string>;
          break;
        case 'techRequirement':
          result.techRequirement = parseText(value) as ParseResult<string>;
          break;
      }
    }
  }

  return result;
}
```

使用 `compositeFieldPatterns.keyValuePatterns` 中的6个正则模式提取：
- `材质：XXX` → material
- `材料：XXX` → material
- `工艺：XXX` → process
- `处理：XXX` → process
- `要求：XXX` → techRequirement
- `技术：XXX` → techRequirement

#### splitByDelimiters(text) — 按分隔符拆分

```typescript
function splitByDelimiters(text: string): string[] {
  const delimiters = compositeFieldPatterns.delimiters;
  const regex = new RegExp(
    `[${delimiters.map(d => d.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('')}]`,
    'g'
  );
  return text.split(regex).map(s => s.trim()).filter(Boolean);
}
```

分隔符列表：`['/', '、', ',', '，', ';', '；', '|', ' ', '，', '／']`

正则中的特殊字符会被转义。拆分后去除空白片段。

#### classifyFragment(fragment) — 片段分类

```typescript
function classifyFragment(fragment: string): {
  type: 'material' | 'process' | 'requirement' | 'unknown';
  confidence: number;
  matchedStandard?: string;
} {
  const lower = fragment.toLowerCase();

  // 1. 材质匹配
  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      const sim = similarity(lower, alias.toLowerCase());
      if (sim >= 0.8) {
        return { type: 'material', confidence: sim, matchedStandard: material.standard };
      }
    }
  }

  // 材质指示词检查
  for (const indicator of compositeFieldPatterns.materialIndicators) {
    if (lower.includes(indicator.toLowerCase())) {
      return { type: 'material', confidence: 0.6 };
    }
  }

  // 2. 工艺匹配
  for (const process of processStandards) {
    for (const alias of process.aliases) {
      const sim = similarity(lower, alias.toLowerCase());
      if (sim >= 0.8) {
        return { type: 'process', confidence: sim, matchedStandard: process.standard };
      }
    }
  }

  // 工艺指示词检查
  for (const indicator of compositeFieldPatterns.processIndicators) {
    if (lower.includes(indicator.toLowerCase())) {
      return { type: 'process', confidence: 0.6 };
    }
  }

  // 3. 技术要求匹配
  for (const indicator of compositeFieldPatterns.requirementIndicators) {
    if (lower.includes(indicator.toLowerCase())) {
      return { type: 'requirement', confidence: 0.5 };
    }
  }

  return { type: 'unknown', confidence: 0 };
}
```

分类优先级：材质匹配 → 材质指示词 → 工艺匹配 → 工艺指示词 → 技术要求指示词 → unknown。

#### fuzzyMatchMaterial(input) — 材质模糊匹配

```typescript
export function fuzzyMatchMaterial(input: string): {
  standard: string;
  confidence: number;
  matchedBy: 'exact' | 'contains' | 'fuzzy' | 'none';
  original: string;
} {
  const normalized = input.toUpperCase().replace(/\s/g, '');

  // 第1层：精确匹配
  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      if (normalized === alias.toUpperCase().replace(/\s/g, '')) {
        return { standard: material.standard, confidence: 1.0, matchedBy: 'exact', original: input };
      }
    }
  }

  // 第2层：包含匹配
  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      const aliasNorm = alias.toUpperCase().replace(/\s/g, '');
      if (normalized.includes(aliasNorm) || aliasNorm.includes(normalized)) {
        return { standard: material.standard, confidence: 0.85, matchedBy: 'contains', original: input };
      }
    }
  }

  // 第3层：模糊匹配（编辑距离）
  let bestMatch: { standard: string; distance: number; alias: string } | null = null;

  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      const aliasNorm = alias.toUpperCase().replace(/\s/g, '');
      let distance = 0;
      const maxLen = Math.max(normalized.length, aliasNorm.length);

      if (maxLen > 0) {
        for (let i = 0; i < Math.min(normalized.length, aliasNorm.length); i++) {
          if (normalized[i] !== aliasNorm[i]) distance++;
        }
        distance += Math.abs(normalized.length - aliasNorm.length);
      }

      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { standard: material.standard, distance, alias };
      }
    }
  }

  if (bestMatch && bestMatch.distance <= 2 && normalized.length >= 2) {
    const confidence = 1 - (bestMatch.distance / Math.max(normalized.length, bestMatch.alias.length));
    return { standard: bestMatch.standard, confidence: Math.max(0.5, confidence), matchedBy: 'fuzzy', original: input };
  }

  // 未匹配到标准材质
  return { standard: input, confidence: 0.3, matchedBy: 'none', original: input };
}
```

三层匹配策略：
1. 精确匹配（大小写+空格归一化后完全相等）→ confidence=1.0
2. 包含匹配（互相包含）→ confidence=0.85
3. 模糊匹配（编辑距离≤2）→ confidence=0.5~1.0
4. 未匹配 → 原值保留，confidence=0.3

#### fuzzyMatchProcess(input) — 工艺模糊匹配

与 fuzzyMatchMaterial 类似的三层匹配，额外支持组合工艺处理：

```typescript
// 组合工艺处理（如"淬火+回火"）
const comboDelimiters = /[+加\/&]/;
if (comboDelimiters.test(input)) {
  const parts = input.split(comboDelimiters).map(s => s.trim()).filter(Boolean);
  const matchedParts = parts.map(p => fuzzyMatchProcess(p)).filter(r => r.confidence > 0.5);

  if (matchedParts.length > 0) {
    const combined = matchedParts.map(p => p.standard).join('+');
    const avgConfidence = matchedParts.reduce((sum, p) => sum + p.confidence, 0) / matchedParts.length;
    return {
      standard: combined,
      confidence: avgConfidence * 0.9,
      matchedBy: 'contains',
      original: input,
    };
  }
}
```

递归处理：将组合工艺按 `+加/&` 分隔，对每个子部分递归调用 fuzzyMatchProcess，合并匹配结果（confidence取平均*0.9）。

#### splitCompositeField(text) — 混合字段拆分主函数

```typescript
export function splitCompositeField(text: string): CompositeSplit {
  const original = text.trim();

  if (!original) {
    return { original, confidence: 0 };
  }

  // 1. 尝试键值对提取
  const keyValueResult = extractByKeyValue(original);
  if (keyValueResult.material || keyValueResult.process || keyValueResult.techRequirement) {
    const hasMaterial = !!keyValueResult.material;
    const hasProcess = !!keyValueResult.process;
    const hasRequirement = !!keyValueResult.techRequirement;

    return {
      material: keyValueResult.material,
      process: keyValueResult.process,
      techRequirement: keyValueResult.techRequirement,
      original,
      confidence: (hasMaterial ? 0.3 : 0) + (hasProcess ? 0.3 : 0) + (hasRequirement ? 0.3 : 0) + 0.1,
    };
  }

  // 2. 按分隔符拆分 + 片段分类
  const fragments = splitByDelimiters(original);
  const classified = fragments.map(f => ({
    fragment: f,
    ...classifyFragment(f),
  }));

  const result: CompositeSplit = { original, confidence: 0 };
  let classifiedCount = 0;

  for (const item of classified) {
    if (item.type === 'material' && !result.material) {
      const matched = fuzzyMatchMaterial(item.fragment);
      result.material = {
        value: matched.standard,
        confidence: matched.confidence,
        raw: item.fragment,
        warnings: matched.matchedBy === 'none' ? ['未匹配到标准材质'] : undefined,
      };
      classifiedCount++;
    } else if (item.type === 'process' && !result.process) {
      const matched = fuzzyMatchProcess(item.fragment);
      result.process = {
        value: matched.standard,
        confidence: matched.confidence,
        raw: item.fragment,
        warnings: matched.matchedBy === 'none' ? ['未匹配到标准工艺'] : undefined,
      };
      classifiedCount++;
    } else if (item.type === 'requirement' && !result.techRequirement) {
      result.techRequirement = parseText(item.fragment, 500);
      classifiedCount++;
    }
  }

  result.confidence = classifiedCount > 0
    ? Math.min(0.9, classifiedCount * 0.3 + 0.1)
    : 0.3;

  return result;
}
```

拆分策略：
1. 优先尝试键值对提取（如"材质：45# 工艺：淬火"）
2. 失败则按分隔符拆分 + 逐片段分类
3. 对分类为材质的片段调用 fuzzyMatchMaterial 标准化
4. 对分类为工艺的片段调用 fuzzyMatchProcess 标准化
5. 对分类为技术要求的片段调用 parseText
6. confidence = 已分类片段数 * 0.3 + 0.1（上限0.9）

### 26.6 材质标准库（materialStandards.ts 462行）

#### 碳素结构钢（carbonSteels）

| 标准 | 名称 | 别名 |
|------|------|------|
| Q195 | 碳素结构钢 | Q195, 195, Q195A, Q195B |
| Q215 | 碳素结构钢 | Q215, 215, Q215A, Q215B |
| Q235 | 碳素结构钢 | Q235, 235, Q235A, Q235B, Q235C, Q235D, A3, A3钢 |
| Q275 | 碳素结构钢 | Q275, 275 |

#### 优质碳素结构钢（qualityCarbonSteels）

| 标准 | 名称 | 别名 |
|------|------|------|
| 08# | 优质碳素结构钢 | 08#, 08, 08F, 08钢, 零八号钢 |
| 10# | 优质碳素结构钢 | 10#, 10, 10F, 10钢, 十号钢 |
| 15# | 优质碳素结构钢 | 15#, 15, 15F, 15钢, 十五号钢 |
| 20# | 优质碳素结构钢 | 20#, 20, 20F, 20钢, 二十号钢 |
| 25# | 优质碳素结构钢 | 25#, 25, 25钢, 二十五号钢 |
| 30# | 优质碳素结构钢 | 30#, 30, 30钢, 三十号钢 |
| 35# | 优质碳素结构钢 | 35#, 35, 35钢, 三十五号钢 |
| 40# | 优质碳素结构钢 | 40#, 40, 40钢, 四十号钢 |
| 45# | 优质碳素结构钢 | 45#, 45, 45钢, 四十五号钢, 45号钢, 45#钢 |
| 50# | 优质碳素结构钢 | 50#, 50, 50钢, 五十号钢 |
| 55# | 优质碳素结构钢 | 55#, 55, 55钢, 五十五号钢 |
| 60# | 优质碳素结构钢 | 60#, 60, 60钢 |
| 65# | 优质碳素结构钢 | 65#, 65, 65钢 |
| 70# | 优质碳素结构钢 | 70#, 70, 70钢 |
| 75# | 优质碳素结构钢 | 75#, 75, 75钢 |
| 80# | 优质碳素结构钢 | 80#, 80, 80钢 |
| 85# | 优质碳素结构钢 | 85#, 85, 85钢 |

#### 合金结构钢（alloySteels）

| 标准 | 名称 | 别名 |
|------|------|------|
| 20Cr | 合金结构钢 | 20Cr, 20铬, 20CrMo |
| 40Cr | 合金结构钢 | 40Cr, 40铬, 40CrMo |
| 45Cr | 合金结构钢 | 45Cr, 45铬 |
| 50Cr | 合金结构钢 | 50Cr, 50铬 |
| 20Mn | 合金结构钢 | 20Mn, 20锰 |
| 40Mn | 合金结构钢 | 40Mn, 40锰 |
| 50Mn | 合金结构钢 | 50Mn, 50锰 |
| 20CrMnTi | 合金结构钢 | 20CrMnTi, 20铬锰钛 |
| 40CrMnTi | 合金结构钢 | 40CrMnTi, 40铬锰钛 |
| 30CrMnSi | 合金结构钢 | 30CrMnSi, 30铬锰硅 |
| 35CrMnSiA | 合金结构钢 | 35CrMnSiA, 35铬锰硅A |
| 20CrMo | 合金结构钢 | 20CrMo, 20铬钼 |
| 35CrMo | 合金结构钢 | 35CrMo, 35铬钼 |
| 42CrMo | 合金结构钢 | 42CrMo, 42铬钼, 42CrMo4 |
| 40CrNi | 合金结构钢 | 40CrNi, 40铬镍 |
| 40CrNiMoA | 合金结构钢 | 40CrNiMoA, 40铬镍钼A |
| 18CrNiMo7-6 | 合金结构钢 | 18CrNiMo7-6, 18CrNiMo |

#### 不锈钢（stainlessSteels）

| 标准 | 名称 | 别名 |
|------|------|------|
| 304 | 不锈钢 | 304, 304不锈钢, 0Cr18Ni9, 06Cr19Ni10 |
| 316 | 不锈钢 | 316, 316不锈钢, 0Cr17Ni12Mo2, 06Cr17Ni12Mo2 |
| 201 | 不锈钢 | 201, 201不锈钢 |
| 202 | 不锈钢 | 202, 202不锈钢 |
| 321 | 不锈钢 | 321, 321不锈钢, 0Cr18Ni9Ti |
| 309 | 不锈钢 | 309, 309不锈钢, 2Cr23Ni13 |
| 310 | 不锈钢 | 310, 310不锈钢, 2Cr25Ni20 |
| 430 | 不锈钢 | 430, 430不锈钢, 1Cr17 |
| 410 | 不锈钢 | 410, 410不锈钢, 1Cr13 |
| 420 | 不锈钢 | 420, 420不锈钢, 2Cr13 |

#### 工具钢（toolSteels）

| 标准 | 名称 | 别名 |
|------|------|------|
| T8 | 碳素工具钢 | T8, T8A, T8钢 |
| T10 | 碳素工具钢 | T10, T10A, T10钢 |
| T12 | 碳素工具钢 | T12, T12A, T12钢 |
| 9SiCr | 合金工具钢 | 9SiCr, 9硅铬 |
| CrWMn | 合金工具钢 | CrWMn, 铬钨锰 |
| 9Mn2V | 合金工具钢 | 9Mn2V |
| Cr12 | 合金工具钢 | Cr12, D3 |
| Cr12MoV | 合金工具钢 | Cr12MoV, D2 |
| 3Cr2W8V | 合金工具钢 | 3Cr2W8V, H21 |
| 5CrNiMo | 合金工具钢 | 5CrNiMo, L6 |
| 5CrMnMo | 合金工具钢 | 5CrMnMo |
| H13 | 热作模具钢 | H13, 4Cr5MoSiV1, SKD61 |
| P20 | 塑料模具钢 | P20, 3Cr2Mo |
| 718 | 塑料模具钢 | 718, 3Cr2NiMo |
| NAK80 | 塑料模具钢 | NAK80, 10Ni3MnCuAl |
| S136 | 塑料模具钢 | S136, 4Cr13 |

#### allMaterialStandards 聚合

```typescript
export const allMaterialStandards: MaterialStandard[] = [
  ...carbonSteels,
  ...qualityCarbonSteels,
  ...alloySteels,
  ...stainlessSteels,
  ...toolSteels,
];
```

#### 工艺标准库（processStandards）

**热处理类（heat）**：

| 标准 | 名称 | 别名 |
|------|------|------|
| 淬火 | 热处理 | 淬火, 淬, Quenching, quench |
| 回火 | 热处理 | 回火, 回, Tempering, temper |
| 正火 | 热处理 | 正火, 常化, Normalizing |
| 退火 | 热处理 | 退火, Annealing, anneal |
| 调质 | 热处理 | 调质, 调质处理, Quenching and Tempering, QT |
| 固溶 | 热处理 | 固溶, 固溶处理, Solution Treatment |
| 时效 | 热处理 | 时效, 时效处理, Aging |
| 渗碳 | 热处理 | 渗碳, 渗碳处理, Carburizing |
| 碳氮共渗 | 热处理 | 碳氮共渗, Carbonitriding |
| 氮化 | 热处理 | 氮化, 渗氮, Nitriding, Nitro |
| 软氮化 | 热处理 | 软氮化, 氮碳共渗, Ferritic Nitrocarburizing |
| 高频淬火 | 热处理 | 高频淬火, 高频, HF Quenching |
| 中频淬火 | 热处理 | 中频淬火, 中频, MF Quenching |
| 火焰淬火 | 热处理 | 火焰淬火, Flame Quenching |

**表面处理类（surface）**：

| 标准 | 名称 | 别名 |
|------|------|------|
| 喷砂 | 表面处理 | 喷砂, Sandblasting |
| 抛光 | 表面处理 | 抛光, Polishing, polish |
| 镀硬铬 | 表面处理 | 镀硬铬, 硬铬, Hard Chrome |
| 镀锌 | 表面处理 | 镀锌, Galvanizing |
| 发黑 | 表面处理 | 发黑, 发黑处理, Blackening |
| 磷化 | 表面处理 | 磷化, 磷化处理, Phosphating |
| 阳极氧化 | 表面处理 | 阳极氧化, Anodizing, Anode |
| 电泳 | 表面处理 | 电泳, 电泳涂装, Electrophoresis |

**机加工类（machining）**：

| 标准 | 名称 | 别名 |
|------|------|------|
| 车削 | 机加工 | 车削, 车加工, Turning |
| 铣削 | 机加工 | 铣削, 铣加工, Milling |
| 磨削 | 机加工 | 磨削, 磨加工, Grinding |
| 线切割 | 机加工 | 线切割, 线割, WEDM, Wire EDM |

### 26.7 字段别名配置（fieldAliases.ts 122行）

#### productFieldAliases — 12个字段的完整匹配配置

| 字段 | exact别名 | fuzzy别名 | patterns正则 | dataPatterns |
|------|----------|----------|-------------|--------------|
| code | 编码, 编号, 产品编码, 产品编号, code, productCode, 编号 | 码, 号, 编号, 编码, 代号, SKU, 货号 | `/^编[码号]?/`, `/code/i`, `/编号?/`, `/sku/i`, `/货号?/` | `/^[A-Za-z0-9\-]+$/` |
| name | 产品名称, 产品名, 品名, name, productName, 货物名称, 货品名称 | 产品, 名称, 品名, 货品, 货物 | `/^产品(名\|名称)?$/`, `/品名/`, `/^name$/i`, `/^product(name)?$/i` | `/.{2,50}/` |
| material | 材质, 材料, 材质规格, material, 钢种, 牌号 | 钢, 材质, 材料, 钢种, 钢号, 材质类型, 材料规格 | `/材质?/`, `/材料?/`, `/钢号?/`, `/钢种?/`, `/牌号?/`, `/\d{2,}#/` | `/[#钢铁铝铜合金]/`, `/^(Q\d\|\d{2,}#\|20Cr\|40Cr\|42CrMo)/i` |
| process | 工艺, 加工工艺, 处理工艺, process, 加工方式, 热处理 | 处理, 工艺, 加工, 热处理方式, 表面工艺 | `/工艺?/`, `/process/i`, `/处理/`, `/加工/`, `/淬火\|回火\|正火\|退火\|调质\|渗碳\|氮化/` | — |
| techRequirement | 技术要求, 技术条件, 质量要求, techRequirement, 验收标准 | 要求, 技术, 质量, 标准, 规范 | `/技术(要求\|条件\|标准)?/`, `/质量(要求\|标准)?/`, `/验收/`, `/规范/`, `/HRC\|HB\|HV/` | — |
| workpieceNo | 图号, 工件号, 零件号, workpieceNo, drawingNo, 件号 | 图号, 工件, 零件, 图纸, drawing | `/图号?/`, `/工件号?/`, `/零件号?/`, `/drawing/i`, `/件号?/` | — |
| unit | 单位, 计量单位, unit | 单位, 件, 个, kg, 套 | `/单位?/`, `/unit/i` | `/^(件\|个\|kg\|套\|只\|支\|根\|片\|块\|套\|组)$/` |
| unitPrice | 单价, 价格, 单价(元), unitPrice, price, 报价 | 价, 金额, 单价, 价格, 成本, 费用, 元, 钱 | `/^单价?/`, `/price/i`, `/cost/i`, `/金额?/`, `/元/`, `/报价/` | `/^\d+\.?\d*$/`, `/[¥￥]\s*\d+/`, `/\d+\s*[元块]/` |
| customerCode | 客户编码, 客户编号, customerCode, 客户代码 | 客户, 编码, 编号, 代码 | `/客户(编码\|编号\|代码)?/`, `/customer( code\| id)?/i` | — |
| customerName | 客户名称, 客户名, customerName, 客户单位, 客户公司名称 | 客户名称, 客户名, 客户单位, 公司名称, 客户公司 | `/客户(名\|名称\|单位)$/`, `/^customer( name)?$/i`, `/客户公司/` | `/^[^\d]{2,20}$/` |
| stock | 库存, 库存数量, stock, 库存量, 现有库存 | 库存, 数量, 存量, 现有, 剩余 | `/库存?/`, `/stock/i`, `/数量/`, `/存量/` | `/^\d+$/`, `/^\d+\.?\d*$/` |
| warningThreshold | 预警值, 阈值, 库存预警, warningThreshold, 预警数量 | 预警, 阈值, 告警, 提醒值, 安全库存 | `/预警/`, `/阈值/`, `/告警/`, `/warning/i`, `/threshold/i`, `/安全库存/` | `/^\d+$/` |

#### compositeFieldPatterns — 复合字段模式

```typescript
export const compositeFieldPatterns = {
  delimiters: ['/', '、', ',', '，', ';', '；', '|', ' ', '，', '／'],

  materialIndicators: [
    '钢', '铁', '铝', '铜', '合金', '#', 'Q', 'CR', 'MO', 'MN', 'NI', 'TI',
    '45', '40', '42', '20', '35', '304', '316', '201', 'Q235', 'Q345'
  ],

  processIndicators: [
    '淬火', '回火', '正火', '退火', '调质', '渗碳', '氮化', '碳氮共渗',
    '高频', '中频', '感应', '表面', '喷砂', '抛光', '镀铬', '镀锌',
    '发黑', '磷化', '氧化'
  ],

  requirementIndicators: [
    '硬度', 'HRC', 'HB', 'HV', '强度', '精度', '粗糙度', 'Ra', '公差',
    '尺寸', '规格', '范围', '-', '~', '至'
  ],

  keyValuePatterns: [
    { regex: /材质[：:]?\s*([^工艺要求\s]+)/i, field: 'material' },
    { regex: /材料[：:]?\s*([^工艺要求\s]+)/i, field: 'material' },
    { regex: /工艺[：:]?\s*([^要求\s]+)/i, field: 'process' },
    { regex: /处理[：:]?\s*([^要求\s]+)/i, field: 'process' },
    { regex: /要求[：:]?\s*(.+)/i, field: 'techRequirement' },
    { regex: /技术[：:]?\s*(.+)/i, field: 'techRequirement' },
  ],
};
```

### 26.8 主入口与完整流程（index.ts 739行）

#### parseExcelFile(file) — 解析Excel文件

```typescript
export function parseExcelFile(file: File): Promise<{
  headers: string[];
  data: Record<string, unknown>[];
  sheetName: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          header: 1,
          defval: '',
        });

        if (jsonData.length < 2) {
          reject(new Error('Excel文件数据不足，至少需要包含表头和一行数据'));
          return;
        }

        const headers = (jsonData[0] as unknown as string[]).map(h => String(h).trim());
        const rows = jsonData.slice(1).map((row) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            obj[header] = (row as unknown as unknown[])[index];
          });
          return obj;
        });

        resolve({ headers, data: rows, sheetName: firstSheetName });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}
```

使用 XLSX 库（SheetJS）解析 Excel 文件。流程：
1. FileReader 读取为 ArrayBuffer
2. XLSX.read 解析工作簿（type: 'array'）
3. 取第一个工作表
4. sheet_to_json 转换（header: 1 表示第一行作为数组返回，defval: '' 空值填充）
5. 至少需要 2 行（表头 + 1 行数据）
6. 提取 headers（trim）和 rows（按 header 建对象）

#### analyzeColumnSamples(data, headers) — 分析列数据样本

```typescript
function analyzeColumnSamples(
  data: Record<string, unknown>[],
  headers: string[]
): Record<string, unknown[]> {
  const samples: Record<string, unknown[]> = {};

  for (const header of headers) {
    samples[header] = data
      .map(row => row[header])
      .filter(v => v !== undefined && v !== null && v !== '')
      .slice(0, 10);
  }

  return samples;
}
```

提取每列前 10 个有效值（非 undefined/null/空字符串），用于列匹配引擎的数据模式分析。

#### normalizeData(data, columnMappings) — 标准化Excel数据

```typescript
function normalizeData(
  data: Record<string, unknown>[],
  columnMappings: ColumnMapping[]
): NormalizedRow[] {
  const normalizedRows: NormalizedRow[] = [];

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const normalizedRow: NormalizedRow = {
      _rowIndex: rowIndex,
      _quality: 'valid',
      _issues: [],
    };

    // 检查是否有复合字段列
    const compositeMapping = columnMappings.find(
      m => m.targetField === 'composite[material+process]'
    );

    let compositeSplit: CompositeSplit | null = null;
    if (compositeMapping) {
      const compositeValue = row[compositeMapping.sourceColumn];
      if (compositeValue) {
        compositeSplit = splitCompositeField(String(compositeValue));
      }
    }

    for (const mapping of columnMappings) {
      if (!mapping.targetField || mapping.targetField.startsWith('composite')) continue;

      // 从复合字段拆分的值
      if (compositeSplit && ['material', 'process', 'techRequirement'].includes(mapping.targetField)) {
        const splitValue = compositeSplit[mapping.targetField as keyof CompositeSplit];
        if (typeof splitValue === 'object' && splitValue !== null && 'value' in splitValue) {
          normalizedRow[mapping.targetField] = splitValue as ParseResult;
          if (splitValue.warnings) {
            for (const warning of splitValue.warnings) {
              normalizedRow._issues.push({
                rowIndex,
                column: mapping.targetField,
                type: 'warning',
                message: warning,
                rawValue: compositeSplit.original,
              });
            }
          }
          continue;
        }
      }

      // 普通字段解析
      const value = row[mapping.sourceColumn];
      const parsed = parseValueByField(value, mapping.targetField);
      normalizedRow[mapping.targetField] = parsed;

      const issue = generateDataIssue(rowIndex, mapping.targetField, parsed);
      if (issue) {
        normalizedRow._issues.push(issue);
      }
    }

    // 必填字段验证
    const requiredFields = ['code', 'name', 'customerCode', 'customerName'];
    for (const field of requiredFields) {
      const fieldValue = normalizedRow[field];
      let value: string | null = null;

      if (typeof fieldValue === 'object' && fieldValue !== null && 'value' in fieldValue) {
        value = String((fieldValue as ParseResult).value || '');
      } else if (typeof fieldValue === 'string') {
        value = fieldValue;
      } else {
        value = String(fieldValue || '');
      }

      if (!value || value.trim() === '') {
        const fieldLabels: Record<string, string> = {
          code: '产品编码',
          name: '产品名称',
          customerCode: '客户编码',
          customerName: '客户名称',
        };
        normalizedRow._issues.push({
          rowIndex,
          column: field,
          type: 'error',
          message: `${fieldLabels[field]}不能为空`,
          rawValue: '',
        });
      }
    }

    // 确定行质量
    const errors = normalizedRow._issues.filter(i => i.type === 'error').length;
    const warnings = normalizedRow._issues.filter(i => i.type === 'warning').length;

    if (errors > 0) {
      normalizedRow._quality = 'error';
    } else if (warnings > 0) {
      normalizedRow._quality = 'warning';
    }

    normalizedRows.push(normalizedRow);
  }

  return normalizedRows;
}
```

标准化流程：
1. 遍历每行数据
2. 检查是否有复合字段列（`composite[material+process]`），如有则调用 splitCompositeField
3. 对每个列映射，优先使用复合字段拆分结果，否则调用 parseValueByField
4. 生成数据问题（generateDataIssue）
5. 必填字段验证（code/name/customerCode/customerName）
6. 行质量分级：有 error → 'error'，仅有 warning → 'warning'，无问题 → 'valid'

#### generateQualityReport(totalRows, normalizedData) — 生成数据质量报告

```typescript
function generateQualityReport(
  totalRows: number,
  normalizedData: NormalizedRow[]
): DataQualityReport {
  const validRows = normalizedData.filter(r => r._quality === 'valid').length;
  const warningRows = normalizedData.filter(r => r._quality === 'warning').length;
  const errorRows = normalizedData.filter(r => r._quality === 'error').length;

  const allIssues: DataIssue[] = [];
  for (const row of normalizedData) {
    allIssues.push(...row._issues);
  }

  // 按错误类型统计
  const errorTypes = new Map<string, number>();
  for (const issue of allIssues) {
    const key = `${issue.type}:${issue.column}:${issue.message}`;
    errorTypes.set(key, (errorTypes.get(key) || 0) + 1);
  }

  // 取最常见的问题（前20条）
  const topIssues = Array.from(errorTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => {
      const [type, column, ...messageParts] = key.split(':');
      const firstIssue = allIssues.find(i =>
        i.type === type && i.column === column
      );
      return {
        rowIndex: -1,
        column,
        type: type as 'error' | 'warning' | 'info',
        message: `${messageParts.join(':')} (影响${count}行)`,
        rawValue: firstIssue?.rawValue,
      };
    });

  const overall = totalRows > 0
    ? (validRows + warningRows * 0.5) / totalRows
    : 0;

  return {
    overall: Math.round(overall * 100) / 100,
    totalRows,
    validRows,
    warningRows,
    errorRows,
    issues: topIssues,
  };
}
```

报告生成逻辑：
1. 统计 valid/warning/error 行数
2. 收集所有 DataIssue
3. 按 `type:column:message` 为 key 聚合统计
4. 取出现次数最多的前 20 条问题
5. 每条聚合问题的 message 追加 "(影响N行)"
6. overall 评分 = (valid + warning*0.5) / total

#### rowHasAnyData(row) — 检查行是否有有效数据

```typescript
function rowHasAnyData(row: Record<string, unknown>): boolean {
  return Object.values(row).some(val => {
    if (val === undefined || val === null) return false;
    const str = String(val).trim();
    return str !== '' && str !== '0';
  });
}
```

注意：值为 '0' 的单元格被视为无数据（因为可能是默认填充值）。只有至少有一个非空非零值的行才被保留。

#### analyzeExcelFile(file) — 完整分析流程

```typescript
export async function analyzeExcelFile(file: File): Promise<ImportPreviewState> {
  // 1. 解析Excel
  const { headers, data, sheetName } = await parseExcelFile(file);

  // 1.5 自动过滤完全空白的行
  const filteredData = data.filter(row => rowHasAnyData(row));
  const emptyRowCount = data.length - filteredData.length;

  if (emptyRowCount > 0) {
    toast.info(`已自动过滤 ${emptyRowCount} 行空白数据`);
  }

  // 2. 分析列样本
  const samples = analyzeColumnSamples(filteredData, headers);

  // 3. 智能列匹配
  let columnMappings = matchColumns(headers, samples);

  // 4. 检查是否有材质和工艺合并的列
  const materialMapping = columnMappings.find(m => m.targetField === 'material');
  const processMapping = columnMappings.find(m => m.targetField === 'process');

  if (materialMapping && processMapping &&
      materialMapping.sourceColumn === processMapping.sourceColumn) {
    columnMappings = columnMappings.filter(m => m.targetField !== 'process');
    const materialMap = columnMappings.find(m => m.targetField === 'material');
    if (materialMap) {
      materialMap.targetField = 'composite[material+process]';
      materialMap.suggestion = 'confirm';
    }
  }

  // 5. 标准化数据
  const normalizedData = normalizeData(filteredData, columnMappings);

  // 6. 生成质量报告
  const qualityReport = generateQualityReport(filteredData.length, normalizedData);

  return {
    fileName: file.name,
    totalRows: filteredData.length,
    columnMappings,
    normalizedData,
    qualityReport,
    selectedRows: normalizedData
      .filter(r => r._quality !== 'error')
      .map(r => r._rowIndex),
    forcedImportRows: [],
  };
}
```

完整流程7步：
1. parseExcelFile 解析 Excel
2. rowHasAnyData 过滤空白行 + toast 提示
3. analyzeColumnSamples 采样
4. matchColumns 列匹配
5. 复合字段检测（材质+工艺同列 → composite[material+process]）
6. normalizeData 标准化
7. generateQualityReport 生成报告

返回的 ImportPreviewState 中，selectedRows 默认包含所有非 error 行，forcedImportRows 为空。

#### updateColumnMapping(state, sourceColumn, newTargetField) — 更新列映射

当用户在预览界面手动更改某列的目标字段时调用：

1. 找到对应列的映射索引
2. 更新映射：targetField 改为新值，confidence=1（用户手动设置），suggestion='auto'
3. 迁移旧字段数据到新字段
4. 重新验证必填字段（优先使用用户编辑值 _userEdits）
5. 重新计算行质量
6. 重新生成质量报告
7. 保留用户选择状态（selectedRows / forcedImportRows 过滤掉已不存在的行）
8. 如果用户之前没做过选择，自动选中新解析出的非错误行

#### convertToProducts(state, defaultCustomerCode?, defaultCustomerName?) — 转换为产品对象

```typescript
export function convertToProducts(
  state: ImportPreviewState,
  defaultCustomerCode?: string,
  defaultCustomerName?: string
): Partial<IProduct>[] {
  const products: Partial<IProduct>[] = [];
  const allFields = ['code', 'name', 'material', 'process', 'techRequirement',
    'workpieceNo', 'unit', 'unitPrice', 'stock', 'warningThreshold',
    'customerCode', 'customerName'];

  for (const rowIndex of state.selectedRows) {
    const row = state.normalizedData.find(r => r._rowIndex === rowIndex);
    if (!row) continue;

    // 自动过滤空白行
    if (!hasAnyData(row, allFields)) continue;

    // 获取值（优先用户编辑）
    const getValue = (field: string): unknown => {
      const result = row[field];
      if (typeof result === 'object' && result !== null && 'value' in result) {
        return (result as ParseResult).value;
      }
      return result;
    };

    let code = String(getValue('code') || '');
    let name = String(getValue('name') || '');
    let customerCode = String(getValue('customerCode') || '');
    let customerName = String(getValue('customerName') || '');

    // 默认值填充
    if (!customerCode && defaultCustomerCode) {
      customerCode = defaultCustomerCode;
    }
    if (!customerName && defaultCustomerName) {
      customerName = defaultCustomerName;
    }

    // 强制导入模式
    const isForcedImport = state.forcedImportRows.includes(row._rowIndex);

    if (!isForcedImport) {
      // 正常模式：必填字段检查
      const missingFields: string[] = [];
      if (!code.trim()) missingFields.push('产品编码');
      if (!name.trim()) missingFields.push('产品名称');
      if (!customerCode.trim()) missingFields.push('客户编码');
      if (!customerName.trim()) missingFields.push('客户名称');

      if (missingFields.length > 0) continue;
    }

    const product: Partial<IProduct> = {
      code: code.trim(),
      name: name.trim(),
      material: String(getValue('material') || ''),
      process: String(getValue('process') || ''),
      techRequirement: String(getValue('techRequirement') || ''),
      workpieceNo: String(getValue('workpieceNo') || ''),
      unit: String(getValue('unit') || '件'),
      unitPrice: Number(getValue('unitPrice') || 0),
      stock: Number(getValue('stock') || 0),
      warningThreshold: Number(getValue('warningThreshold') || 50),
      customerCode: customerCode.trim(),
      customerName: customerName.trim(),
      status: isForcedImport ? 'incomplete' : 'complete',
    };

    products.push(product);
  }

  return products;
}
```

转换逻辑：
1. 遍历选中的行
2. 过滤空白行（hasAnyData 检查所有12个字段）
3. 获取每个字段值（从 ParseResult 中提取 .value）
4. 客户编码/名称空值时使用默认值填充
5. 正常模式：跳过缺失必填字段的行
6. 强制导入模式：绕过必填检查，status 设为 'incomplete'
7. 默认值：unit='件', unitPrice=0, stock=0, warningThreshold=50

#### exportIssuesToExcel(state, filename) — 导出数据问题为Excel

```typescript
export function exportIssuesToExcel(
  state: ImportPreviewState,
  filename: string
): void {
  const issues = state.normalizedData.flatMap(r =>
    r._issues.map(i => ({
      行号: r._rowIndex + 2,
      字段: i.column,
      类型: i.type === 'error' ? '错误' : i.type === 'warning' ? '警告' : '提示',
      问题描述: i.message,
      原始值: i.rawValue,
      建议: i.suggestion || '',
    }))
  );

  const ws = XLSX.utils.json_to_sheet(issues);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '数据问题');
  XLSX.writeFile(wb, filename);
}
```

行号 +2 是因为 Excel 行号从 1 开始，第 1 行是表头。

#### getCellValue(row, field) — 获取单元格值

```typescript
export function getCellValue(row: NormalizedRow, field: string): ParseResult {
  const userEdit = row._userEdits?.find(e => e.field === field);
  if (userEdit) {
    return {
      value: userEdit.value,
      confidence: 1,
      raw: userEdit.value,
    };
  }
  return (row[field] as ParseResult) || { value: null, confidence: 0, raw: null };
}
```

优先返回用户编辑的值（confidence=1），否则返回解析结果。用于 UI 表格中显示单元格值。

### 26.9 SmartExcelImportDialog组件

SmartExcelImportDialog 是一个1,338行的完整交互组件，提供以下功能区块：

**文件上传区**：
- 支持拖拽上传和点击选择
- 文件格式校验（.xlsx/.xls）
- 文件大小限制提示

**列映射预览区**：
- 自动匹配结果展示（sourceColumn → targetField）
- 置信度颜色编码：绿色(auto)、黄色(confirm)、红色(reject)
- 手动调整下拉框（可重新选择目标字段）
- 样例值展示（前5个）

**数据质量报告面板**：
- 总体评分进度条（0-100%）
- 有效/警告/错误行数统计
- 最常见问题列表（前20条，带影响行数）

**数据预览表格**：
- 行级错误标注（红色背景=error，黄色=warning）
- 单元格级别的 ParseResult 展示
- 用户编辑追踪（标记修改过的单元格）
- 行选择复选框（默认选中非error行）
- 强制导入勾选（允许导入error行，标记为incomplete）

**底部操作栏**：
- 全选/取消全选
- 强制导入选中行
- 导出问题报告为Excel
- 确认导入（调用convertToProducts）

### 26.10 完整导入流程示例

以一个典型Excel文件为例，展示完整处理过程：

**输入Excel**：

| 编号 | 产品名称 | 材质/工艺 | 单价 | 数量 | 客户 |
|------|---------|----------|------|------|------|
| P001 | 齿轮 | 45#/调质 | 25元 | 100 | 甲公司 |
| P002 | 轴套 | 20Cr/淬火+回火 | ￥30 | 200 | 乙公司 |

**Step 1 - 列匹配结果**：

| 源列 | 目标字段 | 置信度 | 建议 |
|------|---------|--------|------|
| 编号 | code | 1.0 | auto |
| 产品名称 | name | 1.0 | auto |
| 材质/工艺 | composite[material+process] | 0.65 | confirm |
| 单价 | unitPrice | 0.92 | auto |
| 数量 | stock | 0.85 | auto |
| 客户 | customerName | 0.80 | confirm |

**Step 2 - 复合字段拆分**：

"45#/调质" → material: 45# (confidence 1.0, exact match), process: 调质 (confidence 1.0, exact match)

"20Cr/淬火+回火" → material: 20Cr (confidence 1.0, exact match), process: 淬火+回火 (confidence 0.81, fuzzy match)

**Step 3 - 数据标准化**：

"25元" → unitPrice: 25 (confidence 0.92, format: standard)
"￥30" → unitPrice: 30 (confidence 0.92, format: standard)

**Step 4 - 质量报告**：

- 总行数: 2
- 有效行: 2
- 警告行: 0
- 错误行: 0
- 总体评分: 1.0

**Step 5 - 产品对象输出**：

```json
[
  {
    "code": "P001",
    "name": "齿轮",
    "material": "45#",
    "process": "调质",
    "unitPrice": 25,
    "stock": 100,
    "customerName": "甲公司",
    "unit": "件",
    "warningThreshold": 50,
    "status": "complete"
  },
  {
    "code": "P002",
    "name": "轴套",
    "material": "20Cr",
    "process": "淬火+回火",
    "unitPrice": 30,
    "stock": 200,
    "customerName": "乙公司",
    "unit": "件",
    "warningThreshold": 50,
    "status": "complete"
  }
]
```


---

## 第27章 语音录入与AI识别系统

### 27.1 系统架构与文件结构

语音录入系统是热处理收发货管理系统的现场作业辅助能力，支持通过语音快速录入产品信息，减少键盘输入操作。

| 层 | 文件路径 | 行数 | 职责 |
|----|---------|------|------|
| 前端组件 | `client/src/components/VoiceInput/VoiceInputButton.tsx` | 220 | Web Speech API集成，录音按钮，实时转写 |
| 前端组件 | `client/src/components/VoiceInput/VoiceInputPanel.tsx` | 265 | 语音录入面板，AI解析结果展示与编辑 |
| 前端组件 | `client/src/components/VoiceInput/AIRecognitionDialog.tsx` | 439 | AI多模态识别对话框（文本/图片） |
| 前端API | `client/src/api/index.ts` | ~10 | parseVoiceInput函数封装 |
| 后端服务 | `server/modules/voice/voice.service.ts` | 182 | AI插件调用，语音文本解析为结构化数据 |
| 后端控制器 | `server/modules/voice/voice.controller.ts` | 17 | POST /api/voice/parse 路由 |
| 后端模块 | `server/modules/voice/voice.module.ts` | — | NestJS模块注册 |

系统完整流程：

```
用户点击麦克风按钮
    │
    ▼
VoiceInputButton 启动录音
    │  ├── 创建 SpeechRecognition 实例
    │  ├── 配置: lang='zh-CN', continuous=true, interimResults=true
    │  └── onresult 回调实时更新转写文本
    │
    ▼
获取 finalTranscript（完整转写文本）
    │
    ▼
VoiceInputPanel 调用 parseVoiceInput(text, 'inbound')
    │
    ▼
POST /api/voice/parse { text, context }
    │
    ▼
VoiceService.parseVoiceInput(dto)
    │  ├── 空值检查
    │  ├── buildParsePrompt(text, context) 构建 AI Prompt
    │  ├── callAIForParsing(prompt) 调用 AI 插件
    │  │    ├── capabilityService.load('intelligent_writing_quick_quality_1')
    │  │    ├── .call('textGenerate', { prompt })
    │  │    ├── 获取返回的 content
    │  │    ├── 正则匹配 JSON: content.match(/\{[\s\S]*\}/)
    │  │    ├── JSON.parse 解析
    │  │    └── parseNumber 转换数字字段
    │  └── 返回 { success: true, data: result, rawText: text }
    │
    ▼
前端接收解析结果
    │  ├── 成功: setParseResult + setEditedData + toast.success
    │  └── 失败: toast.error(result.error)
    │
    ▼
VoiceInputPanel 展示可编辑表单（8字段）
    │  ├── 用户核对/修改 AI 解析结果
    │  └── 必填字段校验（productName/unit/unitPrice）
    │
    ▼
用户点击"应用" → handleApply()
    │  ├── 验证必填字段
    │  ├── 调用 onApply(editedData)
    │  └── toast.success('已应用语音录入数据')
    │
    ▼
父组件接收数据，应用到表单
```

### 27.2 VoiceInputButton组件（220行）

#### Web Speech API TypeScript接口定义

组件在文件顶部定义了完整的 Web Speech API 类型声明，因为 TypeScript 默认不包含这些类型：

```typescript
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
```

全局声明：

```typescript
declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition };
    webkitSpeechRecognition?: { new (): SpeechRecognition };
  }
}
```

#### Props接口

```typescript
interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}
```

#### 状态管理

```typescript
const [isRecording, setIsRecording] = useState<boolean>(false);
const [isProcessing, setIsProcessing] = useState<boolean>(false);
const [interimText, setInterimText] = useState<string>('');
const recognitionRef = useRef<SpeechRecognition | null>(null);
```

- `isRecording`：控制按钮样式（录音中→destructive红色 + 脉冲动画）
- `isProcessing`：控制按钮图标（处理中→Loader2旋转动画）
- `interimText`：实时转写的临时文本，显示在按钮右侧气泡中
- `recognitionRef`：SpeechRecognition 实例引用，用于手动停止

#### 录音启动逻辑（startRecording）

```typescript
const startRecording = useCallback(() => {
  const SpeechRecognitionClass =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    onError?.('当前浏览器不支持语音识别，请使用Chrome浏览器');
    return;
  }

  const recognition = new SpeechRecognitionClass();
  recognition.lang = 'zh-CN';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    setIsRecording(true);
    setInterimText('');
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    setInterimText(interimTranscript);

    if (finalTranscript) {
      setIsProcessing(true);
      recognition.stop();
      onResult(finalTranscript);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    const errorMessages: Record<string, string> = {
      'no-speech': '未检测到语音，请重试',
      'audio-capture': '无法访问麦克风，请检查设备',
      'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许访问',
      'network': '网络错误，请检查网络连接',
      'aborted': '识别已取消',
    };
    const errorMsg = errorMessages[event.error] || `识别错误: ${event.error}`;
    onError?.(errorMsg);
    toast.error(errorMsg);
  };

  recognition.onend = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setInterimText('');
  };

  recognitionRef.current = recognition;
  recognition.start();
}, [onResult, onError]);
```

核心逻辑说明：

1. **浏览器支持检测**：优先使用 `window.SpeechRecognition`，回退到 `window.webkitSpeechRecognition`（Chrome前缀）
2. **配置项**：
   - `lang='zh-CN'`：中文识别
   - `continuous=true`：持续识别模式，用户可以说话多句
   - `interimResults=true`：返回中间结果，实现实时转写
   - `maxAlternatives=1`：只返回最佳识别结果
3. **onresult 处理**：
   - 从 `event.resultIndex` 开始遍历（跳过已处理的结果）
   - `isFinal=true` 的结果追加到 `finalTranscript`
   - `isFinal=false` 的结果追加到 `interimTranscript`（实时显示）
   - 有 `finalTranscript` 时：设置处理中状态 → 停止识别 → 调用 `onResult` 回调
4. **错误处理**：6种错误类型映射为中文提示，同时调用 `onError` 回调和 `toast.error`
5. **onend 清理**：重置所有状态

#### 停止录音逻辑（stopRecording）

```typescript
const stopRecording = useCallback(() => {
  recognitionRef.current?.stop();
}, []);
```

手动停止录音，触发 `onend` 回调清理状态。

#### UI渲染

```tsx
<div className="relative inline-flex">
  <Button
    type="button"
    variant={isRecording ? 'destructive' : 'outline'}
    size="icon"
    onClick={isRecording ? stopRecording : startRecording}
    disabled={disabled || isProcessing}
    className={cn(
      'relative transition-all',
      isRecording && 'animate-pulse ring-2 ring-destructive ring-offset-2'
    )}
  >
    {isProcessing ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : isRecording ? (
      <Square className="h-4 w-4" />
    ) : (
      <Mic className="h-4 w-4" />
    )}
  </Button>

  {/* 波纹动画 */}
  {isRecording && (
    <>
      <span className="absolute inset-0 animate-ping rounded-md bg-destructive/20" />
      <span
        className="absolute inset-0 animate-ping rounded-md bg-destructive/10"
        style={{ animationDelay: '200ms' }}
      />
    </>
  )}

  {/* 实时转写气泡 */}
  {interimText && (
    <div className="absolute left-full ml-2 top-0 max-w-xs whitespace-normal rounded-md bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground">{interimText}</p>
      <span className="inline-block h-3 w-0.5 animate-pulse bg-primary ml-1" />
    </div>
  )}
</div>
```

UI元素说明：

| 状态 | 按钮变体 | 图标 | 附加样式 |
|------|---------|------|---------|
| 空闲 | outline | Mic（麦克风） | 无 |
| 录音中 | destructive | Square（停止） | animate-pulse + ring-2 ring-offset-2 |
| 处理中 | outline（disabled） | Loader2（旋转动画） | disabled 状态 |

波纹效果：两层 `animate-ping` 圆形扩散，第二层延迟 200ms，营造声波扩散感。

实时转写气泡：绝对定位在按钮右侧，`bg-popover` 背景，带闪烁光标（`animate-pulse` 的竖线）。

### 27.3 VoiceInputPanel组件（265行）

#### Props接口

```typescript
interface VoiceInputPanelProps {
  onApply: (data: NonNullable<VoiceParseResult['data']>) => void;
  onCancel: () => void;
}
```

#### 状态管理

```typescript
const [isParsing, setIsParsing] = useState<boolean>(false);
const [parseResult, setParseResult] = useState<VoiceParseResult | null>(null);
const [editedData, setEditedData] = useState<ParsedVoiceResult['data']>({});
```

#### 核心流程

**handleVoiceResult(text)** — 接收语音文本并解析：

```typescript
const handleVoiceResult = useCallback(async (text: string) => {
  setIsParsing(true);
  try {
    const result = await parseVoiceInput(text, 'inbound');
    if (result.success && result.data) {
      setParseResult(result);
      setEditedData(result.data);
      toast.success('语音识别成功，请核对信息');
    } else {
      setParseResult(result);
      toast.error(result.error || '语音解析失败');
    }
  } catch (error) {
    logger.error('Voice parsing error:', error);
    toast.error('语音解析服务异常，请稍后重试');
  } finally {
    setIsParsing(false);
  }
}, []);
```

**handleApply()** — 应用数据到父组件表单：

```typescript
const handleApply = () => {
  if (!editedData) return;

  const missingFields: string[] = [];
  if (!editedData.productName?.trim()) missingFields.push('产品名称');
  if (!editedData.unit?.trim()) missingFields.push('计价单位');
  if (editedData.unitPrice === undefined || editedData.unitPrice === null) {
    missingFields.push('单价');
  }

  if (missingFields.length > 0) {
    toast.error(`请填写必填字段: ${missingFields.join('、')}`);
    return;
  }

  onApply(editedData);
  toast.success('已应用语音录入数据');
};
```

**handleFieldChange(field, value)** — 更新单个字段：

```typescript
const handleFieldChange = (field: keyof NonNullable<VoiceParseResult['data']>, value: string | number) => {
  setEditedData(prev => ({ ...prev, [field]: value }));
};
```

#### 示例话术

```typescript
const exampleScripts = [
  '入库齿轮一百个，单价二十五元，计价单位是件，重量五十公斤，材质四十五号钢',
  '来货轴套两百件，单价三十元一件，三十公斤，淬火处理',
  '轴承五十个，单价五十元一个，材质不锈钢，加急',
];
```

用户点击示例话术可直接触发解析流程（调用 `handleVoiceResult(script)`），方便测试和演示。

#### UI结构（4种状态）

**1. 初始状态**（!parseResult && !isParsing）：

```tsx
<div className="flex flex-col items-center justify-center py-8 space-y-4">
  <div className="scale-150">
    <VoiceInputButton onResult={handleVoiceResult} onError={handleError} />
  </div>
  <p className="text-sm text-muted-foreground">点击麦克风按钮，说出产品信息</p>
  <div className="space-y-2">
    <p className="text-xs text-muted-foreground">示例话术（点击可直接解析）:</p>
    {exampleScripts.map((script, index) => (
      <button
        key={index}
        onClick={() => handleVoiceResult(script)}
        className="block w-full text-left text-xs text-blue-600 hover:underline"
      >
        "{script}"
      </button>
    ))}
  </div>
</div>
```

**2. 解析中**（isParsing）：

```tsx
<div className="flex flex-col items-center justify-center py-8 space-y-4">
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
  <p className="text-sm text-muted-foreground">正在解析语音内容...</p>
</div>
```

**3. 解析成功**（parseResult.success && !isParsing）：

```tsx
<div className="space-y-4">
  {/* 原始语音文本 */}
  <div className="rounded-md bg-muted/50 p-3">
    <p className="text-xs text-muted-foreground mb-1">语音原文:</p>
    <p className="text-sm">{parseResult.rawText}</p>
  </div>

  {/* 可编辑表单 */}
  <div className="grid grid-cols-2 gap-3">
    <FormField label="产品名称" required error={!editedData.productName?.trim()}>
      <Input value={editedData.productName || ''} onChange={e => handleFieldChange('productName', e.target.value)} />
    </FormField>
    <FormField label="数量">
      <Input type="number" value={editedData.quantity ?? ''} onChange={e => handleFieldChange('quantity', parseFloat(e.target.value))} />
    </FormField>
    <FormField label="重量(kg)">
      <Input type="number" value={editedData.weight ?? ''} onChange={e => handleFieldChange('weight', parseFloat(e.target.value))} />
    </FormField>
    <FormField label="计价单位" required error={!editedData.unit?.trim()}>
      <Input value={editedData.unit || ''} onChange={e => handleFieldChange('unit', e.target.value)} />
    </FormField>
    <FormField label="单价(元)" required error={editedData.unitPrice === undefined || editedData.unitPrice === null}>
      <Input type="number" value={editedData.unitPrice ?? ''} onChange={e => handleFieldChange('unitPrice', parseFloat(e.target.value))} />
    </FormField>
    <FormField label="材质">
      <Input value={editedData.material || ''} onChange={e => handleFieldChange('material', e.target.value)} />
    </FormField>
    <FormField label="工艺">
      <Input value={editedData.process || ''} onChange={e => handleFieldChange('process', e.target.value)} />
    </FormField>
    <FormField label="备注">
      <Input value={editedData.remark || ''} onChange={e => handleFieldChange('remark', e.target.value)} />
    </FormField>
  </div>

  {/* 操作按钮 */}
  <div className="flex justify-end gap-2">
    <Button variant="outline" onClick={onCancel}>取消</Button>
    <Button onClick={handleApply}>应用</Button>
  </div>
</div>
```

必填字段标记：使用 `required` prop 传递给 FormField 组件，在标签后显示红色 `*`。当字段值为空时，`error` prop 为 true，输入框边框变为 `border-destructive`。

**4. 解析失败**（!parseResult.success && !isParsing）：

```tsx
<div className="flex flex-col items-center justify-center py-8 space-y-4">
  <p className="text-sm text-destructive">{parseResult.error}</p>
  <Button variant="outline" onClick={() => setParseResult(null)}>重试</Button>
</div>
```

#### 必填字段校验

三个必填字段的校验逻辑在 `handleApply` 中执行：

| 字段 | 校验条件 | 错误提示 |
|------|---------|---------|
| productName | `!editedData.productName?.trim()` | "产品名称" |
| unit | `!editedData.unit?.trim()` | "计价单位" |
| unitPrice | `=== undefined \|\| === null` | "单价" |

校验失败时显示 toast 错误提示，不关闭面板。

### 27.4 AIRecognitionDialog组件（439行）

AIRecognitionDialog 是一个更高级的多模态识别对话框，支持文本输入和图片上传两种识别方式。

#### 核心功能

1. **文本输入识别**：用户粘贴或输入文本，调用后端AI解析
2. **图片上传识别**：用户上传产品图片，调用AI图片理解插件提取信息
3. **批量识别**：支持一次处理多个文本/图片
4. **结果编辑**：解析结果展示为可编辑表单
5. **与页面集成**：支持从InboundPage和ReconciliationPage调用

#### 对话框结构

```
AIRecognitionDialog
├── DialogHeader (标题: "AI智能识别")
├── Tab切换 (文本识别 / 图片识别)
├── Tab内容区
│   ├── 文本识别Tab
│   │   ├── Textarea (多行文本输入)
│   │   └── 识别按钮
│   └── 图片识别Tab
│       ├── DropZone (图片拖拽上传区)
│       ├── 图片预览
│       └── 识别按钮
├── 解析结果区
│   ├── 加载中状态 (Loader2旋转)
│   ├── 成功: 可编辑表单 (与VoiceInputPanel类似的8字段)
│   └── 失败: 错误信息 + 重试按钮
└── DialogFooter (取消 / 应用按钮)
```

#### 图片识别流程

1. 用户拖拽或点击上传图片
2. 前端通过 dataloom SDK 上传图片获取文件 URL
3. 调用后端 `/api/voice/parse-image` 接口
4. 后端调用 AI 图片理解插件（`image_understanding`）
5. AI 返回结构化 JSON 数据
6. 前端展示可编辑结果

### 27.5 后端VoiceService（182行）

#### 接口定义

```typescript
// shared/api.interface.ts
interface ParseVoiceInputDto {
  text: string;
  context?: 'inbound' | 'outbound' | 'inventory';
}

interface ParsedVoiceResult {
  success: boolean;
  data?: {
    productName?: string;
    quantity?: number;
    weight?: number;
    unit?: string;
    unitPrice?: number;
    material?: string;
    process?: string;
    customerName?: string;
    remark?: string;
  };
  rawText: string;
  error?: string;
}
```

#### 依赖注入

```typescript
import { Injectable } from '@nestjs/common';
import { CapabilityService } from '@lark-apaas/fullstack-nestjs-core';
import { Logger } from '@nestjs/common';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    @Inject() private readonly capabilityService: CapabilityService,
  ) {}
}
```

使用 `@lark-apaas/fullstack-nestjs-core` 的 `CapabilityService` 调用 AI 插件。AI 插件实例 ID 为 `intelligent_writing_quick_quality_1`，action key 为 `textGenerate`。

#### parseVoiceInput(dto) 方法

```typescript
async parseVoiceInput(dto: ParseVoiceInputDto): Promise<ParsedVoiceResult> {
  const { text, context = 'inbound' } = dto;

  if (!text || !text.trim()) {
    return {
      success: false,
      data: undefined,
      rawText: text || '',
      error: '输入文本为空',
    };
  }

  try {
    const prompt = this.buildParsePrompt(text, context);
    const result = await this.callAIForParsing(prompt);

    return {
      success: true,
      data: result,
      rawText: text,
    };
  } catch (error) {
    this.logger.error(`Voice parsing failed: ${JSON.stringify(error)}`);
    return {
      success: false,
      data: undefined,
      rawText: text,
      error: error instanceof Error ? error.message : '语音解析失败',
    };
  }
}
```

流程：
1. 解构参数，context 默认 'inbound'
2. 空值检查：text 为空时返回失败
3. 构建 Prompt
4. 调用 AI 解析
5. 成功返回数据，失败返回错误信息
6. 异常通过 Logger 记录完整堆栈

#### buildParsePrompt(text, context) 方法

```typescript
private buildParsePrompt(text: string, context: string): string {
  const contextDescriptions: Record<string, string> = {
    inbound: '入库登记场景',
    outbound: '出库发货场景',
    inventory: '库存管理场景',
  };

  const sceneDescription = contextDescriptions[context] || contextDescriptions.inbound;

  return `你是一个热处理收发货管理系统的语音解析助手。用户在${sceneDescription}中通过语音输入了产品信息，请将其解析为结构化数据。

原始语音文本：
"${text}"

请提取以下字段（如果未提及则设为null）：
- productName: 产品名称（必填）
- quantity: 数量
- weight: 重量(kg)
- unit: 计价单位（必填，如"件"、"个"、"kg"等）
- unitPrice: 单价(元)（必填）
- material: 材质（如"45#"、"20Cr"、"304"等）
- process: 工艺（如"淬火"、"调质"、"渗碳"等）
- customerName: 客户名称
- remark: 备注

注意事项：
1. 中文数字请转换为阿拉伯数字（如"一百"转换为"100"）
2. 必填字段如果未提及，请设为null
3. 只返回JSON格式，不要添加任何其他文字

示例输出：
{"productName":"齿轮","quantity":100,"weight":50,"unit":"件","unitPrice":25,"material":"45#","process":"调质","customerName":null,"remark":null}`;
}
```

Prompt 结构：
1. **角色设定**：热处理收发货管理系统的语音解析助手
2. **场景描述**：根据 context 参数动态设置（入库/出库/库存）
3. **原始文本**：用户语音转写的文本
4. **字段说明**：9个待提取字段，标注必填项
5. **注意事项**：中文数字转换、null处理、只返回JSON
6. **示例输出**：提供一个完整的JSON示例

#### callAIForParsing(prompt) 方法

```typescript
private async callAIForParsing(prompt: string): Promise<NonNullable<ParsedVoiceResult['data']>> {
  if (!prompt) {
    throw new Error('Prompt为空');
  }

  const response = await this.capabilityService
    .load('intelligent_writing_quick_quality_1')
    .call('textGenerate', { prompt });

  const content = response?.content;

  if (!content) {
    throw new Error('AI返回内容为空');
  }

  // 从返回内容中提取JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI返回内容不包含有效JSON');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('AI返回的JSON格式无效');
  }

  // 转换数字字段
  return {
    productName: typeof parsed.productName === 'string' ? parsed.productName : undefined,
    quantity: this.parseNumber(parsed.quantity),
    weight: this.parseNumber(parsed.weight),
    unit: typeof parsed.unit === 'string' ? parsed.unit : undefined,
    unitPrice: this.parseNumber(parsed.unitPrice),
    material: typeof parsed.material === 'string' ? parsed.material : undefined,
    process: typeof parsed.process === 'string' ? parsed.process : undefined,
    customerName: typeof parsed.customerName === 'string' ? parsed.customerName : undefined,
    remark: typeof parsed.remark === 'string' ? parsed.remark : undefined,
  };
}
```

AI调用流程：
1. 空值检查
2. 调用 `capabilityService.load('intelligent_writing_quick_quality_1')` 加载AI插件
3. 调用 `.call('textGenerate', { prompt })` 发送文本生成请求
4. 获取返回的 `response.content`
5. 使用正则 `/\{[\s\S]*\}/` 从内容中提取JSON（AI可能返回额外文字）
6. `JSON.parse` 解析JSON字符串
7. 字段类型转换：
   - 字符串字段：检查类型后赋值或设为undefined
   - 数字字段：通过 `parseNumber` 方法转换

#### parseNumber(value) 私有方法

```typescript
private parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}
```

三种处理：
- `null/undefined` → `undefined`
- `number` → 直接返回
- `string` → `parseFloat`，NaN 返回 `undefined`

### 27.6 后端控制器

```typescript
@Controller('api/voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @NeedLogin()
  @Post('parse')
  async parseVoiceInput(@Body() dto: ParseVoiceInputDto): Promise<ParsedVoiceResult> {
    return this.voiceService.parseVoiceInput(dto);
  }
}
```

- 路由：`POST /api/voice/parse`
- 鉴权：`@NeedLogin()` 需要登录
- 请求体：`ParseVoiceInputDto`（text + context）
- 响应：`ParsedVoiceResult`

### 27.7 前端API封装

```typescript
// client/src/api/index.ts
export async function parseVoiceInput(
  text: string,
  context: 'inbound' | 'outbound' | 'inventory' = 'inbound'
): Promise<VoiceParseResult> {
  return axiosForBackend
    .post('/api/voice/parse', { text, context })
    .then(r => r.data);
}
```

`VoiceParseResult` 类型与后端 `ParsedVoiceResult` 接口一致，定义在 `shared/api.interface.ts` 中。

### 27.8 语音识别完整流程图

```
┌──────────────────────────────────────────────────────────────┐
│                      用户操作层                                │
├──────────────────────────────────────────────────────────────┤
│ 1. 用户点击 VoiceInputButton 麦克风图标                         │
│ 2. 浏览器请求麦克风权限                                        │
│ 3. 用户说话（中文）                                             │
│ 4. 实时转写显示在按钮右侧气泡                                    │
│ 5. 用户停止说话，SpeechRecognition 生成 finalTranscript        │
│ 6. VoiceInputButton 调用 onResult(finalTranscript)           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    前端处理层                                   │
├──────────────────────────────────────────────────────────────┤
│ 7. VoiceInputPanel.handleVoiceResult(text)                   │
│ 8. setIsParsing(true)                                        │
│ 9. 调用 parseVoiceInput(text, 'inbound')                     │
│    → axiosForBackend.post('/api/voice/parse', { text })       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    后端处理层                                   │
├──────────────────────────────────────────────────────────────┤
│ 10. VoiceController.parseVoiceInput(dto)                     │
│ 11. VoiceService.parseVoiceInput(dto)                        │
│     ├── 空值检查                                              │
│     ├── buildParsePrompt(text, 'inbound')                    │
│     │   → 构建包含场景描述+字段说明+示例的Prompt               │
│     └── callAIForParsing(prompt)                             │
│         ├── capabilityService.load('intelligent_writing_...')│
│         ├── .call('textGenerate', { prompt })                │
│         ├── 获取 response.content                             │
│         ├── 正则提取JSON: content.match(/\{[\s\S]*\}/)      │
│         ├── JSON.parse                                        │
│         └── parseNumber 转换数字字段                            │
│ 12. 返回 { success: true, data: {...}, rawText: text }       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    结果展示层                                   │
├──────────────────────────────────────────────────────────────┤
│ 13. setParseResult(result)                                   │
│ 14. setEditedData(result.data)                               │
│ 15. toast.success('语音识别成功，请核对信息')                  │
│ 16. 展示8字段可编辑表单                                       │
│ 17. 用户核对/修改字段值                                       │
│ 18. 用户点击"应用" → handleApply()                           │
│     ├── 必填字段校验（productName/unit/unitPrice）            │
│     ├── onApply(editedData) → 父组件接收数据                  │
│     └── toast.success('已应用语音录入数据')                   │
└──────────────────────────────────────────────────────────────┘
```

### 27.9 语音命令示例与语法

#### 入库场景示例话术

| 话术 | 解析结果 |
|------|---------|
| "入库齿轮一百个，单价二十五元，计价单位是件，重量五十公斤，材质四十五号钢" | productName=齿轮, quantity=100, unitPrice=25, unit=件, weight=50, material=45# |
| "来货轴套两百件，单价三十元一件，三十公斤，淬火处理" | productName=轴套, quantity=200, unitPrice=30, unit=件, weight=30, process=淬火 |
| "轴承五十个，单价五十元一个，材质不锈钢，加急" | productName=轴承, quantity=50, unitPrice=50, unit=个, material=304, remark=加急 |
| "入库法兰盘，数量三十，每个十五元，公斤，材质20Cr，工艺渗碳" | productName=法兰盘, quantity=30, unitPrice=15, unit=kg, material=20Cr, process=渗碳 |

#### 出库场景示例话术

| 话术 | 解析结果 |
|------|---------|
| "发货齿轮五十个给甲公司" | productName=齿轮, quantity=50, customerName=甲公司 |
| "出库轴套，三十件" | productName=轴套, quantity=30, unit=件 |

#### 库存场景示例话术

| 话术 | 解析结果 |
|------|---------|
| "查询齿轮库存" | productName=齿轮 |
| "库存少于十个的有哪些" | remark=库存少于10 |

### 27.10 错误处理与边界情况

#### 错误处理清单

| 错误场景 | 处理方式 | 用户提示 |
|---------|---------|---------|
| 浏览器不支持Web Speech API | onError回调 + 不启动录音 | "当前浏览器不支持语音识别，请使用Chrome浏览器" |
| 麦克风权限被拒绝 | onerror回调(not-allowed) | "麦克风权限被拒绝，请在浏览器设置中允许访问" |
| 未检测到语音 | onerror回调(no-speech) | "未检测到语音，请重试" |
| 麦克风硬件问题 | onerror回调(audio-capture) | "无法访问麦克风，请检查设备" |
| 网络中断 | onerror回调(network) | "网络错误，请检查网络连接" |
| 用户主动取消 | onerror回调(aborted) | "识别已取消" |
| 未知错误 | onerror回调(default) | `识别错误: ${event.error}` |
| AI解析返回空内容 | callAIForParsing抛异常 | "AI返回内容为空" |
| AI返回非JSON格式 | callAIForParsing抛异常 | "AI返回内容不包含有效JSON" |
| JSON.parse失败 | callAIForParsing抛异常 | "AI返回的JSON格式无效" |
| 必填字段缺失 | handleApply校验 | "请填写必填字段: 产品名称、计价单位、单价" |
| 网络请求异常 | catch块 | "语音解析服务异常，请稍后重试" |

#### 边界情况处理

1. **空语音文本**：后端 `parseVoiceInput` 首先检查 text 是否为空，为空直接返回 `{ success: false, error: '输入文本为空' }`
2. **AI返回额外文字**：使用正则 `/\{[\s\S]*\}/` 从返回内容中提取JSON，忽略前后的说明文字
3. **数字字段为字符串**：`parseNumber` 方法处理 string 类型的数字（如 AI 返回 `"100"` 而非 `100`）
4. **字段为null**：AI 返回 null 的字段在类型转换后变为 undefined，前端表单显示为空
5. **用户编辑后重新验证**：每次 `handleFieldChange` 更新 `editedData`，`handleApply` 时重新校验必填字段
6. **录音中页面切换**：SpeechRecognition 的 `onend` 回调会重置所有状态，不会导致状态泄漏

### 27.11 性能与用户体验

#### 用户体验优化

1. **实时转写显示**：`interimResults=true` 让用户在说话时就能看到识别结果，提供即时反馈
2. **波纹动画**：录音中两层 `animate-ping` 动画，视觉化声波扩散
3. **按钮状态变化**：录音中按钮变红 + 脉冲动画，明确告知用户正在录音
4. **加载状态**：AI解析中显示 Loader2 旋转动画，避免用户以为卡死
5. **Toast提示**：成功/失败都有明确的 toast 通知
6. **可编辑表单**：AI解析结果不是最终结果，用户可以修改任何字段
7. **示例话术**：提供3条可点击的示例，方便新用户理解和测试
8. **必填字段标记**：红色 `*` 标记必填字段，空值时输入框变红


---

## 第28章 通用筛选器系统完整实现

### 28.1 系统架构

通用筛选器系统位于 `client/src/components/ui/filter.tsx`，共1,343行，是系统中最大的单文件UI组件。它提供了一个完整的筛选器组件库，支持文本、数字范围、日期范围、单选、多选等5种筛选类型。

#### 文件结构

| 组件 | 类型 | 用途 | 行数 |
|------|------|------|------|
| Filter | 根组件 | 管理筛选器状态（open/value/variant/shape/size） | ~80行 |
| FilterTrigger | 触发器 | 显示标签+值摘要+下拉箭头+关闭按钮 | ~180行 |
| FilterContent | 内容容器 | Popover内容包装器 | ~30行 |
| FilterTextContent | 文本筛选 | 单行/多行文本输入 | ~170行 |
| FilterNumberContent | 数字范围筛选 | 最小值-最大值输入 | ~240行 |
| FilterDateRangeContent | 日期范围筛选 | Calendar日历选择 | ~85行 |
| FilterSelectContent | 单选筛选 | Command搜索列表 | ~100行 |
| FilterMultiSelectContent | 多选筛选 | Command多选列表 | ~120行 |
| FilterGroup | 筛选器组 | 水平排列多个筛选器 | ~40行 |
| 工具函数+类型 | 辅助 | 格式化函数、类型定义、Context | ~298行 |

#### 组件关系图

```
FilterGroup (水平排列)
├── Filter (筛选器1)
│   ├── FilterTrigger (触发按钮)
│   └── FilterContent (弹出内容)
│       └── FilterTextContent | FilterNumberContent | FilterDateRangeContent
│           | FilterSelectContent | FilterMultiSelectContent
├── Filter (筛选器2)
│   ├── FilterTrigger
│   └── FilterContent
│       └── ...
└── Filter (筛选器N)
    ├── FilterTrigger
    └── FilterContent
        └── ...
```

### 28.2 类型定义

#### 视觉变体类型

```typescript
export type FilterVariant = 'gray' | 'outlined' | 'white';
export type FilterShape = 'rectangle' | 'rounded';
export type FilterSize = 'xs' | 'sm' | 'md';
```

| 类型 | 值 | 视觉效果 |
|------|-----|---------|
| FilterVariant | gray | 灰色背景(bg-secondary)，最常用 |
| FilterVariant | outlined | 边框样式(border border-input)，表单内使用 |
| FilterVariant | white | 白色阴影(bg-background shadow-sm)，卡片内使用 |
| FilterShape | rectangle | 直角圆角(rounded-md) |
| FilterShape | rounded | 全圆角(rounded-full)，标签风格 |
| FilterSize | xs | h-7, gap-0.5, px-2, text-xs（12px） |
| FilterSize | sm | h-8, gap-1, px-3, text-sm（14px） |
| FilterSize | md | h-9, gap-1, px-3, text-sm（14px） |

#### 数据类型

```typescript
export interface NumberRangeValue {
  min?: number;
  max?: number;
}

export interface FilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

`NumberRangeValue`：数字范围值，min和max都是可选的。仅min表示">=min"，仅max表示"<=max"，两者都有表示"min~max"。

`FilterOption`：筛选选项，value是实际值，label是显示文本，disabled控制是否可选。

#### Context类型

```typescript
interface FilterContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  variant: FilterVariant;
  shape: FilterShape;
  size: FilterSize;
  disabled: boolean;
  valueSummary?: string;
  setValueSummary: (summary: string | undefined) => void;
  value: unknown;
  setValue: (value: unknown) => void;
}
```

`valueSummary` 是触发器上显示的值摘要文本（如"100~200"、"2024-01-01 ~ 2024-12-31"、"齿轮+轴套"）。当 `valueSummary` 有值时，触发器会显示":valueSummary"并改变样式（compoundVariants 中的 hasValue=true 样式）。

泛型版本：

```typescript
interface TypedFilterContextValue<T> extends Omit<FilterContextValue, 'value' | 'setValue'> {
  value: T | undefined;
  setValue: (value: T | undefined) => void;
}
```

#### FilterContext 和 useFilter Hook

```typescript
const FilterContext = React.createContext<FilterContextValue | null>(null);

function useFilter<T = unknown>(): TypedFilterContextValue<T> {
  const context = React.useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a Filter component');
  }
  return context as TypedFilterContextValue<T>;
}
```

`useFilter` 是一个泛型 Hook，子组件通过它获取 Filter 的状态。如果不在 Filter 组件内使用，会抛出错误。

### 28.3 工具函数

#### formatNumberRangeValue(value, unit?) — 格式化数字范围

```typescript
function formatNumberRangeValue(value: NumberRangeValue, unit?: string): string {
  const parts: string[] = [];
  const unitStr = unit ? ` ${unit}` : '';

  if (value.min !== undefined && value.max !== undefined) {
    parts.push(`${value.min}~${value.max}${unitStr}`);
  } else if (value.min !== undefined) {
    parts.push(`>=${value.min}${unitStr}`);
  } else if (value.max !== undefined) {
    parts.push(`<=${value.max}${unitStr}`);
  }

  return parts.join(', ');
}
```

格式化规则：
- min + max → `"100~200 件"`
- 仅 min → `">=100 件"`
- 仅 max → `"<=200 件"`

#### formatDateRangeValue(value, formatStr?) — 格式化日期范围

```typescript
function formatDateRangeValue(value: DateRange, formatStr: string = 'yyyy-MM-dd'): string {
  const parts: string[] = [];

  if (value.from && value.to) {
    parts.push(`${format(value.from, formatStr)} ~ ${format(value.to, formatStr)}`);
  } else if (value.from) {
    parts.push(`>= ${format(value.from, formatStr)}`);
  } else if (value.to) {
    parts.push(`<= ${format(value.to, formatStr)}`);
  }

  return parts.join(', ');
}
```

使用 `date-fns/format` 函数格式化日期。格式化规则：
- from + to → `"2024-01-01 ~ 2024-12-31"`
- 仅 from → `">= 2024-01-01"`
- 仅 to → `"<= 2024-12-31"`

#### formatSelectValue(value, options) — 格式化单选值

```typescript
function formatSelectValue(value: string, options: FilterOption[]): string {
  const option = options.find(opt => opt.value === value);
  return option?.label ?? value;
}
```

从 options 中查找对应 label，找不到则返回原始 value。

#### formatMultiSelectValue(value, options, maxCount?) — 格式化多选值

```typescript
function formatMultiSelectValue(
  value: string[] | undefined,
  options: FilterOption[],
  maxCount: number = 2
): string {
  if (!value || value.length === 0) return '';

  const labels = value.map(v => {
    const option = options.find(opt => opt.value === v);
    return option?.label ?? v;
  });

  if (labels.length <= maxCount) {
    return labels.join(', ');
  }

  return `${labels.slice(0, maxCount).join(', ')} +${labels.length - maxCount}`;
}
```

格式化规则：
- 1-2个选项 → `"齿轮, 轴套"`
- 超过maxCount(默认2) → `"齿轮, 轴套 +3"`（显示前2个+剩余数量）

#### isValueEmpty(value) — 判断值是否为空

```typescript
function isValueEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const values = Object.values(value);
    return values.every(v => v === undefined || v === null);
  }
  return false;
}
```

空值判断规则：
- `undefined/null` → true
- 空字符串 `""` → true
- 空数组 `[]` → true
- 对象所有属性都为 `undefined/null` → true（如 `{min: undefined, max: undefined}`）
- 数字 `0` → false（0是有效值）

### 28.4 Filter根组件

#### FilterProps

```typescript
export interface FilterProps<T = unknown> {
  children: React.ReactNode;
  value?: T;                    // 受控值
  defaultValue?: T;             // 默认值（非受控模式）
  onValueChange?: (value: T | undefined) => void;
  open?: boolean;               // 受控打开状态
  defaultOpen?: boolean;        // 默认打开状态
  onOpenChange?: (open: boolean) => void;
  variant?: FilterVariant;      // 默认 'gray'
  shape?: FilterShape;          // 默认 'rectangle'
  size?: FilterSize;            // 默认 'sm'
  disabled?: boolean;           // 默认 false
  initialValueSummary?: string; // SSR/初始渲染时的值摘要
  asChild?: boolean;            // Radix Slot 模式
  className?: string;
}
```

#### 内部实现

```typescript
function FilterInner<T = unknown>(
  { children, value: controlledValue, defaultValue, onValueChange,
    open: controlledOpen, defaultOpen = false, onOpenChange,
    variant = 'gray', shape = 'rectangle', size = 'sm',
    disabled = false, className, initialValueSummary, asChild = false, ...props },
  ref
) {
  // open 状态管理（受控/非受控自动切换）
  const [open, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  });

  // value 状态管理（受控/非受控自动切换）
  const [value, setValue] = useControllableState<T | undefined>({
    prop: controlledValue,
    defaultProp: defaultValue,
    onChange: onValueChange,
  });

  // valueSummary 本地状态
  const [valueSummary, setValueSummary] = useState<string | undefined>(initialValueSummary);

  // Context 值（useMemo 优化）
  const contextValue = useMemo<FilterContextValue>(() => ({
    open: open ?? false,
    setOpen,
    variant, shape, size, disabled,
    valueSummary,
    setValueSummary,
    value,
    setValue: setValue as (value: unknown) => void,
  }), [open, setOpen, variant, shape, size, disabled, valueSummary, value, setValue]);

  const Comp = asChild ? Slot.Root : 'div';

  return (
    <FilterContext.Provider value={contextValue}>
      <Popover open={open} onOpenChange={setOpen}>
        <Comp ref={ref} data-slot="filter" className={cn('inline-flex', className)} {...props}>
          {children}
        </Comp>
      </Popover>
    </FilterContext.Provider>
  );
}

const Filter = React.forwardRef(FilterInner) as <T = unknown>(
  props: FilterProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;
```

关键设计：
1. **泛型组件**：`Filter<T>` 是泛型组件，T 表示筛选值的类型（如 `string`、`NumberRangeValue`、`DateRange`、`string[]`）
2. **useControllableState**：来自 Radix UI 的 Hook，自动在受控（传入 prop）和非受控（传入 defaultProp）之间切换
3. **Popover 包裹**：Filter 根组件内部包裹了 Radix Popover，所有子组件共享 Popover 的 open 状态
4. **asChild 支持**：使用 Radix Slot，允许 Filter 渲染为自定义元素
5. **forwardRef + 泛型**：使用类型断言将 forwardRef 组件转换为泛型组件

### 28.5 FilterTrigger组件

#### filterTriggerVariants (cva配置)

```typescript
const filterTriggerVariants = cva(
  // 基础样式
  "group inline-flex items-center justify-between gap-1 whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        gray: 'bg-secondary text-foreground hover:bg-secondary/80 data-[state=open]:bg-primary/10 data-[state=open]:text-primary',
        outlined: 'border border-input bg-background hover:border-primary/50 hover:bg-accent/50 data-[state=open]:border-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary',
        white: 'bg-background text-foreground shadow-sm hover:bg-accent/50 data-[state=open]:bg-primary/10 data-[state=open]:text-primary',
      },
      shape: {
        rectangle: 'rounded-md',
        rounded: 'rounded-full',
      },
      size: {
        xs: 'h-7 gap-0.5 px-2 text-xs',
        sm: 'h-8 gap-1 px-3 text-sm',
        md: 'h-9 gap-1 px-3 text-sm',
      },
      hasValue: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // gray + hasValue 的额外样式
      { variant: 'gray', hasValue: true,
        className: 'bg-primary/10 text-blue-900 hover:bg-primary/15 dark:text-blue-200' },
      // outlined + hasValue 的额外样式
      { variant: 'outlined', hasValue: true,
        className: 'border-primary/30 bg-primary/5 text-blue-900 hover:border-primary/50 hover:bg-primary/10 dark:text-blue-200' },
      // white + hasValue 的额外样式
      { variant: 'white', hasValue: true,
        className: 'bg-primary/5 text-blue-900 dark:text-blue-200' },
    ],
    defaultVariants: {
      variant: 'gray', shape: 'rectangle', size: 'sm', hasValue: false,
    },
  }
);
```

compoundVariants 说明：当筛选器有值时（hasValue=true），三种 variant 都会添加蓝色调样式，让用户一眼看出哪些筛选器处于激活状态。

#### FilterTriggerProps

```typescript
export interface FilterTriggerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;                  // 标签文本（必填）
  icon?: React.ReactNode;         // 自定义图标
  hideChevron?: boolean;          // 隐藏下拉箭头，默认false
  asChild?: boolean;              // Slot模式
  children?: React.ReactNode;     // asChild时的自定义内容
  closable?: boolean;             // 显示关闭按钮
  onClose?: () => void;           // 关闭按钮回调
}
```

#### UI渲染逻辑

```tsx
const FilterTrigger = React.forwardRef<HTMLButtonElement, FilterTriggerProps>(
  ({ className, label, icon, hideChevron = false, asChild = false,
     children, closable, onClose, ...props }, ref) => {
    const { open, variant, shape, size, disabled, valueSummary, setValueSummary, setValue } = useFilter();
    const hasValue = !!valueSummary;

    // 关闭按钮点击：清空值
    const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setValue(undefined);
      setValueSummary(undefined);
      onClose?.();
    };

    const triggerContent = (
      <>
        {/* 左侧：图标 + 标签 + 值摘要 */}
        <span className="flex items-center gap-1">
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{label}</span>
          {hasValue && (
            <>
              <span className="opacity-60">:</span>
              <span className="max-w-32 truncate">{valueSummary}</span>
            </>
          )}
        </span>

        {/* 右侧：下拉箭头 + 关闭按钮 */}
        <span className="flex items-center">
          {!hideChevron && (
            <ChevronDown className={cn(
              'opacity-60 transition-transform duration-200',
              open && 'rotate-180'
            )} />
          )}
          {hasValue && closable && !disabled && (
            <>
              <span data-slot="filter-divider"
                className="mx-1 h-3.5 w-px bg-current opacity-20" />
              <button type="button" tabIndex={0}
                onClick={handleCloseClick} aria-label="Close"
                className="inline-flex size-3.5 cursor-pointer items-center justify-center rounded-sm transition-colors hover:bg-foreground/10 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <X className="size-3" />
              </button>
            </>
          )}
        </span>
      </>
    );

    const Comp = asChild ? Slot.Root : 'button';

    return (
      <PopoverTrigger asChild disabled={disabled}>
        <Comp ref={ref} type={asChild ? undefined : 'button'}
          data-slot="filter-trigger"
          data-state={open ? 'open' : 'closed'}
          aria-expanded={open} aria-haspopup="dialog"
          disabled={disabled}
          className={cn(filterTriggerVariants({ variant, shape, size, hasValue }), className)}
          {...props}>
          {asChild && children ? children : triggerContent}
        </Comp>
      </PopoverTrigger>
    );
  }
);
```

UI元素说明：

| 元素 | 位置 | 样式 | 行为 |
|------|------|------|------|
| icon | 左侧 | shrink-0 | 自定义图标 |
| label | 左侧 | — | 标签文本 |
| ":" + valueSummary | 左侧 | opacity-60 + max-w-32 truncate | 有值时显示，超长截断 |
| ChevronDown | 右侧 | opacity-60 + rotate-180(open时) | 下拉箭头，展开时旋转 |
| 分隔线 | 右侧 | h-3.5 w-px bg-current opacity-20 | 竖线分隔箭头和关闭按钮 |
| X 关闭按钮 | 右侧 | size-3.5 rounded-sm hover:bg-foreground/10 | 清空筛选值 |

关闭按钮的 `handleCloseClick` 做了三件事：
1. `stopPropagation + preventDefault` 阻止事件冒泡到 PopoverTrigger
2. `setValue(undefined)` 清空 Filter 的值
3. `setValueSummary(undefined)` 清空值摘要
4. 调用 `onClose?.()` 回调

### 28.6 FilterContent组件

```typescript
const FilterContent = React.forwardRef<HTMLDivElement, FilterContentProps>(
  ({ className, align = 'start', sideOffset = 4, children, asChild, ...props }, ref) => {
    useFilter();  // 确保在 Filter 内使用
    return (
      <PopoverContent ref={ref} align={align} sideOffset={sideOffset}
        data-slot="filter-content"
        className={cn('w-auto p-0', className)}
        asChild={asChild} {...props}>
        {children}
      </PopoverContent>
    );
  }
);
```

PopoverContent 的包装器。默认 `align='start'`（左对齐），`sideOffset=4`（距触发器4px）。宽度默认 `w-auto`（自适应内容），padding为0（由Content子组件自己管理padding）。

### 28.7 FilterTextContent组件（文本筛选）

#### Props

```typescript
export interface FilterTextContentProps {
  value?: string;              // @deprecated 使用Filter的value代替
  defaultValue?: string;       // @deprecated
  onValueChange?: (value: string | undefined) => void;  // @deprecated
  placeholder?: string;       // 默认 '请输入'
  maxLength?: number;
  multiline?: boolean;         // 默认 false
  name?: string;
  className?: string;
}
```

#### 双模式支持（Legacy + Context）

所有 Content 子组件都支持两种使用模式：

```typescript
// Legacy模式检测
const isLegacyMode =
  legacyValue !== undefined ||
  legacyDefaultValue !== undefined ||
  legacyOnValueChange !== undefined;

// Legacy模式：独立管理状态
const [legacyInternalValue, setLegacyInternalValue] = useControllableState({
  prop: legacyValue,
  defaultProp: legacyDefaultValue,
  onChange: legacyOnValueChange,
});

// 根据模式选择值源
const value = isLegacyMode ? legacyInternalValue : contextValue;
const setValue = isLegacyMode ? setLegacyInternalValue : setContextValue;
```

Legacy模式允许直接在 Content 组件上传入 value/onValueChange（向后兼容）。推荐使用 Context 模式（在 Filter 根组件上传入 value/onValueChange）。

#### 交互逻辑

```typescript
// inputValue 本地状态，与 value 同步
const [inputValue, setInputValue] = useState(value || '');

// 自动聚焦
useEffect(() => {
  const timer = setTimeout(() => {
    if (multiline) {
      textareaRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, 0);
  return () => clearTimeout(timer);
}, [multiline]);

// 值摘要更新
useEffect(() => {
  const summary = isValueEmpty(value) ? undefined : value;
  setValueSummary(summary);
}, [value, setValueSummary]);

// 提交值
const commitValue = () => {
  const trimmedValue = inputValue.trim();
  setValue(trimmedValue || undefined);  // 空字符串设为undefined
};

// 清空
const handleClear = () => {
  setValue(undefined);
  setInputValue('');
};

// 键盘处理
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !multiline) {
    e.preventDefault();
    commitValue();
    setOpen(false);  // 关闭Popover
  } else if (e.key === 'Escape') {
    e.preventDefault();
    setInputValue(value || '');  // 恢复原值
    setOpen(false);
  }
};

// 失焦提交
const handleBlur = () => {
  commitValue();
};
```

交互行为：
- **Enter**：提交值 + 关闭Popover（仅单行模式）
- **Escape**：恢复原值 + 关闭Popover
- **Blur**：提交值（不关闭Popover）
- **清除按钮**：清空值 + 聚焦输入框

#### UI（两种模式）

**单行模式**（multiline=false）：

```tsx
<div data-slot="filter-text-input"
  className="flex h-8 min-w-56 items-center gap-2 rounded-md border border-input bg-background px-3 shadow-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
  <input ref={inputRef} type="text" value={inputValue}
    onChange={e => setInputValue(e.target.value)}
    onKeyDown={handleKeyDown} onBlur={handleBlur}
    placeholder={placeholder} maxLength={maxLength}
    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
  {inputValue && (
    <button type="button" onClick={handleClearClick}
      className="flex size-3.5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <X className="size-3" />
    </button>
  )}
</div>
```

**多行模式**（multiline=true）：

```tsx
<div className="flex flex-col gap-2 p-3">
  <Textarea ref={textareaRef} value={inputValue}
    onChange={e => setInputValue(e.target.value)} onBlur={handleBlur}
    onKeyDown={e => { if (e.key === 'Escape') { ... } }}
    placeholder={placeholder} maxLength={maxLength} rows={3}
    className="min-w-56 resize-none" />
  {maxLength && (
    <p className="text-xs text-muted-foreground">{inputValue.length}/{maxLength}</p>
  )}
</div>
```

### 28.8 FilterNumberContent组件（数字范围筛选）

#### Props

```typescript
export interface FilterNumberContentProps {
  value?: NumberRangeValue;       // @deprecated
  defaultValue?: NumberRangeValue;
  onValueChange?: (value: NumberRangeValue | undefined) => void;
  min?: number;                   // 允许的最小值
  max?: number;                   // 允许的最大值
  step?: number;                  // 步进值，默认1
  precision?: number;             // 小数精度（toFixed位数）
  unit?: string;                   // 单位标签（如"件"/"kg"）
  minPlaceholder?: string;        // 默认 '最小值'
  maxPlaceholder?: string;        // 默认 '最大值'
  invalidRangeMessage?: string;   // 默认 '最小值不能大于最大值'
  className?: string;
}
```

#### 交互逻辑

```typescript
// 数字解析
const parseNumber = (str: string): number | undefined => {
  if (str === '') return undefined;
  const num = parseFloat(str);
  if (isNaN(num)) return undefined;
  if (precision !== undefined) {
    return parseFloat(num.toFixed(precision));
  }
  return num;
};

// 范围验证
const isRangeInvalid = useMemo(() => {
  const minNum = parseNumber(minValue);
  const maxNum = parseNumber(maxValue);
  if (minNum !== undefined && maxNum !== undefined) {
    return minNum > maxNum;
  }
  return false;
}, [minValue, maxValue]);

// 提交值
const commitValue = () => {
  if (isRangeInvalid) return;  // 无效范围不提交
  const minNum = parseNumber(minValue);
  const maxNum = parseNumber(maxValue);
  if (minNum === undefined && maxNum === undefined) {
    setValue(undefined);
  } else {
    setValue({ min: minNum, max: maxNum });
  }
};
```

#### UI

```tsx
<div data-slot="filter-number-input"
  data-invalid={isRangeInvalid || undefined}
  className={cn(
    'flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 shadow-sm',
    'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20',
    isRangeInvalid && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
  )}>
  <input ref={minInputRef} type="number" value={minValue}
    onChange={e => setMinValue(e.target.value)}
    onKeyDown={handleKeyDown} onBlur={handleBlur}
    placeholder={minPlaceholder} min={min} max={max} step={step}
    className="w-20 flex-1 [appearance:textfield] bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
  {hasInputValue && <ClearButton />}
  <span className="shrink-0 text-sm text-muted-foreground">-</span>
  <input type="number" value={maxValue}
    onChange={e => setMaxValue(e.target.value)}
    onKeyDown={handleKeyDown} onBlur={handleBlur}
    placeholder={maxPlaceholder} min={min} max={max} step={step}
    className="w-20 flex-1 [appearance:textfield] bg-transparent text-sm outline-none placeholder:text-muted-foreground ..." />
  {unit && <span className="shrink-0 text-sm text-muted-foreground">{unit}</span>}
</div>
{isRangeInvalid && (
  <p className="mt-1.5 text-xs text-destructive" role="alert">{invalidRangeMessage}</p>
)}
```

UI特点：
- 两个 number input 并排，中间用 "-" 分隔
- 清除按钮在有输入值时显示在两个input之间
- unit 标签在末尾显示
- 无效范围时整个容器边框变红 + 显示错误提示
- 隐藏了 number input 的 spinner（`[appearance:textfield]` + `appearance-none`）

### 28.9 FilterDateRangeContent组件（日期范围筛选）

#### Props

```typescript
export interface FilterDateRangeContentProps {
  value?: DateRange;       // @deprecated
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange | undefined) => void;
  format?: string;         // 默认 'yyyy-MM-dd'
  minDate?: Date;
  maxDate?: Date;
  numberOfMonths?: number; // 默认 1
  className?: string;
}
```

#### 交互逻辑

```typescript
const handleSelect = (range: DateRange | undefined) => {
  setValue(range);
  // Popover 在点击外部时关闭，不在选择日期时关闭
};

// 禁用日期
const disabledDates: Matcher[] = [];
if (minDate) disabledDates.push({ before: minDate });
if (maxDate) disabledDates.push({ after: maxDate });
```

与文本/数字筛选不同，日期选择不会自动关闭 Popover，用户可以继续调整选择范围。Popover 在点击外部时才关闭。

#### UI

使用 shadcn Calendar 组件（基于 react-day-picker）：

```tsx
<Calendar mode="range"
  selected={value ? { from: value.from, to: value.to } : undefined}
  onSelect={handleSelect}
  defaultMonth={value?.from}
  numberOfMonths={numberOfMonths}
  disabled={disabledDates.length > 0 ? disabledDates : undefined}
  initialFocus
  className={cn(
    '[&_td_button[data-range-end=true]]:hover:bg-primary/90 ...'
  )}
/>
```

自定义了 range 端点（开始/结束日期）的 hover 样式。

### 28.10 FilterSelectContent组件（单选筛选）

#### Props

```typescript
export interface FilterSelectContentProps {
  value?: string;       // @deprecated
  defaultValue?: string;
  onValueChange?: (value: string | undefined) => void;
  options: FilterOption[];
  searchable?: boolean;           // 默认 true
  searchPlaceholder?: string;     // 默认 'Search...'
  emptyText?: string;            // 默认 'No results found.'
  className?: string;
}
```

#### 交互逻辑

```typescript
const handleSelect = (selectedValue: string) => {
  if (value === selectedValue) {
    // 再次点击已选中项 → 取消选择
    setValue(undefined);
  } else {
    setValue(selectedValue);
  }
  setOpen(false);  // 选择后关闭Popover
};
```

单选行为：点击选项立即选中并关闭Popover。再次点击已选中项则取消选择。

#### UI

使用 shadcn Command 组件（基于 cmdk）：

```tsx
<div data-slot="filter-select-content" className={cn('w-52', className)}>
  <Command>
    {searchable && <CommandInput placeholder={searchPlaceholder} className="h-9" />}
    <CommandList>
      <CommandEmpty>{emptyText}</CommandEmpty>
      <CommandGroup>
        {options.map(option => (
          <CommandItem key={option.value} value={option.value}
            disabled={option.disabled}
            onSelect={() => handleSelect(option.value)}
            className="cursor-pointer justify-between">
            {option.label}
            <CheckIcon className={cn('h-4 w-4 text-primary',
              value === option.value ? 'opacity-100' : 'opacity-0')} />
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  </Command>
</div>
```

UI特点：
- 宽度固定 w-52（208px）
- 可选搜索框（CommandInput），支持模糊搜索
- 选项列表带空状态提示
- 选中项显示 CheckIcon（未选中项 opacity-0 保留布局）
- 搜索使用 cmdk 的内置模糊匹配

### 28.11 FilterMultiSelectContent组件（多选筛选）

#### Props

```typescript
export interface FilterMultiSelectContentProps {
  value?: string[];       // @deprecated
  defaultValue?: string[];
  onValueChange?: (value: string[] | undefined) => void;
  options: FilterOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  maxCount?: number;     // 摘要显示的最大数量
  className?: string;
}
```

#### 交互逻辑

```typescript
const selectedValues = value || [];

const handleSelect = (selectedValue: string) => {
  // 切换选中状态
  const newValues = selectedValues.includes(selectedValue)
    ? selectedValues.filter(v => v !== selectedValue)  // 取消选中
    : [...selectedValues, selectedValue];                // 添加选中

  // 全空时设为undefined
  setValue(newValues.length > 0 ? newValues : undefined);
};

// 值摘要
useEffect(() => {
  const summary = isValueEmpty(value) || selectedValues.length === 0
    ? undefined
    : formatMultiSelectValue(value, options, maxCount);
  setValueSummary(summary);
}, [value, selectedValues.length, options, maxCount, setValueSummary]);
```

多选行为：点击选项切换选中/取消。与单选不同，多选不自动关闭 Popover，用户可以连续选择多个选项。全部取消时 value 设为 undefined。

#### UI

与 FilterSelectContent 类似，但不自动关闭 Popover：

```tsx
<CommandItem key={option.value} value={option.value}
  disabled={option.disabled}
  onSelect={() => handleSelect(option.value)}
  className="cursor-pointer justify-between">
  {option.label}
  <CheckIcon className={cn('h-4 w-4 text-primary',
    isSelected ? 'opacity-100' : 'opacity-0')} />
</CommandItem>
```

### 28.12 FilterGroup组件

#### filterGroupVariants (cva)

```typescript
const filterGroupVariants = cva('flex flex-wrap items-center', {
  variants: {
    gap: { sm: 'gap-1', md: 'gap-2', lg: 'gap-3' },
  },
  defaultVariants: { gap: 'md' },
});
```

#### Props和实现

```typescript
export interface FilterGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';  // 默认 'md'
  asChild?: boolean;
}

const FilterGroup = React.forwardRef<HTMLDivElement, FilterGroupProps>(
  ({ children, className, gap = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'div';
    return (
      <Comp ref={ref} data-slot="filter-group"
        className={cn(filterGroupVariants({ gap }), className)}
        {...props}>
        {children}
      </Comp>
    );
  }
);
```

用于水平排列多个 Filter 组件。支持 `flex-wrap` 自动换行，当筛选器过多时自动换到下一行。

### 28.13 StatusFilter业务组件（91行）

StatusFilter 是基于筛选器系统的业务封装组件，用于单据状态筛选。

#### 实现方式

基于 shadcn Select + Badge 组件实现，而非直接使用 Filter 系统。提供三个状态选项：

| 选项 | 值 | Badge颜色 |
|------|-----|-----------|
| 全部 | all | 灰色(bg-muted) |
| 正常 | active | 绿色(bg-success/10 text-success) |
| 已撤销 | cancelled | 红色(bg-error/10 text-error) |

```typescript
interface StatusFilterProps {
  value: 'all' | 'active' | 'cancelled';
  onChange: (value: 'all' | 'active' | 'cancelled') => void;
  counts?: { all: number; active: number; cancelled: number };
}
```

可选的 `counts` prop 在每个选项后显示数量 Badge，如"正常 (42)"。

### 28.14 EditableSelect组件（165行）

EditableSelect 是一个可编辑的下拉选择器，支持自由输入和从建议列表中选择。

#### Props

```typescript
interface EditableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  allowCreate?: boolean;    // 是否允许创建新值，默认true
  className?: string;
}
```

#### 实现

基于 Popover + Command 组件实现：

1. **输入框**：用户可以自由输入文本
2. **建议列表**：输入时实时过滤 options 显示匹配项
3. **创建新值**：当输入的值不在 options 中且 allowCreate=true 时，显示"创建: XXX"选项
4. **选中/输入**：点击建议项或按 Enter 确认值

#### 交互流程

```
用户聚焦输入框
    │
    ▼
显示全部options列表（或前N条）
    │
    ▼ 用户输入文字
    │
    ▼
实时过滤匹配项
    │
    ├── 匹配项存在 → 用户点击选中
    │
    └── 无匹配项 + allowCreate → 显示"创建: XXX"
         │
         └── 用户点击创建 → onChange(新值)
```

### 28.15 各页面筛选器使用模式

基于代码审计，以下7个页面实际使用了 Filter 系统：

| 页面 | 筛选器类型 | 字段 | 配置 |
|------|-----------|------|------|
| InventoryPage | FilterTextContent | 关键词 | 搜索产品名/材质 |
| InventoryPage | FilterSelectContent | 材质 | 材质标准列表 |
| InventoryPage | FilterNumberContent | 库存范围 | min-max + unit="件" |
| ReconciliationPage | FilterSelectContent | 状态 | 8种对账状态 |
| ReconciliationPage | FilterSelectContent | 月份 | 2024-01/02/03... |
| ProductListPage | FilterSelectContent | 材质 | 材质标准列表 |
| ProductListPage | FilterSelectContent | 工艺 | 工艺标准列表 |
| CustomerListPage | FilterTextContent | 关键词 | 搜索客户名/编码 |
| PermissionPage | FilterSelectContent | 角色 | admin/operator/finance |
| OperationLogPage | FilterSelectContent | 实体类型 | customer/product/inbound... |
| OperationLogPage | FilterDateRangeContent | 日期范围 | 按操作时间筛选 |
| OrderListPage | FilterSelectContent | 状态 | draft/confirmed/shipped... |

**注意**：InboundPage 和 OutboundPage 使用的是自定义搜索组件（EntityCombobox），而非 Filter 系统。CustomerListPage 的状态筛选使用原生 Select 组件，关键词筛选使用 FilterTextContent。

### 28.16 受控与非受控模式详解

#### 受控模式（推荐）

```tsx
const [filterValue, setFilterValue] = useState<string>();

<Filter value={filterValue} onValueChange={setFilterValue}>
  <FilterTrigger label="产品名称" />
  <FilterContent>
    <FilterTextContent />
  </FilterContent>
</Filter>
```

特点：
- 父组件完全控制筛选值
- 每次值变化触发 `onValueChange`
- 适合需要将筛选值传递给API请求的场景

#### 非受控模式

```tsx
<Filter defaultValue="">
  <FilterTrigger label="产品名称" />
  <FilterContent>
    <FilterTextContent />
  </FilterContent>
</Filter>
```

特点：
- Filter 内部管理值
- 父组件不跟踪值变化
- 适合纯UI筛选（如本地过滤列表）

#### Legacy模式（不推荐）

```tsx
<Filter>
  <FilterTrigger label="产品名称" />
  <FilterContent>
    <FilterTextContent
      value={textValue}
      onValueChange={setTextValue}
    />
  </FilterContent>
</Filter>
```

特点：
- 值直接在 Content 组件上管理
- 绕过 FilterContext
- 向后兼容旧代码

### 28.17 完整使用示例

#### 示例1：文本搜索筛选器

```tsx
function ProductSearchFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Filter value={value} onValueChange={onChange}>
      <FilterTrigger label="产品名称" icon={<Search className="size-3.5" />} closable />
      <FilterContent>
        <FilterTextContent placeholder="输入产品名称搜索" />
      </FilterContent>
    </Filter>
  );
}
```

#### 示例2：日期范围筛选器

```tsx
function DateRangeFilter({ value, onChange }: {
  value: DateRange | undefined;
  onChange: (v: DateRange | undefined) => void;
}) {
  return (
    <Filter value={value} onValueChange={onChange}>
      <FilterTrigger label="日期范围" closable />
      <FilterContent>
        <FilterDateRangeContent numberOfMonths={2} />
      </FilterContent>
    </Filter>
  );
}
```

#### 示例3：多选筛选器

```tsx
function MaterialFilter({ value, onChange }: {
  value: string[] | undefined;
  onChange: (v: string[] | undefined) => void;
}) {
  const options = allMaterialStandards.map(m => ({
    value: m.standard,
    label: `${m.standard} (${m.name})`,
  }));

  return (
    <Filter value={value} onValueChange={onChange}>
      <FilterTrigger label="材质" closable />
      <FilterContent>
        <FilterMultiSelectContent options={options} maxCount={1} />
      </FilterContent>
    </Filter>
  );
}
```

#### 示例4：FilterGroup组合使用

```tsx
function ProductFilters({ filters, onFilterChange }) {
  return (
    <FilterGroup gap="md">
      <Filter value={filters.keyword} onValueChange={v => onFilterChange('keyword', v)}>
        <FilterTrigger label="关键词" icon={<Search />} closable />
        <FilterContent>
          <FilterTextContent placeholder="搜索..." />
        </FilterContent>
      </Filter>

      <Filter value={filters.material} onValueChange={v => onFilterChange('material', v)}>
        <FilterTrigger label="材质" closable />
        <FilterContent>
          <FilterSelectContent options={materialOptions} />
        </FilterContent>
      </Filter>

      <Filter value={filters.stockRange} onValueChange={v => onFilterChange('stockRange', v)}>
        <FilterTrigger label="库存" closable />
        <FilterContent>
          <FilterNumberContent unit="件" />
        </FilterContent>
      </Filter>
    </FilterGroup>
  );
}
```

### 28.18 导出清单

```typescript
export {
  // 核心组件
  Filter,
  FilterTrigger,
  filterTriggerVariants,
  FilterContent,
  FilterTextContent,
  FilterNumberContent,
  FilterDateRangeContent,
  FilterSelectContent,
  FilterMultiSelectContent,
  FilterGroup,
  filterGroupVariants,
};

// 类型导出
export type {
  FilterVariant,
  FilterShape,
  FilterSize,
  NumberRangeValue,
  FilterOption,
  FilterProps,
  FilterTriggerProps,
  FilterContentProps,
  FilterTextContentProps,
  FilterNumberContentProps,
  FilterDateRangeContentProps,
  FilterSelectContentProps,
  FilterMultiSelectContentProps,
  FilterGroupProps,
};

// 类型重导出
export type { DateRange } from 'react-day-picker';
```

共导出10个组件/变体 + 14个类型接口 + 1个类型重导出（DateRange）。


---

## 第29章 Business-UI EntityCombobox 组件系统

### 29.1 系统架构与文件结构

EntityCombobox 是热处理收发货管理系统中使用的通用实体搜索选择器组件库，基于 Radix Popover + TanStack Query 实现异步搜索、防抖过滤、单选/多选等完整选择器交互。

| 文件 | 行数 | 职责 |
|------|------|------|
| `entity-combobox.tsx` | 145 | 根组件 EntityCombobox，管理状态、数据获取、选择逻辑 |
| `base-combobox.tsx` | ~350 | 高级封装 BaseCombobox，集成触发器+弹层+列表 |
| `context.tsx` | ~80 | EntityComboboxContext Provider + useEntityComboboxContext |
| `types.ts` | 246 | EntityComboboxProps/BaseComboboxProps/Context 类型 |
| `shared-types.ts` | 296 | 共享类型：ItemValue/TriggerType/ClassNamesConfig/BaseEntitySelectProps |
| `size-variants.tsx` | ~60 | 尺寸变体定义（medium/small/xs） |
| `base-combobox-content.tsx` | ~120 | 弹层内容容器（搜索框+列表+空状态+错误态） |
| `base-combobox-trigger.tsx` | ~100 | 按钮样式触发器 |
| `search-trigger.tsx` | ~80 | 搜索框样式触发器 |
| `base-combobox-item.tsx` | ~60 | 通用列表项 |
| `base-combobox-list.tsx` | ~50 | 列表容器（ScrollArea） |
| `base-combobox-search.tsx` | ~40 | 搜索输入框 |
| `base-combobox-empty.tsx` | ~20 | 空状态 |
| `base-combobox-error.tsx` | ~20 | 错误状态 |
| `base-combobox-loading.tsx` | ~20 | 加载状态 |
| `highlight-text.tsx` | ~40 | 搜索关键词高亮 |
| `item-pill.tsx` | ~50 | 多选标签（Pill） |
| `popover-wrapper.tsx` | ~120 | Popover 包装器（触发器+内容容器） |
| `hooks.tsx` | ~40 | useDebounce Hook |
| `use-fetch-data.tsx` | ~80 | useFetchData Hook（TanStack Query） |
| `use-infinite-scroll.tsx` | 99 | 无限滚动 Hook |
| `use-popover-outside-click.tsx` | 32 | Popover 外部点击 Hook |
| `index.tsx` | ~10 | 桶导出 |

### 29.2 核心类型定义

#### ItemValue — 通用选项值

```typescript
type ItemValue<TRaw = unknown> = {
  id: string;       // 唯一标识
  name: string;     // 显示名称
  avatar?: string;  // 头像URL
  raw?: TRaw;       // 原始数据对象（保留完整数据）
};
```

所有实体选择器（UserSelect/DepartmentSelect/CustomerCombobox/ProductCombobox）的值都转换为 `ItemValue` 格式，实现统一的选中和展示逻辑。

#### EntityComboboxProps — 根组件Props

```typescript
type EntityComboboxProps<T, TRaw, TValue> = {
  size?: ComboboxSize;                    // 'medium' | 'small' | 'xs'
  fetchFn: (search: string) => Promise<{ items: T[] }>;  // 数据获取函数
  multiple?: boolean;                     // 多选模式
  value?: TValue | TValue[] | null;       // 受控值
  defaultValue?: TValue | TValue[] | null;
  onChange?: (value: TValue | TValue[] | null) => void;
  open?: boolean;                          // 受控展开状态
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  debounce?: number;                       // 搜索防抖延迟，默认300ms
  disabled?: boolean;
  onSelect?: (value: TValue) => void;
  onDeselect?: (value: TValue) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  getItemValue: (item: T) => TValue;      // 原始数据 → ItemValue 转换函数
  children: ReactNode;
};
```

三个泛型参数：
- `T`：原始数据类型（如 API 返回的用户对象）
- `TRaw`：保留在 ItemValue.raw 中的原始数据类型
- `TValue`：ItemValue 的具体类型（通常为 `ItemValue<TRaw>`）

#### BaseEntitySelectProps — 基础选择器Props

`shared-types.ts` 中定义了 `BaseEntitySelectProps`，这是 UserSelect/DepartmentSelect 等所有业务选择器的公共 Props 基类：

```typescript
type BaseEntitySelectProps<TValue = ItemValue<unknown>> = {
  size?: 'medium' | 'small' | 'xs';
  triggerType?: 'button' | 'search' | 'custom';      // 触发器类型
  renderTrigger?: (props: TriggerRenderProps) => ReactNode;  // 自定义触发器
  multiple?: boolean;
  value?: TValue | TValue[] | null;
  defaultValue?: TValue | TValue[] | null;
  onChange?: (value: TValue | TValue[] | null) => void;
  defaultOpen?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  classNames?: ClassNamesConfig;                     // 各元素自定义类名
  placeholder?: string;
  emptyText?: string;
  tagClosable?: boolean;                              // 多选标签可关闭
  maxTagCount?: number | 'responsive';                // 最大标签数
  getOptionDisabled?: (value: TValue) => boolean;     // 选项禁用判断
  onSelect?: (value: TValue) => void;
  onDeselect?: (value: TValue) => void;
  onClear?: () => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  slotProps?: PopoverSlotProps;                       // Popover内容插槽
};
```

#### ClassNamesConfig — 样式类名配置

```typescript
type ClassNamesConfig = {
  root?: string;       // 根容器
  trigger?: string;    // 触发器
  popover?: string;    // 弹层内容
  search?: string;     // 搜索框
  list?: string;       // 列表容器
  listItem?: string;   // 列表项
  tag?: string;        // 多选标签
  empty?: string;      // 空状态
  error?: string;      // 异常态
  loading?: string;    // 加载状态
  clear?: string;      // 清除按钮
  suffix?: string;     // 后缀元素
};
```

### 29.3 EntityCombobox 根组件实现

#### 状态管理

```typescript
// 受控/非受控值
const [selectedValue, setSelectedValue] = useControllableState({
  prop: valueProp,
  defaultProp: defaultValue ?? (!multiple ? null : []),
  onChange,
});

// 搜索值 + 防抖
const [searchValue, setSearchValue] = useState('');
const debouncedSearch = useDebounce(searchValue, debounce); // 默认300ms

// 弹层展开状态（受控/非受控）
const [open, setOpen] = useControllableState({
  prop: openProp,
  defaultProp: defaultOpen,
  onChange: handleOpenChange, // 关闭时清空搜索
});
```

`useControllableState` 来自 Radix UI，自动在受控（传入 prop）和非受控（传入 defaultProp）之间切换。

#### 数据获取 useFetchData

```typescript
const { data, isFetching, isError, isSuccess, fetchStatus, refetch } =
  useFetchData<T>({
    fetchFn,       // 数据获取函数
    enabled: open,  // 仅在弹层展开时请求
    search: debouncedSearch,  // 防抖后的搜索词
    onSearch,      // 搜索回调
  });
```

`useFetchData` 基于 TanStack Query 的 `useQuery` 实现：
- `enabled: open`：弹层未展开时不发请求，避免不必要的网络请求
- `search` 变化时自动重新请求（queryKey 包含 search）
- 返回 `isFetching`（加载中）、`isError`（错误）、`isSuccess`（成功）、`refetch`（重试）

#### 选择逻辑

```typescript
const handleSelect = (itemValue: TValue) => {
  if (!multiple) {
    // 单选：设置值 + 关闭弹层
    setSelectedValue(itemValue);
    setOpen(false);
    onSelect?.(itemValue);
  } else {
    // 多选：切换选中状态
    const current = Array.isArray(selectedValue) ? selectedValue : [];
    const isSelected = current.some(v => v.id === itemValue.id);

    if (isSelected) {
      // 已选中 → 取消选中
      setSelectedValue(current.filter(v => v.id !== itemValue.id));
      onDeselect?.(itemValue);
    } else {
      // 未选中 → 添加选中
      setSelectedValue([...current, itemValue]);
      onSelect?.(itemValue);
    }
  }
};
```

单选：选中后立即关闭弹层。多选：切换选中状态，不关闭弹层。

#### 清空逻辑

```typescript
const handleClear = () => {
  setSelectedValue(!multiple ? null : []);
  onClear?.();
};
```

单选清空为 `null`，多选清空为 `[]`。

#### Context Provider

```typescript
const contextValue = {
  open, setOpen,
  searchValue, setSearchValue,
  selectedValue: selectedValue ?? (!multiple ? null : []),
  debouncedSearch,
  handleSelect, handleDeselect, handleClear,
  data, isFetching, isError, refetch,
  isSuccess, fetchStatus, isPlaceholderData: false,
  multiple, disabled, size,
  getItemValue: getItemValue as (item: unknown) => ItemValue,
};

return <EntityComboboxProvider value={contextValue}>{children}</EntityComboboxProvider>;
```

所有子组件通过 `useEntityComboboxContext()` 获取状态和方法。

### 29.4 BaseCombobox 高级封装

`BaseCombobox` 是 `EntityCombobox` 的高级封装，集成了触发器、弹层、搜索框、列表等所有子组件，业务选择器（UserSelect/DepartmentSelect）直接基于 BaseCombobox 实现。

#### 与 EntityCombobox 的区别

| 特性 | EntityCombobox | BaseCombobox |
|------|---------------|--------------|
| 用途 | 底层状态管理 | 业务级完整组件 |
| 触发器 | 无（子组件自行渲染） | 内置 button/search/custom 三种 |
| 列表渲染 | 无（子组件自行渲染） | 内置 renderItem |
| 标签渲染 | 无 | 内置 renderTag |
| 搜索框 | 无 | 内置（showSearch 控制） |
| 空状态 | 无 | 内置 |
| 使用方式 | 组合式 | 一站式 |

#### BaseCombobox 渲染结构

```
<BaseCombobox>
  └── <PopoverWrapper>
        ├── 触发器（根据 triggerType 选择）
        │   ├── button → <BaseComboboxTrigger>
        │   ├── search → <SearchTrigger>
        │   └── custom → renderTrigger(props)
        └── <BaseComboboxContent>
              ├── <BaseComboboxSearch>（showSearch=true 时）
              ├── <BaseComboboxList>
              │   ├── isFetching → <BaseComboboxLoading>
              │   ├── isError → <BaseComboboxError>
              │   ├── data.length === 0 → <BaseComboboxEmpty>
              │   └── data.map(item => renderItem(item, isSelected))
              └── 底部（可选自定义）
```

### 29.5 触发器组件

#### 三种触发器类型

| 类型 | 组件 | 样式 | 使用场景 |
|------|------|------|---------|
| button | BaseComboboxTrigger | 按钮样式，显示选中值或占位文本 | 表单内选择 |
| search | SearchTrigger | 搜索框样式，显示选中标签 | 筛选栏 |
| custom | renderTrigger(props) | 完全自定义 | 特殊UI需求 |

#### BaseComboboxTrigger（按钮触发器）

```tsx
const BaseComboboxTrigger = () => {
  const { selectedValue, multiple, setOpen, disabled, placeholder, size } = useEntityComboboxContext();

  return (
    <Button variant="outline" size={size} disabled={disabled} onClick={() => setOpen(true)}>
      {multiple ? (
        // 多选：显示标签列表
        <TagList values={selectedValue} />
      ) : (
        // 单选：显示选中名称或占位符
        selectedValue ? selectedValue.name : placeholder
      )}
      <ChevronDown className="ml-2 size-4 opacity-50" />
    </Button>
  );
};
```

#### SearchTrigger（搜索触发器）

```tsx
const SearchTrigger = () => {
  const { selectedValue, multiple, searchValue, setSearchValue, setOpen, open, placeholder } = useEntityComboboxContext();

  return (
    <div className="flex items-center gap-2">
      {multiple && selectedValue?.length > 0 && <TagList values={selectedValue} />}
      <input
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={selectedValue && !multiple ? selectedValue.name : placeholder}
      />
    </div>
  );
};
```

### 29.6 弹层内容组件

#### BaseComboboxContent

```tsx
const BaseComboboxContent = ({ children, className }) => {
  const { isFetching, isError, data, showSearch } = useEntityComboboxContext();

  return (
    <PopoverContent className={cn('p-0', className)}>
      {showSearch && <BaseComboboxSearch />}
      <BaseComboboxList>
        {isFetching && <BaseComboboxLoading />}
        {isError && <BaseComboboxError />}
        {!isFetching && !isError && data.length === 0 && <BaseComboboxEmpty />}
        {!isFetching && !isError && data.map(item => children(item))}
      </BaseComboboxList>
    </PopoverContent>
  );
};
```

#### BaseComboboxSearch

搜索输入框，使用 shadcn Input 组件：

```tsx
<div className="flex items-center border-b px-3">
  <Search className="mr-2 size-4 shrink-0 opacity-50" />
  <Input
    value={searchValue}
    onChange={e => setSearchValue(e.target.value)}
    placeholder={searchPlaceholder}
    className="border-0 focus-visible:ring-0"
  />
</div>
```

#### BaseComboboxList

使用 shadcn ScrollArea 实现可滚动列表：

```tsx
<ScrollArea className="h-[300px]">
  <div className="p-1">
    {items}
  </div>
</ScrollArea>
```

#### 状态组件

| 组件 | 内容 | 样式 |
|------|------|------|
| BaseComboboxLoading | Spinner + loadingText | flex items-center justify-center py-6 |
| BaseComboboxError | AlertCircle + 错误信息 + 重试按钮 | flex items-center justify-center py-6 text-destructive |
| BaseComboboxEmpty | SearchX + emptyText | flex items-center justify-center py-6 text-muted-foreground |

### 29.7 HighlightText 搜索高亮

```tsx
function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword) return <span>{text}</span>;

  const parts = text.split(new RegExp(`(${escapeRegExp(keyword)})`, 'gi'));

  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={index} className="bg-primary/20 text-primary">{part}</mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}
```

使用正则分割文本，匹配部分用 `<mark>` 标签高亮显示。

### 29.8 ItemPill 多选标签

```tsx
function ItemPill({ value, onClose, closable, disabled, size }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs', sizeClasses[size])}>
      {value.avatar && <Avatar className="size-4"><AvatarImage src={value.avatar} /><AvatarFallback>{value.name[0]}</AvatarFallback></Avatar>}
      <span className="max-w-32 truncate">{value.name}</span>
      {closable && !disabled && (
        <button onClick={(e) => onClose(value, e)} className="rounded-sm hover:bg-foreground/10">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
```

多选模式下，每个选中项显示为一个可关闭的标签（Pill）。标签包含头像（可选）、名称和关闭按钮。

### 29.9 Hooks

#### useDebounce

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

标准的防抖 Hook：value 变化后等待 delay 毫秒才更新 debouncedValue，如果在等待期间 value 再次变化则重置计时器。

#### useFetchData

```typescript
function useFetchData<T>({ fetchFn, enabled, search, onSearch }) {
  return useQuery({
    queryKey: ['entity-combobox', search],
    queryFn: () => fetchFn(search),
    enabled: enabled && !!search !== undefined,
    placeholderData: (prev) => prev,  // 保持上次数据，避免闪烁
  });
}
```

基于 TanStack Query：
- `queryKey` 包含 search，搜索词变化自动重新请求
- `enabled` 控制：弹层未展开时不请求
- `placeholderData: (prev) => prev`：新请求发出时保留旧数据显示，避免列表闪烁

#### useInfiniteScroll（99行）

无限滚动 Hook，监听滚动容器底部：

```typescript
function useInfiniteScroll({ hasMore, onLoadMore, threshold = 100 }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !hasMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        onLoadMore();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [hasMore, onLoadMore, threshold]);

  return scrollRef;
}
```

#### usePopoverOutsideClick（32行）

```typescript
function usePopoverOutsideClick({ onOutsideClick, enabled }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [enabled, onOutsideClick]);

  return ref;
}
```

### 29.10 尺寸变体

```typescript
const sizeVariants = {
  medium: {
    trigger: 'h-9 text-sm',
    item: 'h-9 text-sm',
    tag: 'text-xs px-2 py-0.5',
  },
  small: {
    trigger: 'h-8 text-sm',
    item: 'h-8 text-sm',
    tag: 'text-xs px-1.5 py-0.5',
  },
  xs: {
    trigger: 'h-7 text-xs',
    item: 'h-7 text-xs',
    tag: 'text-xs px-1 py-0',
  },
};
```

三种尺寸通过 Context 传递，子组件根据 size 选择对应的样式类。

### 29.11 业务组件基于 EntityCombobox 的实现

#### CustomerCombobox

```typescript
function CustomerCombobox(props) {
  const fetchFn = useCallback(async (search: string) => {
    const response = await getCustomers({ keyword: search });
    return {
      items: response.items.map(c => ({
        id: c.id,
        name: c.name,
        raw: c,
      })),
    };
  }, []);

  return (
    <BaseCombobox
      fetchFn={fetchFn}
      getItemValue={(customer) => ({ id: customer.id, name: customer.name, raw: customer })}
      renderItem={(customer, isSelected) => (
        <BaseComboboxItem
          key={customer.id}
          isSelected={isSelected}
          onClick={() => handleSelect(customer)}
        >
          <HighlightText text={customer.name} keyword={searchValue} />
        </BaseComboboxItem>
      )}
      {...props}
    />
  );
}
```

#### ProductCombobox

```typescript
function ProductCombobox(props) {
  const fetchFn = useCallback(async (search: string) => {
    const response = await getProducts({ keyword: search });
    return {
      items: response.items.map(p => ({
        id: p.id,
        name: p.name,
        raw: p,
      })),
    };
  }, []);

  return (
    <BaseCombobox
      fetchFn={fetchFn}
      getItemValue={(product) => ({ id: product.id, name: product.name, raw: product })}
      renderItem={(product, isSelected) => (
        <BaseComboboxItem key={product.id} isSelected={isSelected} onClick={() => handleSelect(product)}>
          <div className="flex flex-col">
            <HighlightText text={product.name} keyword={searchValue} />
            <span className="text-xs text-muted-foreground">{product.material} · {product.process}</span>
          </div>
        </BaseComboboxItem>
      )}
      {...props}
    />
  );
}
```

### 29.12 使用模式

#### 单选模式

```tsx
const [selected, setSelected] = useState<ItemValue | null>(null);

<EntityCombobox
  fetchFn={fetchCustomers}
  value={selected}
  onChange={setSelected}
  getItemValue={(c) => ({ id: c.id, name: c.name, raw: c })}
>
  <PopoverWrapper triggerType="button" placeholder="选择客户">
    <BaseComboboxContent>
      {(customer, isSelected) => <BaseComboboxItem ...>{customer.name}</BaseComboboxItem>}
    </BaseComboboxContent>
  </PopoverWrapper>
</EntityCombobox>
```

#### 多选模式

```tsx
const [selected, setSelected] = useState<ItemValue[]>([]);

<EntityCombobox
  fetchFn={fetchProducts}
  multiple
  value={selected}
  onChange={setSelected}
  getItemValue={(p) => ({ id: p.id, name: p.name, raw: p })}
>
  <PopoverWrapper triggerType="search" placeholder="选择产品" maxTagCount={3}>
    <BaseComboboxContent>
      {(product, isSelected) => <BaseComboboxItem ...>{product.name}</BaseComboboxItem>}
    </BaseComboboxContent>
  </PopoverWrapper>
</EntityCombobox>
```

### 29.13 性能优化

1. **防抖搜索**：默认300ms防抖，避免每次按键都发请求
2. **按需请求**：`enabled: open`，弹层未展开时不发请求
3. **placeholderData**：搜索时保留上次数据，避免列表闪烁
4. **ScrollArea**：长列表使用虚拟滚动区域
5. **useMemo**：Context值和fetchFn使用useMemo包裹，避免不必要的重渲染
6. **useCallback**：事件处理函数使用useCallback包裹

### 29.14 导出清单

```typescript
export { EntityCombobox };
export { BaseCombobox };
export { useEntityComboboxContext };
export { useDebounce };
export { useFetchData };
export { useInfiniteScroll };
export { usePopoverOutsideClick };
export { HighlightText };
export { ItemPill };
export { PopoverWrapper };
export { BaseComboboxContent, BaseComboboxSearch, BaseComboboxList, BaseComboboxItem, BaseComboboxEmpty, BaseComboboxError, BaseComboboxLoading };
export { BaseComboboxTrigger, SearchTrigger };
export type { EntityComboboxProps, BaseComboboxProps, EntityComboboxContextValue, PopoverWrapperProps, ItemValue, TriggerType, TriggerRenderProps, ClassNamesConfig, PopoverSlotProps, BaseEntitySelectProps, ComboboxSize, I18nText };
```

共导出 15 个组件/Hook + 11 个类型。


---

## 第30章 Business-UI Form 表单系统

### 30.1 系统架构

Form 表单系统基于 TanStack Form（@tanstack/react-form）构建，提供类型安全的表单状态管理和字段组件库。

| 文件 | 行数 | 职责 |
|------|------|------|
| `form.tsx` | 54 | Form 根组件，包裹 FormProvider + form.AppForm |
| `context.tsx` | ~30 | FormProvider + useFormContext |
| `field-layout.tsx` | 91 | 字段布局组件（label/description/error/required） |
| `input-field.tsx` | ~120 | Input 字段组件 |
| `textarea-field.tsx` | ~80 | Textarea 字段组件 |
| `select-field.tsx` | ~100 | Select 字段组件 |
| `checkbox-field.tsx` | ~60 | Checkbox 字段组件 |
| `radio-group-field.tsx` | ~70 | RadioGroup 字段组件 |
| `switch-field.tsx` | ~60 | Switch 字段组件 |
| `hooks/form.tsx` | 40 | createAppFormHook 工厂函数 |
| `hooks/form-context.tsx` | 4 | fieldContext + formContext |
| `hooks/form-utils.ts` | 23 | 表单工具函数 |
| `types.ts` | 32 | 类型定义 |
| `index.tsx` | ~10 | 桶导出 |

### 30.2 技术选型：TanStack Form

本系统选择 TanStack Form 而非 React Hook Form 的原因：

| 特性 | TanStack Form | React Hook Form |
|------|--------------|-----------------|
| 类型安全 | 完整泛型推导 | 需要手动类型断言 |
| 状态管理 | 独立状态管理 | 依赖 React 状态 |
| 渲染优化 | 字段级订阅 | 全表单重渲染 |
| 异步验证 | 原生支持 | 需要额外配置 |
| 生态 | 较新 | 成熟稳定 |

### 30.3 Form 根组件

```typescript
interface FormProps {
  children: React.ReactNode;
  form: AppFieldExtendedReactFormApi<any, any>;  // TanStack Form 实例
  className?: string;
  style?: React.CSSProperties;
  layout?: 'vertical' | 'responsive' | 'horizontal';
}
```

```tsx
const Form: React.FC<FormProps> = (props) => {
  const { children, form, className, style, layout = 'vertical' } = props;

  return (
    <FormProvider layout={layout}>
      <form
        data-testid="tanstack-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppForm>
          <FieldGroup className={className} style={style}>
            {children}
          </FieldGroup>
        </form.AppForm>
      </form>
    </FormProvider>
  );
};
```

组件层级：
1. `FormProvider` — 提供表单上下文（layout 模式）
2. `<form>` — 原生 form 元素，阻止默认提交，调用 `form.handleSubmit()`
3. `form.AppForm` — TanStack Form 的 AppForm 组件，提供字段组件注册
4. `FieldGroup` — shadcn Field 组件，提供布局容器

### 30.4 FormProvider 上下文

```typescript
// context.tsx
const FormContext = React.createContext<{ layout: string }>({ layout: 'vertical' });

export function FormProvider({ children, layout }: { children: React.ReactNode; layout: string }) {
  return <FormContext.Provider value={{ layout }}>{children}</FormContext.Provider>;
}

export function useFormContext() {
  return React.useContext(FormContext);
}
```

`layout` 值传递给所有字段组件，控制 label 和输入框的排列方式。

### 30.5 FieldLayout 字段布局组件

FieldLayout 是所有字段组件的通用布局包装器，负责渲染 label、description、error 和必填标记。

#### Props

```typescript
interface FieldLayoutProps {
  label?: ReactNode;
  placeholder?: string;
  description?: string;
  isInvalid?: boolean;        // 是否校验失败
  errorMessage?: string;       // 错误信息
  layout?: 'horizontal' | 'vertical' | 'responsive';
  name?: string;               // 字段名（关联label的htmlFor）
  required?: boolean;           // 是否必填
  classNames?: Partial<FieldLayoutClassNames>;
  styles?: Partial<FieldLayoutStyles>;
}
```

#### 布局模式

**垂直布局**（vertical，默认）：

```
┌─────────────┐
│ Label *     │
├─────────────┤
│ [Input]     │
├─────────────┤
│ Error msg   │
├─────────────┤
│ Description │
└─────────────┘
```

```tsx
<Field orientation="vertical">
  {labelComponent}
  <FieldContent>
    {children}
    {errorComponent}
  </FieldContent>
  {descriptionComponent}
</Field>
```

**水平/响应式布局**（horizontal/responsive）：

```
┌──────────────┬──────────────┐
│ Label *      │ [Input]      │
│ Description  │ Error msg    │
└──────────────┴──────────────┘
```

```tsx
<Field orientation={layout}>
  {descriptionComponent ? (
    <FieldContent>
      {labelComponent}
      {descriptionComponent}
    </FieldContent>
  ) : (
    labelComponent
  )}
  <FieldContent className="has-[>[role=switch]]:flex-initial">
    {children}
    {errorComponent}
  </FieldContent>
</Field>
```

#### 必填标记

```tsx
{required && (
  <span className="text-red-500">
    <Asterisk size={12} />
  </span>
)}
```

使用 Lucide 的 Asterisk 图标，红色，12px，显示在 label 后面。

#### 错误显示

```tsx
const errorComponent = isInvalid && (
  <FieldError className={classNames?.['error']} style={styles?.['error']}>
    {errorMessage}
  </FieldError>
);
```

`FieldError` 是 shadcn Field 组件的子组件，默认红色文字样式。

### 30.6 字段组件

所有字段组件遵循相同的模式：

1. 从 TanStack Form 获取 `field` 对象
2. 使用 `FieldLayout` 包裹布局
3. 渲染对应的 shadcn UI 组件
4. 绑定 `field.state.value` 和 `field.handleChange`

#### InputField

```tsx
function InputField({ field, ...fieldProps }: InputFieldProps) {
  return (
    <FieldLayout {...fieldProps} name={field.name} isInvalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
      <Input
        value={field.state.value ?? ''}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur()}
        disabled={fieldProps.disabled}
        placeholder={fieldProps.placeholder}
      />
    </FieldLayout>
  );
}
```

支持的 input 类型：text、number、email、password、tel、url、search。

#### TextareaField

```tsx
function TextareaField({ field, ...fieldProps }: TextareaFieldProps) {
  return (
    <FieldLayout {...fieldProps}>
      <Textarea
        value={field.state.value ?? ''}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur()}
        placeholder={fieldProps.placeholder}
        rows={fieldProps.rows ?? 3}
      />
    </FieldLayout>
  );
}
```

#### SelectField

```tsx
function SelectField({ field, ...fieldProps }: SelectFieldProps) {
  return (
    <FieldLayout {...fieldProps}>
      <Select
        value={field.state.value ?? ''}
        onValueChange={(value) => field.handleChange(value)}
        disabled={fieldProps.disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={fieldProps.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {fieldProps.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldLayout>
  );
}
```

#### CheckboxField

```tsx
function CheckboxField({ field, ...fieldProps }: CheckboxFieldProps) {
  return (
    <FieldLayout {...fieldProps} layout="horizontal">
      <Checkbox
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />
    </FieldLayout>
  );
}
```

Checkbox 默认使用水平布局。

#### RadioGroupField

```tsx
function RadioGroupField({ field, ...fieldProps }: RadioGroupFieldProps) {
  return (
    <FieldLayout {...fieldProps}>
      <RadioGroup
        value={field.state.value ?? ''}
        onValueChange={(value) => field.handleChange(value)}
      >
        {fieldProps.options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} />
            <Label htmlFor={`${field.name}-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </FieldLayout>
  );
}
```

#### SwitchField

```tsx
function SwitchField({ field, ...fieldProps }: SwitchFieldProps) {
  return (
    <FieldLayout {...fieldProps} layout="horizontal">
      <Switch
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />
    </FieldLayout>
  );
}
```

Switch 默认使用水平布局，并且 `FieldContent` 添加 `has-[>[role=switch]]:flex-initial` 样式。

### 30.7 createAppFormHook 工厂函数

```typescript
const COMMON_FORM_COMPONENTS = {
  Input: InputField,
  Switch: SwitchField,
  RadioGroup: RadioGroupField,
  Checkbox: CheckboxField,
  Select: SelectField,
  Textarea: TextareaField,
};

export function createAppFormHook(options?: CreateFormHookOptions) {
  const { fieldComponents = {}, formComponents = {} } = options ?? {};

  return createFormHook({
    fieldComponents: {
      ...COMMON_FORM_COMPONENTS,
      ...fieldComponents,
    },
    formComponents: formComponents,
    fieldContext,
    formContext,
  });
}
```

`createAppFormHook` 是 TanStack Form 的工厂函数，注册所有字段组件。业务代码可以扩展自定义字段组件：

```typescript
const useAppForm = createAppFormHook({
  fieldComponents: {
    CustomerSelect: CustomerSelectField,
    ProductSelect: ProductSelectField,
  },
});

// 使用
const form = useAppForm({
  defaultValues: { customer: '', product: '' },
  onSubmit: (values) => console.log(values),
});

<form.AppField component="CustomerSelect" name="customer" />
```

### 30.8 表单验证

TanStack Form 支持同步和异步验证：

```typescript
const form = useAppForm({
  defaultValues: {
    productName: '',
    quantity: 0,
    unitPrice: 0,
  },
  validators: {
    onChange: (values) => {
      const errors: Record<string, string> = {};
      if (!values.productName?.trim()) errors.productName = '产品名称不能为空';
      if (values.quantity <= 0) errors.quantity = '数量必须大于0';
      if (values.unitPrice <= 0) errors.unitPrice = '单价必须大于0';
      return errors;
    },
  },
  onSubmit: async (values) => {
    await saveInbound(values);
  },
});
```

字段级验证：

```typescript
<form.AppField
  name="productName"
  validators={{
    onChange: (value) => !value?.trim() ? '产品名称不能为空' : undefined,
  }}
>
  {(field) => <field.Input label="产品名称" required />}
</form.AppField>
```

### 30.9 CommonFieldProps 通用属性

所有字段组件共享的 Props：

```typescript
interface CommonFieldProps {
  label?: ReactNode;          // 字段标签
  placeholder?: string;       // 占位文本
  description?: string;       // 描述信息
  disabled?: boolean;         // 是否禁用
  required?: boolean;         // 是否必填
  layout?: 'horizontal' | 'vertical' | 'responsive';  // 布局模式
}
```

### 30.10 使用示例

#### 来货登记表单

```tsx
const useInboundForm = createAppFormHook();

function InboundForm() {
  const form = useInboundForm({
    defaultValues: {
      customerId: '',
      productId: '',
      quantity: 0,
      weight: 0,
      unit: '件',
      unitPrice: 0,
      remark: '',
    },
    validators: {
      onSubmit: (values) => {
        const errors = {};
        if (!values.customerId) errors.customerId = '请选择客户';
        if (!values.productId) errors.productId = '请选择产品';
        if (values.quantity <= 0) errors.quantity = '数量必须大于0';
        return errors;
      },
    },
    onSubmit: async (values) => {
      await saveInboundRecord(values);
    },
  });

  return (
    <Form form={form} layout="vertical" className="space-y-4">
      <form.AppField name="customerId">
        {(field) => <field.Input label="客户" required placeholder="选择客户" />}
      </form.AppField>

      <form.AppField name="productId">
        {(field) => <field.Input label="产品" required placeholder="选择产品" />}
      </form.AppField>

      <div className="grid grid-cols-2 gap-4">
        <form.AppField name="quantity">
          {(field) => <field.Input label="数量" required type="number" />}
        </form.AppField>

        <form.AppField name="weight">
          {(field) => <field.Input label="重量(kg)" type="number" />}
        </form.AppField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.AppField name="unit">
          {(field) => (
            <field.Select label="计价单位" required options={[
              { value: '件', label: '件' },
              { value: 'kg', label: 'kg' },
              { value: '个', label: '个' },
            ]} />
          )}
        </form.AppField>

        <form.AppField name="unitPrice">
          {(field) => <field.Input label="单价(元)" required type="number" />}
        </form.AppField>
      </div>

      <form.AppField name="remark">
        {(field) => <field.Textarea label="备注" placeholder="补充说明..." />}
      </form.AppField>

      <form.AppForm>
        <SubmitButton form={form} />
      </form.AppForm>
    </Form>
  );
}
```

### 30.11 导出清单

```typescript
export { Form };
export { FormProvider, useFormContext };
export { FieldLayout };
export { InputField, TextareaField, SelectField, CheckboxField, RadioGroupField, SwitchField };
export { createAppFormHook };
export type { FormProps, FieldLayoutProps, CommonFieldProps, FieldLayoutStyles, FieldLayoutClassNames };
```


---

## 第31章 Business-UI 用户组件系统

### 31.1 系统架构

用户组件系统包含三个子系统：UserSelect（用户选择器）、UserDisplay（用户展示）、UserProfile（用户详情卡片）。基于 EntityCombobox 底层组件实现，集成飞书用户搜索 API。

| 子系统 | 文件数 | 总行数 | 职责 |
|--------|--------|--------|------|
| UserSelect | 8 | ~650 | 用户搜索选择器 |
| UserDisplay | 5 | ~250 | 用户头像+姓名展示 |
| UserProfile | 4 | ~750 | 用户详情卡片（飞书原生卡片） |
| API 服务 | 6 | ~400 | 用户/部门 API 封装 |

### 31.2 UserSelect 用户选择器（212行核心）

#### Props

```typescript
interface UserSelectProps extends BaseEntitySelectProps<User> {
  accountType?: 'apaas' | 'lark';    // 账号类型，默认 'apaas'
  valueType?: 'string' | 'object';   // 值类型，默认 'string'
}
```

- `accountType`：决定使用 aPaaS 用户体系还是飞书用户体系
- `valueType`：`'string'` 时 value 为 userId 字符串，`'object'` 时 value 为完整 User 对象

#### User 类型

```typescript
interface User {
  id: string;         // 用户ID
  name: string;       // 显示名称
  avatar?: string;    // 头像URL
  email?: string;     // 邮箱
  department?: string; // 部门名称
  userType?: '_employee' | '_externalUser';  // 用户类型
}
```

#### 数据获取

```typescript
function createUsersFetcher(options: { accountType?: AccountType; pageSize?: number } = {}) {
  const { accountType = 'apaas', pageSize = 100 } = options;

  return async (search: string) => {
    const response = await searchUsers({ query: search, pageSize });
    const userList = response?.data?.userList || [];

    return {
      items: userList.map(user => searchUserInfoToUser(user, accountType)),
    };
  };
}
```

`searchUsers` 调用 aPaaS 用户搜索 API，返回用户列表。`searchUserInfoToUser` 将 API 返回的原始用户信息转换为 `User` 类型。

#### 值类型转换 useUserValue

```typescript
function useUserValue(
  value: User | User[] | string | string[] | null,
  multiple: boolean,
  accountType: 'apaas' | 'lark',
  valueType: 'string' | 'object',
) {
  const [internalValue, setInternalValue] = useState<User | User[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!value) {
      setInternalValue(multiple ? [] : null);
      return;
    }

    if (valueType === 'object') {
      // 对象模式：直接使用
      setInternalValue(value as User | User[]);
    } else {
      // 字符串模式：需要根据 ID 查询用户信息
      setIsLoading(true);
      const ids = multiple ? value as string[] : [value as string];
      fetchUsersByIds(ids, accountType).then(users => {
        setInternalValue(multiple ? users : users[0] ?? null);
        setIsLoading(false);
      });
    }
  }, [value, valueType, multiple, accountType]);

  const toExternalValue = (internalVal: User | User[] | null, isMultiple: boolean) => {
    if (!internalVal) return isMultiple ? [] : null;
    if (valueType === 'object') return internalVal;
    // 字符串模式：提取 ID
    return isMultiple
      ? (internalVal as User[]).map(u => u.id)
      : (internalVal as User).id;
  };

  return { internalValue, isLoading, toExternalValue };
}
```

当 `valueType='string'` 时，需要额外的异步请求将 userId 转换为完整的 User 对象。这期间 `isLoading=true`，显示加载状态。

#### 组件渲染

```tsx
export const UserSelect: React.FC<UserSelectProps> = (props) => {
  const {
    size = 'medium',
    triggerType = 'button',
    multiple = false,
    value,
    valueType = 'string',
    accountType = 'apaas',
    ...
  } = props;

  const { internalValue, isLoading, toExternalValue } = useUserValue(
    value ?? null, multiple, accountType, valueType,
  );

  const fetchFn = useMemo(() => createUsersFetcher({ accountType }), [accountType]);

  const handleChange = useCallback((newValue: User | User[] | null) => {
    if (!onChange) return;
    const externalValue = toExternalValue(newValue, multiple);
    (onChange as (value: unknown) => void)(externalValue);
  }, [onChange, toExternalValue, multiple]);

  return (
    <BaseCombobox
      autoFocus={autoFocus}
      className={className}
      classNames={classNames}
      debounce={300}
      disabled={disabled}
      emptyText="没有匹配结果，换个关键词试试吧"
      fetchFn={fetchFn}
      getItemLabel={(user) => user.name}
      getItemValue={(user) => user}
      multiple={multiple}
      onChange={handleChange}
      placeholder="请选择"
      renderItem={(userValue, isSelected, itemClassName, itemDisabled) => (
        <UserItemWrapper
          key={userValue.id}
          userValue={userValue}
          isSelected={isSelected}
          className={itemClassName}
          disabled={itemDisabled}
        />
      )}
      renderTag={renderTagWithLoading}
      showSearch
      size={size}
      triggerType={triggerType}
      value={internalValue}
      ...
    />
  );
};
```

#### UserItem 列表项

```tsx
function UserItem({ userValue, isSelected, className, size, searchKeyword, disabled }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-2 transition-colors',
        sizeClasses[size],
        isSelected && 'bg-primary/10',
        disabled && 'opacity-50',
        !disabled && 'hover:bg-muted cursor-pointer',
        className,
      )}
      onClick={() => !disabled && handleSelect(userValue)}
    >
      <Avatar className="size-6">
        <AvatarImage src={userValue.avatar} />
        <AvatarFallback>{userValue.name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <HighlightText text={userValue.name} keyword={searchKeyword} />
        {userValue.department && (
          <span className="text-xs text-muted-foreground ml-1">· {userValue.department}</span>
        )}
      </div>
      {isSelected && <Check className="size-4 text-primary" />}
    </div>
  );
}
```

#### UserSelectTag 多选标签

```tsx
function UserSelectTag({ userValue, onClose, size, disabled, isLoading, accountType }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
      {isLoading ? (
        <Spinner className="size-3" />
      ) : (
        <Avatar className="size-4">
          <AvatarImage src={userValue.avatar} />
          <AvatarFallback className="text-xs">{userValue.name?.[0]}</AvatarFallback>
        </Avatar>
      )}
      <span className="max-w-24 truncate">{userValue.name}</span>
      {!disabled && (
        <button onClick={(e) => onClose(userValue, e)} className="rounded-sm hover:bg-foreground/10">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
```

### 31.3 UserDisplay 用户展示（67行）

#### Props

```typescript
interface IUserDisplayProps {
  users: IUserProfile | IUserProfile[];    // 单个或多个用户
  size?: 'small' | 'medium' | 'large';    // 头像尺寸
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;                     // 是否显示姓名，默认 true
  showUserProfile?: boolean;               // 是否显示用户详情卡片（Popover）
}
```

#### IUserProfile 类型

```typescript
interface IUserProfile {
  user_id: string;
  name?: string;
  avatar?: string;
  email?: string;
  department?: string;
}
```

#### 组件实现

```tsx
export const UserDisplay: React.FC<IUserDisplayProps> = ({
  users, size, className, style, showLabel = true,
}) => {
  const normalizedUsers = React.useMemo<IUserProfile[]>(() => {
    if (!users) return [];
    return Array.isArray(users) ? users : [users];
  }, [users]);

  if (!normalizedUsers.length) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)} style={style}>
      {normalizedUsers.map(user => (
        <Popover key={user.user_id}>
          <PopoverTrigger asChild>
            <div>
              <UserWithAvatar
                data={user}
                size={size}
                showLabel={showLabel}
                className="cursor-pointer hover:bg-[rgba(31_35_41_0.15)] active:bg-[rgba(31_35_41_0.2)]"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-[320px] border-0 border-border/50 bg-card p-0 shadow-[...]"
          >
            <UserProfile userId={user.user_id} />
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
};
```

功能：
1. 统一规范化为 `IUserProfile[]` 数组
2. 空数组返回 `null`
3. 每个用户渲染为 `UserWithAvatar`（头像+姓名）
4. 点击头像弹出 `Popover`，显示 `UserProfile` 详情卡片
5. Popover 宽度 320px，左对齐，距触发器 8px

### 31.4 UserWithAvatar 头像+姓名组件

```tsx
function UserWithAvatar({ data, size, showLabel, className }) {
  const sizeMap = {
    small: 'size-5',
    medium: 'size-6',
    large: 'size-8',
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors', className)}>
      <Avatar className={sizeMap[size]}>
        <AvatarImage src={data.avatar} />
        <AvatarFallback className="text-xs">
          {data.name?.[0] ?? '?'}
        </AvatarFallback>
      </Avatar>
      {showLabel && (
        <span className="text-sm">{data.name}</span>
      )}
    </div>
  );
}
```

三种尺寸的头像：
- small：20px
- medium：24px
- large：32px

### 31.5 UserProfile 用户详情卡片（351行）

UserProfile 是最复杂的用户组件，支持两种模式：简单模式和飞书原生卡片模式。

#### Props

```typescript
interface UserProfileProps {
  userId?: string;
  accountType?: 'apaas' | 'lark';    // 默认 'apaas'
}
```

#### 两种渲染模式

**简单模式**（useLarkCard=false）：

显示用户基本信息：头像、姓名、邮箱、用户类型、账号状态。

```tsx
function SimpleUserProfile({ userProfileInfo }) {
  return (
    <Card className="flex w-80 flex-col gap-0 overflow-hidden border-0 p-0">
      {/* 背景图 */}
      <div className="relative h-28 w-full">
        <img src={getAssetsUrl('/obj/eden-cn/lm-zhhwh/ljhwZthlaukjlkulzlp/ui/bg.png')}
          alt="cover" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      {/* 头像 */}
      <div className="-mt-12 flex justify-center">
        <Avatar className="size-24 border-4 border-background">
          <AvatarImage src={userProfileInfo.avatar} />
          <AvatarFallback className="text-2xl">{userProfileInfo.name?.[0]}</AvatarFallback>
        </Avatar>
      </div>
      {/* 姓名+状态 */}
      <div className="flex flex-col items-center gap-1 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{userProfileInfo.name}</span>
          {userProfileInfo.userType === '_employee' && <Badge>内部</Badge>}
          {userProfileInfo.userType === '_externalUser' && <Badge variant="outline">外部</Badge>}
        </div>
        {userProfileInfo.email && (
          <span className="text-sm text-muted-foreground">{userProfileInfo.email}</span>
        )}
        {userStatusText && <Badge variant="secondary">{userStatusText}</Badge>}
      </div>
    </Card>
  );
}
```

**飞书原生卡片模式**（useLarkCard=true）：

使用飞书 H5 JS SDK 渲染原生用户名片卡片。

```typescript
async function renderLarkProfile({ larkAppID, jsAPITicket, larkOpenID, cardRef, targetLarkOpenID }) {
  const timestamp = Date.now().toString();
  const nonceStr = generateRandomString(10);
  const url = globalThis.location.href.split('#')[0];
  const message = `jsapi_ticket=${jsAPITicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  const signature = SHA1(message).toString();

  await globalThis.webComponent.config({
    openId: larkOpenID,
    signature,
    appId: larkAppID,
    timestamp,
    nonceStr,
    url,
    jsApiList: ['user_profile'],
    locale: ['zh_cn'],
  });

  await globalThis.webComponent.render('UserProfile', { openId: targetLarkOpenID }, cardRef.current);
}
```

飞书卡片渲染流程：
1. 生成随机 nonceStr
2. 使用 SHA1 签名算法生成 signature
3. 调用 `webComponent.config` 配置 SDK
4. 调用 `webComponent.render('UserProfile', { openId }, container)` 渲染卡片

#### 账号状态映射

```typescript
const ACCOUNT_STATUS = {
  UNSPECIFIED: 0,
  Inactive: 1,
  Active: 2,
  Disabled: 3,
  Terminated: 4,
};

const AccountStatusMap = {
  [ACCOUNT_STATUS.UNSPECIFIED]: '',
  [ACCOUNT_STATUS.Active]: '',
  [ACCOUNT_STATUS.Inactive]: '未激活',
  [ACCOUNT_STATUS.Disabled]: '已停用',
  [ACCOUNT_STATUS.Terminated]: '已注销',
};
```

#### 错误处理

```tsx
if (error) {
  return (
    <Card className="flex min-h-124 w-80 flex-col items-center justify-center gap-4 border-0 p-0">
      <ErrorImage />
      <div>
        <span className="text-sm">加载失败 请</span>
        <Button size="sm" variant="ghost" onClick={fetchData}>重试</Button>
      </div>
    </Card>
  );
}
```

错误状态显示错误图片 + 重试按钮，点击重试重新获取数据。

#### 加载状态

```tsx
if (loading) {
  return <Spinner className="size-8 animate-spin text-primary" />;
}
```

#### 飞书 SDK 按需加载

```typescript
const larkSdkUrl = 'https://lf3-cdn-tos.bytegoofy.com/obj/goofy/locl/lark/external_js_sdk/h5-js-sdk-1.2.21.js';
const scriptStatus = useExternalScript(larkSdkUrl, { onloadCallback: onAuthError });
```

`useExternalScript` Hook 动态加载飞书 H5 JS SDK，仅在 UserProfile 组件使用时加载，避免全局加载影响性能。

#### 鉴权错误处理

```typescript
const onAuthError = useCallback(() => {
  globalThis.webComponent.onAuthError(function(error: Error) {
    const errorMessage = JSON.parse(error.message);
    if (errorMessage?.msg?.code === 20442 && errorMessage?.msg?.msg === 'jsapi-ticket not exist') {
      globalThis.location.replace(redirectURLRef.current);
    }
  });
}, []);
```

当 jsapi-ticket 过期时，自动重定向到 redirectURL 重新鉴权。

### 31.6 API 服务层

#### 用户搜索 API

```typescript
// api/users/service.ts
export async function searchUsers(params: { query: string; pageSize?: number }) {
  return axiosForBackend.get('/api/users/search', { params });
}
```

#### 用户详情 API

```typescript
// api/user-profiles/service.ts
export async function fetchUserProfile(userId: string, accountType: string, signal?: AbortSignal) {
  return axiosForBackend.get(`/api/user-profiles/${userId}`, {
    params: { account_type: accountType },
    signal,
  });
}
```

#### 部门搜索 API

```typescript
// api/departments/service.ts
export async function searchDepartments(params: { query: string; pageSize?: number }) {
  return axiosForBackend.get('/api/departments/search', { params });
}
```

#### 资源 URL

```typescript
export function getAssetsUrl(path: string): string {
  return `https://lf3-cdn-tos.bytegoofy.com${path}`;
}
```

### 31.7 使用场景

| 场景 | 组件 | 配置 |
|------|------|------|
| 来货登记选客户负责人 | UserSelect | `multiple={false} valueType="string"` |
| 权限管理选用户 | UserSelect | `multiple={true} valueType="string"` |
| 操作日志展示操作人 | UserDisplay | `size="small" showLabel={true}` |
| 客户详情展示联系人 | UserDisplay | `size="medium"` |
| 用户头像悬浮查看详情 | UserDisplay + UserProfile | 默认行为（点击弹出卡片） |
| 审批流程选择审批人 | UserSelect | `multiple={true} valueType="object"` |

### 31.8 导出清单

```typescript
// UserSelect
export { UserSelect };
export { type User as UserValue, type UserInfo as User };
export { ItemPill };

// UserDisplay
export { UserDisplay };
export type { IUserProfile };

// UserProfile
export { UserProfile };
```


---

## 第32章 Business-UI Tiptap 富文本编辑器

### 32.1 系统架构

Tiptap 富文本编辑器基于 Tiptap v2 + React 构建，提供完整的文本格式化、列表、代码块、图片上传、附件、链接等富文本编辑功能。

| 目录 | 文件数 | 总行数 | 职责 |
|------|--------|--------|------|
| 根目录 | 3 | ~350 | 编辑器核心组件 |
| components/ | 13 | ~800 | 工具栏按钮组件 |
| extensions/ | 4 | ~1,400 | Tiptap 扩展 |
| hooks/ | 1 | ~100 | 编辑器 Hook |
| 总计 | 21 | ~3,291 | |

#### 文件清单

| 文件 | 行数 | 职责 |
|------|------|------|
| `tiptap-editor-complete.tsx` | 112 | 开箱即用的完整编辑器（预配置工具栏） |
| `tiptap-editor.tsx` | ~200 | 编辑器核心（Provider+Toolbar+Content） |
| `index.ts` | 10 | 桶导出 |
| `hooks/use-tiptap-editor.ts` | ~100 | useEditor Hook 封装 |
| `extensions/complete-kit.ts` | ~80 | 扩展集合（StarterKit+自定义扩展） |
| `extensions/attachment.tsx` | 539 | 附件扩展 |
| `extensions/image.tsx` | 456 | 图片扩展（上传+预览+调整大小） |
| `extensions/code-block-shiki.tsx` | 236 | 代码块扩展（Shiki 语法高亮） |
| `components/undo-redo-toolbar-button.tsx` | 54 | 撤销/重做 |
| `components/heading-toolbar-button.tsx` | ~60 | 标题（H1-H6） |
| `components/mark-toolbar-button.tsx` | ~60 | 文本标记（粗体/斜体/下划线/删除线/代码） |
| `components/list-toolbar-button.tsx` | ~60 | 列表（无序/有序/任务） |
| `components/text-align-toolbar-button.tsx` | ~60 | 文本对齐 |
| `components/link-toolbar-button.tsx` | ~80 | 链接 |
| `components/color-highlight-toolbar-button.tsx` | ~80 | 颜色/高亮 |
| `components/code-block-toolbar-button.tsx` | ~50 | 代码块 |
| `components/blockquote-toolbar-button.tsx` | ~50 | 引用 |
| `components/horizontal-rule-toolbar-button.tsx` | ~40 | 水平分割线 |
| `components/image-upload-toolbar-button.tsx` | ~80 | 图片上传 |
| `components/attachment-toolbar-button.tsx` | ~60 | 附件 |
| `components/link-edit-form.tsx` | ~80 | 链接编辑表单 |
| `components/link-hover-toolbar.tsx` | ~60 | 链接悬浮工具栏 |

### 32.2 TiptapEditorComplete 组件

#### Props

```typescript
interface TiptapEditorCompleteProps extends Omit<TiptapEditorProps, 'extensions'> {
  placeholder?: string;
}
```

继承 `TiptapEditorProps`，移除 `extensions`（由内部配置），添加 `placeholder`。

#### 默认工具栏配置

```tsx
function DefaultToolbar() {
  return (
    <TiptapEditorToolbar>
      <UndoRedoToolbarButton action="undo" />
      <UndoRedoToolbarButton action="redo" />
      <TiptapEditorToolbarSeparator />

      <HeadingToolbarButton level={1} />
      <HeadingToolbarButton level={2} />
      <HeadingToolbarButton level={3} />
      <TiptapEditorToolbarSeparator />

      <MarkToolbarButton type="bold" />
      <MarkToolbarButton type="italic" />
      <MarkToolbarButton type="underline" />
      <MarkToolbarButton type="strike" />
      <MarkToolbarButton type="code" />
      <TiptapEditorToolbarSeparator />

      <ColorHighlightToolbarButton type="color" />
      <ColorHighlightToolbarButton type="highlight" />
      <TiptapEditorToolbarSeparator />

      <ListToolbarButton type="bulletList" />
      <ListToolbarButton type="orderedList" />
      <ListToolbarButton type="taskList" />
      <TiptapEditorToolbarSeparator />

      <TextAlignToolbarButton align="left" />
      <TextAlignToolbarButton align="center" />
      <TextAlignToolbarButton align="right" />
      <TiptapEditorToolbarSeparator />

      <LinkToolbarButton />
      <ImageUploadToolbarButton />
      <AttachmentToolbarButton />
      <CodeBlockToolbarButton />
      <BlockquoteToolbarButton />
      <HorizontalRuleToolbarButton />
    </TiptapEditorToolbar>
  );
}
```

工具栏分组：
1. **撤销/重做**：Undo、Redo
2. **标题**：H1、H2、H3
3. **文本标记**：Bold、Italic、Underline、Strike、Code
4. **颜色**：文字颜色、背景高亮
5. **列表**：无序列表、有序列表、任务列表
6. **对齐**：左对齐、居中、右对齐
7. **插入**：链接、图片、附件、代码块、引用、水平线

### 32.3 TiptapEditor 核心组件

#### 组件结构

```tsx
function TiptapEditor({ className, extensions, value, onValueChange, children, ...props }) {
  return (
    <EditorProvider extensions={extensions} content={value} onUpdate={({ editor }) => onValueChange?.(editor.getHTML())} {...props}>
      <div className={cn('flex flex-col rounded-md border border-input', className)}>
        {children}
      </div>
    </EditorProvider>
  );
}
```

子组件：
- `TiptapEditorToolbar` — 工具栏容器（sticky top-0 z-10）
- `TiptapEditorToolbarSeparator` — 工具栏分隔线
- `TiptapEditorContent` — 编辑区域（prose 样式）

#### 受控模式

```typescript
interface TiptapEditorProps {
  value?: string;                    // HTML 内容
  onValueChange?: (html: string) => void;
  extensions?: Extensions;          // Tiptap 扩展配置
  editable?: boolean;                // 是否可编辑
  className?: string;
  ariaInvalid?: boolean;             // 校验失败样式
  ariaDisabled?: boolean;            // 禁用样式
  children?: ReactNode;
}
```

`value` 为 HTML 字符串，通过 `onValueChange` 回调输出 HTML。

### 32.4 CompleteKit 扩展集合

```typescript
export const CompleteKit = StarterKit.configure({
  heading: { levels: [1, 2, 3, 4, 5, 6] },
  codeBlock: false,  // 禁用默认代码块，使用 Shiki 扩展
  link: {
    openOnClick: false,
    HTMLAttributes: { class: 'text-primary underline underline-offset-2' },
  },
  placeholder: { placeholder: '在此输入...' },
});
```

StarterKit 包含的扩展：
- Document、Paragraph、Text（基础节点）
- Heading（标题 H1-H6）
- Bold、Italic、Strike、Code（文本标记）
- BulletList、OrderedList、ListItem（列表）
- Blockquote（引用）
- HorizontalRule（水平线）
- HardBreak（换行）
- History（撤销/重做）

额外配置：
- `codeBlock: false` — 禁用默认代码块，使用 CodeBlockShiki 扩展
- `link` — 链接扩展，不自定义打开链接
- `placeholder` — 占位符文本
- `Underline` — 下划线扩展
- `TaskList`/`TaskItem` — 任务列表扩展
- `TextStyle` — 文本样式（颜色）
- `Highlight` — 高亮扩展
- `Color` — 文字颜色扩展
- `TextAlign` — 文本对齐扩展
- `ImageUpload` — 自定义图片上传扩展
- `AttachmentExt` — 自定义附件扩展
- `CodeBlockShiki` — 代码块扩展（Shiki 语法高亮）

### 32.5 图片扩展（image.tsx，456行）

图片扩展是系统中最复杂的扩展，实现图片上传、预览、调整大小等功能。

#### 功能

1. **上传**：通过 dataloom SDK 上传图片到云存储
2. **拖拽插入**：支持拖拽图片文件到编辑器
3. **粘贴插入**：支持粘贴图片
4. **调整大小**：拖拽手柄调整图片尺寸
5. **对齐**：左/中/右对齐
6. **删除**：删除图片节点

#### NodeView 组件

```tsx
const ImageView = ({ node, updateAttributes, deleteNode, selected, extension }) => {
  const [resizing, setResizing] = useState(false);
  const [size, setSize] = useState({ width: node.attrs.width, height: node.attrs.height });

  const handleResize = (e, direction) => {
    // 计算新尺寸
    const newWidth = ...;
    const newHeight = ...;
    setSize({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    updateAttributes({ width: size.width, height: size.height });
    setResizing(false);
  };

  return (
    <NodeViewWrapper className="relative inline-block" style={{ width: size.width }}>
      <img src={node.attrs.src} alt={node.attrs.alt} style={{ width: size.width, height: size.height }} />
      {selected && (
        <>
          {/* 调整大小手柄 */}
          <div className="resize-handle" onMouseDown={...} />
          {/* 对齐按钮 */}
          <div className="align-buttons">
            <button onClick={() => updateAttributes({ textAlign: 'left' })}>Left</button>
            <button onClick={() => updateAttributes({ textAlign: 'center' })}>Center</button>
            <button onClick={() => updateAttributes({ textAlign: 'right' })}>Right</button>
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
};
```

### 32.6 附件扩展（attachment.tsx，539行）

#### 功能

1. **上传附件**：通过 dataloom SDK 上传文件
2. **显示附件卡片**：文件名、大小、类型图标
3. **下载链接**：点击下载
4. **删除附件**：删除节点

#### NodeSchema

```typescript
const AttachmentNode = Node.create({
  name: 'attachment',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      fileName: { default: '' },
      fileSize: { default: 0 },
      fileType: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-attachment]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-attachment': '' })];
  },

  renderText({ node }) {
    return `[附件: ${node.attrs.fileName}]`;
  },
});
```

### 32.7 代码块扩展（code-block-shiki.tsx，236行）

使用 Shiki 实现代码语法高亮，替代 Tiptap 默认的 lowlight 方案。

```typescript
const CodeBlockShiki = CodeBlockLowlight.extend({
  addOptions() {
    return {
      defaultLanguage: 'plaintext',
      ...this.parent?.(),
    };
  },
}).configure({
  defaultLanguage: 'typescript',
});
```

Shiki 优势：
- 高质量语法高亮（VS Code 同款）
- 支持 100+ 语言
- 主题可定制
- 异步加载语言定义

### 32.8 工具栏按钮组件

所有工具栏按钮遵循相同的模式：

```tsx
export function MarkToolbarButton({ type, ...props }) {
  const { editor } = useTiptapEditor();

  if (!editor) return null;

  const isActive = editor.isActive(type);
  const Icon = markIcons[type]; // Bold, Italic, Underline, etc.

  return (
    <TiptapToolbarButton
      isActive={isActive}
      onClick={() => editor.chain().focus().toggleMark(type).run()}
      disabled={!editor.can().toggleMark(type)}
      {...props}
    >
      <Icon className="size-4" />
    </TiptapToolbarButton>
  );
}
```

| 按钮 | 类型 | Tiptap 命令 |
|------|------|------------|
| Bold | mark | `toggleMark('bold')` |
| Italic | mark | `toggleMark('italic')` |
| Underline | mark | `toggleMark('underline')` |
| Strike | mark | `toggleMark('strike')` |
| Code | mark | `toggleMark('code')` |
| H1-H6 | node | `toggleHeading({ level: N })` |
| BulletList | node | `toggleBulletList()` |
| OrderedList | node | `toggleOrderedList()` |
| TaskList | node | `toggleTaskList()` |
| TextAlign | align | `setTextAlign('left/center/right')` |
| Link | link | `setLink({ href })` / `unsetLink()` |
| CodeBlock | node | `toggleCodeBlock()` |
| Blockquote | node | `toggleBlockquote()` |
| HorizontalRule | node | `setHorizontalRule()` |

### 32.9 useTiptapEditor Hook

```typescript
export function useTiptapEditor() {
  const editor = useEditorContext();

  if (!editor) {
    throw new Error('useTiptapEditor must be used within TiptapEditor');
  }

  return { editor };
}
```

提供对 Tiptap 编辑器实例的访问，用于工具栏按钮和其他子组件。

### 32.10 使用示例

```tsx
function RichTextEditor({ value, onChange, placeholder, invalid, disabled }) {
  return (
    <TiptapEditorComplete
      value={value}
      onValueChange={onChange}
      placeholder={placeholder || '请输入...'}
      aria-invalid={invalid}
      aria-disabled={disabled}
    />
  );
}
```

### 32.11 导出清单

```typescript
export { TiptapEditorComplete };
export { TiptapEditor, TiptapEditorContent, TiptapEditorToolbar, TiptapEditorToolbarSeparator };
export { useTiptapEditor };
export { CompleteKit };
export type { TiptapEditorCompleteProps, TiptapEditorProps };
```


---

## 第33章 Business-UI Department Select 部门选择器

### 33.1 系统架构

部门选择器基于 EntityCombobox 底层组件实现，与 UserSelect 结构类似，但搜索的是部门数据而非用户数据。

| 文件 | 行数 | 职责 |
|------|------|------|
| `department-select.tsx` | 168 | 根组件，数据获取+BaseCombobox 配置 |
| `department-item.tsx` | ~60 | 部门列表项组件 |
| `department-select-tag.tsx` | ~50 | 多选标签组件 |
| `department-select-field.tsx` | ~80 | 表单字段封装 |
| `icon-department.tsx` | ~40 | 部门图标 |
| `types.ts` | ~50 | 类型定义 |
| `utils.ts` | ~30 | 工具函数 |
| `index.tsx` | ~10 | 桶导出 |

### 33.2 类型定义

```typescript
interface Department {
  id: string;          // 部门ID
  name: string;        // 部门名称
  parentId?: string;   // 父部门ID
  avatar?: string;     // 部门图标URL
}

interface DepartmentSelectProps extends BaseEntitySelectProps<Department> {
  // 继承所有 BaseEntitySelectProps 属性
}
```

### 33.3 数据获取

```typescript
function createDepartmentsFetcher(pageSize = 100) {
  return async (search: string) => {
    const response = await searchDepartments({ query: search, pageSize });
    const departmentList = response?.data?.departmentList || [];

    return {
      items: departmentList.map(departmentInfoToDepartment),
    };
  };
}
```

`searchDepartments` 调用后端 `/api/departments/search` 接口，返回部门列表。`departmentInfoToDepartment` 将 API 返回的原始部门信息转换为 `Department` 类型。

### 33.4 组件实现

```typescript
export const DepartmentSelect = (props: DepartmentSelectProps) => {
  const {
    size = 'medium',
    triggerType = 'button',
    multiple,
    value,
    defaultValue,
    onChange,
    placeholder = '请选择部门',
    emptyText = '没有匹配结果，换个关键词试试吧',
    ...
  } = props;

  const fetchFn = useMemo(() => createDepartmentsFetcher(), []);

  return (
    <BaseCombobox
      fetchFn={fetchFn}
      getItemValue={(dept) => dept}
      getItemLabel={(dept) => dept.name}
      renderItem={(dept, isSelected, className, disabled) => (
        <DepartmentItemWrapper
          key={dept.id}
          departmentValue={dept}
          isSelected={isSelected}
          className={className}
          disabled={disabled}
        />
      )}
      renderTag={(dept, onClose, tagDisabled) => (
        <DepartmentSelectTagWrapper
          key={dept.id}
          departmentValue={dept}
          onClose={onClose}
          disabled={tagDisabled}
        />
      )}
      showSearch
      debounce={300}
      placeholder={placeholder}
      emptyText={emptyText}
      {...props}
    />
  );
};
```

与 UserSelect 的区别：
1. 不需要 `valueType` 转换（部门 ID 直接使用）
2. 不需要 `accountType`（部门只有一种来源）
3. 不需要 `useUserValue`（无需根据 ID 异步查询部门信息）
4. 部门列表项使用部门图标而非头像

### 33.5 DepartmentItem 列表项

```tsx
function DepartmentItem({ departmentValue, isSelected, className, size, searchKeyword, disabled }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-2 transition-colors',
        sizeClasses[size],
        isSelected && 'bg-primary/10',
        disabled && 'opacity-50',
        !disabled && 'hover:bg-muted cursor-pointer',
      )}
      onClick={() => !disabled && handleSelect(departmentValue)}
    >
      <IconDepartment className="size-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <HighlightText text={departmentValue.name} keyword={searchKeyword} />
      </div>
      {isSelected && <Check className="size-4 text-primary" />}
    </div>
  );
}
```

### 33.6 DepartmentSelectTag 多选标签

```tsx
function DepartmentSelectTag({ departmentValue, onClose, size, disabled }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
      <IconDepartment className="size-3 text-muted-foreground" />
      <span className="max-w-24 truncate">{departmentValue.name}</span>
      {!disabled && (
        <button onClick={(e) => onClose(departmentValue, e)} className="rounded-sm hover:bg-foreground/10">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
```

### 33.7 DepartmentSelectField 表单字段

```tsx
function DepartmentSelectField({ field, label, required, description, ...fieldProps }) {
  return (
    <FieldLayout label={label} required={required} description={description}
      name={field.name}
      isInvalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
      errorMessage={field.state.meta.errors[0]?.message}
    >
      <DepartmentSelect
        value={field.state.value}
        onChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur()}
        {...fieldProps}
      />
    </FieldLayout>
  );
}
```

集成到 TanStack Form 系统，支持表单验证和错误显示。

### 33.8 使用场景

| 场景 | 配置 |
|------|------|
| 来货登记选择客户所属部门 | `multiple={false}` |
| 权限管理按部门分配权限 | `multiple={true}` |
| 统计报表按部门筛选 | `triggerType="search"` |

### 33.9 导出清单

```typescript
export { DepartmentSelect };
export { DepartmentSelectField };
export { IconDepartment };
export type { Department, DepartmentInfo, DepartmentSelectProps };
```


---

## 第34章 Shadcn/UI 组件库完整参考

### 34.1 概述

热处理收发货管理系统使用 shadcn/ui 作为基础 UI 组件库。shadcn/ui 不是传统的 npm 包，而是一套可复制、可定制、可拥有的组件代码集合。所有组件源码位于 `client/src/components/ui/` 目录下。

#### 组件统计

| 类别 | 组件数 | 用途 |
|------|--------|------|
| 基础元素 | 15 | Button, Input, Label, Badge, Avatar, Separator 等 |
| 表单控件 | 12 | Select, Checkbox, RadioGroup, Switch, Slider, Textarea 等 |
| 布局容器 | 8 | Card, Tabs, Accordion, Collapsible, Resizable 等 |
| 反馈层 | 7 | Dialog, Sheet, Drawer, Popover, Tooltip, Toast 等 |
| 导航 | 6 | Pagination, Breadcrumb, NavigationMenu, Menubar 等 |
| 数据展示 | 8 | Table, Chart, Progress, Skeleton, Carousel 等 |
| 特殊组件 | 6 | Filter, Form, Command, Streamdown, Image, Kbd 等 |
| 图标 | 22 | 文件类型彩色图标 |
| **总计** | **84** | |

### 34.2 基础元素组件

#### Button（button.tsx）

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
  }
);
```

6种变体 + 4种尺寸。系统主操作用 `default`，危险操作用 `destructive`，次要操作用 `outline`，工具栏用 `ghost`。

#### Input（input.tsx）

```tsx
<input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
```

支持 `type` 属性：text, number, email, password, tel, url, search。

#### Badge（badge.tsx）

```typescript
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-success/10 text-success',
        warning: 'border-transparent bg-warning/10 text-warning',
        error: 'border-transparent bg-error/10 text-error',
      },
    },
  }
);
```

7种变体，包含系统自定义的 success/warning/error 语义颜色。

#### Avatar（avatar.tsx）

```tsx
<Avatar>
  <AvatarImage src={url} />
  <AvatarFallback>{name[0]}</AvatarFallback>
</Avatar>
```

基于 Radix Avatar，图片加载失败时显示首字母回退。

#### Separator（separator.tsx）

```tsx
<Separator orientation="horizontal" className="my-4" />
```

水平/垂直分割线。

### 34.3 表单控件组件

#### Select（select.tsx）

基于 Radix Select，包含 Select/SelectTrigger/SelectContent/SelectItem/SelectValue/SelectGroup/SelectLabel 等子组件。

```tsx
<Select value={value} onValueChange={onChange}>
  <SelectTrigger>
    <SelectValue placeholder="请选择..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">选项1</SelectItem>
    <SelectItem value="option2">选项2</SelectItem>
  </SelectContent>
</Select>
```

#### Checkbox（checkbox.tsx）

基于 Radix Checkbox，支持 checked/unchecked/indeterminate 三态。

#### RadioGroup（radio-group.tsx）

基于 Radix RadioGroup，包含 RadioGroup/RadioGroupItem 子组件。

#### Switch（switch.tsx）

基于 Radix Switch，开关切换组件。

#### Slider（slider.tsx）

基于 Radix Slider，范围滑块。

#### Textarea（textarea.tsx）

多行文本输入框，支持 rows 和 resize 属性。

#### Calendar（calendar.tsx）

基于 react-day-picker，日历选择器。支持 single/range 两种模式。

#### InputOTP（input-otp.tsx）

OTP 验证码输入组件，基于 input-otp。

#### InputGroup（input-group.tsx）

输入组容器，包含 InputGroup/InputGroupText 子组件，支持前缀/后缀。

#### Field（field.tsx）

表单字段布局组件，包含 Field/FieldLabel/FieldContent/FieldDescription/FieldError/FieldGroup 子组件。business-ui Form 系统基于此组件构建。

#### Form（form.tsx）

基于 TanStack Form 的表单组件，提供 FormField/FormLabel/FormControl/FormDescription/FormMessage 等。

### 34.4 布局容器组件

#### Card（card.tsx）

```tsx
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>内容</CardContent>
  <CardFooter>底部</CardFooter>
</Card>
```

#### Tabs（tabs.tsx）

基于 Radix Tabs，标签页切换。

#### Accordion（accordion.tsx）

基于 Radix Accordion，手风琴展开收起。

#### Collapsible（collapsible.tsx）

基于 Radix Collapsible，折叠展开。

#### Resizable（resizable.tsx）

基于 react-resizable-panels，可调整面板大小。

#### ScrollArea（scroll-area.tsx）

基于 Radix ScrollArea，自定义滚动条样式。

#### AspectRatio（aspect-ratio.tsx）

基于 Radix Aspect Ratio，保持宽高比。

#### Sheet（sheet.tsx）

基于 Radix Dialog，侧边抽屉面板。支持 top/right/bottom/left 四个方向。

### 34.5 反馈层组件

#### Dialog（dialog.tsx）

基于 Radix Dialog，模态对话框。

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>打开</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogHeader>
    {/* 内容 */}
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>取消</Button>
      <Button onClick={onConfirm}>确认</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Drawer（drawer.tsx）

基于 Vaul Drawer，移动端优化的底部抽屉。

#### Popover（popover.tsx）

基于 Radix Popover，弹出层。

```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild><Button>触发</Button></PopoverTrigger>
  <PopoverContent align="start" sideOffset={4}>
    内容
  </PopoverContent>
</Popover>
```

#### Tooltip（tooltip.tsx）

基于 Radix Tooltip，悬浮提示。

#### Sonner（sonner.tsx）

基于 Sonner，Toast 通知。

```tsx
import { toast } from 'sonner';
toast.success('保存成功');
toast.error('保存失败');
toast.warning('库存不足');
toast.loading('加载中...');
```

#### Alert（alert.tsx）

页面级警告提示。支持 default/destructive/warning 三种变体。

#### AlertDialog（alert-dialog.tsx）

基于 Radix AlertDialog，确认对话框。与 Dialog 区别：AlertDialog 不允许点击外部关闭，必须选择"确认"或"取消"。

### 34.6 导航组件

#### Pagination（pagination.tsx）

分页器，包含上一页/下一页按钮和页码。

#### Breadcrumb（breadcrumb.tsx）

面包屑导航。

#### NavigationMenu（navigation-menu.tsx）

基于 Radix NavigationMenu，顶部导航菜单。

#### Menubar（menubar.tsx）

基于 Radix Menubar，菜单栏。

#### DropdownMenu（dropdown-menu.tsx）

基于 Radix DropdownMenu，下拉菜单。包含 DropdownMenu/DropdownMenuTrigger/DropdownMenuContent/DropdownMenuItem/DropdownMenuSeparator/DropdownMenuLabel/DropdownMenuGroup/DropdownMenuCheckboxItem 等子组件。

#### ContextMenu（context-menu.tsx）

基于 Radix ContextMenu，右键上下文菜单。

### 34.7 数据展示组件

#### Table（table.tsx）

HTML 表格组件，包含 Table/TableHeader/TableBody/TableFooter/TableRow/TableHead/TableCell 子组件。

#### Chart（chart.tsx）

基于 ReactECharts 的图表容器组件。

#### Progress（progress.tsx）

基于 Radix Progress，进度条。

#### Skeleton（skeleton.tsx）

骨架屏加载占位。

#### Carousel（carousel.tsx）

基于 Embla Carousel，轮播组件。

#### HoverCard（hover-card.tsx）

基于 Radix HoverCard，悬浮卡片。

#### Empty（empty.tsx）

空状态组件，显示图标+文本+操作按钮。

#### Spinner（spinner.tsx）

加载旋转图标。

### 34.8 特殊组件

#### Filter（filter.tsx）

通用筛选器系统（第28章已详细描述）。

#### Form（form.tsx）

TanStack Form 集成（第30章已详细描述）。

#### Command（command.tsx）

基于 cmdk 的命令面板/搜索列表。用于 SelectContent 和 FilterSelectContent。

#### Streamdown（streamdown.tsx）

Markdown 流式渲染组件，内置 prose 排版。用于 AI 回复、富文本展示。

#### Image（image.tsx）

图片组件，替代原生 `<img>`。支持响应式 sizes、固定 width、loading 状态、错误回退。

#### Kbd（kbd.tsx）

键盘按键展示组件，用于快捷键提示。

#### Toggle / ToggleGroup（toggle.tsx）

基于 Radix Toggle/ToggleGroup，切换按钮和按钮组。

### 34.9 文件图标系统（icons/）

22个文件类型彩色图标，用于附件展示：

| 图标 | 文件类型 |
|------|---------|
| file-ae-colorful-icon | After Effects |
| file-ai-colorful-icon | Illustrator |
| file-android-colorful-icon | Android |
| file-audio-colorful-icon | 音频 |
| file-code-colorful-icon | 代码 |
| file-csv-colorful-icon | CSV |
| file-eml-colorful-icon | 邮件 |
| file-ios-colorful-icon | iOS |
| file-keynote-colorful-icon | Keynote |
| file-pages-colorful-icon | Pages |
| file-ps-colorful-icon | Photoshop |
| file-sketch-colorful-icon | Sketch |
| file-slide-colorful-icon | 幻灯片 |
| file-vcf-colorful-icon | 联系人 |
| file-wiki-excel-colorful-icon | Excel |
| file-wiki-image-colorful-icon | 图片 |
| file-wiki-pdf-colorful-icon | PDF |
| file-wiki-ppt-colorful-icon | PowerPoint |
| file-wiki-text-colorful-icon | 文本 |
| file-wiki-unknown-colorful-icon | 未知 |
| file-wiki-video-colorful-icon | 视频 |
| file-wiki-word-colorful-icon | Word |

### 34.10 样式约定

所有 shadcn/ui 组件遵循以下样式约定：

1. **CSS 变量**：使用 `tailwind-theme.css` 中定义的 CSS 变量（如 `bg-primary`、`text-foreground`），禁止硬编码颜色值
2. **cva 变体**：使用 `class-variance-authority` 定义变体和尺寸
3. **cn 工具**：使用 `cn()` 合并类名，支持 Tailwind merge
4. **forwardRef**：所有组件使用 `React.forwardRef` 转发 ref
5. **asChild**：支持 Radix `asChild` 模式，允许自定义渲染元素
6. **data-slot**：使用 `data-slot` 属性标记组件内部元素，便于 CSS 选择器定位

### 34.11 使用规范

1. **优先使用已有组件**：开发新功能前先检查 `client/src/components/ui/` 是否已有对应组件
2. **查看 README**：`client/src/components/ui/README.md` 包含组件使用说明
3. **禁止原生元素**：禁止使用原生 `<input>`/`<textarea>`/`<select>`，必须用 shadcn 组件
4. **Props 值从联合类型选取**：如 Button variant 必须从实际联合类型中选取，不确定时看源码
5. **版本锁定**：所有组件已安装，无需额外安装
6. **按需导入**：从 `@/components/ui/xxx` 导入，不使用全局注册


---

## 第35章 共享工具函数与 Hooks 完整参考

### 35.1 工具函数体系

系统在 `client/src/utils/` 和 `server/common/utils/` 目录下维护了大量工具函数，覆盖格式化、校验、数据转换等场景。

#### client/src/utils/

| 文件 | 行数 | 职责 |
|------|------|------|
| `config.ts` | — | 已移除（应用初始化逻辑已分散到各模块中） |
| `img-resources/avatar-placeholders.ts` | ~40 | 头像占位图 URL 数组 |
| `cn.ts` | ~10 | className 合并工具（clsx + tailwind-merge） |

#### server/common/utils/

| 文件 | 行数 | 职责 |
|------|------|------|
| `format.ts` | ~120 | 日期/金额/数量格式化 |
| `validators.ts` | ~80 | 业务校验函数 |
| `converters.ts` | ~60 | 数据类型转换 |

### 35.2 cn — className 合并

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**用途**：合并多个 className，自动解决 Tailwind 冲突（后者覆盖前者）。

```tsx
// 示例
<div className={cn('px-2 py-1', isActive && 'bg-primary text-white', className)} />
// 如果 className 传入 'px-4'，最终结果为 'py-1 bg-primary text-white px-4'
// twMerge 自动保留后写的 px-4，覆盖前面的 px-2
```

### 35.3 格式化工具

```typescript
// 金额格式化：1234.5 → "¥1,234.50"
export function formatCurrency(amount: number, currency = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// 数量格式化：1234.5 → "1,234.5"
export function formatQuantity(qty: number, decimals = 1): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(qty);
}

// 日期格式化
export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  const d = dayjs(date);
  return d.format(format);
}

// 相对时间：3小时前
export function formatRelativeTime(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return formatDate(date);
}

// 百分比：0.856 → "85.6%"
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// 文件大小：1024 → "1.0 KB"
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }
  return `${bytes.toFixed(1)} ${units[unitIndex]}`;
}
```

### 35.4 校验工具

```typescript
// 手机号校验
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 邮箱校验
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 统一社会信用代码校验
export function isValidUSCC(code: string): boolean {
  return /^[0-9A-HJ-NPQRTUWXY]{18}$/.test(code);
}

// 身份证号校验（基本格式）
export function isValidIDCard(id: string): boolean {
  return /^\d{17}[\dXx]$/.test(id);
}

// 金额校验（正数，最多2位小数）
export function isValidAmount(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value) && parseFloat(value) > 0;
}

// 数量校验（正数，最多3位小数）
export function isValidQuantity(value: string): boolean {
  return /^\d+(\.\d{1,3})?$/.test(value) && parseFloat(value) > 0;
}
```

### 35.5 数据转换工具

```typescript
// 分页参数转换
export function toPageParams(page: number, pageSize: number) {
  return {
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}

// 查询参数序列化（数组→逗号分隔）
export function serializeQueryParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      searchParams.set(key, value.join(','));
    } else {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

// 颜色 HSL 转 hex
export function hslToHex(h: number, s: number, l: number): string {
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
```

### 35.6 前端自定义 Hooks

#### useDebounce

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

#### useLocalStorage

```typescript
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStored(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [stored, setValue];
}
```

#### useMediaQuery

```typescript
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

#### useInfiniteScroll

```typescript
function useInfiniteScroll(callback: () => void, options?: { threshold?: number; enabled?: boolean }) {
  const { threshold = 200, enabled = true } = options || {};
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { rootMargin: `${threshold}px` }
    );
    if (targetRef.current) observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [callback, threshold, enabled]);

  return targetRef;
}
```

#### useDownload

```typescript
function useDownload() {
  return useCallback(async (url: string, filename?: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, []);
}
```

#### useClipboard

```typescript
function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  return { copied, copy };
}
```

#### usePagination

```typescript
function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const total = Math.ceil(items.length / pageSize);
  const currentItems = items.slice((page - 1) * pageSize, page * pageSize);

  return {
    page,
    pageSize,
    total,
    currentItems,
    hasNext: page < total,
    hasPrev: page > 1,
    next: () => setPage((p) => Math.min(p + 1, total)),
    prev: () => setPage((p) => Math.max(p - 1, 1)),
    setPage,
  };
}
```

#### useTableSort

```typescript
function useTableSort<T>(data: T[], initialField?: keyof T) {
  const [sortField, setSortField] = useState<keyof T | undefined>(initialField);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDir]);

  const toggleSort = (field: keyof T) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return { sortedData, sortField, sortDir, toggleSort };
}
```

### 35.7 常量定义

#### client/src/utils/constants.ts

```typescript
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const DEBOUNCE_DELAY = {
  search: 300,
  autoSave: 2000,
  resize: 100,
} as const;

export const STORAGE_KEYS = {
  USER_INFO: '__global_heat_user_info',
  CUSTOMER_LIST: '__global_heat_customer_list',
  PRODUCT_LIST: '__global_heat_product_list',
  PRINT_TEMPLATES: '__global_heat_print_templates',
  ORG_CODE: '__global_heat_org_code',
} as const;

export const ROUTES = {
  DASHBOARD: '/',
  INBOUND: '/inbound',
  OUTBOUND: '/outbound',
  INVENTORY: '/inventory',
  RECONCILIATION: '/reconciliation',
  STATISTICS: '/statistics',
  CUSTOMERS: '/customers',
  PRODUCTS: '/products',
  TEMPLATES: '/settings/templates',
  PERMISSIONS: '/settings/permissions',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const RECONCILIATION_STATUS = {
  UNMATCHED: 'unmatched',
  MATCHED: 'matched',
  DISPUTED: 'disputed',
  RESOLVED: 'resolved',
} as const;
```

### 35.8 上下文（Context）

#### TenantContext

```typescript
interface TenantContextValue {
  orgCode: string | null;
  orgName: string | null;
  setOrgCode: (code: string) => void;
  clearOrgCode: () => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
```

#### AuthContext

```typescript
interface AuthContextValue {
  user: UserInfo | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (perm: string) => boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

#### ThemeContext

```typescript
interface ThemeContextValue {
  theme: 'light';
  setTheme: (theme: 'light') => void;
}

// 系统仅支持浅色主题，ThemeContext 为预留扩展
```

### 35.9 服务端通用常量

#### server/common/constants/

```typescript
export const ERROR_CODES = {
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_DB_CONNECTION_FAILED: 'TENANT_DB_CONNECTION_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CONFLICT: 'CONFLICT',
} as const;

export const TENANT_HEADER = 'X-Organization-Code';
export const DEFAULT_DB_PORT = 5432;
export const DB_POOL_SIZE = 10;
export const DB_POOL_IDLE_TIMEOUT = 30000;
```

### 35.10 服务端通用工具

#### server/common/utils/

```typescript
// 生成租户数据库名
export function getTenantDbName(orgCode: string): string {
  return `db_tenant_${orgCode}`;
}

// 生成租户数据库配置
export function getTenantDbConfig(org: Organization) {
  return {
    host: org.dbHost,
    port: org.dbPort || DEFAULT_DB_PORT,
    user: org.dbUser,
    password: org.dbPassword,
    database: getTenantDbName(org.orgCode),
  };
}

// 分页参数校验
export function validatePagination(page?: string, pageSize?: string) {
  const p = page ? parseInt(page, 10) : 1;
  const ps = pageSize ? parseInt(pageSize, 10) : DEFAULT_PAGE_SIZE;
  if (p < 1) throw new BadRequestException('页码必须大于0');
  if (ps < 1 || ps > MAX_PAGE_SIZE) throw new BadRequestException(`每页条数必须在1-${MAX_PAGE_SIZE}之间`);
  return { page: p, pageSize: ps, offset: (p - 1) * ps, limit: ps };
}

// 生成 UUID（替代 crypto.randomUUID，兼容旧 Node.js）
export function generateUUID(): string {
  return crypto.randomUUID();
}
```


---

## 第36章 动画与动效系统

### 36.1 技术选型

系统采用 Framer Motion + AutoAnimate 双引擎动画方案：

| 库 | 体积 | 适用场景 | 选择原则 |
|---|------|---------|---------|
| AutoAnimate | 3.28KB | 列表增删、排序、accordion、toast、form-error | 零配置，优先选择 |
| Framer Motion | 34KB | 退场动画、手势、布局动画、stagger序列、滚动揭示、批量替换 | AutoAnimate 无法实现时使用 |

### 36.2 AutoAnimate 使用模式

#### 列表增删动画

```tsx
import AutoAnimate from 'auto-animate/react';

function ProductList({ products }) {
  const ref = useRef(null);
  useAutoAnimate(ref);

  return (
    <div ref={ref}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

新增项淡入，删除项淡出，排序自动过渡，无需额外配置。

#### Accordion 展开/收起

```tsx
function AccordionItem({ title, children, isOpen }) {
  const ref = useRef(null);
  useAutoAnimate(ref);

  return (
    <div ref={ref}>
      <button onClick={toggle}>{title}</button>
      {isOpen && <div className="overflow-hidden">{children}</div>}
    </div>
  );
}
```

#### Toast 通知队列

```tsx
function ToastContainer({ toasts }) {
  const ref = useRef(null);
  useAutoAnimate(ref);

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
```

#### 表单错误提示

```tsx
function FormField({ error, children }) {
  const ref = useRef(null);
  useAutoAnimate(ref);

  return (
    <div ref={ref}>
      {children}
      {error && <p className="text-error text-sm mt-1">{error}</p>}
    </div>
  );
}
```

### 36.3 Framer Motion 使用模式

#### 页面切换淡入

```tsx
import { motion } from 'framer-motion';

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

#### KPI 数字计数动画

```tsx
import CountUp from 'react-countup';

function KPICard({ value, label }) {
  return (
    <Card>
      <CardContent>
        <CountUp
          end={value}
          duration={0.8}
          separator=","
          decimals={value % 1 !== 0 ? 1 : 0}
          className="text-3xl font-bold text-foreground"
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
```

#### 按钮悬浮动画

```tsx
<motion.button
  whileHover={{ y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
  className="bg-primary text-white rounded-md px-4 py-2"
>
  按钮
</motion.button>
```

#### 步骤进度指示器

```tsx
function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            backgroundColor: i === current ? 'hsl(215 70% 35%)' : i < current ? 'hsl(142 71% 45%)' : 'hsl(210 20% 90%)',
            scale: i === current ? 1.1 : 1,
          }}
          transition={{ duration: 0.2 }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
        >
          {i < current ? <Check className="w-4 h-4" /> : i + 1}
        </motion.div>
      ))}
    </div>
  );
}
```

#### stagger 列表项入场

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function ProductGrid({ products }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4"
    >
      {products.map((p) => (
        <motion.div key={p.id} variants={itemVariants}>
          <ProductCard product={p} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

#### 滚动揭示

```tsx
function ScrollReveal({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

### 36.4 CSS 动画规范

#### 缓动函数

```css
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

#### 时长

```css
--duration-fast: 150ms;    /* 微交互 */
--duration-normal: 200ms;  /* 组件切换 */
--duration-slow: 300ms;    /* 页面过渡 */
--duration-modal: 250ms;  /* 抽屉/弹窗 */
```

#### Tailwind 动画类

| 类名 | 用途 |
|------|------|
| `transition-colors` | 颜色过渡（hover/focus） |
| `transition-all` | 全属性过渡 |
| `duration-150` | 150ms |
| `duration-200` | 200ms |
| `duration-300` | 300ms |
| `ease-out` | 缓出 |
| `animate-pulse` | 脉冲（当前步骤指示器） |
| `animate-spin` | 旋转（加载图标） |
| `animate-bounce` | 弹跳（空状态引导） |

### 36.5 业务场景动画清单

| 场景 | 实现方案 | 时长 | 触发条件 |
|------|---------|------|---------|
| 导航项 hover | Tailwind `transition-colors duration-150` | 150ms | hover |
| 导航项激活左边框滑入 | Framer Motion `layoutId` | 200ms | 路由切换 |
| 按钮悬浮上浮 | Framer Motion `whileHover y:-2` | 150ms | hover |
| 按钮点击缩放 | Framer Motion `whileTap scale:0.98` | 100ms | tap |
| 卡片 hover 阴影 | Tailwind `transition-shadow duration-200` | 200ms | hover |
| 步骤指示器脉冲 | Tailwind `animate-pulse` | 持续 | 当前步骤 |
| KPI 数字计数 | react-countup | 800ms | 数据加载完成 |
| 列表项增删 | AutoAnimate | 200ms | 数据变化 |
| 页面切换 | Framer Motion opacity+x | 250ms | 路由变化 |
| 抽屉展开 | Radix Sheet 内置 | 250ms | 按钮/遮罩点击 |
| Dialog 弹出 | Radix Dialog 内置 | 200ms | 触发器点击 |
| Toast 入场 | AutoAnimate | 200ms | toast 创建 |
| 表单错误出现 | AutoAnimate | 200ms | 校验失败 |
| 骨架屏闪烁 | Tailwind `animate-pulse` | 持续 | 加载中 |
| 空状态弹跳 | Tailwind `animate-bounce` | 持续 | 数据为空 |
| 滚动揭示 | Framer Motion `whileInView` | 400ms | 进入视口 |

### 36.6 性能注意事项

1. **优先 AutoAnimate**：简单列表/accordion/toast 场景用 AutoAnimate，避免引入 Framer Motion 的开销
2. **避免布局抖动**：动画属性优先使用 `transform` 和 `opacity`，避免 `width`/`height`/`top`/`left`
3. **GPU 加速**：`transform` 和 `opacity` 自动启用 GPU 加速
4. **减少同时动画数**：stagger 间隔不小于 50ms，避免大量元素同时动画
5. **移动端简化**：移动端禁用复杂的入场动画，仅保留微交互（hover/tap）
6. **尊重 prefers-reduced-motion**：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 36.7 动画组件封装

#### FadeIn

```tsx
function FadeIn({ children, delay = 0, duration = 0.3 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

#### SlideIn

```tsx
function SlideIn({ children, direction = 'left', delay = 0 }) {
  const directions = {
    left: { x: -20 },
    right: { x: 20 },
    up: { y: 20 },
    down: { y: -20 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

#### ScaleIn

```tsx
function ScaleIn({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {children}
    </motion.div>
  );
}
```


---

## 第37章 主题系统与 Tailwind 配置

### 37.1 主题架构

系统采用单套浅色主题，通过 CSS 变量 + Tailwind 语义化 token 实现主题系统。所有颜色值定义在 `tailwind-theme.css` 中，组件通过 Tailwind class（如 `bg-primary`）引用。

#### 主题文件

| 文件 | 职责 |
|------|------|
| `client/src/tailwind-theme.css` | CSS 变量定义（颜色、圆角等） |
| `client/src/index.css` | 全局样式、Tailwind 导入、字体 |
| `tailwind.config.js` | Tailwind 配置（不修改，模板预设） |

### 37.2 CSS 变量定义

#### tailwind-theme.css

```css
@layer base {
  :root {
    /* 基础颜色 */
    --background: hsl(210 20% 98%);
    --foreground: hsl(222 47% 11%);

    /* 卡片 */
    --card: hsl(0 0% 100%);
    --card-foreground: hsl(222 47% 11%);

    /* 弹出层 */
    --popover: hsl(0 0% 100%);
    --popover-foreground: hsl(222 47% 11%);

    /* 主色 */
    --primary: hsl(215 70% 35%);
    --primary-foreground: hsl(0 0% 100%);

    /* 次要色 */
    --secondary: hsl(210 40% 96%);
    --secondary-foreground: hsl(222 47% 11%);

    /* 次要文本 */
    --muted: hsl(210 40% 96%);
    --muted-foreground: hsl(215 16% 47%);

    /* 强调色 */
    --accent: hsl(38 92% 50%);
    --accent-foreground: hsl(222 47% 11%);

    /* 销毁色 */
    --destructive: hsl(0 72% 51%);
    --destructive-foreground: hsl(0 0% 100%);

    /* 边框 */
    --border: hsl(214 32% 91%);
    --input: hsl(214 32% 91%);
    --ring: hsl(215 70% 35%);

    /* 语义色 */
    --success: hsl(142 71% 45%);
    --warning: hsl(38 92% 50%);
    --error: hsl(0 72% 51%);
    --info: hsl(215 70% 50%);

    /* 圆角 */
    --radius: 0.5rem; /* 8px */

    /* 图表颜色 */
    --chart-1: hsl(215 70% 35%);
    --chart-2: hsl(38 92% 50%);
    --chart-3: hsl(142 71% 45%);
    --chart-4: hsl(245 70% 50%);
    --chart-5: hsl(0 72% 51%);
  }
}
```

### 37.3 颜色系统详解

#### 主色调：工业蓝

```
--primary: hsl(215 70% 35%)
```

| 角色 | HSL | 用途 |
|------|-----|------|
| Primary | hsl(215 70% 35%) | 按钮、导航、标题、链接 |
| Primary Hover | hsl(215 70% 30%) (90% opacity) | 按钮悬浮 |
| Primary Active | hsl(215 70% 25%) (80% opacity) | 按钮按下 |
| Primary Light | hsl(215 70% 95%) | 选中行背景 |
| Primary Foreground | hsl(0 0% 100%) | 主色背景上的文字 |

#### 强调色：琥珀色

```
--accent: hsl(38 92% 50%)
```

| 角色 | HSL | 用途 |
|------|-----|------|
| Accent | hsl(38 92% 50%) | 核心操作按钮（来货登记、快速发货） |
| Accent Hover | hsl(38 92% 45%) | 按钮悬浮 |
| Accent Foreground | hsl(222 47% 11%) | 琥珀色背景上的深色文字 |

#### 语义色

| 语义 | 变量 | HSL | 用途 |
|------|------|-----|------|
| 成功 | --success | hsl(142 71% 45%) | 完成、已收货、已回款 |
| 警告 | --warning | hsl(38 92% 50%) | 待处理、中风险 |
| 错误 | --error | hsl(0 72% 51%) | 超期、失败、删除 |
| 信息 | --info | hsl(215 70% 50%) | 信息提示、链接 |

#### 中性色

| 角色 | 变量 | HSL | 用途 |
|------|------|-----|------|
| 背景 | --background | hsl(210 20% 98%) | 页面背景 |
| 卡片 | --card | hsl(0 0% 100%) | 卡片背景 |
| 次要背景 | --secondary | hsl(210 40% 96%) | 标签背景 |
| 次要背景2 | --muted | hsl(210 40% 96%) | 表头背景、禁用 |
| 边框 | --border | hsl(214 32% 91%) | 分割线、边框 |
| 主文本 | --foreground | hsl(222 47% 11%) | 标题、正文 |
| 次要文本 | --muted-foreground | hsl(215 16% 47%) | 描述、辅助文字 |

### 37.4 Tailwind 语义化映射

Tailwind 4 通过 `@theme` 指令将 CSS 变量映射为 Tailwind class：

```css
@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-success: hsl(var(--success));
  --color-warning: hsl(var(--warning));
  --color-error: hsl(var(--error));
  --color-info: hsl(var(--info));
  --color-chart-1: hsl(var(--chart-1));
  --color-chart-2: hsl(var(--chart-2));
  --color-chart-3: hsl(var(--chart-3));
  --color-chart-4: hsl(var(--chart-4));
  --color-chart-5: hsl(var(--chart-5));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

使用时直接写 class 名：

```html
<div class="bg-primary text-primary-foreground">主色背景+白色文字</div>
<div class="text-muted-foreground">次要灰色文字</div>
<div class="border-border">边框</div>
<div class="bg-success/10 text-success">成功标签浅色背景</div>
```

### 37.5 透明度修饰符

所有语义颜色支持透明度修饰符 `/`：

```html
<!-- 10% 透明度 -->
<div class="bg-primary/10">浅蓝背景</div>
<div class="bg-error/10">浅红背景</div>
<div class="text-success/80">80%透明绿色文字</div>
<div class="border-primary/20">20%透明蓝色边框</div>
```

### 37.6 排版系统

#### 字体

```css
body {
  font-family: "PingFang SC", "Microsoft YaHei", "Source Han Sans CN", sans-serif;
}
```

#### 字号层级

| Tailwind Class | px | rem | 用途 |
|---------------|-----|-----|------|
| text-xs | 12px | 0.75rem | 徽章、状态标签 |
| text-sm | 14px | 0.875rem | 辅助说明、表格内容 |
| text-base | 16px | 1rem | 正文内容 |
| text-lg | 18px | 1.125rem | 卡片标题 |
| text-xl | 20px | 1.25rem | 区块标题 |
| text-2xl | 24px | 1.5rem | 页面主标题 |
| text-3xl | 32px | 2rem | KPI 数字 |
| text-4xl | 36px | 2.25rem | 大型数字展示 |

#### 字重

| Tailwind Class | weight | 用途 |
|---------------|--------|------|
| font-normal | 400 | 正文 |
| font-medium | 500 | 按钮文字、标签 |
| font-semibold | 600 | 区块标题、卡片标题 |
| font-bold | 700 | 页面标题、KPI数字 |

#### 行高

| Tailwind Class | ratio | 用途 |
|---------------|-------|------|
| leading-tight | 1.25 | 标题 |
| leading-snug | 1.375 | 紧凑文本 |
| leading-normal | 1.5 | 正文 |
| leading-relaxed | 1.625 | 宽松文本 |

### 37.7 间距系统

使用 Tailwind 默认间距比例：

| 名称 | px | 用途 |
|------|-----|------|
| space-x-1 / gap-1 | 4px | 图标与文字间距 |
| space-y-2 / gap-2 | 8px | 紧凑元素间距 |
| p-3 / gap-3 | 12px | 小间距 |
| p-4 / gap-4 | 16px | 标准间距 |
| p-6 / gap-6 | 24px | 卡片内边距、区块间距 |
| p-8 | 32px | 大间距 |

#### 三级间距规范

| 级别 | 值 | 用途 |
|------|-----|------|
| small | 8px (gap-2) | 紧凑元素间距 |
| medium | 16px (gap-4) | 标准间距 |
| large | 24px (gap-6) | 区块间距 |

### 37.8 圆角系统

| 名称 | 值 | Tailwind Class | 用途 |
|------|-----|---------------|------|
| sm | 4px | rounded-sm | 小元素 |
| md | 6px | rounded-md | 按钮、输入框 |
| lg | 8px | rounded-lg | 卡片 |
| xl | 12px | rounded-xl | 弹窗 |
| full | 9999px | rounded-full | 标签、头像 |

### 37.9 阴影系统

| 名称 | Tailwind Class | 用途 |
|------|---------------|------|
| subtle | shadow-sm | 默认卡片 |
| medium | shadow-md | 悬浮卡片 |
| large | shadow-lg | 下拉菜单 |
| xl | shadow-xl | 弹窗/抽屉 |

### 37.10 图表配色方案

```typescript
const CHART_COLORS = {
  primary: 'hsl(215 70% 35%)',     // 工业蓝
  accent: 'hsl(38 92% 50%)',       // 琥珀色
  success: 'hsl(142 71% 45%)',     // 绿色
  purple: 'hsl(245 70% 50%)',      // 紫色
  error: 'hsl(0 72% 51%)',          // 红色
  
  // 派生色（基于主色色相偏移）
  blue1: 'hsl(215 70% 35%)',
  blue2: 'hsl(245 60% 45%)',
  blue3: 'hsl(275 50% 55%)',
  blue4: 'hsl(185 60% 45%)',
  blue5: 'hsl(155 60% 40%)',
};
```

图表配色规则：
1. 主系列使用 `--chart-1`（工业蓝）
2. 次系列使用 `--chart-2`（琥珀色）
3. 辅助系列使用 `--chart-3`/`--chart-4`/`--chart-5`
4. 禁止使用与主色调不协调的颜色

### 37.11 响应式断点

| 断点 | 像素 | Tailwind 前缀 | 用途 |
|------|------|-------------|------|
| sm | 640px | sm: | 大手机 |
| md | 768px | md: | 平板 |
| lg | 1024px | lg: | 小屏笔记本 |
| xl | 1280px | xl: | 桌面显示器 |
| 2xl | 1536px | 2xl: | 大屏显示器 |

#### 响应式适配策略

| 设备 | 侧边栏 | 内容区 | 卡片布局 | 表格 |
|------|--------|--------|---------|------|
| 手机 (<sm) | 抽屉式 | 全宽 | 单列 | 卡片列表 |
| 平板 (md) | 抽屉式 | 全宽 | 2列 | 水平滚动 |
| 桌面 (lg+) | 固定240px | max-w-7xl | 3-4列 | 标准表格 |

### 37.12 禁止事项

1. **禁止硬编码颜色值**：如 `bg-blue-500`、`text-red-600`，必须使用语义化 class
2. **主题策略**：系统代码层面支持三主题切换（浅色/深色/护眼，见第67章），AGENTS.md 设计指南建议生产环境仅启用浅色主题
3. **禁止混用深浅背景**：如深色 Header + 浅色内容
4. **禁止不同页面使用不同主色调**：所有页面必须使用相同的 `--primary` 值
5. **禁止不同页面使用不同侧边栏宽度**：统一 240px
6. **禁止不同页面使用不同圆角风格**：统一 8px 卡片圆角
7. **禁止 `bg-[--primary]`**：Tailwind 4 限制，必须使用 `bg-primary`
8. **禁止 arbitrary values 中使用空格**：用下划线代替（`from-[hsl(215_60%_18%)]`）
9. **禁止自定义 tailwind-theme.css 中的颜色格式**：必须用 `hsl(H, S%, L%)` 格式（非 `23 10% 23%`）


---

## 第38章 API 层与请求架构

### 38.1 架构概述

系统的 API 层分为前端请求层和后端接口层，遵循 RESTful JSON API 规范。

#### 前端 API 层

```
client/src/api/
├── index.ts           # 桶导出（聚合文件）
├── auth.ts            # 认证相关 API
├── customer.ts        # 客户管理 API
├── product.ts         # 产品管理 API
├── inbound.ts         # 来货登记 API
├── outbound.ts        # 快速发货 API
├── inventory.ts       # 库存管理 API
├── reconciliation.ts  # 智能对账 API
├── statistics.ts      # 数据统计 API
├── print.ts           # 打印模板 API
├── permission.ts      # 权限管理 API
├── tenant.ts          # 组织管理 API
└── types.ts           # API 通用类型
```

#### 后端 API 层

```
server/modules/
├── auth/              # 认证模块
├── customer/          # 客户管理模块
├── product/           # 产品管理模块
├── inbound/           # 来货登记模块
├── outbound/          # 快速发货模块
├── inventory/         # 库存管理模块
├── reconciliation/    # 智能对账模块
├── statistics/        # 数据统计模块
├── print/             # 打印模板模块
├── permission/        # 权限管理模块
├── tenant/            # 组织管理模块
└── view/              # 视图渲染模块（平台内置）
```

### 38.2 前端请求工具

#### axiosForBackend

```typescript
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

// 方式1：配置对象
const response = await axiosForBackend({
  url: '/api/customers',
  method: 'GET',
  params: { page: 1, pageSize: 20 },
});

// 方式2：实例方法
const response = await axiosForBackend.get('/api/customers');
const response = await axiosForBackend.post('/api/customers', data);
const response = await axiosForBackend.put('/api/customers/123', data);
const response = await axiosForBackend.delete('/api/customers/123');
```

**禁止使用 fetch**，必须使用 `axiosForBackend`，否则会报 `Tenant not found`。

#### 请求拦截器

`axiosForBackend` 内置拦截器，自动添加：
- `X-Organization-Code` 请求头（从 localStorage 获取当前组织编码）
- `x-larkgw-suda-webuser` 请求头（用户身份）
- Base URL 前缀（`/api` 或 `/openapi`）

#### 响应拦截器

```typescript
// 统一错误处理
axiosForBackend.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 未授权，跳转登录
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // 无权限
      toast.error('无权限执行此操作');
    } else if (error.response?.status === 404) {
      // 资源不存在
      toast.error('请求的资源不存在');
    } else if (error.response?.status >= 500) {
      // 服务器错误
      toast.error('服务器内部错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);
```

### 38.3 API 模块封装模式

每个前端 API 模块遵循统一的封装模式：

```typescript
// client/src/api/customer.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { Customer, CustomerListParams, CustomerListResponse } from '@shared/api.interface';

export async function getCustomers(params: CustomerListParams): Promise<CustomerListResponse> {
  const { data } = await axiosForBackend.get<CustomerListResponse>('/api/customers', { params });
  return data;
}

export async function getCustomerById(id: string): Promise<Customer> {
  const { data } = await axiosForBackend.get<Customer>(`/api/customers/${id}`);
  return data;
}

export async function createCustomer(payload: Omit<Customer, 'id'>): Promise<Customer> {
  const { data } = await axiosForBackend.post<Customer>('/api/customers', payload);
  return data;
}

export async function updateCustomer(id: string, payload: Partial<Customer>): Promise<Customer> {
  const { data } = await axiosForBackend.put<Customer>(`/api/customers/${id}`, payload);
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/customers/${id}`);
}
```

### 38.4 桶导出（index.ts）

```typescript
// client/src/api/index.ts
export * as authApi from './auth';
export * as customerApi from './customer';
export * as productApi from './product';
export * as inboundApi from './inbound';
export * as outboundApi from './outbound';
export * as inventoryApi from './inventory';
export * as reconciliationApi from './reconciliation';
export * as statisticsApi from './statistics';
export * as printApi from './print';
export * as permissionApi from './permission';
export * as tenantApi from './tenant';
```

使用时：
```typescript
import { customerApi } from '@/api';
const customers = await customerApi.getCustomers({ page: 1, pageSize: 20 });
```

### 38.5 API 路径约定

| 前缀 | 用途 | 认证 | 示例 |
|------|------|------|------|
| `/api` | 内部业务接口 | 需登录 | `/api/customers` |
| `/openapi` | 对外开放接口 | API Key | `/openapi/inbound/create` |

#### 路由设计规范

1. **RESTful 路径**：
   - GET `/api/customers` — 列表
   - GET `/api/customers/:id` — 详情
   - POST `/api/customers` — 创建
   - PUT `/api/customers/:id` — 更新
   - DELETE `/api/customers/:id` — 删除

2. **静态路由在动态路由前**：
   ```
   GET /api/customers/search     ✅
   GET /api/customers/:id        ✅
   ```
   而非：
   ```
   GET /api/customers/:id        ❌ (:id 会匹配 "search")
   GET /api/customers/search
   ```

3. **描述性路径**：复杂操作使用动词路径
   ```
   POST /api/inbound/:id/print        — 打印入库单
   POST /api/outbound/:id/close       — 关闭出库单
   POST /api/reconciliation/:id/match — 对账匹配
   ```

### 38.6 分页响应格式

#### 传统分页

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

#### 游标分页

```typescript
interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor: string | undefined;
  hasMore: boolean;
}
```

### 38.7 后端 Controller 模式

```typescript
@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async list(@Query() query: CustomerListDto) {
    return this.customerService.findAll(query);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.customerService.findById(id);
  }

  @NeedLogin()
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCustomerDto) {
    const { userId } = req.userContext;
    return this.customerService.create({ ...dto, createdBy: userId });
  }

  @NeedLogin()
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.customerService.delete(id);
  }
}
```

### 38.8 后端 Service 模式

```typescript
@Injectable()
export class CustomerService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(params: CustomerListDto): Promise<PaginatedResponse<Customer>> {
    const { page, pageSize, search, material } = params;
    const conditions = [];

    if (search) {
      conditions.push(ilike(customers.name, `%${search}%`));
    }
    if (material) {
      conditions.push(eq(customers.material, material));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db.select().from(customers).where(where)
        .limit(pageSize).offset((page - 1) * pageSize),
      this.db.select({ count: count() }).from(customers).where(where),
    ]);

    return {
      items,
      total: Number(totalResult[0].count),
      page,
      pageSize,
    };
  }

  async findById(id: string): Promise<Customer> {
    const result = await this.db.select().from(customers).where(eq(customers.id, id));
    if (!result[0]) throw new NotFoundException('客户不存在');
    return result[0];
  }

  async create(data: NewCustomer): Promise<Customer> {
    const [result] = await this.db.insert(customers).values(data).returning();
    return result;
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const [result] = await this.db.update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    if (!result) throw new NotFoundException('客户不存在');
    return result;
  }

  async delete(id: string): Promise<void> {
    const [result] = await this.db.delete(customers)
      .where(eq(customers.id, id))
      .returning({ id: customers.id });
    if (!result) throw new NotFoundException('客户不存在');
  }
}
```

### 38.9 DTO 校验

```typescript
import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';

export class CustomerListDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  material?: string;

  @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @IsInt() @Min(1) @Max(100)
  pageSize?: number = 20;
}

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional() @IsString()
  contactPerson?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  address?: string;
}
```

### 38.10 错误处理

#### 全局错误 Filter

```typescript
@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    response.status(status).json({
      code: status,
      message: typeof errorResponse === 'string' ? errorResponse : errorResponse['message'],
      timestamp: new Date().toISOString(),
    });
  }
}
```

#### 异常类型映射

| 场景 | 异常类 | HTTP 状态码 |
|------|--------|------------|
| 资源不存在 | NotFoundException | 404 |
| 参数/状态非法 | BadRequestException | 400 |
| 并发冲突/库存不足 | ConflictException | 409 |
| 无权限 | ForbiddenException | 403 |
| 未登录 | UnauthorizedException | 401 |

### 38.11 请求流程

```
前端                              后端
  │                                 │
  ├─ axiosForBackend.get()          │
  │  ├─ 添加 X-Organization-Code    │
  │  ├─ 添加用户认证头              │
  │  └─ 发送 HTTP 请求 ──────────→  │
  │                                 ├─ TenantMiddleware 提取 orgCode
  │                                 ├─ AuthGuard 验证用户身份
  │                                 ├─ Controller 接收请求
  │                                 ├─ DTO 校验 (class-validator)
  │                                 ├─ Service 业务逻辑
  │                                 │  ├─ 获取租户 DB 连接
  │                                 │  ├─ Drizzle ORM 操作
  │                                 │  └─ 返回结果
  │                                 ├─ 全局 Filter 拦截异常
  │  ←─ HTTP JSON 响应 ←───────────┤
  │                                 │
  ├─ 响应拦截器处理                 │
  │  ├─ 2xx: 返回 data              │
  │  ├─ 401: 跳转登录               │
  │  ├─ 403: 提示无权限              │
  │  └─ 5xx: 提示服务器错误         │
  └─ 完成                            │
```

### 38.12 shared/api.interface.ts

前后端共享的类型定义文件：

```typescript
// shared/api.interface.ts

// 客户
export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  material?: string;
  createdAt: string;
  updatedAt: string;
}

// 客户列表请求参数
export interface CustomerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  material?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 游标分页响应
export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}
```

**规范**：
1. 新建/修改后端接口时，必须先完成 `shared/api.interface.ts` 中的类型定义
2. 属性统一 camelCase
3. timestamptz 字段声明为 `string`（JSON 序列化后为 ISO string）
4. shared 目录禁止反向引用 `@server/*` 或 `@client/*`


---

## 第39章 多租户架构深度解析

### 39.1 架构模式

系统采用 **Database-per-Tenant**（独立数据库）模式实现多租户隔离。每个组织（公司）拥有完全独立的物理数据库，实现最高级别的数据隔离。

#### 隔离级别对比

| 隔离模式 | 隔离级别 | 实现方式 | 数据安全 | 运维复杂度 | 适用场景 |
|---------|---------|---------|---------|-----------|---------|
| **Database-per-Tenant** | 最高 | 独立数据库 | ✅ 物理隔离 | 高 | 本系统采用 |
| Schema-per-Tenant | 中 | 独立Schema | ✅ 逻辑隔离 | 中 | 中等安全需求 |
| Row-level (共享表+租户ID) | 低 | tenant_id 字段 | ⚠️ 逻辑隔离 | 低 | 低安全需求 |

### 39.2 核心组件

#### 组件清单

| 组件 | 文件 | 职责 |
|------|------|------|
| 组织管理 | `server/modules/tenant/tenant.module.ts` | 组织 CRUD |
| 租户连接服务 | `server/modules/tenant/tenant-connection.service.ts` | 动态获取租户 DB 连接 |
| 租户中间件 | `server/common/middleware/tenant.middleware.ts` | 请求头提取 orgCode |
| 租户装饰器 | `server/common/decorators/tenant.decorator.ts` | 获取租户上下文 |
| 前端租户上下文 | `client/src/contexts/TenantContext.tsx` | 前端租户状态管理 |
| 组织选择页 | `client/src/pages/OrganizationPage.tsx` | 登录后选择组织 |

### 39.3 主数据库（Master DB）

主数据库存储所有组织级别的配置数据，不属于任何单个租户。

#### 表结构

```sql
-- 组织主表
CREATE TABLE organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_code VARCHAR(50) UNIQUE NOT NULL,    -- 组织编码（唯一）
  org_name VARCHAR(200) NOT NULL,           -- 组织名称
  db_host VARCHAR(200) NOT NULL,            -- 租户数据库地址
  db_port INTEGER DEFAULT 5432,             -- 数据库端口
  db_name VARCHAR(100) NOT NULL,            -- 数据库名（db_tenant_<org_code>）
  db_user VARCHAR(100) NOT NULL,            -- 数据库用户名
  db_password TEXT NOT NULL,                -- 数据库密码（加密存储）
  status VARCHAR(20) DEFAULT 'active',      -- 状态: active/inactive/suspended
  plan VARCHAR(20) DEFAULT 'standard',      -- 套餐: free/standard/premium
  max_users INTEGER DEFAULT 50,             -- 最大用户数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 组织用户关系表
CREATE TABLE organization_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,             -- 妙搭平台用户ID
  role VARCHAR(20) DEFAULT 'member',         -- 角色: super_admin/admin/member
  status VARCHAR(20) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- 组织邀请表
CREATE TABLE organization_invite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
  email VARCHAR(200) NOT NULL,
  invite_code VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  invited_by VARCHAR(100) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending',      -- pending/accepted/expired
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 39.4 租户数据库

每个租户拥有独立的数据库，包含所有业务表（客户、产品、入库单、出库单等）。表结构与主数据库完全独立。

#### 租户数据库命名

```
db_tenant_{org_code}
```

示例：`db_tenant_acme_corp`

#### 租户数据库包含的表

| 表 | 用途 |
|---|------|
| customer | 客户信息 |
| product | 产品信息 |
| inbound_record | 入库记录 |
| inbound_item | 入库明细 |
| outbound_record | 出库记录 |
| outbound_item | 出库明细 |
| inventory | 库存 |
| reconciliation | 对账记录 |
| print_template | 打印模板 |
| operation_log | 操作日志 |

### 39.5 TenantConnectionService

```typescript
@Injectable()
export class TenantConnectionService {
  private readonly logger = new Logger(TenantConnectionService.name);
  private readonly connectionPool = new Map<string, PostgresJsDatabase>();
  private readonly masterDb: PostgresJsDatabase;

  constructor(@Inject(DRIZZLE_DATABASE) masterDb: PostgresJsDatabase) {
    this.masterDb = masterDb;
  }

  /**
   * 获取租户数据库连接
   * 1. 先从连接池缓存查找
   * 2. 未命中则查询主库获取租户配置
   * 3. 创建新连接并缓存
   */
  async getTenantDb(orgCode: string): Promise<PostgresJsDatabase> {
    // 1. 检查缓存
    if (this.connectionPool.has(orgCode)) {
      return this.connectionPool.get(orgCode)!;
    }

    // 2. 查询主库获取租户配置
    const [org] = await this.masterDb
      .select()
      .from(organization)
      .where(eq(organization.orgCode, orgCode));

    if (!org) {
      throw new NotFoundException(`组织 ${orgCode} 不存在`);
    }

    if (org.status !== 'active') {
      throw new ForbiddenException(`组织 ${orgCode} 已被暂停`);
    }

    // 3. 创建租户数据库连接
    const tenantDb = await this.createTenantConnection(org);

    // 4. 缓存连接
    this.connectionPool.set(orgCode, tenantDb);

    return tenantDb;
  }

  private async createTenantConnection(org: Organization): Promise<PostgresJsDatabase> {
    const connectionUrl = `postgresql://${org.dbUser}:${org.dbPassword}@${org.dbHost}:${org.dbPort}/${org.dbName}`;

    const client = postgres(connectionUrl, {
      max: 10,                    // 连接池大小
      idle_timeout: 30000,        // 空闲超时 30s
      connect_timeout: 10000,     // 连接超时 10s
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    const schema = await import('@server/database/schema');
    return drizzle(client, { schema });
  }

  /**
   * 清理指定租户的连接缓存
   */
  clearConnection(orgCode: string): void {
    this.connectionPool.delete(orgCode);
    this.logger.log(`已清理租户 ${orgCode} 的数据库连接`);
  }

  /**
   * 清理所有连接
   */
  clearAllConnections(): void {
    this.connectionPool.clear();
    this.logger.log('已清理所有租户数据库连接');
  }
}
```

### 39.6 TenantMiddleware

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantConnectionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. 从多种来源提取 orgCode
    const orgCode = this.extractOrgCode(req);

    if (!orgCode) {
      // 无 orgCode 的请求（如登录、组织选择）直接放行
      return next();
    }

    try {
      // 2. 获取租户数据库连接
      const tenantDb = await this.tenantService.getTenantDb(orgCode);

      // 3. 附加到请求对象
      (req as any).tenantDb = tenantDb;
      (req as any).orgCode = orgCode;

      next();
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({ message: `组织 ${orgCode} 不存在` });
      } else if (error instanceof ForbiddenException) {
        res.status(403).json({ message: `组织 ${orgCode} 已被暂停` });
      } else {
        res.status(500).json({ message: '租户数据库连接失败' });
      }
    }
  }

  private extractOrgCode(req: Request): string | null {
    // 优先级：请求头 > 子域名 > 查询参数
    return (
      req.headers['x-organization-code'] as string ||
      this.extractFromSubdomain(req) ||
      (req.query.orgCode as string) ||
      null
    );
  }

  private extractFromSubdomain(req: Request): string | null {
    const host = req.headers.host;
    if (!host) return null;

    const parts = host.split('.');
    // 如 acme.example.com → "acme"
    if (parts.length >= 3) {
      return parts[0];
    }
    return null;
  }
}
```

### 39.7 租户装饰器

```typescript
// 获取完整租户上下文
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      orgCode: request.orgCode,
      tenantDb: request.tenantDb,
    };
  }
);

// 直接获取租户数据库连接
export const CurrentTenantDb = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.tenantDb) {
      throw new BadRequestException('未找到组织上下文，请先选择组织');
    }
    return request.tenantDb;
  }
);
```

#### Controller 使用示例

```typescript
@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async list(
    @CurrentTenantDb() db: PostgresJsDatabase,
    @Query() query: CustomerListDto
  ) {
    return this.customerService.findAll(db, query);
  }

  @NeedLogin()
  @Post()
  async create(
    @CurrentTenantDb() db: PostgresJsDatabase,
    @Req() req: Request,
    @Body() dto: CreateCustomerDto
  ) {
    const { userId } = req.userContext;
    return this.customerService.create(db, { ...dto, createdBy: userId });
  }
}
```

### 39.8 前端租户上下文

```typescript
// client/src/contexts/TenantContext.tsx

interface TenantContextValue {
  orgCode: string | null;
  orgName: string | null;
  setOrgCode: (code: string) => void;
  clearOrgCode: () => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }) {
  const [orgCode, setOrgCodeState] = useState<string | null>(() => {
    return localStorage.getItem('__global_heat_org_code');
  });
  const [orgName, setOrgName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setOrgCode = useCallback((code: string) => {
    localStorage.setItem('__global_heat_org_code', code);
    setOrgCodeState(code);
  }, []);

  const clearOrgCode = useCallback(() => {
    localStorage.removeItem('__global_heat_org_code');
    setOrgCodeState(null);
    setOrgName(null);
  }, []);

  // 获取组织信息
  useEffect(() => {
    if (!orgCode) return;
    setLoading(true);
    tenantApi.getOrganization(orgCode)
      .then((org) => setOrgName(org.name))
      .finally(() => setLoading(false));
  }, [orgCode]);

  return (
    <TenantContext.Provider value={{ orgCode, orgName, setOrgCode, clearOrgCode, loading }}>
      {children}
    </TenantContext.Provider>
  );
}
```

### 39.9 请求流程

```
1. 用户登录 → 获取用户ID
2. GET /api/tenant/organizations → 获取用户所属组织列表
3. 用户选择组织 → setOrgCode(orgCode) → 存入 localStorage
4. 后续所有请求自动携带 X-Organization-Code 请求头
5. 后端中间件提取 orgCode
6. 验证用户对该组织的访问权限（查 organization_user 表）
7. 获取/创建租户数据库连接
8. 将 tenantDb 附加到 request 对象
9. Controller 通过 @CurrentTenantDb() 获取数据库连接
10. Service 使用 tenantDb 执行业务操作
```

### 39.10 权限模型

| 角色 | 权限 | 数据范围 |
|------|------|---------|
| super_admin | 管理组织配置、邀请成员、查看操作日志 | 主库 + 所有租户库 |
| admin | 管理业务数据（客户、产品、订单等） | 当前租户库 |
| member | 操作自己创建的数据 | 当前租户库（仅自己的数据） |

### 39.11 新建租户流程

```
1. 管理员调用 POST /api/tenant/organizations
   → 在主库 organization 表创建记录
   → 执行初始化 SQL 脚本创建租户数据库
   → 创建所有业务表（customer, product, inbound_record, ...）
   → 插入默认数据（默认打印模板、默认角色权限）
2. 邀请用户加入组织
   → 创建 organization_invite 记录
   → 发送邀请邮件/消息
3. 用户接受邀请
   → 创建 organization_user 记录
   → 用户可选择该组织进入
```

### 39.12 部署注意事项

1. **数据库准备**：创建新租户时需要运行初始化脚本
   ```bash
   ts-node server/scripts/init-tenant-db.ts <org_code>
   ```

2. **网络配置**：应用服务器必须能访问所有租户数据库服务器

3. **备份策略**：每个租户数据库需要独立备份

4. **连接池管理**：
   - 每个租户维护独立的连接池
   - 连接池大小默认 10
   - 空闲超时 30 秒
   - 长时间不活跃的租户连接自动清理

5. **数据迁移**：
   - Schema 变更需要对所有租户数据库执行
   - 使用迁移脚本批量执行
   - 记录迁移版本

### 39.13 异常处理

| 场景 | 异常 | HTTP状态码 | 处理 |
|------|------|-----------|------|
| 组织不存在 | NotFoundException | 404 | 提示用户选择有效组织 |
| 组织已暂停 | ForbiddenException | 403 | 提示联系管理员 |
| 数据库连接失败 | InternalServerError | 500 | 记录日志，提示稍后重试 |
| 用户不属于该组织 | ForbiddenException | 403 | 提示无权访问该组织 |
| 请求未携带 orgCode | 放行（非租户接口） | - | 中间件跳过 |


---

## 第40章 数据库 Schema 与 ORM 完整参考

### 40.1 Drizzle ORM 概述

系统使用 Drizzle ORM 操作 PostgreSQL 数据库。Drizzle 是轻量级 TypeScript ORM，提供类型安全的数据库操作。

#### 核心概念

| 概念 | 说明 |
|------|------|
| pgTable | 定义数据库表 |
| pgEnum | 定义枚举类型 |
| customType | 自定义类型（如 userProfile） |
| customTimestamptz | 自定义时间戳类型 |
| eq/and/or/ilike | 查询条件构建器 |
| inArray | 数组条件查询 |
| count | 计数查询 |
| sql | 原生 SQL 模板 |

### 40.2 主数据库 Schema

主数据库存储组织级配置数据，Schema 定义在 `server/database/schema.ts` 的主库部分。

#### organization 表

```typescript
export const organization = pgTable('organization', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgCode: varchar('org_code', { length: 50 }).notNull().unique(),
  orgName: varchar('org_name', { length: 200 }).notNull(),
  dbHost: varchar('db_host', { length: 200 }).notNull(),
  dbPort: integer('db_port').default(5432),
  dbName: varchar('db_name', { length: 100 }).notNull(),
  dbUser: varchar('db_user', { length: 100 }).notNull(),
  dbPassword: text('db_password').notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  plan: varchar('plan', { length: 20 }).default('standard'),
  maxUsers: integer('max_users').default(50),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### organization_user 表

```typescript
export const organizationUser = pgTable('organization_user', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organization.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).default('member'),
  status: varchar('status', { length: 20 }).default('active'),
  joinedAt: customTimestamptz('joined_at').defaultNow().notNull(),
}, (table) => ({
  orgUserUnique: unique().on(table.orgId, table.userId),
}));
```

#### organization_invite 表

```typescript
export const organizationInvite = pgTable('organization_invite', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organization.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 200 }).notNull(),
  inviteCode: varchar('invite_code', { length: 100 }).notNull().unique(),
  role: varchar('role', { length: 20 }).default('member'),
  invitedBy: varchar('invited_by', { length: 100 }).notNull(),
  expiresAt: customTimestamptz('expires_at').notNull(),
  acceptedAt: customTimestamptz('accepted_at'),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 40.3 租户数据库 Schema

租户数据库包含所有业务表，每个表在 `server/database/schema.ts` 中定义。

#### customer 表（客户）

```typescript
export const customers = pgTable('customer', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  contactPerson: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 200 }),
  address: text('address'),
  taxNumber: varchar('tax_number', { length: 50 }),
  bankAccount: varchar('bank_account', { length: 100 }),
  bankName: varchar('bank_name', { length: 100 }),
  remark: text('remark'),
  createdBy: userProfile('created_by'),
  updatedBy: userProfile('updated_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### product 表（产品）

```typescript
export const products = pgTable('product', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  material: varchar('material', { length: 100 }),
  process: varchar('process', { length: 100 }),
  specification: varchar('specification', { length: 200 }),
  unit: varchar('unit', { length: 20 }).default('kg'),
  pricingMethod: varchar('pricing_method', { length: 20 }).default('weight'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  minOrderQty: decimal('min_order_qty', { precision: 10, scale: 3 }),
  remark: text('remark'),
  createdBy: userProfile('created_by'),
  updatedBy: userProfile('updated_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### inbound_record 表（入库记录）

```typescript
export const inboundRecords = pgTable('inbound_record', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordNo: varchar('record_no', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),
  totalWeight: decimal('total_weight', { precision: 10, scale: 3 }).default('0'),
  totalQty: integer('total_qty').default(0),
  status: varchar('status', { length: 20 }).default('pending'),
  inboundDate: customTimestamptz('inbound_date').notNull(),
  operatorId: userProfile('operator_id'),
  remark: text('remark'),
  createdBy: userProfile('created_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### inbound_item 表（入库明细）

```typescript
export const inboundItems = pgTable('inbound_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordId: uuid('record_id').references(() => inboundRecords.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 200 }).notNull(),
  material: varchar('material', { length: 100 }),
  process: varchar('process', { length: 100 }),
  specification: varchar('specification', { length: 200 }),
  quantity: integer('quantity').notNull(),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  unit: varchar('unit', { length: 20 }).default('kg'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  amount: decimal('amount', { precision: 12, scale: 2 }),
  images: text('images'),
  remark: text('remark'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

#### outbound_record 表（出库记录）

```typescript
export const outboundRecords = pgTable('outbound_record', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordNo: varchar('record_no', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),
  totalWeight: decimal('total_weight', { precision: 10, scale: 3 }).default('0'),
  totalQty: integer('total_qty').default(0),
  status: varchar('status', { length: 20 }).default('pending'),
  batchNo: varchar('batch_no', { length: 50 }),
  outboundDate: customTimestamptz('outbound_date').notNull(),
  deliveryDate: customTimestamptz('delivery_date'),
  operatorId: userProfile('operator_id'),
  remark: text('remark'),
  createdBy: userProfile('created_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### outbound_item 表（出库明细）

```typescript
export const outboundItems = pgTable('outbound_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordId: uuid('record_id').references(() => outboundRecords.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 200 }).notNull(),
  material: varchar('material', { length: 100 }),
  process: varchar('process', { length: 100 }),
  specification: varchar('specification', { length: 200 }),
  quantity: integer('quantity').notNull(),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  unit: varchar('unit', { length: 20 }).default('kg'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  amount: decimal('amount', { precision: 12, scale: 2 }),
  remark: text('remark'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

#### inventory 表（库存）

```typescript
export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 200 }).notNull(),
  material: varchar('material', { length: 100 }),
  process: varchar('process', { length: 100 }),
  specification: varchar('specification', { length: 200 }),
  currentQty: integer('current_qty').default(0),
  currentWeight: decimal('current_weight', { precision: 10, scale: 3 }).default('0'),
  unit: varchar('unit', { length: 20 }).default('kg'),
  location: varchar('location', { length: 100 }),
  batchNo: varchar('batch_no', { length: 50 }),
  inboundDate: customTimestamptz('inbound_date'),
  expiryDate: customTimestamptz('expiry_date'),
  status: varchar('status', { length: 20 }).default('normal'),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### reconciliation 表（对账记录）

```typescript
export const reconciliation = pgTable('reconciliation', {
  id: uuid('id').defaultRandom().primaryKey(),
  reconciliationNo: varchar('reconciliation_no', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id),
  period: varchar('period', { length: 10 }).notNull(),  // YYYY-MM
  totalOutboundAmount: decimal('total_outbound_amount', { precision: 12, scale: 2 }).default('0'),
  totalInvoicedAmount: decimal('total_invoiced_amount', { precision: 12, scale: 2 }).default('0'),
  totalPaidAmount: decimal('total_paid_amount', { precision: 12, scale: 2 }).default('0'),
  differenceAmount: decimal('difference_amount', { precision: 12, scale: 2 }).default('0'),
  status: varchar('status', { length: 20 }).default('unmatched'),
  matchedAt: customTimestamptz('matched_at'),
  matchedBy: userProfile('matched_by'),
  remark: text('remark'),
  createdBy: userProfile('created_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### print_template 表（打印模板）

```typescript
export const printTemplates = pgTable('print_template', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),  // tagcard/delivery/reconciliation
  paperSize: varchar('paper_size', { length: 20 }).default('A4'),
  orientation: varchar('orientation', { length: 10 }).default('portrait'),
  marginLeft: decimal('margin_left', { precision: 5, scale: 1 }).default('10'),
  marginRight: decimal('margin_right', { precision: 5, scale: 1 }).default('10'),
  marginTop: decimal('margin_top', { precision: 5, scale: 1 }).default('10'),
  marginBottom: decimal('margin_bottom', { precision: 5, scale: 1 }).default('10'),
  fields: text('fields'),
  content: text('content'),
  isDefault: boolean('is_default').default(false),
  createdBy: userProfile('created_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### operation_log 表（操作日志）

```typescript
export const operationLogs = pgTable('operation_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: userProfile('user_id'),
  module: varchar('module', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  targetType: varchar('target_type', { length: 50 }),
  targetId: varchar('target_id', { length: 100 }),
  description: text('description'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  requestData: text('request_data'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 40.4 自定义类型说明

#### userProfile

```typescript
export const userProfile = customType<{ data: string; driverData: unknown }>({
  dataType() {
    return 'user_profile';
  },
  fromDriver(value: unknown) {
    return String(value);
  },
});
```

- TypeScript 中对应 `string`
- 所有相关变量必须显式类型注解
- 存储妙搭平台用户ID

#### customTimestamptz

```typescript
export const customTimestamptz = customType<{ data: Date; driverData: string }>({
  dataType() {
    return 'timestamptz';
  },
  fromDriver(value: string) {
    return new Date(value);
  },
});
```

- Service 内查询返回 `Date` 对象
- API 响应 JSON 序列化后变为 ISO string
- `shared/api.interface.ts` 中声明为 `string`

### 40.5 ORM 操作模式

#### 查询

```typescript
// 简单查询
const result = await db.select().from(customers).where(eq(customers.id, id));

// 条件查询
const conditions = [];
if (search) conditions.push(ilike(customers.name, `%${search}%`));
if (material) conditions.push(eq(customers.material, material));
const where = conditions.length > 0 ? and(...conditions) : undefined;
const result = await db.select().from(customers).where(where);

// 关联查询
const result = await db.select({
  ...inboundRecords,
  customer: customers,
}).from(inboundRecords)
  .leftJoin(customers, eq(inboundRecords.customerId, customers.id));

// 计数
const [{ count: total }] = await db.select({ count: count() }).from(customers).where(where);
```

#### 插入

```typescript
const [result] = await db.insert(customers).values({
  name: '新客户',
  contactPerson: '张三',
  phone: '13800138000',
  createdBy: userId,
}).returning();
```

#### 更新

```typescript
const [result] = await db.update(customers)
  .set({ name: '更新名称', updatedAt: new Date() })
  .where(eq(customers.id, id))
  .returning();
if (!result) throw new NotFoundException('客户不存在');
```

#### 删除

```typescript
const [result] = await db.delete(customers)
  .where(eq(customers.id, id))
  .returning({ id: customers.id });
if (!result) throw new NotFoundException('客户不存在');
```

#### 事务

```typescript
await db.transaction(async (tx) => {
  const [inbound] = await tx.insert(inboundRecords).values(recordData).returning();
  await tx.insert(inboundItems).values(items.map(i => ({ ...i, recordId: inbound.id })));
  await tx.update(inventory).set({ currentQty: sql`${inventory.currentQty} + ${qty}` }).where(eq(inventory.productId, productId));
});
```

#### 原子更新（防止竞态）

```typescript
const [updated] = await db.update(inventory)
  .set({ currentQty: sql`${inventory.currentQty} - ${qty}` })
  .where(and(eq(inventory.id, id), gte(inventory.currentQty, qty)))
  .returning({ id: inventory.id });
if (!updated) throw new ConflictException('库存不足');
```


---

## 第41章 打印系统完整规格

### 41.1 系统概述

打印系统支持三类单据的打印：标识卡（流程卡）、送货单（出库单）、对账单。系统提供自定义模板配置、在线预览和打印功能。

#### 功能架构

```
打印模板配置
├── 模板类型选择（标识卡/送货单/对账单）
├── 字段自定义（拖拽排序）
├── 纸张规格设置（A4/A5/自定义）
├── 预览与测试打印
└── 默认模板设置

现场打印
├── 入库后自动打印标识卡
├── 出库后打印送货单
├── 对账单生成后打印
├── 蓝牙打印机连接
├── 网络打印机连接
└── 浏览器打印（PDF）
```

### 41.2 模板类型

| 类型 | 标识 | 用途 | 纸张 | 主要字段 |
|------|------|------|------|---------|
| 标识卡 | `tagcard` | 入库后打印，随产品流转 | A5/标签纸 | 客户名、产品名、规格、数量、重量、入库日期、图片 |
| 送货单 | `delivery` | 出库时打印，随货交付 | A4 | 客户名、产品列表、数量、金额、送货日期、签字栏 |
| 对账单 | `reconciliation` | 月末对账，发给客户确认 | A4 | 客户名、对账周期、明细列表、汇总金额、回款状态 |

### 41.3 模板数据结构

#### 数据库 Schema

```typescript
// print_template 表
{
  id: string;
  name: string;              // 模板名称
  type: 'tagcard' | 'delivery' | 'reconciliation';
  paperSize: 'A4' | 'A5' | 'custom';
  orientation: 'portrait' | 'landscape';
  marginLeft: number;       // mm
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  fields: string;            // JSON: 字段配置数组
  content: string;           // HTML: 模板内容
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 字段配置 JSON

```typescript
interface TemplateField {
  key: string;               // 字段标识
  label: string;             // 显示名称
  type: 'text' | 'number' | 'date' | 'image' | 'table' | 'signature';
  visible: boolean;          // 是否显示
  order: number;             // 排序
  width?: string;            // 宽度（百分比或像素）
  align?: 'left' | 'center' | 'right';
  format?: string;           // 格式化模式
}

interface TemplateFieldsConfig {
  header: TemplateField[];   // 页眉字段
  body: TemplateField[];     // 正文字段
  footer: TemplateField[];   // 页脚字段
  table?: TemplateField[];   // 表格列（送货单/对账单）
}
```

### 41.4 模板字段清单

#### 标识卡字段

| 字段标识 | 显示名 | 类型 | 默认显示 |
|---------|--------|------|---------|
| customer_name | 客户名称 | text | ✅ |
| product_name | 产品名称 | text | ✅ |
| material | 材质 | text | ✅ |
| process | 工艺 | text | ✅ |
| specification | 规格 | text | ✅ |
| quantity | 数量 | number | ✅ |
| weight | 重量 | number | ✅ |
| unit | 单位 | text | ✅ |
| record_no | 流程卡号 | text | ✅ |
| inbound_date | 入库日期 | date | ✅ |
| product_image | 产品图片 | image | ✅ |
| qr_code | 二维码 | image | ⬜ |
| operator | 操作员 | text | ⬜ |
| remark | 备注 | text | ⬜ |

#### 送货单字段

| 字段标识 | 显示名 | 类型 | 默认显示 |
|---------|--------|------|---------|
| customer_name | 客户名称 | text | ✅ |
| delivery_no | 送货单号 | text | ✅ |
| delivery_date | 送货日期 | date | ✅ |
| batch_no | 批次号 | text | ✅ |
| product_table | 产品列表 | table | ✅ |
| total_qty | 总数量 | number | ✅ |
| total_weight | 总重量 | number | ✅ |
| total_amount | 总金额 | number | ✅ |
| operator | 发货人 | text | ✅ |
| receiver | 签收人 | signature | ✅ |
| remark | 备注 | text | ⬜ |

#### 对账单字段

| 字段标识 | 显示名 | 类型 | 默认显示 |
|---------|--------|------|---------|
| customer_name | 客户名称 | text | ✅ |
| reconciliation_no | 对账单号 | text | ✅ |
| period | 对账周期 | text | ✅ |
| detail_table | 明细列表 | table | ✅ |
| total_outbound | 出库总额 | number | ✅ |
| total_invoiced | 开票总额 | number | ✅ |
| total_paid | 回款总额 | number | ✅ |
| difference | 差异金额 | number | ✅ |
| status | 对账状态 | text | ✅ |
| remark | 备注 | text | ⬜ |

### 41.5 纸张规格

| 规格 | 尺寸(mm) | 适用 |
|------|---------|------|
| A4 | 210 × 297 | 送货单、对账单 |
| A5 | 148 × 210 | 标识卡 |
| 标签纸(100×80) | 100 × 80 | 标识卡（标签打印机） |
| 标签纸(100×150) | 100 × 150 | 标识卡（大标签） |
| 自定义 | 用户输入 | 特殊需求 |

#### 边距设置

```typescript
interface PaperMargins {
  marginLeft: number;    // 左边距 mm，默认 10
  marginRight: number;   // 右边距 mm，默认 10
  marginTop: number;     // 上边距 mm，默认 10
  marginBottom: number;  // 下边距 mm，默认 10
}
```

### 41.6 模板渲染

#### HTML 模板生成

```typescript
function renderTemplate(template: PrintTemplate, data: Record<string, unknown>): string {
  const fields: TemplateFieldsConfig = JSON.parse(template.fields);
  const visibleHeaderFields = fields.header.filter(f => f.visible).sort((a, b) => a.order - b.order);
  const visibleBodyFields = fields.body.filter(f => f.visible).sort((a, b) => a.order - b.order);

  return `
    <html>
    <head>
      <style>
        @page {
          size: ${template.paperSize} ${template.orientation};
          margin: ${template.marginTop}mm ${template.marginRight}mm ${template.marginBottom}mm ${template.marginLeft}mm;
        }
        body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .field { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .field-label { font-weight: 600; color: #333; }
        .field-value { color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .product-image { max-width: 200px; max-height: 200px; }
        .signature { margin-top: 40px; border-top: 1px solid #333; padding-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${visibleHeaderFields.map(f => `
          <div class="field">
            <span class="field-label">${f.label}:</span>
            <span class="field-value">${formatValue(data[f.key], f)}</span>
          </div>
        `).join('')}
      </div>
      <div class="body">
        ${visibleBodyFields.map(f => renderField(f, data[f.key])).join('')}
      </div>
    </body>
    </html>
  `;
}

function formatValue(value: unknown, field: TemplateField): string {
  if (value === null || value === undefined) return '';
  switch (field.type) {
    case 'date': return dayjs(value).format(field.format || 'YYYY-MM-DD');
    case 'number': return new Intl.NumberFormat('zh-CN').format(Number(value));
    case 'image': return `<img class="product-image" src="${value}" />`;
    default: return String(value);
  }
}
```

### 41.7 打印方式

#### 浏览器打印（PDF）

```typescript
async function printViaBrowser(html: string) {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  iframe.srcdoc = html;
}
```

#### 蓝牙打印机

```typescript
// 通过 Web Bluetooth API 连接蓝牙打印机
async function printViaBluetooth(data: PrintData) {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['printer_service'] }],
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService('printer_service');
  const characteristic = await service.getCharacteristic('printer_characteristic');

  // 将数据转为打印机指令（ESC/POS 或 TSPL）
  const commands = encodeToESCPOS(data);
  await characteristic.writeValue(commands);
}
```

### 41.8 打印模板配置页面

#### 页面结构

```
打印模板配置页面
├── 模板列表（左侧）
│   ├── 标识卡模板列表
│   ├── 送货单模板列表
│   └── 对账单模板列表
├── 模板编辑（右侧）
│   ├── 基本信息（名称、类型）
│   ├── 纸张设置（纸张大小、方向、边距）
│   ├── 字段配置（拖拽排序）
│   │   ├── 可选字段列表
│   │   └── 已选字段列表（拖拽排序）
│   └── 模板内容（HTML 编辑器）
└── 预览区域（底部/右侧）
    ├── 实时预览
    └── 测试打印按钮
```

#### 字段拖拽配置

使用 `@dnd-kit/core` + `@dnd-kit/sortable` 实现字段拖拽排序：

```tsx
function FieldConfigurator({ fields, onChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map(f => f.key)} strategy={verticalListSortingStrategy}>
        {fields.map((field) => (
          <SortableField key={field.key} field={field} onToggle={() => toggleField(field.key)} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### 41.9 API 接口

```typescript
// 获取模板列表
GET /api/print/templates?type=tagcard

// 获取模板详情
GET /api/print/templates/:id

// 创建模板
POST /api/print/templates
Body: { name, type, paperSize, orientation, marginLeft, ..., fields, content }

// 更新模板
PUT /api/print/templates/:id
Body: { name, paperSize, fields, ... }

// 删除模板
DELETE /api/print/templates/:id

// 设置默认模板
POST /api/print/templates/:id/set-default

// 预览模板
POST /api/print/preview
Body: { templateId, sampleData }
Response: { html: string }

// 打印单据
POST /api/print/print
Body: { templateId, recordType, recordId }
Response: { html: string }
```

### 41.10 默认模板

系统预置三种默认模板，首次创建租户时自动插入：

#### 标识卡默认模板

- 纸张：A5 竖向
- 边距：10mm 四边
- 字段：客户名称、产品名称、材质、工艺、规格、数量、重量、单位、流程卡号、入库日期、产品图片
- 布局：上半部分文字信息，下半部分产品图片

#### 送货单默认模板

- 纸张：A4 竖向
- 边距：15mm 四边
- 字段：客户名称、送货单号、送货日期、批次号、产品列表表格、总数量、总重量、总金额、发货人、签收栏
- 布局：页头信息+产品表格+页脚签字栏

#### 对账单默认模板

- 纸张：A4 竖向
- 边距：15mm 四边
- 字段：客户名称、对账单号、对账周期、明细列表表格、出库总额、开票总额、回款总额、差异金额、对账状态
- 布局：页头信息+明细表格+汇总区域


---

## 第42章 权限与角色系统完整规格

### 42.1 系统架构

权限系统采用 RBAC（Role-Based Access Control）模型，通过角色绑定权限，用户分配角色实现访问控制。

#### 权限层级

```
超级管理员 (super_admin)
├── 管理员 (admin)
│   ├── 财务人员 (finance)
│   ├── 收货员 (inbound_operator)
│   ├── 发货员 (outbound_operator)
│   └── 普通成员 (member)
└── 只读用户 (viewer)
```

### 42.2 角色定义

| 角色 | 标识 | 菜单权限 | 数据权限 | 操作权限 |
|------|------|---------|---------|---------|
| 超级管理员 | `super_admin` | 全部菜单 | 全部数据 | 全部操作+系统设置 |
| 管理员 | `admin` | 全部业务菜单 | 全部业务数据 | 全部业务操作 |
| 财务人员 | `finance` | 工作台、对账、统计 | 对账相关数据 | 对账操作+查看 |
| 收货员 | `inbound_operator` | 工作台、来货登记、库存 | 来货登记数据 | 来货登记+库存查看 |
| 发货员 | `outbound_operator` | 工作台、快速发货、库存 | 发货数据 | 快速发货+库存查看 |
| 普通成员 | `member` | 工作台 | 自己创建的数据 | 查看自己的数据 |
| 只读用户 | `viewer` | 工作台、统计 | 全部数据只读 | 仅查看，无操作 |

### 42.3 菜单权限映射

```typescript
const MENU_PERMISSIONS = {
  '/': ['super_admin', 'admin', 'finance', 'inbound_operator', 'outbound_operator', 'member', 'viewer'],
  '/inbound': ['super_admin', 'admin', 'inbound_operator'],
  '/outbound': ['super_admin', 'admin', 'outbound_operator'],
  '/inventory': ['super_admin', 'admin', 'inbound_operator', 'outbound_operator'],
  '/reconciliation': ['super_admin', 'admin', 'finance'],
  '/statistics': ['super_admin', 'admin', 'finance', 'viewer'],
  '/customers': ['super_admin', 'admin'],
  '/products': ['super_admin', 'admin'],
  '/settings/templates': ['super_admin', 'admin'],
  '/settings/permissions': ['super_admin'],
};
```

### 42.4 操作权限矩阵

| 操作 | super_admin | admin | finance | inbound_op | outbound_op | member | viewer |
|------|:-----------:|:-----:|:-------:|:----------:|:-----------:|:------:|:------:|
| 创建客户 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 编辑客户 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 删除客户 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 创建产品 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 来货登记 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 快速发货 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 查看库存 | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| 对账操作 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 查看统计 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| 配置模板 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 管理权限 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 管理组织 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 42.5 数据权限

```typescript
type DataScope = 'all' | 'department' | 'self';

const DATA_SCOPE: Record<string, DataScope> = {
  super_admin: 'all',
  admin: 'all',
  finance: 'all',
  inbound_operator: 'self',
  outbound_operator: 'self',
  member: 'self',
  viewer: 'all',
};
```

- `all`：可查看所有数据
- `self`：仅可查看自己创建的数据

### 42.6 前端权限控制

#### useAuth Hook

```typescript
function useAuth() {
  const { user } = useCurrentUserProfile();
  const roles = user?.roles || [];

  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (roleList: string[]) => roleList.some(r => roles.includes(r));
  const hasAllRoles = (roleList: string[]) => roleList.every(r => roles.includes(r));
  const isSuperAdmin = () => roles.includes('super_admin');
  const isAdmin = () => hasAnyRole(['super_admin', 'admin']);

  return { roles, hasRole, hasAnyRole, hasAllRoles, isSuperAdmin, isAdmin };
}
```

#### 菜单过滤

```typescript
function filterMenuByRole(menuItems: NavItem[], roles: string[]): NavItem[] {
  return menuItems.filter(item => {
    const allowedRoles = MENU_PERMISSIONS[item.path];
    if (!allowedRoles) return true;
    return allowedRoles.some(role => roles.includes(role));
  });
}
```

#### 路由守卫

```tsx
function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const { roles } = useAuth();
  const hasAccess = allowedRoles.some(role => roles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// 路由配置
<Route
  path="/settings/permissions"
  element={
    <ProtectedRoute allowedRoles={['super_admin']}>
      <PermissionPage />
    </ProtectedRoute>
  }
/>
```

#### 按钮级控制

```tsx
function CanAccess({ roles, children, fallback = null }: { roles: string[]; children: ReactNode; fallback?: ReactNode }) {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(roles) ? <>{children}</> : <>{fallback}</>;
}

// 使用
<CanAccess roles={['super_admin', 'admin']}>
  <Button onClick={handleDelete}>删除</Button>
</CanAccess>
```

### 42.7 后端权限控制

#### 请求上下文

```typescript
// req.userContext 包含用户信息
interface UserContext {
  userId: string;
  tenantId: string;
  appId: string;
  env: 'preview' | 'runtime';
  userName: string;
  roles: string[];  // 用户角色列表
}
```

#### 角色校验装饰器

```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// 使用
@Roles('super_admin', 'admin')
@NeedLogin()
@Delete(':id')
async deleteCustomer(@Param('id') id: string, @Req() req: Request) {
  // 只有 super_admin 和 admin 可以删除
  return this.customerService.delete(id);
}
```

#### 角色守卫

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const userRoles = request.userContext?.roles || [];

    return requiredRoles.some(role => userRoles.includes(role));
  }
}
```

#### 数据范围过滤

```typescript
async findAll(db: PostgresJsDatabase, userContext: UserContext, params: ListDto) {
  const scope = DATA_SCOPE[userContext.roles[0]] || 'self';

  const conditions = [];
  if (params.search) conditions.push(ilike(customers.name, `%${params.search}%`));

  // 数据范围控制
  if (scope === 'self') {
    conditions.push(eq(customers.createdBy, userContext.userId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(customers).where(where);
}
```

### 42.8 权限管理页面

#### 角色管理

```
权限管理页面
├── 角色列表
│   ├── 角色名称
│   ├── 角色描述
│   ├── 用户数量
│   └── 操作（编辑/删除）
├── 角色编辑
│   ├── 基本信息（名称、描述）
│   ├── 菜单权限（勾选可访问的菜单）
│   ├── 操作权限（勾选可执行的操作）
│   └── 数据范围（全部/部门/个人）
└── 用户新增/编辑
    ├── 用户信息
    ├── 角色分配
    └── 状态管理
```

#### 操作日志

```typescript
// 操作日志记录
async function logOperation(db: PostgresJsDatabase, params: {
  userId: string;
  module: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
}) {
  await db.insert(operationLogs).values({
    userId: params.userId,
    module: params.module,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    description: params.description,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    requestData: JSON.stringify(request.body),
  });
}
```

### 42.9 组织级权限

在多租户架构下，权限分为两层：

1. **组织级权限**（主库 organization_user 表）：
   - `super_admin` — 组织超级管理员
   - `admin` — 组织管理员
   - `member` — 组织普通成员

2. **业务级权限**（租户库 operation_log + 前端控制）：
   - `finance` — 财务人员
   - `inbound_operator` — 收货员
   - `outbound_operator` — 发货员
   - `viewer` — 只读用户

组织级权限存储在主库，业务级权限通过前端菜单和后端接口校验实现。


---

## 第43章 数据统计与报表系统

### 43.1 系统架构

数据统计模块提供多维度业务数据分析，支持年/月/日报表切换，图表展示和导出功能。

#### 统计维度

```
数据统计
├── 综合报表
│   ├── 收发货总量趋势
│   ├── 金额趋势
│   └── 同比/环比分析
├── 客户分析
│   ├── 发货量排行
│   ├── 回款率分析
│   └── 客户活跃度
├── 产品分析
│   ├── 产品热力图
│   ├── 加工周期统计
│   └── 产品排行
├── 延误分析
│   ├── 延误订单数量
│   ├── 延误原因分布
│   └── 延误趋势
└── 库存分析
    ├── 库存周转率
    ├── 库存预警
    └── 库龄分布
```

### 43.2 统计指标定义

#### 综合指标

| 指标 | 计算方式 | 展示形式 |
|------|---------|---------|
| 入库总量 | SUM(inbound_item.quantity) | 数字+趋势线 |
| 出库总量 | SUM(outbound_item.quantity) | 数字+趋势线 |
| 入库总金额 | SUM(inbound_item.amount) | 数字+趋势线 |
| 出库总金额 | SUM(outbound_item.amount) | 数字+趋势线 |
| 当前库存量 | SUM(inventory.current_qty) | 数字 |
| 待对账金额 | SUM(reconciliation.difference_amount WHERE status='unmatched') | 数字 |
| 回款率 | total_paid / total_outbound × 100% | 百分比 |
| 库存周转率 | 出库量 / 平均库存 × 100% | 百分比 |

#### 客户分析指标

| 指标 | 计算方式 | 展示形式 |
|------|---------|---------|
| 客户发货量排行 | GROUP BY customer, SUM(qty) ORDER BY DESC | 柱状图 |
| 客户回款率 | total_paid / total_outbound × 100% | 饼图 |
| 客户活跃度 | 近30天操作次数 | 热力图 |
| 新增客户数 | COUNT(WHERE created_at >= period_start) | 数字 |

#### 产品分析指标

| 指标 | 计算方式 | 展示形式 |
|------|---------|---------|
| 产品热度 | 入库+出库频次 | 热力图 |
| 加工周期 | AVG(outbound_date - inbound_date) | 数字 |
| 产品排行 | GROUP BY product, SUM(qty) ORDER BY DESC | 柱状图 |
| 库存预警 | WHERE current_qty < threshold | 列表 |

#### 延误分析指标

| 指标 | 计算方式 | 展示形式 |
|------|---------|---------|
| 延误订单数 | COUNT(WHERE delivery_date < actual_date) | 数字 |
| 延误率 | 延误数 / 总数 × 100% | 百分比 |
| 延误原因分布 | GROUP BY delay_reason, COUNT | 饼图 |
| 延误趋势 | 按月统计延误数 | 折线图 |

### 43.3 图表配置

#### 图表类型与场景

| 图表类型 | 适用场景 | ECharts type |
|---------|---------|-------------|
| 折线图 | 趋势分析（时间序列） | line |
| 柱状图 | 排行对比 | bar |
| 饼图 | 占比分布 | pie |
| 热力图 | 产品热度 | heatmap |
| 面积图 | 累积趋势 | line + areaStyle |
| 仪表盘 | 回款率 | gauge |

#### 图表配色

```typescript
const CHART_COLORS = {
  primary: 'hsl(215 70% 35%)',     // 工业蓝 - 主系列
  accent: 'hsl(38 92% 50%)',      // 琥珀色 - 次系列
  success: 'hsl(142 71% 45%)',    // 绿色 - 正向数据
  error: 'hsl(0 72% 51%)',        // 红色 - 负向数据
  purple: 'hsl(245 70% 50%)',    // 紫色 - 辅助
  cyan: 'hsl(185 60% 45%)',       // 青色 - 辅助
};

const CHART_COLOR_SERIES = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.purple,
  CHART_COLORS.cyan,
  CHART_COLORS.error,
];
```

#### ECharts 基础配置

```typescript
const baseOption = {
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'hsl(0 0% 100%)',
    borderColor: 'hsl(214 32% 91%)',
    textStyle: { color: 'hsl(222 47% 11%)' },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  color: CHART_COLOR_SERIES,
  textStyle: {
    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
    color: 'hsl(215 16% 47%)',
  },
};
```

### 43.4 趋势折线图

```typescript
const trendOption = {
  ...baseOption,
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    axisLine: { lineStyle: { color: 'hsl(214 32% 91%)' } },
    axisLabel: { color: 'hsl(215 16% 47%)' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'hsl(214 32% 91%)', type: 'dashed' } },
    axisLabel: { color: 'hsl(215 16% 47%)' },
  },
  series: [
    {
      name: '入库量',
      type: 'line',
      smooth: true,
      data: [120, 132, 101, 134, 90, 230],
      itemStyle: { color: CHART_COLORS.primary },
      areaStyle: { opacity: 0.1 },
    },
    {
      name: '出库量',
      type: 'line',
      smooth: true,
      data: [220, 182, 191, 234, 290, 330],
      itemStyle: { color: CHART_COLORS.accent },
      areaStyle: { opacity: 0.1 },
    },
  ],
};
```

### 43.5 客户排行柱状图

```typescript
const customerRankOption = {
  ...baseOption,
  xAxis: {
    type: 'value',
    axisLabel: { color: 'hsl(215 16% 47%)' },
  },
  yAxis: {
    type: 'category',
    data: ['客户A', '客户B', '客户C', '客户D', '客户E'],
    axisLabel: { color: 'hsl(215 16% 47%)' },
  },
  series: [{
    type: 'bar',
    data: [320, 280, 220, 180, 150],
    itemStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 1, y2: 0,
        colorStops: [
          { offset: 0, color: 'hsl(215 70% 35%)' },
          { offset: 1, color: 'hsl(215 70% 50%)' },
        ],
      },
      borderRadius: [0, 4, 4, 0],
    },
    barWidth: '60%',
    label: { show: true, position: 'right', color: 'hsl(222 47% 11%)' },
  }],
};
```

### 43.6 回款率饼图

```typescript
const paymentRateOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%', left: 'center' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    label: { show: true, formatter: '{b}: {d}%' },
    data: [
      { value: 65, name: '已回款', itemStyle: { color: CHART_COLORS.success } },
      { value: 20, name: '部分回款', itemStyle: { color: CHART_COLORS.accent } },
      { value: 15, name: '未回款', itemStyle: { color: CHART_COLORS.error } },
    ],
  }],
};
```

### 43.7 产品热力图

```typescript
const heatmapOption = {
  ...baseOption,
  tooltip: { position: 'top' },
  grid: { height: '50%', top: '10%' },
  xAxis: { type: 'category', data: products, splitArea: { show: true } },
  yAxis: { type: 'category', data: months, splitArea: { show: true } },
  visualMap: {
    min: 0, max: 100,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '5%',
    inRange: { color: ['hsl(210 40% 96%)', 'hsl(215 70% 35%)'] },
  },
  series: [{
    type: 'heatmap',
    data: heatmapData,
    label: { show: true },
  }],
};
```

### 43.8 KPI 指标卡

```tsx
function KPICard({ title, value, unit, trend, trendValue, icon }) {
  return (
    <Card className="data-ai-section-type card-stat">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1 mt-2">
              <CountUp end={value} duration={0.8} className="text-3xl font-bold text-foreground" />
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {trend && (
              <div className={cn('flex items-center gap-1 mt-2 text-sm',
                trend === 'up' ? 'text-success' : 'text-error')}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{trendValue}%</span>
                <span className="text-muted-foreground">vs 上期</span>
              </div>
            )}
          </div>
          {icon && <div className="text-primary opacity-80">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 43.9 报表导出

#### Excel 导出

```typescript
import * as XLSX from 'xlsx';

function exportToExcel(data: any[], filename: string, sheetName = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
```

#### PDF 导出

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function exportToPDF(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`${filename}.pdf`);
}
```

### 43.10 API 接口

```typescript
// 综合统计
GET /api/statistics/overview?period=month&date=2024-01
Response: { inboundTotal, outboundTotal, inboundAmount, outboundAmount, inventoryTotal, pendingReconciliation }

// 趋势数据
GET /api/statistics/trend?period=month&startDate=2024-01-01&endDate=2024-06-30
Response: { labels: string[], inbound: number[], outbound: number[], amount: number[] }

// 客户排行
GET /api/statistics/customer-rank?period=month&date=2024-01&limit=10
Response: { items: { customerId, customerName, totalQty, totalAmount, paymentRate }[] }

// 产品排行
GET /api/statistics/product-rank?period=month&date=2024-01&limit=10
Response: { items: { productId, productName, totalQty, totalAmount }[] }

// 延误分析
GET /api/statistics/delay?period=month&date=2024-01
Response: { totalOrders, delayedOrders, delayRate, reasons: { reason, count }[] }

// 库存分析
GET /api/statistics/inventory
Response: { totalItems, totalQty, lowStockItems, expiredItems, turnoverRate }

// 导出报表
POST /api/statistics/export
Body: { type: 'overview' | 'customer' | 'product', period, format: 'excel' | 'pdf' }
Response: Blob (Excel/PDF file)
```

### 43.11 页面布局

```
数据统计页面
├── 时间范围选择器（年/月/日 + 日期选择）
├── KPI 指标卡行（6个指标卡，Grid布局）
│   ├── 入库总量
│   ├── 出库总量
│   ├── 入库金额
│   ├── 出库金额
│   ├── 当前库存
│   └── 待对账金额
├── 趋势图区域
│   ├── 收发货趋势（折线图）
│   └── 金额趋势（折线图）
├── 排行区域（2列布局）
│   ├── 客户发货排行（横向柱状图）
│   └── 产品热度排行（横向柱状图）
├── 分布区域（2列布局）
│   ├── 回款率分布（饼图）
│   └── 延误原因分布（饼图）
├── 热力图区域
│   └── 产品×月份热力图
└── 导出按钮（Excel/PDF）
```


---

## 第44章 工作台 Dashboard 完整规格

### 44.1 页面概述

工作台是系统的首页，展示核心业务概览、待办事项、风险预警和快捷入口。

#### 页面目标

- 一目了然地展示当前业务状态
- 快速进入核心操作（来货登记、快速发货）
- 及时发现风险（超期未回款、库存积压）
- 查看最近操作记录

### 44.2 页面布局

```
工作台页面
├── 页面标题区域
│   ├── 欢迎语 + 当前日期
│   └── 快捷操作按钮（来货登记、快速发货）
├── KPI 指标卡区域（Grid 6列）
│   ├── 今日待收货
│   ├── 今日待发货
│   ├── 待对账笔数
│   ├── 本月入库金额
│   ├── 本月出库金额
│   └── 回款率
├── 中间区域（2列布局）
│   ├── 左侧：待办事项列表
│   │   ├── 待收货任务
│   │   ├── 待发货任务
│   │   └── 待对账任务
│   └── 右侧：风险预警
│       ├── 超期未回款
│       └── 库存积压预警
├── 快捷入口区域（Grid 3-4列）
│   ├── 来货登记（大按钮，琥珀色）
│   ├── 快速发货（大按钮，琥珀色）
│   ├── 库存查询
│   └── 数据统计
└── 实时动态区域
    └── 最近操作记录流水（时间轴）
```

### 44.3 KPI 指标卡

#### 数据定义

| 指标 | 数据来源 | 计算方式 | 展示形式 |
|------|---------|---------|---------|
| 今日待收货 | inbound_record | COUNT(WHERE inbound_date = TODAY AND status = 'pending') | 数字+链接 |
| 今日待发货 | outbound_record | COUNT(WHERE outbound_date = TODAY AND status = 'pending') | 数字+链接 |
| 待对账笔数 | reconciliation | COUNT(WHERE status = 'unmatched') | 数字+链接 |
| 本月入库金额 | inbound_item | SUM(amount WHERE created_at >= MONTH_START) | 金额 |
| 本月出库金额 | outbound_item | SUM(amount WHERE created_at >= MONTH_START) | 金额 |
| 回款率 | reconciliation | SUM(paid) / SUM(outbound) × 100% | 百分比 |

#### 卡片组件

```tsx
function DashboardKPI() {
  const { data: overview } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => statisticsApi.getOverview({ period: 'today' }),
    refetchInterval: 60000,  // 每分钟刷新
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KPICard
        title="今日待收货"
        value={overview?.pendingInbound || 0}
        unit="笔"
        icon={<Inbox className="w-6 h-6" />}
        onClick={() => navigate('/inbound')}
      />
      <KPICard
        title="今日待发货"
        value={overview?.pendingOutbound || 0}
        unit="笔"
        icon={<Outbox className="w-6 h-6" />}
        onClick={() => navigate('/outbound')}
      />
      <KPICard
        title="待对账"
        value={overview?.pendingReconciliation || 0}
        unit="笔"
        icon={<FileText className="w-6 h-6" />}
        onClick={() => navigate('/reconciliation')}
      />
      <KPICard
        title="本月入库"
        value={overview?.inboundAmount || 0}
        unit="元"
        format="currency"
        icon={<TrendingUp className="w-6 h-6" />}
      />
      <KPICard
        title="本月出库"
        value={overview?.outboundAmount || 0}
        unit="元"
        format="currency"
        icon={<TrendingDown className="w-6 h-6" />}
      />
      <KPICard
        title="回款率"
        value={overview?.paymentRate || 0}
        unit="%"
        format="percent"
        trend={overview?.paymentRateTrend}
        trendValue={overview?.paymentRateChange}
      />
    </div>
  );
}
```

### 44.4 待办事项

```tsx
function TodoList() {
  const { data: todos } = useQuery({
    queryKey: ['dashboard', 'todos'],
    queryFn: () => dashboardApi.getTodos(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>待办事项</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {todos?.map((todo) => (
          <div key={todo.id} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors cursor-pointer"
            onClick={() => navigate(todo.link)}>
            <div className={cn('w-2 h-2 rounded-full',
              todo.priority === 'high' ? 'bg-error' :
              todo.priority === 'medium' ? 'bg-warning' : 'bg-info')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{todo.title}</p>
              <p className="text-xs text-muted-foreground">{todo.description}</p>
            </div>
            <Badge variant={todo.status === 'urgent' ? 'error' : 'secondary'}>
              {todo.badge}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### 44.5 风险预警

```tsx
function RiskAlerts() {
  const { data: alerts } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => dashboardApi.getRiskAlerts(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          风险预警
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts?.map((alert) => (
          <div key={alert.id}
            className={cn('border-l-4 p-3 rounded-r-md',
              alert.level === 'error' ? 'border-error bg-error/5' : 'border-warning bg-warning/5')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.detail}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.days}天</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

#### 预警类型

| 预警类型 | 触发条件 | 级别 | 颜色 |
|---------|---------|------|------|
| 超期未回款 | 出库后30天未回款 | error | 红色 |
| 库存积压 | 库存超过90天未变动 | warning | 琥珀色 |
| 库存不足 | 库存低于安全线 | warning | 琥珀色 |
| 待收货超期 | 预计收货日期已过 | error | 红色 |
| 对账差异 | 对账差异金额 > 0 | warning | 琥珀色 |

### 44.6 快捷入口

```tsx
function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <QuickActionCard
        title="来货登记"
        description="扫码/手动录入收货信息"
        icon={<Inbox className="w-8 h-8" />}
        to="/inbound"
        variant="accent"
      />
      <QuickActionCard
        title="快速发货"
        description="智能分批发货打印"
        icon={<Outbox className="w-8 h-8" />}
        to="/outbound"
        variant="accent"
      />
      <QuickActionCard
        title="库存查询"
        description="实时库存状态查看"
        icon={<Package className="w-8 h-8" />}
        to="/inventory"
        variant="default"
      />
      <QuickActionCard
        title="数据统计"
        description="业务数据分析报表"
        icon={<BarChart className="w-8 h-8" />}
        to="/statistics"
        variant="default"
      />
    </div>
  );
}

function QuickActionCard({ title, description, icon, to, variant }) {
  return (
    <Link to={to}>
      <Card className={cn('cursor-pointer transition-all hover:shadow-md hover:-translate-y-1',
        variant === 'accent' && 'border-accent/30 bg-accent/5')}>
        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
          <div className={cn('p-3 rounded-full',
            variant === 'accent' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary')}>
            {icon}
          </div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### 44.7 实时动态

```tsx
function RecentActivity() {
  const { data: activities } = useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: () => dashboardApi.getRecentActivities({ limit: 20 }),
    refetchInterval: 30000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近动态</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.map((activity, index) => (
            <div key={activity.id} className="flex gap-3">
              {/* 时间轴线 */}
              <div className="flex flex-col items-center">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center',
                  getActivityColor(activity.type))}>
                  {getActivityIcon(activity.type)}
                </div>
                {index < activities.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border mt-2" />
                )}
              </div>
              {/* 内容 */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                {activity.operator && (
                  <p className="text-xs text-muted-foreground mt-1">操作人: {activity.operator}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 活动类型

| 类型 | 图标 | 颜色 | 描述 |
|------|------|------|------|
| inbound | Inbox | primary | 入库操作 |
| outbound | Outbox | success | 出库操作 |
| reconciliation | FileText | info | 对账操作 |
| inventory | Package | warning | 库存调整 |
| customer | Users | primary | 客户操作 |
| system | Settings | muted | 系统操作 |

### 44.8 API 接口

```typescript
// 获取工作台概览数据
GET /api/dashboard/overview
Response: {
  pendingInbound: number;
  pendingOutbound: number;
  pendingReconciliation: number;
  inboundAmount: number;
  outboundAmount: number;
  paymentRate: number;
  paymentRateTrend: 'up' | 'down';
  paymentRateChange: number;
}

// 获取待办事项
GET /api/dashboard/todos
Response: Todo[]

// 获取风险预警
GET /api/dashboard/alerts
Response: Alert[]

// 获取最近动态
GET /api/dashboard/activities?limit=20
Response: Activity[]
```

### 44.9 数据刷新策略

| 数据 | 刷新间隔 | 刷新方式 |
|------|---------|---------|
| KPI 指标 | 60秒 | 定时轮询 |
| 待办事项 | 30秒 | 定时轮询 |
| 风险预警 | 60秒 | 定时轮询 |
| 最近动态 | 30秒 | 定时轮询 |
| 页面可见时 | 立即 | visibilitychange 事件 |

```typescript
useEffect(() => {
  const handler = () => {
    if (document.visibilityState === 'visible') {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}, [queryClient]);
```


---

## 第45章 收发货流程完整规格

### 45.1 来货登记流程

#### 三步收货流程

```
Step 1: 选客户                    Step 2: 选产品                    Step 3: 录数据
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│ ● 搜索客户       │     →       │ ● 搜索/导入产品   │     →       │ ● 录入数量/重量  │
│ ● 选择客户       │              │ ● 多维度检索      │              │ ● 拍照上传       │
│ ● 自动带出信息   │              │ ● 批量勾选       │              │ ● 确认提交       │
│                 │              │ ● 清单导入       │              │ ● 自动打印       │
└─────────────────┘              └─────────────────┘              └─────────────────┘
```

#### Step 1: 选客户

```tsx
function SelectCustomerStep({ onSelect, selected }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { data: customers } = useQuery({
    queryKey: ['customers', 'search', debouncedSearch],
    queryFn: () => customerApi.getCustomers({ search: debouncedSearch, pageSize: 20 }),
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索客户名称/联系人/电话"
          className="pl-10 h-12"
        />
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {customers?.items.map((customer) => (
          <div
            key={customer.id}
            onClick={() => onSelect(customer)}
            className={cn('flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all',
              selected?.id === customer.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50 hover:bg-muted/50')}
          >
            <div className="flex-1">
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-muted-foreground">
                {customer.contactPerson} · {customer.phone}
              </p>
            </div>
            {selected?.id === customer.id && <Check className="w-5 h-5 text-primary" />}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Step 2: 选产品

```tsx
function SelectProductStep({ items, onAdd, onRemove }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ material: '', process: '' });

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <div className="flex gap-3">
        <Input placeholder="搜索产品名称" className="flex-1 h-12" />
        <Select value={filters.material} onValueChange={(v) => setFilters({ ...filters, material: v })}>
          <SelectTrigger className="w-40 h-12"><SelectValue placeholder="材质" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="steel">钢材</SelectItem>
            <SelectItem value="aluminum">铝材</SelectItem>
            <SelectItem value="copper">铜材</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="h-12">
          <Upload className="w-4 h-4 mr-2" />
          清单导入
        </Button>
      </div>

      {/* 产品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
        {products?.map((product) => (
          <ProductSelectCard
            key={product.id}
            product={product}
            isSelected={items.some(i => i.productId === product.id)}
            onToggle={() => onToggleProduct(product)}
          />
        ))}
      </div>

      {/* 已选产品 */}
      {items.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">已选 {items.length} 个产品</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <span className="text-sm">{item.productName}</span>
                <Button variant="ghost" size="sm" onClick={() => onRemove(item.productId)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Step 3: 录数据

```tsx
function RecordDataStep({ items, onUpdate, onImageUpload }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={item.productId}>
          <CardHeader>
            <CardTitle className="text-base">{index + 1}. {item.productName}</CardTitle>
            <CardDescription>{item.material} · {item.process} · {item.specification}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>数量</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdate(item.productId, { quantity: parseInt(e.target.value) })}
                className="h-12"
              />
            </div>
            <div>
              <Label>重量(kg)</Label>
              <Input
                type="number"
                value={item.weight}
                onChange={(e) => onUpdate(item.productId, { weight: parseFloat(e.target.value) })}
                className="h-12"
              />
            </div>
            <div>
              <Label>单价</Label>
              <Input
                type="number"
                value={item.unitPrice}
                onChange={(e) => onUpdate(item.productId, { unitPrice: parseFloat(e.target.value) })}
                className="h-12"
              />
            </div>
            <div>
              <Label>金额</Label>
              <div className="h-12 flex items-center font-semibold text-primary">
                ¥{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
              </div>
            </div>
          </CardContent>
          {onImageUpload && (
            <CardContent>
              <ImageUploader
                images={item.images}
                onChange={(images) => onUpdate(item.productId, { images })}
                maxCount={5}
              />
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
```

#### 底部操作栏

```tsx
function StepFooter({ currentStep, totalSteps, onPrev, onNext, onSubmit, loading }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 ml-60 bg-white border-t p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPrev} disabled={currentStep === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 上一步
        </Button>
      </div>
      <div className="flex items-center gap-3">
        {currentStep < totalSteps - 1 ? (
          <Button onClick={onNext} className="bg-primary">
            下一步 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={onSubmit} disabled={loading} className="bg-accent text-foreground">
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Printer className="w-4 h-4 mr-1" />}
            保存并打印
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 45.2 快速发货流程

#### 智能批次推荐

```typescript
async function recommendBatches(customerId: string): Promise<BatchRecommendation[]> {
  const pendingOrders = await outboundApi.getPendingOrders(customerId);
  const inventory = await inventoryApi.getByCustomer(customerId);

  // 按产品分组，匹配库存
  const recommendations = pendingOrders.reduce((acc, order) => {
    const stock = inventory.find(i => i.productId === order.productId);
    if (!stock || stock.currentQty < order.quantity) return acc;

    const batch = acc.find(b => b.batchNo === order.batchNo);
    if (batch) {
      batch.items.push({ ...order, availableQty: stock.currentQty });
    } else {
      acc.push({
        batchNo: order.batchNo || generateBatchNo(),
        items: [{ ...order, availableQty: stock.currentQty }],
        totalQty: order.quantity,
        totalAmount: order.amount,
      });
    }
    return acc;
  }, []);

  return recommendations;
}
```

#### 发货页面

```tsx
function OutboundPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedItems, setSelectedItems] = useState<OutboundItem[]>([]);
  const [batchNo, setBatchNo] = useState('');

  return (
    <div className="space-y-6">
      <PageHeader title="快速发货" />

      {/* 客户选择 */}
      <CustomerSelect value={selectedCustomer} onChange={setSelectedCustomer} />

      {selectedCustomer && (
        <>
          {/* 批次推荐 */}
          <BatchRecommendation
            customerId={selectedCustomer.id}
            onApply={(batch) => {
              setBatchNo(batch.batchNo);
              setSelectedItems(batch.items);
            }}
          />

          {/* 产品勾选列表 */}
          <ProductCheckoutList
            items={availableProducts}
            selected={selectedItems}
            onToggle={toggleItem}
            onQuantityChange={updateQuantity}
          />

          {/* 汇总信息 */}
          <OutboundSummary items={selectedItems} />

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePartialShip}>
              部分发货（结存留存）
            </Button>
            <Button variant="outline" onClick={handleCloseOrder}>
              关单平账
            </Button>
            <Button className="bg-accent text-foreground" onClick={handlePrintAndSave}>
              <Printer className="w-4 h-4 mr-2" /> 保存并打印送货单
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

#### 部分发货逻辑

```typescript
async function partialShip(recordId: string, items: OutboundItem[]) {
  // 1. 创建出库记录（部分发货）
  const record = await outboundApi.create({
    customerId,
    batchNo,
    items: items.filter(i => i.shipQty > 0),
    status: 'partial',
  });

  // 2. 扣减库存
  for (const item of items) {
    if (item.shipQty > 0) {
      await inventoryApi.adjust({
        productId: item.productId,
        qty: -item.shipQty,
        reason: `出库: ${record.recordNo}`,
      });
    }
  }

  // 3. 结存产品自动留存（不关闭记录）
  toast.success(`已发货 ${items.length} 个产品，结存 ${items.filter(i => i.shipQty === 0).length} 个`);
}

async function closeOrder(recordId: string) {
  // 关单：将未发货的明细标记为关闭，平账处理
  await outboundApi.close(recordId);
  toast.success('订单已关闭，已平账处理');
}
```

### 45.3 清单导入

#### Excel 导入

```typescript
async function importProducts(file: File): Promise<ImportResult> {
  const workbook = XLSX.read(await file.arrayBuffer());
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const items: InboundItem[] = rows.map((row: any) => ({
    productName: row['产品名称'] || row['品名'],
    material: row['材质'],
    process: row['工艺'],
    specification: row['规格'],
    quantity: parseInt(row['数量']) || 0,
    weight: parseFloat(row['重量']) || 0,
    unit: row['单位'] || 'kg',
    unitPrice: parseFloat(row['单价']) || 0,
  }));

  const valid = items.filter(i => i.productName && i.quantity > 0);
  const invalid = items.length - valid.length;

  return { items: valid, total: items.length, invalid };
}
```

#### 导入模板下载

```typescript
function downloadImportTemplate() {
  const template = [
    { 产品名称: '示例产品A', 材质: '钢材', 工艺: '淬火', 规格: 'Φ20×100', 数量: 100, 重量: 15.5, 单位: 'kg', 单价: 12.5 },
    { 产品名称: '示例产品B', 材质: '铝材', 工艺: '阳极氧化', 规格: '50×50×10', 数量: 50, 重量: 2.3, 单位: 'kg', 单价: 25.0 },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '产品清单');
  XLSX.writeFile(wb, '来货登记导入模板.xlsx');
}
```

### 45.4 图片上传

```tsx
function ImageUploader({ images, onChange, maxCount = 5 }) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newImages = await Promise.all(
      acceptedFiles.map(async (file) => {
        const { downloadUrl } = await uploadFile(file);
        return downloadUrl;
      })
    );
    onChange([...images, ...newImages].slice(0, maxCount));
  }, [images, maxCount, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: maxCount - images.length,
  });

  return (
    <div className="flex gap-3 flex-wrap">
      {images.map((url, i) => (
        <div key={i} className="relative w-24 h-24 rounded-md overflow-hidden group">
          <Image src={url} alt={`图片${i+1}`} fill className="object-cover" />
          <button
            onClick={() => onChange(images.filter((_, idx) => idx !== i))}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      {images.length < maxCount && (
        <div {...getRootProps()} className={cn(
          'w-24 h-24 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}>
          <input {...getInputProps()} />
          <Camera className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
```

### 45.5 流程卡打印

入库保存后自动触发打印：

```typescript
async function handleInboundSubmit() {
  setLoading(true);
  try {
    // 1. 创建入库记录
    const record = await inboundApi.create({
      customerId: selectedCustomer.id,
      items: items,
      inboundDate: new Date(),
    });

    // 2. 更新库存
    await inventoryApi.batchAdd(items);

    // 3. 获取打印模板
    const template = await printApi.getDefaultTemplate('tagcard');

    // 4. 渲染并打印
    const html = renderTemplate(template, {
      customer_name: selectedCustomer.name,
      record_no: record.recordNo,
      inbound_date: record.inboundDate,
      items: items,
    });

    await printViaBrowser(html);
    toast.success('入库登记成功，流程卡已打印');
    navigate('/');
  } catch (error) {
    toast.error('保存失败，请重试');
  } finally {
    setLoading(false);
  }
}
```


---

## 第46章 对账系统完整规格

### 46.1 系统概述

智能对账模块实现业财一体化，自动核对手动对账、差异预警、对账单生成和回款追踪。

#### 对账流程

```
1. 选择客户 + 对账周期
2. 系统自动汇总出库数据
3. 自动比对开票状态和回款进度
4. 标记差异项（红字预警）
5. 人工核对差异
6. 确认后生成对账单
7. 发送给客户确认
8. 记录回款进度
```

### 46.2 对账状态流转

```
unmatched (未对账)
    │
    ├──→ matched (已对账)
    │         │
    │         ├──→ invoiced (已开票)
    │         │         │
    │         │         ├──→ partial_paid (部分回款)
    │         │         │         │
    │         │         │         ├──→ fully_paid (已回款)
    │         │         │
    │         │         └──→ fully_paid (已回款)
    │         │
    │         └──→ partial_paid → fully_paid
    │
    └──→ disputed (有争议)
              │
              └──→ resolved (已解决) → matched
```

### 46.3 对账数据结构

#### 对账记录

```typescript
interface ReconciliationRecord {
  id: string;
  reconciliationNo: string;       // 对账单号
  customerId: string;
  customerName: string;
  period: string;                  // YYYY-MM
  // 汇总数据
  totalOutboundAmount: number;     // 出库总额
  totalInvoicedAmount: number;     // 开票总额
  totalPaidAmount: number;         // 回款总额
  differenceAmount: number;        // 差异金额
  // 状态
  status: 'unmatched' | 'matched' | 'disputed' | 'resolved';
  matchedAt: string | null;
  matchedBy: string | null;
  // 明细
  items: ReconciliationItem[];
  remark: string;
  createdAt: string;
  updatedAt: string;
}

interface ReconciliationItem {
  id: string;
  reconciliationId: string;
  outboundRecordId: string;
  outboundRecordNo: string;
  outboundDate: string;
  totalAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  difference: number;
  status: 'matched' | 'unmatched' | 'disputed';
  remark: string;
}
```

### 46.4 对账页面

#### 筛选栏

```tsx
function ReconciliationFilter({ onFilter }) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label>客户</Label>
          <CustomerSelect
            value={filters.customerId}
            onChange={(c) => onFilter({ customerId: c?.id })}
            placeholder="选择客户"
          />
        </div>
        <div>
          <Label>对账周期</Label>
          <DatePicker
            value={filters.period}
            onChange={(date) => onFilter({ period: dayjs(date).format('YYYY-MM') })}
            picker="month"
          />
        </div>
        <div>
          <Label>状态</Label>
          <Select value={filters.status} onValueChange={(v) => onFilter({ status: v })}>
            <SelectTrigger className="w-32"><SelectValue placeholder="全部" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="unmatched">未对账</SelectItem>
              <SelectItem value="matched">已对账</SelectItem>
              <SelectItem value="disputed">有争议</SelectItem>
              <SelectItem value="resolved">已解决</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-primary" onClick={() => onFilter(filters)}>
          <Search className="w-4 h-4 mr-1" /> 查询
        </Button>
        <Button variant="outline" onClick={handleGenerate}>
          <FilePlus className="w-4 h-4 mr-1" /> 生成对账单
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 对账明细表格

```tsx
function ReconciliationTable({ records, onMatch, onDispute }) {
  const columns = [
    {
      title: '出库单号',
      dataIndex: 'outboundRecordNo',
      width: 150,
    },
    {
      title: '出库日期',
      dataIndex: 'outboundDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '出库金额',
      dataIndex: 'totalAmount',
      width: 120,
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: '已开票',
      dataIndex: 'invoicedAmount',
      width: 120,
      align: 'right',
      render: (val: number, row) => (
        <span className={val === 0 ? 'text-error' : ''}>{formatCurrency(val)}</span>
      ),
    },
    {
      title: '已回款',
      dataIndex: 'paidAmount',
      width: 120,
      align: 'right',
      render: (val: number, row) => (
        <span className={val < row.totalAmount ? 'text-warning' : 'text-success'}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: '差异',
      dataIndex: 'difference',
      width: 120,
      align: 'right',
      render: (val: number) => (
        <span className={val !== 0 ? 'text-error font-semibold' : 'text-muted-foreground'}>
          {val !== 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = {
          matched: { label: '已对账', variant: 'success' },
          unmatched: { label: '未对账', variant: 'warning' },
          disputed: { label: '有争议', variant: 'error' },
        };
        const cfg = config[status] || config.unmatched;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      title: '操作',
      width: 150,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onMatch(row)}>核对</Button>
          <Button size="sm" variant="ghost" onClick={() => onDispute(row)}>标记争议</Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1000 }}
      />
    </Card>
  );
}
```

#### 汇总区域

```tsx
function ReconciliationSummary({ records }) {
  const summary = useMemo(() => {
    return records.reduce((acc, r) => ({
      totalOutbound: acc.totalOutbound + r.totalAmount,
      totalInvoiced: acc.totalInvoiced + r.invoicedAmount,
      totalPaid: acc.totalPaid + r.paidAmount,
      totalDifference: acc.totalDifference + r.difference,
      unmatchedCount: acc.unmatchedCount + (r.status === 'unmatched' ? 1 : 0),
    }), { totalOutbound: 0, totalInvoiced: 0, totalPaid: 0, totalDifference: 0, unmatchedCount: 0 });
  }, [records]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <SummaryCard label="出库总额" value={summary.totalOutbound} format="currency" />
      <SummaryCard label="已开票" value={summary.totalInvoiced} format="currency" />
      <SummaryCard label="已回款" value={summary.totalPaid} format="currency" />
      <SummaryCard
        label="差异金额"
        value={summary.totalDifference}
        format="currency"
        className={summary.totalDifference !== 0 ? 'text-error' : ''}
      />
      <SummaryCard label="未对账笔数" value={summary.unmatchedCount} format="number" />
    </div>
  );
}
```

### 46.5 对账单生成

```typescript
async function generateReconciliation(customerId: string, period: string) {
  // 1. 获取该客户该周期的所有出库记录
  const outboundRecords = await outboundApi.getByCustomerAndPeriod(customerId, period);

  if (outboundRecords.length === 0) {
    toast.warning('该客户在此周期内无出库记录');
    return;
  }

  // 2. 汇总数据
  const totalOutbound = outboundRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalInvoiced = outboundRecords.reduce((sum, r) => sum + (r.invoicedAmount || 0), 0);
  const totalPaid = outboundRecords.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
  const difference = totalOutbound - totalInvoiced;

  // 3. 创建对账记录
  const reconciliation = await reconciliationApi.create({
    reconciliationNo: generateReconciliationNo(),
    customerId,
    period,
    totalOutboundAmount: totalOutbound,
    totalInvoicedAmount: totalInvoiced,
    totalPaidAmount: totalPaid,
    differenceAmount: difference,
    status: 'unmatched',
    items: outboundRecords.map(r => ({
      outboundRecordId: r.id,
      outboundRecordNo: r.recordNo,
      outboundDate: r.outboundDate,
      totalAmount: r.totalAmount,
      invoicedAmount: r.invoicedAmount || 0,
      paidAmount: r.paidAmount || 0,
      difference: r.totalAmount - (r.invoicedAmount || 0),
      status: r.invoicedAmount === r.totalAmount ? 'matched' : 'unmatched',
    })),
  });

  toast.success(`对账单 ${reconciliation.reconciliationNo} 已生成`);
  return reconciliation;
}
```

### 46.6 回款追踪

```tsx
function PaymentTracking({ reconciliation, onRecordPayment }) {
  const [paymentDialog, setPaymentDialog] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>回款追踪</span>
          <Button size="sm" onClick={() => setPaymentDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> 记录回款
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 回款进度条 */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">回款进度</span>
              <span className="text-sm font-medium">
                {formatCurrency(reconciliation.totalPaidAmount)} / {formatCurrency(reconciliation.totalOutboundAmount)}
              </span>
            </div>
            <Progress
              value={(reconciliation.totalPaidAmount / reconciliation.totalOutboundAmount) * 100}
              className="h-3"
            />
            <p className="text-xs text-muted-foreground mt-1">
              回款率 {((reconciliation.totalPaidAmount / reconciliation.totalOutboundAmount) * 100).toFixed(1)}%
            </p>
          </div>

          {/* 回款记录列表 */}
          <div className="space-y-2">
            {reconciliation.payments?.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div>
                  <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-muted-foreground">{payment.date} · {payment.method}</p>
                </div>
                <Badge variant={payment.confirmed ? 'success' : 'warning'}>
                  {payment.confirmed ? '已确认' : '待确认'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <PaymentDialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        reconciliationId={reconciliation.id}
        onConfirm={onRecordPayment}
      />
    </Card>
  );
}
```

### 46.7 对账单导出

```typescript
async function exportReconciliation(reconciliationId: string, format: 'pdf' | 'excel') {
  const reconciliation = await reconciliationApi.getById(reconciliationId);

  if (format === 'excel') {
    const data = reconciliation.items.map(item => ({
      '出库单号': item.outboundRecordNo,
      '出库日期': formatDate(item.outboundDate),
      '出库金额': item.totalAmount,
      '已开票': item.invoicedAmount,
      '已回款': item.paidAmount,
      '差异': item.difference,
      '状态': item.status,
    }));

    data.push({
      '出库单号': '合计',
      '出库日期': '',
      '出库金额': reconciliation.totalOutboundAmount,
      '已开票': reconciliation.totalInvoicedAmount,
      '已回款': reconciliation.totalPaidAmount,
      '差异': reconciliation.differenceAmount,
      '状态': '',
    });

    exportToExcel(data, `对账单_${reconciliation.reconciliationNo}`);
  } else {
    const template = await printApi.getTemplate('reconciliation');
    const html = renderTemplate(template, reconciliation);
    const blob = new Blob([html], { type: 'text/html' });
    printViaBrowser(html);
  }
}
```

### 46.8 API 接口

```typescript
// 对账列表
GET /api/reconciliation?customerId=&period=&status=&page=1&pageSize=20
Response: PaginatedResponse<ReconciliationRecord>

// 对账详情
GET /api/reconciliation/:id
Response: ReconciliationRecord & { items: ReconciliationItem[], payments: Payment[] }

// 生成对账单
POST /api/reconciliation/generate
Body: { customerId, period }
Response: ReconciliationRecord

// 核对明细
POST /api/reconciliation/:id/match
Body: { itemId, matched: boolean, remark }

// 标记争议
POST /api/reconciliation/:id/dispute
Body: { itemId, reason }

// 记录回款
POST /api/reconciliation/:id/payment
Body: { amount, date, method, remark }

// 导出
GET /api/reconciliation/:id/export?format=pdf|excel
Response: Blob
```


---

## 第47章 安全与合规规范

### 47.1 认证与授权

#### 认证机制

系统使用平台内置的身份认证服务，基于飞书 SSO 实现单点登录。

| 认证方式 | 说明 | 适用场景 |
|---------|------|---------|
| 飞书 SSO | 飞书内置登录 | 所有用户 |
| Webhook 认证 | API Key | 对外开放接口 |
| Bearer Token | JWT Token | API 调用 |

#### @NeedLogin 装饰器

```typescript
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

// 写操作必须加 @NeedLogin
@NeedLogin()
@Post()
async create(@Req() req: Request, @Body() dto: CreateDto) {
  const { userId } = req.userContext;
  return this.service.create({ ...dto, createdBy: userId });
}

// 读操作默认不需要登录（公开接口）
@Get()
async list(@Query() query: ListDto) {
  return this.service.findAll(query);
}
```

#### 请求头认证

```
Authorization: Bearer <token>
X-Organization-Code: <org_code>
x-larkgw-suda-webuser: <user_info>
```

### 47.2 数据安全

#### 多租户数据隔离

1. **物理隔离**：每个组织拥有独立数据库
2. **连接隔离**：每个请求获取对应的租户数据库连接
3. **权限验证**：中间件验证用户对组织的访问权限

#### 敏感数据保护

| 数据类型 | 保护措施 |
|---------|---------|
| 数据库密码 | 加密存储在主库 organization 表 |
| 用户密码 | 不存储（使用飞书 SSO） |
| API Key | 环境变量注入，不写入代码 |
| 个人信息 | 仅存储必要的用户 ID，不存储敏感个人信息 |
| 操作日志 | 记录操作者和操作内容，不记录敏感数据 |

#### SQL 注入防护

```typescript
// ✅ 使用 Drizzle ORM 参数化查询（自动防注入）
const result = await db.select().from(customers).where(eq(customers.id, id));

// ✅ 被迫写原生 SQL 时，使用 sql 模板标签
const result = await db.execute(sql`SELECT * FROM customer WHERE id = ${id}`);

// ❌ 禁止：字符串拼接 SQL
const result = await db.execute(`SELECT * FROM customer WHERE id = '${id}'`);
```

#### XSS 防护

1. React 默认转义 JSX 中的变量
2. 使用 `dangerouslySetInnerHTML` 时必须先 sanitize
3. 富文本内容通过 Tiptap 编辑器处理（内置 sanitize）

```typescript
import DOMPurify from 'dompurify';

// 渲染用户输入的 HTML 前必须 sanitize
const safeHtml = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

#### CSRF 防护

1. API 仅接受 JSON 请求体（不支持 form-urlencoded）
2. 使用 Bearer Token 认证（非 Cookie）
3. CORS 配置仅允许同源请求

### 47.3 文件上传安全

```typescript
// 文件类型白名单
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new BadRequestException('不支持的文件类型');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException('文件大小超过限制（10MB）');
  }
}
```

### 47.4 接口安全

#### 速率限制

```typescript
// NestJS Throttler 配置
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,    // 60秒
      limit: 100,    // 每分钟100次
    }]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
```

#### 输入校验

```typescript
// 使用 class-validator + DTO
export class CreateCustomerDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
```

#### 输出过滤

```typescript
// Service 返回时过滤敏感字段
async findById(id: string) {
  const result = await this.db.select().from(customers).where(eq(customers.id, id));
  if (!result[0]) throw new NotFoundException();
  const { dbPassword, ...safeData } = result[0]; // 过滤内部字段
  return safeData;
}
```

### 47.5 操作审计

#### 审计日志记录

```typescript
// 审计装饰器
export function AuditLog(module: string, action: string) {
  return SetMetadata('audit', { module, action });
}

// 审计拦截器
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const auditMeta = this.reflector.get('audit', context.getHandler());
    if (!auditMeta) return next.handle();

    const request = context.switchToHttp().getRequest();
    const { userId } = request.userContext;

    return next.handle().pipe(
      tap(() => {
        // 异步记录日志
        this.logService.record({
          userId,
          module: auditMeta.module,
          action: auditMeta.action,
          targetType: request.params.id ? 'record' : 'list',
          targetId: request.params.id,
          description: `${auditMeta.module} - ${auditMeta.action}`,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
      })
    );
  }
}

// 使用
@AuditLog('customer', 'create')
@NeedLogin()
@Post()
async create(@Req() req: Request, @Body() dto: CreateCustomerDto) {
  return this.customerService.create(dto);
}
```

#### 日志查询

```typescript
// 权限管理页面 → 操作日志
GET /api/permission/logs?userId=&module=&action=&startDate=&endDate=&page=1&pageSize=20
```

### 47.6 前端安全

#### Token 存储

```typescript
// Token 存储在内存中（不持久化到 localStorage）
let authToken: string | null = null;

export function setToken(token: string) {
  authToken = token;
}

export function getToken(): string | null {
  return authToken;
}
```

#### 路由守卫

```tsx
// 未登录跳转
function AuthGuard({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// 权限检查
function RoleGuard({ children, roles }) {
  const { hasAnyRole } = useAuth();
  if (!hasAnyRole(roles)) {
    return <Navigate to="/403" replace />;
  }
  return children;
}
```

#### 敏感操作确认

```tsx
// 删除操作二次确认
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">删除</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除？</AlertDialogTitle>
      <AlertDialogDescription>
        此操作不可撤销，将永久删除该记录及其关联数据。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>确认删除</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 47.7 环境安全

#### 环境变量

```typescript
// 禁止在代码中硬编码密钥
// ✅ 从环境变量读取
const dbPassword = process.env.DB_PASSWORD;

// ❌ 禁止硬编码
const dbPassword = 'my_secret_password';
```

#### 生产环境配置

```typescript
// 生产环境强制 HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
```

### 47.8 数据备份

| 数据库 | 备份频率 | 保留时长 | 恢复方式 |
|--------|---------|---------|---------|
| 主库 | 每日 | 30天 | PITR（时间点恢复） |
| 租户库 | 每日 | 30天 | PITR（时间点恢复） |

### 47.9 合规清单

| 合规项 | 状态 | 说明 |
|--------|------|------|
| 用户认证 | ✅ | 飞书 SSO |
| 权限控制 | ✅ | RBAC + 数据范围 |
| 数据隔离 | ✅ | Database-per-Tenant |
| 操作审计 | ✅ | 全量操作日志 |
| SQL 注入防护 | ✅ | Drizzle ORM 参数化 |
| XSS 防护 | ✅ | React 自动转义 + DOMPurify |
| CSRF 防护 | ✅ | Bearer Token + JSON API |
| 文件上传校验 | ✅ | 类型+大小白名单 |
| 速率限制 | ✅ | NestJS Throttler |
| 敏感数据加密 | ✅ | 数据库密码加密存储 |
| HTTPS | ✅ | 生产环境强制 |
| 数据备份 | ✅ | 每日备份+PITR |


---

## 第48章 路由系统与页面导航

### 48.1 路由架构

系统使用 React Router DOM v6 实现客户端路由，所有路由定义在 `client/src/app.tsx` 中。

#### 路由配置

```tsx
// client/src/app.tsx
import { Routes, Route } from 'react-router-dom';

import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import InboundPage from '@/pages/InboundPage';
import OutboundPage from '@/pages/OutboundPage';
import InventoryPage from '@/pages/InventoryPage';
import ReconciliationPage from '@/pages/ReconciliationPage';
import StatisticsPage from '@/pages/StatisticsPage';
import CustomerListPage from '@/pages/CustomerListPage';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import ProductListPage from '@/pages/ProductListPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import TemplateConfigPage from '@/pages/TemplateConfigPage';
import PermissionPage from '@/pages/PermissionPage';
import OrganizationPage from '@/pages/OrganizationPage';
import NotFound from '@/pages/NotFound/NotFound';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* 首页 */}
        <Route index element={<DashboardPage />} />

        {/* 核心业务 */}
        <Route path="inbound" element={<InboundPage />} />
        <Route path="outbound" element={<OutboundPage />} />
        <Route path="inventory" element={<InventoryPage />} />

        {/* 财务 */}
        <Route path="reconciliation" element={<ReconciliationPage />} />
        <Route path="statistics" element={<StatisticsPage />} />

        {/* 基础数据 */}
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />

        {/* 系统设置 */}
        <Route path="settings/templates" element={<TemplateConfigPage />} />
        <Route path="settings/permissions" element={<PermissionPage />} />

        {/* 组织管理 */}
        <Route path="organizations" element={<OrganizationPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
```

### 48.2 路由清单

| 路由 | 页面组件 | 文件名 | 类型 | 权限 |
|------|---------|--------|------|------|
| `/` | DashboardPage | DashboardPage.tsx | 一级 | 全部角色 |
| `/inbound` | InboundPage | InboundPage.tsx | 一级 | admin, inbound_operator |
| `/outbound` | OutboundPage | OutboundPage.tsx | 一级 | admin, outbound_operator |
| `/inventory` | InventoryPage | InventoryPage.tsx | 一级 | admin, inbound_operator, outbound_operator |
| `/reconciliation` | ReconciliationPage | ReconciliationPage.tsx | 一级 | admin, finance |
| `/statistics` | StatisticsPage | StatisticsPage.tsx | 一级 | admin, finance, viewer |
| `/customers` | CustomerListPage | CustomerListPage.tsx | 一级 | admin |
| `/customers/:id` | CustomerDetailPage | CustomerDetailPage.tsx | 二级 | admin |
| `/products` | ProductListPage | ProductListPage.tsx | 一级 | admin |
| `/products/:id` | ProductDetailPage | ProductDetailPage.tsx | 二级 | admin |
| `/settings/templates` | TemplateConfigPage | TemplateConfigPage.tsx | 一级 | admin |
| `/settings/permissions` | PermissionPage | PermissionPage.tsx | 一级 | super_admin |
| `/organizations` | OrganizationPage | OrganizationPage.tsx | 一级 | 全部角色（登录后） |

### 48.3 导航配置

#### 侧边栏导航项

```typescript
const NAV_ITEMS = [
  {
    label: '工作台',
    path: '/',
    icon: Dashboard,
    roles: ['super_admin', 'admin', 'finance', 'inbound_operator', 'outbound_operator', 'member', 'viewer'],
  },
  {
    label: '来货登记',
    path: '/inbound',
    icon: Inbox,
    roles: ['super_admin', 'admin', 'inbound_operator'],
  },
  {
    label: '快速发货',
    path: '/outbound',
    icon: Outbox,
    roles: ['super_admin', 'admin', 'outbound_operator'],
  },
  {
    label: '库存管理',
    path: '/inventory',
    icon: Package,
    roles: ['super_admin', 'admin', 'inbound_operator', 'outbound_operator'],
  },
  {
    label: '智能对账',
    path: '/reconciliation',
    icon: FileText,
    roles: ['super_admin', 'admin', 'finance'],
  },
  {
    label: '数据统计',
    path: '/statistics',
    icon: BarChart,
    roles: ['super_admin', 'admin', 'finance', 'viewer'],
  },
  {
    label: '基础数据',
    path: '/customers',
    icon: Database,
    roles: ['super_admin', 'admin'],
    children: [
      { label: '客户管理', path: '/customers' },
      { label: '产品管理', path: '/products' },
    ],
  },
  {
    label: '系统设置',
    path: '/settings/templates',
    icon: Settings,
    roles: ['super_admin', 'admin'],
    children: [
      { label: '打印模板', path: '/settings/templates' },
      { label: '权限管理', path: '/settings/permissions', roles: ['super_admin'] },
    ],
  },
];
```

#### 导航渲染

```tsx
function Sidebar() {
  const { roles } = useAuth();
  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.some(role => roles.includes(role))
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-primary flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-white/10">
        <span className="text-white font-bold text-lg">热处理管理系统</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-white/10 p-3">
        <UserProfile />
      </div>
    </aside>
  );
}

function NavItem({ item }) {
  const location = useLocation();
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path));

  return (
    <NavLink
      to={item.path}
      className={cn(
        'flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-white/20 text-white border-l-[3px] border-accent'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      )}
    >
      {item.icon && <item.icon className="w-5 h-5" />}
      <span>{item.label}</span>
    </NavLink>
  );
}
```

### 48.4 路由守卫

#### 认证守卫

```tsx
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

#### 角色守卫

```tsx
function RoleGuard({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { hasAnyRole } = useAuth();

  if (!hasAnyRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

#### 组织守卫

```tsx
function TenantGuard({ children }: { children: React.ReactNode }) {
  const { orgCode } = useTenant();
  const location = useLocation();

  // 组织选择页面不需要检查
  if (location.pathname === '/organizations') {
    return <>{children}</>;
  }

  if (!orgCode) {
    return <Navigate to="/organizations" replace />;
  }

  return <>{children}</>;
}
```

### 48.5 页面跳转

#### 编程式导航

```typescript
import { useNavigate, Link, NavLink } from 'react-router-dom';

// 方式1：useNavigate
const navigate = useNavigate();
navigate('/customers/123');
navigate(-1); // 后退
navigate('/', { replace: true }); // 替换历史

// 方式2：Link 组件
<Link to="/customers/123">查看详情</Link>

// 方式3：NavLink（带 active 状态）
<NavLink to="/customers" className={({ isActive }) => isActive ? 'active' : ''}>
  客户管理
</NavLink>
```

**禁止使用 `window.location.href`**，必须用 React Router 导航。

#### 分享链接

```typescript
import { resolveAppUrl } from '@lark-apaas/client-toolkit/utils/resolveAppUrl';

// 生成分享链接
const shareUrl = resolveAppUrl(`/customers/${id}`);
```

### 48.6 路由参数

#### useParams

```tsx
function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id!),
  });

  if (!customer) return <Loading />;
  return <CustomerDetail customer={customer} />;
}
```

#### useSearchParams

```tsx
function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('q') || '';

  const handleSearch = (q: string) => {
    setSearchParams({ q, page: '1' });
  };

  const handlePage = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', String(newPage));
      return prev;
    });
  };
}
```

### 48.7 404 页面

```tsx
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl font-bold text-muted-foreground">404</div>
      <p className="text-muted-foreground">页面不存在</p>
      <Button asChild>
        <Link to="/">返回首页</Link>
      </Button>
    </div>
  );
}
```

### 48.8 布局组件

```tsx
function Layout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-60 p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

`<Outlet />` 渲染匹配的子路由组件。

### 48.9 移动端适配

```tsx
function Layout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* 移动端顶栏 */}
      {isMobile && (
        <header className="sticky top-0 z-50 bg-primary h-16 flex items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-white" />
          </Button>
          <span className="text-white font-bold ml-3">热处理管理系统</span>
        </header>
      )}

      {/* 移动端抽屉侧边栏 */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0 bg-primary">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* 桌面端固定侧边栏 */}
      {!isMobile && <Sidebar />}

      {/* 内容区 */}
      <main className={cn(isMobile ? 'p-4' : 'ml-60 p-6')}>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```


---

## 第49章 客户管理模块完整规格

### 49.1 模块概述

客户管理模块维护客户基础信息、历史收发货记录和个性化配置。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 客户列表 | `/customers` | 分页列表、搜索、筛选 |
| 客户详情 | `/customers/:id` | 基本信息+历史记录 |
| 新增客户 | 弹窗 | 表单录入 |
| 编辑客户 | 弹窗 | 表单编辑 |
| 删除客户 | 列表操作 | 二次确认 |
| 查看历史 | 详情页 | 收发货记录列表 |

### 49.2 客户列表页

#### 页面结构

```
客户管理页面
├── 页面标题 + 新增按钮
├── 搜索筛选栏
│   ├── 搜索框（名称/联系人/电话）
│   └── 筛选下拉（材质）
├── 数据表格
│   ├── 客户名称
│   ├── 联系人
│   ├── 电话
│   ├── 地址
│   ├── 创建时间
│   └── 操作（查看/编辑/删除）
├── 分页器
└── 新增/编辑弹窗
```

#### 搜索筛选

```tsx
function CustomerFilterBar({ onFilter }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    onFilter({ search: debouncedSearch });
  }, [debouncedSearch]);

  return (
    <div className="flex gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索客户名称、联系人、电话"
          className="pl-10"
        />
      </div>
      <Button onClick={() setShowCreateDialog(true)} className="bg-primary">
        <Plus className="w-4 h-4 mr-1" /> 新增客户
      </Button>
    </div>
  );
}
```

#### 数据表格

```tsx
function CustomerTable({ data, loading, onEdit, onDelete, onView }) {
  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      render: (name: string, record) => (
        <button onClick={() => onView(record)} className="text-primary hover:underline font-medium">
          {name}
        </button>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      render: (phone: string) => phone || '—',
    },
    {
      title: '地址',
      dataIndex: 'address',
      ellipsis: true,
      render: (addr: string) => addr || '—',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (date: string) => formatDate(date),
      width: 120,
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onView(record)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(record)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(record)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={false}
    />
  );
}
```

### 49.3 客户详情页

```tsx
function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id!),
  });
  const { data: history } = useQuery({
    queryKey: ['customer', id, 'history'],
    queryFn: () => customerApi.getHistory(id!),
  });

  if (isLoading) return <Loading />;
  if (!customer) return <NotFound />;

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <Breadcrumb>
        <BreadcrumbItem><Link to="/customers">客户管理</Link></BreadcrumbItem>
        <BreadcrumbItem>{customer.name}</BreadcrumbItem>
      </Breadcrumb>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>客户信息</CardTitle>
          <Button size="sm" variant="outline" onClick={() => navigate(`/customers/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-1" /> 编辑
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DetailItem label="客户名称" value={customer.name} />
            <DetailItem label="联系人" value={customer.contactPerson} />
            <DetailItem label="电话" value={customer.phone} />
            <DetailItem label="邮箱" value={customer.email} />
            <DetailItem label="地址" value={customer.address} span={2} />
            <DetailItem label="税号" value={customer.taxNumber} />
            <DetailItem label="开户行" value={customer.bankName} />
            <DetailItem label="银行账号" value={customer.bankAccount} />
            <DetailItem label="备注" value={customer.remark} span={3} />
          </dl>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="入库笔数" value={history?.inboundCount || 0} />
        <StatCard label="出库笔数" value={history?.outboundCount || 0} />
        <StatCard label="累计金额" value={history?.totalAmount || 0} format="currency" />
        <StatCard label="回款率" value={history?.paymentRate || 0} format="percent" />
      </div>

      {/* 历史记录 */}
      <Card>
        <CardHeader>
          <CardTitle>收发货历史</CardTitle>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="inbound">入库记录</TabsTrigger>
              <TabsTrigger value="outbound">出库记录</TabsTrigger>
              <TabsTrigger value="reconciliation">对账记录</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {tab === 'inbound' && <InboundHistoryTable data={history?.inboundRecords} />}
          {tab === 'outbound' && <OutboundHistoryTable data={history?.outboundRecords} />}
          {tab === 'reconciliation' && <ReconciliationHistoryTable data={history?.reconciliationRecords} />}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 49.4 新增/编辑表单

```tsx
function CustomerFormDialog({ open, onClose, customer }) {
  const form = useForm({
    defaultValues: customer || {
      name: '', contactPerson: '', phone: '', email: '',
      address: '', taxNumber: '', bankName: '', bankAccount: '', remark: '',
    },
    validators: {
      onChange: {
        name: ({ value }) => !value ? '客户名称必填' : undefined,
        phone: ({ value }) => value && !isValidPhone(value) ? '手机号格式不正确' : undefined,
        email: ({ value }) => value && !isValidEmail(value) ? '邮箱格式不正确' : undefined,
      },
    },
  });

  const mutation = useMutation({
    mutationFn: (values) => customer
      ? customerApi.update(customer.id, values)
      : customerApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(customer ? '更新成功' : '创建成功');
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer ? '编辑客户' : '新增客户'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <FormField name="name">
              <FieldLabel>客户名称 <span className="text-error">*</span></FieldLabel>
              <Input value={form.state.values.name}
                onChange={(e) => form.setFieldValue('name', e.target.value)} />
              <FieldError>{form.state.errors.name}</FieldError>
            </FormField>

            <FormField name="contactPerson">
              <FieldLabel>联系人</FieldLabel>
              <Input value={form.state.values.contactPerson}
                onChange={(e) => form.setFieldValue('contactPerson', e.target.value)} />
            </FormField>

            <FormField name="phone">
              <FieldLabel>电话</FieldLabel>
              <Input value={form.state.values.phone}
                onChange={(e) => form.setFieldValue('phone', e.target.value)} />
              <FieldError>{form.state.errors.phone}</FieldError>
            </FormField>

            <FormField name="email">
              <FieldLabel>邮箱</FieldLabel>
              <Input type="email" value={form.state.values.email}
                onChange={(e) => form.setFieldValue('email', e.target.value)} />
              <FieldError>{form.state.errors.email}</FieldError>
            </FormField>

            <FormField name="address" className="col-span-2">
              <FieldLabel>地址</FieldLabel>
              <Input value={form.state.values.address}
                onChange={(e) => form.setFieldValue('address', e.target.value)} />
            </FormField>

            <FormField name="taxNumber">
              <FieldLabel>税号</FieldLabel>
              <Input value={form.state.values.taxNumber}
                onChange={(e) => form.setFieldValue('taxNumber', e.target.value)} />
            </FormField>

            <FormField name="bankName">
              <FieldLabel>开户行</FieldLabel>
              <Input value={form.state.values.bankName}
                onChange={(e) => form.setFieldValue('bankName', e.target.value)} />
            </FormField>

            <FormField name="bankAccount">
              <FieldLabel>银行账号</FieldLabel>
              <Input value={form.state.values.bankAccount}
                onChange={(e) => form.setFieldValue('bankAccount', e.target.value)} />
            </FormField>

            <FormField name="remark" className="col-span-2">
              <FieldLabel>备注</FieldLabel>
              <Textarea rows={3} value={form.state.values.remark}
                onChange={(e) => form.setFieldValue('remark', e.target.value)} />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {customer ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 49.5 API 接口

```typescript
// 客户列表
GET /api/customers?search=&page=1&pageSize=20
Response: PaginatedResponse<Customer>

// 客户详情
GET /api/customers/:id
Response: Customer

// 创建客户
POST /api/customers
Body: { name, contactPerson, phone, email, address, taxNumber, bankName, bankAccount, remark }
Response: Customer

// 更新客户
PUT /api/customers/:id
Body: Partial<Customer>
Response: Customer

// 删除客户
DELETE /api/customers/:id
Response: { id: string }

// 客户历史记录
GET /api/customers/:id/history
Response: { inboundCount, outboundCount, totalAmount, paymentRate, inboundRecords, outboundRecords, reconciliationRecords }

// 客户下拉列表（搜索）
GET /api/customers/search?q=keyword&limit=20
Response: { items: { id, name, contactPerson, phone }[] }
```

### 49.6 客户缓存

```typescript
// 全局客户列表缓存（用于快速检索）
const [customerList, setCustomerList] = useLocalStorage(STORAGE_KEYS.CUSTOMER_LIST, []);

// 启动时加载
useEffect(() => {
  customerApi.getAll().then(list => setCustomerList(list));
}, []);
```

缓存用途：
- 来货登记页面快速选择客户
- 快速发货页面快速选择客户
- 智能对账页面快速选择客户


---

## 第50章 产品管理模块完整规格

### 50.1 模块概述

产品管理模块维护产品基础数据库，包括产品名称、材质、工艺、规格、计价方式等。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 产品列表 | `/products` | 分页列表、搜索、筛选 |
| 产品详情 | `/products/:id` | 基本信息+库存信息 |
| 新增产品 | 弹窗 | 表单录入 |
| 编辑产品 | 弹窗 | 表单编辑 |
| 删除产品 | 列表操作 | 二次确认 |
| 多维检索 | 列表页 | 名称/材质/工艺组合筛选 |

### 50.2 产品列表页

#### 多维检索

```tsx
function ProductFilterBar({ onFilter }) {
  const [search, setSearch] = useState('');
  const [material, setMaterial] = useState('');
  const [process, setProcess] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    onFilter({ search: debouncedSearch, material, process });
  }, [debouncedSearch, material, process]);

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索产品名称、规格"
          className="pl-10"
        />
      </div>
      <Select value={material} onValueChange={setMaterial}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="材质" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部材质</SelectItem>
          <SelectItem value="steel">钢材</SelectItem>
          <SelectItem value="aluminum">铝材</SelectItem>
          <SelectItem value="copper">铜材</SelectItem>
          <SelectItem value="other">其他</SelectItem>
        </SelectContent>
      </Select>
      <Select value={process} onValueChange={setProcess}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="工艺" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部工艺</SelectItem>
          <SelectItem value="quench">淬火</SelectItem>
          <SelectItem value="temper">回火</SelectItem>
          <SelectItem value="anneal">退火</SelectItem>
          <SelectItem value="normalize">正火</SelectItem>
          <SelectItem value="carburize">渗碳</SelectItem>
          <SelectItem value="nitride">渗氮</SelectItem>
        </SelectContent>
      </Select>
      <Button className="bg-primary" onClick={() => setShowCreateDialog(true)}>
        <Plus className="w-4 h-4 mr-1" /> 新增产品
      </Button>
    </div>
  );
}
```

#### 产品表格

```tsx
function ProductTable({ data, loading, onEdit, onDelete }) {
  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      render: (name, record) => (
        <button onClick={() => onView(record)} className="text-primary hover:underline font-medium">
          {name}
        </button>
      ),
    },
    {
      title: '材质',
      dataIndex: 'material',
      width: 100,
      render: (val: string) => val ? <Badge variant="secondary">{val}</Badge> : '—',
    },
    {
      title: '工艺',
      dataIndex: 'process',
      width: 100,
      render: (val: string) => val || '—',
    },
    {
      title: '规格',
      dataIndex: 'specification',
      width: 150,
      render: (val: string) => val || '—',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 60,
    },
    {
      title: '计价方式',
      dataIndex: 'pricingMethod',
      width: 100,
      render: (val: string) => {
        const map = { weight: '按重量', piece: '按件数' };
        return map[val] || val;
      },
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      width: 100,
      align: 'right',
      render: (val: number) => val ? `¥${val}` : '—',
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(record)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(record)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />;
}
```

### 50.3 产品详情页

```tsx
function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(id!),
  });
  const { data: inventory } = useQuery({
    queryKey: ['product', id, 'inventory'],
    queryFn: () => inventoryApi.getByProduct(id!),
  });
  const { data: records } = useQuery({
    queryKey: ['product', id, 'records'],
    queryFn: () => productApi.getRecords(id!),
  });

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbItem><Link to="/products">产品管理</Link></BreadcrumbItem>
        <BreadcrumbItem>{product?.name}</BreadcrumbItem>
      </Breadcrumb>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>产品信息</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DetailItem label="产品名称" value={product?.name} />
            <DetailItem label="材质" value={product?.material} />
            <DetailItem label="工艺" value={product?.process} />
            <DetailItem label="规格" value={product?.specification} />
            <DetailItem label="单位" value={product?.unit} />
            <DetailItem label="计价方式" value={product?.pricingMethod === 'weight' ? '按重量' : '按件数'} />
            <DetailItem label="单价" value={product?.unitPrice ? `¥${product.unitPrice}` : '—'} />
            <DetailItem label="最小起订量" value={product?.minOrderQty} />
            <DetailItem label="备注" value={product?.remark} span={3} />
          </dl>
        </CardContent>
      </Card>

      {/* 库存信息 */}
      <Card>
        <CardHeader>
          <CardTitle>库存信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="当前库存" value={inventory?.currentQty || 0} unit={product?.unit} />
            <StatCard label="当前重量" value={inventory?.currentWeight || 0} unit="kg" />
            <StatCard label="库位" value={inventory?.location || '—'} />
            <StatCard label="入库日期" value={inventory?.inboundDate ? formatDate(inventory.inboundDate) : '—'} />
          </div>
        </CardContent>
      </Card>

      {/* 收发货记录 */}
      <Card>
        <CardHeader>
          <CardTitle>收发货记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="inbound">入库</TabsTrigger>
              <TabsTrigger value="outbound">出库</TabsTrigger>
            </TabsList>
            <TabsContent value="all"><ProductRecordTable data={records} /></TabsContent>
            <TabsContent value="inbound"><ProductRecordTable data={records?.filter(r => r.type === 'inbound')} /></TabsContent>
            <TabsContent value="outbound"><ProductRecordTable data={records?.filter(r => r.type === 'outbound')} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 50.4 产品表单

```tsx
function ProductFormDialog({ open, onClose, product }) {
  const form = useForm({
    defaultValues: product || {
      name: '', material: '', process: '', specification: '',
      unit: 'kg', pricingMethod: 'weight', unitPrice: '', minOrderQty: '', remark: '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? '编辑产品' : '新增产品'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <FormField name="name" className="col-span-2">
              <FieldLabel>产品名称 <span className="text-error">*</span></FieldLabel>
              <Input value={form.state.values.name}
                onChange={(e) => form.setFieldValue('name', e.target.value)} />
            </FormField>

            <FormField name="material">
              <FieldLabel>材质</FieldLabel>
              <Select value={form.state.values.material}
                onValueChange={(v) => form.setFieldValue('material', v)}>
                <SelectTrigger><SelectValue placeholder="选择材质" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="steel">钢材</SelectItem>
                  <SelectItem value="aluminum">铝材</SelectItem>
                  <SelectItem value="copper">铜材</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField name="process">
              <FieldLabel>工艺</FieldLabel>
              <Select value={form.state.values.process}
                onValueChange={(v) => form.setFieldValue('process', v)}>
                <SelectTrigger><SelectValue placeholder="选择工艺" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quench">淬火</SelectItem>
                  <SelectItem value="temper">回火</SelectItem>
                  <SelectItem value="anneal">退火</SelectItem>
                  <SelectItem value="normalize">正火</SelectItem>
                  <SelectItem value="carburize">渗碳</SelectItem>
                  <SelectItem value="nitride">渗氮</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField name="specification" className="col-span-2">
              <FieldLabel>规格</FieldLabel>
              <Input value={form.state.values.specification}
                onChange={(e) => form.setFieldValue('specification', e.target.value)}
                placeholder="如：Φ20×100" />
            </FormField>

            <FormField name="unit">
              <FieldLabel>单位</FieldLabel>
              <Select value={form.state.values.unit}
                onValueChange={(v) => form.setFieldValue('unit', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="件">件</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="批">批</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField name="pricingMethod">
              <FieldLabel>计价方式</FieldLabel>
              <Select value={form.state.values.pricingMethod}
                onValueChange={(v) => form.setFieldValue('pricingMethod', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">按重量</SelectItem>
                  <SelectItem value="piece">按件数</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField name="unitPrice">
              <FieldLabel>单价</FieldLabel>
              <Input type="number" step="0.01" value={form.state.values.unitPrice}
                onChange={(e) => form.setFieldValue('unitPrice', e.target.value)} />
            </FormField>

            <FormField name="minOrderQty">
              <FieldLabel>最小起订量</FieldLabel>
              <Input type="number" step="0.001" value={form.state.values.minOrderQty}
                onChange={(e) => form.setFieldValue('minOrderQty', e.target.value)} />
            </FormField>

            <FormField name="remark" className="col-span-2">
              <FieldLabel>备注</FieldLabel>
              <Textarea rows={3} value={form.state.values.remark}
                onChange={(e) => form.setFieldValue('remark', e.target.value)} />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit">{product ? '保存' : '创建'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 50.5 API 接口

```typescript
// 产品列表
GET /api/products?search=&material=&process=&page=1&pageSize=20
Response: PaginatedResponse<Product>

// 产品详情
GET /api/products/:id
Response: Product & { inventory: InventoryInfo, records: ProductRecord[] }

// 创建产品
POST /api/products
Body: { name, material, process, specification, unit, pricingMethod, unitPrice, minOrderQty, remark }
Response: Product

// 更新产品
PUT /api/products/:id
Body: Partial<Product>
Response: Product

// 删除产品
DELETE /api/products/:id
Response: { id: string }

// 产品搜索（下拉列表）
GET /api/products/search?q=keyword&material=&process=&limit=20
Response: { items: { id, name, material, process, specification, unit, pricingMethod, unitPrice }[] }
```

### 50.6 产品缓存

```typescript
// 全局产品列表缓存
const [productList, setProductList] = useLocalStorage(STORAGE_KEYS.PRODUCT_LIST, []);

useEffect(() => {
  productApi.getAll().then(list => setProductList(list));
}, []);
```

缓存用途：来货登记、快速发货、库存管理页面快速检索产品。


---

## 第51章 库存管理模块完整规格

### 51.1 模块概述

库存管理模块提供实时库存查看、库存检索、超期预警和库存调整功能。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 库存列表 | `/inventory` | 分页列表、搜索、筛选 |
| 库存检索 | 列表页 | 按产品名称、材质、批次号筛选 |
| 超期预警 | 列表页 | 高亮显示超期未处理的库存项 |
| 库存调整 | 弹窗 | 手动调整库存数量 |
| 库存明细 | 详情 | 查看库存变动历史 |

### 51.2 库存列表页

#### 页面结构

```
库存管理页面
├── KPI 指标卡（4个）
│   ├── 库存种类数
│   ├── 库存总量
│   ├── 超期预警数
│   └── 低库存数
├── 搜索筛选栏
│   ├── 搜索框（产品名称）
│   ├── 材质筛选
│   ├── 批次号筛选
│   └── 状态筛选（全部/正常/超期/低库存）
├── 数据表格
│   ├── 产品名称
│   ├── 材质/工艺/规格
│   ├── 当前库存量
│   ├── 单位
│   ├── 库位
│   ├── 批次号
│   ├── 入库日期
│   ├── 状态（正常/超期/低库存）
│   └── 操作（查看/调整）
└── 分页器
```

#### KPI 指标卡

```tsx
function InventoryKPI({ data }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KPICard title="库存种类" value={data?.totalTypes || 0} unit="种" icon={<Package />} />
      <KPICard title="库存总量" value={data?.totalQty || 0} unit="件" icon={<Layers />} />
      <KPICard
        title="超期预警"
        value={data?.expiredCount || 0}
        unit="项"
        icon={<AlertTriangle />}
        className={data?.expiredCount > 0 ? 'border-error/30' : ''}
      />
      <KPICard
        title="低库存"
        value={data?.lowStockCount || 0}
        unit="项"
        icon={<TrendingDown />}
        className={data?.lowStockCount > 0 ? 'border-warning/30' : ''}
      />
    </div>
  );
}
```

#### 库存表格

```tsx
function InventoryTable({ data, loading, onAdjust, onView }) {
  const columns = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      render: (name, record) => (
        <button onClick={() => onView(record)} className="text-primary hover:underline font-medium">
          {name}
        </button>
      ),
    },
    {
      title: '材质',
      dataIndex: 'material',
      width: 80,
      render: (val: string) => val ? <Badge variant="secondary">{val}</Badge> : '—',
    },
    {
      title: '规格',
      dataIndex: 'specification',
      width: 120,
      render: (val: string) => val || '—',
    },
    {
      title: '当前库存',
      dataIndex: 'currentQty',
      width: 100,
      align: 'right',
      render: (qty: number, record) => (
        <span className={cn(
          'font-semibold',
          qty <= 0 ? 'text-error' : qty < 10 ? 'text-warning' : 'text-foreground'
        )}>
          {qty} {record.unit}
        </span>
      ),
    },
    {
      title: '当前重量',
      dataIndex: 'currentWeight',
      width: 100,
      align: 'right',
      render: (weight: number) => weight ? `${weight} kg` : '—',
    },
    {
      title: '库位',
      dataIndex: 'location',
      width: 100,
      render: (val: string) => val ? <Badge variant="outline">{val}</Badge> : '—',
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 100,
      render: (val: string) => val || '—',
    },
    {
      title: '入库日期',
      dataIndex: 'inboundDate',
      width: 120,
      render: (date: string) => date ? formatDate(date) : '—',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => {
        const config = {
          normal: { label: '正常', variant: 'success' },
          expired: { label: '超期', variant: 'error' },
          low_stock: { label: '低库存', variant: 'warning' },
        };
        const cfg = config[status] || config.normal;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button size="sm" variant="ghost" onClick={() => onAdjust(record)}>
          <Edit className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1100 }} />;
}
```

#### 超期预警高亮

```tsx
// 在 Table 的 rowClassName 中设置超期行的样式
<Table
  columns={columns}
  dataSource={data}
  rowKey="id"
  rowClassName={(record) => record.status === 'expired' ? 'bg-error/5' : ''}
/>
```

### 51.3 库存调整

```tsx
function InventoryAdjustDialog({ open, onClose, item }) {
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => inventoryApi.adjust({
      productId: item.productId,
      adjustType,
      qty: adjustType === 'out' ? -qty : qty,
      reason,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('库存调整成功');
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>库存调整 — {item?.productName}</DialogTitle>
          <DialogDescription>
            当前库存: {item?.currentQty} {item?.unit} · 重量: {item?.currentWeight} kg
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>调整类型</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={adjustType === 'in' ? 'default' : 'outline'}
                onClick={() => setAdjustType('in')}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-1" /> 入库
              </Button>
              <Button
                variant={adjustType === 'out' ? 'default' : 'outline'}
                onClick={() => setAdjustType('out')}
                className="flex-1"
              >
                <Minus className="w-4 h-4 mr-1" /> 出库
              </Button>
            </div>
          </div>

          <div>
            <Label>调整数量</Label>
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value))}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground mt-1">
              调整后库存: {(item?.currentQty || 0) + (adjustType === 'in' ? qty : -qty)} {item?.unit}
            </p>
          </div>

          <div>
            <Label>调整原因</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="如：盘盈/盘亏/损耗/退货等"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || qty <= 0}>
            确认调整
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 51.4 超期预警规则

```typescript
const EXPIRY_DAYS = 90;  // 90天未变动视为超期

function checkExpiry(item: InventoryItem): 'normal' | 'expired' | 'low_stock' {
  // 检查超期
  if (item.inboundDate) {
    const days = dayjs().diff(dayjs(item.inboundDate), 'day');
    if (days > EXPIRY_DAYS) return 'expired';
  }

  // 检查低库存
  if (item.currentQty < 10) return 'low_stock';

  return 'normal';
}
```

### 51.5 库存变动历史

```tsx
function InventoryHistory({ productId }) {
  const { data: history } = useQuery({
    queryKey: ['inventory', productId, 'history'],
    queryFn: () => inventoryApi.getHistory(productId),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>库存变动历史</CardTitle>
      </CardHeader>
      <CardContent>
        <Table
          columns={[
            { title: '时间', dataIndex: 'createdAt', render: formatDate },
            { title: '类型', dataIndex: 'type', render: (type) => {
              const map = { inbound: '入库', outbound: '出库', adjust_in: '调整入库', adjust_out: '调整出库' };
              return map[type] || type;
            }},
            { title: '数量', dataIndex: 'qty', align: 'right', render: (qty) => (
              <span className={qty > 0 ? 'text-success' : 'text-error'}>
                {qty > 0 ? '+' : ''}{qty}
              </span>
            )},
            { title: '变动后', dataIndex: 'afterQty', align: 'right' },
            { title: '来源', dataIndex: 'source' },
            { title: '操作人', dataIndex: 'operator' },
          ]}
          dataSource={history}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </CardContent>
    </Card>
  );
}
```

### 51.6 API 接口

```typescript
// 库存列表
GET /api/inventory?search=&material=&batchNo=&status=&page=1&pageSize=20
Response: PaginatedResponse<InventoryItem>

// 库存概览
GET /api/inventory/overview
Response: { totalTypes, totalQty, expiredCount, lowStockCount }

// 按产品查询库存
GET /api/inventory/product/:productId
Response: InventoryItem

// 库存调整
POST /api/inventory/adjust
Body: { productId, adjustType: 'in' | 'out', qty, reason }
Response: { id, currentQty, currentWeight }

// 库存变动历史
GET /api/inventory/:productId/history?page=1&pageSize=20
Response: PaginatedResponse<InventoryHistoryRecord>
```

### 51.7 库存更新策略

| 操作 | 触发 | 库存变动 |
|------|------|---------|
| 入库登记 | 来货登记保存 | +数量（入库明细数量） |
| 出库发货 | 快速发货保存 | -数量（出库明细数量） |
| 手动调整 | 库存管理页面调整 | ±数量（手动输入） |
| 部分发货 | 快速发货部分发货 | -数量（已发货数量） |
| 关单平账 | 快速发货关单 | 0（仅状态变更，不调整库存） |

#### 原子更新（防竞态）

```typescript
// 入库：原子增加库存
const [updated] = await db.update(inventory)
  .set({
    currentQty: sql`${inventory.currentQty} + ${qty}`,
    currentWeight: sql`${inventory.currentWeight} + ${weight}`,
    updatedAt: new Date(),
  })
  .where(eq(inventory.productId, productId))
  .returning();

// 出库：原子扣减库存（防超卖）
const [updated] = await db.update(inventory)
  .set({
    currentQty: sql`${inventory.currentQty} - ${qty}`,
    currentWeight: sql`${inventory.currentWeight} - ${weight}`,
    updatedAt: new Date(),
  })
  .where(and(
    eq(inventory.productId, productId),
    gte(inventory.currentQty, qty)  // 确保库存充足
  ))
  .returning();

if (!updated) throw new ConflictException('库存不足');
```


---

## 第52章 组织管理模块完整规格

### 52.1 模块概述

组织管理模块处理多租户架构下的组织选择与切换，用户登录后需选择或创建组织才能进入业务系统。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 组织选择/创建 | `/organizations` | 登录后的落地页 |
| 组织信息展示 | Layout 顶栏 | 当前组织名称与编码 |
| 组织切换 | 弹窗 | 切换到其他组织 |
| 组织创建 | 弹窗 | 创建新组织 |

### 52.2 组织选择页

```tsx
function OrganizationPage() {
  const { user } = useAuth();
  const { data: orgs, isLoading } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => organizationApi.getMyOrganizations(),
  });
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <FullPageLoader />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <Package className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold text-foreground">热处理收发货管理系统</h1>
          <p className="text-muted-foreground mt-2">选择您的组织以继续</p>
        </div>

        {orgs && orgs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgs.map(org => (
              <OrganizationCard key={org.id} org={org} />
            ))}
            <button
              onClick={() => setShowCreate(true)}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors min-h-[120px]"
            >
              <Plus className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">创建新组织</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">您还没有加入任何组织</p>
            <Button onClick={() => setShowCreate(true)} className="bg-primary">
              <Plus className="w-4 h-4 mr-1" /> 创建第一个组织
            </Button>
          </div>
        )}

        {showCreate && <CreateOrgDialog open={showCreate} onClose={() => setShowCreate(false)} />}
      </div>
    </div>
  );
}
```

### 52.3 组织卡片

```tsx
function OrganizationCard({ org }: { org: Organization }) {
  const navigate = useNavigate();
  const selectMutation = useMutation({
    mutationFn: () => organizationApi.select(org.code),
    onSuccess: () => {
      localStorage.setItem(STORAGE_KEYS.ORG_CODE, org.code);
      navigate('/');
    },
  });

  return (
    <button
      onClick={() => selectMutation.mutate()}
      disabled={selectMutation.isPending}
      className="flex items-start gap-4 p-5 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all text-left"
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Building2 className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{org.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">编码: {org.code}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {org.memberCount} 人
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {formatDate(org.createdAt)}
          </span>
        </div>
      </div>
      {selectMutation.isPending ? (
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      ) : (
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  );
}
```

### 52.4 创建组织弹窗

```tsx
function CreateOrgDialog({ open, onClose }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () => organizationApi.create({ name, code }),
    onSuccess: (org) => {
      localStorage.setItem(STORAGE_KEYS.ORG_CODE, org.code);
      toast.success('组织创建成功');
      onClose();
      navigate('/');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const generateCode = () => {
    setCode('ORG' + Date.now().toString().slice(-6));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>创建新组织</DialogTitle>
          <DialogDescription>
            创建组织后将自动获得超级管理员权限
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>组织名称 <span className="text-error">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：XX热处理有限公司"
              className="mt-1"
            />
          </div>

          <div>
            <Label>组织编码 <span className="text-error">*</span></Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="如：ORG001"
              />
              <Button variant="outline" onClick={generateCode} type="button">
                自动生成
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              编码用于URL前缀，创建后不可修改
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-error/10 text-sm text-error">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !name || !code}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            创建组织
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 52.5 组织切换

```tsx
function OrgSwitcher() {
  const { currentOrg } = useTenant();
  const [open, setOpen] = useState(false);
  const { data: orgs } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => organizationApi.getMyOrganizations(),
  });

  const switchMutation = useMutation({
    mutationFn: (code: string) => organizationApi.select(code),
    onSuccess: (_, code) => {
      localStorage.setItem(STORAGE_KEYS.ORG_CODE, code);
      window.location.reload();
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Building2 className="w-4 h-4" />
          <span className="max-w-[120px] truncate">{currentOrg?.name || '选择组织'}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1">切换组织</p>
          {orgs?.map(org => (
            <button
              key={org.id}
              onClick={() => {
                switchMutation.mutate(org.code);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/10 text-left',
                org.code === currentOrg?.code && 'bg-accent/10'
              )}
            >
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{org.name}</p>
                <p className="text-xs text-muted-foreground">{org.code}</p>
              </div>
              {org.code === currentOrg?.code && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### 52.6 租户上下文

```typescript
// useTenant hook
function useTenant() {
  const [orgCode, setOrgCode] = useState<string | null>(
    localStorage.getItem(STORAGE_KEYS.ORG_CODE)
  );
  const { data: currentOrg } = useQuery({
    queryKey: ['current-org', orgCode],
    queryFn: () => organizationApi.getCurrent(),
    enabled: !!orgCode,
  });

  const clearTenant = () => {
    localStorage.removeItem(STORAGE_KEYS.ORG_CODE);
    setOrgCode(null);
  };

  return { orgCode, currentOrg, clearTenant };
}
```

### 52.7 API 接口

```typescript
// 我的组织列表
GET /api/organizations/my
Response: Organization[]

// 当前组织信息
GET /api/organizations/current
Response: Organization & { role: string, permissions: string[] }

// 选择组织（设置租户上下文）
POST /api/organizations/:code/select
Response: { success: true }

// 创建组织
POST /api/organizations
Body: { name, code }
Response: Organization

// 组织成员列表
GET /api/organizations/:id/members
Response: { userId, userName, role, joinedAt }[]

// 邀请成员
POST /api/organizations/:id/members/invite
Body: { userId, role }
Response: { success: true }

// 移除成员
DELETE /api/organizations/:id/members/:userId
Response: { success: true }
```

### 52.8 数据隔离机制

```typescript
// 中间件：租户上下文注入
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const orgCode = req.headers['x-org-code'] as string;
    if (!orgCode) {
      throw new UnauthorizedException('缺少组织编码');
    }

    const org = await this.orgService.findByCode(orgCode);
    if (!org) {
      throw new NotFoundException('组织不存在');
    }

    req.orgContext = {
      orgId: org.id,
      orgCode: org.code,
      orgName: org.name,
    };

    next();
  }
}

// Service 层自动过滤
async findAll(orgId: string) {
  return this.db.select().from(inboundRecords)
    .where(eq(inboundRecords.orgId, orgId));
}
```


---

## 第53章 文件存储与上传系统

### 53.1 概述

系统使用 dataloom storage 实现文件上传、下载、列表查询和分享链接生成。文件存储为云存储，前端通过 SDK 直接操作。

#### 核心能力

| 能力 | API | 说明 |
|------|-----|------|
| 文件上传 | `uploadFile` | 上传到默认 bucket |
| 文件删除 | `remove` | 按 filePath 删除 |
| 文件列表 | `list` | 列出 bucket 中的文件 |
| 获取下载URL | `generateDownloadUrlFromFilePath` | filePath → 可访问 URL |
| 获取 bucket | `getDefaultBucketId` | 获取默认 bucket ID |

### 53.2 前端文件上传

#### 基础上传

```typescript
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';

async function uploadImage(file: File): Promise<string> {
  const dataloom = getDataloom();
  const bucketId = await dataloom.getDefaultBucketId();

  const result = await dataloom.uploadFile({
    bucketId,
    file,
    filePath: `inbound-photos/${Date.now()}-${file.name}`,
  });

  // result.file_path 是文件的唯一标识
  // 需要展示时调用 generateDownloadUrlFromFilePath
  return result.file_path;
}
```

#### 批量上传

```typescript
async function uploadMultipleFiles(files: File[]): Promise<string[]> {
  const dataloom = getDataloom();
  const bucketId = await dataloom.getDefaultBucketId();

  const uploadPromises = files.map((file, index) =>
    dataloom.uploadFile({
      bucketId,
      file,
      filePath: `batch-upload/${Date.now()}-${index}-${file.name}`,
    })
  );

  const results = await Promise.all(uploadPromises);
  return results.map(r => r.file_path);
}
```

### 53.3 图片预览组件

```tsx
function StoredImage({ filePath, alt, className }: { filePath: string; alt?: string; className?: string }) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (!filePath) return;
    getDataloom().generateDownloadUrlFromFilePath(filePath)
      .then(setUrl)
      .catch(() => logger.error('Failed to load image:', filePath));
  }, [filePath]);

  if (!url) return <ImageSkeleton className={className} />;

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.src = '/placeholder.png';
      }}
    />
  );
}
```

### 53.4 图片上传组件

```tsx
function ImageUploader({
  value,
  onChange,
  maxCount = 1,
  label = '上传图片',
}: {
  value: string | string[];
  onChange: (paths: string | string[]) => void;
  maxCount?: number;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const paths = Array.isArray(value) ? value : value ? [value] : [];

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const newPaths = await uploadMultipleFiles(Array.from(files));
      const updated = [...paths, ...newPaths].slice(0, maxCount);
      onChange(maxCount === 1 ? updated[0] : updated);
    } catch (err) {
      toast.error('上传失败');
      logger.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const updated = paths.filter((_, i) => i !== index);
    onChange(maxCount === 1 ? updated[0] || '' : updated);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-3">
        {paths.map((path, index) => (
          <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
            <StoredImage filePath={path} className="w-full h-full object-cover" />
            <button
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {paths.length < maxCount && (
          <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Plus className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">上传</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple={maxCount > 1}
              className="hidden"
              onChange={(e) => e.target.files?.length && handleUpload(e.target.files)}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        支持 JPG、PNG，最多 {maxCount} 张
      </p>
    </div>
  );
}
```

### 53.5 Excel 文件上传

```tsx
function ExcelUploader({ onParsed, onError }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        onParsed(rows);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      onError('Excel 解析失败');
      logger.error('Excel parse error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.xlsx')) handleFile(file);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">解析中...</span>
        </div>
      ) : (
        <label className="cursor-pointer">
          <FileSpreadsheet className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">点击或拖拽 Excel 文件到此处</p>
          <p className="text-xs text-muted-foreground mt-1">支持 .xlsx 格式</p>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}
```

### 53.6 服务端文件处理

服务端不支持文件上传（FaaS 限制），仅保存元信息。

```typescript
@Injectable()
export class FileMetaService {
  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async saveMeta(meta: {
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    category: string;
    refId?: string;
  }) {
    const [record] = await this.db.insert(fileMetas).values({
      ...meta,
      uploadedAt: new Date(),
    }).returning();

    return record;
  }

  async getByRefId(refId: string, category: string) {
    return this.db.select().from(fileMetas)
      .where(and(
        eq(fileMetas.refId, refId),
        eq(fileMetas.category, category),
      ));
  }

  async delete(filePath: string) {
    await this.db.delete(fileMetas).where(eq(fileMetas.filePath, filePath));
  }
}
```

### 53.7 文件路径规范

```
inbound-photos/{timestamp}-{filename}      // 来货登记照片
outbound-photos/{timestamp}-{filename}     // 发货照片
excel-templates/{templateName}.xlsx       // Excel 模板
print-logs/{timestamp}-{type}.pdf          // 打印日志
```

### 53.8 文件大小限制

| 类型 | 最大大小 | 允许格式 |
|------|---------|---------|
| 图片 | 5 MB | JPG, PNG, GIF, WebP |
| Excel | 10 MB | XLSX, XLS |
| PDF | 20 MB | PDF |
| 普通 | 10 MB | 任意 |


---

## 第54章 部署与运维指南

### 54.1 部署架构

#### 整体架构

```
用户浏览器
    │
    ▼
┌──────────────┐
│  CDN / WAF  │  ← 静态资源缓存、DDoS 防护
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  API Gateway │  ← 路由分发、鉴权、限流
└──────┬───────┘
       │
       ├──→ ┌──────────────┐
       │    │  NestJS App  │  ← FaaS 容器（无状态）
       │    └──────┬───────┘
       │           │
       │           ├──→ PostgreSQL（主库）
       │           │
       │           ├──→ Redis（缓存/会话）
       │           │
       │           └──→ 对象存储（文件）
       │
       └──→ ┌──────────────┐
            │  静态资源 CDN │  ← 前端构建产物
            └──────────────┘
```

#### FaaS 无状态约束

- 服务端运行在 FaaS 容器中，**无本地文件系统**（`/tmp` 除外）
- 进程可能随时重启，**禁止在内存中存储会话状态**
- 数据库连接由连接池管理，每次请求从池中获取

### 54.2 构建流程

#### 前端构建

```bash
# 构建命令
npm run build:client

# 产物路径
client/dist/
├── assets/           # JS、CSS 打包文件
├── static/           # 静态资源
└── index.html        # 入口 HTML
```

#### 后端构建

```bash
# 构建命令
npm run build:server

# 产物路径
server/dist/
├── main.js           # 入点
├── modules/          # 编译后的模块
├── database/         # Schema 编译产物
└── assets/           # 运行时资源（字体、模板等）
```

#### nest-cli.json 资源声明

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "assets": [
      { "include": "assets/**/*", "outDir": "dist/server" }
    ],
    "watchAssets": true
  }
}
```

### 54.3 发布流程

#### 发布命令

```bash
# 通过 miaoda-cli 发布
miaoda deploy

# 查看发布状态
miaoda deploy get

# 查看发布历史
miaoda deploy history

# 查看发布错误日志
miaoda deploy error-log
```

#### 发布检查清单

发布前必须确认：

- [ ] 代码已通过 ESLint 检查
- [ ] TypeScript 编译无错误
- [ ] 所有 API 接口已测试通过
- [ ] 数据库 Schema 已同步（如涉及 DDL 变更）
- [ ] 环境变量已配置
- [ ] shared/api.interface.ts 前后端类型一致

### 54.4 数据库变更

#### DDL 执行

```bash
# 执行建表/改表 SQL
miaoda db sql "CREATE TABLE ..."

# 查看当前 Schema
miaoda db schema

# 查看数据
miaoda db data
```

#### Schema 同步流程

1. 通过 `miaoda db sql` 执行 DDL
2. 系统自动执行 codegen 生成 `schema.ts`
3. **立即重新读取 `schema.ts`** 确认变更
4. 更新业务代码中的类型引用
5. 更新 `shared/api.interface.ts` 中的类型定义

### 54.5 环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | 数据库连接串 | `postgresql://...` |
| `REDIS_URL` | Redis 连接串 | `redis://...` |
| `APP_ID` | 应用 ID | `app_xxx` |
| `TENANT_ID` | 租户 ID | `tenant_xxx` |

### 54.6 日志体系

#### 日志源

| 日志源 | 工具参数 | 说明 |
|--------|---------|------|
| 服务端 devServer | `read_logs({ logSource: 'server-devserver' })` | 开发时服务端控制台 |
| 服务端运行时 | `read_logs({ logSource: 'server' })` | 生产环境服务端日志 |
| 客户端 devServer | `read_logs({ logSource: 'client-devserver' })` | 开发时客户端控制台 |
| 浏览器控制台 | `read_logs({ logSource: 'browser' })` | 浏览器端日志 |
| 链路追踪 | `read_logs({ logSource: 'trace' })` | 请求链路追踪 |

#### 日志规范

```typescript
// 后端：必须使用 Logger
import { Logger } from '@nestjs/common';
const logger = new Logger('InboundService');
logger.log('入库成功: ' + JSON.stringify(record));
logger.error('入库失败: ' + err.message, err.stack);
logger.warn('库存不足: ' + productId);

// 前端：必须使用 logger
import { logger } from '@lark-apaas/client-toolkit/logger';
logger.info('Page loaded');
logger.error('API error:', error);
```

#### 线上日志查询

```bash
# 查询线上日志
miaoda observability log --level error --limit 50

# 查询链路
miaoda observability trace --traceid xxx

# 查询监控指标
miaoda observability metric

# 查询运营数据
miaoda observability analytics
```

### 54.7 性能优化

#### 前端优化

| 策略 | 实现 |
|------|------|
| 代码分割 | Vite 自动分割 vendor 和业务代码 |
| 图片懒加载 | `<img loading="lazy">` |
| 虚拟列表 | 大数据量表格使用虚拟滚动 |
| 请求缓存 | React Query 缓存 + staleTime |
| 防抖节流 | 搜索输入 300ms 防抖 |
| 骨架屏 | 数据加载时展示骨架 |

#### 后端优化

| 策略 | 实现 |
|------|------|
| 数据库索引 | 高频查询字段添加索引 |
| 批量查询 | 禁止 N+1，使用 inArray 批量查 |
| 分页 | 游标分页优先，传统分页限制页数 |
| 连接池 | Drizzle ORM 连接池管理 |
| 缓存 | Redis 缓存热点数据 |

#### 数据库索引建议

```sql
-- 入库记录索引
CREATE INDEX idx_inbound_org_date ON inbound_records (org_id, created_at DESC);
CREATE INDEX idx_inbound_customer ON inbound_records (org_id, customer_id);
CREATE INDEX idx_inbound_product ON inbound_records (org_id, product_id);
CREATE INDEX idx_inbound_status ON inbound_records (org_id, status);

-- 出库记录索引
CREATE INDEX idx_outbound_org_date ON outbound_records (org_id, created_at DESC);
CREATE INDEX idx_outbound_inbound ON outbound_records (org_id, inbound_id);
CREATE INDEX idx_outbound_status ON outbound_records (org_id, status);

-- 库存索引
CREATE INDEX idx_inventory_org_product ON inventory (org_id, product_id);
CREATE INDEX idx_inventory_status ON inventory (org_id, status);

-- 对账记录索引
CREATE INDEX idx_recon_org_period ON reconciliation_records (org_id, period_year, period_month);
CREATE INDEX idx_recon_customer ON reconciliation_records (org_id, customer_id);
CREATE INDEX idx_recon_status ON reconciliation_records (org_id, status);
```

### 54.8 健康检查

```typescript
// 健康检查端点
@Controller('api/health')
export class HealthController {
  @Get()
  @SkipAuth()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

### 54.9 错误恢复

#### 数据库连接失败

```typescript
// 连接失败处理
catch (err) {
  if (err.code === 'ECONNREFUSED') {
    logger.error('数据库连接失败，请联系技术支持');
    throw new ServiceUnavailableException('服务暂时不可用');
  }
  throw err;
}
```

#### 服务重启

```bash
# 开发环境重启 devServer
pkill -f "npm run dev"

# 生产环境重新发布
miaoda deploy
```

### 54.10 备份与恢复

#### 数据备份

```bash
# 导出数据
miaoda db export --table inbound_records --format sql
miaoda db export --table outbound_records --format sql

# 导入数据
miaoda db import --file backup.sql
```

#### PITR 恢复

```bash
# 按时间点恢复
miaoda db restore --timestamp "2024-01-15T10:00:00Z"
```

### 54.11 监控告警

#### 监控指标

| 指标 | 说明 | 告警阈值 |
|------|------|---------|
| CPU 使用率 | 容器 CPU | > 80% |
| 内存使用率 | 容器内存 | > 85% |
| 响应时间 | API P99 | > 3s |
| 错误率 | 5xx 错误 | > 1% |
| 数据库连接 | 连接池使用 | > 80% |
| 磁盘使用 | 数据库磁盘 | > 90% |

#### 告警通知

```bash
# 设置告警
miaoda observability alert set \
  --metric response_time \
  --threshold 3000 \
  --notify feishu
```

### 54.12 版本管理

#### 发布版本

```bash
# 发布当前代码
miaoda deploy

# 查看版本历史
miaoda deploy history

# 回滚到指定版本
miaoda deploy rollback --version v1.2.3
```

#### 多环境管理

| 环境 | 用途 | 数据库 |
|------|------|--------|
| preview | 开发预览 | 开发库 |
| runtime | 生产运行 | 生产库 |

```typescript
// 环境判断
if (process.env.NODE_ENV === 'production') {
  // 生产逻辑
} else {
  // 开发逻辑
}

// 通过 userContext.env 判断
const isPreview = req.userContext.env === 'preview';
```


---

## 第55章 错误处理与异常恢复完整规格

### 55.1 错误处理架构

#### 三层错误处理

```
Service 层（抛异常）
    │
    ▼
Controller 层（透传）
    │
    ▼
全局 Error Filter（统一格式化）
    │
    ▼
前端（展示错误 Toast）
```

### 55.2 异常类型映射

| 场景 | NestJS 异常 | HTTP 状态码 | 前端处理 |
|------|-------------|------------|---------|
| 资源不存在 | `NotFoundException` | 404 | Toast 提示 |
| 参数非法 | `BadRequestException` | 400 | 表单错误提示 |
| 并发冲突 | `ConflictException` | 409 | 确认对话框 |
| 无权限 | `ForbiddenException` | 403 | 跳转首页 |
| 未登录 | `UnauthorizedException` | 401 | 跳转登录 |
| 服务不可用 | `ServiceUnavailableException` | 503 | 重试按钮 |
| 服务器错误 | `InternalServerErrorException` | 500 | 联系支持 |

### 55.3 全局错误 Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status: number;
    let message: string;
    let code: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
      code = (res as any).code || 'ERROR';
    } else if (exception instanceof Error) {
      status = 500;
      message = '服务器内部错误';
      code = 'INTERNAL_ERROR';
      logger.error(`[${request.method}] ${request.url}`, exception.stack);
    } else {
      status = 500;
      message = '未知错误';
      code = 'UNKNOWN';
    }

    response.status(status).json({
      success: false,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 55.4 前端错误处理

#### API 错误拦截

```typescript
// axiosForBackend 拦截器
axiosForBackend.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // 网络错误
      toast.error('网络连接失败，请检查网络');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // 未登录，跳转登录
        toast.error('登录已过期，请重新登录');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        break;

      case 403:
        toast.error('您没有权限执行此操作');
        break;

      case 404:
        toast.error(data.message || '请求的资源不存在');
        break;

      case 409:
        // 并发冲突，不自动提示，交给业务层处理
        break;

      case 500:
        toast.error('服务器错误，请稍后重试');
        logger.error('Server error:', data);
        break;

      default:
        toast.error(data.message || '请求失败');
    }

    return Promise.reject(error);
  }
);
```

#### React Query 错误处理

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      onError: (error) => {
        logger.error('Query error:', error);
      },
    },
    mutations: {
      onError: (error) => {
        // 通用 mutation 错误处理
        if (error.response?.status >= 500) {
          toast.error('服务器错误，请稍后重试');
        }
      },
    },
  },
});
```

### 55.5 前端错误边界

```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('React Error Boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <AlertCircle className="w-16 h-16 text-destructive" />
      <h2 className="text-xl font-semibold">页面出错了</h2>
      <p className="text-muted-foreground text-sm">
        {error?.message || '发生未知错误'}
      </p>
      <Button onClick={() => window.location.reload()}>
        刷新页面
      </Button>
    </div>
  );
}

// 使用
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 55.6 业务错误场景

#### 入库登记错误

| 场景 | 处理 |
|------|------|
| 客户不存在 | `NotFoundException` → Toast 提示 |
| 产品不存在 | `NotFoundException` → Toast 提示 |
| 重量为0 | `BadRequestException` → 表单错误 |
| 批次号重复 | `ConflictException` → 确认是否覆盖 |

```typescript
// Service 层
async createInbound(dto: CreateInboundDto, orgId: string) {
  const customer = await this.customerService.findById(dto.customerId, orgId);
  if (!customer) throw new NotFoundException('客户不存在');

  for (const item of dto.items) {
    const product = await this.productService.findById(item.productId, orgId);
    if (!product) throw new NotFoundException(`产品 ${item.productName} 不存在`);

    if (item.weight <= 0) {
      throw new BadRequestException(`${item.productName} 重量必须大于0`);
    }
  }

  // 检查批次号唯一性
  if (dto.batchNo) {
    const existing = await this.findByBatchNo(dto.batchNo, orgId);
    if (existing) {
      throw new ConflictException(`批次号 ${dto.batchNo} 已存在`);
    }
  }

  return this.insertInbound(dto, orgId);
}
```

#### 快速发货错误

| 场景 | 处理 |
|------|------|
| 入库记录不存在 | `NotFoundException` → Toast |
| 库存不足 | `ConflictException` → 确认对话框 |
| 发货数量超过可用 | `BadRequestException` → 表单错误 |
| 入库状态不允许发货 | `BadRequestException` → Toast |

```typescript
async createOutbound(dto: CreateOutboundDto, orgId: string) {
  const inbound = await this.inboundService.findById(dto.inboundId, orgId);
  if (!inbound) throw new NotFoundException('入库记录不存在');

  if (inbound.status !== 'completed') {
    throw new BadRequestException('入库记录未完成，不能发货');
  }

  for (const item of dto.items) {
    const available = await this.inventoryService.getAvailable(item.productId, orgId);
    if (item.qty > available) {
      throw new ConflictException(
        `${item.productName} 库存不足（可用 ${available}，需 ${item.qty}）`
      );
    }
  }

  return this.insertOutbound(dto, orgId);
}
```

#### 对账错误

| 场景 | 处理 |
|------|------|
| 对账期间重复 | `ConflictException` → 确认覆盖 |
| 数据未准备完成 | `BadRequestException` → Toast |
| 客户不存在 | `NotFoundException` → Toast |

### 55.7 网络错误恢复

#### 请求重试

```typescript
// 指数退避重试
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (err.response?.status >= 400 && err.response?.status < 500) {
        throw err; // 4xx 不重试
      }
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

#### 离线检测

```typescript
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// 使用
function App() {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return <OfflineBanner />;
  }

  return <MainContent />;
}
```

### 55.8 数据一致性恢复

#### 前端乐观更新回滚

```typescript
const mutation = useMutation({
  mutationFn: outboundApi.create,
  onMutate: async (newOutbound) => {
    // 取消正在进行的查询
    await queryClient.cancelQueries({ queryKey: ['outbounds'] });

    // 保存前一个值
    const previousOutbounds = queryClient.getQueryData(['outbounds']);

    // 乐观更新
    queryClient.setQueryData(['outbounds'], (old) => [...old, newOutbound]);

    // 返回上下文（用于回滚）
    return { previousOutbounds };
  },
  onError: (err, newOutbound, context) => {
    // 回滚
    queryClient.setQueryData(['outbounds'], context.previousOutbounds);
    toast.error('发货失败，已恢复');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['outbounds'] });
  },
});
```

#### 后端事务回滚

```typescript
async createOutboundWithInventory(dto: CreateOutboundDto, orgId: string) {
  return this.db.transaction(async (tx) => {
    // 1. 创建出库记录
    const [outbound] = await tx.insert(outboundRecords).values({
      ...dto,
      orgId,
      status: 'pending',
    }).returning();

    // 2. 扣减库存（原子操作）
    for (const item of dto.items) {
      const [updated] = await tx.update(inventory)
        .set({
          currentQty: sql`${inventory.currentQty} - ${item.qty}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(inventory.productId, item.productId),
          eq(inventory.orgId, orgId),
          gte(inventory.currentQty, item.qty),
        ))
        .returning();

      if (!updated) {
        throw new ConflictException(`${item.productName} 库存不足`);
      }
    }

    // 3. 创建出库明细
    await tx.insert(outboundItems).values(
      dto.items.map(item => ({
        ...item,
        outboundId: outbound.id,
        orgId,
      }))
    );

    return outbound;
  });
}
```

### 55.9 错误日志收集

```typescript
// 前端错误收集
window.addEventListener('error', (event) => {
  logger.error('Global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
});
```

### 55.10 常见错误排查

#### Tenant not found

```
原因：请求未携带组织编码
解决：确保使用 axiosForBackend 而非 fetch
排查：检查 localStorage 中是否有 ORG_CODE
```

#### 404 路由不存在

```
原因：Controller 未注册或路径不匹配
解决：① 检查 app.module.ts 是否引入模块
      ② 检查 @Controller 路径前缀
      ③ 检查静态路由在动态路由之前
```

#### 403 权限不足

```
原因：用户角色不匹配
解决：① 检查 RBAC 角色配置
      ② 检查 @Can 装饰器权限点
      ③ 检查 userContext.roles
```

#### 500 服务器错误

```
排查步骤：
1. 读取 server-devserver 日志
2. 查看错误堆栈
3. 检查数据库连接
4. 检查 Schema 字段名是否匹配
5. 检查环境变量
```

#### 数据库连接失败

```
原因：连接池耗尽或数据库不可达
解决：
1. 检查 DATABASE_URL 是否正确
2. 检查网络连通性
3. 重启应用
4. 联系技术支持
```


---

## 第56章 性能优化指南

### 56.1 前端性能优化

#### 代码分割

Vite 自动进行代码分割，但需注意：

```typescript
// ✅ 按需导入 Lucide 图标
import { Plus, Search, Edit } from 'lucide-react';

// ❌ 禁止导入整个库
import * as Icons from 'lucide-react';

// ✅ 按需导入 lodash
import debounce from 'lodash/debounce';

// ❌ 禁止全量导入
import _ from 'lodash';
```

#### React Query 缓存策略

```typescript
// 全局默认配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30秒内不重新请求
      gcTime: 5 * 60 * 1000,       // 5分钟垃圾回收
      refetchOnWindowFocus: false, // 禁止窗口聚焦时刷新
      retry: 1,                     // 失败重试1次
    },
  },
});

// 特定查询的缓存策略
const { data } = useQuery({
  queryKey: ['customers'],
  queryFn: customerApi.getAll,
  staleTime: 5 * 60 * 1000,  // 客户列表5分钟内不刷新
});

const { data } = useQuery({
  queryKey: ['inventory'],
  queryFn: inventoryApi.getAll,
  staleTime: 0,  // 库存数据始终最新
  refetchInterval: 30 * 1000,  // 30秒轮询
});
```

#### 虚拟列表

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualTable({ data }: { data: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TableRow data={data[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 图片优化

```tsx
// 响应式图片
import { Image } from '@/components/ui/image';

<Image
  src={url}
  alt={product.name}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="rounded-lg"
/>

// 懒加载
<img src={url} loading="lazy" alt="..." />

// 骨架屏
{loading ? (
  <div className="w-full h-48 bg-muted animate-pulse rounded-lg" />
) : (
  <img src={url} alt="..." />
)}
```

#### 防抖节流

```typescript
// 搜索防抖
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    refetch({ search: debouncedSearch });
  }
}, [debouncedSearch]);

// 滚动节流
const throttledScroll = useThrottle(handleScroll, 200);
window.addEventListener('scroll', throttledScroll);
```

#### React.memo 与 useMemo

```tsx
// 重型子组件用 memo 避免不必要重渲染
const TableRow = React.memo(({ data, onSelect }) => {
  return (
    <tr onClick={() => onSelect(data.id)}>
      <td>{data.name}</td>
      <td>{data.material}</td>
    </tr>
  );
});

// 复杂计算用 useMemo
const sortedData = useMemo(
  () => [...data].sort((a, b) => a.name.localeCompare(b.name)),
  [data]
);

// 回调函数用 useCallback
const handleSelect = useCallback((id: string) => {
  setSelectedId(id);
}, []);
```

### 56.2 后端性能优化

#### 数据库查询优化

```typescript
// ✅ 批量查询替代 N+1
const orderIds = orders.map(o => o.id);
const items = await db.select().from(orderItems)
  .where(inArray(orderItems.orderId, orderIds));

// 按 orderId 分组
const itemsByOrder = new Map<string, OrderItem[]>();
for (const item of items) {
  const list = itemsByOrder.get(item.orderId) ?? [];
  list.push(item);
  itemsByOrder.set(item.orderId, list);
}

// 回填到 orders
orders.forEach(order => {
  order.items = itemsByOrder.get(order.id) ?? [];
});

// ❌ 禁止 N+1
for (const order of orders) {
  order.items = await db.select().from(orderItems)
    .where(eq(orderItems.orderId, order.id));
}
```

#### 索引优化

```sql
-- 复合索引（按查询频率排序）
CREATE INDEX idx_inbound_org_customer_date
  ON inbound_records (org_id, customer_id, created_at DESC);

CREATE INDEX idx_outbound_org_inbound
  ON outbound_records (org_id, inbound_id, status);

-- 部分索引（只索引活跃数据）
CREATE INDEX idx_inventory_active
  ON inventory (org_id, product_id)
  WHERE status = 'normal';

-- 覆盖索引（包含查询所需的所有列）
CREATE INDEX idx_product_search
  ON products (org_id, name)
  INCLUDE (material, process, specification, unit);
```

#### 分页优化

```typescript
// ✅ 游标分页（移动端/无限滚动）
async findByCursor(orgId: string, cursor?: string, limit = 20) {
  let query = db.select().from(inboundRecords)
    .where(eq(inboundRecords.orgId, orgId))
    .orderBy(desc(inboundRecords.createdAt), desc(inboundRecords.id))
    .limit(limit + 1);

  if (cursor) {
    const [createdAt, id] = cursor.split('_');
    query = query.where(and(
      eq(inboundRecords.orgId, orgId),
      or(
        lt(inboundRecords.createdAt, new Date(createdAt)),
        and(
          eq(inboundRecords.createdAt, new Date(createdAt)),
          lt(inboundRecords.id, id)
        )
      )
    ));
  }

  const items = await query;
  const hasMore = items.length > limit;
  const nextCursor = hasMore
    ? `${items[limit - 1].createdAt.toISOString()}_${items[limit - 1].id}`
    : undefined;

  return {
    items: items.slice(0, limit),
    nextCursor,
    hasMore,
  };
}

// ✅ 传统分页（后台管理）
async findByPage(orgId: string, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const [items, [{ count }]] = await Promise.all([
    db.select().from(inboundRecords)
      .where(eq(inboundRecords.orgId, orgId))
      .orderBy(desc(inboundRecords.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(inboundRecords)
      .where(eq(inboundRecords.orgId, orgId)),
  ]);

  return { items, total: Number(count), page, pageSize };
}
```

#### 缓存策略

```typescript
// Redis 缓存热点数据
@Injectable()
export class ProductCacheService {
  async getProducts(orgId: string): Promise<Product[]> {
    const key = `products:${orgId}`;
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    const products = await this.db.select().from(products)
      .where(eq(products.orgId, orgId));

    await this.redis.setex(key, 300, JSON.stringify(products)); // 5分钟
    return products;
  }

  async invalidate(orgId: string) {
    await this.redis.del(`products:${orgId}`);
  }
}
```

### 56.3 请求优化

#### 批量请求

```typescript
// ✅ 批量获取
const productIds = [...new Set(items.map(i => i.productId))];
const products = await productApi.getByIds(productIds);

// ❌ 逐条获取
for (const item of items) {
  const product = await productApi.getById(item.productId);
}
```

#### 请求去重

```typescript
// React Query 自动去重
const { data } = useQuery({
  queryKey: ['product', id],
  queryFn: () => productApi.getById(id),
});
// 多个组件使用同一 queryKey，只会发一次请求
```

#### 预加载

```typescript
// 鼠标悬停预加载
function CustomerLink({ id, name }) {
  const queryClient = useQueryClient();

  const handleHover = () => {
    queryClient.prefetchQuery({
      queryKey: ['customer', id],
      queryFn: () => customerApi.getById(id),
      staleTime: 10 * 1000,
    });
  };

  return (
    <Link to={`/customers/${id}`} onMouseEnter={handleHover}>
      {name}
    </Link>
  );
}
```

### 56.4 渲染优化

#### 避免不必要的重渲染

```tsx
// ✅ 状态下放（只让需要的组件重新渲染）
function ProductList() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <ProductTable onSelect={setSelectedId} />
      <ProductDetail id={selectedId} />
    </>
  );
}

// ProductTable 不会因为 selectedId 变化而重渲染
```

#### 列表 key

```tsx
// ✅ 使用稳定唯一的 key
{items.map(item => (
  <ListItem key={item.id} data={item} />
))}

// ❌ 禁止使用 index 作为 key
{items.map((item, index) => (
  <ListItem key={index} data={item} />
))}
```

#### 大列表虚拟化

```tsx
// 超过 100 行的表格使用虚拟滚动
{data.length > 100 ? (
  <VirtualTable data={data} />
) : (
  <Table data={data} />
)}
```

### 56.5 Bundle 体积控制

#### 分析工具

```bash
# 分析 bundle 体积
npx vite-bundle-visualizer
```

#### 按需引入

```typescript
// ✅ 按需引入 ECharts
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent,
  CanvasRenderer,
]);

// ❌ 全量引入
import * as echarts from 'echarts';
```

#### Tree Shaking

```typescript
// ✅ 具名导入
import { debounce, throttle } from 'lodash-es';

// ❌ 默认导入
import _ from 'lodash';
```

### 56.6 数据库性能监控

```sql
-- 慢查询日志
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 记录 >1s 的查询
SELECT pg_reload_conf();

-- 查看活跃连接
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- 查看索引使用率
SELECT relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 查看表大小
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 56.7 性能指标

#### 关键指标

| 指标 | 目标 | 工具 |
|------|------|------|
| FCP (First Contentful Paint) | < 1.5s | Lighthouse |
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| FID (First Input Delay) | < 100ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| API P99 响应时间 | < 500ms |miaoda observability |
| API 错误率 | < 0.1% |miaoda observability |
| 数据库查询 | < 100ms | EXPLAIN ANALYZE |


---

## 第57章 打印模板配置模块完整规格

### 57.1 模块概述

打印模板配置模块允许管理员自定义标识卡、送货单、对账单的打印模板，包括字段选择、布局调整和样式设置。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 模板列表 | `/settings/templates` | 管理所有打印模板 |
| 模板编辑 | 弹窗 | 可视化编辑模板 |
| 字段配置 | 编辑器内 | 选择显示字段和顺序 |
| 预览 | 编辑器内 | 实时预览打印效果 |
| 模板启用/禁用 | 列表操作 | 控制模板可用性 |
| 恢复默认 | 编辑器内 | 恢复系统默认模板 |

### 57.2 模板列表页

```tsx
function TemplateConfigPage() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['print-templates'],
    queryFn: () => templateApi.getAll(),
  });

  const [editingTemplate, setEditingTemplate] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: templateApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-templates'] });
      toast.success('删除成功');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">打印模板配置</h1>
        <Button onClick={() => setEditingTemplate({})}>
          <Plus className="w-4 h-4 mr-1" /> 新增模板
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates?.map(tpl => (
          <Card key={tpl.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{tpl.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">{getTypeLabel(tpl.type)}</Badge>
                </div>
                <Switch checked={tpl.enabled} onCheckedChange={() => toggleTemplate(tpl)} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{tpl.description || '暂无描述'}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingTemplate(tpl)}>
                  <Edit className="w-3 h-3 mr-1" /> 编辑
                </Button>
                <Button size="sm" variant="outline" onClick={() => previewTemplate(tpl)}>
                  <Eye className="w-3 h-3 mr-1" /> 预览
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(tpl.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingTemplate && (
        <TemplateEditorDialog
          template={editingTemplate}
          open={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}
```

### 57.3 模板编辑器

```tsx
function TemplateEditorDialog({ template, open, onClose }) {
  const [config, setConfig] = useState<TemplateConfig>(template.config || defaultConfig);
  const [activeTab, setActiveTab] = useState('fields');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{template.id ? '编辑模板' : '新增模板'}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[70vh]">
          {/* 左侧配置面板 */}
          <div className="w-1/2 overflow-y-auto pr-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="fields" className="flex-1">字段配置</TabsTrigger>
                <TabsTrigger value="layout" className="flex-1">布局设置</TabsTrigger>
                <TabsTrigger value="style" className="flex-1">样式设置</TabsTrigger>
              </TabsList>

              <TabsContent value="fields">
                <FieldConfig config={config} onChange={setConfig} type={template.type} />
              </TabsContent>
              <TabsContent value="layout">
                <LayoutConfig config={config} onChange={setConfig} />
              </TabsContent>
              <TabsContent value="style">
                <StyleConfig config={config} onChange={setConfig} />
              </TabsContent>
            </Tabs>
          </div>

          {/* 右侧预览面板 */}
          <div className="w-1/2 bg-muted/30 rounded-lg p-4 overflow-y-auto">
            <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.6)', transformOrigin: 'top center' }}>
              <TemplatePreview type={template.type} config={config} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant="ghost" onClick={() => setConfig(defaultConfig)}>恢复默认</Button>
          <Button onClick={() => handleSave()}>保存模板</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 57.4 字段配置

```tsx
function FieldConfig({ config, onChange, type }) {
  const availableFields = getAvailableFields(type);
  const selectedFields = config.fields || [];

  const toggleField = (field) => {
    const exists = selectedFields.find(f => f.key === field.key);
    if (exists) {
      onChange({ ...config, fields: selectedFields.filter(f => f.key !== field.key) });
    } else {
      onChange({ ...config, fields: [...selectedFields, field] });
    }
  };

  const moveField = (index, direction) => {
    const newFields = [...selectedFields];
    const targetIndex = index + direction;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange({ ...config, fields: newFields });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">可用字段</Label>
        <div className="flex flex-wrap gap-2">
          {availableFields.map(field => {
            const selected = selectedFields.find(f => f.key === field.key);
            return (
              <button
                key={field.key}
                onClick={() => toggleField(field)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm border transition-colors',
                  selected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary'
                )}
              >
                {field.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">已选字段（拖动排序）</Label>
        <div className="space-y-1">
          {selectedFields.map((field, index) => (
            <div key={field.key} className="flex items-center gap-2 p-2 bg-card rounded-md border border-border">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{field.label}</span>
              <button onClick={() => moveField(index, -1)} disabled={index === 0}>
                <ChevronUp className="w-4 h-4" />
              </button>
              <button onClick={() => moveField(index, 1)} disabled={index === selectedFields.length - 1}>
                <ChevronDown className="w-4 h-4" />
              </button>
              <button onClick={() => toggleField(field)}>
                <X className="w-4 h-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 57.5 可用字段定义

```typescript
function getAvailableFields(type: TemplateType): TemplateField[] {
  const commonFields = [
    { key: 'orgName', label: '公司名称' },
    { key: 'orgCode', label: '公司编码' },
    { key: 'date', label: '日期' },
    { key: 'operator', label: '操作人' },
  ];

  switch (type) {
    case 'tag':
      return [
        ...commonFields,
        { key: 'batchNo', label: '批次号' },
        { key: 'customerName', label: '客户名称' },
        { key: 'productName', label: '产品名称' },
        { key: 'material', label: '材质' },
        { key: 'process', label: '工艺' },
        { key: 'specification', label: '规格' },
        { key: 'qty', label: '数量' },
        { key: 'unit', label: '单位' },
        { key: 'weight', label: '重量' },
        { key: 'inboundDate', label: '入库日期' },
        { key: 'location', label: '库位' },
        { key: 'qrCode', label: '二维码' },
      ];

    case 'delivery':
      return [
        ...commonFields,
        { key: 'deliveryNo', label: '送货单号' },
        { key: 'customerName', label: '客户名称' },
        { key: 'customerContact', label: '联系人' },
        { key: 'customerPhone', label: '联系电话' },
        { key: 'customerAddress', label: '送货地址' },
        { key: 'items', label: '产品明细表' },
        { key: 'totalQty', label: '总数量' },
        { key: 'totalWeight', label: '总重量' },
        { key: 'remark', label: '备注' },
        { key: 'signature', label: '签收栏' },
      ];

    case 'reconciliation':
      return [
        ...commonFields,
        { key: 'reconNo', label: '对账单号' },
        { key: 'customerName', label: '客户名称' },
        { key: 'period', label: '对账期间' },
        { key: 'records', label: '明细表' },
        { key: 'totalInbound', label: '入库总额' },
        { key: 'totalOutbound', label: '出库总额' },
        { key: 'totalAmount', label: '应收总额' },
        { key: 'paidAmount', label: '已收金额' },
        { key: 'unpaidAmount', label: '未收金额' },
        { key: 'status', label: '状态' },
      ];

    default:
      return commonFields;
  }
}
```

### 57.6 布局配置

```tsx
function LayoutConfig({ config, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>纸张大小</Label>
        <Select
          value={config.pageSize || 'A4'}
          onValueChange={(v) => onChange({ ...config, pageSize: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="A4">A4 (210×297mm)</SelectItem>
            <SelectItem value="A5">A5 (148×210mm)</SelectItem>
            <SelectItem value="80mm">80mm 热敏纸</SelectItem>
            <SelectItem value="100mm">100mm 标签纸</SelectItem>
            <SelectItem value="custom">自定义</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>方向</Label>
        <Select
          value={config.orientation || 'portrait'}
          onValueChange={(v) => onChange({ ...config, orientation: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">纵向</SelectItem>
            <SelectItem value="landscape">横向</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>上边距 (mm)</Label>
          <Input
            type="number"
            value={config.marginTop ?? 10}
            onChange={(e) => onChange({ ...config, marginTop: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label>下边距 (mm)</Label>
          <Input
            type="number"
            value={config.marginBottom ?? 10}
            onChange={(e) => onChange({ ...config, marginBottom: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label>左边距 (mm)</Label>
          <Input
            type="number"
            value={config.marginLeft ?? 10}
            onChange={(e) => onChange({ ...config, marginLeft: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label>右边距 (mm)</Label>
          <Input
            type="number"
            value={config.marginRight ?? 10}
            onChange={(e) => onChange({ ...config, marginRight: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label>标题</Label>
        <Input
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder="如：产品标识卡"
        />
      </div>
    </div>
  );
}
```

### 57.7 样式配置

```tsx
function StyleConfig({ config, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>字体</Label>
        <Select
          value={config.fontFamily || 'SimSun'}
          onValueChange={(v) => onChange({ ...config, fontFamily: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="SimSun">宋体</SelectItem>
            <SelectItem value="SimHei">黑体</SelectItem>
            <SelectItem value="Microsoft YaHei">微软雅黑</SelectItem>
            <SelectItem value="KaiTi">楷体</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>标题字号</Label>
          <Input
            type="number"
            value={config.titleFontSize ?? 18}
            onChange={(e) => onChange({ ...config, titleFontSize: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label>正文字号</Label>
          <Input
            type="number"
            value={config.bodyFontSize ?? 12}
            onChange={(e) => onChange({ ...config, bodyFontSize: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label>表格样式</Label>
        <Select
          value={config.tableStyle || 'bordered'}
          onValueChange={(v) => onChange({ ...config, tableStyle: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bordered">边框表格</SelectItem>
            <SelectItem value="striped">条纹表格</SelectItem>
            <SelectItem value="minimal">简洁样式</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>显示二维码</Label>
        <Switch
          checked={config.showQRCode ?? false}
          onCheckedChange={(v) => onChange({ ...config, showQRCode: v })}
        />
      </div>

      <div>
        <Label>显示页码</Label>
        <Switch
          checked={config.showPageNumber ?? true}
          onCheckedChange={(v) => onChange({ ...config, showPageNumber: v })}
        />
      </div>
    </div>
  );
}
```

### 57.8 API 接口

```typescript
// 模板列表
GET /api/print-templates
Response: PrintTemplate[]

// 模板详情
GET /api/print-templates/:id
Response: PrintTemplate

// 创建模板
POST /api/print-templates
Body: { name, type, description, config, enabled }
Response: PrintTemplate

// 更新模板
PUT /api/print-templates/:id
Body: Partial<PrintTemplate>
Response: PrintTemplate

// 删除模板
DELETE /api/print-templates/:id
Response: { id: string }

// 启用/禁用模板
PATCH /api/print-templates/:id/toggle
Response: PrintTemplate

// 预览模板
POST /api/print-templates/:id/preview
Body: { recordId }
Response: { html: string }
```

### 57.9 默认模板

```typescript
const DEFAULT_TEMPLATES = {
  tag: {
    name: '默认标识卡模板',
    type: 'tag',
    config: {
      pageSize: '100mm',
      orientation: 'portrait',
      title: '产品标识卡',
      fields: ['orgName', 'batchNo', 'customerName', 'productName', 'material', 'process', 'specification', 'qty', 'weight', 'inboundDate', 'qrCode'],
      fontFamily: 'SimSun',
      titleFontSize: 16,
      bodyFontSize: 11,
      showQRCode: true,
    },
  },
  delivery: {
    name: '默认送货单模板',
    type: 'delivery',
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      title: '送货单',
      fields: ['orgName', 'deliveryNo', 'customerName', 'customerAddress', 'items', 'totalQty', 'totalWeight', 'remark', 'signature'],
      fontFamily: 'SimSun',
      titleFontSize: 18,
      bodyFontSize: 12,
      tableStyle: 'bordered',
      showPageNumber: true,
    },
  },
  reconciliation: {
    name: '默认对账单模板',
    type: 'reconciliation',
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      title: '对账单',
      fields: ['orgName', 'reconNo', 'customerName', 'period', 'records', 'totalAmount', 'paidAmount', 'unpaidAmount'],
      fontFamily: 'SimSun',
      titleFontSize: 18,
      bodyFontSize: 12,
      tableStyle: 'striped',
      showPageNumber: true,
    },
  },
};
```


---

## 第58章 权限管理页面完整规格

### 58.1 模块概述

权限管理页面提供 RBAC 角色权限的可视化管理界面，超级管理员可以查看、创建、修改角色和权限配置。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 角色列表 | `/settings/permissions` | 查看所有角色 |
| 创建角色 | 弹窗 | 新建自定义角色 |
| 编辑角色 | 弹窗 | 修改角色名称和描述 |
| 权限分配 | 编辑器内 | 为角色分配权限点 |
| 成员管理 | 编辑器内 | 查看/添加/移除角色成员 |
| 模拟角色 | 列表操作 | 以指定角色身份预览系统 |

### 58.2 角色列表页

```tsx
function PermissionPage() {
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rbacApi.getRoles(),
  });
  const [editingRole, setEditingRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">权限管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理角色权限和成员分配
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> 创建角色
        </Button>
      </div>

      {/* 角色列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles?.map(role => (
          <RoleCard
            key={role.id}
            role={role}
            onEdit={() => setEditingRole(role)}
            onMock={() => handleMockRole(role)}
          />
        ))}
      </div>

      {/* 创建角色弹窗 */}
      {showCreate && (
        <RoleFormDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* 编辑角色弹窗 */}
      {editingRole && (
        <RoleEditDialog
          role={editingRole}
          open={!!editingRole}
          onClose={() => setEditingRole(null)}
        />
      )}
    </div>
  );
}
```

### 58.3 角色卡片

```tsx
function RoleCard({ role, onEdit, onMock }) {
  const isSystem = role.type === 'system';
  const memberCount = role.memberCount || 0;
  const permissionCount = role.permissions?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {role.name}
              {isSystem && <Badge variant="secondary">系统</Badge>}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
          </div>
          <Badge variant={role.enabled ? 'success' : 'secondary'}>
            {role.enabled ? '启用' : '禁用'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {memberCount} 人
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-4 h-4" /> {permissionCount} 权限
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1">
            <Edit className="w-3 h-3 mr-1" /> 编辑
          </Button>
          <Button size="sm" variant="ghost" onClick={onMock}>
            <Eye className="w-3 h-3 mr-1" /> 模拟
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 58.4 角色编辑器

```tsx
function RoleEditDialog({ role, open, onClose }) {
  const [activeTab, setActiveTab] = useState('permissions');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>编辑角色 — {role.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="permissions">权限分配</TabsTrigger>
            <TabsTrigger value="members">成员管理</TabsTrigger>
            <TabsTrigger value="info">基本信息</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions">
            <PermissionEditor role={role} />
          </TabsContent>
          <TabsContent value="members">
            <MemberManager role={role} />
          </TabsContent>
          <TabsContent value="info">
            <RoleInfoEditor role={role} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 58.5 权限分配编辑器

```tsx
function PermissionEditor({ role }) {
  const { data: permissionTree } = useQuery({
    queryKey: ['permissions', 'tree'],
    queryFn: () => rbacApi.getPermissionTree(),
  });

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role.permissions?.map(p => p.id) || [])
  );

  const togglePermission = (permId: string) => {
    const next = new Set(selectedPermissions);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setSelectedPermissions(next);
  };

  const toggleGroup = (group) => {
    const allSelected = group.permissions.every(p => selectedPermissions.has(p.id));
    const next = new Set(selectedPermissions);
    group.permissions.forEach(p => {
      if (allSelected) next.delete(p.id);
      else next.add(p.id);
    });
    setSelectedPermissions(next);
  };

  const saveMutation = useMutation({
    mutationFn: () => rbacApi.updateRolePermissions(role.id, Array.from(selectedPermissions)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('权限更新成功');
    },
  });

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
      {permissionTree?.map(group => {
        const allSelected = group.permissions.every(p => selectedPermissions.has(p.id));
        const someSelected = group.permissions.some(p => selectedPermissions.has(p.id));

        return (
          <div key={group.id} className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={() => toggleGroup(group)}
              />
              <span className="font-medium">{group.name}</span>
              <span className="text-xs text-muted-foreground">
                ({group.permissions.filter(p => selectedPermissions.has(p.id)).length}/{group.permissions.length})
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
              {group.permissions.map(perm => (
                <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedPermissions.has(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                  />
                  <span>{perm.name}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <div className="sticky bottom-0 bg-background pt-3 border-t">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          保存权限配置
        </Button>
      </div>
    </div>
  );
}
```

### 58.6 权限点定义

```typescript
const PERMISSION_TREE = [
  {
    id: 'inbound',
    name: '来货登记',
    permissions: [
      { id: 'inbound:view', name: '查看入库列表' },
      { id: 'inbound:create', name: '创建入库记录' },
      { id: 'inbound:edit', name: '编辑入库记录' },
      { id: 'inbound:delete', name: '删除入库记录' },
      { id: 'inbound:print', name: '打印标识卡' },
      { id: 'inbound:import', name: 'Excel导入' },
    ],
  },
  {
    id: 'outbound',
    name: '快速发货',
    permissions: [
      { id: 'outbound:view', name: '查看发货列表' },
      { id: 'outbound:create', name: '创建发货记录' },
      { id: 'outbound:edit', name: '编辑发货记录' },
      { id: 'outbound:delete', name: '删除发货记录' },
      { id: 'outbound:print', name: '打印送货单' },
      { id: 'outbound:complete', name: '确认完成' },
    ],
  },
  {
    id: 'inventory',
    name: '库存管理',
    permissions: [
      { id: 'inventory:view', name: '查看库存' },
      { id: 'inventory:adjust', name: '库存调整' },
      { id: 'inventory:export', name: '导出库存' },
    ],
  },
  {
    id: 'reconciliation',
    name: '智能对账',
    permissions: [
      { id: 'recon:view', name: '查看对账记录' },
      { id: 'recon:create', name: '创建对账单' },
      { id: 'recon:approve', name: '审批对账单' },
      { id: 'recon:reject', name: '驳回对账单' },
      { id: 'recon:print', name: '打印对账单' },
    ],
  },
  {
    id: 'statistics',
    name: '数据统计',
    permissions: [
      { id: 'stats:view', name: '查看统计数据' },
      { id: 'stats:export', name: '导出报表' },
    ],
  },
  {
    id: 'customer',
    name: '客户管理',
    permissions: [
      { id: 'customer:view', name: '查看客户列表' },
      { id: 'customer:create', name: '创建客户' },
      { id: 'customer:edit', name: '编辑客户' },
      { id: 'customer:delete', name: '删除客户' },
    ],
  },
  {
    id: 'product',
    name: '产品管理',
    permissions: [
      { id: 'product:view', name: '查看产品列表' },
      { id: 'product:create', name: '创建产品' },
      { id: 'product:edit', name: '编辑产品' },
      { id: 'product:delete', name: '删除产品' },
    ],
  },
  {
    id: 'system',
    name: '系统设置',
    permissions: [
      { id: 'system:templates', name: '打印模板配置' },
      { id: 'system:permissions', name: '权限管理' },
      { id: 'system:organizations', name: '组织管理' },
    ],
  },
];
```

### 58.7 成员管理

```tsx
function MemberManager({ role }) {
  const { data: members } = useQuery({
    queryKey: ['role', role.id, 'members'],
    queryFn: () => rbacApi.getRoleMembers(role.id),
  });

  const [showAdd, setShowAdd] = useState(false);

  const removeMutation = useMutation({
    mutationFn: (userId: string) => rbacApi.removeMember(role.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role', role.id, 'members'] });
      toast.success('已移除成员');
    },
  });

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          共 {members?.length || 0} 位成员
        </span>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <UserPlus className="w-3 h-3 mr-1" /> 添加成员
        </Button>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {members?.map(member => (
          <div key={member.userId} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <UserDisplay userId={member.userId} />
            <div className="flex-1">
              <p className="text-sm font-medium">{member.userName}</p>
              <p className="text-xs text-muted-foreground">加入时间: {formatDate(member.joinedAt)}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeMutation.mutate(member.userId)}
            >
              <UserMinus className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {showAdd && (
        <AddMemberDialog
          roleId={role.id}
          open={showAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
```

### 58.8 模拟角色

```typescript
async function handleMockRole(role) {
  try {
    await rbacApi.mockRole(role.bizId);
    toast.success(`已切换为 ${role.name} 视角`);
    window.location.reload();
  } catch (err) {
    toast.error('模拟角色失败');
  }
}
```

### 58.9 API 接口

```typescript
// 角色列表
GET /api/rbac/roles
Response: Role[]

// 创建角色
POST /api/rbac/roles
Body: { bizId, name, description }
Response: Role

// 更新角色
PUT /api/rbac/roles/:id
Body: { name, description }
Response: Role

// 删除角色
DELETE /api/rbac/roles/:id
Response: { id: string }

// 权限树
GET /api/rbac/permissions/tree
Response: PermissionGroup[]

// 更新角色权限
PUT /api/rbac/roles/:id/permissions
Body: { permissionIds: string[] }
Response: Role

// 角色成员列表
GET /api/rbac/roles/:id/members
Response: { userId, userName, joinedAt }[]

// 添加成员
POST /api/rbac/roles/:id/members
Body: { userId }
Response: { success: true }

// 移除成员
DELETE /api/rbac/roles/:id/members/:userId
Response: { success: true }

// 模拟角色
POST /api/rbac/mock
Body: { bizId }
Response: { success: true }
```


---

## 第59章 国际化与多语言规范

### 59.1 概述

系统当前仅支持中文（zh-CN），但代码架构预留了多语言扩展能力。

### 59.2 当前语言配置

```typescript
// 语言常量
const SUPPORTED_LANGUAGES = ['zh-CN'] as const;
const DEFAULT_LANGUAGE = 'zh-CN';
const FALLBACK_LANGUAGE = 'zh-CN';

// 语言检测
function detectLanguage(): string {
  const stored = localStorage.getItem('lang');
  if (stored && SUPPORTED_LANGUAGES.includes(stored as any)) {
    return stored;
  }
  return DEFAULT_LANGUAGE;
}
```

### 59.3 文案规范

#### 统一文案管理

```typescript
// src/i18n/zh-CN.ts
const messages = {
  // 通用
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    create: '新建',
    search: '搜索',
    filter: '筛选',
    reset: '重置',
    export: '导出',
    import: '导入',
    print: '打印',
    preview: '预览',
    loading: '加载中...',
    noData: '暂无数据',
    success: '操作成功',
    error: '操作失败',
    required: '必填',
    optional: '选填',
  },

  // 模块
  inbound: {
    title: '来货登记',
    create: '新增入库',
    edit: '编辑入库',
    batchNo: '批次号',
    customer: '客户',
    inboundDate: '入库日期',
    photos: '现场照片',
    items: '入库明细',
    status: {
      draft: '草稿',
      pending: '待审核',
      completed: '已完成',
      cancelled: '已取消',
    },
  },
  outbound: {
    title: '快速发货',
    create: '新增发货',
    edit: '编辑发货',
    deliveryNo: '送货单号',
    customer: '客户',
    outboundDate: '发货日期',
    items: '发货明细',
    status: {
      pending: '待发货',
      partial: '部分发货',
      completed: '已完成',
      cancelled: '已取消',
    },
  },
  inventory: {
    title: '库存管理',
    currentQty: '当前库存',
    location: '库位',
    batchNo: '批次号',
    status: {
      normal: '正常',
      expired: '超期',
      low_stock: '低库存',
    },
  },
  reconciliation: {
    title: '智能对账',
    create: '创建对账单',
    period: '对账期间',
    totalAmount: '应收总额',
    paidAmount: '已收金额',
    unpaidAmount: '未收金额',
    status: {
      draft: '草稿',
      pending: '待确认',
      confirmed: '已确认',
      rejected: '已驳回',
      settled: '已结清',
    },
  },
} as const;
```

### 59.4 日期格式

```typescript
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');

// 统一日期格式
const DATE_FORMATS = {
  date: 'YYYY-MM-DD',
  dateTime: 'YYYY-MM-DD HH:mm',
  time: 'HH:mm',
  fullDateTime: 'YYYY-MM-DD HH:mm:ss',
  month: 'YYYY-MM',
  year: 'YYYY',
  friendly: 'M月D日',
  friendlyDateTime: 'M月D日 HH:mm',
} as const;

// 格式化函数
function formatDate(date: string | Date, format = DATE_FORMATS.date): string {
  return dayjs(date).format(format);
}

function formatFriendlyDate(date: string | Date): string {
  const d = dayjs(date);
  const now = dayjs();
  const diffDays = now.diff(d, 'day');

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === 2) return '前天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  return d.format(DATE_FORMATS.date);
}
```

### 59.5 数字格式

```typescript
// 金额格式
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// 重量格式
function formatWeight(weight: number): string {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(2)} 吨`;
  }
  return `${weight.toFixed(2)} kg`;
}

// 数量格式
function formatQty(qty: number, unit: string): string {
  return `${qty} ${unit}`;
}

// 百分比
function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
```

### 59.6 错误消息

```typescript
const ERROR_MESSAGES = {
  // 网络
  NETWORK_ERROR: '网络连接失败，请检查网络',
  TIMEOUT: '请求超时，请稍后重试',
  SERVER_ERROR: '服务器错误，请稍后重试',

  // 认证
  UNAUTHORIZED: '登录已过期，请重新登录',
  FORBIDDEN: '您没有权限执行此操作',

  // 业务
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '数据验证失败',
  CONFLICT: '操作冲突，请刷新后重试',

  // 入库
  CUSTOMER_NOT_FOUND: '客户不存在',
  PRODUCT_NOT_FOUND: '产品不存在',
  BATCH_NO_DUPLICATE: '批次号已存在',

  // 出库
  INSUFFICIENT_STOCK: '库存不足',
  INBOUND_NOT_COMPLETED: '入库记录未完成',

  // 对账
  PERIOD_DUPLICATE: '对账期间已存在',
} as const;

function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || '操作失败';
}
```

### 59.7 表单验证消息

```typescript
const VALIDATION_MESSAGES = {
  required: (field: string) => `${field}不能为空`,
  minLength: (field: string, min: number) => `${field}至少${min}个字符`,
  maxLength: (field: string, max: number) => `${field}最多${max}个字符`,
  pattern: (field: string, pattern: string) => `${field}格式不正确`,
  min: (field: string, min: number) => `${field}不能小于${min}`,
  max: (field: string, max: number) => `${field}不能大于${max}`,
  email: '请输入正确的邮箱地址',
  phone: '请输入正确的手机号',
  url: '请输入正确的URL',
} as const;
```

### 59.8 枚举标签

```typescript
const LABELS = {
  material: {
    steel: '钢材',
    aluminum: '铝材',
    copper: '铜材',
    other: '其他',
  },
  process: {
    quench: '淬火',
    temper: '回火',
    anneal: '退火',
    normalize: '正火',
    carburize: '渗碳',
    nitride: '渗氮',
  },
  pricingMethod: {
    weight: '按重量',
    piece: '按件数',
  },
  inboundStatus: {
    draft: '草稿',
    pending: '待审核',
    completed: '已完成',
    cancelled: '已取消',
  },
  outboundStatus: {
    pending: '待发货',
    partial: '部分发货',
    completed: '已完成',
    cancelled: '已取消',
  },
  inventoryStatus: {
    normal: '正常',
    expired: '超期',
    low_stock: '低库存',
  },
  reconciliationStatus: {
    draft: '草稿',
    pending: '待确认',
    confirmed: '已确认',
    rejected: '已驳回',
    settled: '已结清',
  },
  roleType: {
    super_admin: '超级管理员',
    admin: '管理员',
    finance: '财务',
    inbound_operator: '入库操作员',
    outbound_operator: '出库操作员',
    member: '普通成员',
    viewer: '只读用户',
  },
} as const;

function getLabel(category: string, key: string): string {
  return LABELS[category]?.[key] || key;
}
```


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


---

## 第62章 系统配置与常量定义

### 62.1 系统常量

#### 应用信息

```typescript
const APP_CONFIG = {
  name: '热处理收发货管理系统',
  version: '1.0.0',
  description: '专业热处理行业收发货管理平台',
} as const;
```

#### 存储键名

```typescript
const STORAGE_KEYS = {
  ORG_CODE: 'org_code',
  ORG_INFO: 'org_info',
  USER_INFO: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'lang',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  LAST_PAGE_SIZE: 'last_page_size',
  RECENT_CUSTOMERS: 'recent_customers',
  RECENT_PRODUCTS: 'recent_products',
  CUSTOMER_LIST: 'customer_list_cache',
  PRODUCT_LIST: 'product_list_cache',
  DRAFT_INBOUND: 'draft_inbound',
} as const;
```

#### 分页默认值

```typescript
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;
```

#### 日期常量

```typescript
const DATE_CONSTANTS = {
  TIMEZONE: 'Asia/Shanghai',
  EXPIRY_DAYS: 90,
  RECENT_DAYS: 7,
  MONTH_DAYS: 30,
  QUARTER_DAYS: 90,
  YEAR_DAYS: 365,
} as const;
```

#### 库存阈值

```typescript
const INVENTORY_THRESHOLDS = {
  LOW_STOCK_QTY: 10,
  EXPIRY_DAYS: 90,
  WARNING_DAYS: 60,
  CRITICAL_DAYS: 80,
} as const;
```

### 62.2 业务常量

#### 入库状态

```typescript
const INBOUND_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

const INBOUND_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  completed: '已完成',
  cancelled: '已取消',
};

const INBOUND_STATUS_COLORS: Record<string, string> = {
  draft: 'secondary',
  pending: 'warning',
  completed: 'success',
  cancelled: 'error',
};
```

#### 出库状态

```typescript
const OUTBOUND_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

const OUTBOUND_STATUS_LABELS: Record<string, string> = {
  pending: '待发货',
  partial: '部分发货',
  completed: '已完成',
  cancelled: '已取消',
};
```

#### 对账状态

```typescript
const RECON_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  SETTLED: 'settled',
} as const;

const RECON_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending: '待确认',
  confirmed: '已确认',
  rejected: '已驳回',
  settled: '已结清',
};
```

#### 库存状态

```typescript
const INVENTORY_STATUS = {
  NORMAL: 'normal',
  EXPIRED: 'expired',
  LOW_STOCK: 'low_stock',
} as const;
```

### 62.3 产品常量

#### 材质

```typescript
const MATERIALS = [
  { value: 'steel', label: '钢材' },
  { value: 'aluminum', label: '铝材' },
  { value: 'copper', label: '铜材' },
  { value: 'other', label: '其他' },
] as const;
```

#### 工艺

```typescript
const PROCESSES = [
  { value: 'quench', label: '淬火' },
  { value: 'temper', label: '回火' },
  { value: 'anneal', label: '退火' },
  { value: 'normalize', label: '正火' },
  { value: 'carburize', label: '渗碳' },
  { value: 'nitride', label: '渗氮' },
] as const;
```

#### 计价方式

```typescript
const PRICING_METHODS = [
  { value: 'weight', label: '按重量' },
  { value: 'piece', label: '按件数' },
] as const;
```

#### 单位

```typescript
const UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'piece', label: '件' },
  { value: 'm', label: 'm' },
  { value: 'batch', label: '批' },
] as const;
```

### 62.4 角色常量

```typescript
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  FINANCE: 'finance',
  INBOUND_OPERATOR: 'inbound_operator',
  OUTBOUND_OPERATOR: 'outbound_operator',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  finance: '财务',
  inbound_operator: '入库操作员',
  outbound_operator: '出库操作员',
  member: '普通成员',
  viewer: '只读用户',
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: [
    'inbound:*', 'outbound:*', 'inventory:*',
    'recon:*', 'stats:*', 'customer:*', 'product:*',
    'system:templates',
  ],
  finance: [
    'recon:*', 'stats:view', 'stats:export',
    'inbound:view', 'outbound:view', 'inventory:view',
  ],
  inbound_operator: [
    'inbound:*', 'inventory:view',
  ],
  outbound_operator: [
    'outbound:*', 'inventory:view',
  ],
  member: [
    'inbound:view', 'outbound:view', 'inventory:view',
  ],
  viewer: [
    'inbound:view', 'outbound:view', 'inventory:view',
    'stats:view', 'customer:view', 'product:view',
  ],
};
```

### 62.5 API 路径常量

```typescript
const API_PATHS = {
  // 客户
  CUSTOMERS: '/api/customers',
  CUSTOMER_DETAIL: (id: string) => `/api/customers/${id}`,
  CUSTOMER_SEARCH: '/api/customers/search',
  CUSTOMER_HISTORY: (id: string) => `/api/customers/${id}/history`,

  // 产品
  PRODUCTS: '/api/products',
  PRODUCT_DETAIL: (id: string) => `/api/products/${id}`,
  PRODUCT_SEARCH: '/api/products/search',
  PRODUCT_RECORDS: (id: string) => `/api/products/${id}/records`,

  // 入库
  INBOUND: '/api/inbound',
  INBOUND_DETAIL: (id: string) => `/api/inbound/${id}`,
  INBOUND_IMPORT: '/api/inbound/import',
  INBOUND_PRINT: (id: string) => `/api/inbound/${id}/print`,
  INBOUND_STATUS: (id: string) => `/api/inbound/${id}/status`,

  // 出库
  OUTBOUND: '/api/outbound',
  OUTBOUND_DETAIL: (id: string) => `/api/outbound/${id}`,
  OUTBOUND_PRINT: (id: string) => `/api/outbound/${id}/print`,
  OUTBOUND_STATUS: (id: string) => `/api/outbound/${id}/status`,
  OUTBOUND_CLOSE: (id: string) => `/api/outbound/${id}/close`,

  // 库存
  INVENTORY: '/api/inventory',
  INVENTORY_OVERVIEW: '/api/inventory/overview',
  INVENTORY_BY_PRODUCT: (id: string) => `/api/inventory/product/${id}`,
  INVENTORY_ADJUST: '/api/inventory/adjust',
  INVENTORY_HISTORY: (id: string) => `/api/inventory/${id}/history`,

  // 对账
  RECONCILIATION: '/api/reconciliation',
  RECONCILIATION_DETAIL: (id: string) => `/api/reconciliation/${id}`,
  RECONCILIATION_STATUS: (id: string) => `/api/reconciliation/${id}/status`,
  RECONCILIATION_PRINT: (id: string) => `/api/reconciliation/${id}/print`,
  RECONCILIATION_PREVIEW: '/api/reconciliation/preview',

  // 统计
  STATS_OVERVIEW: '/api/statistics/overview',
  STATS_INBOUND: '/api/statistics/inbound',
  STATS_OUTBOUND: '/api/statistics/outbound',
  STATS_INVENTORY: '/api/statistics/inventory',
  STATS_CUSTOMER: '/api/statistics/customer',
  STATS_RECON: '/api/statistics/reconciliation',

  // 组织
  ORGS_MY: '/api/organizations/my',
  ORGS_CURRENT: '/api/organizations/current',
  ORG_SELECT: (code: string) => `/api/organizations/${code}/select`,
  ORG_MEMBERS: (id: string) => `/api/organizations/${id}/members`,

  // 权限
  RBAC_ROLES: '/api/rbac/roles',
  RBAC_ROLE_DETAIL: (id: string) => `/api/rbac/roles/${id}`,
  RBAC_PERMISSIONS: '/api/rbac/permissions/tree',
  RBAC_ROLE_PERMISSIONS: (id: string) => `/api/rbac/roles/${id}/permissions`,
  RBAC_ROLE_MEMBERS: (id: string) => `/api/rbac/roles/${id}/members`,
  RBAC_MOCK: '/api/rbac/mock',

  // 打印模板
  TEMPLATES: '/api/print-templates',
  TEMPLATE_DETAIL: (id: string) => `/api/print-templates/${id}`,
  TEMPLATE_TOGGLE: (id: string) => `/api/print-templates/${id}/toggle`,
  TEMPLATE_PREVIEW: (id: string) => `/api/print-templates/${id}/preview`,

  // 工作台
  DASHBOARD_OVERVIEW: '/api/dashboard/overview',
  DASHBOARD_PENDING: '/api/dashboard/pending',
  DASHBOARD_CHARTS: '/api/dashboard/charts',
  DASHBOARD_RECENT: '/api/dashboard/recent',

  // 健康
  HEALTH: '/api/health',
} as const;
```

### 62.6 路由路径常量

```typescript
const ROUTES = {
  HOME: '/',
  INBOUND: '/inbound',
  OUTBOUND: '/outbound',
  INVENTORY: '/inventory',
  RECONCILIATION: '/reconciliation',
  STATISTICS: '/statistics',
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: (id: string) => `/customers/${id}`,
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  TEMPLATES: '/settings/templates',
  PERMISSIONS: '/settings/permissions',
  ORGANIZATIONS: '/organizations',
} as const;
```

### 62.7 导航菜单常量

```typescript
const NAV_SECTIONS = [
  {
    key: 'dashboard',
    label: '工作台',
    icon: 'Dashboard',
    path: '/',
    roles: ['super_admin', 'admin', 'finance', 'inbound_operator', 'outbound_operator', 'member', 'viewer'],
  },
  {
    key: 'inbound',
    label: '来货登记',
    icon: 'Inbox',
    path: '/inbound',
    roles: ['super_admin', 'admin', 'inbound_operator'],
  },
  {
    key: 'outbound',
    label: '快速发货',
    icon: 'Outbox',
    path: '/outbound',
    roles: ['super_admin', 'admin', 'outbound_operator'],
  },
  {
    key: 'inventory',
    label: '库存管理',
    icon: 'Package',
    path: '/inventory',
    roles: ['super_admin', 'admin', 'inbound_operator', 'outbound_operator'],
  },
  {
    key: 'reconciliation',
    label: '智能对账',
    icon: 'FileText',
    path: '/reconciliation',
    roles: ['super_admin', 'admin', 'finance'],
  },
  {
    key: 'statistics',
    label: '数据统计',
    icon: 'BarChart',
    path: '/statistics',
    roles: ['super_admin', 'admin', 'finance', 'viewer'],
  },
  {
    key: 'master_data',
    label: '基础数据',
    icon: 'Database',
    roles: ['super_admin', 'admin'],
    children: [
      { key: 'customers', label: '客户管理', path: '/customers' },
      { key: 'products', label: '产品管理', path: '/products' },
    ],
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: 'Settings',
    roles: ['super_admin', 'admin'],
    children: [
      { key: 'templates', label: '打印模板', path: '/settings/templates' },
      { key: 'permissions', label: '权限管理', path: '/settings/permissions', roles: ['super_admin'] },
    ],
  },
] as const;
```

### 62.8 图表颜色常量

```typescript
const CHART_COLORS = {
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#06b6d4',
  purple: '#9333ea',
  orange: '#ea580c',
  teal: '#14b8a6',
} as const;

const CHART_COLOR_LIST = [
  '#2563eb', '#16a34a', '#f59e0b', '#dc2626',
  '#06b6d4', '#9333ea', '#ea580c', '#14b8a6',
  '#6366f1', '#84cc16', '#f97316', '#ec4899',
] as const;
```

### 62.9 文件上传限制

```typescript
const FILE_LIMITS = {
  IMAGE: {
    maxSize: 5 * 1024 * 1024,
    accept: 'image/jpeg,image/png,image/gif,image/webp',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
  EXCEL: {
    maxSize: 10 * 1024 * 1024,
    accept: '.xlsx,.xls',
    extensions: ['.xlsx', '.xls'],
  },
  PDF: {
    maxSize: 20 * 1024 * 1024,
    accept: '.pdf',
    extensions: ['.pdf'],
  },
} as const;
```

### 62.10 正则表达式

```typescript
const REGEX = {
  PHONE: /^1[3-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/[^\s]+$/,
  BATCH_NO: /^[A-Za-z0-9\-_]+$/,
  ORG_CODE: /^[A-Za-z0-9]{3,20}$/,
  POSITIVE_NUMBER: /^\d+(\.\d+)?$/,
  INTEGER: /^\d+$/,
} as const;
```

### 62.11 消息提示

```typescript
const TOAST_MESSAGES = {
  // 成功
  CREATE_SUCCESS: '创建成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功',
  SAVE_SUCCESS: '保存成功',
  IMPORT_SUCCESS: '导入成功',
  EXPORT_SUCCESS: '导出成功',
  PRINT_SUCCESS: '打印成功',
  APPROVE_SUCCESS: '审批成功',
  REJECT_SUCCESS: '驳回成功',
  SEND_SUCCESS: '发送成功',

  // 错误
  CREATE_FAILED: '创建失败',
  UPDATE_FAILED: '更新失败',
  DELETE_FAILED: '删除失败',
  SAVE_FAILED: '保存失败',
  IMPORT_FAILED: '导入失败',
  EXPORT_FAILED: '导出失败',
  PRINT_FAILED: '打印失败',

  // 确认
  DELETE_CONFIRM: '确定要删除吗？此操作不可撤销。',
  CANCEL_CONFIRM: '确定要取消吗？已填写的数据将丢失。',
  CLOSE_CONFIRM: '确定要关单吗？关单后将无法修改。',

  // 提示
  NO_DATA: '暂无数据',
  LOADING: '加载中...',
  SAVING: '保存中...',
  UPLOADING: '上传中...',
  EXPORTING: '导出中...',
} as const;
```


---

## 第63章 数据库 Schema 完整定义参考

### 63.1 Schema 概览

系统数据库使用 PostgreSQL，通过 Drizzle ORM 管理所有表结构。以下是完整的表定义参考。

#### 表清单

| 表名 | 说明 | 核心字段数 |
|------|------|-----------|
| organizations | 组织表 | 8 |
| organization_members | 组织成员表 | 5 |
| customers | 客户表 | 12 |
| products | 产品表 | 14 |
| inbound_records | 入库记录表 | 10 |
| inbound_items | 入库明细表 | 8 |
| outbound_records | 出库记录表 | 12 |
| outbound_items | 出库明细表 | 8 |
| inventory | 库存表 | 10 |
| inventory_history | 库存变动历史表 | 8 |
| reconciliation_records | 对账记录表 | 14 |
| reconciliation_items | 对账明细表 | 6 |
| print_templates | 打印模板表 | 8 |
| print_logs | 打印日志表 | 7 |
| file_metas | 文件元信息表 | 8 |
| audit_logs | 审计日志表 | 7 |

### 63.2 组织表

```typescript
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.3 组织成员表

```typescript
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  userId: userProfile('user_id').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  joinedAt: customTimestamptz('joined_at').defaultNow().notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.4 客户表

```typescript
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  taxNumber: varchar('tax_number', { length: 50 }),
  bankName: varchar('bank_name', { length: 100 }),
  bankAccount: varchar('bank_account', { length: 50 }),
  remark: text('remark'),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.5 产品表

```typescript
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  material: varchar('material', { length: 50 }),
  process: varchar('process', { length: 50 }),
  specification: varchar('specification', { length: 255 }),
  unit: varchar('unit', { length: 20 }).default('kg').notNull(),
  pricingMethod: varchar('pricing_method', { length: 20 }).default('weight').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  minOrderQty: decimal('min_order_qty', { precision: 10, scale: 3 }),
  remark: text('remark'),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.6 入库记录表

```typescript
export const inboundRecords = pgTable('inbound_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  batchNo: varchar('batch_no', { length: 100 }),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: varchar('customer_name', { length: 255 }),
  inboundDate: customTimestamptz('inbound_date').notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  totalQty: decimal('total_qty', { precision: 12, scale: 3 }).default(0).notNull(),
  totalWeight: decimal('total_weight', { precision: 12, scale: 3 }).default(0).notNull(),
  photos: text('photos'),
  remark: text('remark'),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.7 入库明细表

```typescript
export const inboundItems = pgTable('inbound_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  inboundId: uuid('inbound_id').notNull().references(() => inboundRecords.id),
  productId: uuid('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  material: varchar('material', { length: 50 }),
  process: varchar('process', { length: 50 }),
  specification: varchar('specification', { length: 255 }),
  qty: decimal('qty', { precision: 12, scale: 3 }).notNull(),
  weight: decimal('weight', { precision: 12, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  amount: decimal('amount', { precision: 14, scale: 2 }),
  location: varchar('location', { length: 50 }),
  remark: text('remark'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.8 出库记录表

```typescript
export const outboundRecords = pgTable('outbound_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  outboundNo: varchar('outbound_no', { length: 100 }),
  inboundId: uuid('inbound_id').references(() => inboundRecords.id),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: varchar('customer_name', { length: 255 }),
  outboundDate: customTimestamptz('outbound_date').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  totalQty: decimal('total_qty', { precision: 12, scale: 3 }).default(0).notNull(),
  totalWeight: decimal('total_weight', { precision: 12, scale: 3 }).default(0).notNull(),
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).default(0).notNull(),
  deliveredQty: decimal('delivered_qty', { precision: 12, scale: 3 }).default(0).notNull(),
  remark: text('remark'),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.9 出库明细表

```typescript
export const outboundItems = pgTable('outbound_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  outboundId: uuid('outbound_id').notNull().references(() => outboundRecords.id),
  productId: uuid('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  material: varchar('material', { length: 50 }),
  process: varchar('process', { length: 50 }),
  specification: varchar('specification', { length: 255 }),
  qty: decimal('qty', { precision: 12, scale: 3 }).notNull(),
  weight: decimal('weight', { precision: 12, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  amount: decimal('amount', { precision: 14, scale: 2 }),
  remark: text('remark'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.10 库存表

```typescript
export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  material: varchar('material', { length: 50 }),
  specification: varchar('specification', { length: 255 }),
  currentQty: decimal('current_qty', { precision: 12, scale: 3 }).default(0).notNull(),
  currentWeight: decimal('current_weight', { precision: 12, scale: 3 }).default(0).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  location: varchar('location', { length: 50 }),
  batchNo: varchar('batch_no', { length: 100 }),
  inboundDate: customTimestamptz('inbound_date'),
  status: varchar('status', { length: 20 }).default('normal').notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.11 库存变动历史表

```typescript
export const inventoryHistory = pgTable('inventory_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  productId: uuid('product_id').notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  qty: decimal('qty', { precision: 12, scale: 3 }).notNull(),
  afterQty: decimal('after_qty', { precision: 12, scale: 3 }).notNull(),
  source: varchar('source', { length: 100 }),
  refId: uuid('ref_id'),
  operator: userProfile('operator').notNull(),
  remark: text('remark'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.12 对账记录表

```typescript
export const reconciliationRecords = pgTable('reconciliation_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  reconNo: varchar('recon_no', { length: 100 }),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  periodYear: integer('period_year').notNull(),
  periodMonth: integer('period_month').notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  totalInbound: decimal('total_inbound', { precision: 14, scale: 2 }).default(0).notNull(),
  totalOutbound: decimal('total_outbound', { precision: 14, scale: 2 }).default(0).notNull(),
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).default(0).notNull(),
  paidAmount: decimal('paid_amount', { precision: 14, scale: 2 }).default(0).notNull(),
  unpaidAmount: decimal('unpaid_amount', { precision: 14, scale: 2 }).default(0).notNull(),
  remark: text('remark'),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
  confirmedAt: customTimestamptz('confirmed_at'),
  confirmedBy: userProfile('confirmed_by'),
});
```

### 63.13 对账明细表

```typescript
export const reconciliationItems = pgTable('reconciliation_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  reconciliationId: uuid('reconciliation_id').notNull().references(() => reconciliationRecords.id),
  type: varchar('type', { length: 20 }).notNull(),
  refId: uuid('ref_id'),
  refNo: varchar('ref_no', { length: 100 }),
  date: customTimestamptz('date').notNull(),
  productName: varchar('product_name', { length: 255 }),
  qty: decimal('qty', { precision: 12, scale: 3 }),
  weight: decimal('weight', { precision: 12, scale: 3 }),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.14 打印模板表

```typescript
export const printTemplates = pgTable('print_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description'),
  config: jsonb('config').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.15 打印日志表

```typescript
export const printLogs = pgTable('print_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  templateId: uuid('template_id').references(() => printTemplates.id),
  templateName: varchar('template_name', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(),
  refId: uuid('ref_id'),
  refNo: varchar('ref_no', { length: 100 }),
  status: varchar('status', { length: 20 }).default('success').notNull(),
  printedBy: userProfile('printed_by').notNull(),
  printedAt: customTimestamptz('printed_at').defaultNow().notNull(),
});
```

### 63.16 文件元信息表

```typescript
export const fileMetas = pgTable('file_metas', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  refId: uuid('ref_id'),
  uploadedBy: userProfile('uploaded_by').notNull(),
  uploadedAt: customTimestamptz('uploaded_at').defaultNow().notNull(),
});
```

### 63.17 审计日志表

```typescript
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  targetId: uuid('target_id'),
  targetType: varchar('target_type', { length: 50 }),
  changes: jsonb('changes'),
  operator: userProfile('operator').notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.18 索引定义

```sql
-- 组织相关索引
CREATE INDEX idx_org_members_org_user ON organization_members (org_id, user_id);

-- 客户相关索引
CREATE INDEX idx_customers_org ON customers (org_id);
CREATE INDEX idx_customers_org_name ON customers (org_id, name);

-- 产品相关索引
CREATE INDEX idx_products_org ON products (org_id);
CREATE INDEX idx_products_org_material_process ON products (org_id, material, process);

-- 入库相关索引
CREATE INDEX idx_inbound_org_date ON inbound_records (org_id, created_at DESC);
CREATE INDEX idx_inbound_org_customer ON inbound_records (org_id, customer_id);
CREATE INDEX idx_inbound_org_status ON inbound_records (org_id, status);
CREATE INDEX idx_inbound_org_batch ON inbound_records (org_id, batch_no);
CREATE INDEX idx_inbound_items_inbound ON inbound_items (inbound_id);

-- 出库相关索引
CREATE INDEX idx_outbound_org_date ON outbound_records (org_id, created_at DESC);
CREATE INDEX idx_outbound_org_inbound ON outbound_records (org_id, inbound_id);
CREATE INDEX idx_outbound_org_customer ON outbound_records (org_id, customer_id);
CREATE INDEX idx_outbound_org_status ON outbound_records (org_id, status);
CREATE INDEX idx_outbound_items_outbound ON outbound_items (outbound_id);

-- 库存相关索引
CREATE INDEX idx_inventory_org_product ON inventory (org_id, product_id);
CREATE INDEX idx_inventory_org_status ON inventory (org_id, status);
CREATE INDEX idx_inventory_org_batch ON inventory (org_id, batch_no);
CREATE INDEX idx_inventory_history_product ON inventory_history (org_id, product_id, created_at DESC);

-- 对账相关索引
CREATE INDEX idx_recon_org_period ON reconciliation_records (org_id, period_year, period_month);
CREATE INDEX idx_recon_org_customer ON reconciliation_records (org_id, customer_id);
CREATE INDEX idx_recon_org_status ON reconciliation_records (org_id, status);
CREATE INDEX idx_recon_items_recon ON reconciliation_items (reconciliation_id);

-- 打印模板相关索引
CREATE INDEX idx_templates_org_type ON print_templates (org_id, type, enabled);

-- 审计日志索引
CREATE INDEX idx_audit_org_module_date ON audit_logs (org_id, module, created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs (org_id, target_id);
```

### 63.19 Drizzle 关系定义

```typescript
export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  customers: many(customers),
  products: many(products),
  inboundRecords: many(inboundRecords),
  outboundRecords: many(outboundRecords),
  inventory: many(inventory),
  reconciliationRecords: many(reconciliationRecords),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  inboundRecords: many(inboundRecords),
  outboundRecords: many(outboundRecords),
  reconciliationRecords: many(reconciliationRecords),
}));

export const productsRelations = relations(products, ({ many }) => ({
  inboundItems: many(inboundItems),
  outboundItems: many(outboundItems),
  inventory: many(inventory),
}));

export const inboundRecordsRelations = relations(inboundRecords, ({ many, one }) => ({
  items: many(inboundItems),
  customer: one(customers, {
    fields: [inboundRecords.customerId],
    references: [customers.id],
  }),
  outboundRecords: many(outboundRecords),
}));

export const outboundRecordsRelations = relations(outboundRecords, ({ many, one }) => ({
  items: many(outboundItems),
  customer: one(customers, {
    fields: [outboundRecords.customerId],
    references: [customers.id],
  }),
  inboundRecord: one(inboundRecords, {
    fields: [outboundRecords.inboundId],
    references: [inboundRecords.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ many, one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
  history: many(inventoryHistory),
}));

export const reconciliationRecordsRelations = relations(reconciliationRecords, ({ many, one }) => ({
  customer: one(customers, {
    fields: [reconciliationRecords.customerId],
    references: [customers.id],
  }),
  items: many(reconciliationItems),
}));
```

### 63.20 数据类型说明

| Schema 类型 | TypeScript 类型 | PostgreSQL 类型 | 说明 |
|-------------|-----------------|-----------------|------|
| `uuid()` | `string` | `uuid` | UUID 主键 |
| `varchar()` | `string` | `varchar(n)` | 变长字符串 |
| `text()` | `string` | `text` | 长文本 |
| `integer()` | `number` | `integer` | 整数 |
| `decimal()` | `string` | `numeric(p,s)` | 精确小数（注意：TS 中为 string） |
| `boolean()` | `boolean` | `boolean` | 布尔值 |
| `jsonb()` | `unknown` | `jsonb` | JSON 数据 |
| `customTimestamptz()` | `Date`（service 内）/ `string`（API 响应） | `timestamptz` | 时间戳 |
| `userProfile()` | `string` | `user_profile` | 平台用户类型 |

### 63.21 decimal 类型注意事项

```typescript
// decimal 在 TypeScript 中为 string 类型
// 需要手动转换为 number
const qty: string = record.totalQty;
const qtyNum: number = parseFloat(qty);

// 比较时需要转换为 number
if (parseFloat(record.currentQty) < 10) {
  // 库存不足
}

// 计算时需要转换为 number
const total = parseFloat(item.qty) * parseFloat(item.unitPrice);
```


---

## 第64章 Shared 类型定义完整参考

### 64.1 概述

`shared/api.interface.ts` 是前后端共享的类型定义文件，所有接口的请求和响应类型必须在此文件中定义。

### 64.2 通用类型

```typescript
// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 游标分页响应
export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// 统一错误响应
export interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  timestamp: string;
  path: string;
}

// 操作结果
export interface OperationResult {
  id: string;
  success: boolean;
}

// 排序参数
export type SortOrder = 'asc' | 'desc';

export interface SortParam {
  field: string;
  order: SortOrder;
}

// 日期范围参数
export interface DateRangeParam {
  startDate?: string;
  endDate?: string;
}
```

### 64.3 组织相关类型

```typescript
export interface Organization {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  memberCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  userId: string;
  userName: string;
  role: string;
  joinedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  code: string;
}

export interface CurrentOrganization extends Organization {
  role: string;
  permissions: string[];
}
```

### 64.4 客户相关类型

```typescript
export interface Customer {
  id: string;
  orgId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  bankName?: string;
  bankAccount?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  bankName?: string;
  bankAccount?: string;
  remark?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface CustomerListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: SortOrder;
}

export interface CustomerSearchItem {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
}

export interface CustomerHistory {
  inboundCount: number;
  outboundCount: number;
  totalAmount: number;
  paymentRate: number;
  inboundRecords: InboundRecord[];
  outboundRecords: OutboundRecord[];
  reconciliationRecords: ReconciliationRecord[];
}
```

### 64.5 产品相关类型

```typescript
export type MaterialType = 'steel' | 'aluminum' | 'copper' | 'other';
export type ProcessType = 'quench' | 'temper' | 'anneal' | 'normalize' | 'carburize' | 'nitride';
export type PricingMethod = 'weight' | 'piece';

export interface Product {
  id: string;
  orgId: string;
  name: string;
  material?: MaterialType;
  process?: ProcessType;
  specification?: string;
  unit: string;
  pricingMethod: PricingMethod;
  unitPrice?: string;
  minOrderQty?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  inventory?: InventoryItem;
  records?: ProductRecord[];
}

export interface CreateProductRequest {
  name: string;
  material?: MaterialType;
  process?: ProcessType;
  specification?: string;
  unit: string;
  pricingMethod: PricingMethod;
  unitPrice?: string;
  minOrderQty?: string;
  remark?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface ProductListParams {
  search?: string;
  material?: string;
  process?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductSearchItem {
  id: string;
  name: string;
  material?: string;
  process?: string;
  specification?: string;
  unit: string;
  pricingMethod: PricingMethod;
  unitPrice?: string;
}

export interface ProductRecord {
  id: string;
  type: 'inbound' | 'outbound';
  refNo: string;
  date: string;
  qty: string;
  weight: string;
  unit: string;
  customerName?: string;
  status: string;
}
```

### 64.6 入库相关类型

```typescript
export type InboundStatus = 'draft' | 'pending' | 'completed' | 'cancelled';

export interface InboundItem {
  id: string;
  inboundId: string;
  productId?: string;
  productName: string;
  material?: string;
  process?: string;
  specification?: string;
  qty: string;
  weight: string;
  unit: string;
  unitPrice?: string;
  amount?: string;
  location?: string;
  remark?: string;
}

export interface InboundRecord {
  id: string;
  orgId: string;
  batchNo?: string;
  customerId?: string;
  customerName?: string;
  inboundDate: string;
  status: InboundStatus;
  totalQty: string;
  totalWeight: string;
  photos?: string;
  remark?: string;
  items?: InboundItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInboundItemRequest {
  productId?: string;
  productName: string;
  material?: string;
  process?: string;
  specification?: string;
  qty: string;
  weight: string;
  unit: string;
  unitPrice?: string;
  location?: string;
  remark?: string;
}

export interface CreateInboundRequest {
  batchNo?: string;
  customerId?: string;
  customerName?: string;
  inboundDate: string;
  items: CreateInboundItemRequest[];
  photos?: string[];
  remark?: string;
}

export interface UpdateInboundRequest extends Partial<CreateInboundRequest> {}

export interface InboundListParams {
  search?: string;
  customerId?: string;
  status?: InboundStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: SortOrder;
}

export interface InboundImportResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}
```

### 64.7 出库相关类型

```typescript
export type OutboundStatus = 'pending' | 'partial' | 'completed' | 'cancelled';

export interface OutboundItem {
  id: string;
  outboundId: string;
  productId?: string;
  productName: string;
  material?: string;
  process?: string;
  specification?: string;
  qty: string;
  weight: string;
  unit: string;
  unitPrice?: string;
  amount?: string;
  remark?: string;
}

export interface OutboundRecord {
  id: string;
  orgId: string;
  outboundNo?: string;
  inboundId?: string;
  customerId?: string;
  customerName?: string;
  outboundDate: string;
  status: OutboundStatus;
  totalQty: string;
  totalWeight: string;
  totalAmount: string;
  deliveredQty: string;
  remark?: string;
  items?: OutboundItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOutboundItemRequest {
  productId?: string;
  productName: string;
  qty: string;
  weight: string;
  unit: string;
  unitPrice?: string;
  remark?: string;
}

export interface CreateOutboundRequest {
  inboundId?: string;
  customerId?: string;
  customerName?: string;
  outboundDate: string;
  items: CreateOutboundItemRequest[];
  remark?: string;
}

export interface UpdateOutboundRequest extends Partial<CreateOutboundRequest> {}

export interface OutboundListParams {
  search?: string;
  customerId?: string;
  inboundId?: string;
  status?: OutboundStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CloseOutboundRequest {
  reason?: string;
}
```

### 64.8 库存相关类型

```typescript
export type InventoryStatus = 'normal' | 'expired' | 'low_stock';

export interface InventoryItem {
  id: string;
  orgId: string;
  productId: string;
  productName: string;
  material?: string;
  specification?: string;
  currentQty: string;
  currentWeight: string;
  unit: string;
  location?: string;
  batchNo?: string;
  inboundDate?: string;
  status: InventoryStatus;
  updatedAt: string;
}

export interface InventoryOverview {
  totalTypes: number;
  totalQty: number;
  expiredCount: number;
  lowStockCount: number;
}

export interface InventoryListParams {
  search?: string;
  material?: string;
  batchNo?: string;
  status?: InventoryStatus;
  page?: number;
  pageSize?: number;
}

export interface AdjustInventoryRequest {
  productId: string;
  adjustType: 'in' | 'out';
  qty: number;
  reason: string;
}

export interface InventoryHistoryRecord {
  id: string;
  type: 'inbound' | 'outbound' | 'adjust_in' | 'adjust_out';
  qty: string;
  afterQty: string;
  source: string;
  operator: string;
  createdAt: string;
}
```

### 64.9 对账相关类型

```typescript
export type ReconciliationStatus = 'draft' | 'pending' | 'confirmed' | 'rejected' | 'settled';

export interface ReconciliationItem {
  id: string;
  type: 'inbound' | 'outbound';
  refId: string;
  refNo: string;
  date: string;
  productName?: string;
  qty?: string;
  weight?: string;
  amount: string;
}

export interface ReconciliationRecord {
  id: string;
  orgId: string;
  reconNo?: string;
  customerId: string;
  customerName: string;
  periodYear: number;
  periodMonth: number;
  status: ReconciliationStatus;
  totalInbound: string;
  totalOutbound: string;
  totalAmount: string;
  paidAmount: string;
  unpaidAmount: string;
  remark?: string;
  items?: ReconciliationItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface CreateReconciliationRequest {
  customerId: string;
  periodYear: number;
  periodMonth: number;
  remark?: string;
}

export interface UpdateReconciliationRequest {
  remark?: string;
  paidAmount?: string;
}

export interface ReconciliationListParams {
  search?: string;
  customerId?: string;
  status?: ReconciliationStatus;
  periodYear?: number;
  periodMonth?: number;
  page?: number;
  pageSize?: number;
}

export interface ReconciliationPreview {
  customerId: string;
  customerName: string;
  periodYear: number;
  periodMonth: number;
  totalInbound: string;
  totalOutbound: string;
  totalAmount: string;
  items: ReconciliationItem[];
}
```

### 64.10 统计相关类型

```typescript
export interface StatisticsOverview {
  totalInboundQty: number;
  totalInboundWeight: number;
  totalOutboundQty: number;
  totalOutboundWeight: number;
  totalInventoryQty: number;
  totalInventoryWeight: number;
  totalCustomers: number;
  totalProducts: number;
  pendingReconciliation: number;
  expiredInventory: number;
  lowStockCount: number;
}

export interface InboundStatistics {
  date: string;
  count: number;
  totalQty: number;
  totalWeight: number;
  totalAmount: number;
}

export interface OutboundStatistics {
  date: string;
  count: number;
  totalQty: number;
  totalWeight: number;
  totalAmount: number;
}

export interface InventoryStatistics {
  productName: string;
  material?: string;
  currentQty: number;
  currentWeight: number;
  unit: string;
  status: string;
  percentage: number;
}

export interface CustomerStatistics {
  customerId: string;
  customerName: string;
  inboundCount: number;
  outboundCount: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paymentRate: number;
}

export interface ReconciliationStatistics {
  status: string;
  count: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export interface StatisticsParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}
```

### 64.11 打印模板相关类型

```typescript
export type TemplateType = 'tag' | 'delivery' | 'reconciliation';

export interface PrintTemplate {
  id: string;
  orgId: string;
  name: string;
  type: TemplateType;
  description?: string;
  config: TemplateConfig;
  enabled: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateConfig {
  pageSize?: string;
  orientation?: 'portrait' | 'landscape';
  title?: string;
  fields?: TemplateField[];
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  fontFamily?: string;
  titleFontSize?: number;
  bodyFontSize?: number;
  tableStyle?: 'bordered' | 'striped' | 'minimal';
  showQRCode?: boolean;
  showPageNumber?: boolean;
}

export interface TemplateField {
  key: string;
  label: string;
}

export interface CreateTemplateRequest {
  name: string;
  type: TemplateType;
  description?: string;
  config: TemplateConfig;
  enabled?: boolean;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

export interface PrintPreviewResult {
  html: string;
}
```

### 64.12 工作台相关类型

```typescript
export interface DashboardOverview {
  todayInboundCount: number;
  todayInboundWeight: number;
  todayOutboundCount: number;
  todayOutboundWeight: number;
  totalInventoryTypes: number;
  totalInventoryQty: number;
  pendingReconciliation: number;
  expiredInventory: number;
  lowStockCount: number;
  weeklyInbound: { date: string; count: number; weight: number }[];
  weeklyOutbound: { date: string; count: number; weight: number }[];
  topCustomers: { customerId: string; customerName: string; totalAmount: number }[];
  inventoryDistribution: { material: string; count: number; percentage: number }[];
}

export interface DashboardPendingItem {
  id: string;
  type: 'inbound' | 'outbound' | 'reconciliation' | 'inventory';
  title: string;
  description: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface DashboardChartData {
  inboundTrend: { date: string; count: number; weight: number; amount: number }[];
  outboundTrend: { date: string; count: number; weight: number; amount: number }[];
  customerRanking: { customerId: string; customerName: string; totalAmount: number }[];
  materialDistribution: { material: string; count: number; percentage: number }[];
}

export interface DashboardRecentAction {
  id: string;
  module: string;
  action: string;
  description: string;
  operator: string;
  createdAt: string;
}
```

### 64.13 权限相关类型

```typescript
export interface Role {
  id: string;
  bizId: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  enabled: boolean;
  permissions: Permission[];
  memberCount: number;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface CreateRoleRequest {
  bizId: string;
  name: string;
  description: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}
```

### 64.14 文件相关类型

```typescript
export interface FileMeta {
  id: string;
  orgId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  refId?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface FileUploadResult {
  file_path: string;
  file_name: string;
  file_size: number;
}
```

### 64.15 审计日志类型

```typescript
export interface AuditLog {
  id: string;
  orgId: string;
  module: string;
  action: string;
  targetId?: string;
  targetType?: string;
  changes?: Record<string, unknown>;
  operator: string;
  ipAddress?: string;
  createdAt: string;
}
```


---

## 第65章 前端 API 层完整实现参考

### 65.1 API 层架构

前端 API 请求统一封装在 `client/src/api/` 目录下，按模块拆分文件，通过桶导出聚合。

```
client/src/api/
├── index.ts           # 桶导出
├── customer.ts        # 客户管理 API
├── product.ts         # 产品管理 API
├── inbound.ts         # 入库管理 API
├── outbound.ts        # 出库管理 API
├── inventory.ts       # 库存管理 API
├── reconciliation.ts  # 对账管理 API
├── statistics.ts      # 统计报表 API
├── organization.ts    # 组织管理 API
├── rbac.ts            # 权限管理 API
├── template.ts        # 打印模板 API
└── dashboard.ts       # 工作台 API
```

### 65.2 桶导出文件

```typescript
// client/src/api/index.ts
export * as customerApi from './customer';
export * as productApi from './product';
export * as inboundApi from './inbound';
export * as outboundApi from './outbound';
export * as inventoryApi from './inventory';
export * as reconciliationApi from './reconciliation';
export * as statisticsApi from './statistics';
export * as organizationApi from './organization';
export * as rbacApi from './rbac';
export * as templateApi from './template';
export * as dashboardApi from './dashboard';
```

### 65.3 客户 API

```typescript
// client/src/api/customer.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerListParams,
  CustomerSearchItem,
  CustomerHistory,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: CustomerListParams): Promise<PaginatedResponse<Customer>> {
  const { data } = await axiosForBackend.get('/api/customers', { params });
  return data;
}

export async function getById(id: string): Promise<Customer> {
  const { data } = await axiosForBackend.get(`/api/customers/${id}`);
  return data;
}

export async function create(req: CreateCustomerRequest): Promise<Customer> {
  const { data } = await axiosForBackend.post('/api/customers', req);
  return data;
}

export async function update(id: string, req: UpdateCustomerRequest): Promise<Customer> {
  const { data } = await axiosForBackend.put(`/api/customers/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/customers/${id}`);
  return data;
}

export async function search(q: string, limit = 20): Promise<{ items: CustomerSearchItem[] }> {
  const { data } = await axiosForBackend.get('/api/customers/search', {
    params: { q, limit },
  });
  return data;
}

export async function getHistory(id: string): Promise<CustomerHistory> {
  const { data } = await axiosForBackend.get(`/api/customers/${id}/history`);
  return data;
}

export async function getAll(): Promise<Customer[]> {
  const { data } = await axiosForBackend.get('/api/customers', {
    params: { pageSize: 1000 },
  });
  return data.items;
}
```

### 65.4 产品 API

```typescript
// client/src/api/product.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Product,
  ProductDetail,
  CreateProductRequest,
  UpdateProductRequest,
  ProductListParams,
  ProductSearchItem,
  ProductRecord,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: ProductListParams): Promise<PaginatedResponse<Product>> {
  const { data } = await axiosForBackend.get('/api/products', { params });
  return data;
}

export async function getById(id: string): Promise<ProductDetail> {
  const { data } = await axiosForBackend.get(`/api/products/${id}`);
  return data;
}

export async function create(req: CreateProductRequest): Promise<Product> {
  const { data } = await axiosForBackend.post('/api/products', req);
  return data;
}

export async function update(id: string, req: UpdateProductRequest): Promise<Product> {
  const { data } = await axiosForBackend.put(`/api/products/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/products/${id}`);
  return data;
}

export async function search(
  q: string,
  options?: { material?: string; process?: string; limit?: number }
): Promise<{ items: ProductSearchItem[] }> {
  const { data } = await axiosForBackend.get('/api/products/search', {
    params: { q, ...options },
  });
  return data;
}

export async function getRecords(id: string): Promise<ProductRecord[]> {
  const { data } = await axiosForBackend.get(`/api/products/${id}/records`);
  return data;
}

export async function getAll(): Promise<Product[]> {
  const { data } = await axiosForBackend.get('/api/products', {
    params: { pageSize: 1000 },
  });
  return data.items;
}
```

### 65.5 入库 API

```typescript
// client/src/api/inbound.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  InboundRecord,
  CreateInboundRequest,
  UpdateInboundRequest,
  InboundListParams,
  InboundImportResult,
  InboundStatus,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: InboundListParams): Promise<PaginatedResponse<InboundRecord>> {
  const { data } = await axiosForBackend.get('/api/inbound', { params });
  return data;
}

export async function getById(id: string): Promise<InboundRecord> {
  const { data } = await axiosForBackend.get(`/api/inbound/${id}`);
  return data;
}

export async function create(req: CreateInboundRequest): Promise<InboundRecord> {
  const { data } = await axiosForBackend.post('/api/inbound', req);
  return data;
}

export async function update(id: string, req: UpdateInboundRequest): Promise<InboundRecord> {
  const { data } = await axiosForBackend.put(`/api/inbound/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/inbound/${id}`);
  return data;
}

export async function importExcel(file: File): Promise<InboundImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axiosForBackend.post('/api/inbound/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function print(id: string): Promise<{ html: string }> {
  const { data } = await axiosForBackend.get(`/api/inbound/${id}/print`);
  return data;
}

export async function updateStatus(id: string, status: InboundStatus): Promise<InboundRecord> {
  const { data } = await axiosForBackend.patch(`/api/inbound/${id}/status`, { status });
  return data;
}
```

### 65.6 出库 API

```typescript
// client/src/api/outbound.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  OutboundRecord,
  CreateOutboundRequest,
  UpdateOutboundRequest,
  OutboundListParams,
  OutboundStatus,
  CloseOutboundRequest,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: OutboundListParams): Promise<PaginatedResponse<OutboundRecord>> {
  const { data } = await axiosForBackend.get('/api/outbound', { params });
  return data;
}

export async function getById(id: string): Promise<OutboundRecord> {
  const { data } = await axiosForBackend.get(`/api/outbound/${id}`);
  return data;
}

export async function create(req: CreateOutboundRequest): Promise<OutboundRecord> {
  const { data } = await axiosForBackend.post('/api/outbound', req);
  return data;
}

export async function update(id: string, req: UpdateOutboundRequest): Promise<OutboundRecord> {
  const { data } = await axiosForBackend.put(`/api/outbound/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/outbound/${id}`);
  return data;
}

export async function print(id: string): Promise<{ html: string }> {
  const { data } = await axiosForBackend.get(`/api/outbound/${id}/print`);
  return data;
}

export async function updateStatus(id: string, status: OutboundStatus): Promise<OutboundRecord> {
  const { data } = await axiosForBackend.patch(`/api/outbound/${id}/status`, { status });
  return data;
}

export async function close(id: string, req?: CloseOutboundRequest): Promise<OutboundRecord> {
  const { data } = await axiosForBackend.post(`/api/outbound/${id}/close`, req);
  return data;
}
```

### 65.7 库存 API

```typescript
// client/src/api/inventory.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  InventoryItem,
  InventoryOverview,
  InventoryListParams,
  AdjustInventoryRequest,
  InventoryHistoryRecord,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: InventoryListParams): Promise<PaginatedResponse<InventoryItem>> {
  const { data } = await axiosForBackend.get('/api/inventory', { params });
  return data;
}

export async function getOverview(): Promise<InventoryOverview> {
  const { data } = await axiosForBackend.get('/api/inventory/overview');
  return data;
}

export async function getByProduct(productId: string): Promise<InventoryItem> {
  const { data } = await axiosForBackend.get(`/api/inventory/product/${productId}`);
  return data;
}

export async function adjust(req: AdjustInventoryRequest): Promise<InventoryItem> {
  const { data } = await axiosForBackend.post('/api/inventory/adjust', req);
  return data;
}

export async function getHistory(
  productId: string,
  params?: { page?: number; pageSize?: number }
): Promise<PaginatedResponse<InventoryHistoryRecord>> {
  const { data } = await axiosForBackend.get(`/api/inventory/${productId}/history`, { params });
  return data;
}

export async function exportExcel(params?: InventoryListParams): Promise<Blob> {
  const { data } = await axiosForBackend.get('/api/inventory/export', {
    params,
    responseType: 'blob',
  });
  return data;
}
```

### 65.8 对账 API

```typescript
// client/src/api/reconciliation.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ReconciliationRecord,
  CreateReconciliationRequest,
  UpdateReconciliationRequest,
  ReconciliationListParams,
  ReconciliationStatus,
  ReconciliationPreview,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: ReconciliationListParams): Promise<PaginatedResponse<ReconciliationRecord>> {
  const { data } = await axiosForBackend.get('/api/reconciliation', { params });
  return data;
}

export async function getById(id: string): Promise<ReconciliationRecord> {
  const { data } = await axiosForBackend.get(`/api/reconciliation/${id}`);
  return data;
}

export async function create(req: CreateReconciliationRequest): Promise<ReconciliationRecord> {
  const { data } = await axiosForBackend.post('/api/reconciliation', req);
  return data;
}

export async function update(id: string, req: UpdateReconciliationRequest): Promise<ReconciliationRecord> {
  const { data } = await axiosForBackend.put(`/api/reconciliation/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/reconciliation/${id}`);
  return data;
}

export async function updateStatus(id: string, status: ReconciliationStatus): Promise<ReconciliationRecord> {
  const { data } = await axiosForBackend.patch(`/api/reconciliation/${id}/status`, { status });
  return data;
}

export async function print(id: string): Promise<{ html: string }> {
  const { data } = await axiosForBackend.get(`/api/reconciliation/${id}/print`);
  return data;
}

export async function preview(req: CreateReconciliationRequest): Promise<ReconciliationPreview> {
  const { data } = await axiosForBackend.get('/api/reconciliation/preview', { params: req });
  return data;
}
```

### 65.9 统计 API

```typescript
// client/src/api/statistics.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  StatisticsOverview,
  InboundStatistics,
  OutboundStatistics,
  InventoryStatistics,
  CustomerStatistics,
  ReconciliationStatistics,
  StatisticsParams,
} from '@shared/api.interface';

export async function getOverview(params?: StatisticsParams): Promise<StatisticsOverview> {
  const { data } = await axiosForBackend.get('/api/statistics/overview', { params });
  return data;
}

export async function getInboundStats(params?: StatisticsParams): Promise<InboundStatistics[]> {
  const { data } = await axiosForBackend.get('/api/statistics/inbound', { params });
  return data;
}

export async function getOutboundStats(params?: StatisticsParams): Promise<OutboundStatistics[]> {
  const { data } = await axiosForBackend.get('/api/statistics/outbound', { params });
  return data;
}

export async function getInventoryStats(): Promise<InventoryStatistics[]> {
  const { data } = await axiosForBackend.get('/api/statistics/inventory');
  return data;
}

export async function getCustomerStats(params?: StatisticsParams): Promise<CustomerStatistics[]> {
  const { data } = await axiosForBackend.get('/api/statistics/customer', { params });
  return data;
}

export async function getReconciliationStats(params?: StatisticsParams): Promise<ReconciliationStatistics[]> {
  const { data } = await axiosForBackend.get('/api/statistics/reconciliation', { params });
  return data;
}
```

### 65.10 组织 API

```typescript
// client/src/api/organization.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Organization,
  OrganizationMember,
  CreateOrganizationRequest,
  CurrentOrganization,
} from '@shared/api.interface';

export async function getMyOrganizations(): Promise<Organization[]> {
  const { data } = await axiosForBackend.get('/api/organizations/my');
  return data;
}

export async function getCurrent(): Promise<CurrentOrganization> {
  const { data } = await axiosForBackend.get('/api/organizations/current');
  return data;
}

export async function select(code: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.post(`/api/organizations/${code}/select`);
  return data;
}

export async function create(req: CreateOrganizationRequest): Promise<Organization> {
  const { data } = await axiosForBackend.post('/api/organizations', req);
  return data;
}

export async function getMembers(orgId: string): Promise<OrganizationMember[]> {
  const { data } = await axiosForBackend.get(`/api/organizations/${orgId}/members`);
  return data;
}

export async function inviteMember(orgId: string, userId: string, role: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.post(`/api/organizations/${orgId}/members/invite`, { userId, role });
  return data;
}

export async function removeMember(orgId: string, userId: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.delete(`/api/organizations/${orgId}/members/${userId}`);
  return data;
}
```

### 65.11 权限 API

```typescript
// client/src/api/rbac.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Role,
  PermissionGroup,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '@shared/api.interface';

export async function getRoles(): Promise<Role[]> {
  const { data } = await axiosForBackend.get('/api/rbac/roles');
  return data;
}

export async function createRole(req: CreateRoleRequest): Promise<Role> {
  const { data } = await axiosForBackend.post('/api/rbac/roles', req);
  return data;
}

export async function updateRole(id: string, req: UpdateRoleRequest): Promise<Role> {
  const { data } = await axiosForBackend.put(`/api/rbac/roles/${id}`, req);
  return data;
}

export async function deleteRole(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/rbac/roles/${id}`);
  return data;
}

export async function getPermissionTree(): Promise<PermissionGroup[]> {
  const { data } = await axiosForBackend.get('/api/rbac/permissions/tree');
  return data;
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
  const { data } = await axiosForBackend.put(`/api/rbac/roles/${roleId}/permissions`, { permissionIds });
  return data;
}

export async function getRoleMembers(roleId: string): Promise<{ userId: string; userName: string; joinedAt: string }[]> {
  const { data } = await axiosForBackend.get(`/api/rbac/roles/${roleId}/members`);
  return data;
}

export async function addMember(roleId: string, userId: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.post(`/api/rbac/roles/${roleId}/members`, { userId });
  return data;
}

export async function removeMember(roleId: string, userId: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.delete(`/api/rbac/roles/${roleId}/members/${userId}`);
  return data;
}

export async function mockRole(bizId: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.post('/api/rbac/mock', { bizId });
  return data;
}
```

### 65.12 打印模板 API

```typescript
// client/src/api/template.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  PrintTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  PrintPreviewResult,
} from '@shared/api.interface';

export async function getAll(): Promise<PrintTemplate[]> {
  const { data } = await axiosForBackend.get('/api/print-templates');
  return data;
}

export async function getById(id: string): Promise<PrintTemplate> {
  const { data } = await axiosForBackend.get(`/api/print-templates/${id}`);
  return data;
}

export async function create(req: CreateTemplateRequest): Promise<PrintTemplate> {
  const { data } = await axiosForBackend.post('/api/print-templates', req);
  return data;
}

export async function update(id: string, req: UpdateTemplateRequest): Promise<PrintTemplate> {
  const { data } = await axiosForBackend.put(`/api/print-templates/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/print-templates/${id}`);
  return data;
}

export async function toggle(id: string): Promise<PrintTemplate> {
  const { data } = await axiosForBackend.patch(`/api/print-templates/${id}/toggle`);
  return data;
}

export async function preview(id: string, recordId: string): Promise<PrintPreviewResult> {
  const { data } = await axiosForBackend.post(`/api/print-templates/${id}/preview`, { recordId });
  return data;
}
```

### 65.13 工作台 API

```typescript
// client/src/api/dashboard.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  DashboardOverview,
  DashboardPendingItem,
  DashboardChartData,
  DashboardRecentAction,
} from '@shared/api.interface';

export async function getOverview(): Promise<DashboardOverview> {
  const { data } = await axiosForBackend.get('/api/dashboard/overview');
  return data;
}

export async function getPending(): Promise<DashboardPendingItem[]> {
  const { data } = await axiosForBackend.get('/api/dashboard/pending');
  return data;
}

export async function getCharts(): Promise<DashboardChartData> {
  const { data } = await axiosForBackend.get('/api/dashboard/charts');
  return data;
}

export async function getRecent(): Promise<DashboardRecentAction[]> {
  const { data } = await axiosForBackend.get('/api/dashboard/recent');
  return data;
}
```

### 65.14 React Query Hooks 封装

```typescript
// client/src/hooks/useInbound.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundApi } from '@/api';
import type { CreateInboundRequest, InboundListParams } from '@shared/api.interface';

export function useInboundList(params: InboundListParams) {
  return useQuery({
    queryKey: ['inbound', 'list', params],
    queryFn: () => inboundApi.getList(params),
  });
}

export function useInboundDetail(id: string) {
  return useQuery({
    queryKey: ['inbound', 'detail', id],
    queryFn: () => inboundApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateInbound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateInboundRequest) => inboundApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateInbound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: Partial<CreateInboundRequest> }) =>
      inboundApi.update(id, req),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inbound', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useDeleteInbound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inboundApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useInboundImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => inboundApi.importExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
```

### 65.15 请求拦截器

```typescript
// 在应用初始化时配置
axiosForBackend.interceptors.request.use((config) => {
  // 自动注入组织编码
  const orgCode = localStorage.getItem('org_code');
  if (orgCode) {
    config.headers['x-org-code'] = orgCode;
  }
  return config;
});

axiosForBackend.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('网络连接失败');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    if (status === 401) {
      toast.error('登录已过期');
    } else if (status === 403) {
      toast.error('无权限');
    } else if (status >= 500) {
      toast.error('服务器错误');
    }
    return Promise.reject(error);
  }
);
```


---

## 第66章 后端 Service 层完整实现参考

### 66.1 入库 Service

```typescript
@Injectable()
export class InboundService {
  private readonly logger = new Logger(InboundService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase,
  ) {}

  async findAll(orgId: string, params: InboundListParams): Promise<PaginatedResponse<InboundRecord>> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [eq(inboundRecords.orgId, orgId)];
    if (params.status) conditions.push(eq(inboundRecords.status, params.status));
    if (params.customerId) conditions.push(eq(inboundRecords.customerId, params.customerId));
    if (params.startDate) conditions.push(gte(inboundRecords.inboundDate, new Date(params.startDate)));
    if (params.endDate) conditions.push(lte(inboundRecords.inboundDate, new Date(params.endDate)));

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      this.db.select().from(inboundRecords)
        .where(where)
        .orderBy(desc(inboundRecords.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(inboundRecords).where(where),
    ]);

    const itemsWithDetails = await this.batchLoadItems(items);

    return {
      items: itemsWithDetails,
      total: Number(count),
      page,
      pageSize,
    };
  }

  async findById(id: string, orgId: string): Promise<InboundRecord> {
    const [record] = await this.db.select().from(inboundRecords)
      .where(and(eq(inboundRecords.id, id), eq(inboundRecords.orgId, orgId)))
      .limit(1);

    if (!record) throw new NotFoundException('入库记录不存在');

    const items = await this.db.select().from(inboundItems)
      .where(eq(inboundItems.inboundId, id));

    return { ...record, items } as InboundRecord;
  }

  async create(dto: CreateInboundRequest, orgId: string, userId: string): Promise<InboundRecord> {
    // 验证客户
    if (dto.customerId) {
      const customer = await this.db.select().from(customers)
        .where(and(eq(customers.id, dto.customerId), eq(customers.orgId, orgId)))
        .limit(1);
      if (!customer[0]) throw new NotFoundException('客户不存在');
    }

    // 验证产品
    for (const item of dto.items) {
      if (item.productId) {
        const product = await this.db.select().from(products)
          .where(and(eq(products.id, item.productId), eq(products.orgId, orgId)))
          .limit(1);
        if (!product[0]) throw new NotFoundException(`产品 ${item.productName} 不存在`);
      }
      if (parseFloat(item.qty) <= 0) {
        throw new BadRequestException(`${item.productName} 数量必须大于0`);
      }
      if (parseFloat(item.weight) <= 0) {
        throw new BadRequestException(`${item.productName} 重量必须大于0`);
      }
    }

    // 计算汇总
    const totalQty = dto.items.reduce((sum, item) => sum + parseFloat(item.qty), 0);
    const totalWeight = dto.items.reduce((sum, item) => sum + parseFloat(item.weight), 0);

    return this.db.transaction(async (tx) => {
      // 创建入库记录
      const [record] = await tx.insert(inboundRecords).values({
        orgId,
        batchNo: dto.batchNo,
        customerId: dto.customerId,
        customerName: dto.customerName,
        inboundDate: new Date(dto.inboundDate),
        status: 'completed',
        totalQty: totalQty.toString(),
        totalWeight: totalWeight.toString(),
        photos: dto.photos?.join(','),
        remark: dto.remark,
        createdBy: userId,
      }).returning();

      // 创建入库明细
      const itemValues = dto.items.map(item => ({
        orgId,
        inboundId: record.id,
        productId: item.productId,
        productName: item.productName,
        material: item.material,
        process: item.process,
        specification: item.specification,
        qty: item.qty,
        weight: item.weight,
        unit: item.unit,
        unitPrice: item.unitPrice,
        location: item.location,
        remark: item.remark,
      }));
      await tx.insert(inboundItems).values(itemValues);

      // 更新库存（原子操作）
      for (const item of dto.items) {
        if (item.productId) {
          const [existing] = await tx.select().from(inventory)
            .where(and(
              eq(inventory.productId, item.productId),
              eq(inventory.orgId, orgId),
            ))
            .limit(1);

          if (existing) {
            await tx.update(inventory)
              .set({
                currentQty: sql`${inventory.currentQty} + ${item.qty}`,
                currentWeight: sql`${inventory.currentWeight} + ${item.weight}`,
                updatedAt: new Date(),
              })
              .where(eq(inventory.id, existing.id));
          } else {
            await tx.insert(inventory).values({
              orgId,
              productId: item.productId,
              productName: item.productName,
              material: item.material,
              specification: item.specification,
              currentQty: item.qty,
              currentWeight: item.weight,
              unit: item.unit,
              location: item.location,
              batchNo: dto.batchNo,
              inboundDate: new Date(dto.inboundDate),
              status: 'normal',
            });
          }

          // 记录库存变动
          await tx.insert(inventoryHistory).values({
            orgId,
            productId: item.productId,
            type: 'inbound',
            qty: item.qty,
            afterQty: item.qty,
            source: 'inbound',
            refId: record.id,
            operator: userId,
          });
        }
      }

      return record;
    });
  }

  async update(id: string, dto: UpdateInboundRequest, orgId: string, userId: string): Promise<InboundRecord> {
    const [existing] = await this.db.select().from(inboundRecords)
      .where(and(eq(inboundRecords.id, id), eq(inboundRecords.orgId, orgId)))
      .limit(1);

    if (!existing) throw new NotFoundException('入库记录不存在');
    if (existing.status !== 'draft') {
      throw new BadRequestException('只能编辑草稿状态的记录');
    }

    const [updated] = await this.db.update(inboundRecords)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(inboundRecords.id, id))
      .returning();

    return updated;
  }

  async remove(id: string, orgId: string): Promise<{ id: string }> {
    const [existing] = await this.db.select().from(inboundRecords)
      .where(and(eq(inboundRecords.id, id), eq(inboundRecords.orgId, orgId)))
      .limit(1);

    if (!existing) throw new NotFoundException('入库记录不存在');
    if (existing.status !== 'draft') {
      throw new BadRequestException('只能删除草稿状态的记录');
    }

    await this.db.transaction(async (tx) => {
      await tx.delete(inboundItems).where(eq(inboundItems.inboundId, id));
      await tx.delete(inboundRecords).where(eq(inboundRecords.id, id));
    });

    return { id };
  }

  async updateStatus(id: string, status: InboundStatus, orgId: string, userId: string): Promise<InboundRecord> {
    const [updated] = await this.db.update(inboundRecords)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(inboundRecords.id, id), eq(inboundRecords.orgId, orgId)))
      .returning();

    if (!updated) throw new NotFoundException('入库记录不存在');
    return updated;
  }

  private async batchLoadItems(records: InboundRecord[]): Promise<InboundRecord[]> {
    if (records.length === 0) return records;

    const ids = records.map(r => r.id);
    const allItems = await this.db.select().from(inboundItems)
      .where(inArray(inboundItems.inboundId, ids));

    const itemsByInbound = new Map<string, InboundItem[]>();
    for (const item of allItems) {
      const list = itemsByInbound.get(item.inboundId) ?? [];
      list.push(item);
      itemsByInbound.set(item.inboundId, list);
    }

    return records.map(record => ({
      ...record,
      items: itemsByInbound.get(record.id) ?? [],
    }));
  }
}
```

### 66.2 出库 Service

```typescript
@Injectable()
export class OutboundService {
  private readonly logger = new Logger(OutboundService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async findAll(orgId: string, params: OutboundListParams): Promise<PaginatedResponse<OutboundRecord>> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [eq(outboundRecords.orgId, orgId)];
    if (params.status) conditions.push(eq(outboundRecords.status, params.status));
    if (params.customerId) conditions.push(eq(outboundRecords.customerId, params.customerId));
    if (params.inboundId) conditions.push(eq(outboundRecords.inboundId, params.inboundId));

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      this.db.select().from(outboundRecords)
        .where(where)
        .orderBy(desc(outboundRecords.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(outboundRecords).where(where),
    ]);

    const itemsWithDetails = await this.batchLoadItems(items);

    return { items: itemsWithDetails, total: Number(count), page, pageSize };
  }

  async findById(id: string, orgId: string): Promise<OutboundRecord> {
    const [record] = await this.db.select().from(outboundRecords)
      .where(and(eq(outboundRecords.id, id), eq(outboundRecords.orgId, orgId)))
      .limit(1);

    if (!record) throw new NotFoundException('出库记录不存在');

    const items = await this.db.select().from(outboundItems)
      .where(eq(outboundItems.outboundId, id));

    return { ...record, items };
  }

  async create(dto: CreateOutboundRequest, orgId: string, userId: string): Promise<OutboundRecord> {
    // 验证入库记录
    if (dto.inboundId) {
      const [inbound] = await this.db.select().from(inboundRecords)
        .where(and(eq(inboundRecords.id, dto.inboundId), eq(inboundRecords.orgId, orgId)))
        .limit(1);
      if (!inbound) throw new NotFoundException('入库记录不存在');
      if (inbound.status !== 'completed') {
        throw new BadRequestException('入库记录未完成，不能发货');
      }
    }

    // 计算汇总
    const totalQty = dto.items.reduce((sum, item) => sum + parseFloat(item.qty), 0);
    const totalWeight = dto.items.reduce((sum, item) => sum + parseFloat(item.weight), 0);
    const totalAmount = dto.items.reduce((sum, item) => {
      const amount = parseFloat(item.qty) * parseFloat(item.unitPrice || '0');
      return sum + amount;
    }, 0);

    return this.db.transaction(async (tx) => {
      // 创建出库记录
      const [record] = await tx.insert(outboundRecords).values({
        orgId,
        inboundId: dto.inboundId,
        customerId: dto.customerId,
        customerName: dto.customerName,
        outboundDate: new Date(dto.outboundDate),
        status: 'completed',
        totalQty: totalQty.toString(),
        totalWeight: totalWeight.toString(),
        totalAmount: totalAmount.toString(),
        deliveredQty: totalQty.toString(),
        remark: dto.remark,
        createdBy: userId,
      }).returning();

      // 创建出库明细
      await tx.insert(outboundItems).values(
        dto.items.map(item => ({
          orgId,
          outboundId: record.id,
          productId: item.productId,
          productName: item.productName,
          qty: item.qty,
          weight: item.weight,
          unit: item.unit,
          unitPrice: item.unitPrice,
          remark: item.remark,
        }))
      );

      // 扣减库存（原子操作，防超卖）
      for (const item of dto.items) {
        if (item.productId) {
          const [updated] = await tx.update(inventory)
            .set({
              currentQty: sql`${inventory.currentQty} - ${item.qty}`,
              currentWeight: sql`${inventory.currentWeight} - ${item.weight}`,
              updatedAt: new Date(),
            })
            .where(and(
              eq(inventory.productId, item.productId),
              eq(inventory.orgId, orgId),
              gte(inventory.currentQty, item.qty),
            ))
            .returning();

          if (!updated) throw new ConflictException(`${item.productName} 库存不足`);

          // 记录库存变动
          await tx.insert(inventoryHistory).values({
            orgId,
            productId: item.productId,
            type: 'outbound',
            qty: `-${item.qty}`,
            afterQty: updated.currentQty,
            source: 'outbound',
            refId: record.id,
            operator: userId,
          });
        }
      }

      return record;
    });
  }

  async close(id: string, orgId: string, userId: string): Promise<OutboundRecord> {
    const [existing] = await this.db.select().from(outboundRecords)
      .where(and(eq(outboundRecords.id, id), eq(outboundRecords.orgId, orgId)))
      .limit(1);

    if (!existing) throw new NotFoundException('出库记录不存在');
    if (existing.status === 'completed') {
      throw new BadRequestException('记录已完成，无需关单');
    }

    const [updated] = await this.db.update(outboundRecords)
      .set({
        status: 'completed',
        deliveredQty: existing.totalQty,
        updatedAt: new Date(),
      })
      .where(eq(outboundRecords.id, id))
      .returning();

    return updated;
  }

  private async batchLoadItems(records: OutboundRecord[]): Promise<OutboundRecord[]> {
    if (records.length === 0) return records;

    const ids = records.map(r => r.id);
    const allItems = await this.db.select().from(outboundItems)
      .where(inArray(outboundItems.outboundId, ids));

    const itemsByOutbound = new Map<string, OutboundItem[]>();
    for (const item of allItems) {
      const list = itemsByOutbound.get(item.outboundId) ?? [];
      list.push(item);
      itemsByOutbound.set(item.outboundId, list);
    }

    return records.map(record => ({
      ...record,
      items: itemsByOutbound.get(record.id) ?? [],
    }));
  }
}
```

### 66.3 库存 Service

```typescript
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async findAll(orgId: string, params: InventoryListParams): Promise<PaginatedResponse<InventoryItem>> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [eq(inventory.orgId, orgId)];
    if (params.material) conditions.push(eq(inventory.material, params.material));
    if (params.batchNo) conditions.push(eq(inventory.batchNo, params.batchNo));
    if (params.status) conditions.push(eq(inventory.status, params.status));

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      this.db.select().from(inventory)
        .where(where)
        .orderBy(desc(inventory.updatedAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(inventory).where(where),
    ]);

    return { items, total: Number(count), page, pageSize };
  }

  async getOverview(orgId: string): Promise<InventoryOverview> {
    const allItems = await this.db.select().from(inventory)
      .where(eq(inventory.orgId, orgId));

    const totalQty = allItems.reduce((sum, item) => sum + parseFloat(item.currentQty), 0);
    const expiredCount = allItems.filter(item => item.status === 'expired').length;
    const lowStockCount = allItems.filter(item => item.status === 'low_stock').length;

    return {
      totalTypes: allItems.length,
      totalQty,
      expiredCount,
      lowStockCount,
    };
  }

  async adjust(dto: AdjustInventoryRequest, orgId: string, userId: string): Promise<InventoryItem> {
    const adjustQty = dto.adjustType === 'out' ? -dto.qty : dto.qty;

    return this.db.transaction(async (tx) => {
      const [updated] = await tx.update(inventory)
        .set({
          currentQty: sql`${inventory.currentQty} + ${adjustQty}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(inventory.productId, dto.productId),
          eq(inventory.orgId, orgId),
          dto.adjustType === 'out'
            ? gte(inventory.currentQty, dto.qty.toString())
            : sql`true`,
        ))
        .returning();

      if (!updated) throw new NotFoundException('库存记录不存在或库存不足');

      await tx.insert(inventoryHistory).values({
        orgId,
        productId: dto.productId,
        type: dto.adjustType === 'in' ? 'adjust_in' : 'adjust_out',
        qty: adjustQty.toString(),
        afterQty: updated.currentQty,
        source: 'manual_adjust',
        operator: userId,
        remark: dto.reason,
      });

      return updated;
    });
  }

  async getHistory(productId: string, orgId: string, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const [items, [{ count }]] = await Promise.all([
      this.db.select().from(inventoryHistory)
        .where(and(
          eq(inventoryHistory.productId, productId),
          eq(inventoryHistory.orgId, orgId),
        ))
        .orderBy(desc(inventoryHistory.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(inventoryHistory)
        .where(and(
          eq(inventoryHistory.productId, productId),
          eq(inventoryHistory.orgId, orgId),
        )),
    ]);

    return { items, total: Number(count), page, pageSize };
  }

  async checkExpiry(orgId: string): Promise<void> {
    const allItems = await this.db.select().from(inventory)
      .where(and(
        eq(inventory.orgId, orgId),
        eq(inventory.status, 'normal'),
      ));

    const expiredIds: string[] = [];
    const lowStockIds: string[] = [];
    const now = new Date();

    for (const item of allItems) {
      if (item.inboundDate) {
        const days = Math.floor((now.getTime() - new Date(item.inboundDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days > 90) {
          expiredIds.push(item.id);
          continue;
        }
      }
      if (parseFloat(item.currentQty) < 10) {
        lowStockIds.push(item.id);
      }
    }

    if (expiredIds.length > 0) {
      await this.db.update(inventory)
        .set({ status: 'expired', updatedAt: now })
        .where(inArray(inventory.id, expiredIds));
    }

    if (lowStockIds.length > 0) {
      await this.db.update(inventory)
        .set({ status: 'low_stock', updatedAt: now })
        .where(inArray(inventory.id, lowStockIds));
    }
  }
}
```

### 66.4 对账 Service

```typescript
@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async create(dto: CreateReconciliationRequest, orgId: string, userId: string): Promise<ReconciliationRecord> {
    // 检查重复
    const [existing] = await this.db.select().from(reconciliationRecords)
      .where(and(
        eq(reconciliationRecords.orgId, orgId),
        eq(reconciliationRecords.customerId, dto.customerId),
        eq(reconciliationRecords.periodYear, dto.periodYear),
        eq(reconciliationRecords.periodMonth, dto.periodMonth),
      ))
      .limit(1);

    if (existing) throw new ConflictException('该客户在此期间已有对账记录');

    // 获取客户信息
    const [customer] = await this.db.select().from(customers)
      .where(and(eq(customers.id, dto.customerId), eq(customers.orgId, orgId)))
      .limit(1);
    if (!customer) throw new NotFoundException('客户不存在');

    // 查询该期间的入库记录
    const startDate = new Date(dto.periodYear, dto.periodMonth - 1, 1);
    const endDate = new Date(dto.periodYear, dto.periodMonth, 0, 23, 59, 59);

    const inboundRecords = await this.db.select().from(inboundRecords)
      .where(and(
        eq(inboundRecords.orgId, orgId),
        eq(inboundRecords.customerId, dto.customerId),
        eq(inboundRecords.status, 'completed'),
        gte(inboundRecords.inboundDate, startDate),
        lte(inboundRecords.inboundDate, endDate),
      ));

    const outboundRecords = await this.db.select().from(outboundRecords)
      .where(and(
        eq(outboundRecords.orgId, orgId),
        eq(outboundRecords.customerId, dto.customerId),
        eq(outboundRecords.status, 'completed'),
        gte(outboundRecords.outboundDate, startDate),
        lte(outboundRecords.outboundDate, endDate),
      ));

    const totalInbound = inboundRecords.reduce((sum, r) => sum + parseFloat(r.totalWeight || '0'), 0);
    const totalOutbound = outboundRecords.reduce((sum, r) => sum + parseFloat(r.totalWeight || '0'), 0);
    const totalAmount = outboundRecords.reduce((sum, r) => sum + parseFloat(r.totalAmount || '0'), 0);

    return this.db.transaction(async (tx) => {
      const [record] = await tx.insert(reconciliationRecords).values({
        orgId,
        reconNo: `RECON-${dto.periodYear}${String(dto.periodMonth).padStart(2, '0')}-${Date.now()}`,
        customerId: dto.customerId,
        customerName: customer.name,
        periodYear: dto.periodYear,
        periodMonth: dto.periodMonth,
        status: 'pending',
        totalInbound: totalInbound.toString(),
        totalOutbound: totalOutbound.toString(),
        totalAmount: totalAmount.toString(),
        paidAmount: '0',
        unpaidAmount: totalAmount.toString(),
        remark: dto.remark,
        createdBy: userId,
      }).returning();

      // 创建对账明细
      const items: Array<NewReconciliationItem> = [
        ...inboundRecords.map(r => ({
          orgId,
          reconciliationId: record.id,
          type: 'inbound' as const,
          refId: r.id,
          refNo: r.batchNo || '',
          date: r.inboundDate,
          productName: '',
          qty: r.totalQty,
          weight: r.totalWeight,
          amount: '0',
        })),
        ...outboundRecords.map(r => ({
          orgId,
          reconciliationId: record.id,
          type: 'outbound' as const,
          refId: r.id,
          refNo: r.outboundNo || '',
          date: r.outboundDate,
          productName: '',
          qty: r.totalQty,
          weight: r.totalWeight,
          amount: r.totalAmount,
        })),
      ];

      if (items.length > 0) {
        await tx.insert(reconciliationItems).values(items);
      }

      return record;
    });
  }

  async updateStatus(id: string, status: ReconciliationStatus, orgId: string, userId: string): Promise<ReconciliationRecord> {
    const [existing] = await this.db.select().from(reconciliationRecords)
      .where(and(eq(reconciliationRecords.id, id), eq(reconciliationRecords.orgId, orgId)))
      .limit(1);

    if (!existing) throw new NotFoundException('对账记录不存在');

    // 状态流转校验
    const validTransitions: Record<string, string[]> = {
      draft: ['pending'],
      pending: ['confirmed', 'rejected'],
      confirmed: ['settled'],
      rejected: [],
      settled: [],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      throw new BadRequestException(`不能从 ${existing.status} 变更为 ${status}`);
    }

    const updateData: Partial<typeof reconciliationRecords.$inferInsert> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
      updateData.confirmedBy = userId;
    }

    const [updated] = await this.db.update(reconciliationRecords)
      .set(updateData)
      .where(eq(reconciliationRecords.id, id))
      .returning();

    return updated;
  }
}
```

### 66.5 统计 Service

```typescript
@Injectable()
export class StatisticsService {
  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async getOverview(orgId: string, params?: StatisticsParams): Promise<StatisticsOverview> {
    const startDate = params?.startDate ? new Date(params.startDate) : new Date(0);
    const endDate = params?.endDate ? new Date(params.endDate) : new Date();

    const [inboundStats] = await this.db.select({
      totalQty: sql<string>`COALESCE(SUM(${inboundRecords.totalQty}), 0)`,
      totalWeight: sql<string>`COALESCE(SUM(${inboundRecords.totalWeight}), 0)`,
      count: count(),
    }).from(inboundRecords)
      .where(and(
        eq(inboundRecords.orgId, orgId),
        eq(inboundRecords.status, 'completed'),
        gte(inboundRecords.inboundDate, startDate),
        lte(inboundRecords.inboundDate, endDate),
      ));

    const [outboundStats] = await this.db.select({
      totalQty: sql<string>`COALESCE(SUM(${outboundRecords.totalQty}), 0)`,
      totalWeight: sql<string>`COALESCE(SUM(${outboundRecords.totalWeight}), 0)`,
      count: count(),
    }).from(outboundRecords)
      .where(and(
        eq(outboundRecords.orgId, orgId),
        eq(outboundRecords.status, 'completed'),
        gte(outboundRecords.outboundDate, startDate),
        lte(outboundRecords.outboundDate, endDate),
      ));

    const [inventoryStats] = await this.db.select({
      totalQty: sql<string>`COALESCE(SUM(${inventory.currentQty}), 0)`,
      totalWeight: sql<string>`COALESCE(SUM(${inventory.currentWeight}), 0)`,
      count: count(),
    }).from(inventory)
      .where(eq(inventory.orgId, orgId));

    const [customerCount] = await this.db.select({ count: count() })
      .from(customers).where(eq(customers.orgId, orgId));

    const [productCount] = await this.db.select({ count: count() })
      .from(products).where(eq(products.orgId, orgId));

    const [pendingRecon] = await this.db.select({ count: count() })
      .from(reconciliationRecords)
      .where(and(
        eq(reconciliationRecords.orgId, orgId),
        inArray(reconciliationRecords.status, ['draft', 'pending']),
      ));

    const [expiredCount] = await this.db.select({ count: count() })
      .from(inventory)
      .where(and(eq(inventory.orgId, orgId), eq(inventory.status, 'expired')));

    const [lowStockCount] = await this.db.select({ count: count() })
      .from(inventory)
      .where(and(eq(inventory.orgId, orgId), eq(inventory.status, 'low_stock')));

    return {
      totalInboundQty: parseFloat(inboundStats.totalQty),
      totalInboundWeight: parseFloat(inboundStats.totalWeight),
      totalOutboundQty: parseFloat(outboundStats.totalQty),
      totalOutboundWeight: parseFloat(outboundStats.totalWeight),
      totalInventoryQty: parseFloat(inventoryStats.totalQty),
      totalInventoryWeight: parseFloat(inventoryStats.totalWeight),
      totalCustomers: Number(customerCount.count),
      totalProducts: Number(productCount.count),
      pendingReconciliation: Number(pendingRecon.count),
      expiredInventory: Number(expiredCount.count),
      lowStockCount: Number(lowStockCount.count),
    };
  }

  async getInboundStats(orgId: string, params?: StatisticsParams): Promise<InboundStatistics[]> {
    const startDate = params?.startDate ? new Date(params.startDate) : dayjs().subtract(30, 'day').toDate();
    const endDate = params?.endDate ? new Date(params.endDate) : new Date();

    const groupBy = params?.groupBy || 'day';
    const dateFormat = groupBy === 'month' ? 'YYYY-MM' : groupBy === 'week' ? 'IYYY-IW' : 'YYYY-MM-DD';

    const results = await this.db.select({
      date: sql<string>`to_char(${inboundRecords.inboundDate}, ${dateFormat})`,
      count: count(),
      totalQty: sql<string>`COALESCE(SUM(${inboundRecords.totalQty}), 0)`,
      totalWeight: sql<string>`COALESCE(SUM(${inboundRecords.totalWeight}), 0)`,
      totalAmount: sql<string>`COALESCE(SUM(${inboundRecords.totalWeight} * COALESCE((SELECT unit_price FROM products WHERE id = ${inboundItems.productId}), 0)), 0)`,
    }).from(inboundRecords)
      .leftJoin(inboundItems, eq(inboundItems.inboundId, inboundRecords.id))
      .where(and(
        eq(inboundRecords.orgId, orgId),
        eq(inboundRecords.status, 'completed'),
        gte(inboundRecords.inboundDate, startDate),
        lte(inboundRecords.inboundDate, endDate),
      ))
      .groupBy(sql`to_char(${inboundRecords.inboundDate}, ${dateFormat})`)
      .orderBy(sql`to_char(${inboundRecords.inboundDate}, ${dateFormat})`);

    return results;
  }

  async getCustomerStats(orgId: string, params?: StatisticsParams): Promise<CustomerStatistics[]> {
    const startDate = params?.startDate ? new Date(params.startDate) : new Date(0);
    const endDate = params?.endDate ? new Date(params.endDate) : new Date();

    const results = await this.db.select({
      customerId: customers.id,
      customerName: customers.name,
      inboundCount: sql<number>`COUNT(DISTINCT CASE WHEN ${inboundRecords.id} IS NOT NULL THEN ${inboundRecords.id} END)`,
      outboundCount: sql<number>`COUNT(DISTINCT CASE WHEN ${outboundRecords.id} IS NOT NULL THEN ${outboundRecords.id} END)`,
      totalAmount: sql<string>`COALESCE(SUM(${outboundRecords.totalAmount}), 0)`,
    }).from(customers)
      .leftJoin(inboundRecords, and(
        eq(inboundRecords.customerId, customers.id),
        eq(inboundRecords.orgId, orgId),
        eq(inboundRecords.status, 'completed'),
        gte(inboundRecords.inboundDate, startDate),
        lte(inboundRecords.inboundDate, endDate),
      ))
      .leftJoin(outboundRecords, and(
        eq(outboundRecords.customerId, customers.id),
        eq(outboundRecords.orgId, orgId),
        eq(outboundRecords.status, 'completed'),
        gte(outboundRecords.outboundDate, startDate),
        lte(outboundRecords.outboundDate, endDate),
      ))
      .where(eq(customers.orgId, orgId))
      .groupBy(customers.id, customers.name)
      .orderBy(desc(sql`COALESCE(SUM(${outboundRecords.totalAmount}), 0)`));

    return results.map(r => ({
      ...r,
      paidAmount: '0',
      unpaidAmount: r.totalAmount,
      paymentRate: 0,
    }));
  }
}
```

### 66.6 Controller 示例

```typescript
@Controller('api/inbound')
export class InboundController {
  constructor(private readonly inboundService: InboundService) {}

  @Get()
  async findAll(@Req() req: Request, @Query() query: InboundListParams) {
    return this.inboundService.findAll(req.userContext.userId, query);
  }

  @Get(':id')
  async findById(@Req() req: Request, @Param('id') id: string) {
    return this.inboundService.findById(id, req.userContext.userId);
  }

  @NeedLogin()
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateInboundRequest) {
    return this.inboundService.create(dto, req.userContext.userId, req.userContext.userId);
  }

  @NeedLogin()
  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateInboundRequest) {
    return this.inboundService.update(id, dto, req.userContext.userId, req.userContext.userId);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    return this.inboundService.remove(id, req.userContext.userId);
  }

  @NeedLogin()
  @Patch(':id/status')
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('status') status: InboundStatus,
  ) {
    return this.inboundService.updateStatus(id, status, req.userContext.userId, req.userContext.userId);
  }
}
```

### 66.7 Module 注册

```typescript
@Module({
  imports: [],
  controllers: [InboundController],
  providers: [InboundService],
  exports: [InboundService],
})
export class InboundModule {}
```

在 `app.module.ts` 中注册（必须在 ViewModule 之前）：

```typescript
@Module({
  imports: [
    // ... 其他模块
    InboundModule,
    OutboundModule,
    InventoryModule,
    ReconciliationModule,
    StatisticsModule,
    CustomerModule,
    ProductModule,
    OrganizationModule,
    RbacModule,
    TemplateModule,
    DashboardModule,
    ViewModule, // 必须在最后
  ],
})
export class AppModule {}
```
# 第67章 前端主题切换组件系统

> 文件位置：`client/src/components/ThemeProvider.tsx`（268行）、`client/src/components/ThemeSwitcher.tsx`（192行）、`client/src/hooks/useTheme.ts`（101行）

## 67.1 概述

系统内置三主题切换能力（浅色/深色/护眼），通过 `ThemeProvider` 组件提供上下文、`useTheme` Hook 管理状态、`ThemeSwitcher` 组件提供 UI 交互。三套主题的 CSS 变量定义在 `client/src/tailwind-theme.css` 中，通过 `data-theme` 属性和 `light`/`dark` class 切换。

AGENTS.md 设计指南建议生产环境仅启用浅色主题，但代码层面完整实现了三主题切换。

### 文件关系

```
hooks/useTheme.ts          ← 核心 Hook（状态管理 + DOM 操作）
                              ↑ 被以下组件导入
components/ThemeProvider.tsx ← Context Provider + ThemeToggle + SimpleThemeToggle
components/ThemeSwitcher.tsx ← 独立主题切换器 UI（更丰富的交互）
```

## 67.2 useTheme Hook（hooks/useTheme.ts，101行）

### 类型定义

```typescript
export type Theme = 'light' | 'dark' | 'eye-care';

interface ThemeConfig {
  label: string;
  description: string;
  icon: string;
}
```

### 主题配置表

```typescript
export const THEME_CONFIGS: Record<Theme, ThemeConfig> = {
  light: {
    label: '浅色模式',
    description: '明亮的界面风格',
    icon: 'Sun',
  },
  dark: {
    label: '深色模式',
    description: '护眼暗色风格',
    icon: 'Moon',
  },
  'eye-care': {
    label: '护眼模式',
    description: '暖色护眼风格',
    icon: 'Eye',
  },
};

export const allThemes = THEME_CONFIGS;
```

### 核心逻辑

| 功能 | 实现方式 |
|------|---------|
| 状态管理 | `useState<Theme>('light')` |
| 持久化 | localStorage key = `'heat-treatment-theme'` |
| DOM 操作 | `document.documentElement` 添加/移除 class 和 `data-theme` 属性 |
| 初始化 | `useEffect` 中读取 localStorage，应用初始主题 |

### DOM 主题应用规则

```typescript
const applyTheme = (newTheme: Theme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.removeAttribute('data-theme');

  if (newTheme === 'eye-care') {
    root.setAttribute('data-theme', 'eye-care');
  } else {
    root.classList.add(newTheme);
    if (newTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    }
  }
};
```

| 主题 | class | data-theme |
|------|-------|------------|
| 浅色 | `light` | 无 |
| 深色 | `dark` | `dark` |
| 护眼 | 无 | `eye-care` |

### 返回值

```typescript
{
  theme: Theme,                    // 当前主题
  setTheme: (theme: Theme) => void, // 设置主题
  toggleTheme: () => void,         // 循环切换：light → dark → eye-care → light
  toggleLightDark: () => void,     // 仅切换浅色/深色
  mounted: boolean,                // 是否已挂载
  config: ThemeConfig,             // 当前主题配置
  allThemes: Record<Theme, ThemeConfig>, // 所有主题配置
  isDark: boolean,                 // 是否深色主题
  isLight: boolean,                // 是否浅色主题
  isEyeCare: boolean,              // 是否护眼主题
}
```

## 67.3 ThemeProvider 组件（ThemeProvider.tsx，268行）

### 定位

独立的主题 Provider 组件，通过 React Context 提供主题状态管理。与 `useTheme` Hook 并行存在（两者功能类似但实现独立），适用于需要 Context 注入的场景。

### Props 接口

```typescript
type Theme = 'light' | 'dark' | 'eye-care' | 'system';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;       // 默认 'light'
  enableSystem?: boolean;      // 默认 true，是否跟随系统
}
```

### ThemeContext 类型

```typescript
interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark' | 'eye-care';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
```

### 核心特性

| 特性 | 说明 |
|------|------|
| system 主题 | 支持 `theme='system'`，自动检测 `prefers-color-scheme` |
| 防闪烁 | `mounted` 状态控制，未挂载时直接渲染 children |
| 系统监听 | `useEffect` 监听 `matchMedia('(prefers-color-scheme: dark)')` 变化 |
| localStorage | key = `'heat-treatment-theme'`，存储用户偏好 |

### 导出组件

| 组件 | 说明 |
|------|------|
| `ThemeProvider` | Context Provider，包裹应用根组件 |
| `useTheme` | Context Hook（从 ThemeProvider 内部导出，与 hooks/useTheme.ts 不同） |
| `ThemeToggle` | 下拉菜单式主题切换按钮，支持三主题选择 |
| `SimpleThemeToggle` | 简洁切换按钮，仅切换浅色/深色 |

### ThemeToggle Props

```typescript
interface ThemeToggleProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}
```

### 主题图标映射

```typescript
const themeIcons = {
  light: Sun,
  dark: Moon,
  'eye-care': Eye,
  system: Sun,
};

const themeLabels = {
  light: '浅色模式',
  dark: '深色模式',
  'eye-care': '护眼模式',
  system: '跟随系统',
};
```

## 67.4 ThemeSwitcher 组件（ThemeSwitcher.tsx，192行）

### 定位

功能更丰富的主题切换器 UI 组件，从 `hooks/useTheme` 获取状态。提供渐变背景效果、主题描述、三种变体。

### Props 接口

```typescript
interface ThemeSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}
```

### 导出组件

| 组件 | 说明 |
|------|------|
| `ThemeSwitcher` | 完整版主题切换器，含渐变图标、主题描述、选中标记 |
| `ThemeSwitcherCompact` | 紧凑版，仅图标按钮（`size="icon"`） |
| `ThemeSwitcherFab` | 浮动操作按钮版，固定在右下角 |

### 主题渐变配色

```typescript
const themeGradients: Record<Theme, string> = {
  light: 'from-amber-400 via-orange-400 to-yellow-400',
  dark: 'from-indigo-500 via-purple-500 to-blue-500',
  'eye-care': 'from-amber-600 via-orange-500 to-yellow-500',
};
```

### 下拉菜单结构

```
DropdownMenu
├── DropdownMenuTrigger（Button + 渐变图标）
└── DropdownMenuContent（w-56）
    ├── DropdownMenuLabel（"主题设置" + Palette 图标）
    ├── DropdownMenuSeparator
    ├── 主题选项 × 3
    │   ├── 渐变图标 + 标签 + 描述
    │   └── 选中标记（Check 图标）
    ├── DropdownMenuSeparator
    └── 快捷键提示
```

### ThemeSwitcherFab 特性

| 属性 | 值 |
|------|-----|
| 位置 | `fixed bottom-6 right-6 z-50` |
| 尺寸 | `h-12 w-12 rounded-full` |
| 样式 | `shadow-lg hover:shadow-xl hover:scale-105` |
| 背景 | `bg-background/80 backdrop-blur-sm border-2` |
| 交互 | 点击调用 `toggleTheme` 循环切换 |

## 67.5 使用场景

### 在 Layout 中使用

```tsx
import { ThemeSwitcherCompact } from '@/components/ThemeSwitcher';

// 在 Layout 的 header/sidebar 区域
<ThemeSwitcherCompact />
```

### 在页面中使用 Provider

```tsx
import { ThemeProvider } from '@/components/ThemeProvider';

// 在 app.tsx 或入口文件
<ThemeProvider defaultTheme="light" enableSystem>
  <App />
</ThemeProvider>
```

### 直接使用 Hook

```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, isDark, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{isDark ? '🌙' : '☀️'}</button>;
}
```

## 67.6 与第37章的关系

第37章定义了三套主题的 CSS 变量（`tailwind-theme.css`），本章定义了主题切换的 React 组件层。两者配合工作：

1. `tailwind-theme.css` 定义 `[data-theme="dark"]` 和 `[data-theme="eye-care"]` 的 CSS 变量
2. `useTheme` / `ThemeProvider` 通过 DOM 操作设置 `data-theme` 属性
3. `ThemeSwitcher` 提供 UI 让用户选择主题

### 注意事项

- `ThemeProvider.tsx` 中的 `useTheme` 与 `hooks/useTheme.ts` 中的 `useTheme` 是**两个不同的实现**
  - `ThemeProvider` 版本基于 React Context，需要 Provider 包裹
  - `hooks/useTheme.ts` 版本基于独立 useState，无需 Provider
- `ThemeSwitcher.tsx` 依赖 `hooks/useTheme.ts` 版本
- 两个实现共用同一个 localStorage key（`'heat-treatment-theme'`）
# 第68章 动画组件库 AnimatedComponents 完整规格

> 文件位置：`client/src/components/AnimatedComponents.tsx`（669行）

## 68.1 概述

基于 `framer-motion` 封装的动画组件库，提供滚动触发动画、交错动画、悬停效果、文字动画、页面过渡等 16 个组件和 10 个动画变体。与第36章（Framer Motion + AutoAnimate 动画系统）互补，本章是组件级封装的完整参考。

### 依赖

```typescript
import { motion, useInView, Variants, Transition } from 'framer-motion';
import { cn } from '@/lib/utils';
```

## 68.2 动画变体配置（Variants）

所有变体共享相同的缓动函数 `[0.25, 0.1, 0.25, 1]`（ease-out 类似）。

| 变体名 | hidden 状态 | visible 状态 | duration |
|--------|------------|--------------|----------|
| `fadeInUp` | opacity:0, y:24 | opacity:1, y:0 | 0.5s |
| `fadeInDown` | opacity:0, y:-24 | opacity:1, y:0 | 0.5s |
| `fadeInLeft` | opacity:0, x:-24 | opacity:1, x:0 | 0.5s |
| `fadeInRight` | opacity:0, x:24 | opacity:1, x:0 | 0.5s |
| `fadeIn` | opacity:0 | opacity:1 | 0.4s |
| `scaleIn` | opacity:0, scale:0.9 | opacity:1, scale:1 | 0.4s |
| `staggerContainer` | opacity:0 | opacity:1 + staggerChildren:0.08, delayChildren:0.1 | - |
| `staggerContainerFast` | opacity:0 | opacity:1 + staggerChildren:0.05, delayChildren:0.05 | - |
| `staggerItem` | opacity:0, y:16 | opacity:1, y:0 | 0.4s |
| `slideInFromBottom` | opacity:0, y:40 | opacity:1, y:0 | 0.6s |

## 68.3 通用 Props

```typescript
interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;      // 延迟时间（秒），默认 0
  duration?: number;   // 持续时间（秒），部分组件使用
  once?: boolean;      // 是否只触发一次，默认 true
  amount?: number;     // 进入视口比例阈值，默认 0.2
}
```

## 68.4 滚动触发动画组件

所有滚动触发组件使用 `useInView` hook 检测元素是否进入视口。

### FadeInUp / FadeInDown / FadeInLeft / FadeInRight

四个方向的淡入滑动组件，结构完全一致，仅方向不同。

| 组件 | 方向 | 位移距离 |
|------|------|---------|
| `FadeInUp` | 从下向上 | y: 24 → 0 |
| `FadeInDown` | 从上向下 | y: -24 → 0 |
| `FadeInLeft` | 从右向左 | x: -24 → 0 |
| `FadeInRight` | 从左向右 | x: 24 → 0 |

### ScaleIn

缩放淡入组件，从 `scale: 0.9` → `scale: 1`，duration 0.4s。

### BlurFadeIn

模糊淡入组件，从 `filter: blur(10px)` → `filter: blur(0px)`，duration 0.6s。视觉效果比 ScaleIn 更柔和。

## 68.5 交错动画组件

### StaggerContainer

```typescript
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;     // 默认 0.08
  delayChildren?: number;     // 默认 0.1
  once?: boolean;             // 默认 true
  amount?: number;            // 默认 0.2
}
```

容器组件，子元素使用 `StaggerItem` 包裹即可实现依次进入动画。

### StaggerItem

```typescript
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}
```

配合 `StaggerContainer` 使用，继承父级的 staggerChildren 配置。

### 使用示例

```tsx
<StaggerContainer staggerDelay={0.1}>
  <StaggerItem>第一项</StaggerItem>
  <StaggerItem>第二项</StaggerItem>
  <StaggerItem>第三项</StaggerItem>
</StaggerContainer>
```

## 68.6 交互动画组件

### HoverCard

```typescript
interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;    // 默认 1.02
  rotate?: number;    // 默认 0
}
```

悬停时缩放 + 旋转的卡片容器。`whileHover` + `whileTap` 组合。

### MagneticButton

```typescript
interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;  // 磁吸强度，默认 0.3
}
```

磁吸效果按钮，鼠标移动时按钮跟随鼠标方向偏移。通过 `onMouseMove` 计算偏移量，`onMouseLeave` 复位。Spring 动画 `stiffness: 350, damping: 15`。

### Pulse

```typescript
interface PulseProps {
  children: ReactNode;
  className?: string;
  pulseColor?: string;  // 默认 'rgba(59, 130, 246, 0.4)'
}
```

脉冲效果，外层无限缩放透明度循环，内层内容悬停时放大。

## 68.7 文字动画组件

### TextReveal

```typescript
interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;       // 整体延迟，默认 0
  charDelay?: number;   // 每字延迟，默认 0.03
}
```

逐字淡入上升动画。每个字符独立 motion.span，依次延迟出现。空格替换为 `\u00A0`（不间断空格）保持间距。

## 68.8 装饰动画组件

### Float

```typescript
interface FloatProps {
  children: ReactNode;
  className?: string;
  y?: number;          // 浮动距离，默认 -10
  duration?: number;    // 默认 3s
}
```

无限上下浮动动画，`y: [0, -10, 0]` 循环。

### ScrollIndicator

无 Props。页面底部滚动指示器，包含"向下滚动"文字和鼠标轮廓动画（内含上下移动的小圆点）。

### SkeletonShimmer

```typescript
interface SkeletonShimmerProps {
  className?: string;
}
```

骨架屏 shimmer 效果。背景层从左到右无限滑动的高光渐变条，duration 1.5s。

## 68.9 页面过渡组件

### PageTransition

```typescript
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}
```

页面过渡动画，进入时 `opacity: 0 → 1, y: 20 → 0`，退出时 `opacity: 0, y: -20`，duration 0.4s。适用于 `<AnimatePresence>` 包裹的路由切换。

### CountUp

```typescript
interface CountUpProps {
  end: number;          // 目标数字
  duration?: number;    // 默认 2s（当前实现未实际使用此参数做计数动画）
  className?: string;
  prefix?: string;       // 前缀
  suffix?: string;       // 后缀
}
```

数字滚动组件。进入视口后显示目标数字（当前实现简化为淡入显示，未做逐帧计数）。建议如需精确计数动画，使用 `react-countup` 库。

## 68.10 组件清单汇总

| 序号 | 组件名 | 类型 | 核心特性 |
|------|--------|------|---------|
| 1 | `FadeInUp` | 滚动触发 | 从下淡入 |
| 2 | `FadeInDown` | 滚动触发 | 从上淡入 |
| 3 | `FadeInLeft` | 滚动触发 | 从右淡入 |
| 4 | `FadeInRight` | 滚动触发 | 从左淡入 |
| 5 | `ScaleIn` | 滚动触发 | 缩放淡入 |
| 6 | `BlurFadeIn` | 滚动触发 | 模糊淡入 |
| 7 | `StaggerContainer` | 交错容器 | 子元素依次进入 |
| 8 | `StaggerItem` | 交错子元素 | 配合容器使用 |
| 9 | `HoverCard` | 交互 | 悬停缩放 |
| 10 | `MagneticButton` | 交互 | 磁吸跟随 |
| 11 | `Pulse` | 装饰 | 脉冲循环 |
| 12 | `TextReveal` | 文字 | 逐字动画 |
| 13 | `Float` | 装饰 | 浮动循环 |
| 14 | `ScrollIndicator` | 装饰 | 滚动提示 |
| 15 | `SkeletonShimmer` | 加载 | 骨架屏 |
| 16 | `PageTransition` | 过渡 | 页面切换 |
| 17 | `CountUp` | 数据 | 数字动画 |
# 第69章 撤销与确认交互组件

> 文件位置：`client/src/components/UndoButton.tsx`（115行）、`client/src/components/UndoConfirmModal.tsx`（176行）、`client/src/components/DeleteConfirmDialog.tsx`（86行）、`client/src/components/ChangeTypeBadge.tsx`（258行）

## 69.1 概述

本章涵盖四个业务交互组件，用于撤销操作、删除确认和库存变动类型展示。这些组件在入库/出库/库存管理页面中广泛使用。

## 69.2 UndoButton 组件（UndoButton.tsx，115行）

### 定位

撤销操作按钮，集成权限检查和状态展示。根据权限检查结果显示三种状态：禁用、强制撤销、正常撤销。

### Props 接口

```typescript
type OrderType = 'inbound' | 'outbound';

interface UndoButtonProps {
  order: OutboundOrder | InboundOrder;
  orderType: OrderType;
  currentUserId: string;
  onUndo: (order: OutboundOrder | InboundOrder, isAdminOverride: boolean) => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}
```

### 权限检查逻辑

通过 `usePermissions` Hook 获取权限检查函数：

| 单据类型 | 权限函数 | 说明 |
|---------|---------|------|
| 出库 | `canUndoOutbound(order, userId)` | 检查是否可撤销出库单 |
| 入库 | `canUndoInbound(order, userId)` | 检查是否可撤销入库单 |

返回值包含 `{ canUndo: boolean, reason: string, isAdminOverride: boolean }`。

### 三种渲染状态

| 状态 | 条件 | 样式 | 图标 | Tooltip |
|------|------|------|------|---------|
| 禁用 | `!canUndo` | `variant="ghost" disabled opacity-50` | RotateCcw | 显示 `reason`（不可撤销原因） |
| 强制撤销 | `isAdminOverride` | `variant="destructive"` | AlertTriangle | "管理员强制撤销他人单据" |
| 正常撤销 | 默认 | `variant` props 传入 | RotateCcw | 无 |

### 使用示例

```tsx
<UndoButton
  order={order}
  orderType="outbound"
  currentUserId={currentUser.id}
  onUndo={(order, isAdmin) => {
    setUndoTarget(order);
    setIsAdminOverride(isAdmin);
    setUndoModalOpen(true);
  }}
  size="sm"
  variant="outline"
/>
```

## 69.3 UndoConfirmModal 组件（UndoConfirmModal.tsx，176行）

### 定位

撤销确认弹窗，展示单据信息并要求输入撤销原因。区分普通撤销和管理员强制撤销两种模式。

### Props 接口

```typescript
interface UndoConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  order: OutboundOrder | InboundOrder | null;
  orderType: OrderType;
  isAdminOverride: boolean;
  isLoading?: boolean;
}
```

### 弹窗结构

```
Dialog
├── DialogHeader
│   ├── DialogTitle（图标 + 标题）
│   └── DialogDescription
├── 单据信息区（bg-muted 圆角卡片）
│   ├── 单号
│   ├── 客户名
│   ├── 金额（仅出库单）
│   └── 创建时间
├── 警告区
│   ├── 管理员模式 → Alert variant="destructive"（审计日志警告）
│   └── 普通出库 → Alert（库存回滚说明）
├── 撤销原因输入
│   ├── label（最少字符数提示）
│   ├── Textarea
│   └── 错误信息
└── DialogFooter
    ├── 取消按钮
    └── 确认按钮（普通：variant="default"，管理员：variant="destructive"）
```

### 撤销原因校验

| 模式 | 最少字符数 | 占位提示 |
|------|----------|---------|
| 管理员强制撤销 | 10 | "数据录入错误，已与客户确认取消" |
| 普通撤销 | 5 | "客户要求取消订单" |

### 状态管理

- `reason`: 撤销原因文本
- `error`: 校验错误信息
- 关闭时清空 reason 和 error

## 69.4 DeleteConfirmDialog 组件（DeleteConfirmDialog.tsx，86行）

### 定位

通用删除确认对话框，支持单条和批量删除。展示删除对象列表和影响说明。

### Props 接口

```typescript
interface DeleteItem {
  id: string;
  name: string;
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;         // 默认 "确认删除？"
  items: DeleteItem[];     // 待删除对象列表
  impact?: string;         // 影响说明（可选）
}
```

### 弹窗结构

```
Dialog (max-w-md)
├── DialogHeader
│   └── DialogTitle（AlertTriangle 图标 + 标题）
├── 内容区
│   ├── 删除对象列表（max-h-32 滚动，最多展示5项）
│   │   └── 超过5项显示 "...还有 N 项"
│   ├── 影响说明（amber-600 警告色，可选）
│   └── 后果警示（"此操作不可撤销，删除后数据将无法恢复"）
└── DialogFooter
    ├── 取消按钮 (variant="outline")
    └── 确认删除按钮 (variant="destructive")
```

### 批量删除标题

```typescript
const isBulk = items.length > 1;
// 标题：`确认删除 ${items.length} 项？` 或自定义 title
```

## 69.5 ChangeTypeBadge 组件（ChangeTypeBadge.tsx，258行）

### 定位

库存变动类型标签组件，展示变动类型的图标、标签、方向和数值。从 `@shared/inventory-change-types` 导入类型配置。

### Props 接口

```typescript
interface ChangeTypeBadgeProps {
  type: InventoryChangeType;
  quantity?: number;        // 变动数量
  weight?: number;          // 变动重量
  showDirection?: boolean;  // 显示方向图标，默认 false
  showAmount?: boolean;     // 显示数值，默认 false
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

### 依赖模块

```typescript
import {
  getChangeTypeConfig,    // 获取类型配置（label, icon, direction, isRollback）
  getChangeTypeTheme,     // 获取主题色（bg, text, border, icon, directionIcon）
  getChangeTypeLabel,     // 获取标签文字
  isRollbackType,         // 是否回滚类型
  directionLabels,        // 方向标签映射
  type ChangeTypeTheme,
} from '@shared/inventory-change-types';
```

### 图标映射表

```typescript
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, Truck, Undo2, RotateCcw, TrendingUp, TrendingDown,
  AlertTriangle, XCircle, Trash2, Settings, PlusCircle, MinusCircle,
  FileCheck, Hammer,
};

const directionIconMap = {
  up: ArrowUp,
  down: ArrowDown,
  neutral: Minus,
};
```

### 尺寸配置

| 尺寸 | badge | icon | directionIcon | amount |
|------|-------|------|--------------|--------|
| sm | text-xs px-2 py-0.5 h-5 | w-3 h-3 | w-3 h-3 | text-xs |
| md | text-sm px-2.5 py-1 h-7 | w-4 h-4 | w-3.5 h-3.5 | text-sm |
| lg | text-base px-3 py-1.5 h-9 | w-5 h-5 | w-4 h-4 | text-base |

### 数值格式化

```typescript
// 方向 up: "+100 件"  方向 down: "-50 件"  方向 neutral: "100 件"
// 重量: "12.50 kg"
// 组合: "+100 件 / 12.50 kg"
```

### 回滚类型特殊样式

当 `config.isRollback` 为 true 时，badge 边框使用 `border-dashed`（虚线），视觉上区分回滚操作。

### 导出的变体组件

| 组件 | Props | 说明 |
|------|-------|------|
| `ChangeTypeBadge` | 完整 Props | 主组件，可配置所有选项 |
| `ChangeTypeLabel` | type, className | 简化版，仅 sm 尺寸标签 |
| `ChangeTypeWithAmount` | type, quantity, weight, unit, size | 带数值版，用于表格行 |
| `ChangeDirectionIndicator` | type, className | 仅方向指示器（箭头 + 文字） |

### 使用示例

```tsx
// 表格中的变动类型列
<ChangeTypeWithAmount type="inbound" quantity={100} weight={25.5} />

// 简洁标签
<ChangeTypeLabel type="outbound_rollback" />

// 完整配置
<ChangeTypeBadge
  type="manual_increase"
  quantity={50}
  showDirection
  showAmount
  size="md"
/>
```

## 69.6 组件间协作

```
UndoButton（列表页/详情页）
  ↓ onUndo 回调
UndoConfirmModal（弹窗确认）
  ↓ onConfirm 回调
API 调用 → 后端 undo 模块
  ↓ 返回结果
ChangeTypeBadge（库存变动记录展示）
  ↓ 变动记录列表
显示 "入库回滚" / "出库回滚" 标签

DeleteConfirmDialog（通用删除场景）
  ↓ onConfirm 回调
API 调用 → 对应模块 DELETE 接口
```
# 第70章 演示与测试页面规格

> 本章覆盖 5 个演示页面和 2 个配套视觉组件，这些页面为开发参考和组件展示用途，不属于核心业务功能。

## 70.1 ExamplePage（示例页面）

> 文件：`client/src/pages/ExamplePage/ExamplePage.tsx`（37行）

### 概述

模板自带的示例页面，当前代码**全部被注释**，无有效导出。作为开发参考模板存在，展示了使用 `useRecordData` Hook 加载数据的基本页面结构。

### 模板结构（注释中）

```tsx
export default function ExamplePage() {
  const { record, loading, error, refetch } = useRecordData();
  const [dimension, setDimension] = useState<'month' | 'quarter' | 'year'>('month');

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误 + 重试按钮</div>;

  return <div className="space-y-6">{/* 页面内容 */}</div>;
}
```

### 依赖

- `useRecordData` from `@/hooks/use-example`（同样为全注释代码）
- `Card`, `Button` 等基础组件

## 70.2 DashboardDemoPage（Dashboard 演示页面）

> 文件：`client/src/pages/DashboardDemoPage/DashboardDemoPage.tsx`（937行）

### 概述

功能丰富的完整 Dashboard 演示页面，包含图表、表格、聊天、支付表单等交互模块。作为 DashboardPage 业务页面的设计参考。

### 使用的库

| 库 | 用途 |
|----|------|
| `echarts` | 柱状图、折线图渲染 |
| `lucide-react` | 图标 |
| `@/components/ui/*` | Badge, Button, Card, Input, Table |

### 内部子组件

| 子组件 | 说明 | 图表类型 |
|--------|------|---------|
| `SubscriptionsChart` | 订阅数据展示 | ECharts 柱状图 |
| `RevenueChart` | 收入趋势展示 | ECharts 折线图 |
| `ExerciseChart` | 运动分钟数 | ECharts 双线图 |
| `StatusBadge` | 状态徽章 | Success/Processing/Failed 三种样式 |
| `PaypalIcon` | PayPal SVG 图标 | 内联 SVG |
| `Checkbox` | 自定义复选框 | 纯 CSS 实现 |
| `RoleDropdown` | 角色选择下拉 | 点击外部关闭逻辑 |

### 主组件状态

| 状态 | 类型 | 用途 |
|------|------|------|
| `teamMembers` | 数组 | 团队成员列表 |
| `messages` | 数组 | 聊天消息列表 |
| `messageInput` | string | 聊天输入框 |
| `paymentMethod` | string | 支付方式选择 |
| `cardName`, `cardNumber` | string | 信用卡信息 |
| `expMonth`, `expYear`, `cvc` | string | 信用卡有效期 |
| `filterText` | string | 支付记录筛选 |
| `selectedRows` | Set | 表格选中行 |
| `monthOpen`, `yearOpen` | boolean | 月份/年份下拉开关 |

### 布局结构

```
DashboardDemo
├── 第一行（3列）
│   ├── Team Members 卡片（成员列表 + 角色选择）
│   ├── Subscriptions 卡片（指标数字 + 柱状图）
│   └── Total Revenue 卡片（指标数字 + 折线图）
├── 第二行（2列）
│   ├── 聊天卡片（消息列表 + 输入框 + 发送）
│   └── Exercise Minutes 卡片（双线图）
└── 第三行（5列，3:2）
    ├── Latest Payments 表格（筛选 + 全选 + 分页）
    └── Payment Method 表单（PayPal/Card/Bank 切换 + 卡号输入）
```

## 70.3 MynaHeroPage（AI 主题 Hero 页面）

> 文件：`client/src/pages/MynaHeroPage/MynaHeroPage.tsx`（266行）

### 概述

AI 主题的营销落地页演示，使用 framer-motion 动画和响应式导航。主色调为 `#FF6B2C`（橙色），字体使用 `font-mono`。

### 使用的库

| 库 | 用途 |
|----|------|
| `framer-motion` | motion, useAnimation, useInView |
| `lucide-react` | Activity, ArrowRight, BarChart, Bird, Menu, Plug, Sparkles, Zap |
| `@/components/ui/*` | Button, Sheet |
| `@lark-apaas/client-toolkit` | UniversalLink |

### 页面结构

```
MynaHero
├── Header（导航栏）
│   ├── Logo（Bird 图标 + "MYNA" 文字）
│   ├── 桌面导航（SOLUTIONS / INDUSTRIES / RESOURCES / ABOUT US）
│   ├── GET STARTED 按钮
│   └── 移动端 Sheet 菜单
├── Hero 标题区
│   ├── 逐字动画大标题（AI-Powered Analytics）
│   ├── 副标题
│   ├── 标签（Predictive Analytics / Machine Learning / NLP）
│   └── CTA 按钮（Get Started + Explore Features）
└── Features 特性区（3列卡片）
    ├── Advanced Analytics（BarChart 图标）
    ├── Intelligent Automation（Sparkles 图标）
    └── Real-time Insights（Activity 图标）
```

### 动画特性

- 使用 `useAnimation` + `useInView` 实现滚动触发
- 标题逐字动画（stagger）
- 特性卡片依次进入（staggerChildren: 0.15, delayChildren: 0.2）

## 70.4 HeroSectionPage（Hero Section 演示页面）

> 文件：`client/src/pages/HeroSectionPage/HeroSectionPage.tsx`（35行）

### 概述

极简包装页面，仅渲染 `HeroSection` 组件（来自 `@/components/hero-section-2-bg`）。展示一个左文右图的双栏 Hero 区域。

### Props 传入

| prop | 值 |
|------|-----|
| logo | 内联 SVG data URL + "Mountain Co." |
| slogan | "ELEVATE YOUR PERSPECTIVE" |
| title | "Each Peak Teaches Something"（含 text-primary 高亮） |
| subtitle | 描述文字 |
| callToAction | "JOIN US TO EXPLORE" |
| backgroundImage | Unsplash 山脉图片 URL |
| contactInfo | website / phone / address |

## 70.5 ShaderBackgroundPage（Shader 背景演示页面）

> 文件：`client/src/pages/ShaderBackgroundPage/ShaderBackgroundPage.tsx`（20行）

### 概述

极简演示页面，在 600px 高的圆角容器内展示 `ShaderBackground` WebGL 组件。

### 页面结构

```tsx
<div className="relative h-[600px] overflow-hidden rounded-xl">
  <ShaderBackground />
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
    <h1>Shader Background</h1>
    <p>WebGL shader / plasma grid / wave patterns</p>
  </div>
</div>
```

## 70.6 hero-section-2-bg.tsx 组件

> 文件：`client/src/components/hero-section-2-bg.tsx`（191行）

### 概述

基于 `motion/react` 的 Hero Section 组件，左文右图布局。使用 clipPath 动画实现图片从右向左揭示效果。

### Props 接口

```typescript
interface HeroSectionProps {
  className?: string;
  logo?: { url: string; alt: string; text?: string };
  slogan?: string;
  title: React.ReactNode;
  subtitle: string;
  callToAction: { text: string; href: string };
  backgroundImage: string;
  contactInfo: { website: string; phone: string; address: string };
}
```

### 导出

```typescript
export { HeroSection };
export type { HeroSectionProps };
```

### 动画配置

| 元素 | 动画 | 参数 |
|------|------|------|
| 容器 | staggerChildren | 0.15, delayChildren: 0.2 |
| 各子元素 | y: 20 → 0, opacity: 0 → 1 | duration: 0.5, ease: 'easeOut' |
| 背景图片 | clipPath 揭示 | `polygon(100%...)` → `polygon(25% 0, 100% 0, 100% 100%, 0% 100%)`, duration: 1.2, ease: 'circOut' |

### 内部子组件

- `InfoIcon` — 三种信息图标（website / phone / address），使用内联 SVG

### 布局结构

```
motion.section（flex row）
├── 左栏（md:w-1/2 lg:w-3/5）
│   ├── Header（logo + slogan）
│   ├── Main（title + 分隔线 + subtitle + CTA 链接）
│   └── Footer（3列联系信息：website / phone / address）
└── 右栏（md:w-1/2 lg:w-2/5）
    └── 背景图片（clipPath 动画揭示）
```

## 70.7 shader-background-component.tsx 组件

> 文件：`client/src/components/shader-background-component.tsx`（259行）

### 概述

基于 WebGL 的 Shader 背景组件，渲染等离子网格波纹动画。使用原始 GLSL 着色器代码，无第三方 3D 库依赖。

### Props 接口

```typescript
interface ShaderBackgroundProps {
  className?: string;
}
```

### 导出

```typescript
export { ShaderBackground };
export type { ShaderBackgroundProps };
```

### 技术实现

| 层面 | 实现 |
|------|------|
| WebGL 版本 | WebGL 1.0 |
| 顶点着色器 | 固定全屏四边形（2个三角形） |
| 片段着色器 | 自定义 GLSL（等离子网格 + 波纹 + 光点） |
| 动画循环 | `requestAnimationFrame` |
| 尺寸响应 | `ResizeObserver` 监听容器变化 |
| 日志 | `logger` from `@lark-apaas/client-toolkit/logger` |

### 着色器参数

| 常量 | 值 | 说明 |
|------|-----|------|
| `overallSpeed` | 0.2 | 总体动画速度 |
| `scale` | 5.0 | 网格缩放 |
| `lineColor` | vec4(0.4, 0.2, 0.8, 1.0) | 线条颜色（紫色） |
| `bgColor1` | vec4(0.1, 0.1, 0.3, 1.0) | 背景色1（深蓝） |
| `bgColor2` | vec4(0.3, 0.1, 0.5, 1.0) | 背景色2（紫） |
| `linesPerGroup` | 16 | 每组线条数 |
| `warpAmplitude` | 1.0 | 扭曲幅度 |

### 资源清理

`useEffect` 返回清理函数，取消 `requestAnimationFrame` 和断开 `ResizeObserver`，防止内存泄漏。

### DOM 结构

```tsx
<div ref={containerRef} className="absolute inset-0 h-full w-full">
  <canvas ref={canvasRef} className="block h-full w-full" />
</div>
```
# 第71章 Hello 模块与遗留代码参考

> 本章覆盖 NestJS 演示模块（hello）、移动端检测 Hook（use-mobile）、示例 Hook（use-example）。

## 71.1 Hello 模块（server/modules/hello/）

### 概述

NestJS 模板自带的演示模块，展示了 Controller-Service 模式的基本用法。当前代码**全部被注释**，不参与实际运行。作为 NestJS + Drizzle ORM 的参考模板存在。

> **注意**：`hello.module.ts` 未在 `app.module.ts` 中注册（因为全部被注释），不参与应用启动。

### 文件清单

| 文件 | 行数 | 状态 |
|------|------|------|
| `hello.controller.ts` | 16 | 全部注释 |
| `hello.module.ts` | 10 | 全部注释 |
| `hello.service.ts` | 28 | 全部注释 |

### hello.controller.ts（模板代码）

注释中的控制器结构：

```typescript
@Controller('api/hello')
export class HelloController {
  constructor(private readonly helloService: HelloService) {}

  @Get('test')
  test(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.helloService.test(userId);
  }
}
```

### hello.service.ts（模板代码）

注释中的服务结构：

```typescript
@Injectable()
export class HelloService {
  private readonly logger = new Logger(HelloService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async test(userId: string, limit: number = 10) {
    // 查询 record 表，按 userProfile 过滤
    // 按 speakDate 倒序，限制条数
    return this.db.select().from(record)
      .where(eq(record.userProfile, userId))
      .orderBy(desc(record.speakDate))
      .limit(limit);
  }
}
```

### hello.module.ts（模板代码）

注释中的模块结构：

```typescript
@Module({
  controllers: [HelloController],
  providers: [HelloService],
})
export class HelloModule {}
```

### 模板参考价值

1. **Drizzle ORM 注入**：展示了 `@Inject(DRIZZLE_DATABASE)` 的正确用法
2. **userProfile 类型**：展示了 `userProfile` 列的查询方式
3. **req.userContext**：展示了从请求中获取 `userId` 的标准方式
4. **Logger 使用**：展示了 NestJS Logger 的正确实例化方式

## 71.2 use-mobile.ts（移动端检测 Hook）

> 文件：`client/src/hooks/use-mobile.ts`（19行）

### 概述

基于 `window.matchMedia` 的移动端检测 Hook，断点 768px。与 Tailwind 的 `md` 断点一致。

### 完整代码

```typescript
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

### 导出

| 函数 | 返回值 | 说明 |
|------|--------|------|
| `useIsMobile()` | `boolean` | 窗口宽度 < 768px 时返回 true |

### 使用场景

```tsx
import { useIsMobile } from '@/hooks/use-mobile';

function MyComponent() {
  const isMobile = useIsMobile();
  return (
    <div className={isMobile ? 'flex-col' : 'flex-row'}>
      {/* 响应式布局 */}
    </div>
  );
}
```

### 技术细节

| 特性 | 说明 |
|------|------|
| 断点 | 768px（与 Tailwind `md` 一致） |
| 检测方式 | `window.matchMedia('(max-width: 767px)')` |
| 事件监听 | `addEventListener("change", ...)` 监听视口变化 |
| 清理 | `useEffect` 返回清理函数移除监听器 |
| 初始值 | `undefined`（首次渲染后立即更新为实际值） |
| 返回值 | `!!isMobile`（强制转为 boolean） |

## 71.3 use-example.ts（示例 Hook，遗留代码）

> 文件：`client/src/hooks/use-example.ts`（52行）

### 概述

模板自带的示例 Hook，**全部代码被注释**，无有效导出。展示了使用 `axiosForBackend` 加载数据的基本模式。

### 模板结构（注释中）

```typescript
export function useRecordData() {
  const [data, setData] = useState<RecordData>({
    record: {},
    loading: true,
    error: null,
  });

  // 使用 axiosForBackend 获取数据
  // 返回 { record, loading, error, refetch }
}
```

### 参考价值

1. **axiosForBackend 用法**：展示了前端 API 请求的标准方式
2. **数据加载模式**：展示了 loading/error 状态管理的标准模式
3. **RecordData 接口**：展示了数据类型定义的标准格式

### 状态

此文件为遗留代码，建议在后续重构中清理。与 `ExamplePage.tsx` 配套使用（两者均为全注释状态）。

## 71.4 遗留代码汇总

| 文件 | 行数 | 状态 | 建议处理 |
|------|------|------|---------|
| `server/modules/hello/*` | 54 | 全部注释 | 保留作为模板参考，或清理 |
| `client/src/hooks/use-example.ts` | 52 | 全部注释 | 保留作为模板参考，或清理 |
| `client/src/pages/ExamplePage/ExamplePage.tsx` | 37 | 全部注释 | 保留作为模板参考，或清理 |
| `client/src/pages/DashboardDemoPage/` | 937 | 有效代码 | 保留作为设计参考 |
| `client/src/pages/MynaHeroPage/` | 266 | 有效代码 | 保留作为动画参考 |
| `client/src/pages/HeroSectionPage/` | 35 | 有效代码 | 保留作为组件展示 |
| `client/src/pages/ShaderBackgroundPage/` | 20 | 有效代码 | 保留作为组件展示 |
