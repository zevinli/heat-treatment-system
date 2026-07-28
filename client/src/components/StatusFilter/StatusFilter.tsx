/**
 * 单据状态筛选组件
 * 支持全部、正常、已撤销三种状态的筛选
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { OrderStatusFilter } from '@shared/api.interface';

interface StatusFilterProps {
  value: OrderStatusFilter;
  onChange: (value: OrderStatusFilter) => void;
  stats: {
    total: number;
    active: number;
    cancelled: number;
  };
  orderType: 'inbound' | 'outbound';
  disabled?: boolean;
}

const statusConfig: Record<OrderStatusFilter, { label: string; color: string }> = {
  all: { 
    label: '全部', 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  active: { 
    label: '正常', 
    color: 'bg-green-50 text-green-700 border-green-200',
  },
  cancelled: { 
    label: '已撤销', 
    color: 'bg-red-50 text-red-700 border-red-200',
  },
};

export const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
  stats,
  orderType,
  disabled,
}) => {
  const typeLabel = orderType === 'inbound' ? '入库' : '出库';

  const getCount = (status: OrderStatusFilter) => {
    switch (status) {
      case 'all': return stats.total;
      case 'active': return stats.active;
      case 'cancelled': return stats.cancelled;
      default: return 0;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">状态：</span>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as OrderStatusFilter)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="选择状态" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(statusConfig) as OrderStatusFilter[]).map((status) => (
            <SelectItem key={status} value={status}>
              <div className="flex items-center justify-between w-full gap-4">
                <span>{statusConfig[status].label}{typeLabel}单</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${statusConfig[status].color}`}
                >
                  {getCount(status)}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
