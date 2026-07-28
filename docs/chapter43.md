

---

## 第43章 数据统计与报表系统

### 43.1 系统架构

数据统计模块提供多维度业务数据分析，支持年/月/日报表切换，图表展示和导出功能。

#### 统计维度

```
数据统计
├── 综合报表
│   ├── 收发货总量趋势
│   ├── 金额趋势
│   └── 同比/环比分析
├── 客户分析
│   ├── 发货量排行
│   ├── 回款率分析
│   └── 客户活跃度
├── 产品分析
│   ├── 产品热力图
│   ├── 加工周期统计
│   └── 产品排行
├── 延误分析
│   ├── 延误订单数量
│   ├── 延误原因分布
│   └── 延误趋势
└── 库存分析
    ├── 库存周转率
    ├── 库存预警
    └── 库龄分布
```

### 43.2 统计指标定义

#### 综合指标

| 指标 | 计算方式 | 展示形式 |
|------|---------|---------|
| 入库总量 | SUM(inbound_item.quantity) | 数字+趋势线 |
| 出库总量 | SUM(outbound_item.quantity) | 数字+趋势线 |
| 入库总金额 | SUM(inbound_item.amount) | 数字+趋势线 |
| 出库总金额 | SUM(outbound_item.amount) | 数字+趋势线 |
| 当前库存量 | SUM(inventory.current_qty) | 数字 |
| 待对账金额 | SUM(reconciliation.difference_amount WHERE status='unmatched') | 数字 |
| 回款率 | total_paid / total_outbound × 100% | 百分比 |
| 库存周转率 | 出库量 / 平均库存 × 100% | 百分比 |

#### 客户分析指标

| 指标 | 计算方式 | 展示形式 |
|------|---------|---------|
| 客户发货量排行 | GROUP BY customer, SUM(qty) ORDER BY DESC | 柱状图 |
| 客户回款率 | total_paid / total_outbound × 100% | 饼图 |
| 客户活跃度 | 近30天操作次数 | 热力图 |
| 新增客户数 | COUNT(WHERE created_at >= period_start) | 数字 |

#### 产品分析指标

| 指标 | 计算方式 | 展示形式 |
|------|---------|---------|
| 产品热度 | 入库+出库频次 | 热力图 |
| 加工周期 | AVG(outbound_date - inbound_date) | 数字 |
| 产品排行 | GROUP BY product, SUM(qty) ORDER BY DESC | 柱状图 |
| 库存预警 | WHERE current_qty < threshold | 列表 |

#### 延误分析指标

| 指标 | 计算方式 | 展示形式 |
|------|---------|---------|
| 延误订单数 | COUNT(WHERE delivery_date < actual_date) | 数字 |
| 延误率 | 延误数 / 总数 × 100% | 百分比 |
| 延误原因分布 | GROUP BY delay_reason, COUNT | 饼图 |
| 延误趋势 | 按月统计延误数 | 折线图 |

### 43.3 图表配置

#### 图表类型与场景

| 图表类型 | 适用场景 | ECharts type |
|---------|---------|-------------|
| 折线图 | 趋势分析（时间序列） | line |
| 柱状图 | 排行对比 | bar |
| 饼图 | 占比分布 | pie |
| 热力图 | 产品热度 | heatmap |
| 面积图 | 累积趋势 | line + areaStyle |
| 仪表盘 | 回款率 | gauge |

#### 图表配色

```typescript
const CHART_COLORS = {
  primary: 'hsl(215 70% 35%)',     // 工业蓝 - 主系列
  accent: 'hsl(38 92% 50%)',      // 琥珀色 - 次系列
  success: 'hsl(142 71% 45%)',    // 绿色 - 正向数据
  error: 'hsl(0 72% 51%)',        // 红色 - 负向数据
  purple: 'hsl(245 70% 50%)',    // 紫色 - 辅助
  cyan: 'hsl(185 60% 45%)',       // 青色 - 辅助
};

const CHART_COLOR_SERIES = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.purple,
  CHART_COLORS.cyan,
  CHART_COLORS.error,
];
```

#### ECharts 基础配置

```typescript
const baseOption = {
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'hsl(0 0% 100%)',
    borderColor: 'hsl(214 32% 91%)',
    textStyle: { color: 'hsl(222 47% 11%)' },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  color: CHART_COLOR_SERIES,
  textStyle: {
    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
    color: 'hsl(215 16% 47%)',
  },
};
```

### 43.4 趋势折线图

```typescript
const trendOption = {
  ...baseOption,
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    axisLine: { lineStyle: { color: 'hsl(214 32% 91%)' } },
    axisLabel: { color: 'hsl(215 16% 47%)' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'hsl(214 32% 91%)', type: 'dashed' } },
    axisLabel: { color: 'hsl(215 16% 47%)' },
  },
  series: [
    {
      name: '入库量',
      type: 'line',
      smooth: true,
      data: [120, 132, 101, 134, 90, 230],
      itemStyle: { color: CHART_COLORS.primary },
      areaStyle: { opacity: 0.1 },
    },
    {
      name: '出库量',
      type: 'line',
      smooth: true,
      data: [220, 182, 191, 234, 290, 330],
      itemStyle: { color: CHART_COLORS.accent },
      areaStyle: { opacity: 0.1 },
    },
  ],
};
```

