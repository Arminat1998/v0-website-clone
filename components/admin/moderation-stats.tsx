"use client"

import Link from "next/link"
import { useUsersT } from "@/lib/admin-users-i18n"
import type { ModerationStats } from "@/lib/admin/users"

export function ModerationStatsCards({ stats }: { stats: ModerationStats }) {
  const { t } = useUsersT()
  const items = [
    { label: t.stats.users, value: stats.totalUsers, href: "/admin/gebruikers" },
    { label: t.stats.professionals, value: stats.professionals, href: "/admin/gebruikers" },
    { label: t.stats.suspended, value: stats.suspended, href: "/admin/gebruikers", alert: stats.suspended > 0 },
    { label: t.stats.banned, value: stats.banned, href: "/admin/gebruikers", alert: stats.banned > 0 },
    { label: t.stats.warnings, value: stats.warningsLast30Days, href: "/admin/activiteit" },
    { label: t.stats.blacklist, value: stats.blacklistCount, href: "/admin/blacklist" },
  ]
  return (
    <section aria-labelledby="moderation-heading" className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="moderation-heading" className="text-lg font-semibold text-foreground">
          {t.stats.title}
        </h2>
        <Link href="/admin/gebruikers" className="text-sm text-red-700 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
          {t.stats.manage}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
          >
            <p className={`text-2xl font-semibold ${item.alert ? "text-red-700 dark:text-red-400" : "text-foreground"}`}>{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
