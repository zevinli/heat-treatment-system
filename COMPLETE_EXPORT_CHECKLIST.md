# 热处理收发货管理系统 - 完整代码导出清单

## 警告：必须包含所有文件才能确保导入后完全一致

如果缺少任何以下文件，导入后的系统将不完整或无法运行。

---

## 一、根目录配置文件（必须全部复制）

```
package.json                    - 项目依赖配置（最关键）
package-lock.json              - 依赖版本锁定（必须复制以确保版本一致）
tsconfig.json                  - TypeScript主配置
tsconfig.app.json             - 前端TypeScript配置
tsconfig.node.json            - 后端TypeScript配置
rspack.config.js              - 前端构建配置（关键）
nest-cli.json                 - NestJS配置
tailwind.config.ts            - Tailwind CSS配置
postcss.config.js             - PostCSS配置
components.json               - shadcn组件配置
.env                          - 环境变量
.gitignore                    - Git忽略规则
.npmrc                        - npm配置
.prettierrc                   - 代码格式化配置
.stylelintrc.js               - 样式规范配置
eslint.config.js              - ESLint配置
README.md                     - 项目说明
AGENTS.md                     - 需求文档
CODE_EXPORT_GUIDE.md          - 代码导出指南
DATABASE_EXPORT.md            - 数据库导出指南
COMPLETE_EXPORT_CHECKLIST.md  - 本文件
```

---

## 二、前端配置文件

```
client/index.html             - HTML入口模板
client/public/favicon.svg     - 网站图标
```

---

## 三、前端核心文件（client/src/）

### 3.1 入口和路由（最关键）
```
client/src/index.tsx          - 应用入口
client/src/app.tsx            - 路由配置（最关键，决定页面结构）
client/src/index.css          - 全局样式
client/src/tailwind-theme.css - Tailwind主题变量
client/src/typography.css     - 排版样式
```

### 3.2 API接口
```
client/src/api/index.ts
```

### 3.3 工具函数
```
client/src/lib/utils.ts
client/src/lib/shiki.ts
client/src/lib/excel-export.ts
client/src/utils/excelExport.ts
```

### 3.4 类型定义
```
client/src/types/common.ts
client/src/types/global.d.ts
```

### 3.5 数据层
```
client/src/data/DataContext.tsx
client/src/data/mockData.ts
```

### 3.6 Hooks
```
client/src/hooks/useDisplaySettings.ts
client/src/hooks/useInventorySync.ts
client/src/hooks/use-mobile.ts
client/src/hooks/use-example.ts
```

### 3.7 布局组件
```
client/src/components/Layout.tsx           - 侧边栏布局（关键）
client/src/components/PermissionGuard.tsx  - 权限守卫
client/src/components/ErrorBoundary.tsx    - 错误边界
```

### 3.8 UI组件（shadcn/ui - 必须全部复制）
```
client/src/components/ui/accordion.tsx
client/src/components/ui/alert-dialog.tsx
client/src/components/ui/alert.tsx
client/src/components/ui/aspect-ratio.tsx
client/src/components/ui/avatar.tsx
client/src/components/ui/badge.tsx
client/src/components/ui/breadcrumb.tsx
client/src/components/ui/button-group.tsx
client/src/components/ui/button.tsx
client/src/components/ui/calendar.tsx
client/src/components/ui/card.tsx
client/src/components/ui/carousel.tsx
client/src/components/ui/chart.tsx
client/src/components/ui/checkbox.tsx
client/src/components/ui/collapsible.tsx
client/src/components/ui/command.tsx
client/src/components/ui/context-menu.tsx
client/src/components/ui/dialog.tsx
client/src/components/ui/drawer.tsx
client/src/components/ui/dropdown-menu.tsx
client/src/components/ui/empty.tsx
client/src/components/ui/field.tsx
client/src/components/ui/form.tsx
client/src/components/ui/hover-card.tsx
client/src/components/ui/image.tsx
client/src/components/ui/input-group.tsx
client/src/components/ui/input-otp.tsx
client/src/components/ui/input.tsx
client/src/components/ui/item.tsx
client/src/components/ui/kbd.tsx
client/src/components/ui/label.tsx
client/src/components/ui/menubar.tsx
client/src/components/ui/navigation-menu.tsx
client/src/components/ui/native-select.tsx
client/src/components/ui/pagination.tsx
client/src/components/ui/popover.tsx
client/src/components/ui/progress.tsx
client/src/components/ui/radio-group.tsx
client/src/components/ui/resizable.tsx
client/src/components/ui/scroll-area.tsx
client/src/components/ui/select.tsx
client/src/components/ui/separator.tsx
client/src/components/ui/sheet.tsx
client/src/components/ui/sidebar.tsx
client/src/components/ui/skeleton.tsx
client/src/components/ui/slider.tsx
client/src/components/ui/sonner.tsx
client/src/components/ui/spinner.tsx
client/src/components/ui/streamdown.tsx
client/src/components/ui/switch.tsx
client/src/components/ui/table.tsx
client/src/components/ui/tabs.tsx
client/src/components/ui/textarea.tsx
client/src/components/ui/toast.tsx
client/src/components/ui/toggle-group.tsx
client/src/components/ui/toggle.tsx
client/src/components/ui/tooltip.tsx
client/src/components/ui/README.md
```

