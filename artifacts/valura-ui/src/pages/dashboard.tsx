import { useState, useMemo } from "react";
import { 
  useGetUser, 
  useGetPortfolio, 
  useGetPortfolioSummary, 
  useGetPortfolioHealth, 
  useGetMarketMovers,
  getGetPortfolioQueryKey, 
  getGetPortfolioSummaryQueryKey, 
  getGetPortfolioHealthQueryKey 
} from "@workspace/api-client-react";
import { Activity, LayoutDashboard, MessageSquare, AlertTriangle, ArrowUpRight, ArrowDownRight, TrendingUp, ShieldAlert, BarChart3, PieChart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiStream } from "@/hooks/use-ai-stream";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, PieChart as RechartsPieChart, Pie } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [userId, setUserId] = useState("user_001");
  
  const { data: user, isLoading: isLoadingUser } = useGetUser(userId, { query: { enabled: !!userId } });
  const { data: portfolio, isLoading: isLoadingPortfolio } = useGetPortfolio(userId, { query: { enabled: !!userId } });
  const { data: summary, isLoading: isLoadingSummary } = useGetPortfolioSummary(userId, { query: { enabled: !!userId } });
  const { data: health, isLoading: isLoadingHealth } = useGetPortfolioHealth(userId, { query: { enabled: !!userId } });
  const { data: movers, isLoading: isLoadingMovers } = useGetMarketMovers();

  const { messages, isStreaming, sendMessage } = useAiStream();
  const [chatInput, setChatInput] = useState("");

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isStreaming) return;
    sendMessage(userId, chatInput);
    setChatInput("");
  };

  const chartData = useMemo(() => {
    if (!summary?.allocationBySector) return [];
    return summary.allocationBySector.map(item => ({
      name: item.sector,
      value: item.pct
    }));
  }, [summary]);

  const COLORS = ['hsl(43 96% 58%)', 'hsl(217 91% 60%)', 'hsl(160 84% 39%)', 'hsl(280 65% 60%)', 'hsl(340 75% 55%)'];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 glass-panel border-r border-white/5 flex flex-col hidden lg:flex flex-shrink-0 z-20">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              <Activity className="text-primary-foreground w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tighter">AENS <span className="text-primary">X</span></span>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Active Profile</label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Select Profile" />
              </SelectTrigger>
              <SelectContent className="bg-[#0b1120] border-white/10 rounded-xl shadow-2xl">
                {["user_001", "user_002", "user_003", "user_004", "user_005"].map((id) => (
                  <SelectItem key={id} value={id} className="rounded-lg focus:bg-white/10">Client Profile: {id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <nav className="p-4 flex-1">
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-white bg-white/10 h-12 rounded-xl">
              <LayoutDashboard className="mr-3 w-5 h-5 text-primary" /> Portfolio Command
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white/50 hover:text-white hover:bg-white/5 h-12 rounded-xl transition-colors">
              <TrendingUp className="mr-3 w-5 h-5" /> Market Intelligence
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white/50 hover:text-white hover:bg-white/5 h-12 rounded-xl transition-colors">
              <ShieldAlert className="mr-3 w-5 h-5" /> Risk Operations
            </Button>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
          {isLoadingUser ? <Skeleton className="h-12 w-full rounded-xl bg-white/10" /> : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary via-amber-400 to-amber-200 p-[2px]">
                <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                  <span className="font-bold text-primary">{user?.name?.charAt(0)}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">{user?.name}</div>
                <div className="text-xs text-white/50 flex items-center gap-2 mt-0.5">
                  <span className="capitalize">{user?.riskProfile}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{user?.currency}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/10 via-background to-background">
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 glass-panel z-10 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Portfolio Command</h1>
            <p className="text-sm text-white/50 mt-1 font-mono">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 rounded-full px-6 h-10 transition-all duration-300">
              Exit Terminal
            </Button>
          </Link>
        </header>

        <div className="flex-1 overflow-auto p-10">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
            {/* Left Column - Portfolio Data */}
            <div className="xl:col-span-8 space-y-8 flex flex-col">
              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total AUM" 
                  value={summary ? `$${summary.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "$0.00"} 
                  change={summary?.dailyChangePct} 
                  loading={isLoadingSummary} 
                  accent="primary"
                />
                <StatCard 
                  title="Total Alpha" 
                  value={summary ? `$${summary.totalReturn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "$0.00"} 
                  change={summary?.totalReturnPct} 
                  loading={isLoadingSummary} 
                  accent="secondary"
                />
                <StatCard 
                  title="Risk Quotient" 
                  value={summary?.riskScore?.toString() || "0"} 
                  subtitle={health?.concentrationRisk?.flag ? `Concentration: ${health.concentrationRisk.flag}` : "Calculating..."}
                  loading={isLoadingSummary} 
                  accent="muted"
                />
              </div>

              {/* Holdings Table */}
              <div className="glass-panel rounded-3xl border border-white/5 flex-1 flex flex-col overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" /> Active Positions
                  </h2>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {summary?.holdingsCount || 0} Assets
                  </Badge>
                </div>
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader className="bg-black/20 sticky top-0 z-10 backdrop-blur-xl">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/40 font-mono text-xs uppercase">Asset</TableHead>
                        <TableHead className="text-white/40 font-mono text-xs uppercase text-right">Price</TableHead>
                        <TableHead className="text-white/40 font-mono text-xs uppercase text-right">Holdings</TableHead>
                        <TableHead className="text-white/40 font-mono text-xs uppercase text-right">Total Value</TableHead>
                        <TableHead className="text-white/40 font-mono text-xs uppercase text-right">Gain/Loss</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingPortfolio ? (
                        Array.from({length: 5}).map((_, i) => (
                          <TableRow key={i} className="border-white/5">
                            <TableCell><Skeleton className="h-10 w-32 bg-white/5 rounded-lg" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 ml-auto bg-white/5" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 ml-auto bg-white/5" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24 ml-auto bg-white/5" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16 ml-auto bg-white/5" /></TableCell>
                          </TableRow>
                        ))
                      ) : portfolio?.holdings?.map((holding) => (
                        <TableRow key={holding.ticker} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm">
                                {holding.ticker.substring(0,2)}
                              </div>
                              <div>
                                <div className="font-bold text-white group-hover:text-primary transition-colors">{holding.ticker}</div>
                                <div className="text-xs text-white/40 max-w-[120px] truncate">{holding.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">${holding.currentPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="font-mono text-sm">{holding.shares}</div>
                            <div className="text-xs text-white/40 mt-0.5">{holding.weight.toFixed(1)}%</div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">${holding.currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                          <TableCell className="text-right">
                            <div className={`inline-flex items-center justify-end font-mono text-sm font-medium ${holding.gainLossPct >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                              {holding.gainLossPct >= 0 ? '+' : ''}{holding.gainLossPct.toFixed(2)}%
                            </div>
                            <div className="text-xs text-white/40 mt-0.5">${Math.abs(holding.gainLoss).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Bottom Section: Allocation & Movers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sector Allocation */}
                <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-white/[0.01]">
                  <h2 className="text-sm font-semibold text-white/60 mb-6 uppercase tracking-wider flex items-center gap-2">
                    <PieChart className="w-4 h-4" /> Sector Allocation
                  </h2>
                  <div className="h-[200px] w-full relative flex items-center justify-center">
                    {isLoadingSummary ? <Skeleton className="w-40 h-40 rounded-full bg-white/5" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: 'white' }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    )}
                    {/* Inner Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold">{summary?.holdingsCount || 0}</span>
                      <span className="text-xs text-white/40">Sectors</span>
                    </div>
                  </div>
                </div>

                {/* Market Movers */}
                <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-white/[0.01]">
                   <h2 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Market Movers
                  </h2>
                  <div className="space-y-4">
                    {isLoadingMovers ? (
                      Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/5" />)
                    ) : (
                      <>
                        {movers?.gainers.slice(0, 2).map(gainer => (
                          <div key={gainer.symbol} className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                            <div className="font-bold">{gainer.symbol}</div>
                            <div className="flex flex-col items-end">
                              <div className="font-mono text-sm">${gainer.price.toFixed(2)}</div>
                              <div className="text-xs text-emerald-400 font-medium">+{gainer.changePct.toFixed(2)}%</div>
                            </div>
                          </div>
                        ))}
                        {movers?.losers.slice(0, 2).map(loser => (
                          <div key={loser.symbol} className="flex justify-between items-center p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                            <div className="font-bold">{loser.symbol}</div>
                            <div className="flex flex-col items-end">
                              <div className="font-mono text-sm">${loser.price.toFixed(2)}</div>
                              <div className="text-xs text-destructive font-medium">{loser.changePct.toFixed(2)}%</div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column - AI Chat */}
            <div className="xl:col-span-4 h-full">
              <div className="glass-panel rounded-[2rem] border border-primary/20 flex flex-col overflow-hidden h-full shadow-[0_0_40px_rgba(250,204,21,0.05)] bg-background/80 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                
                <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full"></span>
                    </div>
                    <div>
                      <h2 className="font-bold text-lg leading-none">Valura AI</h2>
                      <p className="text-xs text-primary mt-1 font-medium tracking-wide uppercase">Co-Investor Agent</p>
                    </div>
                  </div>
                </div>

                {/* Observations summary injected into chat stream conceptually */}
                {health?.observations && health.observations.length > 0 && messages.length === 0 && (
                   <div className="px-6 py-4 bg-amber-500/10 border-b border-amber-500/20">
                     <div className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                       <AlertTriangle className="w-3 h-3" /> AI Portfolio Alert
                     </div>
                     <p className="text-sm text-white/80 leading-relaxed">
                       {health.observations[0].text} I can help you rebalance this concentration risk. What would you like to do?
                     </p>
                   </div>
                )}

                <ScrollArea className="flex-1 p-6 relative z-10">
                  <div className="space-y-6">
                    {messages.length === 0 && (!health?.observations || health.observations.length === 0) && (
                      <div className="flex flex-col items-center justify-center h-40 text-center space-y-4 opacity-50">
                        <Activity className="w-8 h-8 text-primary" />
                        <p className="text-sm font-medium">Awaiting your command.<br/>Ask me to analyze your alpha or rebalance assets.</p>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-lg ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-[#1e293b] border border-white/5 rounded-tl-sm text-white/90'
                        }`}>
                          {msg.role === 'assistant' && !msg.content && isStreaming ? (
                            <span className="flex gap-1 items-center h-4">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                            </span>
                          ) : (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          )}
                          {msg.intent && (
                            <div className="mt-3 pt-3 border-t border-white/10 text-xs font-mono text-white/40 flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-white/5 rounded">Action: {msg.intent}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-4 bg-black/40 relative z-10 border-t border-white/5">
                  <form onSubmit={handleSendChat} className="relative">
                    <Input 
                      value={chatInput} 
                      onChange={(e) => setChatInput(e.target.value)} 
                      placeholder="Ask Valura to execute a trade or analyze risk..." 
                      className="w-full bg-[#0f172a] border-white/10 text-base h-14 pl-5 pr-14 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-white/30"
                      disabled={isStreaming}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform active:scale-95" 
                      disabled={isStreaming || !chatInput.trim()}
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, change, subtitle, loading, accent }: { title: string, value: string, change?: number, subtitle?: string, loading: boolean, accent: 'primary' | 'secondary' | 'muted' }) {
  if (loading) return <Skeleton className="h-36 w-full rounded-3xl bg-white/[0.02] border border-white/5" />;
  
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const accentColor = accent === 'primary' ? 'text-primary' : accent === 'secondary' ? 'text-secondary' : 'text-white/40';
  const glowClass = accent === 'primary' ? 'shadow-[0_0_30px_rgba(250,204,21,0.05)]' : '';

  return (
    <div className={`glass-panel p-6 lg:p-8 rounded-3xl border border-white/5 relative overflow-hidden ${glowClass} bg-white/[0.01]`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${accent === 'primary' ? 'bg-primary' : accent === 'secondary' ? 'bg-secondary' : 'bg-white/10'}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm font-semibold text-white/50 uppercase tracking-wider">{title}</div>
        {accent === 'primary' && <Activity className={`w-4 h-4 ${accentColor} opacity-50`} />}
      </div>
      
      <div className="text-4xl font-bold tracking-tight mb-3 text-white">
        {value}
      </div>
      
      {change !== undefined ? (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : isNegative ? 'bg-destructive/10 text-destructive' : 'bg-white/5 text-white/60'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : isNegative ? <ArrowDownRight className="w-4 h-4 mr-1" /> : null}
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </div>
      ) : subtitle ? (
        <div className="text-sm font-medium text-amber-500/80 bg-amber-500/10 inline-flex items-center px-2.5 py-1 rounded-lg">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
