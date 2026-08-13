import type { NextRequest } from "next/server";

/**
 * The client address to key a rate limit on.
 *
 * `x-forwarded-for` is a list, appended to by each hop. The LEFTMOST entry is
 * whatever the original client sent, so it is attacker-controlled unless a
 * trusted proxy overwrote the header outright -- taking it means anyone can
 * rotate the value per request and mint a fresh bucket every time, which is the
 * exact bypass a rate limit exists to prevent.
 *
 * Vercel overwrites the header, so the leftmost entry is trustworthy there and
 * this was safe in production. Nothing in the repo enforced that though, and it
 * would become a total bypass behind nginx or a plain `next start`. Count from
 * the right instead, skipping the hops we know we sit behind, so the value is
 * the address the nearest trusted proxy actually observed.
 */
const TRUSTED_HOPS = 1;

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    if (hops.length > 0) {
      const index = Math.max(0, hops.length - TRUSTED_HOPS);
      const candidate = hops[index] ?? hops[hops.length - 1];
      if (candidate) return candidate;
    }
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
