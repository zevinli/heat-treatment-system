

---

## 第34章 Shadcn/UI 组件库完整参考

### 34.1 概述

热处理收发货管理系统使用 shadcn/ui 作为基础 UI 组件库。shadcn/ui 不是传统的 npm 包，而是一套可复制、可定制、可拥有的组件代码集合。所有组件源码位于 `client/src/components/ui/` 目录下。

#### 组件统计

| 类别 | 组件数 | 用途 |
|------|--------|------|
| 基础元素 | 15 | Button, Input, Label, Badge, Avatar, Separator 等 |
| 表单控件 | 12 | Select, Checkbox, RadioGroup, Switch, Slider, Textarea 等 |
| 布局容器 | 8 | Card, Tabs, Accordion, Collapsible, Resizable 等 |
| 反馈层 | 7 | Dialog, Sheet, Drawer, Popover, Tooltip, Toast 等 |
| 导航 | 6 | Pagination, Breadcrumb, NavigationMenu, Menubar 等 |
| 数据展示 | 8 | Table, Chart, Progress, Skeleton, Carousel 等 |
| 特殊组件 | 6 | Filter, Form, Command, Streamdown, Image, Kbd 等 |
| 图标 | 22 | 文件类型彩色图标 |
| **总计** | **84** | |

### 34.2 基础元素组件

#### Button（button.tsx）

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
  }
);
```

6种变体 + 4种尺寸。系统主操作用 `default`，危险操作用 `destructive`，次要操作用 `outline`，工具栏用 `ghost`。

#### Input（input.tsx）

```tsx
<input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
```

支持 `type` 属性：text, number, email, password, tel, url, search。

#### Badge（badge.tsx）

```typescript
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-success/10 text-success',
        warning: 'border-transparent bg-warning/10 text-warning',
        error: 'border-transparent bg-error/10 text-error',
      },
    },
  }
);
```

7种变体，包含系统自定义的 success/warning/error 语义颜色。

#### Avatar（avatar.tsx）

```tsx
<Avatar>
  <AvatarImage src={url} />
  <AvatarFallback>{name[0]}</AvatarFallback>
</Avatar>
```

基于 Radix Avatar，图片加载失败时显示首字母回退。

#### Separator（separator.tsx）

```tsx
<Separator orientation="horizontal" className="my-4" />
```

水平/垂直分割线。

### 34.3 表单控件组件

#### Select（select.tsx）

基于 Radix Select，包含 Select/SelectTrigger/SelectContent/SelectItem/SelectValue/SelectGroup/SelectLabel 等子组件。

```tsx
<Select value={value} onValueChange={onChange}>
  <SelectTrigger>
    <SelectValue placeholder="请选择..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">选项1</SelectItem>
    <SelectItem value="option2">选项2</SelectItem>
  </SelectContent>
</Select>
```

#### Checkbox（checkbox.tsx）

基于 Radix Checkbox，支持 checked/unchecked/indeterminate 三态。

#### RadioGroup（radio-group.tsx）

基于 Radix RadioGroup，包含 RadioGroup/RadioGroupItem 子组件。

#### Switch（switch.tsx）

基于 Radix Switch，开关切换组件。

#### Slider（slider.tsx）

基于 Radix Slider，范围滑块。

#### Textarea（textarea.tsx）

多行文本输入框，支持 rows 和 resize 属性。

#### Calendar（calendar.tsx）

基于 react-day-picker，日历选择器。支持 single/range 两种模式。

#### InputOTP（input-otp.tsx）

OTP 验证码输入组件，基于 input-otp。

#### InputGroup（input-group.tsx）

输入组容器，包含 InputGroup/InputGroupText 子组件，支持前缀/后缀。

#### Field（field.tsx）

表单字段布局组件，包含 Field/FieldLabel/FieldContent/FieldDescription/FieldError/FieldGroup 子组件。business-ui Form 系统基于此组件构建。

#### Form（form.tsx）

基于 TanStack Form 的表单组件，提供 FormField/FormLabel/FormControl/FormDescription/FormMessage 等。

### 34.4 布局容器组件

#### Card（card.tsx）

```tsx
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>内容</CardContent>
  <CardFooter>底部</CardFooter>
</Card>
```

#### Tabs（tabs.tsx）

基于 Radix Tabs，标签页切换。

#### Accordion（accordion.tsx）

基于 Radix Accordion，手风琴展开收起。

#### Collapsible（collapsible.tsx）

基于 Radix Collapsible，折叠展开。

#### Resizable（resizable.tsx）

基于 react-resizable-panels，可调整面板大小。

#### ScrollArea（scroll-area.tsx）

基于 Radix ScrollArea，自定义滚动条样式。

#### AspectRatio（aspect-ratio.tsx）

基于 Radix Aspect Ratio，保持宽高比。

#### Sheet（sheet.tsx）

基于 Radix Dialog，侧边抽屉面板。支持 top/right/bottom/left 四个方向。

### 34.5 反馈层组件

#### Dialog（dialog.tsx）

基于 Radix Dialog，模态对话框。

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>打开</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogHeader>
    {/* 内容 */}
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>取消</Button>
      <Button onClick={onConfirm}>确认</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Drawer（drawer.tsx）

基于 Vaul Drawer，移动端优化的底部抽屉。

#### Popover（popover.tsx）

基于 Radix Popover，弹出层。

```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild><Button>触发</Button></PopoverTrigger>
  <PopoverContent align="start" sideOffset={4}>
    内容
  </PopoverContent>
