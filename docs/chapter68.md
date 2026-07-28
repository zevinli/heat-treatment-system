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
