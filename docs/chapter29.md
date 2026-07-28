

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
