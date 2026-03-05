'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/admin/Header';
import { FormField, Input } from '@/components/admin/FormField';
import { ToastContainer, useToast } from '@/components/admin/ToastContainer';
import ThemeToggle from '@/components/admin/ThemeToggle';
import { getToken } from '@/lib/auth';
import { decodeJwt, getTokenExpiry, getSecondsUntilExpiry } from '@/lib/jwt';
import {
  User, Lock, Shield, Settings2, Info,
  Eye, EyeOff, CheckCircle,
} from 'lucide-react';

const BASE_URL = 'http://182.93.94.220:8003';

export default function SettingsPage() {
  const { toasts, addToast, removeToast } = useToast();

  // JWT profile
  const token = getToken();
  const payload = token ? decodeJwt(token) : null;
  const username = payload?.username ?? 'Admin';
  const email = payload?.email ?? '—';
  const role = payload?.is_superuser ? 'Super Admin' : payload?.is_staff ? 'Staff' : payload?.role ?? 'Viewer';
  const expiry = token ? getTokenExpiry(token) : null;
  const secondsLeft = token ? getSecondsUntilExpiry(token) : 0;
  const expiryStr = expiry
    ? expiry.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  // Change password
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleChangePw = async () => {
    if (!pwForm.current.trim() || !pwForm.next.trim()) {
      addToast('All password fields are required', 'error');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (pwForm.next.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ old_password: pwForm.current, new_password: pwForm.next }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed: ${res.status}`);
      }
      addToast('Password changed successfully', 'success');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to change password', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  // Session health colour
  const sessionColor =
    secondsLeft > 300 ? 'text-emerald-400' : secondsLeft > 120 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Settings" subtitle="Admin account & preferences" />

      <div className="flex-1 px-4 lg:px-6 py-6 max-w-2xl space-y-6">

        {/* ── Profile ─────────────────────────────────────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <h2 className="text-white font-semibold text-sm">Profile</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{username}</p>
                <p className="text-gray-500 text-sm">{email}</p>
                <span className="mt-1 inline-block text-xs px-2 py-0.5 bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 rounded-full">
                  {role}
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-xs">
              Profile details are managed by the authentication server. Contact your system administrator to update them.
            </p>
          </div>
        </section>

        {/* ── Change Password ──────────────────────────────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h2 className="text-white font-semibold text-sm">Change Password</h2>
          </div>
          <div className="p-5 space-y-4">
            <FormField label="Current Password">
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
            <FormField label="New Password">
              <Input
                type={showPw ? 'text' : 'password'}
                value={pwForm.next}
                onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                placeholder="Min 8 characters"
              />
            </FormField>
            <FormField label="Confirm New Password">
              <Input
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat new password"
              />
            </FormField>
            <button
              onClick={handleChangePw}
              disabled={savingPw || !pwForm.current || !pwForm.next || !pwForm.confirm}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {savingPw ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {savingPw ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </section>

        {/* ── Appearance ───────────────────────────────────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-violet-400" />
            <h2 className="text-white font-semibold text-sm">Appearance</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200 text-sm font-medium">Theme</p>
                <p className="text-gray-500 text-xs mt-0.5">Switch between dark and light mode</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* ── Security ─────────────────────────────────────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-white font-semibold text-sm">Security & Session</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-800/60">
              <span className="text-gray-400 text-sm">Role</span>
              <span className="text-gray-200 text-sm">{role}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800/60">
              <span className="text-gray-400 text-sm">Token expires at</span>
              <span className="text-gray-200 text-sm">{expiryStr}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400 text-sm">Session health</span>
              <span className={`text-sm font-mono font-medium ${sessionColor}`}>
                {secondsLeft > 0
                  ? `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s remaining`
                  : 'Expired'}
              </span>
            </div>
          </div>
        </section>

        {/* ── About ────────────────────────────────────────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            <h2 className="text-white font-semibold text-sm">About</h2>
          </div>
          <div className="p-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Application</span>
              <span className="text-gray-300">Innovator Admin</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Framework</span>
              <span className="text-gray-300">Next.js 15 (App Router)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">API</span>
              <span className="text-gray-400 font-mono text-xs truncate max-w-[200px]">
                {BASE_URL}
              </span>
            </div>
          </div>
        </section>

      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
