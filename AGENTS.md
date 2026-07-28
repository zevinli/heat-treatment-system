# 热处理收发货管理系统 - 需求拆解文档

## 产品概述

- **产品类型**: Web端 + 移动端适配的SaaS管理系统
- **场景类型**: prototype
- **目标用户**: 收货员、发货员、财务人员、企业管理员
- **核心价值**: 移动端现场作业+PC端管理，实现收发货、对账、统计全流程数字化，提升效率降低误差
- **界面语言**: 中文
- **主题偏好**: 浅色
- **导航模式**: 路径导航
- **导航布局**: Sidebar（侧边栏）

---

## 页面结构总览

| 页面名称 | 文件名 | 路由 | 页面类型 | 入口来源 |
|---------|-------|------|---------|---------|
| 工作台 | `DashboardPage.tsx` | `/` | 一级 | 导航 |
| 来货登记 | `InboundPage.tsx` | `/inbound` | 一级 | 导航 |
| 快速发货 | `OutboundPage.tsx` | `/outbound` | 一级 | 导航 |
| 库存管理 | `InventoryPage.tsx` | `/inventory` | 一级 | 导航 |
| 智能对账 | `ReconciliationPage.tsx` | `/reconciliation` | 一级 | 导航 |
| 数据统计 | `StatisticsPage.tsx` | `/statistics` | 一级 | 导航 |
| 客户管理 | `CustomerListPage.tsx` | `/customers` | 一级 | 导航 |
| 产品管理 | `ProductListPage.tsx` | `/products` | 一级 | 导航 |
| 打印模板配置 | `TemplateConfigPage.tsx` | `/settings/templates` | 一级 | 导航 |
| 权限管理 | `PermissionPage.tsx` | `/settings/permissions` | 一级 | 导航 |
| 客户详情 | `CustomerDetailPage.tsx` | `/customers/:id` | 二级 | 客户管理页 → 列表项点击 |
| 产品详情 | `ProductDetailPage.tsx` | `/products/:id` | 二级 | 产品管理页 → 列表项点击 |

---

## 导航配置

- **导航布局**: Sidebar
- **导航项**（仅一级页面）:
  | 导航文字 | 路由 | 图标(可选) |
  |---------|------|-----------|
  | 工作台 | `/` | Dashboard |
  | 来货登记 | `/inbound` | Inbox |
  | 快速发货 | `/outbound` | Outbox |
  | 库存管理 | `/inventory` | Package |
  | 智能对账 | `/reconciliation` | FileText |
  | 数据统计 | `/statistics` | BarChart |
  | 基础数据 | `/customers` | Database |
  | 系统设置 | `/settings/templates` | Settings |

> 注：基础数据（客户、产品）和系统设置（模板、权限）在导航中作为分组入口，实际路由指向对应的一级页面

---

## 功能列表

### 页面/区块: 工作台
- **页面目标**: 展示核心业务概览、待办事项及预警信息
- **功能点**:
  - **待办概览**: 展示今日待收货、待发货、待对账任务数量
  - **风险预警**: 展示超期未回款、库存积压预警列表
  - **快捷入口**: 提供来货登记、快速发货的一键跳转按钮
  - **实时动态**: 展示最近的收发货操作记录流水

### 页面/区块: 来货登记
- **页面目标**: 移动端优先，现场完成收货录入并打印流程卡
- **功能点**:
  - **三步收货流程**:
    1. 选客户：搜索并选择客户，自动带出历史信息
    2. 选产品：支持多维度检索（名称/材质/工艺）或清单导入
    3. 录数据：录入数量/重量，支持拍照上传产品图片
  - **现场打印**: 保存后自动触发蓝牙/网络打印机，打印含产品图片的流程卡
  - **清单导入**: 支持Excel/文本批量导入产品清单

### 页面/区块: 快速发货
- **页面目标**: 移动端优先，智能分批发货并打印送货单
- **功能点**:
  - **智能批次推荐**: 根据客户订单和库存情况推荐最优发货批次
  - **批量勾选**: 实时显示库存数量，支持多产品批量勾选
  - **灵活分批**: 支持部分发货，结存产品自动留存，关单功能平账
  - **单据打印**: 现场打印送货单，支持客户自定义模板

