

---

## 第30章 Business-UI Form 表单系统

### 30.1 系统架构

Form 表单系统基于 TanStack Form（@tanstack/react-form）构建，提供类型安全的表单状态管理和字段组件库。

| 文件 | 行数 | 职责 |
|------|------|------|
| `form.tsx` | 54 | Form 根组件，包裹 FormProvider + form.AppForm |
| `context.tsx` | ~30 | FormProvider + useFormContext |
| `field-layout.tsx` | 91 | 字段布局组件（label/description/error/required） |
| `input-field.tsx` | ~120 | Input 字段组件 |
| `textarea-field.tsx` | ~80 | Textarea 字段组件 |
| `select-field.tsx` | ~100 | Select 字段组件 |
| `checkbox-field.tsx` | ~60 | Checkbox 字段组件 |
| `radio-group-field.tsx` | ~70 | RadioGroup 字段组件 |
| `switch-field.tsx` | ~60 | Switch 字段组件 |
| `hooks/form.tsx` | 40 | createAppFormHook 工厂函数 |
| `hooks/form-context.tsx` | 4 | fieldContext + formContext |
| `hooks/form-utils.ts` | 23 | 表单工具函数 |
| `types.ts` | 32 | 类型定义 |
| `index.tsx` | ~10 | 桶导出 |

### 30.2 技术选型：TanStack Form

本系统选择 TanStack Form 而非 React Hook Form 的原因：

| 特性 | TanStack Form | React Hook Form |
|------|--------------|-----------------|
| 类型安全 | 完整泛型推导 | 需要手动类型断言 |
| 状态管理 | 独立状态管理 | 依赖 React 状态 |
| 渲染优化 | 字段级订阅 | 全表单重渲染 |
| 异步验证 | 原生支持 | 需要额外配置 |
| 生态 | 较新 | 成熟稳定 |

### 30.3 Form 根组件

```typescript
interface FormProps {
  children: React.ReactNode;
  form: AppFieldExtendedReactFormApi<any, any>;  // TanStack Form 实例
  className?: string;
  style?: React.CSSProperties;
  layout?: 'vertical' | 'responsive' | 'horizontal';
}
```

```tsx
const Form: React.FC<FormProps> = (props) => {
  const { children, form, className, style, layout = 'vertical' } = props;

  return (
    <FormProvider layout={layout}>
      <form
        data-testid="tanstack-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppForm>
          <FieldGroup className={className} style={style}>
            {children}
          </FieldGroup>
        </form.AppForm>
      </form>
    </FormProvider>
  );
};
```

组件层级：
1. `FormProvider` — 提供表单上下文（layout 模式）
2. `<form>` — 原生 form 元素，阻止默认提交，调用 `form.handleSubmit()`
3. `form.AppForm` — TanStack Form 的 AppForm 组件，提供字段组件注册
4. `FieldGroup` — shadcn Field 组件，提供布局容器

### 30.4 FormProvider 上下文

```typescript
// context.tsx
const FormContext = React.createContext<{ layout: string }>({ layout: 'vertical' });

export function FormProvider({ children, layout }: { children: React.ReactNode; layout: string }) {
  return <FormContext.Provider value={{ layout }}>{children}</FormContext.Provider>;
}

export function useFormContext() {
  return React.useContext(FormContext);
}
```

`layout` 值传递给所有字段组件，控制 label 和输入框的排列方式。

### 30.5 FieldLayout 字段布局组件

FieldLayout 是所有字段组件的通用布局包装器，负责渲染 label、description、error 和必填标记。

#### Props

```typescript
interface FieldLayoutProps {
  label?: ReactNode;
  placeholder?: string;
  description?: string;
  isInvalid?: boolean;        // 是否校验失败
  errorMessage?: string;       // 错误信息
  layout?: 'horizontal' | 'vertical' | 'responsive';
  name?: string;               // 字段名（关联label的htmlFor）
  required?: boolean;           // 是否必填
  classNames?: Partial<FieldLayoutClassNames>;
  styles?: Partial<FieldLayoutStyles>;
}
```

#### 布局模式

**垂直布局**（vertical，默认）：

```
┌─────────────┐
│ Label *     │
├─────────────┤
│ [Input]     │
├─────────────┤
│ Error msg   │
├─────────────┤
│ Description │
└─────────────┘
```

