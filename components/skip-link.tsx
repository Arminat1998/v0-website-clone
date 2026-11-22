"use client"

import type { MouseEvent } from "react"
import { useLanguage } from "@/contexts/language-context"

/** First thing a keyboard user reaches: jumps past the header to the content of any page. */
export function SkipLink() {
  const nl = useLanguage().language === "nl"

  function skip(event: MouseEvent) {
    event.preventDefault()
    const header = document.querySelector("header")
    const main = document.querySelector("main")
    // Some pages have no main element (or wrap the header in it): then the part after the header is the content.
    const target = main && !(header && main.contains(header)) ? main : (header?.nextElementSibling ?? main)
    if (!(target instanceof HTMLElement)) return
    target.tabIndex = -1
    target.focus()
    target.scrollIntoView()
  }

  return (
    <a
      href="#main"
      onClick={skip}
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-red-700 focus:px-4 focus:text-sm focus:font-medium focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-ring"
    >
      {nl ? "Naar de inhoud" : "Skip to content"}
    </a>
  )
}
