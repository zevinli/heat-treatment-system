import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  FileText, 
  Truck,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  Search,
  Filter,
  BarChart3,
  PieChart,
  ArrowRight,
  Box,
  UserCircle,
  Layers
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useData } from '@/data/DataContext';
import { capabilityClient } from '@lark-apaas/client-toolkit';
import { toast } from 'sonner';
import { exportToExcel } from '@/utils/excelExport';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Link } from 'react-router-dom';

// 格式化金额
const formatMoney = (amount: number) => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}亿`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  return amount.toLocaleString();
};

// 日期范围选择器组件
function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: { 
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <CalendarIcon className="h-3.5 w-3.5" />
            {startDate ? format(startDate, 'yyyy-MM-dd') : '开始日期'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={onStartDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <span className="text-muted-foreground">至</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <CalendarIcon className="h-3.5 w-3.5" />
            {endDate ? format(endDate, 'yyyy-MM-dd') : '结束日期'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={onEndDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {(startDate || endDate) && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2"
          onClick={() => { onStartDateChange(undefined); onEndDateChange(undefined); }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// 多选客户筛选器
function CustomerFilter({
  customers,
  selected,
  onChange,
}: {
  customers: Array<{ id: string; name: string; code: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const displayText = selected.length
    ? `已选 ${selected.length} 家客户`
    : '筛选客户';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Users className="h-3.5 w-3.5" />
          <span className="truncate max-w-[150px]">{displayText}</span>
          <ChevronDown className="h-3.5 w-3.5" />
          {selected.length > 0 && (
            <span
              className="ml-1 inline-flex items-center justify-center rounded-sm hover:bg-muted h-5 w-5"
              onPointerDownCapture={e => { e.preventDefault(); e.stopPropagation(); }}
              onClickCapture={e => { e.preventDefault(); e.stopPropagation(); onChange([]); }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索客户..." />
          <CommandList className="max-h-60">
            <CommandEmpty>未找到客户</CommandEmpty>
            <CommandGroup>
              {customers.map(customer => (
                <CommandItem 
                  key={customer.id} 
                  onSelect={() => {
                    onChange(
                      selected.includes(customer.id)
                        ? selected.filter(id => id !== customer.id)
                        : [...selected, customer.id]
                    );
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className={`h-4 w-4 border rounded flex items-center justify-center ${selected.includes(customer.id) ? 'bg-primary border-primary' : 'border-input'}`}>
                      {selected.includes(customer.id) && (
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm">{customer.name}</span>
                      <span className="text-xs text-muted-foreground">{customer.code}</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// 快捷导航卡片
function QuickNavCard({ 
  title, 
  description, 
  icon: Icon, 
  to, 
  color 
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType; 
  to: string;
  color: string;
}) {
  return (
    <Link to={to}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const StatisticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisContent, setAnalysisContent] = useState('');
  const analysisRef = useRef<HTMLDivElement>(null);
  
  const {
    reconciliations: rawReconciliations,
    outboundOrders: rawOutboundOrders,
    inventoryRecords: rawInventoryRecords,
    customers: rawCustomers,
    products: rawProducts,
  } = useData();

  // 防御性处理：确保数据是数组
  const reconciliations = Array.isArray(rawReconciliations) ? rawReconciliations : [];
  const outboundOrders = Array.isArray(rawOutboundOrders) ? rawOutboundOrders : [];
  const inventoryRecords = Array.isArray(rawInventoryRecords) ? rawInventoryRecords : [];
  const customers = Array.isArray(rawCustomers) ? rawCustomers : [];
  const products = Array.isArray(rawProducts) ? rawProducts : [];

  // ========== 时间筛选工具函数 ==========
  const getTimeRangeFilter = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const currentMonth = now.toISOString().slice(0, 7);
    const currentYear = now.getFullYear().toString();
    
    // 自定义日期范围
    if (timeRange === 'custom' && startDate && endDate) {
      return {
        isInRange: (dateStr: string) => {
          const date = parseISO(dateStr);
          return isWithinInterval(date, { start: startOfDay(startDate), end: endOfDay(endDate) });
        },
        isDateInRange: (date: Date) => {
          return isWithinInterval(date, { start: startOfDay(startDate), end: endOfDay(endDate) });
        },
        today,
        currentMonth,
        currentYear,
        startDate,
        endDate,
      };
    }
    
    return {
      isInRange: (dateStr: string) => {
        if (timeRange === 'day') {
          return dateStr.startsWith(today);
        } else if (timeRange === 'month') {
          return dateStr.startsWith(currentMonth);
        } else if (timeRange === 'year') {
          return dateStr.startsWith(currentYear);
        }
        return true;
      },
      isDateInRange: (date: Date) => {
        const dateStr = date.toISOString().slice(0, 10);
        if (timeRange === 'day') {
          return dateStr === today;
        } else if (timeRange === 'month') {
          return dateStr.startsWith(currentMonth);
        } else if (timeRange === 'year') {
          return dateStr.startsWith(currentYear);
        }
        return true;
      },
      today,
      currentMonth,
      currentYear,
      startDate: undefined,
      endDate: undefined,
    };
  }, [timeRange, startDate, endDate]);

  // ========== 核心数据统计 ==========
  
  // 1. 根据时间范围和客户筛选对账单（排除已作废的）
  const filteredReconciliations = useMemo(() => {
    const { isInRange } = getTimeRangeFilter();
    return reconciliations.filter(r => {
      const inTimeRange = timeRange === 'day' ? r.month === getTimeRangeFilter().currentMonth : isInRange(r.month);
      const inCustomerFilter = selectedCustomers.length === 0 || selectedCustomers.includes(r.customerId);
      const notVoided = r.status !== 'voided';
      return inTimeRange && inCustomerFilter && notVoided;
    });
  }, [reconciliations, timeRange, selectedCustomers, getTimeRangeFilter]);

  // 2. 根据时间范围和客户筛选出库单
  const filteredOutboundOrders = useMemo(() => {
    const { isInRange } = getTimeRangeFilter();
    return outboundOrders.filter(o => {
      const inTimeRange = isInRange(o.outboundDate);
      const inCustomerFilter = selectedCustomers.length === 0 || selectedCustomers.includes(o.customerId);
      return inTimeRange && inCustomerFilter;
    });
  }, [outboundOrders, timeRange, selectedCustomers, getTimeRangeFilter]);

  // 3. 根据时间范围筛选库存记录
  const filteredInventoryRecords = useMemo(() => {
    const { isInRange } = getTimeRangeFilter();
    return inventoryRecords.filter(r => isInRange(r.createdAt));
  }, [inventoryRecords, timeRange, getTimeRangeFilter]);

  // 4. 财务统计
  const financialStats = useMemo(() => {
    const totalReconciliationAmount = filteredReconciliations.reduce((sum, r) => sum + r.finalAmount, 0);
    const totalReceiptAmount = filteredReconciliations.reduce((sum, r) => sum + r.receiptAmount, 0);
    const totalUnreceivedAmount = filteredReconciliations.reduce((sum, r) => sum + r.unreceivedAmount, 0);
    const totalInvoiceAmount = filteredReconciliations.reduce((sum, r) => sum + r.invoiceAmount, 0);
    const totalUninvoiceAmount = filteredReconciliations.reduce((sum, r) => sum + r.uninvoiceAmount, 0);
    const receiptRate = totalReconciliationAmount > 0 ? (totalReceiptAmount / totalReconciliationAmount * 100) : 0;
    const invoiceRate = totalReconciliationAmount > 0 ? (totalInvoiceAmount / totalReconciliationAmount * 100) : 0;
    
    // 计算平均回款周期（简化计算：基于对账单月份到当前时间）
    const avgPaymentDays = filteredReconciliations.length > 0
      ? filteredReconciliations.reduce((sum, r) => {
          if (r.receiptAmount > 0) {
            const reconcileDate = new Date(r.month + '-01');
            const now = new Date();
            return sum + Math.floor((now.getTime() - reconcileDate.getTime()) / (1000 * 60 * 60 * 24));
          }
          return sum;
        }, 0) / filteredReconciliations.filter(r => r.receiptAmount > 0).length || 0
      : 0;
    
    return {
      totalReconciliationAmount,
      totalReceiptAmount,
      totalUnreceivedAmount,
      totalInvoiceAmount,
      totalUninvoiceAmount,
      receiptRate,
      invoiceRate,
      avgPaymentDays,
    };
  }, [filteredReconciliations]);

  // 5. 出库单统计
  const outboundStats = useMemo(() => {
    const totalOrders = filteredOutboundOrders.length;
    const totalQuantity = filteredOutboundOrders.reduce((sum, o) => sum + o.totalQuantity, 0);
    const totalWeight = filteredOutboundOrders.reduce((sum, o) => sum + (o.totalWeight || 0), 0);
    const totalAmount = filteredOutboundOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;
    const avgOrderQuantity = totalOrders > 0 ? totalQuantity / totalOrders : 0;
    
    // 出库效率：日均出库单数
    const { startDate, endDate } = getTimeRangeFilter();
    let days = 1;
    if (startDate && endDate) {
      days = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    } else if (timeRange === 'month') {
      days = 30;
    } else if (timeRange === 'year') {
      days = 365;
    }
    const dailyAvgOrders = totalOrders / days;
    
    return {
      totalOrders,
      totalQuantity,
      totalWeight,
      totalAmount,
      avgOrderAmount,
      avgOrderQuantity,
      dailyAvgOrders,
    };
  }, [filteredOutboundOrders, timeRange, getTimeRangeFilter]);

  // 6. 库存统计
  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalStockWeight = products.reduce((sum, p) => sum + (p.stockWeight || 0), 0);
    const totalInboundWeight = products.reduce((sum, p) => sum + (p.inboundWeight || 0), 0);
    const zeroStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 50).length;
    const normalStock = products.filter(p => p.stock >= 50).length;
    const highStock = products.filter(p => p.stock >= 200).length;
    
    // 计算库存周转率
    const totalOutbound = inventoryRecords
      .filter(r => r.changeType === 'outbound')
      .reduce((sum, r) => sum + Math.abs(r.quantityChange), 0);
    const avgStock = totalStock > 0 ? (totalStock + totalOutbound) / 2 : 0;
    const turnoverRate = avgStock > 0 ? (totalOutbound / avgStock) : 0;
    const turnoverDays = turnoverRate > 0 ? 365 / turnoverRate : 0;
    
    // 计算库存占用资金
    const inventoryValue = products.reduce((sum, p) => sum + (p.stock * (p.unitPrice || 0)), 0);
    
    return { 
      totalProducts, 
      totalStock, 
      totalStockWeight,
      totalInboundWeight,
      zeroStock, 
      lowStock, 
      normalStock,
      highStock,
      turnoverRate,
      turnoverDays,
      inventoryValue,
    };
  }, [products, inventoryRecords]);

  // 7. 客户统计
  const customerStats = useMemo(() => {
    const activeCustomers = new Set(filteredOutboundOrders.map(o => o.customerId)).size;
    const reconciliationCustomers = new Set(filteredReconciliations.map(r => r.customerId)).size;
    
    // 客户详情统计
    const customerMap = new Map<string, { 
      id: string;
      name: string; 
      code: string;
      reconciliationAmount: number;
      receiptAmount: number;
      unreceivedAmount: number;
      uninvoiceAmount: number;
      orderCount: number;
      totalQuantity: number;
      totalWeight: number;
      avgOrderAmount: number;
      lastOrderDate: string | null;
    }>();
    
    filteredReconciliations.forEach(r => {
      const existing = customerMap.get(r.customerId);
      if (existing) {
        existing.reconciliationAmount += r.finalAmount;
        existing.receiptAmount += r.receiptAmount;
        existing.unreceivedAmount += r.unreceivedAmount;
        existing.uninvoiceAmount += r.uninvoiceAmount;
      } else {
        customerMap.set(r.customerId, {
          id: r.customerId,
          name: r.customerName,
          code: r.customerCode,
          reconciliationAmount: r.finalAmount,
          receiptAmount: r.receiptAmount,
          unreceivedAmount: r.unreceivedAmount,
          uninvoiceAmount: r.uninvoiceAmount,
          orderCount: 0,
          totalQuantity: 0,
          totalWeight: 0,
          avgOrderAmount: 0,
          lastOrderDate: null,
        });
      }
    });
    
    // 补充出库单统计
    filteredOutboundOrders.forEach(o => {
      const existing = customerMap.get(o.customerId);
      if (existing) {
        existing.orderCount++;
        existing.totalQuantity += o.totalQuantity;
        existing.totalWeight += (o.totalWeight || 0);
        if (!existing.lastOrderDate || o.outboundDate > existing.lastOrderDate) {
          existing.lastOrderDate = o.outboundDate;
        }
      } else {
        customerMap.set(o.customerId, {
          id: o.customerId,
          name: o.customerName,
          code: o.customerCode,
          reconciliationAmount: 0,
          receiptAmount: 0,
          unreceivedAmount: 0,
          uninvoiceAmount: 0,
          orderCount: 1,
          totalQuantity: o.totalQuantity,
          totalWeight: o.totalWeight || 0,
          avgOrderAmount: o.totalAmount,
          lastOrderDate: o.outboundDate,
        });
      }
    });
    
    // 计算平均值
    customerMap.forEach(c => {
      c.avgOrderAmount = c.orderCount > 0 ? (c.reconciliationAmount / c.orderCount) : 0;
    });
    
    const customerList = Array.from(customerMap.values())
      .sort((a, b) => b.reconciliationAmount - a.reconciliationAmount);
    
    // 客户分层
    const vipCustomers = customerList.filter(c => c.reconciliationAmount >= 50000).length;
    const regularCustomers = customerList.filter(c => c.reconciliationAmount >= 10000 && c.reconciliationAmount < 50000).length;
    const smallCustomers = customerList.filter(c => c.reconciliationAmount < 10000).length;
    
    return {
      activeCustomers,
      reconciliationCustomers,
      customerList,
      vipCustomers,
      regularCustomers,
      smallCustomers,
    };
  }, [filteredReconciliations, filteredOutboundOrders]);

  // 8. 产品统计
  const productStats = useMemo(() => {
    const productMap = new Map<string, {
      id: string;
      name: string;
      material: string;
      process: string;
      outboundCount: number;
      outboundQuantity: number;
      outboundWeight: number;
      revenue: number;
      processingCycleDays: number;
      processingCycleCount: number;
      avgProcessingCycleDays: number;
    }>();

    // 先建立产品主数据，再严格按筛选范围内的出库明细汇总运行数据。
    products.forEach(p => {
      productMap.set(p.id, {
        id: p.id,
        name: p.name,
        material: p.material || '未分类',
        process: p.process || '未分类',
        outboundCount: 0,
        outboundQuantity: 0,
        outboundWeight: 0,
        revenue: 0,
        processingCycleDays: 0,
        processingCycleCount: 0,
        avgProcessingCycleDays: 0,
      });
    });

    filteredOutboundOrders
      .filter(order => order.status !== 'cancelled')
      .forEach(order => {
        const countedProducts = new Set<string>();
        (order.details || []).forEach(detail => {
          const product = products.find(item => item.id === detail.productId);
          const current = productMap.get(detail.productId) || {
            id: detail.productId,
            name: detail.productName || '未知产品',
            material: detail.material || '未分类',
            process: detail.process || '未分类',
            outboundCount: 0,
            outboundQuantity: 0,
            outboundWeight: 0,
            revenue: 0,
            processingCycleDays: 0,
            processingCycleCount: 0,
            avgProcessingCycleDays: 0,
          };
          if (!countedProducts.has(detail.productId)) {
            current.outboundCount += 1;
            countedProducts.add(detail.productId);
          }
          current.outboundQuantity += Number(detail.quantity || 0);
          current.outboundWeight += Number(detail.weight || 0);
          current.revenue += Number(detail.amount || 0);

          if (detail.inboundDate) {
            const inboundAt = new Date(detail.inboundDate).getTime();
            const outboundAt = new Date(order.outboundDate).getTime();
            if (Number.isFinite(inboundAt) && Number.isFinite(outboundAt) && outboundAt >= inboundAt) {
              current.processingCycleDays += (outboundAt - inboundAt) / 86_400_000;
              current.processingCycleCount += 1;
            }
          }
          current.name = product?.name || current.name;
          current.material = product?.material || current.material;
          current.process = product?.process || current.process;
          productMap.set(detail.productId, current);
        });
      });
    
    const productList = Array.from(productMap.values())
      .map(product => ({
        ...product,
        avgProcessingCycleDays: product.processingCycleCount > 0
          ? product.processingCycleDays / product.processingCycleCount
          : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
    
    // 材质分布
    const materialMap = new Map<string, number>();
    productList.filter(p => p.outboundQuantity > 0).forEach(p => {
      const material = p.material || '未分类';
      materialMap.set(material, (materialMap.get(material) || 0) + p.outboundQuantity);
    });
    const materialDistribution = Array.from(materialMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    
    // 工艺分布
    const processMap = new Map<string, number>();
    productList.filter(p => p.revenue > 0).forEach(p => {
      const process = p.process || '未分类';
      processMap.set(process, (processMap.get(process) || 0) + p.revenue);
    });
    const processDistribution = Array.from(processMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    
    return {
      productList,
      materialDistribution,
      processDistribution,
    };
  }, [products, filteredOutboundOrders]);

  // 9. 待对账统计
  const pendingReconciliationStats = useMemo(() => {
    const pendingOrders = outboundOrders.filter(o => {
      const isPending = o.status === 'pending_reconciliation';
      const inCustomerFilter = selectedCustomers.length === 0 || selectedCustomers.includes(o.customerId);
      return isPending && inCustomerFilter;
    });
    const totalAmount = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { 
      count: pendingOrders.length, 
      amount: totalAmount,
      customers: new Set(pendingOrders.map(o => o.customerId)).size,
    };
  }, [outboundOrders, selectedCustomers]);

  // 10. 业务趋势分析
  const trendAnalysis = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const prevMonth = new Date(now.setMonth(now.getMonth() - 1)).toISOString().slice(0, 7);
    
    const currentMonthData = reconciliations.filter(r => r.month === currentMonth);
    const prevMonthData = reconciliations.filter(r => r.month === prevMonth);
    
    const currentAmount = currentMonthData.reduce((sum, r) => sum + r.finalAmount, 0);
    const prevAmount = prevMonthData.reduce((sum, r) => sum + r.finalAmount, 0);
    
    const growthRate = prevAmount > 0 ? ((currentAmount - prevAmount) / prevAmount * 100) : 0;
    
    // 计算同比（去年同月）
    const lastYearMonth = new Date();
    lastYearMonth.setFullYear(lastYearMonth.getFullYear() - 1);
    const lastYearMonthStr = lastYearMonth.toISOString().slice(0, 7);
    const lastYearData = reconciliations.filter(r => r.month === lastYearMonthStr);
    const lastYearAmount = lastYearData.reduce((sum, r) => sum + r.finalAmount, 0);
    const yoyGrowthRate = lastYearAmount > 0 ? ((currentAmount - lastYearAmount) / lastYearAmount * 100) : 0;
    
    return {
      currentAmount,
      prevAmount,
      growthRate,
      isGrowth: growthRate >= 0,
      yoyGrowthRate,
      isYoyGrowth: yoyGrowthRate >= 0,
    };
  }, [reconciliations]);

  // ========== AI数据洞察 ==========
  const generateAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisContent('');
    
    const timeRangeText = timeRange === 'day' ? '今日' : timeRange === 'month' ? '本月' : timeRange === 'year' ? '本年' : '自定义时间段';
    
    const prompt = `请作为一位专业的热处理行业数据分析师，基于以下业务数据生成一份详细的数据洞察报告：

