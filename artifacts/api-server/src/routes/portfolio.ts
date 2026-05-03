import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, holdingsTable, cashBalancesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getBatchQuotes, getBenchmarkReturn } from "../lib/market-data";
import { runPortfolioHealthAgent } from "../lib/portfolio-health-agent";

const router = Router();

router.get("/portfolio/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    const [holdings, cashRow] = await Promise.all([
      db.select().from(holdingsTable).where(eq(holdingsTable.userId, userId)),
      db.select().from(cashBalancesTable).where(eq(cashBalancesTable.userId, userId)),
    ]);

    const cashBalance = cashRow[0] ? Number(cashRow[0].balance) : 0;
    const tickers = holdings.map((h) => h.ticker);
    const quotes = tickers.length > 0 ? await getBatchQuotes(tickers) : [];
    const quoteMap = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));

    const enriched = holdings.map((h) => {
      const quote = quoteMap.get(h.ticker.toUpperCase());
      const currentPrice = quote?.price ?? Number(h.avgCostBasis);
      const shares = Number(h.shares);
      const avgCost = Number(h.avgCostBasis);
      const currentValue = currentPrice * shares;
      const costBasis = avgCost * shares;
      const gainLoss = currentValue - costBasis;
      const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
      return { ticker: h.ticker, name: h.name, shares, avgCostBasis: avgCost, currentPrice, currentValue, gainLoss, gainLossPct, sector: h.sector, currency: h.currency, weight: 0 };
    });

    const totalValue = enriched.reduce((s, h) => s + h.currentValue, 0) + cashBalance;
    const totalCost = enriched.reduce((s, h) => s + h.avgCostBasis * h.shares, 0);
    const totalGainLoss = enriched.reduce((s, h) => s + h.gainLoss, 0);
    const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    const withWeights = enriched.map((h) => ({ ...h, weight: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0 }));

    res.json({
      userId,
      totalValue,
      cashBalance,
      totalCost,
      totalGainLoss,
      totalGainLossPct,
      holdings: withWeights,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get portfolio");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch portfolio" });
  }
});

router.get("/portfolio/:userId/summary", async (req, res) => {
  try {
    const { userId } = req.params;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    const [holdings, cashRow] = await Promise.all([
      db.select().from(holdingsTable).where(eq(holdingsTable.userId, userId)),
      db.select().from(cashBalancesTable).where(eq(cashBalancesTable.userId, userId)),
    ]);

    const cashBalance = cashRow[0] ? Number(cashRow[0].balance) : 0;
    const tickers = holdings.map((h) => h.ticker);
    const quotes = tickers.length > 0 ? await getBatchQuotes(tickers) : [];
    const quoteMap = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));

    const enriched = holdings.map((h) => {
      const quote = quoteMap.get(h.ticker.toUpperCase());
      const currentPrice = quote?.price ?? Number(h.avgCostBasis);
      const shares = Number(h.shares);
      const avgCost = Number(h.avgCostBasis);
      const currentValue = currentPrice * shares;
      const costBasis = avgCost * shares;
      return { ticker: h.ticker, name: h.name, currentValue, costBasis, dailyChange: (quote?.changePct ?? 0) * currentValue / 100, sector: h.sector };
    });

    const totalValue = enriched.reduce((s, h) => s + h.currentValue, 0) + cashBalance;
    const totalCost = enriched.reduce((s, h) => s + h.costBasis, 0);
    const totalReturn = totalValue - totalCost;
    const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    const dailyChange = enriched.reduce((s, h) => s + h.dailyChange, 0);
    const dailyChangePct = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0;
    const sorted = [...enriched].sort((a, b) => b.currentValue - a.currentValue);

    const sectorMap = new Map<string, number>();
    for (const h of enriched) {
      sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.currentValue);
    }
    const allocationBySector = [...sectorMap.entries()].map(([sector, value]) => ({
      sector, pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    })).sort((a, b) => b.pct - a.pct);

    const allocationByAsset = sorted.slice(0, 8).map((h) => ({
      name: h.ticker, value: h.currentValue, pct: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0,
    }));
    if (cashBalance > 0) {
      allocationByAsset.push({ name: "Cash", value: cashBalance, pct: totalValue > 0 ? (cashBalance / totalValue) * 100 : 0 });
    }

    const topConc = sorted[0] ? (sorted[0].currentValue / totalValue) * 100 : 0;
    const riskScore = Math.min(10, Math.max(1, Math.round(topConc / 10)));

    res.json({
      userId,
      totalValue,
      dailyChange,
      dailyChangePct,
      totalReturn,
      totalReturnPct,
      topHolding: sorted[0]?.ticker ?? "N/A",
      holdingsCount: holdings.length,
      riskScore,
      allocationByAsset,
      allocationBySector,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get portfolio summary");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch portfolio summary" });
  }
});

router.get("/portfolio/:userId/health", async (req, res) => {
  try {
    const { userId } = req.params;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    const [holdings, cashRow] = await Promise.all([
      db.select().from(holdingsTable).where(eq(holdingsTable.userId, userId)),
      db.select().from(cashBalancesTable).where(eq(cashBalancesTable.userId, userId)),
    ]);

    const cashBalance = cashRow[0] ? Number(cashRow[0].balance) : 0;
    const holdingInputs = holdings.map((h) => ({
      ticker: h.ticker,
      name: h.name,
      shares: Number(h.shares),
      avgCostBasis: Number(h.avgCostBasis),
      sector: h.sector,
      currency: h.currency,
    }));

    const chunks: string[] = [];
    const report = await runPortfolioHealthAgent(
      { id: user.id, name: user.name, riskProfile: user.riskProfile, currency: user.currency, investmentGoal: user.investmentGoal },
      holdingInputs,
      cashBalance,
      (chunk) => chunks.push(chunk)
    );

    res.json({ userId, ...report, aiNarrative: chunks.join("") });
  } catch (err) {
    req.log.error({ err }, "Failed to get portfolio health");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch portfolio health" });
  }
});

export default router;
