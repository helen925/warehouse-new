import { db } from './index.js';
import { shipments, warehouseRecords } from './schema.js';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
const envPath = path.resolve(process.cwd(), '.env.development.local');
if (fs.existsSync(envPath)) {
  console.log(`正在加载环境变量文件: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log(`环境变量文件不存在: ${envPath}`);
  console.log('正在尝试加载默认的 .env 文件');
  dotenv.config();
}

// 定义单独执行SQL语句的函数
const executeSQL = async (query, description) => {
  try {
    console.log(`执行: ${description}...`);
    await db.execute(sql.raw(query));
    console.log(`✅ ${description}完成`);
    return true;
  } catch (error) {
    console.error(`❌ ${description}失败:`, error);
    return false;
  }
};

// 执行迁移
const main = async () => {
  try {
    // 创建表
    console.log('开始创建数据库表...');
    
    // 表1: 创建shipments表
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS "仓库系统_shipment" (
        "id" SERIAL PRIMARY KEY,
        "shipment_number" VARCHAR(20) NOT NULL UNIQUE,
        "operation_number" VARCHAR(20) NOT NULL,
        "material_type_code" VARCHAR(20),
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "actual_weight" DECIMAL(10,3) NOT NULL,
        "length" DECIMAL(10,2) NOT NULL,
        "width" DECIMAL(10,2) NOT NULL,
        "height" DECIMAL(10,2) NOT NULL,
        "material_weight" DECIMAL(10,3),
        "perimeter" DECIMAL(10,2),
        "cbm" DECIMAL(10,2) NOT NULL,
        "min_weight_per_piece" DECIMAL(10,2),
        "total_weight" DECIMAL(10,3) NOT NULL,
        "destination" VARCHAR(100),
        "route" VARCHAR(100),
        "remarks" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, "Shipment表创建");

    // 表2: 创建warehouse_record表
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS "仓库系统_warehouse_record" (
        "id" SERIAL PRIMARY KEY,
        "shipment_id" INTEGER NOT NULL,
        "inbound_date" TIMESTAMP NOT NULL,
        "outbound_date" TIMESTAMP,
        "status" VARCHAR(20) NOT NULL DEFAULT 'in_warehouse',
        "storage_days" INTEGER,
        "storage_fee" DECIMAL(10,2),
        "free_days" INTEGER NOT NULL DEFAULT 7,
        "standard_rate" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
        "extended_rate" DECIMAL(10,2) NOT NULL DEFAULT 2.00,
        "standard_days_limit" INTEGER NOT NULL DEFAULT 30,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, "Warehouse Record表创建");
    
    // 表3: 创建待入库订单表
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS "仓库系统_pending_inbound_order" (
        "id" SERIAL PRIMARY KEY,
        "operation_number" VARCHAR(20) NOT NULL,
        "expected_arrival_date" TIMESTAMP NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT '待提货',
        "quantity" INTEGER DEFAULT 1,
        "description" TEXT,
        "contact_person" VARCHAR(50),
        "contact_phone" VARCHAR(20),
        "remarks" TEXT,
        "completed_at" TIMESTAMP,
        "shipment_id" INTEGER,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, "待入库订单表创建");

    // 创建索引 - 拆分为独立的语句
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS "shipment_number_idx" ON "仓库系统_shipment" ("shipment_number")
    `, "Shipment Number索引创建");
    
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS "operation_number_idx" ON "仓库系统_shipment" ("operation_number")
    `, "Operation Number索引创建");
    
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS "shipment_id_idx" ON "仓库系统_warehouse_record" ("shipment_id")
    `, "Shipment ID索引创建");
    
    // 待入库订单表索引
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS "pending_operation_number_idx" ON "仓库系统_pending_inbound_order" ("operation_number")
    `, "待入库订单操作单号索引创建");
    
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS "pending_status_idx" ON "仓库系统_pending_inbound_order" ("status")
    `, "待入库订单状态索引创建");

    // 创建外键约束
    await executeSQL(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_warehouse_record_shipment_id'
        ) THEN
          ALTER TABLE "仓库系统_warehouse_record"
          ADD CONSTRAINT "fk_warehouse_record_shipment_id"
          FOREIGN KEY ("shipment_id")
          REFERENCES "仓库系统_shipment"("id")
          ON DELETE CASCADE;
        END IF;
      END $$
    `, "外键约束创建");
    
    // 待入库订单与货物的外键关系
    await executeSQL(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_pending_order_shipment_id'
        ) THEN
          ALTER TABLE "仓库系统_pending_inbound_order"
          ADD CONSTRAINT "fk_pending_order_shipment_id"
          FOREIGN KEY ("shipment_id")
          REFERENCES "仓库系统_shipment"("id")
          ON DELETE SET NULL;
        END IF;
      END $$
    `, "待入库订单外键约束创建");

    // 确保序列正确设置
    await executeSQL(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = '仓库系统_shipment_id_seq') THEN
          CREATE SEQUENCE 仓库系统_shipment_id_seq;
          ALTER TABLE "仓库系统_shipment" ALTER COLUMN id SET DEFAULT nextval('仓库系统_shipment_id_seq');
        END IF;
      END $$
    `, "Shipment序列检查和创建");
    
    await executeSQL(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = '仓库系统_warehouse_record_id_seq') THEN
          CREATE SEQUENCE 仓库系统_warehouse_record_id_seq;
          ALTER TABLE "仓库系统_warehouse_record" ALTER COLUMN id SET DEFAULT nextval('仓库系统_warehouse_record_id_seq');
        END IF;
      END $$
    `, "Warehouse Record序列检查和创建");
    
    // 待入库订单序列
    await executeSQL(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = '仓库系统_pending_inbound_order_id_seq') THEN
          CREATE SEQUENCE 仓库系统_pending_inbound_order_id_seq;
          ALTER TABLE "仓库系统_pending_inbound_order" ALTER COLUMN id SET DEFAULT nextval('仓库系统_pending_inbound_order_id_seq');
        END IF;
      END $$
    `, "待入库订单序列检查和创建");

    console.log('🎉 数据库迁移完成');
  } catch (error) {
    console.error('数据库迁移过程中出错:', error);
    process.exit(1);
  }
};

// 执行迁移脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('运行迁移脚本时出错:', error);
    process.exit(1);
  }); 