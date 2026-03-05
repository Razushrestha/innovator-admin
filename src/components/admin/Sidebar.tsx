'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, FolderOpen, Users,
  CreditCard, GraduationCap, ChevronRight, ChevronLeft, Zap, Settings, ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { useSidebar } from '@/context/SidebarContext';
import { useRole } from '@/context/RoleContext';

const navItems = [
  { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { href: '/admin/courses',    label: 'Courses',     icon: BookOpen },
  { href: '/admin/categories', label: 'Categories',  icon: FolderOpen },
  { href: '/admin/vendors',    label: 'Vendors',     icon: Users },
  { href: '/admin/enrollments',label: 'Enrollments', icon: GraduationCap },
  { href: '/admin/payouts',    label: 'Payouts',     icon: CreditCard },
  { href: '/admin/audit',      label: 'Audit Log',   icon: ShieldCheck },
  { href: '/admin/settings',   label: 'Settings',    icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggle, closeMobile } = useSidebar();
  const { roleLabel, roleBadgeClass } = useRole();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen bg-gray-950 border-r border-gray-800 flex flex-col z-40 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo + collapse toggle */}
        <div className={clsx(
          'flex items-center h-16 border-b border-gray-800 shrink-0',
          collapsed ? 'justify-center px-0' : 'px-4 gap-3 justify-between'
        )}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight">Innovator</p>
                <p className="text-gray-500 text-xs">Admin Panel</p>
              </div>
            )}
          </div>
          <button
            onClick={toggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={clsx(
              'p-1.5 text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors shrink-0',
              collapsed && 'absolute right-1 top-4'
            )}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Menu</p>
          )}
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                onClick={() => { if (mobileOpen) closeMobile(); }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-100 border border-transparent'
                )}
              >
                <Icon className={clsx('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300')} />
                {!collapsed && <span className="truncate flex-1">{label}</span>}
                {!collapsed && isActive && <ChevronRight className="w-3 h-3 text-indigo-400 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={clsx('border-t border-gray-800 p-3 shrink-0', collapsed ? 'flex justify-center' : '')}>
          <div className={clsx('flex items-center gap-3', !collapsed && 'px-1')}>
            <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              A
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-gray-300 text-xs font-medium truncate">Admin</p>
                <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', roleBadgeClass)}>
                  {roleLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

