"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Ban, Clock, EyeOff, LogOut, Pencil, RotateCcw, Trash2, TriangleAlert, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  addUserNote,
  banUser,
  deleteUserNote,
  deleteUser,
  forceLogout,
  reinstateUser,
  revokeWarning,
  suspendUser,
  unpublishProfessional,
  updateWarning,
  warnUser,
} from "@/app/actions/admin-users"
import { useUsersT } from "@/lib/admin-users-i18n"
import type { AdminNote, AdminUserRow, AdminWarning, AuditEntry } from "@/lib/admin/users"
import { UserAvatar, UserStatusBadge } from "@/components/admin/moderation-ui"
import { AuditLog } from "@/components/admin/audit-log"

type ActionKind =
  | "warn"
  | "suspend"
  | "ban"
  | "reinstate"
  | "logout"
  | "unpublish"
  | "delete"
  | "editWarning"
  | "revokeWarning"

interface UserDetailProps {
  account: AdminUserRow
  warnings: AdminWarning[]
  notes: AdminNote[]
  audit: AuditEntry[]
}

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"

export function UserDetail({ account, warnings, notes, audit }: UserDetailProps) {
  const { t, formatDate } = useUsersT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [action, setAction] = useState<ActionKind | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [severity, setSeverity] = useState("warning")
  const [days, setDays] = useState("7")
  const [blacklistEmail, setBlacklistEmail] = useState(true)
  const [note, setNote] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [selectedWarning, setSelectedWarning] = useState<AdminWarning | null>(null)

  const openWarning = (kind: "editWarning" | "revokeWarning", w: AdminWarning) => {
    setSelectedWarning(w)
    setMessage(w.message)
    setSeverity(w.severity)
    setAction(kind)
  }

  const isAdmin = account.role === "admin"
  const restricted = account.status !== "active"

  const close = () => {
    setAction(null)
    setError("")
    setMessage("")
    setConfirmEmail("")
  }

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setError("")
    startTransition(async () => {
      const result = await fn()
      if (!result.ok) {
        setError(result.error ?? "")
        return
      }
      after?.()
      router.refresh()
    })
  }

  const confirm = () => {
    const userId = account.id
    switch (action) {
      case "warn":
        return run(() => warnUser({ userId, message, severity }), close)
      case "suspend":
        return run(() => suspendUser({ userId, days: Number(days), reason: message }), close)
      case "ban":
        return run(() => banUser({ userId, reason: message, addToBlacklist: blacklistEmail }), close)
      case "reinstate":
        return run(() => reinstateUser({ userId }), close)
      case "logout":
        return run(() => forceLogout({ userId }), close)
      case "unpublish":
        return run(() => unpublishProfessional({ userId }), close)
      case "delete":
        // The account no longer exists afterwards, so leave its page.
        return run(() => deleteUser({ userId, confirmEmail }), () => router.push("/admin/gebruikers"))
      case "editWarning":
        if (!selectedWarning) return
        return run(() => updateWarning({ warningId: selectedWarning.id, userId, message, severity }), close)
      case "revokeWarning":
        if (!selectedWarning) return
        return run(() => revokeWarning({ warningId: selectedWarning.id, userId }), close)
    }
  }

  const needsText = action === "warn" || action === "suspend" || action === "ban" || action === "editWarning"
  const showSeverity = action === "warn" || action === "editWarning"
  const dialog = {
    warn: { title: t.warnTitle, desc: t.warnDesc },
    suspend: { title: t.suspendTitle, desc: t.suspendDesc },
    ban: { title: t.banTitle, desc: t.banDesc },
    reinstate: { title: t.reinstateTitle, desc: t.reinstateDesc },
    logout: { title: t.logoutTitle, desc: t.logoutDesc },
    unpublish: { title: t.unpublishTitle, desc: t.unpublishDesc },
    delete: { title: t.deleteTitle, desc: t.deleteDesc },
    editWarning: { title: t.editWarningTitle, desc: t.editWarningDesc },
    revokeWarning: { title: t.revokeWarningTitle, desc: t.revokeWarningDesc },
  }[action ?? "warn"]

  return (
    <div className="space-y-8">
      <Link href="/admin/gebruikers" className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-400">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.back}
      </Link>

      <header className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center">
        <UserAvatar name={account.name} image={account.image} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{account.name}</h1>
            <UserStatusBadge status={account.status} />
          </div>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="inline">{t.email}: </dt>
              <dd className="inline text-foreground">{account.email}</dd>
            </div>
            <div>
              <dt className="inline">{t.columns.role}: </dt>
              <dd className="inline text-foreground">{t.roles[account.role] ?? account.role}</dd>
            </div>
            <div>
              <dt className="inline">{t.joinedOn}: </dt>
              <dd className="inline text-foreground">{formatDate(account.createdAt)}</dd>
            </div>
            {account.category && (
              <div>
                <dt className="inline">{t.category}: </dt>
                <dd className="inline text-foreground">{account.category}</dd>
              </div>
            )}
          </dl>
          {restricted && (
            <p className="mt-3 text-sm text-amber-500">
              {account.status === "suspended" && account.suspendedUntil
                ? `${t.suspendedUntil(formatDate(account.suspendedUntil))}. `
                : ""}
              {account.statusReason && `${t.reason}: ${account.statusReason}`}
            </p>
          )}
        </div>
      </header>

      {!isAdmin && (
        <section aria-labelledby="actions-heading" className="rounded-lg border border-border bg-card p-5">
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
              <>
                <Button variant="outline" onClick={() => setAction("suspend")}>
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {t.suspend}
                </Button>
                <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => setAction("ban")}>
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  {t.ban}
                </Button>
              </>
            )}
            {account.status === "suspended" && (
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
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="warnings-heading">
          <h2 id="warnings-heading" className="mb-3 text-lg font-semibold text-foreground">
            {t.warningsTitle} ({warnings.length})
          </h2>
          {warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noWarnings}</p>
          ) : (
            <ul className="space-y-2">
              {warnings.map((w) => (
                <li key={w.id} className="rounded-lg border border-border bg-card p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-amber-500">{t.severities[w.severity] ?? w.severity}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(w.createdAt, true)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-foreground">{w.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t.by} {w.adminName} · {w.acknowledgedAt ? `${t.acknowledged} ${formatDate(w.acknowledgedAt)}` : t.notAcknowledged}
                  </p>
                  {!isAdmin && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openWarning("editWarning", w)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.editWarning}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openWarning("revokeWarning", w)}>
                        <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.revokeWarning}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="notes-heading">
          <h2 id="notes-heading" className="text-lg font-semibold text-foreground">
            {t.notesTitle}
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">{t.notesHint}</p>
          <form
            className="mb-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              run(() => addUserNote({ userId: account.id, note }), () => setNote(""))
            }}
          >
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.notePlaceholder} aria-label={t.notePlaceholder} rows={3} />
            <Button type="submit" size="sm" disabled={pending || !note.trim()}>
              {t.addNote}
            </Button>
          </form>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noNotes}</p>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-border bg-card p-4 text-sm">
                  <p className="whitespace-pre-wrap break-words text-foreground">{n.note}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {t.by} {n.adminName} · {formatDate(n.createdAt, true)}
                    </span>
                    <button
                      type="button"
                      className="hover:text-red-500"
                      onClick={() => run(() => deleteUserNote({ noteId: n.id, userId: account.id }))}
                    >
                      {t.delete}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="mb-3 text-lg font-semibold text-foreground">
          {t.historyTitle}
        </h2>
        <AuditLog entries={audit} compact />
      </section>

      <Dialog open={action !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogDescription>{dialog.desc}</DialogDescription>
          </DialogHeader>

          {showSeverity && (
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
                {showSeverity ? t.message : t.reason}
              </label>
              <Textarea
                id="moderation-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={showSeverity ? t.messagePlaceholder : t.reasonPlaceholder}
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
    </div>
  )
}
