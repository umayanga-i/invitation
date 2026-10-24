import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/** Bypasses RLS: callers must authorize requests and return only guest-safe fields. */
export function createAdminClient() {
  const env = z.object({ url: z.string().url(), key: z.string().min(1) }).safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!env.success) {
    throw new Error("Set the Supabase URL and server-only SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  }
  return createClient(env.data.url, env.data.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
