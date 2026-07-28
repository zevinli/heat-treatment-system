

---

## 第54章 部署与运维指南

### 54.1 部署架构

#### 整体架构

```
用户浏览器
    │
    ▼
┌──────────────┐
│  CDN / WAF  │  ← 静态资源缓存、DDoS 防护
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  API Gateway │  ← 路由分发、鉴权、限流
└──────┬───────┘
       │
       ├──→ ┌──────────────┐
       │    │  NestJS App  │  ← FaaS 容器（无状态）
       │    └──────┬───────┘
       │           │
       │           ├──→ PostgreSQL（主库）
       │           │
       │           ├──→ Redis（缓存/会话）
       │           │
       │           └──→ 对象存储（文件）
       │
       └──→ ┌──────────────┐
            │  静态资源 CDN │  ← 前端构建产物
            └──────────────┘
```

#### FaaS 无状态约束

- 服务端运行在 FaaS 容器中，**无本地文件系统**（`/tmp` 除外）
- 进程可能随时重启，**禁止在内存中存储会话状态**
- 数据库连接由连接池管理，每次请求从池中获取

### 54.2 构建流程

#### 前端构建

```bash
# 构建命令
npm run build:client

# 产物路径
client/dist/
├── assets/           # JS、CSS 打包文件
├── static/           # 静态资源
└── index.html        # 入口 HTML
```

#### 后端构建

```bash
# 构建命令
npm run build:server

# 产物路径
server/dist/
├── main.js           # 入点
├── modules/          # 编译后的模块
├── database/         # Schema 编译产物
└── assets/           # 运行时资源（字体、模板等）
```

#### nest-cli.json 资源声明

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "assets": [
      { "include": "assets/**/*", "outDir": "dist/server" }
    ],
    "watchAssets": true
  }
}
```

### 54.3 发布流程

#### 发布命令

```bash
# 通过 miaoda-cli 发布
miaoda deploy

# 查看发布状态
miaoda deploy get

# 查看发布历史
miaoda deploy history

# 查看发布错误日志
miaoda deploy error-log
```

#### 发布检查清单

发布前必须确认：

- [ ] 代码已通过 ESLint 检查
- [ ] TypeScript 编译无错误
- [ ] 所有 API 接口已测试通过
- [ ] 数据库 Schema 已同步（如涉及 DDL 变更）
- [ ] 环境变量已配置
- [ ] shared/api.interface.ts 前后端类型一致

### 54.4 数据库变更

#### DDL 执行

```bash
# 执行建表/改表 SQL
miaoda db sql "CREATE TABLE ..."

# 查看当前 Schema
miaoda db schema

# 查看数据
miaoda db data
```

#### Schema 同步流程

1. 通过 `miaoda db sql` 执行 DDL
2. 系统自动执行 codegen 生成 `schema.ts`
3. **立即重新读取 `schema.ts`** 确认变更
4. 更新业务代码中的类型引用
5. 更新 `shared/api.interface.ts` 中的类型定义

### 54.5 环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | 数据库连接串 | `postgresql://...` |
| `REDIS_URL` | Redis 连接串 | `redis://...` |
| `APP_ID` | 应用 ID | `app_xxx` |
| `TENANT_ID` | 租户 ID | `tenant_xxx` |

### 54.6 日志体系

#### 日志源

| 日志源 | 工具参数 | 说明 |
|--------|---------|------|
| 服务端 devServer | `read_logs({ logSource: 'server-devserver' })` | 开发时服务端控制台 |
| 服务端运行时 | `read_logs({ logSource: 'server' })` | 生产环境服务端日志 |
| 客户端 devServer | `read_logs({ logSource: 'client-devserver' })` | 开发时客户端控制台 |
| 浏览器控制台 | `read_logs({ logSource: 'browser' })` | 浏览器端日志 |
| 链路追踪 | `read_logs({ logSource: 'trace' })` | 请求链路追踪 |

#### 日志规范

```typescript
// 后端：必须使用 Logger
import { Logger } from '@nestjs/common';
const logger = new Logger('InboundService');
logger.log('入库成功: ' + JSON.stringify(record));
logger.error('入库失败: ' + err.message, err.stack);
logger.warn('库存不足: ' + productId);

// 前端：必须使用 logger
import { logger } from '@lark-apaas/client-toolkit/logger';
logger.info('Page loaded');
logger.error('API error:', error);
```

#### 线上日志查询

