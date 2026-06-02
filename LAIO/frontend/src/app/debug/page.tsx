"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || null);
    });
  }, []);

  return (
    <div className="p-10">
      <h1>Debug Token</h1>
      <p>Token: {token ? "Có token ✅" : "Không có token ❌"}</p>
      <p>Chi tiết: {token?.substring(0, 50)}...</p>
    </div>
  );
}