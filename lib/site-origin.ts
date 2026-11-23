/** The public address of the site. */
export function siteOrigin() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/+$/, "")
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  return host ? `https://${host}` : "http://localhost:3000"
}
