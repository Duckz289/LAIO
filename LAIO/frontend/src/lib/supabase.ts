// ============================================
// File: frontend/src/lib/supabase.ts
// ============================================
import { createClient } from "@supabase/supabase-sdk"; // Hoặc @supabase/supabase-js tùy thư viện bạn cài

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);