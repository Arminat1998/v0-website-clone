"use client"

import { use, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  Euro,
  ExternalLink,
  Video,
  MessageSquarePlus,
} from "lucide-react"
import { useAdmin, type ChecklistState } from "@/contexts/admin-submissions-context"
import { statusClasses, formatDateTime } from "@/lib/admin-status"
import { useAdminT } from "@/lib/admin-i18n"
import { eventLabel, styleLabel, tagLabels } from "@/lib/list-filters"
import { missingLabel, rejectReasonLabel } from "@/lib/review-points"
import { ReviewActions } from "@/components/admin/review-actions"
import { ArtistAccountActions } from "@/components/admin/artist-account-actions"

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { getSubmission, saveChecklist, addNote } = useAdmin()
  const submission = getSubmission(id)
  const [noteText, setNoteText] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const [noteFailed, setNoteFailed] = useState(false)
  // The point being saved, shown as it will become.
  const [savingCheck, setSavingCheck] = useState<{ key: keyof ChecklistState; value: boolean } | null>(null)
  const [checkFailed, setCheckFailed] = useState(false)
  const { t, language, locale } = useAdminT()
  const nl = language === "nl"
  const checklistLabels = t.detail.checklistItems

  if (!submission) return notFound()

  const handleAddNote = async () => {
    if (!noteText.trim() || savingNote) return
    setSavingNote(true)
    setNoteFailed(false)
    const result = await addNote(submission.id, noteText.trim())
    setSavingNote(false)
    if (result.ok) setNoteText("")
    else setNoteFailed(true)
  }

  const handleCheck = async (key: keyof ChecklistState, value: boolean) => {
    setSavingCheck({ key, value })
    setCheckFailed(false)
    const result = await saveChecklist(submission.id, key, value)
    setSavingCheck(null)
    if (!result.ok) setCheckFailed(true)
  }

  const title = (stored: string) => t.detail.timelineTitles[stored] ?? stored

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/admin/aanmeldingen"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.detail.back}
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="relative h-40 sm:h-48 w-full bg-accent">
          <Image
            src={submission.banner || submission.photo || "/placeholder.svg"}
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        </div>
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Image
              src={submission.photo || "/placeholder.svg"}
              alt={submission.name}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-card flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{submission.name}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusClasses[submission.status]}`}
                >
                  {t.status[submission.status]}
                </span>
              </div>
              <p className="text-muted-foreground mt-1">
                {submission.discipline} &middot; {t.detail.submittedOn(formatDateTime(submission.submittedAt, locale))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: dossier */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">{t.detail.contact}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <a
                href={`mailto:${submission.email}`}
                className="flex items-center gap-3 text-sm text-foreground hover:text-red-500 transition-colors"
              >
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{submission.email}</span>
              </a>
              <a
                href={`tel:${submission.phone}`}
                className="flex items-center gap-3 text-sm text-foreground hover:text-red-500 transition-colors"
              >
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                {submission.phone}
              </a>
              <div className="flex items-center gap-3 text-sm text-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                {submission.city}
              </div>
              {submission.website && (
                <a
                  href={submission.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-foreground hover:text-red-500 transition-colors"
                >
                  <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{t.detail.website}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {submission.socials.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                {submission.socials.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-xs text-foreground hover:bg-accent/70 transition-colors"
                  >
                    {social.platform}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Profile */}
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">{t.detail.profile}</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">{t.detail.bio}</p>
                <p className="text-foreground leading-relaxed">{submission.bio}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t.detail.experience}</p>
                <p className="text-foreground leading-relaxed">{submission.experience}</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-muted-foreground mb-0.5">{t.detail.availability}</p>
                  <p className="text-foreground">{submission.availability}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {submission.hourlyRate ? `${submission.hourlyRate} ${t.detail.perHour}` : t.detail.hourlyUnknown}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {submission.dayRate ? `${submission.dayRate} ${t.detail.perDay}` : t.detail.dayUnknown}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-border space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">{t.detail.genres}</p>
                <div className="flex flex-wrap gap-2">
                  {tagLabels(submission.genres, styleLabel, nl).map((g) => (
                    <span key={g} className="px-3 py-1 rounded-full bg-accent text-xs text-foreground">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  {t.detail.eventTypes}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tagLabels(submission.eventTypes, eventLabel, nl).map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-accent text-xs text-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Portfolio */}
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">{t.detail.portfolio}</h3>
            {submission.portfolioImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {submission.portfolioImages.map((img, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-accent">
                    <Image src={img || "/placeholder.svg"} alt={`Portfolio ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
            {submission.videoLinks.length > 0 ? (
              <div className="space-y-2">
                {submission.videoLinks.map((v) => (
                  <a
                    key={v.url}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border hover:border-red-600/50 transition-colors text-sm"
                  >
                    <Video className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-foreground flex-1">{v.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.detail.noVideos}</p>
            )}
          </section>

          {/* Timeline */}
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">{t.detail.timeline}</h3>
            <ol className="relative border-l border-border ml-2">
              {submission.timeline.map((event) => (
                <li key={event.id} className="mb-5 ml-5 last:mb-0">
                  <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-red-600 border-2 border-card" />
                  <p className="text-sm font-medium text-foreground">{title(event.title)}</p>
                  {event.description && <p className="text-sm text-muted-foreground mt-0.5">{title(event.description)}</p>}
                  {event.missing && event.missing.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t.detail.timelineMissing}: {event.missing.map((key) => missingLabel(key, nl)).join(", ")}
                    </p>
                  )}
                  {event.reason && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t.detail.timelineReason}: {rejectReasonLabel(event.reason, nl)}
                    </p>
                  )}
                  {event.message && (
                    <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
                      {t.detail.timelineMessage}: {event.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(event.date, locale)} &middot; {title(event.author)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Right: review workspace */}
        <div className="space-y-6">
          <ReviewActions submission={submission} />
          <ArtistAccountActions userId={submission.id} />

          {/* Checklist */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">{t.detail.checklist}</h3>
            <div className="space-y-3">
              {(Object.keys(checklistLabels) as (keyof ChecklistState)[]).map((key) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={savingCheck?.key === key ? savingCheck.value : submission.checklist[key]}
                    disabled={savingCheck !== null}
                    onChange={(e) => handleCheck(key, e.target.checked)}
                    className="w-4 h-4 rounded border-border text-red-600 focus:ring-red-600/40 bg-background"
                  />
                  <span
                    className={`text-sm transition-colors ${
                      submission.checklist[key] ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {checklistLabels[key]}
                  </span>
                </label>
              ))}
            </div>
            {checkFailed && (
              <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">
                {t.detail.saveFailed}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">{t.detail.notes}</h3>
            <div className="space-y-3 mb-4">
              {submission.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.detail.noNotes}</p>
              ) : (
                submission.notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-background border border-border">
                    <p className="text-sm text-foreground leading-relaxed">{note.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {note.author} &middot; {formatDateTime(note.date, locale)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                maxLength={2000}
                readOnly={savingNote}
                rows={3}
                placeholder={t.detail.notePlaceholder}
                aria-label={t.detail.notePlaceholder}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-600/40"
              />
              {noteFailed && (
                <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                  {t.detail.saveFailed}
                </p>
              )}
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!noteText.trim() || savingNote}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-foreground text-sm font-medium hover:bg-accent/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquarePlus className="w-4 h-4" />
                {t.detail.addNote}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
