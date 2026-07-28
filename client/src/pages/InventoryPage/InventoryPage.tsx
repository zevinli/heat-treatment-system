import React, { useState, useMemo } from 'react';
import {
  SearchIcon,
  FilterIcon,
  PackageIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  EditIcon,
  Trash2Icon,
  HistoryIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  RefreshCcwIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Download,
  X,
  ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table } from '@lark-apaas/client-toolkit/antd-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Filter,
  FilterContent,
  FilterTextContent,
  FilterSelectContent,
  FilterMultiSelectContent,
  FilterNumberContent,
  FilterTrigger,
  FilterGroup,
  type NumberRangeValue,
} from '@/components/ui/filter';
import type { TableProps } from '@lark-apaas/client-toolkit/antd-table';
import { Empty, EmptyDescription } from '@/components/ui/empty';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useData, IInventoryRecord, IInventorySummary } from '@/data/DataContext';
import { exportToExcel, getInventoryExportColumns } from '@/utils/excelExport';
import { cn } from '@/lib/utils';
import { ChangeTypeBadge, ChangeTypeWithAmount } from '@/components/ChangeTypeBadge';

const materialOptions = [
  { value: '40Cr', label: '40Cr' },
  { value: '45#钢', label: '45#钢' },
  { value: '42CrMo', label: '42CrMo' },
  { value: '20CrMnTi', label: '20CrMnTi' },
  { value: '20Cr', label: '20Cr' },
  { value: '35#钢', label: '35#钢' },
  { value: 'HT200', label: 'HT200' },
];
const statusOptions = [
  { value: 'normal', label: '正常' },
  { value: 'warning', label: '预警' },
  { value: 'danger', label: '缺货' },
];

