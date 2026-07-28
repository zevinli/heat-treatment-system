

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
