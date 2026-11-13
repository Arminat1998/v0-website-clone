"use client"

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"

export interface ComboOption {
  value: string
  label: string
  description?: string
  icon?: ReactNode
}

export interface ComboGroup {
  label?: string
  options: ComboOption[]
}

interface ComboSelectBase {
  /** Id of the trigger button, so a form can focus it. */
  id?: string
  /** Id of the visible label element. */
  labelledBy?: string
  describedBy?: string
  groups: ComboGroup[]
  nl: boolean
  placeholder: string
  searchPlaceholder: string
  invalid?: boolean
  /** How many chosen options show as chips in the closed field before "+n more". */
  maxChips?: number
  /** Label for a chosen value that is not in the list (older profiles). */
  labelFor?: (value: string) => string
  className?: string
}

type ComboSelectProps = ComboSelectBase &
  (
    | { multiple: true; value: string[]; onChange: (value: string[]) => void }
    | { multiple?: false; value: string; onChange: (value: string) => void }
  )

const text = {
  nl: {
    selected: (n: number) => `${n} gekozen`,
    clear: "Wis alles",
    done: "Klaar",
    more: (n: number) => `+${n} meer`,
    remove: (label: string) => `Verwijder ${label}`,
    empty: (q: string) => `Niets gevonden voor "${q}". Probeer een ander woord.`,
  },
  en: {
    selected: (n: number) => `${n} selected`,
    clear: "Clear all",
    done: "Done",
    more: (n: number) => `+${n} more`,
    remove: (label: string) => `Remove ${label}`,
    empty: (q: string) => `Nothing found for "${q}". Try another word.`,
  },
}

/**
 * Dropdown with search and groups. Chooses one option (closes at once) or several
 * (stays open until "Done", Escape or a click outside).
 */