const InventoryPage: React.FC = () => {
  const {
    products: rawProducts,
    customers: rawCustomers,
    inventoryRecords: rawInventoryRecords,
    increaseStock,
    decreaseStock,
    getInventorySummary,
  } = useData();

  // 防御性处理：确保数据是数组
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const customers = Array.isArray(rawCustomers) ? rawCustomers : [];
  const inventoryRecords = Array.isArray(rawInventoryRecords) ? rawInventoryRecords : [];

  // 筛选状态 - 使用Filter组件的新状态
  const [searchKeyword, setSearchKeyword] = useState<string | undefined>();
  const [selectedMaterial, setSelectedMaterial] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [customerFilter, setCustomerFilter] = useState<string | undefined>();
  const [stockRange, setStockRange] = useState<NumberRangeValue | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 弹窗状态
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IInventorySummary | null>(null);
  const [adjustType, setAdjustType] = useState<'increase' | 'decrease'>('increase');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustWeight, setAdjustWeight] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustRemark, setAdjustRemark] = useState('');
  const [currentUser] = useState('管理员');

  // 调整原因选项
  const adjustReasonOptions = [
    { value: 'inventory_profit', label: '盘点盘盈' },
    { value: 'inventory_loss', label: '盘点盘亏' },
    { value: 'damage', label: '损坏报废' },
    { value: 'quality_reject', label: '质检不合格' },
    { value: 'other', label: '其他' },
  ];

  // 获取库存汇总
  const inventorySummary = useMemo(() => getInventorySummary(), [getInventorySummary]);

  // 客户选项
  const customerOptions = useMemo(() => {
    return customers.map(c => ({ value: c.code, label: c.name }));
  }, [customers]);

  // 筛选库存数据
  const filteredInventory = useMemo(() => {
    return inventorySummary.filter(item => {
      const matchKeyword = !searchKeyword ||
        item.productName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.workpieceNo.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchMaterial = !selectedMaterial || item.material === selectedMaterial;
      const matchCustomer = !customerFilter || item.customerCode === customerFilter;

      // 状态筛选 - 根据计价单位判断
      let matchStatus = true;
      const isWeightBased = item.unit === 'kg';
      const currentValue = isWeightBased ? item.currentStockWeight : item.currentStock;
      const threshold = isWeightBased
        ? (item.warningWeightThreshold || item.warningThreshold)
        : item.warningThreshold;

      if (selectedStatus === 'normal') {
        matchStatus = currentValue >= threshold;
      } else if (selectedStatus === 'warning') {
        matchStatus = currentValue > 0 && currentValue < threshold;
      } else if (selectedStatus === 'danger') {
        matchStatus = currentValue <= 0;
      }

      // 库存数量范围筛选
      let matchStockRange = true;
      if (stockRange) {
        const stockValue = item.currentStock;
        if (stockRange.min !== undefined && stockValue < stockRange.min) {
          matchStockRange = false;
        }
        if (stockRange.max !== undefined && stockValue > stockRange.max) {
          matchStockRange = false;
        }
      }

      return matchKeyword && matchMaterial && matchCustomer && matchStatus && matchStockRange;
    });
  }, [inventorySummary, searchKeyword, selectedMaterial, customerFilter, selectedStatus, stockRange]);

  // 分页数据
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInventory.slice(start, start + pageSize);
  }, [filteredInventory, currentPage, pageSize]);

  // 统计数据 - 根据计价单位判断
  const stats = useMemo(() => {
    const total = inventorySummary.length;
    const totalStock = inventorySummary.reduce((sum, item) => sum + item.currentStock, 0);
    const totalStockWeight = inventorySummary.reduce((sum, item) => sum + item.currentStockWeight, 0);

    const normal = inventorySummary.filter(i => {
      const isWeightBased = i.unit === 'kg';
      const currentValue = isWeightBased ? i.currentStockWeight : i.currentStock;
      const threshold = isWeightBased ? (i.warningWeightThreshold || i.warningThreshold) : i.warningThreshold;
      return currentValue >= threshold;
    }).length;

    const warning = inventorySummary.filter(i => {
      const isWeightBased = i.unit === 'kg';
      const currentValue = isWeightBased ? i.currentStockWeight : i.currentStock;
      const threshold = isWeightBased ? (i.warningWeightThreshold || i.warningThreshold) : i.warningThreshold;
      return currentValue > 0 && currentValue < threshold;
    }).length;

    const danger = inventorySummary.filter(i => {
      const isWeightBased = i.unit === 'kg';
      const currentValue = isWeightBased ? i.currentStockWeight : i.currentStock;
      return currentValue <= 0;
    }).length;

    return { total, totalStock, totalStockWeight, normal, warning, danger };
  }, [inventorySummary]);

  // 获取状态标签 - 根据计价单位判断
  const getStatusBadge = (item: IInventorySummary) => {
    const isWeightBased = item.unit === 'kg';
    const currentValue = isWeightBased ? item.currentStockWeight : item.currentStock;
    const threshold = isWeightBased
      ? (item.warningWeightThreshold || item.warningThreshold)
      : item.warningThreshold;
    const unit = isWeightBased ? 'kg' : '件';

    if (currentValue <= 0) {
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><AlertTriangleIcon className="w-3 h-3 mr-1" />缺货</Badge>;
    }
    if (currentValue < threshold) {
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
          <ClockIcon className="w-3 h-3 mr-1" />
          预警({currentValue.toFixed(2)}{unit})
        </Badge>
      );
    }
    return <Badge variant="outline" className="bg-success/10 text-success border-success/20"><CheckCircleIcon className="w-3 h-3 mr-1" />正常</Badge>;
  };

  // 获取变动类型标签 - 使用统一组件
  const getChangeTypeBadge = (type: IInventoryRecord['changeType'], record?: IInventoryRecord) => {
    if (record) {
      return (
        <ChangeTypeWithAmount
          type={type}
          quantity={Math.abs(record.quantityChange)}
          weight={record.weightChange}
          size="sm"
        />
      );
    }
    return <ChangeTypeBadge type={type} size="sm" />;
  };

  // 行样式
  const getRowClassName = (record: IInventorySummary) => {
    if (record.currentStock <= 0) return 'bg-destructive/5';
    if (record.currentStock < record.warningThreshold) return 'bg-warning/5';
    return '';
  };

  // 打开调整库存弹窗
  const openAdjustDialog = (product: IInventorySummary, type: 'increase' | 'decrease') => {
    setSelectedProduct(product);
    setAdjustType(type);
    setAdjustQuantity('');
    setAdjustWeight('');
    setAdjustReason('');
    setAdjustRemark('');
    setAdjustDialogOpen(true);
  };

  // 打开库存记录弹窗
  const openRecordDialog = (product: IInventorySummary) => {
    setSelectedProduct(product);
    setRecordDialogOpen(true);
  };

  // 提交库存调整
  const handleAdjustSubmit = () => {
    if (!selectedProduct) return;

    const quantity = parseInt(adjustQuantity) || 0;
    const weight = parseFloat(adjustWeight) || 0;

    // 验证至少输入一个值
    if (quantity <= 0 && weight <= 0) {
      toast.error('请输入数量或重量');
      return;
    }

    // 按计价单位区分主次校验
    if (adjustType === 'decrease') {
      if (selectedProduct.unit === '件') {
        // 按件计价：数量必须充足
        if (quantity > selectedProduct.currentStock) {
          toast.error(`数量库存不足，当前可用 ${selectedProduct.currentStock} 件`);
          return;
        }
        // 重量超限仅警告，不阻止
        if (weight > 0 && weight > selectedProduct.currentStockWeight) {
          toast.warning(`注意：重量将超出库存重量（可用 ${selectedProduct.currentStockWeight.toFixed(2)} kg）`);
        }
      } else {
        // 按kg计价：重量必须充足
        if (weight > selectedProduct.currentStockWeight) {
          toast.error(`重量库存不足，当前可用 ${selectedProduct.currentStockWeight.toFixed(2)} kg`);
          return;
        }
        // 数量超限仅警告，不阻止
        if (quantity > 0 && quantity > selectedProduct.currentStock) {
          toast.warning(`注意：数量将超出库存数量（可用 ${selectedProduct.currentStock} 件）`);
        }
      }
    }

    const reasonLabel = adjustReasonOptions.find(r => r.value === adjustReason)?.label || '';
    const remarkText = [reasonLabel, adjustRemark].filter(Boolean).join(' - ');

    if (adjustType === 'increase') {
      increaseStock({
        productId: selectedProduct.productId,
        quantity: quantity || 1, // 如果没输数量，默认1件
        weight: weight || undefined,
        changeType: 'manual_increase',
        operator: currentUser,
        remark: remarkText || '手动增加库存',
      });
      toast.success(`已成功增加 ${selectedProduct.productName} 库存`);
    } else {
      decreaseStock({
        productId: selectedProduct.productId,
        quantity: quantity || 1,
        weight: weight || undefined,
        changeType: 'manual_decrease',
        operator: currentUser,
        remark: remarkText || '手动减少库存',
      });
      toast.success(`已成功减少 ${selectedProduct.productName} 库存`);
    }

    setAdjustDialogOpen(false);
  };

  // 获取产品的库存记录
  const getProductRecords = (productId: string) => {
    return inventoryRecords.filter(r => r.productId === productId).slice(0, 20);
  };

  // 库存列表列定义 - 简化列数
  const inventoryColumns: TableProps<IInventorySummary>['columns'] = [
    { 
      title: '产品编号', 
      dataIndex: 'productCode', 
      key: 'productCode', 
      width: 100,
      fixed: 'left',
    },
    { 
      title: '产品名称', 
      dataIndex: 'productName', 
      key: 'productName', 
      width: 140,
      fixed: 'left',
    },
    { 
      title: '材质/工艺', 
      key: 'materialProcess',
      width: 110,
      render: (_, record) => (
        <div className="text-sm">
          <div className="font-medium">{record.material}</div>
          <div className="text-muted-foreground text-xs truncate">{record.process || '-'}</div>
        </div>
      ),
    },
    { 
      title: '工件编号', 
      dataIndex: 'workpieceNo', 
      key: 'workpieceNo', 
      width: 110,
      render: (v) => v || '-',
    },
    {
      title: '计价单位',
      key: 'unit',
      width: 70,
      align: 'center',
      render: (_, record) => (
        <Badge variant="outline" className="font-medium">{record.unit}</Badge>
      ),
    },
    {
      title: '当前库存',
      key: 'currentStock',
      width: 120,
      render: (_, record) => {
        const isWeightBased = record.unit === 'kg';
        return (
          <div className="text-sm">
            <div className="font-semibold text-primary">
              {isWeightBased 
                ? `${record.currentStockWeight.toFixed(2)} kg`
                : `${record.currentStock} 件`
              }
            </div>
            {!isWeightBased && record.currentStockWeight > 0 && (
              <div className="text-muted-foreground text-xs">
                {record.currentStockWeight.toFixed(2)} kg
              </div>
            )}
          </div>
        );
      },
    },
    { 
      title: '客户', 
      key: 'customer',
      width: 110,
      render: (_, record) => (
        <div className="text-sm">
          <div className="truncate" title={record.customerName}>{record.customerName}</div>
          <div className="text-muted-foreground text-xs">{record.customerCode}</div>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      align: 'center',
      render: (_, record) => getStatusBadge(record),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-success"
            onClick={() => openAdjustDialog(record, 'increase')}
            title="入库"
          >
            <ArrowUpIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive"
            onClick={() => openAdjustDialog(record, 'decrease')}
            disabled={record.currentStock <= 0}
            title="出库"
          >
            <ArrowDownIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => openRecordDialog(record)}
            title="变动记录"
          >
            <HistoryIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // 展开行内容 - 显示详细信息
  const expandedRowRender = (record: IInventorySummary) => (
    <div className="bg-muted/30 p-4 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">技术要求</p>
          <p className="text-sm">{record.techRequirement || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">单价</p>
          <p className="text-sm font-medium">¥{record.unitPrice?.toFixed(2) || '0.00'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">累计入库（件）</p>
          <p className="text-sm">{record.inboundQuantity} 件</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">累计入库（kg）</p>
          <p className="text-sm">{record.inboundWeight.toFixed(2)} kg</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">预警阈值</p>
          <p className="text-sm">{record.warningThreshold} {record.unit === 'kg' ? 'kg' : '件'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">当前库存（件）</p>
          <p className="text-sm">{record.currentStock} 件</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">当前库存（kg）</p>
          <p className="text-sm">{record.currentStockWeight.toFixed(2)} kg</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">库存价值</p>
          <p className="text-sm font-medium">
            ¥{((record.unit || '件') === '件' 
              ? record.currentStock * (record.unitPrice || 0)
              : record.currentStockWeight * (record.unitPrice || 0)
            ).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );

  // 库存记录列定义
  const recordColumns: TableProps<IInventoryRecord>['columns'] = [
    {
      title: '变动类型',
      key: 'changeType',
      width: 180,
      render: (_, record) => getChangeTypeBadge(record.changeType, record)
    },
    {
      title: '入库数量变化',
      key: 'quantityChange',
      width: 110,
      render: (_, record) => (
        <span className={record.quantityChange > 0 ? 'text-success font-medium' : record.quantityChange < 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
          {record.quantityChange > 0 ? '+' : ''}{record.quantityChange} 件
        </span>
      )
    },
    {
      title: '入库重量变化',
      key: 'weightChange',
      width: 110,
      render: (_, record) => (
        <span className={record.weightChange > 0 ? 'text-success font-medium' : record.weightChange < 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
          {record.weightChange > 0 ? '+' : ''}{record.weightChange} kg
        </span>
      )
    },
    {
      title: '库存数量变化',
      key: 'stockChange',
      width: 130,
      render: (_, record) => (
        <span className="text-muted-foreground">
          {record.beforeStock} 件 → <span className="font-medium text-foreground">{record.afterStock} 件</span>
        </span>
      )
    },
    {
      title: '库存重量变化',
      key: 'stockWeightChange',
      width: 130,
      render: (_, record) => (
        <span className="text-muted-foreground">
          {record.beforeStockWeight.toFixed(2)} kg → <span className="font-medium text-foreground">{record.afterStockWeight.toFixed(2)} kg</span>
        </span>
      )
    },
    { title: '关联单号', dataIndex: 'referenceNo', key: 'referenceNo', width: 140, render: (v) => v || '-' },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 90 },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v) => new Date(v).toLocaleString('zh-CN')
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <section className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">库存管理</h1>
            <p className="text-muted-foreground mt-1">实时管理库存，支持手动调整及查看库存变动记录</p>
          </div>
        </div>
      </section>

      {/* 统计卡片 */}
      <section className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">库存品种</p>
                <p className="text-2xl font-bold font-tabular tracking-tight">{stats.total}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <PackageIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Card>
        
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">库存总量</p>
                <p className="text-2xl font-bold font-tabular tracking-tight">{stats.totalStock.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/25">
                <RefreshCcwIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Card>
        
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">正常 / 预警</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-emerald-600 font-tabular tracking-tight">{stats.normal}</span>
                  <span className="text-muted-foreground text-sm">/</span>
                  <span className="text-lg font-semibold text-amber-600 font-tabular">{stats.warning}</span>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Card>
        
        <Card className={cn(
          "group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300",
          stats.danger > 0 && "border-red-200"
        )}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">缺货预警</p>
                <p className={cn(
                  "text-2xl font-bold font-tabular tracking-tight",
                  stats.danger > 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {stats.danger}
                </p>
              </div>
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl shadow-lg",
                stats.danger > 0 
                  ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25" 
                  : "bg-gradient-to-br from-slate-400 to-slate-500"
              )}>
                <AlertTriangleIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Card>
      </section>

      {/* 主内容区 */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="inventory" className="gap-1">
            <PackageIcon className="w-4 h-4" />
            库存列表
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-1">
            <HistoryIcon className="w-4 h-4" />
            变动记录
            {inventoryRecords.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{inventoryRecords.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 库存列表 */}
        <TabsContent value="inventory" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FilterIcon className="w-4 h-4" />
                库存查询
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => exportToExcel(filteredInventory, getInventoryExportColumns(), '库存管理')}>
                <Download className="w-4 h-4 mr-1" />
                Excel导出
              </Button>
            </div>
            </CardHeader>
            <CardContent>
              {/* 筛选器组 - 使用Filter组件 */}
              <FilterGroup gap="sm" className="mb-4 flex-wrap">
                {/* 关键词筛选 */}
                <Filter value={searchKeyword} onValueChange={setSearchKeyword}>
                  <FilterTrigger label="关键词" closable />
                  <FilterContent>
                    <FilterTextContent placeholder="搜索产品名称、工件编号..." />
                  </FilterContent>
                </Filter>

                {/* 客户筛选 */}
                <Filter value={customerFilter} onValueChange={setCustomerFilter}>
                  <FilterTrigger label="客户" closable />
                  <FilterContent>
                    <FilterSelectContent options={customerOptions} searchable />
                  </FilterContent>
                </Filter>

                {/* 材质筛选 */}
                <Filter value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <FilterTrigger label="材质" closable />
                  <FilterContent>
                    <FilterSelectContent options={materialOptions} searchable />
                  </FilterContent>
                </Filter>

                {/* 状态筛选 */}
                <Filter value={selectedStatus} onValueChange={setSelectedStatus}>
                  <FilterTrigger label="状态" closable />
                  <FilterContent>
                    <FilterSelectContent options={statusOptions} />
                  </FilterContent>
                </Filter>

                {/* 库存数量范围筛选 */}
                <Filter value={stockRange} onValueChange={setStockRange}>
                  <FilterTrigger label="库存数量" closable />
                  <FilterContent>
                    <FilterNumberContent min={0} unit="件" />
                  </FilterContent>
                </Filter>

                {/* 重置按钮 */}
                {(searchKeyword || customerFilter || selectedMaterial || selectedStatus || stockRange) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchKeyword(undefined);
                      setCustomerFilter(undefined);
                      setSelectedMaterial(undefined);
                      setSelectedStatus(undefined);
                      setStockRange(undefined);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    重置
                  </Button>
                )}
              </FilterGroup>

                <Table
                  columns={inventoryColumns}
                  dataSource={paginatedInventory}
                  rowKey="productId"
                  expandable={{
                    expandedRowRender,
                    expandRowByClick: true,
                    rowExpandable: () => true,
                  }}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: filteredInventory.length,
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      if (size) setPageSize(size);
                    },
                  }}
                  scroll={{ x: 800 }}
                  size="small"
                  rowClassName={getRowClassName}
                />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 变动记录 */}
        <TabsContent value="records" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <HistoryIcon className="w-4 h-4" />
                库存变动记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryRecords.length === 0 ? (
                <Empty className="py-12">
                  <EmptyDescription>暂无变动记录</EmptyDescription>
                </Empty>
              ) : (
                <Table
                  columns={recordColumns}
                  dataSource={inventoryRecords.slice(0, 50)}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                  scroll={{ x: 900 }}
                  size="small"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 库存调整弹窗 */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustType === 'increase' ? (
                <>
                  <TrendingUpIcon className="w-5 h-5 text-success" />
                  增加库存
                </>
              ) : (
                <>
                  <TrendingDownIcon className="w-5 h-5 text-destructive" />
                  减少库存
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">产品</p>
                <p className="font-medium">{selectedProduct.productName} ({selectedProduct.workpieceNo})</p>
                <div className="flex gap-4 mt-1">
                  <p className="text-sm text-muted-foreground">
                    当前库存(件): <span className="font-medium text-foreground">{selectedProduct.currentStock} 件</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    当前库存(kg): <span className="font-medium text-foreground">{selectedProduct.currentStockWeight.toFixed(2)} kg</span>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">计价单位: <span className="font-medium text-primary">{selectedProduct.unit}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>调整数量 (件)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="请输入数量"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                  />
                  {adjustType === 'decrease' && (
                    <p className="text-xs text-muted-foreground">可用: {selectedProduct.currentStock} 件</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>调整重量 (kg)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="请输入重量"
                    value={adjustWeight}
                    onChange={(e) => setAdjustWeight(e.target.value)}
                  />
                  {adjustType === 'decrease' && (
                    <p className="text-xs text-muted-foreground">可用: {selectedProduct.currentStockWeight.toFixed(2)} kg</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>调整原因</Label>
                <Select value={adjustReason} onValueChange={setAdjustReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择调整原因" />
                  </SelectTrigger>
                  <SelectContent>
                    {adjustReasonOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>备注</Label>
                <Input
                  placeholder="请输入备注（选填）"
                  value={adjustRemark}
                  onChange={(e) => setAdjustRemark(e.target.value)}
                />
              </div>

              {/* 调整后库存预览 */}
              {(adjustQuantity || adjustWeight) && (
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">调整后库存预览</p>
                  <div className="flex gap-4 text-sm">
                    <span>
                      数量: {selectedProduct.currentStock} → {' '}
                      <span className={adjustType === 'increase' ? 'text-success font-medium' : 'text-destructive font-medium'}>
                        {adjustType === 'increase'
                          ? selectedProduct.currentStock + (parseInt(adjustQuantity) || 0)
                          : Math.max(0, selectedProduct.currentStock - (parseInt(adjustQuantity) || 0))
                        } 件
                      </span>
                    </span>
                    <span>
                      重量: {selectedProduct.currentStockWeight.toFixed(2)} → {' '}
                      <span className={adjustType === 'increase' ? 'text-success font-medium' : 'text-destructive font-medium'}>
                        {adjustType === 'increase'
                          ? (selectedProduct.currentStockWeight + (parseFloat(adjustWeight) || 0)).toFixed(2)
                          : Math.max(0, selectedProduct.currentStockWeight - (parseFloat(adjustWeight) || 0)).toFixed(2)
                        } kg
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>取消</Button>
            <Button
              onClick={handleAdjustSubmit}
              className={adjustType === 'increase' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}
            >
              确认{adjustType === 'increase' ? '增加' : '减少'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 库存记录弹窗 */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" />
              {selectedProduct?.productName} - 库存变动记录
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto py-4">
            {selectedProduct && getProductRecords(selectedProduct.productId).length === 0 ? (
              <Empty className="py-8">
                <EmptyDescription>该产品暂无变动记录</EmptyDescription>
              </Empty>
            ) : (
              <Table
                columns={recordColumns}
                dataSource={selectedProduct ? getProductRecords(selectedProduct.productId) : []}
                rowKey="id"
                pagination={false}
                size="small"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
