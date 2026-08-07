/**
 * 热处理收发货管理系统 - 全面深度测试脚本
 */
import { PGlite } from '@electric-sql/pglite';
import { join } from 'path';
import * as fs from 'fs';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    passed++;
    console.log('  \u2705 ' + name);
  } else {
    failed++;
    const msg = '  \u274c ' + name + (detail ? ' - ' + detail : '');
    console.log(msg);
    failures.push(msg);
  }
}

async function assertThrows(fn: () => Promise<any>, expectedMsg: string, name: string) {
  try {
    await fn();
    assert(false, name, 'expected to throw but did not');
  } catch (e: any) {
    const msg = e?.message || String(e);
    assert(msg.includes(expectedMsg), name, 'caught: ' + msg);
  }
}

function summary() {
  console.log('\n' + '='.repeat(60));
  console.log('  测试结果: ' + passed + ' passed / ' + failed + ' failed (共 ' + (passed + failed) + ' 项)');
  if (failures.length > 0) {
    console.log('\n  失败项目:');
    failures.forEach(f => console.log('  ' + f));
  }
  console.log('='.repeat(60) + '\n');
  return failed === 0;
}

async function main() {
  console.log('\n=== 热处理系统全面深度测试 ===\n');

  const db = new PGlite(join(process.cwd(), 'data'));
  
  const uid = () => {
    const hex = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 32; i++) {
      if (i === 12) id += '4';
      else if (i === 16) id += hex[(8 + Math.floor(Math.random() * 4))];
      else id += hex[Math.floor(Math.random() * 16)];
    }
    return id.slice(0,8) + '-' + id.slice(8,12) + '-' + id.slice(12,16) + '-' + id.slice(16,20) + '-' + id.slice(20);
  };

  // ============ TEST 1: Schema Validation ============
  console.log('[TEST 1] 数据库 Schema 验证');
  
  const tableRes = await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_type = \'BASE TABLE\' ORDER BY table_name');
  const existingTables = (tableRes.rows as any[]).map((r: any) => r.table_name);
  
  const requiredTables = [
    'organization', 'organization_user', 'organization_invite', 'role_permission',
    'customer', 'product', 'product_batch', 'product_batch_stock', 'product_customer', 'product_material_threshold',
    'inbound_order', 'inbound_detail', 'outbound_order', 'outbound_detail', 'outbound_batch_detail',
    'inventory_record', 'reconciliation', 'reconciliation_detail', 'reconciliation_detail_version',
    'quality_inspection', 'approval_request', 'undo_log', 'operation_log', 'statistics_daily'
  ];
  
  for (const t of requiredTables) {
    assert(existingTables.includes(t), '表 ' + t + ' 存在');
  }

  // Key columns
  const colChecks = [
    {table: 'organization', col: 'feishu_config'},
    {table: 'organization', col: 'subdomain'},
    {table: 'inbound_order', col: 'total_amount_cents'},
    {table: 'inbound_detail', col: 'inbound_id'},
    {table: 'operation_log', col: 'source'},
    {table: 'product', col: 'external_code'},
    {table: 'product', col: 'barcode'},
    {table: 'product_batch_stock', col: 'weight_available'},
    {table: 'statistics_daily', col: 'inbound_quantity'},
    {table: 'statistics_daily', col: 'outbound_quantity'},
  ];
  
  for (const {table, col} of colChecks) {
    const res = await db.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2',
      [table, col]
    );
    assert(res.rows.length > 0, '列 ' + table + '.' + col + ' 存在');
  }

  // Constraint check
  const constraintRes = await db.query('SELECT tc.table_name, tc.constraint_name, tc.constraint_type FROM information_schema.table_constraints tc WHERE tc.table_schema = \'public\'');
  const constraints = constraintRes.rows as any[];
  const uniqueCount = constraints.filter(r => r.constraint_type === 'UNIQUE').length;
  const fkCount = constraints.filter(r => r.constraint_type === 'FOREIGN KEY').length;
  console.log('  - UNIQUE constraints: ' + uniqueCount + ', FOREIGN KEY: ' + fkCount);
  assert(uniqueCount > 0, 'UNIQUE 约束存在 (' + uniqueCount + '个)');
  assert(fkCount > 0, '外键约束存在 (' + fkCount + '个)');

  // ============ TEST 2: CRUD + Business Flow ============
  console.log('\n[TEST 2] 核心业务流程模拟');

  // 2.1 Organization
  const orgCode = 'TEST_' + Date.now();
  let orgId: string;
  let orgRes = await db.query(
    'INSERT INTO organization (code, name, db_name, status) VALUES ($1, $2, $3, $4) RETURNING id',
    [orgCode, '测试公司', 'db_tenant_' + orgCode, 'active']
  );
  orgId = (orgRes.rows[0] as any).id;
  assert(!!orgId, '创建组织成功');

  // UNIQUE constraint
  await assertThrows(
    () => db.query('INSERT INTO organization (code, name, db_name, status) VALUES ($1, $2, $3, $4)', [orgCode, '重复公司', 'db_dup', 'active']),
    'duplicate key',
    '组织 code UNIQUE 约束'
  );

  // 2.2 Customer
  const customerId1 = uid();
  const customerCode1 = 'CUST_' + Date.now() + '_1';
  await db.query(
    'INSERT INTO customer (id, code, name, contact, phone, address, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [customerId1, customerCode1, '上海重型机械厂', '张经理', '13800138001', '上海市浦东新区', 'active']
  );
  assert(true, '创建客户成功');

  const customerId2 = uid();
  await db.query(
    'INSERT INTO customer (id, code, name, contact, phone, status) VALUES ($1,$2,$3,$4,$5,$6)',
    [customerId2, 'CUST_' + Date.now() + '_2', '苏州精密制造', '李厂长', '13900139002', 'active']
  );

  // 2.3 Product
  const productId1 = uid();
  await db.query(
    'INSERT INTO product (id, code, name, material, process, unit, unit_price, stock, stock_weight, status, customer_code, customer_name, version, max_storage_days, warning_threshold) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)',
    [productId1, 'P_' + Date.now() + '_1', '齿轮轴', '42CrMo', '渗碳淬火', '件', 150.00, 100, 500.0, 'complete', customerCode1, '上海重型机械厂', 1, 30, 50]
  );
  let prodRes = await db.query('SELECT * FROM product WHERE id = $1', [productId1]);
  assert((prodRes.rows[0] as any)?.name === '齿轮轴', '创建产品');
  assert(Number((prodRes.rows[0] as any)?.stock) === 100, '初始库存=100');
  assert(Number((prodRes.rows[0] as any)?.stock_weight) === 500, '初始库存重量=500');

  const productId2 = uid();
  await db.query(
    'INSERT INTO product (id, code, name, material, process, unit, unit_price, stock, stock_weight, status, customer_code, customer_name, version, max_storage_days, warning_threshold) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)',
    [productId2, 'P_' + Date.now() + '_2', '轴承座', 'HT250', '时效处理', '件', 80.00, 60, 300.0, 'complete', 'CUST_X', '苏州精密制造', 1, 25, 30]
  );

  // 2.4 Inbound
  console.log('\n  2.4 入库流程');
  const inboundId1 = uid();
  const dateStr = new Date().toISOString().slice(2,10).replace(/-/g,'');
  const inboundNo1 = 'RK' + dateStr + '001';
  const inboundDate = new Date().toISOString();
  
  await db.query(
    'INSERT INTO inbound_order (id, inbound_no, customer_id, customer_name, customer_code, inbound_date, total_quantity, total_weight, total_amount, total_amount_cents, status, creator) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [inboundId1, inboundNo1, customerId1, '上海重型机械厂', customerCode1, inboundDate, 50, 250.0, 7500.00, 750000, 'active', '操作员']
  );
  await db.query(
    'INSERT INTO inbound_detail (id, inbound_id, product_id, product_name, material, quantity, weight, unit_price, amount, unit) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [uid(), inboundId1, productId1, '齿轮轴', '42CrMo', 50, 250.0, 150.00, 7500.00, '件']
  );

  // Update product stock
  let beforeRes = await db.query('SELECT stock, stock_weight, version FROM product WHERE id = $1', [productId1]);
  const beforeStock = Number((beforeRes.rows[0] as any).stock);
  const beforeWeight = Number((beforeRes.rows[0] as any).stock_weight);
  const beforeVersion = Number((beforeRes.rows[0] as any).version);
  
  await db.query(
    'UPDATE product SET stock = stock + 50, stock_weight = stock_weight + 250.0, version = version + 1, _updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND version = $2',
    [productId1, beforeVersion]
  );

  let afterRes = await db.query('SELECT stock, stock_weight, version FROM product WHERE id = $1', [productId1]);
  assert(Number((afterRes.rows[0] as any).stock) === beforeStock + 50, '入库后库存增加 (' + (beforeStock+50) + ')');
  assert(Number((afterRes.rows[0] as any).stock_weight) === beforeWeight + 250.0, '入库后重量增加');

  // Inventory record
  await db.query(
    'INSERT INTO inventory_record (id, product_id, product_name, change_type, quantity_change, weight_change, before_stock, after_stock, before_stock_weight, after_stock_weight, reference_no, operator, remark) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
    [uid(), productId1, '齿轮轴', 'inbound', 50, 250.0, beforeStock, beforeStock + 50, beforeWeight, beforeWeight + 250.0, inboundNo1, '操作员', '来货登记']
  );
  let invCntRes = await db.query('SELECT COUNT(*) as cnt FROM inventory_record WHERE reference_no = $1', [inboundNo1]);
  assert(Number((invCntRes.rows[0] as any).cnt) === 1, '入库库存记录创建');

  // 2.5 Batch
  console.log('\n  2.5 批次管理');
  const batchId1 = uid();
  const batchId2 = uid();
  await db.query('INSERT INTO product_batch (id, product_id, batch_no, quantity, weight, inbound_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7)', [batchId1, productId1, 'BATCH_A', 30, 150.0, inboundDate, 'active']);
  await db.query('INSERT INTO product_batch (id, product_id, batch_no, quantity, weight, inbound_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7)', [batchId2, productId1, 'BATCH_B', 20, 100.0, inboundDate, 'active']);
  await db.query('INSERT INTO product_batch_stock (id, batch_id, product_id, quantity_available, weight_available) VALUES ($1,$2,$3,$4,$5)', [uid(), batchId1, productId1, 30, 150.0]);
  await db.query('INSERT INTO product_batch_stock (id, batch_id, product_id, quantity_available, weight_available) VALUES ($1,$2,$3,$4,$5)', [uid(), batchId2, productId1, 20, 100.0]);
  
  let batchCntRes = await db.query('SELECT COUNT(*) as cnt FROM product_batch WHERE product_id = $1', [productId1]);
  assert(Number((batchCntRes.rows[0] as any).cnt) === 2, '2个批次创建');

  // 2.6 Outbound
  console.log('\n  2.6 出库流程');
  const outboundId1 = uid();
  const outboundNo1 = 'CK' + dateStr + '001';
  const outboundDate = new Date().toISOString();
  
  await db.query(
    'INSERT INTO outbound_order (id, outbound_no, customer_id, customer_name, customer_code, outbound_date, total_quantity, total_weight, total_amount, total_amount_cents, status, creator) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [outboundId1, outboundNo1, customerId1, '上海重型机械厂', customerCode1, outboundDate, 15, 75.0, 2250.00, 225000, 'active', '操作员']
  );
  await db.query(
    'INSERT INTO outbound_detail (id, outbound_id, product_id, product_name, material, quantity, weight, unit_price, amount, unit) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [uid(), outboundId1, productId1, '齿轮轴', '42CrMo', 15, 75.0, 150.00, 2250.00, '件']
  );

  // Deduct stock
  beforeRes = await db.query('SELECT stock, stock_weight, version FROM product WHERE id = $1', [productId1]);
  const beforeOutStock = Number((beforeRes.rows[0] as any).stock);
  const beforeOutWeight = Number((beforeRes.rows[0] as any).stock_weight);
  const beforeOutVersion = Number((beforeRes.rows[0] as any).version);
  
  await db.query(
    'UPDATE product SET stock = stock - 15, stock_weight = stock_weight - 75.0, version = version + 1, _updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND version = $2',
    [productId1, beforeOutVersion]
  );

  afterRes = await db.query('SELECT stock FROM product WHERE id = $1', [productId1]);
  assert(Number((afterRes.rows[0] as any).stock) === beforeOutStock - 15, '出库后库存减少 (' + (beforeOutStock-15) + ')');

  // 2.7 Reconciliation
  console.log('\n  2.7 智能对账');
  const reconciliationId = uid();
  await db.query(
    'INSERT INTO reconciliation (id, customer_id, customer_name, period_start, period_end, total_inbound_amount, total_outbound_amount, difference, status, operator) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [reconciliationId, customerId1, '上海重型机械厂', '2026-08-01', '2026-08-31', 7500.00, 2250.00, 5250.00, 'pending', '操作员']
  );
  let reconRes = await db.query('SELECT * FROM reconciliation WHERE id = $1', [reconciliationId]);
  assert((reconRes.rows[0] as any)?.status === 'pending', '对账单创建');
  assert(Number((reconRes.rows[0] as any)?.difference) === 5250.00, '对账差异=5250');

  // 2.8 Undo outbound
  console.log('\n  2.8 出库撤销');
  beforeRes = await db.query('SELECT stock, stock_weight, version FROM product WHERE id = $1', [productId1]);
  const beforeUndoStock = Number((beforeRes.rows[0] as any).stock);
  const beforeUndoVersion = Number((beforeRes.rows[0] as any).version);

  await db.query('UPDATE outbound_order SET status = \'cancelled\', cancelled_at = CURRENT_TIMESTAMP WHERE id = $1', [outboundId1]);
  
  await db.query(
    'UPDATE product SET stock = stock + 15, stock_weight = stock_weight + 75.0, version = version + 1, _updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND version = $2',
    [productId1, beforeUndoVersion]
  );

  await db.query(
    'INSERT INTO undo_log (id, entity_type, entity_id, operator, reason, undo_time, original_data, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [uid(), 'outbound_order', outboundId1, '操作员', '测试撤销', new Date().toISOString(), '{}', 'completed']
  );

  await db.query(
    'UPDATE product_batch_stock SET quantity_available = quantity_available + 15, weight_available = weight_available + 75.0 WHERE batch_id = $1',
    [batchId1]
  );

  afterRes = await db.query('SELECT stock FROM product WHERE id = $1', [productId1]);
  assert(Number((afterRes.rows[0] as any).stock) === beforeUndoStock + 15, '撤销后库存恢复 (' + (beforeUndoStock+15) + ')');

  let undoOrderRes = await db.query('SELECT status FROM outbound_order WHERE id = $1', [outboundId1]);
  assert((undoOrderRes.rows[0] as any)?.status === 'cancelled', '出库单status=cancelled');

  // ============ TEST 3: Data Consistency ============
  console.log('\n[TEST 3] 数据一致性验证');

  // 3.1 Stock consistency
  let finalRes = await db.query('SELECT p.stock, COALESCE(SUM(ir.quantity_change),0) as net_change FROM product p LEFT JOIN inventory_record ir ON p.id = ir.product_id WHERE p.id = $1 GROUP BY p.id, p.stock', [productId1]);
  const stock = Number((finalRes.rows[0] as any).stock);
  const netChange = Number((finalRes.rows[0] as any).net_change);
  const expectedStock = 100 + 50 - 15 + 15;
  assert(stock === expectedStock, '产品最终库存=' + stock + ' (期望=' + expectedStock + ')');
  assert(stock === 100 + netChange, '库存一致性: stock=初始+净变动 (' + netChange + ')');

  // 3.2 No orphan records
  let orphanRes = await db.query('SELECT d.id FROM inbound_detail d LEFT JOIN inbound_order o ON d.inbound_id = o.id WHERE o.id IS NULL');
  assert(orphanRes.rows.length === 0, 'inbound_detail无孤儿');

  orphanRes = await db.query('SELECT d.id FROM outbound_detail d LEFT JOIN outbound_order o ON d.outbound_id = o.id WHERE o.id IS NULL');
  assert(orphanRes.rows.length === 0, 'outbound_detail无孤儿');

  orphanRes = await db.query('SELECT ir.id FROM inventory_record ir LEFT JOIN product p ON ir.product_id = p.id WHERE p.id IS NULL');
  assert(orphanRes.rows.length === 0, 'inventory_record无孤儿');

  // 3.3 Optimistic lock
  console.log('\n  3.3 乐观锁测试');
  const prodLock = uid();
  await db.query(
    'INSERT INTO product (id, code, name, material, process, unit, unit_price, stock, stock_weight, status, customer_code, customer_name, version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
    [prodLock, 'P_LOCK_' + Date.now(), '锁测试产品', '45钢', '淬火', '件', 50, 10, 50, 'complete', customerCode1, '上海重型机械厂', 1]
  );

  let plRes = await db.query('SELECT version FROM product WHERE id = $1', [prodLock]);
  const v1 = Number((plRes.rows[0] as any).version);

  let upd1 = await db.query('UPDATE product SET stock = stock + 5, version = version + 1, _updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND version = $2 RETURNING version', [prodLock, v1]);
  assert(upd1.rows.length > 0, '乐观锁更新1成功');

  let upd2 = await db.query('UPDATE product SET stock = stock + 3, version = version + 1, _updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND version = $2 RETURNING version', [prodLock, v1]);
  assert(upd2.rows.length === 0, '乐观锁更新2被阻止 (版本不匹配)');

  plRes = await db.query('SELECT stock FROM product WHERE id = $1', [prodLock]);
  assert(Number((plRes.rows[0] as any).stock) === 15, '乐观锁后库存=15');

  // ============ TEST 4: Edge Cases ============
  console.log('\n[TEST 4] 边界情况测试');

  // 4.1 Fuzzy search
  let searchRes = await db.query('SELECT * FROM product WHERE name ILIKE $1 OR material ILIKE $1', ['%齿轮%']);
  assert(searchRes.rows.length >= 1, '模糊搜索"齿轮"找到 ' + searchRes.rows.length + ' 条');

  // 4.2 Date range
  let dateRes = await db.query('SELECT COUNT(*) as cnt FROM inbound_order WHERE inbound_date >= $1 AND inbound_date <= $2', ['2026-01-01', '2026-12-31']);
  assert(Number((dateRes.rows[0] as any).cnt) >= 2, '日期范围查询 >=2条');

  // 4.3 Pagination
  const bulkValues = [];
  for (let i = 0; i < 25; i++) {
    bulkValues.push('(\'' + uid() + '\', \'inbound_order\', \'' + inboundId1 + '\', \'update\', \'op' + i + '\', NULL, \'{}\', \'web\')');
  }
  await db.query('INSERT INTO operation_log (id, entity_type, entity_id, operation, operator, before_state, after_state, source) VALUES ' + bulkValues.join(','));

  let page1Res = await db.query('SELECT * FROM operation_log WHERE entity_id = $1 ORDER BY _created_at DESC LIMIT 10 OFFSET 0', [inboundId1]);
  assert(page1Res.rows.length === 10, '分页页1=10条');

  // 4.4 NULL handling
  console.log('\n  4.4 空值处理');
  let prodNullRes = await db.query('SELECT max_storage_days FROM product WHERE id = $1', [productId2]);
  assert((prodNullRes.rows[0] as any).max_storage_days === 25, '产品 max_storage_days=' + (prodNullRes.rows[0] as any).max_storage_days);

  // ============ TEST 5: Operation Logs ============
  console.log('\n[TEST 5] 操作日志完整性');
  await db.query(
    'INSERT INTO operation_log (id, entity_type, entity_id, operation, operator, before_state, after_state, source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [uid(), 'inbound_order', inboundId1, 'create', '测试操作员', null, JSON.stringify({status: 'active'}), 'web']
  );
  let logRes = await db.query('SELECT COUNT(*) as cnt FROM operation_log WHERE entity_id = $1', [inboundId1]);
  assert(Number((logRes.rows[0] as any).cnt) >= 2, '操作日志记录 >=2条');

  // ============ TEST 6: Feishu Config ============
  console.log('\n[TEST 6] 飞书集成配置');
  const envContent = fs.readFileSync(join(process.cwd(), '.env'), 'utf-8');
  
  const feishuChecks = [
    'FEISHU_APP_ID=cli_',
    'FEISHU_APP_SECRET=',
    'FEISHU_BITABLE_APP_TOKEN=',
    'FEISHU_TABLE_INBOUND=',
    'FEISHU_TABLE_OUTBOUND=',
    'FEISHU_TABLE_INVENTORY=',
    'FEISHU_TABLE_CUSTOMER=',
    'FEISHU_TABLE_RECONCILIATION=',
    'FEISHU_TABLE_QUALITY=',
    'FEISHU_TABLE_PROCESS=',
  ];
  for (const check of feishuChecks) {
    assert(envContent.includes(check), '飞书配置: ' + check.split('=')[0]);
  }

  const feishuDir = join(process.cwd(), 'server/modules/feishu');
  assert(fs.existsSync(feishuDir), '飞书模块目录存在');
  
  const feishuCore = ['bitable-sync.service.ts', 'feishu-auth.service.ts', 'feishu.controller.ts', 'feishu.module.ts'];
  const feishuFiles = fs.readdirSync(feishuDir);
  for (const f of feishuCore) {
    assert(feishuFiles.includes(f), '飞书文件 ' + f + ' 存在');
  }

  // ============ TEST 7: Frontend Build ============
  console.log('\n[TEST 7] 前端文件结构检查');
  const clientSrc = join(process.cwd(), 'client', 'src');
  if (fs.existsSync(clientSrc)) {
    const srcFiles = fs.readdirSync(clientSrc, { recursive: true }) as string[];
    const pageFiles = srcFiles.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
    console.log('  前端源文件数: ' + pageFiles.length);
    assert(pageFiles.length > 0, '前端源文件存在 (' + pageFiles.length + ' 文件)');
    
    // Check key pages
    const keyPages = ['Dashboard', 'Inbound', 'Outbound', 'Inventory', 'Reconciliation', 'Statistics', 'Customer', 'Product'];
    let found = 0;
    for (const p of keyPages) {
      if (pageFiles.some(f => f.includes(p))) found++;
    }
    console.log('  关键页面发现: ' + found + '/' + keyPages.length);
    assert(found >= keyPages.length - 1, '关键页面存在 (' + found + '/' + keyPages.length + ')');
  }

  // ============ TEST 8: Backend Module Check ============
  console.log('\n[TEST 8] 后端模块结构检查');
  const serverModules = join(process.cwd(), 'server', 'modules');
  if (fs.existsSync(serverModules)) {
    const modDirs = fs.readdirSync(serverModules, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    console.log('  后端模块数: ' + modDirs.length + ' (' + modDirs.join(', ') + ')');
    
    const requiredModules = ['admin', 'customer', 'product', 'inbound', 'outbound', 'inventory', 'reconciliation', 'statistics', 'feishu', 'tenant', 'undo', 'batch', 'permission'];
    for (const m of requiredModules) {
      assert(modDirs.includes(m), '模块 ' + m + ' 存在');
    }
  }

  await db.close();
  return summary();
}

main().then(success => { if (!success) process.exit(1); }).catch(err => { console.error('FATAL:', err); process.exit(1); });
