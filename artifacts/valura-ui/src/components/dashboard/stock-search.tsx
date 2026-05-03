import { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { useSearchSymbols, getSearchSymbolsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export function StockSearch({ onPick }: { onPick: (symbol: string) => void }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useSearchSymbols(
    { q: debounced },
    { query: { enabled: debounced.length >= 1, queryKey: getSearchSymbolsQueryKey({ q: debounced }) } }
  );

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search any stock or ETF — e.g. AAPL, Tesla, Nvidia"
          className="w-full h-10 pl-10 pr-9 bg-background/50 border border-border rounded-none font-mono text-sm focus:outline-none focus:border-gold-hairline focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 transition-colors"
          data-testid="input-stock-search"
        />
        {q && (
          <button
            onClick={() => { setQ(""); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && debounced.length >= 1 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-gold-hairline rounded-none shadow-2xl z-50 max-h-80 overflow-y-auto">
          {isFetching && !data && (
            <div className="p-3 text-xs font-mono text-muted-foreground">Searching markets…</div>
          )}
          {data?.results?.length === 0 && !isFetching && (
            <div className="p-3 text-xs font-mono text-muted-foreground">No matches for "{debounced}"</div>
          )}
          {data?.results?.map((r) => (
            <button
              key={`${r.symbol}-${r.exchange}`}
              onClick={() => { onPick(r.symbol); setQ(""); setOpen(false); }}
              className="w-full text-left p-3 hover:bg-primary/5 border-b border-border/50 last:border-b-0 transition-colors flex items-center justify-between gap-3 group"
              data-testid={`search-result-${r.symbol}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center bg-background border border-gold-hairline text-[10px] font-bold font-mono text-primary">
                  {r.symbol.slice(0, 4)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{r.symbol} <span className="text-muted-foreground font-normal text-xs">· {r.exchange}</span></div>
                  <div className="text-xs text-muted-foreground truncate">{r.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.sector && (
                  <Badge variant="outline" className="rounded-none border-border font-mono text-[9px] uppercase">{r.sector}</Badge>
                )}
                <TrendingUp className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
