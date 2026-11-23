"use client"

import { useState, useTransition, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { saveBillingProfile, type BillingProfileErrors } from "@/app/actions/invoices"
import { useBookingT } from "@/lib/booking-i18n"
import type { BillingProfile, VatScheme } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { digitsOnly, lettersOnly, postalCodeChars } from "@/lib/input-filters"

interface Props {
  profile: BillingProfile
  onSaved: (profile: BillingProfile) => void
  /** Only needed on invoices ARSI Events makes; an uploaded invoice already shows the address. */
  addressRequired?: boolean
}

export function BillingProfileForm({ profile, onSaved, addressRequired = true }: Props) {
  const { t } = useBookingT()
  const tf = t.invoice.form
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<BillingProfileErrors>({})
  const [vatScheme, setVatScheme] = useState<VatScheme>(profile.vatScheme)
  const [performanceVatRate, setPerformanceVatRate] = useState(profile.performanceVatRate)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const value = (key: string) => String(data.get(key) ?? "")
    setError(null)
    setErrors({})
    startTransition(async () => {
      try {
        const result = await saveBillingProfile({
          businessName: value("businessName"),
          kvkNumber: value("kvkNumber"),
          vatNumber: value("vatNumber"),
          vatScheme,
          performanceVatRate,
          iban: value("iban"),
          street: value("street"),
          houseNumber: value("houseNumber"),
          postalCode: value("postalCode"),
          city: value("city"),
          country: value("country"),
          invoicePrefix: value("invoicePrefix"),
          nextInvoiceNumber: Number.parseInt(value("nextInvoiceNumber"), 10),
        })
        if (result.ok) {
          onSaved(result.profile)
          return
        }
        setErrors(result.errors)
        const first = form.elements.namedItem(result.errors.businessName ? "businessName" : "iban")
        if (first instanceof HTMLElement) first.focus()
      } catch {
        setError(tf.error)
      }
    })
  }

  const field = "flex flex-col gap-1.5"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={`${field} sm:col-span-2`}>
          <Label htmlFor="businessName">{tf.businessName}</Label>
          <Input
            id="businessName"
            name="businessName"
            defaultValue={profile.businessName}
            required
            autoComplete="organization"
            aria-invalid={Boolean(errors.businessName)}
            aria-describedby={errors.businessName ? "businessName-error" : undefined}
          />
          {errors.businessName && (
            <p id="businessName-error" role="alert" className="text-sm text-red-700 dark:text-red-400">
              {tf.errorBusinessName}
            </p>
          )}
        </div>
        <div className={field}>
          <Label htmlFor="kvkNumber">{tf.kvk}</Label>
          <Input id="kvkNumber" name="kvkNumber" maxLength={8} onInput={(e) => (e.currentTarget.value = digitsOnly(e.currentTarget.value))} defaultValue={profile.kvkNumber ?? ""} inputMode="numeric" />
        </div>
        <div className={field}>
          <Label htmlFor="iban">{tf.iban}</Label>
          <Input
            id="iban"
            name="iban"
            defaultValue={profile.iban ?? ""}
            required
            placeholder="NL00 BANK 0000 0000 00"
            className="font-mono"
            aria-invalid={Boolean(errors.iban)}
            aria-describedby={errors.iban ? "iban-error" : undefined}
          />
          {errors.iban && (
            <p id="iban-error" role="alert" className="text-sm text-red-700 dark:text-red-400">
              {errors.iban === "REQUIRED" ? tf.errorIbanRequired : tf.errorIbanInvalid}
            </p>
          )}
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-foreground">{tf.vatScheme}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(["standard", "kor"] as const).map((scheme) => (
            <label
              key={scheme}
              className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors ${vatScheme === scheme ? "border-red-500 bg-red-500/5" : "border-border hover:bg-accent"}`}
            >
              <input type="radio" name="vatScheme" value={scheme} checked={vatScheme === scheme} onChange={() => setVatScheme(scheme)} className="accent-red-600" />
              <span className="text-foreground">{scheme === "standard" ? tf.schemeStandard : tf.schemeKor}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {vatScheme === "standard" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={field}>
            <Label htmlFor="vatNumber">{tf.vatNumber}</Label>
            <Input id="vatNumber" name="vatNumber" defaultValue={profile.vatNumber ?? ""} placeholder="NL000000000B01" className="font-mono uppercase" />
          </div>
          <div className={field}>
            <Label htmlFor="performanceVatRate">{tf.performanceRate}</Label>
            <select
              id="performanceVatRate"
              value={performanceVatRate}
              onChange={(e) => setPerformanceVatRate(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value={9}>{tf.rate9}</option>
              <option value={21}>{tf.rate21}</option>
            </select>
          </div>
        </div>
      )}
      {vatScheme === "kor" && <input type="hidden" name="vatNumber" value={profile.vatNumber ?? ""} />}

      <div className="grid grid-cols-6 gap-4">
        <div className={`${field} col-span-4`}>
          <Label htmlFor="street">{tf.street}</Label>
          <Input id="street" name="street" defaultValue={profile.street ?? ""} required={addressRequired} autoComplete="address-line1" />
        </div>
        <div className={`${field} col-span-2`}>
          <Label htmlFor="houseNumber">{tf.houseNumber}</Label>
          <Input id="houseNumber" name="houseNumber" defaultValue={profile.houseNumber ?? ""} />
        </div>
        <div className={`${field} col-span-2`}>
          <Label htmlFor="postalCode">{tf.postalCode}</Label>
          <Input id="postalCode" name="postalCode" onInput={(e) => (e.currentTarget.value = postalCodeChars(e.currentTarget.value))} defaultValue={profile.postalCode ?? ""} required={addressRequired} autoComplete="postal-code" />
        </div>
        <div className={`${field} col-span-4 sm:col-span-2`}>
          <Label htmlFor="city">{tf.city}</Label>
          <Input id="city" name="city" onInput={(e) => (e.currentTarget.value = lettersOnly(e.currentTarget.value))} defaultValue={profile.city ?? ""} required={addressRequired} autoComplete="address-level2" />
        </div>
        <div className={`${field} col-span-6 sm:col-span-2`}>
          <Label htmlFor="country">{tf.country}</Label>
          <Input id="country" name="country" onInput={(e) => (e.currentTarget.value = lettersOnly(e.currentTarget.value))} defaultValue={profile.country} autoComplete="country-name" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={field}>
          <Label htmlFor="invoicePrefix">{tf.prefix}</Label>
          <Input id="invoicePrefix" name="invoicePrefix" defaultValue={profile.invoicePrefix} className="font-mono uppercase" />
          <p className="text-xs text-muted-foreground">{tf.prefixHint}</p>
        </div>
        <div className={field}>
          <Label htmlFor="nextInvoiceNumber">{tf.nextNumber}</Label>
          <Input id="nextInvoiceNumber" name="nextInvoiceNumber" type="number" min={1} defaultValue={profile.nextInvoiceNumber} className="font-mono" />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start bg-red-600 text-white hover:bg-red-700">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
        {isPending ? tf.saving : tf.save}
      </Button>
    </form>
  )
}
