import { LRUCache } from "lru-cache";
import { logger } from "./logger";

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  publishedAt: string;
}

const TEN_MIN_MS = 10 * 60 * 1000;
const cache = new LRUCache<string, NewsArticle[]>({
  max: 500,
  ttl: TEN_MIN_MS,
});

function startOfRangeIso(daysBack: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

export async function getCompanyNews(
  ticker: string,
  daysBack: number = 7,
): Promise<NewsArticle[]> {
  const key = `${ticker.toUpperCase()}|${daysBack}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    logger.warn(
      "FINNHUB_API_KEY not set; returning empty news (set the key to enable Finnhub /company-news).",
    );
    return [];
  }

  const from = startOfRangeIso(daysBack);
  const to = startOfRangeIso(0);
  const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(
    ticker.toUpperCase(),
  )}&from=${from}&to=${to}&token=${apiKey}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      logger.warn(
        { ticker, status: res.status },
        "Finnhub news request failed",
      );
      return [];
    }
    const json = (await res.json()) as Array<{
      id?: number;
      headline?: string;
      summary?: string;
      source?: string;
      url?: string;
      image?: string;
      datetime?: number;
    }>;
    const articles: NewsArticle[] = json
      .filter((a) => a.headline && a.url)
      .slice(0, 25)
      .map((a) => ({
        id: String(a.id ?? `${ticker}-${a.datetime}`),
        headline: a.headline ?? "",
        summary: a.summary ?? "",
        source: a.source ?? "",
        url: a.url ?? "",
        image: a.image || undefined,
        publishedAt: a.datetime
          ? new Date(a.datetime * 1000).toISOString()
          : new Date().toISOString(),
      }));
    cache.set(key, articles);
    return articles;
  } catch (err) {
    logger.warn({ ticker, err }, "Finnhub news request errored");
    return [];
  }
}
