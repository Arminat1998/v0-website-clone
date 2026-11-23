"use client"
import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ListFilters } from "@/components/list-filters"
import { ArtiestGrid } from "@/components/artiest-grid"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useListSearch } from "@/hooks/use-list-search"
import { consumeListStateForReturn, updateListState, type ArtiestListState } from "@/lib/artiest-list-state"
import { parseSearch } from "@/lib/adaptive-filters"

export default function ArtiestenPage() {
  const { t } = useLanguage()
  const search = useListSearch("artist")
  const { query, filters, ready, restore, readAddress } = search
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [restored, setRestored] = useState<ArtiestListState | null>(null)
  const [autoStart, setAutoStart] = useState(false)

  useEffect(() => {
    const saved = window.location.search ? null : consumeListStateForReturn()
    if (saved) {
      setRestored(saved)
      restore(saved.searchQuery ?? "", saved.filters ?? {})
    } else if (readAddress()) {
      setAutoStart(true)
    }
  }, [restore, readAddress])

  useEffect(() => {
    if (ready) updateListState({ searchQuery: query, filters })
  }, [query, filters, ready])

  useEffect(() => {
    if (!ready) return

    const savedScrollY = restored?.scrollY
    const timers: ReturnType<typeof setTimeout>[] = []
    if (savedScrollY) {
      const apply = () => window.scrollTo(0, savedScrollY)
      apply()
      timers.push(setTimeout(apply, 50), setTimeout(apply, 200))
    }

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        updateListState({ scrollY: window.scrollY })
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      timers.forEach(clearTimeout)
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
    }
  }, [ready, restored])

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />

      <div className="lg:hidden bg-card border-b border-border px-4 py-3">
        <Button variant="outline" onClick={() => setIsMobileFilterOpen(true)} className="flex h-11 items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" aria-hidden />
          {t.filters}
        </Button>
      </div>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileFilterOpen(false)} />
      )}

      {ready && (
        <main className="flex">
          <ListFilters
            kind="artist"
            filters={filters}
            onChange={search.update}
            onClear={search.clearAll}
            fromSearch={Object.keys(parseSearch(query, "artist").filters).length > 0}
            isMobileOpen={isMobileFilterOpen}
            onMobileClose={() => setIsMobileFilterOpen(false)}
          />
          <ArtiestGrid
            search={search}
            initialSort={restored?.sortBy}
            autoStart={autoStart}
            onAutoStartComplete={() => setAutoStart(false)}
          />
        </main>
      )}
      {ready && <Footer />}
    </div>
  )
}
