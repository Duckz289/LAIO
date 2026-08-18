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
  { label: 'Again', score: 0, helper: 'Forgot', className: 'bg-brand-error-bg text-brand-accent-deep hover:bg-[#ffe3d6]' },
  { label: 'Hard', score: 2, helper: 'Almost', className: 'bg-brand-warn-bg text-brand-warn hover:bg-[#ffeeb8]' },
  { label: 'Good', score: 3, helper: 'Correct', className: 'bg-brand-success-bg text-brand-success hover:bg-[#dff0d3]' },
  { label: 'Easy', score: 5, helper: 'Instant', className: 'bg-brand-sand text-brand-forest hover:bg-[#eee5cf]' },
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
      <div className="rounded-3xl border border-[#173f3420] bg-white p-10 text-center shadow-sm">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-forest" />
        <p className="mt-4 text-sm font-bold text-brand-subtle">Preparing learning session...</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="rounded-3xl border-2 border-brand-success-border bg-brand-success-bg p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-success shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="landing-display mt-5 text-2xl font-black tracking-[-0.035em] text-brand-forest">Review complete</h3>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Phiên học đã được hoàn tất và lịch SRS đã cập nhật qua learning session API.
        </p>
        {summary && (
          <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xl font-black text-brand-forest">{summary.answered_items}</p>
              <p className="text-xs font-bold text-brand-subtle">Reviewed</p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xl font-black text-brand-forest">{summary.correct_answers}</p>
              <p className="text-xs font-bold text-brand-subtle">Correct</p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xl font-black text-brand-forest">{summary.accuracy_percentage}%</p>
              <p className="text-xs font-bold text-brand-subtle">Accuracy</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => void onBackToNotes()}
          className="mt-6 rounded-full bg-brand-forest px-5 py-3 text-sm font-black text-white transition-colors hover:bg-brand-forest-dark"
        >
          Back to vocabulary
        </button>
      </div>
    );
  }

  if (dueVocabs.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-brand-success-border bg-brand-success-bg p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-success shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="landing-display mt-5 text-2xl font-black tracking-[-0.035em] text-brand-forest">No reviews due</h3>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Hôm nay chưa có từ nào cần ôn. Có thể thêm từ mới hoặc quay lại danh sách.
        </p>
        <button
          type="button"
          onClick={() => void onBackToNotes()}
          className="mt-6 rounded-full bg-brand-forest px-5 py-3 text-sm font-black text-white transition-colors hover:bg-brand-forest-dark"
        >
          Back to notebook
        </button>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="rounded-3xl border-2 border-brand-warn-border bg-brand-warn-bg p-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-warn" />
        <p className="mt-4 text-sm font-bold text-brand-warn">Starting learning session...</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-3xl border border-[#173f3420] bg-white p-10 text-center shadow-sm">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-forest" />
        <p className="mt-4 text-sm font-bold text-brand-muted">Updating review cards...</p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-[#173f3420] bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-kicker">Flashcard session</p>
          <h2 className="landing-display mt-2 text-2xl font-black tracking-[-0.035em] text-brand-forest">
            Card {currentIndex + 1} / {dueVocabs.length}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void onBackToNotes()}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#173f3435] bg-white px-4 py-3 text-sm font-black text-brand-forest transition-colors hover:border-brand-forest hover:bg-brand-sand"
        >
          <RotateCcw className="h-4 w-4" />
          Exit
        </button>
      </div>

      <div className="mt-5 h-2.5 rounded-full bg-brand-sand">
        <div
          className="h-2.5 rounded-full bg-brand-forest transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8 rounded-[2rem] bg-brand-sand p-8 text-center">
        <button
          type="button"
          onClick={() => void speak()}
          disabled={speaking}
          className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-forest shadow-sm transition-transform duration-200 hover:scale-105 disabled:cursor-wait disabled:opacity-60"
          title="Speak word"
        >
          <Volume2 className={`h-5 w-5 ${speaking ? 'animate-pulse' : ''}`} />
        </button>
        <h3 className="landing-display text-4xl font-black tracking-[-0.045em] text-brand-forest sm:text-5xl">{current.word}</h3>
        {current.pronunciation && (
          <p className="mt-3 text-sm font-bold text-brand-faint">{current.pronunciation}</p>
        )}

        {showAnswer ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-white p-5 text-left shadow-sm">
            <p className="section-kicker">Meaning</p>
            <p className="mt-2 text-lg font-bold leading-7 text-brand-forest">{current.meaning}</p>
            {current.example_sentence && (
              <p className="mt-4 rounded-2xl bg-brand-sand p-4 text-sm leading-6 text-brand-muted">
                “{current.example_sentence}”
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="mt-8 rounded-full bg-brand-forest px-6 py-3 text-sm font-black text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-brand-forest-dark"
          >
            Show meaning
          </button>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border-2 border-brand-accent-soft bg-brand-error-bg px-4 py-3 text-sm font-semibold text-brand-accent-deep" role="alert">
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
