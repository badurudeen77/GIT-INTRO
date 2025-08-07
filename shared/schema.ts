import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // manufacturer, producer, distributor, pharmacist, customer
  walletAddress: text("wallet_address").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const drugBatches = pgTable("drug_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: text("batch_id").notNull().unique(),
  drugName: text("drug_name").notNull(),
  manufacturer: text("manufacturer").notNull(),
  manufacturingDate: timestamp("manufacturing_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  currentOwner: text("current_owner").notNull(),
  currentOwnerAddress: text("current_owner_address").notNull(),
  status: text("status").notNull().default("manufactured"), // manufactured, in_transit, delivered, expired
  ipfsHash: text("ipfs_hash"),
  contractAddress: text("contract_address"),
  tokenId: integer("token_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supplyChainEvents = pgTable("supply_chain_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: text("batch_id").notNull(),
  fromOwner: text("from_owner"),
  toOwner: text("to_owner").notNull(),
  fromOwnerAddress: text("from_owner_address"),
  toOwnerAddress: text("to_owner_address").notNull(),
  eventType: text("event_type").notNull(), // manufacture, transfer, verify
  transactionHash: text("transaction_hash"),
  blockNumber: integer("block_number"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  walletAddress: true,
});

export const insertDrugBatchSchema = createInsertSchema(drugBatches).pick({
  batchId: true,
  drugName: true,
  manufacturer: true,
  manufacturingDate: true,
  expiryDate: true,
  currentOwner: true,
  currentOwnerAddress: true,
  status: true,
  ipfsHash: true,
  contractAddress: true,
  tokenId: true,
});

export const insertSupplyChainEventSchema = createInsertSchema(supplyChainEvents).pick({
  batchId: true,
  fromOwner: true,
  toOwner: true,
  fromOwnerAddress: true,
  toOwnerAddress: true,
  eventType: true,
  transactionHash: true,
  blockNumber: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDrugBatch = z.infer<typeof insertDrugBatchSchema>;
export type DrugBatch = typeof drugBatches.$inferSelect;
export type InsertSupplyChainEvent = z.infer<typeof insertSupplyChainEventSchema>;
export type SupplyChainEvent = typeof supplyChainEvents.$inferSelect;
