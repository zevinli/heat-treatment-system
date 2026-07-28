

---

## 第39章 多租户架构深度解析

### 39.1 架构模式

系统采用 **Database-per-Tenant**（独立数据库）模式实现多租户隔离。每个组织（公司）拥有完全独立的物理数据库，实现最高级别的数据隔离。

#### 隔离级别对比

| 隔离模式 | 隔离级别 | 实现方式 | 数据安全 | 运维复杂度 | 适用场景 |
|---------|---------|---------|---------|-----------|---------|
| **Database-per-Tenant** | 最高 | 独立数据库 | ✅ 物理隔离 | 高 | 本系统采用 |
| Schema-per-Tenant | 中 | 独立Schema | ✅ 逻辑隔离 | 中 | 中等安全需求 |
| Row-level (共享表+租户ID) | 低 | tenant_id 字段 | ⚠️ 逻辑隔离 | 低 | 低安全需求 |

### 39.2 核心组件

#### 组件清单

| 组件 | 文件 | 职责 |
|------|------|------|
| 组织管理 | `server/modules/tenant/tenant.module.ts` | 组织 CRUD |
| 租户连接服务 | `server/modules/tenant/tenant-connection.service.ts` | 动态获取租户 DB 连接 |
| 租户中间件 | `server/common/middleware/tenant.middleware.ts` | 请求头提取 orgCode |
| 租户装饰器 | `server/common/decorators/tenant.decorator.ts` | 获取租户上下文 |
| 前端租户上下文 | `client/src/contexts/TenantContext.tsx` | 前端租户状态管理 |
| 组织选择页 | `client/src/pages/OrganizationPage.tsx` | 登录后选择组织 |

### 39.3 主数据库（Master DB）

主数据库存储所有组织级别的配置数据，不属于任何单个租户。

#### 表结构

```sql
-- 组织主表
CREATE TABLE organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_code VARCHAR(50) UNIQUE NOT NULL,    -- 组织编码（唯一）
  org_name VARCHAR(200) NOT NULL,           -- 组织名称
  db_host VARCHAR(200) NOT NULL,            -- 租户数据库地址
  db_port INTEGER DEFAULT 5432,             -- 数据库端口
  db_name VARCHAR(100) NOT NULL,            -- 数据库名（db_tenant_<org_code>）
  db_user VARCHAR(100) NOT NULL,            -- 数据库用户名
  db_password TEXT NOT NULL,                -- 数据库密码（加密存储）
  status VARCHAR(20) DEFAULT 'active',      -- 状态: active/inactive/suspended
  plan VARCHAR(20) DEFAULT 'standard',      -- 套餐: free/standard/premium
  max_users INTEGER DEFAULT 50,             -- 最大用户数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 组织用户关系表
CREATE TABLE organization_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,             -- 妙搭平台用户ID
  role VARCHAR(20) DEFAULT 'member',         -- 角色: super_admin/admin/member
  status VARCHAR(20) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- 组织邀请表
CREATE TABLE organization_invite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
  email VARCHAR(200) NOT NULL,
  invite_code VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  invited_by VARCHAR(100) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending',      -- pending/accepted/expired
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 39.4 租户数据库

每个租户拥有独立的数据库，包含所有业务表（客户、产品、入库单、出库单等）。表结构与主数据库完全独立。

#### 租户数据库命名

```
db_tenant_{org_code}
```

示例：`db_tenant_acme_corp`

#### 租户数据库包含的表

| 表 | 用途 |
|---|------|
| customer | 客户信息 |
| product | 产品信息 |
| inbound_record | 入库记录 |
| inbound_item | 入库明细 |
| outbound_record | 出库记录 |
| outbound_item | 出库明细 |
| inventory | 库存 |
| reconciliation | 对账记录 |
| print_template | 打印模板 |
| operation_log | 操作日志 |

### 39.5 TenantConnectionService

```typescript
@Injectable()
export class TenantConnectionService {
  private readonly logger = new Logger(TenantConnectionService.name);
  private readonly connectionPool = new Map<string, PostgresJsDatabase>();
  private readonly masterDb: PostgresJsDatabase;

