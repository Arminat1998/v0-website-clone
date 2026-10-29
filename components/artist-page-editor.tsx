"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { Camera, Check, Copy, ExternalLink, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SOCIAL_META } from "@/components/artist-portfolio"
import { saveArtistPage } from "@/app/actions/artist-page"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  PAGE_LIMITS,
  SOCIAL_KEYS,
  getVideoEmbed,
  mediaUrl,
  type ArtistPageContent,
} from "@/lib/artist-page-types"

const copy = {
  nl: {
    title: "Mijn website",
    subtitle: "Bouw je eigen artiestenpagina. Deze pagina kun je delen als je persoonlijke website.",
    viewPage: "Bekijk pagina",
    copyLink: "Kopieer link",
    copied: "Gekopieerd",
    banner: "Banner",
    changeBanner: "Banner wijzigen",
    removeBanner: "Eigen banner verwijderen",
    avatar: "Profielfoto wijzigen",
    tagline: "Slogan",
    taglinePlaceholder: "Bijv. House & techno DJ uit Amsterdam",
    taglineHint: "Een korte regel onder je naam.",
    basics: "Basisgegevens",
    basicsHint: "Naam, tarief, ervaring en stad pas je aan via Profiel bewerken.",
    editProfile: "Profiel bewerken",
    about: "Over mij",
    aboutPlaceholder: "Vertel je verhaal: je stijl, je ervaring en wat je optredens bijzonder maakt.",
    eventTypes: "Evenementtypes",
    genres: "Muziekgenres",
    tagPlaceholder: "Typ en druk op Enter",
    suggestions: "Suggesties",
    photos: "Foto's",
    photosHint: "Toon sfeerbeelden van je optredens. JPG, PNG of WebP tot 8 MB.",
    addPhotos: "Foto's toevoegen",
    removePhoto: "Foto verwijderen",
    videos: "Video's",
    videosHint: "Plak een YouTube- of Vimeo-link.",
    videoUrl: "https://youtube.com/watch?v=...",
    videoTitle: "Titel (optioneel)",
    addVideo: "Toevoegen",
    removeVideo: "Video verwijderen",
    invalidVideo: "Alleen YouTube- en Vimeo-links worden ondersteund.",
    socials: "Online aanwezigheid",
    socialsHint: "Links verschijnen onder het tabblad Portfolio.",
    unsaved: "Je hebt niet-opgeslagen wijzigingen",
    saved: "Alles is opgeslagen",
    discard: "Ongedaan maken",
    save: "Opslaan",
    saving: "Opslaan...",
    savedToast: "Je pagina is bijgewerkt",
    saveFailed: "Opslaan mislukt. Controleer je gegevens en probeer opnieuw.",
    uploadFailed: "Upload mislukt",
    invalidType: "Alleen JPG, PNG, WebP of AVIF.",
    tooLarge: "Bestand is groter dan 8 MB.",
    limitReached: "Maximaal aantal bereikt.",
  },
  en: {
    title: "My website",
    subtitle: "Build your own artist page. You can share this page as your personal website.",
    viewPage: "View page",
    copyLink: "Copy link",
    copied: "Copied",
    banner: "Banner",
    changeBanner: "Change banner",
    removeBanner: "Remove custom banner",
    avatar: "Change profile photo",
    tagline: "Tagline",
    taglinePlaceholder: "e.g. House & techno DJ from Amsterdam",
    taglineHint: "A short line under your name.",
    basics: "Basic details",
    basicsHint: "Edit your name, rate, experience and city in Edit Profile.",
    editProfile: "Edit profile",
    about: "About me",
    aboutPlaceholder: "Tell your story: your style, your experience and what makes your shows special.",
    eventTypes: "Event types",
    genres: "Music genres",
    tagPlaceholder: "Type and press Enter",
    suggestions: "Suggestions",
    photos: "Photos",
    photosHint: "Show the atmosphere of your shows. JPG, PNG or WebP up to 8 MB.",
    addPhotos: "Add photos",
    removePhoto: "Remove photo",
    videos: "Videos",
    videosHint: "Paste a YouTube or Vimeo link.",
    videoUrl: "https://youtube.com/watch?v=...",
    videoTitle: "Title (optional)",
    addVideo: "Add",
    removeVideo: "Remove video",
    invalidVideo: "Only YouTube and Vimeo links are supported.",
    socials: "Online presence",
    socialsHint: "Links appear under the Portfolio tab.",
    unsaved: "You have unsaved changes",
    saved: "Everything is saved",
    discard: "Discard",
    save: "Save",
    saving: "Saving...",
    savedToast: "Your page has been updated",
    saveFailed: "Saving failed. Check your details and try again.",
    uploadFailed: "Upload failed",
    invalidType: "Only JPG, PNG, WebP or AVIF.",
    tooLarge: "File is larger than 8 MB.",
    limitReached: "Maximum reached.",
  },
}

