"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addBlacklistEntry, removeBlacklistEntry } from "@/app/actions/admin-users"
import { useUsersT } from "@/lib/admin-users-i18n"
import type { BlacklistEntry } from "@/lib/admin/users"

export function BlacklistManager({ entries }: { entries: BlacklistEntry[] }) {
  const { t, formatDate } = useUsersT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState("email")
  const [value, setValue] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const result = await addBlacklistEntry({ type, value, reason })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setValue("")
      setReason("")
      router.refresh()
    })
  }

  const remove = (id: number) =>
    startTransition(async () => {
      await removeBlacklistEntry({ id })
      router.refresh()
    })

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[180px_1fr_1fr_auto]">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label={t.type}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {Object.entries(t.types).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t.valuePlaceholders[type]}
            aria-label={t.value}
            required
          />
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.optionalReason} aria-label={t.optionalReason} />
          <Button type="submit" disabled={pending} className="bg-red-600 hover:bg-red-700 text-white">
            {t.addEntry}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t.type}</th>
              <th className="px-4 py-3 font-medium">{t.value}</th>
              <th className="px-4 py-3 font-medium">{t.reason}</th>
              <th className="px-4 py-3 font-medium">{t.addedBy}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {t.blacklistEmpty}
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{t.types[entry.type] ?? entry.type}</td>
                <td className="px-4 py-3 font-mono text-foreground">{entry.value}</td>
                <td className="px-4 py-3 text-muted-foreground">{entry.reason ?? "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {entry.adminName}
                  <span className="block text-xs">{formatDate(entry.createdAt)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(entry.id)}
                    disabled={pending}
                    aria-label={`${t.remove} ${entry.value}`}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