  constructor(@Inject(DRIZZLE_DATABASE) masterDb: PostgresJsDatabase) {
    this.masterDb = masterDb;
  }

  /**
   * 获取租户数据库连接
   * 1. 先从连接池缓存查找
   * 2. 未命中则查询主库获取租户配置
   * 3. 创建新连接并缓存
   */
  async getTenantDb(orgCode: string): Promise<PostgresJsDatabase> {
    // 1. 检查缓存
    if (this.connectionPool.has(orgCode)) {
      return this.connectionPool.get(orgCode)!;
    }

    // 2. 查询主库获取租户配置
    const [org] = await this.masterDb
      .select()
      .from(organization)
      .where(eq(organization.orgCode, orgCode));

    if (!org) {
      throw new NotFoundException(`组织 ${orgCode} 不存在`);
    }

    if (org.status !== 'active') {
      throw new ForbiddenException(`组织 ${orgCode} 已被暂停`);
    }

    // 3. 创建租户数据库连接
    const tenantDb = await this.createTenantConnection(org);

    // 4. 缓存连接
    this.connectionPool.set(orgCode, tenantDb);

    return tenantDb;
  }

  private async createTenantConnection(org: Organization): Promise<PostgresJsDatabase> {
    const connectionUrl = `postgresql://${org.dbUser}:${org.dbPassword}@${org.dbHost}:${org.dbPort}/${org.dbName}`;

    const client = postgres(connectionUrl, {
      max: 10,                    // 连接池大小
      idle_timeout: 30000,        // 空闲超时 30s
      connect_timeout: 10000,     // 连接超时 10s
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    const schema = await import('@server/database/schema');
    return drizzle(client, { schema });
  }

  /**
   * 清理指定租户的连接缓存
   */
  clearConnection(orgCode: string): void {
    this.connectionPool.delete(orgCode);
    this.logger.log(`已清理租户 ${orgCode} 的数据库连接`);
  }

  /**
   * 清理所有连接
   */
  clearAllConnections(): void {
    this.connectionPool.clear();
    this.logger.log('已清理所有租户数据库连接');
  }
}
```

### 39.6 TenantMiddleware

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantConnectionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. 从多种来源提取 orgCode
    const orgCode = this.extractOrgCode(req);

    if (!orgCode) {
      // 无 orgCode 的请求（如登录、组织选择）直接放行
      return next();
    }

    try {
      // 2. 获取租户数据库连接
      const tenantDb = await this.tenantService.getTenantDb(orgCode);

      // 3. 附加到请求对象
      (req as any).tenantDb = tenantDb;
      (req as any).orgCode = orgCode;

      next();
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({ message: `组织 ${orgCode} 不存在` });
      } else if (error instanceof ForbiddenException) {
        res.status(403).json({ message: `组织 ${orgCode} 已被暂停` });
      } else {
        res.status(500).json({ message: '租户数据库连接失败' });
      }
    }
  }

  private extractOrgCode(req: Request): string | null {
    // 优先级：请求头 > 子域名 > 查询参数
    return (
      req.headers['x-organization-code'] as string ||
      this.extractFromSubdomain(req) ||
      (req.query.orgCode as string) ||
      null
    );
  }

  private extractFromSubdomain(req: Request): string | null {
    const host = req.headers.host;
    if (!host) return null;

    const parts = host.split('.');
    // 如 acme.example.com → "acme"
    if (parts.length >= 3) {
      return parts[0];
    }
    return null;
  }
}
```

### 39.7 租户装饰器

```typescript
// 获取完整租户上下文
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      orgCode: request.orgCode,
      tenantDb: request.tenantDb,
    };
  }
);

// 直接获取租户数据库连接
export const CurrentTenantDb = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.tenantDb) {
      throw new BadRequestException('未找到组织上下文，请先选择组织');
    }
    return request.tenantDb;
  }
);
```

#### Controller 使用示例

```typescript
@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async list(
    @CurrentTenantDb() db: PostgresJsDatabase,
    @Query() query: CustomerListDto
  ) {
    return this.customerService.findAll(db, query);
  }

  @NeedLogin()
  @Post()
  async create(
    @CurrentTenantDb() db: PostgresJsDatabase,
    @Req() req: Request,
    @Body() dto: CreateCustomerDto
  ) {
    const { userId } = req.userContext;
    return this.customerService.create(db, { ...dto, createdBy: userId });
  }
}
```

### 39.8 前端租户上下文

```typescript
// client/src/contexts/TenantContext.tsx

interface TenantContextValue {
  orgCode: string | null;
  orgName: string | null;
  setOrgCode: (code: string) => void;
  clearOrgCode: () => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }) {
  const [orgCode, setOrgCodeState] = useState<string | null>(() => {
    return localStorage.getItem('__global_heat_org_code');
  });
  const [orgName, setOrgName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setOrgCode = useCallback((code: string) => {
    localStorage.setItem('__global_heat_org_code', code);
    setOrgCodeState(code);
  }, []);

  const clearOrgCode = useCallback(() => {
    localStorage.removeItem('__global_heat_org_code');
    setOrgCodeState(null);
    setOrgName(null);
  }, []);

  // 获取组织信息
  useEffect(() => {
    if (!orgCode) return;
    setLoading(true);
    tenantApi.getOrganization(orgCode)
      .then((org) => setOrgName(org.name))
      .finally(() => setLoading(false));
  }, [orgCode]);

  return (
    <TenantContext.Provider value={{ orgCode, orgName, setOrgCode, clearOrgCode, loading }}>
      {children}
    </TenantContext.Provider>
  );
}
```

### 39.9 请求流程

```
1. 用户登录 → 获取用户ID
2. GET /api/tenant/organizations → 获取用户所属组织列表
3. 用户选择组织 → setOrgCode(orgCode) → 存入 localStorage
4. 后续所有请求自动携带 X-Organization-Code 请求头
5. 后端中间件提取 orgCode
6. 验证用户对该组织的访问权限（查 organization_user 表）
7. 获取/创建租户数据库连接
8. 将 tenantDb 附加到 request 对象
9. Controller 通过 @CurrentTenantDb() 获取数据库连接
10. Service 使用 tenantDb 执行业务操作
```

### 39.10 权限模型

| 角色 | 权限 | 数据范围 |
|------|------|---------|
| super_admin | 管理组织配置、邀请成员、查看操作日志 | 主库 + 所有租户库 |
| admin | 管理业务数据（客户、产品、订单等） | 当前租户库 |
| member | 操作自己创建的数据 | 当前租户库（仅自己的数据） |

### 39.11 新建租户流程

```
1. 管理员调用 POST /api/tenant/organizations
   → 在主库 organization 表创建记录
   → 执行初始化 SQL 脚本创建租户数据库
   → 创建所有业务表（customer, product, inbound_record, ...）
   → 插入默认数据（默认打印模板、默认角色权限）
2. 邀请用户加入组织
   → 创建 organization_invite 记录
   → 发送邀请邮件/消息
3. 用户接受邀请
   → 创建 organization_user 记录
   → 用户可选择该组织进入
```

### 39.12 部署注意事项

1. **数据库准备**：创建新租户时需要运行初始化脚本
   ```bash
   ts-node server/scripts/init-tenant-db.ts <org_code>
   ```

2. **网络配置**：应用服务器必须能访问所有租户数据库服务器

3. **备份策略**：每个租户数据库需要独立备份

4. **连接池管理**：
   - 每个租户维护独立的连接池
   - 连接池大小默认 10
   - 空闲超时 30 秒
   - 长时间不活跃的租户连接自动清理

5. **数据迁移**：
   - Schema 变更需要对所有租户数据库执行
   - 使用迁移脚本批量执行
   - 记录迁移版本

### 39.13 异常处理

| 场景 | 异常 | HTTP状态码 | 处理 |
|------|------|-----------|------|
| 组织不存在 | NotFoundException | 404 | 提示用户选择有效组织 |
| 组织已暂停 | ForbiddenException | 403 | 提示联系管理员 |
| 数据库连接失败 | InternalServerError | 500 | 记录日志，提示稍后重试 |
| 用户不属于该组织 | ForbiddenException | 403 | 提示无权访问该组织 |
| 请求未携带 orgCode | 放行（非租户接口） | - | 中间件跳过 |
