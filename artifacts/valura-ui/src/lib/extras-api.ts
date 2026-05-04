import { customFetch } from "@workspace/api-client-react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

export interface WatchlistItem {
  id: string;
  ticker: string;
  addedAt: string;
  name: string;
  price: number | null;
  changePct: number | null;
  currency: string;
}

export interface Watchlist {
  id: string;
  name: string;
  createdAt: string;
  items: WatchlistItem[];
}

export interface WatchlistsResponse {
  watchlists: Watchlist[];
}

export const watchlistsKey = (userId: string) =>
  ["watchlists", userId] as const;

export function useWatchlists(
  userId: string,
  opts?: Omit<
    UseQueryOptions<WatchlistsResponse>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<WatchlistsResponse>({
    queryKey: watchlistsKey(userId),
    queryFn: () =>
      customFetch<WatchlistsResponse>(`/api/watchlists/${userId}`),
    enabled: !!userId,
    ...opts,
  });
}

export function useCreateWatchlist(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name?: string) =>
      customFetch<Watchlist>(`/api/watchlists/${userId}`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: watchlistsKey(userId) }),
  });
}

export function useDeleteWatchlist(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customFetch<void>(`/api/watchlists/${userId}/${id}`, {
        method: "DELETE",
        responseType: "text",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: watchlistsKey(userId) }),
  });
}

export function useAddWatchlistItem(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      watchlistId,
      ticker,
    }: {
      watchlistId: string;
      ticker: string;
    }) =>
      customFetch<{ id: string; ticker: string; addedAt: string }>(
        `/api/watchlists/${userId}/${watchlistId}/items`,
        { method: "POST", body: JSON.stringify({ ticker }) },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: watchlistsKey(userId) }),
  });
}

export function useRemoveWatchlistItem(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      watchlistId,
      ticker,
    }: {
      watchlistId: string;
      ticker: string;
    }) =>
      customFetch<void>(
        `/api/watchlists/${userId}/${watchlistId}/items/${encodeURIComponent(
          ticker,
        )}`,
        { method: "DELETE", responseType: "text" },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: watchlistsKey(userId) }),
  });
}

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  publishedAt: string;
}

export interface NewsResponse {
  ticker: string;
  articles: NewsArticle[];
  cached: boolean;
  configured: boolean;
}

export const newsKey = (ticker: string) =>
  ["news", ticker.toUpperCase()] as const;

export function useCompanyNews(
  ticker: string,
  opts?: Omit<UseQueryOptions<NewsResponse>, "queryKey" | "queryFn">,
) {
  return useQuery<NewsResponse>({
    queryKey: newsKey(ticker),
    queryFn: () => customFetch<NewsResponse>(`/api/news/${ticker}`),
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
    ...opts,
  });
}