```tsx
<Field orientation="vertical">
  {labelComponent}
  <FieldContent>
    {children}
    {errorComponent}
  </FieldContent>
  {descriptionComponent}
</Field>
```

**水平/响应式布局**（horizontal/responsive）：

```
┌──────────────┬──────────────┐
│ Label *      │ [Input]      │
│ Description  │ Error msg    │
└──────────────┴──────────────┘
```

```tsx
<Field orientation={layout}>
  {descriptionComponent ? (
    <FieldContent>
      {labelComponent}
      {descriptionComponent}
    </FieldContent>
  ) : (
    labelComponent
  )}
  <FieldContent className="has-[>[role=switch]]:flex-initial">
    {children}
    {errorComponent}
  </FieldContent>
</Field>
```

#### 必填标记

```tsx
{required && (
  <span className="text-red-500">
    <Asterisk size={12} />
  </span>
)}
```

使用 Lucide 的 Asterisk 图标，红色，12px，显示在 label 后面。

#### 错误显示

```tsx
const errorComponent = isInvalid && (
  <FieldError className={classNames?.['error']} style={styles?.['error']}>
    {errorMessage}
  </FieldError>
);
```

`FieldError` 是 shadcn Field 组件的子组件，默认红色文字样式。

### 30.6 字段组件

所有字段组件遵循相同的模式：

1. 从 TanStack Form 获取 `field` 对象
2. 使用 `FieldLayout` 包裹布局
3. 渲染对应的 shadcn UI 组件
4. 绑定 `field.state.value` 和 `field.handleChange`

#### InputField

```tsx
function InputField({ field, ...fieldProps }: InputFieldProps) {
  return (
    <FieldLayout {...fieldProps} name={field.name} isInvalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
      <Input
        value={field.state.value ?? ''}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur()}
        disabled={fieldProps.disabled}
        placeholder={fieldProps.placeholder}
      />
    </FieldLayout>
  );
}
```

支持的 input 类型：text、number、email、password、tel、url、search。

#### TextareaField

```tsx
function TextareaField({ field, ...fieldProps }: TextareaFieldProps) {
  return (
    <FieldLayout {...fieldProps}>
      <Textarea
        value={field.state.value ?? ''}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur()}
        placeholder={fieldProps.placeholder}
        rows={fieldProps.rows ?? 3}
      />
    </FieldLayout>
  );
}
```

#### SelectField

```tsx
function SelectField({ field, ...fieldProps }: SelectFieldProps) {
  return (
    <FieldLayout {...fieldProps}>
      <Select
        value={field.state.value ?? ''}
        onValueChange={(value) => field.handleChange(value)}
        disabled={fieldProps.disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={fieldProps.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {fieldProps.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldLayout>
  );
}
```

#### CheckboxField

```tsx
function CheckboxField({ field, ...fieldProps }: CheckboxFieldProps) {
  return (
    <FieldLayout {...fieldProps} layout="horizontal">
      <Checkbox
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />
    </FieldLayout>
  );
}
```

Checkbox 默认使用水平布局。

#### RadioGroupField

```tsx
function RadioGroupField({ field, ...fieldProps }: RadioGroupFieldProps) {
  return (
    <FieldLayout {...fieldProps}>
      <RadioGroup
        value={field.state.value ?? ''}
        onValueChange={(value) => field.handleChange(value)}
      >
        {fieldProps.options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} />
            <Label htmlFor={`${field.name}-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </FieldLayout>
  );
}
```

#### SwitchField

```tsx
function SwitchField({ field, ...fieldProps }: SwitchFieldProps) {
  return (
    <FieldLayout {...fieldProps} layout="horizontal">
      <Switch
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />
    </FieldLayout>
  );
}
```

Switch 默认使用水平布局，并且 `FieldContent` 添加 `has-[>[role=switch]]:flex-initial` 样式。

### 30.7 createAppFormHook 工厂函数

```typescript
const COMMON_FORM_COMPONENTS = {
  Input: InputField,
  Switch: SwitchField,
  RadioGroup: RadioGroupField,
  Checkbox: CheckboxField,
  Select: SelectField,
  Textarea: TextareaField,
};

