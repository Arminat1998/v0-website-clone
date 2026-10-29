"use client"

import { useRef, useState, type ReactNode } from "react"
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SOCIAL_META } from "@/components/artist-portfolio"
import { IMAGE_TYPES, PAGE_LIMITS, SOCIAL_KEYS, getVideoEmbed, mediaUrl } from "@/lib/artist-page-types"
import { useWebsite, type DialogKey, type WebsiteEditApi } from "@/components/artist-website/website-context"

const EVENT_SUGGESTIONS = ["bruiloft", "bedrijfsfeest", "festival", "club", "verjaardag", "gala", "privéfeest"]
const GENRE_SUGGESTIONS = ["house", "techno", "pop", "hip-hop", "r&b", "latin", "disco", "jazz"]

export function EditDialogs({ open, onClose, edit }: { open: DialogKey | null; onClose: () => void; edit: WebsiteEditApi }) {
  const { t } = useWebsite()

  const titles: Record<DialogKey, { title: string; description?: string }> = {
    tagline: { title: t.editTagline, description: t.taglineHint },
    about: { title: t.editAbout },
    tags: { title: t.editTags },
    photos: { title: t.editPhotos, description: t.photosHint },
    videos: { title: t.editVideos, description: t.videosHint },
    socials: { title: t.editSocials, description: t.socialsHint },
  }

  return (
    <Dialog open={open !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        {open && (
          <>
            <DialogHeader>
              <DialogTitle>{titles[open].title}</DialogTitle>
              <DialogDescription className={titles[open].description ? undefined : "sr-only"}>
                {titles[open].description ?? titles[open].title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {open === "tagline" && <TaglineBody edit={edit} />}
              {open === "about" && <AboutBody edit={edit} />}
              {open === "tags" && <TagsBody edit={edit} />}
              {open === "photos" && <PhotosBody edit={edit} />}
              {open === "videos" && <VideosBody edit={edit} />}
              {open === "socials" && <SocialsBody edit={edit} />}
            </div>
            <DialogFooter>
              <Button type="button" onClick={onClose}>
                {t.done}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TaglineBody({ edit }: { edit: WebsiteEditApi }) {
  const { content, t } = useWebsite()
  return (
    <Input
      value={content.tagline}
      maxLength={PAGE_LIMITS.tagline}
      placeholder={t.taglinePlaceholder}
      aria-label={t.taglineLabel}
      onChange={(event) => edit.update({ tagline: event.target.value })}
    />
  )
}

function AboutBody({ edit }: { edit: WebsiteEditApi }) {
  const { content, t } = useWebsite()
  return (
    <div className="space-y-1">
      <Textarea
        value={content.about}
        maxLength={PAGE_LIMITS.about}
        rows={10}
        placeholder={t.aboutPlaceholder}
        aria-label={t.about}
        onChange={(event) => edit.update({ about: event.target.value })}
      />
      <p className="text-right text-xs text-muted-foreground">
        {content.about.length}/{PAGE_LIMITS.about}
      </p>
    </div>
  )
}

function TagsBody({ edit }: { edit: WebsiteEditApi }) {
  const { content, t } = useWebsite()
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t.eventTypes}</h3>
        <TagEditor
          tags={content.eventTypes}
          suggestions={EVENT_SUGGESTIONS}
          label={t.eventTypes}
          onChange={(eventTypes) => edit.update({ eventTypes })}
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t.genres}</h3>
        <TagEditor
          tags={content.musicGenres}
          suggestions={GENRE_SUGGESTIONS}
          label={t.genres}
          onChange={(musicGenres) => edit.update({ musicGenres })}
        />
      </div>
    </div>
  )
}

function PhotosBody({ edit }: { edit: WebsiteEditApi }) {
  const { content, artist, t } = useWebsite()
  const input = useRef<HTMLInputElement>(null)
  const busy = edit.uploading === "gallery"

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        disabled={busy || content.gallery.length >= PAGE_LIMITS.gallery}
        onClick={() => input.current?.click()}
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
        {t.photosAdd}
      </Button>
      <input
        ref={input}
        type="file"
        multiple
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          void edit.uploadGallery(event.target.files)
          event.target.value = ""
        }}
      />
      {content.gallery.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {content.gallery.map((path, index) => (
            <li key={path} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
              <img src={mediaUrl(path) || "/placeholder.svg"} alt={`${artist.name} ${index + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => edit.update({ gallery: content.gallery.filter((item) => item !== path) })}
                aria-label={t.removePhoto}
                className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/70 text-white transition-opacity hover:bg-destructive focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function VideosBody({ edit }: { edit: WebsiteEditApi }) {
  const { content, artist, t } = useWebsite()
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [invalid, setInvalid] = useState(false)

  function add() {
    const trimmed = url.trim()
    if (!getVideoEmbed(trimmed)) {
      setInvalid(true)
      return
    }
    edit.update({
      videos: [...content.videos, { id: crypto.randomUUID(), url: trimmed, title: title.trim() }].slice(0, PAGE_LIMITS.videos),
    })
    setUrl("")
    setTitle("")
    setInvalid(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={url}
          placeholder={t.videoUrl}
          aria-label={t.videos}
          aria-invalid={invalid}
          onChange={(event) => {
            setUrl(event.target.value)
            setInvalid(false)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault()
              add()
            }
          }}
        />
        <Input
          value={title}
          maxLength={PAGE_LIMITS.videoTitle}
          placeholder={t.videoTitle}
          aria-label={t.videoTitle}
          className="sm:max-w-48"
          onChange={(event) => setTitle(event.target.value)}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!url.trim() || content.videos.length >= PAGE_LIMITS.videos}>
          <Plus className="size-4" aria-hidden="true" />
          {t.addVideo}
        </Button>
      </div>
      {invalid && (
        <p role="alert" className="text-xs text-destructive">
          {t.invalidVideo}
        </p>
      )}
      {content.videos.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {content.videos.map((video) => {
            const embed = getVideoEmbed(video.url)
            return (
              <li key={video.id} className="overflow-hidden rounded-lg border border-border bg-background">
                {embed && (
                  <div className="aspect-video bg-black">
                    <iframe src={embed.embedUrl} title={video.title || artist.name} loading="lazy" className="size-full border-0" />
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
                    onClick={() => edit.update({ videos: content.videos.filter((item) => item.id !== video.id) })}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function SocialsBody({ edit }: { edit: WebsiteEditApi }) {
  const { content } = useWebsite()
  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
              value={content.socials[key] ?? ""}
              maxLength={PAGE_LIMITS.url}
              placeholder={placeholder}
              onChange={(event) => edit.update({ socials: { ...content.socials, [key]: event.target.value } })}
            />
          </div>
        )
      })}
    </div>
  )
}

function TagEditor({
  tags,
  suggestions,
  label,
  onChange,
}: {
  tags: string[]
  suggestions: string[]
  label: string
  onChange: (tags: string[]) => void
}): ReactNode {
  const { t } = useWebsite()
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
        placeholder={t.tagPlaceholder}
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
                aria-label={`${tag} ${t.removeTag}`}
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
          <span className="text-xs text-muted-foreground">{t.suggestions}:</span>
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
