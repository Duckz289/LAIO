'use client';

import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Loader2, Plus } from 'lucide-react';

import { listContainer, listItem } from '@/lib/motionVariants';

import { Vocab } from '../types';
import VocabItem from './VocabItem';

interface VocabListProps {
  vocabs: Vocab[];
  loading?: boolean;
  onToggleMaster: (id: string) => Promise<void>;
  onEdit: (vocab: Vocab) => void;
  onDelete: (id: string) => Promise<void>;
  onCreate: () => void;
  onSpeak: (id: string) => Promise<void>;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => Promise<void>;
}

export default function VocabList({
  vocabs,
  loading,
  onToggleMaster,
  onEdit,
  onDelete,
  onCreate,
  onSpeak,
  hasMore,
  loadingMore,
  onLoadMore,
}: VocabListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="h-5 w-2/5 animate-pulse rounded-lg bg-brand-sand" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded-lg bg-brand-sand" />
              </div>
              <div className="h-9 w-20 animate-pulse rounded-xl bg-brand-sand" />
            </div>
            <div className="mt-5 h-12 animate-pulse rounded-2xl bg-brand-sand" />
          </div>
        ))}
      </div>
    );
  }

  if (vocabs.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-[#173f3435] bg-brand-sand p-10 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cream text-brand-forest shadow-sm">
          <BookOpen className="h-7 w-7" />
        </div>
        <h3 className="landing-display mt-5 text-lg font-black text-brand-forest">No vocabulary found</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-brand-subtle">
          Thêm từ đầu tiên hoặc đổi bộ lọc tìm kiếm để xem lại danh sách hiện có.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-forest px-5 py-3 text-sm font-black text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-brand-forest-dark"
        >
          <Plus className="h-4 w-4" />
          Add vocabulary
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <motion.div className="space-y-3" variants={listContainer} initial="hidden" animate="visible">
        <AnimatePresence>
          {vocabs.map((vocab) => (
            <motion.div key={vocab.id} layout variants={listItem} exit="exit">
              <VocabItem
                vocab={vocab}
                onToggleMaster={onToggleMaster}
                onEdit={onEdit}
                onDelete={onDelete}
                onSpeak={onSpeak}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {hasMore && onLoadMore && (
        <button
          type="button"
          onClick={() => void onLoadMore()}
          disabled={loadingMore}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#173f3435] bg-white px-5 py-3 text-sm font-black text-brand-forest shadow-sm transition-colors hover:border-brand-forest hover:bg-brand-sand disabled:cursor-wait disabled:opacity-60"
        >
          {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
          {loadingMore ? 'Loading more...' : 'Load more vocabulary'}
        </button>
      )}
    </div>
  );
}
