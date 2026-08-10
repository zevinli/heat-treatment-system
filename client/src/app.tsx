import React from "react";
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import LoginPage from './pages/LoginPage/LoginPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import InboundPage from './pages/InboundPage/InboundPage';
import OutboundPage from './pages/OutboundPage/OutboundPage';
import InventoryPage from './pages/InventoryPage/InventoryPage';
import ReconciliationPage from './pages/ReconciliationPage/ReconciliationPage';
import StatisticsPage from './pages/StatisticsPage/StatisticsPage';
import CustomerAnalysisPage from './pages/StatisticsPage/CustomerAnalysisPage';
import InventoryAnalysisPage from './pages/StatisticsPage/InventoryAnalysisPage';
import ProductAnalysisPage from './pages/StatisticsPage/ProductAnalysisPage';
import FinanceAnalysisPage from './pages/StatisticsPage/FinanceAnalysisPage';
import CustomerListPage from './pages/CustomerListPage/CustomerListPage';
import CustomerDetailPage from './pages/CustomerDetailPage/CustomerDetailPage';
import ProductListPage from './pages/ProductListPage/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage/ProductDetailPage';
import TemplateConfigPage from './pages/TemplateConfigPage/TemplateConfigPage';
import DisplaySettingsPage from './pages/DisplaySettingsPage/DisplaySettingsPage';
import PermissionPage from './pages/PermissionPage/PermissionPage';
import UserManualPage from './pages/UserManualPage/UserManualPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import OperationLogPage from './pages/OperationLogPage/OperationLogPage';
import FeatureFlagsPage from './pages/FeatureFlagsPage/FeatureFlagsPage';
import OrderListPage from './pages/OrderListPage/OrderListPage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import LandingPage from './pages/LandingPage/LandingPage';
import OrganizationPage from './pages/OrganizationPage/OrganizationPage';
import OrganizationManagePage from './pages/OrganizationManagePage/OrganizationManagePage';
import { PermissionGuard } from './components/PermissionGuard';
import { getCurrentUser } from './pages/PermissionPage/PermissionPage';
import { TenantProvider, needsTenantSelection } from './contexts/TenantContext';

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
              path="/settings/permissions"
              element={
                <PermissionGuard requiredPermission="permissions">
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
      </TenantProvider>
    
  );
};

export default RoutesComponent;
