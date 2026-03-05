export interface JwtPayload {
  exp?: number;
  iat?: number;
  user_id?: string | number;
  username?: string;
  email?: string;
  role?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string): Date | null {
  const payload = decodeJwt(token);
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000);
}

export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return expiry <= new Date();
}

export function getTokenRole(token: string): string {
  const payload = decodeJwt(token);
  if (payload?.is_superuser) return 'superadmin';
  if (payload?.is_staff) return 'staff';
  if (payload?.role) return payload.role;
  return 'viewer';
}

export function getSecondsUntilExpiry(token: string): number {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;
  return Math.floor((expiry.getTime() - Date.now()) / 1000);
}
