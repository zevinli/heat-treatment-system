import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  AlertTriangle,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  Receipt,
  CreditCard
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useData } from '@/data/DataContext';
import { Link } from 'react-router-dom';
import { exportToExcel } from '@/utils/excelExport';
import { toast } from 'sonner';
import { format, parseISO, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const formatMoney = (amount: number) => {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(2)}亿`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}万`;
  return amount.toLocaleString();
};

const FinanceAnalysisPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const { reconciliations, customers } = useData();

  // 时间范围过滤
  const getFilteredReconciliations = () => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const currentYear = now.getFullYear().toString();

    if (timeRange === 'month') {
      return reconciliations.filter(r => r.month === currentMonth);
    } else if (timeRange === 'quarter') {
      const months: string[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toISOString().slice(0, 7));
      }
      return reconciliations.filter(r => months.includes(r.month));
    } else if (timeRange === 'year') {
      return reconciliations.filter(r => r.month.startsWith(currentYear));
    }
    return reconciliations;
  };

  const filteredReconciliations = getFilteredReconciliations();

  // 财务统计分析
  const financeStats = useMemo(() => {
    const totalReconciliation = filteredReconciliations.reduce((sum, r) => sum + r.finalAmount, 0);
    const totalReceipt = filteredReconciliations.reduce((sum, r) => sum + r.receiptAmount, 0);
    const totalUnreceived = filteredReconciliations.reduce((sum, r) => sum + r.unreceivedAmount, 0);
    const totalInvoice = filteredReconciliations.reduce((sum, r) => sum + r.invoiceAmount, 0);
    const totalUninvoice = filteredReconciliations.reduce((sum, r) => sum + r.uninvoiceAmount, 0);
    const totalDeduction = filteredReconciliations.reduce((sum, r) => sum + r.deductionAmount, 0);

    const receiptRate = totalReconciliation > 0 ? (totalReceipt / totalReconciliation * 100) : 0;
    const invoiceRate = totalReconciliation > 0 ? (totalInvoice / totalReconciliation * 100) : 0;

    // 账龄分析
    const now = new Date();
    const agingBuckets = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days180: 0,
      over180: 0,
    };

    const agingDetails: Array<{
      id: string;
      customerName: string;
      amount: number;
      days: number;
      month: string;
    }> = [];

    filteredReconciliations.forEach(r => {
      if (r.unreceivedAmount > 0) {
        const reconcileDate = new Date(r.month + '-01');
        const days = differenceInDays(now, reconcileDate);
        
        agingDetails.push({
          id: r.id,
          customerName: r.customerName,
          amount: r.unreceivedAmount,
          days,
          month: r.month,
        });

        if (days <= 30) agingBuckets.current += r.unreceivedAmount;
        else if (days <= 60) agingBuckets.days30 += r.unreceivedAmount;
        else if (days <= 90) agingBuckets.days60 += r.unreceivedAmount;
        else if (days <= 180) agingBuckets.days90 += r.unreceivedAmount;
        else agingBuckets.over180 += r.unreceivedAmount;
      }
    });

    // 客户财务分析
    const customerFinanceMap = new Map<string, {
      id: string;
      name: string;
      code: string;
      reconciliation: number;
      receipt: number;
      unreceived: number;
      invoice: number;
      uninvoice: number;
      receiptRate: number;
    }>();

    filteredReconciliations.forEach(r => {
      const existing = customerFinanceMap.get(r.customerId);
      if (existing) {
        existing.reconciliation += r.finalAmount;
        existing.receipt += r.receiptAmount;
        existing.unreceived += r.unreceivedAmount;
        existing.invoice += r.invoiceAmount;
        existing.uninvoice += r.uninvoiceAmount;
      } else {
        customerFinanceMap.set(r.customerId, {
          id: r.customerId,
          name: r.customerName,
          code: r.customerCode,
          reconciliation: r.finalAmount,
          receipt: r.receiptAmount,
          unreceived: r.unreceivedAmount,
          invoice: r.invoiceAmount,
          uninvoice: r.uninvoiceAmount,
          receiptRate: 0,
        });
      }
    });

    const customerList = Array.from(customerFinanceMap.values())
      .map(c => ({
        ...c,
        receiptRate: c.reconciliation > 0 ? (c.receipt / c.reconciliation * 100) : 0,
      }))
      .sort((a, b) => b.unreceived - a.unreceived);

    // 月度趋势（近12个月）
    const monthlyTrend: Array<{
      month: string;
      reconciliation: number;
      receipt: number;
      unreceived: number;
    }> = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().slice(0, 7);
      const monthData = reconciliations.filter(r => r.month === monthStr);
      
      monthlyTrend.push({
        month: `${d.getMonth() + 1}月`,
        reconciliation: monthData.reduce((sum, r) => sum + r.finalAmount, 0),
        receipt: monthData.reduce((sum, r) => sum + r.receiptAmount, 0),
        unreceived: monthData.reduce((sum, r) => sum + r.unreceivedAmount, 0),
      });
    }

    return {
      totalReconciliation,
      totalReceipt,
      totalUnreceived,
      totalInvoice,
      totalUninvoice,
      totalDeduction,
      receiptRate,
      invoiceRate,
      agingBuckets,
      agingDetails: agingDetails.sort((a, b) => b.days - a.days),
      customerList,
      monthlyTrend,
    };
  }, [filteredReconciliations, reconciliations]);

  // 月度趋势图
  const monthlyTrendOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['对账金额', '回款金额', '未回款'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: financeStats.monthlyTrend.map(d => d.month),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => value >= 10000 ? `${(value / 10000).toFixed(0)}万` : value,
      },
    },
    series: [
      {
        name: '对账金额',
        type: 'line',
        data: financeStats.monthlyTrend.map(d => d.reconciliation),
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
      },
      {
        name: '回款金额',
        type: 'line',
        data: financeStats.monthlyTrend.map(d => d.receipt),
        smooth: true,
        itemStyle: { color: '#10b981' },
      },
      {
        name: '未回款',
        type: 'bar',
        data: financeStats.monthlyTrend.map(d => d.unreceived),
        itemStyle: { color: '#f59e0b' },
      },
    ],
  }), [financeStats.monthlyTrend]);

  // 账龄分析图
  const agingOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0];
        return `${p.name}: ¥${p.value.toLocaleString()}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['当前', '1-30天', '31-60天', '61-90天', '91-180天', '180天以上'],
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => value >= 10000 ? `${(value / 10000).toFixed(0)}万` : value,
      },
    },
    series: [{
      type: 'bar',
      data: [
        { value: financeStats.agingBuckets.current, itemStyle: { color: '#10b981' } },
        { value: financeStats.agingBuckets.days30, itemStyle: { color: '#3b82f6' } },
        { value: financeStats.agingBuckets.days60, itemStyle: { color: '#f59e0b' } },
        { value: financeStats.agingBuckets.days90, itemStyle: { color: '#f97316' } },
        { value: financeStats.agingBuckets.days180, itemStyle: { color: '#ef4444' } },
        { value: financeStats.agingBuckets.over180, itemStyle: { color: '#7f1d1d' } },
      ],
      barWidth: '60%',
      label: {
        show: true,
        formatter: (params: any) => params.value > 0 ? `¥${(params.value / 10000).toFixed(1)}万` : '',
      },
    }],
  }), [financeStats.agingBuckets]);

  // 回款状态分布
  const paymentStatusOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}元 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      data: [
        { value: financeStats.totalReceipt, name: '已回款', itemStyle: { color: '#10b981' } },
        { value: financeStats.totalUnreceived, name: '未回款', itemStyle: { color: '#f59e0b' } },
      ],
    }],
  }), [financeStats]);

  // 导出数据
  const handleExport = () => {
    const data = financeStats.customerList.map(c => ({
      code: c.code,
      name: c.name,
      reconciliation: c.reconciliation,
      receipt: c.receipt,
      unreceived: c.unreceived,
      invoice: c.invoice,
      uninvoice: c.uninvoice,
      receiptRate: c.receiptRate.toFixed(1) + '%',
    }));

    const columns = [
      { key: 'code', title: '客户编码' },
      { key: 'name', title: '客户名称' },
      { key: 'reconciliation', title: '对账金额' },
      { key: 'receipt', title: '已回款' },
      { key: 'unreceived', title: '未回款' },
      { key: 'invoice', title: '已开票' },
      { key: 'uninvoice', title: '未开票' },
      { key: 'receiptRate', title: '回款率' },
    ];

    const rangeText = timeRange === 'month' ? '本月' : timeRange === 'quarter' ? '本季度' : timeRange === 'year' ? '本年' : '全部';
    exportToExcel(data, columns, `财务分析_${rangeText}`);
    toast.success('数据导出成功');
  };

  return (
    <div className="w-full space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/statistics">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回统计中心
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">财务报表分析</h1>
            <p className="text-sm text-muted-foreground mt-1">回款趋势、账龄分析、应收统计</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 时间筛选 */}
      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
        <TabsList>
          <TabsTrigger value="month">本月</TabsTrigger>
          <TabsTrigger value="quarter">本季度</TabsTrigger>
          <TabsTrigger value="year">本年</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Receipt className="h-3 w-3" />
              对账金额
            </div>
            <div className="text-xl font-bold">¥{formatMoney(financeStats.totalReconciliation)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Wallet className="h-3 w-3 text-emerald-600" />
              已回款
            </div>
            <div className="text-xl font-bold text-emerald-600">¥{formatMoney(financeStats.totalReceipt)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
              未回款
            </div>
            <div className="text-xl font-bold text-orange-600">¥{formatMoney(financeStats.totalUnreceived)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <DollarSign className="h-3 w-3" />
              回款率
            </div>
            <div className={`text-xl font-bold ${financeStats.receiptRate >= 80 ? 'text-emerald-600' : financeStats.receiptRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {financeStats.receiptRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <CreditCard className="h-3 w-3" />
              已开票
            </div>
            <div className="text-xl font-bold">¥{formatMoney(financeStats.totalInvoice)}</div>
            <div className="text-xs text-muted-foreground">开票率{financeStats.invoiceRate.toFixed(0)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Calendar className="h-3 w-3" />
              对账单数
            </div>
            <div className="text-xl font-bold">{filteredReconciliations.length}单</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 月度趋势 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              月度财务趋势（近12个月）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={monthlyTrendOption} style={{ height: 320 }} />
          </CardContent>
        </Card>

        {/* 账龄分析 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              应收账款账龄分析
            </CardTitle>
            <p className="text-xs text-muted-foreground">按逾期天数统计未回款金额分布</p>
          </CardHeader>
          <CardContent>
            <ReactECharts option={agingOption} style={{ height: 300 }} />
          </CardContent>
        </Card>

        {/* 回款状态 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              回款状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={paymentStatusOption} style={{ height: 300 }} />
          </CardContent>
        </Card>
      </div>

      {/* 账龄预警 */}
      {financeStats.agingDetails.filter(a => a.days > 90).length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              逾期应收账款预警 ({financeStats.agingDetails.filter(a => a.days > 90).length}笔)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>客户名称</TableHead>
                  <TableHead className="text-right">逾期金额</TableHead>
                  <TableHead className="text-right">逾期天数</TableHead>
                  <TableHead>对账月份</TableHead>
                  <TableHead>风险等级</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financeStats.agingDetails
                  .filter(a => a.days > 90)
                  .slice(0, 10)
                  .map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.customerName}</TableCell>
                      <TableCell className="text-right text-red-600 font-bold">
                        ¥{a.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={a.days > 180 ? 'text-red-600' : 'text-orange-600'}>
                          {a.days}天
                        </span>
                      </TableCell>
                      <TableCell>{a.month}</TableCell>
                      <TableCell>
                        {a.days > 180 ? (
                          <Badge variant="outline" className="text-red-600 border-red-200">高风险</Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">中风险</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 客户财务明细 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>客户财务明细</span>
            <span className="text-sm font-normal text-muted-foreground">
              共 {financeStats.customerList.length} 家客户
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户编码</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead className="text-right">对账金额</TableHead>
                <TableHead className="text-right">已回款</TableHead>
                <TableHead className="text-right">未回款</TableHead>
                <TableHead className="text-right">回款率</TableHead>
                <TableHead className="text-right">已开票</TableHead>
                <TableHead className="text-right">未开票</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financeStats.customerList.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.code}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right">¥{c.reconciliation.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-emerald-600">
                    ¥{c.receipt.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">
                    {c.unreceived > 0 ? `¥${c.unreceived.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={c.receiptRate >= 90 ? 'text-emerald-600' : c.receiptRate >= 50 ? 'text-blue-600' : 'text-orange-600'}>
                      {c.receiptRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">¥{c.invoice.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {c.uninvoice > 0 ? `¥${c.uninvoice.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    {c.unreceived > 0 ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        待回款
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">
                        正常
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {financeStats.customerList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    暂无财务数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceAnalysisPage;
