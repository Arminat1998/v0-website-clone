"use client"

import Link from "next/link"
import { useUsersT } from "@/lib/admin-users-i18n"
import type { AuditEntry } from "@/lib/admin/users"

export function AuditLog({ entries, compact = false }: { entries: AuditEntry[]; compact?: boolean }) {
  const { t, formatDate } = useUsersT()

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{compact ? t.noHistory : t.activityEmpty}</p>
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              {t.actionLabels[entry.action] ?? entry.action}
              {!compact && entry.targetLabel && (
                <>
                  {" · "}
                  {entry.targetUserId ? (
                    <Link href={`/admin/gebruikers/${entry.targetUserId}`} className="text-red-700 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
                      {entry.targetLabel}
                    </Link>
                  ) : (
                    <span className="font-mono">{entry.targetLabel}</span>
                  )}
                </>
              )}
            </p>
            {entry.details && <p className="text-muted-foreground break-words">{entry.details}</p>}
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {t.by} {entry.adminName} · {formatDate(entry.createdAt, true)}
          </p>
        </li>
      ))}
    </ul>
  )
}
