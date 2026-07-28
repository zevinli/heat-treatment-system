# 热处理收发货管理系统 - 代码导出指南

## 导出方式

### 方式一：妙搭平台下载（推荐）

在代码编辑器界面：
1. 查看**右上角工具栏**
2. 点击 **「下载」** 或 **「↓」** 图标
3. 自动下载 zip 压缩包

如果找不到按钮，尝试：
- 「文件」菜单 → 「下载源码」
- 「设置」→ 「导出应用」

---

### 方式二：手动复制文件

#### 1. 配置文件（根目录）
必须复制的文件：
```
package.json
package-lock.json
tsconfig.json
tsconfig.app.json
tsconfig.node.json
rspack.config.js
nest-cli.json
tailwind.config.ts
postcss.config.js
components.json
.env
.gitignore
.eslint.config.js
.prettierrc
.stylelintrc.js
README.md
AGENTS.md
```

#### 2. 前端代码（client/）
```
client/index.html
client/public/favicon.svg
client/src/app.tsx
client/src/index.tsx
client/src/index.css
client/src/tailwind-theme.css
client/src/typography.css

# API
client/src/api/index.ts

# 组件
client/src/components/Layout.tsx
client/src/components/PermissionGuard.tsx
client/src/components/ErrorBoundary.tsx
client/src/components/ui/*.tsx
client/src/components/business-ui/**/*.tsx

# 页面
client/src/pages/DashboardPage/DashboardPage.tsx
client/src/pages/InboundPage/InboundPage.tsx
client/src/pages/OutboundPage/OutboundPage.tsx
client/src/pages/InventoryPage/InventoryPage.tsx
client/src/pages/ReconciliationPage/ReconciliationPage.tsx
client/src/pages/StatisticsPage/StatisticsPage.tsx
client/src/pages/CustomerListPage/CustomerListPage.tsx
client/src/pages/CustomerDetailPage/CustomerDetailPage.tsx
client/src/pages/ProductListPage/ProductListPage.tsx
client/src/pages/ProductDetailPage/ProductDetailPage.tsx
client/src/pages/TemplateConfigPage/TemplateConfigPage.tsx
client/src/pages/DisplaySettingsPage/DisplaySettingsPage.tsx
client/src/pages/PermissionPage/PermissionPage.tsx
client/src/pages/UserManualPage/UserManualPage.tsx
client/src/pages/LoginPage/LoginPage.tsx
client/src/pages/NotFound/NotFound.tsx
client/src/pages/ExamplePage/ExamplePage.tsx

# 数据
client/src/data/DataContext.tsx
client/src/data/mockData.ts

# Hooks
client/src/hooks/useDisplaySettings.ts
client/src/hooks/useInventorySync.ts
client/src/hooks/use-mobile.ts
client/src/hooks/use-example.ts

# 工具
client/src/lib/utils.ts
client/src/lib/shiki.ts
client/src/lib/excel-export.ts
client/src/utils/excelExport.ts

# 类型
client/src/types/common.ts
client/src/types/global.d.ts
```

#### 3. 后端代码（server/）
```
server/main.ts
server/app.module.ts

# 数据库
server/database/schema.ts

# 模块
server/modules/view/view.controller.ts
server/modules/view/view.module.ts
server/modules/customer/customer.service.ts
server/modules/customer/customer.controller.ts
server/modules/customer/customer.module.ts
server/modules/product/product.service.ts
server/modules/product/product.controller.ts
server/modules/product/product.module.ts
server/modules/inventory/inventory.service.ts
server/modules/inventory/inventory.controller.ts
server/modules/inventory/inventory.module.ts
server/modules/outbound/outbound.service.ts
server/modules/outbound/outbound.controller.ts
server/modules/outbound/outbound.module.ts
server/modules/reconciliation/reconciliation.service.ts
server/modules/reconciliation/reconciliation.controller.ts
server/modules/reconciliation/reconciliation.module.ts
server/modules/hello/hello.service.ts
server/modules/hello/hello.controller.ts
server/modules/hello/hello.module.ts

# 公共
server/common/filters/exception.filter.ts
server/common/interfaces/api_response.interface.ts
server/common/interfaces/exception.interface.ts
server/common/constants/api_response_code.ts

# 插件能力
server/capabilities/intelligent_writing_quick_quality_1.json
server/capabilities/image_info_extract_structured_1.json
```

#### 4. 共享代码（shared/）
```
shared/api.interface.ts
```

---

## 本地部署步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 数据库配置
根据 `server/database/schema.ts` 创建 PostgreSQL 数据库表结构。

### 3. 启动开发服务器
```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:server  # 后端
npm run dev:client  # 前端
```

### 4. 生产构建
```bash
npm run build:prod
```

---

## 关键依赖说明

| 类别 | 技术栈 | 版本 |
|-----|-------|-----|
| 前端框架 | React | 19.x |
| 后端框架 | NestJS | 10.x |
| ORM | Drizzle ORM | 0.44.6 |
| 数据库 | PostgreSQL | - |
| UI组件 | shadcn/ui + Radix UI | - |
| 样式 | Tailwind CSS | 4.x |
| 构建工具 | Rspack | 1.6.8 |

---

## 注意事项

1. **环境要求**：Node.js >= 22.0.0
2. **数据库**：必须使用 PostgreSQL，按 schema.ts 创建表结构
3. **环境变量**：复制 .env 文件并配置数据库连接
4. **用户认证**：依赖妙搭平台的用户服务，独立部署需自行实现认证逻辑

---

## 文件数量统计

- 配置文件：15个
- 前端文件：约 120个（含组件、页面、工具等）
- 后端文件：约 25个
- 总计：约 160个文件

---

导出日期：2026-02-05
