'use client';

import { createContext, useContext, useMemo } from 'react';
import { getToken } from '@/lib/auth';
import { getTokenRole } from '@/lib/jwt';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = 'superadmin' | 'staff' | 'viewer';

/** What each role can do */
export type Permission =
  | 'create'    // add new records
  | 'update'    // edit existing records
  | 'delete'    // permanently remove records
  | 'approve'   // approve/reject vendors, payouts
  | 'import'    // bulk CSV import
  | 'export';   // download CSVs

// Minimum role rank required for each permission
const ROLE_RANK: Record<Role, number> = {
  superadmin: 3,
  staff: 2,
  viewer: 1,
};

const PERM_REQUIRED: Record<Permission, number> = {
  create:  2, // staff+
  update:  2,
  delete:  3, // superadmin only
  approve: 2,
  import:  2,
  export:  1, // everyone
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface RoleCtx {
  role: Role;
  /** Returns true when the current user has the given permission */
  can: (permission: Permission) => boolean;
  /** Human-readable label for the current role */
  roleLabel: string;
  /** Tailwind colour classes for the role badge */
  roleBadgeClass: string;
}

const RoleContext = createContext<RoleCtx>({
  role: 'viewer',
  can: () => false,
  roleLabel: 'Viewer',
  roleBadgeClass: 'text-gray-400 bg-gray-800',
});

const ROLE_LABEL: Record<Role, string> = {
  superadmin: 'Super Admin',
  staff: 'Staff',
  viewer: 'Viewer',
};

const ROLE_BADGE: Record<Role, string> = {
  superadmin: 'text-purple-300 bg-purple-900/40 ring-1 ring-purple-500/30',
  staff:      'text-indigo-300 bg-indigo-900/40 ring-1 ring-indigo-500/30',
  viewer:     'text-gray-400  bg-gray-800       ring-1 ring-gray-700',
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const role: Role = useMemo(() => {
    const token = getToken();
    if (!token) return 'viewer';
    const r = getTokenRole(token);
    if (r === 'superadmin' || r === 'staff' || r === 'viewer') return r;
    return 'viewer';
  }, []);

  const can = useMemo(
    () => (permission: Permission) => ROLE_RANK[role] >= PERM_REQUIRED[permission],
    [role]
  );

  const value: RoleCtx = useMemo(
    () => ({ role, can, roleLabel: ROLE_LABEL[role], roleBadgeClass: ROLE_BADGE[role] }),
    [role, can]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useRole = () => useContext(RoleContext);
