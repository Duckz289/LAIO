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
    <article className="group rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-brand-forest">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="landing-display text-xl font-black tracking-[-0.03em] text-brand-forest">{vocab.word}</h4>
            {vocab.pronunciation && (
              <span className="rounded-full bg-brand-sand px-2.5 py-1 text-xs font-bold text-brand-muted">
                {vocab.pronunciation}
              </span>
            )}
            <button
              type="button"
              onClick={() => void speak()}
              disabled={isSpeaking}
              className="rounded-xl p-2 text-brand-faint transition-colors hover:bg-brand-sand hover:text-brand-forest disabled:cursor-wait disabled:opacity-50"
              title="Speak"
            >
              <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-pulse text-brand-forest' : ''}`} />
            </button>
          </div>

          {!isMeaningHidden ? (
            <p className="mt-3 text-sm font-semibold leading-6 text-brand-muted">{vocab.meaning}</p>
          ) : (
            <p className="mt-3 text-sm font-semibold italic text-brand-faint">Meaning hidden</p>
          )}

          {vocab.example_sentence && (
            <p className="mt-3 rounded-2xl bg-brand-sand px-4 py-3 text-sm leading-6 text-brand-muted">
              “{vocab.example_sentence}”
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-brand-muted">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-cream-soft px-3 py-1.5 text-brand-forest">
              <CalendarClock className="h-3.5 w-3.5" />
              Next: {formatDate(vocab.next_review_date)}
            </span>
            <span className="rounded-full bg-brand-sand px-3 py-1.5">
              Rep {vocab.repetition_count ?? 0}
            </span>
            <span className="rounded-full bg-brand-sand px-3 py-1.5">
              {vocab.interval_days ?? 0}d interval
            </span>
            <span className="rounded-full bg-brand-sand px-3 py-1.5">
              {difficultyLabel(vocab.difficulty_level)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 self-start rounded-2xl bg-brand-sand p-1">
          <button
            type="button"
            onClick={() => setIsMeaningHidden((current) => !current)}
            className="rounded-xl p-2 text-brand-faint transition-colors hover:bg-white hover:text-brand-forest"
            title={isMeaningHidden ? 'Show meaning' : 'Hide meaning'}
          >
            {isMeaningHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => void runAction('master', () => onToggleMaster(vocab.id))}
            disabled={pendingAction !== null}
            className={`rounded-xl p-2 transition-colors hover:bg-white ${
              vocab.is_mastered ? 'text-brand-warn-border' : 'text-brand-faint hover:text-brand-warn-border'
            }`}
            title={vocab.is_mastered ? 'Mastered' : 'Mark mastered'}
          >
            <Star className="h-4 w-4" fill={vocab.is_mastered ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(vocab)}
            disabled={pendingAction !== null}
            className="rounded-xl p-2 text-brand-faint transition-colors hover:bg-white hover:text-brand-forest"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => void runAction('delete', () => onDelete(vocab.id))}
            disabled={pendingAction !== null}
            className="rounded-xl p-2 text-brand-faint transition-colors hover:bg-white hover:text-brand-accent-dark"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
