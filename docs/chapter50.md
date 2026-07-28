

---

## 第50章 产品管理模块完整规格

### 50.1 模块概述

产品管理模块维护产品基础数据库，包括产品名称、材质、工艺、规格、计价方式等。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 产品列表 | `/products` | 分页列表、搜索、筛选 |
| 产品详情 | `/products/:id` | 基本信息+库存信息 |
| 新增产品 | 弹窗 | 表单录入 |
| 编辑产品 | 弹窗 | 表单编辑 |
| 删除产品 | 列表操作 | 二次确认 |
| 多维检索 | 列表页 | 名称/材质/工艺组合筛选 |

### 50.2 产品列表页

#### 多维检索

```tsx
function ProductFilterBar({ onFilter }) {
  const [search, setSearch] = useState('');
  const [material, setMaterial] = useState('');
  const [process, setProcess] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    onFilter({ search: debouncedSearch, material, process });
  }, [debouncedSearch, material, process]);

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索产品名称、规格"
          className="pl-10"
        />
      </div>
      <Select value={material} onValueChange={setMaterial}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="材质" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部材质</SelectItem>
          <SelectItem value="steel">钢材</SelectItem>
          <SelectItem value="aluminum">铝材</SelectItem>
          <SelectItem value="copper">铜材</SelectItem>
          <SelectItem value="other">其他</SelectItem>
        </SelectContent>
      </Select>
      <Select value={process} onValueChange={setProcess}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="工艺" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部工艺</SelectItem>
          <SelectItem value="quench">淬火</SelectItem>
          <SelectItem value="temper">回火</SelectItem>
          <SelectItem value="anneal">退火</SelectItem>
          <SelectItem value="normalize">正火</SelectItem>
          <SelectItem value="carburize">渗碳</SelectItem>
          <SelectItem value="nitride">渗氮</SelectItem>
        </SelectContent>
      </Select>
      <Button className="bg-primary" onClick={() => setShowCreateDialog(true)}>
        <Plus className="w-4 h-4 mr-1" /> 新增产品
      </Button>
    </div>
  );
}
```

#### 产品表格

```tsx
function ProductTable({ data, loading, onEdit, onDelete }) {
  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      render: (name, record) => (
        <button onClick={() => onView(record)} className="text-primary hover:underline font-medium">
          {name}
        </button>
      ),
    },
    {
      title: '材质',
      dataIndex: 'material',
      width: 100,
      render: (val: string) => val ? <Badge variant="secondary">{val}</Badge> : '—',
    },
    {
      title: '工艺',
      dataIndex: 'process',
      width: 100,
      render: (val: string) => val || '—',
    },
    {
      title: '规格',
      dataIndex: 'specification',
      width: 150,
      render: (val: string) => val || '—',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 60,
    },
    {
      title: '计价方式',
      dataIndex: 'pricingMethod',
      width: 100,
      render: (val: string) => {
        const map = { weight: '按重量', piece: '按件数' };
        return map[val] || val;
      },
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      width: 100,
      align: 'right',
      render: (val: number) => val ? `¥${val}` : '—',
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(record)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(record)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />;
}
```

### 50.3 产品详情页

