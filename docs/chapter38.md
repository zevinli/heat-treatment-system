

---

## 第38章 API 层与请求架构

### 38.1 架构概述

系统的 API 层分为前端请求层和后端接口层，遵循 RESTful JSON API 规范。

#### 前端 API 层

```
client/src/api/
├── index.ts           # 桶导出（聚合文件）
├── auth.ts            # 认证相关 API
├── customer.ts        # 客户管理 API
├── product.ts         # 产品管理 API
├── inbound.ts         # 来货登记 API
├── outbound.ts        # 快速发货 API
├── inventory.ts       # 库存管理 API
├── reconciliation.ts  # 智能对账 API
├── statistics.ts      # 数据统计 API
├── print.ts           # 打印模板 API
├── permission.ts      # 权限管理 API
├── tenant.ts          # 组织管理 API
└── types.ts           # API 通用类型
```

#### 后端 API 层

```
server/modules/
├── auth/              # 认证模块
├── customer/          # 客户管理模块
├── product/           # 产品管理模块
├── inbound/           # 来货登记模块
├── outbound/          # 快速发货模块
├── inventory/         # 库存管理模块
├── reconciliation/    # 智能对账模块
├── statistics/        # 数据统计模块
├── print/             # 打印模板模块
├── permission/        # 权限管理模块
├── tenant/            # 组织管理模块
└── view/              # 视图渲染模块（平台内置）
```

### 38.2 前端请求工具

#### axiosForBackend

```typescript
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

// 方式1：配置对象
const response = await axiosForBackend({
  url: '/api/customers',
  method: 'GET',
  params: { page: 1, pageSize: 20 },
});

// 方式2：实例方法
const response = await axiosForBackend.get('/api/customers');
const response = await axiosForBackend.post('/api/customers', data);
const response = await axiosForBackend.put('/api/customers/123', data);
const response = await axiosForBackend.delete('/api/customers/123');
```

**禁止使用 fetch**，必须使用 `axiosForBackend`，否则会报 `Tenant not found`。

#### 请求拦截器

`axiosForBackend` 内置拦截器，自动添加：
- `X-Organization-Code` 请求头（从 localStorage 获取当前组织编码）
- `x-larkgw-suda-webuser` 请求头（用户身份）
- Base URL 前缀（`/api` 或 `/openapi`）

#### 响应拦截器

```typescript
// 统一错误处理
axiosForBackend.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 未授权，跳转登录
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // 无权限
      toast.error('无权限执行此操作');
    } else if (error.response?.status === 404) {
      // 资源不存在
      toast.error('请求的资源不存在');
    } else if (error.response?.status >= 500) {
      // 服务器错误
      toast.error('服务器内部错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);
```

### 38.3 API 模块封装模式

每个前端 API 模块遵循统一的封装模式：

```typescript
// client/src/api/customer.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { Customer, CustomerListParams, CustomerListResponse } from '@shared/api.interface';

export async function getCustomers(params: CustomerListParams): Promise<CustomerListResponse> {
  const { data } = await axiosForBackend.get<CustomerListResponse>('/api/customers', { params });
  return data;
}

export async function getCustomerById(id: string): Promise<Customer> {
  const { data } = await axiosForBackend.get<Customer>(`/api/customers/${id}`);
  return data;
}

export async function createCustomer(payload: Omit<Customer, 'id'>): Promise<Customer> {
  const { data } = await axiosForBackend.post<Customer>('/api/customers', payload);
  return data;
}

export async function updateCustomer(id: string, payload: Partial<Customer>): Promise<Customer> {
  const { data } = await axiosForBackend.put<Customer>(`/api/customers/${id}`, payload);
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/customers/${id}`);
}
```

### 38.4 桶导出（index.ts）

```typescript
// client/src/api/index.ts
export * as authApi from './auth';
export * as customerApi from './customer';
export * as productApi from './product';
export * as inboundApi from './inbound';
export * as outboundApi from './outbound';
export * as inventoryApi from './inventory';
export * as reconciliationApi from './reconciliation';
export * as statisticsApi from './statistics';
export * as printApi from './print';
export * as permissionApi from './permission';
export * as tenantApi from './tenant';
```

使用时：
```typescript
import { customerApi } from '@/api';
const customers = await customerApi.getCustomers({ page: 1, pageSize: 20 });
```

### 38.5 API 路径约定

| 前缀 | 用途 | 认证 | 示例 |
|------|------|------|------|
| `/api` | 内部业务接口 | 需登录 | `/api/customers` |
| `/openapi` | 对外开放接口 | API Key | `/openapi/inbound/create` |

#### 路由设计规范

1. **RESTful 路径**：
   - GET `/api/customers` — 列表
   - GET `/api/customers/:id` — 详情
   - POST `/api/customers` — 创建
   - PUT `/api/customers/:id` — 更新
   - DELETE `/api/customers/:id` — 删除

2. **静态路由在动态路由前**：
   ```
   GET /api/customers/search     ✅
   GET /api/customers/:id        ✅
   ```
   而非：
   ```
   GET /api/customers/:id        ❌ (:id 会匹配 "search")
   GET /api/customers/search
   ```

3. **描述性路径**：复杂操作使用动词路径
   ```
   POST /api/inbound/:id/print        — 打印入库单
   POST /api/outbound/:id/close       — 关闭出库单
   POST /api/reconciliation/:id/match — 对账匹配
   ```

### 38.6 分页响应格式

#### 传统分页

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

#### 游标分页

```typescript
interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor: string | undefined;
  hasMore: boolean;
}
```

### 38.7 后端 Controller 模式

```typescript
@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async list(@Query() query: CustomerListDto) {
    return this.customerService.findAll(query);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.customerService.findById(id);
  }

  @NeedLogin()
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCustomerDto) {
    const { userId } = req.userContext;
    return this.customerService.create({ ...dto, createdBy: userId });
  }

  @NeedLogin()
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.customerService.delete(id);
  }
}
```

### 38.8 后端 Service 模式

```typescript
@Injectable()
export class CustomerService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(params: CustomerListDto): Promise<PaginatedResponse<Customer>> {
    const { page, pageSize, search, material } = params;
    const conditions = [];

