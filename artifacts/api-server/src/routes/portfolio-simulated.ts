import { Router, type Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { holdingsTable, cashBalancesTable } from "@workspace/db/schema";
import { getQuote } from "../lib/market-data";
import { apiLimiter } from "../middlewares/rate-limit";

const router = Router();

const SCRATCH_USER_ID = "user_scratch";

function assertScratchUser(userId: string, res: Response): boolean {
  if (userId !== SCRATCH_USER_ID) {
    res.status(403).json({
      error: "forbidden",
      message: "Simulated portfolio edits are only allowed for “build your own” sessions.",
    });
    return false;
  }
  return true;
}

const CashBody = z.object({
  balance: z.number().finite().min(0).max(1e12),
});

const HoldingBody = z.object({
  ticker: z.string().min(1).max(16),
  shares: z.number().finite().positive().max(1e12),
  avgCostBasis: z.number().finite().positive().optional(),
});

/** Set paper cash balance (USD simulation). */
router.patch("/portfolio/:userId/simulated/cash", apiLimiter, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    if (!assertScratchUser(userId, res)) return;

    const parsed = CashBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid_body", message: parsed.error.flatten().toString() });
      return;
    }

    const { balance } = parsed.data;
    const rowId = `cash_${userId}`;
    await db
      .insert(cashBalancesTable)
      .values({
        id: rowId,
        userId,
        balance: String(balance),
        currency: "USD",
      })
      .onConflictDoUpdate({
        target: cashBalancesTable.userId,
        set: { balance: String(balance), updatedAt: new Date() },
      });

    res.json({ userId, cashBalance: balance, currency: "USD" });
  } catch (err) {
    req.log.error({ err }, "simulated cash patch failed");
    res.status(500).json({ error: "internal_error", message: "Failed to update paper cash" });
  }
});

/** Buy a simulated position (deducts from paper cash). */
router.post("/portfolio/:userId/simulated/holding", apiLimiter, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    if (!assertScratchUser(userId, res)) return;

    const parsed = HoldingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid_body", message: parsed.error.flatten().toString() });
      return;
    }

    let { ticker, shares, avgCostBasis } = parsed.data;
    ticker = ticker.trim().toUpperCase();

    const quote = await getQuote(ticker);
    if (!quote) {
      res.status(400).json({ error: "symbol_not_found", message: `Could not resolve a quote for ${ticker}.` });
      return;
    }

    const price = avgCostBasis ?? quote.price;
    if (!(price > 0)) {
      res.status(400).json({ error: "invalid_price", message: "Could not determine entry price." });
      return;
    }

    const cost = shares * price;

    const [cashRow] = await db.select().from(cashBalancesTable).where(eq(cashBalancesTable.userId, userId));
    const cash = cashRow ? Number(cashRow.balance) : 0;
    if (cost > cash + 1e-9) {
      res.status(400).json({
        error: "insufficient_cash",
        message: `Paper cash is $${cash.toFixed(2)}; this order needs ~$${cost.toFixed(2)}. Add cash or reduce shares.`,
        cashBalance: cash,
        required: cost,
      });
      return;
    }

    const [dup] = await db
      .select({ id: holdingsTable.id })
      .from(holdingsTable)
      .where(and(eq(holdingsTable.userId, userId), eq(holdingsTable.ticker, ticker)));
    if (dup) {
      res.status(409).json({
        error: "duplicate_ticker",
        message: `You already hold ${ticker}. Sell it first to change size (coming soon), or pick another symbol.`,
      });
      return;
    }

    const holdingId = randomUUID();
    const sector = "Unknown";

    await db.insert(holdingsTable).values({
      id: holdingId,
      userId,
      ticker,
      name: quote.name,
      shares: String(shares),
      avgCostBasis: String(price),
      sector,
      currency: quote.currency ?? "USD",
    });

    const newCash = cash - cost;
    const rowId = `cash_${userId}`;
    await db
      .insert(cashBalancesTable)
      .values({
        id: rowId,
        userId,
        balance: String(Math.max(0, newCash)),
        currency: "USD",
      })
      .onConflictDoUpdate({
        target: cashBalancesTable.userId,
        set: { balance: String(Math.max(0, newCash)), updatedAt: new Date() },
      });

    res.status(201).json({
      id: holdingId,
      ticker,
      name: quote.name,
      shares,
      avgCostBasis: price,
      cost,
      cashAfter: Math.max(0, newCash),
    });
  } catch (err) {
    req.log.error({ err }, "simulated holding create failed");
    res.status(500).json({ error: "internal_error", message: "Failed to add simulated holding" });
  }
});

/** Sell / remove a simulated line — credits paper cash at average cost (simple model). One row per ticker for scratch users. */
router.delete("/portfolio/:userId/simulated/holding/:ticker", apiLimiter, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    if (!assertScratchUser(userId, res)) return;

    const tickerRaw = String(req.params.ticker);
    const ticker = decodeURIComponent(tickerRaw).trim().toUpperCase();
    const [row] = await db
      .select()
      .from(holdingsTable)
      .where(and(eq(holdingsTable.userId, userId), eq(holdingsTable.ticker, ticker)));
    if (!row) {
      res.status(404).json({ error: "not_found", message: "Holding not found" });
      return;
    }

    const shares = Number(row.shares);
    const avg = Number(row.avgCostBasis);
    const credit = shares * avg;

    await db.delete(holdingsTable).where(eq(holdingsTable.id, row.id));

    const [cashRow] = await db.select().from(cashBalancesTable).where(eq(cashBalancesTable.userId, userId));
    const cash = cashRow ? Number(cashRow.balance) : 0;
    const newCash = cash + credit;
    const rowId = `cash_${userId}`;
    await db
      .insert(cashBalancesTable)
      .values({
        id: rowId,
        userId,
        balance: String(newCash),
        currency: "USD",
      })
      .onConflictDoUpdate({
        target: cashBalancesTable.userId,
        set: { balance: String(newCash), updatedAt: new Date() },
      });

    res.json({ removedTicker: ticker, cashAfter: newCash, credited: credit });
  } catch (err) {
    req.log.error({ err }, "simulated holding delete failed");
    res.status(500).json({ error: "internal_error", message: "Failed to remove holding" });
  }
});

export default router;
