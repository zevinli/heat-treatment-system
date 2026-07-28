

---

## 第33章 Business-UI Department Select 部门选择器

### 33.1 系统架构

部门选择器基于 EntityCombobox 底层组件实现，与 UserSelect 结构类似，但搜索的是部门数据而非用户数据。

| 文件 | 行数 | 职责 |
|------|------|------|
| `department-select.tsx` | 168 | 根组件，数据获取+BaseCombobox 配置 |
| `department-item.tsx` | ~60 | 部门列表项组件 |
| `department-select-tag.tsx` | ~50 | 多选标签组件 |
| `department-select-field.tsx` | ~80 | 表单字段封装 |
| `icon-department.tsx` | ~40 | 部门图标 |
| `types.ts` | ~50 | 类型定义 |
| `utils.ts` | ~30 | 工具函数 |
| `index.tsx` | ~10 | 桶导出 |

### 33.2 类型定义

```typescript
interface Department {
  id: string;          // 部门ID
  name: string;        // 部门名称
  parentId?: string;   // 父部门ID
  avatar?: string;     // 部门图标URL
}

interface DepartmentSelectProps extends BaseEntitySelectProps<Department> {
  // 继承所有 BaseEntitySelectProps 属性
}
```

### 33.3 数据获取

```typescript
function createDepartmentsFetcher(pageSize = 100) {
  return async (search: string) => {
    const response = await searchDepartments({ query: search, pageSize });
    const departmentList = response?.data?.departmentList || [];

    return {
      items: departmentList.map(departmentInfoToDepartment),
    };
  };
}
```

`searchDepartments` 调用后端 `/api/departments/search` 接口，返回部门列表。`departmentInfoToDepartment` 将 API 返回的原始部门信息转换为 `Department` 类型。

### 33.4 组件实现

```typescript
export const DepartmentSelect = (props: DepartmentSelectProps) => {
  const {
    size = 'medium',
    triggerType = 'button',
    multiple,
    value,
    defaultValue,
    onChange,
    placeholder = '请选择部门',
    emptyText = '没有匹配结果，换个关键词试试吧',
    ...
  } = props;

  const fetchFn = useMemo(() => createDepartmentsFetcher(), []);

  return (
    <BaseCombobox
      fetchFn={fetchFn}
      getItemValue={(dept) => dept}
      getItemLabel={(dept) => dept.name}
      renderItem={(dept, isSelected, className, disabled) => (
        <DepartmentItemWrapper
          key={dept.id}
          departmentValue={dept}
          isSelected={isSelected}
          className={className}
          disabled={disabled}
        />
      )}
      renderTag={(dept, onClose, tagDisabled) => (
        <DepartmentSelectTagWrapper
          key={dept.id}
          departmentValue={dept}
          onClose={onClose}
          disabled={tagDisabled}
        />
      )}
      showSearch
      debounce={300}
      placeholder={placeholder}
      emptyText={emptyText}
      {...props}
    />
  );
};
```

与 UserSelect 的区别：
1. 不需要 `valueType` 转换（部门 ID 直接使用）
2. 不需要 `accountType`（部门只有一种来源）
3. 不需要 `useUserValue`（无需根据 ID 异步查询部门信息）
4. 部门列表项使用部门图标而非头像

### 33.5 DepartmentItem 列表项

```tsx
function DepartmentItem({ departmentValue, isSelected, className, size, searchKeyword, disabled }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-2 transition-colors',
        sizeClasses[size],
        isSelected && 'bg-primary/10',
        disabled && 'opacity-50',
        !disabled && 'hover:bg-muted cursor-pointer',
      )}
      onClick={() => !disabled && handleSelect(departmentValue)}
    >
      <IconDepartment className="size-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <HighlightText text={departmentValue.name} keyword={searchKeyword} />
      </div>
      {isSelected && <Check className="size-4 text-primary" />}
    </div>
  );
}
```

### 33.6 DepartmentSelectTag 多选标签

```tsx
function DepartmentSelectTag({ departmentValue, onClose, size, disabled }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
      <IconDepartment className="size-3 text-muted-foreground" />
      <span className="max-w-24 truncate">{departmentValue.name}</span>
      {!disabled && (
        <button onClick={(e) => onClose(departmentValue, e)} className="rounded-sm hover:bg-foreground/10">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
```

### 33.7 DepartmentSelectField 表单字段

```tsx
function DepartmentSelectField({ field, label, required, description, ...fieldProps }) {
  return (
    <FieldLayout label={label} required={required} description={description}
      name={field.name}
      isInvalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
      errorMessage={field.state.meta.errors[0]?.message}
    >
      <DepartmentSelect
        value={field.state.value}
        onChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur()}
        {...fieldProps}
      />
    </FieldLayout>
  );
}
```

集成到 TanStack Form 系统，支持表单验证和错误显示。

### 33.8 使用场景

| 场景 | 配置 |
|------|------|
| 来货登记选择客户所属部门 | `multiple={false}` |
| 权限管理按部门分配权限 | `multiple={true}` |
| 统计报表按部门筛选 | `triggerType="search"` |

### 33.9 导出清单

```typescript
export { DepartmentSelect };
export { DepartmentSelectField };
export { IconDepartment };
export type { Department, DepartmentInfo, DepartmentSelectProps };
```
