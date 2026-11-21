"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

/**
 * The filter column of the artist and photo/video lists. On desktop it is a sidebar; on mobile it opens
 * as a dialog with a close button, Escape to close, and a fixed bar to clear all filters or show results.
 */
export function FilterPanel({
  title,
  badge,
  isMobileOpen,
  onMobileClose,
  onReset,
  children,
}: {
  title: string
  badge?: ReactNode
  isMobileOpen?: boolean
  onMobileClose?: () => void
  onReset: () => void
  children: ReactNode
}) {
  const nl = useLanguage().language !== "en"
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isMobileOpen) return
    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileClose?.()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [isMobileOpen, onMobileClose])

  return (
    <aside
      role={isMobileOpen ? "dialog" : undefined}
      aria-modal={isMobileOpen ? true : undefined}
      aria-labelledby="filter-panel-title"
      className={`${
        isMobileOpen ? "fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col" : "hidden md:block w-80"
      } bg-card border-r border-border`}
    >
      <div className={isMobileOpen ? "flex-1 overflow-y-auto p-6" : "p-6"}>
        <div className="mb-6 flex items-center justify-between gap-2">
          <h2 id="filter-panel-title" className="text-xl font-bold text-foreground">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {badge}
            {isMobileOpen && (
              <button
                ref={closeRef}
                type="button"
                onClick={onMobileClose}
                aria-label={nl ? "Filters sluiten" : "Close filters"}
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-6 w-6" aria-hidden />
              </button>
            )}
          </div>
        </div>
        {children}
        {!isMobileOpen && (
          <Button type="button" variant="ghost" onClick={onReset} className="mt-2 w-full">
            {nl ? "Alle filters wissen" : "Clear all filters"}
          </Button>
        )}
      </div>
      {isMobileOpen && (
        <div className="flex gap-3 border-t border-border bg-card p-4">
          <Button type="button" variant="outline" onClick={onReset} className="h-11 flex-1">
            {nl ? "Wis alles" : "Clear all"}
          </Button>
          <Button type="button" onClick={onMobileClose} className="h-11 flex-1 bg-red-700 text-white hover:bg-red-600">
            {nl ? "Toon resultaten" : "Show results"}
          </Button>
        </div>
      )}
    </aside>
  )
}
