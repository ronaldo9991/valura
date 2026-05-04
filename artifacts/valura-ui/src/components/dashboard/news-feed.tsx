import { Newspaper, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyNews } from "@/lib/extras-api";

interface Props {
  ticker: string;
  limit?: number;
  compact?: boolean;
}

function formatPublished(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const hours = Math.round(diffMs / (60 * 60 * 1000));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NewsFeed({ ticker, limit = 8, compact = false }: Props) {
  const { data, isLoading, isError } = useCompanyNews(ticker);

  const articles = (data?.articles ?? []).slice(0, limit);
  const configured = data?.configured ?? true;

  return (
    <div data-testid="news-feed" className="space-y-3">
      <header className="flex items-center gap-2 border-b border-gold-hairline pb-2">
        <Newspaper className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-xs tracking-widest uppercase text-foreground">
          News — {ticker.toUpperCase()}
        </h3>
      </header>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {isError && (
        <div className="font-mono text-xs text-destructive">
          Could not load news for {ticker}.
        </div>
      )}

      {!isLoading && !isError && !configured && (
        <div className="font-mono text-xs text-muted-foreground border border-border bg-background/40 px-3 py-2">
          News disabled — set <code>FINNHUB_API_KEY</code> on the server to
          enable Finnhub company news.
        </div>
      )}

      {!isLoading && !isError && configured && articles.length === 0 && (
        <div className="font-mono text-xs text-muted-foreground">
          No recent news for {ticker}.
        </div>
      )}

      <ul className="divide-y divide-border">
        {articles.map((a) => (
          <li
            key={a.id}
            className={`py-2 ${compact ? "" : "flex gap-3"}`}
          >
            {!compact && a.image && (
              <img
                src={a.image}
                alt=""
                loading="lazy"
                className="w-16 h-16 object-cover border border-border flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                data-testid={`news-article-${a.id}`}
              >
                {a.headline}
                <ExternalLink className="inline w-3 h-3 ml-1 text-muted-foreground" />
              </a>
              <div className="flex items-center gap-2 mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>{a.source}</span>
                <span>·</span>
                <span>{formatPublished(a.publishedAt)}</span>
              </div>
              {!compact && a.summary && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {a.summary}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
