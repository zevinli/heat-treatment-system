import { PGlite } from '@electric-sql/pglite';
import { join } from 'path';

async function main() {
  console.log("=== Initializing PGlite Database ===");
  const db = new PGlite(join(process.cwd(), 'data'));
  
  // Step 1: Create custom composite types (needed for drizzle compatibility)
  console.log("Creating composite types...");
  await db.exec(`DO $$ BEGIN
    CREATE TYPE user_profile AS (user_id text);
    EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;`);
  
  await db.exec(`DO $$ BEGIN
    CREATE TYPE file_attachment AS (bucket_id text, file_path text);
    EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;`);

  // Step 2: Create all tables
  console.log("Creating tables...");
  
  const tables = `
    -- ======== System tables ========
    CREATE TABLE IF NOT EXISTS organization (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      db_name VARCHAR(255) NOT NULL DEFAULT '',
      db_host VARCHAR(255),
      db_port INTEGER DEFAULT 5432,
      db_user VARCHAR(255),
      db_password VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      max_users INTEGER DEFAULT 50,
      max_storage_gb INTEGER DEFAULT 10,
      expires_at TIMESTAMPTZ,
      contact_name VARCHAR(255),
      contact_phone VARCHAR(255),
      contact_email VARCHAR(255),
      description TEXT,
      logo_url TEXT,
      is_active BOOLEAN DEFAULT true,
      feishu_config JSONB,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255),
      subdomain VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS organization_user (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organization(id),
      user_id VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'member',
      status VARCHAR(50) DEFAULT 'active',
      joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS organization_invite (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organization(id),
      invite_code VARCHAR(255) NOT NULL UNIQUE,
      role VARCHAR(50) DEFAULT 'member',
      created_by VARCHAR(255),
      expires_at TIMESTAMPTZ,
      max_uses INTEGER DEFAULT 10,
      used_count INTEGER DEFAULT 0,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS role_permission (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role_name VARCHAR(255) NOT NULL,
      permission_code VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      user_id VARCHAR(255),
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    -- ======== Business tables ========
    CREATE TABLE IF NOT EXISTS customer (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      contact VARCHAR(255),
      phone VARCHAR(255),
      address TEXT,
      transport VARCHAR(255),
      payment_term VARCHAR(255),
      delivery_direction VARCHAR(255),
      settlement VARCHAR(255),
      category VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      inbound_count INTEGER DEFAULT 0,
      inbound_count_monthly INTEGER DEFAULT 0,
      last_inbound_date TIMESTAMPTZ,
      deleted_at TIMESTAMPTZ,
      deleted_reason TEXT,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS product (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      material VARCHAR(255),
      process VARCHAR(255),
      tech_requirement TEXT,
      workpiece_no VARCHAR(255),
      unit VARCHAR(50),
      unit_price DOUBLE PRECISION DEFAULT 0,
      unit_price_cents INTEGER DEFAULT 0,
      external_code VARCHAR(255),
      barcode VARCHAR(255),
      customer_code VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      stock INTEGER DEFAULT 0,
      stock_weight DOUBLE PRECISION DEFAULT 0,
      inbound_quantity INTEGER DEFAULT 0,
      inbound_weight DOUBLE PRECISION DEFAULT 0,
      inbound_date TIMESTAMPTZ,
      warning_threshold INTEGER DEFAULT 50,
      max_storage_days INTEGER DEFAULT 30,
      status VARCHAR(50) DEFAULT 'complete',
      version INTEGER DEFAULT 1,
      deleted_at TIMESTAMPTZ,
      attachments TEXT[],
      archived_at TIMESTAMPTZ,
      archived_reason TEXT,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS product_customer (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES product(id),
      customer_id UUID NOT NULL,
      is_active BOOLEAN DEFAULT true,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS product_material_threshold (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      material VARCHAR(255) NOT NULL,
      default_threshold INTEGER DEFAULT 50,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS product_batch (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_no VARCHAR(255) NOT NULL UNIQUE,
      product_id UUID NOT NULL REFERENCES product(id),
      inbound_order_id UUID,
      quantity INTEGER NOT NULL,
      weight DOUBLE PRECISION DEFAULT 0,
      quality_status VARCHAR(50) DEFAULT 'pending',
      inbound_date TIMESTAMPTZ,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS product_batch_stock (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id UUID NOT NULL REFERENCES product_batch(id),
      product_id UUID NOT NULL REFERENCES product(id),
      quantity_available INTEGER NOT NULL DEFAULT 0,
      weight_available DOUBLE PRECISION NOT NULL DEFAULT 0,
      locked_quantity INTEGER NOT NULL DEFAULT 0,
      locked_weight DOUBLE PRECISION NOT NULL DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS inbound_order (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      inbound_no VARCHAR(255) NOT NULL,
      customer_id UUID NOT NULL REFERENCES customer(id),
      customer_name VARCHAR(255) NOT NULL,
      customer_code VARCHAR(255) NOT NULL,
      inbound_date TIMESTAMPTZ NOT NULL,
      inbound_time VARCHAR(50),
      creator VARCHAR(255) NOT NULL,
      internal_code VARCHAR(255),
      receiver VARCHAR(255),
      transporter VARCHAR(255),
      plate_number VARCHAR(255),
      driver VARCHAR(255),
      self_code VARCHAR(255),
      handler VARCHAR(255),
      handle_time VARCHAR(50),
      status VARCHAR(50) DEFAULT 'active',
      total_quantity INTEGER DEFAULT 0,
      total_weight DOUBLE PRECISION DEFAULT 0,
      total_amount DOUBLE PRECISION DEFAULT 0,
      total_amount_cents INTEGER DEFAULT 0 NOT NULL,
      cancelled_at TIMESTAMPTZ,
      cancel_reason TEXT,
      version INTEGER DEFAULT 1,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS inbound_detail (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      inbound_id UUID NOT NULL REFERENCES inbound_order(id),
      product_id UUID NOT NULL REFERENCES product(id),
      product_name VARCHAR(255) NOT NULL,
      product_model VARCHAR(255),
      product_spec VARCHAR(255),
      unit VARCHAR(50) NOT NULL,
      unit_price DOUBLE PRECISION DEFAULT 0,
      quantity INTEGER DEFAULT 0,
      weight DOUBLE PRECISION DEFAULT 0,
      amount DOUBLE PRECISION DEFAULT 0,
      inbound_type VARCHAR(50),
      process VARCHAR(255),
      material VARCHAR(255),
      tech_requirement TEXT,
      urgent BOOLEAN DEFAULT false,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS outbound_order (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      outbound_no VARCHAR(255) NOT NULL,
      customer_id UUID NOT NULL REFERENCES customer(id),
      customer_name VARCHAR(255) NOT NULL,
      customer_code VARCHAR(255) NOT NULL,
      outbound_date TIMESTAMPTZ NOT NULL,
      creator VARCHAR(255) NOT NULL,
      receiver VARCHAR(255),
      transporter VARCHAR(255),
      plate_number VARCHAR(255),
      driver VARCHAR(255),
      total_amount DOUBLE PRECISION DEFAULT 0,
      total_amount_cents INTEGER DEFAULT 0,
      total_quantity INTEGER DEFAULT 0,
      total_weight DOUBLE PRECISION DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending_reconciliation',
      lock_status VARCHAR(50) DEFAULT 'unlocked',
      locked_at TIMESTAMPTZ,
      reconciliation_id UUID,
      cancelled_at TIMESTAMPTZ,
      cancel_reason TEXT,
      version INTEGER DEFAULT 1,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS outbound_detail (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      outbound_id UUID NOT NULL,
      product_id UUID NOT NULL REFERENCES product(id),
      product_name VARCHAR(255) NOT NULL,
      workpiece_no VARCHAR(255),
      material VARCHAR(255),
      process VARCHAR(255),
      unit VARCHAR(50),
      unit_price DOUBLE PRECISION DEFAULT 0,
      quantity INTEGER DEFAULT 0,
      weight DOUBLE PRECISION DEFAULT 0,
      amount DOUBLE PRECISION DEFAULT 0,
      batch_no VARCHAR(255),
      inbound_date TIMESTAMPTZ,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS outbound_batch_detail (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      outbound_detail_id UUID NOT NULL,
      batch_id UUID NOT NULL REFERENCES product_batch(id),
      quantity INTEGER NOT NULL,
      weight DOUBLE PRECISION NOT NULL,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS inventory_record (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES product(id),
      product_name VARCHAR(255) NOT NULL,
      material VARCHAR(255),
      process VARCHAR(255),
      workpiece_no VARCHAR(255),
      unit VARCHAR(255),
      change_type VARCHAR(255) NOT NULL,
      quantity_change INTEGER NOT NULL,
      weight_change DOUBLE PRECISION NOT NULL,
      before_stock INTEGER NOT NULL,
      after_stock INTEGER NOT NULL,
      before_stock_weight DOUBLE PRECISION DEFAULT 0,
      after_stock_weight DOUBLE PRECISION DEFAULT 0,
      reference_no VARCHAR(255),
      customer_code VARCHAR(255),
      customer_name VARCHAR(255),
      operator VARCHAR(255) NOT NULL,
      remark TEXT,
      attachments TEXT[],
      original_inbound_id UUID,
      deleted_at TIMESTAMPTZ,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS reconciliation (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reconciliation_no VARCHAR(255) NOT NULL,
      customer_id UUID NOT NULL REFERENCES customer(id),
      customer_name VARCHAR(255) NOT NULL,
      customer_code VARCHAR(255) NOT NULL,
      month VARCHAR(7) NOT NULL,
      status VARCHAR(50) DEFAULT 'draft',
      total_amount DOUBLE PRECISION DEFAULT 0,
      total_amount_cents INTEGER DEFAULT 0,
      deduction_amount DOUBLE PRECISION DEFAULT 0,
      deduction_amount_cents INTEGER DEFAULT 0,
      other_amount DOUBLE PRECISION DEFAULT 0,
      other_amount_cents INTEGER DEFAULT 0,
      compensation_amount DOUBLE PRECISION DEFAULT 0,
      compensation_amount_cents INTEGER DEFAULT 0,
      final_amount DOUBLE PRECISION DEFAULT 0,
      final_amount_cents INTEGER DEFAULT 0,
      invoice_amount DOUBLE PRECISION DEFAULT 0,
      invoice_amount_cents INTEGER DEFAULT 0,
      uninvoice_amount DOUBLE PRECISION DEFAULT 0,
      receipt_amount DOUBLE PRECISION DEFAULT 0,
      receipt_amount_cents INTEGER DEFAULT 0,
      unreceived_amount DOUBLE PRECISION DEFAULT 0,
      auditor VARCHAR(255),
      audited_at TIMESTAMPTZ,
      is_locked BOOLEAN DEFAULT false,
      invoice_records JSONB DEFAULT '[]',
      receipt_records JSONB DEFAULT '[]',
      version INTEGER DEFAULT 1,
      outbound_snapshot JSONB,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS reconciliation_detail (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reconciliation_id UUID NOT NULL REFERENCES reconciliation(id),
      outbound_no VARCHAR(255) NOT NULL,
      outbound_date TIMESTAMPTZ NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      workpiece_no VARCHAR(255),
      material VARCHAR(255),
      process VARCHAR(255),
      quantity INTEGER DEFAULT 0,
      weight DOUBLE PRECISION DEFAULT 0,
      unit_price DOUBLE PRECISION DEFAULT 0,
      amount DOUBLE PRECISION DEFAULT 0,
      unit VARCHAR(50) NOT NULL,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS reconciliation_detail_version (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reconciliation_id UUID NOT NULL REFERENCES reconciliation(id),
      detail_id UUID NOT NULL,
      version INTEGER DEFAULT 1,
      snapshot JSONB NOT NULL,
      change_reason TEXT,
      changed_by VARCHAR(255),
      changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS quality_inspection (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(255) NOT NULL,
      entity_id UUID NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      inspector VARCHAR(255),
      inspection_date TIMESTAMPTZ,
      items TEXT NOT NULL,
      conclusion TEXT,
      attachments TEXT[],
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS approval_request (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(255) NOT NULL,
      entity_type VARCHAR(255) NOT NULL,
      entity_id UUID NOT NULL,
      requester VARCHAR(255) NOT NULL,
      approver VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      reason TEXT NOT NULL,
      requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMPTZ,
      rejected_at TIMESTAMPTZ,
      reject_reason TEXT,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS undo_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(255) NOT NULL,
      entity_id UUID NOT NULL,
      operator VARCHAR(255) NOT NULL,
      reason TEXT,
      undo_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      original_data TEXT,
      status VARCHAR(50) DEFAULT 'pending_approval',
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS operation_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(255) NOT NULL,
      entity_id UUID NOT NULL,
      operation VARCHAR(255) NOT NULL,
      operator VARCHAR(255) NOT NULL,
      before_state TEXT,
      after_state TEXT,
      source VARCHAR(255) NOT NULL DEFAULT 'web',
      ip_address VARCHAR(45),
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS statistics_daily (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stat_date DATE NOT NULL,
      customer_id UUID REFERENCES customer(id),
      product_id UUID REFERENCES product(id),
      inbound_quantity INTEGER DEFAULT 0,
      inbound_weight DOUBLE PRECISION DEFAULT 0,
      outbound_quantity INTEGER DEFAULT 0,
      outbound_weight DOUBLE PRECISION DEFAULT 0,
      stock_quantity INTEGER DEFAULT 0,
      stock_weight DOUBLE PRECISION DEFAULT 0,
      amount DOUBLE PRECISION DEFAULT 0,
      _created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _created_by VARCHAR(255),
      _updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      _updated_by VARCHAR(255)
    );
  `;

  await db.exec(tables);
  console.log("Tables created successfully!");

  // Step 3: Seed default data
  const { rows } = await db.query(`SELECT COUNT(*) as cnt FROM organization`);
  const count = Number((rows[0] as any).cnt);
  
  if (count === 0) {
    console.log("Seeding default organization...");
    await db.exec(`INSERT INTO organization (code, name, db_name, status) VALUES ('default', '默认组织', 'db_tenant_default', 'active')`);
    console.log("Default organization created (code: 'default')");

    // Seed some default role permissions
    await db.exec(`
      INSERT INTO role_permission (role_name, permission_code) VALUES 
      ('1', 'dashboard'), ('1', 'inbound'), ('1', 'outbound'), ('1', 'inventory'),
      ('1', 'reconciliation'), ('1', 'statistics'), ('1', 'customers'), ('1', 'products'),
      ('1', 'templates'), ('1', 'permissions'), ('1', 'admin'),
      ('2', 'inbound'), ('2', 'customers'), ('2', 'products'),
      ('3', 'outbound'), ('3', 'customers'), ('3', 'products'),
      ('4', 'reconciliation'), ('4', 'statistics');
    `);
  }

  console.log("=== Database initialization complete! ===");
  await db.close();
}

main().catch(console.error);
