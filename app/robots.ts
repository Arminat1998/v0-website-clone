import type { MetadataRoute } from "next"
import { siteOrigin } from "@/lib/site-origin"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/api/", "/booking", "/dashboard", "/reset-password", "/review", "/design-system"] },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  }
}
