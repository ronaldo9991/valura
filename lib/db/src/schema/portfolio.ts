import { pgTable, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const holdingsTable = pgTable("holdings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  name: text("name").notNull(),
  shares: numeric("shares", { precision: 18, scale: 8 }).notNull(),
  avgCostBasis: numeric("avg_cost_basis", { precision: 18, scale: 4 }).notNull(),
  sector: text("sector").notNull().default("Unknown"),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cashBalancesTable = pgTable("cash_balances", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  balance: numeric("balance", { precision: 18, scale: 4 }).notNull().default("0"),
  currency: text("currency").notNull().default("USD"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHoldingSchema = createInsertSchema(holdingsTable).omit({ createdAt: true, updatedAt: true });
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdingsTable.$inferSelect;

export const insertCashBalanceSchema = createInsertSchema(cashBalancesTable).omit({ updatedAt: true });
export type InsertCashBalance = z.infer<typeof insertCashBalanceSchema>;
export type CashBalance = typeof cashBalancesTable.$inferSelect;
