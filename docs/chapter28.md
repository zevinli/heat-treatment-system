

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
