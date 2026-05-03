import { motion } from "framer-motion";
import { Activity, Hourglass } from "lucide-react";
import { useLocation } from "wouter";

export function ModeSwitcher() {
  const [location, setLocation] = useLocation();
  const isChronos = location.startsWith("/chronos");

  const go = (path: string) => {
    if (location !== path) setLocation(path);
  };

  return (
    <div
      className="relative flex items-center bg-background/60 border border-gold-hairline rounded-none p-1 backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.15)]"
      data-testid="mode-switcher"
    >
      <button
        onClick={() => go("/dashboard")}
        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
          !isChronos ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="mode-normal"
      >
        <Activity className="w-3 h-3" />
        Normal
      </button>
      <button
        onClick={() => go("/chronos")}
        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
          isChronos ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="mode-chronos"
      >
        <Hourglass className="w-3 h-3" />
        Chronos
      </button>
      <motion.div
        layoutId="mode-pill"
        className="absolute inset-y-1 bg-gold-metal shadow-[0_0_15px_rgba(212,175,55,0.6)]"
        style={{
          width: "calc(50% - 4px)",
          left: isChronos ? "calc(50% + 0px)" : "4px",
        }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      />
    </div>
  );
}
