// Simple in-memory fixed-window rate limiter for auth/OTP endpoints. Good enough for a single
// Node process; if this app is ever deployed across multiple instances behind a load balancer,
// swap the Map below for a shared store (e.g. Redis) so limits apply across all instances.
const buckets = new Map<string, { count: number; resetAt: number }>();

const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
const pruneTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, PRUNE_INTERVAL_MS);
pruneTimer.unref?.();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// Failure-only limiter, for "too many wrong passwords from one address" style limits. Successful
// attempts are not counted, so many real people behind one shared IP (salon Wi-Fi, mobile carrier
// NAT) are not locked out by each other's normal logins — only a burst of failures trips it.
export function isBlocked(key: string, limit: number): { blocked: boolean; retryAfterSeconds: number } {
  const bucket = buckets.get(key);
  const now = Date.now();
  if (!bucket || bucket.resetAt < now || bucket.count < limit) return { blocked: false, retryAfterSeconds: 0 };
  return { blocked: true, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
}

export function recordFailure(key: string, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) buckets.set(key, { count: 1, resetAt: now + windowMs });
  else bucket.count += 1;
}

export function getClientIp(request: Request): string {
  // Behind Cloudflare, cf-connecting-ip is set by Cloudflare itself and cannot be forged by the
  // client, unlike x-forwarded-for whose leftmost entry is client-controlled. The origin must only
  // be reachable through the tunnel/proxy for this to hold.
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
