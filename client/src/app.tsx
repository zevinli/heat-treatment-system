import React, { lazy, Suspense } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import NotFound from './pages/NotFound/NotFound';
import LandingPage from './pages/LandingPage/LandingPage';
import { PermissionGuard } from './components/PermissionGuard';
import { getCurrentUser } from './lib/auth-session';
import { TenantProvider, needsTenantSelection } from './contexts/TenantContext';

const Layout = lazy(() => import('./components/Layout'));
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const OrganizationPage = lazy(() => import('./pages/OrganizationPage/OrganizationPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage/DashboardPage'));
const InboundPage = lazy(() => import('./pages/InboundPage/InboundPage'));
const OutboundPage = lazy(() => import('./pages/OutboundPage/OutboundPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage/InventoryPage'));
const ReconciliationPage = lazy(() => import('./pages/ReconciliationPage/ReconciliationPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage/StatisticsPage'));
const CustomerAnalysisPage = lazy(() => import('./pages/StatisticsPage/CustomerAnalysisPage'));
const InventoryAnalysisPage = lazy(() => import('./pages/StatisticsPage/InventoryAnalysisPage'));
const ProductAnalysisPage = lazy(() => import('./pages/StatisticsPage/ProductAnalysisPage'));
const FinanceAnalysisPage = lazy(() => import('./pages/StatisticsPage/FinanceAnalysisPage'));
const CustomerListPage = lazy(() => import('./pages/CustomerListPage/CustomerListPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage/CustomerDetailPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage/ProductListPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage/ProductDetailPage'));
const TemplateConfigPage = lazy(() => import('./pages/TemplateConfigPage/TemplateConfigPage'));
const DisplaySettingsPage = lazy(() => import('./pages/DisplaySettingsPage/DisplaySettingsPage'));
const PermissionPage = lazy(() => import('./pages/PermissionPage/PermissionPage'));
const UserManualPage = lazy(() => import('./pages/UserManualPage/UserManualPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage/ProfilePage'));
const OperationLogPage = lazy(() => import('./pages/OperationLogPage/OperationLogPage'));
const FeatureFlagsPage = lazy(() => import('./pages/FeatureFlagsPage/FeatureFlagsPage'));
const OrderListPage = lazy(() => import('./pages/OrderListPage/OrderListPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const OrganizationManagePage = lazy(() => import('./pages/OrganizationManagePage/OrganizationManagePage'));
const FeishuSettingsPage = lazy(() => import('./pages/FeishuSettingsPage/FeishuSettingsPage'));

const RouteFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
    <div className="flex items-center gap-3 text-muted-foreground">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span>页面加载中…</span>
    </div>
  </div>
);

// 登录保护路由
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUser();
  const authToken = localStorage.getItem('authToken');
  const location = useLocation();

  if (!user || !authToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (location.pathname !== '/organizations' && needsTenantSelection()) {
    return <Navigate to="/organizations" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// 已登录用户跳转
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUser();
  const authToken = localStorage.getItem('authToken');

  if (user && authToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const RoutesComponent = () => {
  return (
    
      <TenantProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
          {/* 公开路由 */}
          <Route index element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          {/* 组织选择页面 - 受保护但独立于Layout */}
          <Route
            path="/organizations"
            element={
              <ProtectedRoute>
                <OrganizationPage />
              </ProtectedRoute>
            }
          />

          {/* 受保护路由 */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <PermissionGuard requiredPermission="dashboard">
                  <DashboardPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/inbound"
              element={
                <PermissionGuard requiredPermission="inbound">
                  <InboundPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/outbound"
              element={
                <PermissionGuard requiredPermission="outbound">
                  <OutboundPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/inventory"
              element={
                <PermissionGuard requiredPermission="inventory">
                  <InventoryPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/reconciliation"
              element={
                <PermissionGuard requiredPermission="reconciliation">
                  <ReconciliationPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/statistics"
              element={
                <PermissionGuard requiredPermission="statistics">
                  <StatisticsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/statistics/customer"
              element={
                <PermissionGuard requiredPermission="statistics">
                  <CustomerAnalysisPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/statistics/inventory"
              element={
                <PermissionGuard requiredPermission="statistics">
                  <InventoryAnalysisPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/statistics/product"
              element={
                <PermissionGuard requiredPermission="statistics">
                  <ProductAnalysisPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/statistics/finance"
              element={
                <PermissionGuard requiredPermission="statistics">
                  <FinanceAnalysisPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/customers"
              element={
                <PermissionGuard requiredPermission="customers">
                  <CustomerListPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <PermissionGuard requiredPermission="customers">
                  <CustomerDetailPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/products"
              element={
                <PermissionGuard requiredPermission="products">
                  <ProductListPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/products/:id"
              element={
                <PermissionGuard requiredPermission="products">
                  <ProductDetailPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/settings/templates"
              element={
                <PermissionGuard requiredPermission="templates">
                  <TemplateConfigPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/settings/display"
              element={
                <PermissionGuard requiredPermission="display">
                  <DisplaySettingsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/settings/feishu"
              element={
                <PermissionGuard requiredPermission="permissions">
                  <FeishuSettingsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/settings/permissions"
              element={
                <PermissionGuard requiredPermission="permissions" platformOnly>
                  <PermissionPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/settings/manual"
              element={
                <PermissionGuard requiredPermission="manual">
                  <UserManualPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/settings/feature-flags"
              element={
                <PermissionGuard requiredPermission="featureFlags">
                  <FeatureFlagsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <PermissionGuard requiredPermission="profile">
                  <ProfilePage />
                </PermissionGuard>
              }
            />
            <Route
              path="/operation-logs"
              element={
                <PermissionGuard requiredPermission="logs">
                  <OperationLogPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/orders"
              element={
                <PermissionGuard requiredPermission="orders">
                  <OrderListPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/admin"
              element={
                <PermissionGuard requiredPermission="admin">
                  <AdminDashboard />
                </PermissionGuard>
              }
            />
            <Route
              path="/tenant/manage"
              element={
                <PermissionGuard requiredPermission="admin">
                  <OrganizationManagePage />
                </PermissionGuard>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </TenantProvider>
    
  );
};

export default RoutesComponent;
