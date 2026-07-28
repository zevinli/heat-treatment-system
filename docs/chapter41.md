

---

## 第41章 打印系统完整规格

### 41.1 系统概述

打印系统支持三类单据的打印：标识卡（流程卡）、送货单（出库单）、对账单。系统提供自定义模板配置、在线预览和打印功能。

#### 功能架构

```
打印模板配置
├── 模板类型选择（标识卡/送货单/对账单）
├── 字段自定义（拖拽排序）
├── 纸张规格设置（A4/A5/自定义）
├── 预览与测试打印
└── 默认模板设置

现场打印
├── 入库后自动打印标识卡
├── 出库后打印送货单
├── 对账单生成后打印
├── 蓝牙打印机连接
├── 网络打印机连接
└── 浏览器打印（PDF）
```

### 41.2 模板类型

| 类型 | 标识 | 用途 | 纸张 | 主要字段 |
|------|------|------|------|---------|
| 标识卡 | `tagcard` | 入库后打印，随产品流转 | A5/标签纸 | 客户名、产品名、规格、数量、重量、入库日期、图片 |
| 送货单 | `delivery` | 出库时打印，随货交付 | A4 | 客户名、产品列表、数量、金额、送货日期、签字栏 |
| 对账单 | `reconciliation` | 月末对账，发给客户确认 | A4 | 客户名、对账周期、明细列表、汇总金额、回款状态 |

### 41.3 模板数据结构

#### 数据库 Schema

```typescript
// print_template 表
{
  id: string;
  name: string;              // 模板名称
  type: 'tagcard' | 'delivery' | 'reconciliation';
  paperSize: 'A4' | 'A5' | 'custom';
  orientation: 'portrait' | 'landscape';
  marginLeft: number;       // mm
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  fields: string;            // JSON: 字段配置数组
  content: string;           // HTML: 模板内容
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 字段配置 JSON

```typescript
interface TemplateField {
  key: string;               // 字段标识
  label: string;             // 显示名称
  type: 'text' | 'number' | 'date' | 'image' | 'table' | 'signature';
  visible: boolean;          // 是否显示
  order: number;             // 排序
  width?: string;            // 宽度（百分比或像素）
  align?: 'left' | 'center' | 'right';
  format?: string;           // 格式化模式
}

interface TemplateFieldsConfig {
  header: TemplateField[];   // 页眉字段
  body: TemplateField[];     // 正文字段
  footer: TemplateField[];   // 页脚字段
  table?: TemplateField[];   // 表格列（送货单/对账单）
}
```

### 41.4 模板字段清单

#### 标识卡字段

| 字段标识 | 显示名 | 类型 | 默认显示 |
|---------|--------|------|---------|
| customer_name | 客户名称 | text | ✅ |
| product_name | 产品名称 | text | ✅ |
| material | 材质 | text | ✅ |
| process | 工艺 | text | ✅ |
| specification | 规格 | text | ✅ |
| quantity | 数量 | number | ✅ |
| weight | 重量 | number | ✅ |
| unit | 单位 | text | ✅ |
| record_no | 流程卡号 | text | ✅ |
| inbound_date | 入库日期 | date | ✅ |
| product_image | 产品图片 | image | ✅ |
| qr_code | 二维码 | image | ⬜ |
| operator | 操作员 | text | ⬜ |
| remark | 备注 | text | ⬜ |

#### 送货单字段

| 字段标识 | 显示名 | 类型 | 默认显示 |
|---------|--------|------|---------|
| customer_name | 客户名称 | text | ✅ |
| delivery_no | 送货单号 | text | ✅ |
| delivery_date | 送货日期 | date | ✅ |
| batch_no | 批次号 | text | ✅ |
| product_table | 产品列表 | table | ✅ |
| total_qty | 总数量 | number | ✅ |
| total_weight | 总重量 | number | ✅ |
| total_amount | 总金额 | number | ✅ |
| operator | 发货人 | text | ✅ |
| receiver | 签收人 | signature | ✅ |
| remark | 备注 | text | ⬜ |

#### 对账单字段

| 字段标识 | 显示名 | 类型 | 默认显示 |
|---------|--------|------|---------|
| customer_name | 客户名称 | text | ✅ |
| reconciliation_no | 对账单号 | text | ✅ |
| period | 对账周期 | text | ✅ |
| detail_table | 明细列表 | table | ✅ |
| total_outbound | 出库总额 | number | ✅ |
| total_invoiced | 开票总额 | number | ✅ |
| total_paid | 回款总额 | number | ✅ |
| difference | 差异金额 | number | ✅ |
| status | 对账状态 | text | ✅ |
| remark | 备注 | text | ⬜ |

### 41.5 纸张规格

| 规格 | 尺寸(mm) | 适用 |
|------|---------|------|
| A4 | 210 × 297 | 送货单、对账单 |
| A5 | 148 × 210 | 标识卡 |
| 标签纸(100×80) | 100 × 80 | 标识卡（标签打印机） |
| 标签纸(100×150) | 100 × 150 | 标识卡（大标签） |
| 自定义 | 用户输入 | 特殊需求 |

#### 边距设置

```typescript
interface PaperMargins {
  marginLeft: number;    // 左边距 mm，默认 10
  marginRight: number;   // 右边距 mm，默认 10
  marginTop: number;     // 上边距 mm，默认 10
  marginBottom: number;  // 下边距 mm，默认 10
}
```

### 41.6 模板渲染

#### HTML 模板生成

```typescript
function renderTemplate(template: PrintTemplate, data: Record<string, unknown>): string {
  const fields: TemplateFieldsConfig = JSON.parse(template.fields);
  const visibleHeaderFields = fields.header.filter(f => f.visible).sort((a, b) => a.order - b.order);
  const visibleBodyFields = fields.body.filter(f => f.visible).sort((a, b) => a.order - b.order);

  return `
    <html>
    <head>
      <style>
        @page {
          size: ${template.paperSize} ${template.orientation};
          margin: ${template.marginTop}mm ${template.marginRight}mm ${template.marginBottom}mm ${template.marginLeft}mm;
        }
        body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .field { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .field-label { font-weight: 600; color: #333; }
        .field-value { color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .product-image { max-width: 200px; max-height: 200px; }
        .signature { margin-top: 40px; border-top: 1px solid #333; padding-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${visibleHeaderFields.map(f => `
          <div class="field">
            <span class="field-label">${f.label}:</span>
            <span class="field-value">${formatValue(data[f.key], f)}</span>
          </div>
        `).join('')}
      </div>
      <div class="body">
        ${visibleBodyFields.map(f => renderField(f, data[f.key])).join('')}
      </div>
    </body>
    </html>
  `;
}

