"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Link2,
  Lock,
  Mail,
  MapPin,
  Music,
  Phone,
  Shirt,
  Speaker,
  Users,
  XCircle,
} from "lucide-react"
import { useBookingT } from "@/lib/booking-i18n"
import type { Booking, Invoice } from "@/lib/db/schema"
import { EQUIPMENT_OPTIONS, formatEuro } from "@/lib/bookings/pricing"
import { isContactUnlocked } from "@/lib/bookings/privacy"
import {
  billingAddress,
  bookingNumber,
  clientName,
  eventAddress,
  formatDateTime,
  formatEventDate,
  mapsUrl,
  shiftTime,
} from "@/lib/bookings/format"
import { audioDisplayName } from "@/lib/bookings/audio"
import { BookingAudio } from "@/components/booking/booking-audio"
import { BookingStatusBadge } from "./booking-status-badge"
import { BookingPricingCard } from "./booking-pricing-card"
import { BookingRespondPanel } from "./booking-respond-panel"
import { BookingCompletePanel } from "./booking-complete-panel"
import { BookingInvoicePanel } from "./booking-invoice-panel"

function Section({ id, title, icon, children }: { id: string; title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-border bg-card p-5 md:p-6">
      <h2 id={id} className="flex items-center gap-2 text-base font-semibold text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500/10 text-red-500">{icon}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  )
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
          {item}
        </span>
      ))}
    </div>
  )
}

function ExternalRef({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-red-500 hover:underline"
    >
      <Link2 className="h-4 w-4 flex-shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
      <ExternalLink className="h-3 w-3 flex-shrink-0" aria-hidden />
    </a>
  )
}

