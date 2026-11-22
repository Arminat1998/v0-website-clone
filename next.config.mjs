const production = process.env.NODE_ENV === "production"

/** PostHog (user tests only, after consent) loads its scripts from a separate assets host. */
function postHogSources() {
  try {
    const { origin } = new URL(process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com")
    return [origin, origin.replace(".i.posthog.com", "-assets.i.posthog.com")]
  } catch {
    return []
  }
}

const postHog = postHogSources()

const serialize = (policy) =>
  Object.entries(policy)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ")

// Enforced: rules that do not affect how the site loads its own files.
const enforcedPolicy = {
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'self'"],
}

// Reported in the browser console only, not enforced yet: the signed-in areas still have to be checked against it.
// Next.js starts its pages from inline scripts, so script-src needs 'unsafe-inline' as long as pages are static.
const reportOnlyPolicy = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...postHog],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'", "data:"],
  "media-src": ["'self'", "blob:"],
  // Booking music goes from the browser straight to the blob store.
  "connect-src": ["'self'", "https://vercel.com/api/blob", "https://vercel.com/api/blob/", ...postHog],
  "frame-src": ["https://www.youtube-nocookie.com", "https://player.vimeo.com"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      { source: "/:path*", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000" },
        // The site uses none of these; video embeds keep fullscreen and picture-in-picture.
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), midi=(), display-capture=()",
        },
      ] },
      { source: "/account/:path*", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] },
      // Only in production: the v0 preview shows development builds inside an iframe, and development needs
      // eval and websockets. Other sites may not frame any page (clickjacking).
      ...(production
        ? [
            { source: "/:path*", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] },
            // Not on API routes: those return no HTML, and a policy there can get in the way of the PDF viewer.
            {
              source: "/((?!api/).*)",
              headers: [
                { key: "Content-Security-Policy", value: serialize(enforcedPolicy) },
                { key: "Content-Security-Policy-Report-Only", value: serialize(reportOnlyPolicy) },
              ],
            },
          ]
        : []),
    ]
  },
}

export default nextConfig
