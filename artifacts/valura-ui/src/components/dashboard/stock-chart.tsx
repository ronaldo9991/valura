import { useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";
import { useGetMarketHistory, getGetMarketHistoryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

const RANGES: { key: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "5y"; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "5d", label: "5D" },
  { key: "1mo", label: "1M" },
  { key: "3mo", label: "3M" },
  { key: "6mo", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
];

export function StockChart({ symbol, height = 280 }: { symbol: string; height?: number }) {
  const [range, setRange] = useState<typeof RANGES[number]["key"]>("1mo");
  const { data, isLoading } = useGetMarketHistory(
    symbol,
    { range },
    { query: { enabled: !!symbol, queryKey: getGetMarketHistoryQueryKey(symbol, { range }) } }
  );

  const chartData = useMemo(() => {
    if (!data?.points) return [];
    return data.points.map((p) => ({
      time: new Date(p.date).getTime(),
      label: new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      price: p.close,
    }));
  }, [data]);

  const isUp = (data?.changePct ?? 0) >= 0;
  const lineColor = isUp ? "#10b981" : "#ef4444";
  const fillId = `fill-${symbol}-${isUp ? "up" : "down"}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : data ? (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold font-mono">${data.endPrice.toFixed(2)}</span>
              <span className={`flex items-center gap-1 font-mono text-sm ${isUp ? "text-emerald-500" : "text-destructive"}`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isUp ? "+" : ""}{data.changePct.toFixed(2)}% <span className="text-muted-foreground/60 ml-1">{range}</span>
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No data</span>
          )}
        </div>

        <div className="flex border border-border rounded-none overflow-hidden">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                range === r.key
                  ? "bg-primary/10 text-primary border-r border-border last:border-r-0"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border-r border-border last:border-r-0"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height }} className="w-full">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-mono">No price history available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fontFamily: "monospace", fill: "rgba(255,255,255,0.4)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 10, fontFamily: "monospace", fill: "rgba(255,255,255,0.4)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: 0,
                  fontFamily: "monospace",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              />
              {data && (
                <ReferenceLine y={data.startPrice} stroke="rgba(212,175,55,0.3)" strokeDasharray="3 3" />
              )}
              <Area
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#${fillId})`}
                dot={false}
                activeDot={{ r: 4, fill: lineColor, stroke: "var(--background)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
