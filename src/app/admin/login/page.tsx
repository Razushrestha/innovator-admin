'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken, setRefreshToken } from '@/lib/auth';
import { loginWithCredentials } from '@/lib/api';
import { Zap, Eye, EyeOff, LogIn, Key } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'credentials' | 'token'>('credentials');

  // Credentials form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authUrl, setAuthUrl] = useState('http://182.93.94.220:8003/api/token/');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Manual token form
  const [manualToken, setManualToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await loginWithCredentials(username, password, authUrl);
      if (!data.access) throw new Error('No access token returned');
      setToken(data.access);
      if (data.refresh) setRefreshToken(data.refresh);
      router.push('/admin');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      try {
        const parsed = JSON.parse(msg);
        const detail = parsed.detail || parsed.non_field_errors?.[0] || JSON.stringify(parsed);
        setError(detail);
      } catch {
        setError(msg.slice(0, 200));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTokenLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const tok = manualToken.trim();
    if (!tok) { setError('Please paste your access token'); return; }
    setToken(tok);
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Innovator</p>
            <h1 className="text-xl font-bold text-white leading-tight">Admin Panel</h1>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setTab('credentials'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'credentials' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn size={15} />
              Username / Password
            </button>
            <button
              onClick={() => { setTab('token'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'token' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Key size={15} />
              Paste Token
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Credentials Tab */}
          {tab === 'credentials' && (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Advanced: custom auth URL */}
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showAdvanced ? '▾' : '▸'} Advanced settings
              </button>
              {showAdvanced && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Auth Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={authUrl}
                    onChange={(e) => setAuthUrl(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Default: simplejwt /api/token/ endpoint
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {/* Paste Token Tab */}
          {tab === 'token' && (
            <form onSubmit={handleTokenLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Access Token (JWT Bearer)
                </label>
                <textarea
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  rows={5}
                  placeholder="Paste your JWT access token here…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs resize-none"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Obtain a token from your auth service, then paste the{' '}
                  <code className="text-indigo-400">access</code> value here.
                </p>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Key size={16} />
                Use this token
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Innovator eLearning Service — Admin v1.0
        </p>
      </div>
    </div>
  );
}
