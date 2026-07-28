

---

## 第47章 安全与合规规范

### 47.1 认证与授权

#### 认证机制

系统使用平台内置的身份认证服务，基于飞书 SSO 实现单点登录。

| 认证方式 | 说明 | 适用场景 |
|---------|------|---------|
| 飞书 SSO | 飞书内置登录 | 所有用户 |
| Webhook 认证 | API Key | 对外开放接口 |
| Bearer Token | JWT Token | API 调用 |

#### @NeedLogin 装饰器

```typescript
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

// 写操作必须加 @NeedLogin
@NeedLogin()
@Post()
async create(@Req() req: Request, @Body() dto: CreateDto) {
  const { userId } = req.userContext;
  return this.service.create({ ...dto, createdBy: userId });
}

// 读操作默认不需要登录（公开接口）
@Get()
async list(@Query() query: ListDto) {
  return this.service.findAll(query);
}
```

#### 请求头认证

```
Authorization: Bearer <token>
X-Organization-Code: <org_code>
x-larkgw-suda-webuser: <user_info>
```

### 47.2 数据安全

#### 多租户数据隔离

1. **物理隔离**：每个组织拥有独立数据库
2. **连接隔离**：每个请求获取对应的租户数据库连接
3. **权限验证**：中间件验证用户对组织的访问权限

#### 敏感数据保护

| 数据类型 | 保护措施 |
|---------|---------|
| 数据库密码 | 加密存储在主库 organization 表 |
| 用户密码 | 不存储（使用飞书 SSO） |
| API Key | 环境变量注入，不写入代码 |
| 个人信息 | 仅存储必要的用户 ID，不存储敏感个人信息 |
| 操作日志 | 记录操作者和操作内容，不记录敏感数据 |

#### SQL 注入防护

```typescript
// ✅ 使用 Drizzle ORM 参数化查询（自动防注入）
const result = await db.select().from(customers).where(eq(customers.id, id));

// ✅ 被迫写原生 SQL 时，使用 sql 模板标签
const result = await db.execute(sql`SELECT * FROM customer WHERE id = ${id}`);

// ❌ 禁止：字符串拼接 SQL
const result = await db.execute(`SELECT * FROM customer WHERE id = '${id}'`);
```

#### XSS 防护

1. React 默认转义 JSX 中的变量
2. 使用 `dangerouslySetInnerHTML` 时必须先 sanitize
3. 富文本内容通过 Tiptap 编辑器处理（内置 sanitize）

```typescript
import DOMPurify from 'dompurify';

// 渲染用户输入的 HTML 前必须 sanitize
const safeHtml = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

#### CSRF 防护

1. API 仅接受 JSON 请求体（不支持 form-urlencoded）
2. 使用 Bearer Token 认证（非 Cookie）
3. CORS 配置仅允许同源请求

### 47.3 文件上传安全

```typescript
// 文件类型白名单
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new BadRequestException('不支持的文件类型');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException('文件大小超过限制（10MB）');
  }
}
```

### 47.4 接口安全

#### 速率限制

```typescript
// NestJS Throttler 配置
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,    // 60秒
      limit: 100,    // 每分钟100次
    }]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
```

#### 输入校验

```typescript
// 使用 class-validator + DTO
export class CreateCustomerDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
```

#### 输出过滤

```typescript
// Service 返回时过滤敏感字段
async findById(id: string) {
  const result = await this.db.select().from(customers).where(eq(customers.id, id));
  if (!result[0]) throw new NotFoundException();
  const { dbPassword, ...safeData } = result[0]; // 过滤内部字段
  return safeData;
}
```

### 47.5 操作审计

#### 审计日志记录

```typescript
// 审计装饰器
export function AuditLog(module: string, action: string) {
  return SetMetadata('audit', { module, action });
}

// 审计拦截器
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const auditMeta = this.reflector.get('audit', context.getHandler());
    if (!auditMeta) return next.handle();

    const request = context.switchToHttp().getRequest();
    const { userId } = request.userContext;

    return next.handle().pipe(
      tap(() => {
        // 异步记录日志
        this.logService.record({
          userId,
          module: auditMeta.module,
          action: auditMeta.action,
          targetType: request.params.id ? 'record' : 'list',
          targetId: request.params.id,
          description: `${auditMeta.module} - ${auditMeta.action}`,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
      })
    );
  }
}

// 使用
@AuditLog('customer', 'create')
@NeedLogin()
@Post()
async create(@Req() req: Request, @Body() dto: CreateCustomerDto) {
  return this.customerService.create(dto);
}
```

#### 日志查询

```typescript
// 权限管理页面 → 操作日志
GET /api/permission/logs?userId=&module=&action=&startDate=&endDate=&page=1&pageSize=20
```

### 47.6 前端安全

#### Token 存储

```typescript
// Token 存储在内存中（不持久化到 localStorage）
let authToken: string | null = null;

export function setToken(token: string) {
  authToken = token;
}

export function getToken(): string | null {
  return authToken;
}
```

#### 路由守卫

```tsx
// 未登录跳转
function AuthGuard({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// 权限检查
function RoleGuard({ children, roles }) {
  const { hasAnyRole } = useAuth();
  if (!hasAnyRole(roles)) {
    return <Navigate to="/403" replace />;
  }
  return children;
}
```

#### 敏感操作确认

```tsx
// 删除操作二次确认
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">删除</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除？</AlertDialogTitle>
      <AlertDialogDescription>
        此操作不可撤销，将永久删除该记录及其关联数据。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>确认删除</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 47.7 环境安全

#### 环境变量

```typescript
// 禁止在代码中硬编码密钥
// ✅ 从环境变量读取
const dbPassword = process.env.DB_PASSWORD;

// ❌ 禁止硬编码
const dbPassword = 'my_secret_password';
```

#### 生产环境配置

```typescript
// 生产环境强制 HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
```

### 47.8 数据备份

| 数据库 | 备份频率 | 保留时长 | 恢复方式 |
|--------|---------|---------|---------|
| 主库 | 每日 | 30天 | PITR（时间点恢复） |
| 租户库 | 每日 | 30天 | PITR（时间点恢复） |

### 47.9 合规清单

| 合规项 | 状态 | 说明 |
|--------|------|------|
| 用户认证 | ✅ | 飞书 SSO |
| 权限控制 | ✅ | RBAC + 数据范围 |
| 数据隔离 | ✅ | Database-per-Tenant |
| 操作审计 | ✅ | 全量操作日志 |
| SQL 注入防护 | ✅ | Drizzle ORM 参数化 |
| XSS 防护 | ✅ | React 自动转义 + DOMPurify |
| CSRF 防护 | ✅ | Bearer Token + JSON API |
| 文件上传校验 | ✅ | 类型+大小白名单 |
| 速率限制 | ✅ | NestJS Throttler |
| 敏感数据加密 | ✅ | 数据库密码加密存储 |
| HTTPS | ✅ | 生产环境强制 |
| 数据备份 | ✅ | 每日备份+PITR |
