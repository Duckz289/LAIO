'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarClock, Loader2, Plus, Sparkles, Zap } from 'lucide-react';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError, DueReviewItem, VocabRecord } from '@/lib/api';

import AddVocabModal from './components/AddVocabModal';
import QuickActions from './components/QuickActions';
import SearchBar from './components/SearchBar';
import StatsCard from './components/StatsCard';
import StudyMode from './components/StudyMode';
import VocabList from './components/VocabList';
import { Notebook, Vocab, VocabFilter, VocabMutation } from './types';

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function isDue(vocab: Vocab) {
  return !vocab.is_mastered && Boolean(vocab.next_review_date && vocab.next_review_date <= todayKey());
}

function mapVocab(record: VocabRecord): Vocab {
  return {
    id: record.id,
    word: record.word,
    meaning: record.meaning,
    pronunciation: record.pronunciation,
    audio_url: record.audio_url,
    example_sentence: record.example_sentence || '',
    difficulty_level: record.difficulty_level,
    is_mastered: record.is_mastered,
    next_review_date: record.next_review_date,
    repetition_count: record.repetition_count,
    interval_days: record.interval_days,
    ease_factor: record.ease_factor,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

function mapDueReview(item: DueReviewItem): Vocab {
  return {
    id: item.vocab_item_id,
    word: item.word,
    meaning: item.meaning,
    pronunciation: item.pronunciation,
    audio_url: item.audio_url,
    example_sentence: item.example_sentence || '',
    difficulty_level: 1,
    is_mastered: false,
    next_review_date: item.next_review_date,
    repetition_count: item.repetition_count,
    interval_days: item.interval_days,
    ease_factor: item.ease_factor,
    created_at: item.last_reviewed_at ?? item.next_review_date,
    updated_at: item.last_reviewed_at ?? item.next_review_date,
  };
}

function describeError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') return '';
  if (error instanceof ApiError) return `HTTP ${error.status}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return 'Lỗi không xác định từ backend.';
}

type SettledResult<T> = { value: T } | { error: unknown };

function settle<T>(request: Promise<T>): Promise<SettledResult<T>> {
  return request.then((value) => ({ value })).catch((error: unknown) => ({ error }));
}

function NotebookStatsSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60" aria-label="Loading notebook statistics">
      <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-6 w-10 animate-pulse rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-2.5 animate-pulse rounded-full bg-slate-200" />
    </div>
  );
}

function VocabularyLoadingState() {
  return (
    <div className="space-y-3" aria-label="Loading vocabulary">
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

export default function NotebookDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;
  const autoStartChecked = useRef(false);
  const studyAbortRef = useRef<AbortController | null>(null);

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [dueVocabs, setDueVocabs] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [vocabLoaded, setVocabLoaded] = useState(false);
  const [dueLoaded, setDueLoaded] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'study'>('notes');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<VocabFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVocab, setEditingVocab] = useState<Vocab | null>(null);
  const [learningSessionId, setLearningSessionId] = useState<string | null>(null);
  const [studyStarting, setStudyStarting] = useState(false);
  const generatedAudioUrls = useRef(new Set<string>());
  const audioRequests = useRef(new Map<string, Promise<string>>());
  const vocabById = useRef(new Map<string, Vocab>());

  useEffect(() => () => {
    generatedAudioUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    const next = new Map<string, Vocab>();
    [...vocabs, ...dueVocabs].forEach((vocab) => next.set(vocab.id, vocab));
    vocabById.current = next;
  }, [dueVocabs, vocabs]);

  const rebuildNotebookStats = useCallback((vocabList: Vocab[]) => {
    setNotebook((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        totalVocabs: vocabList.length,
        masteredVocabs: vocabList.filter((vocab) => vocab.is_mastered).length,
        dueVocabs: vocabList.filter(isDue).length,
      };
    });
  }, []);

  const fetchDueVocabs = useCallback(async (signal?: AbortSignal) => {
    const data = await api.getDueReviews(notebookId, { signal });
    const mapped = data.items.map(mapDueReview);
    setDueVocabs(mapped);
    setDueLoaded(true);
    return mapped;
  }, [notebookId]);

  const loadNotebook = useCallback(async (signal: AbortSignal) => {
    setLoading(true);

    const [notebookResult, vocabResult, dueResult] = await Promise.all([
      settle(api.getNotebook(notebookId, { signal })),
      settle(api.getVocabs(notebookId, { signal })),
      settle(api.getDueReviews(notebookId, { signal })),
    ]);

    if (signal.aborted) return;

    const vocabList = 'value' in vocabResult ? vocabResult.value.vocab_items.map(mapVocab) : null;
    const dueList = 'value' in dueResult ? dueResult.value.items.map(mapDueReview) : null;

    if ('value' in notebookResult) {
      setNotebook({
        id: notebookResult.value.id,
        title: notebookResult.value.title,
        description: notebookResult.value.description || '',
        totalVocabs: notebookResult.value.vocab_count,
        masteredVocabs: notebookResult.value.mastered_count,
        dueVocabs: dueList?.length ?? notebookResult.value.due_count,
      });
    } else if (vocabList) {
      setNotebook((previous) => previous ?? {
        id: notebookId,
        title: 'Notebook',
        description: '',
        totalVocabs: vocabList.length,
        masteredVocabs: vocabList.filter((vocab) => vocab.is_mastered).length,
        dueVocabs: dueList?.length ?? vocabList.filter(isDue).length,
      });
    }

    if (vocabList) {
      setVocabs(vocabList);
      setVocabLoaded(true);
    }
    if (dueList) {
      setDueVocabs(dueList);
      setDueLoaded(true);
    }

    const failedResources = [notebookResult, vocabResult, dueResult].filter((result) => 'error' in result).length;
    if (failedResources === 0) {
      setError(null);
    } else if (failedResources === 3) {
      setError('Không tải được notebook. Kiểm tra backend/API URL hoặc token đăng nhập.');
    } else {
      setError('Notebook đã tải một phần. Một số dữ liệu đang tạm thời chưa sẵn sàng.');
    }

    setLoading(false);
  }, [notebookId]);

  const refreshVocabData = useCallback(async () => {
    const [vocabData, dueData] = await Promise.all([
      api.getVocabs(notebookId),
      api.getDueReviews(notebookId),
    ]);
    const vocabList = vocabData.vocab_items.map(mapVocab);
    setVocabs(vocabList);
    setVocabLoaded(true);
    setDueVocabs(dueData.items.map(mapDueReview));
    setDueLoaded(true);
    rebuildNotebookStats(vocabList);
  }, [notebookId, rebuildNotebookStats]);

  useEffect(() => {
    if (notebookId && !authLoading && user) {
      const controller = new AbortController();
      void loadNotebook(controller.signal);
      return () => controller.abort();
    }
  }, [authLoading, loadNotebook, notebookId, reloadToken, user]);

  useEffect(() => {
    return () => studyAbortRef.current?.abort();
  }, []);

  const startStudy = useCallback(async () => {
    if (learningSessionId) {
      setActiveTab('study');
      return;
    }
    if (studyStarting) return;

    studyAbortRef.current?.abort();
    const controller = new AbortController();
    studyAbortRef.current = controller;
    setStudyStarting(true);
    setActiveTab('study');

    try {
      const due = await fetchDueVocabs(controller.signal);
      setLearningSessionId(null);
      if (due.length === 0) return;

      const session = await api.startLearningSession(notebookId, { signal: controller.signal });
      if (session.status === 'active') {
        setLearningSessionId(session.id);
      } else {
        setDueVocabs([]);
      }
    } catch (studyError) {
      if (controller.signal.aborted) return;
      console.warn('Failed to start study session:', studyError);
      setError('Không thể bắt đầu phiên học. Kiểm tra learning session API.');
      setActiveTab('notes');
    } finally {
      if (!controller.signal.aborted) setStudyStarting(false);
    }
  }, [fetchDueVocabs, learningSessionId, notebookId, studyStarting]);

  const showNotes = useCallback(() => {
    if (studyStarting) {
      studyAbortRef.current?.abort();
      setStudyStarting(false);
    }
    setActiveTab('notes');
  }, [studyStarting]);

  useEffect(() => {
    if (autoStartChecked.current || loading || authLoading || !user || !notebookId) return;
    const requestedNotebook = window.sessionStorage.getItem('laio:auto-study-notebook');
    if (requestedNotebook === notebookId) {
      autoStartChecked.current = true;
      window.sessionStorage.removeItem('laio:auto-study-notebook');
      void startStudy();
    }
  }, [authLoading, loading, notebookId, startStudy, user]);

  const filteredVocabs = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return vocabs.filter((vocab) => {
      const matchesSearch =
        !normalized ||
        vocab.word.toLowerCase().includes(normalized) ||
        vocab.meaning.toLowerCase().includes(normalized);
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'due' && isDue(vocab)) ||
        (activeFilter === 'mastered' && vocab.is_mastered);
      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, searchTerm, vocabs]);

  const replaceDueVocab = useCallback((nextVocab: Vocab) => {
    setDueVocabs((current) => {
      const withoutCurrent = current.filter((item) => item.id !== nextVocab.id);
      return isDue(nextVocab) ? [nextVocab, ...withoutCurrent] : withoutCurrent;
    });
  }, []);

  const getVocabAudioUrl = useCallback((id: string): Promise<string> => {
    const vocab = vocabById.current.get(id);
    if (!vocab) return Promise.reject(new Error('Vocabulary item was not found'));
    if (vocab.audio_url) return Promise.resolve(vocab.audio_url);

    const pendingRequest = audioRequests.current.get(id);
    if (pendingRequest) return pendingRequest;

    const request = api.generateVocabAudio(id)
      .then((audioUrl) => {
        generatedAudioUrls.current.add(audioUrl);
        const updateAudio = (items: Vocab[]) =>
          items.map((item) => item.id === id ? { ...item, audio_url: audioUrl } : item);
        setVocabs(updateAudio);
        setDueVocabs(updateAudio);
        return audioUrl;
      })
      .finally(() => {
        audioRequests.current.delete(id);
      });

    audioRequests.current.set(id, request);
    return request;
  }, []);

  useEffect(() => {
    const sourceVocabs = activeTab === 'study' ? dueVocabs : vocabs;
    const warmupIds = sourceVocabs
      .filter((vocab) => !vocab.audio_url && !audioRequests.current.has(vocab.id))
      .slice(0, 4)
      .map((vocab) => vocab.id);
    if (warmupIds.length === 0) return;

    let cancelled = false;
    const warmAudio = async () => {
      for (const id of warmupIds) {
        if (cancelled) return;
        try {
          await getVocabAudioUrl(id);
        } catch (warmupError) {
          // A background warm-up must never interrupt normal vocabulary use.
          console.warn('Could not warm vocabulary audio:', warmupError);
        }
      }
    };
    void warmAudio();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dueVocabs, getVocabAudioUrl, vocabs]);

  const speakVocab = useCallback(async (id: string) => {

    try {
      const audioUrl = await getVocabAudioUrl(id);

      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (audioError) {
      setError(`Không phát được audio: ${describeError(audioError)}`);
      throw audioError;
    }
  }, [getVocabAudioUrl]);

  const addVocab = useCallback(async (newVocab: VocabMutation) => {
    try {
      const created = await api.createVocab(notebookId, {
        word: newVocab.word,
        meaning: newVocab.meaning,
        pronunciation: newVocab.pronunciation,
        example_sentence: newVocab.example_sentence || '',
        difficulty_level: newVocab.difficulty_level,
        is_mastered: newVocab.is_mastered,
      });
      const nextVocab = mapVocab(created);
      setVocabs((current) => [nextVocab, ...current]);
      replaceDueVocab(nextVocab);
      setNotebook((previous) => previous ? {
        ...previous,
        totalVocabs: previous.totalVocabs + 1,
        masteredVocabs: previous.masteredVocabs + (nextVocab.is_mastered ? 1 : 0),
        dueVocabs: previous.dueVocabs + (isDue(nextVocab) ? 1 : 0),
      } : previous);
    } catch (createError) {
      console.warn('Failed to add vocab:', createError);
      setError(`Thêm từ thất bại: ${describeError(createError)}`);
      throw createError;
    }
  }, [notebookId, replaceDueVocab]);

  const updateVocab = useCallback(async (id: string, data: Partial<VocabMutation>) => {
    try {
      const updated = await api.updateVocab(id, data);
      const nextVocab = mapVocab(updated);
      setVocabs((current) => {
        const next = current.map((item) => item.id === id ? nextVocab : item);
        rebuildNotebookStats(next);
        return next;
      });
      replaceDueVocab(nextVocab);
    } catch (updateError) {
      console.warn('Failed to update vocab:', updateError);
      setError(`Cập nhật thất bại: ${describeError(updateError)}`);
      throw updateError;
    }
  }, [rebuildNotebookStats, replaceDueVocab]);

  const deleteVocab = useCallback(async (id: string) => {
    if (!window.confirm('Xóa từ này?')) return;
    try {
      await api.deleteVocab(id);
      setVocabs((current) => {
        const next = current.filter((item) => item.id !== id);
        rebuildNotebookStats(next);
        return next;
      });
      setDueVocabs((current) => current.filter((item) => item.id !== id));
    } catch (deleteError) {
      console.warn('Failed to delete vocab:', deleteError);
      setError(`Xóa thất bại: ${describeError(deleteError)}`);
    }
  }, [rebuildNotebookStats]);

  const toggleMaster = useCallback(async (id: string) => {
    const vocab = vocabs.find((item) => item.id === id);
    if (!vocab) return;
    await updateVocab(id, { is_mastered: !vocab.is_mastered });
  }, [updateVocab, vocabs]);

  const handleReview = useCallback(async (id: string, score: number, timeSpentMs: number) => {
    if (!learningSessionId) throw new Error('Learning session is not ready');
    await api.submitLearningAnswer(learningSessionId, {
      vocab_item_id: id,
      score,
      review_type: 'flashcard',
      time_spent_ms: timeSpentMs,
    });
  }, [learningSessionId]);

  const completeStudy = useCallback(async () => {
    if (!learningSessionId) return;
    await api.completeLearningSession(learningSessionId);
    setLearningSessionId(null);
    try {
      await refreshVocabData();
    } catch (refreshError) {
      console.warn('Study completed, but the vocabulary refresh failed:', refreshError);
      setError('Phiên học đã hoàn tất, nhưng danh sách chưa kịp cập nhật. Tải lại notebook để xem dữ liệu mới.');
    }
  }, [learningSessionId, refreshVocabData]);

  const exitStudy = useCallback(async () => {
    studyAbortRef.current?.abort();
    const activeSessionId = learningSessionId;
    setActiveTab('notes');
    setLearningSessionId(null);
    if (!activeSessionId) return;
    try {
      await api.abandonLearningSession(activeSessionId);
    } catch (abandonError) {
      console.warn('Failed to abandon learning session:', abandonError);
    }
  }, [learningSessionId]);

  const masteredPercent = notebook?.totalVocabs
    ? Math.round((notebook.masteredVocabs / notebook.totalVocabs) * 100)
    : 0;

  return (
    <AppShell title={notebook?.title || 'Notebook'} userEmail={user?.email}>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-xl shadow-indigo-100/50">
          <div className="p-6 sm:p-8 lg:p-10">
            <button
              type="button"
              onClick={() => router.push('/notebooks')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Notebook workspace
                </div>
                <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {notebook?.title || 'Loading notebook'}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  {notebook?.description || 'Add vocabulary, review due words, and keep the SRS schedule moving.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={!notebook}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add word
                </button>
                <button
                  type="button"
                  onClick={() => void startStudy()}
                  disabled={!notebook || studyStarting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {studyStarting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Zap className="h-4 w-4" aria-hidden="true" />}
                  Start Learning
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            {notebook ? <StatsCard notebook={notebook} /> : <NotebookStatsSkeleton />}
            <QuickActions />
            {notebook ? (
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-200/60">
                <p className="text-sm font-black text-slate-950">Mastery snapshot</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
                    <span className="text-xl font-black text-indigo-700">{masteredPercent}%</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700">{notebook.masteredVocabs} mastered</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{notebook.dueVocabs} words due today.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60" aria-label="Loading mastery snapshot">
                <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-5 flex items-center gap-4">
                  <div className="h-20 w-20 animate-pulse rounded-full bg-indigo-50" />
                  <div className="flex-1">
                    <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-3 h-3 w-36 animate-pulse rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            )}
          </aside>

          <section className="space-y-5">
            <div className="flex overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-2 shadow-sm shadow-slate-200/60" role="tablist" aria-label="Notebook views">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'notes'}
                onClick={showNotes}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-all ${activeTab === 'notes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Vocabulary ({loading && !vocabLoaded ? '…' : filteredVocabs.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'study'}
                onClick={() => void startStudy()}
                disabled={!notebook || loading || studyStarting}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-60 ${activeTab === 'study' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                {studyStarting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarClock className="h-4 w-4" aria-hidden="true" />}
                Review ({loading && !dueLoaded ? '…' : dueVocabs.length})
              </button>
            </div>

            {error && (
              <div className="flex flex-col gap-3 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700 sm:flex-row sm:items-center sm:justify-between" role="alert">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setReloadToken((current) => current + 1)}
                  disabled={loading}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-3 py-2 text-xs font-black text-red-700 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            )}

            <div hidden={activeTab !== 'notes'} aria-hidden={activeTab !== 'notes'}>
              <div className="space-y-5">
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
                {!vocabLoaded && loading ? <VocabularyLoadingState /> : null}
                {!vocabLoaded && !loading ? (
                  <div className="rounded-3xl border border-amber-100 bg-amber-50 p-8 text-center" role="alert">
                    <BookOpen className="mx-auto h-8 w-8 text-amber-600" aria-hidden="true" />
                    <h3 className="mt-4 text-lg font-black text-slate-950">Vocabulary is unavailable</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                      The vocabulary endpoint did not respond. Retry to load the list without losing the rest of the notebook.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReloadToken((current) => current + 1)}
                      className="mt-5 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
                    >
                      Retry vocabulary
                    </button>
                  </div>
                ) : null}
                {vocabLoaded ? (
                <VocabList
                  vocabs={filteredVocabs}
                  loading={false}
                  onToggleMaster={toggleMaster}
                  onEdit={setEditingVocab}
                  onDelete={deleteVocab}
                  onCreate={() => setIsAddModalOpen(true)}
                  onSpeak={speakVocab}
                />
                ) : null}
              </div>
            </div>

            <div hidden={activeTab !== 'study'} aria-hidden={activeTab !== 'study'}>
              <StudyMode
                dueVocabs={dueVocabs}
                sessionReady={Boolean(learningSessionId) || dueVocabs.length === 0}
                starting={studyStarting}
                onReview={handleReview}
                onComplete={completeStudy}
                onBackToNotes={exitStudy}
                onSpeak={speakVocab}
              />
            </div>
          </section>
        </div>
      </div>

      <AddVocabModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addVocab} />
      {editingVocab && (
        <AddVocabModal
          isOpen
          onClose={() => setEditingVocab(null)}
          onAdd={(data) => updateVocab(editingVocab.id, data)}
          editingVocab={editingVocab}
        />
      )}
    </AppShell>
  );
}
