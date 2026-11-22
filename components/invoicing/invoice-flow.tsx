"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ExternalLink, FileText, Loader2, Pencil, Printer, Sparkles, Upload, X } from "lucide-react"
import { submitSelfBillingInvoice, submitUploadedInvoice, type InvoiceContext, type UploadedInvoiceFile } from "@/app/actions/invoices"
import { useBookingT } from "@/lib/booking-i18n"
import type { BillingProfile, Invoice, InvoiceMethod } from "@/lib/db/schema"
import { formatEuro } from "@/lib/bookings/pricing"
import { bookingNumber, clientName, formatDateTime, formatEventDate } from "@/lib/bookings/format"
import {
  buildInvoiceLines,
  defaultAdjustments,
  payoutFor,
  isVatExclusive,
  type InvoiceAdjustments,
  formatIban,
  invoiceFileUrl,
  isBillingProfileComplete,
  parseEuroInput,
  proposeInvoiceNumber,
  sumInvoiceLines,
} from "@/lib/bookings/invoicing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InvoiceSpecification } from "./invoice-specification"
import { InvoiceDocument } from "./invoice-document"
import { BillingProfileForm } from "./billing-profile-form"
import { InvoiceUpload } from "./invoice-upload"
import { InvoiceCosts } from "./invoice-costs"

type Step = 0 | 1 | 2

