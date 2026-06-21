import "server-only";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Fixed-window in-memory rate limiter. Returns true if the call is allowed,
 * false once the limit for the window is exceeded. In-memory state is per
 * server instance — sufficient for a single long-running deployment; a
 * multi-instance setup would need a shared store (e.g. Redis).
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Bound memory: occasionally drop expired buckets.
  if (buckets.size > 500) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

/**
 * Best-effort client IP from proxy headers. Assumes a single trusted proxy
 * (Railway). `x-real-ip` is set by the proxy (not client-controlled) so prefer
 * it; for `x-forwarded-for` take the LAST hop — the address the trusted proxy
 * observed — because a client can prepend spoofed entries to the front.
 * NOTE: rate-limit state is in-memory per instance (see rateLimit above); a
 * horizontally-scaled deployment needs a shared store (Redis) — see plans/009.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}
