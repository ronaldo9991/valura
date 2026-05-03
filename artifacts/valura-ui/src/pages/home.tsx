import { motion } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight, TrendingUp, Shield, Activity, ArrowUpRight, BarChart3, Globe, Lock, Cpu, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Activity className="text-primary-foreground w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">AENS <span className="text-primary">X</span> VALURA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#platform" className="hover:text-white transition-colors">Platform</a>
            <a href="#intelligence" className="hover:text-white transition-colors">Intelligence</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>
          <Link href="/dashboard">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full px-6">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 flex items-center justify-center min-h-[90vh]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="container relative z-10 px-6 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Next Generation Wealth Intelligence
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-tight">
              Master Your Wealth. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
                Command Your Future.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Institutional-grade financial intelligence meets human-centric design. Experience the ultimate AI co-investor.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold">
                  Launch Platform
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full font-semibold border-white/10 hover:bg-white/5">
                View Performance
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Intelligence Section */}
      <section className="py-32 relative border-t border-white/5 bg-white/[0.01]" id="intelligence">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-bold mb-6">The Intelligence Layer</h2>
            <p className="text-xl text-white/60">AENS X VALURA acts as your personal hedge fund manager, processing millions of data points per second to identify asymmetric opportunities.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="glass-panel p-10 rounded-3xl border border-white/5">
              <Cpu className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Neural Allocation</h3>
              <p className="text-white/60 leading-relaxed">Dynamic portfolio rebalancing driven by multi-layered neural networks. We optimize your asset allocation across market cycles automatically.</p>
            </div>
            <div className="glass-panel p-10 rounded-3xl border border-white/5">
              <Globe className="w-12 h-12 text-secondary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Global Macro Signals</h3>
              <p className="text-white/60 leading-relaxed">Real-time analysis of global economic indicators, geopolitical events, and sentiment shifts translated into actionable trading strategies.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative border-t border-white/5" id="platform">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<TrendingUp className="w-8 h-8 text-primary" />}
              title="Predictive Analytics"
              description="Anticipate market movements with our proprietary institutional-grade machine learning models."
            />
            <FeatureCard 
              icon={<Activity className="w-8 h-8 text-secondary" />}
              title="Real-Time Alpha"
              description="Live portfolio optimization and dynamic rebalancing to capture outsized returns."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-emerald-400" />}
              title="Ironclad Security"
              description="Bank-level encryption and continuous risk monitoring protect your assets 24/7."
            />
          </div>
        </div>
      </section>

      {/* Proof of Work Section */}
      <section className="py-32 relative border-t border-white/5 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-4xl font-bold mb-6">Institutional Grade. Retail Access.</h2>
              <p className="text-xl text-white/60 mb-8 leading-relaxed">Previously available only to ultra-high-net-worth individuals and family offices. We democratize access to elite quantitative strategies.</p>
              <ul className="space-y-4">
                {[
                  "Algorithmic tax-loss harvesting",
                  "Automated direct indexing",
                  "Smart beta execution",
                  "Alternative asset exposure"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1">
              <div className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <BarChart3 className="w-32 h-32 text-primary" />
                </div>
                <div className="relative z-10">
                  <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Backtested Performance</div>
                  <div className="text-5xl font-bold mb-4 text-white">24.8%</div>
                  <div className="text-white/50 text-sm">Annualized Alpha vs S&P 500</div>
                  <div className="mt-8 space-y-4">
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[85%]" />
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary w-[65%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-32 relative border-t border-white/5" id="security">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <Lock className="w-16 h-16 text-emerald-400 mx-auto mb-8" />
          <h2 className="text-4xl font-bold mb-6">Fort Knox for Your Wealth</h2>
          <p className="text-xl text-white/60 mb-12">Your assets are custodied with apex-tier partners. We never take custody of your funds. We only provide the intelligence to grow them.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-6 py-3 rounded-full border border-white/10 bg-white/5 font-medium">SOC 2 Type II Certified</div>
            <div className="px-6 py-3 rounded-full border border-white/10 bg-white/5 font-medium">SIPC Insured</div>
            <div className="px-6 py-3 rounded-full border border-white/10 bg-white/5 font-medium">End-to-End Encryption</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative border-t border-white/5 bg-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-8">Ready to Command Your Future?</h2>
          <Link href="/dashboard">
            <Button size="lg" className="h-16 px-10 text-xl bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold">
              Enter Platform
              <ArrowUpRight className="ml-2 w-6 h-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/40">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-white/40">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Activity className="text-primary w-3 h-3" />
            </div>
            <span className="font-semibold text-white/80">AENS X VALURA</span>
          </div>
          <div>© {new Date().getFullYear()} AENS X VALURA. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-panel p-8 rounded-3xl"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-white/60 leading-relaxed">{description}</p>
    </motion.div>
  );
}
