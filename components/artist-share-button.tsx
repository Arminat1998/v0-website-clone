"use client"

import { useState } from "react"
import { Check, Link2 } from "lucide-react"

export function ArtistShareButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/80"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? "Link gekopieerd" : "Deel pagina"}
    </button>
  )
}
