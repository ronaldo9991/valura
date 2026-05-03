import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowUpRight, TrendingUp, TrendingDown, ArrowRight, ShieldAlert, PieChart, Activity, Briefcase, Zap, AlertTriangle, AlertCircle, Info, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModeToggle } from "@/components/mode-toggle";
import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { AiChat } from "@/components/dashboard/ai-chat";
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ReferenceLine } from "recharts";

import { 
  useGetUser, 
  useGetPortfolio, 
  useGetPortfolioSummary, 
  useGetPortfolioHealth, 
  useGetMarketMovers,
  useGetBatchQuotes,
  getGetUserQueryKey,
  getGetPortfolioQueryKey,
  getGetPortfolioSummaryQueryKey,
  getGetPortfolioHealthQueryKey,
} from "@workspace/api-client-react";

export default function Dashboard() {
  const [userId, setUserId] = useState("user_001");
  const [activeSection, setActiveSection] = useState("overview");
  
  const { data: user, isLoading: isLoadingUser } = useGetUser(userId, { query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) } });
  const { data: portfolio, isLoading: isLoadingPortfolio } = useGetPortfolio(userId, { query: { enabled: !!userId, queryKey: getGetPortfolioQueryKey(userId) } });
  const { data: summary, isLoading: isLoadingSummary } = useGetPortfolioSummary(userId, { query: { enabled: !!userId, queryKey: getGetPortfolioSummaryQueryKey(userId) } });
  const { data: health, isLoading: isLoadingHealth } = useGetPortfolioHealth(userId, { query: { enabled: !!userId, queryKey: getGetPortfolioHealthQueryKey(userId) } });
  const { data: movers, isLoading: isLoadingMovers } = useGetMarketMovers();

  // Scroll spy for left rail
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "holdings", "allocation", "performance", "risk", "markets"];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveSection(section);
            break;
          }
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
      mainArea.scrollTo({
        top: el.offsetTop - 100,
        behavior: "smooth"
      });
      setActiveSection(id);
    }
  };

  const navItems = [
    { id: "overview", label: "Command Bar", icon: Activity, desc: "Live Portfolio Metrics" },
    { id: "holdings", label: "Holdings", icon: Briefcase, desc: "Active Positions" },
    { id: "allocation", label: "Allocation", icon: PieChart, desc: "Sector & Asset Weights" },
    { id: "performance", label: "Performance", icon: TrendingUp, desc: "Alpha vs Benchmark" },
    { id: "risk", label: "Risk Intel", icon: ShieldAlert, desc: "Concentration & Volatility" },
    { id: "markets", label: "Markets", icon: Zap, desc: "Global Movers" },
  ];

  const COLORS = ['#D4AF37', '#B8860B', '#8C6239', '#5C4033', '#A0522D', '#CD7F32'];

  const sectorData = useMemo(() => {
    if (!summary?.allocationBySector) return [];
    return summary.allocationBySector.map(s => ({ name: s.sector, value: s.pct }));
  }, [summary]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">
      {/* Left Nav Rail */}
      <aside className="w-64 border-r border-border glass-panel flex flex-col z-20 shrink-0">
        <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-sm bg-gold-metal flex items-center justify-center text-primary-foreground font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all">
                V
              </div>
              <span className="font-bold tracking-widest text-sm">VALURA</span>
            </div>
          </Link>
          <ModeToggle />
        </div>

        <div className="p-6 shrink-0 border-b border-border">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Client Profile</label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-full bg-background/50 border-gold-hairline h-12 rounded-none focus:ring-1 focus:ring-primary font-mono text-sm">
              <SelectValue placeholder="Select Profile" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-gold-hairline bg-background">
              {["user_001", "user_002", "user_003", "user_004", "user_005"].map((id) => (
                <SelectItem key={id} value={id} className="font-mono text-sm focus:bg-primary/10">{id}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {user && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm">{user.name}</span>
                <Badge variant="outline" className="border-gold-hairline text-gold font-mono text-[10px] uppercase rounded-none">
                  {user.riskProfile}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground font-mono">KYC: <span className={user.kycStatus === 'approved' ? 'text-emerald-500' : 'text-amber-500'}>{user.kycStatus}</span></div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left px-4 py-3 rounded-none border-l-2 transition-all flex flex-col gap-1 ${
                  activeSection === item.id 
                    ? "border-primary bg-primary/5 text-foreground" 
                    : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
                <div className="text-[10px] pl-6 font-mono opacity-60">{item.desc}</div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content Area */}
      <main id="main-scroll-area" className="flex-1 overflow-y-auto scroll-smooth relative z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <div className="max-w-6xl mx-auto p-8 lg:p-12 space-y-24 pb-32">
          
          {/* Section 1: Overview Command Bar */}
          <section id="overview" className="space-y-6 pt-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                Portfolio Command
                {isLoadingSummary && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </h2>
              <p className="text-muted-foreground font-mono text-sm mt-1">Real-time valuation & alpha tracking</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard 
                title="Total AUM" 
                value={summary ? `$${summary.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}` : "$0.00"} 
                tooltip="Total Assets Under Management: The current market value of all your holdings plus cash."
                loading={isLoadingSummary}
              />
              <StatCard 
                title="Today's Change" 
                value={summary ? `$${Math.abs(summary.dailyChange).toLocaleString(undefined, {minimumFractionDigits: 2})}` : "$0.00"} 
                change={summary?.dailyChangePct}
                tooltip="The absolute and percentage change in your portfolio's value today."
                loading={isLoadingSummary}
              />
              <StatCard 
                title="Total Alpha" 
                value={summary ? `$${Math.abs(summary.totalReturn).toLocaleString(undefined, {minimumFractionDigits: 2})}` : "$0.00"} 
                change={summary?.totalReturnPct}
                tooltip="Total Return: How much your portfolio has gained or lost vs your original cost basis."
                loading={isLoadingSummary}
              />
              <StatCard 
                title="Risk Score" 
                value={summary?.riskScore?.toString() || "0"} 
                suffix="/ 100"
                tooltip="A proprietary metric (0-100) evaluating your portfolio's volatility and concentration."
                loading={isLoadingSummary}
              />
              <StatCard 
                title="Cash Balance" 
                value={portfolio ? `$${portfolio.cashBalance.toLocaleString()}` : "$0"} 
                tooltip="Available uninvested cash ready to be deployed."
                loading={isLoadingPortfolio}
              />
              <StatCard 
                title="Positions" 
                value={summary?.holdingsCount?.toString() || "0"} 
                tooltip="The total number of unique assets you currently hold."
                loading={isLoadingSummary}
              />
            </div>
          </section>

          {/* Section 2: Holdings */}
          <section id="holdings" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Holdings</h2>
              <p className="text-muted-foreground font-mono text-sm mt-1">Active positions and cost basis</p>
            </div>
            <HoldingsTable portfolio={portfolio} isLoading={isLoadingPortfolio} userId={userId} />
          </section>

          {/* Section 3: Allocation */}
          <section id="allocation" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Allocation Strategy</h2>
              <p className="text-muted-foreground font-mono text-sm mt-1">Exposure across sectors and assets</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sector Donut */}
              <div className="glass-panel border-gold-hairline p-6 rounded-none relative">
                <h3 className="text-sm font-semibold uppercase tracking-widest mb-6">Sector Allocation</h3>
                <div className="h-[250px] w-full">
                  {isLoadingSummary ? <Skeleton className="w-full h-full rounded-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Weight']}
                          contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 0, fontFamily: 'monospace', fontSize: '12px' }}
                          itemStyle={{ color: 'var(--foreground)' }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Top Assets Stacked Bar (Mocked visual representation of weights) */}
              <div className="glass-panel border-border p-6 rounded-none flex flex-col">
                <h3 className="text-sm font-semibold uppercase tracking-widest mb-6 text-muted-foreground">Asset Concentration</h3>
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  {isLoadingSummary ? <Skeleton className="w-full h-32" /> : (
                    summary?.allocationByAsset.map((asset, i) => (
                      <div key={asset.name} className="space-y-1">
                        <div className="flex justify-between text-sm font-mono">
                          <span className="font-bold">{asset.name}</span>
                          <span className="text-muted-foreground">{asset.pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary/20 overflow-hidden">
                          <div 
                            className="h-full bg-gold-metal transition-all duration-1000 ease-out" 
                            style={{ width: `${asset.pct}%`, opacity: 1 - (i * 0.15) }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Performance */}
          <section id="performance" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Performance Diagnostics</h2>
              <p className="text-muted-foreground font-mono text-sm mt-1">Portfolio alpha relative to {health?.benchmarkComparison?.benchmark || 'benchmark'}</p>
            </div>

            <div className="glass-panel border border-border p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <TrendingUp className="w-48 h-48 text-primary" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Generated Alpha</div>
                  {isLoadingHealth ? <Skeleton className="h-12 w-32" /> : (
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-bold tracking-tighter ${health?.benchmarkComparison?.alphaPct && health.benchmarkComparison.alphaPct > 0 ? 'text-primary' : 'text-destructive'}`}>
                        {health?.benchmarkComparison?.alphaPct && health.benchmarkComparison.alphaPct > 0 ? '+' : ''}
                        {health?.benchmarkComparison?.alphaPct?.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-[200px]">
                    Alpha represents your portfolio's excess return relative to the {health?.benchmarkComparison?.benchmark} index.
                  </p>
                </div>
                
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2 font-mono">
                      <span className="font-bold text-foreground">Your Portfolio</span>
                      <span className="text-primary font-bold">{health?.benchmarkComparison?.portfolioReturnPct?.toFixed(2)}%</span>
                    </div>
                    <div className="h-3 w-full bg-secondary/20 rounded-sm overflow-hidden">
                      <div className="h-full bg-gold-metal" style={{ width: `${Math.min(Math.max((health?.benchmarkComparison?.portfolioReturnPct || 0) * 2, 5), 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2 font-mono">
                      <span className="text-muted-foreground">{health?.benchmarkComparison?.benchmark}</span>
                      <span className="text-muted-foreground">{health?.benchmarkComparison?.benchmarkReturnPct?.toFixed(2)}%</span>
                    </div>
                    <div className="h-3 w-full bg-secondary/20 rounded-sm overflow-hidden">
                      <div className="h-full bg-muted-foreground/40" style={{ width: `${Math.min(Math.max((health?.benchmarkComparison?.benchmarkReturnPct || 0) * 2, 5), 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Risk & Observations */}
          <section id="risk" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Risk & Intelligence</h2>
              <p className="text-muted-foreground font-mono text-sm mt-1">Algorithmic portfolio diagnostics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Panel */}
              <div className="glass-panel border-border p-6 flex flex-col gap-6 lg:col-span-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Concentration Risk</span>
                    {health?.concentrationRisk?.flag === 'high' || health?.concentrationRisk?.flag === 'critical' ? (
                      <Badge variant="destructive" className="rounded-none uppercase font-mono text-[10px]">High</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-none uppercase font-mono text-[10px] text-emerald-500 border-emerald-500/50">Optimal</Badge>
                    )}
                  </div>
                  <div className="text-3xl font-bold">
                    {health?.concentrationRisk?.topPositionPct?.toFixed(1)}% <span className="text-sm font-normal text-muted-foreground">in top position</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Volatility Index</span>
                  <div className="text-3xl font-bold">
                    {health?.performance?.volatility?.toFixed(2)}%
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {health?.concentrationRisk?.flag === 'high' 
                      ? `Your top position accounts for ${health?.concentrationRisk?.topPositionPct?.toFixed(1)}% of your portfolio. Consider trimming to <20% to reduce single-stock risk.`
                      : `Your portfolio is well diversified with the top position at ${health?.concentrationRisk?.topPositionPct?.toFixed(1)}%.`
                    }
                  </p>
                </div>
              </div>

              {/* AI Observations Feed */}
              <div className="glass-panel border-gold-hairline p-0 flex flex-col lg:col-span-2 overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-primary/5 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-widest">AI Observations</h3>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="divide-y divide-border">
                    {isLoadingHealth ? (
                      <div className="p-6 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : health?.observations?.map((obs, i) => (
                      <div key={i} className="p-6 hover:bg-white/5 transition-colors flex gap-4">
                        <div className="shrink-0 mt-1">
                          {obs.severity === 'danger' ? <AlertTriangle className="w-5 h-5 text-destructive" /> : 
                           obs.severity === 'warning' ? <AlertCircle className="w-5 h-5 text-amber-500" /> :
                           <Info className="w-5 h-5 text-primary" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`rounded-none text-[10px] font-mono uppercase ${
                              obs.severity === 'danger' ? 'border-destructive text-destructive' :
                              obs.severity === 'warning' ? 'border-amber-500 text-amber-500' :
                              'border-primary text-primary'
                            }`}>
                              {obs.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed">{obs.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </section>

          {/* Section 6: Markets */}
          <section id="markets" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Market Intelligence</h2>
              <p className="text-muted-foreground font-mono text-sm mt-1">Top gainers and losers driving the market</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gainers */}
              <div className="glass-panel border-border p-0">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-emerald-500/5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500">Top Gainers</h3>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="divide-y divide-border">
                  {isLoadingMovers ? <Skeleton className="h-48" /> : movers?.gainers.map(quote => (
                    <div key={quote.symbol} className="p-4 flex items-center justify-between hover:bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 text-center font-bold text-lg">{quote.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate w-32">{quote.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">${quote.price.toFixed(2)}</div>
                        <div className="text-xs font-mono text-emerald-500">+{quote.changePct.toFixed(2)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Losers */}
              <div className="glass-panel border-border p-0">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-destructive/5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-destructive">Top Losers</h3>
                  <TrendingDown className="w-4 h-4 text-destructive" />
                </div>
                <div className="divide-y divide-border">
                  {isLoadingMovers ? <Skeleton className="h-48" /> : movers?.losers.map(quote => (
                    <div key={quote.symbol} className="p-4 flex items-center justify-between hover:bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 text-center font-bold text-lg">{quote.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate w-32">{quote.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">${quote.price.toFixed(2)}</div>
                        <div className="text-xs font-mono text-destructive">{quote.changePct.toFixed(2)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Right Sidebar - AI Chat */}
      <aside className="w-96 border-l border-gold-hairline bg-card flex flex-col z-20 shrink-0 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <AiChat userId={userId} />
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function StatCard({ 
  title, 
  value, 
  change, 
  suffix,
  tooltip, 
  loading 
}: { 
  title: string, 
  value: string, 
  change?: number, 
  suffix?: string,
  tooltip: string, 
  loading: boolean 
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="glass-panel border border-border p-4 flex flex-col gap-2 hover:border-gold-hairline transition-colors cursor-help text-left relative overflow-hidden group">
            <div className="absolute inset-0 bg-gold-metal opacity-0 group-hover:opacity-5 transition-opacity" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{title}</span>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">{value}</span>
                {suffix && <span className="text-xs text-muted-foreground font-mono">{suffix}</span>}
              </div>
            )}
            
            {change !== undefined && !loading && (
              <div className={`text-xs font-mono flex items-center gap-1 ${change >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change > 0 ? '+' : ''}{change.toFixed(2)}%
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-xs font-mono bg-popover border-gold-hairline rounded-none p-3 shadow-xl text-popover-foreground">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