### 3.9 UI图标组件（必须全部复制）
```
client/src/components/ui/icons/file-ae-colorful-icon.tsx
client/src/components/ui/icons/file-ai-colorful-icon.tsx
client/src/components/ui/icons/file-android-colorful-icon.tsx
client/src/components/ui/icons/file-audio-colorful-icon.tsx
client/src/components/ui/icons/file-code-colorful-icon.tsx
client/src/components/ui/icons/file-csv-colorful-icon.tsx
client/src/components/ui/icons/file-eml-colorful-icon.tsx
client/src/components/ui/icons/file-ios-colorful-icon.tsx
client/src/components/ui/icons/file-keynote-colorful-icon.tsx
client/src/components/ui/icons/file-pages-colorful-icon.tsx
client/src/components/ui/icons/file-ps-colorful-icon.tsx
client/src/components/ui/icons/file-sketch-colorful-icon.tsx
client/src/components/ui/icons/file-slide-colorful-icon.tsx
client/src/components/ui/icons/file-vcf-colorful-icon.tsx
client/src/components/ui/icons/file-wiki-excel-colorful-icon.tsx
client/src/components/ui/icons/file-wiki-image-colorful-icon.tsx
client/src/components/ui/icons/file-wiki-pdf-colorful-icon.tsx
client/src/components/ui/icons/file-wiki-ppt-colorful-icon.tsx
client/src/components/ui/icons/file-wiki-text-colorful-icon.tsx
client/src/components/ui/icons/file-wiki-unknown-colorful-icon.tsx
client/src/components/ui/icons/file-wiki-video-colorful-icon.tsx
client/src/components/ui/icons/file-wiki-word-colorful-icon.tsx
client/src/components/ui/icons/file-wiki-zip-colorful-icon.tsx
```

### 3.10 业务组件（business-ui）
```
client/src/components/business-ui/README.md
client/src/components/business-ui/form/index.tsx
client/src/components/business-ui/form/types.ts
client/src/components/business-ui/form/form.tsx
client/src/components/business-ui/form/context.tsx
client/src/components/business-ui/form/field-layout.tsx
client/src/components/business-ui/form/input-field.tsx
client/src/components/business-ui/form/select-field.tsx
client/src/components/business-ui/form/switch-field.tsx
client/src/components/business-ui/form/radio-group-field.tsx
client/src/components/business-ui/form/checkbox-field.tsx
client/src/components/business-ui/form/textarea-field.tsx
client/src/components/business-ui/form/hooks/form.tsx
client/src/components/business-ui/form/hooks/form-context.tsx
client/src/components/business-ui/form/hooks/form-utils.ts
```

### 3.11 用户选择组件
```
client/src/components/business-ui/user-select/index.tsx
client/src/components/business-ui/user-select/types.ts
client/src/components/business-ui/user-select/user-select.tsx
client/src/components/business-ui/user-select/user-select-tag.tsx
client/src/components/business-ui/user-select/user-item.tsx
client/src/components/business-ui/user-select/user-pill.tsx
client/src/components/business-ui/user-select/use-user-value.ts
client/src/components/business-ui/user-select/utils.tsx
```

### 3.12 用户展示组件
```
client/src/components/business-ui/user-display/index.tsx
client/src/components/business-ui/user-display/type.ts
client/src/components/business-ui/user-display/user-display.tsx
client/src/components/business-ui/user-display/user-with-avatar.tsx
client/src/components/business-ui/user-display/overflow-tooltip-text.tsx
```

