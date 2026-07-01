"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ensureAuthInitialized, useAuthStore } from "@/stores/auth-store";

export function useAuth(requireUser = true) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    void ensureAuthInitialized();
  }, [requireUser, router]);

  useEffect(() => {
    if (requireUser && initialized && !loading && !user) {
      router.replace("/");
    }
  }, [initialized, loading, requireUser, router, user]);

  return { user, loading };
}
