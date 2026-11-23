"use client"

import { useState, useTransition } from "react"
import { Ban, Clock, EyeOff, LogOut, RotateCcw, Trash2, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  banUser,
  deleteUser,
  forceLogout,
  reinstateUser,
  suspendUser,
  unpublishProfessional,
  warnUser,
} from "@/app/actions/admin-users"
import { useUsersT } from "@/lib/admin-users-i18n"
import type { AdminUserRow } from "@/lib/admin/users"

export type UserActionKind = "warn" | "suspend" | "ban" | "reinstate" | "logout" | "unpublish" | "delete"

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"

/** Moderation buttons for one account, shared by the user page and the artist page. */
export function UserActions({
  account,
  onDone,
  className = "rounded-lg border border-border bg-card p-5",
}: {
  account: AdminUserRow
  /** Called after an action succeeded, so the page can reload its data. */
  onDone: (action: UserActionKind) => void
  className?: string
}) {
  const { t } = useUsersT()
  const [pending, startTransition] = useTransition()
  const [action, setAction] = useState<UserActionKind | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [severity, setSeverity] = useState("warning")
  const [days, setDays] = useState("7")
  const [blacklistEmail, setBlacklistEmail] = useState(true)
  const [confirmEmail, setConfirmEmail] = useState("")

  if (account.role === "admin") return null
  const restricted = account.status !== "active"

  const close = () => {
    setAction(null)
    setError("")
    setMessage("")
    setConfirmEmail("")
  }

  const confirm = () => {
    if (!action) return
    const userId = account.id
    const calls: Record<UserActionKind, () => Promise<{ ok: boolean; error?: string }>> = {
      warn: () => warnUser({ userId, message, severity }),
      suspend: () => suspendUser({ userId, days: Number(days), reason: message }),
      ban: () => banUser({ userId, reason: message, addToBlacklist: blacklistEmail }),
      reinstate: () => reinstateUser({ userId }),
      logout: () => forceLogout({ userId }),
      unpublish: () => unpublishProfessional({ userId }),
      delete: () => deleteUser({ userId, confirmEmail }),
    }
    const done = action
    setError("")
    startTransition(async () => {
      const result = await calls[done]().catch(() => null)
      if (!result?.ok) {
        setError(result?.error || t.actionFailed)
        return
      }
      close()
      onDone(done)
    })
  }

  const needsText = action === "warn" || action === "suspend" || action === "ban"
  const dialog = {
    warn: { title: t.warnTitle, desc: t.warnDesc },
    suspend: { title: t.suspendTitle, desc: t.suspendDesc },
    ban: { title: t.banTitle, desc: t.banDesc },
    reinstate: { title: t.reinstateTitle, desc: t.reinstateDesc },
    logout: { title: t.logoutTitle, desc: t.logoutDesc },
    unpublish: { title: t.unpublishTitle, desc: t.unpublishDesc },
    delete: { title: t.deleteTitle, desc: t.deleteDesc },
  }[action ?? "warn"]

  return (
    <section aria-labelledby="actions-heading" className={className}>
      <h2 id="actions-heading" className="text-lg font-semibold text-foreground">
        {t.actions}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">{t.actionsHint}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setAction("warn")}>
          <TriangleAlert className="h-4 w-4" aria-hidden="true" />
          {t.warn}
        </Button>
        {account.status === "active" && (
          <Button variant="outline" onClick={() => setAction("suspend")}>
            <Clock className="h-4 w-4" aria-hidden="true" />
            {t.suspend}
          </Button>
        )}
        {account.status !== "banned" && (
          <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => setAction("ban")}>
            <Ban className="h-4 w-4" aria-hidden="true" />
            {t.ban}
          </Button>
        )}
        {restricted && (
          <Button variant="outline" onClick={() => setAction("reinstate")}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t.reinstate}
          </Button>
        )}
        <Button variant="outline" onClick={() => setAction("logout")}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t.forceLogout}
        </Button>
        {account.role === "professional" && account.reviewStatus === "goedgekeurd" && (
          <Button variant="outline" onClick={() => setAction("unpublish")}>
            <EyeOff className="h-4 w-4" aria-hidden="true" />
            {t.unpublish}
          </Button>
        )}
        <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => setAction("delete")}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t.deleteAccount}
        </Button>
      </div>

      <Dialog open={action !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogDescription>{dialog.desc}</DialogDescription>
          </DialogHeader>

          {action === "warn" && (
            <div className="space-y-2">
              <label htmlFor="severity" className="text-sm font-medium text-foreground">
                {t.severity}
              </label>
              <select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass}>
                {Object.entries(t.severities).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {action === "suspend" && (
            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium text-foreground">
                {t.duration}
              </label>
              <select id="duration" value={days} onChange={(e) => setDays(e.target.value)} className={selectClass}>
                {[1, 3, 7, 14, 30, 90].map((n) => (
                  <option key={n} value={n}>
                    {t.days(n)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {needsText && (
            <div className="space-y-2">
              <label htmlFor="moderation-message" className="text-sm font-medium text-foreground">
                {action === "warn" ? t.message : t.reason}
              </label>
              <Textarea
                id="moderation-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={action === "warn" ? t.messagePlaceholder : t.reasonPlaceholder}
                rows={4}
              />
            </div>
          )}

          {action === "ban" && (
            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={blacklistEmail}
                onChange={(e) => setBlacklistEmail(e.target.checked)}
                className="mt-1"
              />
              {t.alsoBlacklist}
            </label>
          )}

          {action === "delete" && (
            <div className="space-y-2">
              <label htmlFor="delete-confirm-email" className="text-sm text-foreground">
                {t.deleteConfirmLabel}: <span className="font-semibold">{account.email}</span>
              </label>
              <input
                id="delete-confirm-email"
                type="email"
                autoComplete="off"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={pending}>
              {t.cancel}
            </Button>
            <Button
              onClick={confirm}
              disabled={
                pending ||
                (needsText && !message.trim()) ||
                (action === "delete" && confirmEmail.trim().toLowerCase() !== account.email.toLowerCase())
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {pending ? t.saving : t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
