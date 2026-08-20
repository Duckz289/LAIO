"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export function useAuth(requireUser = true) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Supabase fires onAuthStateChange (e.g. TOKEN_REFRESHED) whenever the
    // tab regains focus/visibility, even for the same logged-in user. Each
    // event carries a brand-new `session.user` object reference, which used
    // to make every page effect depending on `user` re-run and reset its UI
    // to a loading state on every tab switch. Keep the same object identity
    // when the underlying user hasn't actually changed so those effects
    // don't fire needlessly.
    const applySession = (nextUser: User | null) => {
      if (!mounted) return;
      setUser((current) => (current?.id === nextUser?.id ? current : nextUser));
      setLoading(false);
    };

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applySession(session?.user ?? null);
        if (requireUser && !session) router.replace("/");
      },
    );

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setUser(null);
          setLoading(false);
          if (requireUser) router.replace("/");
          return;
        }

        applySession(data.session?.user ?? null);
        if (requireUser && !data.session) router.replace("/");
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setLoading(false);
        if (requireUser) router.replace("/");
      });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [requireUser, router]);

  return { user, loading };
}
