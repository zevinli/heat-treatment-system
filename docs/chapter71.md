# 第71章 Hello 模块与遗留代码参考

> 本章覆盖 NestJS 演示模块（hello）、移动端检测 Hook（use-mobile）、示例 Hook（use-example）。

## 71.1 Hello 模块（server/modules/hello/）

### 概述

NestJS 模板自带的演示模块，展示了 Controller-Service 模式的基本用法。当前代码**全部被注释**，不参与实际运行。作为 NestJS + Drizzle ORM 的参考模板存在。

> **注意**：`hello.module.ts` 未在 `app.module.ts` 中注册（因为全部被注释），不参与应用启动。

### 文件清单

| 文件 | 行数 | 状态 |
|------|------|------|
| `hello.controller.ts` | 16 | 全部注释 |
| `hello.module.ts` | 10 | 全部注释 |
| `hello.service.ts` | 28 | 全部注释 |

### hello.controller.ts（模板代码）

注释中的控制器结构：

```typescript
@Controller('api/hello')
export class HelloController {
  constructor(private readonly helloService: HelloService) {}

  @Get('test')
  test(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.helloService.test(userId);
  }
}
```

### hello.service.ts（模板代码）

注释中的服务结构：

```typescript
@Injectable()
export class HelloService {
  private readonly logger = new Logger(HelloService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async test(userId: string, limit: number = 10) {
    // 查询 record 表，按 userProfile 过滤
    // 按 speakDate 倒序，限制条数
    return this.db.select().from(record)
      .where(eq(record.userProfile, userId))
      .orderBy(desc(record.speakDate))
      .limit(limit);
  }
}
```

### hello.module.ts（模板代码）

注释中的模块结构：

```typescript
@Module({
  controllers: [HelloController],
  providers: [HelloService],
})
export class HelloModule {}
```

### 模板参考价值

1. **Drizzle ORM 注入**：展示了 `@Inject(DRIZZLE_DATABASE)` 的正确用法
2. **userProfile 类型**：展示了 `userProfile` 列的查询方式
3. **req.userContext**：展示了从请求中获取 `userId` 的标准方式
4. **Logger 使用**：展示了 NestJS Logger 的正确实例化方式

## 71.2 use-mobile.ts（移动端检测 Hook）

> 文件：`client/src/hooks/use-mobile.ts`（19行）

### 概述

基于 `window.matchMedia` 的移动端检测 Hook，断点 768px。与 Tailwind 的 `md` 断点一致。

### 完整代码

```typescript
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

### 导出

| 函数 | 返回值 | 说明 |
|------|--------|------|
| `useIsMobile()` | `boolean` | 窗口宽度 < 768px 时返回 true |

### 使用场景

```tsx
import { useIsMobile } from '@/hooks/use-mobile';

function MyComponent() {
  const isMobile = useIsMobile();
  return (
    <div className={isMobile ? 'flex-col' : 'flex-row'}>
      {/* 响应式布局 */}
    </div>
  );
}
```

### 技术细节

| 特性 | 说明 |
|------|------|
| 断点 | 768px（与 Tailwind `md` 一致） |
| 检测方式 | `window.matchMedia('(max-width: 767px)')` |
| 事件监听 | `addEventListener("change", ...)` 监听视口变化 |
| 清理 | `useEffect` 返回清理函数移除监听器 |
| 初始值 | `undefined`（首次渲染后立即更新为实际值） |
| 返回值 | `!!isMobile`（强制转为 boolean） |

## 71.3 use-example.ts（示例 Hook，遗留代码）

> 文件：`client/src/hooks/use-example.ts`（52行）

### 概述

模板自带的示例 Hook，**全部代码被注释**，无有效导出。展示了使用 `axiosForBackend` 加载数据的基本模式。

### 模板结构（注释中）

```typescript
export function useRecordData() {
  const [data, setData] = useState<RecordData>({
    record: {},
    loading: true,
    error: null,
  });

  // 使用 axiosForBackend 获取数据
  // 返回 { record, loading, error, refetch }
}
```

### 参考价值

1. **axiosForBackend 用法**：展示了前端 API 请求的标准方式
2. **数据加载模式**：展示了 loading/error 状态管理的标准模式
3. **RecordData 接口**：展示了数据类型定义的标准格式

### 状态

此文件为遗留代码，建议在后续重构中清理。与 `ExamplePage.tsx` 配套使用（两者均为全注释状态）。

## 71.4 遗留代码汇总

| 文件 | 行数 | 状态 | 建议处理 |
|------|------|------|---------|
| `server/modules/hello/*` | 54 | 全部注释 | 保留作为模板参考，或清理 |
| `client/src/hooks/use-example.ts` | 52 | 全部注释 | 保留作为模板参考，或清理 |
| `client/src/pages/ExamplePage/ExamplePage.tsx` | 37 | 全部注释 | 保留作为模板参考，或清理 |
| `client/src/pages/DashboardDemoPage/` | 937 | 有效代码 | 保留作为设计参考 |
| `client/src/pages/MynaHeroPage/` | 266 | 有效代码 | 保留作为动画参考 |
| `client/src/pages/HeroSectionPage/` | 35 | 有效代码 | 保留作为组件展示 |
| `client/src/pages/ShaderBackgroundPage/` | 20 | 有效代码 | 保留作为组件展示 |
