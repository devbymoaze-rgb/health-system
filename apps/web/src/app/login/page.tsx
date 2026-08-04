'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, Stethoscope } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Static credentials check
    if (email === 'admin@example.com' && password === 'password') {
      // Set a simple cookie for middleware to check
      document.cookie = "auth_token=true; path=/; max-age=86400; SameSite=Strict";
      router.push('/');
    } else {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-200/50 border-4 border-emerald-100 overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-4 shadow-inner border border-emerald-200">
              <Stethoscope className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-black text-emerald-900 uppercase italic tracking-tighter">HealthBot</h1>
            <p className="text-emerald-600/60 font-bold text-sm uppercase tracking-widest mt-1">Admin Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-emerald-900 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl text-emerald-900 font-bold placeholder:text-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-emerald-900 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl text-emerald-900 font-bold placeholder:text-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-100 text-red-600 text-xs font-black uppercase tracking-widest p-4 rounded-2xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-bold text-emerald-400 uppercase tracking-tighter">
            &copy; 2026 HealthBot CRM System
          </p>
        </div>
      </div>
    </div>
  );
}