</Popover>
```

#### Tooltip（tooltip.tsx）

基于 Radix Tooltip，悬浮提示。

#### Sonner（sonner.tsx）

基于 Sonner，Toast 通知。

```tsx
import { toast } from 'sonner';
toast.success('保存成功');
toast.error('保存失败');
toast.warning('库存不足');
toast.loading('加载中...');
```

#### Alert（alert.tsx）

页面级警告提示。支持 default/destructive/warning 三种变体。

#### AlertDialog（alert-dialog.tsx）

基于 Radix AlertDialog，确认对话框。与 Dialog 区别：AlertDialog 不允许点击外部关闭，必须选择"确认"或"取消"。

### 34.6 导航组件

#### Pagination（pagination.tsx）

分页器，包含上一页/下一页按钮和页码。

#### Breadcrumb（breadcrumb.tsx）

面包屑导航。

#### NavigationMenu（navigation-menu.tsx）

基于 Radix NavigationMenu，顶部导航菜单。

#### Menubar（menubar.tsx）

基于 Radix Menubar，菜单栏。

#### DropdownMenu（dropdown-menu.tsx）

基于 Radix DropdownMenu，下拉菜单。包含 DropdownMenu/DropdownMenuTrigger/DropdownMenuContent/DropdownMenuItem/DropdownMenuSeparator/DropdownMenuLabel/DropdownMenuGroup/DropdownMenuCheckboxItem 等子组件。

#### ContextMenu（context-menu.tsx）

基于 Radix ContextMenu，右键上下文菜单。

### 34.7 数据展示组件

#### Table（table.tsx）

HTML 表格组件，包含 Table/TableHeader/TableBody/TableFooter/TableRow/TableHead/TableCell 子组件。

#### Chart（chart.tsx）

基于 ReactECharts 的图表容器组件。

#### Progress（progress.tsx）

基于 Radix Progress，进度条。

#### Skeleton（skeleton.tsx）

骨架屏加载占位。

#### Carousel（carousel.tsx）

基于 Embla Carousel，轮播组件。

#### HoverCard（hover-card.tsx）

基于 Radix HoverCard，悬浮卡片。

#### Empty（empty.tsx）

空状态组件，显示图标+文本+操作按钮。

#### Spinner（spinner.tsx）

加载旋转图标。

### 34.8 特殊组件

#### Filter（filter.tsx）

通用筛选器系统（第28章已详细描述）。

#### Form（form.tsx）

TanStack Form 集成（第30章已详细描述）。

#### Command（command.tsx）

基于 cmdk 的命令面板/搜索列表。用于 SelectContent 和 FilterSelectContent。

#### Streamdown（streamdown.tsx）

Markdown 流式渲染组件，内置 prose 排版。用于 AI 回复、富文本展示。

#### Image（image.tsx）

图片组件，替代原生 `<img>`。支持响应式 sizes、固定 width、loading 状态、错误回退。

#### Kbd（kbd.tsx）

键盘按键展示组件，用于快捷键提示。

#### Toggle / ToggleGroup（toggle.tsx）

基于 Radix Toggle/ToggleGroup，切换按钮和按钮组。

### 34.9 文件图标系统（icons/）

22个文件类型彩色图标，用于附件展示：

| 图标 | 文件类型 |
|------|---------|
| file-ae-colorful-icon | After Effects |
| file-ai-colorful-icon | Illustrator |
| file-android-colorful-icon | Android |
| file-audio-colorful-icon | 音频 |
| file-code-colorful-icon | 代码 |
| file-csv-colorful-icon | CSV |
| file-eml-colorful-icon | 邮件 |
| file-ios-colorful-icon | iOS |
| file-keynote-colorful-icon | Keynote |
| file-pages-colorful-icon | Pages |
| file-ps-colorful-icon | Photoshop |
| file-sketch-colorful-icon | Sketch |
| file-slide-colorful-icon | 幻灯片 |
| file-vcf-colorful-icon | 联系人 |
| file-wiki-excel-colorful-icon | Excel |
| file-wiki-image-colorful-icon | 图片 |
| file-wiki-pdf-colorful-icon | PDF |
| file-wiki-ppt-colorful-icon | PowerPoint |
| file-wiki-text-colorful-icon | 文本 |
| file-wiki-unknown-colorful-icon | 未知 |
| file-wiki-video-colorful-icon | 视频 |
| file-wiki-word-colorful-icon | Word |

### 34.10 样式约定

所有 shadcn/ui 组件遵循以下样式约定：

1. **CSS 变量**：使用 `tailwind-theme.css` 中定义的 CSS 变量（如 `bg-primary`、`text-foreground`），禁止硬编码颜色值
2. **cva 变体**：使用 `class-variance-authority` 定义变体和尺寸
3. **cn 工具**：使用 `cn()` 合并类名，支持 Tailwind merge
4. **forwardRef**：所有组件使用 `React.forwardRef` 转发 ref
5. **asChild**：支持 Radix `asChild` 模式，允许自定义渲染元素
6. **data-slot**：使用 `data-slot` 属性标记组件内部元素，便于 CSS 选择器定位

### 34.11 使用规范

1. **优先使用已有组件**：开发新功能前先检查 `client/src/components/ui/` 是否已有对应组件
2. **查看 README**：`client/src/components/ui/README.md` 包含组件使用说明
3. **禁止原生元素**：禁止使用原生 `<input>`/`<textarea>`/`<select>`，必须用 shadcn 组件
4. **Props 值从联合类型选取**：如 Button variant 必须从实际联合类型中选取，不确定时看源码
5. **版本锁定**：所有组件已安装，无需额外安装
6. **按需导入**：从 `@/components/ui/xxx` 导入，不使用全局注册
