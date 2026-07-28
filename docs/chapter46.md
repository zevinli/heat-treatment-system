

---

## 第46章 对账系统完整规格

### 46.1 系统概述

智能对账模块实现业财一体化，自动核对手动对账、差异预警、对账单生成和回款追踪。

#### 对账流程

```
1. 选择客户 + 对账周期
2. 系统自动汇总出库数据
3. 自动比对开票状态和回款进度
4. 标记差异项（红字预警）
5. 人工核对差异
6. 确认后生成对账单
7. 发送给客户确认
8. 记录回款进度
```

### 46.2 对账状态流转

```
unmatched (未对账)
    │
    ├──→ matched (已对账)
    │         │
    │         ├──→ invoiced (已开票)
    │         │         │
    │         │         ├──→ partial_paid (部分回款)
    │         │         │         │
    │         │         │         ├──→ fully_paid (已回款)
    │         │         │
    │         │         └──→ fully_paid (已回款)
    │         │
    │         └──→ partial_paid → fully_paid
    │
    └──→ disputed (有争议)
              │
              └──→ resolved (已解决) → matched
```

### 46.3 对账数据结构

#### 对账记录

```typescript
interface ReconciliationRecord {
  id: string;
  reconciliationNo: string;       // 对账单号
  customerId: string;
  customerName: string;
  period: string;                  // YYYY-MM
  // 汇总数据
  totalOutboundAmount: number;     // 出库总额
  totalInvoicedAmount: number;     // 开票总额
  totalPaidAmount: number;         // 回款总额
  differenceAmount: number;        // 差异金额
  // 状态
  status: 'unmatched' | 'matched' | 'disputed' | 'resolved';
  matchedAt: string | null;
  matchedBy: string | null;
  // 明细
  items: ReconciliationItem[];
  remark: string;
  createdAt: string;
  updatedAt: string;
}

interface ReconciliationItem {
  id: string;
  reconciliationId: string;
  outboundRecordId: string;
  outboundRecordNo: string;
  outboundDate: string;
  totalAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  difference: number;
  status: 'matched' | 'unmatched' | 'disputed';
  remark: string;
}
```

### 46.4 对账页面

#### 筛选栏

