"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EquipmentFields, type EquipmentValue } from "@/components/equipment-fields"

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
  category?: AdditionalCategory
  items: AdditionalEquipmentItem[]
  onAdd: (item: AdditionalEquipmentItem) => void
  onUpdate: (id: string, patch: Partial<EquipmentValue>) => void
  onRemove: (id: string) => void
  nl: boolean
  /** Photographers and videographers add extras (second shooter, drone, album) instead of equipment. */
  extras?: boolean
}

export function AdditionalEquipment({ category, items, onAdd, onUpdate, onRemove, nl, extras = false }: AdditionalEquipmentProps) {
  const label =
    category === "lighting"
      ? nl ? "Extra lichtset" : "Extra lighting set"
      : category === "sound"
        ? nl ? "Extra geluidsset" : "Extra sound set"
        : extras ? "Extra" : nl ? "Extra apparatuur" : "Extra equipment"
  const addLabel =
    category === "lighting"
      ? nl ? "Nog een lichtset toevoegen" : "Add another lighting set"
      : category === "sound"
        ? nl ? "Nog een geluidsset toevoegen" : "Add another sound set"
        : extras ? (nl ? "Extra toevoegen" : "Add extra") : nl ? "Apparatuur toevoegen" : "Add equipment"
  const namePlaceholder =
    category === "lighting"
      ? nl ? "bijv. 8x draadloze LED-uplighters" : "e.g. 8x wireless LED uplighters"
      : category === "sound"
        ? nl ? "bijv. Subwoofer, extra speakers" : "e.g. Subwoofer, extra speakers"
        : extras
          ? nl ? "bijv. Drone-opnames, tweede fotograaf" : "e.g. Drone footage, second shooter"
          : nl ? "Naam apparatuur" : "Equipment name"

  return (
    <div className={category ? "space-y-3 border-t border-[var(--rf-line-soft)] pt-3" : "space-y-3"}>
      {items.map((item, index) => (
        <div key={item.id} className="space-y-3 rounded-xl border border-[var(--rf-line-soft)] bg-[var(--rf-card)] p-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-[var(--rf-text)]">
              {label} {category ? index + 1 : ""}
            </h5>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={nl ? "Verwijderen" : "Remove"}
              className="grid size-9 place-items-center rounded-md text-[var(--rf-muted)] transition-colors hover:text-[var(--rf-red-text)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <EquipmentFields
            value={item}
            onChange={(patch) => onUpdate(item.id, patch)}
            namePlaceholder={namePlaceholder}
            photoId={`additional-photo-${item.id}`}
            nl={nl}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onAdd({ id: crypto.randomUUID(), name: "", price: "", description: "", image: "", category })}
        className="h-10 w-full rounded-lg border-[var(--rf-line)] bg-[var(--rf-field)] text-[var(--rf-text)] hover:bg-[var(--rf-line-soft)] dark:bg-[var(--rf-field)] dark:hover:bg-[var(--rf-line-soft)] sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  )
}
