'use client';

import { CheckCircle2, Loader2, RotateCcw, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Vocab } from '../types';

interface StudyModeProps {
  dueVocabs: Vocab[];
  sessionReady: boolean;
  starting?: boolean;
  onReview: (id: string, score: number, timeSpentMs: number) => Promise<void>;
  onComplete: () => Promise<ReviewSummary>;
  onBackToNotes: () => void | Promise<void>;
  onSpeak: (id: string) => Promise<void>;
}

interface ReviewSummary {
  answered_items: number;
  correct_answers: number;
  accuracy_percentage: number;
}

const gradeButtons = [
  { label: 'Again', score: 0, helper: 'Forgot', className: 'bg-red-50 text-red-700 hover:bg-red-100' },
  { label: 'Hard', score: 2, helper: 'Almost', className: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { label: 'Good', score: 3, helper: 'Correct', className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { label: 'Easy', score: 5, helper: 'Instant', className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
];

export default function StudyMode({
  dueVocabs,
  sessionReady,
  starting,
  onReview,
  onComplete,
  onBackToNotes,
  onSpeak,
}: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerStartedAt, setAnswerStartedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  const current = dueVocabs[currentIndex];
  const progress = useMemo(() => {
    if (!dueVocabs.length) return 0;
    return Math.round((currentIndex / dueVocabs.length) * 100);
  }, [currentIndex, dueVocabs.length]);

  useEffect(() => {
    if (!sessionReady) return;
    setCurrentIndex(0);
    setShowAnswer(false);
    setCompleted(false);
    setAnswerStartedAt(Date.now());
    setError(null);
    setSummary(null);
  }, [sessionReady]);

  const [speaking, setSpeaking] = useState(false);

  const speak = async () => {
    if (!current || speaking) return;
    try {
      setSpeaking(true);
      await onSpeak(current.id);
    } catch (error) {
      console.warn('Failed to play vocabulary audio:', error);
      setError('Không phát được audio. Kiểm tra cấu hình VBEE rồi thử lại.');
    } finally {
      setSpeaking(false);
    }
  };

  const handleReview = async (score: number) => {
    if (!current || submitting) return;
    try {
      setSubmitting(true);
      setError(null);
      await onReview(current.id, score, Date.now() - answerStartedAt);
      setShowAnswer(false);

      if (currentIndex + 1 < dueVocabs.length) {
        setCurrentIndex((index) => index + 1);
        setAnswerStartedAt(Date.now());
      } else {
        const completedSession = await onComplete();
        setSummary(completedSession);
        setCompleted(true);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.warn('Failed to submit review:', error);
      setError('Không gửi được câu trả lời. Kiểm tra phiên học hoặc backend rồi thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (starting) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/95 p-10 text-center shadow-sm shadow-slate-200/60">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
        <p className="mt-4 text-sm font-bold text-slate-600">Preparing learning session...</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-emerald-600 shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-black text-slate-950">Review complete</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Phiên học đã được hoàn tất và lịch SRS đã cập nhật qua learning session API.
        </p>
        {summary && (
          <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xl font-black text-slate-950">{summary.answered_items}</p>
              <p className="text-xs font-bold text-slate-500">Reviewed</p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xl font-black text-slate-950">{summary.correct_answers}</p>
              <p className="text-xs font-bold text-slate-500">Correct</p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xl font-black text-slate-950">{summary.accuracy_percentage}%</p>
              <p className="text-xs font-bold text-slate-500">Accuracy</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => void onBackToNotes()}
          className="mt-6 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700"
        >
          Back to vocabulary
        </button>
      </div>
    );
  }

  if (dueVocabs.length === 0) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-emerald-600 shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-black text-slate-950">No reviews due</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Hôm nay chưa có từ nào cần ôn. Có thể thêm từ mới hoặc quay lại danh sách.
        </p>
        <button
          type="button"
          onClick={() => void onBackToNotes()}
          className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700"
        >
          Back to notebook
        </button>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-amber-600" />
        <p className="mt-4 text-sm font-bold text-amber-800">Starting learning session...</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-sm">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-600" />
        <p className="mt-4 text-sm font-bold text-slate-600">Updating review cards...</p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-indigo-100/50 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Flashcard session</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Card {currentIndex + 1} / {dueVocabs.length}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void onBackToNotes()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Exit
        </button>
      </div>

      <div className="mt-5 h-2.5 rounded-full bg-slate-100">
        <div
          className="h-2.5 rounded-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50 p-8 text-center">
        <button
          type="button"
          onClick={() => void speak()}
          disabled={speaking}
          className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm transition-all hover:scale-105 disabled:cursor-wait disabled:opacity-60"
          title="Speak word"
        >
          <Volume2 className={`h-5 w-5 ${speaking ? 'animate-pulse' : ''}`} />
        </button>
        <h3 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{current.word}</h3>
        {current.pronunciation && (
          <p className="mt-3 text-sm font-bold text-slate-400">{current.pronunciation}</p>
        )}

        {showAnswer ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-white p-5 text-left shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Meaning</p>
            <p className="mt-2 text-lg font-bold leading-7 text-slate-800">{current.meaning}</p>
            {current.example_sentence && (
              <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                “{current.example_sentence}”
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="mt-8 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-indigo-700"
          >
            Show meaning
          </button>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </div>
      )}

      {showAnswer && (
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {gradeButtons.map((button) => (
            <button
              key={button.score}
              type="button"
              onClick={() => void handleReview(button.score)}
              disabled={submitting}
              className={`rounded-2xl px-4 py-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${button.className}`}
            >
              <p className="text-base font-black">{submitting ? 'Saving...' : button.label}</p>
              <p className="text-xs font-bold opacity-70">Score {button.score} · {button.helper}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
