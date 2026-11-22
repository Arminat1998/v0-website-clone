import useSWR from "swr"
import type { Artist, Photographer } from "@/lib/smart-search"

/** Which list: artists, or photographers and videographers. */
export type ProfessionalKind = "artist" | "photo-video"

interface LiveProfessionals {
  artist: Artist
  "photo-video": Photographer
}

const SOURCES = {
  artist: { url: "/api/artists/live", field: "artists" },
  "photo-video": { url: "/api/photographers/live", field: "photographers" },
} as const

const NONE: never[] = []

async function fetchLive(kind: ProfessionalKind) {
  const { url, field } = SOURCES[kind]
  // The time limit keeps a hanging connection from loading forever.
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`${url} answered ${response.status}`)
  const list = (await response.json())?.[field]
  if (!Array.isArray(list)) throw new Error(`${url} answered without ${field}`)
  return list
}

/** The registered professionals that are live on the platform. After an error, `retry` fetches them again. */
export function useLiveProfessionals<K extends ProfessionalKind>(kind: K, enabled = true) {
  const { data, error, isValidating, mutate } = useSWR<LiveProfessionals[K][]>(
    enabled ? SOURCES[kind].url : null,
    () => fetchLive(kind),
    { revalidateOnFocus: true },
  )
  return {
    professionals: data ?? (NONE as LiveProfessionals[K][]),
    /** True until the first answer, good or bad. */
    isLoading: enabled && !data && !error,
    /** True when there is nothing to show because fetching failed. */
    failed: Boolean(error) && !data,
    isRetrying: isValidating,
    retry: () => void mutate(),
  }
}
