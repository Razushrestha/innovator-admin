const TOKEN_KEY = 'admin_access_token';
const REFRESH_KEY = 'admin_refresh_token';
const REFRESH_URL = 'http://182.93.94.220:8003/api/token/refresh/';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

/** Attempt a silent token refresh. Returns true if a new access token was obtained. */
export async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(REFRESH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.access) {
      setToken(data.access);
      if (data.refresh) setRefreshToken(data.refresh);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
