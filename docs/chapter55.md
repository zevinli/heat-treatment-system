

---

## 第55章 错误处理与异常恢复完整规格

### 55.1 错误处理架构

#### 三层错误处理

```
Service 层（抛异常）
    │
    ▼
Controller 层（透传）
    │
    ▼
全局 Error Filter（统一格式化）
    │
    ▼
前端（展示错误 Toast）
```

### 55.2 异常类型映射

| 场景 | NestJS 异常 | HTTP 状态码 | 前端处理 |
|------|-------------|------------|---------|
| 资源不存在 | `NotFoundException` | 404 | Toast 提示 |
| 参数非法 | `BadRequestException` | 400 | 表单错误提示 |
| 并发冲突 | `ConflictException` | 409 | 确认对话框 |
| 无权限 | `ForbiddenException` | 403 | 跳转首页 |
| 未登录 | `UnauthorizedException` | 401 | 跳转登录 |
| 服务不可用 | `ServiceUnavailableException` | 503 | 重试按钮 |
| 服务器错误 | `InternalServerErrorException` | 500 | 联系支持 |

### 55.3 全局错误 Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status: number;
    let message: string;
    let code: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
      code = (res as any).code || 'ERROR';
    } else if (exception instanceof Error) {
      status = 500;
      message = '服务器内部错误';
      code = 'INTERNAL_ERROR';
      logger.error(`[${request.method}] ${request.url}`, exception.stack);
    } else {
      status = 500;
      message = '未知错误';
      code = 'UNKNOWN';
    }

    response.status(status).json({
      success: false,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 55.4 前端错误处理

#### API 错误拦截

```typescript
// axiosForBackend 拦截器
axiosForBackend.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // 网络错误
      toast.error('网络连接失败，请检查网络');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // 未登录，跳转登录
        toast.error('登录已过期，请重新登录');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        break;

      case 403:
        toast.error('您没有权限执行此操作');
        break;

      case 404:
        toast.error(data.message || '请求的资源不存在');
        break;

      case 409:
        // 并发冲突，不自动提示，交给业务层处理
        break;

      case 500:
        toast.error('服务器错误，请稍后重试');
        logger.error('Server error:', data);
        break;

      default:
        toast.error(data.message || '请求失败');
    }

    return Promise.reject(error);
  }
);
```

#### React Query 错误处理

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      onError: (error) => {
        logger.error('Query error:', error);
      },
    },
    mutations: {
      onError: (error) => {
        // 通用 mutation 错误处理
        if (error.response?.status >= 500) {
          toast.error('服务器错误，请稍后重试');
        }
      },
    },
  },
});
```

### 55.5 前端错误边界

```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('React Error Boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <AlertCircle className="w-16 h-16 text-destructive" />
      <h2 className="text-xl font-semibold">页面出错了</h2>
      <p className="text-muted-foreground text-sm">
        {error?.message || '发生未知错误'}
      </p>
      <Button onClick={() => window.location.reload()}>
        刷新页面
      </Button>
    </div>
  );
}

// 使用
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 55.6 业务错误场景

#### 入库登记错误

| 场景 | 处理 |
|------|------|
| 客户不存在 | `NotFoundException` → Toast 提示 |
| 产品不存在 | `NotFoundException` → Toast 提示 |
| 重量为0 | `BadRequestException` → 表单错误 |
| 批次号重复 | `ConflictException` → 确认是否覆盖 |

```typescript
// Service 层
async createInbound(dto: CreateInboundDto, orgId: string) {
  const customer = await this.customerService.findById(dto.customerId, orgId);
  if (!customer) throw new NotFoundException('客户不存在');

  for (const item of dto.items) {
    const product = await this.productService.findById(item.productId, orgId);
    if (!product) throw new NotFoundException(`产品 ${item.productName} 不存在`);

    if (item.weight <= 0) {
      throw new BadRequestException(`${item.productName} 重量必须大于0`);
    }
  }

  // 检查批次号唯一性
  if (dto.batchNo) {
    const existing = await this.findByBatchNo(dto.batchNo, orgId);
    if (existing) {
      throw new ConflictException(`批次号 ${dto.batchNo} 已存在`);
    }
  }

  return this.insertInbound(dto, orgId);
}
```

#### 快速发货错误

| 场景 | 处理 |
|------|------|
| 入库记录不存在 | `NotFoundException` → Toast |
| 库存不足 | `ConflictException` → 确认对话框 |
| 发货数量超过可用 | `BadRequestException` → 表单错误 |
| 入库状态不允许发货 | `BadRequestException` → Toast |

