# 热处理收发货管理系统 - 数据库导出方案

## 一、数据库结构说明

系统使用 PostgreSQL 数据库，包含以下 7 张核心表：

| 表名 | 说明 | 主要字段 |
|-----|------|---------|
| customer | 客户表 | 客户编号、名称、联系人、结算方式 |
| product | 产品表 | 产品编号、名称、材质、工艺、库存数量 |
| inventory_record | 库存变动记录表 | 入库/出库记录、变动数量、操作人员 |
| outbound_order | 出库单表 | 出库单号、客户、总金额、状态 |
| outbound_detail | 出库明细表 | 出库产品明细、数量、单价、金额 |
| reconciliation | 对账单表 | 对账月份、总金额、回款状态 |
| reconciliation_detail | 对账明细表 | 出库明细、产品信息、金额 |

---

## 二、导出数据库数据的三种方法

### 方法1：通过妙搭平台数据管理导出

1. 进入妙搭控制台 → 数据管理
2. 选择对应的数据表
3. 点击「导出」按钮，选择 CSV 或 Excel 格式
4. 下载数据文件

### 方法2：使用 pg_dump 命令行导出

```bash
# 导出整个数据库
pg_dump -h <数据库地址> -U <用户名> -d <数据库名> > heat_treatment_backup.sql

# 导出特定表
pg_dump -h <数据库地址> -U <用户名> -d <数据库名> -t customer -t product > tables_backup.sql
```

### 方法3：使用 SQL 查询导出

```sql
-- 导出客户数据
COPY (SELECT * FROM customer) TO '/tmp/customer.csv' WITH CSV HEADER;

-- 导出产品数据
COPY (SELECT * FROM product) TO '/tmp/product.csv' WITH CSV HEADER;

-- 导出库存记录
COPY (SELECT * FROM inventory_record) TO '/tmp/inventory_record.csv' WITH CSV HEADER;
```

---

## 三、模拟数据（供测试使用）

如果无法导出真实数据，可使用以下模拟数据进行测试：

### 1. 客户数据

```sql
INSERT INTO customer (id, code, name, contact, phone, address, transport, payment_term, delivery_direction, settlement, category, inbound_count, status, created_at, updated_at)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CUST001', '大连文火热处理有限公司', '张三', '13800138000', '大连市甘井子区华北路123号', '公路运输', '月结30天', '市内', '月结', '量产客户', 10, 'active', NOW(), NOW()),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'CUST002', '沈阳精密机械有限公司', '李四', '13900139000', '沈阳市铁西区建设大路456号', '公路运输', '月结45天', '省内', '月结', '单产客户', 5, 'active', NOW(), NOW()),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'CUST003', '哈尔滨重型设备有限公司', '王五', '13700137000', '哈尔滨市南岗区学府路789号', '铁路运输', '季结60天', '省外', '季结', '量产客户', 8, 'active', NOW(), NOW()),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'CUST004', '长春汽车零部件厂', '赵六', '13600136000', '长春市朝阳区工农大路321号', '公路运输', '月结30天', '省外', '月结', '量产客户', 12, 'active', NOW(), NOW()),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'CUST005', '鞍山钢铁集团', '钱七', '13500135000', '鞍山市铁东区解放路654号', '铁路运输', '月结60天', '省内', '月结', '大客户', 20, 'active', NOW(), NOW());
```

### 2. 产品数据

