/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      { source: "/:path*", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000" },
      ] },
      { source: "/account/:path*", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] },
      // Signed-in areas with destructive buttons may not be framed by other sites (clickjacking).
      // Only in production: the v0 preview shows development builds inside an iframe.
      ...(process.env.NODE_ENV === "production"
        ? ["/admin/:path*", "/dashboard/:path*", "/booking/:path*"].map((source) => ({
            source,
            headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
          }))
        : []),
    ]
  },
}

export default nextConfig
