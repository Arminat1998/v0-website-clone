"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, TriangleAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useUsersT } from "@/lib/admin-users-i18n"
import type { AdminUserRow } from "@/lib/admin/users"
import { UserAvatar, UserStatusBadge } from "@/components/admin/moderation-ui"

const selectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  const { t, formatDate } = useUsersT()
  const [query, setQuery] = useState("")
  const [role, setRole] = useState("user")
  const [status, setStatus] = useState("all")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(
      (u) =>
        u.role === role &&
        (status === "all" || u.status === status) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    )
  }, [users, query, role, status])

  const counts = useMemo(() => {
    const result: Record<string, number> = {}
    for (const u of users) result[u.role] = (result[u.role] ?? 0) + 1
    return result
  }, [users])

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label={t.columns.role} className="flex gap-1 overflow-x-auto border-b border-border">
        {Object.entries(t.roleTabs).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={role === value}
            onClick={() => setRole(value)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              role === value
                ? "border-red-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{counts[value] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            aria-label={t.search}
            className="pl-9"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass} aria-label={t.columns.status}>
          <option value="all">{t.allStatuses}</option>
          {Object.entries(t.statuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t.columns.user}</th>
              <th className="px-4 py-3 font-medium">{t.columns.status}</th>
              <th className="px-4 py-3 font-medium">{t.columns.warnings}</th>
              <th className="px-4 py-3 font-medium">{t.columns.joined}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {t.noUsers}
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-accent/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/gebruikers/${u.id}`} className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={u.name} image={u.image} />
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground truncate">{u.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">{u.email}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <UserStatusBadge status={u.status} />
                </td>
                <td className="px-4 py-3">
                  {u.warningCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-amber-500">
                      <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                      {u.warningCount}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/gebruikers/${u.id}`} className="text-red-500 hover:text-red-400 text-sm">
                    {t.openProfile}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
