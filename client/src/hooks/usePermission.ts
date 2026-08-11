import { useQuery } from '@tanstack/react-query';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { PermissionCode, UserPermissions, OutboundOrder, InboundOrder } from '@shared/api.interface';

interface UsePermissionsReturn {
  permissions: PermissionCode[];
  roles: string[];
  isLoading: boolean;
  error: Error | null;
  hasPermission: (code: PermissionCode) => boolean;
  canUndoOutbound: (order: OutboundOrder, currentUserId: string) => PermissionCheckResult;
  canUndoInbound: (order: InboundOrder, currentUserId: string) => PermissionCheckResult;
}

interface PermissionCheckResult {
  canUndo: boolean;
  reason?: string;
  isAdminOverride?: boolean;
  remainingSeconds?: number;
}

const STALE_TIME = 5 * 60 * 1000; // 5 分钟缓存

export function usePermissions(): UsePermissionsReturn {
  const orgCode = localStorage.getItem('currentOrgCode') || '';
  const userId = localStorage.getItem('userId') || '';
  const { data, isLoading, error } = useQuery<UserPermissions, Error>({
    // 权限是“用户 × 组织”维度，固定缓存键会在切换租户后短暂复用上一组织的角色。
    queryKey: ['permissions', userId, orgCode],
    queryFn: async () => {
      try {
        const response = await axiosForBackend({
          url: '/api/permissions/me',
          method: 'GET',
        });
        return response.data as UserPermissions;
      } catch (err) {
        logger.error('获取权限失败:', err);
        throw err;
      }
    },
    staleTime: STALE_TIME,
    enabled: Boolean(userId && orgCode),
    retry: 1,
  });

  const permissions = data?.permissions || [];
  const roles = data?.roles || [];

  /**
   * 检查是否有指定权限
   */
  const hasPermission = (code: PermissionCode): boolean => {
    return permissions.includes(code);
  };

  /**
   * 检查出库单是否可撤销（前端预检）
   * 注意：这只是前端预检，最终权限由后端校验
   */
  const canUndoOutbound = (order: OutboundOrder, currentUserId: string): PermissionCheckResult => {
    // 1. 检查基础权限
    if (!hasPermission('outbound:undo')) {
      return {
        canUndo: false,
        reason: '您没有撤销出库单的权限',
      };
    }

    // 2. 检查单据状态
    if (order.status === 'cancelled') {
      return {
        canUndo: false,
        reason: '该出库单已撤销',
      };
    }

    if (order.lockStatus === 'locked' || order.reconciliationId) {
      return {
        canUndo: false,
        reason: '该出库单已参与对账，无法撤销',
      };
    }

    // 3. 检查创建者归属
    const isCreator = order.creator === currentUserId;
    const isAdmin = hasPermission('system:permission');

    if (!isCreator && !isAdmin) {
      return {
        canUndo: false,
        reason: '只能撤销自己创建的单据',
      };
    }

    // 4. 所有角色都遵守直接撤销时间窗；超期操作必须走审批，管理员也不能绕过业务审计。
    const timeCheck = checkUndoableFrontend(order.createdAt);
    if (!timeCheck.canUndo) {
      return {
        canUndo: false,
        reason: timeCheck.reason,
        remainingSeconds: 0,
      };
    }
    return {
      canUndo: true,
      isAdminOverride: !isCreator && isAdmin,
      remainingSeconds: timeCheck.remainingSeconds,
    };
  };

  /**
   * 检查入库单是否可撤销（前端预检）
   */
  const canUndoInbound = (order: InboundOrder, currentUserId: string): PermissionCheckResult => {
    // 1. 检查基础权限
    if (!hasPermission('inbound:undo')) {
      return {
        canUndo: false,
        reason: '您没有撤销入库单的权限',
      };
    }

    // 2. 检查单据状态
    if (order.status === 'cancelled') {
      return {
        canUndo: false,
        reason: '该入库单已撤销',
      };
    }

    // 3. 检查创建者归属
    const isCreator = order.creator === currentUserId;
    const isAdmin = hasPermission('system:permission');

    if (!isCreator && !isAdmin) {
      return {
        canUndo: false,
        reason: '只能撤销自己创建的单据',
      };
    }

    const timeCheck = checkUndoableFrontend(order.createdAt);
    if (!timeCheck.canUndo) return timeCheck;
    return { canUndo: true, isAdminOverride: !isCreator && isAdmin, remainingSeconds: timeCheck.remainingSeconds };
  };

  return {
    permissions,
    roles,
    isLoading,
    error,
    hasPermission,
    canUndoOutbound,
    canUndoInbound,
  };
}

// 前端时间窗口检查工具函数
function checkUndoableFrontend(createdAt: string | Date): {
  canUndo: boolean;
  reason?: string;
  remainingSeconds?: number;
} {
  const UNDO_TIME_WINDOW = 30 * 60 * 1000; // 30 分钟
  const now = Date.now();
  const orderTime = new Date(createdAt).getTime();
  const elapsed = now - orderTime;
  const remaining = UNDO_TIME_WINDOW - elapsed;

  if (remaining <= 0) {
    return {
      canUndo: false,
      reason: '已超过30分钟撤销时限',
      remainingSeconds: 0,
    };
  }

  return {
    canUndo: true,
    remainingSeconds: Math.floor(remaining / 1000),
  };
}
