import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteItem {
  id: string;
  name: string;
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  items: DeleteItem[];
  impact?: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = '确认删除？',
  items,
  impact,
}) => {
  const isBulk = items.length > 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            {isBulk ? `确认删除 ${items.length} 项？` : title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 展示删除对象 */}
          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-auto">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="text-sm py-1">
                • {item.name}
              </div>
            ))}
            {items.length > 5 && (
              <div className="text-sm text-gray-500">
                ...还有 {items.length - 5} 项
              </div>
            )}
          </div>

          {/* 影响说明 */}
          {impact && (
            <div className="flex items-start gap-2 text-amber-600 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span>{impact}</span>
            </div>
          )}

          {/* 后果警示 */}
          <p className="text-sm text-gray-500">
            此操作不可撤销，删除后数据将无法恢复。
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
