

---

## 第51章 库存管理模块完整规格

### 51.1 模块概述

库存管理模块提供实时库存查看、库存检索、超期预警和库存调整功能。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 库存列表 | `/inventory` | 分页列表、搜索、筛选 |
| 库存检索 | 列表页 | 按产品名称、材质、批次号筛选 |
| 超期预警 | 列表页 | 高亮显示超期未处理的库存项 |
| 库存调整 | 弹窗 | 手动调整库存数量 |
| 库存明细 | 详情 | 查看库存变动历史 |

### 51.2 库存列表页

#### 页面结构

```
库存管理页面
├── KPI 指标卡（4个）
│   ├── 库存种类数
│   ├── 库存总量
│   ├── 超期预警数
│   └── 低库存数
├── 搜索筛选栏
│   ├── 搜索框（产品名称）
│   ├── 材质筛选
│   ├── 批次号筛选
│   └── 状态筛选（全部/正常/超期/低库存）
├── 数据表格
│   ├── 产品名称
│   ├── 材质/工艺/规格
│   ├── 当前库存量
│   ├── 单位
│   ├── 库位
│   ├── 批次号
│   ├── 入库日期
│   ├── 状态（正常/超期/低库存）
│   └── 操作（查看/调整）
└── 分页器
```

#### KPI 指标卡

```tsx
function InventoryKPI({ data }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KPICard title="库存种类" value={data?.totalTypes || 0} unit="种" icon={<Package />} />
      <KPICard title="库存总量" value={data?.totalQty || 0} unit="件" icon={<Layers />} />
      <KPICard
        title="超期预警"
        value={data?.expiredCount || 0}
        unit="项"
        icon={<AlertTriangle />}
        className={data?.expiredCount > 0 ? 'border-error/30' : ''}
      />
      <KPICard
        title="低库存"
        value={data?.lowStockCount || 0}
        unit="项"
        icon={<TrendingDown />}
        className={data?.lowStockCount > 0 ? 'border-warning/30' : ''}
      />
    </div>
  );
}
```

#### 库存表格

```tsx
function InventoryTable({ data, loading, onAdjust, onView }) {
  const columns = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      render: (name, record) => (
        <button onClick={() => onView(record)} className="text-primary hover:underline font-medium">
          {name}
        </button>
      ),
    },
    {
      title: '材质',
      dataIndex: 'material',
      width: 80,
      render: (val: string) => val ? <Badge variant="secondary">{val}</Badge> : '—',
    },
    {
      title: '规格',
      dataIndex: 'specification',
      width: 120,
      render: (val: string) => val || '—',
    },
    {
      title: '当前库存',
      dataIndex: 'currentQty',
      width: 100,
      align: 'right',
      render: (qty: number, record) => (
        <span className={cn(
          'font-semibold',
          qty <= 0 ? 'text-error' : qty < 10 ? 'text-warning' : 'text-foreground'
        )}>
          {qty} {record.unit}
        </span>
      ),
    },
    {
      title: '当前重量',
      dataIndex: 'currentWeight',
      width: 100,
      align: 'right',
      render: (weight: number) => weight ? `${weight} kg` : '—',
    },
    {
      title: '库位',
      dataIndex: 'location',
      width: 100,
      render: (val: string) => val ? <Badge variant="outline">{val}</Badge> : '—',
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 100,
      render: (val: string) => val || '—',
    },
    {
      title: '入库日期',
      dataIndex: 'inboundDate',
      width: 120,
      render: (date: string) => date ? formatDate(date) : '—',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => {
        const config = {
          normal: { label: '正常', variant: 'success' },
          expired: { label: '超期', variant: 'error' },
          low_stock: { label: '低库存', variant: 'warning' },
        };
        const cfg = config[status] || config.normal;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button size="sm" variant="ghost" onClick={() => onAdjust(record)}>
          <Edit className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1100 }} />;
}
```

#### 超期预警高亮

```tsx
// 在 Table 的 rowClassName 中设置超期行的样式
<Table
  columns={columns}
  dataSource={data}
  rowKey="id"
  rowClassName={(record) => record.status === 'expired' ? 'bg-error/5' : ''}
/>
```

### 51.3 库存调整

