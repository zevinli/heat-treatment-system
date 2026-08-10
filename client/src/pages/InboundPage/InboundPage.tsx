import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  X,
  Download,
  Mic,
  Brain,
  Building2,
  ClipboardList,
  History,
  type LucideIcon,
  ImagePlus,
} from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { smartPrint } from '@/lib/print-service';
import { useProcessCardTemplate, type ITemplateConfig, type ITemplateField } from '@/hooks/usePrintTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Table } from '@lark-apaas/client-toolkit/antd-table';
import { useData } from '@/data/DataContext';
import type { ICustomer, IProduct, ProductStatus } from '@/data/mockData';
import { VoiceInputPanel } from '@/components/VoiceInput';
import { AIRecognitionDialog, type AIRecognitionResult } from '@/components/AIRecognitionDialog';
import type { VoiceParseResult } from '@/api';
import { StepProgress } from '@/pages/StepProgressPage/StepProgressPage';
import { EditableSelect } from '@/components/EditableSelect';
import * as XLSX from '@e965/xlsx';
import { logger } from '@lark-apaas/client-toolkit/logger';

// 注意：入库单号由后端自动生成，格式为 RK + 年月日 + 3位序号
// 前端无需传 inboundNo 字段

// 入库明细
interface IInboundDetail {
  id: string;
  productId: string;
  productName: string;
  productModel: string;
  productSpec: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  weight: number;
  amount: number;
  inboundType: string;
  process: string;
  material: string;
  techRequirement: string;
  urgent: boolean;
  attachments?: string[];
}

