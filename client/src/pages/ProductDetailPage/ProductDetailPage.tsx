import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Package,
  FileText,
  History,
  Settings,
  Upload,
  Image,
  X,
  Bell,
  Trash2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useData } from '@/data/DataContext';
import type { IProduct } from '@/data/mockData';
import { ChangeTypeWithAmount } from '@/components/ChangeTypeBadge';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    products,
    customers,
    inventoryRecords,
    operationLogs,
    updateProduct,
  } = useData();

  const [activeTab, setActiveTab] = useState('info');
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState(50);

  // 获取当前产品
  const product = useMemo(() => {
    return products.find(p => p.id === id) || null;
  }, [products, id]);

  // 获取所属客户
  const customer = useMemo(() => {
    if (!product) return null;
    return customers.find(c => c.code === product.customerCode) || null;
  }, [customers, product]);

  // 获取产品相关操作日志
  const productLogs = useMemo(() => {
    return operationLogs.filter(log => log.entityId === id && log.entityType === 'product');
  }, [operationLogs, id]);

  // 获取产品库存变动记录
  const productInventoryRecords = useMemo(() => {
    return inventoryRecords.filter(r => r.productId === id);
  }, [inventoryRecords, id]);

  const handleBack = () => {
    navigate('/products');
  };

  // 保存预警阈值
  const saveThreshold = async () => {
    if (!product) return;
    try {
      await updateProduct(product.id, { warningThreshold: newThreshold });
      toast.success(`预警阈值已设置为 ${newThreshold}`);
      setThresholdDialogOpen(false);
    } catch (error) {
      toast.error('保存失败');
    }
  };

  // 打开阈值编辑弹窗
  const openThresholdDialog = () => {
    if (product) {
      setNewThreshold(product.warningThreshold || 50);
      setThresholdDialogOpen(true);
    }
  };

  if (!product) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">产品不存在</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>未找到产品信息</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
              {product.status === 'incomplete' && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  待完善
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">产品编号：{product.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openThresholdDialog} className="gap-2">
            <Bell className="h-4 w-4" />
            设置预警阈值 ({product.warningThreshold || 50})
          </Button>
        </div>
      </div>

      {/* 产品概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">当前库存</p>
                <p className={`text-2xl font-bold ${product.stock === 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {product.stock} {product.unit}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${product.stock < (product.warningThreshold || 50) ? 'bg-red-100' : 'bg-blue-100'}`}>
                {product.stock < (product.warningThreshold || 50) ? (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>
            {product.stock < (product.warningThreshold || 50) && (
              <p className="text-xs text-destructive mt-2">库存低于预警阈值({product.warningThreshold || 50})</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">库存重量</p>
                <p className="text-2xl font-bold">{product.stockWeight?.toFixed(2) || '0.00'} kg</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-100">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">累计入库</p>
                <p className="text-2xl font-bold">{product.inboundQuantity} {product.unit}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            {product.inboundWeight > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{product.inboundWeight.toFixed(2)} kg</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">单价</p>
                <p className="text-2xl font-bold">¥{product.unitPrice.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">/{product.unit}</p>
          </CardContent>
        </Card>
      </div>

      {/* 标签页内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <Package className="h-4 w-4" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            操作记录 ({productInventoryRecords.length})
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Settings className="h-4 w-4" />
            系统日志 ({productLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                产品详情
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">产品名称</label>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">材质</label>
                  <p className="font-medium">{product.material || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">工艺</label>
                  <p className="font-medium">{product.process || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">技术要求</label>
                  <p className="font-medium">{product.techRequirement || '-'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">工件编号</label>
                  <p className="font-medium">{product.workpieceNo || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">计价单位</label>
                  <p className="font-medium">{product.unit}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">单价</label>
                  <p className="font-medium">¥{product.unitPrice.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">所属客户</label>
                  <p className="font-medium">{product.customerName} ({product.customerCode})</p>
                </div>
              </div>
              <div className="col-span-full">
                <label className="text-sm text-muted-foreground">库存预警阈值</label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{product.warningThreshold || 50} {product.unit}</p>
                  {product.stock <= (product.warningThreshold || 50) && (
                    <Badge variant="destructive" className="text-xs">库存预警</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>库存变动记录</CardTitle>
              <CardDescription>该产品的入库和出库记录</CardDescription>
            </CardHeader>
            <CardContent>
              {productInventoryRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>暂无库存变动记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productInventoryRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <ChangeTypeWithAmount
                          type={record.changeType}
                          quantity={Math.abs(record.quantityChange)}
                          weight={record.weightChange}
                          unit={record.unit}
                          size="sm"
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            操作后库存: {record.afterStock} {record.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        <p>{record.createdAt?.slice(0, 10) || '-'}</p>
                        <p className="text-xs">{record.referenceNo || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>系统操作日志</CardTitle>
              <CardDescription>产品信息的变更记录</CardDescription>
            </CardHeader>
            <CardContent>
              {productLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>暂无操作日志</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {log.operation}
                        </Badge>
                        <div>
                          <p className="text-sm">{log.source || '系统操作'}</p>
                          {log.beforeState && log.afterState && (
                            <p className="text-xs text-muted-foreground">
                              数据已变更
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        <p>{log.createdAt?.slice(0, 10) || '-'}</p>
                        <p className="text-xs">{log.ipAddress || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 预警阈值设置弹窗 */}
      <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              设置库存预警阈值
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              产品：<span className="font-medium text-foreground">{product?.name}</span>
            </p>
            <div className="space-y-2">
              <Label>预警阈值</Label>
              <Input
                type="number"
                min={1}
                value={newThreshold}
                onChange={(e) => setNewThreshold(parseInt(e.target.value, 10) || 50)}
                placeholder="请输入预警阈值"
              />
              <p className="text-xs text-muted-foreground">
                当库存数量低于此值时，系统将发出预警
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setThresholdDialogOpen(false)}>取消</Button>
            <Button className="bg-primary" onClick={saveThreshold}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailPage;
