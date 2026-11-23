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

// Vercel shows its comment toolbar on preview deployments only; production never loads it.
const onPreview = process.env.VERCEL_ENV === "preview"
const vercelToolbar = onPreview ? ["https://vercel.live"] : []
const vercelToolbarLive = onPreview ? ["wss://ws-us3.pusher.com"] : []

// Checked against every page, the signed-in areas included (round 6): all files, images, audio and invoices come
// from this site's own routes, uploads go to the blob API, video embeds come from YouTube (no-cookie) and Vimeo.
// Next.js starts its pages from inline scripts, so script-src needs 'unsafe-inline' as long as pages are static.
const policy = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...postHog, ...vercelToolbar],
  "style-src": ["'self'", "'unsafe-inline'", ...vercelToolbar],
  "img-src": ["'self'", "data:", "blob:", ...vercelToolbar],
  "font-src": ["'self'", "data:", ...vercelToolbar],
  "media-src": ["'self'", "blob:"],
  // Booking music goes from the browser straight to the blob store. data: is for the profile form, which turns a
  // cropped photo (a data URL in the browser) back into a file before uploading it.
  "connect-src": ["'self'", "data:", "https://vercel.com/api/blob", "https://vercel.com/api/blob/", ...postHog, ...vercelToolbar, ...vercelToolbarLive],
  "frame-src": ["https://www.youtube-nocookie.com", "https://player.vimeo.com", ...vercelToolbar],
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
                { key: "Content-Security-Policy", value: serialize(policy) },
              ],
            },
          ]
        : []),
    ]
  },
}

export default nextConfig