### 3.13 部门选择组件
```
client/src/components/business-ui/department-select/index.tsx
client/src/components/business-ui/department-select/types.ts
client/src/components/business-ui/department-select/department-select.tsx
client/src/components/business-ui/department-select/department-select-tag.tsx
client/src/components/business-ui/department-select/department-item.tsx
client/src/components/business-ui/department-select/icon-department.tsx
client/src/components/business-ui/department-select/department-select-field.tsx
client/src/components/business-ui/department-select/utils.ts
```

### 3.14 实体选择组件
```
client/src/components/business-ui/entity-combobox/index.tsx
client/src/components/business-ui/entity-combobox/types.ts
client/src/components/business-ui/entity-combobox/shared-types.ts
client/src/components/business-ui/entity-combobox/context.tsx
client/src/components/business-ui/entity-combobox/hooks.tsx
client/src/components/business-ui/entity-combobox/entity-combobox.tsx
client/src/components/business-ui/entity-combobox/base-combobox.tsx
client/src/components/business-ui/entity-combobox/base-combobox-content.tsx
client/src/components/business-ui/entity-combobox/base-combobox-empty.tsx
client/src/components/business-ui/entity-combobox/base-combobox-error.tsx
client/src/components/business-ui/entity-combobox/base-combobox-item.tsx
client/src/components/business-ui/entity-combobox/base-combobox-list.tsx
client/src/components/business-ui/entity-combobox/base-combobox-loading.tsx
client/src/components/business-ui/entity-combobox/base-combobox-search.tsx
client/src/components/business-ui/entity-combobox/base-combobox-trigger.tsx
client/src/components/business-ui/entity-combobox/popover-wrapper.tsx
client/src/components/business-ui/entity-combobox/search-trigger.tsx
client/src/components/business-ui/entity-combobox/item-pill.tsx
client/src/components/business-ui/entity-combobox/highlight-text.tsx
client/src/components/business-ui/entity-combobox/size-variants.tsx
client/src/components/business-ui/entity-combobox/use-fetch-data.tsx
client/src/components/business-ui/entity-combobox/use-infinite-scroll.tsx
client/src/components/business-ui/entity-combobox/use-popover-outside-click.tsx
```

### 3.15 富文本编辑器
```
client/src/components/business-ui/tiptap-editor/index.ts
client/src/components/business-ui/tiptap-editor/tiptap-editor.tsx
client/src/components/business-ui/tiptap-editor/tiptap-editor-complete.tsx
client/src/components/business-ui/tiptap-editor/README.md
client/src/components/business-ui/tiptap-editor/hooks/use-tiptap-editor.ts
client/src/components/business-ui/tiptap-editor/extensions/complete-kit.ts
client/src/components/business-ui/tiptap-editor/extensions/code-block-shiki.tsx
client/src/components/business-ui/tiptap-editor/extensions/attachment.tsx
client/src/components/business-ui/tiptap-editor/extensions/image.tsx
client/src/components/business-ui/tiptap-editor/components/mark-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/blockquote-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/code-block-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/color-highlight-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/heading-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/horizontal-rule-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/image-upload-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/link-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/link-hover-toolbar.tsx
client/src/components/business-ui/tiptap-editor/components/link-edit-form.tsx
client/src/components/business-ui/tiptap-editor/components/list-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/text-align-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/undo-redo-toolbar-button.tsx
client/src/components/business-ui/tiptap-editor/components/attachment-toolbar-button.tsx
```

### 3.16 用户资料组件
```
client/src/components/business-ui/user-profile/user-profile.tsx
client/src/components/business-ui/user-profile/get-env.tsx
client/src/components/business-ui/user-profile/error-image.tsx
client/src/components/business-ui/user-profile/user-external-script.ts
```

### 3.17 API服务
```
client/src/components/business-ui/api/users/service.ts
client/src/components/business-ui/api/users/queries.ts
client/src/components/business-ui/api/user-profiles/service.ts
client/src/components/business-ui/api/user-profiles/queries.ts
client/src/components/business-ui/api/departments/service.ts
client/src/components/business-ui/api/departments/queries.ts
client/src/components/business-ui/api/files/service.ts
```

### 3.18 图片资源
```
client/src/utils/img-resources/avatar-placeholders.ts
client/src/utils/img-resources/cover-placeholders.ts
client/src/utils/img-resources/banner-placeholders.ts
```

### 3.19 页面组件（pages - 最关键）
```
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
```

