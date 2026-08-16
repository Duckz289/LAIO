import { isSupabaseConfigured, supabase, supabaseConfigError } from "./supabase";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api/backend";

export interface NotebookRecord {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  vocab_count: number;
  mastered_count: number;
  due_count: number;
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

export interface VocabWriteInput {
  word?: string;
  meaning?: string;
  pronunciation?: string | null;
  example_sentence?: string;
  audio_url?: string;
  image_url?: string;
  pos?: string | null;
  difficulty_level?: number;
  is_mastered?: boolean;
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
  total_notebooks: number;
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

function readApiDetail(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const messages = value
      .map((item) => readApiDetail(item))
      .filter((message): message is string => Boolean(message));
    return messages.length > 0 ? messages.join("; ") : undefined;
  }
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  return (
    readApiDetail(record.msg) ??
    readApiDetail(record.message) ??
    readApiDetail(record.detail) ??
    readApiDetail(record.error)
  );
}

async function getHeaders(forceRefresh = false): Promise<Headers> {
  if (!isSupabaseConfigured) {
    throw new ApiError(500, supabaseConfigError);
  }

  const { data, error } = forceRefresh
    ? await refreshSessionOnce()
    : await supabase.auth.getSession();
  if (error) throw new ApiError(401, error.message);
  if (!data.session?.access_token) {
    throw new ApiError(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  return headers;
}

let refreshPromise: ReturnType<typeof supabase.auth.refreshSession> | null = null;

function refreshSessionOnce() {
  if (!refreshPromise) {
    refreshPromise = supabase.auth.refreshSession().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const send = async (forceRefresh = false) => {
    const headers = new Headers(init.headers);
    const authHeaders = await getHeaders(forceRefresh);
    authHeaders.forEach((value, key) => headers.set(key, value));
    return fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  };

  let response: Response;
  try {
    response = await send();
    if (response.status === 401) {
      response = await send(true);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(
      0,
      "Không thể kết nối tới máy chủ. Kiểm tra backend/API URL rồi thử lại.",
    );
  }

  if (!response.ok) {
    const rawBody = await response.text();
    let payload: unknown = null;
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      payload = null;
    }
    const fallbackBody = rawBody.trim();
    const detail =
      readApiDetail(payload) ??
      (fallbackBody && !fallbackBody.startsWith("<") ? fallbackBody : undefined);
    throw new ApiError(
      response.status,
      detail || `${init.method ?? "GET"} ${path} failed with HTTP ${response.status}`,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function get<T>(path: string, options?: Pick<RequestInit, "signal">): Promise<T> {
  return request<T>(path, { method: "GET", ...options });
}

function post<T>(
  path: string,
  body?: unknown,
  options?: Pick<RequestInit, "signal">,
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    ...options,
  });
}

function patch<T>(
  path: string,
  body?: unknown,
  options?: Pick<RequestInit, "signal">,
): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
    ...options,
  });
}

function del<T>(path: string, options?: Pick<RequestInit, "signal">): Promise<T> {
  return request<T>(path, { method: "DELETE", ...options });
}

async function postAudio(path: string): Promise<string> {
  const send = async (forceRefresh = false) => {
    const headers = await getHeaders(forceRefresh);
    return fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      cache: "no-store",
    });
  };

  let response: Response;
  try {
    response = await send();
    if (response.status === 401) response = await send(true);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Không thể kết nối tới máy chủ để tạo audio.");
  }

  if (!response.ok) {
    const rawBody = await response.text();
    let payload: unknown = null;
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      payload = null;
    }
    throw new ApiError(
      response.status,
      readApiDetail(payload) || "Không thể tạo audio bằng VBEE.",
    );
  }

  const blob = await response.blob();
  if (blob.size === 0) throw new ApiError(502, "VBEE trả về audio rỗng.");
  return URL.createObjectURL(blob);
}

export const api = {
  getNotebooks: (options?: Pick<RequestInit, "signal">) =>
    get<{
      notebooks: NotebookRecord[];
      total: number;
      limit: number;
      offset: number;
    }>("/notebooks?limit=200", options),
  getNotebook: (id: string, options?: Pick<RequestInit, "signal">) =>
    get<NotebookRecord>(`/notebooks/${id}`, options),
  createNotebook: (body: { title: string; description?: string }) =>
    post<NotebookRecord>("/notebooks", body),
  deleteNotebook: (id: string, options?: Pick<RequestInit, "signal">) =>
    del<void>(`/notebooks/${id}`, options),
  getVocabs: (
    notebookId: string,
    options?: Pick<RequestInit, "signal"> & { limit?: number; offset?: number },
  ) => {
    const limit = Math.min(200, Math.max(1, options?.limit ?? 100));
    const offset = Math.max(0, options?.offset ?? 0);
    return get<{
      vocab_items: VocabRecord[];
      total: number;
      limit: number;
      offset: number;
    }>(
      `/vocab-items/notebook/${encodeURIComponent(notebookId)}?limit=${limit}&offset=${offset}`,
      { signal: options?.signal },
    );
  },
  searchVocabs: (
    notebookId: string,
    query: string,
    options?: Pick<RequestInit, "signal">,
  ) =>
    get<{
      vocab_items: VocabRecord[];
      total: number;
      limit: number;
      offset: number;
    }>(
      `/vocab-items/notebook/${encodeURIComponent(notebookId)}/search?q=${encodeURIComponent(query)}&limit=200`,
      options,
    ),
  createVocab: (
    notebookId: string,
    body: Required<Pick<VocabWriteInput, "word" | "meaning">> & VocabWriteInput,
  ) => post<VocabRecord>(
    `/vocab-items/?notebook_id=${encodeURIComponent(notebookId)}`,
    body,
  ),
  updateVocab: (id: string, body: VocabWriteInput, options?: Pick<RequestInit, "signal">) =>
    patch<VocabRecord>(`/vocab-items/${encodeURIComponent(id)}`, body, options),
  deleteVocab: (id: string, options?: Pick<RequestInit, "signal">) =>
    del<void>(`/vocab-items/${id}`, options),
  generateVocabAudio: (id: string) => postAudio(`/vocab-items/${id}/audio`),
  getDueReviews: (notebookId?: string, options?: Pick<RequestInit, "signal">) =>
    get<{ items: DueReviewItem[]; total: number }>(
      `/reviews/due${notebookId ? `?notebook_id=${notebookId}` : ""}`,
      options,
    ),
  startLearningSession: (notebookId?: string, options?: Pick<RequestInit, "signal">) =>
    post<LearningSession>("/learning-sessions", {
      notebook_id: notebookId ?? null,
      limit: 20,
      skill_type: "vocabulary",
    }, options),
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
  abandonLearningSession: (sessionId: string) =>
    post<LearningSession>(`/learning-sessions/${sessionId}/abandon`),
  getProgressSummary: (options?: Pick<RequestInit, "signal">) =>
    get<ProgressSummary>("/progress/summary", options),
};
