

---

## 第48章 路由系统与页面导航

### 48.1 路由架构

系统使用 React Router DOM v6 实现客户端路由，所有路由定义在 `client/src/app.tsx` 中。

#### 路由配置

```tsx
// client/src/app.tsx
import { Routes, Route } from 'react-router-dom';

import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import InboundPage from '@/pages/InboundPage';
import OutboundPage from '@/pages/OutboundPage';
import InventoryPage from '@/pages/InventoryPage';
import ReconciliationPage from '@/pages/ReconciliationPage';
import StatisticsPage from '@/pages/StatisticsPage';
import CustomerListPage from '@/pages/CustomerListPage';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import ProductListPage from '@/pages/ProductListPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import TemplateConfigPage from '@/pages/TemplateConfigPage';
import PermissionPage from '@/pages/PermissionPage';
import OrganizationPage from '@/pages/OrganizationPage';
import NotFound from '@/pages/NotFound/NotFound';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* 首页 */}
        <Route index element={<DashboardPage />} />

        {/* 核心业务 */}
        <Route path="inbound" element={<InboundPage />} />
        <Route path="outbound" element={<OutboundPage />} />
        <Route path="inventory" element={<InventoryPage />} />

        {/* 财务 */}
        <Route path="reconciliation" element={<ReconciliationPage />} />
        <Route path="statistics" element={<StatisticsPage />} />

        {/* 基础数据 */}
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />

        {/* 系统设置 */}
        <Route path="settings/templates" element={<TemplateConfigPage />} />
        <Route path="settings/permissions" element={<PermissionPage />} />

        {/* 组织管理 */}
        <Route path="organizations" element={<OrganizationPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
```

### 48.2 路由清单

| 路由 | 页面组件 | 文件名 | 类型 | 权限 |
|------|---------|--------|------|------|
| `/` | DashboardPage | DashboardPage.tsx | 一级 | 全部角色 |
| `/inbound` | InboundPage | InboundPage.tsx | 一级 | admin, inbound_operator |
| `/outbound` | OutboundPage | OutboundPage.tsx | 一级 | admin, outbound_operator |
| `/inventory` | InventoryPage | InventoryPage.tsx | 一级 | admin, inbound_operator, outbound_operator |
| `/reconciliation` | ReconciliationPage | ReconciliationPage.tsx | 一级 | admin, finance |
| `/statistics` | StatisticsPage | StatisticsPage.tsx | 一级 | admin, finance, viewer |
| `/customers` | CustomerListPage | CustomerListPage.tsx | 一级 | admin |
| `/customers/:id` | CustomerDetailPage | CustomerDetailPage.tsx | 二级 | admin |
| `/products` | ProductListPage | ProductListPage.tsx | 一级 | admin |
| `/products/:id` | ProductDetailPage | ProductDetailPage.tsx | 二级 | admin |
| `/settings/templates` | TemplateConfigPage | TemplateConfigPage.tsx | 一级 | admin |
| `/settings/permissions` | PermissionPage | PermissionPage.tsx | 一级 | super_admin |
| `/organizations` | OrganizationPage | OrganizationPage.tsx | 一级 | 全部角色（登录后） |

### 48.3 导航配置

#### 侧边栏导航项

```typescript
const NAV_ITEMS = [
  {
    label: '工作台',
    path: '/',
    icon: Dashboard,
    roles: ['super_admin', 'admin', 'finance', 'inbound_operator', 'outbound_operator', 'member', 'viewer'],
  },
  {
    label: '来货登记',
    path: '/inbound',
    icon: Inbox,
    roles: ['super_admin', 'admin', 'inbound_operator'],
  },
  {
    label: '快速发货',
    path: '/outbound',
    icon: Outbox,
    roles: ['super_admin', 'admin', 'outbound_operator'],
  },
  {
    label: '库存管理',
    path: '/inventory',
    icon: Package,
    roles: ['super_admin', 'admin', 'inbound_operator', 'outbound_operator'],
  },
  {
    label: '智能对账',
    path: '/reconciliation',
    icon: FileText,
    roles: ['super_admin', 'admin', 'finance'],
  },
  {
    label: '数据统计',
    path: '/statistics',
    icon: BarChart,
    roles: ['super_admin', 'admin', 'finance', 'viewer'],
  },
  {
    label: '基础数据',
    path: '/customers',
    icon: Database,
    roles: ['super_admin', 'admin'],
    children: [
      { label: '客户管理', path: '/customers' },
      { label: '产品管理', path: '/products' },
    ],
  },
  {
    label: '系统设置',
    path: '/settings/templates',
    icon: Settings,
    roles: ['super_admin', 'admin'],
    children: [
      { label: '打印模板', path: '/settings/templates' },
      { label: '权限管理', path: '/settings/permissions', roles: ['super_admin'] },
    ],
  },
];
```

