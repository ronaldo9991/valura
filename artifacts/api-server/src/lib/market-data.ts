import YahooFinanceClass from "yahoo-finance2";
import { logger } from "./logger";

// yahoo-finance2 v3 exports the class as default; must instantiate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new (YahooFinanceClass as any)({ suppressNotices: ["yahooSurvey"] });

export interface QuoteResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume?: number;
  marketCap?: number;
  high52w?: number;
  low52w?: number;
  currency: string;
  exchange?: string;
  lastUpdated: string;
}

export async function getQuote(symbol: string): Promise<QuoteResult | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await yf.quote(symbol);
    if (!quote) return null;

    return {
      symbol: quote.symbol ?? symbol,
      name: quote.longName ?? quote.shortName ?? symbol,
      price: quote.regularMarketPrice ?? 0,
      change: quote.regularMarketChange ?? 0,
      changePct: quote.regularMarketChangePercent ?? 0,
      volume: quote.regularMarketVolume ?? undefined,
      marketCap: quote.marketCap ?? undefined,
      high52w: quote.fiftyTwoWeekHigh ?? undefined,
      low52w: quote.fiftyTwoWeekLow ?? undefined,
      currency: quote.currency ?? "USD",
      exchange: quote.exchangeName ?? undefined,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    logger.warn({ symbol, err }, "Failed to fetch quote");
    return null;
  }
}

export async function getBatchQuotes(symbols: string[]): Promise<QuoteResult[]> {
  const results = await Promise.allSettled(symbols.map((s) => getQuote(s)));
  return results
    .filter((r): r is PromiseFulfilledResult<QuoteResult | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((q): q is QuoteResult => q !== null);
}

export async function getBenchmarkReturn(_benchmark: string = "^GSPC"): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await yf.quote("^GSPC");
    return quote?.regularMarketChangePercent ?? 0;
  } catch {
    return 0.027;
  }
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  sector?: string;
  industry?: string;
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = await yf.search(query, { quotesCount: 10, newsCount: 0 });
    const quotes: any[] = r?.quotes ?? [];
    return quotes
      .filter((q) => q?.symbol && (q.quoteType === "EQUITY" || q.quoteType === "ETF"))
      .map((q) => ({
        symbol: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        exchange: q.exchDisp ?? q.exchange ?? "",
        type: q.quoteType ?? "EQUITY",
        sector: q.sectorDisp ?? q.sector ?? undefined,
        industry: q.industryDisp ?? q.industry ?? undefined,
      }))
      .slice(0, 8);
  } catch (err) {
    logger.warn({ query, err }, "Failed to search symbols");
    return [];
  }
}

export interface ChartPoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface HistoryResult {
  symbol: string;
  range: string;
  interval: string;
  currency: string;
  points: ChartPoint[];
  startPrice: number;
  endPrice: number;
  changePct: number;
}

const RANGE_CONFIG: Record<string, { ms: number; interval: string }> = {
  "1d": { ms: 1 * 24 * 60 * 60 * 1000, interval: "5m" },
  "5d": { ms: 5 * 24 * 60 * 60 * 1000, interval: "30m" },
  "1mo": { ms: 30 * 24 * 60 * 60 * 1000, interval: "1d" },
  "3mo": { ms: 90 * 24 * 60 * 60 * 1000, interval: "1d" },
  "6mo": { ms: 180 * 24 * 60 * 60 * 1000, interval: "1d" },
  "1y": { ms: 365 * 24 * 60 * 60 * 1000, interval: "1d" },
  "5y": { ms: 5 * 365 * 24 * 60 * 60 * 1000, interval: "1wk" },
};

export async function getHistory(symbol: string, range: string = "1mo"): Promise<HistoryResult | null> {
  const cfg = RANGE_CONFIG[range] ?? RANGE_CONFIG["1mo"];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = await yf.chart(symbol, {
      period1: new Date(Date.now() - cfg.ms),
      interval: cfg.interval as any,
    });
    const quotes: any[] = (c?.quotes ?? []).filter((q: any) => q?.close != null);
    if (quotes.length === 0) return null;
    const points: ChartPoint[] = quotes.map((q) => ({
      date: new Date(q.date).toISOString(),
      close: Number(q.close ?? 0),
      open: Number(q.open ?? q.close ?? 0),
      high: Number(q.high ?? q.close ?? 0),
      low: Number(q.low ?? q.close ?? 0),
      volume: Number(q.volume ?? 0),
    }));
    const startPrice = points[0].close;
    const endPrice = points[points.length - 1].close;
    return {
      symbol: c?.meta?.symbol ?? symbol,
      range,
      interval: cfg.interval,
      currency: c?.meta?.currency ?? "USD",
      points,
      startPrice,
      endPrice,
      changePct: startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0,
    };
  } catch (err) {
    logger.warn({ symbol, range, err }, "Failed to fetch history");
    return null;
  }
}

export async function getMarketMovers(): Promise<{ gainers: QuoteResult[]; losers: QuoteResult[] }> {
  const topSymbols = [
    "NVDA", "AAPL", "MSFT", "AMZN", "META",
    "GOOGL", "TSLA", "AMD", "PLTR", "COIN",
    "INTC", "PYPL", "SNAP", "UBER", "ARKK",
  ];
  try {
    const quotes = await getBatchQuotes(topSymbols);
    const sorted = quotes.sort((a, b) => b.changePct - a.changePct);
    return {
      gainers: sorted.filter((q) => q.changePct > 0).slice(0, 5),
      losers: sorted.filter((q) => q.changePct < 0).slice(-5).reverse(),
    };
  } catch (err) {
    logger.warn({ err }, "Failed to fetch market movers");
    return { gainers: [], losers: [] };
  }
}
