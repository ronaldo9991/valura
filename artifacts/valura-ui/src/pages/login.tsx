import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, GraduationCap, BadgeCheck } from "lucide-react";
import { useListUsers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { setStoredUserId, getStoredUserId } from "@/lib/auth";

const PROFILE_BLURBS: Record<string, { tone: string; icon: typeof Sparkles; tag: string }> = {
  conservative: { tone: "Steady, low-volatility approach. Great for first-time investors.", icon: ShieldCheck, tag: "Beginner-Friendly" },
  moderate: { tone: "Balanced growth and protection. The sweet spot for most novices.", icon: GraduationCap, tag: "Recommended" },
  aggressive: { tone: "Higher risk, higher potential reward. For experienced investors.", icon: Sparkles, tag: "Advanced" },
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useListUsers();

  useEffect(() => {
    if (getStoredUserId()) setLocation("/dashboard");
  }, [setLocation]);

  const handlePick = (userId: string) => {
    setStoredUserId(userId);
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

      <main className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="rounded-none border-gold-hairline text-primary font-mono text-[10px] uppercase tracking-widest mb-6 px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" /> Sign in to your desk
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Welcome to <span className="bg-clip-text text-transparent bg-gold-metal">your AI co-investor</span>.
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Choose a client profile below to enter the dashboard. Each profile comes with real holdings, real-time prices, and an AI desk that explains everything in plain English.
          </p>
        </motion.div>

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
          ) : (
            data?.users.map((u, i) => {
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
                  onClick={() => handlePick(u.id)}
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
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Portfolio</div>
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
          )}
        </div>

        <div className="mt-12 text-center text-xs text-muted-foreground font-mono">
          Demo profiles are pre-loaded with real holdings. Real-time prices via Yahoo Finance · AI insights via GPT-4o.
        </div>
      </main>
    </div>
  );
}
