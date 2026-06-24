import { supabase } from "./supabase";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export interface NotebookRecord {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface VocabRecord {
  id: string;
  notebook_id: string;
  word: string;
  meaning: string;
  pronunciation: string | null;
  example_sentence: string;
  audio_url: string;
  image_url: string;
  pos: string | null;
  difficulty_level: number;
  is_mastered: boolean;
  created_at: string;
  updated_at: string;
  next_review_date: string | null;
  repetition_count: number;
  interval_days: number;
  ease_factor: number;
}

export interface LearningSession {
  id: string;
  notebook_id: string | null;
  skill_type: "vocabulary";
  status: "active" | "completed" | "abandoned";
  planned_items: number;
  answered_items: number;
  correct_answers: number;
  accuracy_percentage: number;
  started_at: string;
  completed_at: string | null;
}

export interface DueReviewItem {
  vocab_item_id: string;
  notebook_id: string;
  word: string;
  meaning: string;
  pronunciation: string | null;
  example_sentence: string;
  audio_url: string;
  image_url: string;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  next_review_date: string;
  last_reviewed_at: string | null;
}

export interface ProgressSummary {
  total_vocabulary: number;
  due_today: number;
  reviews_completed: number;
  correct_reviews: number;
  accuracy_percentage: number;
  current_streak_days: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getHeaders(): Promise<HeadersInit> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return headers;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: await getHeaders(),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new ApiError(
      response.status,
      payload?.detail ?? `${init.method ?? "GET"} ${path} failed`,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export const api = {
  get,
  post,
  put,
  patch,
  delete: del,
  getNotebooks: () =>
    get<{ notebooks: NotebookRecord[]; total: number }>("/notebooks/"),
  getNotebook: (id: string) => get<NotebookRecord>(`/notebooks/${id}`),
  createNotebook: (body: { title: string; description?: string }) =>
    post<NotebookRecord>("/notebooks/", body),
  deleteNotebook: (id: string) => del<void>(`/notebooks/${id}`),
  getVocabs: (notebookId: string) =>
    get<{ vocab_items: VocabRecord[]; total: number }>(
      `/vocab-items/notebook/${notebookId}`,
    ),
  createVocab: (
    notebookId: string,
    body: Pick<VocabRecord, "word" | "meaning"> &
      Partial<
        Pick<
          VocabRecord,
          "pronunciation" | "example_sentence" | "difficulty_level"
        >
      >,
  ) => post<VocabRecord>(`/vocab-items/?notebook_id=${notebookId}`, body),
  updateVocab: (id: string, body: Partial<VocabRecord>) =>
    put<VocabRecord>(`/vocab-items/${id}`, body),
  deleteVocab: (id: string) => del<void>(`/vocab-items/${id}`),
  getDueReviews: (notebookId?: string) =>
    get<{ items: DueReviewItem[]; total: number }>(
      `/reviews/due${notebookId ? `?notebook_id=${notebookId}` : ""}`,
    ),
  startLearningSession: (notebookId?: string) =>
    post<LearningSession>("/learning-sessions", {
      notebook_id: notebookId ?? null,
      limit: 20,
      skill_type: "vocabulary",
    }),
  submitLearningAnswer: (
    sessionId: string,
    body: {
      vocab_item_id: string;
      score: number;
      review_type: "flashcard";
      time_spent_ms?: number;
    },
  ) =>
    post<{
      review_id: string;
      correct: boolean;
      schedule: {
        ease_factor: number;
        interval_days: number;
        repetition_count: number;
        next_review_date: string;
      };
      session: LearningSession;
    }>(`/learning-sessions/${sessionId}/answers`, body),
  completeLearningSession: (sessionId: string) =>
    post<LearningSession>(`/learning-sessions/${sessionId}/complete`),
  getProgressSummary: () => get<ProgressSummary>("/progress/summary"),
};
