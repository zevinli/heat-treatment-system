import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Users,
  TrendingUp,
  Wallet,
  Clock,
  Star,
  Award,
  AlertTriangle,
  Download,
  PieChart,
  BarChart3,
  Target
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

const CustomerAnalysisPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const { customers, reconciliations, outboundOrders } = useData();

  // 时间范围过滤
  const getTimeRangeFilter = () => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    
    if (timeRange === 'month') {
      return { month: currentMonth, label: '本月' };
    } else if (timeRange === 'quarter') {
      const months: string[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toISOString().slice(0, 7));
      }
      return { months, label: '本季度' };
    } else {
      const year = now.getFullYear().toString();
      return { year, label: '本年' };
    }
  };

  const timeFilter = getTimeRangeFilter();

  // 客户详细分析数据
  const customerAnalysis = useMemo(() => {
    const customerMap = new Map<string, {
      id: string;
      name: string;
      code: string;
      reconciliationAmount: number;
      receiptAmount: number;
      unreceivedAmount: number;
      orderCount: number;
      totalQuantity: number;
      firstOrderDate: string | null;
      lastOrderDate: string | null;
      monthlyAmounts: Map<string, number>;
    }>();

    // 根据时间范围筛选对账单
    const filteredReconciliations = reconciliations.filter(r => {
      if (timeRange === 'month') return r.month === (timeFilter as { month: string }).month;
      if (timeRange === 'quarter') return (timeFilter as { months: string[] }).months.includes(r.month);
      return r.month.startsWith((timeFilter as { year: string }).year);
    });

    // 根据时间范围筛选出库单
    const filteredOrders = outboundOrders.filter(o => {
      const orderMonth = o.outboundDate.slice(0, 7);
      if (timeRange === 'month') return orderMonth === (timeFilter as { month: string }).month;
      if (timeRange === 'quarter') return (timeFilter as { months: string[] }).months.includes(orderMonth);
      return orderMonth.startsWith((timeFilter as { year: string }).year);
    });

    filteredReconciliations.forEach(r => {
      const existing = customerMap.get(r.customerId);
      if (existing) {
        existing.reconciliationAmount += r.finalAmount;
        existing.receiptAmount += r.receiptAmount;
        existing.unreceivedAmount += r.unreceivedAmount;
        existing.monthlyAmounts.set(r.month, (existing.monthlyAmounts.get(r.month) || 0) + r.finalAmount);
      } else {
        const monthlyAmounts = new Map<string, number>();
        monthlyAmounts.set(r.month, r.finalAmount);
        customerMap.set(r.customerId, {
          id: r.customerId,
          name: r.customerName,
          code: r.customerCode,
          reconciliationAmount: r.finalAmount,
          receiptAmount: r.receiptAmount,
          unreceivedAmount: r.unreceivedAmount,
          orderCount: 0,
          totalQuantity: 0,
          firstOrderDate: null,
          lastOrderDate: null,
          monthlyAmounts,
        });
      }
    });

    filteredOrders.forEach(o => {
      const existing = customerMap.get(o.customerId);
      if (existing) {
        existing.orderCount++;
        existing.totalQuantity += o.totalQuantity;
        if (!existing.lastOrderDate || o.outboundDate > existing.lastOrderDate) {
          existing.lastOrderDate = o.outboundDate;
        }
        if (!existing.firstOrderDate || o.outboundDate < existing.firstOrderDate) {
          existing.firstOrderDate = o.outboundDate;
        }
      } else {
        customerMap.set(o.customerId, {
          id: o.customerId,
          name: o.customerName,
          code: o.customerCode,
          reconciliationAmount: 0,
          receiptAmount: 0,
          unreceivedAmount: 0,
          orderCount: 1,
          totalQuantity: o.totalQuantity,
          firstOrderDate: o.outboundDate,
          lastOrderDate: o.outboundDate,
          monthlyAmounts: new Map(),
        });
      }
    });

    const list = Array.from(customerMap.values())
      .map(c => ({
        ...c,
        receiptRate: c.reconciliationAmount > 0 ? (c.receiptAmount / c.reconciliationAmount * 100) : 0,
        avgOrderAmount: c.orderCount > 0 ? (c.reconciliationAmount / c.orderCount) : 0,
        customerLifetime: c.firstOrderDate && c.lastOrderDate 
          ? differenceInDays(parseISO(c.lastOrderDate), parseISO(c.firstOrderDate)) + 1
          : 0,
      }))
      .sort((a, b) => b.reconciliationAmount - a.reconciliationAmount);

    // 客户分层
    const totalAmount = list.reduce((sum, c) => sum + c.reconciliationAmount, 0);
    const vipCustomers = list.filter(c => c.reconciliationAmount >= totalAmount * 0.1 || c.reconciliationAmount >= 50000);
    const regularCustomers = list.filter(c => {
      const amount = c.reconciliationAmount;
      return amount >= 10000 && amount < 50000 && amount < totalAmount * 0.1;
    });
    const smallCustomers = list.filter(c => c.reconciliationAmount < 10000);

    // 风险客户（回款率低于50%且金额大于1万）
    const riskCustomers = list.filter(c => c.receiptRate < 50 && c.unreceivedAmount > 10000);

    // 优质客户（回款率大于90%且金额大于1万）
    const goodCustomers = list.filter(c => c.receiptRate >= 90 && c.reconciliationAmount > 10000);

    return {
      list,
      totalCustomers: list.length,
      vipCustomers,
      regularCustomers,
      smallCustomers,
      riskCustomers,
      goodCustomers,
      totalAmount,
      avgAmount: list.length > 0 ? totalAmount / list.length : 0,
    };
  }, [reconciliations, outboundOrders, timeRange, timeFilter]);

  // 客户价值矩阵图配置
  const valueMatrixOption = useMemo(() => {
    const data = customerAnalysis.list.map(c => ({
      name: c.name.slice(0, 8),
      value: [c.orderCount, c.reconciliationAmount, c.receiptRate, c.name],
    }));

    return {
      tooltip: {
        formatter: (params: any) => {
          const [orders, amount, rate, name] = params.data.value;
          return `${name}<br/>订单数: ${orders}单<br/>对账金额: ¥${amount.toLocaleString()}<br/>回款率: ${rate.toFixed(1)}%`;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '10%',
      },
      xAxis: {
        name: '订单数量',
        nameLocation: 'middle',
        nameGap: 30,
        type: 'value',
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      yAxis: {
        name: '对账金额',
        nameLocation: 'middle',
        nameGap: 50,
        type: 'value',
        axisLabel: {
          formatter: (value: number) => value >= 10000 ? `${(value / 10000).toFixed(0)}万` : value,
        },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [{
        type: 'scatter',
        symbolSize: (data: number[]) => Math.max(10, data[2] / 5),
        data,
        itemStyle: {
          color: (params: any) => {
            const rate = params.data.value[2];
            if (rate >= 90) return '#10b981';
            if (rate >= 50) return '#3b82f6';
            return '#f59e0b';
          },
          opacity: 0.8,
        },
      }],
    };
  }, [customerAnalysis.list]);

  // 客户贡献度帕累托图
  const paretoOption = useMemo(() => {
    const sorted = [...customerAnalysis.list].sort((a, b) => b.reconciliationAmount - a.reconciliationAmount);
    const top20 = sorted.slice(0, 20);
    const names = top20.map(c => c.name.slice(0, 6));
    const amounts = top20.map(c => c.reconciliationAmount);
    const cumulative = amounts.reduce((acc: number[], curr, i) => {
      acc.push((acc[i - 1] || 0) + curr);
      return acc;
    }, []);
    const total = cumulative[cumulative.length - 1] || 1;
    const percentages = cumulative.map(v => (v / total * 100).toFixed(1));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['对账金额', '累计占比'],
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
        data: names,
        axisLabel: { rotate: 45 },
      },
      yAxis: [
        {
          type: 'value',
          name: '金额',
          axisLabel: {
            formatter: (value: number) => value >= 10000 ? `${(value / 10000).toFixed(0)}万` : value,
          },
        },
        {
          type: 'value',
          name: '占比',
          max: 100,
          axisLabel: { formatter: '{value}%' },
        },
      ],
      series: [
        {
          name: '对账金额',
          type: 'bar',
          data: amounts,
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '累计占比',
          type: 'line',
          yAxisIndex: 1,
          data: percentages,
          itemStyle: { color: '#f59e0b' },
          lineStyle: { width: 3 },
        },
      ],
    };
  }, [customerAnalysis.list]);

  // 导出数据
  const handleExport = () => {
    const data = customerAnalysis.list.map(c => ({
      code: c.code,
      name: c.name,
      reconciliationAmount: c.reconciliationAmount,
      receiptAmount: c.receiptAmount,
      unreceivedAmount: c.unreceivedAmount,
      receiptRate: c.receiptRate.toFixed(1) + '%',
      orderCount: c.orderCount,
      totalQuantity: c.totalQuantity,
      avgOrderAmount: c.avgOrderAmount.toFixed(2),
      customerLifetime: c.customerLifetime + '天',
      tier: c.reconciliationAmount >= customerAnalysis.totalAmount * 0.1 ? 'VIP' : 
            c.reconciliationAmount >= 10000 ? '普通' : '小客户',
    }));

    const columns = [
      { key: 'code', title: '客户编码' },
      { key: 'name', title: '客户名称' },
      { key: 'tier', title: '客户等级' },
      { key: 'reconciliationAmount', title: '对账金额' },
      { key: 'receiptAmount', title: '已回款' },
      { key: 'unreceivedAmount', title: '未回款' },
      { key: 'receiptRate', title: '回款率' },
      { key: 'orderCount', title: '订单数' },
      { key: 'totalQuantity', title: '出库数量' },
      { key: 'avgOrderAmount', title: '均单金额' },
      { key: 'customerLifetime', title: '合作时长' },
    ];

    exportToExcel(data, columns, `客户分析_${timeFilter.label}`);
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
            <h1 className="text-2xl font-bold">客户深度分析</h1>
            <p className="text-sm text-muted-foreground mt-1">客户价值评估、回款分析、贡献度排行</p>
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
        </TabsList>
      </Tabs>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Users className="h-3 w-3" />
              活跃客户
            </div>
            <div className="text-xl font-bold">{customerAnalysis.totalCustomers}家</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Wallet className="h-3 w-3" />
              总对账金额
            </div>
            <div className="text-xl font-bold">¥{formatMoney(customerAnalysis.totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <TrendingUp className="h-3 w-3" />
              客户均额
            </div>
            <div className="text-xl font-bold">¥{formatMoney(customerAnalysis.avgAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Star className="h-3 w-3" />
              VIP客户
            </div>
            <div className="text-xl font-bold">{customerAnalysis.vipCustomers.length}家</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Award className="h-3 w-3 text-emerald-600" />
              优质客户
            </div>
            <div className="text-xl font-bold text-emerald-600">{customerAnalysis.goodCustomers.length}家</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
              风险客户
            </div>
            <div className="text-xl font-bold text-orange-600">{customerAnalysis.riskCustomers.length}家</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 客户价值矩阵 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              客户价值矩阵（订单量 × 金额）
            </CardTitle>
            <p className="text-xs text-muted-foreground">气泡大小代表回款率，绿色为优质客户</p>
          </CardHeader>
          <CardContent>
            <ReactECharts option={valueMatrixOption} style={{ height: 350 }} />
          </CardContent>
        </Card>

        {/* 帕累托图 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              客户贡献度帕累托分析
            </CardTitle>
            <p className="text-xs text-muted-foreground">识别核心高价值客户（80/20法则）</p>
          </CardHeader>
          <CardContent>
            <ReactECharts option={paretoOption} style={{ height: 350 }} />
          </CardContent>
        </Card>
      </div>

      {/* 客户明细表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>客户明细分析</span>
            <span className="text-sm font-normal text-muted-foreground">
              共 {customerAnalysis.list.length} 家客户
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>客户编码</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead>等级</TableHead>
                <TableHead className="text-right">对账金额</TableHead>
                <TableHead className="text-right">已回款</TableHead>
                <TableHead className="text-right">回款率</TableHead>
                <TableHead className="text-right">订单数</TableHead>
                <TableHead className="text-right">均单金额</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerAnalysis.list.map((c, index) => {
                const tier = c.reconciliationAmount >= customerAnalysis.totalAmount * 0.1 ? 'VIP' : 
                            c.reconciliationAmount >= 10000 ? '普通' : '小客户';
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      {index < 3 ? (
                        <Badge className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}>
                          {index + 1}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.code}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant={tier === 'VIP' ? 'default' : 'outline'}>
                        {tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">¥{c.reconciliationAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-emerald-600">
                      ¥{c.receiptAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={c.receiptRate >= 90 ? 'text-emerald-600' : c.receiptRate >= 50 ? 'text-blue-600' : 'text-orange-600'}>
                        {c.receiptRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{c.orderCount}单</TableCell>
                    <TableCell className="text-right">¥{c.avgOrderAmount.toFixed(0)}</TableCell>
                    <TableCell>
                      {c.receiptRate >= 90 && c.reconciliationAmount > 10000 ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          优质
                        </Badge>
                      ) : c.receiptRate < 50 && c.unreceivedAmount > 10000 ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          风险
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 text-xs">正常</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerAnalysisPage;
