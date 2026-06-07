import "server-only";

/**
 * In-memory sliding-window rate limiter.
 *
 * Per-instance state — relies on Cloud Run's `min-instances=1` so a single
 * warm worker holds all counters (same scaling assumption as the inflight
 * Set in /api/architect/generate). If we ever scale beyond a handful of
 * instances, replace this with a Firestore-backed counter or Memorystore.
 *
 * Memory bound: ~96 bytes per active key * keys * window. Buckets are
 * swept opportunistically every 60s.
 */

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
let lastSweepAt = 0;

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  if (now - lastSweepAt > 60_000) {
    sweep(now);
    lastSweepAt = now;
  }

  const bucket = buckets.get(opts.key) ?? { hits: [] };
  const cutoff = now - opts.windowMs;
  const fresh = bucket.hits.filter((t) => t > cutoff);

  if (fresh.length >= opts.limit) {
    buckets.set(opts.key, { hits: fresh });
    const oldestHit = fresh[0] ?? now;
    return {
      ok: false,
      limit: opts.limit,
      remaining: 0,
      resetAt: oldestHit + opts.windowMs,
    };
  }

  fresh.push(now);
  buckets.set(opts.key, { hits: fresh });
  return {
    ok: true,
    limit: opts.limit,
    remaining: opts.limit - fresh.length,
    resetAt: now + opts.windowMs,
  };
}

function sweep(now: number) {
  // Drop any bucket whose newest hit is older than 10 minutes — that's
  // longer than any window we use, so safe to discard.
  const stale = now - 10 * 60_000;
  for (const [key, b] of buckets) {
    if (!b.hits.length || b.hits[b.hits.length - 1]! < stale) {
      buckets.delete(key);
    }
  }
}

/** Pull the client IP out of Cloud Run / Google Frontend headers. */
export function clientIp(req: { headers: Headers }): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) {
    // Leftmost is the original client; trust because GFE strips spoofed XFF.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/** Build a 429 Response with the standard rate-limit headers. */
export function rateLimitResponse(r: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((r.resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: "Too many requests. Slow down and try again." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(r.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1000)),
      },
    },
  );
}
