import React, { createContext, useContext, useState, useEffect } from 'react';

interface TenantInfo {
  orgId: string;
  orgCode: string;
  orgName: string;
}

interface TenantContextType {
  currentTenant: TenantInfo | null;
  setCurrentTenant: (tenant: TenantInfo | null) => void;
  clearTenant: () => void;
  hasTenant: boolean;
}

const TenantContext = createContext<TenantContextType | null>(null);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenantState] = useState<TenantInfo | null>(() => {
    // 从 localStorage 初始化
    if (typeof window !== 'undefined') {
      const orgId = localStorage.getItem('currentOrgId');
      const orgCode = localStorage.getItem('currentOrgCode');
      const orgName = localStorage.getItem('currentOrgName');
      if (orgId && orgCode && orgName) {
        return { orgId, orgCode, orgName };
      }
    }
    return null;
  });

  const setCurrentTenant = (tenant: TenantInfo | null) => {
    setCurrentTenantState(tenant);
    if (tenant) {
      localStorage.setItem('currentOrgId', tenant.orgId);
      localStorage.setItem('currentOrgCode', tenant.orgCode);
      localStorage.setItem('currentOrgName', tenant.orgName);
    } else {
      localStorage.removeItem('currentOrgId');
      localStorage.removeItem('currentOrgCode');
      localStorage.removeItem('currentOrgName');
    }
  };

  const clearTenant = () => {
    setCurrentTenant(null);
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        clearTenant,
        hasTenant: !!currentTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};

// 获取当前租户请求头
export const getTenantHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const orgCode = localStorage.getItem('currentOrgCode');
  return orgCode ? { 'X-Organization-Code': orgCode } : {};
};

// 检查是否需要选择租户
export const needsTenantSelection = (): boolean => {
  if (typeof window === 'undefined') return false;
  const orgCode = localStorage.getItem('currentOrgCode');
  return !orgCode;
};
