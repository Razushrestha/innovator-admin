import type { Metadata } from 'next';
import Sidebar from '@/components/admin/Sidebar';
import AuthGuard from '@/components/admin/AuthGuard';

export const metadata: Metadata = {
  title: 'Innovator Admin',
  description: 'Innovator eLearning Admin Panel',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}

// The sidebar shell is rendered by a nested layout only for authenticated pages.
// See: src/app/admin/(dashboard)/layout.tsx
