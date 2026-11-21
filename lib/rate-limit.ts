import "server-only"

const buckets = new Map<string, number[]>()

/**
 * Best-effort limit: true while `key` has made fewer than `max` calls in the last `windowMs`, and counts
 * this call. It is kept in memory, so it holds per server instance only.
 */
export function takeToken(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const recent = (buckets.get(key) ?? []).filter((time) => now - time < windowMs)
  if (recent.length >= max) {
    buckets.set(key, recent)
    return false
  }
  recent.push(now)
  buckets.set(key, recent)
  if (buckets.size > 10_000) for (const [k, times] of buckets) if (times.every((time) => now - time >= windowMs)) buckets.delete(k)
  return true
}
