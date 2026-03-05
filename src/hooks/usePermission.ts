import { useRole, type Permission } from '@/context/RoleContext';

/**
 * Convenience hook.
 *
 * ```tsx
 * const canDelete = usePermission('delete');
 * <button disabled={!canDelete} title={!canDelete ? 'Insufficient permissions' : undefined}>
 *   Delete
 * </button>
 * ```
 */
export function usePermission(permission: Permission): boolean {
  const { can } = useRole();
  return can(permission);
}
