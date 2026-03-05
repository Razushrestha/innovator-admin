'use client';

import Link from 'next/link';

export default function RootNotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#030712',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
        color: '#f9fafb',
      }}
    >
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 96, fontWeight: 900, color: '#111827', lineHeight: 1, userSelect: 'none' }}>
          404
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: -8, marginBottom: 8 }}>
          Page not found
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/admin"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: '#4f46e5',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Go to Admin Panel
        </Link>
      </div>
    </div>
  );
}