### 页面/区块: 库存管理
- **页面目标**: 查看实时库存状态，支持库存查询与预警
- **功能点**:
  - **库存列表**: 展示产品名称、规格、当前库存量、单位、库位
  - **库存检索**: 支持按产品名称、材质、批次号筛选
  - **超期预警**: 高亮显示超期未处理的库存项

### 页面/区块: 智能对账
- **页面目标**: 业财一体，自动核对差异并生成对账单
- **功能点**:
  - **周期筛选**: 按客户、月份精准定位对账数据范围
  - **差异核对**: 自动比对出库金额、开票状态、回款进度，红字预警异常
  - **账单生成**: 一键生成对账单，支持电子签章、导出PDF/Excel
  - **回款追踪**: 记录回款进度，标记回款状态

### 页面/区块: 数据统计
- **页面目标**: 提供多维度的业务数据分析报表
- **功能点**:
  - **综合报表**: 年/月/日报表切换，展示收发货总量、金额趋势
  - **客户分析**: 客户发货量排行、回款率分析
  - **产品运行统计**: 产品热力图、加工周期统计
  - **延误分析**: 统计延误订单数量及原因分布

### 页面/区块: 客户管理
- **页面目标**: 维护客户基础信息及个性化配置
- **功能点**:
  - **客户列表**: 展示客户名称、联系人、电话、地址
  - **新增/编辑**: 维护客户详细信息
  - **历史记录**: 查看该客户的历史收发货记录

### 页面/区块: 产品管理
- **页面目标**: 维护产品基础数据库
- **功能点**:
  - **产品列表**: 展示产品名称、材质、工艺、计价方式
  - **新增/编辑**: 维护产品详细信息及规格参数
  - **多维度检索**: 支持按名称、材质、工艺等字段快速查找

### 页面/区块: 打印模板配置
- **页面目标**: 自定义各类单据的打印格式与字段
- **功能点**:
  - **模板类型选择**: 标识卡、送货单、对账单
  - **字段自定义**: 拖拽式配置单据显示字段及顺序
  - **纸张规格设置**: 配置打印纸张大小、边距、方向
  - **预览与测试**: 在线预览模板效果，支持测试打印

### 页面/区块: 权限管理
- **页面目标**: 分级控制用户访问权限，保障数据安全
- **功能点**:
  - **角色管理**: 创建角色（如管理员、操作员、财务），分配菜单权限
  - **用户管理**: 添加用户，绑定角色，限制登录设备数量
  - **操作日志**: 查看用户操作记录，支持追溯

---

## 数据共享配置

| 存储键名 | 数据说明 | 使用页面 |
|---------|---------|---------|
| `__global_heat_user_info` | 当前登录用户信息（角色、权限、设备类型） | 全局 |
| `__global_heat_customer_list` | 客户列表缓存（用于快速检索） | 来货登记、快速发货、智能对账 |
| `__global_heat_product_list` | 产品列表缓存（用于快速检索） | 来货登记、快速发货、库存管理 |
| `__global_heat_print_templates` | 打印模板配置缓存 | 来货登记、快速发货、智能对账 |

-------

# UI 设计指南

> **场景类型**: `prototype`（应用架构设计 - SaaS管理系统）
> **确认检查**: 本指南适用于热处理收发货管理系统的Web端+移动端适配应用。系统面向工厂现场作业场景，需兼顾移动端快速操作与PC端管理功能。

## 1. Design Archetype (设计原型)

### 1.1 内容理解
- **目标用户**: 收货员、发货员、财务人员、企业管理员。一线员工多在工厂现场使用，环境可能有油污、光线变化；财务人员主要在办公室使用
- **核心目的**: 提升收发货效率、降低误差、实现数字化管理。需要建立"专业可靠"的工具信任感
- **期望情绪**: 高效、清晰、可控、专业。操作流程三步闭环，界面需降低认知负担
- **需避免的感受**: 复杂混乱、不稳定、廉价感、操作犹豫