type Copy = (typeof copy)["nl"]

const EVENT_SUGGESTIONS = ["bruiloft", "bedrijfsfeest", "festival", "club", "verjaardag", "gala", "privéfeest"]
const GENRE_SUGGESTIONS = ["house", "techno", "pop", "hip-hop", "r&b", "latin", "disco", "jazz"]

interface ArtistPageEditorProps {
  initialContent: ArtistPageContent
  artistName: string
  artistPath: string
  fallbackImage?: string
  summary: { label: string; value: string }[]
}

type UploadKind = "banner" | "avatar" | "gallery"

async function uploadImage(file: File, kind: UploadKind, t: Copy) {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) throw new Error(t.invalidType)
  if (file.size > MAX_IMAGE_BYTES) throw new Error(t.tooLarge)

  const body = new FormData()
  body.append("file", file)
  body.append("kind", kind)
  const response = await fetch("/api/artist-media", { method: "POST", body })
  if (!response.ok) throw new Error(t.uploadFailed)
  const { pathname } = (await response.json()) as { pathname: string }
  return pathname
}

export function ArtistPageEditor({ initialContent, artistName, artistPath, fallbackImage, summary }: ArtistPageEditorProps) {
  const { language } = useLanguage()
  const t = copy[language === "en" ? "en" : "nl"]
  const { toast } = useToast()

  const [saved, setSaved] = useState(initialContent)
  const [draft, setDraft] = useState(initialContent)
  const [uploading, setUploading] = useState<UploadKind | null>(null)
  const [videoUrl, setVideoUrl] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [videoError, setVideoError] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [isSaving, startSaving] = useTransition()

  const bannerInput = useRef<HTMLInputElement>(null)
  const avatarInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const update = (patch: Partial<ArtistPageContent>) => setDraft((current) => ({ ...current, ...patch }))

  const bannerSrc = draft.bannerPath ? mediaUrl(draft.bannerPath) : fallbackImage
  const avatarSrc = draft.avatarPath ? mediaUrl(draft.avatarPath) : fallbackImage

  const reportError = (error: unknown) =>
    toast({ title: error instanceof Error ? error.message : t.uploadFailed, variant: "destructive" })

  async function handleSingleUpload(kind: "banner" | "avatar", file: File | undefined) {
    if (!file) return
    setUploading(kind)
    try {
      const pathname = await uploadImage(file, kind, t)
      update(kind === "banner" ? { bannerPath: pathname } : { avatarPath: pathname })
    } catch (error) {
      reportError(error)
    } finally {
      setUploading(null)
    }
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading("gallery")
    const added: string[] = []
    try {
      for (const file of Array.from(files)) {
        if (draft.gallery.length + added.length >= PAGE_LIMITS.gallery) {
          toast({ title: t.limitReached, variant: "destructive" })
          break
        }
        added.push(await uploadImage(file, "gallery", t))
      }
    } catch (error) {
      reportError(error)
    } finally {
      if (added.length > 0) setDraft((current) => ({ ...current, gallery: [...current.gallery, ...added] }))
      setUploading(null)
    }
  }

  function addVideo() {
    const url = videoUrl.trim()
    if (!getVideoEmbed(url)) {
      setVideoError(true)
      return
    }
    update({
      videos: [...draft.videos, { id: crypto.randomUUID(), url, title: videoTitle.trim() }].slice(0, PAGE_LIMITS.videos),
    })
    setVideoUrl("")
    setVideoTitle("")
    setVideoError(false)
  }

  function handleSave() {
    startSaving(async () => {
      try {
        const result = await saveArtistPage(draft)
        if (!result.ok) throw new Error("invalid")
        setSaved(result.content)
        setDraft(result.content)
        toast({ title: t.savedToast })
      } catch {
        toast({ title: t.saveFailed, variant: "destructive" })
      }
    })
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${artistPath}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="mx-auto w-full max-w-4xl pb-28">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl text-balance">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">{t.subtitle}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>
            {linkCopied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {linkCopied ? t.copied : t.copyLink}
          </Button>
          <Button asChild size="sm">
            <Link href={artistPath} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" aria-hidden="true" />
              {t.viewPage}
            </Link>
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative h-40 bg-muted sm:h-56">
          {bannerSrc && <img src={bannerSrc || "/placeholder.svg"} alt="" className="size-full object-cover" />}
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
            {draft.bannerPath && (
              <Button type="button" size="sm" variant="secondary" onClick={() => update({ bannerPath: null })}>
                <Trash2 className="size-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">{t.removeBanner}</span>
              </Button>
            )}
            <Button type="button" size="sm" variant="secondary" onClick={() => bannerInput.current?.click()} disabled={uploading === "banner"}>
              {uploading === "banner" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
              {t.changeBanner}
            </Button>
          </div>
          <input
            ref={bannerInput}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              void handleSingleUpload("banner", event.target.files?.[0])
              event.target.value = ""
            }}
          />
        </div>

        <div className="relative px-4 pb-6 sm:px-6">
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            disabled={uploading === "avatar"}
            aria-label={t.avatar}
            className="group relative -mt-12 block size-24 overflow-hidden rounded-full border-4 border-card bg-muted sm:-mt-16 sm:size-32 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {avatarSrc && <img src={avatarSrc || "/placeholder.svg"} alt="" className="size-full object-cover" />}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {uploading === "avatar" ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <Camera className="size-6" aria-hidden="true" />}
            </span>
          </button>
          <input
            ref={avatarInput}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              void handleSingleUpload("avatar", event.target.files?.[0])
              event.target.value = ""
            }}
          />

          <div className="mt-4 space-y-1.5">
            <h2 className="text-2xl font-bold text-foreground">{artistName}</h2>
            <label htmlFor="tagline" className="block pt-2 text-sm font-medium text-foreground">
              {t.tagline}
            </label>
            <Input
              id="tagline"
              value={draft.tagline}
              maxLength={PAGE_LIMITS.tagline}
              placeholder={t.taglinePlaceholder}
              onChange={(event) => update({ tagline: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">{t.taglineHint}</p>
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t.basics}</h3>
                <p className="text-xs text-muted-foreground">{t.basicsHint}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/edit-profile">{t.editProfile}</Link>
              </Button>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {summary.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-muted-foreground">{item.label}</dt>
                  <dd className="text-sm font-semibold text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <Section title={t.about}>
          <Textarea
            value={draft.about}
            maxLength={PAGE_LIMITS.about}
            rows={6}
            placeholder={t.aboutPlaceholder}
            aria-label={t.about}
            onChange={(event) => update({ about: event.target.value })}
          />
          <p className="text-right text-xs text-muted-foreground">
            {draft.about.length}/{PAGE_LIMITS.about}
          </p>
        </Section>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title={t.eventTypes}>
            <TagEditor
              tags={draft.eventTypes}
              suggestions={EVENT_SUGGESTIONS}
              placeholder={t.tagPlaceholder}
              suggestionsLabel={t.suggestions}
              label={t.eventTypes}
              onChange={(eventTypes) => update({ eventTypes })}
            />
          </Section>
          <Section title={t.genres}>
            <TagEditor
              tags={draft.musicGenres}
              suggestions={GENRE_SUGGESTIONS}
              placeholder={t.tagPlaceholder}
              suggestionsLabel={t.suggestions}
              label={t.genres}
              onChange={(musicGenres) => update({ musicGenres })}
            />
          </Section>
        </div>

        <Section
          title={t.photos}
          hint={t.photosHint}
          action={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading === "gallery" || draft.gallery.length >= PAGE_LIMITS.gallery}
                onClick={() => galleryInput.current?.click()}
              >
                {uploading === "gallery" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
                {t.addPhotos}
              </Button>
              <input
                ref={galleryInput}
                type="file"
                multiple
                accept={IMAGE_TYPES.join(",")}
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => {
                  void handleGalleryUpload(event.target.files)
                  event.target.value = ""
                }}
              />
            </>
          }
        >
          {draft.gallery.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {draft.gallery.map((path, index) => (
                <li key={path} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                  <img src={mediaUrl(path) || "/placeholder.svg"} alt={`${artistName} ${index + 1}`} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => update({ gallery: draft.gallery.filter((item) => item !== path) })}
                    aria-label={t.removePhoto}
                    className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/70 text-white transition-opacity hover:bg-destructive focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t.videos} hint={t.videosHint}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={videoUrl}
              placeholder={t.videoUrl}
              aria-label={t.videos}
              aria-invalid={videoError}
              onChange={(event) => {
                setVideoUrl(event.target.value)
                setVideoError(false)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  addVideo()
                }
              }}
            />
            <Input
              value={videoTitle}
              maxLength={PAGE_LIMITS.videoTitle}
              placeholder={t.videoTitle}
              aria-label={t.videoTitle}
              className="sm:max-w-56"
              onChange={(event) => setVideoTitle(event.target.value)}
            />
            <Button type="button" variant="outline" onClick={addVideo} disabled={!videoUrl.trim() || draft.videos.length >= PAGE_LIMITS.videos}>
              <Plus className="size-4" aria-hidden="true" />
              {t.addVideo}
            </Button>
          </div>
          {videoError && (
            <p role="alert" className="text-xs text-destructive">
              {t.invalidVideo}
            </p>
          )}
          {draft.videos.length > 0 && (
            <ul className="grid gap-3 md:grid-cols-2">
              {draft.videos.map((video) => {
                const embed = getVideoEmbed(video.url)
                return (
                  <li key={video.id} className="overflow-hidden rounded-lg border border-border bg-background">
                    {embed && (
                      <div className="aspect-video bg-black">
                        <iframe src={embed.embedUrl} title={video.title || artistName} loading="lazy" className="size-full border-0" />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="truncate text-sm text-foreground">{video.title || video.url}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label={t.removeVideo}
                        onClick={() => update({ videos: draft.videos.filter((item) => item.id !== video.id) })}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        <Section title={t.socials} hint={t.socialsHint}>
          <div className="grid gap-3 md:grid-cols-2">
            {SOCIAL_KEYS.map((key) => {
              const { label, icon: Icon, placeholder } = SOCIAL_META[key]
              return (
                <div key={key} className="space-y-1.5">
                  <label htmlFor={`social-${key}`} className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon className="size-4 text-red-600" aria-hidden="true" />
                    {label}
                  </label>
                  <Input
                    id={`social-${key}`}
                    type="url"
                    inputMode="url"
                    value={draft.socials[key] ?? ""}
                    maxLength={PAGE_LIMITS.url}
                    placeholder={placeholder}
                    onChange={(event) => update({ socials: { ...draft.socials, [key]: event.target.value } })}
                  />
                </div>
              )
            })}
          </div>
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {dirty ? t.unsaved : t.saved}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setDraft(saved)} disabled={!dirty || isSaving}>
              {t.discard}
            </Button>
            <Button type="button" onClick={handleSave} disabled={!dirty || isSaving || uploading !== null}>
              {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isSaving ? t.saving : t.save}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function TagEditor({
  tags,
  suggestions,
  placeholder,
  suggestionsLabel,
  label,
  onChange,
}: {
  tags: string[]
  suggestions: string[]
  placeholder: string
  suggestionsLabel: string
  label: string
  onChange: (tags: string[]) => void
}) {
  const [value, setValue] = useState("")

  function add(raw: string) {
    const tag = raw.trim().slice(0, PAGE_LIMITS.tag)
    if (!tag || tags.length >= PAGE_LIMITS.tags) return
    if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) return
    onChange([...tags, tag])
    setValue("")
  }

  const remaining = suggestions.filter((suggestion) => !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase()))

  return (
    <div className="space-y-3">
      <Input
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === ",") && !event.nativeEvent.isComposing) {
            event.preventDefault()
            add(value)
          }
        }}
        onBlur={() => add(value)}
      />
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag} className="flex items-center gap-1 rounded-full border border-border bg-background py-1 pl-3 pr-1 text-sm text-foreground">
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((item) => item !== tag))}
                aria-label={`${tag} verwijderen`}
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {remaining.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{suggestionsLabel}:</span>
          {remaining.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => add(suggestion)}
              className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-muted-foreground hover:text-foreground"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
