import { useQuery } from "@tanstack/react-query";

type LocalIdentity = { signInName: string | null };

export function getLocalIdentityQueryKey() {
  return ["local-identity"] as const;
}

/**
 * Workstation OS username from the dev API process (e.g. output of `whoami` for the user running the server).
 * Only populated when the API is in development (or VALURA_SHOW_TERMINAL_NAME=true).
 */
export function useLocalSignInName() {
  return useQuery({
    queryKey: getLocalIdentityQueryKey(),
    queryFn: async (): Promise<LocalIdentity> => {
      const r = await fetch("/api/local-identity");
      if (!r.ok) return { signInName: null };
      return r.json() as Promise<LocalIdentity>;
    },
    staleTime: 60_000,
  });
}
