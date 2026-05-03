import YahooFinanceClass from "yahoo-finance2";
import { logger } from "./logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf: any = new (YahooFinanceClass as any)({ suppressNotices: ["yahooSurvey"] });

export interface ChronosPositionInput {
  symbol: string;
  dollarAmount: number;
}

export interface PositionResult {
  symbol: string;
  name: string;
  dollarAmount: number;
  startPrice: number;
  endPrice: number;
  shares: number;
  endValue: number;
  returnDollar: number;
  returnPct: number;
}

export interface TimelinePoint {
  date: string;
  portfolioValue: number;
  benchmarkValue?: number;
}

export interface ChronosResult {
  startDate: string;
  endDate: string;
  totalInvested: number;
  currentValue: number;
  returnDollar: number;
  returnPct: number;
  cagrPct: number;
  benchmarkReturnPct?: number;
  positions: PositionResult[];
  timeline: TimelinePoint[];
  explanation: string;
}

interface DailySeries {
  symbol: string;
  name: string;
  points: { date: string; close: number }[];
}

async function fetchDailySeries(symbol: string, period1: Date): Promise<DailySeries | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = await yf.chart(symbol, {
      period1,
      interval: "1d",
    });
    const quotes: { date: Date | string; close: number | null }[] = (c?.quotes ?? []).filter(
      (q: { close: number | null }) => q?.close != null
    );
    if (quotes.length === 0) return null;
    return {
      symbol: c?.meta?.symbol ?? symbol,
      name: c?.meta?.longName ?? c?.meta?.shortName ?? symbol,
      points: quotes.map((q) => ({
        date: new Date(q.date).toISOString().slice(0, 10),
        close: Number(q.close),
      })),
    };
  } catch (err) {
    logger.warn({ symbol, err }, "Chronos: failed to fetch series");
    return null;
  }
}

