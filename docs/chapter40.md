

---

## 第40章 数据库 Schema 与 ORM 完整参考

### 40.1 Drizzle ORM 概述

系统使用 Drizzle ORM 操作 PostgreSQL 数据库。Drizzle 是轻量级 TypeScript ORM，提供类型安全的数据库操作。

#### 核心概念

| 概念 | 说明 |
|------|------|
| pgTable | 定义数据库表 |
| pgEnum | 定义枚举类型 |
| customType | 自定义类型（如 userProfile） |
| customTimestamptz | 自定义时间戳类型 |
| eq/and/or/ilike | 查询条件构建器 |
| inArray | 数组条件查询 |
| count | 计数查询 |
| sql | 原生 SQL 模板 |

### 40.2 主数据库 Schema

主数据库存储组织级配置数据，Schema 定义在 `server/database/schema.ts` 的主库部分。

#### organization 表

```typescript
export const organization = pgTable('organization', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgCode: varchar('org_code', { length: 50 }).notNull().unique(),
  orgName: varchar('org_name', { length: 200 }).notNull(),
  dbHost: varchar('db_host', { length: 200 }).notNull(),
  dbPort: integer('db_port').default(5432),
  dbName: varchar('db_name', { length: 100 }).notNull(),
  dbUser: varchar('db_user', { length: 100 }).notNull(),
  dbPassword: text('db_password').notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  plan: varchar('plan', { length: 20 }).default('standard'),
  maxUsers: integer('max_users').default(50),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### organization_user 表

```typescript
export const organizationUser = pgTable('organization_user', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organization.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).default('member'),
  status: varchar('status', { length: 20 }).default('active'),
  joinedAt: customTimestamptz('joined_at').defaultNow().notNull(),
}, (table) => ({
  orgUserUnique: unique().on(table.orgId, table.userId),
}));
```

#### organization_invite 表

```typescript
export const organizationInvite = pgTable('organization_invite', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organization.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 200 }).notNull(),
  inviteCode: varchar('invite_code', { length: 100 }).notNull().unique(),
  role: varchar('role', { length: 20 }).default('member'),
  invitedBy: varchar('invited_by', { length: 100 }).notNull(),
  expiresAt: customTimestamptz('expires_at').notNull(),
  acceptedAt: customTimestamptz('accepted_at'),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 40.3 租户数据库 Schema

租户数据库包含所有业务表，每个表在 `server/database/schema.ts` 中定义。

#### customer 表（客户）

