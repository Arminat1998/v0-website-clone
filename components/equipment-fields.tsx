"use client"

import { Camera, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NumericInput } from "@/components/numeric-input"
import { useImageCrop } from "@/hooks/use-image-crop"
import { fileToDataUrl } from "@/lib/crop-image"
import { imageSrc } from "@/lib/professional-profile-types"

export interface EquipmentValue {
  name: string
  price: string
  description: string
  image?: string
}

interface EquipmentFieldsProps {
  value: Partial<EquipmentValue>
  onChange: (patch: Partial<EquipmentValue>) => void
  namePlaceholder: string
  photoId: string
  nl: boolean
}

export const equipmentFieldClass =
  "h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"

export function EquipmentFields({ value, onChange, namePlaceholder, photoId, nl }: EquipmentFieldsProps) {
  const { requestCrop, cropDialog } = useImageCrop()

  async function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const cropped = await requestCrop(file, { aspect: 4 / 3 })
    if (cropped) onChange({ image: await fileToDataUrl(cropped) })
  }

  const hasImage = Boolean(value.image)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_11rem]">
        <Input
          placeholder={namePlaceholder}
          value={value.name ?? ""}
          onChange={(e) => onChange({ name: e.target.value })}
          className={equipmentFieldClass}
          aria-label={nl ? "Naam apparatuur" : "Equipment name"}
        />
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
          <NumericInput
            allowDecimal
            placeholder={nl ? "Prijs per dag" : "Price per day"}
            value={value.price ?? ""}
            onValueChange={(price) => onChange({ price })}
            className={`${equipmentFieldClass} pl-7 pr-12`}
            aria-label={nl ? "Huurprijs per dag" : "Rental price per day"}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            {nl ? "/dag" : "/day"}
          </span>
        </div>
      </div>

      <Textarea
        placeholder={nl ? "Korte beschrijving" : "Short description"}
        value={value.description ?? ""}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={2}
        className="w-full resize-none rounded-md border border-gray-300 dark:border-gray-600 dark:!bg-slate-800 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
      />

      <div className="flex items-center gap-3">
        {hasImage && (
          <img
            src={imageSrc(value.image) || "/placeholder.svg"}
            alt={value.name || (nl ? "Apparatuurfoto" : "Equipment photo")}
            className="h-14 w-14 shrink-0 rounded-md border border-gray-300 object-cover dark:border-gray-600"
          />
        )}
        <input id={photoId} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        <label
          htmlFor={photoId}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:!bg-slate-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          {hasImage ? (nl ? "Foto wijzigen" : "Change photo") : nl ? "Foto toevoegen" : "Add photo"}
        </label>
        {hasImage && (
          <button
            type="button"
            onClick={() => onChange({ image: "" })}
            aria-label={nl ? "Foto verwijderen" : "Remove photo"}
            className="flex h-10 w-10 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {cropDialog}
    </div>
  )
}
