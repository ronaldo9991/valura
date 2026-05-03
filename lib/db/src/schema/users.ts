import { pgTable, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskProfileEnum = pgEnum("risk_profile", ["conservative", "moderate", "aggressive"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "approved", "rejected"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  riskProfile: riskProfileEnum("risk_profile").notNull().default("moderate"),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
  investmentGoal: text("investment_goal").notNull().default("wealth_accumulation"),
  currency: text("currency").notNull().default("USD"),
  totalPortfolioValue: numeric("total_portfolio_value", { precision: 18, scale: 4 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
