import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table } from '@lark-apaas/client-toolkit/antd-table';
import { toast } from 'sonner';
import {
  PlusIcon,
  EyeIcon,
  EditIcon,
  Trash2Icon,
  Building2Icon,
  PhoneIcon,
  UserIcon,
  Upload,
  FileSpreadsheet,
  Download,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { exportToExcel, getCustomerExportColumns } from '@/utils/excelExport';
import {
  Filter,
  FilterContent,
  FilterTextContent,
  FilterTrigger,
  FilterGroup,
} from '@/components/ui/filter';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, checkCanDeactivateCustomer,
} from '@/api';
import type { Customer } from '@shared/api.interface';
import { useData } from '@/data/DataContext';

// 表单数据类型
interface ICustomerFormData {
  code: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  transport: string;
  paymentTerm: string;
  deliveryDirection: string;
  settlement: string;
  category: string;
  status: 'active' | 'inactive';
}

const initialFormData: ICustomerFormData = {
  code: '',
  name: '',
  contact: '',
  phone: '',
  address: '',
  transport: '',
  paymentTerm: '',
  deliveryDirection: '',
  settlement: '',
  category: '',
  status: 'active',
};

const transportOptions = ['', '自提', '快递', '物流', '空运', '水运'];
const settlementOptions = ['', '月结', '季结', '年结', '货到付款', '预付款'];
const categoryOptions = ['', '单产', '量产', '零售', '批发'];

