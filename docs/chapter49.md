

---

## 第49章 客户管理模块完整规格

### 49.1 模块概述

客户管理模块维护客户基础信息、历史收发货记录和个性化配置。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 客户列表 | `/customers` | 分页列表、搜索、筛选 |
| 客户详情 | `/customers/:id` | 基本信息+历史记录 |
| 新增客户 | 弹窗 | 表单录入 |
| 编辑客户 | 弹窗 | 表单编辑 |
| 删除客户 | 列表操作 | 二次确认 |
| 查看历史 | 详情页 | 收发货记录列表 |

### 49.2 客户列表页

#### 页面结构

```
客户管理页面
├── 页面标题 + 新增按钮
├── 搜索筛选栏
│   ├── 搜索框（名称/联系人/电话）
│   └── 筛选下拉（材质）
├── 数据表格
│   ├── 客户名称
│   ├── 联系人
│   ├── 电话
│   ├── 地址
│   ├── 创建时间
│   └── 操作（查看/编辑/删除）
├── 分页器
└── 新增/编辑弹窗
```

#### 搜索筛选

```tsx
function CustomerFilterBar({ onFilter }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    onFilter({ search: debouncedSearch });
  }, [debouncedSearch]);

  return (
    <div className="flex gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索客户名称、联系人、电话"
          className="pl-10"
        />
      </div>
      <Button onClick={() setShowCreateDialog(true)} className="bg-primary">
        <Plus className="w-4 h-4 mr-1" /> 新增客户
      </Button>
    </div>
  );
}
```

#### 数据表格

```tsx
function CustomerTable({ data, loading, onEdit, onDelete, onView }) {
  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      render: (name: string, record) => (
        <button onClick={() => onView(record)} className="text-primary hover:underline font-medium">
          {name}
        </button>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      render: (phone: string) => phone || '—',
    },
    {
      title: '地址',
      dataIndex: 'address',
      ellipsis: true,
      render: (addr: string) => addr || '—',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (date: string) => formatDate(date),
      width: 120,
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onView(record)}>
            <Eye className="w-4 h-4" />
          </Button>
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

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={false}
    />
  );
}
```

### 49.3 客户详情页

```tsx
function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id!),
  });
  const { data: history } = useQuery({
    queryKey: ['customer', id, 'history'],
    queryFn: () => customerApi.getHistory(id!),
  });

  if (isLoading) return <Loading />;
  if (!customer) return <NotFound />;

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <Breadcrumb>
        <BreadcrumbItem><Link to="/customers">客户管理</Link></BreadcrumbItem>
        <BreadcrumbItem>{customer.name}</BreadcrumbItem>
      </Breadcrumb>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>客户信息</CardTitle>
          <Button size="sm" variant="outline" onClick={() => navigate(`/customers/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-1" /> 编辑
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DetailItem label="客户名称" value={customer.name} />
            <DetailItem label="联系人" value={customer.contactPerson} />
            <DetailItem label="电话" value={customer.phone} />
            <DetailItem label="邮箱" value={customer.email} />
            <DetailItem label="地址" value={customer.address} span={2} />
            <DetailItem label="税号" value={customer.taxNumber} />
            <DetailItem label="开户行" value={customer.bankName} />
            <DetailItem label="银行账号" value={customer.bankAccount} />
            <DetailItem label="备注" value={customer.remark} span={3} />
          </dl>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="入库笔数" value={history?.inboundCount || 0} />
        <StatCard label="出库笔数" value={history?.outboundCount || 0} />
        <StatCard label="累计金额" value={history?.totalAmount || 0} format="currency" />
        <StatCard label="回款率" value={history?.paymentRate || 0} format="percent" />
      </div>

      {/* 历史记录 */}
      <Card>
        <CardHeader>
          <CardTitle>收发货历史</CardTitle>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="inbound">入库记录</TabsTrigger>
              <TabsTrigger value="outbound">出库记录</TabsTrigger>
              <TabsTrigger value="reconciliation">对账记录</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {tab === 'inbound' && <InboundHistoryTable data={history?.inboundRecords} />}
          {tab === 'outbound' && <OutboundHistoryTable data={history?.outboundRecords} />}
          {tab === 'reconciliation' && <ReconciliationHistoryTable data={history?.reconciliationRecords} />}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 49.4 新增/编辑表单

