import { useMemo, useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Landmark,
  PiggyBank,
  Scale,
  ShieldCheck,
  TrendingUp,
  Telescope,
  Bot,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModeSwitcher } from "@/components/mode-switcher";
import { AiChat } from "@/components/dashboard/ai-chat";
import { getStoredUserId, resolveSessionDisplayName } from "@/lib/auth";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { useLocalSignInName } from "@/hooks/use-local-sign-in-name";

function scenarioFutureValue(monthly: number, years: number, annualPct: number): number {
  if (years <= 0 || monthly <= 0) return 0;
  const r = annualPct / 100 / 12;
  const n = Math.round(years * 12);
  if (r <= 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

export default function PathfinderPage() {
  const userId = useMemo(() => getStoredUserId() ?? "user_001", []);
  const { data: user } = useGetUser(userId, {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) },
  });
  const { data: localId } = useLocalSignInName();

  const aiDisplayName = resolveSessionDisplayName(user?.name, localId?.signInName);
  const greetFirst = aiDisplayName.trim().split(/\s+/)[0] ?? "";

  const [monthly, setMonthly] = useState(250);
  const [years, setYears] = useState(15);
  const [annualReturn, setAnnualReturn] = useState([7]);

  const projected = useMemo(
    () => scenarioFutureValue(monthly, years, annualReturn[0] ?? 7),
    [monthly, years, annualReturn],
  );

  const [scenarioInsight, setScenarioInsight] = useState<string | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  const runScenarioInsight = useCallback(async () => {
    setScenarioLoading(true);
    setScenarioError(null);
    try {
      const r = await fetch("/api/pathfinder/scenario-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly,
          years,
          annualReturnPct: annualReturn[0] ?? 7,
          hypotheticalEndingBalance: Math.round(projected),
          currency: "USD",
          displayName: aiDisplayName || undefined,
        }),
      });
      const data = (await r.json()) as { narrative?: string; message?: string; error?: string };
      if (!r.ok) {
        setScenarioError(data.message ?? data.error ?? "Could not generate insight");
        setScenarioInsight(null);
        return;
      }
      setScenarioInsight(data.narrative ?? "");
    } catch {
      setScenarioError("Network error — is the API running?");
      setScenarioInsight(null);
    } finally {
      setScenarioLoading(false);
    }
  }, [monthly, years, annualReturn, projected, aiDisplayName]);

  useEffect(() => {
    setScenarioInsight(null);
    setScenarioError(null);
  }, [monthly, years, annualReturn]);

  const starterChips = [
    "I'm new — what could I invest in first?",
    "How much should I invest each month as a beginner?",
    "Explain index funds vs single stocks for someone starting out.",
    "Walk me through dollar-cost averaging with a simple example.",
    "How do I decide between conservative vs aggressive investing?",
  ];

  const coInvestorChips = [
    "Give me a simple plan for my first investments.",
    "How should I split money between stocks and bonds given my goal?",
    "What should I verify before buying an individual stock?",
    "Explain dollar-cost averaging vs lump sum for someone starting out.",
  ];

  const [deskFocus, setDeskFocus] = useState<"pathfinder" | "coInvestor">(() => {
    if (typeof window === "undefined") return "pathfinder";
    const q = new URLSearchParams(window.location.search).get("desk");
    if (q === "co-investor" || q === "coinvestor" || q === "ai") return "coInvestor";
    return "pathfinder";
  });

  const setDeskAndUrl = useCallback((mode: "pathfinder" | "coInvestor") => {
    setDeskFocus(mode);
    const u = new URL(window.location.href);
    u.searchParams.set("desk", mode === "pathfinder" ? "pathfinder" : "co-investor");
    window.history.replaceState({}, "", `${u.pathname}?${u.searchParams.toString()}`);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.45) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.07),transparent_55%)] pointer-events-none" />

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/85 border-b border-border h-16 px-4 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard">
            <button
              type="button"
              className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors shrink-0"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </Link>
          <div className="h-5 w-px bg-border shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-widest uppercase truncate">Pathfinder</div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground truncate">
              New investor desk
            </div>
          </div>
        </div>
        <div className="shrink-0 scale-90 sm:scale-100 origin-right">
          <ModeSwitcher />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-4 lg:p-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 space-y-3"
        >
          <Badge variant="outline" className="rounded-none border-gold-hairline text-primary font-mono text-[10px] uppercase tracking-widest">
            {deskFocus === "pathfinder"
              ? "Outlook · scenario lab · Coach AI"
              : "AI Co-Investor · beginner-friendly"}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {deskFocus === "pathfinder" ? (
              greetFirst ? (
                <>Hi {greetFirst} — map what you could invest in & how to start</>
              ) : (
                <>Map what you could invest in & how to start</>
              )
            ) : (
              <>
                AI Co-Investor — ask how to invest, what to consider, and how to build habits
              </>
            )}
          </h1>
          <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
            {deskFocus === "pathfinder" ? (
              <>
                Pathfinder pairs structured guidance with optional Coach chat. Use the toggle below to jump straight into{" "}
                <span className="text-foreground font-medium">AI Co-Investor</span> when you only want conversation.
              </>
            ) : (
              <>
                Full-width chat uses the <span className="text-foreground font-medium">Co-Investor</span> persona by default (balanced, all-purpose).
                Switch personas in the chat footer anytime — same as the dashboard AI desk.
              </>
            )}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground border border-border/80 bg-card/40 px-3 py-2 max-w-3xl leading-relaxed">
            Disclaimer: Valura does not predict markets or guarantee returns. Scenario numbers are hypothetical compounding examples for education,
            not personalized advice. Consider speaking with a licensed professional before investing.
          </p>

          <div className="relative flex w-full max-w-lg border border-gold-hairline bg-background/60 p-1 backdrop-blur-md mt-4">
            <button
              type="button"
              onClick={() => setDeskAndUrl("pathfinder")}
              className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                deskFocus === "pathfinder" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="desk-focus-pathfinder"
            >
              <Telescope className="w-3 h-3 shrink-0" />
              Pathfinder
            </button>
            <button
              type="button"
              onClick={() => setDeskAndUrl("coInvestor")}
              className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                deskFocus === "coInvestor" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="desk-focus-coinvestor"
            >
              <Bot className="w-3 h-3 shrink-0" />
              AI Co-Investor
            </button>
            <motion.div
              layoutId="pathfinder-desk-pill"
              className="pointer-events-none absolute inset-y-1 bg-gold-metal shadow-[0_0_15px_rgba(212,175,55,0.6)]"
              style={{
                width: "calc(50% - 4px)",
                left: deskFocus === "pathfinder" ? "4px" : "calc(50% + 0px)",
              }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-2 max-w-xl leading-relaxed">
            Terminal: run <code className="rounded-none bg-muted px-1.5 py-0.5 text-primary">pnpm desk</code> and pick Pathfinder vs AI Co-Investor to open the matching URL.
          </p>
        </motion.div>

        {deskFocus === "pathfinder" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 items-start">
          <div className="space-y-6 order-2 xl:order-1">
            <Tabs defaultValue="outlook" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none border border-border bg-card/50 p-1 h-auto">
                <TabsTrigger
                  value="outlook"
                  className="rounded-none text-[10px] font-mono uppercase tracking-widest data-[state=active]:bg-primary/15 data-[state=active]:border-gold-hairline border border-transparent"
                >
                  Investing outlook
                </TabsTrigger>
                <TabsTrigger
                  value="scenario"
                  className="rounded-none text-[10px] font-mono uppercase tracking-widest data-[state=active]:bg-primary/15 data-[state=active]:border-gold-hairline border border-transparent"
                >
                  Scenario lab
                </TabsTrigger>
              </TabsList>

              <TabsContent value="outlook" className="mt-5 space-y-4">
                <section className="glass-panel border border-border p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">What people often start with</h2>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <li className="flex gap-3">
                      <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        <span className="text-foreground font-medium">Broad index funds & ETFs</span> — spread across many companies so one stock
                        does not decide your outcome. Common starting point for beginners who want simplicity.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Scale className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        <span className="text-foreground font-medium">Mix stocks & bonds</span> — balances growth potential with steadier assets.
                        Risk profile ({user?.riskProfile ?? "your profile"}) helps tilt this mix.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <PiggyBank className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        <span className="text-foreground font-medium">Recurring contributions</span> — investing a set amount on a schedule (often
                        monthly) instead of timing the market.
                      </span>
                    </li>
                  </ul>
                </section>

                <section className="glass-panel border border-border p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">How to think about “what to buy”</h2>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground leading-relaxed marker:text-primary">
                    <li>Clarify goal & time horizon (e.g. retirement in 20 years vs house in 5).</li>
                    <li>Choose a risk level you can sleep through — volatility is normal.</li>
                    <li>Prefer diversification until you have a clear thesis on individual names.</li>
                    <li>Keep costs and taxes in mind; small fees compound over decades.</li>
                  </ol>
                </section>

                <section className="glass-panel border border-border p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">Two ways to use AI here</h2>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Use <span className="text-foreground font-medium">Coach</span> (default in the chat) for step-by-step guidance in plain English.
                    Switch to <span className="text-foreground font-medium">Co-Investor</span> or other personas anytime for a different tone — same desk,
                    your choice.
                  </p>
                </section>
              </TabsContent>

              <TabsContent value="scenario" className="mt-5 space-y-6">
                <section className="glass-panel border border-border p-5 space-y-6">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-1">Illustrative growth scenario</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Slide the assumptions — the chart is compound-interest math, not a prediction of what will happen.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      <span>Monthly contribution</span>
                      <span className="text-foreground">${monthly}/mo</span>
                    </div>
                    <Slider
                      min={25}
                      max={2000}
                      step={25}
                      value={[monthly]}
                      onValueChange={(v) => setMonthly(v[0] ?? 250)}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      <span>Years invested</span>
                      <span className="text-foreground">{years} yrs</span>
                    </div>
                    <Slider
                      min={1}
                      max={40}
                      step={1}
                      value={[years]}
                      onValueChange={(v) => setYears(v[0] ?? 15)}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      <span>Assumed annual return (illustrative)</span>
                      <span className="text-foreground">{annualReturn[0]}%</span>
                    </div>
                    <Slider
                      min={3}
                      max={10}
                      step={0.5}
                      value={annualReturn}
                      onValueChange={setAnnualReturn}
                    />
                  </div>

                  <div className="border border-gold-hairline bg-primary/5 p-4 space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Hypothetical ending balance
                    </div>
                    <div className="text-2xl font-mono font-bold tracking-tight">
                      ${Math.round(projected).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Not adjusted for inflation or taxes. Actual results will differ.
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-none border-gold-hairline font-mono text-[11px] uppercase tracking-widest"
                      onClick={() => void runScenarioInsight()}
                      disabled={scenarioLoading}
                      data-testid="button-scenario-ai-insight"
                    >
                      {scenarioLoading ? "Generating simulation insight…" : "Generate AI simulation insight"}
                    </Button>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Uses your OpenAI API key on the server to turn these slider numbers into a short, plain-English walkthrough.
                      Still educational only — not a prediction or advice.
                    </p>
                    {scenarioError ? (
                      <p className="text-xs text-destructive font-mono">{scenarioError}</p>
                    ) : null}
                    {scenarioInsight ? (
                      <div className="border border-border bg-card/80 p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {scenarioInsight}
                      </div>
                    ) : null}
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          </div>

          <div className="order-1 xl:order-2 xl:sticky xl:top-20 h-[560px] lg:h-[640px] border border-border bg-card overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.08)]">
            <AiChat
              key="pathfinder-split-chat"
              userId={userId}
              novice
              displayName={aiDisplayName}
              defaultAgentMode="coach"
              starterChips={starterChips}
            />
          </div>
        </div>
        ) : (
        <div className="h-[min(780px,calc(100vh-12rem))] border border-border bg-card overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.08)]">
          <AiChat
            key="pathfinder-coinvestor-full"
            userId={userId}
            novice
            displayName={aiDisplayName}
            defaultAgentMode="normal"
            starterChips={coInvestorChips}
          />
        </div>
        )}
      </main>
    </div>
  );
}
