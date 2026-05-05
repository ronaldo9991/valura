import { motion } from "framer-motion";
import { Activity, Hourglass, Telescope } from "lucide-react";
import { useLocation } from "wouter";

type DeskMode = "normal" | "pathfinder" | "chronos";

export function ModeSwitcher() {
  const [location, setLocation] = useLocation();
  const path = location.split("?")[0];

  const deskMode: DeskMode = path.startsWith("/chronos")
    ? "chronos"
    : path.startsWith("/pathfinder")
      ? "pathfinder"
      : "normal";

  const idx = deskMode === "normal" ? 0 : deskMode === "pathfinder" ? 1 : 2;

  const go = (pathTo: string) => {
    if (location !== pathTo) setLocation(pathTo);
  };

  return (
    <div
      className="relative flex items-center bg-background/60 border border-gold-hairline rounded-none p-1 backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.15)]"
      data-testid="mode-switcher"
    >
      <button
        type="button"
        onClick={() => go("/dashboard")}
        className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
          deskMode === "normal" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="mode-normal"
      >
        <Activity className="w-3 h-3 shrink-0" />
        Normal
      </button>
      <button
        type="button"
        onClick={() => go("/pathfinder")}
        className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
          deskMode === "pathfinder" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="mode-pathfinder"
      >
        <Telescope className="w-3 h-3 shrink-0" />
        Pathfinder
      </button>
      <button
        type="button"
        onClick={() => go("/chronos")}
        className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
          deskMode === "chronos" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="mode-chronos"
      >
        <Hourglass className="w-3 h-3 shrink-0" />
        Chronos
      </button>
      <motion.div
        layoutId="mode-pill"
        className="pointer-events-none absolute inset-y-1 bg-gold-metal shadow-[0_0_15px_rgba(212,175,55,0.6)]"
        style={{
          width: "calc((100% - 8px) / 3)",
          left:
            idx === 0
              ? "4px"
              : idx === 1
                ? "calc(4px + (100% - 8px) / 3)"
                : "calc(4px + 2 * (100% - 8px) / 3)",
        }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      />
    </div>
  );
}
