/* eslint-disable */
/** auto generated, do not edit */
import { pgTable, index, pgPolicy, uuid, varchar, text, uniqueIndex, check, integer, doublePrecision, boolean, jsonb, date, foreignKey, pgView, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

/** Escape single quotes in SQL string literals */
function escapeLiteral(str: string): string {
  return `'${str.replace(/'/g, "''")}'`;
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number};
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number){
    if(value == null) return value as any;
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    if(typeof value === 'string') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if(value instanceof Date) return value;
    return new Date(value);
  },
});

export const approvalRequest = pgTable("approval_request", {
  id: uuid().defaultRandom().notNull(),
  type: varchar({ length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 255 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  requester: userProfile("requester").notNull(),
  approver: userProfile("approver"),
  status: varchar({ length: 255 }).default('pending'),
  reason: text().notNull(),
  requestedAt: customTimestamptz('requested_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  approvedAt: customTimestamptz('approved_at'),
  rejectedAt: customTimestamptz('rejected_at'),
  rejectReason: text("reject_reason"),
  payload: jsonb(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_approval_request_approver").using("btree", table.approver.asc().nullsLast().op("record_ops")),
  index("idx_approval_request_entity").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
  index("idx_approval_request_requester").using("btree", table.requester.asc().nullsLast().op("record_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const appUser = pgTable("app_user", {
  id: uuid().defaultRandom().notNull(),
  username: varchar({ length: 100 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  name: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 50 }).default('viewer').notNull(),
  department: varchar({ length: 255 }),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 50 }),
  avatar: text(),
  position: varchar({ length: 255 }),
  location: varchar({ length: 255 }),
  status: varchar({ length: 50 }).default('active').notNull(),
  deviceLimit: integer("device_limit").default(3).notNull(),
  lastLoginAt: customTimestamptz('last_login_at'),
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, table => [uniqueIndex("idx_app_user_username").on(table.username)]);

export const authSession = pgTable("auth_session", {
  id: uuid().defaultRandom().notNull(),
  userId: uuid("user_id").notNull(),
  tokenId: varchar("token_id", { length: 128 }).notNull(),
  deviceName: varchar("device_name", { length: 255 }),
  expiresAt: customTimestamptz('expires_at').notNull(),
  revokedAt: customTimestamptz('revoked_at'),
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, table => [
  uniqueIndex("idx_auth_session_token").on(table.tokenId),
  index("idx_auth_session_user").on(table.userId),
]);

export const customer = pgTable("customer", {
  id: uuid().defaultRandom().notNull(),
  code: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  contact: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  address: text(),
  transport: varchar({ length: 255 }),
  paymentTerm: varchar("payment_term", { length: 255 }),
  deliveryDirection: varchar("delivery_direction", { length: 255 }),
  settlement: varchar({ length: 255 }),
  category: varchar({ length: 255 }),
  inboundCount: integer("inbound_count").default(0),
  status: varchar({ length: 255 }).default('active'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
  deletedAt: customTimestamptz('deleted_at'),
  deletedReason: text("deleted_reason"),
  lastInboundDate: customTimestamptz('last_inbound_date'),
  inboundCountMonthly: integer("inbound_count_monthly").default(0),
}, (table) => [
  uniqueIndex("idx_customer_code").using("btree", table.code.asc().nullsLast().op("text_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  check("check_customer_deleted_reason", sql`((deleted_at IS NULL) AND (deleted_reason IS NULL)) OR ((deleted_at IS NOT NULL) AND (deleted_reason IS NOT NULL))`),
]);

export const product = pgTable("product", {
  id: uuid().defaultRandom().notNull(),
  code: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  material: varchar({ length: 255 }),
  process: varchar({ length: 255 }),
  techRequirement: text("tech_requirement"),
  workpieceNo: varchar("workpiece_no", { length: 255 }),
  unit: varchar({ length: 255 }),
  unitPrice: doublePrecision("unit_price").default(0),
  customerCode: varchar("customer_code", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  stock: integer().default(0),
  inboundQuantity: integer("inbound_quantity").default(0),
  inboundWeight: doublePrecision("inbound_weight").default(0),
  inboundDate: customTimestamptz('inbound_date'),
  batchNo: varchar("batch_no", { length: 255 }),
  status: varchar({ length: 255 }).default('active'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
  stockWeight: doublePrecision("stock_weight").default(0),
  archivedAt: customTimestamptz('archived_at'),
  externalCode: varchar("external_code", { length: 255 }),
  barcode: varchar({ length: 255 }),
  archivedReason: text("archived_reason"),
  version: integer().default(1).notNull(),
  deletedAt: customTimestamptz('deleted_at'),
  unitPriceCents: integer("unit_price_cents").default(0).notNull(),
  warningThreshold: integer("warning_threshold").default(50),
  attachments: text().array(),
  maxStorageDays: integer("max_storage_days").default(180),
}, (table) => [
  uniqueIndex("idx_product_code").using("btree", table.code.asc().nullsLast().op("text_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  check("check_product_stock_non_negative", sql`stock >= 0`),
  check("check_product_stock_weight_non_negative", sql`stock_weight >= (0)::double precision`),
]);

export const operationLog = pgTable("operation_log", {
  id: uuid().defaultRandom().notNull(),
  entityType: varchar("entity_type", { length: 255 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  operation: varchar({ length: 255 }).notNull(),
  operator: userProfile("operator").notNull(),
  beforeState: text("before_state"),
  afterState: text("after_state"),
  source: varchar({ length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 255 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_operation_log_entity").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
  index("idx_operation_log_operator").using("btree", table.operator.asc().nullsLast().op("record_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const outboundDetail = pgTable("outbound_detail", {
  id: uuid().defaultRandom().notNull(),
  outboundId: uuid("outbound_id").notNull(),
  productId: uuid("product_id").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  workpieceNo: varchar("workpiece_no", { length: 255 }),
  material: varchar({ length: 255 }),
  process: varchar({ length: 255 }),
  unit: varchar({ length: 255 }),
  unitPrice: doublePrecision("unit_price").default(0),
  quantity: integer().notNull(),
  weight: doublePrecision().notNull(),
  amount: doublePrecision().default(0),
  batchNo: varchar("batch_no", { length: 255 }),
  inboundDate: customTimestamptz('inbound_date'),
  closeOrder: boolean("close_order").default(false).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_outbound_detail_outbound").using("btree", table.outboundId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const reconciliationDetailVersion = pgTable("reconciliation_detail_version", {
  id: uuid().defaultRandom().notNull(),
  reconciliationId: uuid("reconciliation_id").notNull(),
  version: integer().notNull(),
  outboundNo: varchar("outbound_no", { length: 255 }).notNull(),
  outboundDate: customTimestamptz('outbound_date').notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  workpieceNo: varchar("workpiece_no", { length: 255 }),
  material: varchar({ length: 255 }),
  process: varchar({ length: 255 }),
  quantity: integer().notNull(),
  weight: doublePrecision().notNull(),
  unitPrice: doublePrecision("unit_price").default(0),
  amount: doublePrecision().default(0),
  unit: varchar({ length: 255 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_reconciliation_detail_version_reconciliation").using("btree", table.reconciliationId.asc().nullsLast().op("uuid_ops")),
  index("idx_reconciliation_detail_version_reconciliation_version").using("btree", table.reconciliationId.asc().nullsLast().op("uuid_ops"), table.version.asc().nullsLast().op("int4_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const reconciliationDetail = pgTable("reconciliation_detail", {
  id: uuid().defaultRandom().notNull(),
  reconciliationId: uuid("reconciliation_id").notNull(),
  outboundNo: varchar("outbound_no", { length: 255 }).notNull(),
  outboundDate: customTimestamptz('outbound_date').notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  workpieceNo: varchar("workpiece_no", { length: 255 }),
  material: varchar({ length: 255 }),
  process: varchar({ length: 255 }),
  quantity: integer().notNull(),
  weight: doublePrecision().notNull(),
  unitPrice: doublePrecision("unit_price").default(0),
  amount: doublePrecision().default(0),
  unit: varchar({ length: 255 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  version: integer().default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  updateReason: text("update_reason"),
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_reconciliation_detail_active").using("btree", table.reconciliationId.asc().nullsLast().op("uuid_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
  index("idx_reconciliation_detail_reconciliation").using("btree", table.reconciliationId.asc().nullsLast().op("uuid_ops")),
  index("idx_reconciliation_detail_version").using("btree", table.reconciliationId.asc().nullsLast().op("uuid_ops"), table.version.asc().nullsLast().op("int4_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const reconciliation = pgTable("reconciliation", {
  id: uuid().defaultRandom().notNull(),
  reconciliationNo: varchar("reconciliation_no", { length: 255 }).notNull(),
  customerId: uuid("customer_id").notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerCode: varchar("customer_code", { length: 255 }).notNull(),
  month: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 255 }).default('audited'),
  totalAmount: doublePrecision("total_amount").default(0),
  deductionAmount: doublePrecision("deduction_amount").default(0),
  otherAmount: doublePrecision("other_amount").default(0),
  compensationAmount: doublePrecision("compensation_amount").default(0),
  finalAmount: doublePrecision("final_amount").default(0),
  invoiceAmount: doublePrecision("invoice_amount").default(0),
  uninvoiceAmount: doublePrecision("uninvoice_amount").default(0),
  receiptAmount: doublePrecision("receipt_amount").default(0),
  unreceivedAmount: doublePrecision("unreceived_amount").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
  totalAmountCents: integer("total_amount_cents").default(0).notNull(),
  deductionAmountCents: integer("deduction_amount_cents").default(0).notNull(),
  otherAmountCents: integer("other_amount_cents").default(0).notNull(),
  compensationAmountCents: integer("compensation_amount_cents").default(0).notNull(),
  finalAmountCents: integer("final_amount_cents").default(0).notNull(),
  invoiceAmountCents: integer("invoice_amount_cents").default(0).notNull(),
  receiptAmountCents: integer("receipt_amount_cents").default(0).notNull(),
  auditor: userProfile("auditor"),
  auditedAt: customTimestamptz('audited_at'),
  isLocked: boolean("is_locked").default(false),
  /**
   * 开票记录(JSON数组)
   */
  invoiceRecords: jsonb("invoice_records").default([]),
  /**
   * 回款记录(JSON数组)
   */
  receiptRecords: jsonb("receipt_records").default([]),
  version: integer().default(1).notNull(),
  /**
   * 反审核时的出库单快照信息，记录关联出库单在反审核时的状态，以便重新审核时进行变更检测
   */
  outboundSnapshot: jsonb("outbound_snapshot"),
}, (table) => [
  index("idx_reconciliation_auditor").using("btree", table.auditor.asc().nullsLast().op("record_ops")),
  index("idx_reconciliation_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const inventoryRecord = pgTable("inventory_record", {
  id: uuid().defaultRandom().notNull(),
  productId: uuid("product_id").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  material: varchar({ length: 255 }),
  process: varchar({ length: 255 }),
  workpieceNo: varchar("workpiece_no", { length: 255 }),
  unit: varchar({ length: 255 }),
  changeType: varchar("change_type", { length: 255 }).notNull(),
  quantityChange: integer("quantity_change").notNull(),
  weightChange: doublePrecision("weight_change").notNull(),
  beforeStock: integer("before_stock").notNull(),
  afterStock: integer("after_stock").notNull(),
  referenceNo: varchar("reference_no", { length: 255 }),
  customerCode: varchar("customer_code", { length: 255 }),
  customerName: varchar("customer_name", { length: 255 }),
  operator: varchar({ length: 255 }).notNull(),
  remark: text(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
  beforeStockWeight: doublePrecision("before_stock_weight").default(0).notNull(),
  afterStockWeight: doublePrecision("after_stock_weight").default(0).notNull(),
  attachments: text().array(),
  deletedAt: customTimestamptz('deleted_at'),
  originalInboundId: uuid("original_inbound_id"),
}, (table) => [
  index("idx_inventory_record_original_inbound").using("btree", table.originalInboundId.asc().nullsLast().op("uuid_ops")),
  index("idx_inventory_record_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const outboundOrder = pgTable("outbound_order", {
  id: uuid().defaultRandom().notNull(),
  outboundNo: varchar("outbound_no", { length: 255 }).notNull(),
  customerId: uuid("customer_id").notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerCode: varchar("customer_code", { length: 255 }).notNull(),
  outboundDate: customTimestamptz('outbound_date').notNull(),
  creator: varchar({ length: 255 }).notNull(),
  receiver: varchar({ length: 255 }),
  transporter: varchar({ length: 255 }),
  plateNumber: varchar("plate_number", { length: 255 }),
  driver: varchar({ length: 255 }),
  totalAmount: doublePrecision("total_amount").default(0),
  totalQuantity: integer("total_quantity").default(0),
  totalWeight: doublePrecision("total_weight").default(0),
  weight: doublePrecision().default(0),
  unitPriceColumn: doublePrecision("unit_price").default(0),
  status: varchar({ length: 255 }).default('pending_reconciliation'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
  reconciliationId: uuid("reconciliation_id"),
  lockStatus: varchar("lock_status", { length: 50 }).default('unlocked'),
  lockedAt: customTimestamptz('locked_at'),
  totalAmountCents: integer("total_amount_cents").default(0).notNull(),
  cancelledAt: customTimestamptz('cancelled_at'),
  cancelReason: text("cancel_reason"),
  version: integer().default(1).notNull(),
}, (table) => [
  uniqueIndex("idx_outbound_order_no").using("btree", table.outboundNo.asc().nullsLast().op("text_ops")),
  index("idx_outbound_order_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
  index("idx_outbound_order_reconciliation").using("btree", table.reconciliationId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const undoLog = pgTable("undo_log", {
  id: uuid().defaultRandom().notNull(),
  entityType: varchar("entity_type", { length: 255 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  operator: userProfile("operator").notNull(),
  reason: text(),
  undoTime: customTimestamptz('undo_time').default(sql`CURRENT_TIMESTAMP`).notNull(),
  originalData: text("original_data"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
  status: varchar({ length: 255 }).default('pending_approval'),
}, (table) => [
  index("idx_undo_log_entity").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const productMaterialThreshold = pgTable("product_material_threshold", {
  id: uuid().defaultRandom().notNull(),
  material: varchar({ length: 255 }).notNull(),
  defaultThreshold: integer("default_threshold").default(50).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_product_material").using("btree", table.material.asc().nullsLast().op("text_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const productBatch = pgTable("product_batch", {
  id: uuid().defaultRandom().notNull(),
  batchNo: varchar("batch_no", { length: 255 }).notNull(),
  productId: uuid("product_id").notNull(),
  inboundOrderId: uuid("inbound_order_id"),
  quantity: integer().notNull(),
  weight: doublePrecision().default(0),
  qualityStatus: varchar("quality_status", { length: 50 }).default('pending'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
  inboundDate: customTimestamptz('inbound_date'),
}, (table) => [
  index("idx_product_batch_inbound").using("btree", table.inboundOrderId.asc().nullsLast().op("uuid_ops")),
  index("idx_product_batch_inbound_date").using("btree", table.inboundDate.asc().nullsLast().op("timestamptz_ops")),
  uniqueIndex("idx_product_batch_no").using("btree", table.batchNo.asc().nullsLast().op("text_ops")),
  index("idx_product_batch_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const qualityInspection = pgTable("quality_inspection", {
  id: uuid().defaultRandom().notNull(),
  entityType: varchar("entity_type", { length: 255 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  status: varchar({ length: 255 }).default('pending'),
  inspector: userProfile("inspector"),
  inspectionDate: customTimestamptz('inspection_date'),
  items: text().notNull(),
  conclusion: text(),
  attachments: text().array(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_quality_inspection_entity").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const organization = pgTable("organization", {
  id: uuid().defaultRandom().notNull(),
  code: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  dbName: varchar("db_name", { length: 255 }).notNull(),
  dbHost: varchar("db_host", { length: 255 }),
  dbPort: integer("db_port").default(5432),
  dbUser: varchar("db_user", { length: 255 }),
  dbPassword: varchar("db_password", { length: 255 }),
  status: varchar({ length: 255 }).default('active'),
  maxUsers: integer("max_users").default(50),
  maxStorageGb: integer("max_storage_gb").default(10),
  expiresAt: customTimestamptz('expires_at'),
  contactName: varchar("contact_name", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  description: text(),
  feishuConfig: jsonb("feishu_config"),
  subdomain: varchar({ length: 255 }),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_org_code").using("btree", table.code.asc().nullsLast().op("text_ops")),
  index("idx_org_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const inboundOrder = pgTable("inbound_order", {
  id: uuid().defaultRandom().notNull(),
  inboundNo: varchar("inbound_no", { length: 255 }).notNull(),
  customerId: uuid("customer_id").notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerCode: varchar("customer_code", { length: 255 }).notNull(),
  inboundDate: customTimestamptz('inbound_date').notNull(),
  inboundTime: varchar("inbound_time", { length: 50 }),
  creator: varchar({ length: 255 }).notNull(),
  receiver: varchar({ length: 255 }),
  transporter: varchar({ length: 255 }),
  plateNumber: varchar("plate_number", { length: 255 }),
  driver: varchar({ length: 255 }),
  totalAmount: doublePrecision("total_amount").default(0),
  totalQuantity: integer("total_quantity").default(0),
  totalWeight: doublePrecision("total_weight").default(0),
  status: varchar({ length: 255 }).default('active'),
  totalAmountCents: integer("total_amount_cents").default(0).notNull(),
  cancelledAt: customTimestamptz('cancelled_at'),
  cancelReason: text("cancel_reason"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("idx_inbound_order_no").using("btree", table.inboundNo.asc().nullsLast().op("text_ops")),
  index("idx_inbound_order_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("查看全部入库单数据", { as: "permissive", for: "select", to: ["authenticated_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部入库单数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const inboundDetail = pgTable("inbound_detail", {
  id: uuid().defaultRandom().notNull(),
  inboundId: uuid("inbound_id").notNull(),
  productId: uuid("product_id").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productModel: varchar("product_model", { length: 255 }),
  productSpec: varchar("product_spec", { length: 255 }),
  unit: varchar({ length: 255 }),
  unitPrice: doublePrecision("unit_price").default(0),
  quantity: integer().notNull(),
  weight: doublePrecision().notNull(),
  amount: doublePrecision().default(0),
  inboundType: varchar("inbound_type", { length: 255 }),
  process: varchar({ length: 255 }),
  material: varchar({ length: 255 }),
  techRequirement: text("tech_requirement"),
  urgent: boolean().default(false),
  attachments: text().array().default(sql`'{}'::text[]`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_inbound_detail_inbound").using("btree", table.inboundId.asc().nullsLast().op("uuid_ops")),
  index("idx_inbound_detail_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("查看全部入库明细数据", { as: "permissive", for: "select", to: ["authenticated_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部入库明细数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const productBatchStock = pgTable("product_batch_stock", {
  id: uuid().defaultRandom().notNull(),
  batchId: uuid("batch_id").notNull(),
  productId: uuid("product_id").notNull(),
  quantityAvailable: integer("quantity_available").default(0).notNull(),
  weightAvailable: doublePrecision("weight_available").default(0).notNull(),
  lockedQuantity: integer("locked_quantity").default(0).notNull(),
  lockedWeight: doublePrecision("locked_weight").default(0).notNull(),
  status: varchar({ length: 255 }).default('active'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_product_batch_stock_batch").using("btree", table.batchId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  check("check_batch_quantity_available_non_negative", sql`quantity_available >= 0`),
  check("check_batch_weight_available_non_negative", sql`weight_available >= (0)::double precision`),
  check("check_batch_locked_quantity_non_negative", sql`locked_quantity >= 0`),
  check("check_batch_locked_weight_non_negative", sql`locked_weight >= (0)::double precision`),
]);

export const productCustomer = pgTable("product_customer", {
  id: uuid().defaultRandom().notNull(),
  productId: uuid("product_id").notNull(),
  customerId: uuid("customer_id").notNull(),
  isActive: boolean("is_active").default(true),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_product_customer_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
  index("idx_product_customer_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const statisticsDaily = pgTable("statistics_daily", {
  id: uuid().defaultRandom().notNull(),
  statDate: date("stat_date").notNull(),
  customerId: uuid("customer_id"),
  productId: uuid("product_id"),
  inboundQuantity: integer("inbound_quantity").default(0),
  inboundWeight: doublePrecision("inbound_weight").default(0),
  outboundQuantity: integer("outbound_quantity").default(0),
  outboundWeight: doublePrecision("outbound_weight").default(0),
  stockQuantity: integer("stock_quantity").default(0),
  stockWeight: doublePrecision("stock_weight").default(0),
  amount: doublePrecision().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_statistics_daily_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
  index("idx_statistics_daily_date").using("btree", table.statDate.asc().nullsLast().op("date_ops")),
  index("idx_statistics_daily_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const outboundBatchDetail = pgTable("outbound_batch_detail", {
  id: uuid().defaultRandom().notNull(),
  outboundDetailId: uuid("outbound_detail_id").notNull(),
  batchId: uuid("batch_id").notNull(),
  quantity: integer().notNull(),
  weight: doublePrecision().notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const organizationUser = pgTable("organization_user", {
  id: uuid().defaultRandom().notNull(),
  orgId: uuid("org_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  role: varchar({ length: 255 }).default('member'),
  status: varchar({ length: 255 }).default('active'),
  joinedAt: customTimestamptz('joined_at').default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_org_user_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
  index("idx_org_user_org_user").using("btree", table.orgId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("text_ops")),
  index("idx_org_user_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.orgId],
    foreignColumns: [organization.id],
    name: "organization_user_org_id_fkey"
  }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const organizationInvite = pgTable("organization_invite", {
  id: uuid().defaultRandom().notNull(),
  orgId: uuid("org_id").notNull(),
  inviteCode: varchar("invite_code", { length: 255 }).notNull(),
  role: varchar({ length: 255 }).default('member'),
  maxUses: integer("max_uses").default(1),
  usedCount: integer("used_count").default(0),
  expiresAt: customTimestamptz('expires_at'),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: customTimestamptz('created_at').default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_org_invite_code").using("btree", table.inviteCode.asc().nullsLast().op("text_ops")),
  index("idx_org_invite_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
  foreignKey({
    columns: [table.orgId],
    foreignColumns: [organization.id],
    name: "organization_invite_org_id_fkey"
  }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);

export const rolePermission = pgTable("role_permission", {
  id: uuid().defaultRandom().notNull(),
  roleName: varchar("role_name", { length: 255 }).notNull(),
  permissionCode: varchar("permission_code", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
  userId: varchar("user_id", { length: 255 }),
}, (table) => [
  index("idx_role_permission_permission").using("btree", table.permissionCode.asc().nullsLast().op("text_ops")),
  index("idx_role_permission_role").using("btree", table.roleName.asc().nullsLast().op("text_ops")),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjpstn2w2ds"], using: sql`true` }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjpstn2w2ds", "authenticated_workspace_aadjpstn2w2ds"] }),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjpstn2w2ds"] }),
]);
export const inventoryOverdueWarningInWorkspaceAadjpstn2W2Ds = pgView("inventory_overdue_warning", {
  productId: uuid("product_id"),
  productName: varchar("product_name", { length: 255 }),
  batchNo: varchar("batch_no", { length: 255 }),
  inboundDate: customTimestamptz('inbound_date'),
  storageDays: integer("storage_days"),
  maxStorageDays: integer("max_storage_days"),
  severity: text(),
}).as(sql`SELECT p.id AS product_id, p.name AS product_name, pb.batch_no, pb.inbound_date, CURRENT_DATE - pb.inbound_date::date AS storage_days, p.max_storage_days, CASE WHEN (CURRENT_DATE - pb.inbound_date::date)::numeric > (p.max_storage_days::numeric * 1.2) THEN 'danger'::text WHEN (CURRENT_DATE - pb.inbound_date::date) > p.max_storage_days THEN 'warning'::text ELSE 'normal'::text END AS severity FROM product p JOIN product_batch pb ON p.id = pb.product_id WHERE p.max_storage_days IS NOT NULL AND pb.inbound_date IS NOT NULL AND (CURRENT_DATE - pb.inbound_date::date)::numeric > (p.max_storage_days::numeric * 0.8)`);

// table aliases
export const approvalRequestTable = approvalRequest;
export const appUserTable = appUser;
export const authSessionTable = authSession;
export const customerTable = customer;
export const inboundDetailTable = inboundDetail;
export const inboundOrderTable = inboundOrder;
export const inventoryRecordTable = inventoryRecord;
export const operationLogTable = operationLog;
export const organizationTable = organization;
export const organizationInviteTable = organizationInvite;
export const organizationUserTable = organizationUser;
export const outboundBatchDetailTable = outboundBatchDetail;
export const outboundDetailTable = outboundDetail;
export const outboundOrderTable = outboundOrder;
export const productTable = product;
export const productBatchTable = productBatch;
export const productBatchStockTable = productBatchStock;
export const productCustomerTable = productCustomer;
export const productMaterialThresholdTable = productMaterialThreshold;
export const qualityInspectionTable = qualityInspection;
export const reconciliationTable = reconciliation;
export const reconciliationDetailTable = reconciliationDetail;
export const reconciliationDetailVersionTable = reconciliationDetailVersion;
export const rolePermissionTable = rolePermission;
export const statisticsDailyTable = statisticsDaily;
export const undoLogTable = undoLog;
