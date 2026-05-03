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