```bash
# 查询线上日志
miaoda observability log --level error --limit 50

# 查询链路
miaoda observability trace --traceid xxx

# 查询监控指标
miaoda observability metric

# 查询运营数据
miaoda observability analytics
```

### 54.7 性能优化

#### 前端优化

| 策略 | 实现 |
|------|------|
| 代码分割 | Vite 自动分割 vendor 和业务代码 |
| 图片懒加载 | `<img loading="lazy">` |
| 虚拟列表 | 大数据量表格使用虚拟滚动 |
| 请求缓存 | React Query 缓存 + staleTime |
| 防抖节流 | 搜索输入 300ms 防抖 |
| 骨架屏 | 数据加载时展示骨架 |

#### 后端优化

| 策略 | 实现 |
|------|------|
| 数据库索引 | 高频查询字段添加索引 |
| 批量查询 | 禁止 N+1，使用 inArray 批量查 |
| 分页 | 游标分页优先，传统分页限制页数 |
| 连接池 | Drizzle ORM 连接池管理 |
| 缓存 | Redis 缓存热点数据 |

#### 数据库索引建议

```sql
-- 入库记录索引
CREATE INDEX idx_inbound_org_date ON inbound_records (org_id, created_at DESC);
CREATE INDEX idx_inbound_customer ON inbound_records (org_id, customer_id);
CREATE INDEX idx_inbound_product ON inbound_records (org_id, product_id);
CREATE INDEX idx_inbound_status ON inbound_records (org_id, status);

-- 出库记录索引
CREATE INDEX idx_outbound_org_date ON outbound_records (org_id, created_at DESC);
CREATE INDEX idx_outbound_inbound ON outbound_records (org_id, inbound_id);
CREATE INDEX idx_outbound_status ON outbound_records (org_id, status);

-- 库存索引
CREATE INDEX idx_inventory_org_product ON inventory (org_id, product_id);
CREATE INDEX idx_inventory_status ON inventory (org_id, status);

-- 对账记录索引
CREATE INDEX idx_recon_org_period ON reconciliation_records (org_id, period_year, period_month);
CREATE INDEX idx_recon_customer ON reconciliation_records (org_id, customer_id);
CREATE INDEX idx_recon_status ON reconciliation_records (org_id, status);
```

### 54.8 健康检查

```typescript
// 健康检查端点
@Controller('api/health')
export class HealthController {
  @Get()
  @SkipAuth()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

### 54.9 错误恢复

#### 数据库连接失败

```typescript
// 连接失败处理
catch (err) {
  if (err.code === 'ECONNREFUSED') {
    logger.error('数据库连接失败，请联系技术支持');
    throw new ServiceUnavailableException('服务暂时不可用');
  }
  throw err;
}
```

#### 服务重启

```bash
# 开发环境重启 devServer
pkill -f "npm run dev"

# 生产环境重新发布
miaoda deploy
```

### 54.10 备份与恢复

#### 数据备份

```bash
# 导出数据
miaoda db export --table inbound_records --format sql
miaoda db export --table outbound_records --format sql

# 导入数据
miaoda db import --file backup.sql
```

#### PITR 恢复

```bash
# 按时间点恢复
miaoda db restore --timestamp "2024-01-15T10:00:00Z"
```

### 54.11 监控告警

#### 监控指标

| 指标 | 说明 | 告警阈值 |
|------|------|---------|
| CPU 使用率 | 容器 CPU | > 80% |
| 内存使用率 | 容器内存 | > 85% |
| 响应时间 | API P99 | > 3s |
| 错误率 | 5xx 错误 | > 1% |
| 数据库连接 | 连接池使用 | > 80% |
| 磁盘使用 | 数据库磁盘 | > 90% |

#### 告警通知

```bash
# 设置告警
miaoda observability alert set \
  --metric response_time \
  --threshold 3000 \
  --notify feishu
```

### 54.12 版本管理

#### 发布版本

```bash
# 发布当前代码
miaoda deploy

# 查看版本历史
miaoda deploy history

# 回滚到指定版本
miaoda deploy rollback --version v1.2.3
```

#### 多环境管理

| 环境 | 用途 | 数据库 |
|------|------|--------|
| preview | 开发预览 | 开发库 |
| runtime | 生产运行 | 生产库 |

```typescript
// 环境判断
if (process.env.NODE_ENV === 'production') {
  // 生产逻辑
} else {
  // 开发逻辑
}

// 通过 userContext.env 判断
const isPreview = req.userContext.env === 'preview';
```
