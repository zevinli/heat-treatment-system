import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { FileDown, Printer, FileText, Plus, Trash2, Edit, CheckCircle, XCircle, Search, Eye, Building2, User, Phone, ArrowLeft, Calendar, Download, X } from 'lucide-react';
import { Table } from '@lark-apaas/client-toolkit/antd-table';
import { toast } from 'sonner';
import { useData, IOutboundOrder, IReconciliation, ReconciliationStatus, IOutboundDetail, IReconciliationDetail, IOperationLog } from '@/data/DataContext';
import { ICustomer } from '@/data/mockData';
import { exportToExcel, getReconciliationExportColumns } from '@/utils/excelExport';
import { getReconciliationHistory } from '@/api';
import { smartPrint, exportElementToPdf } from '@/lib/print-service';
import {
  Filter,
  FilterContent,
  FilterTextContent,
  FilterTrigger,
  FilterGroup,
  FilterSelectContent,
} from '@/components/ui/filter';

// 状态映射 - 使用语义化颜色类，适配深色模式
const statusMap: Record<ReconciliationStatus | 'partial_paid' | 'cancelled' | 'voided', { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-muted text-muted-foreground border border-border' },
  confirmed: { label: '已确认', color: 'bg-primary/10 text-primary border border-primary/20' },
  audited: { label: '已审核', color: 'bg-success/10 text-success border border-success/20' },
  invoiced: { label: '已开票', color: 'bg-info/10 text-info border border-info/20' },
  partial_paid: { label: '部分回款', color: 'bg-warning/10 text-warning border border-warning/20' },
  paid: { label: '已回款', color: 'bg-success/20 text-success border border-success/30' },
  cancelled: { label: '已取消', color: 'bg-destructive/10 text-destructive border border-destructive/20' },
  voided: { label: '已作废', color: 'bg-stone-100 text-stone-500 border border-stone-200 line-through' },
};

// 注意：对账单号生成已移至后端，前端不再生成
const generateReconciliationNo = () => {
  return ''; // 临时占位，实际由后端生成
};

// 统一金额格式化函数
const formatMoney = (amount: number, options?: { showUnit?: boolean; decimals?: number; convertLarge?: boolean }): string => {
  const { showUnit = true, decimals = 2, convertLarge = true } = options || {};
  
  let value = amount;
  let unit = '';
  
  if (convertLarge) {
    if (Math.abs(amount) >= 100000000) {
      value = amount / 100000000;
      unit = '亿';
    } else if (Math.abs(amount) >= 10000) {
      value = amount / 10000;
      unit = '万';
    }
  }
  
  const formatted = value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return showUnit ? `¥${formatted}${unit}` : formatted;
};

// 金额显示组件
const MoneyDisplay: React.FC<{
  amount: number;
  size?: 'sm' | 'default' | 'lg';
  highlight?: boolean;
  className?: string;
}> = ({ amount, size = 'default', highlight, className }) => {
  const sizeClasses = {
    sm: 'text-sm',
    default: 'text-base',
    lg: 'text-lg font-semibold',
  };
  
  const isNegative = amount < 0;
  
  return (
    <span className={`
      ${sizeClasses[size]}
      ${isNegative ? 'text-destructive' : highlight ? 'text-success' : 'text-foreground'}
      font-tabular ${className || ''}
    `}>
      {formatMoney(amount)}
    </span>
  );
};