```tsx
function InventoryAdjustDialog({ open, onClose, item }) {
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => inventoryApi.adjust({
      productId: item.productId,
      adjustType,
      qty: adjustType === 'out' ? -qty : qty,
      reason,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('库存调整成功');
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>库存调整 — {item?.productName}</DialogTitle>
          <DialogDescription>
            当前库存: {item?.currentQty} {item?.unit} · 重量: {item?.currentWeight} kg
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>调整类型</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={adjustType === 'in' ? 'default' : 'outline'}
                onClick={() => setAdjustType('in')}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-1" /> 入库
              </Button>
              <Button
                variant={adjustType === 'out' ? 'default' : 'outline'}
                onClick={() => setAdjustType('out')}
                className="flex-1"
              >
                <Minus className="w-4 h-4 mr-1" /> 出库
              </Button>
            </div>
          </div>

          <div>
            <Label>调整数量</Label>
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value))}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground mt-1">
              调整后库存: {(item?.currentQty || 0) + (adjustType === 'in' ? qty : -qty)} {item?.unit}
            </p>
          </div>

          <div>
            <Label>调整原因</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="如：盘盈/盘亏/损耗/退货等"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || qty <= 0}>
            确认调整
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 51.4 超期预警规则

```typescript
const EXPIRY_DAYS = 90;  // 90天未变动视为超期

function checkExpiry(item: InventoryItem): 'normal' | 'expired' | 'low_stock' {
  // 检查超期
  if (item.inboundDate) {
    const days = dayjs().diff(dayjs(item.inboundDate), 'day');
    if (days > EXPIRY_DAYS) return 'expired';
  }

  // 检查低库存
  if (item.currentQty < 10) return 'low_stock';

  return 'normal';
}
```

### 51.5 库存变动历史

```tsx
function InventoryHistory({ productId }) {
  const { data: history } = useQuery({
    queryKey: ['inventory', productId, 'history'],
    queryFn: () => inventoryApi.getHistory(productId),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>库存变动历史</CardTitle>
      </CardHeader>
      <CardContent>
        <Table
          columns={[
            { title: '时间', dataIndex: 'createdAt', render: formatDate },
            { title: '类型', dataIndex: 'type', render: (type) => {
              const map = { inbound: '入库', outbound: '出库', adjust_in: '调整入库', adjust_out: '调整出库' };
              return map[type] || type;
            }},
            { title: '数量', dataIndex: 'qty', align: 'right', render: (qty) => (
              <span className={qty > 0 ? 'text-success' : 'text-error'}>
                {qty > 0 ? '+' : ''}{qty}
              </span>
            )},
            { title: '变动后', dataIndex: 'afterQty', align: 'right' },
            { title: '来源', dataIndex: 'source' },
            { title: '操作人', dataIndex: 'operator' },
          ]}
          dataSource={history}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </CardContent>
    </Card>
  );
}
```

### 51.6 API 接口

```typescript
// 库存列表
GET /api/inventory?search=&material=&batchNo=&status=&page=1&pageSize=20
Response: PaginatedResponse<InventoryItem>

// 库存概览
GET /api/inventory/overview
Response: { totalTypes, totalQty, expiredCount, lowStockCount }

// 按产品查询库存
GET /api/inventory/product/:productId
Response: InventoryItem

// 库存调整
POST /api/inventory/adjust
Body: { productId, adjustType: 'in' | 'out', qty, reason }
Response: { id, currentQty, currentWeight }

// 库存变动历史
GET /api/inventory/:productId/history?page=1&pageSize=20
Response: PaginatedResponse<InventoryHistoryRecord>
```

### 51.7 库存更新策略

| 操作 | 触发 | 库存变动 |
|------|------|---------|
| 入库登记 | 来货登记保存 | +数量（入库明细数量） |
| 出库发货 | 快速发货保存 | -数量（出库明细数量） |
| 手动调整 | 库存管理页面调整 | ±数量（手动输入） |
| 部分发货 | 快速发货部分发货 | -数量（已发货数量） |
| 关单平账 | 快速发货关单 | 0（仅状态变更，不调整库存） |

#### 原子更新（防竞态）

```typescript
// 入库：原子增加库存
const [updated] = await db.update(inventory)
  .set({
    currentQty: sql`${inventory.currentQty} + ${qty}`,
    currentWeight: sql`${inventory.currentWeight} + ${weight}`,
    updatedAt: new Date(),
  })
  .where(eq(inventory.productId, productId))
  .returning();

// 出库：原子扣减库存（防超卖）
const [updated] = await db.update(inventory)
  .set({
    currentQty: sql`${inventory.currentQty} - ${qty}`,
    currentWeight: sql`${inventory.currentWeight} - ${weight}`,
    updatedAt: new Date(),
  })
  .where(and(
    eq(inventory.productId, productId),
    gte(inventory.currentQty, qty)  // 确保库存充足
  ))
  .returning();

if (!updated) throw new ConflictException('库存不足');
```