```tsx
function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(id!),
  });
  const { data: inventory } = useQuery({
    queryKey: ['product', id, 'inventory'],
    queryFn: () => inventoryApi.getByProduct(id!),
  });
  const { data: records } = useQuery({
    queryKey: ['product', id, 'records'],
    queryFn: () => productApi.getRecords(id!),
  });

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbItem><Link to="/products">产品管理</Link></BreadcrumbItem>
        <BreadcrumbItem>{product?.name}</BreadcrumbItem>
      </Breadcrumb>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>产品信息</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DetailItem label="产品名称" value={product?.name} />
            <DetailItem label="材质" value={product?.material} />
            <DetailItem label="工艺" value={product?.process} />
            <DetailItem label="规格" value={product?.specification} />
            <DetailItem label="单位" value={product?.unit} />
            <DetailItem label="计价方式" value={product?.pricingMethod === 'weight' ? '按重量' : '按件数'} />
            <DetailItem label="单价" value={product?.unitPrice ? `¥${product.unitPrice}` : '—'} />
            <DetailItem label="最小起订量" value={product?.minOrderQty} />
            <DetailItem label="备注" value={product?.remark} span={3} />
          </dl>
        </CardContent>
      </Card>

      {/* 库存信息 */}
      <Card>
        <CardHeader>
          <CardTitle>库存信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="当前库存" value={inventory?.currentQty || 0} unit={product?.unit} />
            <StatCard label="当前重量" value={inventory?.currentWeight || 0} unit="kg" />
            <StatCard label="库位" value={inventory?.location || '—'} />
            <StatCard label="入库日期" value={inventory?.inboundDate ? formatDate(inventory.inboundDate) : '—'} />
          </div>
        </CardContent>
      </Card>

      {/* 收发货记录 */}
      <Card>
        <CardHeader>
          <CardTitle>收发货记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="inbound">入库</TabsTrigger>
              <TabsTrigger value="outbound">出库</TabsTrigger>
            </TabsList>
            <TabsContent value="all"><ProductRecordTable data={records} /></TabsContent>
            <TabsContent value="inbound"><ProductRecordTable data={records?.filter(r => r.type === 'inbound')} /></TabsContent>
            <TabsContent value="outbound"><ProductRecordTable data={records?.filter(r => r.type === 'outbound')} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 50.4 产品表单

```tsx
function ProductFormDialog({ open, onClose, product }) {
  const form = useForm({
    defaultValues: product || {
      name: '', material: '', process: '', specification: '',
      unit: 'kg', pricingMethod: 'weight', unitPrice: '', minOrderQty: '', remark: '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? '编辑产品' : '新增产品'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <FormField name="name" className="col-span-2">
              <FieldLabel>产品名称 <span className="text-error">*</span></FieldLabel>
              <Input value={form.state.values.name}
                onChange={(e) => form.setFieldValue('name', e.target.value)} />
            </FormField>

            <FormField name="material">
              <FieldLabel>材质</FieldLabel>
              <Select value={form.state.values.material}
                onValueChange={(v) => form.setFieldValue('material', v)}>
                <SelectTrigger><SelectValue placeholder="选择材质" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="steel">钢材</SelectItem>
                  <SelectItem value="aluminum">铝材</SelectItem>
                  <SelectItem value="copper">铜材</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField name="process">
              <FieldLabel>工艺</FieldLabel>
              <Select value={form.state.values.process}
                onValueChange={(v) => form.setFieldValue('process', v)}>
                <SelectTrigger><SelectValue placeholder="选择工艺" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quench">淬火</SelectItem>
                  <SelectItem value="temper">回火</SelectItem>
                  <SelectItem value="anneal">退火</SelectItem>
                  <SelectItem value="normalize">正火</SelectItem>
                  <SelectItem value="carburize">渗碳</SelectItem>
                  <SelectItem value="nitride">渗氮</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField name="specification" className="col-span-2">
              <FieldLabel>规格</FieldLabel>
              <Input value={form.state.values.specification}
                onChange={(e) => form.setFieldValue('specification', e.target.value)}
                placeholder="如：Φ20×100" />
            </FormField>

            <FormField name="unit">
              <FieldLabel>单位</FieldLabel>
              <Select value={form.state.values.unit}
                onValueChange={(v) => form.setFieldValue('unit', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="件">件</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="批">批</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField name="pricingMethod">
              <FieldLabel>计价方式</FieldLabel>
              <Select value={form.state.values.pricingMethod}
                onValueChange={(v) => form.setFieldValue('pricingMethod', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">按重量</SelectItem>
                  <SelectItem value="piece">按件数</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField name="unitPrice">
              <FieldLabel>单价</FieldLabel>
              <Input type="number" step="0.01" value={form.state.values.unitPrice}
                onChange={(e) => form.setFieldValue('unitPrice', e.target.value)} />
            </FormField>

            <FormField name="minOrderQty">
              <FieldLabel>最小起订量</FieldLabel>
              <Input type="number" step="0.001" value={form.state.values.minOrderQty}
                onChange={(e) => form.setFieldValue('minOrderQty', e.target.value)} />
            </FormField>

            <FormField name="remark" className="col-span-2">
              <FieldLabel>备注</FieldLabel>
              <Textarea rows={3} value={form.state.values.remark}
                onChange={(e) => form.setFieldValue('remark', e.target.value)} />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit">{product ? '保存' : '创建'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 50.5 API 接口

```typescript
// 产品列表
GET /api/products?search=&material=&process=&page=1&pageSize=20
Response: PaginatedResponse<Product>

// 产品详情
GET /api/products/:id
Response: Product & { inventory: InventoryInfo, records: ProductRecord[] }

// 创建产品
POST /api/products
Body: { name, material, process, specification, unit, pricingMethod, unitPrice, minOrderQty, remark }
Response: Product

// 更新产品
PUT /api/products/:id
Body: Partial<Product>
Response: Product

// 删除产品
DELETE /api/products/:id
Response: { id: string }

// 产品搜索（下拉列表）
GET /api/products/search?q=keyword&material=&process=&limit=20
Response: { items: { id, name, material, process, specification, unit, pricingMethod, unitPrice }[] }
```

### 50.6 产品缓存

```typescript
// 全局产品列表缓存
const [productList, setProductList] = useLocalStorage(STORAGE_KEYS.PRODUCT_LIST, []);

useEffect(() => {
  productApi.getAll().then(list => setProductList(list));
}, []);
```

缓存用途：来货登记、快速发货、库存管理页面快速检索产品。
