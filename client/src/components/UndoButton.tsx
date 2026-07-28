import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermission';
import type { OutboundOrder, InboundOrder } from '@shared/api.interface';

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

export function UndoButton({
  order,
  orderType,
  currentUserId,
  onUndo,
  size = 'sm',
  variant = 'outline',
  className,
}: UndoButtonProps) {
  const { canUndoOutbound, canUndoInbound, isLoading } = usePermissions();

  // 根据单据类型获取权限检查结果
  const checkResult = React.useMemo(() => {
    if (isLoading) {
      return { canUndo: false, reason: '加载中...' };
    }

    if (orderType === 'outbound') {
      return canUndoOutbound(order as OutboundOrder, currentUserId);
    } else {
      return canUndoInbound(order as InboundOrder, currentUserId);
    }
  }, [order, orderType, currentUserId, isLoading, canUndoOutbound, canUndoInbound]);

  const { canUndo, reason, isAdminOverride } = checkResult;

  // 无权限或不可撤销时，显示禁用状态
  if (!canUndo) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block" data-ai-section-type="button">
              <Button
                size={size}
                variant="ghost"
                disabled
                className={`cursor-not-allowed opacity-50 ${className || ''}`}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                撤销
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <p className="max-w-[200px] text-sm">{reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 管理员强制撤销时，显示警告样式
  if (isAdminOverride) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={size}
              variant="destructive"
              onClick={() => onUndo(order, true)}
              className={className}
              data-ai-section-type="button"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              强制撤销
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <p className="max-w-[200px] text-sm">管理员强制撤销他人单据</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 正常撤销按钮
  return (
    <Button
      size={size}
      variant={variant}
      onClick={() => onUndo(order, false)}
      className={className}
      data-ai-section-type="button"
    >
      <RotateCcw className="h-4 w-4 mr-1" />
      撤销
    </Button>
  );
}
