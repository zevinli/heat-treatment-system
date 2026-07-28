import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InventoryChangeType } from '@shared/api.interface';
import {
  getChangeTypeConfig,
  getChangeTypeTheme,
  getChangeTypeLabel,
  isRollbackType,
  directionLabels,
  type ChangeTypeTheme,
} from '@shared/inventory-change-types';
import {
  Package,
  Truck,
  Undo2,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  XCircle,
  Trash2,
  Settings,
  PlusCircle,
  MinusCircle,
  FileCheck,
  Hammer,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

/**
 * 图标映射表
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Truck,
  Undo2,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  XCircle,
  Trash2,
  Settings,
  PlusCircle,
  MinusCircle,
  FileCheck,
  Hammer,
};

/**
 * 方向图标映射
 */
const directionIconMap = {
  up: ArrowUp,
  down: ArrowDown,
  neutral: Minus,
};

export interface ChangeTypeBadgeProps {
  /** 变动类型 */
  type: InventoryChangeType;
  /** 变动数量（可选，用于显示） */
  quantity?: number;
  /** 变动重量（可选，用于显示） */
  weight?: number;
  /** 是否显示方向图标 */
  showDirection?: boolean;
  /** 是否显示数值 */
  showAmount?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

/**
 * 库存变动类型标签组件
 * 
 * 使用示例：
 * <ChangeTypeBadge type="inbound" quantity={100} showDirection showAmount />
 * <ChangeTypeBadge type="outbound_rollback" size="sm" />
 */
export const ChangeTypeBadge: React.FC<ChangeTypeBadgeProps> = ({
  type,
  quantity,
  weight,
  showDirection = false,
  showAmount = false,
  size = 'md',
  className,
}) => {
  const config = getChangeTypeConfig(type);
  const theme = getChangeTypeTheme(type);
  
  // 获取图标组件
  const IconComponent = iconMap[config.icon];
  const DirectionIcon = directionIconMap[config.direction];
  
  // 尺寸配置
  const sizeConfig = {
    sm: {
      badge: 'text-xs px-2 py-0.5 h-5',
      icon: 'w-3 h-3',
      directionIcon: 'w-3 h-3',
      amount: 'text-xs',
    },
    md: {
      badge: 'text-sm px-2.5 py-1 h-7',
      icon: 'w-4 h-4',
      directionIcon: 'w-3.5 h-3.5',
      amount: 'text-sm',
    },
    lg: {
      badge: 'text-base px-3 py-1.5 h-9',
      icon: 'w-5 h-5',
      directionIcon: 'w-4 h-4',
      amount: 'text-base',
    },
  };
  
  const sizes = sizeConfig[size];
  
  // 格式化数值显示
  const formatAmount = () => {
    if (!showAmount) return null;
    
    const parts: string[] = [];
    if (quantity !== undefined) {
      const sign = config.direction === 'up' ? '+' : config.direction === 'down' ? '-' : '';
      parts.push(`${sign}${Math.abs(quantity)} 件`);
    }
    if (weight !== undefined && weight > 0) {
      parts.push(`${weight.toFixed(2)} kg`);
    }
    
    return parts.length > 0 ? parts.join(' / ') : null;
  };
  
  const amountText = formatAmount();
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        variant="outline"
        className={cn(
          sizes.badge,
          'font-medium border',
          theme.bg,
          theme.text,
          theme.border,
          config.isRollback && 'border-dashed'
        )}
      >
        <span className="flex items-center gap-1.5">
          {IconComponent && <IconComponent className={cn(sizes.icon, theme.icon)} />}
          <span>{config.label}</span>
          
          {showDirection && DirectionIcon && (
            <DirectionIcon 
              className={cn(
                sizes.directionIcon, 
                theme.directionIcon,
                'ml-0.5'
              )} 
            />
          )}
        </span>
      </Badge>
      
      {amountText && (
        <span className={cn(
          sizes.amount,
          'font-medium',
          config.direction === 'up' && 'text-emerald-600',
          config.direction === 'down' && 'text-rose-600',
          config.direction === 'neutral' && 'text-slate-600'
        )}>
          {amountText}
        </span>
      )}
    </div>
  );
};

/**
 * 简化的变动类型标签（仅标签，无其他信息）
 */
export const ChangeTypeLabel: React.FC<{
  type: InventoryChangeType;
  className?: string;
}> = ({ type, className }) => {
  return (
    <ChangeTypeBadge 
      type={type} 
      size="sm" 
      className={className} 
    />
  );
};

/**
 * 带数值的变动类型标签（用于表格行）
 */
export const ChangeTypeWithAmount: React.FC<{
  type: InventoryChangeType;
  quantity: number;
  weight?: number;
  unit?: string;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ 
  type, 
  quantity, 
  weight, 
  unit = '件',
  size = 'md',
  className 
}) => {
  return (
    <ChangeTypeBadge
      type={type}
      quantity={quantity}
      weight={weight}
      showDirection
      showAmount
      size={size}
      className={className}
    />
  );
};

/**
 * 变动方向指示器
 */
export const ChangeDirectionIndicator: React.FC<{
  type: InventoryChangeType;
  className?: string;
}> = ({ type, className }) => {
  const config = getChangeTypeConfig(type);
  const theme = getChangeTypeTheme(type);
  const DirectionIcon = directionIconMap[config.direction];
  
  if (!DirectionIcon) return null;
  
  return (
    <span className={cn('flex items-center gap-1', className)}>
      <DirectionIcon className={cn('w-4 h-4', theme.directionIcon)} />
      <span className={cn('text-sm', theme.text)}>
        {directionLabels[config.direction]}
      </span>
    </span>
  );
};

export default ChangeTypeBadge;
