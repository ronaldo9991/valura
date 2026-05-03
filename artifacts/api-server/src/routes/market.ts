import { Router } from "express";
import { getQuote, getBatchQuotes, getMarketMovers } from "../lib/market-data";
import { GetBatchQuotesBody } from "@workspace/api-zod";

const router = Router();

router.get("/market/quote/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const quote = await getQuote(symbol);
    if (!quote) {
      res.status(404).json({ error: "not_found", message: `No data found for symbol: ${symbol}` });
      return;
    }
    res.json(quote);
  } catch (err) {
    req.log.error({ err }, "Failed to get market quote");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch market data" });
  }
});

router.post("/market/quotes", async (req, res) => {
  try {
    const parsed = GetBatchQuotesBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "bad_request", message: "Invalid request body" });
      return;
    }
    const { symbols } = parsed.data;
    const quotes = await getBatchQuotes(symbols.map((s) => s.toUpperCase()));
    res.json({ quotes });
  } catch (err) {
    req.log.error({ err }, "Failed to get batch quotes");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch market data" });
  }
});

router.get("/market/movers", async (req, res) => {
  try {
    const movers = await getMarketMovers();
    res.json({ ...movers, lastUpdated: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get market movers");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch market movers" });
  }
});

export default router;
