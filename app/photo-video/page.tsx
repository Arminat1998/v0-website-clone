"use client"
import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { ListFilters } from "@/components/list-filters"
import { PhotoVideoGrid } from "@/components/photo-video-grid"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useListSearch } from "@/hooks/use-list-search"
import { parseSearch } from "@/lib/adaptive-filters"

export default function PhotoVideoPage() {
  const { t } = useLanguage()
  const search = useListSearch("photo-video")
  const { query, filters, ready, readAddress } = search
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [autoStart, setAutoStart] = useState(false)

  useEffect(() => {
    if (readAddress()) setAutoStart(true)
  }, [readAddress])

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />

      <div className="md:hidden bg-card border-b border-border px-4 py-3">
        <Button variant="outline" onClick={() => setIsMobileFilterOpen(true)} className="flex h-11 items-center gap-2">
          <Menu className="w-4 h-4" aria-hidden />
          {t.filters}
        </Button>
      </div>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileFilterOpen(false)} />
      )}

      {ready && (
        <main className="flex">
          <ListFilters
            kind="photo-video"
            filters={filters}
            onChange={search.update}
            onClear={search.clearAll}
            fromSearch={Object.keys(parseSearch(query, "photo-video").filters).length > 0}
            isMobileOpen={isMobileFilterOpen}
            onMobileClose={() => setIsMobileFilterOpen(false)}
          />
          <PhotoVideoGrid search={search} autoStart={autoStart} onAutoStartComplete={() => setAutoStart(false)} />
        </main>
      )}
    </div>
  )
}
