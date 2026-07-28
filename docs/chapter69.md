# 第69章 撤销与确认交互组件

> 文件位置：`client/src/components/UndoButton.tsx`（115行）、`client/src/components/UndoConfirmModal.tsx`（176行）、`client/src/components/DeleteConfirmDialog.tsx`（86行）、`client/src/components/ChangeTypeBadge.tsx`（258行）

## 69.1 概述

本章涵盖四个业务交互组件，用于撤销操作、删除确认和库存变动类型展示。这些组件在入库/出库/库存管理页面中广泛使用。

## 69.2 UndoButton 组件（UndoButton.tsx，115行）

### 定位

撤销操作按钮，集成权限检查和状态展示。根据权限检查结果显示三种状态：禁用、强制撤销、正常撤销。

### Props 接口

```typescript
type OrderType = 'inbound' | 'outbound';

interface UndoButtonProps {
  order: OutboundOrder | InboundOrder;
  orderType: OrderType;
  currentUserId: string;
  onUndo: (order: OutboundOrder | InboundOrder, isAdminOverride: boolean) => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}
```

### 权限检查逻辑

通过 `usePermissions` Hook 获取权限检查函数：

| 单据类型 | 权限函数 | 说明 |
|---------|---------|------|
| 出库 | `canUndoOutbound(order, userId)` | 检查是否可撤销出库单 |
| 入库 | `canUndoInbound(order, userId)` | 检查是否可撤销入库单 |

返回值包含 `{ canUndo: boolean, reason: string, isAdminOverride: boolean }`。

### 三种渲染状态

| 状态 | 条件 | 样式 | 图标 | Tooltip |
|------|------|------|------|---------|
| 禁用 | `!canUndo` | `variant="ghost" disabled opacity-50` | RotateCcw | 显示 `reason`（不可撤销原因） |
| 强制撤销 | `isAdminOverride` | `variant="destructive"` | AlertTriangle | "管理员强制撤销他人单据" |
| 正常撤销 | 默认 | `variant` props 传入 | RotateCcw | 无 |

### 使用示例

```tsx
<UndoButton
  order={order}
  orderType="outbound"
  currentUserId={currentUser.id}
  onUndo={(order, isAdmin) => {
    setUndoTarget(order);
    setIsAdminOverride(isAdmin);
    setUndoModalOpen(true);
  }}
  size="sm"
  variant="outline"
/>
```

## 69.3 UndoConfirmModal 组件（UndoConfirmModal.tsx，176行）

### 定位

撤销确认弹窗，展示单据信息并要求输入撤销原因。区分普通撤销和管理员强制撤销两种模式。

### Props 接口

```typescript
interface UndoConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  order: OutboundOrder | InboundOrder | null;
  orderType: OrderType;
  isAdminOverride: boolean;
  isLoading?: boolean;
}
```

### 弹窗结构

```
Dialog
├── DialogHeader
│   ├── DialogTitle（图标 + 标题）
│   └── DialogDescription
├── 单据信息区（bg-muted 圆角卡片）
│   ├── 单号
│   ├── 客户名
│   ├── 金额（仅出库单）
│   └── 创建时间
├── 警告区
│   ├── 管理员模式 → Alert variant="destructive"（审计日志警告）
│   └── 普通出库 → Alert（库存回滚说明）
├── 撤销原因输入
│   ├── label（最少字符数提示）
│   ├── Textarea
│   └── 错误信息
└── DialogFooter
    ├── 取消按钮
    └── 确认按钮（普通：variant="default"，管理员：variant="destructive"）
```

### 撤销原因校验

| 模式 | 最少字符数 | 占位提示 |
|------|----------|---------|
| 管理员强制撤销 | 10 | "数据录入错误，已与客户确认取消" |
| 普通撤销 | 5 | "客户要求取消订单" |

### 状态管理

- `reason`: 撤销原因文本
- `error`: 校验错误信息
- 关闭时清空 reason 和 error

## 69.4 DeleteConfirmDialog 组件（DeleteConfirmDialog.tsx，86行）

### 定位

通用删除确认对话框，支持单条和批量删除。展示删除对象列表和影响说明。

### Props 接口

```typescript
interface DeleteItem {
  id: string;
  name: string;
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;         // 默认 "确认删除？"
  items: DeleteItem[];     // 待删除对象列表
  impact?: string;         // 影响说明（可选）
}
```

