const KEY = "valura.userId";

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setStoredUserId(userId: string): void {
  window.localStorage.setItem(KEY, userId);
}

export function clearStoredUserId(): void {
  window.localStorage.removeItem(KEY);
}
