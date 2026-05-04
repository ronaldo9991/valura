import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import {
  watchlistsTable,
  watchlistItemsTable,
  usersTable,
} from "@workspace/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { z } from "zod";
import { getBatchQuotes } from "../lib/market-data";

const router = Router();

const ListParams = z.object({ userId: z.string().min(1) });
const CreateBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});
const AddItemBody = z.object({
  ticker: z.string().trim().min(1).max(16),
});

router.get("/watchlists/:userId", async (req, res) => {
  try {
    const { userId } = ListParams.parse(req.params);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    const lists = await db
      .select()
      .from(watchlistsTable)
      .where(eq(watchlistsTable.userId, userId))
      .orderBy(asc(watchlistsTable.createdAt));

    if (lists.length === 0) {
      res.json({ watchlists: [] });
      return;
    }

    const listIds = lists.map((l) => l.id);
    const items = await db
      .select()
      .from(watchlistItemsTable)
      .where(eq(watchlistItemsTable.watchlistId, listIds[0]));

    const allItems =
      listIds.length > 1
        ? (
            await Promise.all(
              listIds.map((id) =>
                db
                  .select()
                  .from(watchlistItemsTable)
                  .where(eq(watchlistItemsTable.watchlistId, id)),
              ),
            )
          ).flat()
        : items;

    const tickers = [...new Set(allItems.map((i) => i.ticker.toUpperCase()))];
    const quotes = tickers.length > 0 ? await getBatchQuotes(tickers) : [];
    const quoteMap = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));

    const result = lists.map((list) => {
      const listItems = allItems
        .filter((i) => i.watchlistId === list.id)
        .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime())
        .map((item) => {
          const q = quoteMap.get(item.ticker.toUpperCase());
          return {
            id: item.id,
            ticker: item.ticker,
            addedAt: item.addedAt.toISOString(),
            name: q?.name ?? item.ticker,
            price: q?.price ?? null,
            changePct: q?.changePct ?? null,
            currency: q?.currency ?? "USD",
          };
        });
      return {
        id: list.id,
        name: list.name,
        createdAt: list.createdAt.toISOString(),
        items: listItems,
      };
    });

    res.json({ watchlists: result });
  } catch (err) {
    req.log.error({ err }, "Failed to list watchlists");
    res
      .status(500)
      .json({ error: "internal_error", message: "Failed to list watchlists" });
  }
});

router.post("/watchlists/:userId", async (req, res) => {
  try {
    const { userId } = ListParams.parse(req.params);
    const { name } = CreateBody.parse(req.body ?? {});

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    const id = randomUUID();
    const [created] = await db
      .insert(watchlistsTable)
      .values({ id, userId, name: name ?? "My Watchlist" })
      .returning();

    res.status(201).json({
      id: created.id,
      name: created.name,
      createdAt: created.createdAt.toISOString(),
      items: [],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create watchlist");
    res
      .status(500)
      .json({ error: "internal_error", message: "Failed to create watchlist" });
  }
});

router.delete("/watchlists/:userId/:watchlistId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const watchlistId = req.params.watchlistId;

    const deleted = await db
      .delete(watchlistsTable)
      .where(
        and(
          eq(watchlistsTable.id, watchlistId),
          eq(watchlistsTable.userId, userId),
        ),
      )
      .returning({ id: watchlistsTable.id });

    if (deleted.length === 0) {
      res
        .status(404)
        .json({ error: "not_found", message: "Watchlist not found" });
      return;
    }

    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete watchlist");
    res
      .status(500)
      .json({ error: "internal_error", message: "Failed to delete watchlist" });
  }
});

router.post("/watchlists/:userId/:watchlistId/items", async (req, res) => {
  try {
    const userId = req.params.userId;
    const watchlistId = req.params.watchlistId;
    const { ticker } = AddItemBody.parse(req.body);

    const [list] = await db
      .select()
      .from(watchlistsTable)
      .where(
        and(
          eq(watchlistsTable.id, watchlistId),
          eq(watchlistsTable.userId, userId),
        ),
      );
    if (!list) {
      res
        .status(404)
        .json({ error: "not_found", message: "Watchlist not found" });
      return;
    }

    const id = randomUUID();
    const upper = ticker.toUpperCase();
    try {
      const [item] = await db
        .insert(watchlistItemsTable)
        .values({ id, watchlistId, ticker: upper })
        .returning();
      res.status(201).json({
        id: item.id,
        ticker: item.ticker,
        addedAt: item.addedAt.toISOString(),
      });
    } catch (insertErr) {
      const msg = insertErr instanceof Error ? insertErr.message : "";
      if (msg.toLowerCase().includes("unique")) {
        res
          .status(409)
          .json({ error: "duplicate", message: "Ticker already in watchlist" });
        return;
      }
      throw insertErr;
    }
  } catch (err) {
    req.log.error({ err }, "Failed to add watchlist item");
    res
      .status(500)
      .json({ error: "internal_error", message: "Failed to add item" });
  }
});

router.delete(
  "/watchlists/:userId/:watchlistId/items/:ticker",
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const watchlistId = req.params.watchlistId;
      const ticker = req.params.ticker.toUpperCase();

      const [list] = await db
        .select()
        .from(watchlistsTable)
        .where(
          and(
            eq(watchlistsTable.id, watchlistId),
            eq(watchlistsTable.userId, userId),
          ),
        );
      if (!list) {
        res
          .status(404)
          .json({ error: "not_found", message: "Watchlist not found" });
        return;
      }

      const deleted = await db
        .delete(watchlistItemsTable)
        .where(
          and(
            eq(watchlistItemsTable.watchlistId, watchlistId),
            eq(watchlistItemsTable.ticker, ticker),
          ),
        )
        .returning({ id: watchlistItemsTable.id });

      if (deleted.length === 0) {
        res
          .status(404)
          .json({ error: "not_found", message: "Item not found" });
        return;
      }

      res.status(204).end();
    } catch (err) {
      req.log.error({ err }, "Failed to remove watchlist item");
      res
        .status(500)
        .json({ error: "internal_error", message: "Failed to remove item" });
    }
  },
);

export default router;