export async function simulatePortfolio(
  startDateStr: string,
  positionsInput: ChronosPositionInput[],
  includeBenchmark = true
): Promise<ChronosResult | null> {
  const startDate = new Date(startDateStr + "T00:00:00Z");
  if (Number.isNaN(startDate.getTime())) return null;
  const now = new Date();
  if (startDate >= now) return null;

  const cleaned = positionsInput
    .map((p) => ({ symbol: String(p.symbol ?? "").trim(), dollarAmount: Number(p.dollarAmount) }))
    .filter((p) => p.symbol.length > 0 && Number.isFinite(p.dollarAmount) && p.dollarAmount > 0)
    .slice(0, 10);
  if (cleaned.length === 0) return null;

  const symbols = Array.from(new Set(cleaned.map((p) => p.symbol.toUpperCase())));
  const seriesArr = await Promise.all(symbols.map((s) => fetchDailySeries(s, startDate)));
  const seriesMap = new Map<string, DailySeries>();
  seriesArr.forEach((s, i) => { if (s) seriesMap.set(symbols[i], s); });

  const benchmark = includeBenchmark ? await fetchDailySeries("SPY", startDate) : null;

  // Per-position results
  const positions: PositionResult[] = [];
  let totalInvested = 0;
  let currentValue = 0;
  for (const p of cleaned) {
    const sym = p.symbol.toUpperCase();
    const s = seriesMap.get(sym);
    if (!s || s.points.length === 0) continue;
    const startPrice = s.points[0].close;
    const endPrice = s.points[s.points.length - 1].close;
    const shares = p.dollarAmount / startPrice;
    const endValue = shares * endPrice;
    const returnDollar = endValue - p.dollarAmount;
    const returnPct = ((endPrice - startPrice) / startPrice) * 100;
    positions.push({
      symbol: sym,
      name: s.name,
      dollarAmount: p.dollarAmount,
      startPrice,
      endPrice,
      shares,
      endValue,
      returnDollar,
      returnPct,
    });
    totalInvested += p.dollarAmount;
    currentValue += endValue;
  }
  if (positions.length === 0) return null;

  // Build a unified date list — use union of all dates, filling forward
  const dateSet = new Set<string>();
  for (const sym of symbols) {
    const s = seriesMap.get(sym);
    if (s) for (const pt of s.points) dateSet.add(pt.date);
  }
  if (benchmark) for (const pt of benchmark.points) dateSet.add(pt.date);
  const dates = Array.from(dateSet).sort();

  // Per-symbol last-known-price tracker for forward-fill
  const lastPx: Record<string, number> = {};
  const seriesIdx: Record<string, number> = {};
  for (const sym of symbols) seriesIdx[sym] = 0;
  let benchIdx = 0;
  let lastBench = benchmark?.points[0]?.close ?? null;
  const startBench = lastBench;

  // Pre-compute shares per symbol — SUM across duplicate tickers so timeline matches headline totals.
  const sharesBySymbol = new Map<string, number>();
  let benchShares = 0;
  if (benchmark && lastBench) benchShares = totalInvested / lastBench;
  for (const r of positions) {
    sharesBySymbol.set(r.symbol, (sharesBySymbol.get(r.symbol) ?? 0) + r.shares);
  }

  const timeline: TimelinePoint[] = [];
  for (const d of dates) {
    // Advance each series index up to this date
    for (const sym of symbols) {
      const s = seriesMap.get(sym);
      if (!s) continue;
      while (seriesIdx[sym] < s.points.length && s.points[seriesIdx[sym]].date <= d) {
        lastPx[sym] = s.points[seriesIdx[sym]].close;
        seriesIdx[sym]++;
      }
    }
    if (benchmark) {
      while (benchIdx < benchmark.points.length && benchmark.points[benchIdx].date <= d) {
        lastBench = benchmark.points[benchIdx].close;
        benchIdx++;
      }
    }

    let pv = 0;
    for (const [sym, sh] of sharesBySymbol) {
      const px = lastPx[sym];
      if (px != null) pv += sh * px;
    }
    if (pv === 0) continue;

    const point: TimelinePoint = { date: d, portfolioValue: pv };
    if (benchmark && lastBench) point.benchmarkValue = benchShares * lastBench;
    timeline.push(point);
  }

  const returnDollar = currentValue - totalInvested;
  const returnPct = (returnDollar / totalInvested) * 100;
  const days = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const years = days / 365.25;
  const cagrPct = years > 0 ? (Math.pow(currentValue / totalInvested, 1 / years) - 1) * 100 : returnPct;

  let benchmarkReturnPct: number | undefined;
  if (benchmark && startBench && lastBench) {
    benchmarkReturnPct = ((lastBench - startBench) / startBench) * 100;
  }

  // Plain-English explanation
  const fmtMoney = (n: number) => `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const verdict = returnPct >= 0 ? "grown" : "shrunk";
  const yearsTxt = years >= 1 ? `${years.toFixed(1)} years` : `${Math.round(days)} days`;
  const benchTxt = benchmarkReturnPct !== undefined
    ? returnPct > benchmarkReturnPct
      ? ` That beats the S&P 500's ${benchmarkReturnPct.toFixed(1)}% over the same period — your picks added alpha.`
      : returnPct < benchmarkReturnPct
        ? ` However the S&P 500 returned ${benchmarkReturnPct.toFixed(1)}% — just buying the index would have done better.`
        : ` That's roughly the same as the S&P 500 (${benchmarkReturnPct.toFixed(1)}%).`
    : "";
  const bestPos = [...positions].sort((a, b) => b.returnPct - a.returnPct)[0];
  const worstPos = [...positions].sort((a, b) => a.returnPct - b.returnPct)[0];
  const bestWorst = positions.length > 1
    ? ` Best pick: ${bestPos.symbol} (+${bestPos.returnPct.toFixed(1)}%). Worst pick: ${worstPos.symbol} (${worstPos.returnPct >= 0 ? "+" : ""}${worstPos.returnPct.toFixed(1)}%).`
    : "";
  const explanation = `If you'd invested ${fmtMoney(totalInvested)} on ${startDateStr} across ${positions.length} ${positions.length === 1 ? "stock" : "stocks"}, your portfolio would have ${verdict} to ${fmtMoney(currentValue)} today — a ${returnPct >= 0 ? "gain" : "loss"} of ${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(1)}% over ${yearsTxt} (${cagrPct >= 0 ? "+" : ""}${cagrPct.toFixed(1)}% per year compounded).${benchTxt}${bestWorst}`;

  return {
    startDate: startDateStr,
    endDate: now.toISOString().slice(0, 10),
    totalInvested,
    currentValue,
    returnDollar,
    returnPct,
    cagrPct,
    benchmarkReturnPct,
    positions,
    timeline,
    explanation,
  };
}
