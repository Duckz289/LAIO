"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}));

let authInitPromise: Promise<void> | null = null;
let authSubscriptionStarted = false;

function applySession(user: User | null) {
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setInitialized(true);
  useAuthStore.getState().setLoading(false);
}

function startAuthSubscription() {
  if (authSubscriptionStarted) return;
  authSubscriptionStarted = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    applySession(session?.user ?? null);
  });
}

export function ensureAuthInitialized() {
  if (useAuthStore.getState().initialized) {
    startAuthSubscription();
    return Promise.resolve();
  }

  if (authInitPromise) return authInitPromise;

  startAuthSubscription();
  authInitPromise = supabase.auth
    .getSession()
    .then(({ data }) => {
      applySession(data.session?.user ?? null);
    })
    .catch(() => {
      applySession(null);
    })
    .finally(() => {
      authInitPromise = null;
    });

  return authInitPromise;
}
