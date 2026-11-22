/** The value as an absolute http(s) URL, or null. Anything else (javascript:, data:, text) is refused. */
export function httpUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".") ? value : null
  } catch {
    return null
  }
}

/** Like httpUrl, but also accepts a link without a scheme, such as "open.spotify.com/playlist/1". */
export function linkFromInput(value: string): string | null {
  const text = value.trim()
  if (/\s/.test(text)) return null
  return /^[a-z][a-z0-9+.-]*:/i.test(text) ? httpUrl(text) : httpUrl(`https://${text}`)
}