export function createAppFormHook(options?: CreateFormHookOptions) {
  const { fieldComponents = {}, formComponents = {} } = options ?? {};

  return createFormHook({
    fieldComponents: {
      ...COMMON_FORM_COMPONENTS,
      ...fieldComponents,
    },
    formComponents: formComponents,
    fieldContext,
    formContext,
  });
}
```

`createAppFormHook` 是 TanStack Form 的工厂函数，注册所有字段组件。业务代码可以扩展自定义字段组件：

```typescript
const useAppForm = createAppFormHook({
  fieldComponents: {
    CustomerSelect: CustomerSelectField,
    ProductSelect: ProductSelectField,
  },
});

// 使用
const form = useAppForm({
  defaultValues: { customer: '', product: '' },
  onSubmit: (values) => console.log(values),
});

<form.AppField component="CustomerSelect" name="customer" />
```

### 30.8 表单验证

TanStack Form 支持同步和异步验证：

```typescript
const form = useAppForm({
  defaultValues: {
    productName: '',
    quantity: 0,
    unitPrice: 0,
  },
  validators: {
    onChange: (values) => {
      const errors: Record<string, string> = {};
      if (!values.productName?.trim()) errors.productName = '产品名称不能为空';
      if (values.quantity <= 0) errors.quantity = '数量必须大于0';
      if (values.unitPrice <= 0) errors.unitPrice = '单价必须大于0';
      return errors;
    },
  },
  onSubmit: async (values) => {
    await saveInbound(values);
  },
});
```

字段级验证：

```typescript
<form.AppField
  name="productName"
  validators={{
    onChange: (value) => !value?.trim() ? '产品名称不能为空' : undefined,
  }}
>
  {(field) => <field.Input label="产品名称" required />}
</form.AppField>
```

### 30.9 CommonFieldProps 通用属性

所有字段组件共享的 Props：

```typescript
interface CommonFieldProps {
  label?: ReactNode;          // 字段标签
  placeholder?: string;       // 占位文本
  description?: string;       // 描述信息
  disabled?: boolean;         // 是否禁用
  required?: boolean;         // 是否必填
  layout?: 'horizontal' | 'vertical' | 'responsive';  // 布局模式
}
```

### 30.10 使用示例

#### 来货登记表单

```tsx
const useInboundForm = createAppFormHook();

function InboundForm() {
  const form = useInboundForm({
    defaultValues: {
      customerId: '',
      productId: '',
      quantity: 0,
      weight: 0,
      unit: '件',
      unitPrice: 0,
      remark: '',
    },
    validators: {
      onSubmit: (values) => {
        const errors = {};
        if (!values.customerId) errors.customerId = '请选择客户';
        if (!values.productId) errors.productId = '请选择产品';
        if (values.quantity <= 0) errors.quantity = '数量必须大于0';
        return errors;
      },
    },
    onSubmit: async (values) => {
      await saveInboundRecord(values);
    },
  });

  return (
    <Form form={form} layout="vertical" className="space-y-4">
      <form.AppField name="customerId">
        {(field) => <field.Input label="客户" required placeholder="选择客户" />}
      </form.AppField>

      <form.AppField name="productId">
        {(field) => <field.Input label="产品" required placeholder="选择产品" />}
      </form.AppField>

      <div className="grid grid-cols-2 gap-4">
        <form.AppField name="quantity">
          {(field) => <field.Input label="数量" required type="number" />}
        </form.AppField>

        <form.AppField name="weight">
          {(field) => <field.Input label="重量(kg)" type="number" />}
        </form.AppField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.AppField name="unit">
          {(field) => (
            <field.Select label="计价单位" required options={[
              { value: '件', label: '件' },
              { value: 'kg', label: 'kg' },
              { value: '个', label: '个' },
            ]} />
          )}
        </form.AppField>

        <form.AppField name="unitPrice">
          {(field) => <field.Input label="单价(元)" required type="number" />}
        </form.AppField>
      </div>

      <form.AppField name="remark">
        {(field) => <field.Textarea label="备注" placeholder="补充说明..." />}
      </form.AppField>

      <form.AppForm>
        <SubmitButton form={form} />
      </form.AppForm>
    </Form>
  );
}
```

### 30.11 导出清单

```typescript
export { Form };
export { FormProvider, useFormContext };
export { FieldLayout };
export { InputField, TextareaField, SelectField, CheckboxField, RadioGroupField, SwitchField };
export { createAppFormHook };
export type { FormProps, FieldLayoutProps, CommonFieldProps, FieldLayoutStyles, FieldLayoutClassNames };
```
