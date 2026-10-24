import 'server-only';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}

/** Process-local limiter for local/dev. TODO: replace with Cloudflare or Upstash for multi-instance deploys. */
export function allowRateLimit(headers: Headers, scope: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  }
  const key = `${scope}:${clientIp(headers)}`;
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function rateLimitedResponse(): Response {
  return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
}
