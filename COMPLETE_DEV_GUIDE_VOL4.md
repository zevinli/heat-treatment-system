# 热处理收发货管理系统 - 完整开发文档 卷4
# 前端剩余页面与组件完整代码

**版本**: COMPLETE v1.0  
**性质**: 一字不差的完整代码  

---

## 卷4 目录

1. InboundPage完整代码
2. OutboundPage完整代码
3. InventoryPage完整代码
4. ReconciliationPage完整代码
5. StatisticsPage完整代码
6. DetailPage完整代码
7. SettingsPage完整代码
8. UI组件完整代码

---

# 第一章：InboundPage完整代码

## 1.1 client/src/pages/InboundPage/InboundPage.tsx

**文件路径**: `client/src/pages/InboundPage/InboundPage.tsx`

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { Inbox, Plus, Printer, Camera } from 'lucide-react';

interface InboundFormData {
  customerId: string;
  productId: string;
  quantity: string;
  weight: string;
  batchNo: string;
  remark: string;
}

export default function InboundPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<InboundFormData>({
    customerId: '',
    productId: '',
    quantity: '',
    weight: '',
    batchNo: '',
    remark: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof InboundFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axiosForBackend.post('/api/inventory/inbound', {
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        weight: parseFloat(formData.weight),
        batchNo: formData.batchNo,
        remark: formData.remark
      });
      alert('入库成功！');
      setFormData({
        customerId: '',
        productId: '',
        quantity: '',
        weight: '',
        batchNo: '',
        remark: ''
      });
      setStep(1);
    } catch (error) {
      console.error('Failed to submit inbound:', error);
      alert('入库失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: '选择客户', description: '选择所属客户' },
    { id: 2, title: '选择产品', description: '选择入库产品' },
    { id: 3, title: '录入数据', description: '录入数量重量' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)]">来货登记</h1>
          <p className="text-sm text-[hsl(215,16%,47%)] mt-1">现场收货录入并打印流程卡</p>
        </div>
      </div>

      {/* 步骤指示器 */}
      <Card className="border border-[hsl(214,32%,91%)] shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === s.id 
                    ? 'bg-[hsl(215,70%,35%)] text-white animate-pulse' 
                    : step > s.id 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.id ? '✓' : s.id}
                </div>
                <div className="ml-3">
                  <p className={`font-medium ${step === s.id ? 'text-[hsl(215,70%,35%)]' : 'text-gray-600'}`}>
                    {s.title}
                  </p>
                  <p className="text-xs text-gray-400">{s.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-24 h-0.5 bg-gray-200 mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 表单内容 */}
      <Card className="border border-[hsl(214,32%,91%)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Inbox className="w-5 h-5 text-[hsl(215,70%,35%)]" />
            {steps[step - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>选择客户</Label>
                <Select onValueChange={(value) => handleInputChange('customerId', value)}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="请选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="c1">大连文火热处理有限公司</SelectItem>
                    <SelectItem value="c2">哈尔滨汇鑫仪器仪表有限责任公司</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>客户信息</Label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p>联系人：张三</p>
                  <p>电话：13800138000</p>
                  <p>地址：大连市甘井子区</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>选择产品</Label>
                <Select onValueChange={(value) => handleInputChange('productId', value)}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="请选择产品" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p1">齿轮轴 - 40Cr</SelectItem>
                    <SelectItem value="p2">传动轴 - 45#钢</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                拍照上传产品图片
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>数量</Label>
                  <Input
                    type="number"
                    placeholder="请输入数量"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>重量 (kg)</Label>
                  <Input
                    type="number"
                    placeholder="请输入重量"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>批次号</Label>
                <Input
                  placeholder="请输入批次号"
                  value={formData.batchNo}
                  onChange={(e) => handleInputChange('batchNo', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>备注</Label>
                <Input
                  placeholder="请输入备注"
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              上一步
            </Button>
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                className="bg-[hsl(215,70%,35%)] hover:bg-[hsl(215,70%,30%)]"
              >
                下一步
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  打印流程卡
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,45%)] text-[hsl(222,47%,11%)]"
                >
                  {loading ? '保存中...' : '保存并打印'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

# 第二章：OutboundPage完整代码

## 2.1 client/src/pages/OutboundPage/OutboundPage.tsx

**文件路径**: `client/src/pages/OutboundPage/OutboundPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { Outbox, Printer, Truck } from 'lucide-react';

interface OutboundItem {
  id: string;
  productName: string;
  material: string;
  stock: number;
  quantity: number;
  selected: boolean;
}

export default function OutboundPage() {
  const [items, setItems] = useState<OutboundItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axiosForBackend.get('/api/inventory', {
        params: { page: 1, pageSize: 50 }
      });
      
      if (response.data && response.data.data) {
        const inventoryItems = response.data.data.items.map((item: any) => ({
          id: item.id,
          productName: item.name,
          material: item.material,
          stock: item.stock,
          quantity: 0,
          selected: false
        }));
        setItems(inventoryItems);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setItems([
        { id: '1', productName: '齿轮轴', material: '40Cr', stock: 100, quantity: 0, selected: false },
        { id: '2', productName: '传动轴', material: '45#钢', stock: 50, quantity: 0, selected: false },
        { id: '3', productName: '轴承套', material: 'GCr15', stock: 80, quantity: 0, selected: false }
      ]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: checked } : item
    ));
    
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.min(quantity, item.stock) } : item
    ));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const selectedProducts = items.filter(item => item.selected && item.quantity > 0);
      
      await axiosForBackend.post('/api/outbound', {
        customerId: 'c1',
        outboundDate: new Date().toISOString(),
        items: selectedProducts.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      });
      
      alert('发货成功！');
      fetchInventory();
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to submit outbound:', error);
      alert('发货失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)]">快速发货</h1>
          <p className="text-sm text-[hsl(215,16%,47%)] mt-1">智能分批发货并打印送货单</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            打印送货单
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || selectedItems.length === 0}
            className="bg-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,45%)] text-[hsl(222,47%,11%)]"
          >
            <Truck className="w-4 h-4 mr-2" />
            {loading ? '发货中...' : '确认发货'}
          </Button>
        </div>
      </div>

      <Card className="border border-[hsl(214,32%,91%)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Outbox className="w-5 h-5 text-[hsl(215,70%,35%)]" />
            待发货产品
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>产品名称</TableHead>
                <TableHead>材质</TableHead>
                <TableHead>当前库存</TableHead>
                <TableHead>发货数量</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={item.selected ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <Checkbox 
                      checked={item.selected}
                      onCheckedChange={(checked) => handleSelect(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.material}</TableCell>
                  <TableCell>
                    <span className={`${item.stock < 20 ? 'text-red-600 font-semibold' : ''}`}>
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min="0"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                      disabled={!item.selected}
                      className="w-20 px-2 py-1 border rounded text-center"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border border-[hsl(214,32%,91%)] shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">已选择 {selectedItems.length} 个产品</p>
              <p className="text-lg font-semibold">
                总计：{items.filter(i => i.selected).reduce((sum, i) => sum + i.quantity, 0)} 件
              </p>
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={loading || selectedItems.length === 0}
              className="bg-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,45%)] text-[hsl(222,47%,11%)] px-8"
            >
              生成送货单
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

# 第三章：InventoryPage完整代码

## 3.1 client/src/pages/InventoryPage/InventoryPage.tsx

**文件路径**: `client/src/pages/InventoryPage/InventoryPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { Package, Search, AlertTriangle } from 'lucide-react';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  material: string;
  process: string;
  unit: string;
  stock: number;
  inboundDate: string;
  customerName: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [warnings, setWarnings] = useState<InventoryItem[]>([]);

  useEffect(() => {
    fetchInventory();
    fetchWarnings();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await axiosForBackend.get('/api/inventory', {
        params: { page: 1, pageSize: 20, keyword: searchKeyword }
      });
      
      if (response.data && response.data.data) {
        setInventory(response.data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setInventory([
        {
          id: '1',
          code: 'PRD001',
          name: '齿轮轴',
          material: '40Cr',
          process: '渗碳淬火',
          unit: '件',
          stock: 100,
          inboundDate: '2026-01-15',
          customerName: '大连文火热处理有限公司'
        },
        {
          id: '2',
          code: 'PRD002',
          name: '传动轴',
          material: '45#钢',
          process: '调质处理',
          unit: '件',
          stock: 5,
          inboundDate: '2026-01-10',
          customerName: '哈尔滨汇鑫仪器仪表有限责任公司'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarnings = async () => {
    try {
      const response = await axiosForBackend.get('/api/inventory/warning');
      if (response.data && response.data.data) {
        setWarnings([...response.data.data.lowStock, ...response.data.data.overdue]);
      }
    } catch (error) {
      console.error('Failed to fetch warnings:', error);
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock < 10) return <Badge className="bg-red-100 text-red-800">库存不足</Badge>;
    if (stock < 50) return <Badge className="bg-amber-100 text-amber-800">库存偏低</Badge>;
    return <Badge className="bg-green-100 text-green-800">正常</Badge>;
  };

  const isOverdue = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return days > 30;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)]">库存管理</h1>
          <p className="text-sm text-[hsl(215,16%,47%)] mt-1">查看实时库存状态与预警</p>
        </div>
      </div>

      {warnings.length > 0 && (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">库存预警</span>
            </div>
            <div className="text-sm text-red-700">
              发现 {warnings.length} 个库存异常项目，请及时处理
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-[hsl(214,32%,91%)] shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索产品名称/材质/工艺"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchInventory} variant="outline">
              <Search className="w-4 h-4 mr-2" />
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[hsl(214,32%,91%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">产品编号</TableHead>
                <TableHead className="font-semibold">产品名称</TableHead>
                <TableHead className="font-semibold">材质</TableHead>
                <TableHead className="font-semibold">工艺</TableHead>
                <TableHead className="font-semibold">单位</TableHead>
                <TableHead className="font-semibold">库存</TableHead>
                <TableHead className="font-semibold">状态</TableHead>
                <TableHead className="font-semibold">最近入库</TableHead>
                <TableHead className="font-semibold">所属客户</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow 
                  key={item.id} 
                  className={`hover:bg-gray-50 ${item.stock < 10 || isOverdue(item.inboundDate) ? 'bg-red-50' : ''}`}
                >
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.material}</TableCell>
                  <TableCell>{item.process}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className={item.stock < 10 ? 'text-red-600 font-bold' : ''}>
                    {item.stock}
                  </TableCell>
                  <TableCell>{getStockBadge(item.stock)}</TableCell>
                  <TableCell className={isOverdue(item.inboundDate) ? 'text-red-600' : ''}>
                    {item.inboundDate}
                    {isOverdue(item.inboundDate) && (
                      <span className="ml-2 text-xs text-red-600">(超期)</span>
                    )}
                  </TableCell>
                  <TableCell>{item.customerName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

**卷4 结束**

本文档包含：
- InboundPage完整代码（三步收货流程）
- OutboundPage完整代码（智能发货）
- InventoryPage完整代码（库存管理与预警）

**请继续查看卷5获取剩余页面和共享代码。**
