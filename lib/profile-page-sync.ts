import { PAGE_LIMITS, SOCIAL_KEYS, type ArtistPageSocials, type SocialKey } from "@/lib/artist-page-types"
import { canonicalEventType, genreLabel, mainGenres } from "@/lib/profile-options"

/** The parts of "My website" that follow the profile until they are edited there. */
export interface SyncedPage {
  about: string
  eventTypes: string[]
  musicGenres: string[]
  socials: ArtistPageSocials
}

export type SyncedField = "bio" | "eventTypes" | "genres" | "socials"

interface ProfileValues {
  bio: string
  eventTypes: string[]
  genres: string[]
  socials: { platform: string; url: string }[]
}

export function socialsForPage(links: ProfileValues["socials"]): ArtistPageSocials {
  const socials: ArtistPageSocials = {}
  for (const link of links) {
    if ((SOCIAL_KEYS as readonly string[]).includes(link.platform)) socials[link.platform as SocialKey] = link.url
  }
  return socials
}

const key = (value: string) => value.trim().toLowerCase()
const eventKeys = (value: string) => [key(canonicalEventType(value))]
// The page stores genres by the label of the language they were saved in.
const genreKeys = (value: string) => [value, genreLabel(value, true), genreLabel(value, false)].map(key)

/** True when the page shows exactly these profile values, in any order; the page holds a limited number of them. */
function sameTags(onPage: string[], values: string[], keysOf: (value: string) => string[]) {
  const unique = [...new Map(values.map((value) => [keysOf(value)[0], value])).values()]
  const known = new Set(unique.flatMap(keysOf))
  const found = new Set(onPage.flatMap((tag) => keysOf(tag)).filter((tag) => known.has(tag)))
  return (
    onPage.every((tag) => keysOf(tag).some((name) => known.has(name))) &&
    unique.filter((value) => keysOf(value).some((name) => found.has(name))).length >= Math.min(unique.length, PAGE_LIMITS.tags)
  )
}

/**
 * The page after the profile was saved. A part that is empty or still equal to the previous profile follows the
 * profile; a part that was edited on the page stays. `kept` names the parts where the profile changed but the page did not.
 */
export function syncPageWithProfile(
  page: SyncedPage,
  previous: ProfileValues | null,
  next: ProfileValues & { genreLabels: string[] },
): { page: SyncedPage; kept: SyncedField[] } {
  const kept: SyncedField[] = []
  // The Allround marker is a setting, not a genre on the page.
  if (previous) previous = { ...previous, genres: mainGenres(previous.genres) }
  next = { ...next, genres: mainGenres(next.genres) }
  const pick = <T,>(field: SyncedField, follows: boolean, current: T, value: T, changed: boolean, shown: boolean) => {
    if (follows) return value
    if (changed && !shown) kept.push(field)
    return current
  }

  const about = page.about.trim()
  const pageAbout = pick("bio", !about || about === previous?.bio.trim(), page.about, next.bio, next.bio !== previous?.bio, about === next.bio)
  const eventTypes = pick(
    "eventTypes",
    page.eventTypes.length === 0 || (!!previous && sameTags(page.eventTypes, previous.eventTypes, eventKeys)),
    page.eventTypes,
    next.eventTypes,
    !previous || !sameTags(next.eventTypes, previous.eventTypes, eventKeys),
    sameTags(page.eventTypes, next.eventTypes, eventKeys),
  )
  const musicGenres = pick(
    "genres",
    page.musicGenres.length === 0 || (!!previous && sameTags(page.musicGenres, previous.genres, genreKeys)),
    page.musicGenres,
    next.genreLabels,
    !previous || !sameTags(next.genres, previous.genres, genreKeys),
    sameTags(page.musicGenres, next.genres, genreKeys),
  )

  // Socials are compared per platform, so one edited link does not hold back the others.
  const before = socialsForPage(previous?.socials ?? [])
  const after = socialsForPage(next.socials)
  const noneOnPage = Object.keys(page.socials).length === 0
  const socials: ArtistPageSocials = { ...page.socials }
  let socialKept = false
  for (const platform of SOCIAL_KEYS) {
    const current = page.socials[platform]
    const value = noneOnPage || current === before[platform] ? after[platform] : current
    if (value) socials[platform] = value
    else delete socials[platform]
    if (value !== after[platform] && after[platform] !== before[platform]) socialKept = true
  }
  if (socialKept) kept.push("socials")

  return { page: { about: pageAbout, eventTypes, musicGenres, socials }, kept }
}
