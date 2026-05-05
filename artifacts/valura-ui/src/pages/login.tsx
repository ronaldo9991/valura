import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, GraduationCap, BadgeCheck, PenLine } from "lucide-react";
import { useListUsers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/mode-toggle";
import {
  setStoredUserId,
  getStoredUserId,
  setStoredDisplayName,
  getStoredDisplayName,
  SCRATCH_USER_ID,
} from "@/lib/auth";
import { useLocalSignInName } from "@/hooks/use-local-sign-in-name";

const PROFILE_BLURBS: Record<string, { tone: string; icon: typeof Sparkles; tag: string }> = {
  conservative: { tone: "Steady, low-volatility approach. Great for first-time investors.", icon: ShieldCheck, tag: "Beginner-Friendly" },
  moderate: { tone: "Balanced growth and protection. The sweet spot for most novices.", icon: GraduationCap, tag: "Recommended" },
  aggressive: { tone: "Higher risk, higher potential reward. For experienced investors.", icon: Sparkles, tag: "Advanced" },
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useListUsers();
  const { data: localId } = useLocalSignInName();

  const [yourName, setYourName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (getStoredUserId()) setLocation("/dashboard");
  }, [setLocation]);

  useEffect(() => {
    const saved = getStoredDisplayName();
    if (saved) setYourName(saved);
  }, []);

  const requireName = (): boolean => {
    if (!yourName.trim()) {
      setNameError("Enter your name so Valura can address you correctly.");
      return false;
    }
    setNameError(null);
    return true;
  };

  const persistName = () => {
    setStoredDisplayName(yourName.trim());
  };

  const startScratchPortfolio = () => {
    if (!requireName()) return;
    persistName();
    setStoredUserId(SCRATCH_USER_ID);
    setLocation("/build");
  };

  const handlePickDemo = (demoUserId: string) => {
    if (!requireName()) return;
    persistName();
    setStoredUserId(demoUserId);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 h-20 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-gold-metal flex items-center justify-center text-primary-foreground font-bold shadow-[0_0_20px_rgba(212,175,55,0.35)]">V</div>
          <div>
            <div className="font-bold tracking-widest text-sm">AENS <span className="text-primary">X</span> VALURA</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Private Wealth Desk</div>
          </div>
        </div>
        <ModeToggle />
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="rounded-none border-gold-hairline text-primary font-mono text-[10px] uppercase tracking-widest mb-6 px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" /> Sign in to your desk
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Welcome to <span className="bg-clip-text text-transparent bg-gold-metal">Valura</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Enter <span className="text-foreground font-medium">your name</span> first — the AI desk will speak to{" "}
            <span className="text-foreground font-medium">you</span>, not as you. Then start from scratch or pick a sample portfolio for practice.
          </p>
        </motion.div>

        <div className="max-w-lg mx-auto mb-12 space-y-3 text-left">
          <Label htmlFor="your-name" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Your name
          </Label>
          <Input
            id="your-name"
            value={yourName}
            onChange={(e) => {
              setYourName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="e.g. Alex Rivera"
            className="rounded-none bg-card border-border h-11"
            autoComplete="name"
            data-testid="input-your-name"
          />
          {nameError ? <p className="text-xs text-destructive font-mono">{nameError}</p> : null}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            This is how Valura greets you and how the assistant routes context — separate from any sample profile you might pick below.
          </p>
          {localId?.signInName ? (
            <p className="text-[10px] font-mono border border-border/80 bg-card/50 px-3 py-2 text-muted-foreground">
              Dev workstation user detected: <span className="text-foreground">{localId.signInName}</span> — you can still type the name you want Valura to use.
            </p>
          ) : null}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="max-w-2xl mx-auto mb-14 glass-panel border border-gold-hairline p-6 lg:p-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 shrink-0 border border-gold-hairline bg-primary/10 flex items-center justify-center">
              <PenLine className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-4 flex-1 min-w-0">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-1">Build my own portfolio</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sign in <span className="text-foreground">without</span> a sample co-investor persona. You get an empty book and $0 cash to start — add holdings when you are ready. The AI desk still helps with education and planning.
                </p>
              </div>
              <Button
                type="button"
                className="rounded-none font-mono text-[11px] uppercase tracking-widest"
                onClick={startScratchPortfolio}
                data-testid="button-start-scratch"
              >
                Continue with empty portfolio
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="text-center mb-8">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Or practice with a sample book</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-panel border border-border p-6 space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))
          ) : !data?.users?.length ? (
            <div className="col-span-full glass-panel border border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">No sample portfolios loaded</p>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed max-w-xl mx-auto">
                The API returned zero demo users — usually the database has not run migration{" "}
                <code className="text-primary">0003_demo_users_seed</code> yet. On Railway, redeploy after migrations apply, or run{" "}
                <code className="text-primary">pnpm --filter @workspace/db run migrate</code> against your{" "}
                <code className="text-primary">DATABASE_URL</code>.
              </p>
            </div>
          ) : (
            data.users.map((u, i) => {
              const cfg = PROFILE_BLURBS[u.riskProfile] ?? PROFILE_BLURBS.moderate;
              const Icon = cfg.icon;
              const isNovice = u.riskProfile === "conservative" || u.riskProfile === "moderate";
              return (
                <motion.button
                  key={u.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  whileHover={{ y: -4 }}
                  type="button"
                  onClick={() => handlePickDemo(u.id)}
                  className="group glass-panel border border-border hover:border-gold-hairline p-6 text-left transition-all relative overflow-hidden"
                  data-testid={`profile-${u.id}`}
                >
                  <div className="absolute inset-0 bg-gold-metal opacity-0 group-hover:opacity-[0.04] transition-opacity" />

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-sm border border-gold-hairline bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    {isNovice && (
                      <Badge variant="outline" className="rounded-none border-emerald-500/40 text-emerald-500 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5">
                        {cfg.tag}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg tracking-tight">{u.name}</h3>
                      {u.kycStatus === "approved" && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">{u.email}</div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 min-h-[40px] relative z-10">
                    {cfg.tone}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50 relative z-10">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Sample portfolio</div>
                      <div className="font-mono text-sm font-bold">${u.totalPortfolioValue.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  <Badge variant="outline" className="absolute top-4 right-4 rounded-none border-border/50 font-mono text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    {u.riskProfile}
                  </Badge>
                </motion.button>
              );
            })
          )
        }
        </div>

        <div className="mt-12 text-center text-xs text-muted-foreground font-mono max-w-2xl mx-auto leading-relaxed">
          Sample profiles use pre-loaded holdings for practice. Your name always identifies <span className="text-foreground">you</span> to the assistant — it is not the sample persona name.
          Real-time prices via Yahoo Finance · AI desk uses OpenAI when configured.
        </div>
      </main>
    </div>
  );
}
