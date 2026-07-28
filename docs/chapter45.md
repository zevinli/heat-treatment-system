

---

## 第45章 收发货流程完整规格

### 45.1 来货登记流程

#### 三步收货流程

```
Step 1: 选客户                    Step 2: 选产品                    Step 3: 录数据
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│ ● 搜索客户       │     →       │ ● 搜索/导入产品   │     →       │ ● 录入数量/重量  │
│ ● 选择客户       │              │ ● 多维度检索      │              │ ● 拍照上传       │
│ ● 自动带出信息   │              │ ● 批量勾选       │              │ ● 确认提交       │
│                 │              │ ● 清单导入       │              │ ● 自动打印       │
└─────────────────┘              └─────────────────┘              └─────────────────┘
```

#### Step 1: 选客户

```tsx
function SelectCustomerStep({ onSelect, selected }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { data: customers } = useQuery({
    queryKey: ['customers', 'search', debouncedSearch],
    queryFn: () => customerApi.getCustomers({ search: debouncedSearch, pageSize: 20 }),
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索客户名称/联系人/电话"
          className="pl-10 h-12"
        />
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {customers?.items.map((customer) => (
          <div
            key={customer.id}
            onClick={() => onSelect(customer)}
            className={cn('flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all',
              selected?.id === customer.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50 hover:bg-muted/50')}
          >
            <div className="flex-1">
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-muted-foreground">
                {customer.contactPerson} · {customer.phone}
              </p>
            </div>
            {selected?.id === customer.id && <Check className="w-5 h-5 text-primary" />}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Step 2: 选产品

```tsx
function SelectProductStep({ items, onAdd, onRemove }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ material: '', process: '' });

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <div className="flex gap-3">
        <Input placeholder="搜索产品名称" className="flex-1 h-12" />
        <Select value={filters.material} onValueChange={(v) => setFilters({ ...filters, material: v })}>
          <SelectTrigger className="w-40 h-12"><SelectValue placeholder="材质" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="steel">钢材</SelectItem>
            <SelectItem value="aluminum">铝材</SelectItem>
            <SelectItem value="copper">铜材</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="h-12">
          <Upload className="w-4 h-4 mr-2" />
          清单导入
        </Button>
      </div>

      {/* 产品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
        {products?.map((product) => (
          <ProductSelectCard
            key={product.id}
            product={product}
            isSelected={items.some(i => i.productId === product.id)}
            onToggle={() => onToggleProduct(product)}
          />
        ))}
      </div>

      {/* 已选产品 */}
      {items.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">已选 {items.length} 个产品</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <span className="text-sm">{item.productName}</span>
                <Button variant="ghost" size="sm" onClick={() => onRemove(item.productId)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Step 3: 录数据

```tsx
function RecordDataStep({ items, onUpdate, onImageUpload }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={item.productId}>
          <CardHeader>
            <CardTitle className="text-base">{index + 1}. {item.productName}</CardTitle>
            <CardDescription>{item.material} · {item.process} · {item.specification}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>数量</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdate(item.productId, { quantity: parseInt(e.target.value) })}
                className="h-12"
              />
            </div>
            <div>
              <Label>重量(kg)</Label>
              <Input
                type="number"
                value={item.weight}
                onChange={(e) => onUpdate(item.productId, { weight: parseFloat(e.target.value) })}
                className="h-12"
              />
            </div>
            <div>
              <Label>单价</Label>
              <Input
                type="number"
                value={item.unitPrice}
                onChange={(e) => onUpdate(item.productId, { unitPrice: parseFloat(e.target.value) })}
                className="h-12"
              />
            </div>
            <div>
              <Label>金额</Label>
              <div className="h-12 flex items-center font-semibold text-primary">
                ¥{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
              </div>
            </div>
          </CardContent>
          {onImageUpload && (
            <CardContent>
              <ImageUploader
                images={item.images}
                onChange={(images) => onUpdate(item.productId, { images })}
                maxCount={5}
              />
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
```

#### 底部操作栏

```tsx
function StepFooter({ currentStep, totalSteps, onPrev, onNext, onSubmit, loading }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 ml-60 bg-white border-t p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPrev} disabled={currentStep === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 上一步
        </Button>
      </div>
      <div className="flex items-center gap-3">
        {currentStep < totalSteps - 1 ? (
          <Button onClick={onNext} className="bg-primary">
            下一步 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={onSubmit} disabled={loading} className="bg-accent text-foreground">
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Printer className="w-4 h-4 mr-1" />}
            保存并打印
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 45.2 快速发货流程

#### 智能批次推荐

```typescript
async function recommendBatches(customerId: string): Promise<BatchRecommendation[]> {
  const pendingOrders = await outboundApi.getPendingOrders(customerId);
  const inventory = await inventoryApi.getByCustomer(customerId);

  // 按产品分组，匹配库存
  const recommendations = pendingOrders.reduce((acc, order) => {
    const stock = inventory.find(i => i.productId === order.productId);
    if (!stock || stock.currentQty < order.quantity) return acc;

    const batch = acc.find(b => b.batchNo === order.batchNo);
    if (batch) {
      batch.items.push({ ...order, availableQty: stock.currentQty });
    } else {
      acc.push({
        batchNo: order.batchNo || generateBatchNo(),
        items: [{ ...order, availableQty: stock.currentQty }],
        totalQty: order.quantity,
        totalAmount: order.amount,
      });
    }
    return acc;
  }, []);

  return recommendations;
}
```

#### 发货页面

```tsx
function OutboundPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedItems, setSelectedItems] = useState<OutboundItem[]>([]);
  const [batchNo, setBatchNo] = useState('');

  return (
    <div className="space-y-6">
      <PageHeader title="快速发货" />

      {/* 客户选择 */}
      <CustomerSelect value={selectedCustomer} onChange={setSelectedCustomer} />

      {selectedCustomer && (
        <>
          {/* 批次推荐 */}
          <BatchRecommendation
            customerId={selectedCustomer.id}
            onApply={(batch) => {
              setBatchNo(batch.batchNo);
              setSelectedItems(batch.items);
            }}
          />

          {/* 产品勾选列表 */}
          <ProductCheckoutList
            items={availableProducts}
            selected={selectedItems}
            onToggle={toggleItem}
            onQuantityChange={updateQuantity}
          />

          {/* 汇总信息 */}
          <OutboundSummary items={selectedItems} />

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePartialShip}>
              部分发货（结存留存）
            </Button>
            <Button variant="outline" onClick={handleCloseOrder}>
              关单平账
            </Button>
            <Button className="bg-accent text-foreground" onClick={handlePrintAndSave}>
              <Printer className="w-4 h-4 mr-2" /> 保存并打印送货单
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

#### 部分发货逻辑

```typescript
async function partialShip(recordId: string, items: OutboundItem[]) {
  // 1. 创建出库记录（部分发货）
  const record = await outboundApi.create({
    customerId,
    batchNo,
    items: items.filter(i => i.shipQty > 0),
    status: 'partial',
  });

  // 2. 扣减库存
  for (const item of items) {
    if (item.shipQty > 0) {
      await inventoryApi.adjust({
        productId: item.productId,
        qty: -item.shipQty,
        reason: `出库: ${record.recordNo}`,
      });
    }
  }

  // 3. 结存产品自动留存（不关闭记录）
  toast.success(`已发货 ${items.length} 个产品，结存 ${items.filter(i => i.shipQty === 0).length} 个`);
}

async function closeOrder(recordId: string) {
  // 关单：将未发货的明细标记为关闭，平账处理
  await outboundApi.close(recordId);
  toast.success('订单已关闭，已平账处理');
}
```

### 45.3 清单导入

#### Excel 导入

```typescript
async function importProducts(file: File): Promise<ImportResult> {
  const workbook = XLSX.read(await file.arrayBuffer());
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const items: InboundItem[] = rows.map((row: any) => ({
    productName: row['产品名称'] || row['品名'],
    material: row['材质'],
    process: row['工艺'],
    specification: row['规格'],
    quantity: parseInt(row['数量']) || 0,
    weight: parseFloat(row['重量']) || 0,
    unit: row['单位'] || 'kg',
    unitPrice: parseFloat(row['单价']) || 0,
  }));

  const valid = items.filter(i => i.productName && i.quantity > 0);
  const invalid = items.length - valid.length;

  return { items: valid, total: items.length, invalid };
}
```

#### 导入模板下载

```typescript
function downloadImportTemplate() {
  const template = [
    { 产品名称: '示例产品A', 材质: '钢材', 工艺: '淬火', 规格: 'Φ20×100', 数量: 100, 重量: 15.5, 单位: 'kg', 单价: 12.5 },
    { 产品名称: '示例产品B', 材质: '铝材', 工艺: '阳极氧化', 规格: '50×50×10', 数量: 50, 重量: 2.3, 单位: 'kg', 单价: 25.0 },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '产品清单');
  XLSX.writeFile(wb, '来货登记导入模板.xlsx');
}
```

### 45.4 图片上传

```tsx
function ImageUploader({ images, onChange, maxCount = 5 }) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newImages = await Promise.all(
      acceptedFiles.map(async (file) => {
        const { downloadUrl } = await uploadFile(file);
        return downloadUrl;
      })
    );
    onChange([...images, ...newImages].slice(0, maxCount));
  }, [images, maxCount, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: maxCount - images.length,
  });

  return (
    <div className="flex gap-3 flex-wrap">
      {images.map((url, i) => (
        <div key={i} className="relative w-24 h-24 rounded-md overflow-hidden group">
          <Image src={url} alt={`图片${i+1}`} fill className="object-cover" />
          <button
            onClick={() => onChange(images.filter((_, idx) => idx !== i))}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      {images.length < maxCount && (
        <div {...getRootProps()} className={cn(
          'w-24 h-24 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}>
          <input {...getInputProps()} />
          <Camera className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
```

### 45.5 流程卡打印

入库保存后自动触发打印：

```typescript
async function handleInboundSubmit() {
  setLoading(true);
  try {
    // 1. 创建入库记录
    const record = await inboundApi.create({
      customerId: selectedCustomer.id,
      items: items,
      inboundDate: new Date(),
    });

    // 2. 更新库存
    await inventoryApi.batchAdd(items);

    // 3. 获取打印模板
    const template = await printApi.getDefaultTemplate('tagcard');

    // 4. 渲染并打印
    const html = renderTemplate(template, {
      customer_name: selectedCustomer.name,
      record_no: record.recordNo,
      inbound_date: record.inboundDate,
      items: items,
    });

    await printViaBrowser(html);
    toast.success('入库登记成功，流程卡已打印');
    navigate('/');
  } catch (error) {
    toast.error('保存失败，请重试');
  } finally {
    setLoading(false);
  }
}
```
