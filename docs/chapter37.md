

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
2. **禁止深色主题**：系统指定浅色主题，不支持深色模式切换
3. **禁止混用深浅背景**：如深色 Header + 浅色内容
4. **禁止不同页面使用不同主色调**：所有页面必须使用相同的 `--primary` 值
5. **禁止不同页面使用不同侧边栏宽度**：统一 240px
6. **禁止不同页面使用不同圆角风格**：统一 8px 卡片圆角
7. **禁止 `bg-[--primary]`**：Tailwind 4 限制，必须使用 `bg-primary`
8. **禁止 arbitrary values 中使用空格**：用下划线代替（`from-[hsl(215_60%_18%)]`）
9. **禁止自定义 tailwind-theme.css 中的颜色格式**：必须用 `hsl(H, S%, L%)` 格式（非 `23 10% 23%`）
