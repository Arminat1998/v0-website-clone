"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, HelpCircle, Play } from "lucide-react"
import { useAdmin, type ReviewResult, type Submission } from "@/contexts/admin-submissions-context"
import type { ReviewStatusInput } from "@/app/actions/admin-review"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAdminT } from "@/lib/admin-i18n"
import {
  MISSING_POINT_KEYS,
  missingLabel,
  REJECT_REASON_KEYS,
  rejectReasonLabel,
  type MissingPoint,
  type RejectReason,
} from "@/lib/review-points"

type Step = Omit<ReviewStatusInput, "id" | "expectedStatus">

export function ReviewActions({ submission }: { submission: Submission }) {
  const { saveStatus } = useAdmin()
  const { t, language } = useAdminT()
  const nl = language === "nl"
  const [openDialog, setOpenDialog] = useState<null | "info" | "reject">(null)
  const [saving, setSaving] = useState(false)
  /** The step that did not go through, with what went wrong. */
  const [failed, setFailed] = useState<{ step: Step; result: Extract<ReviewResult, { ok: false }> } | null>(null)

  // request-info form
  const [selectedMissing, setSelectedMissing] = useState<MissingPoint[]>([])
  const [infoMessage, setInfoMessage] = useState("")
  // reject form
  const [reason, setReason] = useState<RejectReason>(REJECT_REASON_KEYS[0])
  const [rejectMessage, setRejectMessage] = useState("")

  const isClosed = submission.status === "goedgekeurd" || submission.status === "afgewezen"

  const toggleMissing = (key: MissingPoint) =>
    setSelectedMissing((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const open = (dialog: "info" | "reject") => {
    setFailed(null)
    setOpenDialog(dialog)
  }

  const close = () => {
    if (saving) return
    setFailed(null)
    setOpenDialog(null)
  }

  const save = async (step: Step) => {
    if (saving) return
    setSaving(true)
    setFailed(null)
    const result = await saveStatus({ ...step, id: submission.id, expectedStatus: submission.status })
    setSaving(false)
    if (!result.ok) return setFailed({ step, result })
    setOpenDialog(null)
    setSelectedMissing([])
    setInfoMessage("")
    setRejectMessage("")
  }

  const problem = failed && (
    <div role="alert" className="flex flex-col items-start gap-2 text-sm text-red-700 dark:text-red-400">
      <p>{failed.result.error === "changed" ? t.review.changed(t.status[failed.result.review.status]) : t.review.failed}</p>
      {failed.result.error !== "changed" && !openDialog && (
        <Button variant="outline" className="min-h-11" disabled={saving} onClick={() => save(failed.step)}>
          {t.review.retry}
        </Button>
      )}
    </div>
  )

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-foreground mb-4">{t.review.title}</h3>

      {isClosed ? (
        <div
          className={`rounded-lg p-4 text-sm ${
            submission.status === "goedgekeurd"
              ? "bg-green-500/10 text-green-800 dark:text-green-400"
              : "bg-red-500/10 text-red-700 dark:text-red-400"
          }`}
        >
          {submission.status === "goedgekeurd"
            ? t.review.closedApproved(submission.reviewer ?? "")
            : t.review.closedRejected(submission.reviewer ?? "")}
        </div>
      ) : (
        <div className="space-y-3">
          {submission.status === "nieuw" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => save({ status: "in-beoordeling" })}
              className="w-full min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-foreground text-sm font-medium hover:bg-accent/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" aria-hidden />
              {t.review.start}
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => save({ status: "goedgekeurd" })}
            className="w-full min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            {t.review.approve}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => open("info")}
            className="w-full min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500/10 text-orange-800 dark:text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HelpCircle className="w-4 h-4" aria-hidden />
            {t.review.requestInfo}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => open("reject")}
            className="w-full min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4" aria-hidden />
            {t.review.reject}
          </button>
        </div>
      )}

      {!openDialog && (
        <div className="mt-3 empty:hidden">
          {saving && (
            <p role="status" className="text-sm text-muted-foreground">
              {t.review.saving}
            </p>
          )}
          {problem}
        </div>
      )}

      {/* Request info dialog */}
      <Dialog open={openDialog === "info"} onOpenChange={(next) => !next && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.review.requestInfo}</DialogTitle>
            <DialogDescription>{t.review.requestInfoDesc}</DialogDescription>
          </DialogHeader>

          <fieldset disabled={saving}>
            <legend className="text-sm font-medium text-foreground mb-2">{t.review.missingInfo}</legend>
            <div className="flex flex-wrap gap-2">
              {MISSING_POINT_KEYS.map((key) => {
                const active = selectedMissing.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleMissing(key)}
                    className={`min-h-11 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "bg-orange-500/10 text-orange-800 dark:text-orange-400 border-orange-500"
                        : "bg-background text-muted-foreground border-border hover:border-orange-500/30"
                    }`}
                  >
                    {missingLabel(key, nl)}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.review.infoHint}</p>
          </fieldset>

          <div>
            <label htmlFor="review-info-message" className="text-sm font-medium text-foreground mb-2 block">
              {t.review.message}
            </label>
            <Textarea
              id="review-info-message"
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              readOnly={saving}
              maxLength={2000}
              rows={4}
              placeholder={t.review.infoPlaceholder}
            />
          </div>

          {problem}
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={close} disabled={saving}>
              {t.review.cancel}
            </Button>
            <Button
              className="min-h-11 bg-red-700 text-white hover:bg-red-600"
              disabled={saving || isClosed || (!infoMessage.trim() && selectedMissing.length === 0)}
              onClick={() =>
                save({ status: "wacht-op-aanvulling", message: infoMessage.trim(), missing: selectedMissing })
              }
            >
              {saving ? t.review.saving : t.review.send}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={openDialog === "reject"} onOpenChange={(next) => !next && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.review.rejectTitle}</DialogTitle>
            <DialogDescription>{t.review.rejectDesc}</DialogDescription>
          </DialogHeader>

          <div>
            <label htmlFor="review-reject-reason" className="text-sm font-medium text-foreground mb-2 block">
              {t.review.reason}
            </label>
            <select
              id="review-reject-reason"
              value={reason}
              disabled={saving}
              onChange={(e) => setReason(e.target.value as RejectReason)}
              aria-describedby="review-reject-reason-hint"
              className="w-full min-h-11 px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-600/40"
            >
              {REJECT_REASON_KEYS.map((key) => (
                <option key={key} value={key}>
                  {rejectReasonLabel(key, nl)}
                </option>
              ))}
            </select>
            <p id="review-reject-reason-hint" className="mt-2 text-sm text-muted-foreground">
              {t.review.reasonHint}
            </p>
          </div>

          <div>
            <label htmlFor="review-reject-message" className="text-sm font-medium text-foreground mb-2 block">
              {t.review.messageToArtist}
            </label>
            <Textarea
              id="review-reject-message"
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
              readOnly={saving}
              required
              maxLength={2000}
              rows={4}
              placeholder={t.review.rejectPlaceholder}
            />
          </div>

          {problem}
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={close} disabled={saving}>
              {t.review.cancel}
            </Button>
            <Button
              className="min-h-11 bg-red-700 text-white hover:bg-red-600"
              disabled={saving || isClosed || !rejectMessage.trim()}
              onClick={() => save({ status: "afgewezen", reason, message: rejectMessage.trim() })}
            >
              {saving ? t.review.saving : t.review.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
