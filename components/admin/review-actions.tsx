"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, HelpCircle, Play } from "lucide-react"
import { useAdmin, type Submission } from "@/contexts/admin-submissions-context"

const missingOptions = ["Dagtarief", "Portfoliofoto's", "Videovoorbeeld", "Contactgegevens", "Beschikbaarheid", "Bio"]

const rejectReasons = [
  "Onvoldoende ervaring",
  "Onvolledig portfolio",
  "Past niet bij ARSI",
  "Dubbele aanmelding",
  "Anders",
]

export function ReviewActions({ submission }: { submission: Submission }) {
  const { startReview, approve, requestInfo, reject } = useAdmin()
  const [openDialog, setOpenDialog] = useState<null | "info" | "reject">(null)

  // request-info form
  const [selectedMissing, setSelectedMissing] = useState<string[]>([])
  const [infoMessage, setInfoMessage] = useState("")
  // reject form
  const [reason, setReason] = useState(rejectReasons[0])
  const [rejectMessage, setRejectMessage] = useState("")

  const isClosed = submission.status === "goedgekeurd" || submission.status === "afgewezen"

  const toggleMissing = (item: string) =>
    setSelectedMissing((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))

  const submitInfo = () => {
    requestInfo(submission.id, infoMessage.trim() || "Graag je aanmelding aanvullen.", selectedMissing)
    setOpenDialog(null)
    setSelectedMissing([])
    setInfoMessage("")
  }

  const submitReject = () => {
    reject(submission.id, reason, rejectMessage.trim() || "Bedankt voor je aanmelding.")
    setOpenDialog(null)
    setRejectMessage("")
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-foreground mb-4">Beoordeling</h3>

      {isClosed ? (
        <div
          className={`rounded-lg p-4 text-sm ${
            submission.status === "goedgekeurd"
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          Deze aanmelding is {submission.status === "goedgekeurd" ? "goedgekeurd" : "afgewezen"} door{" "}
          {submission.reviewer}.
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
              Beoordeling starten
            </button>
          )}

          <button
            type="button"
            onClick={() => approve(submission.id)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Goedkeuren
          </button>

          <button
            type="button"
            onClick={() => setOpenDialog("info")}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500/10 text-orange-500 text-sm font-medium hover:bg-orange-500/20 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Aanvulling vragen
          </button>

          <button
            type="button"
            onClick={() => setOpenDialog("reject")}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Afwijzen
          </button>
        </div>
      )}

      {/* Request info dialog */}
      {openDialog === "info" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenDialog(null)} />
          <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold text-foreground">Aanvulling vragen</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Selecteer wat ontbreekt en stuur een bericht aan de artiest.
            </p>

            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">Ontbrekende informatie</p>
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
              <label className="text-sm font-medium text-foreground mb-2 block">Bericht</label>
              <textarea
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                rows={4}
                placeholder="Hoi, kun je je aanmelding aanvullen met..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpenDialog(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-foreground text-sm font-medium hover:bg-accent/70 transition-colors"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={submitInfo}
                className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Versturen
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
            <h4 className="text-lg font-semibold text-foreground">Aanmelding afwijzen</h4>
            <p className="text-sm text-muted-foreground mt-1">Kies een reden en licht je beslissing toe.</p>

            <div className="mt-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Reden</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-600/40"
              >
                {rejectReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Bericht aan artiest</label>
              <textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                rows={4}
                placeholder="Bedankt voor je aanmelding. Helaas..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-600/40"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpenDialog(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-foreground text-sm font-medium hover:bg-accent/70 transition-colors"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={submitReject}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Afwijzen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
