import { createClient } from "@supabase/supabase-js";

// This client uses the SERVICE ROLE key and must only be imported from
// server-side code (API routes / route handlers). Never import this file
// from a "use client" component — the key would leak to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "缺少 SUPABASE_SERVICE_ROLE_KEY 或 NEXT_PUBLIC_SUPABASE_URL，請檢查 .env.local"
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
