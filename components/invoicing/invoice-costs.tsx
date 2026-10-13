"use client"

import { useBookingT } from "@/lib/booking-i18n"
import { MAX_DISTANCE_KM, MAX_EXTRA_CENTS, MAX_EXTRA_COSTS, MAX_PARKING_CENTS, type InvoiceAdjustments } from "@/lib/bookings/invoicing"

export function InvoiceCosts({ value, onChange }: { value: InvoiceAdjustments; onChange: (value: InvoiceAdjustments) => void }) {
  const { locale } = useBookingT()
  const nl = locale.startsWith("nl")
  const inputClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
  const bounded = (raw: string, max: number, scale = 1) => Math.min(max, Math.max(0, Math.round((Number(raw) || 0) * scale)))
  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground md:p-6" aria-labelledby="costs-title">
      <h2 id="costs-title" className="font-semibold">{nl ? "Reisafstand en extra kosten" : "Travel distance and additional costs"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{nl ? "Pas je kilometers aan en voeg eventuele kosten toe. Bedragen zijn inclusief btw; de specificatie wordt direct bijgewerkt." : "Adjust your mileage and add costs. Amounts include VAT; the specification updates immediately."}</p>
      <div className="mt-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex flex-1 flex-col gap-2 text-sm">{nl ? "Reisafstand enkele reis (km)" : "One-way distance (km)"}
            <input className={inputClass} type="number" min="0" max={MAX_DISTANCE_KM} step="1" value={value.distanceKm} onChange={(e) => onChange({ ...value, distanceKm: bounded(e.target.value, MAX_DISTANCE_KM) })} />
            <span className="text-muted-foreground">{nl ? `${value.distanceKm * 2} km retour · € 0,25 per km` : `${value.distanceKm * 2} km return · €0.25 per km`}</span>
          </label>
          <label className="flex flex-1 flex-col gap-2 text-sm">{nl ? "Parkeerkosten (€ incl. btw)" : "Parking (€ incl. VAT)"}
            <input className={inputClass} type="number" min="0" max={MAX_PARKING_CENTS / 100} step="0.01" value={value.parkingCents / 100} onChange={(e) => onChange({ ...value, parkingCents: bounded(e.target.value, MAX_PARKING_CENTS, 100) })} />
          </label>
        </div>
        {value.extras.map((extra, index) => (
          <fieldset key={index} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-end">
            <legend className="px-1 text-sm font-medium">{nl ? "Extra kosten" : "Additional cost"} {index + 1}</legend>
            <label className="flex flex-1 flex-col gap-2 text-sm">{nl ? "Omschrijving" : "Description"}
              <input className={inputClass} maxLength={120} required value={extra.description} onChange={(e) => onChange({ ...value, extras: value.extras.map((item, i) => i === index ? { ...item, description: e.target.value } : item) })} />
            </label>
            <label className="flex flex-col gap-2 text-sm sm:w-40">{nl ? "Bedrag (€ incl. btw)" : "Amount (€ incl. VAT)"}
              <input className={inputClass} type="number" min="0.01" max={MAX_EXTRA_CENTS / 100} step="0.01" required value={extra.amountCents / 100} onChange={(e) => onChange({ ...value, extras: value.extras.map((item, i) => i === index ? { ...item, amountCents: bounded(e.target.value, MAX_EXTRA_CENTS, 100) } : item) })} />
            </label>
            <button type="button" className="h-10 rounded-md border border-border px-3 text-sm hover:bg-accent" onClick={() => onChange({ ...value, extras: value.extras.filter((_, i) => i !== index) })}>{nl ? "Verwijderen" : "Remove"}</button>
          </fieldset>
        ))}
        <button type="button" disabled={value.extras.length >= MAX_EXTRA_COSTS} className="self-start rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50" onClick={() => onChange({ ...value, extras: [...value.extras, { description: "", amountCents: 0 }] })}>{nl ? "+ Extra kosten toevoegen" : "+ Add additional cost"}</button>
        {value.extras.some((extra) => !extra.description.trim() || extra.amountCents <= 0) && <p role="status" className="text-sm text-muted-foreground">{nl ? "Vul voor elke extra kostenregel een omschrijving en bedrag groter dan € 0 in." : "Enter a description and an amount greater than €0 for each additional cost."}</p>}
      </div>
    </section>
  )
}
