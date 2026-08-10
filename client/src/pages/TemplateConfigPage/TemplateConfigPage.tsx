import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Settings,
  Eye,
  RotateCcw,
  FileText,
  Receipt,
  FileSignature,
  Zap,
  Printer,
} from 'lucide-react';
import {
  useProcessCardTemplate,
  useDeliveryNoteTemplate,
  useReconciliationTemplate,
  type ITemplateField,
  type ITemplateConfig,
} from '@/hooks/usePrintTemplate';
import {
  DEFAULT_PRINTER_CONFIG,
  getPrinterConfig,
  savePrinterConfig,
  smartPrint,
  type PrinterConfig,
} from '@/lib/print-service';
import { toast } from 'sonner';
// 预览数据类型
type InboundItemData = {
  id: string;
  productName: string;
  workpieceNo?: string;
  material?: string;
  process?: string;
  unitPrice?: number;
  unit?: string;
  quantity?: number;
  weight?: number;
  techRequirement?: string;
};

type OutboundDetailItem = {
  id: string;
  productId: string;
  productName: string;
  workpieceNo?: string;
  material?: string;
  process?: string;
  unit?: string;
  unitPrice?: number;
  quantity: number;
  weight?: number;
  amount: number;
  batchNo?: string;
  inboundDate?: string;
};

// 预览数据 - 标识卡
const MOCK_PROCESS_CARD_DATA: InboundItemData[] = [
  {
    id: '1',
    productName: '齿轮轴',
    workpieceNo: 'WZ-2025-001',
    material: '42CrMo',
    process: '调质+表面淬火',
    unitPrice: 12.5,
    unit: 'kg',
    quantity: 50,
    weight: 125.5,
    techRequirement: '硬度HRC58-62,表面无裂纹',
  },
  {
    id: '2',
    productName: '凸轮',
    workpieceNo: 'WZ-2025-002',
    material: '20CrMnTi',
    process: '渗碳淬火',
    unitPrice: 8.8,
    unit: 'kg',
    quantity: 30,
    weight: 45.2,
    techRequirement: '渗碳深度0.8-1.2mm',
  },
];

// 预览数据 - 送货单
const MOCK_DELIVERY_DATA: OutboundDetailItem[] = [
  {
    id: '1',
    productId: 'p1',
    productName: '齿轮轴',
    workpieceNo: 'WZ-2025-001',
    material: '42CrMo',
    process: '调质+表面淬火',
    unit: 'kg',
    unitPrice: 12.5,
    quantity: 50,
    weight: 125.5,
    amount: 1568.75,
    batchNo: '202501001',
    inboundDate: '2025-01-15',
  },
  {
    id: '2',
    productId: 'p2',
    productName: '凸轮',
    workpieceNo: 'WZ-2025-002',
    material: '20CrMnTi',
    process: '渗碳淬火',
    unit: 'kg',
    unitPrice: 8.8,
    quantity: 30,
    weight: 45.2,
    amount: 397.76,
    batchNo: '202501002',
    inboundDate: '2025-01-16',
  },
];

// 字段宽度滑块组件
const FieldWidthControl = ({
  field,
  onChange,
}: {
  field: ITemplateField;
  onChange: (width: number) => void;
}) => (
  <div className="flex items-center gap-2">
    <Input
      type="number"
      value={field.width}
      onChange={(e) => onChange(parseInt(e.target.value) || 50)}
      className="w-20 h-8 text-sm"
      min={30}
      max={400}
    />
    <span className="text-xs text-muted-foreground">px</span>
  </div>
);

// 字段对齐选择组件
const FieldAlignControl = ({
  field,
  onChange,
}: {
  field: ITemplateField;
  onChange: (align: 'left' | 'center' | 'right') => void;
}) => (
  <Select value={field.align} onValueChange={onChange}>
    <SelectTrigger className="w-20 h-8">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="left">左</SelectItem>
      <SelectItem value="center">中</SelectItem>
      <SelectItem value="right">右</SelectItem>
    </SelectContent>
  </Select>
);