---

## 四、后端文件（server/）

### 4.1 核心配置
```
server/main.ts
server/app.module.ts
```

### 4.2 数据库
```
server/database/schema.ts
```

### 4.3 公共模块
```
server/common/filters/exception.filter.ts
server/common/interfaces/api_response.interface.ts
server/common/interfaces/exception.interface.ts
server/common/constants/api_response_code.ts
```

### 4.4 视图模块
```
server/modules/view/view.module.ts
server/modules/view/view.controller.ts
```

### 4.5 客户模块
```
server/modules/customer/customer.module.ts
server/modules/customer/customer.controller.ts
server/modules/customer/customer.service.ts
```

### 4.6 产品模块
```
server/modules/product/product.module.ts
server/modules/product/product.controller.ts
server/modules/product/product.service.ts
```

### 4.7 库存模块
```
server/modules/inventory/inventory.module.ts
server/modules/inventory/inventory.controller.ts
server/modules/inventory/inventory.service.ts
```

### 4.8 出库模块
```
server/modules/outbound/outbound.module.ts
server/modules/outbound/outbound.controller.ts
server/modules/outbound/outbound.service.ts
```

### 4.9 对账模块
```
server/modules/reconciliation/reconciliation.module.ts
server/modules/reconciliation/reconciliation.controller.ts
server/modules/reconciliation/reconciliation.service.ts
```

### 4.10 示例模块
```
server/modules/hello/hello.module.ts
server/modules/hello/hello.controller.ts
server/modules/hello/hello.service.ts
```

### 4.11 插件能力
```
server/capabilities/intelligent_writing_quick_quality_1.json
server/capabilities/image_info_extract_structured_1.json
```

---

## 五、共享文件（shared/）

```
shared/api.interface.ts
```

---

## 六、脚本文件（scripts/）

```
scripts/dev.sh
scripts/build.sh
scripts/run.sh
scripts/prune-smart.js
```

---

## 七、导出文件总数统计

| 类别 | 文件数 | 重要性 |
|-----|-------|-------|
| 根目录配置 | 19 | ⭐⭐⭐⭐⭐ |
| 前端入口 | 3 | ⭐⭐⭐⭐⭐ |
| 前端核心代码 | 10 | ⭐⭐⭐⭐⭐ |
| UI组件 | 80+ | ⭐⭐⭐⭐⭐ |
| 业务组件 | 100+ | ⭐⭐⭐⭐⭐ |
| 页面组件 | 15 | ⭐⭐⭐⭐⭐ |
| 后端代码 | 25 | ⭐⭐⭐⭐⭐ |
| 共享代码 | 1 | ⭐⭐⭐⭐ |
| 脚本 | 4 | ⭐⭐⭐ |
| **总计** | **约260个** | - |

---

## 八、常见问题排查

### 问题1：导入后页面显示空白
**原因**：缺少路由配置或页面组件
**检查**：确保 client/src/app.tsx 和所有页面文件已复制

### 问题2：样式丢失或错乱
**原因**：缺少 Tailwind 配置或 CSS 文件
**检查**：确保以下文件已复制：
- tailwind.config.ts
- postcss.config.js
- client/src/index.css
- client/src/tailwind-theme.css

### 问题3：组件无法找到
**原因**：缺少 shadcn/ui 组件
**检查**：确保 client/src/components/ui/ 下所有文件已复制

### 问题4：后端接口报错
**原因**：缺少后端模块或数据库结构
**检查**：确保 server/modules/ 下所有文件和 server/database/schema.ts 已复制

### 问题5：权限功能失效
**原因**：缺少 PermissionGuard 或权限相关代码
**检查**：确保 client/src/components/PermissionGuard.tsx 和 PermissionPage 已复制

---

## 九、验证清单

导入后请检查以下功能是否正常：

- [ ] 登录页面正常显示
- [ ] 侧边栏导航正常显示
- [ ] 工作台页面正常显示
- [ ] 来货登记页面正常显示
- [ ] 快速发货页面正常显示
- [ ] 库存管理页面正常显示
- [ ] 智能对账页面正常显示
- [ ] 数据统计页面正常显示
- [ ] 客户管理页面正常显示
- [ ] 产品管理页面正常显示
- [ ] 系统设置页面正常显示
- [ ] 用户手册页面正常显示
- [ ] 页面切换正常
- [ ] 数据加载正常

---

创建日期：2026-02-05
版本：v1.0
