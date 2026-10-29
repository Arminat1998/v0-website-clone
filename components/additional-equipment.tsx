"use client"

import { useState } from "react"
import { Camera, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { fileToDataUrl } from "@/lib/crop-image"
import { useImageCrop } from "@/hooks/use-image-crop"

export type AdditionalCategory = "lighting" | "sound"

export interface AdditionalEquipmentItem {
  id: string
  name: string
  price: string
  description: string
  image?: string
  category?: AdditionalCategory
}

interface AdditionalEquipmentProps {
  category: AdditionalCategory
  items: AdditionalEquipmentItem[]
  onAdd: (item: AdditionalEquipmentItem) => void
  onRemove: (id: string) => void
  nl: boolean
}

const fieldClass =
  "h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"

export function AdditionalEquipment({ category, items, onAdd, onRemove, nl }: AdditionalEquipmentProps) {
  const { requestCrop, cropDialog } = useImageCrop()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [error, setError] = useState(false)

  const isLighting = category === "lighting"
  const addLabel = isLighting
    ? nl ? "Nog een lichtset toevoegen" : "Add another lighting set"
    : nl ? "Nog een geluidsset toevoegen" : "Add another sound set"
  const namePlaceholder = isLighting
    ? nl ? "bijv. Moving heads, laser, par cans" : "e.g. Moving heads, laser, par cans"
    : nl ? "bijv. Subwoofer, extra speakers" : "e.g. Subwoofer, extra speakers"

  async function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const cropped = await requestCrop(file, { aspect: 4 / 3 })
    if (cropped) setImage(await fileToDataUrl(cropped))
  }

  function reset() {
    setName("")
    setPrice("")
    setDescription("")
    setImage("")
    setError(false)
    setOpen(false)
  }

  function submit() {
    if (!name.trim() || !price.trim()) {
      setError(true)
      return
    }
    onAdd({ id: crypto.randomUUID(), name: name.trim(), price: price.trim(), description: description.trim(), image, category })
    reset()
  }

  const inputId = `additional-${category}-photo`

  return (
    <div className="mt-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-md border border-gray-300 dark:border-gray-600 p-2.5"
            >
              <div className="flex min-w-0 gap-3">
                {item.image && <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-12 w-12 shrink-0 rounded object-cover" />}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  <p className="mt-0.5 text-xs font-medium text-red-600 dark:text-red-400">{item.price}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={nl ? "Verwijderen" : "Remove"}
                className="shrink-0 text-gray-400 transition-colors hover:text-red-500"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="space-y-3 rounded-md border border-gray-300 dark:border-gray-600 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder={namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
            <Input
              placeholder={nl ? "Huurprijs (bijv. €75/dag)" : "Rental price (e.g. €75/day)"}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={fieldClass}
            />
          </div>
          <Textarea
            placeholder={nl ? "Korte beschrijving" : "Short description"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-gray-300 dark:border-gray-600 dark:!bg-slate-800 px-3 py-2 text-sm"
          />
          {error && (
            <p role="alert" className="text-xs text-red-600">
              {nl ? "Vul een naam en huurprijs in." : "Please enter a name and rental price."}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input id={inputId} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <label
              htmlFor={inputId}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              {image ? (nl ? "Foto toegevoegd" : "Photo added") : nl ? "Foto toevoegen" : "Add photo"}
            </label>
            <Button type="button" size="sm" onClick={submit} className="h-10">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              {nl ? "Toevoegen" : "Add"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset} className="h-10">
              {nl ? "Annuleren" : "Cancel"}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          {addLabel}
        </Button>
      )}
      {cropDialog}
    </div>
  )
}
