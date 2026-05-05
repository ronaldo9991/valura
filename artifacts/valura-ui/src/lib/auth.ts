const USER_KEY = "valura.userId";
const DISPLAY_NAME_KEY = "valura.displayName";

/** Local-only “build your own” profile — simulated holdings & paper cash. */
export const SCRATCH_USER_ID = "user_scratch";

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(USER_KEY);
}

export function setStoredUserId(userId: string): void {
  window.localStorage.setItem(USER_KEY, userId);
}

export function clearStoredUserId(): void {
  window.localStorage.removeItem(USER_KEY);
}

/** Name the user typed at sign-in — takes priority over demo profile & terminal name for AI + UI. */
export function getStoredDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DISPLAY_NAME_KEY);
}

export function setStoredDisplayName(name: string): void {
  const t = name.trim();
  if (t) window.localStorage.setItem(DISPLAY_NAME_KEY, t);
  else window.localStorage.removeItem(DISPLAY_NAME_KEY);
}

export function clearStoredDisplayName(): void {
  window.localStorage.removeItem(DISPLAY_NAME_KEY);
}

/** Clear demo profile selection + saved display name (full sign-out of session). */
export function clearSession(): void {
  clearStoredUserId();
  clearStoredDisplayName();
}

/**
 * Who to address in UI and send as `displayName` to the API: typed name first, then workstation user, then DB profile.
 */
export function resolveSessionDisplayName(profileName?: string | null, terminalSignInName?: string | null): string {
  const typed = getStoredDisplayName()?.trim();
  if (typed) return typed;
  const term = terminalSignInName?.trim();
  if (term) return term;
  return profileName?.trim() ?? "";
}
