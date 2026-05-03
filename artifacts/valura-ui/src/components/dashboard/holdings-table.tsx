import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Bot, ArrowRight } from "lucide-react";
import { useGetBatchQuotes, useAiChat } from "@workspace/api-client-react";
import type { Portfolio, Holding } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

export function HoldingsTable({ portfolio, isLoading, userId, onPickSymbol }: { portfolio?: Portfolio, isLoading: boolean, userId: string, onPickSymbol?: (s: string) => void }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [explanations, setExpl] = useState<Record<string, string>>({});
  const [isExplaining, setIsExplaining] = useState<string | null>(null);
  
  const batchQuotes = useGetBatchQuotes();
  const aiChat = useAiChat();

  useEffect(() => {
    if (portfolio?.holdings?.length) {
      batchQuotes.mutate({
        data: { symbols: portfolio.holdings.map(h => h.ticker) }
      });
    }
  }, [portfolio]); // We purposefully omit batchQuotes to avoid loops

  const quotesMap = batchQuotes.data?.quotes.reduce((acc, q) => {
    acc[q.symbol] = q;
    return acc;
  }, {} as Record<string, any>);

  const handleExplain = async (ticker: string) => {
    setIsExplaining(ticker);
    try {
      const res = await aiChat.mutateAsync({
        data: {
          userId,
          message: `In 2 short sentences, explain why ${ticker} is in my portfolio and its current outlook.`,
          portfolioContext: true
        }
      });
      setExpl(prev => ({ ...prev, [ticker]: res }));
    } catch (e) {
      setExpl(prev => ({ ...prev, [ticker]: "Unable to generate explanation at this time." }));
    } finally {
      setIsExplaining(null);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-panel border-border">
        <div className="p-6"><Skeleton className="h-64 w-full" /></div>
      </div>
    );
  }

  return (
    <div className="glass-panel border border-border rounded-none overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30 hover:bg-muted/30">
          <TableRow className="border-border">
            <TableHead className="w-10"></TableHead>
            <TableHead className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Asset</TableHead>
            <TableHead className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Sector</TableHead>
            <TableHead className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-right">Weight</TableHead>
            <TableHead className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-right">Price</TableHead>
            <TableHead className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-right">Daily Change</TableHead>
            <TableHead className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-right">Total Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {portfolio?.holdings?.map((holding) => {
            const quote = quotesMap?.[holding.ticker];
            const isExpanded = expandedRow === holding.ticker;
            
            return (
              <React.Fragment key={holding.ticker}>
                <TableRow 
                  className={`border-border hover:bg-muted/10 cursor-pointer transition-colors ${isExpanded ? 'bg-primary/5 border-primary/20' : ''}`}
                  onClick={() => setExpandedRow(isExpanded ? null : holding.ticker)}
                >
                  <TableCell>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-background border border-gold-hairline text-xs font-bold font-mono">
                        {holding.ticker.substring(0,3)}
                      </div>
                      <div>
                        <button
                          className="font-bold text-foreground hover:text-primary transition-colors"
                          onClick={(e) => { e.stopPropagation(); onPickSymbol?.(holding.ticker); }}
                          data-testid={`holding-symbol-${holding.ticker}`}
                        >
                          {holding.ticker}
                        </button>
                        <div className="text-[10px] text-muted-foreground uppercase truncate max-w-[120px]">{holding.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-none border-border font-mono text-[10px] text-muted-foreground">
                      {holding.sector}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono text-sm">{holding.weight.toFixed(1)}%</span>
                      <div className="w-16 h-1 bg-secondary/20 overflow-hidden">
                        <div className="h-full bg-gold-metal" style={{ width: `${holding.weight}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ${holding.currentPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`font-mono text-sm ${quote?.changePct >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                      {quote?.changePct >= 0 ? '+' : ''}{quote?.changePct?.toFixed(2) || '0.00'}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-foreground">
                    ${holding.currentValue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </TableCell>
                </TableRow>
                
                {/* Expanded Details Row */}
                <AnimatePresence>
                  {isExpanded && (
                    <TableRow className="border-border bg-black/40 hover:bg-black/40">
                      <TableCell colSpan={7} className="p-0">
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                              <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Position Metrics</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-[10px] text-muted-foreground uppercase">Shares</div>
                                  <div className="font-mono">{holding.shares}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-muted-foreground uppercase">Cost Basis</div>
                                  <div className="font-mono">${holding.avgCostBasis.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-muted-foreground uppercase">Unrealized P&L</div>
                                  <div className={`font-mono ${holding.gainLoss >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                                    {holding.gainLoss >= 0 ? '+' : ''}${Math.abs(holding.gainLoss).toLocaleString()} ({holding.gainLossPct.toFixed(2)}%)
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-muted-foreground uppercase">52W Range</div>
                                  <div className="font-mono text-xs flex items-center gap-1">
                                    <span className="text-muted-foreground">${quote?.low52w?.toFixed(0) || '-'}</span>
                                    <div className="flex-1 h-1 bg-secondary/20 relative mx-1 rounded-full">
                                      {quote?.low52w && quote?.high52w && (
                                        <div className="absolute w-2 h-2 bg-primary rounded-full top-1/2 -translate-y-1/2" 
                                             style={{ left: `${((holding.currentPrice - quote.low52w) / (quote.high52w - quote.low52w)) * 100}%` }} />
                                      )}
                                    </div>
                                    <span className="text-muted-foreground">${quote?.high52w?.toFixed(0) || '-'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="md:col-span-2 border-l border-border pl-8 flex flex-col justify-center">
                              {explanations[holding.ticker] ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-primary">
                                    <Bot className="w-4 h-4" />
                                    <span className="text-xs font-mono uppercase tracking-widest font-bold">Valura Intelligence</span>
                                  </div>
                                  <p className="text-sm text-foreground/90 leading-relaxed italic border-l-2 border-primary pl-4">
                                    "{explanations[holding.ticker]}"
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-start gap-3">
                                  <p className="text-sm text-muted-foreground">Request AI synthesis for this position's outlook and concentration impact.</p>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-none border-gold-hairline text-gold hover:bg-primary/10 transition-colors h-8 text-xs font-mono"
                                    onClick={(e) => { e.stopPropagation(); handleExplain(holding.ticker); }}
                                    disabled={isExplaining === holding.ticker}
                                  >
                                    {isExplaining === holding.ticker ? (
                                      <><span className="animate-spin mr-2">◷</span> Synthesizing...</>
                                    ) : (
                                      <><Bot className="w-3 h-3 mr-2" /> Explain Position <ArrowRight className="w-3 h-3 ml-2" /></>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
