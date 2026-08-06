"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError, NotebookRecord, ProgressSummary } from "@/lib/api";

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
    if (!confirm("Xóa sổ tay này? Toàn bộ từ vựng bên trong cũng sẽ bị xóa.")) return;
    try {
      await api.deleteNotebook(id);
      setNotebooks((current) => current.filter((notebook) => notebook.id !== id));
    } catch (deleteError) {
      console.error("Failed to delete notebook:", deleteError);
      setError("Xóa sổ tay thất bại. Vui lòng thử lại.");
    }
  };

  const startReview = () => {
    const firstNotebook = notebooks[0];
    if (!firstNotebook) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("laio:auto-study-notebook", firstNotebook.id);
    }
    router.push(`/notebooks/${firstNotebook.id}`);
  };

  const todayDue = progress?.due_today ?? 0;
  const completionRate = progress?.total_vocabulary
    ? Math.max(0, Math.min(100, Math.round(((progress.total_vocabulary - todayDue) / progress.total_vocabulary) * 100)))
    : 0;

  return (
    <AppShell title="LAIO Dashboard" userEmail={user?.email}>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-xl shadow-indigo-100/50">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.65fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" />
                Modern study dashboard
              </div>
              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Good day, {getDisplayName(user?.email)}. Ready for today’s review?
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Quản lý sổ tay, theo dõi tiến độ và vào phiên ôn tập SRS bằng flow hiện có của LAIO.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={startReview}
                  disabled={notebooks.length === 0 || authLoading || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  Start Review
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Notebook
                </button>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-xl shadow-indigo-200">
              <p className="text-sm font-semibold text-indigo-100">Today’s focus</p>
              <div className="mt-8 flex items-end justify-between">
                <div>
                  <p className="text-5xl font-black">{todayDue}</p>
                  <p className="mt-1 text-sm text-indigo-100">words due</p>
                </div>
                <div className="rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur">
                  <p className="text-lg font-black">{completionRate}%</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-100">clear</p>
                </div>
              </div>
              <div className="mt-5 h-3 rounded-full bg-white/20">
                <div
                  className="h-3 rounded-full bg-white transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const rawValue = progress?.[stat.key] ?? 0;
            const value = stat.key === "accuracy_percentage" ? `${rawValue}%` : rawValue;
            return (
              <div
                key={stat.key}
                className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-sm shadow-slate-200/70"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{stat.helper}</span>
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-500">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-200/50 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Your notebooks</h2>
              <p className="mt-1 text-sm text-slate-500">
                {notebooks.length} notebook{notebooks.length === 1 ? "" : "s"} connected to the current account.
              </p>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notebook..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <p className="font-bold">Load failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {authLoading || loading ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-3xl border border-slate-100 bg-slate-100/70" />
              ))}
            </div>
          ) : filteredNotebooks.length === 0 ? (
            <div className="mx-auto mt-10 flex max-w-lg flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-black text-slate-950">
                {notebooks.length === 0 ? "No notebooks yet" : "No matching notebook"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {notebooks.length === 0
                  ? "Tạo sổ tay đầu tiên để thêm từ vựng và bắt đầu ôn tập theo lịch."
                  : "Thử đổi từ khóa tìm kiếm hoặc xoá bộ lọc hiện tại."}
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create first notebook
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredNotebooks.map((notebook) => {
                const totalWords = notebook.vocab_count ?? notebook.total_vocabulary ?? 0;
                const dueCount = notebook.due_count ?? 0;
                const progressPercent = notebookProgress(notebook);

                return (
                  <article
                    key={notebook.id}
                    className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <button
                        onClick={() => router.push(`/notebooks/${notebook.id}`)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <h3 className="truncate text-lg font-black text-slate-950 transition-colors group-hover:text-indigo-700">
                          {notebook.title}
                        </h3>
                        <p className="mt-2 min-h-[42px] text-sm leading-6 text-slate-500">
                          {notebook.description || "No description yet. Open this notebook to add vocabulary."}
                        </p>
                      </button>
                      <button
                        onClick={() => handleDeleteNotebook(notebook.id)}
                        className="rounded-2xl p-2 text-slate-300 transition-all hover:bg-red-50 hover:text-red-600"
                        title="Delete notebook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Words</p>
                        <p className="mt-1 text-xl font-black text-slate-950">{totalWords}</p>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-500">Due</p>
                        <p className="mt-1 text-xl font-black text-amber-700">{dueCount}</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs font-semibold text-slate-400">
                        Updated {formatDate(notebook.updated_at)}
                      </span>
                      <button
                        onClick={() => router.push(`/notebooks/${notebook.id}`)}
                        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-50"
                      >
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
            aria-label="Close create notebook modal"
          />
          <div className="relative z-10 w-full max-w-lg animate-zoomIn rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 rounded-2xl bg-slate-100 p-2 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pr-10">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Plus className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Create notebook</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Gom từ vựng theo IELTS, TOEIC, trường học hoặc chủ đề riêng.
              </p>
            </div>

            <form onSubmit={handleCreateNotebook} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Title</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="IELTS Academic Vocabulary"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Words for Writing Task 1, school exams, or daily review..."
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              {createError && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
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
        </div>
      )}
    </AppShell>
  );
}
