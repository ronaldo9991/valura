import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hourglass, Plus, X, Play, Loader2, TrendingUp, TrendingDown, Trophy,
  AlertTriangle, RotateCcw, ArrowLeft, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  CartesianGrid, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeSwitcher } from "@/components/mode-switcher";
import { StockSearch } from "@/components/dashboard/stock-search";
import type { ChronosResult } from "@workspace/api-client-react";

type Position = { id: string; symbol: string; dollarAmount: number };

const PRESETS = [
  { label: "Pre-COVID (Jan 2020)", date: "2020-01-02" },
  { label: "ChatGPT launch (Nov 2022)", date: "2022-11-30" },
  { label: "AI boom start (Jan 2023)", date: "2023-01-03" },
  { label: "5 years ago", date: new Date(Date.now() - 5 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10) },
  { label: "10 years ago", date: new Date(Date.now() - 10 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10) },
];

const SAMPLE_BUILDS: { name: string; positions: { symbol: string; dollarAmount: number }[] }[] = [
  { name: "All-in NVDA", positions: [{ symbol: "NVDA", dollarAmount: 10000 }] },
  { name: "FAANG Classic", positions: [
    { symbol: "AAPL", dollarAmount: 2000 }, { symbol: "AMZN", dollarAmount: 2000 },
    { symbol: "META", dollarAmount: 2000 }, { symbol: "NFLX", dollarAmount: 2000 },
    { symbol: "GOOGL", dollarAmount: 2000 },
  ]},
  { name: "Just buy the index", positions: [{ symbol: "SPY", dollarAmount: 10000 }] },
  { name: "Magnificent 7", positions: [
    { symbol: "AAPL", dollarAmount: 1500 }, { symbol: "MSFT", dollarAmount: 1500 },
    { symbol: "GOOGL", dollarAmount: 1500 }, { symbol: "AMZN", dollarAmount: 1500 },
    { symbol: "NVDA", dollarAmount: 1500 }, { symbol: "META", dollarAmount: 1500 },
    { symbol: "TSLA", dollarAmount: 1000 },
  ]},
];

