"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export default function DebugPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
    });
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-xl font-bold">Auth Debug</h1>
      <p className="mt-2 text-slate-600">
        {authenticated === null
          ? "Đang kiểm tra session..."
          : authenticated
            ? "Đã đăng nhập"
            : "Chưa đăng nhập"}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Access token được cố ý ẩn để tránh lộ thông tin đăng nhập.
      </p>
    </main>
  );
}