export function BookingDetail({ booking, invoice = null }: { booking: Booking; invoice?: Invoice | null }) {
  const { t, locale } = useBookingT()
  const isActive = isContactUnlocked(booking.status)
  const address = eventAddress(booking)
  const billing = billingAddress(booking)
  const notProvided = <span className="text-muted-foreground">{t.common.notProvided}</span>

  const timeline = [
    { label: t.detail.tlRequested, at: booking.createdAt, done: true },
    booking.status === "rejected"
      ? { label: t.detail.tlRejected, at: booking.respondedAt, done: true }
      : { label: t.detail.tlAccepted, at: booking.respondedAt, done: Boolean(booking.respondedAt) && booking.status !== "pending" },
    ...(booking.status === "rejected"
      ? []
      : [
          { label: t.detail.tlPaid, at: booking.paidAt, done: booking.paymentStatus === "paid" },
          { label: t.detail.tlCompleted, at: booking.completedAt, done: booking.status === "completed" },
          { label: t.detail.tlInvoiced, at: invoice?.submittedAt ?? null, done: Boolean(invoice) },
          { label: t.detail.tlPaidOut, at: booking.paidOutAt, done: booking.payoutStatus === "paid" },
        ]),
  ]

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-10">
      <Link
        href={booking.status === "pending" ? "/dashboard/booking-requests" : booking.status === "accepted" ? "/dashboard/accepted-bookings" : "/dashboard/completed-bookings"}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.common.back}
      </Link>

      <header className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            <span className="font-mono text-sm text-muted-foreground">{bookingNumber(booking.id)}</span>
          </div>
          <h1 className="mt-3 text-balance text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">{booking.eventName}</h1>
          <p className="mt-1 text-muted-foreground">
            {clientName(booking)}
            {booking.companyName ? ` · ${booking.companyName}` : ""} · {t.common.requestedOn} {formatDateTime(booking.createdAt, locale)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-foreground">
          <span className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            <Calendar className="h-4 w-4 text-red-500" aria-hidden />
            <span className="capitalize">{formatEventDate(booking.eventDate, locale)}</span>
          </span>
          <span className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            <Clock className="h-4 w-4 text-red-500" aria-hidden />
            {booking.startTime} – {booking.endTime}
          </span>
        </div>
      </header>

      {booking.status === "accepted" && (
        <div role="status" className="mt-6 flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" aria-hidden />
          <span>{t.detail.acceptedBanner}</span>
        </div>
      )}
      {booking.status === "completed" && (
        <div role="status" className="mt-6 flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" aria-hidden />
          <span>
            {t.accepted.completedBanner} {t.common.completedOn} {formatDateTime(booking.completedAt, locale)}.
          </span>
        </div>
      )}
      {booking.status === "rejected" && (
        <div role="status" className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted p-4 text-sm text-foreground">
          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden />
          <span>{t.detail.rejectedBanner}</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {isActive && (
            <Section id="runsheet" title={t.accepted.runSheet} icon={<Clock className="h-4 w-4" aria-hidden />}>
              <p className="text-sm text-muted-foreground">{t.accepted.runSheetSubtitle}</p>
              <ol className="mt-4 flex flex-col gap-0">
                {[
                  { time: shiftTime(booking.startTime, -90), label: t.accepted.setup, note: t.accepted.setupNote },
                  { time: booking.startTime, label: t.accepted.start, note: booking.musicGenres.join(", ") },
                  { time: booking.endTime, label: t.accepted.end, note: booking.lastSongLink || booking.lastSongFileName ? `${t.detail.lastSong}: ${booking.lastSongLink ?? audioDisplayName(booking.lastSongFileName ?? "")}` : "" },
                  { time: shiftTime(booking.endTime, 45), label: t.accepted.breakdown, note: "" },
                ].map((item, index, all) => (
                  <li key={item.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 font-mono text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      {index < all.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden />}
                    </div>
                    <div className="pb-5">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-sm font-semibold text-foreground">{item.time}</span>
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                      </div>
                      {item.note && <p className="mt-0.5 break-all text-sm text-muted-foreground">{item.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-2 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">{t.detail.reminders}</h3>
                <ul className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                  {booking.equipment.length > 0 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" aria-hidden />
                      {t.detail.reminderEquipment}: {booking.equipment.map((id) => EQUIPMENT_OPTIONS.find((o) => o.id === id)?.label ?? id).join(", ")}
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" aria-hidden />
                    {t.detail.reminderMusic}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" aria-hidden />
                    {t.detail.reminderContact}
                  </li>
                </ul>
              </div>
            </Section>
          )}

          <Section id="event" title={t.detail.event} icon={<Calendar className="h-4 w-4" aria-hidden />}>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t.detail.eventType}>{booking.eventTypes.length ? <Chips items={booking.eventTypes} /> : notProvided}</Field>
              <Field label={t.detail.duration}>
                {Number(booking.hours)} {t.common.hours} ({booking.startTime} – {booking.endTime})
              </Field>
              <Field label={t.detail.capacity}>
                {booking.capacity ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {booking.capacity} {t.common.guests}
                  </span>
                ) : (
                  notProvided
                )}
              </Field>
              <Field label={t.detail.dressCode}>
                {booking.dressCode ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Shirt className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {booking.dressCode}
                  </span>
                ) : (
                  notProvided
                )}
              </Field>
              <div className="sm:col-span-2">
                <Field label={t.detail.description}>
                  {booking.description ? <p className="leading-relaxed">{booking.description}</p> : notProvided}
                </Field>
              </div>
              {booking.specialRequests && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 sm:col-span-2">
                  <Field label={t.detail.specialRequests}>
                    <p className="leading-relaxed">{booking.specialRequests}</p>
                  </Field>
                </div>
              )}
            </dl>
          </Section>

          <Section id="music" title={t.detail.music} icon={<Music className="h-4 w-4" aria-hidden />}>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label={t.detail.genres}>{booking.musicGenres.length ? <Chips items={booking.musicGenres} /> : notProvided}</Field>
              </div>
              <Field label={t.detail.playlist}>
                {booking.playlistLink ? <ExternalRef href={booking.playlistLink} label={booking.playlistLink} /> : notProvided}
              </Field>
              <Field label={t.detail.openingDance}>
                {booking.openingDanceLink ? (
                  <ExternalRef href={booking.openingDanceLink} label={booking.openingDanceLink} />
                ) : booking.openingDanceFileName ? (
                  <BookingAudio bookingId={booking.id} kind="opening-dance" stored={booking.openingDanceFileName} />
                ) : (
                  notProvided
                )}
              </Field>
              <Field label={t.detail.lastSong}>
                {booking.lastSongLink ? (
                  <ExternalRef href={booking.lastSongLink} label={booking.lastSongLink} />
                ) : booking.lastSongFileName ? (
                  <BookingAudio bookingId={booking.id} kind="last-song" stored={booking.lastSongFileName} />
                ) : (
                  notProvided
                )}
              </Field>
            </dl>
          </Section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Section id="location" title={t.detail.location} icon={<MapPin className="h-4 w-4" aria-hidden />}>
              <address className="text-sm not-italic leading-relaxed text-foreground">
                {address.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </address>
              {!isActive && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  {t.detail.addressLocked}
                </p>
              )}
              <dl className="mt-4">
                <Field label={t.detail.distance}>
                  {booking.distanceKm} {t.common.km} ({booking.distanceKm * 2} {t.common.km} {t.detail.travelDetail})
                </Field>
              </dl>
              <a
                href={mapsUrl(booking)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:underline"
              >
                {t.detail.mapsLink}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </Section>

            <Section id="equipment" title={t.detail.equipment} icon={<Speaker className="h-4 w-4" aria-hidden />}>
              {booking.equipment.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.detail.noEquipment}</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {booking.equipment.map((id) => {
                    const option = EQUIPMENT_OPTIONS.find((o) => o.id === id)
                    return (
                      <li key={id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
                        <span className="text-foreground">{option?.label ?? id}</span>
                        <span className="font-medium text-muted-foreground">{formatEuro(option?.priceCents ?? 0, locale)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Section>
          </div>

          <Section id="client" title={t.detail.client} icon={<Users className="h-4 w-4" aria-hidden />}>
            {!isActive ? (
              <div className="flex flex-col gap-4">
                <dl>
                  <Field label={t.detail.contact}>
                    <span className="font-medium">{clientName(booking)}</span>
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" aria-hidden />
                      {t.customerType[booking.customerType]}
                    </span>
                  </Field>
                </dl>
                <div className="flex gap-3 rounded-md border border-dashed border-border bg-background p-3">
                  <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{t.detail.contactLockedTitle}</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {booking.status === "pending" ? t.detail.contactLockedPending : t.detail.contactLockedClosed}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t.detail.contact}>
                <div className="flex flex-col gap-1.5">
                  <span className="font-medium">{clientName(booking)}</span>
                  <a href={`mailto:${booking.email}`} className="inline-flex items-center gap-1.5 text-red-500 hover:underline">
                    <Mail className="h-4 w-4" aria-hidden />
                    {booking.email}
                  </a>
                  <a href={`tel:${booking.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-red-500 hover:underline">
                    <Phone className="h-4 w-4" aria-hidden />
                    {booking.phone}
                  </a>
                </div>
              </Field>
              <Field label={t.detail.billing}>
                <div className="flex flex-col gap-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" aria-hidden />
                    {t.customerType[booking.customerType]}
                  </span>
                  {billing.length ? (
                    <address className="not-italic leading-relaxed">
                      {billing.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </address>
                  ) : (
                    notProvided
                  )}
                  {booking.vatNumber && (
                    <span className="text-xs text-muted-foreground">
                      {t.detail.vat}: <span className="font-mono text-foreground">{booking.vatNumber}</span>
                    </span>
                  )}
                </div>
              </Field>
              <Field label={t.detail.paymentMethod}>{t.paymentMethod[booking.paymentMethod]}</Field>
            </dl>
            )}
          </Section>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <BookingPricingCard booking={booking} />

          {booking.status === "pending" && <BookingRespondPanel bookingId={booking.id} />}
          {booking.status === "accepted" && <BookingCompletePanel booking={booking} />}
          {booking.status === "completed" && <BookingInvoicePanel booking={booking} invoice={invoice} />}

          {(booking.responseMessage || booking.rejectionReason) && (
            <section aria-labelledby="message-heading" className="rounded-lg border border-border bg-card p-5 md:p-6">
              <h2 id="message-heading" className="text-base font-semibold text-foreground">
                {t.detail.yourMessage}
              </h2>
              <blockquote className="mt-3 border-l-2 border-red-500 pl-3 text-sm leading-relaxed text-muted-foreground">
                {booking.responseMessage ?? booking.rejectionReason}
              </blockquote>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.common.respondedOn} {formatDateTime(booking.respondedAt, locale)}
              </p>
            </section>
          )}

          <section aria-labelledby="timeline-heading" className="rounded-lg border border-border bg-card p-5 md:p-6">
            <h2 id="timeline-heading" className="text-base font-semibold text-foreground">
              {t.detail.timeline}
            </h2>
            <ol className="mt-4 flex flex-col gap-3">
              {timeline.map((item) => (
                <li key={item.label} className="flex items-start gap-3 text-sm">
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${item.done ? "bg-green-500/15 text-green-500" : "border border-border text-transparent"}`}
                    aria-hidden
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex flex-col">
                    <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                    {item.done && item.at && <span className="text-xs text-muted-foreground">{formatDateTime(item.at, locale)}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  )
}