const ReconciliationPage: React.FC = () => {
  const {
    customers,
    outboundOrders,
    reconciliations,
    addReconciliation,
    updateReconciliation,
    deleteReconciliation,
    auditReconciliation,
    confirmReconciliation,
    unauditReconciliation,
    recordInvoice,
    recordReceipt,
    getPendingReconciliationOrders,
    updateOutboundOrder,
    cancelOutboundOrder,
    refreshReconciliations,
    refreshOutboundOrders,
  } = useData();

  // 防御性处理：在 useData 解构后添加
  // reconciliations 和 outboundOrders 已在 DataContext 中确保为数组

  const [activeTab, setActiveTab] = useState('reconciliation');

  // 搜索和筛选
  const [searchText, setSearchText] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [monthFilter, setMonthFilter] = useState<string | undefined>();

  // 选中的对账单（用于编辑、删除、审核）
  const [selectedReconciliation, setSelectedReconciliation] = useState<IReconciliation | null>(null);

  // 弹窗状态
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOutboundDialogOpen, setDeleteOutboundDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  
  // 打印字段值
  const [printCompanyName, setPrintCompanyName] = useState('大连文火热处理');
  const [printCreator, setPrintCreator] = useState('');
  const [printCustomerConfirm, setPrintCustomerConfirm] = useState('');
  
  // 是否显示打印字段
  const [showCompanyName, setShowCompanyName] = useState(true);
  const [showCreator, setShowCreator] = useState(true);
  const [showCustomerConfirm, setShowCustomerConfirm] = useState(true);

  // 选中的出库单（用于删除）
  const [selectedOutboundOrder, setSelectedOutboundOrder] = useState<IOutboundOrder | null>(null);
  
  // 出库单详情弹窗状态
  const [viewOutboundDialogOpen, setViewOutboundDialogOpen] = useState(false);

  // 新增对账单表单
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedOutboundIds, setSelectedOutboundIds] = useState<string[]>([]);
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [otherAmount, setOtherAmount] = useState<number>(0);
  const [compensationAmount, setCompensationAmount] = useState<number>(0);

  // 新增对账单步骤：1-选择客户 2-选择出库单
  const [addStep, setAddStep] = useState<1 | 2>(1);

  // 客户搜索
  const [customerSearchText, setCustomerSearchText] = useState('');

  // 日期筛选
  const [outboundStartDate, setOutboundStartDate] = useState<string>('');
  const [outboundEndDate, setOutboundEndDate] = useState<string>('');
  const [inboundStartDate, setInboundStartDate] = useState<string>('');
  const [inboundEndDate, setInboundEndDate] = useState<string>('');

  // 开票/回款表单
  const [invoiceAmountInput, setInvoiceAmountInput] = useState<string>('');
  const [receiptAmountInput, setReceiptAmountInput] = useState<string>('');

  // 操作校验弹窗
  const [actionCheckDialogOpen, setActionCheckDialogOpen] = useState(false);
  const [actionCheckType, setActionCheckType] = useState<'delete' | 'unaudit'>('delete');
  const [actionCheckResult, setActionCheckResult] = useState<{ allowed: boolean; reason?: string; invoiceCount?: number; receiptCount?: number } | null>(null);

  // 反审核确认弹窗
  const [unauditConfirmDialogOpen, setUnauditConfirmDialogOpen] = useState(false);
  const [unauditReason, setUnauditReason] = useState('');
  const [unauditTargetRecord, setUnauditTargetRecord] = useState<IReconciliation | null>(null);

  // 历史版本弹窗
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [reconciliationHistory, setReconciliationHistory] = useState<{
    reconciliation: IReconciliation;
    versions: Array<{
      version: number;
      isActive: boolean;
      details: IReconciliationDetail[];
      updateReason?: string;
      updatedBy?: string;
      updatedAt?: string;
    }>;
    operationLogs: IOperationLog[];
  } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [compareVersion, setCompareVersion] = useState<number | null>(null);

  // 查看对账单历史版本
  const viewHistory = async (reconciliation: IReconciliation) => {
    try {
      const history = await getReconciliationHistory(reconciliation.id);
      setReconciliationHistory(history);
      setSelectedVersion(null);
      setCompareVersion(null);
      setHistoryDialogOpen(true);
    } catch (error) {
      toast.error('获取历史版本失败');
    }
  };

  // 金额计算明细弹窗
  const [calculationDialogOpen, setCalculationDialogOpen] = useState(false);
  const [calculationDetail, setCalculationDetail] = useState<{
    baseAmount: number;
    deductionAmount: number;
    otherAmount: number;
    compensationAmount: number;
    finalAmount: number;
    invoiceAmount: number;
    uninvoiceAmount: number;
    receiptAmount: number;
    unreceivedAmount: number;
  } | null>(null);
  const [auditorName, setAuditorName] = useState<string>('');

  // 过滤后的对账单
  const filteredReconciliations = useMemo(() => {
    return reconciliations.filter(r => {
      if (searchText && !r.customerName.includes(searchText) && !r.reconciliationNo.includes(searchText)) {
        return false;
      }
      // 修复：只有当 statusFilter 有值且不为 'all' 时才进行状态筛选
      if (statusFilter && statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }
      // 修复：只有当 monthFilter 有值且不为 'all' 时才进行月份筛选
      if (monthFilter && monthFilter !== 'all' && r.month !== monthFilter) {
        return false;
      }
      return true;
    });
  }, [reconciliations, searchText, statusFilter, monthFilter]);

  // 获取待对账的出库单
  const [pendingOrders, setPendingOrders] = useState<IOutboundOrder[]>([]);
  
  useEffect(() => {
    if (selectedCustomerId) {
      getPendingReconciliationOrders(selectedCustomerId).then(orders => {
        setPendingOrders(orders);
      });
    } else {
      setPendingOrders([]);
    }
  }, [selectedCustomerId, getPendingReconciliationOrders, outboundOrders]);

  // 筛选后的客户列表
  const filteredCustomers = useMemo(() => {
    if (!customerSearchText) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(customerSearchText.toLowerCase()) ||
      c.code.toLowerCase().includes(customerSearchText.toLowerCase())
    );
  }, [customers, customerSearchText]);

  // 筛选后的出库单（按日期筛选）
  const filteredPendingOrders = useMemo(() => {
    return pendingOrders.filter(order => {
      // 出库日期筛选
      if (outboundStartDate && order.outboundDate < outboundStartDate) return false;
      if (outboundEndDate && order.outboundDate > outboundEndDate) return false;

      // 入库日期筛选（检查明细中的入库日期）
      if (inboundStartDate || inboundEndDate) {
        const hasMatchingInboundDate = order.details.some(d => {
          if (inboundStartDate && d.inboundDate < inboundStartDate) return false;
          if (inboundEndDate && d.inboundDate > inboundEndDate) return false;
          return true;
        });
        if (!hasMatchingInboundDate) return false;
      }

      return true;
    });
  }, [pendingOrders, outboundStartDate, outboundEndDate, inboundStartDate, inboundEndDate]);

  // 处理客户选择
  const handleSelectCustomer = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setSelectedCustomerId(customer.id);
    setAddStep(2);
  };

  // 返回客户选择
  const handleBackToCustomer = () => {
    setAddStep(1);
    setSelectedCustomer(null);
    setSelectedCustomerId('');
    setSelectedOutboundIds([]);
    setOutboundStartDate('');
    setOutboundEndDate('');
    setInboundStartDate('');
    setInboundEndDate('');
  };

  // 计算对账单金额
  const calculateAmounts = () => {
    const selectedOrders = filteredPendingOrders.filter(o => selectedOutboundIds.includes(o.id));
    const totalAmount = selectedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const finalAmount = totalAmount - deductionAmount + otherAmount + compensationAmount;
    return { totalAmount, finalAmount };
  };

  // 新增对账单
  const handleAddReconciliation = async () => {
    if (!selectedCustomerId || !selectedCustomer) {
      toast.error('请选择客户');
      return;
    }
    if (selectedOutboundIds.length === 0) {
      toast.error('请至少选择一个出库单');
      return;
    }

    const { totalAmount, finalAmount } = calculateAmounts();

    // 构建对账明细
    const details = filteredPendingOrders
      .filter(o => selectedOutboundIds.includes(o.id))
      .flatMap(o =>
        o.details?.map(d => ({
          id: `${o.id}-${d.id}`,
          outboundNo: o.outboundNo,
          outboundDate: o.outboundDate,
          productName: d.productName,
          workpieceNo: d.workpieceNo,
          material: d.material,
          process: d.process,
          quantity: d.quantity,
          weight: d.weight,
          unitPrice: d.unitPrice,
          amount: d.amount,
          unit: d.unit,
        }))
      );

    const customer = selectedCustomer;

    // 注意：后端创建对账单时状态固定为 'confirmed'
    const newReconciliation = await addReconciliation({
      reconciliationNo: generateReconciliationNo(),
      customerId: customer.id,
      customerName: customer.name,
      customerCode: customer.code,
      month: selectedMonth,
      status: 'confirmed', // 与后端保持一致
      totalAmount,
      deductionAmount,
      otherAmount,
      compensationAmount,
      finalAmount,
      invoiceAmount: 0,
      uninvoiceAmount: finalAmount,
      receiptAmount: 0,
      unreceivedAmount: finalAmount,
      outboundOrderIds: selectedOutboundIds,
      details,
    } as any);

    toast.success('对账单创建成功');
    setAddDialogOpen(false);
    resetAddForm();

    // 打开打印预览
    setSelectedReconciliation(newReconciliation);
    setPrintDialogOpen(true);
  };

  // 重置新增表单
  const resetAddForm = () => {
    setSelectedCustomerId('');
    setSelectedCustomer(null);
    setSelectedOutboundIds([]);
    setDeductionAmount(0);
    setOtherAmount(0);
    setCompensationAmount(0);
    setAddStep(1);
    setCustomerSearchText('');
    setOutboundStartDate('');
    setOutboundEndDate('');
    setInboundStartDate('');
    setInboundEndDate('');
  };

  // 编辑对账单
  const handleEditReconciliation = () => {
    if (!selectedReconciliation) return;

    updateReconciliation(selectedReconciliation.id, {
      deductionAmount,
      otherAmount,
      compensationAmount,
      finalAmount: selectedReconciliation.totalAmount - deductionAmount + otherAmount + compensationAmount,
      unreceivedAmount: selectedReconciliation.totalAmount - deductionAmount + otherAmount + compensationAmount - selectedReconciliation.receiptAmount,
    });

    toast.success('对账单更新成功');
    setEditDialogOpen(false);
    setSelectedReconciliation(null);
  };

  // 检查对账单是否可以删除
  const checkDeleteAllowed = (reconciliation: IReconciliation) => {
    // 只有 draft、confirmed 和 voided 状态可以删除
    if (!['draft', 'confirmed', 'voided'].includes(reconciliation.status)) {
      return {
        allowed: false,
        reason: `当前状态[${reconciliation.status}]不允许删除，仅草稿、已确认和已作废状态可删除`,
      };
    }

    const hasInvoices = reconciliation.invoiceAmount > 0;
    const hasReceipts = reconciliation.receiptAmount > 0;

    if (hasInvoices || hasReceipts) {
      return {
        allowed: false,
        reason: `该对账单已有${hasInvoices ? '开票记录' : ''}${hasInvoices && hasReceipts ? '和' : ''}${hasReceipts ? '回款记录' : ''}，不能删除`,
        invoiceCount: hasInvoices ? 1 : 0,
        receiptCount: hasReceipts ? 1 : 0,
      };
    }

    return { allowed: true };
  };

  // 检查对账单是否可以反审核
  const checkUnauditAllowed = (reconciliation: IReconciliation) => {
    // 只有已审核状态才能反审核
    if (reconciliation.status !== 'audited') {
      return {
        allowed: false,
        reason: `当前状态为"${statusMap[reconciliation.status]?.label || reconciliation.status}"，仅已审核状态可以反审核`,
      };
    }

    // 已有开票或回款记录不能反审核
    if (reconciliation.invoiceAmount > 0 || reconciliation.receiptAmount > 0) {
      return {
        allowed: false,
        reason: '已有开票或回款记录的对账单不能反审核',
      };
    }

    return { allowed: true };
  };

  // 检查对账单是否可以审核
  const checkAuditAllowed = (reconciliation: IReconciliation) => {
    // 只有已确认状态才能审核
    if (reconciliation.status !== 'confirmed') {
      return {
        allowed: false,
        reason: `当前状态为"${statusMap[reconciliation.status]?.label || reconciliation.status}"，仅已确认状态可以审核`,
      };
    }
    return { allowed: true };
  };

  // 删除对账单
  const handleDeleteReconciliation = async () => {
    if (!selectedReconciliation) return;

    // 操作前校验
    const checkResult = checkDeleteAllowed(selectedReconciliation);
    if (!checkResult.allowed) {
      setActionCheckType('delete');
      setActionCheckResult(checkResult);
      setActionCheckDialogOpen(true);
      setDeleteDialogOpen(false);
      return;
    }

    // 从对账单明细中提取出库单号，然后找到对应的出库单ID
    const outboundNos = selectedReconciliation.details?.map(d => d.outboundNo).filter(Boolean) || [];
    const relatedOrderIds = outboundOrders
      .filter(o => outboundNos.includes(o.outboundNo))
      .map(o => o.id);

    try {
      // 传入关联的出库单ID，删除后回退出库单状态到待对账
      await deleteReconciliation(selectedReconciliation.id, relatedOrderIds);
      setDeleteDialogOpen(false);
      setSelectedReconciliation(null);
      // 强制刷新对账单列表和出库单列表，确保状态同步
      await refreshReconciliations();
      await refreshOutboundOrders();
    } catch (error) {
      // 错误已在 DataContext 中处理
    }
  };

  // 撤销出库单
  const handleDeleteOutboundOrder = () => {
    if (!selectedOutboundOrder) return;

    cancelOutboundOrder(selectedOutboundOrder.id, '对账页面撤销');
    setDeleteOutboundDialogOpen(false);
    setSelectedOutboundOrder(null);
  };

  // 审核对账单
  const handleAudit = async () => {
    if (!selectedReconciliation || !auditorName.trim()) {
      toast.error('请输入审核人姓名');
      return;
    }

    // 操作前校验
    const checkResult = checkAuditAllowed(selectedReconciliation);
    if (!checkResult.allowed) {
      toast.error(checkResult.reason || '该对账单不能审核');
      return;
    }

    try {
      await auditReconciliation(selectedReconciliation.id, auditorName);
      toast.success('审核成功');
      setAuditDialogOpen(false);
      setAuditorName('');
      setSelectedReconciliation(null);
      // 强制刷新对账单列表
      await refreshReconciliations();
    } catch (error) {
      // 错误已在 DataContext 中处理
    }
  };

  // 反审核对账单 - 打开确认弹窗
  const handleUnaudit = async (record?: IReconciliation) => {
    const targetRecord = record || selectedReconciliation;
    if (!targetRecord) return;

    // 操作前校验
    const checkResult = checkUnauditAllowed(targetRecord);
    if (!checkResult.allowed) {
      setActionCheckType('unaudit');
      setActionCheckResult(checkResult);
      setActionCheckDialogOpen(true);
      return;
    }

    // 打开反审核确认弹窗，让用户填写原因
    setUnauditTargetRecord(targetRecord);
    setUnauditReason('');
    setUnauditConfirmDialogOpen(true);
  };

  // 确认反审核执行
  const confirmUnaudit = async () => {
    if (!unauditTargetRecord) return;

    // 校验原因
    if (!unauditReason.trim() || unauditReason.trim().length < 10) {
      toast.error('撤销原因不能为空且至少10个字');
      return;
    }

    try {
      await unauditReconciliation(unauditTargetRecord.id, unauditReason.trim());
      toast.success('反审核成功');
      setUnauditConfirmDialogOpen(false);
      setUnauditReason('');
      setUnauditTargetRecord(null);
      if (unauditTargetRecord.id === selectedReconciliation?.id) {
        setSelectedReconciliation(null);
      }
      // 强制刷新对账单列表和出库单列表，确保状态同步
      await refreshReconciliations();
      await refreshOutboundOrders();
    } catch (error) {
      // 错误已在 DataContext 中处理
    }
  };

  // 查看金额计算明细
  const viewCalculationDetail = (reconciliation: IReconciliation) => {
    setCalculationDetail({
      baseAmount: reconciliation.totalAmount,
      deductionAmount: reconciliation.deductionAmount || 0,
      otherAmount: reconciliation.otherAmount || 0,
      compensationAmount: reconciliation.compensationAmount || 0,
      finalAmount: reconciliation.finalAmount,
      invoiceAmount: reconciliation.invoiceAmount || 0,
      uninvoiceAmount: reconciliation.uninvoiceAmount || 0,
      receiptAmount: reconciliation.receiptAmount || 0,
      unreceivedAmount: reconciliation.unreceivedAmount || 0,
    });
    setCalculationDialogOpen(true);
  };

  // 记录开票
  const handleRecordInvoice = async () => {
    if (!selectedReconciliation || !invoiceAmountInput) return;

    const amount = parseFloat(invoiceAmountInput);
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的开票金额');
      return;
    }

    // 检查开票金额是否超过未开票金额
    if (amount > selectedReconciliation.uninvoiceAmount) {
      toast.error(`开票金额不能超过未开票金额 ${selectedReconciliation.uninvoiceAmount.toFixed(2)}`);
      return;
    }

    try {
      await recordInvoice(selectedReconciliation.id, amount);
      setInvoiceDialogOpen(false);
      setInvoiceAmountInput('');
      setSelectedReconciliation(null);
    } catch (error) {
      // 错误已在 DataContext 中处理
    }
  };

  // 记录回款
  const handleRecordReceipt = async () => {
    if (!selectedReconciliation || !receiptAmountInput) return;

    const amount = parseFloat(receiptAmountInput);
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的回款金额');
      return;
    }

    // 检查回款金额是否超过未回款金额
    if (amount > selectedReconciliation.unreceivedAmount) {
      toast.error(`回款金额不能超过未回款金额 ${selectedReconciliation.unreceivedAmount.toFixed(2)}`);
      return;
    }

    try {
      await recordReceipt(selectedReconciliation.id, amount);
      setReceiptDialogOpen(false);
      setReceiptAmountInput('');
      setSelectedReconciliation(null);
    } catch (error) {
      // 错误已在 DataContext 中处理
    }
  };

  // 打开编辑弹窗
  const openEditDialog = (reconciliation: IReconciliation) => {
    setSelectedReconciliation(reconciliation);
    setDeductionAmount(reconciliation.deductionAmount);
    setOtherAmount(reconciliation.otherAmount);
    setCompensationAmount(reconciliation.compensationAmount);
    setEditDialogOpen(true);
  };

  // 打开查看弹窗
  const openViewDialog = (reconciliation: IReconciliation) => {
    setSelectedReconciliation(reconciliation);
    setViewDialogOpen(true);
  };

  // 表格列定义 - 重新设计布局，确保客户名称显示完整
  const reconciliationColumns = [
    {
      title: '对账单编号',
      dataIndex: 'reconciliationNo',
      key: 'reconciliationNo',
      width: 140,
      fixed: 'left' as const,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 180,
      fixed: 'left' as const,
      render: (v: string) => <span className="font-medium text-foreground">{v}</span>,
    },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center' as const,
      render: (status: ReconciliationStatus) => (
        <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${statusMap[status].color}`}>
          {statusMap[status].label}
        </span>
      ),
    },
    {
      title: '对账金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 110,
      align: 'right' as const,
      render: (v: number) => <MoneyDisplay amount={v} size="sm" />,
    },
    {
      title: '最终金额',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 110,
      align: 'right' as const,
      render: (v: number) => <MoneyDisplay amount={v} size="sm" highlight />,
    },
    {
      title: '回款金额',
      dataIndex: 'receiptAmount',
      key: 'receiptAmount',
      width: 110,
      align: 'right' as const,
      render: (v: number) => <MoneyDisplay amount={v} size="sm" highlight />,
    },
    {
      title: '未回款',
      dataIndex: 'unreceivedAmount',
      key: 'unreceivedAmount',
      width: 100,
      align: 'right' as const,
      render: (v: number) => (
        <MoneyDisplay amount={v} size="sm" className={v > 0 ? 'text-destructive' : ''} />
      ),
    },
    {
      title: '开票金额',
      dataIndex: 'invoiceAmount',
      key: 'invoiceAmount',
      width: 110,
      align: 'right' as const,
      render: (v: number) => <MoneyDisplay amount={v} size="sm" />,
    },
    {
      title: '未开票',
      dataIndex: 'uninvoiceAmount',
      key: 'uninvoiceAmount',
      width: 100,
      align: 'right' as const,
      render: (v: number) => (
        <MoneyDisplay amount={v} size="sm" className={v > 0 ? 'text-warning' : ''} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: IReconciliation) => (
        <div className="flex gap-1 justify-center">
          <Button size="sm" variant="ghost" onClick={() => openViewDialog(record)} title="查看">
            <Eye className="w-4 h-4" />
          </Button>
          {/* 金额明细按钮 */}
          <Button
            size="sm"
            variant="ghost"
            className="text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => viewCalculationDetail(record)}
            title="金额明细"
          >
            <FileText className="w-4 h-4" />
          </Button>
          {/* 审核按钮：仅已确认状态显示 */}
          {record.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              className="text-primary border-primary/30 hover:bg-primary/10 text-xs px-2"
              onClick={async () => {
                try { await confirmReconciliation(record.id); } catch { /* DataContext 已提示 */ }
              }}
              title="确认对账单"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              确认
            </Button>
          )}
          {record.status === 'confirmed' && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50 text-xs px-2"
              onClick={() => { setSelectedReconciliation(record); setAuditDialogOpen(true); }}
              title="审核"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              审核
            </Button>
          )}
          {/* 反审核按钮：仅已审核状态显示 */}
          {record.status === 'audited' && (
            <Button
              size="sm"
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs px-2"
              onClick={() => handleUnaudit(record)}
              title="反审核"
            >
              <XCircle className="w-3 h-3 mr-1" />
              撤回
            </Button>
          )}
          {/* 删除按钮：草稿、已确认和已作废状态可删除 */}
          {(record.status === 'draft' || record.status === 'confirmed' || record.status === 'voided') && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => { setSelectedReconciliation(record); setDeleteDialogOpen(true); }}
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {/* 先开票：只要有未开票金额就显示开票按钮 */}
          {record.uninvoiceAmount > 0 && record.status !== 'draft' && record.status !== 'confirmed' && (
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs px-2"
              onClick={() => { setSelectedReconciliation(record); setInvoiceDialogOpen(true); }}
            >
              开票
            </Button>
          )}
          {/* 后回款：全开票后才能回款（未开票金额为0且还有未回款金额） */}
          {record.uninvoiceAmount === 0 && record.unreceivedAmount > 0 && record.status !== 'draft' && record.status !== 'confirmed' && (
            <Button
              size="sm"
              variant="outline"
              className="text-success border-success/30 hover:bg-success/10 text-xs px-2"
              onClick={() => { setSelectedReconciliation(record); setReceiptDialogOpen(true); }}
            >
              回款
            </Button>
          )}
        </div>
      ),
    },
  ];

  // 打印预览
  const PrintPreview = () => {
    if (!selectedReconciliation) return null;
    return (
      <div id="print-preview-content" style={{ 
        padding: '20px', 
        backgroundColor: 'var(--print-bg, #ffffff)', 
        color: 'var(--print-text, #000000)',
        fontFamily: 'SimSun, Songti SC, serif',
        maxHeight: '270mm',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* 公司名称 - 顶部居中 */}
        {showCompanyName && printCompanyName && (
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', letterSpacing: '2px' }}>{printCompanyName}</h1>
          </div>
        )}

        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px solid #333', paddingBottom: '6px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>对账单</h2>
        </div>

        {/* 单据信息 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
          <div><span style={{ fontWeight: 'bold' }}>对账单号：</span>{selectedReconciliation.reconciliationNo}</div>
          <div><span style={{ fontWeight: 'bold' }}>对账月份：</span>{selectedReconciliation.month}</div>
        </div>

        {/* 客户信息表格 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '8px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #666', padding: '4px', width: '80px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>客户名称</td>
              <td style={{ border: '1px solid #666', padding: '4px' }}>{selectedReconciliation.customerName}</td>
              <td style={{ border: '1px solid #666', padding: '4px', width: '80px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>客户编码</td>
              <td style={{ border: '1px solid #666', padding: '4px', width: '100px' }}>{selectedReconciliation.customerCode}</td>
            </tr>
          </tbody>
        </table>

        {/* 明细表格 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--print-table-header-bg, #f0f0f0)' }}>
              <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '25px' }}>序号</th>
              <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold' }}>出库单号</th>
              <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '80px' }}>出库日期</th>
              <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold' }}>产品名称</th>
              <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '70px' }}>工件编号</th>
              <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '70px' }}>加工工艺</th>
              <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '45px' }}>数量</th>
              <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '55px' }}>重量</th>
              <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '70px' }}>金额</th>
            </tr>
          </thead>
          <tbody>
            {selectedReconciliation.details?.slice(0, 8).map((detail, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #666', padding: '3px' }}>{detail.outboundNo}</td>
                <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>{detail.outboundDate}</td>
                <td style={{ border: '1px solid #666', padding: '3px' }}>{detail.productName}</td>
                <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>{detail.workpieceNo || '-'}</td>
                <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>{detail.process || '-'}</td>
                <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>{detail.quantity}</td>
                <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>{detail.weight?.toFixed(2) || '-'}</td>
                <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>{detail.amount.toFixed(2)}</td>
              </tr>
            ))}
            {(selectedReconciliation.details?.length || 0) > 8 && (
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>...</td>
                <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }} colSpan={8}>共 {selectedReconciliation.details?.length} 条记录</td>
              </tr>
            )}
            <tr style={{ backgroundColor: 'var(--print-table-footer-bg, #f9fafb)', fontWeight: 'bold' }}>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }} colSpan={6}>合计</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>
                {selectedReconciliation.details?.reduce((sum, d) => sum + d.quantity, 0) || 0}
              </td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>
                {(selectedReconciliation.details?.reduce((sum, d) => sum + (d.weight || 0), 0) || 0).toFixed(2)}
              </td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>
                {selectedReconciliation.totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 金额汇总 */}
        <div style={{ marginTop: '10px', border: '1px solid #666', padding: '8px', fontSize: '11px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '4px' }}>
            <div>对账金额：¥{selectedReconciliation.totalAmount.toFixed(2)}</div>
            <div>扣款金额：¥{selectedReconciliation.deductionAmount.toFixed(2)}</div>
            <div>其他金额：¥{selectedReconciliation.otherAmount.toFixed(2)}</div>
            <div>赔偿金额：¥{selectedReconciliation.compensationAmount.toFixed(2)}</div>
            <div></div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
              最终金额：¥{selectedReconciliation.finalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 签名区域 - 底部 */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          {showCreator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>制单人：</span>
              <span style={{ borderBottom: '1px solid #333', minWidth: '60px', display: 'inline-block' }}>{printCreator || ''}</span>
            </div>
          )}
          {showCustomerConfirm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>客户确认：</span>
              <span style={{ borderBottom: '1px solid #333', minWidth: '60px', display: 'inline-block' }}>{printCustomerConfirm || ''}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
          <TabsTrigger value="reconciliation">对账单</TabsTrigger>
          <TabsTrigger value="pending">待对账出库单</TabsTrigger>
        </TabsList>

        {/* 对账单 Tab */}
        <TabsContent value="reconciliation" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  对账单管理
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => exportToExcel(filteredReconciliations, getReconciliationExportColumns(), '智能对账')}>
                    <Download className="w-4 h-4 mr-1" />
                    Excel导出
                  </Button>
                  <Button size="sm" className="bg-primary" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    新增对账单
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 筛选器组 */}
              <FilterGroup gap="sm" className="mb-4">
                <Filter value={searchText} onValueChange={setSearchText}>
                  <FilterTrigger label="关键词" closable />
                  <FilterContent>
                    <FilterTextContent placeholder="搜索客户/对账单号" />
                  </FilterContent>
                </Filter>
                <Filter value={statusFilter} onValueChange={setStatusFilter}>
                  <FilterTrigger label="状态" closable />
                  <FilterContent>
                    <FilterSelectContent
                      options={[
                        { label: '已确认', value: 'confirmed' },
                        { label: '已审核', value: 'audited' },
                        { label: '已开票', value: 'invoiced' },
                        { label: '部分回款', value: 'partial_paid' },
                        { label: '已回款', value: 'paid' },
                        { label: '已取消', value: 'cancelled' },
                      ]}
                    />
                  </FilterContent>
                </Filter>
                <Filter value={monthFilter} onValueChange={setMonthFilter}>
                  <FilterTrigger label="月份" closable />
                  <FilterContent>
                    <FilterSelectContent
                      options={[
                        { label: '2024-01', value: '2024-01' },
                        { label: '2024-02', value: '2024-02' },
                        { label: '2024-03', value: '2024-03' },
                      ]}
                    />
                  </FilterContent>
                </Filter>
                {(searchText || statusFilter || monthFilter) && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearchText(undefined); setStatusFilter(undefined); setMonthFilter(undefined); }}>
                    <X className="w-4 h-4 mr-1" />
                    重置
                  </Button>
                )}
              </FilterGroup>

              <Table
                columns={reconciliationColumns}
                dataSource={filteredReconciliations}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }}
                scroll={{ x: 1400 }}
                size="middle"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 待对账出库单 Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                待对账出库单
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                以下出库单尚未生成对账单，请选择后点击"新增对账单"进行对账
              </p>
              <Table
                columns={[
                  { title: '出库单号', dataIndex: 'outboundNo', key: 'outboundNo' },
                  { title: '客户', dataIndex: 'customerName', key: 'customerName' },
                  { title: '出库日期', dataIndex: 'outboundDate', key: 'outboundDate' },
                  { title: '数量', dataIndex: 'totalQuantity', key: 'totalQuantity' },
                  { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => v.toFixed(2) },
                  { title: '制单人', dataIndex: 'creator', key: 'creator' },
                  {
                    title: '操作',
                    key: 'action',
                    width: 100,
                    align: 'center' as const,
                    render: (_: any, record: IOutboundOrder) => (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => { setSelectedOutboundOrder(record); setViewOutboundDialogOpen(true); }}
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => { setSelectedOutboundOrder(record); setDeleteOutboundDialogOpen(true); }}
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                dataSource={outboundOrders.filter(o => o.status === 'pending_reconciliation')}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }}
                size="middle"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新增对账单弹窗 */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) {
          setTimeout(() => resetAddForm(), 100);
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {addStep === 2 && (
                <Button variant="ghost" size="sm" onClick={handleBackToCustomer} className="h-8 px-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              {addStep === 1 ? '选择客户' : '选择待对账出库单'}
            </DialogTitle>
          </DialogHeader>

          {/* 步骤1：选择客户 */}
          {addStep === 1 && (
            <div className="space-y-4">
              {/* 客户搜索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索客户名称/编号/助记码"
                  value={customerSearchText}
                  onChange={(e) => setCustomerSearchText(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* 客户列表表格 */}
              <div className="border border-border rounded-lg overflow-hidden">
                <Table
                  dataSource={filteredCustomers}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 900 }}
                  size="middle"
                  columns={[
                    {
                      title: '客户编号',
                      dataIndex: 'code',
                      key: 'code',
                      width: 100,
                    },
                    {
                      title: '客户名称',
                      dataIndex: 'name',
                      key: 'name',
                      width: 150,
                      render: (name: string) => (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{name}</span>
                        </div>
                      ),
                    },

                    {
                      title: '联系人',
                      dataIndex: 'contact',
                      key: 'contact',
                      width: 120,
                      render: (contact: string) => (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span>{contact}</span>
                        </div>
                      ),
                    },
                    {
                      title: '联系电话',
                      dataIndex: 'phone',
                      key: 'phone',
                      width: 140,
                      render: (phone: string) => (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{phone}</span>
                        </div>
                      ),
                    },
                    {
                      title: '运输方式',
                      dataIndex: 'transport',
                      key: 'transport',
                      width: 100,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 100,
                      fixed: 'right',
                      render: (_: any, record: ICustomer) => (
                        <Button size="sm" onClick={() => handleSelectCustomer(record)}>
                          选择
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* 步骤2：选择出库单 */}
          {addStep === 2 && selectedCustomer && (
            <div className="space-y-4">
              {/* 客户信息 */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedCustomer.name}</span>
                    <span className="text-muted-foreground">({selectedCustomer.code})</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  待对账出库单：<span className="font-medium text-success">{filteredPendingOrders.length}</span> 单
                </div>
              </div>

              {/* 对账月份 */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>对账月份</Label>
                  <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                </div>
              </div>

              {/* 日期筛选 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                {/* 出库日期筛选 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3" />
                    出库日期筛选
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="开始日期"
                      value={outboundStartDate}
                      onChange={(e) => setOutboundStartDate(e.target.value)}
                    />
                    <span className="flex items-center text-muted-foreground">~</span>
                    <Input
                      type="date"
                      placeholder="结束日期"
                      value={outboundEndDate}
                      onChange={(e) => setOutboundEndDate(e.target.value)}
                    />
                  </div>
                </div>
                {/* 入库日期筛选 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3" />
                    入库日期筛选
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="开始日期"
                      value={inboundStartDate}
                      onChange={(e) => setInboundStartDate(e.target.value)}
                    />
                    <span className="flex items-center text-muted-foreground">~</span>
                    <Input
                      type="date"
                      placeholder="结束日期"
                      value={inboundEndDate}
                      onChange={(e) => setInboundEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 待对账出库单列表 - 展开显示产品明细 */}
              {filteredPendingOrders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-border rounded-lg bg-muted/30">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>该客户暂无待对账出库单</p>
                  <p className="text-sm mt-1">请先前往「快速发货」创建出库单</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/80">
                      <tr>
                        <th className="p-2 text-left text-xs w-10">
                          <Checkbox
                            checked={selectedOutboundIds.length === filteredPendingOrders.length && filteredPendingOrders.length > 0}
                            onCheckedChange={(checked) => {
                              setSelectedOutboundIds(checked ? filteredPendingOrders.map(o => o.id) : []);
                            }}
                          />
                        </th>
                        <th className="p-2 text-left text-xs">出库单号</th>
                        <th className="p-2 text-left text-xs">出库日期</th>
                        <th className="p-2 text-left text-xs">产品名称</th>
                        <th className="p-2 text-left text-xs">工件编号</th>
                        <th className="p-2 text-left text-xs">加工工艺</th>
                        <th className="p-2 text-left text-xs">计价单位</th>
                        <th className="p-2 text-left text-xs">单价</th>
                        <th className="p-2 text-left text-xs">出库数量(件)</th>
                        <th className="p-2 text-left text-xs">出库重量(kg)</th>
                        <th className="p-2 text-left text-xs">出库金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingOrders.map(order => {
                        const isSelected = selectedOutboundIds.includes(order.id);
                        return order.details?.map((detail, index) => (
                          <tr
                            key={`${order.id}-${detail.id}`}
                            className={`border-t border-border ${isSelected ? 'bg-primary/10' : ''} hover:bg-muted/50`}
                            onClick={() => {
                              setSelectedOutboundIds(isSelected
                                ? selectedOutboundIds.filter(id => id !== order.id)
                                : [...selectedOutboundIds, order.id]
                              );
                            }}
                          >
                            {index === 0 && (
                              <>
                                <td className="p-2" rowSpan={order.details?.length || 1}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      setSelectedOutboundIds(checked
                                        ? [...selectedOutboundIds, order.id]
                                        : selectedOutboundIds.filter(id => id !== order.id)
                                      );
                                    }}
                                  />
                                </td>
                                <td className="p-2 text-sm" rowSpan={order.details?.length || 1}>{order.outboundNo}</td>
                                <td className="p-2 text-sm" rowSpan={order.details?.length || 1}>{order.outboundDate}</td>
                              </>
                            )}
                            <td className="p-2 text-sm">{detail.productName}</td>
                            <td className="p-2 text-sm">{detail.workpieceNo}</td>
                            <td className="p-2 text-sm">{detail.process || '-'}</td>
                            <td className="p-2 text-sm">{detail.unit}</td>
                            <td className="p-2 text-sm">¥{detail.unitPrice.toFixed(2)}</td>
                            <td className="p-2 text-sm">{detail.quantity} 件</td>
                            <td className="p-2 text-sm">{detail.weight > 0 ? `${detail.weight} kg` : '-'}</td>
                            <td className="p-2 text-sm font-medium">¥{detail.amount.toFixed(2)}</td>
                          </tr>
                        ));
                      })}
                    </tbody>
                </table>
              </div>
            )}

            {/* 金额调整 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>扣款金额</Label>
                <Input type="number" value={deductionAmount} onChange={(e) => setDeductionAmount(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>其他金额</Label>
                <Input type="number" value={otherAmount} onChange={(e) => setOtherAmount(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>赔偿金额</Label>
                <Input type="number" value={compensationAmount} onChange={(e) => setCompensationAmount(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            {/* 金额汇总 */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span>对账金额：</span>
                <span className="font-medium">¥{calculateAmounts().totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2">
                <span>最终金额：</span>
                <span className="text-primary">¥{calculateAmounts().finalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetAddForm(); }}>取消</Button>
              <Button className="bg-primary" onClick={handleAddReconciliation}>创建对账单</Button>
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑对账单弹窗 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑对账单 - {selectedReconciliation?.reconciliationNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>扣款金额</Label>
                <Input type="number" value={deductionAmount} onChange={(e) => setDeductionAmount(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>其他金额</Label>
                <Input type="number" value={otherAmount} onChange={(e) => setOtherAmount(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>赔偿金额</Label>
                <Input type="number" value={compensationAmount} onChange={(e) => setCompensationAmount(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
              <Button className="bg-primary" onClick={handleEditReconciliation}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 查看对账单弹窗 */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>对账单详情 - {selectedReconciliation?.reconciliationNo}</DialogTitle>
          </DialogHeader>
          {selectedReconciliation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>客户：{selectedReconciliation.customerName}</div>
                <div>月份：{selectedReconciliation.month}</div>
                <div>状态：<span className={`px-2 py-0.5 rounded text-xs ${statusMap[selectedReconciliation.status].color}`}>{statusMap[selectedReconciliation.status].label}</span></div>
                <div>审核人：{'-'}</div>
              </div>
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg text-sm">
                <div>对账金额：¥{selectedReconciliation.totalAmount.toFixed(2)}</div>
                <div>扣款：¥{selectedReconciliation.deductionAmount.toFixed(2)}</div>
                <div>其他：¥{selectedReconciliation.otherAmount.toFixed(2)}</div>
                <div>赔偿：¥{selectedReconciliation.compensationAmount.toFixed(2)}</div>
                <div className="col-span-4 font-bold">最终金额：¥{selectedReconciliation.finalAmount.toFixed(2)}</div>
                <div>开票金额：¥{selectedReconciliation.invoiceAmount.toFixed(2)}</div>
                <div>回款金额：¥{selectedReconciliation.receiptAmount.toFixed(2)}</div>
                <div className="col-span-2 text-destructive">未回款：¥{selectedReconciliation.unreceivedAmount.toFixed(2)}</div>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/80">
                    <tr>
                      <th className="p-2 text-left text-xs">出库单号</th>
                      <th className="p-2 text-left text-xs">出库日期</th>
                      <th className="p-2 text-left text-xs">产品名称</th>
                      <th className="p-2 text-left text-xs">工件编号</th>
                      <th className="p-2 text-left text-xs">加工工艺</th>
                      <th className="p-2 text-left text-xs">数量</th>
                      <th className="p-2 text-left text-xs">重量(kg)</th>
                      <th className="p-2 text-left text-xs">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReconciliation.details?.map((d, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2 text-sm">{d.outboundNo}</td>
                        <td className="p-2 text-sm">{d.outboundDate}</td>
                        <td className="p-2 text-sm">{d.productName}</td>
                        <td className="p-2 text-sm">{d.workpieceNo || '-'}</td>
                        <td className="p-2 text-sm">{d.process || '-'}</td>
                        <td className="p-2 text-sm">{d.quantity}</td>
                        <td className="p-2 text-sm">{d.weight > 0 ? d.weight.toFixed(2) : '-'}</td>
                        <td className="p-2 text-sm">¥{d.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { viewHistory(selectedReconciliation); }}>
                  <FileText className="w-4 h-4 mr-1" /> 查看历史版本
                </Button>
                <Button onClick={() => { setPrintDialogOpen(true); setViewDialogOpen(false); }}>
                  <Printer className="w-4 h-4 mr-1" /> 打印
                </Button>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>关闭</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除对账单确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p>确定要删除对账单 {selectedReconciliation?.reconciliationNo} 吗？删除后将恢复关联出库单的待对账状态。</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteReconciliation}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 撤销出库单确认弹窗 */}
      <Dialog open={deleteOutboundDialogOpen} onOpenChange={setDeleteOutboundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p>确定要撤销出库单 {selectedOutboundOrder?.outboundNo} 吗？撤销后将恢复产品库存。</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteOutboundDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteOutboundOrder}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 查看出库单详情弹窗 */}
      <Dialog open={viewOutboundDialogOpen} onOpenChange={setViewOutboundDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>出库单详情 - {selectedOutboundOrder?.outboundNo}</DialogTitle>
          </DialogHeader>
          {selectedOutboundOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">客户：</span>{selectedOutboundOrder.customerName}</div>
                <div><span className="text-muted-foreground">客户编号：</span>{selectedOutboundOrder.customerCode}</div>
                <div><span className="text-muted-foreground">出库日期：</span>{selectedOutboundOrder.outboundDate}</div>
                <div><span className="text-muted-foreground">制单人：</span>{selectedOutboundOrder.creator}</div>
                {selectedOutboundOrder.receiver && (
                  <div><span className="text-muted-foreground">收货人：</span>{selectedOutboundOrder.receiver}</div>
                )}
                {selectedOutboundOrder.transporter && (
                  <div><span className="text-muted-foreground">运输方式：</span>{selectedOutboundOrder.transporter}</div>
                )}
                {selectedOutboundOrder.plateNumber && (
                  <div><span className="text-muted-foreground">车牌号：</span>{selectedOutboundOrder.plateNumber}</div>
                )}
                {selectedOutboundOrder.driver && (
                  <div><span className="text-muted-foreground">司机：</span>{selectedOutboundOrder.driver}</div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg text-sm">
                <div><span className="text-muted-foreground">总数量：</span>{selectedOutboundOrder.totalQuantity} 件</div>
                <div><span className="text-muted-foreground">总重量：</span>{selectedOutboundOrder.totalWeight > 0 ? `${selectedOutboundOrder.totalWeight.toFixed(2)} kg` : '-'}</div>
                <div className="font-bold"><span className="text-muted-foreground">总金额：</span>¥{selectedOutboundOrder.totalAmount.toFixed(2)}</div>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/80">
                    <tr>
                      <th className="p-2 text-left text-xs">产品名称</th>
                      <th className="p-2 text-left text-xs">工件编号</th>
                      <th className="p-2 text-left text-xs">材质</th>
                      <th className="p-2 text-left text-xs">加工工艺</th>
                      <th className="p-2 text-left text-xs">单位</th>
                      <th className="p-2 text-left text-xs">单价</th>
                      <th className="p-2 text-left text-xs">数量</th>
                      <th className="p-2 text-left text-xs">重量(kg)</th>
                      <th className="p-2 text-left text-xs">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOutboundOrder.details?.map((detail, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2 text-sm">{detail.productName}</td>
                        <td className="p-2 text-sm">{detail.workpieceNo || '-'}</td>
                        <td className="p-2 text-sm">{detail.material || '-'}</td>
                        <td className="p-2 text-sm">{detail.process || '-'}</td>
                        <td className="p-2 text-sm">{detail.unit}</td>
                        <td className="p-2 text-sm">¥{detail.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-sm">{detail.quantity}</td>
                        <td className="p-2 text-sm">{detail.weight > 0 ? detail.weight.toFixed(2) : '-'}</td>
                        <td className="p-2 text-sm font-medium">¥{detail.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewOutboundDialogOpen(false)}>关闭</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 审核弹窗 */}
      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核对账单</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>审核人</Label>
              <Input value={auditorName} onChange={(e) => setAuditorName(e.target.value)} placeholder="请输入审核人姓名" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAuditDialogOpen(false)}>取消</Button>
              <Button className="bg-primary" onClick={handleAudit}>确认审核</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 开票弹窗 */}
      <Dialog open={invoiceDialogOpen} onOpenChange={(open) => {
        setInvoiceDialogOpen(open);
        if (open && selectedReconciliation) {
          // 打开时默认填充最大可开票金额
          setInvoiceAmountInput(selectedReconciliation.uninvoiceAmount.toFixed(2));
        } else if (!open) {
          setInvoiceAmountInput('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>记录开票 - {selectedReconciliation?.reconciliationNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span>最终金额：</span>
                <span className="font-medium">¥{selectedReconciliation?.finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>已开票：</span>
                <span className="text-blue-600">¥{selectedReconciliation?.invoiceAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>未开票金额：</span>
                <span className="text-warning font-bold">¥{selectedReconciliation?.uninvoiceAmount.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <Label>本次开票金额</Label>
              <Input
                type="number"
                value={invoiceAmountInput}
                onChange={(e) => setInvoiceAmountInput(e.target.value)}
                placeholder={`最大可开票金额：${selectedReconciliation?.uninvoiceAmount.toFixed(2)}`}
                max={selectedReconciliation?.uninvoiceAmount}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>取消</Button>
              <Button className="bg-primary" onClick={handleRecordInvoice}>确认开票</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 回款弹窗 */}
      <Dialog open={receiptDialogOpen} onOpenChange={(open) => {
        setReceiptDialogOpen(open);
        if (open && selectedReconciliation) {
          // 打开时默认填充最大可回款金额
          setReceiptAmountInput(selectedReconciliation.unreceivedAmount.toFixed(2));
        } else if (!open) {
          setReceiptAmountInput('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>记录回款 - {selectedReconciliation?.reconciliationNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span>最终金额：</span>
                <span className="font-medium">¥{selectedReconciliation?.finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>已回款：</span>
                <span className="text-success">¥{selectedReconciliation?.receiptAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>未回款金额：</span>
                <span className="text-destructive font-bold">¥{selectedReconciliation?.unreceivedAmount.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <Label>本次回款金额</Label>
              <Input
                type="number"
                value={receiptAmountInput}
                onChange={(e) => setReceiptAmountInput(e.target.value)}
                placeholder={`最大可回款金额：${selectedReconciliation?.unreceivedAmount.toFixed(2)}`}
                max={selectedReconciliation?.unreceivedAmount}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>取消</Button>
              <Button className="bg-primary" onClick={handleRecordReceipt}>确认回款</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 操作校验弹窗 */}
      <Dialog open={actionCheckDialogOpen} onOpenChange={setActionCheckDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              操作受限
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 mb-2">
                {actionCheckType === 'delete' ? '该对账单不能删除' : '该对账单不能反审核'}
              </p>
              <p className="text-sm text-red-600">
                {actionCheckResult?.reason}
              </p>
              {actionCheckResult?.invoiceCount !== undefined && actionCheckResult.invoiceCount > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  已开票金额：¥{selectedReconciliation?.invoiceAmount.toFixed(2)}
                </p>
              )}
              {actionCheckResult?.receiptCount !== undefined && actionCheckResult.receiptCount > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  已回款金额：¥{selectedReconciliation?.receiptAmount.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionCheckDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 反审核确认弹窗 */}
      <Dialog open={unauditConfirmDialogOpen} onOpenChange={setUnauditConfirmDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <XCircle className="w-5 h-5" />
              撤销审核确认
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* 对账单基本信息 */}
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">对账单号：</span>
                <span className="font-medium">{unauditTargetRecord?.reconciliationNo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">客户：</span>
                <span className="font-medium">{unauditTargetRecord?.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">对账金额：</span>
                <span className="font-medium text-primary">¥{unauditTargetRecord?.finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* 后果说明 */}
            <div className="border-l-4 border-amber-500 bg-amber-50 p-3 rounded-r-lg">
              <p className="text-sm font-medium text-amber-800 mb-2">此操作将导致以下后果：</p>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>对账单状态将变为"已作废"</li>
                <li>当前对账明细将被标记为历史版本（可查看）</li>
                <li>关联的出库单将解锁，可被修改或撤销</li>
                <li>重新审核时将生成新版本对账单，金额可能变化</li>
              </ul>
              <p className="text-xs text-amber-600 mt-2">
                如果客户已收到此对账单，请提前与客户沟通
              </p>
            </div>

            {/* 原因输入 */}
            <div className="space-y-2">
              <Label htmlFor="unaudit-reason" className="text-sm font-medium">
                撤销原因 <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-2">（至少10个字）</span>
              </Label>
              <textarea
                id="unaudit-reason"
                value={unauditReason}
                onChange={(e) => setUnauditReason(e.target.value)}
                placeholder="请详细说明撤销原因，例如：发现出库单CK002数量录入错误，实际应为80件而非100件..."
                className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{unauditReason.length > 0 && unauditReason.length < 10 && (
                  <span className="text-destructive">还需输入 {10 - unauditReason.length} 个字</span>
                )}</span>
                <span>{unauditReason.length}/500</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setUnauditConfirmDialogOpen(false);
              setUnauditReason('');
              setUnauditTargetRecord(null);
            }}>
              取消，暂不处理
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={confirmUnaudit}
              disabled={!unauditReason.trim() || unauditReason.trim().length < 10}
            >
              确认撤销审核
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 历史版本弹窗 */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              对账历史版本 - {reconciliationHistory?.reconciliation?.reconciliationNo}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {reconciliationHistory && (
              <>
                {/* 版本时间轴 */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-4">版本历史</h4>
                  <div className="space-y-3">
                    {reconciliationHistory.versions.map((version, index) => (
                      <div
                        key={version.version}
                        className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVersion === version.version
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card border-border hover:bg-muted/80'
                        }`}
                        onClick={() => setSelectedVersion(version.version)}
                      >
                        {/* 版本标识 */}
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            version.isActive
                              ? 'bg-primary text-white'
                              : version.updateReason
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            {version.version}
                          </div>
                          {index < reconciliationHistory.versions.length - 1 && (
                            <div className="w-0.5 h-6 bg-border"></div>
                          )}
                        </div>

                        {/* 版本信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              第{version.version}版
                              {version.isActive && (
                                <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded">当前</span>
                              )}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              明细 {version.details.length} 条
                            </span>
                            <span className="text-sm text-muted-foreground">
                              金额 ¥{version.details.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                            </span>
                          </div>
                          {version.updateReason && (
                            <p className="text-sm text-amber-700 mt-1">
                              变更原因：{version.updateReason}
                            </p>
                          )}
                          {version.updatedBy && (
                            <p className="text-xs text-muted-foreground mt-1">
                              操作人：{version.updatedBy}
                              {version.updatedAt && ` · ${new Date(version.updatedAt).toLocaleString('zh-CN')}`}
                            </p>
                          )}
                        </div>

                        {/* 对比按钮 */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (compareVersion === version.version) {
                                setCompareVersion(null);
                              } else {
                                setCompareVersion(version.version);
                              }
                            }}
                          >
                            {compareVersion === version.version ? '取消对比' : '对比'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 选中版本的明细 */}
                {selectedVersion && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3 flex justify-between items-center">
                      <h4 className="text-sm font-medium">
                        第{selectedVersion}版明细
                        {compareVersion && selectedVersion !== compareVersion && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            （对比第{compareVersion}版）
                          </span>
                        )}
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-2 text-left">出库单号</th>
                            <th className="p-2 text-left">产品名称</th>
                            <th className="p-2 text-right">数量</th>
                            <th className="p-2 text-right">金额</th>
                            {compareVersion && selectedVersion !== compareVersion && (
                              <th className="p-2 text-right">差异</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const currentVersion = reconciliationHistory.versions.find(v => v.version === selectedVersion);
                            const compareVer = compareVersion
                              ? reconciliationHistory.versions.find(v => v.version === compareVersion)
                              : null;

                            return currentVersion?.details.map((detail, idx) => {
                              const compareDetail = compareVer?.details.find(d => d.outboundNo === detail.outboundNo);
                              const diff = compareDetail ? detail.amount - compareDetail.amount : 0;

                              return (
                                <tr key={idx} className="border-t border-border">
                                  <td className="p-2">{detail.outboundNo}</td>
                                  <td className="p-2">{detail.productName}</td>
                                  <td className="p-2 text-right">{detail.quantity}</td>
                                  <td className="p-2 text-right">¥{detail.amount.toFixed(2)}</td>
                                  {compareVersion && selectedVersion !== compareVersion && (
                                    <td className={`p-2 text-right ${diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : ''}`}>
                                      {diff !== 0 && (diff > 0 ? '+' : '')}
                                      {diff !== 0 ? `¥${diff.toFixed(2)}` : '-'}
                                    </td>
                                  )}
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 操作日志 */}
                {reconciliationHistory.operationLogs.length > 0 && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-3">操作日志</h4>
                    <div className="space-y-2">
                      {reconciliationHistory.operationLogs.map((log, idx) => (
                        <div key={idx} className="text-sm flex items-start gap-3">
                          <span className="text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('zh-CN')}
                          </span>
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs">
                            撤销审核
                          </span>
                          <span className="text-muted-foreground flex-1">
                            {(() => {
                              try {
                                const stateStr = typeof log.afterState === 'string' ? log.afterState : '{}';
                                const afterState = JSON.parse(stateStr) as { reason?: string };
                                return afterState.reason || '-';
                              } catch {
                                return '-';
                              }
                            })()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setHistoryDialogOpen(false);
              setSelectedVersion(null);
              setCompareVersion(null);
            }}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 金额计算明细弹窗 */}
      <Dialog open={calculationDialogOpen} onOpenChange={setCalculationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              金额计算明细
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {calculationDetail && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">出库金额合计：</span>
                    <span className="font-medium">¥{calculationDetail.baseAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">扣减金额：</span>
                    <span className="text-destructive">-¥{calculationDetail.deductionAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">其他金额：</span>
                    <span className={calculationDetail.otherAmount >= 0 ? 'text-success' : 'text-destructive'}>
                      {calculationDetail.otherAmount >= 0 ? '+' : ''}¥{calculationDetail.otherAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">补偿金额：</span>
                    <span className="text-success">+¥{calculationDetail.compensationAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>最终金额：</span>
                      <span className="text-primary">¥{calculationDetail.finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">已开票金额：</span>
                    <span>¥{calculationDetail.invoiceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">未开票金额：</span>
                    <span className="font-medium">¥{calculationDetail.uninvoiceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">已回款金额：</span>
                    <span className="text-success">¥{calculationDetail.receiptAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">未回款金额：</span>
                    <span className={calculationDetail.unreceivedAmount > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      ¥{calculationDetail.unreceivedAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCalculationDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 打印弹窗 */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>打印对账单</DialogTitle>
          </DialogHeader>
          
          {/* 打印字段内容设置 */}
          <div className="mb-4 p-3 bg-muted/30 rounded-lg space-y-2">
            <div className="text-sm font-medium mb-2">打印内容设置</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showCompanyName}
                  onChange={(e) => setShowCompanyName(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">公司名称</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showCreator}
                  onChange={(e) => setShowCreator(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">制单人</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showCustomerConfirm}
                  onChange={(e) => setShowCustomerConfirm(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">客户确认</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {showCompanyName && (
                <Input 
                  value={printCompanyName}
                  onChange={(e) => setPrintCompanyName(e.target.value)}
                  placeholder="公司名称"
                  className="h-8 text-sm"
                />
              )}
              {showCreator && (
                <Input 
                  value={printCreator}
                  onChange={(e) => setPrintCreator(e.target.value)}
                  placeholder="制单人姓名"
                  className="h-8 text-sm"
                />
              )}
              {showCustomerConfirm && (
                <Input 
                  value={printCustomerConfirm}
                  onChange={(e) => setPrintCustomerConfirm(e.target.value)}
                  placeholder="客户确认"
                  className="h-8 text-sm"
                />
              )}
            </div>
          </div>
          
          <PrintPreview />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>关闭</Button>
            <Button variant="outline" onClick={async () => {
              try {
                await exportElementToPdf('print-preview-content', selectedReconciliation?.reconciliationNo || '对账单');
                toast.success('PDF导出成功');
              } catch (error: any) {
                toast.error(error?.message || 'PDF导出失败');
              }
            }}>
              <FileDown className="w-4 h-4 mr-1" /> 导出PDF
            </Button>
            <Button onClick={async () => {
              try {
                await smartPrint('print-preview-content', '对账单');
                setTimeout(() => setPrintDialogOpen(false), 500);
              } catch { /* smartPrint 已提示 */ }
            }}>
              <Printer className="w-4 h-4 mr-1" /> 打印
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReconciliationPage;