```typescript
export const customers = pgTable('customer', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  contactPerson: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 200 }),
  address: text('address'),
  taxNumber: varchar('tax_number', { length: 50 }),
  bankAccount: varchar('bank_account', { length: 100 }),
  bankName: varchar('bank_name', { length: 100 }),
  remark: text('remark'),
  createdBy: userProfile('created_by'),
  updatedBy: userProfile('updated_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### product 表（产品）

```typescript
export const products = pgTable('product', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  material: varchar('material', { length: 100 }),
  process: varchar('process', { length: 100 }),
  specification: varchar('specification', { length: 200 }),
  unit: varchar('unit', { length: 20 }).default('kg'),
  pricingMethod: varchar('pricing_method', { length: 20 }).default('weight'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  minOrderQty: decimal('min_order_qty', { precision: 10, scale: 3 }),
  remark: text('remark'),
  createdBy: userProfile('created_by'),
  updatedBy: userProfile('updated_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### inbound_record 表（入库记录）

```typescript
export const inboundRecords = pgTable('inbound_record', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordNo: varchar('record_no', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),
  totalWeight: decimal('total_weight', { precision: 10, scale: 3 }).default('0'),
  totalQty: integer('total_qty').default(0),
  status: varchar('status', { length: 20 }).default('pending'),
  inboundDate: customTimestamptz('inbound_date').notNull(),
  operatorId: userProfile('operator_id'),
  remark: text('remark'),
  createdBy: userProfile('created_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### inbound_item 表（入库明细）

```typescript
export const inboundItems = pgTable('inbound_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordId: uuid('record_id').references(() => inboundRecords.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 200 }).notNull(),
  material: varchar('material', { length: 100 }),
  process: varchar('process', { length: 100 }),
  specification: varchar('specification', { length: 200 }),
  quantity: integer('quantity').notNull(),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  unit: varchar('unit', { length: 20 }).default('kg'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  amount: decimal('amount', { precision: 12, scale: 2 }),
  images: text('images'),
  remark: text('remark'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

#### outbound_record 表（出库记录）

```typescript
export const outboundRecords = pgTable('outbound_record', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordNo: varchar('record_no', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),
  totalWeight: decimal('total_weight', { precision: 10, scale: 3 }).default('0'),
  totalQty: integer('total_qty').default(0),
  status: varchar('status', { length: 20 }).default('pending'),
  batchNo: varchar('batch_no', { length: 50 }),
  outboundDate: customTimestamptz('outbound_date').notNull(),
  deliveryDate: customTimestamptz('delivery_date'),
  operatorId: userProfile('operator_id'),
  remark: text('remark'),
  createdBy: userProfile('created_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### outbound_item 表（出库明细）

```typescript
export const outboundItems = pgTable('outbound_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordId: uuid('record_id').references(() => outboundRecords.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 200 }).notNull(),
  material: varchar('material', { length: 100 }),
  process: varchar('process', { length: 100 }),
  specification: varchar('specification', { length: 200 }),
  quantity: integer('quantity').notNull(),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  unit: varchar('unit', { length: 20 }).default('kg'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  amount: decimal('amount', { precision: 12, scale: 2 }),
  remark: text('remark'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

#### inventory 表（库存）

```typescript
export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 200 }).notNull(),
  material: varchar('material', { length: 100 }),
  process: varchar('process', { length: 100 }),
  specification: varchar('specification', { length: 200 }),
  currentQty: integer('current_qty').default(0),
  currentWeight: decimal('current_weight', { precision: 10, scale: 3 }).default('0'),
  unit: varchar('unit', { length: 20 }).default('kg'),
  location: varchar('location', { length: 100 }),
  batchNo: varchar('batch_no', { length: 50 }),
  inboundDate: customTimestamptz('inbound_date'),
  expiryDate: customTimestamptz('expiry_date'),
  status: varchar('status', { length: 20 }).default('normal'),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### reconciliation 表（对账记录）

```typescript
export const reconciliation = pgTable('reconciliation', {
  id: uuid('id').defaultRandom().primaryKey(),
  reconciliationNo: varchar('reconciliation_no', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id),
  period: varchar('period', { length: 10 }).notNull(),  // YYYY-MM
  totalOutboundAmount: decimal('total_outbound_amount', { precision: 12, scale: 2 }).default('0'),
  totalInvoicedAmount: decimal('total_invoiced_amount', { precision: 12, scale: 2 }).default('0'),
  totalPaidAmount: decimal('total_paid_amount', { precision: 12, scale: 2 }).default('0'),
  differenceAmount: decimal('difference_amount', { precision: 12, scale: 2 }).default('0'),
  status: varchar('status', { length: 20 }).default('unmatched'),
  matchedAt: customTimestamptz('matched_at'),
  matchedBy: userProfile('matched_by'),
  remark: text('remark'),
  createdBy: userProfile('created_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### print_template 表（打印模板）

```typescript
export const printTemplates = pgTable('print_template', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),  // tagcard/delivery/reconciliation
  paperSize: varchar('paper_size', { length: 20 }).default('A4'),
  orientation: varchar('orientation', { length: 10 }).default('portrait'),
  marginLeft: decimal('margin_left', { precision: 5, scale: 1 }).default('10'),
  marginRight: decimal('margin_right', { precision: 5, scale: 1 }).default('10'),
  marginTop: decimal('margin_top', { precision: 5, scale: 1 }).default('10'),
  marginBottom: decimal('margin_bottom', { precision: 5, scale: 1 }).default('10'),
  fields: text('fields'),
  content: text('content'),
  isDefault: boolean('is_default').default(false),
  createdBy: userProfile('created_by'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
  updatedAt: customTimestamptz('updated_at').defaultNow().notNull(),
});
```

#### operation_log 表（操作日志）

```typescript
export const operationLogs = pgTable('operation_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: userProfile('user_id'),
  module: varchar('module', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  targetType: varchar('target_type', { length: 50 }),
  targetId: varchar('target_id', { length: 100 }),
  description: text('description'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  requestData: text('request_data'),
  createdAt: customTimestamptz('created_at').defaultNow().notNull(),
});
```

### 40.4 自定义类型说明

#### userProfile

```typescript
export const userProfile = customType<{ data: string; driverData: unknown }>({
  dataType() {
    return 'user_profile';
  },
  fromDriver(value: unknown) {
    return String(value);
  },
});
```

- TypeScript 中对应 `string`
- 所有相关变量必须显式类型注解
- 存储妙搭平台用户ID

#### customTimestamptz

```typescript
export const customTimestamptz = customType<{ data: Date; driverData: string }>({
  dataType() {
    return 'timestamptz';
  },
  fromDriver(value: string) {
    return new Date(value);
  },
});
```

- Service 内查询返回 `Date` 对象
- API 响应 JSON 序列化后变为 ISO string
- `shared/api.interface.ts` 中声明为 `string`

### 40.5 ORM 操作模式

#### 查询

```typescript
// 简单查询
const result = await db.select().from(customers).where(eq(customers.id, id));

// 条件查询
const conditions = [];
if (search) conditions.push(ilike(customers.name, `%${search}%`));
if (material) conditions.push(eq(customers.material, material));
const where = conditions.length > 0 ? and(...conditions) : undefined;
const result = await db.select().from(customers).where(where);

// 关联查询
const result = await db.select({
  ...inboundRecords,
  customer: customers,
}).from(inboundRecords)
  .leftJoin(customers, eq(inboundRecords.customerId, customers.id));

// 计数
const [{ count: total }] = await db.select({ count: count() }).from(customers).where(where);
```

#### 插入

```typescript
const [result] = await db.insert(customers).values({
  name: '新客户',
  contactPerson: '张三',
  phone: '13800138000',
  createdBy: userId,
}).returning();
```

#### 更新

```typescript
const [result] = await db.update(customers)
  .set({ name: '更新名称', updatedAt: new Date() })
  .where(eq(customers.id, id))
  .returning();
if (!result) throw new NotFoundException('客户不存在');
```

#### 删除

```typescript
const [result] = await db.delete(customers)
  .where(eq(customers.id, id))
  .returning({ id: customers.id });
if (!result) throw new NotFoundException('客户不存在');
```

#### 事务

```typescript
await db.transaction(async (tx) => {
  const [inbound] = await tx.insert(inboundRecords).values(recordData).returning();
  await tx.insert(inboundItems).values(items.map(i => ({ ...i, recordId: inbound.id })));
  await tx.update(inventory).set({ currentQty: sql`${inventory.currentQty} + ${qty}` }).where(eq(inventory.productId, productId));
});
```

#### 原子更新（防止竞态）

```typescript
const [updated] = await db.update(inventory)
  .set({ currentQty: sql`${inventory.currentQty} - ${qty}` })
  .where(and(eq(inventory.id, id), gte(inventory.currentQty, qty)))
  .returning({ id: inventory.id });
if (!updated) throw new ConflictException('库存不足');
```
