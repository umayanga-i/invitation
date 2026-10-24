import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/env";

/** For read-only Server Components. Session refresh is added in Phase 2's proxy. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();
  return createServerClient(url, anonKey, {
    cookies: { getAll: () => cookieStore.getAll() },
  });
}

/** Use in route handlers and server actions where response cookies are writable. */
export async function createWritableClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}
