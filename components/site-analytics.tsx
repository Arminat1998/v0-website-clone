"use client"

import { Analytics } from "@vercel/analytics/next"

/** Reset and review links hold a secret; it stays out of the statistics. */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url)
        url.searchParams.delete("token")
        url.pathname = url.pathname.replace(/^\/review\/[^/]+/, "/review/[token]")
        return { ...event, url: url.toString() }
      }}
    />
  )
}
