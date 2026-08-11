import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { checkPermission, getCurrentUser } from '@/lib/auth-session';
import { Loader2 } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  platformOnly?: boolean;
  fallback?: React.ReactNode;
}

// 权限守卫组件
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  platformOnly = false,
  fallback,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = () => {
      const user = getCurrentUser();

      // 受保护页面没有有效用户时默认拒绝，不能回退为“演示管理员”。
      if (!user) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      if (platformOnly && user.accountRoleId !== '1') {
        setHasPermission(false);
        setIsLoading(false);
        toast.error('仅平台管理员可访问全局账号管理');
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
  }, [requiredPermission, platformOnly, location.pathname]);

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
    return <Navigate to="/dashboard" replace />;
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
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setHasPermission(false);
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
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setHasPermission(false);
      return;
    }
    const permitted = checkPermission(user.roleId, 'menu', menuKey);
    setHasPermission(permitted);
  }, [menuKey]);

  return hasPermission;
};

// 操作权限检查钩子
export const useActionPermission = (actionKey: string): boolean => {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setHasPermission(false);
      return;
    }
    const permitted = checkPermission(user.roleId, 'action', actionKey);
    setHasPermission(permitted);
  }, [actionKey]);

  return hasPermission;
};