    if (search) {
      conditions.push(ilike(customers.name, `%${search}%`));
    }
    if (material) {
      conditions.push(eq(customers.material, material));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db.select().from(customers).where(where)
        .limit(pageSize).offset((page - 1) * pageSize),
      this.db.select({ count: count() }).from(customers).where(where),
    ]);

    return {
      items,
      total: Number(totalResult[0].count),
      page,
      pageSize,
    };
  }

  async findById(id: string): Promise<Customer> {
    const result = await this.db.select().from(customers).where(eq(customers.id, id));
    if (!result[0]) throw new NotFoundException('客户不存在');
    return result[0];
  }

  async create(data: NewCustomer): Promise<Customer> {
    const [result] = await this.db.insert(customers).values(data).returning();
    return result;
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const [result] = await this.db.update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    if (!result) throw new NotFoundException('客户不存在');
    return result;
  }

  async delete(id: string): Promise<void> {
    const [result] = await this.db.delete(customers)
      .where(eq(customers.id, id))
      .returning({ id: customers.id });
    if (!result) throw new NotFoundException('客户不存在');
  }
}
```

### 38.9 DTO 校验

```typescript
import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';

export class CustomerListDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  material?: string;

  @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @IsInt() @Min(1) @Max(100)
  pageSize?: number = 20;
}

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional() @IsString()
  contactPerson?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  address?: string;
}
```

### 38.10 错误处理

#### 全局错误 Filter

```typescript
@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    response.status(status).json({
      code: status,
      message: typeof errorResponse === 'string' ? errorResponse : errorResponse['message'],
      timestamp: new Date().toISOString(),
    });
  }
}
```

#### 异常类型映射

| 场景 | 异常类 | HTTP 状态码 |
|------|--------|------------|
| 资源不存在 | NotFoundException | 404 |
| 参数/状态非法 | BadRequestException | 400 |
| 并发冲突/库存不足 | ConflictException | 409 |
| 无权限 | ForbiddenException | 403 |
| 未登录 | UnauthorizedException | 401 |

### 38.11 请求流程

```
前端                              后端
  │                                 │
  ├─ axiosForBackend.get()          │
  │  ├─ 添加 X-Organization-Code    │
  │  ├─ 添加用户认证头              │
  │  └─ 发送 HTTP 请求 ──────────→  │
  │                                 ├─ TenantMiddleware 提取 orgCode
  │                                 ├─ AuthGuard 验证用户身份
  │                                 ├─ Controller 接收请求
  │                                 ├─ DTO 校验 (class-validator)
  │                                 ├─ Service 业务逻辑
  │                                 │  ├─ 获取租户 DB 连接
  │                                 │  ├─ Drizzle ORM 操作
  │                                 │  └─ 返回结果
  │                                 ├─ 全局 Filter 拦截异常
  │  ←─ HTTP JSON 响应 ←───────────┤
  │                                 │
  ├─ 响应拦截器处理                 │
  │  ├─ 2xx: 返回 data              │
  │  ├─ 401: 跳转登录               │
  │  ├─ 403: 提示无权限              │
  │  └─ 5xx: 提示服务器错误         │
  └─ 完成                            │
```

### 38.12 shared/api.interface.ts

前后端共享的类型定义文件：

```typescript
// shared/api.interface.ts

// 客户
export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  material?: string;
  createdAt: string;
  updatedAt: string;
}

// 客户列表请求参数
export interface CustomerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  material?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 游标分页响应
export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}
```

**规范**：
1. 新建/修改后端接口时，必须先完成 `shared/api.interface.ts` 中的类型定义
2. 属性统一 camelCase
3. timestamptz 字段声明为 `string`（JSON 序列化后为 ISO string）
4. shared 目录禁止反向引用 `@server/*` 或 `@client/*`