#### 导航渲染

```tsx
function Sidebar() {
  const { roles } = useAuth();
  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.some(role => roles.includes(role))
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-primary flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-white/10">
        <span className="text-white font-bold text-lg">热处理管理系统</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-white/10 p-3">
        <UserProfile />
      </div>
    </aside>
  );
}

function NavItem({ item }) {
  const location = useLocation();
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path));

  return (
    <NavLink
      to={item.path}
      className={cn(
        'flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-white/20 text-white border-l-[3px] border-accent'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      )}
    >
      {item.icon && <item.icon className="w-5 h-5" />}
      <span>{item.label}</span>
    </NavLink>
  );
}
```

### 48.4 路由守卫

#### 认证守卫

```tsx
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

#### 角色守卫

```tsx
function RoleGuard({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { hasAnyRole } = useAuth();

  if (!hasAnyRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

#### 组织守卫

```tsx
function TenantGuard({ children }: { children: React.ReactNode }) {
  const { orgCode } = useTenant();
  const location = useLocation();

  // 组织选择页面不需要检查
  if (location.pathname === '/organizations') {
    return <>{children}</>;
  }

  if (!orgCode) {
    return <Navigate to="/organizations" replace />;
  }

  return <>{children}</>;
}
```

### 48.5 页面跳转

#### 编程式导航

```typescript
import { useNavigate, Link, NavLink } from 'react-router-dom';

// 方式1：useNavigate
const navigate = useNavigate();
navigate('/customers/123');
navigate(-1); // 后退
navigate('/', { replace: true }); // 替换历史

// 方式2：Link 组件
<Link to="/customers/123">查看详情</Link>

// 方式3：NavLink（带 active 状态）
<NavLink to="/customers" className={({ isActive }) => isActive ? 'active' : ''}>
  客户管理
</NavLink>
```

**禁止使用 `window.location.href`**，必须用 React Router 导航。

#### 分享链接

```typescript
import { resolveAppUrl } from '@lark-apaas/client-toolkit/utils/resolveAppUrl';

// 生成分享链接
const shareUrl = resolveAppUrl(`/customers/${id}`);
```

### 48.6 路由参数

#### useParams

```tsx
function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id!),
  });

  if (!customer) return <Loading />;
  return <CustomerDetail customer={customer} />;
}
```

#### useSearchParams

```tsx
function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('q') || '';

  const handleSearch = (q: string) => {
    setSearchParams({ q, page: '1' });
  };

  const handlePage = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', String(newPage));
      return prev;
    });
  };
}
```

### 48.7 404 页面

```tsx
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl font-bold text-muted-foreground">404</div>
      <p className="text-muted-foreground">页面不存在</p>
      <Button asChild>
        <Link to="/">返回首页</Link>
      </Button>
    </div>
  );
}
```

### 48.8 布局组件

```tsx
function Layout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-60 p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

`<Outlet />` 渲染匹配的子路由组件。

### 48.9 移动端适配

```tsx
function Layout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* 移动端顶栏 */}
      {isMobile && (
        <header className="sticky top-0 z-50 bg-primary h-16 flex items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-white" />
          </Button>
          <span className="text-white font-bold ml-3">热处理管理系统</span>
        </header>
      )}

      {/* 移动端抽屉侧边栏 */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0 bg-primary">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* 桌面端固定侧边栏 */}
      {!isMobile && <Sidebar />}

      {/* 内容区 */}
      <main className={cn(isMobile ? 'p-4' : 'ml-60 p-6')}>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```