```tsx
function ReconciliationFilter({ onFilter }) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label>客户</Label>
          <CustomerSelect
            value={filters.customerId}
            onChange={(c) => onFilter({ customerId: c?.id })}
            placeholder="选择客户"
          />
        </div>
        <div>
          <Label>对账周期</Label>
          <DatePicker
            value={filters.period}
            onChange={(date) => onFilter({ period: dayjs(date).format('YYYY-MM') })}
            picker="month"
          />
        </div>
        <div>
          <Label>状态</Label>
          <Select value={filters.status} onValueChange={(v) => onFilter({ status: v })}>
            <SelectTrigger className="w-32"><SelectValue placeholder="全部" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="unmatched">未对账</SelectItem>
              <SelectItem value="matched">已对账</SelectItem>
              <SelectItem value="disputed">有争议</SelectItem>
              <SelectItem value="resolved">已解决</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-primary" onClick={() => onFilter(filters)}>
          <Search className="w-4 h-4 mr-1" /> 查询
        </Button>
        <Button variant="outline" onClick={handleGenerate}>
          <FilePlus className="w-4 h-4 mr-1" /> 生成对账单
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 对账明细表格

```tsx
function ReconciliationTable({ records, onMatch, onDispute }) {
  const columns = [
    {
      title: '出库单号',
      dataIndex: 'outboundRecordNo',
      width: 150,
    },
    {
      title: '出库日期',
      dataIndex: 'outboundDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '出库金额',
      dataIndex: 'totalAmount',
      width: 120,
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: '已开票',
      dataIndex: 'invoicedAmount',
      width: 120,
      align: 'right',
      render: (val: number, row) => (
        <span className={val === 0 ? 'text-error' : ''}>{formatCurrency(val)}</span>
      ),
    },
    {
      title: '已回款',
      dataIndex: 'paidAmount',
      width: 120,
      align: 'right',
      render: (val: number, row) => (
        <span className={val < row.totalAmount ? 'text-warning' : 'text-success'}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: '差异',
      dataIndex: 'difference',
      width: 120,
      align: 'right',
      render: (val: number) => (
        <span className={val !== 0 ? 'text-error font-semibold' : 'text-muted-foreground'}>
          {val !== 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = {
          matched: { label: '已对账', variant: 'success' },
          unmatched: { label: '未对账', variant: 'warning' },
          disputed: { label: '有争议', variant: 'error' },
        };
        const cfg = config[status] || config.unmatched;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      title: '操作',
      width: 150,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onMatch(row)}>核对</Button>
          <Button size="sm" variant="ghost" onClick={() => onDispute(row)}>标记争议</Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1000 }}
      />
    </Card>
  );
}
```

#### 汇总区域

```tsx
function ReconciliationSummary({ records }) {
  const summary = useMemo(() => {
    return records.reduce((acc, r) => ({
      totalOutbound: acc.totalOutbound + r.totalAmount,
      totalInvoiced: acc.totalInvoiced + r.invoicedAmount,
      totalPaid: acc.totalPaid + r.paidAmount,
      totalDifference: acc.totalDifference + r.difference,
      unmatchedCount: acc.unmatchedCount + (r.status === 'unmatched' ? 1 : 0),
    }), { totalOutbound: 0, totalInvoiced: 0, totalPaid: 0, totalDifference: 0, unmatchedCount: 0 });
  }, [records]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <SummaryCard label="出库总额" value={summary.totalOutbound} format="currency" />
      <SummaryCard label="已开票" value={summary.totalInvoiced} format="currency" />
      <SummaryCard label="已回款" value={summary.totalPaid} format="currency" />
      <SummaryCard
        label="差异金额"
        value={summary.totalDifference}
        format="currency"
        className={summary.totalDifference !== 0 ? 'text-error' : ''}
      />
      <SummaryCard label="未对账笔数" value={summary.unmatchedCount} format="number" />
    </div>
  );
}
```

### 46.5 对账单生成

```typescript
async function generateReconciliation(customerId: string, period: string) {
  // 1. 获取该客户该周期的所有出库记录
  const outboundRecords = await outboundApi.getByCustomerAndPeriod(customerId, period);

  if (outboundRecords.length === 0) {
    toast.warning('该客户在此周期内无出库记录');
    return;
  }

  // 2. 汇总数据
  const totalOutbound = outboundRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalInvoiced = outboundRecords.reduce((sum, r) => sum + (r.invoicedAmount || 0), 0);
  const totalPaid = outboundRecords.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
  const difference = totalOutbound - totalInvoiced;

  // 3. 创建对账记录
  const reconciliation = await reconciliationApi.create({
    reconciliationNo: generateReconciliationNo(),
    customerId,
    period,
    totalOutboundAmount: totalOutbound,
    totalInvoicedAmount: totalInvoiced,
    totalPaidAmount: totalPaid,
    differenceAmount: difference,
    status: 'unmatched',
    items: outboundRecords.map(r => ({
      outboundRecordId: r.id,
      outboundRecordNo: r.recordNo,
      outboundDate: r.outboundDate,
      totalAmount: r.totalAmount,
      invoicedAmount: r.invoicedAmount || 0,
      paidAmount: r.paidAmount || 0,
      difference: r.totalAmount - (r.invoicedAmount || 0),
      status: r.invoicedAmount === r.totalAmount ? 'matched' : 'unmatched',
    })),
  });

  toast.success(`对账单 ${reconciliation.reconciliationNo} 已生成`);
  return reconciliation;
}
```

### 46.6 回款追踪

```tsx
function PaymentTracking({ reconciliation, onRecordPayment }) {
  const [paymentDialog, setPaymentDialog] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>回款追踪</span>
          <Button size="sm" onClick={() => setPaymentDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> 记录回款
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 回款进度条 */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">回款进度</span>
              <span className="text-sm font-medium">
                {formatCurrency(reconciliation.totalPaidAmount)} / {formatCurrency(reconciliation.totalOutboundAmount)}
              </span>
            </div>
            <Progress
              value={(reconciliation.totalPaidAmount / reconciliation.totalOutboundAmount) * 100}
              className="h-3"
            />
            <p className="text-xs text-muted-foreground mt-1">
              回款率 {((reconciliation.totalPaidAmount / reconciliation.totalOutboundAmount) * 100).toFixed(1)}%
            </p>
          </div>

          {/* 回款记录列表 */}
          <div className="space-y-2">
            {reconciliation.payments?.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div>
                  <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-muted-foreground">{payment.date} · {payment.method}</p>
                </div>
                <Badge variant={payment.confirmed ? 'success' : 'warning'}>
                  {payment.confirmed ? '已确认' : '待确认'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <PaymentDialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        reconciliationId={reconciliation.id}
        onConfirm={onRecordPayment}
      />
    </Card>
  );
}
```

### 46.7 对账单导出

```typescript
async function exportReconciliation(reconciliationId: string, format: 'pdf' | 'excel') {
  const reconciliation = await reconciliationApi.getById(reconciliationId);

  if (format === 'excel') {
    const data = reconciliation.items.map(item => ({
      '出库单号': item.outboundRecordNo,
      '出库日期': formatDate(item.outboundDate),
      '出库金额': item.totalAmount,
      '已开票': item.invoicedAmount,
      '已回款': item.paidAmount,
      '差异': item.difference,
      '状态': item.status,
    }));

    data.push({
      '出库单号': '合计',
      '出库日期': '',
      '出库金额': reconciliation.totalOutboundAmount,
      '已开票': reconciliation.totalInvoicedAmount,
      '已回款': reconciliation.totalPaidAmount,
      '差异': reconciliation.differenceAmount,
      '状态': '',
    });

    exportToExcel(data, `对账单_${reconciliation.reconciliationNo}`);
  } else {
    const template = await printApi.getTemplate('reconciliation');
    const html = renderTemplate(template, reconciliation);
    const blob = new Blob([html], { type: 'text/html' });
    printViaBrowser(html);
  }
}
```

### 46.8 API 接口

```typescript
// 对账列表
GET /api/reconciliation?customerId=&period=&status=&page=1&pageSize=20
Response: PaginatedResponse<ReconciliationRecord>

// 对账详情
GET /api/reconciliation/:id
Response: ReconciliationRecord & { items: ReconciliationItem[], payments: Payment[] }

// 生成对账单
POST /api/reconciliation/generate
Body: { customerId, period }
Response: ReconciliationRecord

// 核对明细
POST /api/reconciliation/:id/match
Body: { itemId, matched: boolean, remark }

// 标记争议
POST /api/reconciliation/:id/dispute
Body: { itemId, reason }

// 记录回款
POST /api/reconciliation/:id/payment
Body: { amount, date, method, remark }

// 导出
GET /api/reconciliation/:id/export?format=pdf|excel
Response: Blob
```
