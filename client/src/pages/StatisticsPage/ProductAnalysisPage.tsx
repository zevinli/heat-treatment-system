import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Layers,
  TrendingUp,
  Package,
  BarChart3,
  PieChart,
  Hash,
  Flame,
  Download,
  Target,
  Factory
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

const ProductAnalysisPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'overview' | 'material' | 'process'>('overview');
  const { products, inventoryRecords, outboundOrders } = useData();

  // 产品统计分析
  const productStats = useMemo(() => {
    // 材质分布
    const materialMap = new Map<string, { count: number; stock: number; value: number }>();
    // 工艺分布
    const processMap = new Map<string, { count: number; stock: number; value: number }>();
    // 客户分布
    const customerProductMap = new Map<string, Set<string>>();

    products.forEach(p => {
      const material = p.material || '未分类';
      const process = p.process || '未分类';
      const value = p.stock * (p.unitPrice || 0);

      // 材质统计
      const matStat = materialMap.get(material) || { count: 0, stock: 0, value: 0 };
      matStat.count++;
      matStat.stock += p.stock;
      matStat.value += value;
      materialMap.set(material, matStat);

      // 工艺统计
      const procStat = processMap.get(process) || { count: 0, stock: 0, value: 0 };
      procStat.count++;
      procStat.stock += p.stock;
      procStat.value += value;
      processMap.set(process, procStat);

      // 客户产品关系
      const customerSet = customerProductMap.get(p.customerCode) || new Set();
      customerSet.add(p.id);
      customerProductMap.set(p.customerCode, customerSet);
    });

    const materialDistribution = Array.from(materialMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.value - a.value);

    const processDistribution = Array.from(processMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.value - a.value);

    // 产品详情（含出库统计）
    const productDetails = products.map(p => {
      const outboundRecs = inventoryRecords.filter(r => 
        r.productId === p.id && r.changeType === 'outbound'
      );
      const totalOutbound = outboundRecs.reduce((sum, r) => sum + Math.abs(r.quantityChange), 0);
      const totalOutboundWeight = outboundRecs.reduce((sum, r) => sum + Math.abs(r.weightChange), 0);
      const revenue = totalOutbound * (p.unitPrice || 0);
      const stockValue = p.stock * (p.unitPrice || 0);

      return {
        ...p,
        totalOutbound,
        totalOutboundWeight,
        revenue,
        stockValue,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 热销产品排行
    const topProducts = productDetails.filter(p => p.totalOutbound > 0).slice(0, 20);

    // 滞销产品（有库存但无出库）
    const stagnantProducts = productDetails.filter(p => p.stock > 0 && p.totalOutbound === 0);

    // 统计汇总
    const totalRevenue = productDetails.reduce((sum, p) => sum + p.revenue, 0);
    const totalStockValue = productDetails.reduce((sum, p) => sum + p.stockValue, 0);
    const avgPrice = products.length > 0 
      ? products.reduce((sum, p) => sum + (p.unitPrice || 0), 0) / products.length 
      : 0;

    return {
      totalProducts: products.length,
      totalRevenue,
      totalStockValue,
      avgPrice,
      materialDistribution,
      processDistribution,
      productDetails,
      topProducts,
      stagnantProducts,
      uniqueMaterials: materialMap.size,
      uniqueProcesses: processMap.size,
      customerCount: customerProductMap.size,
    };
  }, [products, inventoryRecords]);

  // 材质分布图
  const materialChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
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
      data: productStats.materialDistribution.slice(0, 10).map(d => d.name.slice(0, 8)),
      axisLabel: { rotate: 30 },
    },
    yAxis: [
      {
        type: 'value',
        name: '库存量',
        position: 'left',
      },
      {
        type: 'value',
        name: '价值',
        position: 'right',
        axisLabel: {
          formatter: (value: number) => value >= 10000 ? `${(value / 10000).toFixed(0)}万` : value,
        },
      },
    ],
    series: [
      {
        name: '库存量',
        type: 'bar',
        data: productStats.materialDistribution.slice(0, 10).map(d => d.stock),
        itemStyle: { color: '#3b82f6' },
      },
      {
        name: '库存价值',
        type: 'line',
        yAxisIndex: 1,
        data: productStats.materialDistribution.slice(0, 10).map(d => d.value),
        itemStyle: { color: '#f59e0b' },
      },
    ],
  }), [productStats.materialDistribution]);

  // 工艺分布图
  const processChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}个产品 ({d}%)',
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
      data: productStats.processDistribution.slice(0, 8).map((d, i) => ({
        value: d.count,
        name: d.name.slice(0, 8),
        itemStyle: {
          color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'][i],
        },
      })),
    }],
  }), [productStats.processDistribution]);

  // 产品销售排行图
  const salesRankOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0];
        const item = productStats.topProducts[p.dataIndex];
        return `${item.name}<br/>销售额: ¥${item.revenue.toLocaleString()}<br/>出库量: ${item.totalOutbound}件<br/>库存: ${item.stock}件`;
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
      axisLabel: {
        formatter: (value: number) => value >= 10000 ? `${(value / 10000).toFixed(0)}万` : value,
      },
    },
    yAxis: {
      type: 'category',
      data: productStats.topProducts.slice(0, 15).map(p => p.name.slice(0, 10)).reverse(),
    },
    series: [{
      type: 'bar',
      data: productStats.topProducts.slice(0, 15).map(p => p.revenue).reverse(),
      barWidth: '60%',
      itemStyle: {
        color: (params: any) => {
          const idx = params.dataIndex;
          if (idx < 3) return '#f59e0b';
          if (idx < 8) return '#3b82f6';
          return '#6b7280';
        },
        borderRadius: [0, 4, 4, 0],
      },
    }],
  }), [productStats.topProducts]);

  // 导出数据
  const handleExport = () => {
    const data = productStats.productDetails.map(p => ({
      code: p.code,
      name: p.name,
      material: p.material || '-',
      process: p.process || '-',
      customerCode: p.customerCode,
      stock: p.stock,
      unitPrice: p.unitPrice || 0,
      stockValue: p.stockValue,
      totalOutbound: p.totalOutbound,
      totalOutboundWeight: p.totalOutboundWeight.toFixed(2),
      revenue: p.revenue,
    }));

    const columns = [
      { key: 'code', title: '产品编码' },
      { key: 'name', title: '产品名称' },
      { key: 'material', title: '材质' },
      { key: 'process', title: '工艺' },
      { key: 'customerCode', title: '客户编码' },
      { key: 'stock', title: '库存量' },
      { key: 'unitPrice', title: '单价' },
      { key: 'stockValue', title: '库存价值' },
      { key: 'totalOutbound', title: '累计出库' },
      { key: 'totalOutboundWeight', title: '出库重量(kg)' },
      { key: 'revenue', title: '销售收入' },
    ];

    exportToExcel(data, columns, `产品分析_${new Date().toISOString().slice(0, 10)}`);
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
            <h1 className="text-2xl font-bold">产品维度分析</h1>
            <p className="text-sm text-muted-foreground mt-1">产品销售排行、材质工艺分布、贡献度分析</p>
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
          <TabsTrigger value="overview">销售排行</TabsTrigger>
          <TabsTrigger value="material">材质分析</TabsTrigger>
          <TabsTrigger value="process">工艺分析</TabsTrigger>
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
            <div className="text-xl font-bold">{productStats.totalProducts}个</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Factory className="h-3 w-3" />
              材质种类
            </div>
            <div className="text-xl font-bold">{productStats.uniqueMaterials}种</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Flame className="h-3 w-3" />
              工艺种类
            </div>
            <div className="text-xl font-bold">{productStats.uniqueProcesses}种</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <TrendingUp className="h-3 w-3" />
              累计销售
            </div>
            <div className="text-xl font-bold">¥{formatMoney(productStats.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Hash className="h-3 w-3" />
              平均单价
            </div>
            <div className="text-xl font-bold">¥{productStats.avgPrice.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Target className="h-3 w-3" />
              覆盖客户
            </div>
            <div className="text-xl font-bold">{productStats.customerCount}家</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {viewMode === 'overview' && (
          <>
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  产品销售排行 TOP15
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productStats.topProducts.length > 0 ? (
                  <ReactECharts option={salesRankOption} style={{ height: 400 }} />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    暂无销售数据
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {viewMode === 'material' && (
          <>
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  材质分布分析
                </CardTitle>
                <p className="text-xs text-muted-foreground">各材质类型的产品数量、库存量及价值分布</p>
              </CardHeader>
              <CardContent>
                <ReactECharts option={materialChartOption} style={{ height: 350 }} />
              </CardContent>
            </Card>

            {/* 材质明细表 */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">材质明细统计</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>材质</TableHead>
                      <TableHead className="text-right">产品数</TableHead>
                      <TableHead className="text-right">库存量</TableHead>
                      <TableHead className="text-right">库存价值</TableHead>
                      <TableHead className="text-right">价值占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productStats.materialDistribution.map((m) => {
                      const percentage = productStats.totalStockValue > 0 
                        ? (m.value / productStats.totalStockValue * 100) 
                        : 0;
                      return (
                        <TableRow key={m.name}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell className="text-right">{m.count}个</TableCell>
                          <TableCell className="text-right">{m.stock}件</TableCell>
                          <TableCell className="text-right">¥{m.value.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{percentage.toFixed(2)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {viewMode === 'process' && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  工艺类型分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReactECharts option={processChartOption} style={{ height: 350 }} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">工艺明细统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {productStats.processDistribution.map((p, index) => {
                    const percentage = productStats.totalStockValue > 0 
                      ? (p.value / productStats.totalStockValue * 100) 
                      : 0;
                    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500', 'bg-pink-500', 'bg-cyan-500', 'bg-lime-500'];
                    return (
                      <div key={p.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground">{p.count}个产品</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colors[index % colors.length]} rounded-full`}
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-14 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          库存价值: ¥{p.value.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 滞销产品预警 */}
      {productStats.stagnantProducts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
              <Target className="h-4 w-4" />
              滞销产品预警 ({productStats.stagnantProducts.length}个)
            </CardTitle>
            <p className="text-xs text-muted-foreground">有库存但无出库记录的产品</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>产品编码</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead>材质/工艺</TableHead>
                  <TableHead className="text-right">库存量</TableHead>
                  <TableHead className="text-right">库存价值</TableHead>
                  <TableHead>所属客户</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productStats.stagnantProducts.slice(0, 10).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs">{p.material || '-'}/{p.process || '-'}</TableCell>
                    <TableCell className="text-right">{p.stock}件</TableCell>
                    <TableCell className="text-right">¥{p.stockValue.toLocaleString()}</TableCell>
                    <TableCell>{p.customerCode}</TableCell>
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
            <span>产品明细</span>
            <span className="text-sm font-normal text-muted-foreground">
              共 {productStats.productDetails.length} 个产品
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>产品编码</TableHead>
                <TableHead>产品名称</TableHead>
                <TableHead>材质/工艺</TableHead>
                <TableHead>所属客户</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead className="text-right">库存量</TableHead>
                <TableHead className="text-right">累计出库</TableHead>
                <TableHead className="text-right">出库重量</TableHead>
                <TableHead className="text-right">销售收入</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productStats.productDetails.slice(0, 20).map((p, index) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell className="font-medium">
                    {p.name}
                    {index < 3 && p.totalOutbound > 0 && (
                      <Badge className="ml-2 bg-amber-500 text-[10px]">TOP{index + 1}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{p.material || '-'}/{p.process || '-'}</TableCell>
                  <TableCell className="text-xs">{p.customerCode}</TableCell>
                  <TableCell className="text-right">¥{p.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-right">{p.stock}件</TableCell>
                  <TableCell className="text-right">
                    <span className={p.totalOutbound > 0 ? 'text-emerald-600' : 'text-gray-400'}>
                      {p.totalOutbound}件
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{p.totalOutboundWeight.toFixed(2)}kg</TableCell>
                  <TableCell className="text-right font-medium">
                    ¥{p.revenue.toLocaleString()}
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

export default ProductAnalysisPage;
