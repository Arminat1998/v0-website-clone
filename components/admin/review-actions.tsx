"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, HelpCircle, Play } from "lucide-react"
import { useAdmin, type Submission } from "@/contexts/admin-submissions-context"
import { useAdminT } from "@/lib/admin-i18n"

export function ReviewActions({ submission }: { submission: Submission }) {
  const { startReview, approve, requestInfo, reject } = useAdmin()
  const { t } = useAdminT()
  const { missingOptions, rejectReasons } = t.review
  const [openDialog, setOpenDialog] = useState<null | "info" | "reject">(null)

  // request-info form
  const [selectedMissing, setSelectedMissing] = useState<string[]>([])
  const [infoMessage, setInfoMessage] = useState("")
  // reject form
  const [reasonIndex, setReasonIndex] = useState(0)
  const [rejectMessage, setRejectMessage] = useState("")

  const isClosed = submission.status === "goedgekeurd" || submission.status === "afgewezen"

  const toggleMissing = (item: string) =>
    setSelectedMissing((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))

  const submitInfo = () => {
    requestInfo(submission.id, infoMessage.trim() || t.review.infoDefault, selectedMissing)
    setOpenDialog(null)
    setSelectedMissing([])
    setInfoMessage("")
  }

  const submitReject = () => {
    reject(submission.id, rejectReasons[reasonIndex], rejectMessage.trim() || t.review.rejectDefault)
    setOpenDialog(null)
    setRejectMessage("")
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-foreground mb-4">{t.review.title}</h3>

      {isClosed ? (
        <div
          className={`rounded-lg p-4 text-sm ${
            submission.status === "goedgekeurd"
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500"
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
              onClick={() => startReview(submission.id)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-foreground text-sm font-medium hover:bg-accent/70 transition-colors"
            >
              <Play className="w-4 h-4" />
              {t.review.start}
            </button>
          )}

          <button
            type="button"
            onClick={() => approve(submission.id)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t.review.approve}
          </button>

          <button
            type="button"
            onClick={() => setOpenDialog("info")}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500/10 text-orange-500 text-sm font-medium hover:bg-orange-500/20 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            {t.review.requestInfo}
          </button>

          <button
            type="button"
            onClick={() => setOpenDialog("reject")}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            {t.review.reject}
          </button>
        </div>
      )}

      {/* Request info dialog */}
      {openDialog === "info" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenDialog(null)} />
          <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold text-foreground">{t.review.requestInfo}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {t.review.requestInfoDesc}
            </p>

            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">{t.review.missingInfo}</p>
              <div className="flex flex-wrap gap-2">
                {missingOptions.map((item) => {
                  const active = selectedMissing.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleMissing(item)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                          : "bg-background text-muted-foreground border-border hover:border-orange-500/30"
                      }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-foreground mb-2 block">{t.review.message}</label>
              <textarea
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                rows={4}
                placeholder={t.review.infoPlaceholder}
                aria-label={t.review.message}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpenDialog(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-foreground text-sm font-medium hover:bg-accent/70 transition-colors"
              >
                {t.review.cancel}
              </button>
              <button
                type="button"
                onClick={submitInfo}
                className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                {t.review.send}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject dialog */}
      {openDialog === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenDialog(null)} />
          <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold text-foreground">{t.review.rejectTitle}</h4>
            <p className="text-sm text-muted-foreground mt-1">{t.review.rejectDesc}</p>

            <div className="mt-4">
              <label className="text-sm font-medium text-foreground mb-2 block">{t.review.reason}</label>
              <select
                value={reasonIndex}
                onChange={(e) => setReasonIndex(Number(e.target.value))}
                aria-label={t.review.reason}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-600/40"
              >
                {rejectReasons.map((r, i) => (
                  <option key={r} value={i}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-foreground mb-2 block">{t.review.messageToArtist}</label>
              <textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                rows={4}
                placeholder={t.review.rejectPlaceholder}
                aria-label={t.review.messageToArtist}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-600/40"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpenDialog(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-foreground text-sm font-medium hover:bg-accent/70 transition-colors"
              >
                {t.review.cancel}
              </button>
              <button
                type="button"
                onClick={submitReject}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                {t.review.reject}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