### 1.2 设计语言
- **Aesthetic Direction**: 工业级专业工具风格 - 清晰的视觉层级、高可读性、功能导向的组件设计，兼顾工厂环境的实用性（大触控区域、高对比度）
- **Visual Signature**: 
  1. 侧边栏导航 + 内容区的经典Dashboard布局，宽度固定240px
  2. 工业蓝色系主色调，传达可靠与专业
  3. 卡片式内容组织，清晰的边框分隔
  4. 三步流程的进度指示器（选客户→选产品→录数据）
  5. 移动端优先的触控友好设计（按钮最小44px）
- **Emotional Tone**: 专业高效 - 如同精密仪器般可靠，每个操作都有明确反馈
- **Application Type**: Dashboard/SaaS - 数据密集型后台管理系统，需要高信息密度但保持清晰层级

## 2. Design Principles (设计理念)
1. **效率优先**：三步完成核心操作，每个页面都有明确的主行动按钮，减少用户决策时间
2. **清晰容错**：现场环境复杂，界面需有高对比度和明确的视觉反馈，降低误操作风险
3. **一致的语言**：收发货、对账、统计各模块保持统一的操作逻辑和视觉模式，降低学习成本
4. **移动端优先**：核心功能（收发货）在移动端完成，界面元素需适配触控操作
5. **数据可信**：财务相关界面（对账、统计）需呈现精确、严谨的视觉感受，建立信任

## 3. Color System (色彩系统)

**配色设计理由**：选择工业蓝色系（ hue ~ 215°）作为主色，传达专业、可靠、冷静的工具属性。蓝色在工厂环境中也有良好的辨识度。使用琥珀色作为强调色，用于关键操作和警示，与蓝色形成适度对比。

### 3.1 主题颜色

| 角色 | CSS 变量 | Tailwind Class | HSL 值 | 设计说明 |
|-----|---------|----------------|--------|---------|
| bg | `--background` | `bg-background` | `hsl(210 20% 98%)` | 极浅灰蓝，减少眼部疲劳 |
| surface | `--card` | `bg-card` | `hsl(0 0% 100%)` | 纯白卡片，清晰分隔内容 |
| header | `--primary` | `bg-primary` | `hsl(215 70% 35%)` | 工业蓝，专业稳重 |
| text | `--foreground` | `text-foreground` | `hsl(222 47% 11%)` | 深灰黑，高可读性 |
| textMuted | `--muted-foreground` | `text-muted-foreground` | `hsl(215 16% 47%)` | 中灰，用于次要信息 |
| accent | `--accent` | `bg-accent` | `hsl(38 92% 50%)` | 琥珀色，用于强调和行动号召 |
| border | `--border` | `border-border` | `hsl(214 32% 91%)` | 浅灰蓝边框，柔和分隔 |

### 3.2 语义颜色

> 用于状态反馈、数据标识和操作结果提示

| 用途 | CSS 变量 | HSL 值 | 设计说明 |
|-----|---------|--------|---------|
| success | `--success` | `hsl(142 71% 45%)` | 成功/完成/上升 - 鲜明绿色 |
| warning | `--warning` | `hsl(38 92% 50%)` | 警告/中风险 - 与 accent 同色 |
| error | `--error` | `hsl(0 72% 51%)` | 错误/下降/超期 - 警示红 |
| info | `--info` | `hsl(215 70% 50%)` | 信息提示 - 主色明亮版 |

## 4. Typography (字体排版)

