

---

## 第42章 权限与角色系统完整规格

### 42.1 系统架构

权限系统采用 RBAC（Role-Based Access Control）模型，通过角色绑定权限，用户分配角色实现访问控制。

#### 权限层级

```
超级管理员 (super_admin)
├── 管理员 (admin)
│   ├── 财务人员 (finance)
│   ├── 收货员 (inbound_operator)
│   ├── 发货员 (outbound_operator)
│   └── 普通成员 (member)
└── 只读用户 (viewer)
```

### 42.2 角色定义

| 角色 | 标识 | 菜单权限 | 数据权限 | 操作权限 |
|------|------|---------|---------|---------|
| 超级管理员 | `super_admin` | 全部菜单 | 全部数据 | 全部操作+系统设置 |
| 管理员 | `admin` | 全部业务菜单 | 全部业务数据 | 全部业务操作 |
| 财务人员 | `finance` | 工作台、对账、统计 | 对账相关数据 | 对账操作+查看 |
| 收货员 | `inbound_operator` | 工作台、来货登记、库存 | 来货登记数据 | 来货登记+库存查看 |
| 发货员 | `outbound_operator` | 工作台、快速发货、库存 | 发货数据 | 快速发货+库存查看 |
| 普通成员 | `member` | 工作台 | 自己创建的数据 | 查看自己的数据 |
| 只读用户 | `viewer` | 工作台、统计 | 全部数据只读 | 仅查看，无操作 |

### 42.3 菜单权限映射

```typescript
const MENU_PERMISSIONS = {
  '/': ['super_admin', 'admin', 'finance', 'inbound_operator', 'outbound_operator', 'member', 'viewer'],
  '/inbound': ['super_admin', 'admin', 'inbound_operator'],
  '/outbound': ['super_admin', 'admin', 'outbound_operator'],
  '/inventory': ['super_admin', 'admin', 'inbound_operator', 'outbound_operator'],
  '/reconciliation': ['super_admin', 'admin', 'finance'],
  '/statistics': ['super_admin', 'admin', 'finance', 'viewer'],
  '/customers': ['super_admin', 'admin'],
  '/products': ['super_admin', 'admin'],
  '/settings/templates': ['super_admin', 'admin'],
  '/settings/permissions': ['super_admin'],
};
```

### 42.4 操作权限矩阵

| 操作 | super_admin | admin | finance | inbound_op | outbound_op | member | viewer |
|------|:-----------:|:-----:|:-------:|:----------:|:-----------:|:------:|:------:|
| 创建客户 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 编辑客户 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 删除客户 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 创建产品 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 来货登记 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 快速发货 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 查看库存 | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| 对账操作 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 查看统计 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| 配置模板 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 管理权限 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 管理组织 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 42.5 数据权限

```typescript
type DataScope = 'all' | 'department' | 'self';

const DATA_SCOPE: Record<string, DataScope> = {
  super_admin: 'all',
  admin: 'all',
  finance: 'all',
  inbound_operator: 'self',
  outbound_operator: 'self',
  member: 'self',
  viewer: 'all',
};
```

- `all`：可查看所有数据
- `self`：仅可查看自己创建的数据

### 42.6 前端权限控制

#### useAuth Hook

```typescript
function useAuth() {
  const { user } = useCurrentUserProfile();
  const roles = user?.roles || [];

  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (roleList: string[]) => roleList.some(r => roles.includes(r));
  const hasAllRoles = (roleList: string[]) => roleList.every(r => roles.includes(r));
  const isSuperAdmin = () => roles.includes('super_admin');
  const isAdmin = () => hasAnyRole(['super_admin', 'admin']);

  return { roles, hasRole, hasAnyRole, hasAllRoles, isSuperAdmin, isAdmin };
}
```

#### 菜单过滤

```typescript
function filterMenuByRole(menuItems: NavItem[], roles: string[]): NavItem[] {
  return menuItems.filter(item => {
    const allowedRoles = MENU_PERMISSIONS[item.path];
    if (!allowedRoles) return true;
    return allowedRoles.some(role => roles.includes(role));
  });
}
```

#### 路由守卫

```tsx
function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const { roles } = useAuth();
  const hasAccess = allowedRoles.some(role => roles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// 路由配置
<Route
  path="/settings/permissions"
  element={
    <ProtectedRoute allowedRoles={['super_admin']}>
      <PermissionPage />
    </ProtectedRoute>
  }
/>
```

#### 按钮级控制

```tsx
function CanAccess({ roles, children, fallback = null }: { roles: string[]; children: ReactNode; fallback?: ReactNode }) {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(roles) ? <>{children}</> : <>{fallback}</>;
}

// 使用
<CanAccess roles={['super_admin', 'admin']}>
  <Button onClick={handleDelete}>删除</Button>
</CanAccess>
```

### 42.7 后端权限控制

#### 请求上下文

```typescript
// req.userContext 包含用户信息
interface UserContext {
  userId: string;
  tenantId: string;
  appId: string;
  env: 'preview' | 'runtime';
  userName: string;
  roles: string[];  // 用户角色列表
}
```

#### 角色校验装饰器

```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// 使用
@Roles('super_admin', 'admin')
@NeedLogin()
@Delete(':id')
async deleteCustomer(@Param('id') id: string, @Req() req: Request) {
  // 只有 super_admin 和 admin 可以删除
  return this.customerService.delete(id);
}
```

#### 角色守卫

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const userRoles = request.userContext?.roles || [];

    return requiredRoles.some(role => userRoles.includes(role));
  }
}
```

#### 数据范围过滤

```typescript
async findAll(db: PostgresJsDatabase, userContext: UserContext, params: ListDto) {
  const scope = DATA_SCOPE[userContext.roles[0]] || 'self';

  const conditions = [];
  if (params.search) conditions.push(ilike(customers.name, `%${params.search}%`));

  // 数据范围控制
  if (scope === 'self') {
    conditions.push(eq(customers.createdBy, userContext.userId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(customers).where(where);
}
```

### 42.8 权限管理页面

#### 角色管理

```
权限管理页面
├── 角色列表
│   ├── 角色名称
│   ├── 角色描述
│   ├── 用户数量
│   └── 操作（编辑/删除）
├── 角色编辑
│   ├── 基本信息（名称、描述）
│   ├── 菜单权限（勾选可访问的菜单）
│   ├── 操作权限（勾选可执行的操作）
│   └── 数据范围（全部/部门/个人）
└── 用户新增/编辑
    ├── 用户信息
    ├── 角色分配
    └── 状态管理
```

#### 操作日志

```typescript
// 操作日志记录
async function logOperation(db: PostgresJsDatabase, params: {
  userId: string;
  module: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
}) {
  await db.insert(operationLogs).values({
    userId: params.userId,
    module: params.module,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    description: params.description,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    requestData: JSON.stringify(request.body),
  });
}
```

### 42.9 组织级权限

在多租户架构下，权限分为两层：

1. **组织级权限**（主库 organization_user 表）：
   - `super_admin` — 组织超级管理员
   - `admin` — 组织管理员
   - `member` — 组织普通成员

2. **业务级权限**（租户库 operation_log + 前端控制）：
   - `finance` — 财务人员
   - `inbound_operator` — 收货员
   - `outbound_operator` — 发货员
   - `viewer` — 只读用户

组织级权限存储在主库，业务级权限通过前端菜单和后端接口校验实现。
