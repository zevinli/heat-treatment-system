import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Package,
  ChevronDown,
  Check,
  Upload,
  X,
  FileSpreadsheet,
  Download,
  FileEdit,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Settings,
  Bell,
  Image,
  FilterIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table } from '@lark-apaas/client-toolkit/antd-table';
import { toast } from 'sonner';
// 导入共享数据类型和 useData hook
import type { IProduct, ICustomer, ProductStatus } from '@/data/mockData';
import { useData } from '@/data/DataContext';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Empty, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { exportToExcel, getProductExportColumns } from '@/utils/excelExport';
import { SmartExcelImportDialog } from '@/components/SmartExcelImportDialog';
import {
  Filter,
  FilterContent,
  FilterTextContent,
  FilterTrigger,
  FilterGroup,
  FilterSelectContent,
} from '@/components/ui/filter';

// 表单数据类型
interface IProductFormData {
  code: string;
  name: string;
  material: string;
  process: string;
  techRequirement: string;
  workpieceNo: string;
  unit: string;
  unitPrice: string;
  customerCode: string;
  customerName: string;
  status: ProductStatus;
  remark: string;
  warningThreshold: string;
}

const initialFormData: IProductFormData = {
  code: '',
  name: '',
  material: '',
  process: '',
  techRequirement: '',
  workpieceNo: '',
  unit: '',
  unitPrice: '',
  customerCode: '',
  customerName: '',
  status: 'complete' as ProductStatus,
  remark: '',
  warningThreshold: '50',
};

const defaultMaterialOptions = ['40Cr', '45#钢', '42CrMo', '20CrMnTi', '20Cr', '35#钢', 'HT200'];
const processOptions = ['', '调质+高频淬火', '渗碳淬火', '氮化处理', '调质', '淬火', '回火', '正火'];
const unitOptions = ['件', 'kg'];

// 从本地存储获取自定义材质选项
const getStoredMaterialOptions = (): string[] => {
  try {
    const stored = localStorage.getItem('customMaterialOptions');
    if (stored) {
      const parsed = JSON.parse(stored);
      return [...new Set([...defaultMaterialOptions, ...parsed])];
    }
  } catch {
    // ignore
  }
  return defaultMaterialOptions;
};

// 保存自定义材质选项到本地存储
const saveMaterialOption = (option: string) => {
  try {
    const current = getStoredMaterialOptions();
    if (!current.includes(option)) {
      const newOptions = [...current, option];
      localStorage.setItem('customMaterialOptions', JSON.stringify(newOptions.filter(o => !defaultMaterialOptions.includes(o))));
    }
  } catch {
    // ignore
  }
};

