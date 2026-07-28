import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { checkPermission, getCurrentUser } from '@/pages/PermissionPage/PermissionPage';
import { Loader2 } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

// 权限守卫组件
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  fallback,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = () => {
      const user = getCurrentUser();

      // 如果没有当前用户，使用默认管理员（演示模式）
      if (!user) {
        setHasPermission(true);
        setIsLoading(false);
        return;
      }

      // 如果没有指定权限要求，允许访问
      if (!requiredPermission) {
        setHasPermission(true);
        setIsLoading(false);
        return;
      }

      // 检查权限
      const permitted = checkPermission(user.roleId, 'menu', requiredPermission);
      setHasPermission(permitted);
      setIsLoading(false);

      if (!permitted) {
        toast.error('您没有权限访问此页面');
      }
    };

    checkAccess();
  }, [requiredPermission, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// 按钮权限控制
interface ActionPermissionProps {
  children: React.ReactNode;
  action: string;
  fallback?: React.ReactNode;
}

export const ActionPermission: React.FC<ActionPermissionProps> = ({
  children,
  action,
  fallback,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean>(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setHasPermission(true);
      return;
    }
    const permitted = checkPermission(user.roleId, 'action', action);
    setHasPermission(permitted);
  }, [action]);

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// 菜单权限检查钩子
export const useMenuPermission = (menuKey: string): boolean => {
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setHasPermission(true);
      return;
    }
    const permitted = checkPermission(user.roleId, 'menu', menuKey);
    setHasPermission(permitted);
  }, [menuKey]);

  return hasPermission;
};

// 操作权限检查钩子
export const useActionPermission = (actionKey: string): boolean => {
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setHasPermission(true);
      return;
    }
    const permitted = checkPermission(user.roleId, 'action', actionKey);
    setHasPermission(permitted);
  }, [actionKey]);

  return hasPermission;
};
