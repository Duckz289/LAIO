'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarClock, Loader2, Plus, Sparkles, Zap } from 'lucide-react';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError, DueReviewItem, LearningSession, VocabRecord } from '@/lib/api';

import AddVocabModal from './components/AddVocabModal';
import SearchBar from './components/SearchBar';
import StatsCard from './components/StatsCard';
import StudyMode from './components/StudyMode';
import VocabList from './components/VocabList';
import { Notebook, Vocab, VocabFilter, VocabMutation } from './types';

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function isDue(vocab: Vocab) {
  // Mastery is a user-facing label; the SRS schedule remains authoritative.
  return Boolean(vocab.next_review_date && vocab.next_review_date <= todayKey());
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
    cefr_level: record.cefr_level,
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
    cefr_level: null,
    is_mastered: false,
    next_review_date: item.next_review_date,
    repetition_count: item.repetition_count,
    interval_days: item.interval_days,
    ease_factor: item.ease_factor,
    created_at: item.last_reviewed_at ?? item.next_review_date,
    updated_at: item.last_reviewed_at ?? item.next_review_date,
  };
}

function matchesSearch(vocab: Vocab, query: string) {
  const normalized = query.trim().toLowerCase();
  return !normalized
    || vocab.word.toLowerCase().includes(normalized)
    || vocab.meaning.toLowerCase().includes(normalized);
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
    <div className="rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm" aria-label="Loading notebook statistics">
      <div className="h-4 w-32 animate-pulse rounded-full bg-brand-sand" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-[#173f3415] bg-brand-paper p-3">
            <div className="h-3 w-16 animate-pulse rounded-full bg-brand-sand" />
            <div className="mt-3 h-6 w-10 animate-pulse rounded-lg bg-brand-sand" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-2.5 animate-pulse rounded-full bg-brand-sand" />
    </div>
  );
}