const ProductListPage: React.FC = () => {
  const navigate = useNavigate();
  // 使用 useData hook 获取产品数据和操作函数
  const { 
    products, 
    customers, 
    deleteProduct: deleteProductFromData, 
    batchDeleteProducts,
    addProduct: addProductToData, 
    updateProduct: updateProductInData,
  } = useData();
  const [searchText, setSearchText] = useState<string | undefined>();
  const [materialFilter, setMaterialFilter] = useState<string | undefined>();
  const [processFilter, setProcessFilter] = useState<string | undefined>();
  const [customerFilter, setCustomerFilter] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<IProduct | null>(null);
  const [formData, setFormData] = useState<IProductFormData>(initialFormData);
  
  // 材质选项（包含用户自定义的）
  const [materialOptions, setMaterialOptions] = useState<string[]>(getStoredMaterialOptions());
  const [materialPopoverOpen, setMaterialPopoverOpen] = useState(false);
  
  // Excel导入相关状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // 批量设置阈值相关状态
  const [batchThresholdDialogOpen, setBatchThresholdDialogOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState<'page' | 'all'>('page'); // 当前页选中 vs 全部选中
  const [batchThresholdValue, setBatchThresholdValue] = useState(50);
  const [thresholdEditDialogOpen, setThresholdEditDialogOpen] = useState(false);
  const [thresholdEditProduct, setThresholdEditProduct] = useState<IProduct | null>(null);
  const [thresholdEditValue, setThresholdEditValue] = useState(50);
  
  // 批量删除结果状态
  const [batchDeleteResult, setBatchDeleteResult] = useState<{
    success: string[];
    failed: { id: string; reason: string }[];
  } | null>(null);
  const [batchDeleteResultOpen, setBatchDeleteResultOpen] = useState(false);

  // 处理导入的产品数据
  // 支持强制导入模式：允许导入不完整数据（缺少必填字段）
  const handleImportProducts = (importedProducts: Partial<IProduct>[]) => {
    if (!importedProducts || importedProducts.length === 0) {
      toast.error('没有可导入的数据');
      return;
    }

    // 统计信息
    const incompleteCount = importedProducts.filter(p => p.status === 'incomplete').length;

    // 批量导入产品
    let successCount = 0;
    let failCount = 0;

    importedProducts.forEach((product, index) => {
      try {
        setTimeout(() => {
          // 生成唯一ID
          const newProduct: IProduct = {
            id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            // 强制导入模式下，必填字段可能为空，使用占位符
            code: product.code?.trim() || `待补充_${Date.now()}_${index}`,
            name: product.name?.trim() || '待补充产品名称',
            material: product.material || '',
            process: product.process || '',
            techRequirement: product.techRequirement || '',
            workpieceNo: product.workpieceNo || '',
            unit: product.unit || '件',
            unitPrice: Number(product.unitPrice) || 0,
            // 强制导入模式下，客户信息可能为空
            customerCode: product.customerCode?.trim() || '待补充',
            customerName: product.customerName?.trim() || '待补充客户',
            status: (product.status as ProductStatus) || 'complete',
            remark: product.remark || '',
            stock: 0,
            inboundQuantity: 0,
            inboundWeight: 0,
            inboundDate: new Date().toISOString().slice(0, 10),
            batchNo: '',
          };

          addProductToData(newProduct);
          successCount++;

          // 最后一条导入完成后显示汇总
          if (index === importedProducts.length - 1) {
            if (incompleteCount > 0) {
              toast.success(
                `成功导入 ${successCount} 条数据（含 ${incompleteCount} 条不完整数据，请在列表中完善）`
              );
            } else {
              toast.success(`成功导入 ${successCount} 条产品数据`);
            }
          }
        }, index * 50);
      } catch (error) {
        failCount++;
        logger.error(`导入第 ${index + 1} 条产品失败:`, error);
      }
    });
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchText) {
      const keyword = searchText.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.code.toLowerCase().includes(keyword) ||
        (p.material?.toLowerCase() || '').includes(keyword) ||
        (p.process?.toLowerCase() || '').includes(keyword) ||
        p.customerName.toLowerCase().includes(keyword)
      );
    }

    if (customerFilter) {
      result = result.filter(p => p.customerCode === customerFilter);
    }

    if (materialFilter) {
      result = result.filter(p => p.material === materialFilter);
    }

    if (processFilter) {
      result = result.filter(p => p.process === processFilter);
    }

    return result;
  }, [products, searchText, customerFilter, materialFilter, processFilter]);

  // 清空筛选
  const handleClearFilters = () => {
    setSearchText(undefined);
    setCustomerFilter(undefined);
    setMaterialFilter(undefined);
    setProcessFilter(undefined);
  };
  
  const handleAdd = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleEdit = (product: IProduct) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      material: product.material || '',
      process: product.process || '',
      techRequirement: product.techRequirement,
      workpieceNo: product.workpieceNo,
      unit: product.unit,
      unitPrice: product.unitPrice.toString(),
      customerCode: product.customerCode,
      customerName: product.customerName,
      status: product.status,
      remark: product.remark || '',
      warningThreshold: (product.warningThreshold ?? 50).toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (product: IProduct) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      // 同步到共享数据
      deleteProductFromData(deletingProduct.id);
      toast.success('产品删除成功');
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
    }
  };

  // 批量删除产品
  const handleBatchDelete = () => {
    if (selectedProductIds.length === 0) {
      toast.error('请先选择要删除的产品');
      return;
    }
    setIsBatchDeleteDialogOpen(true);
  };

  // 确认批量删除
  const confirmBatchDelete = async () => {
    try {
      const idsToDelete = selectAllMode === 'all' 
        ? filteredProducts.map(p => p.id) 
        : selectedProductIds;
      
      const result = await batchDeleteProducts(idsToDelete);
      setBatchDeleteResult(result);
      
      if (result.failed.length > 0) {
        setBatchDeleteResultOpen(true);
      }
      
      setIsBatchDeleteDialogOpen(false);
      setSelectedProductIds([]);
      setSelectAllMode('page');
    } catch (error) {
      // 错误已在DataContext中处理
    }
  };

  // 获取选中的产品列表（用于显示）
  const getSelectedProducts = () => {
    if (selectAllMode === 'all') {
      return filteredProducts;
    }
    return products.filter(p => selectedProductIds.includes(p.id));
  };

  // 快速编辑产品预警阈值
  const handleEditThreshold = (product: IProduct) => {
    setThresholdEditProduct(product);
    setThresholdEditValue(product.warningThreshold || 50);
    setThresholdEditDialogOpen(true);
  };

  // 保存单个产品阈值
  const saveThresholdEdit = async () => {
    if (thresholdEditProduct) {
      try {
        await updateProductInData(thresholdEditProduct.id, {
          warningThreshold: thresholdEditValue,
        });
        toast.success(`已设置 ${thresholdEditProduct.name} 的预警阈值为 ${thresholdEditValue}`);
        setThresholdEditDialogOpen(false);
        setThresholdEditProduct(null);
      } catch (error) {
        toast.error('更新失败');
      }
    }
  };

  // 批量设置阈值
  const handleBatchSetThreshold = () => {
    if (selectedProductIds.length === 0) {
      toast.error('请先选择产品');
      return;
    }
    setBatchThresholdDialogOpen(true);
  };

  // 确认批量设置阈值
  const confirmBatchSetThreshold = async () => {
    try {
      // 这里可以调用批量API
      for (const productId of selectedProductIds) {
        await updateProductInData(productId, {
          warningThreshold: batchThresholdValue,
        });
      }
      toast.success(`已批量设置 ${selectedProductIds.length} 个产品的预警阈值`);
      setBatchThresholdDialogOpen(false);
      setSelectedProductIds([]);
    } catch (error) {
      toast.error('批量设置失败');
    }
  };

  const handleView = (product: IProduct) => {
    navigate(`/products/${product.id}`);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('请输入产品名称');
      return;
    }
    if (!formData.code) {
      toast.error('请输入产品编号');
      return;
    }
    if (!formData.unit) {
      toast.error('请选择计价单位');
      return;
    }
    if (!formData.customerCode) {
      toast.error('请选择客户');
      return;
    }
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      toast.error('请输入有效的单价');
      return;
    }

    // 保存自定义材质到本地存储
    if (formData.material && !defaultMaterialOptions.includes(formData.material)) {
      saveMaterialOption(formData.material);
      // 更新材质选项列表
      setMaterialOptions(getStoredMaterialOptions());
    }

    try {
      if (editingProduct) {
        // 同步到共享数据
        await updateProductInData(editingProduct.id, {
          ...formData,
          unitPrice: parseFloat(formData.unitPrice) || 0,
          warningThreshold: parseInt(formData.warningThreshold, 10) || 50,
        });
        toast.success('产品更新成功');
      } else {
        // 新增产品
        const newProduct: IProduct = {
          id: Date.now().toString(),
          ...formData,
          unitPrice: parseFloat(formData.unitPrice) || 0,
          warningThreshold: parseInt(formData.warningThreshold, 10) || 50,
          stock: 0,
          inboundQuantity: 0,
          inboundWeight: 0,
          inboundDate: new Date().toISOString().slice(0, 10),
          batchNo: '',
        };
        // 同步到共享数据
        await addProductToData(newProduct);
        toast.success('产品创建成功');
      }
      
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData(initialFormData);
    } catch (error) {
      // 错误已在 DataContext 中处理
    }
  };

  const columns: any = [
    {
      title: '产品编号',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{name}</span>
        </div>
      ),
    },
    {
      title: '材质',
      dataIndex: 'material',
      key: 'material',
      width: 100,
    },
    {
      title: '工艺',
      dataIndex: 'process',
      key: 'process',
      width: 140,
    },
    {
      title: '技术要求',
      dataIndex: 'techRequirement',
      key: 'techRequirement',
      width: 150,
    },
    {
      title: '工件编号',
      dataIndex: 'workpieceNo',
      key: 'workpieceNo',
      width: 120,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      render: (value: number) => `¥${value.toFixed(2)}`,
    },
    {
      title: '计价单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center' as const,
    },

    {
      title: '客户编码',
      dataIndex: 'customerCode',
      key: 'customerCode',
      width: 100,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (value: ProductStatus) => (
        <Badge variant={value === 'complete' ? 'default' : 'secondary'} className={value === 'incomplete' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}>
          {value === 'complete' ? '信息完整' : '待完善'}
        </Badge>
      ),
    },
    {
      title: '预警阈值',
      dataIndex: 'warningThreshold',
      key: 'warningThreshold',
      width: 100,
      align: 'center' as const,
      render: (value: number, record: IProduct) => (
        <div className="flex items-center gap-1">
          <Bell className={`w-3 h-3 ${(value || 50) <= record.stock ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className={((value || 50) <= record.stock) ? 'text-destructive font-medium' : ''}>
            {value || 50}
          </span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      align: 'center' as const,
      render: (_: unknown, record: IProduct) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleView(record)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEdit(record)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-600"
            onClick={() => handleEditThreshold(record)}
            title="编辑预警阈值"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDelete(record)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              产品信息
            </CardTitle>
            <div className="flex gap-2">
              {selectedProductIds.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProductIds([]);
                      setSelectAllMode('page');
                    }}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    取消选择 ({selectAllMode === 'all' ? '全部' : selectedProductIds.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBatchSetThreshold} className="text-amber-600 border-amber-200 hover:bg-amber-50">
                    <Bell className="w-4 h-4 mr-1" />
                    批量设置阈值 ({selectAllMode === 'all' ? '全部' : selectedProductIds.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBatchDelete} className="text-destructive border-destructive/20 hover:bg-destructive/5">
                    <Trash2 className="w-4 h-4 mr-1" />
                    批量删除 ({selectAllMode === 'all' ? '全部' : selectedProductIds.length})
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => exportToExcel(filteredProducts, getProductExportColumns(), '产品信息')}>
                <Download className="w-4 h-4 mr-1" />
                Excel导出
              </Button>
              <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-1" />
                Excel导入
              </Button>
              <Button size="sm" className="bg-primary" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-1" />
                新增产品
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选器组 - 使用Filter组件 */}
          <FilterGroup gap="sm" className="mb-4">
            {/* 关键词筛选 */}
            <Filter value={searchText} onValueChange={setSearchText}>
              <FilterTrigger label="关键词" closable />
              <FilterContent>
                <FilterTextContent placeholder="搜索产品名称/编号/材质/工艺/客户" />
              </FilterContent>
            </Filter>

            {/* 客户筛选 */}
            <Filter value={customerFilter} onValueChange={setCustomerFilter}>
              <FilterTrigger label="客户" closable />
              <FilterContent>
                <FilterSelectContent
                  options={customers.map(c => ({ label: c.name, value: c.code }))}
                  searchPlaceholder="搜索客户..."
                />
              </FilterContent>
            </Filter>

            {/* 材质筛选 */}
            <Filter value={materialFilter} onValueChange={setMaterialFilter}>
              <FilterTrigger label="材质" closable />
              <FilterContent>
                <FilterSelectContent
                  options={materialOptions.filter(Boolean).map(m => ({ label: m, value: m }))}
                  searchPlaceholder="搜索材质..."
                />
              </FilterContent>
            </Filter>

            {/* 工艺筛选 */}
            <Filter value={processFilter} onValueChange={setProcessFilter}>
              <FilterTrigger label="工艺" closable />
              <FilterContent>
                <FilterSelectContent
                  options={processOptions.filter(Boolean).map(p => ({ label: p, value: p }))}
                  searchPlaceholder="搜索工艺..."
                />
              </FilterContent>
            </Filter>

            {/* 重置按钮 */}
            {(searchText || customerFilter || materialFilter || processFilter) && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="w-4 h-4 mr-1" />
                重置
              </Button>
            )}
          </FilterGroup>

          {filteredProducts.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredProducts}
              rowKey="id"
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selectAllMode === 'all' ? filteredProducts.map(p => p.id) : selectedProductIds,
                onChange: (selectedRowKeys: React.Key[], selectedRows: IProduct[]) => {
                  if (selectAllMode === 'all') {
                    // 如果之前是全选模式，现在取消全选
                    setSelectAllMode('page');
                    setSelectedProductIds(selectedRowKeys as string[]);
                  } else {
                    setSelectedProductIds(selectedRowKeys as string[]);
                  }
                },
                selections: [
                  {
                    key: 'all',
                    text: '全选所有页',
                    onSelect: () => {
                      setSelectAllMode('all');
                      setSelectedProductIds(filteredProducts.map(p => p.id));
                    },
                  },
                  {
                    key: 'invert',
                    text: '反选当页',
                    onSelect: (changeableRowKeys: React.Key[]) => {
                      setSelectAllMode('page');
                      setSelectedProductIds(prev => {
                        const newSelected = [...prev];
                        changeableRowKeys.forEach(key => {
                          const index = newSelected.indexOf(key as string);
                          if (index > -1) {
                            newSelected.splice(index, 1);
                          } else {
                            newSelected.push(key as string);
                          }
                        });
                        return newSelected;
                      });
                    },
                  },
                ],
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total: number) => {
                  if (selectAllMode === 'all') {
                    return `共 ${total} 条（已全选所有 ${filteredProducts.length} 条）`;
                  }
                  if (selectedProductIds.length > 0) {
                    return `共 ${total} 条（已选 ${selectedProductIds.length} 条）`;
                  }
                  return `共 ${total} 条`;
                },
              }}
              scroll={{ x: 1500 }}
              size="middle"
            />
          ) : (
            <Empty className="py-12">
              <EmptyMedia variant="icon">
                <Package className="w-6 h-6" />
              </EmptyMedia>
              <EmptyDescription>暂无产品数据</EmptyDescription>
            </Empty>
          )}
        </CardContent>
      </Card>

      {/* 新增/编辑产品弹窗 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? '编辑产品' : '新增产品'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>产品编号 <span className="text-destructive">*</span></Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="请输入产品编号"
              />
            </div>
            <div className="space-y-2">
              <Label>产品名称 <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入产品名称"
              />
            </div>
            <div className="space-y-2">
              <Label>材质</Label>
              <Popover open={materialPopoverOpen} onOpenChange={setMaterialPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={materialPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.material || '请选择或输入材质'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="搜索或输入新材质..."
                      value={formData.material}
                      onValueChange={(value) => {
                        setFormData({ ...formData, material: value });
                      }}
                    />
                    <CommandList>
                      <CommandEmpty className="py-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          未找到 &quot;{formData.material}&quot;
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const newMaterial = formData.material.trim();
                            if (newMaterial && !materialOptions.includes(newMaterial)) {
                              // 保存到本地存储
                              saveMaterialOption(newMaterial);
                              // 更新选项列表
                              setMaterialOptions(prev => [...prev, newMaterial]);
                              // 关闭弹窗
                              setMaterialPopoverOpen(false);
                              toast.success(`已添加新材质：${newMaterial}`);
                            }
                          }}
                          disabled={!formData.material.trim() || materialOptions.includes(formData.material.trim())}
                          className="gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          添加 &quot;{formData.material}&quot;
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {materialOptions.map((option) => (
                          <CommandItem
                            key={option}
                            value={option}
                            onSelect={(currentValue) => {
                              setFormData({ ...formData, material: currentValue });
                              setMaterialPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                formData.material === option ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                            {option}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>工艺</Label>
              <Select
                value={formData.process}
                onValueChange={(value) => setFormData({ ...formData, process: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择工艺" />
                </SelectTrigger>
                <SelectContent>
                  {processOptions.map(option => (
                    <SelectItem key={option} value={option}>{option || '请选择'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>技术要求</Label>
              <Input
                value={formData.techRequirement}
                onChange={(e) => setFormData({ ...formData, techRequirement: e.target.value })}
                placeholder="请输入技术要求"
              />
            </div>
            <div className="space-y-2">
              <Label>工件编号</Label>
              <Input
                value={formData.workpieceNo}
                onChange={(e) => setFormData({ ...formData, workpieceNo: e.target.value })}
                placeholder="请输入工件编号"
              />
            </div>
            <div className="space-y-2">
              <Label>单价 <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="请输入单价"
              />
            </div>
            <div className="space-y-2">
              <Label>计价单位 <span className="text-destructive">*</span></Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择计价单位" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Bell className="w-3 h-3" />
                库存预警阈值
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.warningThreshold}
                onChange={(e) => setFormData({ ...formData, warningThreshold: e.target.value })}
                placeholder="默认50"
              />
              <p className="text-xs text-muted-foreground">库存低于此值时将触发预警</p>
            </div>
            <div className="space-y-2">
              <Label>客户名称 <span className="text-destructive">*</span></Label>
              <Select
                value={formData.customerCode}
                onValueChange={(value) => {
                  const selectedCustomer = customers.find(c => c.code === value);
                  setFormData({
                    ...formData,
                    customerCode: value,
                    customerName: selectedCustomer?.name || ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.code} value={customer.code}>
                      {customer.name} ({customer.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: ProductStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">信息完整</SelectItem>
                  <SelectItem value="incomplete">待完善</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>备注</Label>
              <Input
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="请输入备注"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button className="bg-primary" onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>确定要删除产品 <span className="font-medium">{deletingProduct?.name}</span> 吗？</p>
            <p className="text-sm text-muted-foreground mt-2">删除后将无法恢复，请谨慎操作。</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 智能Excel导入弹窗 */}
      <SmartExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportProducts}
      />

      {/* 快速编辑预警阈值弹窗 */}
      <Dialog open={thresholdEditDialogOpen} onOpenChange={setThresholdEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              编辑预警阈值
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              产品：<span className="font-medium text-foreground">{thresholdEditProduct?.name}</span>
            </p>
            <div className="space-y-2">
              <Label>库存预警阈值</Label>
              <Input
                type="number"
                min={1}
                value={thresholdEditValue}
                onChange={(e) => setThresholdEditValue(parseInt(e.target.value, 10) || 50)}
                placeholder="请输入预警阈值"
              />
              <p className="text-xs text-muted-foreground">库存低于此值时将触发预警</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setThresholdEditDialogOpen(false)}>取消</Button>
            <Button className="bg-primary" onClick={saveThresholdEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量设置阈值弹窗 */}
      <Dialog open={batchThresholdDialogOpen} onOpenChange={setBatchThresholdDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              批量设置预警阈值
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              已选择 <span className="font-medium text-foreground">{selectedProductIds.length}</span> 个产品
            </p>
            <div className="space-y-2">
              <Label>库存预警阈值</Label>
              <Input
                type="number"
                min={1}
                value={batchThresholdValue}
                onChange={(e) => setBatchThresholdValue(parseInt(e.target.value, 10) || 50)}
                placeholder="请输入预警阈值"
              />
              <p className="text-xs text-muted-foreground">将为选中的所有产品设置相同的预警阈值</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchThresholdDialogOpen(false)}>取消</Button>
            <Button className="bg-primary" onClick={confirmBatchSetThreshold}>确认设置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量删除确认弹窗 */}
      <Dialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              确认批量删除
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>
              确定要删除选中的 <span className="font-medium text-destructive">
                {selectAllMode === 'all' ? filteredProducts.length : selectedProductIds.length}
              </span> 个产品吗？
              {selectAllMode === 'all' && <span className="text-xs text-muted-foreground block mt-1">（跨页全选模式）</span>}
            </p>
            <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/10">
              <p className="text-sm text-destructive font-medium">⚠️ 风险提示</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                <li>删除后将无法恢复</li>
                <li>只有库存为0且无未完成批次的产品才能被删除</li>
                <li>有库存或有关联数据的产品将跳过删除</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmBatchDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量删除结果弹窗 */}
      <Dialog open={batchDeleteResultOpen} onOpenChange={setBatchDeleteResultOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              批量删除结果
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {batchDeleteResult && (
              <>
                <div className="flex gap-4">
                  <div className="flex-1 bg-success/10 rounded-md p-3 text-center">
                    <p className="text-2xl font-bold text-success">{batchDeleteResult.success.length}</p>
                    <p className="text-sm text-muted-foreground">成功删除</p>
                  </div>
                  <div className="flex-1 bg-destructive/10 rounded-md p-3 text-center">
                    <p className="text-2xl font-bold text-destructive">{batchDeleteResult.failed.length}</p>
                    <p className="text-sm text-muted-foreground">删除失败</p>
                  </div>
                </div>
                {batchDeleteResult.failed.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">失败详情：</p>
                    <div className="max-h-48 overflow-y-auto border rounded-md">
                      {batchDeleteResult.failed.map((item, index) => {
                        const product = products.find(p => p.id === item.id);
                        return (
                          <div key={item.id} className="flex items-center justify-between p-2 text-sm border-b last:border-b-0">
                            <span className="font-medium">{product?.name || item.id}</span>
                            <span className="text-destructive text-xs">{item.reason}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setBatchDeleteResultOpen(false)}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};


export default ProductListPage;
