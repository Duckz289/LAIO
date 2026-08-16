'use client';

import { CalendarClock, Edit2, Eye, EyeOff, Star, Trash2, Volume2 } from 'lucide-react';
import { useState } from 'react';

import { Vocab } from '../types';

interface VocabItemProps {
  vocab: Vocab;
  onToggleMaster: (id: string) => Promise<void>;
  onEdit: (vocab: Vocab) => void;
  onDelete: (id: string) => Promise<void>;
  onSpeak: (id: string) => Promise<void>;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function difficultyLabel(value?: number) {
  if (!value || value <= 1) return 'Easy';
  if (value <= 3) return 'Medium';
  return 'Hard';
}

export default function VocabItem({ vocab, onToggleMaster, onEdit, onDelete, onSpeak }: VocabItemProps) {
  const [isMeaningHidden, setIsMeaningHidden] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingAction, setPendingAction] = useState<'master' | 'delete' | null>(null);

  const runAction = async (
    action: 'master' | 'delete',
    operation: () => Promise<void>,
  ) => {
    if (pendingAction) return;
    try {
      setPendingAction(action);
      await operation();
    } catch {
      // The parent owns the visible API error state for this notebook.
    } finally {
      setPendingAction(null);
    }
  };

  const speak = async () => {
    if (isSpeaking) return;
    try {
      setIsSpeaking(true);
      await onSpeak(vocab.id);
    } catch (error) {
      console.warn('Failed to play vocabulary audio:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <article className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/70">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xl font-black tracking-tight text-slate-950">{vocab.word}</h4>
            {vocab.pronunciation && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                {vocab.pronunciation}
              </span>
            )}
            <button
              type="button"
              onClick={() => void speak()}
              disabled={isSpeaking}
              className="rounded-xl p-2 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-wait disabled:opacity-50"
              title="Speak"
            >
              <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-pulse text-indigo-600' : ''}`} />
            </button>
          </div>

          {!isMeaningHidden ? (
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{vocab.meaning}</p>
          ) : (
            <p className="mt-3 text-sm font-semibold italic text-slate-400">Meaning hidden</p>
          )}

          {vocab.example_sentence && (
            <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
              “{vocab.example_sentence}”
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-700">
              <CalendarClock className="h-3.5 w-3.5" />
              Next: {formatDate(vocab.next_review_date)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              Rep {vocab.repetition_count ?? 0}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              {vocab.interval_days ?? 0}d interval
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              {difficultyLabel(vocab.difficulty_level)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 self-start rounded-2xl bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setIsMeaningHidden((current) => !current)}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-white hover:text-slate-700 hover:shadow-sm"
            title={isMeaningHidden ? 'Show meaning' : 'Hide meaning'}
          >
            {isMeaningHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => void runAction('master', () => onToggleMaster(vocab.id))}
            disabled={pendingAction !== null}
            className={`rounded-xl p-2 transition-all hover:bg-white hover:shadow-sm ${
              vocab.is_mastered ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
            }`}
            title={vocab.is_mastered ? 'Mastered' : 'Mark mastered'}
          >
            <Star className="h-4 w-4" fill={vocab.is_mastered ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(vocab)}
            disabled={pendingAction !== null}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => void runAction('delete', () => onDelete(vocab.id))}
            disabled={pendingAction !== null}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-white hover:text-red-600 hover:shadow-sm"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