```typescript
async createOutbound(dto: CreateOutboundDto, orgId: string) {
  const inbound = await this.inboundService.findById(dto.inboundId, orgId);
  if (!inbound) throw new NotFoundException('入库记录不存在');

  if (inbound.status !== 'completed') {
    throw new BadRequestException('入库记录未完成，不能发货');
  }

  for (const item of dto.items) {
    const available = await this.inventoryService.getAvailable(item.productId, orgId);
    if (item.qty > available) {
      throw new ConflictException(
        `${item.productName} 库存不足（可用 ${available}，需 ${item.qty}）`
      );
    }
  }

  return this.insertOutbound(dto, orgId);
}
```

#### 对账错误

| 场景 | 处理 |
|------|------|
| 对账期间重复 | `ConflictException` → 确认覆盖 |
| 数据未准备完成 | `BadRequestException` → Toast |
| 客户不存在 | `NotFoundException` → Toast |

### 55.7 网络错误恢复

#### 请求重试

```typescript
// 指数退避重试
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (err.response?.status >= 400 && err.response?.status < 500) {
        throw err; // 4xx 不重试
      }
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

#### 离线检测

```typescript
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// 使用
function App() {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return <OfflineBanner />;
  }

  return <MainContent />;
}
```

### 55.8 数据一致性恢复

#### 前端乐观更新回滚

```typescript
const mutation = useMutation({
  mutationFn: outboundApi.create,
  onMutate: async (newOutbound) => {
    // 取消正在进行的查询
    await queryClient.cancelQueries({ queryKey: ['outbounds'] });

    // 保存前一个值
    const previousOutbounds = queryClient.getQueryData(['outbounds']);

    // 乐观更新
    queryClient.setQueryData(['outbounds'], (old) => [...old, newOutbound]);

    // 返回上下文（用于回滚）
    return { previousOutbounds };
  },
  onError: (err, newOutbound, context) => {
    // 回滚
    queryClient.setQueryData(['outbounds'], context.previousOutbounds);
    toast.error('发货失败，已恢复');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['outbounds'] });
  },
});
```

#### 后端事务回滚

```typescript
async createOutboundWithInventory(dto: CreateOutboundDto, orgId: string) {
  return this.db.transaction(async (tx) => {
    // 1. 创建出库记录
    const [outbound] = await tx.insert(outboundRecords).values({
      ...dto,
      orgId,
      status: 'pending',
    }).returning();

    // 2. 扣减库存（原子操作）
    for (const item of dto.items) {
      const [updated] = await tx.update(inventory)
        .set({
          currentQty: sql`${inventory.currentQty} - ${item.qty}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(inventory.productId, item.productId),
          eq(inventory.orgId, orgId),
          gte(inventory.currentQty, item.qty),
        ))
        .returning();

      if (!updated) {
        throw new ConflictException(`${item.productName} 库存不足`);
      }
    }

    // 3. 创建出库明细
    await tx.insert(outboundItems).values(
      dto.items.map(item => ({
        ...item,
        outboundId: outbound.id,
        orgId,
      }))
    );

    return outbound;
  });
}
```

### 55.9 错误日志收集

```typescript
// 前端错误收集
window.addEventListener('error', (event) => {
  logger.error('Global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
});
```

### 55.10 常见错误排查

#### Tenant not found

```
原因：请求未携带组织编码
解决：确保使用 axiosForBackend 而非 fetch
排查：检查 localStorage 中是否有 ORG_CODE
```

#### 404 路由不存在

```
原因：Controller 未注册或路径不匹配
解决：① 检查 app.module.ts 是否引入模块
      ② 检查 @Controller 路径前缀
      ③ 检查静态路由在动态路由之前
```

#### 403 权限不足

```
原因：用户角色不匹配
解决：① 检查 RBAC 角色配置
      ② 检查 @Can 装饰器权限点
      ③ 检查 userContext.roles
```

#### 500 服务器错误

```
排查步骤：
1. 读取 server-devserver 日志
2. 查看错误堆栈
3. 检查数据库连接
4. 检查 Schema 字段名是否匹配
5. 检查环境变量
```

#### 数据库连接失败

```
原因：连接池耗尽或数据库不可达
解决：
1. 检查 DATABASE_URL 是否正确
2. 检查网络连通性
3. 重启应用
4. 联系技术支持
```