// 防抖Hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// 格式化倒计时
const formatCountdown = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const InboundPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    customers: rawCustomers, 
    products: rawProducts, 
    addProduct, 
    addInboundOrder, 
    checkCanUndo, 
    cancelInboundOrder,
    getCachedCustomerProducts,
    setCachedCustomerProducts,
    featureConfig,
    refreshInventoryRecords,
  } = useData();

  // 防御性处理：确保数据是数组
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const customers = Array.isArray(rawCustomers) ? rawCustomers : [];
  const [currentStep, setCurrentStep] = useState(1);
  
  // 步骤1：客户选择
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // 步骤2：产品选择
  const [selectedProducts, setSelectedProducts] = useState<IProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  
  // 步骤3：入库单信息
  const [inboundDate, setInboundDate] = useState(new Date().toISOString().split('T')[0]);
  const [inboundTime, setInboundTime] = useState(new Date().toTimeString().slice(0, 5));
  const [creator, setCreator] = useState('收发');
  const [internalCode, setInternalCode] = useState('');
  const [receiver, setReceiver] = useState('');
  const [transporter, setTransporter] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [driver, setDriver] = useState('');
  const [selfCode, setSelfCode] = useState('');
  const [handler, setHandler] = useState('');
  const [handleTime, setHandleTime] = useState(new Date().toLocaleString('zh-CN'));
  
  // 入库明细
  const [inboundDetails, setInboundDetails] = useState<IInboundDetail[]>([]);
  
  // 防抖搜索
  const debouncedProductSearch = useDebounce(productSearch, 300);
  
  // 极简新建产品浮层
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  
  // 语音录入弹窗
  const [voiceInputOpen, setVoiceInputOpen] = useState(false);
  
  // AI图片识别弹窗
  const [aiRecognitionOpen, setAiRecognitionOpen] = useState(false);

  // 入库单信息折叠状态
  const [isInboundInfoExpanded, setIsInboundInfoExpanded] = useState(false);

  const [quickCreateForm, setQuickCreateForm] = useState({
    name: '',
    material: '',
    process: '',
    unit: '件',
    unitPrice: '',
  });

  // 材质和工艺的可选项（从所有产品中提取，并支持动态添加）
  const [materialOptions, setMaterialOptions] = useState<string[]>([]);
  const [processOptions, setProcessOptions] = useState<string[]>([]);

  // 从所有产品中提取材质和工艺选项
  useEffect(() => {
    const materials = new Set<string>();
    const processes = new Set<string>();

    products.forEach((p) => {
      if (p.material?.trim()) {
        materials.add(p.material.trim());
      }
      if (p.process?.trim()) {
        processes.add(p.process.trim());
      }
    });

    setMaterialOptions(Array.from(materials).sort());
    setProcessOptions(Array.from(processes).sort());
  }, [products]);
   
  // 最近入库单（用于撤销）
  const [recentInboundOrders, setRecentInboundOrders] = useState<Array<{
    id: string;
    inboundNo: string;
    createdAt: string;
    canUndo: boolean;
    timeRemaining: number;
    status?: 'active' | 'cancelled';
  }>>([]);
  const [undoCountdowns, setUndoCountdowns] = useState<Record<string, number>>({});
  
  // 错误预防提示
  const [quantityWarning, setQuantityWarning] = useState<{
    show: boolean;
    productName: string;
    quantity: number;
    expectedMax: number;
    severity?: 'warning' | 'error';
  } | null>(null);
  const [similarProducts, setSimilarProducts] = useState<IProduct[]>([]);
  const [showSimilarWarning, setShowSimilarWarning] = useState(false);
  
  // 打印弹窗
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [currentInboundNo, setCurrentInboundNo] = useState('');
  
  // 加载打印模板配置
  const processCardTemplate = useProcessCardTemplate();
  
  // 打印字段值（从模板配置初始化）
  const [printCompanyName, setPrintCompanyName] = useState(processCardTemplate.config.companyName);
  const [printCreator, setPrintCreator] = useState('');
  const [printCustomerConfirm, setPrintCustomerConfirm] = useState('');
  
  // 是否显示打印字段（从模板配置读取）
  const [showCompanyName, setShowCompanyName] = useState(processCardTemplate.config.showCompanyName);
  const [showCreator, setShowCreator] = useState(processCardTemplate.config.showCreator);
  const [showCustomerConfirm, setShowCustomerConfirm] = useState(processCardTemplate.config.showCustomerConfirm);

  // 过滤客户
  const filteredCustomers = customers.filter(c => 
    c.name.includes(customerSearch) || 
    c.code.includes(customerSearch)
  );

  // 过滤产品 - 只显示当前选择客户的产品（使用防抖后的搜索值）
  const filteredProducts = products.filter(p => {
    // 必须属于当前选择的客户
    if (selectedCustomer && p.customerCode !== selectedCustomer.code) {
      return false;
    }
    // 搜索匹配（使用防抖后的值）
    if (!debouncedProductSearch) return true;
    const search = debouncedProductSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(search) || 
      p.material.toLowerCase().includes(search) ||
      p.process.toLowerCase().includes(search) ||
      p.workpieceNo.toLowerCase().includes(search)
    );
  });
  
  // 计算编辑距离（Levenshtein Distance）
  const levenshteinDistance = useCallback((str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    const m = s1.length;
    const n = s2.length;
    
    // 如果任一字符串为空，距离为另一个字符串的长度
    if (m === 0) return n;
    if (n === 0) return m;
    
    // 创建距离矩阵
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // 初始化第一行和第一列
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    // 填充矩阵
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // 删除
          dp[i][j - 1] + 1,      // 插入
          dp[i - 1][j - 1] + cost // 替换
        );
      }
    }
    
    return dp[m][n];
  }, []);

  // 计算相似度（0-1之间）
  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    const distance = levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
  }, [levenshteinDistance]);

  // 检查相似产品（使用编辑距离算法，相似度>70%才提示）
  const checkSimilarProducts = useCallback((name: string): IProduct[] => {
    if (!name || name.length < 2) return [];
    return products.filter(p => {
      if (selectedCustomer && p.customerCode !== selectedCustomer.code) return false;
      // 使用编辑距离计算相似度，阈值70%
      const similarity = calculateSimilarity(name, p.name);
      return similarity > 0.7;
    }).slice(0, 3);
  }, [products, selectedCustomer, calculateSimilarity]);

  // 选择客户
  const handleSelectCustomer = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setCurrentStep(2);
    // 不再弹出 toast，通过步骤切换和界面状态反馈
  };

  // 添加产品到入库明细
  const handleAddProduct = (product: IProduct) => {
    const exists = inboundDetails.find(d => d.productId === product.id);
    if (exists) {
      toast.error('该产品已添加');
      return;
    }

    // 对待完善产品给出提示
    if (product.status === 'incomplete') {
      toast.warning(`产品 "${product.name}" 信息待完善，建议后续补充完整信息`, {
        duration: 4000,
        action: {
          label: '去完善',
          onClick: () => navigate(`/products/${product.id}`),
        },
      });
    }

    const newDetail: IInboundDetail = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      productModel: product.workpieceNo || '',
      productSpec: '',
      unit: product.unit || '件',
      unitPrice: product.unitPrice,
      quantity: 0,
      weight: 0,
      amount: 0,
      inboundType: '正常',
      process: product.process,
      material: product.material,
      techRequirement: product.techRequirement,
      urgent: false,
    };
    setInboundDetails([...inboundDetails, newDetail]);
    setProductDialogOpen(false);
    // 产品已添加，通过界面列表更新反馈，不再弹出 toast
  };

  // 更新入库明细
  const handleUpdateDetail = (id: string, field: keyof IInboundDetail, value: any) => {
    // 入库数量和入库重量不能为负数
    if ((field === 'quantity' || field === 'weight') && value < 0) {
      toast.error('入库数量和入库重量不能为负数');
      return;
    }
    
    // 超量预警检查
    if (field === 'quantity' && value > 1000) {
      const item = inboundDetails.find(d => d.id === id);
      if (item && checkQuantityWarning(item.productName, value)) {
        // 仍然更新值，但显示警告
      }
    }
    
    setInboundDetails(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      // 自动计算金额：单位为件时按数量计算，kg/吨时按重量计算
      if (field === 'quantity' || field === 'weight' || field === 'unitPrice' || field === 'unit') {
        if (updated.unit === '件') {
          updated.amount = updated.quantity * updated.unitPrice;
        } else {
          // kg 或 吨 按重量计算
          updated.amount = updated.weight * updated.unitPrice;
        }
      }
      return updated;
    }));
  };

  // 删除入库明细
  const handleDeleteDetail = (id: string) => {
    setInboundDetails(prev => prev.filter(item => item.id !== id));
  };

  const handlePhotoUpload = async (detailId: string, files: FileList | null) => {
    if (!files?.length) return;
    const current = inboundDetails.find(detail => detail.id === detailId)?.attachments || [];
    const selected = Array.from(files).slice(0, Math.max(0, 3 - current.length));
    if (selected.some(file => !file.type.startsWith('image/') || file.size > 2 * 1024 * 1024)) {
      toast.error('仅支持图片，每张不超过2MB，单个产品最多3张');
      return;
    }
    const encoded = await Promise.all(selected.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    setInboundDetails(details => details.map(detail => detail.id === detailId
      ? { ...detail, attachments: [...(detail.attachments || []), ...encoded].slice(0, 3) }
      : detail));
  };

  const handleInboundListImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      let rows: Record<string, unknown>[] = [];
      if (file.name.toLowerCase().endsWith('.txt') || file.type.startsWith('text/')) {
        rows = (await file.text()).split(/\r?\n/).filter(Boolean).map(line => {
          const [product, quantity, weight] = line.split(/[\t,，]/).map(value => value.trim());
          return { 产品: product, 数量: quantity, 重量: weight };
        });
      } else {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      }
      const pick = (row: Record<string, unknown>, aliases: string[]) => {
        const key = Object.keys(row).find(item => aliases.some(alias => item.trim().toLowerCase() === alias.toLowerCase()));
        return key ? row[key] : undefined;
      };
      let imported = 0;
      const missing: string[] = [];
      setInboundDetails(current => {
        const next = [...current];
        rows.forEach((row, index) => {
          const productKey = String(pick(row, ['产品', '产品编码', '产品编号', '产品名称', 'product', 'code', 'name']) || '').trim();
          if (!productKey) return;
          const matched = products.find(product => product.code === productKey || product.name === productKey);
          if (!matched || (selectedCustomer && matched.customerCode !== selectedCustomer.code)) {
            missing.push(productKey);
            return;
          }
          const quantity = Math.max(0, Math.trunc(Number(pick(row, ['数量', '入库数量', 'quantity']) || 0)));
          const weight = Math.max(0, Number(pick(row, ['重量', '入库重量', 'weight', 'kg']) || 0));
          const existingIndex = next.findIndex(detail => detail.productId === matched.id);
          if (existingIndex >= 0) {
            const existing = next[existingIndex];
            const mergedQuantity = existing.quantity + quantity;
            const mergedWeight = existing.weight + weight;
            next[existingIndex] = {
              ...existing,
              quantity: mergedQuantity,
              weight: mergedWeight,
              amount: matched.unit === '件' ? mergedQuantity * matched.unitPrice : mergedWeight * matched.unitPrice,
            };
          } else {
            next.push({
              id: `import-${Date.now()}-${index}`,
              productId: matched.id,
              productName: matched.name,
              productModel: matched.workpieceNo || '',
              productSpec: '', unit: matched.unit || '件', unitPrice: matched.unitPrice,
              quantity, weight,
              amount: matched.unit === '件' ? quantity * matched.unitPrice : weight * matched.unitPrice,
              inboundType: '正常', process: matched.process, material: matched.material,
              techRequirement: matched.techRequirement, urgent: false,
            });
          }
          imported += 1;
        });
        return next;
      });
      if (missing.length) toast.warning(`未匹配产品，已跳过：${[...new Set(missing)].slice(0, 8).join('、')}`);
      if (imported) toast.success(`已导入 ${imported} 行产品清单`);
      else toast.error('清单中没有可导入的产品');
    } catch (error) {
      logger.error('导入入库清单失败', error);
      toast.error('清单解析失败，请检查 Excel 或文本格式');
    }
  };
  
  // 处理语音录入结果
  const handleVoiceInputApply = async (data: NonNullable<VoiceParseResult['data']>) => {
    if (!selectedCustomer) {
      toast.error('请先选择客户');
      return;
    }
    
    if (!data.productName) {
      toast.error('语音中未识别到产品名称');
      return;
    }
    
    // 查找是否已存在该产品
    let product = products.find(p => 
      p.customerCode === selectedCustomer.code && 
      p.name === data.productName
    );
    
    // 验证必填字段
    if (!data.unit) {
      toast.error('语音中未识别到计价单位');
      return;
    }
    if (data.unitPrice === undefined || data.unitPrice === null) {
      toast.error('语音中未识别到单价');
      return;
    }
    
    // 如果不存在，自动创建新产品
    if (!product) {
      try {
        const code = `P${Date.now().toString().slice(-6)}`;
        product = await addProduct({
          code,
          name: data.productName,
          material: data.material || '',
          process: data.process || '',
          techRequirement: '',
          workpieceNo: '',
          unit: data.unit,
          unitPrice: data.unitPrice,
          customerCode: selectedCustomer.code,
          customerName: selectedCustomer.name,
          status: 'incomplete',
        });
        toast.success(`已自动创建新产品：${data.productName}`);
      } catch (error) {
        toast.error('创建产品失败');
        return;
      }
    }
    
    // 添加入库明细
    const newDetail: IInboundDetail = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      productModel: product.workpieceNo || '',
      productSpec: '',
      unit: data.unit || product.unit || '件',
      unitPrice: data.unitPrice ?? product.unitPrice ?? 0,
      quantity: data.quantity || 0,
      weight: data.weight || 0,
      amount: 0,
      inboundType: '正常',
      process: data.process || product.process,
      material: data.material || product.material,
      techRequirement: product.techRequirement,
      urgent: data.remark?.includes('加急') || false,
    };
    
    // 计算金额
    if (newDetail.unit === '件') {
      newDetail.amount = newDetail.quantity * newDetail.unitPrice;
    } else {
      newDetail.amount = newDetail.weight * newDetail.unitPrice;
    }
    
    setInboundDetails(prev => [...prev, newDetail]);
    setVoiceInputOpen(false);
    // 语音录入成功，通过界面更新反馈
  };
  
  // 处理AI图片识别结果
  const handleAIRecognitionApply = async (data: AIRecognitionResult) => {
    if (!selectedCustomer) {
      toast.error('请先选择客户');
      return;
    }
    
    if (!data.产品名称) {
      toast.error('识别结果中未包含产品名称');
      return;
    }
    
    // 查找是否已存在该产品
    let product = products.find(p => 
      p.customerCode === selectedCustomer.code && 
      p.name === data.产品名称
    );
    
    // 如果不存在，自动创建新产品
    if (!product) {
      try {
        const code = `P${Date.now().toString().slice(-6)}`;
        product = await addProduct({
          code,
          name: data.产品名称,
          material: data.材质 || '',
          process: data.工艺 || '',
          techRequirement: data.技术要求 || '',
          workpieceNo: data.工件编号 || '',
          unit: data.单位 || '件',
          unitPrice: 0, // AI识别不返回价格，需要后续补充
          customerCode: selectedCustomer.code,
          customerName: selectedCustomer.name,
          status: 'incomplete',
        });
        toast.success(`已自动创建新产品：${data.产品名称}`);
      } catch (error) {
        toast.error('创建产品失败');
        return;
      }
    }
    
    // 添加入库明细
    const newDetail: IInboundDetail = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      productModel: product.workpieceNo || '',
      productSpec: '',
      unit: data.单位 || product.unit || '件',
      unitPrice: product.unitPrice || 0,
      quantity: 0, // AI识别不返回数量，需要手动输入
      weight: 0,
      amount: 0,
      inboundType: '正常',
      process: data.工艺 || product.process,
      material: data.材质 || product.material,
      techRequirement: data.技术要求 || product.techRequirement,
      urgent: false,
    };
    
    setInboundDetails(prev => [...prev, newDetail]);
    setAiRecognitionOpen(false);
    // AI识别成功，通过界面更新反馈
  };
  
  // 极简新建产品（仅3个字段）
  const handleQuickCreateProduct = async () => {
    if (!selectedCustomer) {
      toast.error('请先选择客户');
      return;
    }
    if (!quickCreateForm.name.trim()) {
      toast.error('请输入产品名称');
      return;
    }
    if (!quickCreateForm.unit) {
      toast.error('请选择计价单位');
      return;
    }
    if (!quickCreateForm.unitPrice || parseFloat(quickCreateForm.unitPrice) <= 0) {
      toast.error('请输入有效的单价');
      return;
    }
    
    // 检查相似产品
    const similar = checkSimilarProducts(quickCreateForm.name);
    if (similar.length > 0) {
      setSimilarProducts(similar);
      setShowSimilarWarning(true);
      return;
    }
    
    // 生成产品编号
    const code = `P${Date.now().toString().slice(-6)}`;
    
    try {
      const newProduct = await addProduct({
        code,
        name: quickCreateForm.name.trim(),
        material: quickCreateForm.material.trim(),
        process: quickCreateForm.process.trim(),
        techRequirement: '',
        workpieceNo: '',
        unit: quickCreateForm.unit,
        unitPrice: parseFloat(quickCreateForm.unitPrice) || 0,
        customerCode: selectedCustomer.code,
        customerName: selectedCustomer.name,
        status: 'incomplete', // 快速创建的产品标记为信息待完善
      } as Omit<IProduct, 'id' | 'stock' | 'inboundQuantity' | 'inboundWeight' | 'inboundDate' | 'batchNo'>);
      
      // 自动添加到入库明细
      handleAddProduct(newProduct);
      
      // 重置表单
      setQuickCreateForm({ name: '', material: '', process: '', unit: '件', unitPrice: '' });
      setQuickCreateOpen(false);
      toast.success('产品创建成功并已添加到入库单');
    } catch (error: any) {
      toast.error(error.message || '创建产品失败');
    }
  };
  
  // 确认创建（忽略相似产品警告）
  const confirmCreateProduct = () => {
    setShowSimilarWarning(false);
    // 直接创建
    const code = `P${Date.now().toString().slice(-6)}`;
    if (selectedCustomer) {
      addProduct({
        code,
        name: quickCreateForm.name.trim(),
        material: quickCreateForm.material.trim(),
        process: quickCreateForm.process.trim(),
        techRequirement: '',
        workpieceNo: '',
        unit: quickCreateForm.unit,
        unitPrice: parseFloat(quickCreateForm.unitPrice) || 0,
        customerCode: selectedCustomer.code,
        customerName: selectedCustomer.name,
        status: 'incomplete',
      } as Omit<IProduct, 'id' | 'stock' | 'inboundQuantity' | 'inboundWeight' | 'inboundDate' | 'batchNo'>).then(newProduct => {
        handleAddProduct(newProduct);
        setQuickCreateForm({ name: '', material: '', process: '', unit: '件', unitPrice: '' });
        setQuickCreateOpen(false);
        toast.success('产品创建成功并已添加到入库单');
      });
    }
  };
  
  // 检查入库数量是否异常
  const checkQuantityWarning = (productName: string, quantity: number) => {
    // 如果单次入库超过10000件，增加二次确认（严重异常）
    if (quantity > 10000) {
      setQuantityWarning({
        show: true,
        productName,
        quantity,
        expectedMax: 10000,
        severity: 'error' as const,
      });
      return true;
    }
    // 如果单次入库超过1000件，提示确认（一般预警）
    if (quantity > 1000) {
      setQuantityWarning({
        show: true,
        productName,
        quantity,
        expectedMax: 1000,
        severity: 'warning' as const,
      });
      return true;
    }
    return false;
  };

  // 保存入库单并打印 - 创建入库单、更新库存、打开打印弹窗
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndPrint = async () => {
    if (inboundDetails.length === 0) {
      toast.error('请至少添加一个产品');
      return;
    }
    // 验证逻辑：计价单位为"件"时必须填写数量；为"kg"时必须填写重量
    for (const detail of inboundDetails) {
      if (detail.unit === '件' && detail.quantity <= 0) {
        toast.error(`${detail.productName}：计价单位为"件"，必须填写入库数量`);
        return;
      }
      if (detail.unit === 'kg' && detail.weight <= 0) {
        toast.error(`${detail.productName}：计价单位为"kg"，必须填写入库重量`);
        return;
      }
    }

    // 防止重复提交
    if (isSaving) return;
    setIsSaving(true);

    // 创建入库单记录（单号由后端生成）
    if (selectedCustomer) {
      try {
      const newOrder = await addInboundOrder({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerCode: selectedCustomer.code,
        inboundDate,
        inboundTime,
        creator,
        internalCode,
        receiver,
        transporter,
        plateNumber,
        driver,
        selfCode,
        handler,
        handleTime,
        details: inboundDetails,
        totalQuantity: inboundDetails.reduce((sum, d) => sum + d.quantity, 0),
        totalWeight: inboundDetails.reduce((sum, d) => sum + d.weight, 0),
        totalAmount: inboundDetails.reduce((sum, d) => sum + d.amount, 0),
      });
      
      // 保存后端生成的单号
      setCurrentInboundNo(newOrder.inboundNo);
      
      // 添加到最近入库单列表
      const orderInfo = {
        id: newOrder.id,
        inboundNo: newOrder.inboundNo,
        createdAt: newOrder.createdAt,
        canUndo: true,
        timeRemaining: 5 * 60 * 1000, // 5分钟
        status: 'active' as const,
      };
      setRecentInboundOrders(prev => [orderInfo, ...prev].slice(0, 5));
      setUndoCountdowns(prev => ({ ...prev, [newOrder.id]: 5 * 60 * 1000 }));
      
      toast.success(`入库单 ${newOrder.inboundNo} 保存成功，库存已更新`);
      setPrintDialogOpen(true);
      } catch (error) {
        toast.error('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsSaving(false);
    }
  };

  // 关闭打印弹窗 - 关闭弹窗并返回初始状态
  const handleClosePrintDialog = () => {
    setPrintDialogOpen(false);
    // 确保清除草稿状态，避免下次进入页面时提示恢复
    clearDraft();
    handleBackToCustomer();
    toast.success('入库流程完成');
  };

  // 返回客户选择
  const handleBackToCustomer = () => {
    setCurrentStep(1);
    setSelectedCustomer(null);
    setInboundDetails([]);
    // 清除草稿，避免残留状态导致下次提示
    clearDraft();
  };

  // 客户表格列
  const customerColumns: any = [
    { title: '序号', dataIndex: 'id', key: 'id', width: 60, render: (_: unknown, __: ICustomer, index: number) => index + 1 },
    { 
      title: '操作', 
      key: 'action', 
      width: 80,
      render: (_: unknown, record: ICustomer) => (
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90"
          onClick={() => handleSelectCustomer(record)}
        >
          入库
        </Button>
      )
    },
    { title: '客户名称', dataIndex: 'name', key: 'name' },
    { title: '客户编号', dataIndex: 'code', key: 'code', width: 100 },

    { title: '付款期', dataIndex: 'paymentTerm', key: 'paymentTerm', width: 80 },

    { title: '运输方式', dataIndex: 'transport', key: 'transport', width: 100 },
    { title: '入库频次', dataIndex: 'inboundCount', key: 'inboundCount', width: 100 },
    { title: '送货方向', dataIndex: 'deliveryDirection', key: 'deliveryDirection', width: 100 },
    { title: '结算方式', dataIndex: 'settlement', key: 'settlement', width: 100 },
    { title: '客户分类', dataIndex: 'category', key: 'category', width: 100 },
  ];

  // 产品选择表格列
  const productColumns: any = [
    { title: '序号', dataIndex: 'id', key: 'id', width: 60, render: (_: unknown, __: IProduct, index: number) => index + 1 },
    { title: '产品名称', dataIndex: 'name', key: 'name', width: 140, ellipsis: true },
    { title: '客户编码', dataIndex: 'customerCode', key: 'customerCode', width: 100 },
    { title: '客户名称', dataIndex: 'customerName', key: 'customerName', width: 120 },
    { title: '加工工艺', dataIndex: 'process', key: 'process', width: 120 },
    { title: '材质', dataIndex: 'material', key: 'material', width: 100 },
    { title: '技术要求内容', dataIndex: 'techRequirement', key: 'techRequirement', width: 200 },
    { title: '工件编号', dataIndex: 'workpieceNo', key: 'workpieceNo', width: 100 },
    { title: '计价单位', dataIndex: 'unit', key: 'unit', width: 90, render: (v: string | undefined) => <span className="font-medium text-primary">{v || '件'}</span> },
    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 80, render: (v: number | undefined) => `¥${v?.toFixed(2) || '0.00'}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: ProductStatus, record: IProduct) => (
        status === 'incomplete' ? (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 cursor-pointer" title="产品信息待完善">
            待完善
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">已完善</Badge>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: IProduct) => (
        <Button
          size="sm"
          variant={record.status === 'incomplete' ? 'secondary' : 'outline'}
          className={record.status === 'incomplete' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200' : ''}
          onClick={() => handleAddProduct(record)}
        >
          {record.status === 'incomplete' ? '添加(待完善)' : '添加'}
        </Button>
      )
    },
  ];

  // 本地暂存相关
  const STORAGE_KEY = 'inbound_draft';
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<any>(null);
  
  // 页面加载时检查是否有草稿 - 显示确认弹窗
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        // 检查草稿是否过期（24小时）
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          // 显示确认弹窗，让用户确认是否恢复
          setPendingDraft(draft);
          setDraftConfirmOpen(true);
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
        inboundDetails,
        inboundDate,
        inboundTime,
        creator,
        receiver,
        transporter,
        plateNumber,
        driver,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [currentStep, selectedCustomer, inboundDetails, inboundDate, inboundTime, creator, receiver, transporter, plateNumber, driver]);
  
  // 恢复草稿
  const restoreDraft = (draft: any, silent = false) => {
    setCurrentStep(draft.currentStep);
    setSelectedCustomer(draft.selectedCustomer);
    setInboundDetails(draft.inboundDetails || []);
    setInboundDate(draft.inboundDate || new Date().toISOString().split('T')[0]);
    setInboundTime(draft.inboundTime || new Date().toTimeString().slice(0, 5));
    setCreator(draft.creator || '收发');
    setReceiver(draft.receiver || '');
    setTransporter(draft.transporter || '');
    setPlateNumber(draft.plateNumber || '');
    setDriver(draft.driver || '');
    setHasDraft(false);
    if (!silent) {
      toast.success('已恢复草稿');
    }
  };

  // 确认恢复草稿
  const confirmRestoreDraft = () => {
    if (pendingDraft) {
      restoreDraft(pendingDraft, false);
      setDraftConfirmOpen(false);
      setShowDraftBanner(true);
      setDraftTimestamp(pendingDraft.timestamp);
      setPendingDraft(null);
    }
  };

  // 取消恢复草稿
  const cancelRestoreDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDraftConfirmOpen(false);
    setPendingDraft(null);
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

  // 步骤定义
  const inboundSteps: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'customer', label: '选择客户', icon: Building2 },
    { key: 'info', label: '填写入库信息', icon: ClipboardList },
  ];

  // 处理步骤点击
  const handleStepClick = (index: number) => {
    // 只允许返回已完成的步骤
    if (index < currentStep - 1) {
      setCurrentStep(index + 1);
    }
  };

  // 撤销倒计时Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setUndoCountdowns(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        Object.keys(updated).forEach(key => {
          if (updated[key] > 0) {
            updated[key] = Math.max(0, updated[key] - 1000);
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 根据模板配置渲染单元格内容
  const renderFieldValue = (field: ITemplateField, detail: IInboundDetail, index: number, customerCode: string) => {
    switch (field.id) {
      case 'seq': return index + 1;
      case 'customerCode': return customerCode;
      case 'productName': return detail.productName;
      case 'workpieceNo': return detail.productModel || '-';
      case 'unit': return detail.unit;
      case 'unitPrice': return detail.unitPrice.toFixed(2);
      case 'quantity': return detail.quantity;
      case 'weight': return detail.weight || '-';
      case 'amount': return detail.amount.toFixed(2);
      case 'inboundType': return detail.inboundType;
      case 'process': return detail.process || '-';
      case 'material': return detail.material || '-';
      case 'techRequirement': return detail.techRequirement || '-';
      default: return '-';
    }
  };

  // 打印预览内容 - 使用模板配置
  const PrintPreview = () => {
    const config = processCardTemplate.config;
    const visibleFields = config.fields.filter(f => f.visible);
    
    return (
      <div id="print-preview-content" style={{ 
        padding: `${config.marginTop}mm ${config.marginRight}mm ${config.marginBottom}mm ${config.marginLeft}mm`, 
        backgroundColor: 'var(--print-bg, #ffffff)', 
        color: 'var(--print-text, #000000)',
        fontFamily: 'SimSun, Songti SC, serif',
        minHeight: '180mm',
        boxSizing: 'border-box',
        fontSize: `${config.fontSize}pt`
      }}>
        {/* 公司名称 - 顶部居中 */}
        {showCompanyName && printCompanyName && (
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', letterSpacing: '2px' }}>{printCompanyName}</h1>
          </div>
        )}

        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px solid #333', paddingBottom: '6px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>热处理流程卡</h2>
        </div>

        {/* 基本信息表格 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${config.fontSize}pt`, marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #666', padding: '5px', width: '80px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>客户名称</td>
              <td style={{ border: '1px solid #666', padding: '5px' }} colSpan={3}>{selectedCustomer?.name || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #666', padding: '5px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center' }}>客户编码</td>
              <td style={{ border: '1px solid #666', padding: '5px', width: '100px' }}>{selectedCustomer?.code || ''}</td>
              <td style={{ border: '1px solid #666', padding: '5px', backgroundColor: 'var(--print-header-bg, #f5f5f5)', fontWeight: 'bold', textAlign: 'center', width: '70px' }}>入库日期</td>
              <td style={{ border: '1px solid #666', padding: '5px', width: '80px' }}>{inboundDate || ''}</td>
            </tr>
          </tbody>
        </table>

        {inboundDetails.some(detail => (detail.attachments?.length || 0) > 0) && (
          <div style={{ marginTop: '10px', pageBreakInside: 'avoid' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>产品现场图片</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {inboundDetails.flatMap((detail, detailIndex) =>
                (detail.attachments || []).map((src, imageIndex) => (
                  <figure key={`${detail.id}-${imageIndex}`} style={{ margin: 0, width: '82px' }}>
                    <img
                      src={src}
                      alt={`${detail.productName}现场图片${imageIndex + 1}`}
                      style={{ width: '82px', height: '62px', objectFit: 'cover', border: '1px solid #666' }}
                    />
                    <figcaption style={{ fontSize: '8pt', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {detailIndex + 1}. {detail.productName}
                    </figcaption>
                  </figure>
                )),
              )}
            </div>
          </div>
        )}

        {/* 产品明细表格 - 动态字段 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${config.fontSize}pt`, marginBottom: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--print-table-header-bg, #f0f0f0)' }}>
              {visibleFields.map(field => (
                <th 
                  key={field.id}
                  style={{ 
                    border: '1px solid #666', 
                    padding: '4px', 
                    textAlign: field.align, 
                    fontWeight: 'bold',
                    width: field.width ? `${field.width}px` : 'auto'
                  }}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inboundDetails.slice(0, 8).map((detail, index) => (
              <tr key={detail.id}>
                {visibleFields.map(field => (
                  <td 
                    key={field.id}
                    style={{ 
                      border: '1px solid #666', 
                      padding: '4px', 
                      textAlign: field.align 
                    }}
                  >
                    {renderFieldValue(field, detail, index, selectedCustomer?.code || '')}
                  </td>
                ))}
              </tr>
            ))}
            {inboundDetails.length > 8 && (
              <tr>
                <td style={{ border: '1px solid #666', padding: '4px', textAlign: 'center' }}>...</td>
                <td style={{ border: '1px solid #666', padding: '4px', textAlign: 'center' }} colSpan={visibleFields.length - 1}>
                  共 {inboundDetails.length} 条记录
                </td>
              </tr>
            )}
          </tbody>
          {/* 合计行 */}
          <tfoot>
            <tr style={{ backgroundColor: 'var(--print-table-footer-bg, #f5f5f5)', fontWeight: 'bold' }}>
              {visibleFields.map((field, idx) => {
                if (field.id === 'seq') return <td key={field.id} style={{ border: '1px solid #666', padding: '4px', textAlign: 'center' }}>合计</td>;
                if (field.id === 'quantity') return <td key={field.id} style={{ border: '1px solid #666', padding: '4px', textAlign: field.align }}>{inboundDetails.reduce((sum, d) => sum + d.quantity, 0)}</td>;
                if (field.id === 'amount') return <td key={field.id} style={{ border: '1px solid #666', padding: '4px', textAlign: field.align }}>{inboundDetails.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}</td>;
                return <td key={field.id} style={{ border: '1px solid #666', padding: '4px' }}></td>;
              })}
            </tr>
          </tfoot>
        </table>

        {/* 签名区域 - 底部 */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: `${config.fontSize}pt` }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>打印时间：</span>
            <span>{new Date().toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* 步骤进度条 */}
      <div className="rounded-lg border bg-card p-6">
        <StepProgress
          steps={inboundSteps}
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
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 1200 }}
              size="middle"
            />
          </CardContent>
        </Card>
      )}

      {/* 步骤2&3：入库单信息 */}
      {currentStep === 2 && selectedCustomer && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                入库单信息
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
          
          {/* 撤销倒计时面板 - 显示最近5个入库单（含已撤销） */}
          {recentInboundOrders.length > 0 && (
            <div className="px-6 py-3 bg-amber-50 border-y border-amber-200">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-amber-800">最近入库单：</span>
                {recentInboundOrders.map(order => {
                  const countdown = undoCountdowns[order.id] || 0;
                  const canUndo = countdown > 0 && order.status !== 'cancelled';
                  const isCancelled = order.status === 'cancelled';
                  return (
                    <div 
                      key={order.id} 
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        isCancelled 
                          ? 'bg-gray-100 text-gray-400 opacity-60' 
                          : canUndo 
                            ? 'bg-white border border-amber-300' 
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <span className="font-medium">{order.inboundNo}</span>
                      {isCancelled ? (
                        <span className="text-xs text-red-500">已撤销</span>
                      ) : canUndo ? (
                        <>
                          <span className="text-amber-600 font-mono">
                            {formatCountdown(countdown)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              const success = await cancelInboundOrder(order.id, '用户撤销');
                              if (success) {
                                // 撤销成功后更新状态为已撤销（置灰显示）
                                setRecentInboundOrders(prev => 
                                  prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' as const } : o)
                                );
                              }
                            }}
                          >
                            撤销
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs">已过期</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <CardContent className="space-y-4">
            {/* 基本信息表单 - 折叠设计 */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              {/* 始终显示的字段：客户名称、入库日期、入库时间、制单人 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">客户名称</Label>
                  <Input value={selectedCustomer.name} readOnly className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">入库日期</Label>
                  <Input type="date" value={inboundDate} onChange={(e) => setInboundDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">入库时间</Label>
                  <Input type="time" value={inboundTime} onChange={(e) => setInboundTime(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">制单人</Label>
                  <Input value={creator} onChange={(e) => setCreator(e.target.value)} />
                </div>
              </div>

              {/* 折叠展开的其他字段 */}
              <Collapsible open={isInboundInfoExpanded} onOpenChange={setIsInboundInfoExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <span>{isInboundInfoExpanded ? '收起' : '展开更多'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isInboundInfoExpanded ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border/50">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">内勤</Label>
                      <Input value={internalCode} onChange={(e) => setInternalCode(e.target.value)} placeholder="内勤" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">开单(收货)人</Label>
                      <Input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="开单(收货)人" />
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

            {/* 操作栏 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setProductDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  添加产品
                </Button>
                <label className="inline-flex h-10 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium cursor-pointer hover:bg-muted">
                  <Download className="w-4 h-4" />
                  导入清单
                  <input type="file" accept=".xlsx,.xls,.csv,.txt,text/plain" className="hidden" onChange={(event) => { void handleInboundListImport(event.target.files?.[0]); event.currentTarget.value = ''; }} />
                </label>
                <Button
                  variant="outline"
                  onClick={() => setVoiceInputOpen(true)}
                  className="gap-2"
                >
                  <Mic className="w-4 h-4" />
                  语音录入
                </Button>
              </div>
            </div>

            {/* 入库明细表格 */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left text-xs font-medium">序号</th>
                    <th className="p-2 text-left text-xs font-medium">操作</th>
                    <th className="p-2 text-left text-xs font-medium">客户编码</th>
                    <th className="p-2 text-left text-xs font-medium">产品名称</th>
                    <th className="p-2 text-left text-xs font-medium">工件编号</th>
                    <th className="p-2 text-left text-xs font-medium">计价单位</th>
                    <th className="p-2 text-left text-xs font-medium">单价</th>
                    <th className="p-2 text-left text-xs font-medium">入库数量(件)</th>
                    <th className="p-2 text-left text-xs font-medium">入库重量(kg)</th>
                    <th className="p-2 text-left text-xs font-medium">入库金额</th>
                    <th className="p-2 text-left text-xs font-medium">入库类型</th>
                    <th className="p-2 text-left text-xs font-medium">加工工艺</th>
                    <th className="p-2 text-left text-xs font-medium">产品图片</th>
                    <th className="p-2 text-left text-xs font-medium">技术要求</th>
                  </tr>
                </thead>
                <tbody>
                  {inboundDetails.map((detail, index) => (
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
                      <td className="p-2 text-sm">{selectedCustomer.code}</td>
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
                          {detail.productModel || <span className="text-muted-foreground/50 italic">-</span>}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm font-medium">{detail.unit}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm font-medium">¥{detail.unitPrice?.toFixed(2) || '0.00'}</span>
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number"
                          className="w-20 h-8 text-sm"
                          value={detail.quantity || ''}
                          onChange={(e) => handleUpdateDetail(detail.id, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number"
                          className="w-20 h-8 text-sm"
                          value={detail.weight || ''}
                          onChange={(e) => handleUpdateDetail(detail.id, 'weight', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-2 text-sm font-medium">{detail.amount.toFixed(2)}</td>
                      <td className="p-2">
                        <Select value={detail.inboundType} onValueChange={(v) => handleUpdateDetail(detail.id, 'inboundType', v)}>
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="正常">正常</SelectItem>
                            <SelectItem value="返工">返工</SelectItem>
                            <SelectItem value="退货">退货</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <span className="text-sm text-muted-foreground">
                          {detail.process || <span className="text-muted-foreground/50 italic">-</span>}
                        </span>
                      </td>
                      <td className="p-2 min-w-36">
                        <div className="flex items-center gap-1">
                          {(detail.attachments || []).map((src, imageIndex) => (
                            <button key={imageIndex} type="button" className="relative" onClick={() => setInboundDetails(items => items.map(item => item.id === detail.id ? { ...item, attachments: item.attachments?.filter((_, index) => index !== imageIndex) } : item))} title="点击删除图片">
                              <img src={src} alt={`${detail.productName} ${imageIndex + 1}`} className="w-10 h-10 rounded object-cover border" />
                            </button>
                          ))}
                          {(detail.attachments?.length || 0) < 3 && (
                            <label className="w-10 h-10 rounded border border-dashed flex items-center justify-center cursor-pointer hover:bg-muted" title="拍照或选择图片">
                              <ImagePlus className="w-4 h-4" />
                              <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(event) => { void handlePhotoUpload(detail.id, event.target.files); event.currentTarget.value = ''; }} />
                            </label>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground max-w-xs truncate">{detail.techRequirement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inboundDetails.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>请添加产品</p>
                </div>
              )}
            </div>

            {/* 合计信息 */}
            {inboundDetails.length > 0 && (
              <div className="flex justify-end gap-8 p-4 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">合计数量：</span>
                  <span className="font-medium">{inboundDetails.reduce((sum, d) => sum + d.quantity, 0)} 件</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">合计金额：</span>
                  <span className="font-medium text-primary">¥{inboundDetails.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* 操作提示 */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                提示：根据计价单位填写入库数量或重量，保存完成入库登记。入库完成后可直接打印现场标示卡。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 产品选择 - 改为 Sheet 抽屉 */}
      <Sheet open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="px-4 sm:px-6 py-4 border-b">
            <SheetTitle>选择产品</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6 space-y-4" data-ai-section-type="card-list">
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索产品名称/材质/加工工艺"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* 语音录入 */}
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 border-blue-200 hover:bg-blue-50"
                onClick={() => setVoiceInputOpen(true)}
                title="语音录入"
              >
                <Mic className="w-4 h-4 text-blue-500" />
              </Button>
              {/* 实验功能：AI图片识别 */}
              {featureConfig.aiRecognition.enabled && (
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-purple-200 hover:bg-purple-50"
                  onClick={() => setAiRecognitionOpen(true)}
                  title="AI图片识别"
                >
                  <Brain className="w-4 h-4 text-purple-500" />
                </Button>
              )}
            </div>
            {/* 极简新建产品 - 可展开面板 */}
            <div className="shrink-0 border rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">未找到产品？</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setQuickCreateOpen(!quickCreateOpen)}
                  className="text-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {quickCreateOpen ? '收起' : '快速新建'}
                </Button>
              </div>
              {quickCreateOpen && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">产品名称 <span className="text-red-500">*</span></Label>
                      <Input 
                        placeholder="如：齿轮"
                        value={quickCreateForm.name}
                        onChange={(e) => {
                          setQuickCreateForm(prev => ({ ...prev, name: e.target.value }));
                          // 实时检查相似产品
                          const similar = checkSimilarProducts(e.target.value);
                          setSimilarProducts(similar);
                        }}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">计价单位 <span className="text-red-500">*</span></Label>
                      <Select
                        value={quickCreateForm.unit}
                        onValueChange={(value) => setQuickCreateForm(prev => ({ ...prev, unit: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="选择单位" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="件">件</SelectItem>
                          <SelectItem value="kg">千克 (kg)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">材质</Label>
                      <EditableSelect
                        value={quickCreateForm.material}
                        onChange={(value) => setQuickCreateForm(prev => ({ ...prev, material: value }))}
                        options={materialOptions}
                        onOptionsChange={setMaterialOptions}
                        placeholder="如：40Cr"
                        inputPlaceholder="请输入材质"
                        searchPlaceholder="搜索或输入材质..."
                        addText={(v) => `添加 "${v}"`}
                        className="w-full"
                        inputClassName="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">工艺</Label>
                      <EditableSelect
                        value={quickCreateForm.process}
                        onChange={(value) => setQuickCreateForm(prev => ({ ...prev, process: value }))}
                        options={processOptions}
                        onOptionsChange={setProcessOptions}
                        placeholder="如：淬火"
                        inputPlaceholder="请输入工艺"
                        searchPlaceholder="搜索或输入工艺..."
                        addText={(v) => `添加 "${v}"`}
                        className="w-full"
                        inputClassName="h-9"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">单价 <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        placeholder="请输入单价"
                        value={quickCreateForm.unitPrice}
                        onChange={(e) => setQuickCreateForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                  </div>
                  {/* 相似产品提示 */}
                  {similarProducts.length > 0 && quickCreateForm.name.length >= 2 && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                      <p className="text-amber-800 mb-1">发现相似产品，请确认是否重复：</p>
                      <ul className="space-y-1">
                        {similarProducts.map(p => (
                          <li key={p.id} className="text-amber-700 flex items-center gap-2">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs">({p.material} / {p.process})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleQuickCreateProduct} className="bg-primary">
                      <Plus className="w-4 h-4 mr-1" />
                      创建并添加
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto min-h-0">
              <Table
                columns={productColumns}
                dataSource={filteredProducts}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: 900 }}
                size="middle"
              />
            </div>
          </div>
          <div className="px-4 sm:px-6 py-4 border-t flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
              关闭
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 打印预览 - 改为 Sheet 抽屉 */}
      <Sheet open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              入库成功 - 打印现场标识卡
            </SheetTitle>
          </SheetHeader>
          
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
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t no-print">
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
                  inboundDetails,
                  [
                    { title: '产品名称', dataIndex: 'productName', key: 'productName' },
                    { title: '工件编号', dataIndex: 'productModel', key: 'productModel' },
                    { title: '计价单位', dataIndex: 'unit', key: 'unit' },
                    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice' },
                    { title: '入库数量', dataIndex: 'quantity', key: 'quantity' },
                    { title: '入库重量', dataIndex: 'weight', key: 'weight' },
                    { title: '入库金额', dataIndex: 'amount', key: 'amount' },
                    { title: '入库类型', dataIndex: 'inboundType', key: 'inboundType' },
                    { title: '加工工艺', dataIndex: 'process', key: 'process' },
                  ],
                  {
                    filename: `入库明细_${inboundDate}`,
                    sheetName: '入库明细',
                    title: `产品流程卡 - ${selectedCustomer?.name}`,
                    headers: {
                      '客户名称': selectedCustomer?.name || '',
                      '入库日期': inboundDate,
                      '入库时间': inboundTime,
                      '制单人': creator,
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
                smartPrint('print-preview-content', '热处理流程卡').catch(() => undefined);
              }, 500);
            }}>
              <Printer className="w-4 h-4 mr-2" />
              打印标识卡
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* 超量预警Dialog */}
      <Dialog open={quantityWarning?.show || false} onOpenChange={() => setQuantityWarning(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${quantityWarning?.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
              <Package className="w-5 h-5" />
              {quantityWarning?.severity === 'error' ? '严重数量异常警告' : '入库数量异常提醒'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              产品 <span className="font-medium text-foreground">{quantityWarning?.productName}</span> 的入库数量为{' '}
              <span className={`font-medium ${quantityWarning?.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>{quantityWarning?.quantity}</span> 件，
              超过常规单次入库量（{quantityWarning?.expectedMax}件）。
            </p>
            <div className={`p-3 border rounded text-sm ${quantityWarning?.severity === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              {quantityWarning?.severity === 'error' 
                ? '数量严重异常！请仔细核对，确认无误后方可继续。如为误操作，请返回修改。' 
                : '请确认数量是否正确，避免录入错误。'}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setQuantityWarning(null)}>
                返回修改
              </Button>
              <Button 
                className={quantityWarning?.severity === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}
                onClick={() => setQuantityWarning(null)}
              >
                {quantityWarning?.severity === 'error' ? '已仔细核对，确认保存' : '确认无误，继续保存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 相似产品确认Dialog */}
      <Dialog open={showSimilarWarning} onOpenChange={() => setShowSimilarWarning(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Package className="w-5 h-5" />
              发现相似产品
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              系统中已存在以下相似产品，请确认是否重复创建：
            </p>
            <div className="space-y-2">
              {similarProducts.map(p => (
                <div key={p.id} className="p-3 bg-muted rounded flex items-center justify-between">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {p.material} / {p.process}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      handleAddProduct(p);
                      setShowSimilarWarning(false);
                      setQuickCreateOpen(false);
                    }}
                  >
                    选择此产品
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSimilarWarning(false)}>
                取消
              </Button>
              <Button 
                className="bg-primary"
                onClick={confirmCreateProduct}
              >
                确认创建新产品
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 语音录入Dialog */}
      <Dialog open={voiceInputOpen} onOpenChange={setVoiceInputOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              语音录入
            </DialogTitle>
          </DialogHeader>
          <VoiceInputPanel
            onApply={handleVoiceInputApply}
            onCancel={() => setVoiceInputOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* AI图片识别Dialog */}
      <AIRecognitionDialog
        open={aiRecognitionOpen}
        onOpenChange={setAiRecognitionOpen}
        onConfirm={handleAIRecognitionApply}
      />

      {/* 草稿恢复确认Dialog */}
      <Dialog open={draftConfirmOpen} onOpenChange={(open) => {
        if (!open) cancelRestoreDraft();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <History className="w-5 h-5" />
              恢复未完成的入库单
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              系统检测到您有一份未完成的入库单草稿，是否继续编辑？
            </p>
            {pendingDraft && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">创建时间：</span>
                  <span className="font-medium">{new Date(pendingDraft.timestamp).toLocaleString('zh-CN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">客户名称：</span>
                  <span className="font-medium">{pendingDraft.selectedCustomer?.name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">客户编号：</span>
                  <span className="font-medium">{pendingDraft.selectedCustomer?.code || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">已添加产品：</span>
                  <span className="font-medium">{pendingDraft.inboundDetails?.length || 0} 个</span>
                </div>
              </div>
            )}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              提示：草稿将在24小时后自动清除。
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelRestoreDraft}>
                重新开始
              </Button>
              <Button 
                className="bg-primary"
                onClick={confirmRestoreDraft}
              >
                恢复草稿继续编辑
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InboundPage;
