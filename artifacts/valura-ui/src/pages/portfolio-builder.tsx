import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Beaker, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AiChat } from "@/components/dashboard/ai-chat";
import { StockSearch } from "@/components/dashboard/stock-search";
import {
  useGetUser,
  useGetPortfolio,
  useGetPortfolioSummary,
  getGetUserQueryKey,
  getGetPortfolioQueryKey,
  getGetPortfolioSummaryQueryKey,
  getGetPortfolioHealthQueryKey,
} from "@workspace/api-client-react";
import {
  SCRATCH_USER_ID,
  getStoredUserId,
  resolveSessionDisplayName,
  clearSession,
} from "@/lib/auth";
import { useLocalSignInName } from "@/hooks/use-local-sign-in-name";

export default function PortfolioBuilder() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const userId = getStoredUserId() ?? "";

  const [cashInput, setCashInput] = useState("");
  const [pickSymbol, setPickSymbol] = useState<string | null>(null);
  const [sharesStr, setSharesStr] = useState("1");
  const [limitStr, setLimitStr] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: user } = useGetUser(userId, {
    query: { enabled: !!userId && userId === SCRATCH_USER_ID, queryKey: getGetUserQueryKey(userId) },
  });
  const { data: localIdentity } = useLocalSignInName();
  const displayName = resolveSessionDisplayName(user?.name, localIdentity?.signInName);

  const { data: portfolio, isLoading: loadingPortfolio } = useGetPortfolio(userId, {
    query: { enabled: !!userId && userId === SCRATCH_USER_ID, queryKey: getGetPortfolioQueryKey(userId) },
  });
  const { data: summary } = useGetPortfolioSummary(userId, {
    query: { enabled: !!userId && userId === SCRATCH_USER_ID, queryKey: getGetPortfolioSummaryQueryKey(userId) },
  });

  const invalidatePortfolio = () => {
    queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(userId) });
    queryClient.invalidateQueries({ queryKey: getGetPortfolioSummaryQueryKey(userId) });
    queryClient.invalidateQueries({ queryKey: getGetPortfolioHealthQueryKey(userId) });
  };

  const patchCash = useMutation({
    mutationFn: async (balance: number) => {
      const r = await fetch(`/api/portfolio/${encodeURIComponent(userId)}/simulated/cash`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message ?? r.statusText);
      }
      return r.json() as Promise<{ cashBalance: number }>;
    },
    onSuccess: invalidatePortfolio,
  });

  const addHolding = useMutation({
    mutationFn: async (body: { ticker: string; shares: number; avgCostBasis?: number }) => {
      const r = await fetch(`/api/portfolio/${encodeURIComponent(userId)}/simulated/holding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { message?: string }).message ?? r.statusText);
      return j;
    },
    onSuccess: () => {
      invalidatePortfolio();
      setPickSymbol(null);
      setSharesStr("1");
      setLimitStr("");
      setFormError(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const removeHolding = useMutation({
    mutationFn: async (ticker: string) => {
      const r = await fetch(
        `/api/portfolio/${encodeURIComponent(userId)}/simulated/holding/${encodeURIComponent(ticker)}`,
        { method: "DELETE" }
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { message?: string }).message ?? r.statusText);
      return j;
    },
    onSuccess: invalidatePortfolio,
  });

  const paperCash = portfolio?.cashBalance ?? 0;
  const topHolding = useMemo(() => {
    if (!portfolio?.holdings?.length) return null;
    return [...portfolio.holdings].sort((a, b) => b.weight - a.weight)[0]?.ticker ?? null;
  }, [portfolio]);

  const applyCash = () => {
    const n = Number(cashInput.replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      setFormError("Enter a valid non-negative paper balance.");
      return;
    }
    setFormError(null);
    patchCash.mutate(n, { onError: (e: Error) => setFormError(e.message) });
  };

  const buy = () => {
    const sym = pickSymbol?.trim().toUpperCase();
    if (!sym) {
      setFormError("Pick a symbol from search.");
      return;
    }
    const shares = Number(sharesStr);
    if (!Number.isFinite(shares) || shares <= 0) {
      setFormError("Enter a positive share count.");
      return;
    }
    const lim = limitStr.trim() ? Number(limitStr) : undefined;
    if (lim !== undefined && (!Number.isFinite(lim) || lim <= 0)) {
      setFormError("Limit price must be a positive number, or leave blank for last price.");
      return;
    }
    setFormError(null);
    addHolding.mutate(
      { ticker: sym, shares, ...(lim !== undefined ? { avgCostBasis: lim } : {}) },
      { onError: (e: Error) => setFormError(e.message) }
    );
  };

  if (!userId || userId !== SCRATCH_USER_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-muted-foreground">The simulation lab is only for “build your own portfolio” sessions.</p>
          <Button asChild variant="outline" className="rounded-none">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const coachChips = [
    `I'm paper-trading with about $${paperCash.toLocaleString(undefined, { maximumFractionDigits: 0 })} cash — suggest a simple starter allocation.`,
    "Explain diversification using only my simulated holdings.",
    "What risks should I watch if I only own tech names here?",
  ];

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="sm" className="rounded-none shrink-0" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Beaker className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight truncate">Simulation lab</h1>
              <p className="text-[11px] font-mono text-muted-foreground truncate">
                Paper cash · practice buys · AI coach (needs OPENAI_API_KEY on the API)
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-none text-[10px] uppercase tracking-widest" onClick={() => { clearSession(); setLocation("/login"); }}>
          Switch profile
        </Button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <ScrollArea className="flex-1 lg:border-r border-border">
          <div className="p-6 lg:p-10 max-w-2xl space-y-10 pb-24">
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Paper balance</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Set how much pretend money you start with. Buys deduct from this balance; closing a position credits back your average cost × shares.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5 flex-1 min-w-[140px]">
                  <Label htmlFor="cash">USD</Label>
                  <Input
                    id="cash"
                    inputMode="decimal"
                    placeholder={paperCash ? String(paperCash) : "10000"}
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    className="rounded-none font-mono"
                  />
                </div>
                <Button onClick={applyCash} disabled={patchCash.isPending} className="rounded-none">
                  {patchCash.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[10000, 25000, 100000].map((n) => (
                  <Button key={n} type="button" variant="outline" size="sm" className="rounded-none font-mono text-xs" onClick={() => { setCashInput(String(n)); }}>
                    ${n.toLocaleString()}
                  </Button>
                ))}
              </div>
              <div className="text-2xl font-mono text-primary">
                {loadingPortfolio ? "…" : `$${paperCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Add a practice position</h2>
              <StockSearch onPick={(s) => { setPickSymbol(s); setFormError(null); }} />
              {pickSymbol && (
                <p className="text-xs font-mono text-primary">
                  Selected: <strong>{pickSymbol.toUpperCase()}</strong>
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="shares">Shares</Label>
                  <Input id="shares" inputMode="decimal" value={sharesStr} onChange={(e) => setSharesStr(e.target.value)} className="rounded-none font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="limit">Limit price (optional)</Label>
                  <Input id="limit" inputMode="decimal" placeholder="Last quote if empty" value={limitStr} onChange={(e) => setLimitStr(e.target.value)} className="rounded-none font-mono" />
                </div>
              </div>
              <Button onClick={buy} disabled={addHolding.isPending} className="rounded-none w-full sm:w-auto">
                {addHolding.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simulate buy"}
              </Button>
            </motion.section>

            {formError && (
              <div className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Open positions</h2>
              {!portfolio?.holdings?.length ? (
                <p className="text-sm text-muted-foreground font-mono">No holdings yet — fund paper cash and buy above.</p>
              ) : (
                <div className="border border-border divide-y divide-border">
                  {portfolio.holdings.map((h) => (
                    <div key={h.ticker} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="font-bold font-mono">{h.ticker}</div>
                        <div className="text-xs text-muted-foreground truncate">{h.name}</div>
                        <div className="text-[11px] font-mono mt-1">
                          {h.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })} sh · ${h.avgCostBasis.toFixed(2)} avg · ${h.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} mkt
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-none shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                        disabled={removeHolding.isPending}
                        onClick={() => removeHolding.mutate(h.ticker)}
                        aria-label={`Remove ${h.ticker}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {summary && (
              <p className="text-xs font-mono text-muted-foreground">
                Book value (paper): ${summary.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} · {summary.holdingsCount} line{summary.holdingsCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </ScrollArea>

        <aside className="w-full lg:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-border flex flex-col min-h-[50vh] lg:min-h-0 lg:h-[calc(100vh-57px)]">
          <div className="p-4 border-b border-border shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI portfolio coach</h2>
            <p className="text-[11px] text-muted-foreground mt-1">
              Uses your live simulated book as context. Configure <code className="font-mono text-primary">OPENAI_API_KEY</code> on the API server.
            </p>
          </div>
          <div className="flex-1 min-h-0 p-2">
            <AiChat
              userId={userId}
              novice
              displayName={displayName}
              defaultAgentMode="coach"
              starterChips={coachChips}
              portfolioContext={{
                topHolding,
                holdingsCount: summary?.holdingsCount,
              }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
