'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, BookOpen, CalendarClock, CheckCircle2, Flame, Loader2, Target } from 'lucide-react';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { api, ProgressSummary } from '@/lib/api';

const metrics = [
  { key: 'total_notebooks', label: 'Notebooks', icon: BookOpen },
  { key: 'total_vocabulary', label: 'Total words', icon: BarChart3 },
  { key: 'due_today', label: 'Due today', icon: CalendarClock },
  { key: 'accuracy_percentage', label: 'Accuracy', icon: Target },
  { key: 'current_streak_days', label: 'Study streak', icon: Flame },
] as const;

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (authLoading || !user) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api.getProgressSummary({ signal: controller.signal })
      .then(setSummary)
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load progress:', requestError);
        setError('Không tải được tiến độ. Thử tải lại sau một lát.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [authLoading, reloadToken, user]);

  return (
    <AppShell title="Dashboard" userEmail={user?.email}>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-indigo-100/40 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-indigo-600">Progress overview</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Your learning at a glance</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Theo dõi nhịp học, số từ cần ôn và độ chính xác từ cùng một màn hình.</p>
            </div>
            <Link href="/notebooks" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700">
              Open notebooks
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReloadToken((current) => current + 1)}
              disabled={loading}
              className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm disabled:opacity-50"
            >
              Thử lại
            </button>
          </div>
        )}

        {loading || authLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-3xl bg-white/70" />)}
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const rawValue = summary?.[metric.key] ?? 0;
              return (
                <article key={metric.key} className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-200/70">
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600"><Icon className="h-5 w-5" aria-hidden="true" /></div>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{metric.label}</span>
                  </div>
                  <p className="mt-6 text-3xl font-black text-slate-950">{metric.key === 'accuracy_percentage' ? `${rawValue}%` : rawValue}</p>
                </article>
              );
            })}
          </section>
        )}

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" /><h2 className="text-lg font-black text-slate-950">Review rhythm</h2></div>
            <p className="mt-3 text-sm leading-6 text-slate-500">Mỗi lần trả lời được ghi nhận vào lịch SRS. Mở Review để xử lý các từ đến hạn ngay hôm nay.</p>
            <Link href="/review" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900">Go to review <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="rounded-3xl border border-indigo-100 bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-200">
            <Loader2 className="h-5 w-5 text-indigo-200" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-black">Keep the next session small</h2>
            <p className="mt-2 text-sm leading-6 text-indigo-100">Một phiên ngắn và đều đặn giúp bạn duy trì streak mà không quá tải.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