function VocabularyLoadingState() {
  return (
    <div className="space-y-3" aria-label="Loading vocabulary">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="h-5 w-2/5 animate-pulse rounded-lg bg-brand-sand" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded-lg bg-brand-sand" />
            </div>
            <div className="h-9 w-20 animate-pulse rounded-xl bg-brand-sand" />
          </div>
          <div className="mt-5 h-12 animate-pulse rounded-2xl bg-brand-paper" />
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
  const [vocabTotal, setVocabTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dueVocabs, setDueVocabs] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [vocabLoaded, setVocabLoaded] = useState(false);
  const [dueLoaded, setDueLoaded] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'study'>('notes');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Vocab[] | null>(null);
  const [searching, setSearching] = useState(false);
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
    [...vocabs, ...dueVocabs, ...(searchResults ?? [])].forEach((vocab) => {
      next.set(vocab.id, vocab);
    });
    vocabById.current = next;
  }, [dueVocabs, searchResults, vocabs]);

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
        dueVocabs: notebookResult.value.due_count,
      });
    } else if (vocabList) {
      setNotebook((previous) => previous ?? {
        id: notebookId,
        title: 'Notebook',
        description: '',
        totalVocabs: 'value' in vocabResult ? vocabResult.value.total : vocabList.length,
        masteredVocabs: vocabList.filter((vocab) => vocab.is_mastered).length,
        dueVocabs: dueList?.length ?? vocabList.filter(isDue).length,
      });
    }

    if (vocabList) {
      setVocabs(vocabList);
      setVocabTotal(
        'value' in vocabResult ? vocabResult.value.total : vocabList.length,
      );
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
    const [notebookData, vocabData, dueData] = await Promise.all([
      api.getNotebook(notebookId),
      api.getVocabs(notebookId),
      api.getDueReviews(notebookId),
    ]);
    const vocabList = vocabData.vocab_items.map(mapVocab);
    setVocabs(vocabList);
    setVocabTotal(vocabData.total);
    setVocabLoaded(true);
    setDueVocabs(dueData.items.map(mapDueReview));
    setDueLoaded(true);
    setNotebook({
      id: notebookData.id,
      title: notebookData.title,
      description: notebookData.description || '',
      totalVocabs: notebookData.vocab_count,
      masteredVocabs: notebookData.mastered_count,
      dueVocabs: notebookData.due_count,
    });
  }, [notebookId]);

  const loadMoreVocabs = useCallback(async () => {
    if (loadingMore || vocabs.length >= vocabTotal) return;
    try {
      setLoadingMore(true);
      const data = await api.getVocabs(notebookId, {
        limit: 100,
        offset: vocabs.length,
      });
      const nextItems = data.vocab_items.map(mapVocab);
      setVocabs((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...nextItems.filter((item) => !existingIds.has(item.id)),
        ];
      });
      setVocabTotal(data.total);
    } catch (loadError) {
      setError(`Không tải được trang từ vựng tiếp theo: ${describeError(loadError)}`);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, notebookId, vocabTotal, vocabs.length]);

  useEffect(() => {
    if (notebookId && !authLoading && user) {
      const controller = new AbortController();
      void loadNotebook(controller.signal);
      return () => controller.abort();
    }
  }, [authLoading, loadNotebook, notebookId, reloadToken, user]);

  useEffect(() => {
    const normalized = searchTerm.trim();
    if (!normalized) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(() => {
      api.searchVocabs(notebookId, normalized, { signal: controller.signal })
        .then((data) => setSearchResults(data.vocab_items.map(mapVocab)))
        .catch((searchError) => {
          if (controller.signal.aborted) return;
          setError(`Tìm kiếm thất bại: ${describeError(searchError)}`);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [notebookId, searchTerm]);

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
    const source = searchResults ?? vocabs;
    return source.filter((vocab) => {
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'due' && isDue(vocab)) ||
        (activeFilter === 'mastered' && vocab.is_mastered);
      return matchesFilter;
    });
  }, [activeFilter, searchResults, vocabs]);

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
        cefr_level: newVocab.cefr_level,
        is_mastered: newVocab.is_mastered,
        ...(newVocab.audio_url ? { audio_url: newVocab.audio_url } : {}),
      });
      const nextVocab = mapVocab(created);
      setVocabs((current) => [nextVocab, ...current]);
      setSearchResults((current) => {
        if (!current || !matchesSearch(nextVocab, searchTerm)) return current;
        return [nextVocab, ...current];
      });
      setVocabTotal((current) => current + 1);
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
  }, [notebookId, replaceDueVocab, searchTerm]);

  const updateVocab = useCallback(async (id: string, data: Partial<VocabMutation>) => {
    try {
      const updated = await api.updateVocab(id, data);
      const nextVocab = mapVocab(updated);
      const previousVocab = vocabById.current.get(id);
      setVocabs((current) => current.map((item) => item.id === id ? nextVocab : item));
      setSearchResults((current) => {
        if (!current) return current;
        const withoutUpdated = current.filter((item) => item.id !== id);
        return matchesSearch(nextVocab, searchTerm)
          ? [nextVocab, ...withoutUpdated]
          : withoutUpdated;
      });
      if (previousVocab?.is_mastered !== nextVocab.is_mastered) {
        setNotebook((previous) => previous ? {
          ...previous,
          masteredVocabs: Math.max(
            0,
            previous.masteredVocabs + (nextVocab.is_mastered ? 1 : -1),
          ),
        } : previous);
      }
      replaceDueVocab(nextVocab);
    } catch (updateError) {
      console.warn('Failed to update vocab:', updateError);
      setError(`Cập nhật thất bại: ${describeError(updateError)}`);
      throw updateError;
    }
  }, [replaceDueVocab, searchTerm]);

  const deleteVocab = useCallback(async (id: string) => {
    if (!window.confirm('Xóa từ này?')) return;
    const deletedVocab = vocabById.current.get(id);
    try {
      await api.deleteVocab(id);
      setVocabs((current) => current.filter((item) => item.id !== id));
      setSearchResults((current) => current?.filter((item) => item.id !== id) ?? null);
      setVocabTotal((current) => Math.max(0, current - 1));
      setDueVocabs((current) => current.filter((item) => item.id !== id));
      setNotebook((previous) => previous ? {
        ...previous,
        totalVocabs: Math.max(0, previous.totalVocabs - 1),
        masteredVocabs: Math.max(
          0,
          previous.masteredVocabs - (deletedVocab?.is_mastered ? 1 : 0),
        ),
        dueVocabs: Math.max(
          0,
          previous.dueVocabs - (deletedVocab && isDue(deletedVocab) ? 1 : 0),
        ),
      } : previous);
    } catch (deleteError) {
      console.warn('Failed to delete vocab:', deleteError);
      setError(`Xóa thất bại: ${describeError(deleteError)}`);
    }
  }, []);

  const toggleMaster = useCallback(async (id: string) => {
    const vocab = vocabById.current.get(id);
    if (!vocab) return;
    await updateVocab(id, { is_mastered: !vocab.is_mastered });
  }, [updateVocab]);

  const handleReview = useCallback(async (id: string, score: number, timeSpentMs: number) => {
    if (!learningSessionId) throw new Error('Learning session is not ready');
    await api.submitLearningAnswer(learningSessionId, {
      vocab_item_id: id,
      score,
      review_type: 'flashcard',
      time_spent_ms: timeSpentMs,
    });
  }, [learningSessionId]);

  const completeStudy = useCallback(async (): Promise<LearningSession> => {
    if (!learningSessionId) throw new Error('Learning session is not ready');
    const completedSession = await api.completeLearningSession(learningSessionId);
    setLearningSessionId(null);
    try {
      await refreshVocabData();
    } catch (refreshError) {
      console.warn('Study completed, but the vocabulary refresh failed:', refreshError);
      setError('Phiên học đã hoàn tất, nhưng danh sách chưa kịp cập nhật. Tải lại notebook để xem dữ liệu mới.');
    }
    return completedSession;
  }, [learningSessionId, refreshVocabData]);

  const exitStudy = useCallback(async () => {
    studyAbortRef.current?.abort();
    const activeSessionId = learningSessionId;
    setStudyStarting(false);
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
        <section className="overflow-hidden rounded-[2rem] border border-[#173f3420] bg-white shadow-sm">
          <div className="p-6 sm:p-8 lg:p-10">
            <button
              type="button"
              onClick={() => router.push('/notebooks')}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#173f3440] bg-white px-4 py-2.5 text-sm font-black text-brand-forest transition-colors hover:border-brand-forest hover:bg-[#fff4c54d]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#173f3433] bg-[#fff4c566] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-brand-forest">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Notebook workspace
                </div>
                <h1 className="landing-display mt-5 text-3xl font-black tracking-[-0.035em] text-brand-forest sm:text-5xl">
                  {notebook?.title || 'Loading notebook'}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-subtle sm:text-base">
                  {notebook?.description || 'Add vocabulary, review due words, and keep the SRS schedule moving.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={!notebook}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#173f3440] bg-white px-5 py-4 text-sm font-black text-brand-forest transition-all hover:-translate-y-0.5 hover:border-brand-forest hover:bg-[#fff4c54d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add word
                </button>
                <button
                  type="button"
                  onClick={() => void startStudy()}
                  disabled={!notebook || studyStarting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-forest px-5 py-4 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-brand-forest-dark disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
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
            <div className="content-reveal">
              {notebook ? <StatsCard notebook={notebook} /> : <NotebookStatsSkeleton />}
            </div>
            {notebook ? (
              <div className="content-reveal rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm">
                <p className="text-sm font-black text-brand-forest">Mastery snapshot</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-cream-soft">
                    <span className="text-xl font-black text-brand-forest">{masteredPercent}%</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-brand-ink">{notebook.masteredVocabs} mastered</p>
                    <p className="mt-1 text-xs leading-5 text-brand-faint">{notebook.dueVocabs} words due today.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm" aria-label="Loading mastery snapshot">
                <div className="h-4 w-36 animate-pulse rounded-full bg-brand-sand" />
                <div className="mt-5 flex items-center gap-4">
                  <div className="h-20 w-20 animate-pulse rounded-full bg-brand-sand" />
                  <div className="flex-1">
                    <div className="h-4 w-28 animate-pulse rounded-full bg-brand-sand" />
                    <div className="mt-3 h-3 w-36 animate-pulse rounded-full bg-brand-sand" />
                  </div>
                </div>
              </div>
            )}
          </aside>

          <section className="space-y-5">
            <div className="flex overflow-hidden rounded-3xl border border-[#173f3420] bg-white p-2 shadow-sm" role="tablist" aria-label="Notebook views">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'notes'}
                onClick={() => void exitStudy()}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-all ${activeTab === 'notes' ? 'bg-brand-forest text-white' : 'text-brand-subtle hover:bg-brand-sand hover:text-brand-forest'}`}
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
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-60 ${activeTab === 'study' ? 'bg-brand-forest text-white' : 'text-brand-subtle hover:bg-brand-sand hover:text-brand-forest'}`}
              >
                {studyStarting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarClock className="h-4 w-4" aria-hidden="true" />}
                Review ({loading && !dueLoaded ? '…' : dueVocabs.length})
              </button>
            </div>

            {error && (
              <div className="flex flex-col gap-3 rounded-3xl border-2 border-brand-accent-soft bg-brand-error-bg p-4 text-sm font-semibold text-brand-accent-deep sm:flex-row sm:items-center sm:justify-between" role="alert">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setReloadToken((current) => current + 1)}
                  disabled={loading}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-3 py-2 text-xs font-black text-brand-accent-deep shadow-sm transition-colors hover:bg-brand-error-bg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            )}

            <div className="tab-panel" hidden={activeTab !== 'notes'} aria-hidden={activeTab !== 'notes'}>
              <div className="space-y-5">
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
                {!vocabLoaded && loading ? <VocabularyLoadingState /> : null}
                {!vocabLoaded && !loading ? (
                  <div className="rounded-3xl border-2 border-brand-warn-border bg-brand-warn-bg p-8 text-center" role="alert">
                    <BookOpen className="mx-auto h-8 w-8 text-brand-warn" aria-hidden="true" />
                    <h3 className="landing-display mt-4 text-lg font-black text-brand-forest">Vocabulary is unavailable</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-muted">
                      The vocabulary endpoint did not respond. Retry to load the list without losing the rest of the notebook.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReloadToken((current) => current + 1)}
                      className="mt-5 rounded-full bg-brand-forest px-5 py-3 text-sm font-black text-white transition-colors hover:bg-brand-forest-dark"
                    >
                      Retry vocabulary
                    </button>
                  </div>
                ) : null}
                {vocabLoaded ? (
                <VocabList
                  vocabs={filteredVocabs}
                  loading={searching}
                  onToggleMaster={toggleMaster}
                  onEdit={setEditingVocab}
                  onDelete={deleteVocab}
                  onCreate={() => setIsAddModalOpen(true)}
                  onSpeak={speakVocab}
                  hasMore={!searchTerm.trim() && vocabs.length < vocabTotal}
                  loadingMore={loadingMore}
                  onLoadMore={loadMoreVocabs}
                />
                ) : null}
              </div>
            </div>

            <div className="tab-panel" hidden={activeTab !== 'study'} aria-hidden={activeTab !== 'study'}>
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
