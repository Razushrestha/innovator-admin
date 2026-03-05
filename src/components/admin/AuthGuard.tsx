'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/admin/Sidebar';
import AutoLogoutWarning from '@/components/admin/AutoLogoutWarning';
import CommandPalette from '@/components/admin/CommandPalette';
import ShortcutsModal from '@/components/admin/ShortcutsModal';
import LiveIndicator from '@/components/admin/LiveIndicator';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { GlobalSearchProvider } from '@/context/GlobalSearchContext';
import { RoleProvider } from '@/context/RoleContext';
import { useSSE } from '@/hooks/useSSE';

function AdminShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const sseStatus = useSSE('/api/admin/events');

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShortcutsOpen(false);
        setCmdOpen((v) => !v);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setCmdOpen(false);
        setShortcutsOpen((v) => !v);
        return;
      }
      // Ctrl+? (shift+/)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '/') {
        e.preventDefault();
        setCmdOpen(false);
        setShortcutsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <main
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* SSE status bar — only shown when not connected */}
        {sseStatus !== 'connected' && (
          <div className="sticky top-0 z-40 flex items-center justify-center gap-2 py-1.5 text-xs bg-amber-900/50 border-b border-amber-700/50">
            <LiveIndicator status={sseStatus} />
            <span className="text-amber-300">{sseStatus === 'connecting' ? 'Connecting to live updates…' : 'Live updates offline — reconnecting…'}</span>
          </div>
        )}
        {children}
      </main>
      <AutoLogoutWarning />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      if (isAuthenticated()) {
        router.replace('/admin');
      } else {
        setChecked(true);
      }
      return;
    }
    if (!isAuthenticated()) {
      router.replace('/admin/login');
    } else {
      setChecked(true);
    }
  }, [pathname, router, isLoginPage]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <RoleProvider>
      <GlobalSearchProvider>
        <SidebarProvider>
          <AdminShell>{children}</AdminShell>
        </SidebarProvider>
      </GlobalSearchProvider>
    </RoleProvider>
  );
}
