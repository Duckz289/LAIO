import { supabase } from "./supabase";

const BASE_URL = "http://127.0.0.1:8000/api/v1";

const SUPABASE_TOKEN_KEY = "sb-cxuomrnhvpgigcebjzyh-auth-token";

async function getHeaders(): Promise<HeadersInit> {
  let token: string | null = null;

  // Ưu tiên 1: Lấy token từ localStorage
  try {
    const raw = localStorage.getItem(SUPABASE_TOKEN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      token = parsed?.access_token ?? null;
    }
  } catch (e) {
    console.warn("[api] Không parse được token từ localStorage:", e);
  }

  // Ưu tiên 2: Fallback sang supabase.auth.getSession()
  if (!token) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? null;
    } catch (e) {
      console.warn("[api] Không lấy được session từ Supabase:", e);
    }
  }

  if (token) {
    console.log("[api] ✅ Có token — sẽ gửi Authorization header");
  } else {
    console.warn("[api] ❌ Không có token — request sẽ bị 401");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// ─── HTTP Primitives ──────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: "GET", headers });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

async function put<T>(path: string, body?: unknown): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Export ───────────────────────────────────────────────────────────────────

export { get, post, put, patch, del };

export const api = {
  // HTTP primitives
  get,
  post,
  put,
  patch,
  delete: del,

  // ── Notebooks ───────────────────────────────────────────────────────────────

  /** GET /notebooks/ — Lấy danh sách notebooks */
  getNotebooks() {
    return get<any>("/notebooks/");
  },

  /** GET /notebooks/{id} — Lấy chi tiết notebook */
  getNotebook(notebookId: string) {
    return get<any>(`/notebooks/${notebookId}`);
  },

  /** POST /notebooks/ — Tạo notebook mới */
  createNotebook(body: { title: string; description?: string }) {
    return post<any>("/notebooks/", body);
  },

  /** PUT /notebooks/{id} — Cập nhật notebook */
  updateNotebook(notebookId: string, body: Record<string, unknown>) {
    return put<any>(`/notebooks/${notebookId}`, body);
  },

  /** DELETE /notebooks/{id} — Xóa notebook */
  deleteNotebook(notebookId: string) {
    return del<any>(`/notebooks/${notebookId}`);
  },

  // ── Vocab Items ─────────────────────────────────────────────────────────────

  /** GET /vocab-items/notebook/{notebook_id} — Lấy danh sách vocab */
  getVocabs(notebookId: string) {
    return get<any>(`/vocab-items/notebook/${notebookId}`);
  },

  /** GET /vocab-items/{vocab_id} — Lấy chi tiết vocab */
  getVocab(vocabId: string) {
    return get<any>(`/vocab-items/${vocabId}`);
  },

  /** POST /vocab-items/?notebook_id={id} — Tạo vocab mới */
  createVocab(notebookId: string, body: {
    word: string;
    meaning: string;
    pronunciation?: string;
    example_sentence?: string;
  }) {
    return post<any>(`/vocab-items/?notebook_id=${notebookId}`, body);
  },

  /** PUT /vocab-items/{vocab_id} — Cập nhật vocab */
  updateVocab(vocabId: string, body: Record<string, unknown>) {
    return put<any>(`/vocab-items/${vocabId}`, body);
  },

  /** DELETE /vocab-items/{vocab_id} — Xóa vocab */
  deleteVocab(vocabId: string) {
    return del<any>(`/vocab-items/${vocabId}`);
  },

  /** PATCH /vocab-items/{vocab_id}/review — Ghi nhận kết quả ôn tập */
  reviewVocab(vocabId: string, remembered: boolean) {
    return patch<any>(`/vocab-items/${vocabId}/review`, { remembered });
  },

  /** GET /vocab-items/notebook/{notebook_id}/search?q=... — Tìm kiếm vocab */
  searchVocabs(notebookId: string, query: string) {
    return get<any>(`/vocab-items/notebook/${notebookId}/search?q=${encodeURIComponent(query)}`);
  },

  // ── Reviews ─────────────────────────────────────────────────────────────────

  /** GET /reviews/due — Lấy danh sách vocab cần ôn hôm nay */
  getDueReviews() {
    return get<any>("/reviews/due");
  },

  /** POST /reviews/submit — Submit kết quả review */
  submitReview(body: { vocab_id: string; remembered: boolean }) {
    return post<any>("/reviews/submit", body);
  },

  // ── Game Sessions ────────────────────────────────────────────────────────────

  /** POST /game-sessions/start — Bắt đầu game session */
  startGameSession(body: Record<string, unknown>) {
    return post<any>("/game-sessions/start", body);
  },

  /** POST /game-sessions/{session_id}/end — Kết thúc game session */
  endGameSession(sessionId: string, body?: Record<string, unknown>) {
    return post<any>(`/game-sessions/${sessionId}/end`, body);
  },

  /** GET /game-sessions/{session_id} — Lấy thông tin game session */
  getGameSession(sessionId: string) {
    return get<any>(`/game-sessions/${sessionId}`);
  },
};