【时间范围】${timeRangeText}
${selectedCustomers.length > 0 ? `【筛选客户】${selectedCustomers.length}家指定客户` : ''}

【财务数据】
- 对账总金额：¥${financialStats.totalReconciliationAmount.toLocaleString()}
- 已回款金额：¥${financialStats.totalReceiptAmount.toLocaleString()}
- 未回款金额：¥${financialStats.totalUnreceivedAmount.toLocaleString()}
- 已开票金额：¥${financialStats.totalInvoiceAmount.toLocaleString()}
- 回款率：${financialStats.receiptRate.toFixed(1)}%
- 平均回款周期：${financialStats.avgPaymentDays.toFixed(0)}天

【出库数据】
- 出库单数量：${outboundStats.totalOrders}单
- 出库总数量：${outboundStats.totalQuantity}件
- 出库总重量：${outboundStats.totalWeight.toFixed(2)}kg
- 出库总金额：¥${outboundStats.totalAmount.toLocaleString()}
- 平均每单金额：¥${outboundStats.avgOrderAmount.toFixed(2)}
- 日均出库单数：${outboundStats.dailyAvgOrders.toFixed(1)}单

【库存数据】
- 产品总数：${inventoryStats.totalProducts}个
- 总库存量：${inventoryStats.totalStock}件
- 库存占用资金：¥${inventoryStats.inventoryValue.toLocaleString()}
- 库存周转率：${inventoryStats.turnoverRate.toFixed(2)}次/年
- 库存周转天数：${inventoryStats.turnoverDays.toFixed(0)}天
- 缺货产品：${inventoryStats.zeroStock}个
- 库存预警：${inventoryStats.lowStock}个

