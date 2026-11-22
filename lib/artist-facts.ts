/** "2–6 uur" from the profile; example profiles have no hours of their own and show the general range. */
export function hoursLabel(artist: { minHours?: number; maxHours?: number }, nl: boolean) {
  const min = artist.minHours ?? 1
  const max = artist.maxHours ?? 8
  const unit = nl ? "uur" : max === 1 ? "hour" : "hours"
  return min === max ? `${max} ${unit}` : `${min}–${max} ${unit}`
}

/** "Tot 100 km", or null when the profile has no travel range. */
export function rangeLabel(artist: { rangeKm?: number }, nl: boolean) {
  return artist.rangeKm ? `${nl ? "Tot" : "Up to"} ${artist.rangeKm.toLocaleString(nl ? "nl-NL" : "en-GB")} km` : null
}
