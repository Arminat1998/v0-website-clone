"use client"

import { useState } from "react"
import { Check, Link2, TriangleAlert } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function ArtistShareButton() {
  const nl = useLanguage().language !== "en"
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setState("copied")
    } catch {
      // Copying can be blocked by the browser; the address bar still has the link.
      setState("failed")
    }
    setTimeout(() => setState("idle"), 2500)
  }

  const Icon = state === "copied" ? Check : state === "failed" ? TriangleAlert : Link2
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-4 right-4 z-10 flex min-h-11 items-center gap-1.5 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/80"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span aria-live="polite">
        {state === "copied"
          ? nl ? "Link gekopieerd" : "Link copied"
          : state === "failed"
            ? nl ? "Kopiëren lukt niet" : "Copying failed"
            : nl ? "Deel pagina" : "Share page"}
      </span>
    </button>
  )
}