【客户数据】
- 活跃客户：${customerStats.activeCustomers}家
- 对账客户：${customerStats.reconciliationCustomers}家
- VIP客户(≥5万)：${customerStats.vipCustomers}家
- 普通客户(1-5万)：${customerStats.regularCustomers}家
- 小客户(<1万)：${customerStats.smallCustomers}家

【趋势分析】
- 环比增长：${trendAnalysis.growthRate.toFixed(1)}%
- 同比增长：${trendAnalysis.yoyGrowthRate.toFixed(1)}%

请从以下几个方面进行分析：
1. 财务健康状况评估（回款率、回款周期分析）
2. 业务运营效率分析（出库效率、客户活跃度）
3. 库存管理建议（周转率、库存结构优化）
4. 客户价值分析（客户分层、重点客户识别）
5. 风险提示与改进建议（逾期回款、库存积压等）

请以专业、简洁的口吻输出分析报告。`;

    try {
      const stream = capabilityClient
        .load('intelligent_writing_quick_quality_1')
        .callStream<{ content: string }>('textGenerate', {
          modelID: '87',
          modelParams: {
            temperature: 0.5,
            maxTokens: 8192,
          },
          prompt,
        });

      for await (const chunk of stream) {
        if (chunk.content) {
          setAnalysisContent(prev => prev + chunk.content);
        }
      }
      
      toast.success('数据分析报告生成完成');
    } catch (error) {
      toast.error('生成分析报告失败');
      logger.error('AI分析失败:', error);
    } finally {
      setAnalysisLoading(false);
    }
  }, [timeRange, selectedCustomers, financialStats, outboundStats, inventoryStats, customerStats, trendAnalysis]);

  // ========== 图表配置 ==========

  // 月度趋势图（实际数据）
  const monthlyTrendOption = useMemo(() => {
    // 获取最近12个月的数据
    const months: string[] = [];
    const reconciliationData: number[] = [];
    const receiptData: number[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().slice(0, 7);
      months.push(`${d.getMonth() + 1}月`);
      
      const monthReconciliations = reconciliations.filter(r => r.month === monthStr);
      reconciliationData.push(monthReconciliations.reduce((sum, r) => sum + r.finalAmount, 0));
      receiptData.push(monthReconciliations.reduce((sum, r) => sum + r.receiptAmount, 0));
    }
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any[]) => {
          let result = params[0].name + '<br/>';
          params.forEach(p => {
            result += `${p.marker} ${p.seriesName}: ¥${p.value.toLocaleString()}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ['对账金额', '回款金额'],
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: {
          formatter: (value: number) => value >= 10000 ? `${(value / 10000).toFixed(0)}万` : value,
        },
      },
      series: [
        {
          name: '对账金额',
          type: 'line',
          data: reconciliationData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.15)',
          },
        },
        {
          name: '回款金额',
          type: 'line',
          data: receiptData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#10b981' },
          itemStyle: { color: '#10b981' },
        },
      ],
    };
  }, [reconciliations]);

  // 客户对账金额排行
  const customerRankOption = useMemo(() => {
    const topCustomers = customerStats.customerList.slice(0, 10).reverse();
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>对账金额: ¥${data.value.toLocaleString()}`;
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
        data: topCustomers.map(c => c.name.slice(0, 8)),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#374151' },
      },
      series: [
        {
          type: 'bar',
          data: topCustomers.map(c => c.reconciliationAmount),
          barWidth: '60%',
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }, [customerStats.customerList]);

  // 回款状态饼图
  const paymentStatusOption = useMemo(() => {
    const data = [
      { value: filteredReconciliations.filter(r => r.status === 'paid').length, name: '已回款', itemStyle: { color: '#10b981' } },
      { value: filteredReconciliations.filter(r => r.status === 'invoiced').length, name: '已开票', itemStyle: { color: '#8b5cf6' } },
      { value: filteredReconciliations.filter(r => r.status === 'audited').length, name: '已审核', itemStyle: { color: '#3b82f6' } },
      { value: filteredReconciliations.filter(r => r.status === 'confirmed').length, name: '待开票', itemStyle: { color: '#f59e0b' } },
    ].filter(d => d.value > 0);
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}单 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
      },
      series: [
        {
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
          data,
        },
      ],
    };
  }, [filteredReconciliations]);

  // 客户分层饼图
  const customerTierOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}家 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [
      {
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
          show: true,
          formatter: '{b}\n{c}家',
        },
        data: [
          { value: customerStats.vipCustomers, name: 'VIP客户', itemStyle: { color: '#f59e0b' } },
          { value: customerStats.regularCustomers, name: '普通客户', itemStyle: { color: '#3b82f6' } },
          { value: customerStats.smallCustomers, name: '小客户', itemStyle: { color: '#6b7280' } },
        ].filter(d => d.value > 0),
      },
    ],
  }), [customerStats]);

  // 产品材质分布
  const materialOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: productStats.materialDistribution.map(d => d.name.slice(0, 6)),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', rotate: 30 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [
      {
        type: 'bar',
        data: productStats.materialDistribution.map(d => d.value),
        barWidth: '50%',
        itemStyle: {
          color: '#8b5cf6',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  }), [productStats.materialDistribution]);

  // 产品运行热力图：颜色深浅表示筛选周期内的实际出库次数。
  const productHeatmapOption = useMemo(() => {
    const runningProducts = productStats.productList
      .filter(product => product.outboundCount > 0)
      .slice(0, 12);
    const maxHeat = Math.max(1, ...runningProducts.map(product => product.outboundCount));
    return {
      tooltip: { position: 'top' },
      grid: { left: 80, right: 24, top: 20, bottom: 80 },
      xAxis: {
        type: 'category',
        data: runningProducts.map(product => product.name),
        splitArea: { show: true },
        axisLabel: { interval: 0, rotate: 35, width: 90, overflow: 'truncate' },
      },
      yAxis: {
        type: 'category',
        data: ['出库热度'],
        splitArea: { show: true },
      },
      visualMap: {
        min: 0,
        max: maxHeat,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: { color: ['hsl(215 70% 95%)', 'hsl(215 70% 35%)'] },
      },
      series: [{
        name: '出库次数',
        type: 'heatmap',
        data: runningProducts.map((product, index) => [index, 0, product.outboundCount]),
        label: { show: true },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'hsl(215 70% 35% / 35%)' } },
      }],
    };
  }, [productStats.productList]);

  // 库存状态分布
  const inventoryStatusOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}个 ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{c}个',
        },
        data: [
          { value: inventoryStats.normalStock, name: '正常库存', itemStyle: { color: '#10b981' } },
          { value: inventoryStats.lowStock, name: '库存预警', itemStyle: { color: '#f59e0b' } },
          { value: inventoryStats.zeroStock, name: '缺货', itemStyle: { color: '#ef4444' } },
          { value: inventoryStats.highStock, name: '高库存', itemStyle: { color: '#3b82f6' } },
        ].filter(d => d.value > 0),
      },
    ],
  }), [inventoryStats]);

  // 导出数据
  const handleExport = useCallback(() => {
    const data = customerStats.customerList.map(c => ({
      code: c.code,
      name: c.name,
      reconciliationAmount: c.reconciliationAmount,
      receiptAmount: c.receiptAmount,
      unreceivedAmount: c.unreceivedAmount,
      uninvoiceAmount: c.uninvoiceAmount,
      receiptRate: c.reconciliationAmount > 0 ? `${(c.receiptAmount / c.reconciliationAmount * 100).toFixed(1)}%` : '0%',
      orderCount: c.orderCount,
      totalQuantity: c.totalQuantity,
      totalWeight: c.totalWeight.toFixed(2),
      lastOrderDate: c.lastOrderDate || '-',
    }));
    
    const columns = [
      { key: 'code', title: '客户编码' },
      { key: 'name', title: '客户名称' },
      { key: 'reconciliationAmount', title: '对账金额' },
      { key: 'receiptAmount', title: '已回款' },
      { key: 'unreceivedAmount', title: '未回款' },
      { key: 'uninvoiceAmount', title: '未开票' },
      { key: 'receiptRate', title: '回款率' },
      { key: 'orderCount', title: '出库单数' },
      { key: 'totalQuantity', title: '出库数量' },
      { key: 'totalWeight', title: '出库重量(kg)' },
      { key: 'lastOrderDate', title: '最近下单' },
    ];
    
    exportToExcel(data, columns, `客户统计_${format(new Date(), 'yyyyMMdd')}`);
    toast.success('数据导出成功');
  }, [customerStats.customerList]);

  // 如果没有数据
  const hasData = filteredReconciliations.length > 0 || filteredOutboundOrders.length > 0;

  return (
    <div className="w-full space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">数据统计中心</h1>
          <p className="text-sm text-muted-foreground mt-1">全方位业务数据分析与洞察</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            导出数据
          </Button>
          <Button 
            size="sm" 
            onClick={generateAnalysis}
            disabled={analysisLoading || !hasData}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {analysisLoading ? '分析中...' : 'AI数据洞察'}
          </Button>
        </div>
      </div>

      {/* 快捷导航 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickNavCard 
          title="客户深度分析" 
          description="客户价值、回款周期、贡献度排行" 
          icon={UserCircle} 
          to="/statistics/customer"
          color="bg-blue-100 text-blue-600"
        />
        <QuickNavCard 
          title="库存周转分析" 
          description="库存结构、周转率、预警分析" 
          icon={Box} 
          to="/statistics/inventory"
          color="bg-emerald-100 text-emerald-600"
        />
        <QuickNavCard 
          title="产品维度分析" 
          description="产品销售排行、材质工艺分布" 
          icon={Layers} 
          to="/statistics/product"
          color="bg-violet-100 text-violet-600"
        />
        <QuickNavCard 
          title="财务报表" 
          description="回款趋势、账龄分析、利润统计" 
          icon={BarChart3} 
          to="/statistics/finance"
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* AI分析报告 */}
      {(analysisContent || analysisLoading) && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
              <Sparkles className="h-5 w-5" />
              AI数据洞察报告
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={analysisRef}
              className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto"
            >
              {analysisContent}
              {analysisLoading && (
                <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 筛选工具栏 */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* 时间范围 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">时间范围:</span>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">今日</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="year">本年</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 自定义日期范围 */}
            {timeRange === 'custom' && (
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            )}
            
            {/* 客户筛选 */}
            <CustomerFilter
              customers={customers.map(c => ({ id: c.id, name: c.name, code: c.code }))}
              selected={selectedCustomers}
              onChange={setSelectedCustomers}
            />
            
            {/* 重置筛选 */}
            {(selectedCustomers.length > 0 || timeRange === 'custom') && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setSelectedCustomers([]);
                  setTimeRange('month');
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                <X className="h-3 w-3 mr-1" />
                重置筛选
              </Button>
            )}
            
            {/* 趋势指示 */}
            <div className="flex items-center gap-2 text-sm ml-auto">
              <span className="text-muted-foreground">环比:</span>
              {trendAnalysis.isGrowth ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{trendAnalysis.growthRate.toFixed(1)}%
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {trendAnalysis.growthRate.toFixed(1)}%
                </Badge>
              )}
              <span className="text-muted-foreground ml-2">同比:</span>
              {trendAnalysis.isYoyGrowth ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{trendAnalysis.yoyGrowthRate.toFixed(1)}%
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {trendAnalysis.yoyGrowthRate.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 核心指标卡片区 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 财务指标 */}
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100">
                <Wallet className="h-3 w-3 text-blue-600" />
              </div>
              对账金额
            </div>
            <div className="text-lg font-bold font-tabular">¥{formatMoney(financialStats.totalReconciliationAmount)}</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              </div>
              已回款
            </div>
            <div className="text-lg font-bold text-emerald-600 font-tabular">¥{formatMoney(financialStats.totalReceiptAmount)}</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-orange-100">
                <AlertTriangle className="h-3 w-3 text-orange-600" />
              </div>
              未回款
            </div>
            <div className="text-lg font-bold text-orange-600 font-tabular">¥{formatMoney(financialStats.totalUnreceivedAmount)}</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-100">
                <RefreshCw className="h-3 w-3 text-violet-600" />
              </div>
              回款率
            </div>
            <div className="text-lg font-bold font-tabular">{financialStats.receiptRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">均{financialStats.avgPaymentDays.toFixed(0)}天</div>
          </CardContent>
        </Card>

        {/* 业务指标 */}
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100">
                <Truck className="h-3 w-3 text-indigo-600" />
              </div>
              出库单
            </div>
            <div className="text-lg font-bold font-tabular">{outboundStats.totalOrders}单</div>
            <div className="text-xs text-muted-foreground mt-1">均{outboundStats.dailyAvgOrders.toFixed(1)}单/天</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-100">
                <Package className="h-3 w-3 text-cyan-600" />
              </div>
              出库数量
            </div>
            <div className="text-lg font-bold font-tabular">{outboundStats.totalQuantity}件</div>
            <div className="text-xs text-muted-foreground mt-1">{outboundStats.totalWeight.toFixed(0)}kg</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-pink-100">
                <Users className="h-3 w-3 text-pink-600" />
              </div>
              活跃客户
            </div>
            <div className="text-lg font-bold font-tabular">{customerStats.activeCustomers}家</div>
            <div className="text-xs text-muted-foreground mt-1">VIP{customerStats.vipCustomers}家</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-100">
                <FileText className="h-3 w-3 text-amber-600" />
              </div>
              对账单
            </div>
            <div className="text-lg font-bold font-tabular">{filteredReconciliations.length}单</div>
            <div className="text-xs text-muted-foreground mt-1">开票率{financialStats.invoiceRate.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* 待对账预警 */}
      {pendingReconciliationStats.count > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">待对账预警</p>
                  <p className="text-sm text-orange-700">
                    有 {pendingReconciliationStats.count} 个出库单待对账，涉及 {pendingReconciliationStats.customers} 家客户，
                    金额共计 ¥{pendingReconciliationStats.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 月度趋势 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              月度对账与回款趋势（近12个月）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reconciliations.length > 0 ? (
              <ReactECharts option={monthlyTrendOption} style={{ height: 320 }} />
            ) : (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 客户排行 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">客户对账金额排行</CardTitle>
          </CardHeader>
          <CardContent>
            {customerStats.customerList.length > 0 ? (
              <ReactECharts option={customerRankOption} style={{ height: 300 }} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 客户分层 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">客户分层分布</CardTitle>
          </CardHeader>
          <CardContent>
            {customerStats.customerList.length > 0 ? (
              <ReactECharts option={customerTierOption} style={{ height: 300 }} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 回款状态 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">对账单状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReconciliations.length > 0 ? (
              <ReactECharts option={paymentStatusOption} style={{ height: 300 }} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 材质分布 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">产品材质分布</CardTitle>
          </CardHeader>
          <CardContent>
            {productStats.materialDistribution.length > 0 ? (
              <ReactECharts option={materialOption} style={{ height: 300 }} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 产品运行统计 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">产品运行热力图与加工周期</CardTitle>
          </CardHeader>
          <CardContent>
            {productStats.productList.some(product => product.outboundCount > 0) ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ReactECharts option={productHeatmapOption} style={{ height: 300 }} />
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>产品</TableHead>
                        <TableHead className="text-right">出库次数</TableHead>
                        <TableHead className="text-right">出库数量</TableHead>
                        <TableHead className="text-right">平均周期</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productStats.productList
                        .filter(product => product.outboundCount > 0)
                        .slice(0, 10)
                        .map(product => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">{product.material} · {product.process}</div>
                            </TableCell>
                            <TableCell className="text-right">{product.outboundCount}</TableCell>
                            <TableCell className="text-right">{product.outboundQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {product.processingCycleCount > 0
                                ? `${product.avgProcessingCycleDays.toFixed(1)}天`
                                : '暂无入库日期'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                当前筛选范围内暂无产品出库明细
              </div>
            )}
          </CardContent>
        </Card>

        {/* 库存状态 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">库存状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <ReactECharts option={inventoryStatusOption} style={{ height: 280 }} />
              <div className="space-y-2 py-2">
                <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                  <span className="text-xs text-emerald-700">正常库存</span>
                  <span className="font-bold text-emerald-700 text-sm">{inventoryStats.normalStock}个</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
                  <span className="text-xs text-amber-700">高库存</span>
                  <span className="font-bold text-amber-700 text-sm">{inventoryStats.highStock}个</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                  <span className="text-xs text-orange-700">库存预警</span>
                  <span className="font-bold text-orange-700 text-sm">{inventoryStats.lowStock}个</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                  <span className="text-xs text-red-700">缺货产品</span>
                  <span className="font-bold text-red-700 text-sm">{inventoryStats.zeroStock}个</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                  <span className="text-xs text-blue-700">库存占用</span>
                  <span className="font-bold text-blue-700 text-sm">¥{formatMoney(inventoryStats.inventoryValue)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 客户明细表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>客户对账明细</span>
            <span className="text-sm font-normal text-muted-foreground">
              共 {customerStats.customerList.length} 家客户
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
                <TableHead className="text-right">出库单</TableHead>
                <TableHead className="text-right">出库量</TableHead>
                <TableHead>最近下单</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerStats.customerList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    暂无客户数据
                  </TableCell>
                </TableRow>
              ) : (
                customerStats.customerList.slice(0, 15).map((c) => {
                  const rate = c.reconciliationAmount > 0 
                    ? (c.receiptAmount / c.reconciliationAmount * 100) 
                    : 0;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.code}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">¥{c.reconciliationAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-emerald-600">
                        ¥{c.receiptAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {c.unreceivedAmount > 0 ? `¥${c.unreceivedAmount.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={rate >= 90 ? 'text-emerald-600' : rate >= 50 ? 'text-blue-600' : 'text-orange-600'}>
                          {rate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{c.orderCount}单</TableCell>
                      <TableCell className="text-right">{c.totalQuantity}件</TableCell>
                      <TableCell className="text-xs">
                        {c.lastOrderDate ? format(parseISO(c.lastOrderDate), 'MM-dd') : '-'}
                      </TableCell>
                      <TableCell>
                        {c.unreceivedAmount > 0 ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            待回款
                          </Badge>
                        ) : c.reconciliationAmount > 0 ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            正常
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 text-xs">-</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsPage;
