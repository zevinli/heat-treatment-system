

---

## 第63章 数据库 Schema 完整定义参考

### 63.1 Schema 概览

系统数据库使用 PostgreSQL，通过 Drizzle ORM 管理所有表结构。以下是完整的表定义参考。

#### 表清单

| 表名 | 说明 | 核心字段数 |
|------|------|-----------|
| organizations | 组织表 | 8 |
| organization_members | 组织成员表 | 5 |
| customers | 客户表 | 12 |
| products | 产品表 | 14 |
| inbound_records | 入库记录表 | 10 |
| inbound_items | 入库明细表 | 8 |
| outbound_records | 出库记录表 | 12 |
| outbound_items | 出库明细表 | 8 |
| inventory | 库存表 | 10 |
| inventory_history | 库存变动历史表 | 8 |
| reconciliation_records | 对账记录表 | 14 |
| reconciliation_items | 对账明细表 | 6 |
| print_templates | 打印模板表 | 8 |
| print_logs | 打印日志表 | 7 |
| file_metas | 文件元信息表 | 8 |
| audit_logs | 审计日志表 | 7 |

### 63.2 组织表

```typescript
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.3 组织成员表

```typescript
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  userId: userProfile('user_id').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  joinedAt: customTimestamptz('joined_at').defaultNow().notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.4 客户表

```typescript
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  taxNumber: varchar('tax_number', { length: 50 }),
  bankName: varchar('bank_name', { length: 100 }),
  bankAccount: varchar('bank_account', { length: 50 }),
  remark: text('remark'),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.5 产品表

```typescript
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  material: varchar('material', { length: 50 }),
  process: varchar('process', { length: 50 }),
  specification: varchar('specification', { length: 255 }),
  unit: varchar('unit', { length: 20 }).default('kg').notNull(),
  pricingMethod: varchar('pricing_method', { length: 20 }).default('weight').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  minOrderQty: decimal('min_order_qty', { precision: 10, scale: 3 }),
  remark: text('remark'),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.6 入库记录表

