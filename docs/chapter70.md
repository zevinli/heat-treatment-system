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
