'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function DebugPage() {
  const { user, loading } = useAuth(false);

  return (
    <AppShell title="Settings" userEmail={user?.email}>
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-indigo-100/40 sm:p-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Connection status</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Thông tin chẩn đoán tối thiểu để kiểm tra frontend mà không lộ access token.</p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> : user ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
            <div><p className="text-sm font-bold text-slate-900">Auth session</p><p className="text-sm text-slate-500">{loading ? 'Đang kiểm tra session...' : user ? `Đã đăng nhập với ${user.email ?? 'tài khoản hiện tại'}` : 'Chưa đăng nhập'}</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            {isSupabaseConfigured ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
            <div><p className="text-sm font-bold text-slate-900">Supabase config</p><p className="text-sm text-slate-500">{isSupabaseConfigured ? 'Đã cấu hình public URL và anon key.' : 'Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY.'}</p></div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