```tsx
function CustomerFormDialog({ open, onClose, customer }) {
  const form = useForm({
    defaultValues: customer || {
      name: '', contactPerson: '', phone: '', email: '',
      address: '', taxNumber: '', bankName: '', bankAccount: '', remark: '',
    },
    validators: {
      onChange: {
        name: ({ value }) => !value ? '客户名称必填' : undefined,
        phone: ({ value }) => value && !isValidPhone(value) ? '手机号格式不正确' : undefined,
        email: ({ value }) => value && !isValidEmail(value) ? '邮箱格式不正确' : undefined,
      },
    },
  });

  const mutation = useMutation({
    mutationFn: (values) => customer
      ? customerApi.update(customer.id, values)
      : customerApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(customer ? '更新成功' : '创建成功');
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer ? '编辑客户' : '新增客户'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <FormField name="name">
              <FieldLabel>客户名称 <span className="text-error">*</span></FieldLabel>
              <Input value={form.state.values.name}
                onChange={(e) => form.setFieldValue('name', e.target.value)} />
              <FieldError>{form.state.errors.name}</FieldError>
            </FormField>

            <FormField name="contactPerson">
              <FieldLabel>联系人</FieldLabel>
              <Input value={form.state.values.contactPerson}
                onChange={(e) => form.setFieldValue('contactPerson', e.target.value)} />
            </FormField>

            <FormField name="phone">
              <FieldLabel>电话</FieldLabel>
              <Input value={form.state.values.phone}
                onChange={(e) => form.setFieldValue('phone', e.target.value)} />
              <FieldError>{form.state.errors.phone}</FieldError>
            </FormField>

            <FormField name="email">
              <FieldLabel>邮箱</FieldLabel>
              <Input type="email" value={form.state.values.email}
                onChange={(e) => form.setFieldValue('email', e.target.value)} />
              <FieldError>{form.state.errors.email}</FieldError>
            </FormField>

            <FormField name="address" className="col-span-2">
              <FieldLabel>地址</FieldLabel>
              <Input value={form.state.values.address}
                onChange={(e) => form.setFieldValue('address', e.target.value)} />
            </FormField>

            <FormField name="taxNumber">
              <FieldLabel>税号</FieldLabel>
              <Input value={form.state.values.taxNumber}
                onChange={(e) => form.setFieldValue('taxNumber', e.target.value)} />
            </FormField>

            <FormField name="bankName">
              <FieldLabel>开户行</FieldLabel>
              <Input value={form.state.values.bankName}
                onChange={(e) => form.setFieldValue('bankName', e.target.value)} />
            </FormField>

            <FormField name="bankAccount">
              <FieldLabel>银行账号</FieldLabel>
              <Input value={form.state.values.bankAccount}
                onChange={(e) => form.setFieldValue('bankAccount', e.target.value)} />
            </FormField>

            <FormField name="remark" className="col-span-2">
              <FieldLabel>备注</FieldLabel>
              <Textarea rows={3} value={form.state.values.remark}
                onChange={(e) => form.setFieldValue('remark', e.target.value)} />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {customer ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 49.5 API 接口

```typescript
// 客户列表
GET /api/customers?search=&page=1&pageSize=20
Response: PaginatedResponse<Customer>

// 客户详情
GET /api/customers/:id
Response: Customer

// 创建客户
POST /api/customers
Body: { name, contactPerson, phone, email, address, taxNumber, bankName, bankAccount, remark }
Response: Customer

// 更新客户
PUT /api/customers/:id
Body: Partial<Customer>
Response: Customer

// 删除客户
DELETE /api/customers/:id
Response: { id: string }

// 客户历史记录
GET /api/customers/:id/history
Response: { inboundCount, outboundCount, totalAmount, paymentRate, inboundRecords, outboundRecords, reconciliationRecords }

// 客户下拉列表（搜索）
GET /api/customers/search?q=keyword&limit=20
Response: { items: { id, name, contactPerson, phone }[] }
```

### 49.6 客户缓存

```typescript
// 全局客户列表缓存（用于快速检索）
const [customerList, setCustomerList] = useLocalStorage(STORAGE_KEYS.CUSTOMER_LIST, []);

// 启动时加载
useEffect(() => {
  customerApi.getAll().then(list => setCustomerList(list));
}, []);
```

缓存用途：
- 来货登记页面快速选择客户
- 快速发货页面快速选择客户
- 智能对账页面快速选择客户