// 字段配置表格
const FieldConfigTable = ({
  fields,
  onFieldUpdate,
}: {
  fields: ITemplateField[];
  onFieldUpdate: (fieldId: string, updates: Partial<ITemplateField>) => void;
}) => (
  <div className="border rounded-lg overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-12 text-center">显示</TableHead>
          <TableHead className="w-12">排序</TableHead>
          <TableHead>字段名称</TableHead>
          <TableHead className="w-24">宽度(px)</TableHead>
          <TableHead className="w-24">对齐</TableHead>
          <TableHead className="w-20">必需</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field, index) => (
          <TableRow key={field.id} className={!field.visible ? 'opacity-50' : ''}>
            <TableCell className="text-center">
              <Switch
                checked={field.visible}
                onCheckedChange={(checked) => onFieldUpdate(field.id, { visible: checked })}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                {index + 1}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="font-medium">{field.label}</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {field.name}
                </code>
              </div>
            </TableCell>
            <TableCell>
              <FieldWidthControl
                field={field}
                onChange={(width) => onFieldUpdate(field.id, { width })}
              />
            </TableCell>
            <TableCell>
              <FieldAlignControl
                field={field}
                onChange={(align) => onFieldUpdate(field.id, { align })}
              />
            </TableCell>
            <TableCell>
              {field.isRequired ? (
                <Badge variant="default" className="text-[10px]">是</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">否</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// 标识卡预览组件
const ProcessCardPreview = ({ config }: { config: ITemplateConfig }) => {
  const visibleFields = config.fields.filter((f) => f.visible);
  const customerData = {
    code: 'K001',
    name: '大连船舶重工',
    transport: '汽运',
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="text-center mb-4">
        {config.showCompanyName && (
          <h3 className="text-lg font-bold mb-1">{config.companyName}</h3>
        )}
        <h4 className="text-base font-semibold text-muted-foreground">热处理流程卡</h4>
      </div>
      
      <div className="flex justify-between text-sm mb-4 pb-2 border-b">
        <span>客户编码: <strong>{customerData.code}</strong></span>
        <span>客户名称: <strong>{customerData.name}</strong></span>
        <span>运输方式: <strong>{customerData.transport}</strong></span>
        <span>日期: <strong>2025-01-20</strong></span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ fontSize: config.fontSize }}>
          <thead>
            <tr className="bg-muted/50">
              {visibleFields.map((field) => (
                <th
                  key={field.id}
                  className="border p-2 whitespace-nowrap"
                  style={{ width: field.width, textAlign: field.align }}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_PROCESS_CARD_DATA.map((item, index) => (
              <tr key={item.id}>
                {visibleFields.map((field) => (
                  <td
                    key={field.id}
                    className="border p-2"
                    style={{ textAlign: field.align }}
                  >
                    {field.id === 'seq' && index + 1}
                    {field.id === 'customerCode' && customerData.code}
                    {field.id === 'productName' && item.productName}
                    {field.id === 'workpieceNo' && item.workpieceNo}
                    {field.id === 'unit' && item.unit}
                    {field.id === 'unitPrice' && item.unitPrice}
                    {field.id === 'quantity' && item.quantity}
                    {field.id === 'weight' && item.weight}
                    {field.id === 'amount' && ((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                    {field.id === 'inboundType' && '来料加工'}
                    {field.id === 'process' && item.process}
                    {field.id === 'material' && item.material}
                    {field.id === 'techRequirement' && item.techRequirement}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-muted/30 font-medium">
              <td colSpan={visibleFields.length - 3} className="border p-2 text-right">
                合计:
              </td>
              <td className="border p-2 text-right">80</td>
              <td className="border p-2 text-right">170.7</td>
              <td className="border p-2 text-right">1966.51</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          {config.showCreator && (
            <span>制单人: ______________</span>
          )}
          {config.showCustomerConfirm && (
            <span>客户确认: ______________</span>
          )}
          <span>打印时间: 2025-01-20 10:30:00</span>
        </div>
      </div>
    </div>
  );
};

// 送货单预览组件
const DeliveryNotePreview = ({ config }: { config: ITemplateConfig }) => {
  const visibleFields = config.fields.filter((f) => f.visible);

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="text-center mb-4">
        {config.showCompanyName && (
          <h3 className="text-xl font-bold mb-1">{config.companyName}</h3>
        )}
        <h4 className="text-lg font-semibold text-muted-foreground">送货单</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm mb-4 pb-2 border-b">
        <div>收货单位: <strong>大连船舶重工</strong></div>
        <div>送货单号: <strong>SH20250120001</strong></div>
        <div>收货地址: <strong>大连市西岗区滨海路1号</strong></div>
        <div>送货日期: <strong>2025-01-20</strong></div>
        <div>联系人: <strong>张经理</strong></div>
        <div>联系电话: <strong>0411-12345678</strong></div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ fontSize: config.fontSize }}>
          <thead>
            <tr className="bg-muted/50">
              {visibleFields.map((field) => (
                <th
                  key={field.id}
                  className="border p-2 whitespace-nowrap"
                  style={{ width: field.width, textAlign: field.align }}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_DELIVERY_DATA.map((item, index) => (
              <tr key={item.id}>
                {visibleFields.map((field) => (
                  <td
                    key={field.id}
                    className="border p-2"
                    style={{ textAlign: field.align }}
                  >
                    {field.id === 'seq' && index + 1}
                    {field.id === 'customerName' && '大连船舶重工'}
                    {field.id === 'customerCode' && 'K001'}
                    {field.id === 'productName' && item.productName}
                    {field.id === 'workpieceNo' && item.workpieceNo}
                    {field.id === 'batchNo' && item.batchNo}
                    {field.id === 'unit' && item.unit}
                    {field.id === 'unitPrice' && item.unitPrice}
                    {field.id === 'quantity' && item.quantity}
                    {field.id === 'weight' && item.weight}
                    {field.id === 'amount' && item.amount}
                    {field.id === 'process' && item.process}
                    {field.id === 'material' && item.material}
                    {field.id === 'inboundDate' && item.inboundDate}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-muted/30 font-medium">
              <td colSpan={visibleFields.length - 3} className="border p-2 text-right">
                合计:
              </td>
              <td className="border p-2 text-right">80</td>
              <td className="border p-2 text-right">170.7</td>
              <td className="border p-2 text-right">1966.51</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          {config.showCreator && (
            <span>制单人: ______________</span>
          )}
          {config.showCustomerConfirm && (
            <span>客户签收: ______________</span>
          )}
          <span>送货司机: ______________</span>
        </div>
        <div className="mt-2 text-center">
          <span>（一式三联：存根联、客户联、回执联）</span>
        </div>
      </div>
    </div>
  );
};

// 对账单预览组件
const ReconciliationPreview = ({ config }: { config: ITemplateConfig }) => {
  const visibleFields = config.fields.filter((f) => f.visible);

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="text-center mb-4">
        {config.showCompanyName && (
          <h3 className="text-xl font-bold mb-1">{config.companyName}</h3>
        )}
        <h4 className="text-lg font-semibold text-muted-foreground">对账单</h4>
      </div>
      
      <div className="flex justify-between text-sm mb-4 pb-2 border-b">
        <span>客户名称: <strong>大连船舶重工</strong></span>
        <span>对账周期: <strong>2025年1月</strong></span>
        <span>对账单号: <strong>DZ202501001</strong></span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ fontSize: config.fontSize }}>
          <thead>
            <tr className="bg-muted/50">
              {visibleFields.map((field) => (
                <th
                  key={field.id}
                  className="border p-2 whitespace-nowrap"
                  style={{ width: field.width, textAlign: field.align }}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_DELIVERY_DATA.map((item, index) => (
              <tr key={item.id}>
                {visibleFields.map((field) => (
                  <td
                    key={field.id}
                    className="border p-2"
                    style={{ textAlign: field.align }}
                  >
                    {field.id === 'seq' && index + 1}
                    {field.id === 'outboundNo' && 'SH20250120001'}
                    {field.id === 'outboundDate' && '2025-01-20'}
                    {field.id === 'productName' && item.productName}
                    {field.id === 'workpieceNo' && item.workpieceNo}
                    {field.id === 'process' && item.process}
                    {field.id === 'material' && item.material}
                    {field.id === 'quantity' && item.quantity}
                    {field.id === 'weight' && item.weight}
                    {field.id === 'unitPrice' && item.unitPrice}
                    {field.id === 'amount' && item.amount}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-muted/30 font-medium">
              <td colSpan={visibleFields.length - 3} className="border p-2 text-right">
                合计:
              </td>
              <td className="border p-2 text-right">80</td>
              <td className="border p-2 text-right">170.7</td>
              <td className="border p-2 text-right">1966.51</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>期初余额: <strong>0.00</strong></span>
          <span>本期应收: <strong>1966.51</strong></span>
          <span>本期实收: <strong>0.00</strong></span>
          <span>期末余额: <strong>1966.51</strong></span>
        </div>
        <div className="mt-4 flex justify-between">
          {config.showCreator && (
            <span>制单人: ______________</span>
          )}
          {config.showCustomerConfirm && (
            <span>客户确认: ______________</span>
          )}
          <span>对账日期: 2025-01-20</span>
        </div>
      </div>
    </div>
  );
};

// 通用设置面板
const CommonSettingsPanel = ({
  config,
  onUpdate,
}: {
  config: ITemplateConfig;
  onUpdate: (updates: Partial<ITemplateConfig>) => void;
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>纸张规格</Label>
        <Select value={config.paperSize} onValueChange={(paperSize: ITemplateConfig['paperSize']) => onUpdate({ paperSize })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="a4">A4</SelectItem>
            <SelectItem value="a5">A5</SelectItem>
            <SelectItem value="custom">自定义/卷纸</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>打印方向</Label>
        <Select value={config.paperOrientation} onValueChange={(paperOrientation: ITemplateConfig['paperOrientation']) => onUpdate({ paperOrientation })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">纵向</SelectItem>
            <SelectItem value="landscape">横向</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>公司名称</Label>
        <Input
          value={config.companyName}
          onChange={(e) => onUpdate({ companyName: e.target.value })}
          placeholder="请输入公司名称"
        />
      </div>
      <div className="space-y-2">
        <Label>字体大小 (pt)</Label>
        <Input
          type="number"
          value={config.fontSize}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 10 })}
          min={8}
          max={14}
        />
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <Label className="cursor-pointer">显示公司名称</Label>
        <Switch
          checked={config.showCompanyName}
          onCheckedChange={(checked) => onUpdate({ showCompanyName: checked })}
        />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <Label className="cursor-pointer">显示制单人</Label>
        <Switch
          checked={config.showCreator}
          onCheckedChange={(checked) => onUpdate({ showCreator: checked })}
        />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <Label className="cursor-pointer">显示客户确认</Label>
        <Switch
          checked={config.showCustomerConfirm}
          onCheckedChange={(checked) => onUpdate({ showCustomerConfirm: checked })}
        />
      </div>
    </div>

    <Separator />

    <div className="grid grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label>上边距 (mm)</Label>
        <Input
          type="number"
          value={config.marginTop}
          onChange={(e) => onUpdate({ marginTop: parseInt(e.target.value) || 15 })}
          min={5}
          max={50}
        />
      </div>
      <div className="space-y-2">
        <Label>下边距 (mm)</Label>
        <Input
          type="number"
          value={config.marginBottom}
          onChange={(e) => onUpdate({ marginBottom: parseInt(e.target.value) || 15 })}
          min={5}
          max={50}
        />
      </div>
      <div className="space-y-2">
        <Label>左边距 (mm)</Label>
        <Input
          type="number"
          value={config.marginLeft}
          onChange={(e) => onUpdate({ marginLeft: parseInt(e.target.value) || 20 })}
          min={5}
          max={50}
        />
      </div>
      <div className="space-y-2">
        <Label>右边距 (mm)</Label>
        <Input
          type="number"
          value={config.marginRight}
          onChange={(e) => onUpdate({ marginRight: parseInt(e.target.value) || 20 })}
          min={5}
          max={50}
        />
      </div>
    </div>
  </div>
);

export default function TemplateConfigPage() {
  const processCard = useProcessCardTemplate();
  const deliveryNote = useDeliveryNoteTemplate();
  const reconciliation = useReconciliationTemplate();
  const [activeTab, setActiveTab] = useState('process-card');
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_PRINTER_CONFIG;
    return getPrinterConfig();
  });

  const persistPrinterConfig = () => {
    if (printerConfig.mode === 'network' && !printerConfig.networkUrl.trim()) {
      toast.error('请输入网络打印服务地址');
      return;
    }
    if (printerConfig.mode === 'bluetooth' && (!printerConfig.bluetoothServiceUuid.trim() || !printerConfig.bluetoothCharacteristicUuid.trim())) {
      toast.error('请输入蓝牙 Service UUID 和 Characteristic UUID');
      return;
    }
    savePrinterConfig(printerConfig);
    toast.success('打印机配置已保存');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">打印模板配置</h1>
          <p className="text-muted-foreground mt-1">
            配置标识卡、送货单、对账单的打印模板，调整字段显示、宽度和对齐方式
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Printer className="h-5 w-5" />现场打印机</CardTitle>
          <CardDescription>浏览器打印无需配置；网络打印需填写本地打印桥接服务；蓝牙打印需使用 HTTPS 下的 Chrome/Edge。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>打印方式</Label>
              <Select value={printerConfig.mode} onValueChange={(mode: PrinterConfig['mode']) => setPrinterConfig(prev => ({ ...prev, mode }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="browser">浏览器/系统打印</SelectItem>
                  <SelectItem value="network">网络打印服务</SelectItem>
                  <SelectItem value="bluetooth">蓝牙打印机</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {printerConfig.mode === 'network' && (
              <div className="space-y-2 md:col-span-2">
                <Label>打印服务地址</Label>
                <Input value={printerConfig.networkUrl} onChange={event => setPrinterConfig(prev => ({ ...prev, networkUrl: event.target.value }))} placeholder="http://192.168.1.20:9101/print" />
              </div>
            )}
            {printerConfig.mode === 'bluetooth' && (
              <>
                <div className="space-y-2">
                  <Label>Service UUID</Label>
                  <Input value={printerConfig.bluetoothServiceUuid} onChange={event => setPrinterConfig(prev => ({ ...prev, bluetoothServiceUuid: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Characteristic UUID</Label>
                  <Input value={printerConfig.bluetoothCharacteristicUuid} onChange={event => setPrinterConfig(prev => ({ ...prev, bluetoothCharacteristicUuid: event.target.value }))} />
                </div>
              </>
            )}
          </div>
          <div id="printer-test-content" className="sr-only">热处理收发货管理系统 打印测试 {new Date().toLocaleString('zh-CN')}</div>
          <div className="flex gap-2">
            <Button onClick={persistPrinterConfig}>保存打印配置</Button>
            <Button variant="outline" onClick={async () => {
              persistPrinterConfig();
              try { await smartPrint('printer-test-content', '打印测试'); } catch { /* 已提示 */ }
            }}>测试打印</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[420px]">
          <TabsTrigger value="process-card" className="gap-2">
            <FileSignature className="h-4 w-4" />
            标识卡
          </TabsTrigger>
          <TabsTrigger value="delivery-note" className="gap-2">
            <Receipt className="h-4 w-4" />
            送货单
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-2">
            <FileText className="h-4 w-4" />
            对账单
          </TabsTrigger>
        </TabsList>

        {/* 标识卡配置 */}
        <TabsContent value="process-card" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    字段配置
                  </CardTitle>
                  <CardDescription>
                    配置流程卡中显示的字段、宽度和对齐方式
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={processCard.resetToDefault}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  恢复默认
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <CommonSettingsPanel config={processCard.config} onUpdate={processCard.updateConfig} />
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">字段列表</h4>
                  <Badge variant="secondary" className="text-xs">
                    {processCard.visibleFields.length} / {processCard.config.fields.length}
                  </Badge>
                </div>
                <FieldConfigTable
                  fields={processCard.config.fields}
                  onFieldUpdate={processCard.updateField}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                实时预览
              </CardTitle>
              <CardDescription>
                配置将实时反映在预览中，打印时会应用当前配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessCardPreview config={processCard.config} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 送货单配置 */}
        <TabsContent value="delivery-note" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    字段配置
                  </CardTitle>
                  <CardDescription>
                    配置送货单中显示的字段、宽度和对齐方式
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deliveryNote.resetToDefault}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  恢复默认
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <CommonSettingsPanel config={deliveryNote.config} onUpdate={deliveryNote.updateConfig} />
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">字段列表</h4>
                  <Badge variant="secondary" className="text-xs">
                    {deliveryNote.visibleFields.length} / {deliveryNote.config.fields.length}
                  </Badge>
                </div>
                <FieldConfigTable
                  fields={deliveryNote.config.fields}
                  onFieldUpdate={deliveryNote.updateField}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                实时预览
              </CardTitle>
              <CardDescription>
                配置将实时反映在预览中，打印时会应用当前配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryNotePreview config={deliveryNote.config} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 对账单配置 */}
        <TabsContent value="reconciliation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    字段配置
                  </CardTitle>
                  <CardDescription>
                    配置对账单中显示的字段、宽度和对齐方式
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconciliation.resetToDefault}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  恢复默认
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <CommonSettingsPanel config={reconciliation.config} onUpdate={reconciliation.updateConfig} />
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">字段列表</h4>
                  <Badge variant="secondary" className="text-xs">
                    {reconciliation.visibleFields.length} / {reconciliation.config.fields.length}
                  </Badge>
                </div>
                <FieldConfigTable
                  fields={reconciliation.config.fields}
                  onFieldUpdate={reconciliation.updateField}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                实时预览
              </CardTitle>
              <CardDescription>
                配置将实时反映在预览中，打印时会应用当前配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReconciliationPreview config={reconciliation.config} />
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>

      {/* 底部说明 */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="flex items-start gap-3 pt-6">
          <div className="h-5 w-5 rounded-full bg-amber-600/20 flex items-center justify-center mt-0.5">
            <span className="text-amber-600 text-xs font-bold">?</span>
          </div>
          <div className="text-sm text-amber-800">
            <p className="font-medium">配置说明</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>字段宽度单位为像素(px)，建议根据内容长度适当调整</li>
              <li>勾选"显示"复选框可控制该字段是否出现在打印单据中</li>
              <li>配置会自动保存，并在来货登记、快速发货、智能对账的打印功能中生效</li>
              <li>如需恢复默认设置，请点击"恢复默认"按钮</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