export function ComboSelect(props: ComboSelectProps) {
  const { id, labelledBy, describedBy, groups, nl, placeholder, searchPlaceholder, invalid, maxChips = 4, labelFor, className } = props
  const t = nl ? text.nl : text.en
  const multiple = props.multiple === true
  const selected: string[] = multiple ? props.value : props.value ? [props.value] : []

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const panelId = useId()
  const summaryId = useId()

  const labels = useMemo(() => {
    const map = new Map<string, string>()
    for (const group of groups) for (const option of group.options) map.set(option.value, option.label)
    return map
  }, [groups])
  const labelOf = (value: string) => labels.get(value) ?? labelFor?.(value) ?? value

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((group) => ({ ...group, options: group.options.filter((option) => option.label.toLowerCase().includes(q)) }))
      .filter((group) => group.options.length > 0)
  }, [groups, query])

  const close = (refocus: boolean) => {
    setOpen(false)
    setQuery("")
    if (refocus) triggerRef.current?.focus()
  }

  // Close on a click or tap outside the field.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  // On open: bring the panel into view, and focus the search box unless the device is a touch screen
  // (the keyboard would cover the list).
  useEffect(() => {
    if (!open) return
    panelRef.current?.scrollIntoView({ block: "nearest" })
    if (!window.matchMedia("(pointer: coarse)").matches) searchRef.current?.focus({ preventScroll: true })
  }, [open])

  const choose = (value: string) => {
    if (props.multiple) {
      props.onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
    } else {
      props.onChange(value)
      close(true)
    }
  }

  const options = () => Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>("[data-option]") ?? [])

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      close(true)
      return
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    const rows = options()
    if (rows.length === 0) return
    event.preventDefault()
    const index = rows.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === "ArrowDown") rows[index < 0 ? 0 : Math.min(index + 1, rows.length - 1)].focus()
    else if (index <= 0) searchRef.current?.focus()
    else rows[index - 1].focus()
  }

  const shown = selected.slice(0, maxChips)
  const summary = selected.length > 0 ? selected.map(labelOf).join(", ") : placeholder

  return (
    <div ref={rootRef} className={`rf relative ${className ?? ""}`}>
      <div
        data-open={open}
        data-invalid={invalid ? "true" : "false"}
        className="relative flex min-h-12 items-center gap-2 rounded-[10px] border border-[var(--rf-line)] bg-[var(--rf-field)] py-1.5 pl-3.5 pr-3 text-[var(--rf-text)] transition-colors data-[invalid=true]:border-[var(--rf-red-text)] data-[open=true]:border-[var(--rf-red)] data-[open=true]:ring-[3px] data-[open=true]:ring-[var(--rf-red-soft)]"
      >
        {/* The whole field is the button. Chips sit above it and only their remove buttons take clicks. */}
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-labelledby={labelledBy && id ? `${labelledBy} ${id}` : undefined}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onClick={() => (open ? close(false) : setOpen(true))}
          className="absolute inset-0 cursor-pointer rounded-[10px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rf-focus)]"
        >
          <span className="sr-only" id={summaryId}>
            {summary}
          </span>
        </button>

        <div className="pointer-events-none relative flex min-w-0 flex-1 flex-wrap items-center gap-1.5" aria-hidden={selected.length === 0 ? true : undefined}>
          {selected.length === 0 ? (
            <span className="text-base text-[var(--rf-placeholder)]">{placeholder}</span>
          ) : multiple ? (
            <>
              {shown.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--rf-red)] bg-[var(--rf-red-soft)] py-0.5 pl-2.5 pr-1 text-[13px] font-semibold text-[var(--rf-chip-text)]"
                >
                  {labelOf(value)}
                  <button
                    type="button"
                    aria-label={t.remove(labelOf(value))}
                    onClick={() => props.multiple && props.onChange(selected.filter((item) => item !== value))}
                    className="pointer-events-auto relative z-10 grid size-6 place-items-center rounded-full outline-none hover:bg-[var(--rf-line-soft)] focus-visible:outline-2 focus-visible:outline-[var(--rf-focus)]"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {selected.length > maxChips && (
                <span className="px-1 text-[13px] text-[var(--rf-muted)]">{t.more(selected.length - maxChips)}</span>
              )}
            </>
          ) : (
            <span className="truncate text-base">{labelOf(selected[0])}</span>
          )}
        </div>

        {multiple && selected.length > 0 && (
          <span aria-hidden="true" className="pointer-events-none relative rounded-full bg-[var(--rf-red)] px-2 py-0.5 text-xs font-bold text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown
          aria-hidden="true"
          className={`pointer-events-none relative size-[18px] shrink-0 text-[var(--rf-muted)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          onKeyDown={onPanelKeyDown}
          className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-[var(--rf-line)] bg-[var(--rf-card)] text-[var(--rf-text)] shadow-[var(--rf-shadow)]"
        >
          <div className="relative border-b border-[var(--rf-line-soft)] p-2.5">
            <Search className="pointer-events-none absolute left-[22px] top-1/2 size-4 -translate-y-1/2 text-[var(--rf-muted)]" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                // Enter picks the first match; it must never submit the form.
                if (event.key !== "Enter") return
                event.preventDefault()
                const first = visible[0]?.options[0]
                if (first) choose(first.value)
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoComplete="off"
              className="h-[42px] w-full rounded-lg border border-[var(--rf-line)] bg-[var(--rf-field)] pl-9 pr-3 text-[15px] text-[var(--rf-text)] outline-none placeholder:text-[var(--rf-placeholder)] focus-visible:border-[var(--rf-focus)] focus-visible:ring-2 focus-visible:ring-[var(--rf-focus)]/40"
            />
          </div>

          <div role="listbox" aria-multiselectable={multiple || undefined} aria-labelledby={labelledBy} className="max-h-72 overflow-y-auto px-1.5 pb-2">
            {visible.length === 0 && <p className="px-2 py-4 text-sm text-[var(--rf-muted)]">{t.empty(query.trim())}</p>}
            {visible.map((group, index) => {
              const chosen = group.options.filter((option) => selected.includes(option.value)).length
              return (
                <div key={group.label ?? index} role="group" aria-label={group.label}>
                  {group.label && (
                    <div className="sticky top-0 z-[1] flex justify-between bg-[var(--rf-card)] px-2 pb-1.5 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--rf-muted)]">
                      {group.label}
                      {multiple && chosen > 0 && <span className="font-medium normal-case tracking-normal">{t.selected(chosen)}</span>}
                    </div>
                  )}
                  <div className={`grid gap-x-1.5 gap-y-0.5 ${multiple ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                    {group.options.map((option) => {
                      const on = selected.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={on}
                          data-option
                          onClick={() => choose(option.value)}
                          className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[15px] outline-none hover:bg-[var(--rf-line-soft)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rf-focus)] aria-selected:bg-[var(--rf-red-soft)]"
                        >
                          {multiple && (
                            <span
                              aria-hidden="true"
                              className={`grid size-5 shrink-0 place-items-center rounded-md border-[1.5px] ${on ? "border-[var(--rf-red)] bg-[var(--rf-red)]" : "border-[var(--rf-line)]"}`}
                            >
                              {on && <Check className="size-3.5 text-white" strokeWidth={3.2} />}
                            </span>
                          )}
                          {!multiple && option.icon && (
                            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-[var(--rf-line-soft)] bg-[var(--rf-field)] text-[var(--rf-red-text)]">
                              {option.icon}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            {option.label}
                            {option.description && <small className="block text-[13px] text-[var(--rf-muted)]">{option.description}</small>}
                          </span>
                          {!multiple && (
                            <span
                              aria-hidden="true"
                              className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] ${on ? "border-[var(--rf-red)] bg-[var(--rf-red)]" : "border-[var(--rf-line)]"}`}
                            >
                              {on && <Check className="size-3.5 text-white" strokeWidth={3.2} />}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {multiple && (
            <div className="flex items-center gap-3 border-t border-[var(--rf-line-soft)] px-3 py-2.5">
              <span className="text-sm font-semibold" aria-live="polite">
                {t.selected(selected.length)}
              </span>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => props.multiple && props.onChange([])}
                  className="rounded text-sm font-semibold text-[var(--rf-red-text)] outline-none hover:underline focus-visible:outline-2 focus-visible:outline-[var(--rf-focus)]"
                >
                  {t.clear}
                </button>
              )}
              <button
                type="button"
                onClick={() => close(true)}
                className="ml-auto rounded-lg bg-[var(--rf-red)] px-[18px] py-2 text-sm font-semibold text-white outline-none hover:bg-[var(--rf-red-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rf-focus)]"
              >
                {t.done}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
