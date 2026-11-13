"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { addUserNote, deleteUserNote, revokeWarning, updateWarning } from "@/app/actions/admin-users"
import { useUsersT } from "@/lib/admin-users-i18n"
import type { AdminNote, AdminUserRow, AdminWarning, AuditEntry } from "@/lib/admin/users"
import { UserAvatar, UserStatusBadge } from "@/components/admin/moderation-ui"
import { AuditLog } from "@/components/admin/audit-log"
import { UserActions } from "@/components/admin/user-actions"

type ActionKind = "editWarning" | "revokeWarning"

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
  const [note, setNote] = useState("")
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
    if (!selectedWarning) return
    const userId = account.id
    if (action === "editWarning") {
      return run(() => updateWarning({ warningId: selectedWarning.id, userId, message, severity }), close)
    }
    return run(() => revokeWarning({ warningId: selectedWarning.id, userId }), close)
  }

  const dialog =
    action === "revokeWarning"
      ? { title: t.revokeWarningTitle, desc: t.revokeWarningDesc }
      : { title: t.editWarningTitle, desc: t.editWarningDesc }

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

      <UserActions
        account={account}
        // The account no longer exists after deletion, so leave its page.
        onDone={(done) => (done === "delete" ? router.push("/admin/gebruikers") : router.refresh())}
      />

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

          {action === "editWarning" && (
            <>
              <div className="space-y-2">
                <label htmlFor="edit-severity" className="text-sm font-medium text-foreground">
                  {t.severity}
                </label>
                <select id="edit-severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass}>
                  {Object.entries(t.severities).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-warning-message" className="text-sm font-medium text-foreground">
                  {t.message}
                </label>
                <Textarea
                  id="edit-warning-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  rows={4}
                />
              </div>
            </>
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
              disabled={pending || (action === "editWarning" && !message.trim())}
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
