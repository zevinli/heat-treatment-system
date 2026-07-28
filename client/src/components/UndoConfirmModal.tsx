import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info, RotateCcw } from 'lucide-react';
import type { OutboundOrder, InboundOrder } from '@shared/api.interface';

type OrderType = 'inbound' | 'outbound';

interface UndoConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  order: OutboundOrder | InboundOrder | null;
  orderType: OrderType;
  isAdminOverride: boolean;
  isLoading?: boolean;
}

export function UndoConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  order,
  orderType,
  isAdminOverride,
  isLoading = false,
}: UndoConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!order) return null;

  const isOutbound = orderType === 'outbound';
  const minReasonLength = isAdminOverride ? 10 : 5;
  const orderNo = isOutbound
    ? (order as OutboundOrder).outboundNo
    : (order as InboundOrder).inboundNo;

  const handleConfirm = () => {
    const trimmedReason = reason.trim();

    if (trimmedReason.length < minReasonLength) {
      setError(`撤销原因至少需要 ${minReasonLength} 个字符`);
      return;
    }

    setError('');
    onConfirm(trimmedReason);
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAdminOverride ? (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                管理员强制撤销
              </>
            ) : (
              <>
                <RotateCcw className="h-5 w-5" />
                撤销{isOutbound ? '出库' : '入库'}单
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            请确认您要撤销以下{isOutbound ? '出库' : '入库'}单
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 单据信息 */}
          <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">单号：</span>
              {orderNo}
            </p>
            <p>
              <span className="text-muted-foreground">客户：</span>
              {order.customerName}
            </p>
            {isOutbound && (
              <p>
                <span className="text-muted-foreground">金额：</span>
                ¥{((order as OutboundOrder).totalAmount || 0).toFixed(2)}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">创建时间：</span>
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          {/* 管理员警告 */}
          {isAdminOverride && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>警告</AlertTitle>
              <AlertDescription>
                您正在撤销他人创建的单据。此操作将被记录到审计日志，
                并通知原创建人。请确保操作合规。
              </AlertDescription>
            </Alert>
          )}

          {/* 普通提示 */}
          {!isAdminOverride && isOutbound && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>撤销说明</AlertTitle>
              <AlertDescription>
                撤销后库存将回滚，如已关联对账单将解除关联。此操作不可恢复。
              </AlertDescription>
            </Alert>
          )}

          {/* 原因输入 */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              撤销原因 <span className="text-destructive">*</span>
              <span className="text-muted-foreground text-xs ml-2">
                (至少 {minReasonLength} 个字，已输入 {reason.trim().length} 个)
              </span>
            </label>
            <Textarea
              id="reason"
              placeholder={`请输入撤销原因，例如：${
                isAdminOverride
                  ? '数据录入错误，已与客户确认取消'
                  : '客户要求取消订单'
              }`}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              className={error ? 'border-destructive' : ''}
              rows={3}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            取消
          </Button>
          <Button
            variant={isAdminOverride ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : isAdminOverride ? '强制撤销' : '确认撤销'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
