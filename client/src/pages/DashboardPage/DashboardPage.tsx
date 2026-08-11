import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUserProfile } from '@lark-apaas/client-toolkit/hooks/useCurrentUserProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  Truck, 
  FileText, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Inbox,
  Upload,
  Bell,
  User,
  CheckCircle2,
  Wallet,
  Sparkles,
  ChevronRight,
  BarChart3,
  Zap,
  Activity,
  MoreHorizontal,
  X,
  Undo2,
  RotateCcw,
  TrendingDown,
  XCircle,
  Trash2,
  Settings,
  PlusCircle,
  MinusCircle,
  FileCheck,
  Hammer,
} from 'lucide-react';
import { useData } from '@/data/DataContext';
import { cn } from '@/lib/utils';
import { getChangeTypeConfig, isStockIncrease } from '@shared/inventory-change-types';
import { useAppPermission } from '@/hooks/useAppPermission';

// KPI卡片组件
interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: { value: number; isPositive: boolean };
  icon: React.ReactNode;
  iconBg: string;
  onClick?: () => void;
  delay?: number;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  description, 
  trend, 
  icon, 
  iconBg, 
  onClick,
  delay = 0 
}) => (
  <Card 
    className={cn(
      "group relative overflow-hidden transition-all duration-300 border-border/50",
      onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
      "bg-gradient-to-br from-card to-card/95"
    )}
    style={{ animationDelay: `${delay}ms` }}
    onClick={onClick}
  >
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-tabular tracking-tight">{value}</h3>
            {trend && (
              <span className={cn(
                "flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full",
                trend.isPositive 
                  ? "text-emerald-700 bg-emerald-100" 
                  : "text-red-700 bg-red-100"
              )}>
                {trend.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105",
          iconBg
        )}>
          {icon}
        </div>
      </div>
    </CardContent>
    {/* 悬停时的渐变光效 */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
  </Card>
);

// 快捷入口按钮
interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
  delay?: number;
  badge?: number | string;
  badgeColor?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  icon, 
  label, 
  description, 
  color, 
  onClick,
  delay = 0,
  badge,
  badgeColor = 'bg-destructive',
}) => (
  <button
    onClick={onClick}
    className={cn(
      "group relative flex items-center gap-4 p-4 rounded-xl",
      "bg-card border border-border/50 shadow-sm",
      "hover:shadow-md hover:border-primary/20 transition-all duration-300",
      "text-left w-full"
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={cn(
      "flex items-center justify-center w-14 h-14 rounded-xl shrink-0 relative",
      "transition-transform duration-300 group-hover:scale-105",
      color
    )}>
      {icon}
      {/* 徽章显示待办数量 */}
      {badge && (
        <span className={cn(
          "absolute -top-1 -right-1 flex items-center justify-center",
          "min-w-[20px] h-5 px-1 text-xs font-bold text-white rounded-full",
          "shadow-sm animate-in zoom-in-50",
          badgeColor
        )}>
          {badge}
        </span>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
        {label}
      </h4>
      <p className="text-sm text-muted-foreground truncate">{description}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
  </button>
);

// 活动项组件
interface ActivityItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

const ActivityItem: React.FC<ActivityItemProps> = ({ 
  icon, 
  iconBg, 
  title, 
  description, 
  time,
  status = 'info'
}) => (
  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
    <div className={cn(
      "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
      iconBg
    )}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
          {title}
        </p>
        <span className="text-xs text-muted-foreground shrink-0">{time}</span>
      </div>
      <p className="text-xs text-muted-foreground truncate">{description}</p>
    </div>
    {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
    {status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
  </div>
);

// 预警项组件
interface WarningItemProps {
  type: 'overdue' | 'inventory' | 'reconciliation';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  onDismiss?: () => void;
  onClick?: () => void;
}

const WarningItem: React.FC<WarningItemProps> = ({ 
  type, 
  title, 
  description, 
  severity,
  onDismiss,
  onClick
}) => {
  const config = {
    overdue: { icon: Wallet, color: 'text-red-600 bg-red-50 border-red-100', label: '回款' },
    inventory: { icon: Package, color: 'text-amber-600 bg-amber-50 border-amber-100', label: '库存' },
    reconciliation: { icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-100', label: '对账' },
  };
  
  const Icon = config[type].icon;
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer",
        "hover:shadow-sm transition-all duration-200",
        config[type].color
      )}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/80 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{title}</p>
          {severity === 'high' && (
            <Badge variant="destructive" className="h-4 text-[10px] px-1">紧急</Badge>
          )}
        </div>
        <p className="text-xs opacity-80 mt-0.5">{description}</p>
      </div>
      {onDismiss && (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/5 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

// 业务完成度卡片 - 交互式组件
interface BusinessCompletionCardProps {
  monthlyStats: { inbound: number; outbound: number };
  pendingReconciliationCount: number;
  inventoryWarningCount: number;
  customers: Array<any>;
  products: Array<any>;
  onNavigate: (path: string) => void;
}

const BusinessCompletionCard: React.FC<BusinessCompletionCardProps> = ({
  monthlyStats,
  pendingReconciliationCount,
  inventoryWarningCount,
  customers,
  products,
  onNavigate,
}) => {
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [targetInbound, setTargetInbound] = useState(150);
  const [targetOutbound, setTargetOutbound] = useState(120);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  
  // 计算完成度
  const inboundRate = Math.min(100, Math.round((monthlyStats.inbound / targetInbound) * 100));
  const outboundRate = Math.min(100, Math.round((monthlyStats.outbound / targetOutbound) * 100));
  const reconciliationRate = Math.max(0, 100 - (pendingReconciliationCount * 5));
  const inventoryHealthRate = Math.max(0, 100 - (inventoryWarningCount * 10));
  
  // 综合完成度
  const overallRate = Math.round((inboundRate + outboundRate + reconciliationRate + inventoryHealthRate) / 4);
  
  // 获取完成度颜色
  const getRateColor = (rate: number) => {
    if (rate >= 80) return 'from-emerald-500 to-emerald-400';
    if (rate >= 60) return 'from-amber-500 to-amber-400';
    return 'from-red-500 to-red-400';
  };
  
  // 获取完成度状态
  const getRateStatus = (rate: number) => {
    if (rate >= 80) return { label: '优秀', color: 'text-emerald-600 bg-emerald-50' };
    if (rate >= 60) return { label: '良好', color: 'text-amber-600 bg-amber-50' };
    return { label: '需改进', color: 'text-red-600 bg-red-50' };
  };
  
  const status = getRateStatus(overallRate);
  
  const detailItems = [
    { 
      label: '入库完成度', 
      value: inboundRate, 
      current: monthlyStats.inbound, 
      target: targetInbound,
      icon: Package,
      onClick: () => onNavigate('/inbound')
    },
    { 
      label: '出库完成度', 
      value: outboundRate, 
      current: monthlyStats.outbound, 
      target: targetOutbound,
      icon: Truck,
      onClick: () => onNavigate('/outbound')
    },
    { 
      label: '对账完成度', 
      value: reconciliationRate, 
      current: pendingReconciliationCount, 
      target: 0,
      icon: FileText,
      onClick: () => onNavigate('/reconciliation'),
      reverse: true
    },
    { 
      label: '库存健康度', 
      value: inventoryHealthRate, 
      current: inventoryWarningCount, 
      target: 0,
      icon: AlertTriangle,
      onClick: () => onNavigate('/inventory'),
      reverse: true
    },
  ];
  
  return (
    <>
      <Card 
        className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/0 cursor-pointer hover:shadow-md transition-all"
        onClick={() => setShowDetailDialog(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              本月业务完成度
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>点击查看详细分析</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* 总体完成度 */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
            <div>
              <p className="text-sm text-muted-foreground">综合完成度</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold">{overallRate}%</span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", status.color)}>
                  {status.label}
                </span>
              </div>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className={cn("transition-all duration-1000", overallRate >= 80 ? "text-emerald-500" : overallRate >= 60 ? "text-amber-500" : "text-red-500")}
                  strokeDasharray={`${overallRate}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          
          {/* 快捷数据 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-card border border-border/50 hover:bg-muted/50 transition-colors" onClick={(e) => { e.stopPropagation(); onNavigate('/customers'); }}>
              <p className="text-xs text-muted-foreground">客户总数</p>
              <p className="text-xl font-bold font-tabular">{customers.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/50 hover:bg-muted/50 transition-colors" onClick={(e) => { e.stopPropagation(); onNavigate('/products'); }}>
              <p className="text-xs text-muted-foreground">产品总数</p>
              <p className="text-xl font-bold font-tabular">{products.length}</p>
            </div>
          </div>
          
          {/* 待办提示 */}
          {(pendingReconciliationCount > 0 || inventoryWarningCount > 0) && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">有待处理事项</p>
                  <p className="text-amber-700/80 text-xs mt-0.5">
                    {pendingReconciliationCount > 0 && `${pendingReconciliationCount}个出库单待对账`}
                    {pendingReconciliationCount > 0 && inventoryWarningCount > 0 && '，'}
                    {inventoryWarningCount > 0 && `${inventoryWarningCount}个产品库存预警`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              本月业务完成度详情
            </DialogTitle>
            <DialogDescription>
              查看各项业务的完成情况和目标进度
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* 总体进度 */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/0 border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">综合完成度</span>
                <span className={cn("text-sm px-2 py-0.5 rounded-full font-medium", status.color)}>
                  {overallRate}%
                </span>
              </div>
              <Progress value={overallRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                基于入库、出库、对账和库存健康度综合计算
              </p>
            </div>
            
            {/* 目标设置 */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">各项指标</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditingTarget(!isEditingTarget)}
              >
                {isEditingTarget ? '完成' : '设置目标'}
              </Button>
            </div>
            
            {/* 详细进度 */}
            <div className="space-y-3">
              {detailItems.map((item) => (
                <div 
                  key={item.label}
                  className="p-3 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={item.onClick}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      item.value >= 80 ? "text-emerald-600" : item.value >= 60 ? "text-amber-600" : "text-red-600"
                    )}>
                      {item.value}%
                    </span>
                  </div>
                  
                  <Progress value={item.value} className="h-1.5 mb-2" />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {item.reverse ? '当前' : '已完成'}: {item.current}
                    </span>
                    {isEditingTarget && !item.reverse ? (
                      <div className="flex items-center gap-1">
                        <span>目标:</span>
                        <input
                          type="number"
                          value={item.target}
                          onChange={(e) => {
                            if (item.label === '入库完成度') setTargetInbound(Number(e.target.value));
                            if (item.label === '出库完成度') setTargetOutbound(Number(e.target.value));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 px-1 py-0.5 text-xs border rounded"
                        />
                      </div>
                    ) : (
                      <span>{item.reverse ? '目标: 0' : `目标: ${item.target}`}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 快捷操作 */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" onClick={() => { onNavigate('/statistics'); setShowDetailDialog(false); }}>
                <BarChart3 className="w-4 h-4 mr-2" />
                查看报表
              </Button>
              <Button onClick={() => { onNavigate('/profile'); setShowDetailDialog(false); }}>
                <User className="w-4 h-4 mr-2" />
                个人中心
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const canCreateInbound = useAppPermission('inbound:create');
  const canCreateOutbound = useAppPermission('outbound:create');
  const currentProfile = useCurrentUserProfile();
  const [currentDate, setCurrentDate] = useState<string>('');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  
  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('heat_treatment_dismissed_warnings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const {
    products: rawProducts,
    inventoryRecords: rawInventoryRecords,
    outboundOrders: rawOutboundOrders,
    reconciliations: rawReconciliations,
    getInventorySummary,
    customers: rawCustomers,
  } = useData();

  // 防御性处理：确保所有数据都是数组
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const inventoryRecords = Array.isArray(rawInventoryRecords) ? rawInventoryRecords : [];
  const outboundOrders = Array.isArray(rawOutboundOrders) ? rawOutboundOrders : [];
  const reconciliations = Array.isArray(rawReconciliations) ? rawReconciliations : [];
  const customers = Array.isArray(rawCustomers) ? rawCustomers : [];

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    let greet = '早上好';
    if (hour >= 12 && hour < 14) greet = '中午好';
    else if (hour >= 14 && hour < 18) greet = '下午好';
    else if (hour >= 18) greet = '晚上好';
    setGreeting(greet);
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    };
    setCurrentDate(now.toLocaleDateString('zh-CN', options));
  }, []);

  // KPI计算
  const kpiData = useMemo(() => {
    const inventoryWarningCount = getInventorySummary().filter(
      item => item.currentStock === 0 || item.currentStock < item.warningThreshold
    ).length;

    // 修复：排除已撤销的出库单
    const pendingReconciliationCount = outboundOrders.filter(
      o => o.status === 'pending_reconciliation' && !o.cancelledAt
    ).length;

    // 待完善产品统计
    const incompleteProducts = products.filter(p => p.status === 'incomplete');
    const incompleteProductCount = incompleteProducts.length;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyReceiptAmount = reconciliations
      .filter(r => r.month === currentMonth && ['partial_paid', 'paid'].includes(r.status))
      .reduce((sum, r) => sum + r.receiptAmount, 0);

    const unreceivedAmount = reconciliations
      .filter(r => ['audited', 'invoiced', 'partial_paid'].includes(r.status))
      .reduce((sum, r) => sum + Math.max(0, r.unreceivedAmount), 0);

    const monthlyStats = {
      inbound: inventoryRecords.filter(r =>
        r.changeType === 'inbound' && r.createdAt.startsWith(currentMonth)
      ).length,
      outbound: inventoryRecords.filter(r =>
        r.changeType === 'outbound' && r.createdAt.startsWith(currentMonth)
      ).length,
    };

    return {
      inventoryWarningCount,
      pendingReconciliationCount,
      monthlyReceiptAmount,
      unreceivedAmount,
      monthlyStats,
      incompleteProductCount,
      incompleteProducts,
    };
  }, [getInventorySummary, outboundOrders, reconciliations, inventoryRecords, products]);

  // 风险预警
  const riskWarnings = useMemo(() => {
    const warnings: Array<{
      id: string;
      type: 'overdue' | 'inventory' | 'reconciliation';
      title: string;
      description: string;
      severity: 'high' | 'medium' | 'low';
    }> = [];
    
    const overdueReconciliations = reconciliations.filter(r =>
      r.unreceivedAmount > 0 && ['audited', 'invoiced', 'partial_paid'].includes(r.status)
    );
    
    overdueReconciliations.slice(0, 3).forEach((r, i) => {
      const key = `overdue-${r.customerId}-${r.month}`;
      if (!dismissedWarnings.includes(key)) {
        warnings.push({
          id: key,
          type: 'overdue',
          title: `${r.customerName} 有待回款`,
          description: `未回款金额 ¥${r.unreceivedAmount.toLocaleString()}`,
          severity: r.unreceivedAmount > 10000 ? 'high' : 'medium',
        });
      }
    });
    
    const zeroStockProducts = products.filter(p => p.stock === 0);
    if (zeroStockProducts.length > 0 && !dismissedWarnings.includes('inventory-zero')) {
      warnings.push({
        id: 'inventory-zero',
        type: 'inventory',
        title: `${zeroStockProducts.length} 个产品缺货`,
        description: zeroStockProducts.slice(0, 3).map(p => p.name).join('、') + (zeroStockProducts.length > 3 ? '等' : ''),
        severity: 'high',
      });
    }
    
    if (kpiData.pendingReconciliationCount > 0 && !dismissedWarnings.includes('reconciliation-pending')) {
      warnings.push({
        id: 'reconciliation-pending',
        type: 'reconciliation',
        title: `${kpiData.pendingReconciliationCount} 个出库单待对账`,
        description: '请及时生成对账单',
        severity: 'medium',
      });
    }

    // 待完善产品预警
    if (kpiData.incompleteProductCount > 0 && !dismissedWarnings.includes('product-incomplete')) {
      warnings.push({
        id: 'product-incomplete',
        type: 'inventory',
        title: `${kpiData.incompleteProductCount} 个产品信息待完善`,
        description: kpiData.incompleteProducts.slice(0, 3).map(p => p.name).join('、') + (kpiData.incompleteProducts.length > 3 ? '等' : ''),
        severity: 'low',
      });
    }

    return warnings;
  }, [reconciliations, products, kpiData.pendingReconciliationCount, kpiData.incompleteProductCount, kpiData.incompleteProducts, dismissedWarnings]);

  // 图标映射
  const activityIconMap: Record<string, React.ReactNode> = {
    Package: <Package className="w-4 h-4" />,
    Truck: <Truck className="w-4 h-4" />,
    Undo2: <Undo2 className="w-4 h-4" />,
    RotateCcw: <RotateCcw className="w-4 h-4" />,
    TrendingUp: <TrendingUp className="w-4 h-4" />,
    TrendingDown: <TrendingDown className="w-4 h-4" />,
    AlertTriangle: <AlertTriangle className="w-4 h-4" />,
    XCircle: <XCircle className="w-4 h-4" />,
    Trash2: <Trash2 className="w-4 h-4" />,
    Settings: <Settings className="w-4 h-4" />,
    PlusCircle: <PlusCircle className="w-4 h-4" />,
    MinusCircle: <MinusCircle className="w-4 h-4" />,
    FileCheck: <FileCheck className="w-4 h-4" />,
    Hammer: <Hammer className="w-4 h-4" />,
  };

  // 最近活动
  const recentActivities = useMemo(() => {
    return inventoryRecords
      .slice(0, 5)
      .map(record => {
        const config = getChangeTypeConfig(record.changeType);
        const isIncrease = isStockIncrease(record.changeType);
        
        return {
          icon: activityIconMap[config.icon] || <Package className="w-4 h-4" />,
          iconBg: isIncrease 
            ? 'text-emerald-600 bg-emerald-50' 
            : config.direction === 'down'
            ? 'text-rose-600 bg-rose-50'
            : 'text-slate-600 bg-slate-50',
          title: `${config.label} - ${record.productName}`,
          description: `${record.quantityChange > 0 ? '+' : ''}${record.quantityChange} 件 | ${record.customerName || '内部操作'}`,
          time: new Date(record.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          status: isIncrease ? 'success' as const : 'info' as const,
        };
      });
  }, [inventoryRecords]);

  const dismissWarning = useCallback((id: string) => {
    setDismissedWarnings(prev => {
      const newList = [...prev, id];
      localStorage.setItem('heat_treatment_dismissed_warnings', JSON.stringify(newList));
      return newList;
    });
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8">
      {/* 欢迎区域 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-white font-semibold">
                {currentProfile?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {greeting}，{currentProfile?.name || '用户'}
              </h1>
              <p className="text-sm text-muted-foreground">{currentDate}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setMessageDialogOpen(true)}
          >
            <Bell className="h-4 w-4" />
            消息通知
            {riskWarnings.length > 0 && (
              <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-xs">
                {riskWarnings.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* KPI卡片区域 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="本月入库明细"
          value={kpiData.monthlyStats.inbound}
          description={`本月出库明细 ${kpiData.monthlyStats.outbound} 条`}
          icon={<Inbox className="w-5 h-5 text-white" />}
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          onClick={() => navigate(canCreateInbound ? '/inbound' : '/orders')}
          delay={0}
        />
        <KPICard
          title="待对账出库单"
          value={kpiData.pendingReconciliationCount}
          description="需要及时处理"
          icon={<FileText className="w-5 h-5 text-white" />}
          iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
          onClick={() => navigate('/reconciliation')}
          delay={100}
        />
        <KPICard
          title="本月回款金额"
          value={`¥${(kpiData.monthlyReceiptAmount / 10000).toFixed(1)}万`}
          icon={<Wallet className="w-5 h-5 text-white" />}
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay={200}
        />
        <KPICard
          title="库存预警"
          value={kpiData.inventoryWarningCount}
          description={kpiData.unreceivedAmount > 0 ? `未回款 ¥${(kpiData.unreceivedAmount / 10000).toFixed(1)}万` : '库存正常'}
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
          iconBg={kpiData.inventoryWarningCount > 0
            ? "bg-gradient-to-br from-red-500 to-red-600"
            : "bg-gradient-to-br from-slate-500 to-slate-600"
          }
          onClick={() => navigate('/inventory')}
          delay={300}
        />
        <KPICard
          title="待完善产品"
          value={kpiData.incompleteProductCount}
          description={kpiData.incompleteProductCount > 0 ? '需要补充产品信息' : '所有产品信息完整'}
          icon={<Package className="w-5 h-5 text-white" />}
          iconBg={kpiData.incompleteProductCount > 0
            ? "bg-gradient-to-br from-amber-500 to-amber-600"
            : "bg-gradient-to-br from-slate-500 to-slate-600"
          }
          onClick={() => navigate('/products')}
          delay={400}
        />
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：快捷入口 */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    快捷入口
                  </CardTitle>
                  <CardDescription>常用功能的快速访问</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {canCreateInbound && <QuickAction
                  icon={<Upload className="w-6 h-6 text-white" />}
                  label="来货登记"
                  description="现场收货录入，打印流程卡"
                  color="bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25"
                  onClick={() => navigate('/inbound')}
                  delay={0}
                />}
                {canCreateOutbound && <QuickAction
                  icon={<Truck className="w-6 h-6 text-white" />}
                  label="快速发货"
                  description="智能分批发货，打印送货单"
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25"
                  onClick={() => navigate('/outbound')}
                  delay={100}
                />}
                <QuickAction
                  icon={<BarChart3 className="w-6 h-6 text-white" />}
                  label="数据统计"
                  description="业务数据分析与洞察"
                  color="bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/25"
                  onClick={() => navigate('/statistics')}
                  delay={200}
                />
                <QuickAction
                  icon={<FileText className="w-6 h-6 text-white" />}
                  label="智能对账"
                  description="财务对账与回款追踪"
                  color="bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25"
                  onClick={() => navigate('/reconciliation')}
                  delay={300}
                  badge={kpiData.pendingReconciliationCount > 0 ? kpiData.pendingReconciliationCount : undefined}
                  badgeColor="bg-destructive"
                />
              </div>
            </CardContent>
          </Card>

          {/* 最近动态 */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    最近动态
                  </CardTitle>
                  <CardDescription>最近的收发货操作记录</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')}>
                  查看全部
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>暂无活动记录</p>
                  </div>
                ) : (
                  recentActivities.map((activity, index) => (
                    <ActivityItem key={index} {...activity} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：预警和统计 */}
        <div className="space-y-6">
          {/* 风险预警 */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    风险预警
                  </CardTitle>
                  <CardDescription>需要关注的事项</CardDescription>
                </div>
                {dismissedWarnings.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setDismissedWarnings([]);
                      localStorage.removeItem('heat_treatment_dismissed_warnings');
                    }}
                  >
                    恢复全部
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {riskWarnings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-muted-foreground font-medium">暂无预警</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">所有业务运行正常</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {riskWarnings.map((warning) => (
                    <WarningItem
                      key={warning.id}
                      {...warning}
                      onDismiss={() => dismissWarning(warning.id)}
                      onClick={() => {
                        if (warning.type === 'overdue') navigate('/reconciliation');
                        else if (warning.type === 'inventory') navigate('/inventory');
                        else if (warning.type === 'reconciliation') navigate('/reconciliation');
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 业务完成度 - 交互式 */}
          <BusinessCompletionCard 
            monthlyStats={kpiData.monthlyStats}
            pendingReconciliationCount={kpiData.pendingReconciliationCount}
            inventoryWarningCount={kpiData.inventoryWarningCount}
            customers={customers}
            products={products}
            onNavigate={navigate}
          />
        </div>
      </div>

      {/* 消息弹窗 */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              消息通知
              {riskWarnings.length > 0 && (
                <Badge variant="destructive" className="text-xs">{riskWarnings.length} 条预警</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {riskWarnings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                <p className="text-muted-foreground">暂无预警消息</p>
              </div>
            ) : (
              riskWarnings.map((warning) => (
                <WarningItem
                  key={warning.id}
                  {...warning}
                  onDismiss={() => dismissWarning(warning.id)}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