function formatValue(value: unknown, field: TemplateField): string {
  if (value === null || value === undefined) return '';
  switch (field.type) {
    case 'date': return dayjs(value).format(field.format || 'YYYY-MM-DD');
    case 'number': return new Intl.NumberFormat('zh-CN').format(Number(value));
    case 'image': return `<img class="product-image" src="${value}" />`;
    default: return String(value);
  }
}
```

### 41.7 打印方式

#### 浏览器打印（PDF）

```typescript
async function printViaBrowser(html: string) {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  iframe.srcdoc = html;
}
```

#### 蓝牙打印机

```typescript
// 通过 Web Bluetooth API 连接蓝牙打印机
async function printViaBluetooth(data: PrintData) {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['printer_service'] }],
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService('printer_service');
  const characteristic = await service.getCharacteristic('printer_characteristic');

  // 将数据转为打印机指令（ESC/POS 或 TSPL）
  const commands = encodeToESCPOS(data);
  await characteristic.writeValue(commands);
}
```

### 41.8 打印模板配置页面

#### 页面结构

```
打印模板配置页面
├── 模板列表（左侧）
│   ├── 标识卡模板列表
│   ├── 送货单模板列表
│   └── 对账单模板列表
├── 模板编辑（右侧）
│   ├── 基本信息（名称、类型）
│   ├── 纸张设置（纸张大小、方向、边距）
│   ├── 字段配置（拖拽排序）
│   │   ├── 可选字段列表
│   │   └── 已选字段列表（拖拽排序）
│   └── 模板内容（HTML 编辑器）
└── 预览区域（底部/右侧）
    ├── 实时预览
    └── 测试打印按钮
```

#### 字段拖拽配置

使用 `@dnd-kit/core` + `@dnd-kit/sortable` 实现字段拖拽排序：

```tsx
function FieldConfigurator({ fields, onChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map(f => f.key)} strategy={verticalListSortingStrategy}>
        {fields.map((field) => (
          <SortableField key={field.key} field={field} onToggle={() => toggleField(field.key)} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### 41.9 API 接口

```typescript
// 获取模板列表
GET /api/print/templates?type=tagcard

// 获取模板详情
GET /api/print/templates/:id

// 创建模板
POST /api/print/templates
Body: { name, type, paperSize, orientation, marginLeft, ..., fields, content }

// 更新模板
PUT /api/print/templates/:id
Body: { name, paperSize, fields, ... }

// 删除模板
DELETE /api/print/templates/:id

// 设置默认模板
POST /api/print/templates/:id/set-default

// 预览模板
POST /api/print/preview
Body: { templateId, sampleData }
Response: { html: string }

// 打印单据
POST /api/print/print
Body: { templateId, recordType, recordId }
Response: { html: string }
```

### 41.10 默认模板

系统预置三种默认模板，首次创建租户时自动插入：

#### 标识卡默认模板

- 纸张：A5 竖向
- 边距：10mm 四边
- 字段：客户名称、产品名称、材质、工艺、规格、数量、重量、单位、流程卡号、入库日期、产品图片
- 布局：上半部分文字信息，下半部分产品图片

#### 送货单默认模板

- 纸张：A4 竖向
- 边距：15mm 四边
- 字段：客户名称、送货单号、送货日期、批次号、产品列表表格、总数量、总重量、总金额、发货人、签收栏
- 布局：页头信息+产品表格+页脚签字栏

#### 对账单默认模板

- 纸张：A4 竖向
- 边距：15mm 四边
- 字段：客户名称、对账单号、对账周期、明细列表表格、出库总额、开票总额、回款总额、差异金额、对账状态
- 布局：页头信息+明细表格+汇总区域
