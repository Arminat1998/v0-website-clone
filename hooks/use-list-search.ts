"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { trackUserTest } from "@/lib/usertest"
import { parseSearch } from "@/lib/adaptive-filters"
import {
  NO_FILTERS,
  cleanFilters,
  filtersFromParams,
  filtersToParams,
  followText,
  withoutFilter,
  type FilterKey,
  type ListFilters,
  type ProfessionalKind,
} from "@/lib/list-filters"

/**
 * The search text and filters of a list page. The panel, the chat and the results all read from here, so a filter
 * that is removed in one place is gone everywhere. Filters named in the text follow the text, and the address bar
 * follows the filters.
 */
export function useListSearch(kind: ProfessionalKind) {
  const [query, setQueryState] = useState("")
  const [filters, setFilters] = useState<ListFilters>(NO_FILTERS)
  // False until the address (or an earlier visit) has been read.
  const [ready, setReady] = useState(false)
  const fromText = useRef<Partial<ListFilters>>({})

  const setQuery = useCallback(
    (text: string) => {
      const before = fromText.current
      const after = parseSearch(text, kind).filters
      fromText.current = after
      setQueryState(text)
      setFilters((current) => followText(current, before, after))
    },
    [kind],
  )

  /** Starts over with this text: earlier filters are dropped. */
  const search = useCallback(
    (text: string) => {
      const after = parseSearch(text, kind).filters
      fromText.current = after
      if (text.trim()) trackUserTest("search_started", { kind, filters: Object.keys(after) })
      setQueryState(text)
      setFilters({ ...NO_FILTERS, ...after })
    },
    [kind],
  )

  const update = useCallback((patch: Partial<ListFilters>) => setFilters((current) => ({ ...current, ...patch })), [])
  const remove = useCallback((key: FilterKey) => setFilters((current) => withoutFilter(current, key)), [])
  const clearFilters = useCallback(() => setFilters(NO_FILTERS), [])

  /** Drops only the search text; filters stay. */
  const dropText = useCallback(() => {
    fromText.current = {}
    setQueryState("")
  }, [])

  const clearAll = useCallback(() => {
    fromText.current = {}
    setQueryState("")
    setFilters(NO_FILTERS)
  }, [])

  const restore = useCallback(
    (text: string, saved: Partial<Record<FilterKey, unknown>>) => {
      fromText.current = parseSearch(text, kind).filters
      setQueryState(text)
      setFilters(cleanFilters(saved))
      setReady(true)
    },
    [kind],
  )

  /** Reads the address bar; returns the search text when it should open the chat (a search from another page). */
  const readAddress = useCallback(() => {
    const { query: text, filters: saved } = filtersFromParams(kind, new URLSearchParams(window.location.search))
    if (saved) restore(text, saved)
    else {
      search(text)
      setReady(true)
    }
    return saved ? "" : text
  }, [kind, restore, search])

  useEffect(() => {
    if (!ready) return
    const path = window.location.pathname
    // After a short pause, so typing does not write the address on every key.
    const timer = setTimeout(() => {
      const params = filtersToParams(kind, query, filters).toString()
      const address = `${path}${params ? `?${params}` : ""}`
      if (window.location.pathname === path && address !== `${path}${window.location.search}`) window.history.replaceState(null, "", address)
    }, 300)
    return () => clearTimeout(timer)
  }, [ready, kind, query, filters])

  return { query, filters, ready, setQuery, search, update, remove, clearFilters, dropText, clearAll, restore, readAddress }
}

export type ListSearch = ReturnType<typeof useListSearch>
