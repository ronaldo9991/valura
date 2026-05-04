import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const watchlistsTable = pgTable("watchlists", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("My Watchlist"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const watchlistItemsTable = pgTable(
  "watchlist_items",
  {
    id: text("id").primaryKey(),
    watchlistId: text("watchlist_id")
      .notNull()
      .references(() => watchlistsTable.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqTicker: uniqueIndex("watchlist_items_unique_ticker").on(
      table.watchlistId,
      table.ticker,
    ),
  }),
);

export const insertWatchlistSchema = createInsertSchema(watchlistsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlistsTable.$inferSelect;

export const insertWatchlistItemSchema = createInsertSchema(
  watchlistItemsTable,
).omit({ addedAt: true });
export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;
export type WatchlistItem = typeof watchlistItemsTable.$inferSelect;