### 弹窗结构

```
Dialog (max-w-md)
├── DialogHeader
│   └── DialogTitle（AlertTriangle 图标 + 标题）
├── 内容区
│   ├── 删除对象列表（max-h-32 滚动，最多展示5项）
│   │   └── 超过5项显示 "...还有 N 项"
│   ├── 影响说明（amber-600 警告色，可选）
│   └── 后果警示（"此操作不可撤销，删除后数据将无法恢复"）
└── DialogFooter
    ├── 取消按钮 (variant="outline")
    └── 确认删除按钮 (variant="destructive")
```

### 批量删除标题

```typescript
const isBulk = items.length > 1;
// 标题：`确认删除 ${items.length} 项？` 或自定义 title
```

## 69.5 ChangeTypeBadge 组件（ChangeTypeBadge.tsx，258行）

### 定位

库存变动类型标签组件，展示变动类型的图标、标签、方向和数值。从 `@shared/inventory-change-types` 导入类型配置。

### Props 接口

```typescript
interface ChangeTypeBadgeProps {
  type: InventoryChangeType;
  quantity?: number;        // 变动数量
  weight?: number;          // 变动重量
  showDirection?: boolean;  // 显示方向图标，默认 false
  showAmount?: boolean;     // 显示数值，默认 false
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

### 依赖模块

```typescript
import {
  getChangeTypeConfig,    // 获取类型配置（label, icon, direction, isRollback）
  getChangeTypeTheme,     // 获取主题色（bg, text, border, icon, directionIcon）
  getChangeTypeLabel,     // 获取标签文字
  isRollbackType,         // 是否回滚类型
  directionLabels,        // 方向标签映射
  type ChangeTypeTheme,
} from '@shared/inventory-change-types';
```

### 图标映射表

```typescript
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, Truck, Undo2, RotateCcw, TrendingUp, TrendingDown,
  AlertTriangle, XCircle, Trash2, Settings, PlusCircle, MinusCircle,
  FileCheck, Hammer,
};

const directionIconMap = {
  up: ArrowUp,
  down: ArrowDown,
  neutral: Minus,
};
```

### 尺寸配置

| 尺寸 | badge | icon | directionIcon | amount |
|------|-------|------|--------------|--------|
| sm | text-xs px-2 py-0.5 h-5 | w-3 h-3 | w-3 h-3 | text-xs |
| md | text-sm px-2.5 py-1 h-7 | w-4 h-4 | w-3.5 h-3.5 | text-sm |
| lg | text-base px-3 py-1.5 h-9 | w-5 h-5 | w-4 h-4 | text-base |

### 数值格式化

```typescript
// 方向 up: "+100 件"  方向 down: "-50 件"  方向 neutral: "100 件"
// 重量: "12.50 kg"
// 组合: "+100 件 / 12.50 kg"
```

### 回滚类型特殊样式

当 `config.isRollback` 为 true 时，badge 边框使用 `border-dashed`（虚线），视觉上区分回滚操作。

### 导出的变体组件

| 组件 | Props | 说明 |
|------|-------|------|
| `ChangeTypeBadge` | 完整 Props | 主组件，可配置所有选项 |
| `ChangeTypeLabel` | type, className | 简化版，仅 sm 尺寸标签 |
| `ChangeTypeWithAmount` | type, quantity, weight, unit, size | 带数值版，用于表格行 |
| `ChangeDirectionIndicator` | type, className | 仅方向指示器（箭头 + 文字） |

### 使用示例

```tsx
// 表格中的变动类型列
<ChangeTypeWithAmount type="inbound" quantity={100} weight={25.5} />

// 简洁标签
<ChangeTypeLabel type="outbound_rollback" />

// 完整配置
<ChangeTypeBadge
  type="manual_increase"
  quantity={50}
  showDirection
  showAmount
  size="md"
/>
```

## 69.6 组件间协作

```
UndoButton（列表页/详情页）
  ↓ onUndo 回调
UndoConfirmModal（弹窗确认）
  ↓ onConfirm 回调
API 调用 → 后端 undo 模块
  ↓ 返回结果
ChangeTypeBadge（库存变动记录展示）
  ↓ 变动记录列表
显示 "入库回滚" / "出库回滚" 标签

DeleteConfirmDialog（通用删除场景）
  ↓ onConfirm 回调
API 调用 → 对应模块 DELETE 接口
```