```sql
INSERT INTO product (id, code, name, material, process, tech_requirement, workpiece_no, unit, unit_price, customer_code, customer_name, stock, inbound_quantity, inbound_weight, inbound_date, batch_no, status, created_at, updated_at)
VALUES 
  ('p1q2r3s4-t5u6-7890-vwxy-z12345678901', 'PROD001', '齿轮轴', '40Cr', '渗碳淬火', '硬度HRC58-62，渗碳层0.8-1.2mm', 'W001', '件', 150.00, 'CUST001', '大连文火热处理有限公司', 100, 200, 400.00, '2026-01-10', 'B20260110', 'active', NOW(), NOW()),
  ('p2q3r4s5-u6v7-8901-wxyz-123456789012', 'PROD002', '轴承套', '45#钢', '调质处理', '硬度HB220-250，调质处理', 'W002', '件', 80.00, 'CUST001', '大连文火热处理有限公司', 150, 300, 450.00, '2026-01-12', 'B20260112', 'active', NOW(), NOW()),
  ('p3q4r5s6-v7w8-9012-xyza-234567890123', 'PROD003', '传动轴', '42CrMo', '淬火+回火', '硬度HRC45-48，淬火后回火', 'W003', '件', 200.00, 'CUST002', '沈阳精密机械有限公司', 80, 150, 300.00, '2026-01-15', 'B20260115', 'active', NOW(), NOW()),
  ('p4q5r6s7-w8x9-0123-yzab-345678901234', 'PROD004', '曲轴', '40CrNiMo', '氮化处理', '硬度HV800-1000，氮化层0.3-0.5mm', 'W004', '件', 350.00, 'CUST003', '哈尔滨重型设备有限公司', 50, 100, 250.00, '2026-01-18', 'B20260118', 'active', NOW(), NOW()),
  ('p5q6r7s8-x9y0-1234-zabc-456789012345', 'PROD005', '活塞杆', '35#钢', '高频淬火', '硬度HRC50-55，淬硬层2-4mm', 'W005', '件', 120.00, 'CUST004', '长春汽车零部件厂', 200, 400, 600.00, '2026-01-20', 'B20260120', 'active', NOW(), NOW());
```

### 3. 库存变动记录

```sql
INSERT INTO inventory_record (id, product_id, product_name, material, process, workpiece_no, unit, change_type, quantity_change, weight_change, before_stock, after_stock, reference_no, customer_code, customer_name, operator, remark, created_at)
VALUES 
  ('i1j2k3l4-m5n6-7890-opqr-s12345678901', 'p1q2r3s4-t5u6-7890-vwxy-z12345678901', '齿轮轴', '40Cr', '渗碳淬火', 'W001', '件', 'inbound', 200, 400.00, 0, 200, 'RK20260110001', 'CUST001', '大连文火热处理有限公司', '管理员', '正常入库', NOW()),
  ('i2j3k4l5-n6o7-8901-pqrs-t23456789012', 'p2q3r4s5-u6v7-8901-wxyz-123456789012', '轴承套', '45#钢', '调质处理', 'W002', '件', 'inbound', 300, 450.00, 0, 300, 'RK20260112001', 'CUST001', '大连文火热处理有限公司', '管理员', '正常入库', NOW()),
  ('i3j4k5l6-o7p8-9012-qrst-u34567890123', 'p3q4r5s6-v7w8-9012-xyza-234567890123', '传动轴', '42CrMo', '淬火+回火', 'W003', '件', 'inbound', 150, 300.00, 0, 150, 'RK20260115001', 'CUST002', '沈阳精密机械有限公司', '管理员', '正常入库', NOW()),
  ('i4j5k6l7-p8q9-0123-rstu-v45678901234', 'p1q2r3s4-t5u6-7890-vwxy-z12345678901', '齿轮轴', '40Cr', '渗碳淬火', 'W001', '件', 'outbound', -100, -200.00, 200, 100, 'CK20260120001', 'CUST001', '大连文火热处理有限公司', '管理员', '发货出库', NOW()),
  ('i5j6k7l8-q9r0-1234-stuv-w56789012345', 'p3q4r5s6-v7w8-9012-xyza-234567890123', '传动轴', '42CrMo', '淬火+回火', 'W003', '件', 'outbound', -70, -140.00, 150, 80, 'CK20260125001', 'CUST002', '沈阳精密机械有限公司', '管理员', '发货出库', NOW());
```

### 4. 出库单

```sql
INSERT INTO outbound_order (id, outbound_no, customer_id, customer_name, customer_code, outbound_date, creator, receiver, transporter, plate_number, driver, total_amount, total_quantity, total_weight, status, created_at, updated_at)
VALUES 
  ('o1p2q3r4-s5t6-7890-uvwx-y12345678901', 'CK20260120001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '大连文火热处理有限公司', 'CUST001', '2026-01-20 10:30:00', '管理员', '张三', '大连运输公司', '辽B12345', '赵司机', 15000.00, 100, 200.00, 'pending_reconciliation', NOW(), NOW()),
  ('o2p3q4r5-t6u7-8901-vwxy-z23456789012', 'CK20260125001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', '沈阳精密机械有限公司', 'CUST002', '2026-01-25 14:00:00', '管理员', '李四', '沈阳运输公司', '辽A67890', '钱司机', 14000.00, 70, 140.00, 'pending_reconciliation', NOW(), NOW());
```