export default function ChronosPage() {
  const [startDate, setStartDate] = useState<string>("2020-01-02");
  const [positions, setPositions] = useState<Position[]>([
    { id: crypto.randomUUID(), symbol: "NVDA", dollarAmount: 5000 },
    { id: crypto.randomUUID(), symbol: "AAPL", dollarAmount: 5000 },
  ]);
  const [result, setResult] = useState<ChronosResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalInvested = useMemo(
    () => positions.reduce((s, p) => s + (Number(p.dollarAmount) || 0), 0),
    [positions]
  );

  const addSymbol = (symbol: string) => {
    if (positions.find((p) => p.symbol.toUpperCase() === symbol.toUpperCase())) return;
    setPositions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), symbol: symbol.toUpperCase(), dollarAmount: 1000 },
    ]);
  };

  const updateAmount = (id: string, amount: number) => {
    setPositions((prev) => prev.map((p) => (p.id === id ? { ...p, dollarAmount: amount } : p)));
  };

  const removePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const loadSample = (sample: typeof SAMPLE_BUILDS[number]) => {
    setPositions(sample.positions.map((p) => ({ id: crypto.randomUUID(), ...p })));
    setResult(null);
  };

  const reset = () => {
    setPositions([]);
    setResult(null);
    setError(null);
  };

  const simulate = async () => {
    setError(null);
    setResult(null);
    const valid = positions.filter((p) => p.symbol && p.dollarAmount > 0);
    if (valid.length === 0) {
      setError("Add at least one position with a dollar amount.");
      return;
    }
    if (!startDate) {
      setError("Pick a start date.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/chronos/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          positions: valid.map((p) => ({ symbol: p.symbol, dollarAmount: Number(p.dollarAmount) })),
          includeBenchmark: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Simulation failed.");
      } else {
        setResult(data as ChronosResult);
      }
    } catch (e) {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const minDate = "2010-01-01";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      {/* Animated background — futuristic time-grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(212,175,55,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),_transparent_60%)] pointer-events-none" />

      {/* Top Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border h-16 px-6 lg:px-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <button className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Dashboard
            </button>
          </Link>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-7 h-7 border border-gold-hairline flex items-center justify-center bg-primary/10"
            >
              <Hourglass className="w-3.5 h-3.5 text-primary" />
            </motion.div>
            <div>
              <div className="text-xs font-bold tracking-widest">CHRONOS</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Time-Travel Sandbox</div>
            </div>
          </div>
        </div>
        <ModeSwitcher />
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10 space-y-10 pb-24">
        {/* Hero */}
        <section className="space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl lg:text-4xl font-bold tracking-tight"
          >
            What if you'd invested back then?
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Pick any date in the past. Build a portfolio. CHRONOS pulls real historical prices and
            shows what would've happened — with the S&P 500 as your benchmark. The fastest way to
            learn how investing actually works, without risking a dollar.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Builder */}
          <div className="lg:col-span-2 space-y-5">
            {/* Start Date */}
            <div className="glass-panel border border-gold-hairline p-5 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Hourglass className="w-3 h-3 text-primary" /> Step 1 — Pick a date
              </div>
              <Input
                type="date"
                value={startDate}
                min={minDate}
                max={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border-gold-hairline rounded-none font-mono text-sm h-11"
                data-testid="input-chronos-date"
              />
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.date}
                    onClick={() => setStartDate(p.date)}
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 border transition-colors ${
                      startDate === p.date
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-gold-hairline hover:text-foreground"
                    }`}
                    data-testid={`preset-${p.date}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Positions */}
            <div className="glass-panel border border-border p-5 space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Plus className="w-3 h-3 text-primary" /> Step 2 — Build your portfolio
              </div>
              <StockSearch onPick={addSymbol} />

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {positions.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-2 p-2.5 border border-border bg-background/50"
                    >
                      <div className="w-9 h-9 shrink-0 flex items-center justify-center bg-card border border-gold-hairline text-[10px] font-bold font-mono text-primary">
                        {p.symbol.slice(0, 4)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{p.symbol}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={p.dollarAmount}
                          min={1}
                          onChange={(e) => updateAmount(p.id, Number(e.target.value))}
                          className="w-24 h-8 bg-background border-border rounded-none font-mono text-xs text-right"
                          data-testid={`amount-${p.symbol}`}
                        />
                      </div>
                      <button
                        onClick={() => removePosition(p.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        data-testid={`remove-${p.symbol}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {positions.length === 0 && (
                  <div className="text-center py-6 text-xs font-mono text-muted-foreground border border-dashed border-border">
                    Search above to add stocks. Try AAPL, NVDA, TSLA, SPY…
                  </div>
                )}
              </div>

              {positions.length > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total Invested</span>
                  <span className="font-mono text-sm font-bold text-primary">
                    ${totalInvested.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={simulate}
                  disabled={loading || positions.length === 0}
                  className="flex-1 rounded-none bg-gold-metal text-primary-foreground hover:opacity-90 font-mono uppercase tracking-widest text-xs h-11 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                  data-testid="button-simulate"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Time-traveling…</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Run Simulation</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="rounded-none border-border h-11"
                  title="Clear"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {error && (
                <div className="border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}
            </div>

            {/* Sample builds */}
            <div className="glass-panel border border-border p-5 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Or try a famous portfolio
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_BUILDS.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => loadSample(s)}
                    className="text-[11px] font-mono text-left p-2.5 border border-border hover:border-gold-hairline hover:bg-primary/5 transition-colors"
                    data-testid={`sample-${s.name}`}
                  >
                    <div className="font-bold text-foreground">{s.name}</div>
                    <div className="text-muted-foreground text-[10px] mt-0.5">{s.positions.length} stock{s.positions.length === 1 ? "" : "s"}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Results */}
          <div className="lg:col-span-3 space-y-5">
            {!result && !loading && (
              <div className="glass-panel border border-dashed border-border p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 border border-gold-hairline rounded-full flex items-center justify-center mb-5 bg-primary/5"
                >
                  <Hourglass className="w-7 h-7 text-primary" />
                </motion.div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Set a date, build a portfolio, and hit <span className="text-primary font-mono">Run Simulation</span> to see how it would've played out.
                </p>
              </div>
            )}

            {loading && (
              <div className="glass-panel border border-gold-hairline p-12 text-center min-h-[400px] flex flex-col items-center justify-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full"
                />
                <div className="space-y-1">
                  <div className="text-sm font-mono uppercase tracking-widest text-primary">Initializing CHRONOS</div>
                  <div className="text-[11px] font-mono text-muted-foreground">Fetching historical prices · computing timeline · benchmarking vs S&P 500</div>
                </div>
              </div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Headline */}
                <div className="glass-panel border border-gold-hairline p-6 lg:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    {result.returnPct >= 0 ? <TrendingUp className="w-32 h-32 text-primary" /> : <TrendingDown className="w-32 h-32 text-destructive" />}
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-baseline justify-between flex-wrap gap-3">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          ${result.totalInvested.toLocaleString()} on {result.startDate} → today
                        </div>
                        <div className="text-4xl lg:text-5xl font-bold tracking-tighter mt-2">
                          ${Math.round(result.currentValue).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl lg:text-3xl font-bold ${result.returnPct >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                          {result.returnPct >= 0 ? "+" : ""}{result.returnPct.toFixed(1)}%
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mt-1">
                          {result.cagrPct >= 0 ? "+" : ""}{result.cagrPct.toFixed(1)}% / yr
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pt-4 border-t border-border">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm leading-relaxed text-foreground/90" data-testid="chronos-explanation">
                        {result.explanation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline Chart */}
                <div className="glass-panel border border-border p-5 lg:p-6">
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest">Portfolio vs S&P 500</h3>
                    {result.benchmarkReturnPct !== undefined && (
                      <div className="text-[10px] font-mono text-muted-foreground">
                        SPY: <span className={result.benchmarkReturnPct >= 0 ? "text-emerald-500" : "text-destructive"}>
                          {result.benchmarkReturnPct >= 0 ? "+" : ""}{result.benchmarkReturnPct.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.timeline} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={(d) => d.slice(0, 7)}
                          minTickGap={60}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          width={55}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--primary))",
                            borderRadius: 0,
                            fontFamily: "monospace",
                            fontSize: 11,
                          }}
                          formatter={(v: number, name: string) => [`$${Math.round(v).toLocaleString()}`, name === "portfolioValue" ? "Your portfolio" : "S&P 500"]}
                          labelFormatter={(l) => `Date: ${l}`}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}
                          formatter={(v) => v === "portfolioValue" ? "Your portfolio" : "S&P 500"}
                        />
                        {result.benchmarkReturnPct !== undefined && (
                          <Area
                            type="monotone"
                            dataKey="benchmarkValue"
                            stroke="#94A3B8"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            fill="url(#benchGrad)"
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="portfolioValue"
                          stroke="#D4AF37"
                          strokeWidth={2.5}
                          fill="url(#portfolioGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Per-position breakdown */}
                <div className="glass-panel border border-border p-5 lg:p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-4">Per-Position Breakdown</h3>
                  <div className="space-y-2">
                    {[...result.positions]
                      .sort((a, b) => b.returnPct - a.returnPct)
                      .map((p, i) => {
                        const isWinner = i === 0 && p.returnPct > 0;
                        return (
                          <div
                            key={p.symbol}
                            className="flex items-center gap-3 p-3 border border-border bg-background/40 hover:bg-background/60 transition-colors"
                            data-testid={`position-result-${p.symbol}`}
                          >
                            <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-card border border-gold-hairline text-[10px] font-bold font-mono text-primary relative">
                              {p.symbol.slice(0, 4)}
                              {isWinner && (
                                <Trophy className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-amber-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm truncate">{p.symbol}</div>
                              <div className="text-[10px] font-mono text-muted-foreground truncate">
                                ${p.dollarAmount.toLocaleString()} → ${Math.round(p.endValue).toLocaleString()}
                              </div>
                            </div>
                            <div className="hidden sm:block text-right">
                              <div className="text-[10px] font-mono text-muted-foreground">
                                ${p.startPrice.toFixed(2)} → ${p.endPrice.toFixed(2)}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground">
                                {p.shares.toFixed(2)} sh
                              </div>
                            </div>
                            <div className="text-right shrink-0 w-20">
                              <div className={`text-sm font-bold font-mono ${p.returnPct >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                                {p.returnPct >= 0 ? "+" : ""}{p.returnPct.toFixed(1)}%
                              </div>
                              <div className={`text-[10px] font-mono ${p.returnDollar >= 0 ? "text-emerald-500/70" : "text-destructive/70"}`}>
                                {p.returnDollar >= 0 ? "+" : ""}${Math.round(p.returnDollar).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
