import { relations, sql } from "drizzle-orm";
import {
  bigint,
  decimal,
  index,
  integer,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * 创建表名前缀
 */
export const pgTable = pgTableCreator((name) => `仓库系统_${name}`);

export const shipments = pgTable(
  "shipment",
  {
    id: serial("id").primaryKey(),
    shipmentNumber: varchar("shipment_number", { length: 20 }).notNull().unique(),
    operationNumber: varchar("operation_number", { length: 20 }).notNull(),
    materialTypeCode: varchar("material_type_code", { length: 20 }),
    quantity: integer("quantity").notNull().default(1),
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
    createdAt: timestamp("created_at", { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: 'string' })
      .defaultNow(),
  },
  (example) => ({
    shipmentNumberIdx: index("shipment_number_idx").on(example.shipmentNumber),
    operationNumberIdx: index("operation_number_idx").on(example.operationNumber),
  })
);

export const warehouseRecords = pgTable(
  "warehouse_record",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id").notNull(),
    inboundDate: timestamp("inbound_date", { mode: 'string' }).notNull(),
    outboundDate: timestamp("outbound_date", { mode: 'string' }),
    status: varchar("status", { length: 20 }).notNull().default("in_warehouse"),
    storageDays: integer("storage_days"),
    storageFee: decimal("storage_fee", { precision: 10, scale: 2 }),
    freeDays: integer("free_days").notNull().default(7),
    standardRate: decimal("standard_rate", { precision: 10, scale: 2 }).notNull().default("1.00"),
    extendedRate: decimal("extended_rate", { precision: 10, scale: 2 }).notNull().default("2.00"),
    standardDaysLimit: integer("standard_days_limit").notNull().default(30),
    createdAt: timestamp("created_at", { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: 'string' })
      .defaultNow(),
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