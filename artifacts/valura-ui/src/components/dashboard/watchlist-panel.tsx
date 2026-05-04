import { useState } from "react";
import { Plus, Trash2, X, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWatchlists,
  useCreateWatchlist,
  useDeleteWatchlist,
  useAddWatchlistItem,
  useRemoveWatchlistItem,
} from "@/lib/extras-api";

interface Props {
  userId: string;
  onPickTicker?: (ticker: string) => void;
}

export function WatchlistPanel({ userId, onPickTicker }: Props) {
  const { data, isLoading, isError } = useWatchlists(userId);
  const createWatchlist = useCreateWatchlist(userId);
  const deleteWatchlist = useDeleteWatchlist(userId);
  const addItem = useAddWatchlistItem(userId);
  const removeItem = useRemoveWatchlistItem(userId);

  const [tickerInput, setTickerInput] = useState<Record<string, string>>({});
  const [creatingName, setCreatingName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const lists = data?.watchlists ?? [];
  const showEmpty = !isLoading && !isError && lists.length === 0;

  return (
    <section
      id="watchlists"
      className="border border-gold-hairline bg-card p-6"
      data-testid="watchlist-panel"
    >
      <header className="flex items-center justify-between border-b border-gold-hairline pb-3 mb-4">
        <div className="flex items-center gap-3">
          <Eye className="w-4 h-4 text-primary" />
          <h2 className="font-mono text-sm tracking-wider uppercase text-foreground">
            Watchlists
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNewForm((v) => !v)}
          className="font-mono text-xs"
          data-testid="watchlist-toggle-new-form"
        >
          <Plus className="w-3 h-3 mr-1" /> New list
        </Button>
      </header>

      {showNewForm && (
        <form
          className="flex gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!creatingName.trim()) return;
            createWatchlist.mutate(creatingName.trim(), {
              onSuccess: () => {
                setCreatingName("");
                setShowNewForm(false);
              },
            });
          }}
        >
          <input
            value={creatingName}
            onChange={(e) => setCreatingName(e.target.value)}
            placeholder="Watchlist name"
            className="flex-1 h-9 px-3 bg-background/50 border border-border rounded-none font-mono text-sm focus:outline-none focus:border-gold-hairline"
            data-testid="watchlist-name-input"
          />
          <Button
            type="submit"
            size="sm"
            disabled={createWatchlist.isPending}
            data-testid="watchlist-create-submit"
          >
            Create
          </Button>
        </form>
      )}

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {isError && (
        <div className="font-mono text-xs text-destructive">
          Failed to load watchlists.
        </div>
      )}

      {showEmpty && (
        <div className="text-center py-8 font-mono text-xs text-muted-foreground">
          No watchlists yet. Click "New list" to create one and track tickers.
        </div>
      )}

      <div className="space-y-5">
        {lists.map((list) => {
          const draft = tickerInput[list.id] ?? "";
          return (
            <div key={list.id} className="border border-border bg-background/40">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <h3 className="font-mono text-xs tracking-widest uppercase text-foreground">
                  {list.name}
                </h3>
                <button
                  onClick={() => deleteWatchlist.mutate(list.id)}
                  disabled={deleteWatchlist.isPending}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Delete ${list.name}`}
                  data-testid={`watchlist-delete-${list.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <form
                className="flex gap-2 px-4 py-2 border-b border-border bg-background/20"
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = draft.trim();
                  if (!t) return;
                  addItem.mutate(
                    { watchlistId: list.id, ticker: t },
                    {
                      onSuccess: () =>
                        setTickerInput((s) => ({ ...s, [list.id]: "" })),
                    },
                  );
                }}
              >
                <input
                  value={draft}
                  onChange={(e) =>
                    setTickerInput((s) => ({ ...s, [list.id]: e.target.value }))
                  }
                  placeholder="Add ticker (e.g. AAPL)"
                  className="flex-1 h-8 px-2 bg-background/40 border border-border rounded-none font-mono text-xs uppercase focus:outline-none focus:border-gold-hairline"
                  data-testid={`watchlist-ticker-input-${list.id}`}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={addItem.isPending || !draft.trim()}
                  className="h-8 font-mono text-xs"
                  data-testid={`watchlist-add-${list.id}`}
                >
                  Add
                </Button>
              </form>

              {list.items.length === 0 ? (
                <div className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  No tickers yet.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {list.items.map((item) => {
                    const up = (item.changePct ?? 0) >= 0;
                    return (
                      <li
                        key={item.id}
                        className="grid grid-cols-[auto,1fr,auto,auto] items-center gap-3 px-4 py-2 hover:bg-background/30 transition-colors"
                      >
                        <button
                          onClick={() => onPickTicker?.(item.ticker)}
                          className="font-mono text-xs font-bold tracking-wider text-foreground hover:text-primary"
                          data-testid={`watchlist-pick-${item.ticker}`}
                        >
                          {item.ticker}
                        </button>
                        <span className="text-xs text-muted-foreground truncate">
                          {item.name}
                        </span>
                        <span className="font-mono text-xs text-foreground">
                          {item.price != null
                            ? `${item.currency} ${item.price.toFixed(2)}`
                            : "—"}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.changePct != null && (
                            <span
                              className={`font-mono text-xs flex items-center gap-1 ${
                                up ? "text-emerald-500" : "text-rose-500"
                              }`}
                            >
                              {up ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {item.changePct.toFixed(2)}%
                            </span>
                          )}
                          <button
                            onClick={() =>
                              removeItem.mutate({
                                watchlistId: list.id,
                                ticker: item.ticker,
                              })
                            }
                            disabled={removeItem.isPending}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${item.ticker}`}
                            data-testid={`watchlist-remove-${list.id}-${item.ticker}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
