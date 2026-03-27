/**
 * Simple in-memory fixed-window rate limiter.
 *
 * Good enough for a personal portfolio with low traffic. On Vercel each edge
 * function instance has its own memory, so limits are per-instance rather than
 * globally enforced — swap the store for Vercel KV or Upstash Redis if you
 * ever need cross-instance coordination.
 *
 * The store is a module-level Map so it persists across requests within the
 * same process lifetime but doesn't survive cold starts.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Prune stale entries periodically so the Map doesn't grow unbounded.
// Runs at most once every 60 seconds.
let lastPrune = 0;
function pruneIfNeeded(): void {
  const now = Date.now();
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}

/**
 * Checks whether the given IP is within the rate limit for a route.
 *
 * @param ip - The caller's IP address.
 * @param route - An opaque key identifying the route/bucket (e.g. "vitals").
 * @param limit - Max requests allowed within the window.
 * @param windowMs - Window length in milliseconds.
 * @returns `{ allowed: boolean; remaining: number; resetAt: number }`
 */
export function checkRateLimit(
  ip: string,
  route: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  pruneIfNeeded();

  const key = `${route}:${ip}`;
  const now = Date.now();
  const existing = store.get(key);

  let entry: Entry;
  if (!existing || now >= existing.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
  } else {
    existing.count += 1;
    entry = existing;
  }

  const remaining = Math.max(0, limit - entry.count);
  return {
    allowed: entry.count <= limit,
    remaining,
    resetAt: entry.resetAt,
  };
}
