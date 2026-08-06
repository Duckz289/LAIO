'use client';

import { BookOpen, Plus } from 'lucide-react';

import { Vocab } from '../types';
import VocabItem from './VocabItem';

interface VocabListProps {
  vocabs: Vocab[];
  loading?: boolean;
  onToggleMaster: (id: string) => void;
  onEdit: (vocab: Vocab) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onSpeak: (id: string) => Promise<void>;
}

export default function VocabList({
  vocabs,
  loading,
  onToggleMaster,
  onEdit,
  onDelete,
  onCreate,
  onSpeak,
}: VocabListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="h-5 w-2/5 animate-pulse rounded-lg bg-slate-200" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded-lg bg-slate-100" />
              </div>
              <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-100" />
            </div>
            <div className="mt-5 h-12 animate-pulse rounded-2xl bg-slate-50" />
          </div>
        ))}
      </div>
    );
  }

  if (vocabs.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-white/75 p-10 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <BookOpen className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-lg font-black text-slate-950">No vocabulary found</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          Thêm từ đầu tiên hoặc đổi bộ lọc tìm kiếm để xem lại danh sách hiện có.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add vocabulary
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vocabs.map((vocab) => (
        <VocabItem
          key={vocab.id}
          vocab={vocab}
          onToggleMaster={onToggleMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          onSpeak={onSpeak}
        />
      ))}
    </div>
  );
}
