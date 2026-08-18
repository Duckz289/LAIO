'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BarChart3, BookOpen, CalendarClock, CheckCircle2, Flame, Loader2, Target } from 'lucide-react';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { api, ProgressSummary } from '@/lib/api';
import { listContainer, listItem } from '@/lib/motionVariants';

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
        <section className="rounded-[2rem] border border-[#173f3420] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Progress overview</p>
              <h1 className="landing-display mt-2 text-3xl font-black tracking-[-0.035em] text-brand-forest">Your learning at a glance</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-subtle">Theo dõi nhịp học, số từ cần ôn và độ chính xác từ cùng một màn hình.</p>
            </div>
            <Link href="/notebooks" className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-forest px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-brand-forest-dark">
              Open notebooks
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-3xl border-2 border-brand-accent-soft bg-brand-error-bg p-4 text-sm font-semibold text-brand-accent-deep" role="alert">
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
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-3xl bg-brand-sand" />)}
          </div>
        ) : (
          <motion.section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
            variants={listContainer}
            initial="hidden"
            animate="visible"
          >
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const rawValue = summary?.[metric.key] ?? 0;
              return (
                <motion.article key={metric.key} variants={listItem} className="rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl bg-brand-sand p-3 text-brand-forest"><Icon className="h-5 w-5" aria-hidden="true" /></div>
                    <span className="text-xs font-bold uppercase tracking-wide text-brand-faint">{metric.label}</span>
                  </div>
                  <p className="mt-6 text-3xl font-black text-brand-forest">{metric.key === 'accuracy_percentage' ? `${rawValue}%` : rawValue}</p>
                </motion.article>
              );
            })}
          </motion.section>
        )}

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[#173f3420] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-brand-success" aria-hidden="true" /><h2 className="landing-display text-lg font-black text-brand-forest">Review rhythm</h2></div>
            <p className="mt-3 text-sm leading-6 text-brand-subtle">Mỗi lần trả lời được ghi nhận vào lịch SRS. Mở Review để xử lý các từ đến hạn ngay hôm nay.</p>
            <Link href="/review" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-forest hover:text-brand-forest-dark">Go to review <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="rounded-3xl bg-brand-forest p-6 text-white shadow-sm">
            <Loader2 className="h-5 w-5 text-brand-cream" aria-hidden="true" />
            <h2 className="landing-display mt-4 text-lg font-black">Keep the next session small</h2>
            <p className="mt-2 text-sm leading-6 text-[#dbe7df]">Một phiên ngắn và đều đặn giúp bạn duy trì streak mà không quá tải.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
