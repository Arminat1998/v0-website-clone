"use client"

import { useId, useState } from "react"
import { FileCheck2, Loader2, Paperclip, X } from "lucide-react"
import { useBookingT } from "@/lib/booking-i18n"
import {
  INVOICE_FILE_TYPES,
  MAX_DISTANCE_KM,
  MAX_EXTRA_CENTS,
  MAX_EXTRA_COSTS,
  MAX_INVOICE_FILE_BYTES,
  MAX_PARKING_CENTS,
  type InvoiceAdjustments,
  type ReceiptFile,
} from "@/lib/bookings/invoicing"

function ReceiptPicker({ bookingId, receipt, onChange, nl }: { bookingId: number; receipt: ReceiptFile | null | undefined; onChange: (receipt: ReceiptFile | null) => void; nl: boolean }) {
  const id = useId()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setError(null)
    if (!(INVOICE_FILE_TYPES as readonly string[]).includes(file.type)) return setError(nl ? "Alleen PDF, JPG of PNG." : "Only PDF, JPG or PNG.")
    if (file.size > MAX_INVOICE_FILE_BYTES) return setError(nl ? "Bestand is te groot." : "File is too large.")
    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", file)
      body.append("bookingId", String(bookingId))
      const response = await fetch("/api/invoices/upload", { method: "POST", body })
      if (!response.ok) throw new Error("upload_failed")
      onChange((await response.json()) as ReceiptFile)
    } catch {
      setError(nl ? "Uploaden mislukt. Probeer het opnieuw." : "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  if (receipt) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm">
        <FileCheck2 className="h-4 w-4 flex-shrink-0 text-green-800 dark:text-green-500" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-foreground">{receipt.name}</span>
        <button type="button" onClick={() => onChange(null)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={nl ? "Bon verwijderen" : "Remove receipt"}>
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} aria-busy={uploading} className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-red-500/60 px-3 py-2 text-sm text-foreground hover:bg-accent focus-within:outline-2 focus-within:outline-ring">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin text-red-700 dark:text-red-400" aria-hidden /> : <Paperclip className="h-4 w-4 text-red-700 dark:text-red-400" aria-hidden />}
        {uploading ? (nl ? "Uploaden..." : "Uploading...") : nl ? "Bon of factuur uploaden (verplicht)" : "Upload receipt or invoice (required)"}
        <input
          id={id}
          type="file"
          accept={INVOICE_FILE_TYPES.join(",")}
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (file) void upload(file)
          }}
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
    </div>
  )
}

export function InvoiceCosts({ bookingId, value, onChange, vatExclusive = false }: { bookingId: number; value: InvoiceAdjustments; onChange: (value: InvoiceAdjustments) => void; vatExclusive?: boolean }) {
  const { locale } = useBookingT()
  const nl = locale.startsWith("nl")
  const vatLabel = vatExclusive ? (nl ? "excl. btw" : "excl. VAT") : (nl ? "incl. btw" : "incl. VAT")
  const inputClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
  const bounded = (raw: string, max: number, scale = 1) => Math.min(max, Math.max(0, Math.round((Number(raw) || 0) * scale)))
  const updateExtra = (index: number, patch: Partial<InvoiceAdjustments["extras"][number]>) =>
    onChange({ ...value, extras: value.extras.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  const missingReceipt = (value.parkingCents > 0 && !value.parkingReceipt) || value.extras.some((extra) => !extra.receipt)

  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground md:p-6" aria-labelledby="costs-title">
      <h2 id="costs-title" className="font-semibold">{nl ? "Reisafstand en extra kosten" : "Travel distance and additional costs"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{nl ? `Pas je kilometers aan en voeg eventuele kosten toe. Voor parkeer- en extra kosten is een bon of factuur verplicht. Bedragen zijn ${vatExclusive ? "exclusief" : "inclusief"} btw.` : `Adjust your mileage and add costs. Parking and additional costs require a receipt or invoice. Amounts ${vatExclusive ? "exclude" : "include"} VAT.`}</p>
      <div className="mt-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex flex-1 flex-col gap-2 text-sm">{nl ? "Reisafstand enkele reis (km)" : "One-way distance (km)"}
            <input className={inputClass} type="number" min="0" max={MAX_DISTANCE_KM} step="1" value={value.distanceKm} onChange={(e) => onChange({ ...value, distanceKm: bounded(e.target.value, MAX_DISTANCE_KM) })} />
            <span className="text-muted-foreground">{nl ? `${value.distanceKm * 2} km retour · € 0,25 per km` : `${value.distanceKm * 2} km return · €0.25 per km`}</span>
          </label>
          <div className="flex flex-1 flex-col gap-2">
            <label className="flex flex-col gap-2 text-sm">{nl ? `Parkeerkosten (€ ${vatLabel})` : `Parking (€ ${vatLabel})`}
              <input className={inputClass} type="number" min="0" max={MAX_PARKING_CENTS / 100} step="0.01" value={value.parkingCents / 100} onChange={(e) => onChange({ ...value, parkingCents: bounded(e.target.value, MAX_PARKING_CENTS, 100) })} />
            </label>
            {value.parkingCents > 0 && <ReceiptPicker bookingId={bookingId} nl={nl} receipt={value.parkingReceipt} onChange={(parkingReceipt) => onChange({ ...value, parkingReceipt })} />}
          </div>
        </div>
        {value.extras.map((extra, index) => (
          <fieldset key={index} className="flex flex-col gap-3 rounded-md border border-border p-3">
            <legend className="px-1 text-sm font-medium">{nl ? "Extra kosten" : "Additional cost"} {index + 1}</legend>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-2 text-sm">{nl ? "Omschrijving" : "Description"}
                <input className={inputClass} maxLength={120} required value={extra.description} onChange={(e) => updateExtra(index, { description: e.target.value })} />
              </label>
              <label className="flex flex-col gap-2 text-sm sm:w-40">{nl ? `Bedrag (€ ${vatLabel})` : `Amount (€ ${vatLabel})`}
                <input className={inputClass} type="number" min="0.01" max={MAX_EXTRA_CENTS / 100} step="0.01" required value={extra.amountCents / 100} onChange={(e) => updateExtra(index, { amountCents: bounded(e.target.value, MAX_EXTRA_CENTS, 100) })} />
              </label>
              <button type="button" className="h-10 rounded-md border border-border px-3 text-sm hover:bg-accent" onClick={() => onChange({ ...value, extras: value.extras.filter((_, i) => i !== index) })}>{nl ? "Verwijderen" : "Remove"}</button>
            </div>
            <ReceiptPicker bookingId={bookingId} nl={nl} receipt={extra.receipt} onChange={(receipt) => updateExtra(index, { receipt })} />
          </fieldset>
        ))}
        <button type="button" disabled={value.extras.length >= MAX_EXTRA_COSTS} className="self-start rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50" onClick={() => onChange({ ...value, extras: [...value.extras, { description: "", amountCents: 0, receipt: null }] })}>{nl ? "+ Extra kosten toevoegen" : "+ Add additional cost"}</button>
        {value.extras.some((extra) => !extra.description.trim() || extra.amountCents <= 0) && <p role="status" className="text-sm text-muted-foreground">{nl ? "Vul voor elke extra kostenregel een omschrijving en bedrag groter dan € 0 in." : "Enter a description and an amount greater than €0 for each additional cost."}</p>}
        {missingReceipt && <p role="status" className="text-sm text-muted-foreground">{nl ? "Upload voor elke parkeer- en extra kostenpost een bon of factuur om verder te gaan." : "Upload a receipt or invoice for each parking and additional cost to continue."}</p>}
      </div>
    </section>
  )
}