- **Heading**: 思源黑体 (Source Han Sans CN) / "PingFang SC", "Microsoft YaHei", sans-serif
- **Body**: 思源黑体 (Source Han Sans CN) / "PingFang SC", "Microsoft YaHei", sans-serif
- **字体导入**: 
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
/* 中文回退 */
font-family: "PingFang SC", "Microsoft YaHei", "Source Han Sans CN", sans-serif;
```

**字体层级规范**：

| 层级 | 尺寸 | 字重 | 行高 | 用途 |
|-----|-----|-----|-----|-----|
| H1 | `text-2xl` (24px) | `font-bold` | 1.3 | 页面主标题 |
| H2 | `text-xl` (20px) | `font-semibold` | 1.4 | 区块标题 |
| H3 | `text-lg` (18px) | `font-semibold` | 1.5 | 卡片标题 |
| Body | `text-base` (16px) | `font-normal` | 1.6 | 正文内容 |
| Small | `text-sm` (14px) | `font-normal` | 1.5 | 辅助说明、标签 |
| Tiny | `text-xs` (12px) | `font-medium` | 1.4 | 徽章、状态标签 |

## 5. Global Layout Structure (全局布局结构)

### 5.1 Navigation & Footer Layout

**Navigation Type**: Sidebar (左侧固定侧边栏)
**Navigation Layout**:
- **Position**: `fixed left-0 top-0 h-screen`
- **Width**: `w-60` (240px)，移动端抽屉式 `w-72` (288px)
- **Background**: `bg-primary` (hsl 215 70% 35%)，深色背景突出导航
- **Mobile Behavior**: 抽屉式 Drawer，遮罩层 `bg-black/50`

**Footer Layout**: 不需要
- Dashboard/SaaS 应用通常不需要传统 Footer，使用无限滚动内容区

**Main Container Padding (Layout 统一边距)**
- **Main Padding**: `p-6` (桌面端) / `p-4` (移动端)

### 5.2 Page Content Zones (页面区块配置)

**整体结构**：
```
┌─────────────────────────────────────────┐
│  Sidebar (fixed, w-60, bg-primary)      │
│  ├─ Logo                               │
│  ├─ Nav Items                          │
│  └─ User Profile                       │
├─────────────────────────────────────────┤
│  Main Content (ml-60, p-6)              │
│  ├─ Page Header                        │
│  ├─ Content Area (max-w-7xl)           │
│  └─ Cards/Tables/Forms                 │
└─────────────────────────────────────────┘
```

**Content 区块**:
- **Maximum Width**: `max-w-7xl` (1280px)，数据密集场景需要较宽区域
- **Padding**: `px-4 sm:px-6 lg:px-8 py-6`
- **Alignment**: `mx-auto`，居中显示
- **Vertical Spacing**: `space-y-6`，卡片之间保持 24px 间距

**移动端适配**:
- 侧边栏隐藏，使用汉堡菜单触发 Drawer
- 内容区全宽 `w-full`
- 卡片改为垂直堆叠，表格可横向滚动

## 6. Visual Effects & Motion (视觉效果与动效)

### 6.1 圆角与阴影
- **圆角**: 
  - 卡片: `rounded-lg` (8px)
  - 按钮: `rounded-md` (6px)
  - 输入框: `rounded-md` (6px)
  - 标签/徽章: `rounded-full`
- **阴影**:
  - 卡片: `shadow-sm` (subtle)
  - 悬浮卡片: `shadow-md`
  - 弹窗/抽屉: `shadow-xl`

### 6.2 复杂背景文字处理

| 背景类型 | 处理方案 | 具体要求 |
|---------|---------|---------|
| Sidebar (深色) | 白色文字 | `text-white` (对比度 > 10:1) |
| 主按钮 (header色) | 白色文字 | `text-white` |
| 强调按钮 (accent色) | 深色文字 | `text-foreground` (琥珀色背景配深色文字) |
| 预警卡片 | 白色文字遮罩 | 红色背景使用 `bg-error/10` 浅色背景 + `text-error` 深色文字 |

### 6.3 缓动函数与动效

- **缓动函数**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)
- **时长规范**:
  - 微交互 (hover/active): 150ms
  - 组件切换 (tab/panel): 200ms
  - 页面过渡: 300ms
  - 抽屉/弹窗: 250ms

**关键动效**:
1. **按钮 Hover**: `transform: translateY(-1px)` + `shadow-md` 提升感，150ms
2. **卡片 Hover**: `shadow-sm` → `shadow-md`，200ms
3. **侧边栏 Nav Item**: 背景色从左滑入 `translateX(-100%)` → `translateX(0)`，200ms
4. **数字变化**: 计数器动画，用于Dashboard KPI卡片，300ms
5. **流程步骤切换**: 内容区淡入淡出 `opacity` + `translateX(20px)`，250ms

## 7. Components (组件指南)

### Buttons

**Primary (主操作)**:
- 背景: `bg-primary` (hsl 215 70% 35%)
- 文字: `text-white` `font-medium`
- Hover: `bg-primary/90` + `shadow-md` + `translateY(-1px)`
- Active: `bg-primary/80`
- Disabled: `opacity-50` + `cursor-not-allowed`
- 尺寸: 桌面端 `h-10 px-4`，移动端 `h-12 px-6` (触控友好)

**Secondary (次要操作)**:
- 背景: `bg-white`
- 边框: `border-border` (1px solid)
- 文字: `text-foreground`
- Hover: `bg-muted` (hsl 210 20% 96%)

**Accent (强调/行动号召)**:
- 背景: `bg-accent` (hsl 38 92% 50%)
- 文字: `text-foreground` (深色，确保对比度)
- Hover: `bg-accent/90`
- 用途: 核心功能入口（来货登记、快速发货按钮）

**Ghost (幽灵按钮)**:
- 背景: transparent
- Hover: `bg-muted`
- 用途: 图标按钮、工具栏操作

### Form Elements

**输入框**:
- 背景: `bg-white`
- 边框: `border-border`，Focus: `border-primary` `ring-2 ring-primary/20`
- 圆角: `rounded-md`
- 高度: 桌面端 `h-10`，移动端 `h-12`
- Placeholder: `text-muted-foreground`

**选择器/下拉**:
- 样式同输入框
- 下拉箭头: `text-muted-foreground`
- 选项 Hover: `bg-muted`

**搜索框**:
- 左侧搜索图标: `text-muted-foreground`
- 背景: `bg-muted` (slate-50)
- 无边框或 `border-0`
- 圆角: `rounded-full` 或 `rounded-lg`

### Cards

**标准卡片**:
- 背景: `bg-card` (white)
- 边框: `border-border` (1px)
- 圆角: `rounded-lg`
- 阴影: `shadow-sm`
- 内边距: `p-6` (桌面端) / `p-4` (移动端)
- Hover: `shadow-md` (可点击卡片)

**指标卡片 (Dashboard KPI)**:
- 布局: 图标(左/上) + 数字(大) + 标签(小) + 趋势(可选)
- 数字: `text-3xl font-bold text-foreground`
- 标签: `text-sm text-muted-foreground`
- 趋势: 上升 `text-success` + ↑ / 下降 `text-error` + ↓

**流程步骤卡片**:
- 当前步骤: `border-primary ring-1 ring-primary`
- 已完成: `border-success` + 勾选图标
- 待完成: `border-border opacity-60`

### Tables

**数据表格**:
- 表头: `bg-muted` (hsl 210 20% 96%) + `text-sm font-semibold text-muted-foreground`
- 行 Hover: `bg-muted/50`
- 边框: `border-border` (水平分割线)
- 单元格内边距: `py-3 px-4`
- 斑马纹: 可选 `even:bg-muted/30`

**操作列**:
- 图标按钮组: `flex gap-2`
- 按钮: Ghost 样式，Hover 显示背景

### Navigation Items (Sidebar)

- 默认: `text-white/70` + `hover:text-white hover:bg-white/10`
- 当前: `text-white bg-white/20` + 左侧 3px  accent 色边框 (`border-l-3 border-accent`)
- 图标: `w-5 h-5 mr-3`
- 高度: `h-10` (触控友好)
- 圆角: `rounded-md` (右侧圆角，与 sidebar 边缘留间隙)

### Tags/Badges

**状态标签**:
- 成功: `bg-success/10 text-success border border-success/20`
- 警告: `bg-warning/10 text-warning border border-warning/20`
- 错误: `bg-error/10 text-error border border-error/20`
- 默认: `bg-muted text-muted-foreground`
- 尺寸: `text-xs px-2 py-0.5 rounded-full`

## 8. Page-Specific Guidelines (页面特定规范)

### 工作台 (Dashboard)
- 顶部 KPI 行: 4-6 个指标卡片，Grid 布局 `grid-cols-2 md:grid-cols-4 lg:grid-cols-6`
- 预警区域: 左侧彩色边框 (warning/error) 的高亮块
- 快捷入口: 大按钮网格，使用 Accent 色突出核心功能

### 来货登记 / 快速发货 (核心操作流程)
- **三步流程指示器**: 顶部固定进度条，步骤节点使用圆圈 + 文字
  - 已完成: `bg-success text-white` + 勾选
  - 当前: `bg-primary text-white` + 脉冲动画 `animate-pulse`
  - 待完成: `bg-muted text-muted-foreground`
- **底部操作栏**: 固定底部，包含"上一步/下一步/保存"按钮，背景 `bg-white border-t`
- **表单区域**: 大输入框，清晰的标签，移动端优先的垂直布局

### 库存管理 / 客户管理 / 产品管理 (列表页)
- **搜索过滤栏**: 顶部固定，包含搜索框 + 筛选下拉 + 新增按钮
- **数据表格**: 主要展示方式，支持排序和分页
- **空状态**: 插图 + 文字说明 + 操作按钮

### 智能对账 (财务界面)
- **严谨风格**: 更多留白，表格使用斑马纹，数字右对齐
- **差异标识**: 红字 `text-error` 标注异常数据
- **操作按钮**: 次要按钮样式，避免误操作

### 数据统计 (图表页)
- **图表配色**:
  - 主系列: `bg-primary` (工业蓝)
  - 次系列: `bg-accent` (琥珀色)
  - 辅助色: 基于 primary 色相偏移 +30°, +60° 的变体
- **卡片布局**: 图表卡片 + 关键指标卡片组合

## 9. Flexibility Note (灵活性说明)

> **一致性优先原则**：本系统为多页面应用（MPA），所有页面必须使用相同的核心参数（侧边栏宽度 240px、内容区最大宽度 1280px、圆角 8px、主色 hsl 215 70% 35% 等），确保整体设计语言统一。
>
> **允许的微调范围**（code agent 可自行判断）：
> - 响应式断点适配（移动端边距减小、表格改为卡片列表）
> - 页面内部的局部间距（如表单字段间距）
> - 图表组件的独立配色（需基于主色派生）
>
> **禁止的随意变更**：
> - ❌ 不同页面使用不同的侧边栏宽度
> - ❌ 不同页面使用不同的主色调或圆角风格
> - ❌ 不同页面使用不同的字体大小层级

## 10. Signature & Constraints (设计签名与禁区)

### DO (视觉签名)
1. **工业蓝 Sidebar**: 深色侧边栏配白色导航文字，当前项有琥珀色左边框
   ```css
   .sidebar { background: hsl(215 70% 35%); }
   .nav-item.active { border-left: 3px solid hsl(38 92% 50%); background: rgba(255,255,255,0.1); }
   ```

2. **三步流程进度指示器**: 顶部步骤条，当前步骤蓝色脉冲动画
   ```html
   <div class="flex items-center gap-2">
     <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center animate-pulse">2</div>
     <div class="flex-1 h-0.5 bg-border"></div>
     <div class="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">3</div>
   </div>
   ```

3. **琥珀色强调按钮**: 核心操作（来货登记、快速发货）使用琥珀色背景配深色文字
   ```css
   .btn-accent { background: hsl(38 92% 50%); color: hsl(222 47% 11%); }
   ```

4. **卡片阴影层级**: 内容卡片使用 subtle 阴影 `shadow-sm`，Hover 时提升 `shadow-md`

5. **移动端触控优化**: 所有点击区域最小 44px，主要操作按钮 48-56px 高度

### DON'T (禁止做法)
1. ❌ 使用透明或模糊的 Sidebar 背景（工厂环境需要高对比度）
2. ❌ 在数据密集型页面使用过度装饰（渐变背景、大插图）
3. ❌ 按钮使用纯黑色阴影（使用基于主色的柔和阴影）
4. ❌ 移动端使用小于 16px 的正文字号（现场环境可读性优先）

**通用禁止事项（所有项目）**:
- ❌ 未经用户要求使用深色主题（本系统指定浅色主题）
- ❌ 混用深浅背景（如深色 Header + 浅色内容）
- ❌ 使用 `w-full` 让内容在大屏幕上无限延伸（使用 max-w-7xl 约束）
- ❌ 图表配色与整体主色调不协调（必须使用基于工业蓝的派生色）
- ❌ 页面看起来不完整（缺少 Header、内容贴边、无合理留白）
- ❌ **硬编码颜色值**（如 `bg-blue-500`）- 必须使用 Color System 中的语义化 class（`bg-primary`, `text-success` 等）

---

## 多租户架构设计

### 架构模式：Database-per-Tenant（独立数据库）

本系统采用 **Database-per-Tenant** 模式实现多租户，每个组织（公司）拥有完全独立的数据库，实现最高级别的数据隔离。

### 架构组件

#### 1. 组织管理（Organization）
- **表位置**: 主数据库（Master DB）
- **核心表**:
  - `organization` - 组织主表，存储组织基本信息和数据库配置
  - `organization_user` - 组织与用户关系表
  - `organization_invite` - 组织邀请码表

#### 2. 租户数据库连接服务
- **文件**: `server/modules/tenant/tenant-connection.service.ts`
- **功能**:
  - 根据组织编码动态获取租户数据库连接
  - 连接池缓存和复用
  - 支持动态切换租户

#### 3. 租户中间件
- **文件**: `server/common/middleware/tenant.middleware.ts`
- **功能**:
  - 从请求头/子域名/查询参数提取组织编码
  - 验证用户对该组织的访问权限
  - 将租户上下文附加到请求对象

#### 4. 租户装饰器
- **文件**: `server/common/decorators/tenant.decorator.ts`
- **装饰器**:
  - `@CurrentTenant()` - 获取完整租户上下文
  - `@CurrentTenantDb()` - 获取租户数据库连接

#### 5. 前端租户上下文
- **文件**: `client/src/contexts/TenantContext.tsx`
- **功能**:
  - 管理当前租户信息
  - 租户信息持久化到 localStorage
  - 提供租户请求头

### 数据隔离方案

| 隔离级别 | 实现方式 | 适用场景 |
|---------|---------|---------|
| **物理隔离** | 独立数据库 | 核心业务数据（客户、产品、订单等） |
| **逻辑隔离** | 组织ID字段 | 组织配置信息（存储在主库） |

### 请求流程

```
1. 用户登录 → 选择组织 → 获取组织编码
2. 前端存储 orgCode 到 localStorage
3. 后续请求自动添加 X-Organization-Code 请求头
4. 后端中间件提取 orgCode，验证权限
5. 动态获取/复用租户数据库连接
6. 执行数据库操作（租户数据库）
```

### 数据库配置

每个租户数据库包含以下配置：
```typescript
{
  dbName: `db_tenant_${orgCode}`,
  dbHost: string,      // 数据库服务器地址
  dbPort: number,      // 端口（默认5432）
  dbUser: string,      // 数据库用户名
  dbPassword: string   // 数据库密码
}
```

### 新增页面

| 页面名称 | 路由 | 功能说明 |
|---------|------|---------|
| 组织选择 | `/organizations` | 登录后选择或创建组织 |
| 组织管理 | `/tenant/manage` | 超级管理员管理所有组织 |

### 权限控制

- **super_admin**: 超级管理员，可管理组织配置和成员
- **admin**: 管理员，可管理业务数据
- **member**: 普通成员，只能操作自己创建的数据

### 部署注意事项

1. **数据库准备**: 创建新租户时，需要运行初始化脚本创建租户数据库
   ```bash
   ts-node server/scripts/init-tenant-db.ts <org_code>
   ```

2. **网络配置**: 确保应用服务器可以访问所有租户数据库服务器

3. **备份策略**: 每个租户数据库需要独立备份