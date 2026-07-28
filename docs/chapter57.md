

---

## 第57章 打印模板配置模块完整规格

### 57.1 模块概述

打印模板配置模块允许管理员自定义标识卡、送货单、对账单的打印模板，包括字段选择、布局调整和样式设置。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 模板列表 | `/settings/templates` | 管理所有打印模板 |
| 模板编辑 | 弹窗 | 可视化编辑模板 |
| 字段配置 | 编辑器内 | 选择显示字段和顺序 |
| 预览 | 编辑器内 | 实时预览打印效果 |
| 模板启用/禁用 | 列表操作 | 控制模板可用性 |
| 恢复默认 | 编辑器内 | 恢复系统默认模板 |

### 57.2 模板列表页

```tsx
function TemplateConfigPage() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['print-templates'],
    queryFn: () => templateApi.getAll(),
  });

  const [editingTemplate, setEditingTemplate] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: templateApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-templates'] });
      toast.success('删除成功');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">打印模板配置</h1>
        <Button onClick={() => setEditingTemplate({})}>
          <Plus className="w-4 h-4 mr-1" /> 新增模板
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates?.map(tpl => (
          <Card key={tpl.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{tpl.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">{getTypeLabel(tpl.type)}</Badge>
                </div>
                <Switch checked={tpl.enabled} onCheckedChange={() => toggleTemplate(tpl)} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{tpl.description || '暂无描述'}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingTemplate(tpl)}>
                  <Edit className="w-3 h-3 mr-1" /> 编辑
                </Button>
                <Button size="sm" variant="outline" onClick={() => previewTemplate(tpl)}>
                  <Eye className="w-3 h-3 mr-1" /> 预览
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(tpl.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingTemplate && (
        <TemplateEditorDialog
          template={editingTemplate}
          open={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}
```

### 57.3 模板编辑器

