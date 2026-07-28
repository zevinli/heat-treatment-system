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
