import "server-only"

const WINDOW_MS = 10 * 60 * 1000
const MAX_REQUESTS = 10
const MAX_BODY_CHARS = 20_000
const hits = new Map<string, number[]>()

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

/**
 * Best-effort limit of 10 AI requests per IP per 10 minutes. It is kept in memory, so it holds per server
 * instance only; a Vercel Firewall rule is the stronger limit. It stops casual abuse of the AI credit.
 */
export function aiRateLimited(request: Request) {
  const now = Date.now()
  const ip = clientIp(request)
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS)
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) for (const [key, times] of hits) if (times.every((time) => now - time >= WINDOW_MS)) hits.delete(key)
  return false
}

/** The JSON body, or null when it is missing, too large or not valid JSON. */
export async function readLimitedJson(request: Request): Promise<unknown> {
  const text = await request.text()
  if (!text || text.length > MAX_BODY_CHARS) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