export function InvoiceFlow({ context }: { context: InvoiceContext }) {
  const { t, locale } = useBookingT()
  const ti = t.invoice
  const router = useRouter()
  const { booking, today } = context

  const [profile, setProfile] = useState<BillingProfile>(context.profile)
  const [invoice, setInvoice] = useState<Invoice | null>(context.invoice)
  const [step, setStep] = useState<Step>(context.invoice ? 2 : 0)
  const [checked, setChecked] = useState(false)
  const [method, setMethod] = useState<InvoiceMethod>("self_billing")
  const [invoiceNumber, setInvoiceNumber] = useState(context.proposedNumber)
  const [invoiceDate, setInvoiceDate] = useState(today)
  const [declaredTotal, setDeclaredTotal] = useState("")
  const [file, setFile] = useState<UploadedInvoiceFile | null>(null)
  const [consent, setConsent] = useState(Boolean(context.profile.selfBillingAcceptedAt))
  const [editingProfile, setEditingProfile] = useState(!context.profileComplete)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // VAT settings live on the profile, so the lines follow any edits made during the flow.
  // Added costs follow the booking: excl. VAT for bookings priced excl. VAT, incl. VAT for older ones.
  const vatExclusive = isVatExclusive(booking)
  const [adjustments, setAdjustments] = useState<InvoiceAdjustments>(() => context.invoice ? {
    distanceKm: (context.invoice.lines.find((line) => line.key === "travel")?.quantity ?? 0) / 2,
    parkingCents: (() => { const l = context.invoice.lines.find((line) => line.key === "parking"); return l ? (vatExclusive ? l.netCents : l.grossCents) : 0 })(),
    parkingReceipt: context.invoice.lines.find((line) => line.key === "parking")?.receipt ?? null,
    extras: context.invoice.lines.filter((line) => line.key === "extra").map((line) => ({ description: line.description, amountCents: vatExclusive ? line.netCents : line.grossCents, receipt: line.receipt ?? null })),
  } : defaultAdjustments(booking))
  const lines = useMemo(() => invoice && step === 2 ? invoice.lines : buildInvoiceLines(booking, profile, adjustments), [booking, profile, adjustments, invoice, step])
  const totals = useMemo(() => sumInvoiceLines(lines), [lines])
  const payout = payoutFor(totals, vatExclusive)
  const pricedBooking = { ...booking, platformFeeCents: payout.feeCents, payoutCents: payout.payoutCents }
  const costsValid =
    (adjustments.parkingCents === 0 || Boolean(adjustments.parkingReceipt)) &&
    adjustments.extras.every((extra) => extra.description.trim().length > 0 && extra.amountCents > 0 && Boolean(extra.receipt))
  const profileComplete = isBillingProfileComplete(profile)
  const declaredCents = parseEuroInput(declaredTotal)
  const totalMatches = declaredCents !== null && declaredCents === totals.totalCents

  // Same rule as the server: an approved, paid or paid-out invoice can no longer be replaced.
  const invoiceLocked =
    invoice?.status === "approved" || booking.paymentStatus === "paid" || booking.payoutStatus === "paid"

  const canSubmit =
    method === "self_billing"
      ? profileComplete && !editingProfile && invoiceNumber.trim().length > 0 && invoiceDate.length > 0 && consent
      : invoiceNumber.trim().length > 0 && invoiceDate.length > 0 && totalMatches && file !== null

  function chooseMethod(next: InvoiceMethod) {
    setMethod(next)
    setError(null)
    setInvoiceNumber(next === "self_billing" ? proposeInvoiceNumber(profile) : "")
  }

  function handleProfileSaved(saved: BillingProfile) {
    setProfile(saved)
    setEditingProfile(false)
    if (method === "self_billing") setInvoiceNumber(proposeInvoiceNumber(saved))
  }

  // A production build hides the message of a server error; then the last, general text remains.
  function submitErrorText(err: unknown) {
    const nl = locale.startsWith("nl")
    const code = err instanceof Error ? err.message : ""
    if (code === "TOTAL_MISMATCH") return ti.totalMismatch(formatEuro(totals.totalCents, locale))
    if (code === "INVOICE_LOCKED" || code === "Payout already completed")
      return nl
        ? "Deze factuur staat vast, omdat hij is goedgekeurd of betaald. Je kunt hem niet meer wijzigen."
        : "This invoice is final because it was approved or paid. You can no longer change it."
    if (code === "Billing profile incomplete")
      return nl ? "Je factuurgegevens zijn nog niet compleet. Vul ze aan en probeer het opnieuw." : "Your billing details are incomplete. Complete them and try again."
    if (code === "Invoice date cannot be in the future")
      return nl ? "De factuurdatum mag niet in de toekomst liggen." : "The invoice date cannot be in the future."
    return context.invoice
      ? `${ti.submitError} ${nl ? "Is de factuur al goedgekeurd of betaald, dan kun je hem niet meer wijzigen." : "An approved or paid invoice can no longer be changed."}`
      : ti.submitError
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      try {
        const result =
          method === "self_billing"
            ? await submitSelfBillingInvoice({ bookingId: booking.id, adjustments, invoiceNumber, invoiceDate })
            : await submitUploadedInvoice({ bookingId: booking.id, adjustments, invoiceNumber, invoiceDate, declaredTotalCents: declaredCents ?? 0, file: file! })
        setInvoice(result)
        setStep(2)
        window.scrollTo({ top: 0, behavior: "smooth" })
        router.refresh()
      } catch (err) {
        setError(submitErrorText(err))
        // The invoice may have been approved or paid in the meantime: show the current state.
        router.refresh()
      }
    })
  }

  function restart() {
    setStep(0)
    setChecked(false)
    setFile(null)
    setDeclaredTotal("")
    setInvoiceNumber(method === "self_billing" ? proposeInvoiceNumber(profile) : "")
    window.scrollTo({ top: 0 })
  }

  const steps = [ti.stepCheck, ti.stepInvoice, ti.stepDone]

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-6 py-3 backdrop-blur md:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pl-12 lg:pl-0">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/dashboard/bookings/${booking.id}`}
              aria-label={t.common.back}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{ti.bookingNumber}</span>
                <span className="font-mono text-lg font-bold leading-none text-foreground">{bookingNumber(booking.id)}</span>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {booking.eventName} · {formatEventDate(booking.eventDate, locale, "short")} · {clientName(booking)}
              </p>
            </div>
          </div>

          <ol className="flex items-center gap-1 text-sm sm:gap-2" aria-label={ti.title}>
            {steps.map((label, index) => {
              const state = index < step ? "done" : index === step ? "current" : "todo"
              return (
                <li key={label} className="flex items-center gap-1 sm:gap-2" aria-current={state === "current" ? "step" : undefined}>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      state === "done" ? "bg-green-500/15 text-green-500" : state === "current" ? "bg-red-600 text-white" : "border border-border text-muted-foreground"
                    }`}
                  >
                    {state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
                  </span>
                  <span className={`hidden sm:inline ${state === "current" ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  {index < steps.length - 1 && <span className="mx-1 h-px w-4 bg-border sm:w-8" aria-hidden />}
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      <div className="p-6 md:p-8 lg:p-10">
        {step < 2 && (
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{ti.title}</h1>
            <p className="mt-1 max-w-2xl text-pretty text-muted-foreground">{ti.subtitle}</p>
          </header>
        )}

        {step === 0 && (
          <div className="flex flex-col gap-6">
            <InvoiceCosts bookingId={booking.id} vatExclusive={vatExclusive} value={adjustments} onChange={(value) => { setAdjustments(value); setChecked(false) }} />
            <InvoiceSpecification lines={lines} totals={totals} booking={pricedBooking} profile={profile} />
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-4 w-4 accent-red-600" />
                {ti.checkedLabel}
              </label>
              <Button disabled={!checked || !costsValid} onClick={() => setStep(1)} className="bg-red-600 text-white hover:bg-red-700 disabled:bg-muted disabled:text-muted-foreground">
                {ti.next}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-base font-semibold text-foreground">{ti.methodTitle}</legend>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <MethodCard
                    active={method === "self_billing"}
                    onSelect={() => chooseMethod("self_billing")}
                    icon={<Sparkles className="h-5 w-5" aria-hidden />}
                    title={ti.selfBillingTitle}
                    badge={ti.selfBillingBadge}
                    description={ti.selfBillingDesc}
                  />
                  <MethodCard
                    active={method === "upload"}
                    onSelect={() => chooseMethod("upload")}
                    icon={<Upload className="h-5 w-5" aria-hidden />}
                    title={ti.uploadTitle}
                    description={ti.uploadDesc}
                  />
                </div>
              </fieldset>

              {method === "self_billing" && (
                <section aria-labelledby="details-heading" className="rounded-lg border border-border bg-card p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 id="details-heading" className="text-base font-semibold text-foreground">
                      {ti.yourDetails}
                    </h2>
                    {profileComplete && (
                      <button
                        type="button"
                        onClick={() => setEditingProfile((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:underline"
                      >
                        {editingProfile ? <X className="h-3.5 w-3.5" aria-hidden /> : <Pencil className="h-3.5 w-3.5" aria-hidden />}
                        {editingProfile ? ti.close : ti.edit}
                      </button>
                    )}
                  </div>
                  {!profileComplete && <p className="mt-2 text-sm text-amber-500">{ti.completeDetailsFirst}</p>}
                  <div className="mt-4">
                    {editingProfile ? <BillingProfileForm profile={profile} onSaved={handleProfileSaved} /> : <ProfileSummary profile={profile} />}
                  </div>
                </section>
              )}

              <section aria-labelledby="invoice-fields-heading" className="rounded-lg border border-border bg-card p-5 md:p-6">
                <h2 id="invoice-fields-heading" className="text-base font-semibold text-foreground">
                  {method === "self_billing" ? ti.selfBillingTitle : ti.uploadTitle}
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="invoiceNumber">{ti.invoiceNumber}</Label>
                    <Input id="invoiceNumber" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="font-mono" required />
                    {method === "self_billing" && <p className="text-xs text-muted-foreground">{ti.invoiceNumberHint}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="invoiceDate">{ti.invoiceDate}</Label>
                    <Input id="invoiceDate" type="date" value={invoiceDate} max={today} onChange={(e) => setInvoiceDate(e.target.value)} required />
                  </div>

                  {method === "upload" && (
                    <>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <Label htmlFor="declaredTotal">{ti.declaredTotal}</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">€</span>
                          <Input
                            id="declaredTotal"
                            inputMode="decimal"
                            value={declaredTotal}
                            onChange={(e) => setDeclaredTotal(e.target.value.replace(/[^\d.,]/g, ""))}
                            placeholder={formatEuro(totals.totalCents, locale).replace("€", "").trim()}
                            className="pl-7 font-mono"
                            aria-describedby="declaredTotal-status"
                          />
                        </div>
                        {declaredCents !== null && (
                          <p id="declaredTotal-status" className={`flex items-start gap-1.5 text-sm ${totalMatches ? "text-green-500" : "text-red-500"}`} aria-live="polite">
                            {totalMatches ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden /> : <X className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />}
                            {totalMatches ? ti.totalMatches : ti.totalMismatch(formatEuro(totals.totalCents, locale))}
                          </p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <InvoiceUpload bookingId={booking.id} file={file} onChange={setFile} />
                      </div>
                    </>
                  )}
                </div>

                {method === "self_billing" && (
                  <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5">
                    <button
                      type="button"
                      onClick={() => setShowPreview((v) => !v)}
                      className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-red-500 hover:underline"
                    >
                      <FileText className="h-4 w-4" aria-hidden />
                      {showPreview ? ti.hidePreview : ti.showPreview}
                    </button>
                    {showPreview && (
                      <div className="overflow-hidden rounded-lg border border-border">
                        <InvoiceDocument booking={booking} profile={profile} lines={lines} invoiceNumber={invoiceNumber} invoiceDate={invoiceDate} method="self_billing" />
                      </div>
                    )}
                    {profile.selfBillingAcceptedAt ? (
                      <p className="text-xs text-muted-foreground">
                        {ti.selfBillingAcceptedOn} {formatDateTime(profile.selfBillingAcceptedAt, locale)}
                      </p>
                    ) : (
                      <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
                        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-red-600" />
                        {ti.selfBillingConsent}
                      </label>
                    )}
                  </div>
                )}

                {error && (
                  <p role="alert" className="mt-4 text-sm text-red-500">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="ghost" onClick={() => setStep(0)} className="text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                    {ti.back}
                  </Button>
                  <Button disabled={!canSubmit || isPending} onClick={submit} className="bg-red-600 text-white hover:bg-red-700 disabled:bg-muted disabled:text-muted-foreground">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />}
                    {isPending ? ti.submitting : ti.submit}
                  </Button>
                </div>
              </section>
            </div>

            <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
              <section aria-labelledby="summary-heading" className="rounded-lg border border-border bg-card p-5 md:p-6">
                <h2 id="summary-heading" className="text-base font-semibold text-foreground">
                  {ti.payoutTitle}
                </h2>
                <dl className="mt-4 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{ti.subtotalNet}</dt>
                    <dd className="tabular-nums text-foreground">{formatEuro(totals.netCents, locale)}</dd>
                  </div>
                  {totals.vatBreakdown.map((v) => (
                    <div key={v.rate} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{ti.vatOver(v.rate)} {formatEuro(v.netCents, locale)}</dt>
                      <dd className="tabular-nums text-foreground">{formatEuro(v.vatCents, locale)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 border-t border-border pt-2">
                    <dt className="font-medium text-foreground">{ti.invoiceTotal}</dt>
                    <dd className="font-semibold tabular-nums text-foreground">{formatEuro(totals.totalCents, locale)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{ti.serviceFee}</dt>
                    <dd className="tabular-nums text-muted-foreground">- {formatEuro(pricedBooking.platformFeeCents, locale)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                    <dt className="font-semibold text-foreground">{ti.payout}</dt>
                    <dd className="text-2xl font-bold tabular-nums text-green-500">{formatEuro(pricedBooking.payoutCents, locale)}</dd>
                  </div>
                </dl>
                {profile.iban && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {ti.doneIban} <span className="font-mono text-foreground">{formatIban(profile.iban)}</span>
                  </p>
                )}
              </section>
            </aside>
          </div>
        )}

        {step === 2 && invoice && (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <section aria-labelledby="done-heading" className="flex flex-col items-center gap-4 rounded-lg border border-green-500/30 bg-green-500/10 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
                <Check className="h-7 w-7" aria-hidden />
              </span>
              <div>
                <h1 id="done-heading" className="text-2xl font-bold text-foreground md:text-3xl">
                  {ti.doneTitle}
                </h1>
                <p className="mt-2 text-pretty text-muted-foreground">{ti.doneBody(formatEuro(pricedBooking.payoutCents, locale))}</p>
                {profile.iban && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ti.doneIban} <span className="font-mono text-foreground">{formatIban(profile.iban)}</span>
                  </p>
                )}
              </div>
              <dl className="grid w-full grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 text-left text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{ti.invoiceNumber}</dt>
                  <dd className="mt-0.5 font-mono font-semibold text-foreground">{invoice.invoiceNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{ti.invoiceDate}</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{formatEventDate(invoice.invoiceDate, locale, "short")}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{ti.submittedOn}</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{formatDateTime(invoice.submittedAt, locale)}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {invoice.method === "self_billing" ? (
                  <Button asChild className="bg-red-600 text-white hover:bg-red-700">
                    <Link href={`/dashboard/bookings/${booking.id}/invoice/print`} target="_blank">
                      <Printer className="mr-2 h-4 w-4" aria-hidden />
                      {ti.print}
                    </Link>
                  </Button>
                ) : (
                  invoiceFileUrl(invoice) && (
                    <Button asChild className="bg-red-600 text-white hover:bg-red-700">
                      <a href={invoiceFileUrl(invoice)!} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
                        {ti.viewInvoice}
                      </a>
                    </Button>
                  )
                )}
                <Button asChild variant="outline">
                  <Link href="/dashboard/completed-bookings">{ti.backToCompleted}</Link>
                </Button>
                {!invoiceLocked && (
                  <button type="button" onClick={restart} className="min-h-11 text-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                    {ti.resubmit}
                  </button>
                )}
              </div>
            </section>

            {invoice.method === "self_billing" && (
              <div className="overflow-hidden rounded-lg border border-border">
                <InvoiceDocument booking={booking} profile={profile} lines={invoice.lines} invoiceNumber={invoice.invoiceNumber} invoiceDate={invoice.invoiceDate} method="self_billing" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MethodCard({
  active,
  onSelect,
  icon,
  title,
  badge,
  description,
}: {
  active: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  badge?: string
  description: string
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col gap-3 rounded-lg border p-5 transition-colors ${active ? "border-red-500 bg-red-500/5" : "border-border bg-card hover:bg-accent"}`}
    >
      <input type="radio" name="invoice-method" checked={active} onChange={onSelect} className="sr-only" />
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-md ${active ? "bg-red-600 text-white" : "bg-red-500/10 text-red-500"}`}>{icon}</span>
        {badge && <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">{badge}</span>}
      </div>
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </label>
  )
}

function ProfileSummary({ profile }: { profile: BillingProfile }) {
  const { t } = useBookingT()
  const tf = t.invoice.form
  const address = [
    [profile.street, profile.houseNumber].filter(Boolean).join(" "),
    [profile.postalCode, profile.city].filter(Boolean).join(" "),
  ].filter(Boolean)
  return (
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">{tf.businessName}</dt>
        <dd className="mt-0.5 font-medium text-foreground">{profile.businessName}</dd>
        <dd className="text-muted-foreground">{address.join(", ")}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">{tf.iban}</dt>
        <dd className="mt-0.5 font-mono text-foreground">{profile.iban ? formatIban(profile.iban) : "—"}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">{tf.kvk} / {tf.vatNumber}</dt>
        <dd className="mt-0.5 font-mono text-foreground">
          {profile.kvkNumber ?? "—"} / {profile.vatScheme === "kor" ? tf.schemeKor : (profile.vatNumber ?? "—")}
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">{tf.performanceRate}</dt>
        <dd className="mt-0.5 text-foreground">{profile.vatScheme === "kor" ? "0%" : `${profile.performanceVatRate}%`}</dd>
      </div>
    </dl>
  )
}
