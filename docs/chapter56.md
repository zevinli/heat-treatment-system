

---

## 第56章 性能优化指南

### 56.1 前端性能优化

#### 代码分割

Vite 自动进行代码分割，但需注意：

```typescript
// ✅ 按需导入 Lucide 图标
import { Plus, Search, Edit } from 'lucide-react';

// ❌ 禁止导入整个库
import * as Icons from 'lucide-react';

// ✅ 按需导入 lodash
import debounce from 'lodash/debounce';

// ❌ 禁止全量导入
import _ from 'lodash';
```

#### React Query 缓存策略

```typescript
// 全局默认配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30秒内不重新请求
      gcTime: 5 * 60 * 1000,       // 5分钟垃圾回收
      refetchOnWindowFocus: false, // 禁止窗口聚焦时刷新
      retry: 1,                     // 失败重试1次
    },
  },
});

// 特定查询的缓存策略
const { data } = useQuery({
  queryKey: ['customers'],
  queryFn: customerApi.getAll,
  staleTime: 5 * 60 * 1000,  // 客户列表5分钟内不刷新
});

const { data } = useQuery({
  queryKey: ['inventory'],
  queryFn: inventoryApi.getAll,
  staleTime: 0,  // 库存数据始终最新
  refetchInterval: 30 * 1000,  // 30秒轮询
});
```

