'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CalendarClock, CheckCircle2 } from 'lucide-react';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { api, DueReviewItem } from '@/lib/api';
import { listContainer, listItem } from '@/lib/motionVariants';

export default function ReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<DueReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (authLoading || !user) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api.getDueReviews(undefined, { signal: controller.signal })
      .then((response) => setItems(response.items))
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load due reviews:', requestError);
        setError('Không tải được danh sách ôn tập. Thử lại sau một lát.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [authLoading, reloadToken, user]);

  const openNotebookReview = (notebookId: string) => {
    window.sessionStorage.setItem('laio:auto-study-notebook', notebookId);
  };

  return (
    <AppShell title="Review" userEmail={user?.email}>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-[#173f3420] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-brand-sand p-3 text-brand-forest"><CalendarClock className="h-6 w-6" aria-hidden="true" /></div>
            <div>
              <h1 className="landing-display text-3xl font-black tracking-[-0.035em] text-brand-forest">Review due words</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-subtle">Chọn một notebook để mở đúng phiên SRS. Trạng thái hiện tại được giữ nguyên khi chuyển tab.</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-brand-accent-soft bg-brand-error-bg p-4 text-sm font-semibold text-brand-accent-deep" role="alert">
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
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-3xl bg-brand-sand" />)}</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border-2 border-brand-success-border bg-brand-success-bg p-10 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-10 w-10 text-brand-success" aria-hidden="true" />
            <h2 className="landing-display mt-4 text-xl font-black tracking-[-0.03em] text-brand-forest">All caught up</h2>
            <p className="mt-2 text-sm text-brand-muted">Hôm nay chưa có từ nào cần ôn.</p>
            <Link href="/notebooks" className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-forest px-5 py-3 text-sm font-black text-white transition-colors hover:bg-brand-forest-dark">Open notebooks <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        ) : (
          <motion.section className="space-y-3" variants={listContainer} initial="hidden" animate="visible">
            {items.map((item) => (
              <motion.article
                key={`${item.notebook_id}-${item.vocab_item_id}`}
                variants={listItem}
                className="flex flex-col gap-4 rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h2 className="landing-display truncate text-lg font-black tracking-[-0.03em] text-brand-forest">{item.word}</h2>
                  <p className="mt-1 truncate text-sm font-semibold text-brand-subtle">{item.meaning}</p>
                </div>
                <Link href={`/notebooks/${item.notebook_id}`} onClick={() => openNotebookReview(item.notebook_id)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-forest px-4 py-3 text-sm font-black text-white transition-colors hover:bg-brand-forest-dark">Review word <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              </motion.article>
            ))}
          </motion.section>
        )}
      </div>
    </AppShell>
  );
}
