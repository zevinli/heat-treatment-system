import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import * as echarts from 'echarts';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  DashboardStats,
  RealtimeStats,
  DashboardActivity,
  DashboardAlerts,
  DashboardTrends,
} from '@shared/api.interface';
import {
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Search,
  Bell,
  Download,
  RefreshCw,
  Inbox,
  Send,
  Warehouse,
  FileText,
  BarChart3,
  Database,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  DollarSign,
  Activity,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
// 图表组件 - 业务趋势
function TrendChart({ data }: { data: DashboardTrends[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  useEffect(() => {
    if (!chartRef.current || !data.length) return;
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }
    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['入库重量', '出库重量'],
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
        boundaryGap: false,
        data: data.map(d => d.date.slice(5)), // MM-DD
      },
      yAxis: {
        type: 'value',
        name: '重量(kg)',
        axisLabel: { formatter: '{value}' },
      },
      series: [
        {
          name: '入库重量',
          type: 'line',
          smooth: true,
          lineStyle: { width: 3, color: '#3b82f6' },
          areaStyle: {
            color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.01)' },
            ]),
          },
          data: data.map(d => Number(d.inbound.weight.toFixed(2))),
        },
        {
          name: '出库重量',
          type: 'line',
          smooth: true,
          lineStyle: { width: 3, color: '#10b981' },
          areaStyle: {
            color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.01)' },
            ]),
          },
          data: data.map(d => Number(d.outbound.weight.toFixed(2))),
        },
      ],
    };
    chart.setOption(option);
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);
  return <div ref={chartRef} className="h-[300px] w-full" />;
}
// 图表组件 - 业务金额对比
function AmountChart({ data }: { data: DashboardTrends[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  useEffect(() => {
    if (!chartRef.current || !data.length) return;
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }
    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['入库金额', '出库金额'],
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
        data: data.map(d => d.date.slice(5)),
      },
      yAxis: {
        type: 'value',
        name: '金额(元)',
        axisLabel: { formatter: '¥{value}' },
      },
      series: [
        {
          name: '入库金额',
          type: 'bar',
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          data: data.map(d => Number(d.inbound.amount.toFixed(2))),
        },
        {
          name: '出库金额',
          type: 'bar',
          itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
          data: data.map(d => Number(d.outbound.amount.toFixed(2))),
        },
      ],
    };
    chart.setOption(option);
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);
  return <div ref={chartRef} className="h-[300px] w-full" />;
}
// 快捷入口卡片
function QuickAccessCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  const navigate = useNavigate();
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
      onClick={() => navigate(href)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
// 指标卡片
function StatCard({
  title,
  value,
  subValue,
  change,
  trend,
  icon: Icon,
  description,
  loading,
}: {
  title: string;
  value: string;
  subValue?: string;
  change?: number;
  trend?: 'up' | 'down';
  icon: React.ElementType;
  description: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subValue && <div className="text-sm text-muted-foreground mt-0.5">{subValue}</div>}
        <div className="mt-2 flex items-center text-xs">
          {change !== undefined && (
            <>
              {trend === 'up' ? (
                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </>
          )}
          <span className="ml-1 text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}
// 活动类型图标
function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    inbound: <Inbox className="h-4 w-4" />,
    outbound: <Send className="h-4 w-4" />,
    product: <Package className="h-4 w-4" />,
    customer: <Users className="h-4 w-4" />,
    inventory: <Warehouse className="h-4 w-4" />,
    reconciliation: <FileText className="h-4 w-4" />,
    system: <RefreshCw className="h-4 w-4" />,
  };
  const colors: Record<string, string> = {
    inbound: 'bg-blue-100 text-blue-600',
    outbound: 'bg-green-100 text-green-600',
    product: 'bg-purple-100 text-purple-600',
    customer: 'bg-orange-100 text-orange-600',
    inventory: 'bg-cyan-100 text-cyan-600',
    reconciliation: 'bg-pink-100 text-pink-600',
    system: 'bg-gray-100 text-gray-600',
  };
  return (
    <div className={`p-2 rounded-full ${colors[type] || colors.system}`}>
      {icons[type] || icons.system}
    </div>
  );
}
// 预警级别标签
function AlertBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  const labels = { high: '紧急', medium: '警告', low: '提醒' };
  return (
    <Badge variant="outline" className={styles[level]}>
      {labels[level]}
    </Badge>
  );
}
// 主页面组件
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 数据状态
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
  const [trends, setTrends] = useState<DashboardTrends[]>([]);
  // 获取数据
  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);
    try {
      const [dashboardRes, realtimeRes, activitiesRes, alertsRes, trendsRes] = await Promise.all([
        axiosForBackend.get(`/api/admin/dashboard?period=${timeRange}`),
        axiosForBackend.get('/api/admin/stats/realtime'),
        axiosForBackend.get('/api/admin/activities?limit=10'),
        axiosForBackend.get('/api/admin/alerts'),
        axiosForBackend.get('/api/admin/trends?days=7'),
      ]);
      setDashboardData(dashboardRes.data);
      setRealtimeData(realtimeRes.data);
      setActivities(activitiesRes.data);
      setAlerts(alertsRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      logger.error('获取数据失败:', error);
      toast.error('数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [timeRange]);
  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
    return num.toLocaleString();
  };
  // 格式化重量
  const formatWeight = (weight: number) => {
    if (weight >= 1000) return `${(weight / 1000).toFixed(2)}吨`;
    return `${weight.toFixed(2)}kg`;
  };
  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${formatNumber(amount)}`;
  };
  const stats = dashboardData?.stats;
  return (
    <div className="min-h-screen bg-background p-6">
      {/* 顶部标题栏 */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">管理控制台</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            热处理收发货管理系统 - 实时业务概览与数据分析
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as typeof timeRange)}
          >
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="year">本年</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData(false)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* 快捷入口 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">快捷入口</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAccessCard
            icon={Inbox}
            title="来货登记"
            description="快速录入来货信息"
            href="/inbound"
            color="bg-blue-500"
          />
          <QuickAccessCard
            icon={Send}
            title="快速发货"
            description="处理出库发货业务"
            href="/outbound"
            color="bg-green-500"
          />
          <QuickAccessCard
            icon={Warehouse}
            title="库存查询"
            description="查看库存状态与预警"
            href="/inventory"
            color="bg-purple-500"
          />
          <QuickAccessCard
            icon={FileText}
            title="智能对账"
            description="处理财务对账业务"
            href="/reconciliation"
            color="bg-orange-500"
          />
        </div>
      </div>
      {/* 核心指标卡片 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="入库单数"
          value={stats ? `${stats.inbound.count}单` : '-'}
          subValue={stats ? formatWeight(stats.inbound.weight) : undefined}
          change={stats?.inbound.growth.count}
          trend={stats && stats.inbound.growth.count >= 0 ? 'up' : 'down'}
          icon={Inbox}
          description="较上期"
          loading={loading}
        />
        <StatCard
          title="出库单数"
          value={stats ? `${stats.outbound.count}单` : '-'}
          subValue={stats ? formatAmount(stats.outbound.amount) : undefined}
          change={stats?.outbound.growth.count}
          trend={stats && stats.outbound.growth.count >= 0 ? 'up' : 'down'}
          icon={Send}
          description="较上期"
          loading={loading}
        />
        <StatCard
          title="库存产品"
          value={stats ? `${stats.inventory.productCount}种` : '-'}
          subValue={stats ? formatWeight(stats.inventory.totalWeight) : undefined}
          icon={Warehouse}
          description="当前库存"
          loading={loading}
        />
        <StatCard
          title="活跃客户"
          value={stats ? `${stats.customers.active}家` : '-'}
          subValue={stats ? `新增${stats.customers.new}家` : undefined}
          icon={Users}
          description="本周期"
          loading={loading}
        />
      </div>
      {/* 今日实时数据 */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              今日实时
            </CardTitle>
            <CardDescription>今日业务实时统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <Inbox className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">今日入库</p>
                  <p className="text-2xl font-bold">
                    {realtimeData ? realtimeData.today.inbound.count : '-'}单
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {realtimeData ? formatWeight(realtimeData.today.inbound.weight) : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">今日出库</p>
                  <p className="text-2xl font-bold">
                    {realtimeData ? realtimeData.today.outbound.count : '-'}单
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {realtimeData ? formatWeight(realtimeData.today.outbound.weight) : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-100">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">待对账</p>
                  <p className="text-2xl font-bold">
                    {stats ? stats.pending.reconciliation : '-'}单
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-100">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">待回款</p>
                  <p className="text-2xl font-bold">
                    {stats ? formatAmount(stats.pending.receiptAmount) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 图表区域 */}
      <Tabs defaultValue="trend" className="mb-8">
        <TabsList>
          <TabsTrigger value="trend">重量趋势</TabsTrigger>
          <TabsTrigger value="amount">金额对比</TabsTrigger>
        </TabsList>
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>出入库重量趋势</CardTitle>
              <CardDescription>近7天入库与出库重量变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <TrendChart data={trends} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="amount">
          <Card>
            <CardHeader>
              <CardTitle>出入库金额对比</CardTitle>
              <CardDescription>近7天入库与出库金额对比</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <AmountChart data={trends} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* 下方内容区域 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 预警信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              预警提醒
            </CardTitle>
            <CardDescription>需要关注的异常情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 库存预警 */}
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">库存预警产品</p>
                    <p className="text-xs text-muted-foreground">
                      {alerts ? `${alerts.inventory.lowStock}种产品库存不足` : '-'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/inventory')}
                >
                  查看
                </Button>
              </div>
              {/* 超期库存 */}
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">超期库存</p>
                    <p className="text-xs text-muted-foreground">
                      {alerts ? `${alerts.inventory.overdue}种产品超期存放` : '-'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/inventory')}
                >
                  查看
                </Button>
              </div>
              {/* 待对账 */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">待对账出库单</p>
                    <p className="text-xs text-muted-foreground">
                      {alerts ? `${alerts.finance.pendingReconciliation}单等待对账` : '-'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/reconciliation')}
                >
                  处理
                </Button>
              </div>
              {/* 待回款 */}
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">待回款</p>
                    <p className="text-xs text-muted-foreground">
                      {alerts
                        ? `${alerts.finance.pendingReceiptOrders}单，${formatAmount(alerts.finance.pendingReceiptAmount)}`
                        : '-'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/reconciliation')}
                >
                  处理
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* 最近活动 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              最近活动
            </CardTitle>
            <CardDescription>系统最新操作记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.time).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">暂无活动记录</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/operation-logs')}
            >
              查看全部
            </Button>
          </CardFooter>
        </Card>
        {/* 库存预警产品 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              库存预警
            </CardTitle>
            <CardDescription>库存低于预警线的产品</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realtimeData?.alerts.lowStock.length ? (
                realtimeData.alerts.lowStock.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate('/inventory')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.customerName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        {product.stock}/{product.warningThreshold}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">库存状态良好</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/inventory')}
            >
              查看库存详情
            </Button>
          </CardFooter>
        </Card>
      </div>
      {/* 数据统计入口 */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/statistics')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-blue-100">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">数据统计中心</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  查看详细的业务报表、客户分析、产品统计等数据
                </p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/settings/templates')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-purple-100">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">系统设置</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  配置打印模板、权限管理、显示设置等系统参数
                </p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