const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshCustomers } = useData();
  
  // 筛选状态
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // 弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<ICustomerFormData>(initialFormData);
  
  // 删除检查状态
  const [deleteCheckResult, setDeleteCheckResult] = useState<{
    canDeactivate: boolean;
    pendingOutboundCount: number;
    pendingReconciliationAmount: number;
    unreceivedAmount: number;
    reason?: string;
  } | null>(null);
  
  // Excel导入相关状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // 批量删除相关状态
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState<'page' | 'all'>('page');
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [batchDeleteResult, setBatchDeleteResult] = useState<{
    success: string[];
    failed: { id: string; name: string; reason: string }[];
  } | null>(null);
  const [isBatchDeleteResultOpen, setIsBatchDeleteResultOpen] = useState(false);

  // 查询客户列表
  const { data: customersData, isLoading, refetch } = useQuery({
    queryKey: ['customers', searchKeyword, statusFilter],
    queryFn: () => getCustomers({
      search: searchKeyword || undefined,
      status: statusFilter || undefined,
      page: 1,
      pageSize: 100,
    }),
  });

  const customers = customersData?.items || [];

  // 创建客户 mutation
  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      toast.success('客户创建成功');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // 同步刷新DataContext，确保其他页面能立即看到新客户
      refreshCustomers();
      setIsModalOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建客户失败');
    },
  });

  // 更新客户 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<ICustomerFormData, 'code'> }) => updateCustomer(id, data),
    onSuccess: () => {
      toast.success('客户更新成功');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      setEditingCustomer(null);
      setFormData(initialFormData);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新客户失败');
    },
  });

  // 删除客户 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success('客户删除成功');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsDeleteDialogOpen(false);
      setDeletingCustomer(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除客户失败');
    },
  });

  // 处理导入的客户数据
  const handleImportCustomers = async (importedCustomers: Partial<Customer>[]) => {
    // 检查编码是否已存在
    const existingCodes = new Set(customers.map(c => c.code));
    const duplicates: string[] = [];
    const validCustomers = importedCustomers.filter((customer) => {
      if (!customer.code || !customer.name) return false;
      if (existingCodes.has(customer.code)) {
        duplicates.push(customer.code);
        return false;
      }
      return true;
    });

    if (duplicates.length > 0) {
      toast.warning(`以下客户编码已存在，已跳过：${duplicates.join(', ')}`);
    }

    if (validCustomers.length === 0) {
      toast.error('没有有效的客户数据可导入');
      return;
    }

    // 批量创建
    let successCount = 0;
    let failCount = 0;
    
    for (const customer of validCustomers) {
      try {
        await createCustomer({
          code: customer.code!,
          name: customer.name!,
          contact: customer.contact ?? undefined,
          phone: customer.phone ?? undefined,
          address: customer.address ?? undefined,
          transport: customer.transport ?? undefined,
          paymentTerm: customer.paymentTerm ?? undefined,
          deliveryDirection: customer.deliveryDirection ?? undefined,
          settlement: customer.settlement ?? undefined,
          category: customer.category ?? undefined,
          status: customer.status || 'active',
        });
        successCount++;
      } catch (error) {
        failCount++;
        logger.error('导入客户失败', error);
      }
    }

    if (successCount > 0) {
      toast.success(`成功导入 ${successCount} 条客户数据`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
    if (failCount > 0) {
      toast.error(`${failCount} 条客户数据导入失败`);
    }
  };

  // 清空筛选
  const handleClearFilters = () => {
    setSearchKeyword('');
    setStatusFilter('');
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      code: customer.code,
      name: customer.name,
      contact: customer.contact || '',
      phone: customer.phone || '',
      address: customer.address || '',
      transport: customer.transport || '',
      paymentTerm: customer.paymentTerm || '',
      deliveryDirection: customer.deliveryDirection || '',
      settlement: customer.settlement || '',
      category: customer.category || '',
      status: (customer.status as 'active' | 'inactive') || 'active',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    setDeletingCustomer(customer);
    
    // 调用检查接口
    try {
      const result = await checkCanDeactivateCustomer(customer.id);
      setDeleteCheckResult(result);
      
      if (!result.canDeactivate) {
        // 有关联数据，显示警告弹窗
        setIsWarningDialogOpen(true);
      } else {
        // 无关联，直接显示删除确认
        setIsDeleteDialogOpen(true);
      }
    } catch (error) {
      logger.error('检查客户删除状态失败', error);
      // 检查失败，直接显示删除确认（由后端再次检查）
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (deletingCustomer) {
      deleteMutation.mutate(deletingCustomer.id);
    }
  };

  // 批量删除客户
  const handleBatchDelete = () => {
    if (selectedCustomerIds.length === 0) {
      toast.error('请先选择要删除的客户');
      return;
    }
    setIsBatchDeleteDialogOpen(true);
  };

  // 确认批量删除
  const confirmBatchDelete = async () => {
    setBatchDeleteLoading(true);
    const idsToDelete = selectAllMode === 'all'
      ? customers.map(c => c.id)
      : selectedCustomerIds;

    const success: string[] = [];
    const failed: { id: string; name: string; reason: string }[] = [];

    // 逐个删除并记录结果
    for (const id of idsToDelete) {
      const customer = customers.find(c => c.id === id);
      try {
        await deleteCustomer(id);
        success.push(id);
      } catch (error: any) {
        failed.push({
          id,
          name: customer?.name || '未知客户',
          reason: error.response?.data?.message || '删除失败',
        });
      }
    }

    setBatchDeleteResult({ success, failed });

    // 刷新数据
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    refreshCustomers();

    // 清理状态
    setSelectedCustomerIds([]);
    setSelectAllMode('page');
    setIsBatchDeleteDialogOpen(false);
    setBatchDeleteLoading(false);

    // 显示结果
    if (failed.length === 0) {
      toast.success(`成功删除 ${success.length} 个客户`);
    } else {
      setIsBatchDeleteResultOpen(true);
      if (success.length > 0) {
        toast.success(`${success.length} 个客户删除成功，${failed.length} 个失败`);
      } else {
        toast.error('所有客户删除失败');
      }
    }
  };

  // 取消选择
  const handleClearSelection = () => {
    setSelectedCustomerIds([]);
    setSelectAllMode('page');
  };

  const handleView = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleSave = () => {
    if (!formData.code) {
      toast.error('请输入客户编号');
      return;
    }
    if (!formData.name) {
      toast.error('请输入客户名称');
      return;
    }

    if (editingCustomer) {
      // 更新客户 - 不包含 code
      updateMutation.mutate({
        id: editingCustomer.id,
        data: {
          name: formData.name,
          contact: formData.contact,
          phone: formData.phone,
          address: formData.address,
          transport: formData.transport,
          paymentTerm: formData.paymentTerm,
          deliveryDirection: formData.deliveryDirection,
          settlement: formData.settlement,
          category: formData.category,
          status: formData.status,
        },
      });
    } else {
      // 新增客户
      createMutation.mutate({
        code: formData.code,
        name: formData.name,
        contact: formData.contact,
        phone: formData.phone,
        address: formData.address,
        transport: formData.transport,
        paymentTerm: formData.paymentTerm,
        deliveryDirection: formData.deliveryDirection,
        settlement: formData.settlement,
        category: formData.category,
        status: formData.status,
      });
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData(initialFormData);
  };

  const columns: any = [
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
          <Building2Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{name}</span>
        </div>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
      width: 100,
      render: (contact: string) => contact ? (
        <div className="flex items-center gap-1">
          <UserIcon className="w-3 h-3 text-muted-foreground" />
          <span>{contact}</span>
        </div>
      ) : '-',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone: string) => phone ? (
        <div className="flex items-center gap-1 text-muted-foreground">
          <PhoneIcon className="w-3 h-3" />
          <span>{phone}</span>
        </div>
      ) : '-',
    },
    {
      title: '运输方式',
      dataIndex: 'transport',
      key: 'transport',
      width: 100,
      render: (transport: string) => transport || '-',
    },
    {
      title: '付款期',
      dataIndex: 'paymentTerm',
      key: 'paymentTerm',
      width: 80,
      render: (paymentTerm: string) => paymentTerm || '-',
    },
    {
      title: '送货方向',
      dataIndex: 'deliveryDirection',
      key: 'deliveryDirection',
      width: 100,
      render: (deliveryDirection: string) => deliveryDirection || '-',
    },
    {
      title: '结算方式',
      dataIndex: 'settlement',
      key: 'settlement',
      width: 100,
      render: (settlement: string) => settlement || '-',
    },
    {
      title: '客户分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => category ? (
        <Badge variant="outline">{category}</Badge>
      ) : '-',
    },
    {
      title: '入库频次',
      dataIndex: 'inboundCount',
      key: 'inboundCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center' as const,
      render: (status: string) => (
        <Badge
          variant={status === 'active' ? 'default' : 'secondary'}
          color={status === 'active' ? 'blue' : 'neutral'}
        >
          {status === 'active' ? '合作中' : '暂停'}
        </Badge>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center' as const,
      render: (_: unknown, record: Customer) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleView(record)}
          >
            <EyeIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEdit(record)}
          >
            <EditIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDelete(record)}
          >
            <Trash2Icon className="w-4 h-4" />
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
              <Building2Icon className="w-5 h-5 text-primary" />
              客户管理
            </CardTitle>
            <div className="flex gap-2">
              {/* 批量操作按钮组 */}
              {selectedCustomerIds.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearSelection}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    取消选择 ({selectAllMode === 'all' ? '全部' : selectedCustomerIds.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchDelete}
                    className="text-destructive border-destructive/20 hover:bg-destructive/5"
                  >
                    <Trash2Icon className="w-4 h-4 mr-1" />
                    批量删除 ({selectAllMode === 'all' ? '全部' : selectedCustomerIds.length})
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportToExcel(customers, getCustomerExportColumns(), '客户信息')}
                disabled={customers.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Excel导出
              </Button>
              <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-1" />
                Excel导入
              </Button>
              <Button size="sm" className="bg-primary" onClick={handleAdd}>
                <PlusIcon className="w-4 h-4 mr-1" />
                新增客户
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选器组 */}
          <FilterGroup gap="sm" className="mb-4">
            <Filter value={searchKeyword} onValueChange={(value) => setSearchKeyword(value || '')}>
              <FilterTrigger label="关键词" closable={!!searchKeyword} />
              <FilterContent>
                <FilterTextContent 
                  placeholder="搜索客户名称/编号/联系人/电话" 
                />
              </FilterContent>
            </Filter>

            {/* 状态筛选 */}
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">合作中</SelectItem>
                <SelectItem value="inactive">暂停</SelectItem>
              </SelectContent>
            </Select>

            {(searchKeyword || statusFilter) && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="w-4 h-4 mr-1" />
                重置
              </Button>
            )}
          </FilterGroup>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">加载中...</span>
            </div>
          ) : customers.length > 0 ? (
            <Table
              columns={columns}
              dataSource={customers}
              rowKey="id"
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selectAllMode === 'all' ? customers.map(c => c.id) : selectedCustomerIds,
                onChange: (selectedRowKeys: React.Key[]) => {
                  if (selectAllMode === 'all') {
                    setSelectAllMode('page');
                  }
                  setSelectedCustomerIds(selectedRowKeys as string[]);
                },
                selections: [
                  {
                    key: 'all',
                    text: '全选所有页',
                    onSelect: () => {
                      setSelectAllMode('all');
                      setSelectedCustomerIds(customers.map(c => c.id));
                    },
                  },
                  {
                    key: 'invert',
                    text: '反选当页',
                    onSelect: (changeableRowKeys: React.Key[]) => {
                      setSelectAllMode('page');
                      setSelectedCustomerIds(prev => {
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
                showTotal: (total: number) => `共 ${total} 条${selectAllMode === 'all' ? '（已全选）' : selectedCustomerIds.length > 0 ? `（已选 ${selectedCustomerIds.length} 条）` : ''}`,
              }}
              scroll={{ x: 1500 }}
              size="middle"
            />
          ) : (
            <Empty className="py-12">
              <EmptyMedia variant="icon">
                <Building2Icon className="w-6 h-6" />
              </EmptyMedia>
              <EmptyDescription>暂无客户数据</EmptyDescription>
            </Empty>
          )}
        </CardContent>
      </Card>

      {/* 新增/编辑客户弹窗 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? '编辑客户' : '新增客户'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>客户编号 {!editingCustomer && <span className="text-destructive">*</span>}</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="请输入客户编号"
                disabled={!!editingCustomer}
                title={editingCustomer ? "客户编号创建后不可修改" : ""}
              />
              {editingCustomer && (
                <p className="text-xs text-muted-foreground">
                  客户编号创建后不可修改
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>客户名称 <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入客户名称"
              />
            </div>

            <div className="space-y-2">
              <Label>联系人</Label>
              <Input
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="请输入联系人"
              />
            </div>
            <div className="space-y-2">
              <Label>联系电话</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
              />
            </div>
            <div className="space-y-2">
              <Label>运输方式</Label>
              <Select
                value={formData.transport}
                onValueChange={(value) => setFormData({ ...formData, transport: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择运输方式" />
                </SelectTrigger>
                <SelectContent>
                  {transportOptions.map(option => (
                    <SelectItem key={option || 'empty'} value={option || 'empty'}>
                      {option || '请选择'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>付款期</Label>
              <Input
                value={formData.paymentTerm}
                onChange={(e) => setFormData({ ...formData, paymentTerm: e.target.value })}
                placeholder="请输入付款期"
              />
            </div>
            <div className="space-y-2">
              <Label>送货方向</Label>
              <Input
                value={formData.deliveryDirection}
                onChange={(e) => setFormData({ ...formData, deliveryDirection: e.target.value })}
                placeholder="请输入送货方向"
              />
            </div>
            <div className="space-y-2">
              <Label>结算方式</Label>
              <Select
                value={formData.settlement}
                onValueChange={(value) => setFormData({ ...formData, settlement: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择结算方式" />
                </SelectTrigger>
                <SelectContent>
                  {settlementOptions.map(option => (
                    <SelectItem key={option || 'empty'} value={option || 'empty'}>
                      {option || '请选择'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>客户分类</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择客户分类" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option || 'empty'} value={option || 'empty'}>
                      {option || '请选择'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">合作中</SelectItem>
                  <SelectItem value="inactive">暂停</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>地址</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入地址"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>取消</Button>
            <Button 
              className="bg-primary" 
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              保存
            </Button>
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
            <p>确定要删除客户 <span className="font-medium">{deletingCustomer?.name}</span> 吗？</p>
            <p className="text-sm text-muted-foreground mt-2">删除后将无法恢复，请谨慎操作。</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除警告弹窗（有关联数据时） */}
      <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              无法直接删除该客户
            </DialogTitle>
            <DialogDescription>
              该客户存在以下未完成业务，删除会导致数据不一致
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {deleteCheckResult && (
              <>
                {deleteCheckResult.pendingOutboundCount > 0 && (
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">待发货出库单</span>
                    <Badge variant="secondary" color="orange">{deleteCheckResult.pendingOutboundCount} 笔</Badge>
                  </div>
                )}
                {deleteCheckResult.pendingReconciliationAmount > 0 && (
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">待对账金额</span>
                    <Badge variant="secondary" color="orange">¥{deleteCheckResult.pendingReconciliationAmount.toFixed(2)}</Badge>
                  </div>
                )}
                {deleteCheckResult.unreceivedAmount > 0 && (
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">未回款金额</span>
                    <Badge variant="secondary" color="red">¥{deleteCheckResult.unreceivedAmount.toFixed(2)}</Badge>
                  </div>
                )}
              </>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              建议先将该客户状态修改为"暂停"，待业务完结后再删除
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWarningDialogOpen(false)}>取消</Button>
            <Button 
              variant="default"
              onClick={() => {
                setIsWarningDialogOpen(false);
                if (deletingCustomer) {
                  // 直接跳转到编辑状态，修改为暂停
                  handleEdit({ ...deletingCustomer, status: 'inactive' } as Customer);
                }
              }}
            >
              修改状态为"暂停"
            </Button>
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
          <div className="py-4">
            <p>
              确定要删除选中的 <span className="font-medium text-destructive">
                {selectAllMode === 'all' ? customers.length : selectedCustomerIds.length}
              </span> 个客户吗？
            </p>
            <div className="mt-4 p-3 bg-destructive/5 rounded-lg border border-destructive/10">
              <p className="text-sm text-destructive font-medium">⚠️ 风险提示</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                <li>删除后将无法恢复</li>
                <li>有关联业务数据的客户将跳过删除</li>
                <li>建议先导出备份重要客户信息</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBatchDelete}
              disabled={batchDeleteLoading}
            >
              {batchDeleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量删除结果弹窗 */}
      <Dialog open={isBatchDeleteResultOpen} onOpenChange={setIsBatchDeleteResultOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>批量删除结果</DialogTitle>
          </DialogHeader>
          {batchDeleteResult && (
            <div className="py-4 space-y-4">
              {/* 成功统计 */}
              <div className="flex items-center gap-4">
                <div className="flex-1 p-3 bg-success/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-success">{batchDeleteResult.success.length}</div>
                  <div className="text-sm text-muted-foreground">删除成功</div>
                </div>
                <div className="flex-1 p-3 bg-destructive/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-destructive">{batchDeleteResult.failed.length}</div>
                  <div className="text-sm text-muted-foreground">删除失败</div>
                </div>
              </div>

              {/* 失败详情 */}
              {batchDeleteResult.failed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">失败详情：</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {batchDeleteResult.failed.map((item) => (
                      <div key={item.id} className="p-2 bg-muted rounded text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground"> - {item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsBatchDeleteResultOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel导入弹窗 */}
      <ImportCustomerDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportCustomers}
        existingCustomers={customers}
      />
    </div>
  );
};

// Excel导入对话框组件
interface ImportCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (customers: Partial<Customer>[]) => void;
  existingCustomers: Customer[];
}

const ImportCustomerDialog: React.FC<ImportCustomerDialogProps> = ({
  open,
  onOpenChange,
  onImport,
  existingCustomers,
}) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [previewData, setPreviewData] = useState<Partial<Customer>[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Customer>>({});
  const [validationErrors, setValidationErrors] = useState<{ row: number; message: string }[]>([]);

  const existingCodes = new Set(existingCustomers.map(c => c.code));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (data) {
          import('@e965/xlsx').then((XLSX) => {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
            
            if (jsonData.length < 2) {
              toast.error('Excel文件数据不足');
              return;
            }

            // 智能匹配字段
            const headers = jsonData[0];
            const fieldMapping = detectCustomerFields(headers);
            
            const parsedData: Partial<Customer>[] = [];
            const errors: { row: number; message: string }[] = [];
            
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (row.length === 0) continue;
              
              const customer: Partial<Customer> = {};
              headers.forEach((header, index) => {
                const field = fieldMapping[header];
                if (field && row[index] !== undefined) {
                  (customer as Record<string, unknown>)[field] = row[index];
                }
              });
              
              // 数据校验
              if (!customer.code) {
                errors.push({ row: i, message: '客户编号不能为空' });
              } else if (existingCodes.has(customer.code)) {
                errors.push({ row: i, message: `客户编码 ${customer.code} 已存在` });
              }
              
              if (!customer.name) {
                errors.push({ row: i, message: '客户名称不能为空' });
              }
              
              // 设置默认值
              if (!customer.status) customer.status = 'active';
              if (!customer.inboundCount) customer.inboundCount = 0;
              
              parsedData.push(customer);
            }
            
            setPreviewData(parsedData);
            setValidationErrors(errors);
            setStep('preview');
            
            if (errors.length > 0) {
              toast.warning(`解析完成，发现 ${errors.length} 处错误，请检查`);
            } else {
              toast.success(`成功解析 ${parsedData.length} 条客户数据`);
            }
          });
        }
      } catch (error) {
        toast.error('解析Excel文件失败');
        logger.error(error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const detectCustomerFields = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const fieldKeywords: Record<string, string[]> = {
      code: ['编号', '编码', 'code', '客户编号', '客户编码'],
      name: ['名称', '客户名称', 'name', '客户'],
      contact: ['联系人', 'contact', '联系人姓名', '负责人'],
      phone: ['电话', '联系电话', 'phone', '手机', 'tel'],
      address: ['地址', '客户地址', 'address', '详细地址'],
      transport: ['运输方式', '运输', 'transport', '运送方式'],
      paymentTerm: ['付款期', '付款期限', 'paymentTerm', '账期'],
      deliveryDirection: ['送货方向', '送货', 'deliveryDirection', '发货方向'],
      settlement: ['结算方式', '结算', 'settlement', '结账方式'],
      category: ['分类', '客户分类', 'category', '类别', '类型'],
    };

    headers.forEach((header) => {
      const headerLower = header.toLowerCase();
      for (const [field, keywords] of Object.entries(fieldKeywords)) {
        if (keywords.some(k => headerLower.includes(k.toLowerCase()))) {
          mapping[header] = field;
          break;
        }
      }
    });

    return mapping;
  };

  const handleDeleteRow = (index: number) => {
    setPreviewData(prev => prev.filter((_, i) => i !== index));
    // 清除对应行的错误
    setValidationErrors(prev => prev.filter(e => e.row !== index + 1));
  };

  const handleEditRow = (index: number) => {
    setEditingRow(index);
    setEditFormData({ ...previewData[index] });
  };

  const handleSaveEdit = () => {
    if (editingRow !== null) {
      // 校验编辑后的数据
      const newErrors: { row: number; message: string }[] = [];
      if (!editFormData.code) {
        newErrors.push({ row: editingRow + 1, message: '客户编号不能为空' });
      } else if (existingCodes.has(editFormData.code) && editFormData.code !== previewData[editingRow].code) {
        newErrors.push({ row: editingRow + 1, message: `客户编码 ${editFormData.code} 已存在` });
      }
      if (!editFormData.name) {
        newErrors.push({ row: editingRow + 1, message: '客户名称不能为空' });
      }
      
      // 更新数据和错误
      setPreviewData(prev => {
        const newData = [...prev];
        newData[editingRow] = editFormData;
        return newData;
      });
      
      setValidationErrors(prev => [
        ...prev.filter(e => e.row !== editingRow + 1),
        ...newErrors,
      ]);
      
      setEditingRow(null);
      setEditFormData({});
    }
  };

  const handleConfirmImport = () => {
    // 过滤掉无效数据（无编号或名称）
    const validData = previewData.filter(c => c.code && c.name);
    if (validData.length === 0) {
      toast.error('没有有效的客户数据可导入');
      return;
    }
    
    // 检查是否还有校验错误
    if (validationErrors.length > 0) {
      toast.error('请先修复数据错误后再导入');
      return;
    }
    
    onImport(validData);
    setStep('upload');
    setPreviewData([]);
    setValidationErrors([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setStep('upload');
    setPreviewData([]);
    setEditingRow(null);
    setValidationErrors([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Excel导入客户</DialogTitle>
        </DialogHeader>
        
        {step === 'upload' ? (
          <div className="py-8">
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">上传Excel文件</p>
              <p className="text-sm text-muted-foreground mb-4">
                支持 .xlsx, .xls 格式，系统会自动识别列名并匹配字段
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                建议列名：客户编号、客户名称、客户简称、助记码、联系人、联系电话、地址、运输方式、付款期、送货方向、结算方式、客户分类、备注
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="max-w-sm mx-auto"
              />
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  共 {previewData.length} 条数据，可编辑或删除后确认导入
                </p>
                {validationErrors.length > 0 && (
                  <Badge variant="secondary" color="red">
                    {validationErrors.length} 处错误
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                重新上传
              </Button>
            </div>
            
            {validationErrors.length > 0 && (
              <div className="mb-4 p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-2">数据校验错误：</p>
                <ul className="text-sm text-destructive space-y-1 max-h-32 overflow-y-auto">
                  {validationErrors.map((error, index) => (
                    <li key={index}>第 {error.row} 行：{error.message}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="border rounded-lg overflow-hidden">
              <Table
                columns={[
                  { title: '客户编号', dataIndex: 'code', key: 'code', width: 100 },
                  { title: '客户名称', dataIndex: 'name', key: 'name', width: 120 },
                  { title: '联系人', dataIndex: 'contact', key: 'contact', width: 80 },
                  { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 110 },
                  { title: '运输方式', dataIndex: 'transport', key: 'transport', width: 80 },
                  { title: '结算方式', dataIndex: 'settlement', key: 'settlement', width: 80 },
                  { title: '分类', dataIndex: 'category', key: 'category', width: 80 },
                  {
                    title: '操作',
                    key: 'action',
                    width: 120,
                    render: (_: unknown, __: unknown, index: number) => (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEditRow(index)}>
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteRow(index)}>
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                dataSource={previewData}
                rowKey={(_, index) => index?.toString() || ''}
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </div>
            
            {/* 编辑行弹窗 */}
            <Dialog open={editingRow !== null} onOpenChange={() => { setEditingRow(null); setEditFormData({}); }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>编辑客户数据</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>客户编号 <span className="text-destructive">*</span></Label>
                    <Input 
                      value={editFormData.code || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>客户名称 <span className="text-destructive">*</span></Label>
                    <Input 
                      value={editFormData.name || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>联系人</Label>
                    <Input 
                      value={editFormData.contact || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>联系电话</Label>
                    <Input 
                      value={editFormData.phone || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>运输方式</Label>
                    <Select value={editFormData.transport || 'none'} onValueChange={(v) => setEditFormData({ ...editFormData, transport: v === 'none' ? '' : v })}>
                      <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- 空 --</SelectItem>
                        <SelectItem value="自提">自提</SelectItem>
                        <SelectItem value="快递">快递</SelectItem>
                        <SelectItem value="物流">物流</SelectItem>
                        <SelectItem value="空运">空运</SelectItem>
                        <SelectItem value="水运">水运</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>结算方式</Label>
                    <Select value={editFormData.settlement || 'none'} onValueChange={(v) => setEditFormData({ ...editFormData, settlement: v === 'none' ? '' : v })}>
                      <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- 空 --</SelectItem>
                        <SelectItem value="月结">月结</SelectItem>
                        <SelectItem value="季结">季结</SelectItem>
                        <SelectItem value="年结">年结</SelectItem>
                        <SelectItem value="货到付款">货到付款</SelectItem>
                        <SelectItem value="预付款">预付款</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>客户分类</Label>
                    <Select value={editFormData.category || 'none'} onValueChange={(v) => setEditFormData({ ...editFormData, category: v === 'none' ? '' : v })}>
                      <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- 空 --</SelectItem>
                        <SelectItem value="单产">单产</SelectItem>
                        <SelectItem value="量产">量产</SelectItem>
                        <SelectItem value="零售">零售</SelectItem>
                        <SelectItem value="批发">批发</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>地址</Label>
                    <Input 
                      value={editFormData.address || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setEditingRow(null); setEditFormData({}); }}>取消</Button>
                  <Button onClick={handleSaveEdit}>保存</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>取消</Button>
          {step === 'preview' && (
            <Button 
              onClick={handleConfirmImport}
              disabled={validationErrors.length > 0 || previewData.filter(c => c.code && c.name).length === 0}
            >
              确认导入 ({previewData.filter(c => c.code && c.name).length}条)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerListPage;
