import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowUpRight, TrendingUp, Shield, Activity, BarChart3, Globe, Lock, Cpu, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useGetMarketMovers } from "@workspace/api-client-react";

export default function Home() {
  const { data: movers } = useGetMarketMovers();

  const allMovers = [...(movers?.gainers || []), ...(movers?.losers || [])];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-border">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-sm bg-gold-metal flex items-center justify-center text-primary-foreground font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">
              V
            </div>
            <span className="font-bold text-xl tracking-widest uppercase">AENS <span className="text-primary mx-1">X</span> Valura</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <a href="#platform" className="hover:text-foreground transition-colors">Platform</a>
            <a href="#intelligence" className="hover:text-foreground transition-colors">Intelligence</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-widest rounded-none h-10 px-6 group relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Terminal <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Ticker Tape */}
        {allMovers.length > 0 && (
          <div className="w-full h-8 bg-black/5 dark:bg-white/5 border-b border-border overflow-hidden flex items-center">
            <motion.div 
              animate={{ x: [0, -1000] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
              className="flex whitespace-nowrap"
            >
              {[...allMovers, ...allMovers, ...allMovers].map((mover, i) => (
                <div key={i} className="flex items-center gap-3 px-6 border-r border-border/50 text-xs font-mono">
                  <span className="font-bold">{mover.symbol}</span>
                  <span>${mover.price.toFixed(2)}</span>
                  <span className={mover.changePct >= 0 ? "text-emerald-500" : "text-destructive"}>
                    {mover.changePct >= 0 ? '+' : ''}{mover.changePct.toFixed(2)}%
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 flex items-center justify-center min-h-[95vh] border-b border-border">
        {/* Background Animation - Drifting Grid Lines */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)', backgroundSize: '4rem 4rem' }}>
          <motion.div 
            animate={{ 
              backgroundPosition: ['0px 0px', '64px 64px'],
            }}
            transition={{ repeat: Infinity, ease: "linear", duration: 8 }}
            className="w-full h-full absolute inset-0"
            style={{ backgroundImage: 'inherit', backgroundSize: 'inherit' }}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-background pointer-events-none" />

        <div className="container relative z-10 px-6 mx-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-gold-hairline bg-background text-primary text-xs font-mono uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Private Wealth Desk
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-serif font-bold tracking-tight mb-8 leading-[1.1] max-w-5xl mx-auto flex flex-wrap justify-center gap-x-4 gap-y-2">
            {["Master", "Your", "Wealth.", "Command", "Your", "Future."].map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={word === "Future." ? "text-gold" : "text-foreground"}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-mono leading-relaxed"
          >
            Institutional-grade quantitative intelligence meets a black-tie AI co-investor. Exclusive insights for the ambitious.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase tracking-widest rounded-none shadow-[0_0_30px_rgba(212,175,55,0.2)] group relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Access Terminal <ArrowUpRight className="ml-3 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-sm font-mono uppercase tracking-widest rounded-none border-border hover:bg-white/5 hover:text-foreground text-muted-foreground">
              Read Manifesto
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Intelligence Section */}
      <section className="py-32 relative border-b border-border bg-card/50" id="intelligence">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Neural Allocation</h2>
              <p className="text-lg text-muted-foreground mb-8 font-mono leading-relaxed">
                Valura processes millions of macro-economic signals to construct asymmetric risk profiles. The digital equivalent of a dedicated Swiss quant desk.
              </p>
              <ul className="space-y-4 font-mono text-sm">
                {[
                  "Dynamic risk-adjusted rebalancing",
                  "Automated direct indexing",
                  "Macro-sentiment parsing",
                  "Tax-loss harvesting algorithms"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-foreground/80 border-b border-border/50 pb-3">
                    <span className="text-primary">0{i+1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-square max-w-md mx-auto w-full"
            >
              <div className="absolute inset-0 rounded-full border border-gold-hairline animate-[spin_60s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border border-border border-dashed animate-[spin_40s_linear_infinite_reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-background border border-gold-hairline shadow-[0_0_50px_rgba(212,175,55,0.2)] flex items-center justify-center rotate-45 group">
                  <div className="rotate-[-45deg] text-center">
                    <Cpu className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-[10px] font-mono uppercase text-muted-foreground">Core Engine</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative border-b border-border" id="platform">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Institutional Grade. Retail Access.</h2>
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Architected for precision.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              delay={0}
              icon={<TrendingUp className="w-6 h-6 text-primary" />}
              title="Real-Time Alpha"
              description="Live portfolio optimization to capture outsized returns during volatile market sessions."
            />
            <FeatureCard 
              delay={0.2}
              icon={<BarChart3 className="w-6 h-6 text-primary" />}
              title="Advanced Analytics"
              description="Deep concentration risk checks, volatility index metrics, and benchmark comparisons."
            />
            <FeatureCard 
              delay={0.4}
              icon={<Shield className="w-6 h-6 text-primary" />}
              title="Ironclad Security"
              description="SIPC insured custody integration with bank-level encryption. We never touch your funds."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-serif font-bold mb-8">Take Command.</h2>
            <Link href="/dashboard">
              <Button size="lg" className="h-16 px-10 text-base bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase tracking-widest rounded-none shadow-[0_0_40px_rgba(212,175,55,0.3)]">
                Enter The Terminal
                <ArrowUpRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs font-mono uppercase tracking-widest text-muted-foreground gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-gold-metal flex items-center justify-center text-background font-bold text-[8px]">
              V
            </div>
            <span>AENS X VALURA</span>
          </div>
          <div>© {new Date().getFullYear()} Precision Wealth.</div>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="p-8 border border-border bg-card hover:border-gold-hairline transition-colors group"
    >
      <div className="w-12 h-12 border border-border bg-background flex items-center justify-center mb-6 group-hover:bg-primary/5 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground font-mono text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
