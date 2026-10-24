import { z } from "zod";

const publicSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(1),
});

// Evaluate lazily so the scaffold can build without a configured Supabase project.
export function getSupabasePublicEnv() {
  const result = publicSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!result.success) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
  }
  return result.data;
}
