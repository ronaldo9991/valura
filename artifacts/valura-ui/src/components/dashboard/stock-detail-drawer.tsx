import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Bot, Info } from "lucide-react";
import { useGetMarketQuote, getGetMarketQuoteQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StockChart } from "./stock-chart";

export function StockDetailDrawer({
  symbol,
  onClose,
  onAskAi,
}: {
  symbol: string | null;
  onClose: () => void;
  onAskAi?: (prompt: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (symbol) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [symbol, onClose]);

  const { data: quote, isLoading } = useGetMarketQuote(
    symbol || "",
    { query: { enabled: !!symbol, queryKey: getGetMarketQuoteQueryKey(symbol || "") } }
  );

  return (
    <AnimatePresence>
      {symbol && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] bg-card border-l border-gold-hairline z-50 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.6)]"
            data-testid="drawer-stock-detail"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-background border border-gold-hairline text-xs font-bold font-mono text-primary">
                  {symbol.slice(0, 4)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-lg tracking-tight truncate">{symbol}</div>
                  <div className="text-xs text-muted-foreground truncate font-mono">
                    {isLoading ? "Loading…" : quote?.name}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 transition-colors" data-testid="button-close-drawer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Live Chart */}
              <section>
                <StockChart symbol={symbol} height={280} />
                <p className="text-xs text-muted-foreground/70 mt-3 leading-relaxed flex items-start gap-2">
                  <Info className="w-3 h-3 mt-0.5 shrink-0 text-primary/60" />
                  <span><strong className="text-foreground/80">Plain English:</strong> The line shows the stock's closing price each day. Green means it's up over the period, red means down. The dashed gold line is where the price started.</span>
                </p>
              </section>

              {/* Key Stats */}
              <section className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Key Numbers</h3>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : quote && (
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Current Price" value={`$${quote.price.toFixed(2)}`} hint="Latest market price" />
                    <Stat label="Today's Change" value={`${quote.changePct >= 0 ? "+" : ""}${quote.changePct.toFixed(2)}%`} hint="How much it moved today" tone={quote.changePct >= 0 ? "up" : "down"} />
                    <Stat label="52-Week High" value={`$${quote.high52w?.toFixed(2) ?? "—"}`} hint="Highest price in past year" />
                    <Stat label="52-Week Low" value={`$${quote.low52w?.toFixed(2) ?? "—"}`} hint="Lowest price in past year" />
                    <Stat label="Market Cap" value={fmtBig(quote.marketCap)} hint="Total company value" />
                    <Stat label="Volume" value={fmtBig(quote.volume)} hint="Shares traded today" />
                  </div>
                )}
              </section>

              {/* Ask AI */}
              {onAskAi && (
                <section className="space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Ask Your AI Co-Investor</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      `Should a beginner buy ${symbol} right now?`,
                      `Explain ${symbol} in one paragraph like I'm 12.`,
                      `What are the biggest risks of holding ${symbol}?`,
                    ].map((p) => (
                      <button
                        key={p}
                        onClick={() => onAskAi(p)}
                        className="text-left p-3 border border-border hover:border-gold-hairline hover:bg-primary/5 transition-colors text-sm flex items-center gap-3 group"
                        data-testid={`ai-prompt-${p.slice(0, 20)}`}
                      >
                        <Bot className="w-4 h-4 text-primary shrink-0" />
                        <span className="flex-1">{p}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {quote?.exchange && (
                <div className="pt-4 border-t border-border/50 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <span>Exchange · {quote.exchange}</span>
                  <span>Currency · {quote.currency}</span>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "up" | "down" }) {
  return (
    <div className="border border-border p-3 bg-background/40">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-base font-bold font-mono mt-1 ${tone === "up" ? "text-emerald-500" : tone === "down" ? "text-destructive" : "text-foreground"}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground/60 mt-1 leading-tight">{hint}</div>
    </div>
  );
}

function fmtBig(n?: number | null): string {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}