### 5. 出库明细

```sql
INSERT INTO outbound_detail (id, outbound_id, product_id, product_name, workpiece_no, material, process, unit, unit_price, quantity, weight, amount, batch_no, inbound_date, created_at, updated_at)
VALUES 
  ('d1e2f3g4-h5i6-7890-jklm-n12345678901', 'o1p2q3r4-s5t6-7890-uvwx-y12345678901', 'p1q2r3s4-t5u6-7890-vwxy-z12345678901', '齿轮轴', 'W001', '40Cr', '渗碳淬火', '件', 150.00, 100, 200.00, 15000.00, 'B20260110', '2026-01-10', NOW(), NOW()),
  ('d2e3f4g5-i6j7-8901-klmn-o23456789012', 'o2p3q4r5-t6u7-8901-vwxy-z23456789012', 'p3q4r5s6-v7w8-9012-xyza-234567890123', '传动轴', 'W003', '42CrMo', '淬火+回火', '件', 200.00, 70, 140.00, 14000.00, 'B20260115', '2026-01-15', NOW(), NOW());
```

### 6. 对账单

```sql
INSERT INTO reconciliation (id, reconciliation_no, customer_id, customer_name, customer_code, month, status, total_amount, deduction_amount, other_amount, compensation_amount, final_amount, invoice_amount, uninvoice_amount, receipt_amount, unreceived_amount, created_at, updated_at)
VALUES 
  ('r1s2t3u4-v5w6-7890-xyza-b12345678901', 'R202601001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '大连文火热处理有限公司', 'CUST001', '2026-01', 'audited', 15000.00, 0.00, 0.00, 0.00, 15000.00, 15000.00, 0.00, 15000.00, 0.00, NOW(), NOW()),
  ('r2s3t4u5-w6x7-8901-yzab-c23456789012', 'R202601002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', '沈阳精密机械有限公司', 'CUST002', '2026-01', 'audited', 14000.00, 0.00, 0.00, 0.00, 14000.00, 14000.00, 0.00, 14000.00, 0.00, NOW(), NOW());
```

### 7. 对账明细

```sql
INSERT INTO reconciliation_detail (id, reconciliation_id, outbound_no, outbound_date, product_name, workpiece_no, material, process, quantity, weight, unit_price, amount, unit, created_at, updated_at)
VALUES 
  ('rd1e2f3g4-h5i6-7890-jklm-n12345678901', 'r1s2t3u4-v5w6-7890-xyza-b12345678901', 'CK20260120001', '2026-01-20 10:30:00', '齿轮轴', 'W001', '40Cr', '渗碳淬火', 100, 200.00, 150.00, 15000.00, '件', NOW(), NOW()),
  ('rd2e3f4g5-i6j7-8901-klmn-o23456789012', 'r2s3t4u5-w6x7-8901-yzab-c23456789012', 'CK20260125001', '2026-01-25 14:00:00', '传动轴', 'W003', '42CrMo', '淬火+回火', 70, 140.00, 200.00, 14000.00, '件', NOW(), NOW());
```

---

## 四、数据迁移到新环境的步骤

### 步骤1：在新环境创建数据库表结构

根据 `server/database/schema.ts` 创建 PostgreSQL 表结构。

### 步骤2：导入数据

```bash
# 使用 psql 导入 SQL 文件
psql -h <新数据库地址> -U <用户名> -d <数据库名> < backup.sql

# 或使用 pg_restore 导入
pg_restore -h <新数据库地址> -U <用户名> -d <数据库名> backup.dump
```

### 步骤3：验证数据

```sql
-- 检查客户数量
SELECT COUNT(*) FROM customer;

-- 检查产品数量
SELECT COUNT(*) FROM product;

-- 检查库存记录
SELECT COUNT(*) FROM inventory_record;
```

---

## 五、注意事项

1. **ID字段**：所有表使用 UUID 作为主键，导入时需要保留原有 ID 或重新生成
2. **时间戳字段**：`created_at` 和 `updated_at` 会自动填充
3. **系统字段**：`_created_by`、`_updated_by` 等字段在妙搭平台自动管理
4. **外键关联**：出库单、对账单等表需要正确关联客户ID和产品ID
5. **数据权限**：新环境需要重新配置 PostgreSQL 的行级安全策略(RLS)

---

导出日期：2026-02-05