```typescript
export const inboundRecords = pgTable('inbound_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  batchNo: varchar('batch_no', { length: 100 }),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: varchar('customer_name', { length: 255 }),
  inboundDate: customTimestamptz('inbound_date').notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  totalQty: decimal('total_qty', { precision: 12, scale: 3 }).default(0).notNull(),
  totalWeight: decimal('total_weight', { precision: 12, scale: 3 }).default(0).notNull(),
  photos: text('photos'),
  remark: text('remark'),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.7 入库明细表

```typescript
export const inboundItems = pgTable('inbound_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  inboundId: uuid('inbound_id').notNull().references(() => inboundRecords.id),
  productId: uuid('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  material: varchar('material', { length: 50 }),
  process: varchar('process', { length: 50 }),
  specification: varchar('specification', { length: 255 }),
  qty: decimal('qty', { precision: 12, scale: 3 }).notNull(),
  weight: decimal('weight', { precision: 12, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  amount: decimal('amount', { precision: 14, scale: 2 }),
  location: varchar('location', { length: 50 }),
  remark: text('remark'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.8 出库记录表

```typescript
export const outboundRecords = pgTable('outbound_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  outboundNo: varchar('outbound_no', { length: 100 }),
  inboundId: uuid('inbound_id').references(() => inboundRecords.id),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: varchar('customer_name', { length: 255 }),
  outboundDate: customTimestamptz('outbound_date').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  totalQty: decimal('total_qty', { precision: 12, scale: 3 }).default(0).notNull(),
  totalWeight: decimal('total_weight', { precision: 12, scale: 3 }).default(0).notNull(),
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).default(0).notNull(),
  deliveredQty: decimal('delivered_qty', { precision: 12, scale: 3 }).default(0).notNull(),
  remark: text('remark'),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.9 出库明细表

```typescript
export const outboundItems = pgTable('outbound_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  outboundId: uuid('outbound_id').notNull().references(() => outboundRecords.id),
  productId: uuid('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  material: varchar('material', { length: 50 }),
  process: varchar('process', { length: 50 }),
  specification: varchar('specification', { length: 255 }),
  qty: decimal('qty', { precision: 12, scale: 3 }).notNull(),
  weight: decimal('weight', { precision: 12, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  amount: decimal('amount', { precision: 14, scale: 2 }),
  remark: text('remark'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.10 库存表

```typescript
export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  material: varchar('material', { length: 50 }),
  specification: varchar('specification', { length: 255 }),
  currentQty: decimal('current_qty', { precision: 12, scale: 3 }).default(0).notNull(),
  currentWeight: decimal('current_weight', { precision: 12, scale: 3 }).default(0).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  location: varchar('location', { length: 50 }),
  batchNo: varchar('batch_no', { length: 100 }),
  inboundDate: customTimestamptz('inbound_date'),
  status: varchar('status', { length: 20 }).default('normal').notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.11 库存变动历史表

```typescript
export const inventoryHistory = pgTable('inventory_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  productId: uuid('product_id').notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  qty: decimal('qty', { precision: 12, scale: 3 }).notNull(),
  afterQty: decimal('after_qty', { precision: 12, scale: 3 }).notNull(),
  source: varchar('source', { length: 100 }),
  refId: uuid('ref_id'),
  operator: userProfile('operator').notNull(),
  remark: text('remark'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.12 对账记录表

```typescript
export const reconciliationRecords = pgTable('reconciliation_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  reconNo: varchar('recon_no', { length: 100 }),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  periodYear: integer('period_year').notNull(),
  periodMonth: integer('period_month').notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  totalInbound: decimal('total_inbound', { precision: 14, scale: 2 }).default(0).notNull(),
  totalOutbound: decimal('total_outbound', { precision: 14, scale: 2 }).default(0).notNull(),
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).default(0).notNull(),
  paidAmount: decimal('paid_amount', { precision: 14, scale: 2 }).default(0).notNull(),
  unpaidAmount: decimal('unpaid_amount', { precision: 14, scale: 2 }).default(0).notNull(),
  remark: text('remark'),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
  confirmedAt: customTimestamptz('confirmed_at'),
  confirmedBy: userProfile('confirmed_by'),
});
```

### 63.13 对账明细表

```typescript
export const reconciliationItems = pgTable('reconciliation_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  reconciliationId: uuid('reconciliation_id').notNull().references(() => reconciliationRecords.id),
  type: varchar('type', { length: 20 }).notNull(),
  refId: uuid('ref_id'),
  refNo: varchar('ref_no', { length: 100 }),
  date: customTimestamptz('date').notNull(),
  productName: varchar('product_name', { length: 255 }),
  qty: decimal('qty', { precision: 12, scale: 3 }),
  weight: decimal('weight', { precision: 12, scale: 3 }),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.14 打印模板表

```typescript
export const printTemplates = pgTable('print_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description'),
  config: jsonb('config').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdBy: userProfile('created_by').notNull(),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

### 63.15 打印日志表

```typescript
export const printLogs = pgTable('print_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  templateId: uuid('template_id').references(() => printTemplates.id),
  templateName: varchar('template_name', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(),
  refId: uuid('ref_id'),
  refNo: varchar('ref_no', { length: 100 }),
  status: varchar('status', { length: 20 }).default('success').notNull(),
  printedBy: userProfile('printed_by').notNull(),
  printedAt: customTimestamptz('printed_at').defaultNow().notNull(),
});
```

### 63.16 文件元信息表

```typescript
export const fileMetas = pgTable('file_metas', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  refId: uuid('ref_id'),
  uploadedBy: userProfile('uploaded_by').notNull(),
  uploadedAt: customTimestamptz('uploaded_at').defaultNow().notNull(),
});
```

### 63.17 审计日志表

```typescript
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  targetId: uuid('target_id'),
  targetType: varchar('target_type', { length: 50 }),
  changes: jsonb('changes'),
  operator: userProfile('operator').notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 63.18 索引定义

```sql
-- 组织相关索引
CREATE INDEX idx_org_members_org_user ON organization_members (org_id, user_id);

-- 客户相关索引
CREATE INDEX idx_customers_org ON customers (org_id);
CREATE INDEX idx_customers_org_name ON customers (org_id, name);

-- 产品相关索引
CREATE INDEX idx_products_org ON products (org_id);
CREATE INDEX idx_products_org_material_process ON products (org_id, material, process);

-- 入库相关索引
CREATE INDEX idx_inbound_org_date ON inbound_records (org_id, created_at DESC);
CREATE INDEX idx_inbound_org_customer ON inbound_records (org_id, customer_id);
CREATE INDEX idx_inbound_org_status ON inbound_records (org_id, status);
CREATE INDEX idx_inbound_org_batch ON inbound_records (org_id, batch_no);
CREATE INDEX idx_inbound_items_inbound ON inbound_items (inbound_id);

-- 出库相关索引
CREATE INDEX idx_outbound_org_date ON outbound_records (org_id, created_at DESC);
CREATE INDEX idx_outbound_org_inbound ON outbound_records (org_id, inbound_id);
CREATE INDEX idx_outbound_org_customer ON outbound_records (org_id, customer_id);
CREATE INDEX idx_outbound_org_status ON outbound_records (org_id, status);
CREATE INDEX idx_outbound_items_outbound ON outbound_items (outbound_id);

-- 库存相关索引
CREATE INDEX idx_inventory_org_product ON inventory (org_id, product_id);
CREATE INDEX idx_inventory_org_status ON inventory (org_id, status);
CREATE INDEX idx_inventory_org_batch ON inventory (org_id, batch_no);
CREATE INDEX idx_inventory_history_product ON inventory_history (org_id, product_id, created_at DESC);

-- 对账相关索引
CREATE INDEX idx_recon_org_period ON reconciliation_records (org_id, period_year, period_month);
CREATE INDEX idx_recon_org_customer ON reconciliation_records (org_id, customer_id);
CREATE INDEX idx_recon_org_status ON reconciliation_records (org_id, status);
CREATE INDEX idx_recon_items_recon ON reconciliation_items (reconciliation_id);

-- 打印模板相关索引
CREATE INDEX idx_templates_org_type ON print_templates (org_id, type, enabled);

-- 审计日志索引
CREATE INDEX idx_audit_org_module_date ON audit_logs (org_id, module, created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs (org_id, target_id);
```

### 63.19 Drizzle 关系定义

```typescript
export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  customers: many(customers),
  products: many(products),
  inboundRecords: many(inboundRecords),
  outboundRecords: many(outboundRecords),
  inventory: many(inventory),
  reconciliationRecords: many(reconciliationRecords),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  inboundRecords: many(inboundRecords),
  outboundRecords: many(outboundRecords),
  reconciliationRecords: many(reconciliationRecords),
}));

export const productsRelations = relations(products, ({ many }) => ({
  inboundItems: many(inboundItems),
  outboundItems: many(outboundItems),
  inventory: many(inventory),
}));

export const inboundRecordsRelations = relations(inboundRecords, ({ many, one }) => ({
  items: many(inboundItems),
  customer: one(customers, {
    fields: [inboundRecords.customerId],
    references: [customers.id],
  }),
  outboundRecords: many(outboundRecords),
}));

export const outboundRecordsRelations = relations(outboundRecords, ({ many, one }) => ({
  items: many(outboundItems),
  customer: one(customers, {
    fields: [outboundRecords.customerId],
    references: [customers.id],
  }),
  inboundRecord: one(inboundRecords, {
    fields: [outboundRecords.inboundId],
    references: [inboundRecords.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ many, one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
  history: many(inventoryHistory),
}));

export const reconciliationRecordsRelations = relations(reconciliationRecords, ({ many, one }) => ({
  customer: one(customers, {
    fields: [reconciliationRecords.customerId],
    references: [customers.id],
  }),
  items: many(reconciliationItems),
}));
```

### 63.20 数据类型说明

| Schema 类型 | TypeScript 类型 | PostgreSQL 类型 | 说明 |
|-------------|-----------------|-----------------|------|
| `uuid()` | `string` | `uuid` | UUID 主键 |
| `varchar()` | `string` | `varchar(n)` | 变长字符串 |
| `text()` | `string` | `text` | 长文本 |
| `integer()` | `number` | `integer` | 整数 |
| `decimal()` | `string` | `numeric(p,s)` | 精确小数（注意：TS 中为 string） |
| `boolean()` | `boolean` | `boolean` | 布尔值 |
| `jsonb()` | `unknown` | `jsonb` | JSON 数据 |
| `customTimestamptz()` | `Date`（service 内）/ `string`（API 响应） | `timestamptz` | 时间戳 |
| `userProfile()` | `string` | `user_profile` | 平台用户类型 |

### 63.21 decimal 类型注意事项

```typescript
// decimal 在 TypeScript 中为 string 类型
// 需要手动转换为 number
const qty: string = record.totalQty;
const qtyNum: number = parseFloat(qty);

// 比较时需要转换为 number
if (parseFloat(record.currentQty) < 10) {
  // 库存不足
}

// 计算时需要转换为 number
const total = parseFloat(item.qty) * parseFloat(item.unitPrice);
```
