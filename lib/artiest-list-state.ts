const STATE_KEY = "arsi:artiesten-list-state"
const RETURN_KEY = "arsi:artiesten-return-pending"

export interface ArtiestListState {
  searchQuery?: string
  filters?: Record<string, any>
  sortBy?: string
  useAISearch?: boolean
  scrollY?: number
}

function readRaw(): ArtiestListState {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.sessionStorage.getItem(STATE_KEY)
    return raw ? (JSON.parse(raw) as ArtiestListState) : {}
  } catch {
    return {}
  }
}

export function updateListState(patch: Partial<ArtiestListState>) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(STATE_KEY, JSON.stringify({ ...readRaw(), ...patch }))
  } catch {
    // sessionStorage unavailable (private mode / quota): restoring is best-effort
  }
}

export function markListReturnPending() {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(RETURN_KEY, "1")
  } catch {}
}

/**
 * Returns the saved list state only when the user is coming back from an artist page.
 * The flag is cleared on the next tick so React strict-mode double effects still see it.
 */
export function consumeListStateForReturn(): ArtiestListState | null {
  if (typeof window === "undefined") return null
  try {
    if (window.sessionStorage.getItem(RETURN_KEY) !== "1") return null
    setTimeout(() => window.sessionStorage.removeItem(RETURN_KEY), 0)
    return readRaw()
  } catch {
    return null
  }
}
