import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const rawSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

const isPlaceholderValue = (value: string) =>
  !value || value.includes("your-project") || value === "your-anon-key";

export const isSupabaseConfigured =
  !isPlaceholderValue(rawSupabaseUrl) && !isPlaceholderValue(rawSupabaseAnonKey);

export const supabaseConfigError =
  "Thiếu cấu hình Supabase. Hãy tạo frontend/.env.local với NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY rồi restart npm run dev.";

const supabaseUrl = isSupabaseConfigured
  ? rawSupabaseUrl
  : "http://127.0.0.1:54321";
const supabaseAnonKey = isSupabaseConfigured
  ? rawSupabaseAnonKey
  : "missing-supabase-anon-key";

if (!isSupabaseConfigured && process.env.NODE_ENV !== "production") {
  console.warn(supabaseConfigError);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
