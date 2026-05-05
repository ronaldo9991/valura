import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, ShieldAlert, PieChart, Activity, Briefcase, Zap,
  AlertTriangle, AlertCircle, Info, BrainCircuit, GraduationCap, Sparkles,
  PanelRightClose, PanelRightOpen, LogOut, Beaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModeToggle } from "@/components/mode-toggle";
import { ModeSwitcher } from "@/components/mode-switcher";
import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { AiChat, type AiChatHandle } from "@/components/dashboard/ai-chat";
import { StockSearch } from "@/components/dashboard/stock-search";
import { StockDetailDrawer } from "@/components/dashboard/stock-detail-drawer";
import { StockChart } from "@/components/dashboard/stock-chart";
import { WatchlistPanel } from "@/components/dashboard/watchlist-panel";
import {
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip,
} from "recharts";
import {
  useGetUser, useGetPortfolio, useGetPortfolioSummary, useGetPortfolioHealth, useGetMarketMovers,
  getGetUserQueryKey, getGetPortfolioQueryKey, getGetPortfolioSummaryQueryKey, getGetPortfolioHealthQueryKey,
} from "@workspace/api-client-react";
import { clearSession, getStoredUserId, resolveSessionDisplayName, getStoredDisplayName, SCRATCH_USER_ID } from "@/lib/auth";
import { useLocalSignInName } from "@/hooks/use-local-sign-in-name";

