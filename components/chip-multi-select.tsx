"use client"

import { useMemo, useState } from "react"
import { Check, Search, X } from "lucide-react"

export interface ChipGroup {
  label: string
  options: { value: string; label: string }[]
}

interface ChipMultiSelectProps {
  groups: ChipGroup[]
  selected: string[]
  onChange: (next: string[]) => void
  searchPlaceholder: string
  /** e.g. (3) => "3 gekozen" */
  countLabel: (count: number) => string
  clearLabel: string
  emptyLabel: string
  /** Label for a value that is selected but not in the list (older profiles). */
  labelFor?: (value: string) => string
  invalid?: boolean
}

/** Pick several options from grouped, searchable chips. Everything is visible at once; no dropdown. */
export function ChipMultiSelect({
  groups,
  selected,
  onChange,
  searchPlaceholder,
  countLabel,
  clearLabel,
  emptyLabel,
  labelFor,
  invalid,
}: ChipMultiSelectProps) {
  const [query, setQuery] = useState("")

  const known = useMemo(() => new Set(groups.flatMap((group) => group.options.map((option) => option.value))), [groups])
  const legacy = selected.filter((value) => !known.has(value))

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((group) => ({ ...group, options: group.options.filter((option) => option.label.toLowerCase().includes(q)) }))
      .filter((group) => group.options.length > 0)
  }, [groups, query])

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])

  return (
    <div
      className={`rounded-lg border bg-white p-3 sm:p-4 dark:bg-gray-950 ${
        invalid ? "border-red-500" : "border-gray-300 dark:border-gray-600"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            // Enter belongs to the search box here, not to the form's submit button.
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-10 w-full rounded-md border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span aria-live="polite" className="font-medium text-gray-900 dark:text-white">
            {countLabel(selected.length)}
          </span>
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="text-red-600 hover:underline dark:text-red-400">
              {clearLabel}
            </button>
          )}
        </div>
      </div>

      {legacy.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {legacy.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-red-700 bg-red-700 px-3 py-1.5 text-sm font-medium text-white"
            >
              {labelFor ? labelFor(value) : value}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 max-h-80 space-y-4 overflow-y-auto pr-1">
        {visible.length === 0 && <p className="py-2 text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</p>}
        {visible.map((group) => (
          <div key={group.label} role="group" aria-label={group.label}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const active = selected.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(option.value)}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                      active
                        ? "border-red-700 bg-red-700 text-white"
                        : "border-gray-300 bg-transparent text-gray-800 hover:border-red-500 dark:border-gray-600 dark:text-gray-200"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
