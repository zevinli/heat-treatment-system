/**
 * 单据表格行组件
 * 支持正常和已撤销单据的视觉区分
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Eye, RotateCcw } from 'lucide-react';
import type { InboundOrder, OutboundOrder } from '@shared/api.interface';

interface OrderTableRowProps {
  order: InboundOrder | OutboundOrder;
  orderType: 'inbound' | 'outbound';
  onView: (order: InboundOrder | OutboundOrder) => void;
  onUndo?: (order: InboundOrder | OutboundOrder) => void;
}

export const OrderTableRow: React.FC<OrderTableRowProps> = ({
  order,
  orderType,
  onView,
  onUndo,
}) => {
  const isCancelled = order.status === 'cancelled';
  const orderNo = orderType === 'inbound' 
    ? (order as InboundOrder).inboundNo 
    : (order as OutboundOrder).outboundNo;
  
  const orderDate = orderType === 'inbound' 
    ? (order as InboundOrder).inboundDate 
    : (order as OutboundOrder).outboundDate;

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN');
  };

  const formatAmount = (amount: number): string => {
    if (amount == null) return '¥0.00';
    return `¥${amount.toFixed(2)}`;
  };

  return (
    <tr 
      className={cn(
        'border-b transition-colors',
        isCancelled 
          ? 'bg-gray-50/80 hover:bg-gray-100/60' 
          : 'bg-white hover:bg-gray-50',
        isCancelled && 'opacity-70'
      )}
    >
      {/* 单号 */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-mono text-sm',
            isCancelled && 'line-through text-gray-500'
          )}>
            {orderNo}
          </span>
          {isCancelled && (
            <Badge variant="destructive" className="text-xs">
              已撤销
            </Badge>
          )}
        </div>
      </td>

      {/* 客户名称 */}
      <td className={cn(
        'px-4 py-3 text-sm',
        isCancelled && 'text-gray-500 line-through'
      )}>
        {order.customerName}
      </td>

      {/* 日期 */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(orderDate)}
      </td>

      {/* 数量 */}
      <td className={cn(
        'px-4 py-3 text-sm text-right',
        isCancelled && 'text-gray-500'
      )}>
        {order.totalQuantity ?? 0}
      </td>

      {/* 重量 */}
      <td className={cn(
        'px-4 py-3 text-sm text-right',
        isCancelled && 'text-gray-500'
      )}>
        {(order.totalWeight ?? 0).toFixed(2)} kg
      </td>

      {/* 金额 */}
      <td className={cn(
        'px-4 py-3 text-sm text-right font-medium',
        isCancelled && 'text-gray-500 line-through'
      )}>
        {formatAmount(order.totalAmount)}
      </td>

      {/* 状态 */}
      <td className="px-4 py-3">
        <Badge variant={isCancelled ? 'secondary' : 'default'}>
          {isCancelled ? '已撤销' : '正常'}
        </Badge>
      </td>

      {/* 操作 */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onView(order)}
          >
            <Eye className="w-4 h-4 mr-1" />
            查看
          </Button>
          
          {!isCancelled && onUndo && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              onClick={() => onUndo(order)}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              撤销
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
