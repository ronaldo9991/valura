import { Router } from "express";
import { z } from "zod";
import { getCompanyNews } from "../lib/news-data";

const router = Router();

const TickerParam = z.object({ ticker: z.string().trim().min(1).max(16) });
const Query = z.object({
  days: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(30, Math.max(1, Number(v))) : 7)),
});

router.get("/news/:ticker", async (req, res) => {
  try {
    const { ticker } = TickerParam.parse(req.params);
    const { days } = Query.parse(req.query);
    const articles = await getCompanyNews(ticker, days);
    res.json({
      ticker: ticker.toUpperCase(),
      articles,
      cached: false,
      configured: Boolean(process.env.FINNHUB_API_KEY),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch news");
    res
      .status(500)
      .json({ error: "internal_error", message: "Failed to fetch news" });
  }
});

export default router;