```tsx
function TemplateEditorDialog({ template, open, onClose }) {
  const [config, setConfig] = useState<TemplateConfig>(template.config || defaultConfig);
  const [activeTab, setActiveTab] = useState('fields');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{template.id ? '编辑模板' : '新增模板'}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[70vh]">
          {/* 左侧配置面板 */}
          <div className="w-1/2 overflow-y-auto pr-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="fields" className="flex-1">字段配置</TabsTrigger>
                <TabsTrigger value="layout" className="flex-1">布局设置</TabsTrigger>
                <TabsTrigger value="style" className="flex-1">样式设置</TabsTrigger>
              </TabsList>

              <TabsContent value="fields">
                <FieldConfig config={config} onChange={setConfig} type={template.type} />
              </TabsContent>
              <TabsContent value="layout">
                <LayoutConfig config={config} onChange={setConfig} />
              </TabsContent>
              <TabsContent value="style">
                <StyleConfig config={config} onChange={setConfig} />
              </TabsContent>
            </Tabs>
          </div>

          {/* 右侧预览面板 */}
          <div className="w-1/2 bg-muted/30 rounded-lg p-4 overflow-y-auto">
            <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.6)', transformOrigin: 'top center' }}>
              <TemplatePreview type={template.type} config={config} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant="ghost" onClick={() => setConfig(defaultConfig)}>恢复默认</Button>
          <Button onClick={() => handleSave()}>保存模板</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 57.4 字段配置

```tsx
function FieldConfig({ config, onChange, type }) {
  const availableFields = getAvailableFields(type);
  const selectedFields = config.fields || [];

  const toggleField = (field) => {
    const exists = selectedFields.find(f => f.key === field.key);
    if (exists) {
      onChange({ ...config, fields: selectedFields.filter(f => f.key !== field.key) });
    } else {
      onChange({ ...config, fields: [...selectedFields, field] });
    }
  };

  const moveField = (index, direction) => {
    const newFields = [...selectedFields];
    const targetIndex = index + direction;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange({ ...config, fields: newFields });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">可用字段</Label>
        <div className="flex flex-wrap gap-2">
          {availableFields.map(field => {
            const selected = selectedFields.find(f => f.key === field.key);
            return (
              <button
                key={field.key}
                onClick={() => toggleField(field)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm border transition-colors',
                  selected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary'
                )}
              >
                {field.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">已选字段（拖动排序）</Label>
        <div className="space-y-1">
          {selectedFields.map((field, index) => (
            <div key={field.key} className="flex items-center gap-2 p-2 bg-card rounded-md border border-border">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{field.label}</span>
              <button onClick={() => moveField(index, -1)} disabled={index === 0}>
                <ChevronUp className="w-4 h-4" />
              </button>
              <button onClick={() => moveField(index, 1)} disabled={index === selectedFields.length - 1}>
                <ChevronDown className="w-4 h-4" />
              </button>
              <button onClick={() => toggleField(field)}>
                <X className="w-4 h-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 57.5 可用字段定义

```typescript
function getAvailableFields(type: TemplateType): TemplateField[] {
  const commonFields = [
    { key: 'orgName', label: '公司名称' },
    { key: 'orgCode', label: '公司编码' },
    { key: 'date', label: '日期' },
    { key: 'operator', label: '操作人' },
  ];

  switch (type) {
    case 'tag':
      return [
        ...commonFields,
        { key: 'batchNo', label: '批次号' },
        { key: 'customerName', label: '客户名称' },
        { key: 'productName', label: '产品名称' },
        { key: 'material', label: '材质' },
        { key: 'process', label: '工艺' },
        { key: 'specification', label: '规格' },
        { key: 'qty', label: '数量' },
        { key: 'unit', label: '单位' },
        { key: 'weight', label: '重量' },
        { key: 'inboundDate', label: '入库日期' },
        { key: 'location', label: '库位' },
        { key: 'qrCode', label: '二维码' },
      ];

    case 'delivery':
      return [
        ...commonFields,
        { key: 'deliveryNo', label: '送货单号' },
        { key: 'customerName', label: '客户名称' },
        { key: 'customerContact', label: '联系人' },
        { key: 'customerPhone', label: '联系电话' },
        { key: 'customerAddress', label: '送货地址' },
        { key: 'items', label: '产品明细表' },
        { key: 'totalQty', label: '总数量' },
        { key: 'totalWeight', label: '总重量' },
        { key: 'remark', label: '备注' },
        { key: 'signature', label: '签收栏' },
      ];

    case 'reconciliation':
      return [
        ...commonFields,
        { key: 'reconNo', label: '对账单号' },
        { key: 'customerName', label: '客户名称' },
        { key: 'period', label: '对账期间' },
        { key: 'records', label: '明细表' },
        { key: 'totalInbound', label: '入库总额' },
        { key: 'totalOutbound', label: '出库总额' },
        { key: 'totalAmount', label: '应收总额' },
        { key: 'paidAmount', label: '已收金额' },
        { key: 'unpaidAmount', label: '未收金额' },
        { key: 'status', label: '状态' },
      ];

    default:
      return commonFields;
  }
}
```

### 57.6 布局配置

```tsx
function LayoutConfig({ config, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>纸张大小</Label>
        <Select
          value={config.pageSize || 'A4'}
          onValueChange={(v) => onChange({ ...config, pageSize: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="A4">A4 (210×297mm)</SelectItem>
            <SelectItem value="A5">A5 (148×210mm)</SelectItem>
            <SelectItem value="80mm">80mm 热敏纸</SelectItem>
            <SelectItem value="100mm">100mm 标签纸</SelectItem>
            <SelectItem value="custom">自定义</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>方向</Label>
        <Select
          value={config.orientation || 'portrait'}
          onValueChange={(v) => onChange({ ...config, orientation: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">纵向</SelectItem>
            <SelectItem value="landscape">横向</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>上边距 (mm)</Label>
          <Input
            type="number"
            value={config.marginTop ?? 10}
            onChange={(e) => onChange({ ...config, marginTop: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label>下边距 (mm)</Label>
          <Input
            type="number"
            value={config.marginBottom ?? 10}
            onChange={(e) => onChange({ ...config, marginBottom: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label>左边距 (mm)</Label>
          <Input
            type="number"
            value={config.marginLeft ?? 10}
            onChange={(e) => onChange({ ...config, marginLeft: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label>右边距 (mm)</Label>
          <Input
            type="number"
            value={config.marginRight ?? 10}
            onChange={(e) => onChange({ ...config, marginRight: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label>标题</Label>
        <Input
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder="如：产品标识卡"
        />
      </div>
    </div>
  );
}
```

### 57.7 样式配置

```tsx
function StyleConfig({ config, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>字体</Label>
        <Select
          value={config.fontFamily || 'SimSun'}
          onValueChange={(v) => onChange({ ...config, fontFamily: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="SimSun">宋体</SelectItem>
            <SelectItem value="SimHei">黑体</SelectItem>
            <SelectItem value="Microsoft YaHei">微软雅黑</SelectItem>
            <SelectItem value="KaiTi">楷体</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>标题字号</Label>
          <Input
            type="number"
            value={config.titleFontSize ?? 18}
            onChange={(e) => onChange({ ...config, titleFontSize: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label>正文字号</Label>
          <Input
            type="number"
            value={config.bodyFontSize ?? 12}
            onChange={(e) => onChange({ ...config, bodyFontSize: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label>表格样式</Label>
        <Select
          value={config.tableStyle || 'bordered'}
          onValueChange={(v) => onChange({ ...config, tableStyle: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bordered">边框表格</SelectItem>
            <SelectItem value="striped">条纹表格</SelectItem>
            <SelectItem value="minimal">简洁样式</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>显示二维码</Label>
        <Switch
          checked={config.showQRCode ?? false}
          onCheckedChange={(v) => onChange({ ...config, showQRCode: v })}
        />
      </div>

      <div>
        <Label>显示页码</Label>
        <Switch
          checked={config.showPageNumber ?? true}
          onCheckedChange={(v) => onChange({ ...config, showPageNumber: v })}
        />
      </div>
    </div>
  );
}
```

### 57.8 API 接口

```typescript
// 模板列表
GET /api/print-templates
Response: PrintTemplate[]

// 模板详情
GET /api/print-templates/:id
Response: PrintTemplate

// 创建模板
POST /api/print-templates
Body: { name, type, description, config, enabled }
Response: PrintTemplate

// 更新模板
PUT /api/print-templates/:id
Body: Partial<PrintTemplate>
Response: PrintTemplate

// 删除模板
DELETE /api/print-templates/:id
Response: { id: string }

// 启用/禁用模板
PATCH /api/print-templates/:id/toggle
Response: PrintTemplate

// 预览模板
POST /api/print-templates/:id/preview
Body: { recordId }
Response: { html: string }
```

### 57.9 默认模板

```typescript
const DEFAULT_TEMPLATES = {
  tag: {
    name: '默认标识卡模板',
    type: 'tag',
    config: {
      pageSize: '100mm',
      orientation: 'portrait',
      title: '产品标识卡',
      fields: ['orgName', 'batchNo', 'customerName', 'productName', 'material', 'process', 'specification', 'qty', 'weight', 'inboundDate', 'qrCode'],
      fontFamily: 'SimSun',
      titleFontSize: 16,
      bodyFontSize: 11,
      showQRCode: true,
    },
  },
  delivery: {
    name: '默认送货单模板',
    type: 'delivery',
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      title: '送货单',
      fields: ['orgName', 'deliveryNo', 'customerName', 'customerAddress', 'items', 'totalQty', 'totalWeight', 'remark', 'signature'],
      fontFamily: 'SimSun',
      titleFontSize: 18,
      bodyFontSize: 12,
      tableStyle: 'bordered',
      showPageNumber: true,
    },
  },
  reconciliation: {
    name: '默认对账单模板',
    type: 'reconciliation',
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      title: '对账单',
      fields: ['orgName', 'reconNo', 'customerName', 'period', 'records', 'totalAmount', 'paidAmount', 'unpaidAmount'],
      fontFamily: 'SimSun',
      titleFontSize: 18,
      bodyFontSize: 12,
      tableStyle: 'striped',
      showPageNumber: true,
    },
  },
};
```
