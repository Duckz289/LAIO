"use client";

import { create } from "zustand";

import { api, NotebookRecord, ProgressSummary } from "@/lib/api";

const NOTEBOOKS_STALE_MS = 60_000;

type FetchOptions = {
  force?: boolean;
};

type NotebooksState = {
  notebooks: NotebookRecord[];
  progress: ProgressSummary | null;
  initialized: boolean;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchNotebooks: (options?: FetchOptions) => Promise<void>;
  removeNotebook: (id: string) => void;
  clearError: () => void;
};

export const useNotebooksStore = create<NotebooksState>((set, get) => ({
  notebooks: [],
  progress: null,
  initialized: false,
  loading: false,
  refreshing: false,
  error: null,
  lastFetchedAt: null,
  fetchNotebooks: async ({ force = false } = {}) => {
    const state = get();
    const isStale =
      state.lastFetchedAt === null ||
      Date.now() - state.lastFetchedAt > NOTEBOOKS_STALE_MS;

    if (!force && state.initialized && !isStale) {
      return;
    }

    if (state.loading || state.refreshing) {
      return;
    }

    const showInitialLoader = !state.initialized;
    set({
      loading: showInitialLoader,
      refreshing: !showInitialLoader,
      error: null,
    });

    try {
      const [response, summary] = await Promise.all([
        api.getNotebooks(),
        api.getProgressSummary(),
      ]);

      set({
        notebooks: response.notebooks || [],
        progress: summary,
        initialized: true,
        loading: false,
        refreshing: false,
        error: null,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      set({
        initialized: state.initialized,
        loading: false,
        refreshing: false,
        error:
          error instanceof Error
            ? error.message
            : "Khong the tai danh sach so tay.",
      });
    }
  },
  removeNotebook: (id) =>
    set((state) => ({
      notebooks: state.notebooks.filter((notebook) => notebook.id !== id),
      initialized: true,
    })),
  clearError: () => set({ error: null }),
}));
