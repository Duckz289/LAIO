"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

import AnimatedModal from "@/components/AnimatedModal";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError, NotebookRecord, ProgressSummary } from "@/lib/api";
import { listContainer, listItem } from "@/lib/motionVariants";

type NotebookCardRecord = NotebookRecord & {
  vocab_count?: number;
  total_vocabulary?: number;
  mastered_count?: number;
  due_count?: number;
};

const statCards = [
  {
    label: "Total words",
    key: "total_vocabulary",
    icon: BookOpen,
    helper: "Vocabulary stored",
  },
  {
    label: "Due today",
    key: "due_today",
    icon: CalendarClock,
    helper: "Needs review",
  },
  {
    label: "Accuracy",
    key: "accuracy_percentage",
    icon: Target,
    helper: "Correct answers",
  },
  {
    label: "Streak",
    key: "current_streak_days",
    icon: TrendingUp,
    helper: "Study days",
  },
] as const;

function getDisplayName(email?: string | null) {
  if (!email) return "learner";
  return email.split("@")[0] || "learner";
}

function formatDate(value?: string) {
  if (!value) return "No update";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function notebookProgress(notebook: NotebookCardRecord) {
  const total = notebook.vocab_count ?? notebook.total_vocabulary ?? 0;
  const mastered = notebook.mastered_count ?? 0;
  if (!total) return 0;
  return Math.min(100, Math.round((mastered / total) * 100));
}

export default function NotebooksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notebooks, setNotebooks] = useState<NotebookCardRecord[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotebooks = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const [response, summary] = await Promise.all([
        api.getNotebooks({ signal }),
        api.getProgressSummary({ signal }),
      ]);
      setNotebooks(response.notebooks || []);
      setProgress(summary);
    } catch (fetchError) {
      if (signal?.aborted) return;
      console.warn("Failed to load notebooks:", fetchError);
      setError("Không tải được dashboard. Kiểm tra backend/API URL hoặc đăng nhập lại.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const controller = new AbortController();
    void fetchNotebooks(controller.signal);
    return () => controller.abort();
  }, [authLoading, fetchNotebooks, user]);

  const filteredNotebooks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return notebooks;
    return notebooks.filter((notebook) => {
      return (
        notebook.title.toLowerCase().includes(normalized) ||
        (notebook.description || "").toLowerCase().includes(normalized)
      );
    });
  }, [notebooks, query]);

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreateError(null);
    setSubmitting(true);

    try {
      const createdNotebook = await api.createNotebook({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setTitle("");
      setDescription("");
      setIsModalOpen(false);
      setNotebooks((current) => [createdNotebook, ...current]);
      setProgress((current) => current ? {
        ...current,
        total_notebooks: current.total_notebooks + 1,
      } : current);
    } catch (createError) {
      console.warn("Failed to create notebook:", createError);
      setCreateError(
        createError instanceof ApiError
          ? createError.message
          : "Không thể tạo sổ tay. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotebook = async (id: string) => {
    if (deletingId) return;
    if (!confirm("Xóa sổ tay này? Toàn bộ từ vựng bên trong cũng sẽ bị xóa.")) return;
    const deletedNotebook = notebooks.find((notebook) => notebook.id === id);
    try {
      setDeletingId(id);
      await api.deleteNotebook(id);
      setNotebooks((current) => current.filter((notebook) => notebook.id !== id));
      setProgress((current) => current ? {
        ...current,
        total_notebooks: Math.max(0, current.total_notebooks - 1),
        total_vocabulary: Math.max(
          0,
          current.total_vocabulary - (deletedNotebook?.vocab_count ?? 0),
        ),
        due_today: Math.max(
          0,
          current.due_today - (deletedNotebook?.due_count ?? 0),
        ),
      } : current);
    } catch (deleteError) {
      console.error("Failed to delete notebook:", deleteError);
      setError("Xóa sổ tay thất bại. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  };

  const startReview = () => {
    const dueNotebook = notebooks.find((notebook) => notebook.due_count > 0);
    if (!dueNotebook) return;
    window.sessionStorage.setItem("laio:auto-study-notebook", dueNotebook.id);
    router.push(`/notebooks/${dueNotebook.id}`);
  };

  const todayDue = progress?.due_today ?? 0;
  const completionRate = progress?.total_vocabulary
    ? Math.max(0, Math.min(100, Math.round(((progress.total_vocabulary - todayDue) / progress.total_vocabulary) * 100)))
    : 0;

  return (
    <AppShell title="LAIO Dashboard" userEmail={user?.email}>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#173f3420] bg-white shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.65fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#173f3433] bg-[#fff4c566] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-brand-forest">
                <Sparkles className="h-3.5 w-3.5" />
                Modern study dashboard
              </div>
              <h1 className="landing-display mt-5 max-w-3xl text-3xl font-black tracking-[-0.035em] text-brand-forest sm:text-5xl">
                Good day, {getDisplayName(user?.email)}. Ready for today’s review?
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-subtle sm:text-base">
                Quản lý sổ tay, theo dõi tiến độ và vào phiên ôn tập SRS bằng flow hiện có của LAIO.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={startReview}
                  disabled={todayDue === 0 || authLoading || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-forest px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-brand-forest-dark disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  Start Review
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#173f3440] bg-white px-5 py-3 text-sm font-black text-brand-forest transition-all hover:-translate-y-0.5 hover:border-brand-forest hover:bg-[#fff4c54d]"
                >
                  <Plus className="h-4 w-4" />
                  Create Notebook
                </button>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-brand-forest p-5 text-white shadow-sm">
              <p className="text-sm font-semibold text-[#dbe7df]">Today’s focus</p>
              <div className="mt-8 flex items-end justify-between">
                <div>
                  <p className="landing-display text-5xl font-black">{todayDue}</p>
                  <p className="mt-1 text-sm text-[#dbe7df]">words due</p>
                </div>
                <div className="rounded-2xl bg-brand-cream px-3 py-2 text-right text-brand-forest">
                  <p className="text-lg font-black">{completionRate}%</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide">clear</p>
                </div>
              </div>
              <div className="mt-5 h-3 rounded-full bg-white/20">
                <div
                  className="h-3 rounded-full bg-brand-cream transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <motion.section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          variants={listContainer}
          initial="hidden"
          animate="visible"
        >
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const rawValue = progress?.[stat.key] ?? 0;
            const value = stat.key === "accuracy_percentage" ? `${rawValue}%` : rawValue;
            return (
              <motion.div
                key={stat.key}
                variants={listItem}
                className="rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-brand-sand p-3 text-brand-forest">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-brand-faint">{stat.helper}</span>
                </div>
                <p className="mt-5 text-sm font-semibold text-brand-subtle">{stat.label}</p>
                <p className="landing-display mt-1 text-3xl font-black text-brand-forest">{value}</p>
              </motion.div>
            );
          })}
        </motion.section>

        <section className="rounded-[2rem] border border-[#173f3420] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="landing-display text-2xl font-black tracking-[-0.035em] text-brand-forest">Your notebooks</h2>
              <p className="mt-1 text-sm text-brand-subtle">
                {notebooks.length} notebook{notebooks.length === 1 ? "" : "s"} connected to the current account.
              </p>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-faint" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notebook..."
                className="w-full rounded-2xl border-2 border-[#173f3430] bg-white py-3 pl-11 pr-4 text-sm font-medium text-brand-forest outline-none transition-colors placeholder:text-brand-faint focus:border-brand-forest"
              />
            </div>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border-2 border-brand-accent-soft bg-brand-error-bg p-4 text-sm font-semibold text-brand-accent-deep">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <p className="font-bold">Load failed</p>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchNotebooks()}
                  disabled={loading}
                  className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm disabled:opacity-50"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {authLoading || loading ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-3xl bg-brand-sand" />
              ))}
            </div>
          ) : filteredNotebooks.length === 0 ? (
            <div className="mx-auto mt-10 flex max-w-lg flex-col items-center rounded-3xl border-2 border-dashed border-[#173f3435] bg-brand-sand p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cream text-brand-forest shadow-sm">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="landing-display mt-5 text-lg font-black text-brand-forest">
                {notebooks.length === 0 ? "No notebooks yet" : "No matching notebook"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-brand-subtle">
                {notebooks.length === 0
                  ? "Tạo sổ tay đầu tiên để thêm từ vựng và bắt đầu ôn tập theo lịch."
                  : "Thử đổi từ khóa tìm kiếm hoặc xoá bộ lọc hiện tại."}
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-forest px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-brand-forest-dark"
              >
                <Plus className="h-4 w-4" />
                Create first notebook
              </button>
            </div>
          ) : (
            <motion.div
              className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              variants={listContainer}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
              {filteredNotebooks.map((notebook) => {
                const totalWords = notebook.vocab_count ?? notebook.total_vocabulary ?? 0;
                const dueCount = notebook.due_count ?? 0;
                const progressPercent = notebookProgress(notebook);

                return (
                  <motion.article
                    key={notebook.id}
                    layout
                    variants={listItem}
                    exit="exit"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="group rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm transition-colors hover:border-brand-forest"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <button
                        onClick={() => router.push(`/notebooks/${notebook.id}`)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cream text-brand-forest shadow-sm transition-colors group-hover:bg-brand-forest group-hover:text-white">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <h3 className="landing-display truncate text-lg font-black tracking-[-0.03em] text-brand-forest">
                          {notebook.title}
                        </h3>
                        <p className="mt-2 min-h-[42px] text-sm leading-6 text-brand-subtle">
                          {notebook.description || "No description yet. Open this notebook to add vocabulary."}
                        </p>
                      </button>
                      <button
                        onClick={() => handleDeleteNotebook(notebook.id)}
                        disabled={deletingId !== null}
                        className="rounded-2xl p-2 text-brand-faint transition-colors hover:bg-brand-error-bg hover:text-brand-accent-dark"
                        title="Delete notebook"
                      >
                        {deletingId === notebook.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-brand-sand p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-brand-faint">Words</p>
                        <p className="mt-1 text-xl font-black text-brand-forest">{totalWords}</p>
                      </div>
                      <div className="rounded-2xl bg-brand-warn-bg p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-brand-warn">Due</p>
                        <p className="mt-1 text-xl font-black text-brand-warn">{dueCount}</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs font-bold text-brand-faint">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-brand-sand">
                        <div
                          className="h-2 rounded-full bg-brand-forest transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#173f3420] pt-4">
                      <span className="text-xs font-semibold text-brand-faint">
                        Updated {formatDate(notebook.updated_at)}
                      </span>
                      <button
                        onClick={() => router.push(`/notebooks/${notebook.id}`)}
                        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-brand-forest transition-colors hover:bg-brand-sand"
                      >
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </div>

      <AnimatedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        closeLabel="Close create notebook modal"
        closeDisabled={submitting}
        panelClassName="max-w-lg"
      >
          <div className="rounded-[30px] bg-brand-paper p-6 shadow-xl shadow-[#0d2b24]/15">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="absolute right-5 top-5 rounded-xl border-2 border-transparent p-2 text-brand-subtle transition-all hover:border-brand-forest hover:bg-brand-sand hover:text-brand-forest"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pr-10">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-brand-cream text-brand-forest shadow-sm">
                <Plus className="h-6 w-6" />
              </div>
              <h2 className="landing-display mt-4 text-2xl font-black tracking-[-0.035em] text-brand-forest">Create notebook</h2>
              <p className="mt-2 text-sm leading-6 text-brand-subtle">
                Gom từ vựng theo IELTS, TOEIC, trường học hoặc chủ đề riêng.
              </p>
            </div>

            <form onSubmit={handleCreateNotebook} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-brand-forest">Title</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="IELTS Academic Vocabulary"
                  className="mt-2 w-full rounded-xl border-2 border-[#173f3430] bg-white px-4 py-3 text-sm font-medium text-brand-forest outline-none transition-colors placeholder:text-brand-faint focus:border-brand-forest"
                  required
                  maxLength={255}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-brand-forest">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Words for Writing Task 1, school exams, or daily review..."
                  rows={3}
                  maxLength={5000}
                  className="mt-2 w-full resize-none rounded-xl border-2 border-[#173f3430] bg-white px-4 py-3 text-sm font-medium text-brand-forest outline-none transition-colors placeholder:text-brand-faint focus:border-brand-forest"
                />
              </div>

              {createError && (
                <div className="flex items-start gap-2 rounded-xl border-2 border-brand-accent-soft bg-brand-error-bg px-4 py-3 text-sm font-semibold text-brand-accent-deep">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 rounded-full border-2 border-[#173f3435] bg-white px-4 py-3 text-sm font-black text-brand-forest transition-colors hover:border-brand-forest hover:bg-brand-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="flex-1 rounded-full bg-brand-cream px-4 py-3 text-sm font-black text-brand-forest shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {submitting ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Create Notebook
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
      </AnimatedModal>
    </AppShell>
  );
}