#### 虚拟列表

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualTable({ data }: { data: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TableRow data={data[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 图片优化

```tsx
// 响应式图片
import { Image } from '@/components/ui/image';

<Image
  src={url}
  alt={product.name}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="rounded-lg"
/>

// 懒加载
<img src={url} loading="lazy" alt="..." />

// 骨架屏
{loading ? (
  <div className="w-full h-48 bg-muted animate-pulse rounded-lg" />
) : (
  <img src={url} alt="..." />
)}
```

#### 防抖节流

```typescript
// 搜索防抖
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    refetch({ search: debouncedSearch });
  }
}, [debouncedSearch]);

// 滚动节流
const throttledScroll = useThrottle(handleScroll, 200);
window.addEventListener('scroll', throttledScroll);
```

#### React.memo 与 useMemo

```tsx
// 重型子组件用 memo 避免不必要重渲染
const TableRow = React.memo(({ data, onSelect }) => {
  return (
    <tr onClick={() => onSelect(data.id)}>
      <td>{data.name}</td>
      <td>{data.material}</td>
    </tr>
  );
});

// 复杂计算用 useMemo
const sortedData = useMemo(
  () => [...data].sort((a, b) => a.name.localeCompare(b.name)),
  [data]
);

// 回调函数用 useCallback
const handleSelect = useCallback((id: string) => {
  setSelectedId(id);
}, []);
```

### 56.2 后端性能优化

#### 数据库查询优化

```typescript
// ✅ 批量查询替代 N+1
const orderIds = orders.map(o => o.id);
const items = await db.select().from(orderItems)
  .where(inArray(orderItems.orderId, orderIds));

// 按 orderId 分组
const itemsByOrder = new Map<string, OrderItem[]>();
for (const item of items) {
  const list = itemsByOrder.get(item.orderId) ?? [];
  list.push(item);
  itemsByOrder.set(item.orderId, list);
}

// 回填到 orders
orders.forEach(order => {
  order.items = itemsByOrder.get(order.id) ?? [];
});

// ❌ 禁止 N+1
for (const order of orders) {
  order.items = await db.select().from(orderItems)
    .where(eq(orderItems.orderId, order.id));
}
```

#### 索引优化

```sql
-- 复合索引（按查询频率排序）
CREATE INDEX idx_inbound_org_customer_date
  ON inbound_records (org_id, customer_id, created_at DESC);

CREATE INDEX idx_outbound_org_inbound
  ON outbound_records (org_id, inbound_id, status);

-- 部分索引（只索引活跃数据）
CREATE INDEX idx_inventory_active
  ON inventory (org_id, product_id)
  WHERE status = 'normal';

-- 覆盖索引（包含查询所需的所有列）
CREATE INDEX idx_product_search
  ON products (org_id, name)
  INCLUDE (material, process, specification, unit);
```

#### 分页优化

```typescript
// ✅ 游标分页（移动端/无限滚动）
async findByCursor(orgId: string, cursor?: string, limit = 20) {
  let query = db.select().from(inboundRecords)
    .where(eq(inboundRecords.orgId, orgId))
    .orderBy(desc(inboundRecords.createdAt), desc(inboundRecords.id))
    .limit(limit + 1);

  if (cursor) {
    const [createdAt, id] = cursor.split('_');
    query = query.where(and(
      eq(inboundRecords.orgId, orgId),
      or(
        lt(inboundRecords.createdAt, new Date(createdAt)),
        and(
          eq(inboundRecords.createdAt, new Date(createdAt)),
          lt(inboundRecords.id, id)
        )
      )
    ));
  }

  const items = await query;
  const hasMore = items.length > limit;
  const nextCursor = hasMore
    ? `${items[limit - 1].createdAt.toISOString()}_${items[limit - 1].id}`
    : undefined;

  return {
    items: items.slice(0, limit),
    nextCursor,
    hasMore,
  };
}

// ✅ 传统分页（后台管理）
async findByPage(orgId: string, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const [items, [{ count }]] = await Promise.all([
    db.select().from(inboundRecords)
      .where(eq(inboundRecords.orgId, orgId))
      .orderBy(desc(inboundRecords.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(inboundRecords)
      .where(eq(inboundRecords.orgId, orgId)),
  ]);

  return { items, total: Number(count), page, pageSize };
}
```

#### 缓存策略

```typescript
// Redis 缓存热点数据
@Injectable()
export class ProductCacheService {
  async getProducts(orgId: string): Promise<Product[]> {
    const key = `products:${orgId}`;
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    const products = await this.db.select().from(products)
      .where(eq(products.orgId, orgId));

    await this.redis.setex(key, 300, JSON.stringify(products)); // 5分钟
    return products;
  }

  async invalidate(orgId: string) {
    await this.redis.del(`products:${orgId}`);
  }
}
```

### 56.3 请求优化

#### 批量请求

```typescript
// ✅ 批量获取
const productIds = [...new Set(items.map(i => i.productId))];
const products = await productApi.getByIds(productIds);

// ❌ 逐条获取
for (const item of items) {
  const product = await productApi.getById(item.productId);
}
```

#### 请求去重

```typescript
// React Query 自动去重
const { data } = useQuery({
  queryKey: ['product', id],
  queryFn: () => productApi.getById(id),
});
// 多个组件使用同一 queryKey，只会发一次请求
```

#### 预加载

```typescript
// 鼠标悬停预加载
function CustomerLink({ id, name }) {
  const queryClient = useQueryClient();

  const handleHover = () => {
    queryClient.prefetchQuery({
      queryKey: ['customer', id],
      queryFn: () => customerApi.getById(id),
      staleTime: 10 * 1000,
    });
  };

  return (
    <Link to={`/customers/${id}`} onMouseEnter={handleHover}>
      {name}
    </Link>
  );
}
```

### 56.4 渲染优化

#### 避免不必要的重渲染

```tsx
// ✅ 状态下放（只让需要的组件重新渲染）
function ProductList() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <ProductTable onSelect={setSelectedId} />
      <ProductDetail id={selectedId} />
    </>
  );
}

// ProductTable 不会因为 selectedId 变化而重渲染
```

#### 列表 key

```tsx
// ✅ 使用稳定唯一的 key
{items.map(item => (
  <ListItem key={item.id} data={item} />
))}

// ❌ 禁止使用 index 作为 key
{items.map((item, index) => (
  <ListItem key={index} data={item} />
))}
```

#### 大列表虚拟化

```tsx
// 超过 100 行的表格使用虚拟滚动
{data.length > 100 ? (
  <VirtualTable data={data} />
) : (
  <Table data={data} />
)}
```

### 56.5 Bundle 体积控制

#### 分析工具

```bash
# 分析 bundle 体积
npx vite-bundle-visualizer
```

#### 按需引入

```typescript
// ✅ 按需引入 ECharts
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent,
  CanvasRenderer,
]);

// ❌ 全量引入
import * as echarts from 'echarts';
```

#### Tree Shaking

```typescript
// ✅ 具名导入
import { debounce, throttle } from 'lodash-es';

// ❌ 默认导入
import _ from 'lodash';
```

### 56.6 数据库性能监控

```sql
-- 慢查询日志
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 记录 >1s 的查询
SELECT pg_reload_conf();

-- 查看活跃连接
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- 查看索引使用率
SELECT relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 查看表大小
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 56.7 性能指标

#### 关键指标

| 指标 | 目标 | 工具 |
|------|------|------|
| FCP (First Contentful Paint) | < 1.5s | Lighthouse |
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| FID (First Input Delay) | < 100ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| API P99 响应时间 | < 500ms |miaoda observability |
| API 错误率 | < 0.1% |miaoda observability |
| 数据库查询 | < 100ms | EXPLAIN ANALYZE |
