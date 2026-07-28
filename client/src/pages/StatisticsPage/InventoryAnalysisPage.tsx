import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Box,
  TrendingUp,
  AlertTriangle,
  Package,
  Clock,
  DollarSign,
  RotateCcw,
  Download,
  BarChart3,
  PieChart,
  Layers
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useData } from '@/data/DataContext';
import { Link } from 'react-router-dom';
import { exportToExcel } from '@/utils/excelExport';
import { toast } from 'sonner';

const formatMoney = (amount: number) => {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(2)}亿`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}万`;
  return amount.toLocaleString();
};

const InventoryAnalysisPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'overview' | 'turnover' | 'abc'>('overview');
  const { products, inventoryRecords } = useData();

  // 库存统计分析
  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalStockWeight = products.reduce((sum, p) => sum + (p.stockWeight || 0), 0);
    const totalInboundWeight = products.reduce((sum, p) => sum + (p.inboundWeight || 0), 0);
    const totalInboundQuantity = products.reduce((sum, p) => sum + (p.inboundQuantity || 0), 0);
    
    // 库存状态分布
    const zeroStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 20).length;
    const normalStock = products.filter(p => p.stock >= 20 && p.stock < 100).length;
    const highStock = products.filter(p => p.stock >= 100 && p.stock < 500).length;
    const overStock = products.filter(p => p.stock >= 500).length;

    // 库存周转分析
    const totalOutbound = inventoryRecords
      .filter(r => r.changeType === 'outbound')
      .reduce((sum, r) => sum + Math.abs(r.quantityChange), 0);
    
    const avgStock = totalStock > 0 ? (totalStock + totalOutbound) / 2 : 0;
    const turnoverRate = avgStock > 0 ? (totalOutbound / avgStock) : 0;
    const turnoverDays = turnoverRate > 0 ? 365 / turnoverRate : 0;

    // 库存价值
    const inventoryValue = products.reduce((sum, p) => sum + (p.stock * (p.unitPrice || 0)), 0);
    const avgUnitPrice = totalStock > 0 ? inventoryValue / totalStock : 0;

    // 产品详情列表
    const productList = products.map(p => {
      const outboundRecords = inventoryRecords.filter(r => 
        r.productId === p.id && r.changeType === 'outbound'
      );
      const totalOutboundQty = outboundRecords.reduce((sum, r) => sum + Math.abs(r.quantityChange), 0);
      const avgStockLevel = (p.stock + totalOutboundQty) / 2;
      const turnover = avgStockLevel > 0 ? totalOutboundQty / avgStockLevel : 0;
      const days = turnover > 0 ? 365 / turnover : 0;
      const value = p.stock * (p.unitPrice || 0);

      return {
        ...p,
        totalOutboundQty,
        turnover,
        days,
        value,
      };
    }).sort((a, b) => b.value - a.value);

    // ABC分类
    const totalValue = productList.reduce((sum, p) => sum + p.value, 0);
    let cumulativeValue = 0;
    const abcAnalysis = productList.map(p => {
      cumulativeValue += p.value;
      const percentage = cumulativeValue / totalValue * 100;
      let category: 'A' | 'B' | 'C';
      if (percentage <= 80) category = 'A';
      else if (percentage <= 95) category = 'B';
      else category = 'C';
      
      return { ...p, category, percentage: p.value / totalValue * 100 };
    });

    const aProducts = abcAnalysis.filter(p => p.category === 'A');
    const bProducts = abcAnalysis.filter(p => p.category === 'B');
    const cProducts = abcAnalysis.filter(p => p.category === 'C');

    // 预警产品
    const warningProducts = productList.filter(p => {
      // 缺货或库存过低
      if (p.stock === 0 || p.stock < 10) return true;
      // 周转过慢（超过180天）
      if (p.days > 180 && p.stock > 50) return true;
      return false;
    });

    return {
      totalProducts,
      totalStock,
      totalStockWeight,
      totalInboundWeight,
      totalInboundQuantity,
      zeroStock,
      lowStock,
      normalStock,
      highStock,
      overStock,
      turnoverRate,
      turnoverDays,
      inventoryValue,
      avgUnitPrice,
      productList,
      abcAnalysis,
      aProducts,
      bProducts,
      cProducts,
      warningProducts,
    };
  }, [products, inventoryRecords]);

  // 库存状态分布图
  const statusDistributionOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}个 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      data: [
        { value: inventoryStats.normalStock, name: '正常库存', itemStyle: { color: '#10b981' } },
        { value: inventoryStats.highStock, name: '高库存', itemStyle: { color: '#3b82f6' } },
        { value: inventoryStats.lowStock, name: '库存预警', itemStyle: { color: '#f59e0b' } },
        { value: inventoryStats.zeroStock, name: '缺货', itemStyle: { color: '#ef4444' } },
        { value: inventoryStats.overStock, name: '积压库存', itemStyle: { color: '#8b5cf6' } },
      ].filter(d => d.value > 0),
    }],
  }), [inventoryStats]);

  // ABC分类图
  const abcChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['品种数', '价值占比'],
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
      data: ['A类', 'B类', 'C类'],
    },
    yAxis: [
      {
        type: 'value',
        name: '品种数',
        position: 'left',
      },
      {
        type: 'value',
        name: '价值占比',
        position: 'right',
        axisLabel: { formatter: '{value}%' },
        max: 100,
      },
    ],
    series: [
      {
        name: '品种数',
        type: 'bar',
        data: [
          inventoryStats.aProducts.length,
          inventoryStats.bProducts.length,
          inventoryStats.cProducts.length,
        ],
        itemStyle: {
          color: (params: any) => ['#f59e0b', '#3b82f6', '#6b7280'][params.dataIndex],
        },
      },
      {
        name: '价值占比',
        type: 'line',
        yAxisIndex: 1,
        data: [
          inventoryStats.aProducts.reduce((sum, p) => sum + p.percentage, 0).toFixed(1),
          inventoryStats.bProducts.reduce((sum, p) => sum + p.percentage, 0).toFixed(1),
          inventoryStats.cProducts.reduce((sum, p) => sum + p.percentage, 0).toFixed(1),
        ],
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 3 },
      },
    ],
  }), [inventoryStats]);

  // 库存周转排行
  const turnoverRankOption = useMemo(() => {
    const sorted = [...inventoryStats.productList]
      .filter(p => p.turnover > 0)
      .sort((a, b) => b.turnover - a.turnover)
      .slice(0, 15);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          const item = sorted[p.dataIndex];
          return `${item.name}<br/>周转率: ${p.value.toFixed(2)}次/年<br/>周转天数: ${item.days.toFixed(0)}天<br/>当前库存: ${item.stock}件`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: '周转率(次/年)',
      },
      yAxis: {
        type: 'category',
        data: sorted.map(p => p.name.slice(0, 10)).reverse(),
      },
      series: [{
        type: 'bar',
        data: sorted.map(p => p.turnover).reverse(),
        barWidth: '60%',
        itemStyle: {
          color: (params: any) => {
            const val = params.value;
            if (val >= 12) return '#10b981';
            if (val >= 6) return '#3b82f6';
            if (val >= 3) return '#f59e0b';
            return '#ef4444';
          },
          borderRadius: [0, 4, 4, 0],
        },
      }],
    };
  }, [inventoryStats.productList]);

  // 导出数据
  const handleExport = () => {
    const data = inventoryStats.abcAnalysis.map(p => ({
      code: p.code,
      name: p.name,
      category: p.category,
      material: p.material || '-',
      process: p.process || '-',
      stock: p.stock,
      unitPrice: p.unitPrice || 0,
      value: p.value,
      percentage: p.percentage.toFixed(2) + '%',
      turnover: p.turnover.toFixed(2),
      days: p.days.toFixed(0),
      status: p.stock === 0 ? '缺货' : p.stock < 10 ? '预警' : p.days > 180 ? '周转慢' : '正常',
    }));

    const columns = [
      { key: 'code', title: '产品编码' },
      { key: 'name', title: '产品名称' },
      { key: 'category', title: 'ABC分类' },
      { key: 'material', title: '材质' },
      { key: 'process', title: '工艺' },
      { key: 'stock', title: '库存量' },
      { key: 'unitPrice', title: '单价' },
      { key: 'value', title: '库存价值' },
      { key: 'percentage', title: '价值占比' },
      { key: 'turnover', title: '周转率' },
      { key: 'days', title: '周转天数' },
      { key: 'status', title: '状态' },
    ];

    exportToExcel(data, columns, `库存分析_${new Date().toISOString().slice(0, 10)}`);
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
            <h1 className="text-2xl font-bold">库存周转分析</h1>
            <p className="text-sm text-muted-foreground mt-1">库存结构、周转率、ABC分类、预警监控</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 视图切换 */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="turnover">周转分析</TabsTrigger>
          <TabsTrigger value="abc">ABC分类</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Package className="h-3 w-3" />
              产品总数
            </div>
            <div className="text-xl font-bold">{inventoryStats.totalProducts}个</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Box className="h-3 w-3" />
              总库存量
            </div>
            <div className="text-xl font-bold">{inventoryStats.totalStock}件</div>
            <div className="text-xs text-muted-foreground">{inventoryStats.totalStockWeight.toFixed(1)}kg</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <DollarSign className="h-3 w-3" />
              库存占用
            </div>
            <div className="text-xl font-bold">¥{formatMoney(inventoryStats.inventoryValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <RotateCcw className="h-3 w-3" />
              周转率
            </div>
            <div className="text-xl font-bold">{inventoryStats.turnoverRate.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">次/年</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Clock className="h-3 w-3" />
              周转天数
            </div>
            <div className={`text-xl font-bold ${inventoryStats.turnoverDays > 180 ? 'text-orange-600' : ''}`}>
              {inventoryStats.turnoverDays.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">天</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
              预警产品
            </div>
            <div className="text-xl font-bold text-orange-600">{inventoryStats.warningProducts.length}个</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 库存状态分布 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              库存状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={statusDistributionOption} style={{ height: 300 }} />
          </CardContent>
        </Card>

        {/* 周转排行或ABC分类 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {viewMode === 'abc' ? <Layers className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
              {viewMode === 'abc' ? 'ABC分类分析' : '库存周转排行'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viewMode === 'abc' ? (
              <ReactECharts option={abcChartOption} style={{ height: 300 }} />
            ) : (
              <ReactECharts option={turnoverRankOption} style={{ height: 300 }} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ABC分类说明 */}
      {viewMode === 'abc' && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-amber-500">A类</Badge>
                <span className="font-medium">重点管控</span>
              </div>
              <p className="text-sm text-muted-foreground">
                品种占比约20%，价值占比约80%<br/>
                建议：每日盘点，严格控制库存量
              </p>
              <div className="mt-2 text-sm">
                <span className="font-medium">{inventoryStats.aProducts.length}个产品</span>
                <span className="text-muted-foreground ml-2">
                  占比{inventoryStats.aProducts.reduce((sum, p) => sum + p.percentage, 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-500">B类</Badge>
                <span className="font-medium">常规管控</span>
              </div>
              <p className="text-sm text-muted-foreground">
                品种占比约30%，价值占比约15%<br/>
                建议：每周盘点，适度控制库存
              </p>
              <div className="mt-2 text-sm">
                <span className="font-medium">{inventoryStats.bProducts.length}个产品</span>
                <span className="text-muted-foreground ml-2">
                  占比{inventoryStats.bProducts.reduce((sum, p) => sum + p.percentage, 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-gray-500">C类</Badge>
                <span className="font-medium">简化管控</span>
              </div>
              <p className="text-sm text-muted-foreground">
                品种占比约50%，价值占比约5%<br/>
                建议：月度盘点，批量采购降低频次
              </p>
              <div className="mt-2 text-sm">
                <span className="font-medium">{inventoryStats.cProducts.length}个产品</span>
                <span className="text-muted-foreground ml-2">
                  占比{inventoryStats.cProducts.reduce((sum, p) => sum + p.percentage, 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 预警产品 */}
      {inventoryStats.warningProducts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              库存预警产品 ({inventoryStats.warningProducts.length}个)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>产品编码</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead>材质/工艺</TableHead>
                  <TableHead className="text-right">当前库存</TableHead>
                  <TableHead className="text-right">周转天数</TableHead>
                  <TableHead className="text-right">库存价值</TableHead>
                  <TableHead>预警类型</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryStats.warningProducts.slice(0, 10).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs">{p.material || '-'}/{p.process || '-'}</TableCell>
                    <TableCell className="text-right">
                      <span className={p.stock === 0 ? 'text-red-600 font-bold' : p.stock < 10 ? 'text-orange-600' : ''}>
                        {p.stock}件
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={p.days > 180 ? 'text-orange-600' : ''}>
                        {p.days > 999 ? '-' : p.days.toFixed(0) + '天'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">¥{p.value.toLocaleString()}</TableCell>
                    <TableCell>
                      {p.stock === 0 ? (
                        <Badge variant="outline" className="text-red-600 border-red-200">缺货</Badge>
                      ) : p.stock < 10 ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">库存不足</Badge>
                      ) : (
                        <Badge variant="outline" className="text-purple-600 border-purple-200">周转慢</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 产品明细表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>产品库存明细</span>
            <span className="text-sm font-normal text-muted-foreground">
              共 {inventoryStats.abcAnalysis.length} 个产品
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>分类</TableHead>
                <TableHead>产品编码</TableHead>
                <TableHead>产品名称</TableHead>
                <TableHead>材质/工艺</TableHead>
                <TableHead className="text-right">库存量</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead className="text-right">库存价值</TableHead>
                <TableHead className="text-right">价值占比</TableHead>
                <TableHead className="text-right">周转率</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryStats.abcAnalysis.slice(0, 20).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Badge className={p.category === 'A' ? 'bg-amber-500' : p.category === 'B' ? 'bg-blue-500' : 'bg-gray-500'}>
                      {p.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-xs">{p.material || '-'}/{p.process || '-'}</TableCell>
                  <TableCell className="text-right">{p.stock}件</TableCell>
                  <TableCell className="text-right">¥{p.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-right">¥{p.value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{p.percentage.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">
                    <span className={p.turnover >= 12 ? 'text-emerald-600' : p.turnover >= 6 ? 'text-blue-600' : p.turnover >= 3 ? 'text-amber-600' : 'text-red-600'}>
                      {p.turnover.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.stock === 0 ? (
                      <Badge variant="outline" className="text-red-600 border-red-200 text-xs">缺货</Badge>
                    ) : p.stock < 10 ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">预警</Badge>
                    ) : p.days > 180 ? (
                      <Badge variant="outline" className="text-purple-600 border-purple-200 text-xs">周转慢</Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">正常</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAnalysisPage;
