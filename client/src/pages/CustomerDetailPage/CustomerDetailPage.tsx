import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  Building2, 
  Phone, 
  MapPin, 
  User, 
  Calendar, 
  DollarSign, 
  Package, 
  FileText, 
  Truck,
  Edit,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCustomerById, updateCustomer, getProducts, getCustomerActivity } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer } from '@shared/api.interface';
import { useTenant } from '@/contexts/TenantContext';

// 交易记录类型
interface ITransaction {
  id: string;
  date: string;
  orderNo: string;
  type: 'inbound' | 'outbound' | 'reconciliation';
  productName: string;
  quantity: number;
  amount: number;
  status: 'completed' | 'pending' | 'cancelled';
}

// 表单数据类型
interface ICustomerFormData {
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

const transportOptions = ['', '自提', '快递', '物流', '空运', '水运'];
const settlementOptions = ['', '月结', '季结', '年结', '货到付款', '预付款'];
const categoryOptions = ['', '单产', '量产', '零售', '批发'];

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  const [activeTab, setActiveTab] = useState('transactions');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<ICustomerFormData>({
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
  });

  // 查询客户详情
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', currentTenant?.orgCode, id],
    queryFn: () => getCustomerById(id!),
    enabled: Boolean(id && currentTenant?.orgCode),
  });

  // 查询客户关联产品
  const { data: productsData } = useQuery({
    queryKey: ['products', currentTenant?.orgCode, 'customer', customer?.code],
    queryFn: () => getProducts({ customerCode: customer?.code }),
    enabled: Boolean(customer?.code && currentTenant?.orgCode),
  });

  const products = productsData?.items || [];

  const { data: activityData } = useQuery({
    queryKey: ['customer-activity', currentTenant?.orgCode, id],
    queryFn: () => getCustomerActivity(id!),
    enabled: Boolean(id && currentTenant?.orgCode),
  });

  // 更新客户 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ICustomerFormData> }) => 
      updateCustomer(id, data),
    onSuccess: () => {
      toast.success('客户更新成功');
      queryClient.invalidateQueries({ queryKey: ['customer', currentTenant?.orgCode, id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新客户失败');
    },
  });

  // 处理编辑按钮点击
  const handleEdit = () => {
    if (customer) {
      setFormData({
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
      setIsEditModalOpen(true);
    }
  };

  // 处理保存
  const handleSave = () => {
    if (!formData.name) {
      toast.error('请输入客户名称');
      return;
    }

    if (id) {
      updateMutation.mutate({
        id,
        data: formData,
      });
    }
  };

  const handleBack = () => {
    navigate('/customers');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge color="blue">合作中</Badge>;
      case 'inactive':
        return <Badge variant="secondary">暂停</Badge>;
      default:
        return null;
    }
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge color="emerald">已完成</Badge>;
      case 'pending':
        return <Badge color="orange">处理中</Badge>;
      case 'cancelled':
        return <Badge color="red">已取消</Badge>;
      default:
        return null;
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'inbound':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'outbound':
        return <Truck className="h-4 w-4 text-amber-500" />;
      case 'reconciliation':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const transactions: ITransaction[] = activityData?.transactions || [];
  const inboundRecords = transactions.filter(t => t.type === 'inbound');
  const outboundRecords = transactions.filter(t => t.type === 'outbound');

  // 加载中状态
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">加载客户信息...</p>
      </div>
    );
  }

  // 错误状态
  if (error || !customer) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="mt-4 text-muted-foreground">加载失败，客户不存在或已被删除</p>
        <Button className="mt-4" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          返回客户列表
        </Button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .customer-detail-page {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="customer-detail-page w-full flex flex-col gap-6">
        {/* 面包屑导航 */}
        <section className="w-full">
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/customers')} className="cursor-pointer">
                客户管理
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-foreground font-medium">客户详情</span>
            </BreadcrumbItem>
          </Breadcrumb>
        </section>

        {/* 页面标题 */}
        <section className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack} className="h-9 w-9 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
                {getStatusBadge(customer.status || 'active')}
              </div>
              <p className="text-sm text-muted-foreground mt-1">客户编号：{customer.code}</p>
            </div>
          </div>
          <Button onClick={handleEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            编辑信息
          </Button>
        </section>

        {/* 统计卡片 */}
        <section className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">累计入库次数</p>
                  <p className="text-xl font-bold text-foreground">{customer.inboundCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">关联产品</p>
                  <p className="text-xl font-bold text-foreground">{products.length} 个</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">最近入库</p>
                  <p className="text-xl font-bold text-foreground">
                    {customer.lastInboundDate 
                      ? new Date(customer.lastInboundDate).toLocaleDateString('zh-CN')
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">结算方式</p>
                  <p className="text-xl font-bold text-foreground">{customer.settlement || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 基本信息卡片 */}
        <section className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    联系人
                  </p>
                  <p className="text-sm font-medium text-foreground">{customer.contact || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    联系电话
                  </p>
                  <p className="text-sm font-medium text-foreground">{customer.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">付款期</p>
                  <p className="text-sm font-medium text-foreground">{customer.paymentTerm || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">运输方式</p>
                  <p className="text-sm font-medium text-foreground">{customer.transport || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">送货方向</p>
                  <p className="text-sm font-medium text-foreground">{customer.deliveryDirection || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">客户分类</p>
                  <p className="text-sm font-medium text-foreground">{customer.category || '-'}</p>
                </div>
                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    详细地址
                  </p>
                  <p className="text-sm font-medium text-foreground">{customer.address || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 关联产品卡片 */}
        <section className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                关联产品
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>产品编号</TableHead>
                        <TableHead>产品名称</TableHead>
                        <TableHead>材质</TableHead>
                        <TableHead>工艺</TableHead>
                        <TableHead className="text-right">库存</TableHead>
                        <TableHead>单位</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.code}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.material || '-'}</TableCell>
                          <TableCell>{product.process || '-'}</TableCell>
                          <TableCell className="text-right">{product.stock || 0}</TableCell>
                          <TableCell>{product.unit || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无关联产品
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* 交易记录Tab */}
        <section className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="transactions">全部记录</TabsTrigger>
              <TabsTrigger value="inbound">来货记录</TabsTrigger>
              <TabsTrigger value="outbound">发货记录</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">交易记录</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>单据号</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>产品</TableHead>
                          <TableHead className="text-right">数量</TableHead>
                          <TableHead className="text-right">金额</TableHead>
                          <TableHead>状态</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell className="font-medium">{transaction.orderNo}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionTypeIcon(transaction.type)}
                                <span>
                                  {transaction.type === 'inbound' ? '收货' : 
                                   transaction.type === 'outbound' ? '发货' : '对账'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{transaction.productName}</TableCell>
                            <TableCell className="text-right">{transaction.quantity}</TableCell>
                            <TableCell className="text-right">¥{transaction.amount.toLocaleString()}</TableCell>
                            <TableCell>{getTransactionStatusBadge(transaction.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inbound" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">来货记录</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>收货单号</TableHead>
                          <TableHead>产品</TableHead>
                          <TableHead className="text-right">数量</TableHead>
                          <TableHead className="text-right">金额</TableHead>
                          <TableHead>状态</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inboundRecords.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell className="font-medium">{transaction.orderNo}</TableCell>
                            <TableCell>{transaction.productName}</TableCell>
                            <TableCell className="text-right">{transaction.quantity}</TableCell>
                            <TableCell className="text-right">¥{transaction.amount.toLocaleString()}</TableCell>
                            <TableCell>{getTransactionStatusBadge(transaction.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outbound" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">发货记录</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>发货单号</TableHead>
                          <TableHead>产品</TableHead>
                          <TableHead className="text-right">数量</TableHead>
                          <TableHead className="text-right">金额</TableHead>
                          <TableHead>状态</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outboundRecords.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell className="font-medium">{transaction.orderNo}</TableCell>
                            <TableCell>{transaction.productName}</TableCell>
                            <TableCell className="text-right">{transaction.quantity}</TableCell>
                            <TableCell className="text-right">¥{transaction.amount.toLocaleString()}</TableCell>
                            <TableCell>{getTransactionStatusBadge(transaction.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* 编辑客户弹窗 */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑客户</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>客户编号</Label>
                <Input
                  value={customer.code}
                  disabled
                  title="客户编号创建后不可修改"
                />
                <p className="text-xs text-muted-foreground">客户编号创建后不可修改</p>
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
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>取消</Button>
              <Button 
                className="bg-primary" 
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default CustomerDetailPage;
