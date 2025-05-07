import { relations, sql, type InferSelectModel } from "drizzle-orm";
import {
  bigint,
  decimal,
  index,
  int,
  mysqlTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
  type AnyMySqlTable,
} from "drizzle-orm/mysql-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM.
 * Use the same database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const mysqlTable = mysqlTableCreator((name: string) => `仓库系统_${name}`);

export const shipments = mysqlTable(
  "shipment",
  {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    shipmentNumber: varchar("shipment_number", { length: 20 }).notNull().unique(),
    operationNumber: varchar("operation_number", { length: 20 }).notNull(),
    materialTypeCode: varchar("material_type_code", { length: 20 }),
    quantity: int("quantity").notNull().default(1),
    actualWeight: decimal("actual_weight", { precision: 10, scale: 3 }).notNull(),
    length: decimal("length", { precision: 10, scale: 2 }).notNull(),
    width: decimal("width", { precision: 10, scale: 2 }).notNull(),
    height: decimal("height", { precision: 10, scale: 2 }).notNull(),
    materialWeight: decimal("material_weight", { precision: 10, scale: 3 }),
    perimeter: decimal("perimeter", { precision: 10, scale: 2 }),
    cbm: decimal("cbm", { precision: 10, scale: 2 }).notNull(),
    minWeightPerPiece: decimal("min_weight_per_piece", { precision: 10, scale: 2 }),
    totalWeight: decimal("total_weight", { precision: 10, scale: 3 }).notNull(),
    destination: varchar("destination", { length: 100 }),
    route: varchar("route", { length: 100 }),
    remarks: text("remarks"),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (example) => ({
    shipmentNumberIdx: index("shipment_number_idx").on(example.shipmentNumber),
    operationNumberIdx: index("operation_number_idx").on(example.operationNumber),
  })
);

export const warehouseRecords = mysqlTable(
  "warehouse_record",
  {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    shipmentId: bigint("shipment_id", { mode: "number" }).notNull(),
    inboundDate: timestamp("inbound_date").notNull(),
    outboundDate: timestamp("outbound_date"),
    status: varchar("status", { length: 20 }).notNull().default("in_warehouse"),
    storageDays: int("storage_days"),
    storageFee: decimal("storage_fee", { precision: 10, scale: 2 }),
    freeDays: int("free_days").notNull().default(7),
    standardRate: decimal("standard_rate", { precision: 10, scale: 2 }).notNull().default("1.00"),
    extendedRate: decimal("extended_rate", { precision: 10, scale: 2 }).notNull().default("2.00"),
    standardDaysLimit: int("standard_days_limit").notNull().default(30),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (example) => ({
    shipmentIdIdx: index("shipment_id_idx").on(example.shipmentId),
  })
);

export const shipmentRelations = relations(shipments, ({ many }) => ({
  warehouseRecords: many(warehouseRecords),
}));

export const warehouseRecordRelations = relations(warehouseRecords, ({ one }) => ({
  shipment: one(shipments, {
    fields: [warehouseRecords.shipmentId],
    references: [shipments.id],
  }),
}));

export type Shipment = InferSelectModel<typeof shipments>;
export type WarehouseRecord = InferSelectModel<typeof warehouseRecords>; 