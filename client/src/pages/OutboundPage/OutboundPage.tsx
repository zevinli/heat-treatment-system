import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Printer,
  Plus,
  Trash2,
  Package,
  User,
  FileText,
  CheckCircle2,
  Truck,
  Download,
  Bell,
  AlertTriangle,
  Save,
  Building2,
  ClipboardList,
  History,
  type LucideIcon,
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { smartPrint } from '@/lib/print-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Table } from '@lark-apaas/client-toolkit/antd-table';
import { useData } from '@/data/DataContext';
import type { ICustomer, IProduct, ProductStatus } from '@/data/mockData';
import { StepProgress } from '@/pages/StepProgressPage/StepProgressPage';

// 注意：单号生成已移至后端，前端不再生成单号
// 后端使用UUID确保唯一性，避免前端并发生成重复单号
const generateOutboundNo = () => {
  // 临时占位，实际单号由后端在保存时生成
  return '';
};

// 出库明细
interface IOutboundDetail {
  id: string;
  productId: string;
  productName: string;
  workpieceNo: string;
  unit: string;
  unitPrice: number;
  outboundQuantity: number;
  outboundWeight: number;
  outboundAmount: number;
  batchNo: string;
  process: string;
  material: string;
  closeOrder: boolean;
}

const OutboundPage: React.FC = () => {
  const navigate = useNavigate();
  const { products: rawProducts, customers: rawCustomers, addOutboundOrder, refreshProducts } = useData();

  // 防御性处理：确保数据是数组
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const customers = Array.isArray(rawCustomers) ? rawCustomers : [];
  const [currentStep, setCurrentStep] = useState(1);
  
  // 步骤1：客户选择
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // 步骤2：产品选择
  const [selectedProducts, setSelectedProducts] = useState<IProduct[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  // 一键全出模式：自动填充当前最大库存
  const [quickFillMode, setQuickFillMode] = useState(false);
  
  // 步骤3：出库单信息
  const [outboundDate, setOutboundDate] = useState(new Date().toISOString().split('T')[0]);
  const [outboundTime, setOutboundTime] = useState(new Date().toTimeString().slice(0, 5));
  const [creator, setCreator] = useState('收发');
  const [internalCode, setInternalCode] = useState('');
  const [receiver, setReceiver] = useState('');
  const [transporter, setTransporter] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [driver, setDriver] = useState('');
  const [selfCode, setSelfCode] = useState('');
  const [handler, setHandler] = useState('');
  const [handleTime, setHandleTime] = useState(new Date().toLocaleString('zh-CN'));
  
  // 出库明细
  const [outboundDetails, setOutboundDetails] = useState<IOutboundDetail[]>([]);
  
  // 打印弹窗
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  
  // 打印字段值
  const [printCompanyName, setPrintCompanyName] = useState('大连文火热处理');
  const [printCreator, setPrintCreator] = useState('');
  const [printCustomerConfirm, setPrintCustomerConfirm] = useState('');
  
  // 是否显示打印字段
  const [showCompanyName, setShowCompanyName] = useState(true);
  const [showCreator, setShowCreator] = useState(true);
  const [showCustomerConfirm, setShowCustomerConfirm] = useState(true);
  const [showReceiver, setShowReceiver] = useState(true);
  const [showTransporter, setShowTransporter] = useState(true);
  const [showPlateNumber, setShowPlateNumber] = useState(true);
  const [showDriver, setShowDriver] = useState(true);
  const [showSelfCode, setShowSelfCode] = useState(true);
  const [showInternalCode, setShowInternalCode] = useState(false);

  // 出库单信息折叠状态
  const [isOutboundInfoExpanded, setIsOutboundInfoExpanded] = useState(false);

  // 过滤客户
  const filteredCustomers = customers.filter(c => 
    c.name.includes(customerSearch) || 
    c.code.includes(customerSearch)
  );

  // 可发货产品：当前客户 + 有库存
  const availableProducts = useMemo(() => {
    if (!selectedCustomer) return [];
    return products.filter(p => 
      p.customerCode === selectedCustomer.code && 
      p.stock > 0
    );
  }, [products, selectedCustomer]);

  // 选择客户
  const handleSelectCustomer = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setCurrentStep(2);
    // 不再弹出 toast，通过步骤切换和界面状态反馈
  };

  // 处理产品选择（多选）
  const handleProductSelect = (product: IProduct, checked: boolean) => {
    if (checked) {
      // 添加到已选择
      if (!selectedProducts.find(p => p.id === product.id)) {
        setSelectedProducts([...selectedProducts, product]);
      }
    } else {
      // 从已选择移除
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    }
  };

  // 确认选择产品 - 支持一键全出模式
  const handleConfirmProducts = () => {
    // 检查待完善产品
    const incompleteProducts = selectedProducts.filter(p => p.status === 'incomplete');
    if (incompleteProducts.length > 0) {
      toast.warning(`有 ${incompleteProducts.length} 个产品信息待完善，建议后续补充完整信息`, {
        duration: 4000,
        action: {
          label: '查看',
          onClick: () => navigate('/products'),
        },
      });
    }

    // 检查库存预警
    const warningProducts = selectedProducts.filter(p => {
      const threshold = p.warningThreshold || 50;
      return p.inboundQuantity <= threshold;
    });
    if (warningProducts.length > 0) {
      toast.warning(`有 ${warningProducts.length} 个产品库存低于预警阈值，请注意库存情况`, {
        duration: 4000,
      });
    }

    const newDetails: IOutboundDetail[] = selectedProducts.map(product => {
      // 一键全出模式：自动填充当前最大库存
      const outboundQuantity = quickFillMode ? product.stock : 0;
      const outboundWeight = quickFillMode ? (product.stockWeight || 0) : 0;
      // 自动计算金额
      const outboundAmount = product.unit === '件' 
        ? outboundQuantity * product.unitPrice 
        : outboundWeight * product.unitPrice;
      
      return {
        id: Date.now().toString() + product.id,
        productId: product.id,
        productName: product.name,
        workpieceNo: product.workpieceNo,
        unit: product.unit,
        unitPrice: product.unitPrice,
        outboundQuantity,
        outboundWeight,
        outboundAmount,
        batchNo: product.batchNo,
        process: product.process,
        material: product.material,
        inboundDate: product.inboundDate,
        closeOrder: false,
      };
    });
    
    setOutboundDetails(prev => [...prev, ...newDetails]);
    setSelectedProducts([]);
    setProductDialogOpen(false);
    
    // 根据模式显示不同的提示
    if (quickFillMode) {
      toast.success(`已添加 ${newDetails.length} 个产品，数量/重量已自动填充为当前最大库存`);
      // 重置一键全出模式，避免下次默认启用
      setQuickFillMode(false);
    }
  };

  // 更新出库明细
  const handleUpdateDetail = (id: string, field: keyof IOutboundDetail, value: any) => {
    setOutboundDetails(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      // 自动计算金额：单位为件时按数量计算，kg时按重量计算
      if (field === 'outboundQuantity' || field === 'outboundWeight' || field === 'unitPrice') {
        if (updated.unit === '件') {
          updated.outboundAmount = updated.outboundQuantity * updated.unitPrice;
        } else {
          updated.outboundAmount = updated.outboundWeight * updated.unitPrice;
        }
      }
      return updated;
    }));
  };

  // 删除出库明细
  const handleDeleteDetail = (id: string) => {
    setOutboundDetails(prev => prev.filter(item => item.id !== id));
  };

  // 保存出库单并打印 - 创建出库单、扣减库存、打开打印弹窗
  const [currentOutboundNo, setCurrentOutboundNo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndPrint = async () => {
    if (outboundDetails.length === 0) {
      toast.error('请至少添加一个产品');
      return;
    }
    // 需求1：数量必须大于0
    const invalidDetails = outboundDetails.filter(d => d.outboundQuantity <= 0);
    if (invalidDetails.length > 0) {
      toast.error(`请填写出库数量：${invalidDetails.map(d => d.productName).join('、')}`);
      return;
    }

    // 需求2：出库重量不能为负数
    const invalidWeightDetails = outboundDetails.filter(d => d.outboundWeight < 0);
    if (invalidWeightDetails.length > 0) {
      toast.error(`出库重量不能为负数：${invalidWeightDetails.map(d => d.productName).join('、')}`);
      return;
    }

    // 检查主要维度库存是否充足（强制）
    const insufficientStock = outboundDetails.filter(detail => {
      const product = products.find(p => p.id === detail.productId);
      if (!product) return false;

      // 按kg计价的产品：用重量校验库存重量
      if (detail.unit === 'kg') {
        return detail.outboundWeight > (product.stockWeight || 0);
      }
      // 按件计价的产品：用数量校验库存数量
      return detail.outboundQuantity > product.stock;
    });

    if (insufficientStock.length > 0) {
      const productNames = insufficientStock.map(d => {
        const product = products.find(p => p.id === d.productId);
        if (d.unit === 'kg') {
          return `${d.productName}(库存${product?.stockWeight?.toFixed(2) || 0}kg，需${d.outboundWeight}kg)`;
        }
        return `${d.productName}(库存${product?.stock || 0}件，需${d.outboundQuantity}件)`;
      }).join('、');
      toast.error(`库存不足：${productNames}`);
      return;
    }

    // 检查次要维度是否超限（仅警告，不阻止）
    const warningStock = outboundDetails.filter(detail => {
      const product = products.find(p => p.id === detail.productId);
      if (!product) return false;

      // 按kg计价的产品：检查数量是否超出（仅警告）
      if (detail.unit === 'kg') {
        return detail.outboundQuantity > product.stock;
      }
      // 按件计价的产品：检查重量是否超出（仅警告）
      return detail.outboundWeight > (product.stockWeight || 0);
    });

    if (warningStock.length > 0) {
      const productNames = warningStock.map(d => {
        const product = products.find(p => p.id === d.productId);
        if (d.unit === 'kg') {
          return `${d.productName}(数量超出库存：${product?.stock || 0}件)`;
        }
        return `${d.productName}(重量超出库存：${product?.stockWeight?.toFixed(2) || 0}kg)`;
      }).join('、');
      toast.warning(`注意：${productNames}，请确认是否继续`);
    }

    // 防止重复提交
    if (isSaving) return;
    setIsSaving(true);

    try {
      // 计算总金额、总数量、总重量
      const totalAmount = outboundDetails.reduce((sum, d) => sum + d.outboundAmount, 0);
      const totalQuantity = outboundDetails.reduce((sum, d) => sum + d.outboundQuantity, 0);
      const totalWeight = outboundDetails.reduce((sum, d) => sum + d.outboundWeight, 0);

      // 构建出库单明细
      const orderDetails = outboundDetails.map(detail => ({
        id: detail.id,
        productId: detail.productId,
        productName: detail.productName,
        workpieceNo: detail.workpieceNo,
        material: detail.material,
        process: detail.process,
        unit: detail.unit,
        unitPrice: detail.unitPrice,
        quantity: detail.outboundQuantity,
        weight: detail.outboundWeight,
        amount: detail.outboundAmount,
        batchNo: detail.batchNo,
        inboundDate: outboundDate,
        closeOrder: detail.closeOrder,
      }));

      // 创建出库单记录（后端会自动扣减库存）
      const order = await addOutboundOrder({
        customerId: selectedCustomer!.id,
        customerName: selectedCustomer!.name,
        customerCode: selectedCustomer!.code,
        outboundDate,
        creator,
        receiver: receiver || selectedCustomer!.name,
        transporter: transporter || '自提',
        plateNumber,
        driver,
        totalAmount,
        totalQuantity,
        totalWeight,
        details: orderDetails,
      });

      // 保存后端生成的单号
      setCurrentOutboundNo(order.outboundNo);

      // 立即刷新产品数据，确保库存显示最新
      await refreshProducts();

      toast.success(`出库单 ${order.outboundNo} 保存成功，库存已扣减`);
      setPrintDialogOpen(true);

      // 清除草稿
      clearDraft();
    } catch (error) {
      toast.error('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsSaving(false);
    }
  };

  // 关闭打印弹窗 - 关闭弹窗并返回初始状态
  const handleClosePrintDialog = () => {
    setPrintDialogOpen(false);
    handleBackToCustomer();
    toast.success('出库流程完成');
  };

  // 本地暂存相关
  const STORAGE_KEY = 'outbound_draft';
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
  
  // 页面加载时检查是否有草稿 - 静默恢复
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        // 检查草稿是否过期（24小时）
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          // 静默恢复草稿，不弹窗打扰
          restoreDraft(draft, true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);
  
  // 自动保存草稿
  useEffect(() => {
    if (currentStep > 1 && selectedCustomer) {
      const draft = {
        currentStep,
        selectedCustomer,
        outboundDetails,
        outboundDate,
        outboundTime,
        creator,
        receiver,
        transporter,
        plateNumber,
        driver,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [currentStep, selectedCustomer, outboundDetails, outboundDate, outboundTime, creator, receiver, transporter, plateNumber, driver]);
  
  // 恢复草稿
  const restoreDraft = (draft: any, silent = false) => {
    setCurrentStep(draft.currentStep);
    setSelectedCustomer(draft.selectedCustomer);
    setOutboundDetails(draft.outboundDetails || []);
    setOutboundDate(draft.outboundDate || new Date().toISOString().split('T')[0]);
    setOutboundTime(draft.outboundTime || new Date().toTimeString().slice(0, 5));
    setCreator(draft.creator || '收发');
    setReceiver(draft.receiver || '');
    setTransporter(draft.transporter || '');
    setPlateNumber(draft.plateNumber || '');
    setDriver(draft.driver || '');
    setHasDraft(false);
    if (!silent) {
      toast.success('已恢复草稿');
    } else {
      // 静默恢复时显示横幅提示
      setShowDraftBanner(true);
      setDraftTimestamp(draft.timestamp);
    }
  };
  
  // 清除草稿
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasDraft(false);
    setShowDraftBanner(false);
    setDraftTimestamp(null);
  };

  // 格式化相对时间
  const formatTimeAgo = (timestamp: number): string => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
  };

  // 返回客户选择
  const handleBackToCustomer = () => {
    setCurrentStep(1);
    setSelectedCustomer(null);
    setSelectedProducts([]);
    setOutboundDetails([]);
    clearDraft();
  };

  // 客户表格列
  const customerColumns: any = [
    { title: '序号', dataIndex: 'id', key: 'id', width: 60, render: (_: any, __: any, index: number) => index + 1 },
    { 
      title: '操作', 
      key: 'action', 
      width: 80,
      render: (_: any, record: ICustomer) => (
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90"
          onClick={() => handleSelectCustomer(record)}
        >
          出库
        </Button>
      )
    },
    { title: '客户名称', dataIndex: 'name', key: 'name' },
    { title: '客户编号', dataIndex: 'code', key: 'code', width: 100 },


    { title: '运输方式', dataIndex: 'transport', key: 'transport', width: 100 },
    { title: '付款期', dataIndex: 'paymentTerm', key: 'paymentTerm', width: 80 },
    { title: '送货方向', dataIndex: 'deliveryDirection', key: 'deliveryDirection', width: 100 },
    { title: '结算方式', dataIndex: 'settlement', key: 'settlement', width: 100 },
    { title: '客户分类', dataIndex: 'category', key: 'category', width: 100 },
    { title: '出库方式', dataIndex: 'outboundType', key: 'outboundType', width: 100 },
  ];

  // 步骤定义
  const outboundSteps: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'customer', label: '选择客户', icon: Building2 },
    { key: 'info', label: '填写出库信息', icon: ClipboardList },
  ];

  // 处理步骤点击
  const handleStepClick = (index: number) => {
    // 只允许返回已完成的步骤
    if (index < currentStep - 1) {
      setCurrentStep(index + 1);
    }
  };

  // 打印预览内容 - 使用内联样式确保打印效果
  const PrintPreview = () => (
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
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>送货单</h2>
      </div>

      {/* 单据信息 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
        <div><span style={{ fontWeight: 'bold' }}>出库单号：</span>{currentOutboundNo || ''}</div>
        <div><span style={{ fontWeight: 'bold' }}>出库日期：</span>{outboundDate || ''}</div>
      </div>

      {/* 客户信息表格 - 根据打印设置动态显示 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '8px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #666', padding: '4px', width: '70px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>客户名称</td>
            <td style={{ border: '1px solid #666', padding: '4px' }}>{selectedCustomer?.name || ''}</td>
            {showReceiver && (
              <>
                <td style={{ border: '1px solid #666', padding: '4px', width: '70px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>收货单位</td>
                <td style={{ border: '1px solid #666', padding: '4px' }}>{receiver || selectedCustomer?.name || ''}</td>
              </>
            )}
            {showInternalCode && (
              <>
                <td style={{ border: '1px solid #666', padding: '4px', width: '70px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>内勤</td>
                <td style={{ border: '1px solid #666', padding: '4px' }}>{internalCode || '-'}</td>
              </>
            )}
          </tr>
          {(showTransporter || showPlateNumber) && (
            <tr>
              {showTransporter && (
                <>
                  <td style={{ border: '1px solid #666', padding: '4px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>运输方</td>
                  <td style={{ border: '1px solid #666', padding: '4px' }}>{transporter || '-'}</td>
                </>
              )}
              {showPlateNumber && (
                <>
                  <td style={{ border: '1px solid #666', padding: '4px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>车牌号</td>
                  <td style={{ border: '1px solid #666', padding: '4px' }}>{plateNumber || '-'}</td>
                </>
              )}
            </tr>
          )}
          {(showDriver || showSelfCode) && (
            <tr>
              {showDriver && (
                <>
                  <td style={{ border: '1px solid #666', padding: '4px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>司机</td>
                  <td style={{ border: '1px solid #666', padding: '4px' }}>{driver || '-'}</td>
                </>
              )}
              {showSelfCode && (
                <>
                  <td style={{ border: '1px solid #666', padding: '4px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>自编号</td>
                  <td style={{ border: '1px solid #666', padding: '4px' }}>{selfCode || '-'}</td>
                </>
              )}
            </tr>
          )}
        </tbody>
      </table>

      {/* 产品明细表格 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--print-table-header-bg, #f0f0f0)' }}>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '25px' }}>序号</th>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold' }}>产品名称</th>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '65px' }}>工件编号</th>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '60px' }}>入库批次</th>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '45px' }}>数量</th>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '45px' }}>重量</th>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '45px' }}>单位</th>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '60px' }}>单价</th>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '70px' }}>金额</th>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '70px' }}>加工工艺</th>
            <th style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', fontWeight: 'bold', width: '55px' }}>材质</th>
          </tr>
        </thead>
        <tbody>
          {outboundDetails.slice(0, 8).map((detail, index) => (
            <tr key={detail.id}>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>{index + 1}</td>
              <td style={{ border: '1px solid #666', padding: '3px' }}>{detail.productName}</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>{detail.workpieceNo || '-'}</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>{detail.batchNo || '-'}</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>{detail.outboundQuantity}</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>{detail.outboundWeight || '-'}</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>{detail.unit}</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>{detail.unitPrice.toFixed(2)}</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>{detail.outboundAmount.toFixed(2)}</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>{detail.process || '-'}</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>{detail.material || '-'}</td>
            </tr>
          ))}
          {outboundDetails.length > 8 && (
            <tr>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }}>...</td>
              <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }} colSpan={10}>共 {outboundDetails.length} 条记录</td>
            </tr>
          )}
          <tr style={{ backgroundColor: 'var(--print-table-footer-bg, #f9fafb)', fontWeight: 'bold' }}>
            <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'center' }} colSpan={4}>合计</td>
            <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>
              {outboundDetails.reduce((sum, d) => sum + d.outboundQuantity, 0)}
            </td>
            <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>
              {outboundDetails.reduce((sum, d) => sum + d.outboundWeight, 0).toFixed(2)}
            </td>
            <td style={{ border: '1px solid #666', padding: '3px' }}></td>
            <td style={{ border: '1px solid #666', padding: '3px' }}></td>
            <td style={{ border: '1px solid #666', padding: '3px', textAlign: 'right' }}>
              {outboundDetails.reduce((sum, d) => sum + d.outboundAmount, 0).toFixed(2)}
            </td>
            <td style={{ border: '1px solid #666', padding: '3px' }} colSpan={2}></td>
          </tr>
        </tbody>
      </table>

      {/* 签名区域 - 底部 */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        {showCreator && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>制单人：</span>
            <span style={{ borderBottom: '1px solid #333', minWidth: '60px', display: 'inline-block', textAlign: 'center' }}>{printCreator || ''}</span>
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

  return (
    <div className="w-full space-y-4">
      {/* 步骤进度条 */}
      <div className="rounded-lg border bg-card p-6">
        <StepProgress
          steps={outboundSteps}
          currentIndex={currentStep - 1}
          onStepClick={handleStepClick}
          activeColor="bg-primary"
        />
      </div>

      {/* 草稿恢复提示横幅 */}
      {showDraftBanner && draftTimestamp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700">
            <History className="w-4 h-4" />
            <span className="text-sm">
              已恢复 {formatTimeAgo(draftTimestamp)} 的草稿
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearDraft}>
            丢弃草稿
          </Button>
        </div>
      )}

      {/* 步骤1：选择客户 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                选择客户
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索客户名称/编号/助记码"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>
            <Table
              columns={customerColumns}
              dataSource={filteredCustomers}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total: number) => `共 ${total} 条`,
              }}
              scroll={{ x: 1200 }}
              size="middle"
            />
          </CardContent>
        </Card>
      )}

      {/* 步骤2&3：出库单信息 */}
      {currentStep === 2 && selectedCustomer && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                出库单信息
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBackToCustomer}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一页
                </Button>
                <Button size="sm" onClick={() => setProductDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加产品
                </Button>
                <Button size="sm" className="bg-primary" onClick={handleSaveAndPrint} disabled={isSaving}>
                  <Printer className="w-4 h-4 mr-1" />
                  {isSaving ? '保存中...' : '保存并打印'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 基本信息表单 - 折叠设计 */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              {/* 始终显示的字段：客户名称、出库日期、出库时间、制单人 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">客户名称</Label>
                  <Input value={selectedCustomer.name} readOnly className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">出库日期</Label>
                  <Input type="date" value={outboundDate} onChange={(e) => setOutboundDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">出库时间</Label>
                  <Input type="time" value={outboundTime} onChange={(e) => setOutboundTime(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">制单人</Label>
                  <Input value={creator} onChange={(e) => setCreator(e.target.value)} />
                </div>
              </div>

              {/* 折叠展开的其他字段 */}
              <Collapsible open={isOutboundInfoExpanded} onOpenChange={setIsOutboundInfoExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <span>{isOutboundInfoExpanded ? '收起' : '展开更多'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOutboundInfoExpanded ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border/50">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">内勤</Label>
                      <Input value={internalCode} onChange={(e) => setInternalCode(e.target.value)} placeholder="内勤" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">收货单位</Label>
                      <Select value={receiver} onValueChange={setReceiver}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择收货单位" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={selectedCustomer.name}>{selectedCustomer.name}</SelectItem>
                          <SelectItem value="其他">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">运输方</Label>
                      <Select value={transporter} onValueChange={setTransporter}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择运输方" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="自提">自提</SelectItem>
                          <SelectItem value="快递">快递</SelectItem>
                          <SelectItem value="物流">物流</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">车牌号</Label>
                      <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="车牌号" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">司机</Label>
                      <Input value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="司机" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">自编号</Label>
                      <Input value={selfCode} onChange={(e) => setSelfCode(e.target.value)} placeholder="自编号" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">经办人</Label>
                      <Input value={handler} onChange={(e) => setHandler(e.target.value)} placeholder="经办人" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">经办时间</Label>
                      <Input value={handleTime} readOnly />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* 出库明细表格 */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left text-xs font-medium">序号</th>
                    <th className="p-2 text-left text-xs font-medium">操作</th>
                    <th className="p-2 text-left text-xs font-medium">关单</th>
                    <th className="p-2 text-left text-xs font-medium">产品名称</th>
                    <th className="p-2 text-left text-xs font-medium">工件编号</th>
                    <th className="p-2 text-left text-xs font-medium">加工工艺</th>
                    <th className="p-2 text-left text-xs font-medium">计价单位</th>
                    <th className="p-2 text-left text-xs font-medium">单价</th>
                    <th className="p-2 text-left text-xs font-medium">出库数量(件)</th>
                    <th className="p-2 text-left text-xs font-medium">出库重量(kg)</th>
                    <th className="p-2 text-left text-xs font-medium">出库金额</th>
                  </tr>
                </thead>
                <tbody>
                  {outboundDetails.map((detail, index) => (
                    <tr key={detail.id} className="border-t">
                      <td className="p-2 text-sm">{index + 1}</td>
                      <td className="p-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteDetail(detail.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                      <td className="p-2">
                        <Checkbox 
                          checked={detail.closeOrder} 
                          onCheckedChange={(v) => handleUpdateDetail(detail.id, 'closeOrder', v === true)}
                          className="w-5 h-5"
                        />
                      </td>
                      <td className="p-2 text-sm">
                        <div className="flex items-center gap-1">
                          {detail.productName}
                          {(() => {
                            const product = products.find(p => p.id === detail.productId);
                            return product?.status === 'incomplete' ? (
                              <Badge className="text-[10px] px-1 py-0 bg-amber-100 text-amber-700 hover:bg-amber-100" title="产品信息待完善">
                                待完善
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="text-sm text-muted-foreground">
                          {detail.workpieceNo || <span className="text-muted-foreground/50 italic">-</span>}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm text-muted-foreground">
                          {detail.process || <span className="text-muted-foreground/50 italic">-</span>}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm font-medium">{detail.unit}</span>
                      </td>
                      <td className="p-2 text-sm">{detail.unitPrice}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            className="w-20 h-8 text-sm"
                            value={detail.outboundQuantity || ''}
                            onChange={(e) => handleUpdateDetail(detail.id, 'outboundQuantity', parseInt(e.target.value) || 0)}
                          />
                          {(() => {
                            const product = products.find(p => p.id === detail.productId);
                            const isWarning = product && detail.outboundQuantity > product.stock;
                            return (
                              <span className={`text-xs whitespace-nowrap ${isWarning ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                                可用:{product?.stock || 0}件
                                {isWarning && ' ⚠️'}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-20 h-8 text-sm"
                            value={detail.outboundWeight || ''}
                            onChange={(e) => handleUpdateDetail(detail.id, 'outboundWeight', parseFloat(e.target.value) || 0)}
                          />
                          {(() => {
                            const product = products.find(p => p.id === detail.productId);
                            const isWarning = product && detail.outboundWeight > (product.stockWeight || 0);
                            return (
                              <span className={`text-xs whitespace-nowrap ${isWarning ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                                可用:{product?.stockWeight?.toFixed(2) || 0}kg
                                {isWarning && ' ⚠️'}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-2 text-sm font-medium">{detail.outboundAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {outboundDetails.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>请添加产品</p>
                </div>
              )}
            </div>

            {/* 合计信息 */}
            {outboundDetails.length > 0 && (
              <div className="flex justify-end gap-8 p-4 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">合计数量：</span>
                  <span className="font-medium">{outboundDetails.reduce((sum, d) => sum + d.outboundQuantity, 0)} 件</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">合计金额：</span>
                  <span className="font-medium text-primary">¥{outboundDetails.reduce((sum, d) => sum + d.outboundAmount, 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* 关单功能说明 */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <span className="font-medium">关单功能：</span>如实际出库数大于或小于入库数时，可以选择关单功能，这样就可以正常出库，且把库存平账。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 产品选择 - 改为 Sheet 抽屉 */}
      <Sheet open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col">
          <SheetHeader className="px-4 sm:px-6 py-4 border-b">
            <SheetTitle>选择待发货的产品</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6 space-y-4">
            {/* 客户信息和统计 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted/50 rounded-lg shrink-0">
              <div className="text-sm text-muted-foreground">
                客户：<span className="font-medium text-foreground">{selectedCustomer?.name}</span>
                <span className="text-muted-foreground ml-2">({selectedCustomer?.code})</span>
              </div>
              <div className="text-sm text-muted-foreground">
                可发货产品：<span className="font-medium text-success">{availableProducts.length}</span> 个
                {availableProducts.length === 0 && (
                  <span className="text-destructive ml-2">（该客户暂无库存产品）</span>
                )}
              </div>
            </div>
            {/* 产品表格 */}
            <div className="flex-1 overflow-auto min-h-0 border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-xs font-medium w-10">
                      <Checkbox 
                        checked={availableProducts.length > 0 && selectedProducts.length === availableProducts.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducts([...availableProducts]);
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-2 text-left text-xs font-medium w-24">产品编号</th>
                    <th className="p-2 text-left text-xs font-medium w-32">产品名称</th>
                    <th className="p-2 text-left text-xs font-medium w-20">材质</th>
                    <th className="p-2 text-left text-xs font-medium w-24">工艺</th>
                    <th className="p-2 text-left text-xs font-medium w-32">技术要求</th>
                    <th className="p-2 text-left text-xs font-medium w-24">工件编号</th>
                    <th className="p-2 text-left text-xs font-medium w-20">单价</th>
                    <th className="p-2 text-left text-xs font-medium w-20">计价单位</th>
                    <th className="p-2 text-left text-xs font-medium w-24">可用数量</th>
                    <th className="p-2 text-left text-xs font-medium w-24">可用重量</th>
                  </tr>
                </thead>
                <tbody>
                  {availableProducts.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>该客户暂无库存产品可发货</p>
                        <p className="text-sm mt-1">请先前往「来货登记」入库</p>
                      </td>
                    </tr>
                  ) : (
                    availableProducts.map((product) => {
                      const isSelected = selectedProducts.some(p => p.id === product.id);
                      const willQuickFill = quickFillMode && isSelected;
                      return (
                        <tr 
                          key={product.id} 
                          className={`border-t ${isSelected ? 'bg-blue-50' : ''} ${willQuickFill ? 'ring-1 ring-inset ring-blue-300' : ''} hover:bg-muted/30 transition-colors`}
                          onClick={() => handleProductSelect(product, !isSelected)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={(checked) => handleProductSelect(product, checked as boolean)}
                            />
                          </td>
                          <td className="p-2 text-sm">{product.code}</td>
                          <td className="p-2 text-sm font-medium">{product.name}</td>
                          <td className="p-2 text-sm">{product.material}</td>
                          <td className="p-2 text-sm">{product.process || '-'}</td>
                          <td className="p-2 text-sm text-muted-foreground max-w-32 truncate" title={product.techRequirement}>{product.techRequirement || '-'}</td>
                          <td className="p-2 text-sm">{product.workpieceNo}</td>
                          <td className="p-2 text-sm">¥{product.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-sm">
                            <span className="font-medium text-primary">{product.unit}</span>
                          </td>
                          <td className="p-2 text-sm">
                            <div className="flex items-center gap-1">
                              <span className={quickFillMode && selectedProducts.some(p => p.id === product.id) ? 'text-blue-600 font-semibold' : ''}>
                                {product.stock} 件
                              </span>
                              {(() => {
                                const threshold = product.warningThreshold || 50;
                                const isWarning = product.stock <= threshold;
                                return isWarning ? (
                                  <Badge className="text-[10px] px-1 py-0 bg-red-100 text-red-700 hover:bg-red-100" title={`库存低于预警阈值(${threshold})`}>
                                    <Bell className="w-2.5 h-2.5 mr-0.5" />
                                    预警
                                  </Badge>
                                ) : null;
                              })()}
                            </div>
                            {quickFillMode && selectedProducts.some(p => p.id === product.id) && (
                              <div className="text-[10px] text-blue-600 mt-0.5">
                                将出全部
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-sm">{(product.stockWeight || 0) > 0 ? `${(product.stockWeight || 0).toFixed(2)} kg` : '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shrink-0 bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                已选择 <span className="font-medium text-primary">{selectedProducts.length}</span> 个产品
              </div>
              {/* 一键全出开关 - 专业精美的设计 */}
              {selectedProducts.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                  <Switch
                    id="quick-fill-mode"
                    checked={quickFillMode}
                    onCheckedChange={setQuickFillMode}
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Label 
                    htmlFor="quick-fill-mode" 
                    className="text-xs font-medium text-blue-700 cursor-pointer flex items-center gap-1"
                  >
                    <Package className="w-3 h-3" />
                    一键全出
                  </Label>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                关闭
              </Button>
              <Button 
                onClick={handleConfirmProducts} 
                className={`${quickFillMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary'}`}
                disabled={selectedProducts.length === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {quickFillMode ? '确认并全出' : '确定选择'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 打印预览 - 改为 Sheet 抽屉 */}
      <Sheet open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              出库成功 - 打印送货单
            </SheetTitle>
          </SheetHeader>
          
          {/* 打印字段内容设置 */}
          <div className="mb-4 p-3 bg-muted/30 rounded-lg space-y-2">
            <div className="text-sm font-medium mb-2">打印内容设置</div>
            {/* 顶部信息字段 */}
            <div className="grid grid-cols-4 gap-3">
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
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showInternalCode}
                  onChange={(e) => setShowInternalCode(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">内勤</span>
              </div>
            </div>
            {/* 客户信息字段 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showReceiver}
                  onChange={(e) => setShowReceiver(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">收货单位</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showTransporter}
                  onChange={(e) => setShowTransporter(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">运输方</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showPlateNumber}
                  onChange={(e) => setShowPlateNumber(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">车牌号</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showDriver}
                  onChange={(e) => setShowDriver(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">司机</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showSelfCode}
                  onChange={(e) => setShowSelfCode(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">自编号</span>
              </div>
            </div>
            {/* 可编辑字段 */}
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
          <div className="flex justify-end gap-2 mt-4 no-print">
            <Button
              variant="outline"
              onClick={handleClosePrintDialog}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              关闭
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                exportToExcel(
                  outboundDetails,
                  [
                    { title: '产品名称', dataIndex: 'productName', key: 'productName' },
                    { title: '工件编号', dataIndex: 'workpieceNo', key: 'workpieceNo' },
                    { title: '计价单位', dataIndex: 'unit', key: 'unit' },
                    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice' },
                    { title: '出库数量', dataIndex: 'outboundQuantity', key: 'outboundQuantity' },
                    { title: '出库重量', dataIndex: 'outboundWeight', key: 'outboundWeight' },
                    { title: '出库金额', dataIndex: 'outboundAmount', key: 'outboundAmount' },
                    { title: '加工工艺', dataIndex: 'process', key: 'process' },
                    { title: '材质', dataIndex: 'material', key: 'material' },
                  ],
                  {
                    filename: `出库明细_${outboundDate}`,
                    sheetName: '出库明细',
                    title: `出库单 - ${selectedCustomer?.name}`,
                    headers: {
                      '客户名称': selectedCustomer?.name || '',
                      '出库日期': outboundDate,
                      '出库单号': currentOutboundNo,
                      '收货单位': receiver || selectedCustomer?.name || '',
                    },
                  }
                );
                toast.success('Excel导出成功');
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              导出Excel
            </Button>
            <Button onClick={() => {
              // 延迟打印，确保Dialog内容完全渲染
              setTimeout(() => {
                smartPrint('print-preview-content', '送货单').catch(() => undefined);
              }, 500);
            }}>
              <Printer className="w-4 h-4 mr-2" />
              打印送货单
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default OutboundPage;