### 43.5 客户排行柱状图

```typescript
const customerRankOption = {
  ...baseOption,
  xAxis: {
    type: 'value',
    axisLabel: { color: 'hsl(215 16% 47%)' },
  },
  yAxis: {
    type: 'category',
    data: ['客户A', '客户B', '客户C', '客户D', '客户E'],
    axisLabel: { color: 'hsl(215 16% 47%)' },
  },
  series: [{
    type: 'bar',
    data: [320, 280, 220, 180, 150],
    itemStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 1, y2: 0,
        colorStops: [
          { offset: 0, color: 'hsl(215 70% 35%)' },
          { offset: 1, color: 'hsl(215 70% 50%)' },
        ],
      },
      borderRadius: [0, 4, 4, 0],
    },
    barWidth: '60%',
    label: { show: true, position: 'right', color: 'hsl(222 47% 11%)' },
  }],
};
```

### 43.6 回款率饼图

```typescript
const paymentRateOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%', left: 'center' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    label: { show: true, formatter: '{b}: {d}%' },
    data: [
      { value: 65, name: '已回款', itemStyle: { color: CHART_COLORS.success } },
      { value: 20, name: '部分回款', itemStyle: { color: CHART_COLORS.accent } },
      { value: 15, name: '未回款', itemStyle: { color: CHART_COLORS.error } },
    ],
  }],
};
```

### 43.7 产品热力图

```typescript
const heatmapOption = {
  ...baseOption,
  tooltip: { position: 'top' },
  grid: { height: '50%', top: '10%' },
  xAxis: { type: 'category', data: products, splitArea: { show: true } },
  yAxis: { type: 'category', data: months, splitArea: { show: true } },
  visualMap: {
    min: 0, max: 100,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '5%',
    inRange: { color: ['hsl(210 40% 96%)', 'hsl(215 70% 35%)'] },
  },
  series: [{
    type: 'heatmap',
    data: heatmapData,
    label: { show: true },
  }],
};
```

### 43.8 KPI 指标卡

```tsx
function KPICard({ title, value, unit, trend, trendValue, icon }) {
  return (
    <Card className="data-ai-section-type card-stat">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1 mt-2">
              <CountUp end={value} duration={0.8} className="text-3xl font-bold text-foreground" />
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {trend && (
              <div className={cn('flex items-center gap-1 mt-2 text-sm',
                trend === 'up' ? 'text-success' : 'text-error')}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{trendValue}%</span>
                <span className="text-muted-foreground">vs 上期</span>
              </div>
            )}
          </div>
          {icon && <div className="text-primary opacity-80">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 43.9 报表导出

#### Excel 导出

```typescript
import * as XLSX from 'xlsx';

function exportToExcel(data: any[], filename: string, sheetName = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
```

#### PDF 导出

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function exportToPDF(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`${filename}.pdf`);
}
```

### 43.10 API 接口

```typescript
// 综合统计
GET /api/statistics/overview?period=month&date=2024-01
Response: { inboundTotal, outboundTotal, inboundAmount, outboundAmount, inventoryTotal, pendingReconciliation }

// 趋势数据
GET /api/statistics/trend?period=month&startDate=2024-01-01&endDate=2024-06-30
Response: { labels: string[], inbound: number[], outbound: number[], amount: number[] }

// 客户排行
GET /api/statistics/customer-rank?period=month&date=2024-01&limit=10
Response: { items: { customerId, customerName, totalQty, totalAmount, paymentRate }[] }

// 产品排行
GET /api/statistics/product-rank?period=month&date=2024-01&limit=10
Response: { items: { productId, productName, totalQty, totalAmount }[] }

// 延误分析
GET /api/statistics/delay?period=month&date=2024-01
Response: { totalOrders, delayedOrders, delayRate, reasons: { reason, count }[] }

// 库存分析
GET /api/statistics/inventory
Response: { totalItems, totalQty, lowStockItems, expiredItems, turnoverRate }

// 导出报表
POST /api/statistics/export
Body: { type: 'overview' | 'customer' | 'product', period, format: 'excel' | 'pdf' }
Response: Blob (Excel/PDF file)
```

### 43.11 页面布局

```
数据统计页面
├── 时间范围选择器（年/月/日 + 日期选择）
├── KPI 指标卡行（6个指标卡，Grid布局）
│   ├── 入库总量
│   ├── 出库总量
│   ├── 入库金额
│   ├── 出库金额
│   ├── 当前库存
│   └── 待对账金额
├── 趋势图区域
│   ├── 收发货趋势（折线图）
│   └── 金额趋势（折线图）
├── 排行区域（2列布局）
│   ├── 客户发货排行（横向柱状图）
│   └── 产品热度排行（横向柱状图）
├── 分布区域（2列布局）
│   ├── 回款率分布（饼图）
│   └── 延误原因分布（饼图）
├── 热力图区域
│   └── 产品×月份热力图
└── 导出按钮（Excel/PDF）
```