const NOVICE_KEY = "valura.noviceMode";
const SIDEBAR_KEY = "valura.aiSidebarOpen";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [userId] = useState<string>(() => getStoredUserId() ?? "user_001");
  const [activeSection, setActiveSection] = useState("overview");
  const [drawerSymbol, setDrawerSymbol] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState<boolean>(() => localStorage.getItem(SIDEBAR_KEY) !== "false");
  const [novice, setNovice] = useState<boolean>(() => localStorage.getItem(NOVICE_KEY) !== "false");
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const aiRef = useRef<AiChatHandle>(null);

  useEffect(() => { localStorage.setItem(SIDEBAR_KEY, String(aiOpen)); }, [aiOpen]);
  useEffect(() => { localStorage.setItem(NOVICE_KEY, String(novice)); }, [novice]);

  const { data: user, isLoading: isLoadingUser } = useGetUser(userId, { query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) } });
  const { data: portfolio, isLoading: isLoadingPortfolio } = useGetPortfolio(userId, { query: { enabled: !!userId, queryKey: getGetPortfolioQueryKey(userId) } });
  const { data: summary, isLoading: isLoadingSummary } = useGetPortfolioSummary(userId, { query: { enabled: !!userId, queryKey: getGetPortfolioSummaryQueryKey(userId) } });
  const { data: health, isLoading: isLoadingHealth } = useGetPortfolioHealth(userId, { query: { enabled: !!userId, queryKey: getGetPortfolioHealthQueryKey(userId) } });
  const { data: movers, isLoading: isLoadingMovers } = useGetMarketMovers();
  const { data: localIdentity } = useLocalSignInName();

  const aiDisplayName = resolveSessionDisplayName(user?.name, localIdentity?.signInName);

  const greetName = useMemo(() => {
    const raw = aiDisplayName.trim();
    return raw.split(/\s+/)[0] || "there";
  }, [aiDisplayName]);

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "chart", "holdings", "allocation", "performance", "risk", "markets"];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) { setActiveSection(section); break; }
        }
      }
    };
    const mainArea = document.getElementById("main-scroll-area");
    if (!mainArea) return;
    mainArea.addEventListener("scroll", handleScroll);
    return () => mainArea.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    const mainArea = document.getElementById("main-scroll-area");
    if (el && mainArea) {
      mainArea.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  const handleLogout = () => { clearSession(); setLocation("/login"); };

  const askAi = (prompt: string) => {
    setAiOpen(true);
    setPendingPrompt(prompt);
  };

  const COLORS = ['#D4AF37', '#B8860B', '#8C6239', '#5C4033', '#A0522D', '#CD7F32'];
  const sectorData = useMemo(() => summary?.allocationBySector?.map(s => ({ name: s.sector, value: s.pct })) ?? [], [summary]);
  const topHoldingTicker: string | null = useMemo(() => {
    if (!portfolio?.holdings?.length) return null;
    return [...portfolio.holdings].sort((a, b) => b.weight - a.weight)[0]?.ticker ?? null;
  }, [portfolio]);

  const navItems = useMemo(() => [
    { id: "overview", label: "Overview", icon: Activity, desc: novice ? "Your money at a glance" : "Live Portfolio Metrics" },
    ...(topHoldingTicker ? [{ id: "chart", label: "Top Holding", icon: TrendingUp, desc: novice ? "Live price chart" : "Real-time price action" }] : []),
    { id: "holdings", label: "Holdings", icon: Briefcase, desc: novice ? "What you own" : "Active Positions" },
    { id: "allocation", label: "Allocation", icon: PieChart, desc: novice ? "Where your money is" : "Sector & Asset Weights" },
    { id: "performance", label: "Performance", icon: Sparkles, desc: novice ? "How well you're doing" : "Alpha vs Benchmark" },
    { id: "risk", label: "Risk", icon: ShieldAlert, desc: novice ? "What could go wrong" : "Concentration & Volatility" },
    { id: "markets", label: "Markets", icon: Zap, desc: novice ? "Today's big movers" : "Global Movers" },
  ], [novice, topHoldingTicker]);

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">

        {/* Left Nav Rail */}
        <aside className="w-60 border-r border-border glass-panel flex flex-col z-20 shrink-0">
          <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="w-8 h-8 rounded-sm bg-gold-metal flex items-center justify-center text-primary-foreground font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all">V</div>
                <span className="font-bold tracking-widest text-xs">VALURA</span>
              </div>
            </Link>
            <ModeToggle />
          </div>

          <div className="p-5 shrink-0 border-b border-border">
            {isLoadingUser ? <Skeleton className="h-12 w-full" /> : user && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Signed in as</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">
                    {aiDisplayName || user.name}
                  </span>
                  <Badge variant="outline" className="border-gold-hairline text-gold font-mono text-[9px] uppercase rounded-none shrink-0">{user.riskProfile}</Badge>
                </div>
                {userId === SCRATCH_USER_ID ? (
                  <div className="text-[10px] text-muted-foreground font-mono leading-snug space-y-1">
                    <span className="block">Paper portfolio — build positions in the simulation lab.</span>
                    <Link href="/build" className="inline-flex items-center gap-1 text-primary hover:underline font-semibold">
                      <Beaker className="w-3 h-3" /> Open simulation lab
                    </Link>
                  </div>
                ) : (getStoredDisplayName() || localIdentity?.signInName) ? (
                  <div className="text-[10px] text-muted-foreground font-mono truncate" title={user.name}>
                    Sample book · {user.name}
                  </div>
                ) : null}
                <div className="text-[10px] text-muted-foreground font-mono">
                  KYC: <span className={user.kycStatus === 'approved' ? 'text-emerald-500' : 'text-amber-500'}>{user.kycStatus}</span>
                </div>
                <button onClick={handleLogout} className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary flex items-center gap-1 mt-2" data-testid="button-logout">
                  <LogOut className="w-3 h-3" /> Switch profile
                </button>
              </div>
            )}
          </div>

          {/* Novice Mode Toggle */}
          <div className="px-5 py-4 border-b border-border shrink-0">
            <button
              onClick={() => setNovice(!novice)}
              className={`w-full flex items-center justify-between p-3 border transition-colors ${novice ? "border-gold-hairline bg-primary/5" : "border-border hover:border-gold-hairline/50"}`}
              data-testid="toggle-novice-mode"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className={`w-4 h-4 ${novice ? "text-primary" : "text-muted-foreground"}`} />
                <div className="text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider">Beginner Mode</div>
                  <div className="text-[9px] font-mono text-muted-foreground">{novice ? "Plain English on" : "Tap to enable"}</div>
                </div>
              </div>
              <div className={`w-7 h-4 rounded-full relative transition-colors ${novice ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-background transition-all ${novice ? "left-3.5" : "left-0.5"}`} />
              </div>
            </button>
          </div>

          {userId === SCRATCH_USER_ID && (
            <div className="px-5 pb-4 border-b border-border shrink-0">
              <Link
                href="/build"
                className="flex items-center gap-2 w-full px-3 py-2.5 border border-gold-hairline bg-primary/5 text-xs font-semibold uppercase tracking-wider hover:bg-primary/10 transition-colors"
              >
                <Beaker className="w-4 h-4 text-primary" />
                Simulation lab
              </Link>
              <p className="text-[9px] font-mono text-muted-foreground mt-2 px-1 leading-snug">
                Paper cash, practice trades, AI coach
              </p>
            </div>
          )}

          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-none border-l-2 transition-all flex flex-col gap-0.5 ${
                    activeSection === item.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                    <item.icon className="w-3.5 h-3.5" /> {item.label}
                  </div>
                  <div className="text-[10px] pl-5 font-mono opacity-60 leading-tight">{item.desc}</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content Area */}
        <main id="main-scroll-area" className="flex-1 overflow-y-auto scroll-smooth relative z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.04] via-background to-background">

          {/* Sticky Top Bar with Search */}
          <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <StockSearch onPick={(s) => setDrawerSymbol(s)} />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <ModeSwitcher />
              <Button variant="ghost" size="icon" onClick={() => setAiOpen(!aiOpen)} className="rounded-none hover:bg-white/5" data-testid="toggle-ai-sidebar">
                {aiOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-16 pb-32">

            {/* Section 1: Overview */}
            <section id="overview" className="space-y-5 pt-2">
              <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    {novice ? `Hi ${greetName} — here's your money today` : `Hi ${greetName} — portfolio command`}
                    {isLoadingSummary && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1 font-mono">
                    {novice ? "Updated in real time. Tap any number to learn what it means." : "Real-time valuation & alpha tracking"}
                  </p>
                </div>
              </div>

              {userId === SCRATCH_USER_ID && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-primary/30 bg-primary/[0.06] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <Beaker className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold">Simulation lab</div>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Set paper cash, place practice trades, and ask the AI coach to stress-test your book.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="rounded-none shrink-0 w-full sm:w-auto">
                    <Link href="/build">Open lab</Link>
                  </Button>
                </motion.div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard
                  title="Total Money"
                  fullTitle="Total Assets Under Management"
                  value={summary?.totalValue}
                  format="currency"
                  novice={novice}
                  noviceHint="Everything you own + cash, in dollars."
                  techHint="Sum of all holdings at current market value plus uninvested cash."
                  loading={isLoadingSummary}
                />
                <StatCard
                  title="Today"
                  fullTitle="Today's Change"
                  value={summary?.dailyChange}
                  format="currency-signed"
                  change={summary?.dailyChangePct}
                  novice={novice}
                  noviceHint="How much you made (or lost) today."
                  techHint="Change in portfolio value since market open."
                  loading={isLoadingSummary}
                />
                <StatCard
                  title="All-Time"
                  fullTitle="Total Return"
                  value={summary?.totalReturn}
                  format="currency-signed"
                  change={summary?.totalReturnPct}
                  novice={novice}
                  noviceHint="Profit since you bought."
                  techHint="Total gain/loss vs original cost basis."
                  loading={isLoadingSummary}
                />
                <StatCard
                  title="Risk Score"
                  value={summary?.riskScore}
                  format="score"
                  novice={novice}
                  noviceHint="0 = boring & safe, 100 = wild ride."
                  techHint="Proprietary 0–100 metric weighting volatility, concentration, beta."
                  loading={isLoadingSummary}
                />
                <StatCard
                  title="Cash"
                  fullTitle="Cash Balance"
                  value={portfolio?.cashBalance}
                  format="currency"
                  novice={novice}
                  noviceHint="Money ready to invest."
                  techHint="Uninvested liquid balance available for deployment."
                  loading={isLoadingPortfolio}
                />
                <StatCard
                  title="Stocks"
                  fullTitle="Number of Positions"
                  value={summary?.holdingsCount}
                  format="number"
                  novice={novice}
                  noviceHint="Different companies you own."
                  techHint="Count of unique tickers held."
                  loading={isLoadingSummary}
                />
              </div>

              {novice && summary && (
                <div className="border border-gold-hairline bg-primary/5 p-4 flex items-start gap-3">
                  <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm leading-relaxed">
                    <strong>Quick read:</strong> You have <span className="text-primary font-bold">${summary.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> invested across <span className="text-primary font-bold">{summary.holdingsCount} stocks</span>. Today the market moved your portfolio by <span className={summary.dailyChangePct >= 0 ? "text-emerald-500 font-bold" : "text-destructive font-bold"}>{summary.dailyChangePct >= 0 ? "+" : ""}{summary.dailyChangePct.toFixed(2)}%</span>. Use the search bar above to look up any stock.
                  </div>
                </div>
              )}
            </section>

            {/* Section 2: Top Holding Live Chart */}
            {topHoldingTicker && (
              <section id="chart" className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{novice ? "Your biggest stock — live price" : "Top Holding · Live"}</h2>
                  <p className="text-muted-foreground font-mono text-sm mt-1">
                    {novice ? `${topHoldingTicker} is your biggest position. Here's how it's been doing.` : `Real-time chart for ${topHoldingTicker} — your largest weighted position`}
                  </p>
                </div>
                <div className="glass-panel border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-background border border-gold-hairline text-xs font-bold font-mono text-primary">{topHoldingTicker.slice(0, 4)}</div>
                      <div>
                        <button onClick={() => setDrawerSymbol(topHoldingTicker)} className="font-bold text-lg hover:text-primary transition-colors text-left" data-testid="button-open-top-holding">
                          {topHoldingTicker}
                        </button>
                        <div className="text-xs text-muted-foreground font-mono">Tap for full details</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setDrawerSymbol(topHoldingTicker)} className="rounded-none border-gold-hairline text-primary hover:bg-primary/10 text-xs h-8 font-mono uppercase tracking-wider">View Details</Button>
                  </div>
                  <StockChart symbol={topHoldingTicker} height={260} />
                </div>
              </section>
            )}

            {/* Section 3: Holdings */}
            <section id="holdings" className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight">{novice ? "Stocks you own" : "Holdings"}</h2>
                <p className="text-muted-foreground font-mono text-sm mt-1">
                  {novice ? "Click any stock to see its live chart and details." : "Active positions and cost basis"}
                </p>
              </div>
              <HoldingsTable portfolio={portfolio} isLoading={isLoadingPortfolio} userId={userId} onPickSymbol={(s) => setDrawerSymbol(s)} />
            </section>

            {/* Section: Watchlists */}
            <WatchlistPanel userId={userId} onPickTicker={(t) => setDrawerSymbol(t)} />

            {/* Section 4: Allocation */}
            <section id="allocation" className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight">{novice ? "Where your money lives" : "Allocation Strategy"}</h2>
                <p className="text-muted-foreground font-mono text-sm mt-1">
                  {novice ? "Spreading money across different industries reduces risk." : "Exposure across sectors and assets"}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass-panel border-gold-hairline p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 text-muted-foreground">By Industry</h3>
                  <div className="h-[240px] w-full">
                    {isLoadingSummary ? <Skeleton className="w-full h-full rounded-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie data={sectorData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                            {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Weight']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 0, fontFamily: 'monospace', fontSize: '11px' }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    {sectorData.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-2 text-[11px] font-mono">
                        <div className="w-2 h-2 shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="truncate flex-1">{s.name}</span>
                        <span className="text-muted-foreground">{s.value.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel border-border p-5 flex flex-col">
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 text-muted-foreground">By Stock</h3>
                  <div className="flex-1 flex flex-col justify-center space-y-3">
                    {isLoadingSummary ? <Skeleton className="w-full h-32" /> : (
                      summary?.allocationByAsset.map((asset, i) => (
                        <button key={asset.name} onClick={() => setDrawerSymbol(asset.name)} className="space-y-1 text-left hover:opacity-80 transition-opacity">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="font-bold">{asset.name}</span>
                            <span className="text-muted-foreground">{asset.pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary/20 overflow-hidden">
                            <div className="h-full bg-gold-metal transition-all duration-1000 ease-out" style={{ width: `${asset.pct}%`, opacity: 1 - (i * 0.12) }} />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {novice && (
                    <p className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/50 leading-relaxed">
                      <Info className="w-3 h-3 inline text-primary mr-1" /> If one stock is more than 25% of your portfolio, you're concentrated — a single bad day hurts more.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 5: Performance */}
            <section id="performance" className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight">{novice ? "Are you beating the market?" : "Performance"}</h2>
                <p className="text-muted-foreground font-mono text-sm mt-1">
                  {novice
                    ? `Compared to the S&P 500 — what investing in the whole market would have done.`
                    : `Portfolio alpha relative to ${health?.benchmarkComparison?.benchmark || 'benchmark'}`}
                </p>
              </div>

              <div className="glass-panel border border-border p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp className="w-40 h-40 text-primary" /></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{novice ? "Edge over the market" : "Alpha"}</div>
                    {isLoadingHealth ? <Skeleton className="h-12 w-32" /> : (
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl lg:text-5xl font-bold tracking-tighter ${(health?.benchmarkComparison?.alphaPct ?? 0) > 0 ? 'text-primary' : 'text-destructive'}`}>
                          {(health?.benchmarkComparison?.alphaPct ?? 0) > 0 ? '+' : ''}
                          {health?.benchmarkComparison?.alphaPct?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      {novice
                        ? "Positive means you're winning vs just buying the whole market."
                        : `Excess return vs ${health?.benchmarkComparison?.benchmark}.`}
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5 font-mono">
                        <span className="font-bold">{novice ? "You" : "Your Portfolio"}</span>
                        <span className="text-primary font-bold">{health?.benchmarkComparison?.portfolioReturnPct?.toFixed(2)}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-secondary/20 overflow-hidden">
                        <div className="h-full bg-gold-metal transition-all duration-1000" style={{ width: `${Math.min(Math.max((health?.benchmarkComparison?.portfolioReturnPct || 0) * 2, 5), 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5 font-mono">
                        <span className="text-muted-foreground">{novice ? "Whole market (S&P 500)" : health?.benchmarkComparison?.benchmark}</span>
                        <span className="text-muted-foreground">{health?.benchmarkComparison?.benchmarkReturnPct?.toFixed(2)}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-secondary/20 overflow-hidden">
                        <div className="h-full bg-muted-foreground/40 transition-all duration-1000" style={{ width: `${Math.min(Math.max((health?.benchmarkComparison?.benchmarkReturnPct || 0) * 2, 5), 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Risk */}
            <section id="risk" className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight">{novice ? "What could go wrong?" : "Risk & Intelligence"}</h2>
                <p className="text-muted-foreground font-mono text-sm mt-1">
                  {novice ? "AI-spotted issues you should know about." : "Algorithmic portfolio diagnostics"}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="glass-panel border-border p-5 flex flex-col gap-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{novice ? "Eggs in one basket" : "Concentration"}</span>
                      {(health?.concentrationRisk?.flag === 'high' || health?.concentrationRisk?.flag === 'critical') ? (
                        <Badge variant="destructive" className="rounded-none uppercase font-mono text-[9px]">High</Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-none uppercase font-mono text-[9px] text-emerald-500 border-emerald-500/50">Healthy</Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold">{health?.concentrationRisk?.topPositionPct?.toFixed(1)}%</div>
                    <div className="text-[11px] text-muted-foreground mt-1">in your biggest position</div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-2">{novice ? "Bumpiness" : "Volatility"}</span>
                    <div className="text-2xl font-bold">{health?.performance?.volatility?.toFixed(2)}%</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{novice ? "How much your value swings" : "Annualized standard deviation"}</div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {(health?.concentrationRisk?.flag === 'high' || health?.concentrationRisk?.flag === 'critical')
                        ? `Your top stock is ${health?.concentrationRisk?.topPositionPct?.toFixed(1)}% of everything you own. ${novice ? "If it has a bad day, you feel it hard." : "Consider trimming below 20%."}`
                        : `Top position at ${health?.concentrationRisk?.topPositionPct?.toFixed(1)}% — well diversified.`}
                    </p>
                  </div>
                </div>

                <div className="glass-panel border-gold-hairline p-0 flex flex-col lg:col-span-2 overflow-hidden">
                  <div className="px-5 py-3 border-b border-border bg-primary/5 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest">{novice ? "What the AI noticed" : "AI Observations"}</h3>
                  </div>
                  <ScrollArea className="h-[280px]">
                    <div className="divide-y divide-border">
                      {isLoadingHealth ? (
                        <div className="p-5 space-y-3">
                          <Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" />
                        </div>
                      ) : health?.observations?.map((obs, i) => (
                        <div key={i} className="p-5 hover:bg-white/5 transition-colors flex gap-3">
                          <div className="shrink-0 mt-0.5">
                            {obs.severity === 'danger' ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
                             obs.severity === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-500" /> :
                             <Info className="w-4 h-4 text-primary" />}
                          </div>
                          <div className="flex-1">
                            <Badge variant="outline" className={`rounded-none text-[9px] font-mono uppercase mb-1.5 ${
                              obs.severity === 'danger' ? 'border-destructive text-destructive' :
                              obs.severity === 'warning' ? 'border-amber-500 text-amber-500' :
                              'border-primary text-primary'
                            }`}>{obs.severity}</Badge>
                            <p className="text-sm text-foreground/90 leading-relaxed">{obs.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </section>

            {/* Section 7: Markets */}
            <section id="markets" className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight">{novice ? "Today's biggest movers" : "Market Intelligence"}</h2>
                <p className="text-muted-foreground font-mono text-sm mt-1">{novice ? "Tap any stock to dig in." : "Top gainers and losers driving the market"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <MoversCard title="Going Up" symbols={movers?.gainers ?? []} loading={isLoadingMovers} positive onPick={setDrawerSymbol} />
                <MoversCard title="Going Down" symbols={movers?.losers ?? []} loading={isLoadingMovers} positive={false} onPick={setDrawerSymbol} />
              </div>
            </section>

          </div>
        </main>

        {/* Right AI Sidebar */}
        <AnimatePresence>
          {aiOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="border-l border-gold-hairline bg-card flex flex-col z-20 shrink-0 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div style={{ width: 384 }} className="h-full">
                <AiChat ref={aiRef} userId={userId} novice={novice} displayName={aiDisplayName} pendingPrompt={pendingPrompt} onPendingPromptConsumed={() => setPendingPrompt(null)} portfolioContext={{ topHolding: topHoldingTicker, holdingsCount: summary?.holdingsCount, riskFlag: health?.concentrationRisk?.flag }} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Stock Detail Drawer */}
        <StockDetailDrawer symbol={drawerSymbol} onClose={() => setDrawerSymbol(null)} onAskAi={(p) => { setDrawerSymbol(null); askAi(p); }} />
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  title, fullTitle, value, format, change, novice, noviceHint, techHint, loading,
}: {
  title: string;
  fullTitle?: string;
  value?: number | null;
  format: "currency" | "currency-signed" | "number" | "score";
  change?: number;
  novice: boolean;
  noviceHint: string;
  techHint: string;
  loading: boolean;
}) {
  const display = useMemo(() => {
    if (value == null) return "—";
    switch (format) {
      case "currency":
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case "currency-signed":
        return `${value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case "number":
        return value.toString();
      case "score":
        return `${value}/100`;
    }
  }, [value, format]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="glass-panel border border-border p-3 flex flex-col gap-1.5 hover:border-gold-hairline transition-colors cursor-help text-left relative overflow-hidden group min-w-0">
          <div className="absolute inset-0 bg-gold-metal opacity-0 group-hover:opacity-[0.04] transition-opacity" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground truncate">{title}</span>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <span className="text-base lg:text-lg xl:text-xl font-bold tracking-tight text-foreground truncate" title={display}>{display}</span>
          )}
          {change !== undefined && !loading && (
            <div className={`text-[10px] font-mono flex items-center gap-1 ${change >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
              {change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px] text-xs bg-popover border-gold-hairline rounded-none p-3 shadow-xl text-popover-foreground">
        {fullTitle && <div className="font-bold text-foreground mb-1 font-mono text-[11px] uppercase tracking-widest">{fullTitle}</div>}
        <div className="leading-relaxed">{novice ? noviceHint : techHint}</div>
      </TooltipContent>
    </Tooltip>
  );
}

function MoversCard({
  title, symbols, loading, positive, onPick,
}: {
  title: string;
  symbols: { symbol: string; name: string; price: number; changePct: number }[];
  loading: boolean;
  positive: boolean;
  onPick: (s: string) => void;
}) {
  const Icon = positive ? TrendingUp : TrendingDown;
  const tone = positive ? "text-emerald-500" : "text-destructive";
  const bg = positive ? "bg-emerald-500/5" : "bg-destructive/5";

  return (
    <div className="glass-panel border-border p-0">
      <div className={`px-5 py-3 border-b border-border flex justify-between items-center ${bg}`}>
        <h3 className={`text-xs font-bold uppercase tracking-widest ${tone}`}>{title}</h3>
        <Icon className={`w-4 h-4 ${tone}`} />
      </div>
      <div className="divide-y divide-border">
        {loading ? <Skeleton className="h-48" /> : symbols.map(quote => (
          <button
            key={quote.symbol}
            onClick={() => onPick(quote.symbol)}
            className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
            data-testid={`mover-${quote.symbol}`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 text-center font-bold text-sm shrink-0">{quote.symbol}</div>
              <div className="text-[11px] text-muted-foreground truncate">{quote.name}</div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <div className="font-mono text-sm">${quote.price.toFixed(2)}</div>
              <div className={`text-[11px] font-mono ${tone}`}>{positive ? "+" : ""}{quote.changePct.toFixed(2)}%</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
