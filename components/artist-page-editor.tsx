"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ArtistWebsite } from "@/components/artist-website/artist-website"
import type { UploadKind, WebsiteEditApi } from "@/components/artist-website/website-context"
import { saveArtistPage } from "@/app/actions/artist-page"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import type { Artist } from "@/lib/smart-search"
import { IMAGE_TYPES, MAX_IMAGE_BYTES, PAGE_LIMITS, type ArtistPageContent } from "@/lib/artist-page-types"

const copy = {
  nl: {
    title: "Mijn website",
    subtitle: "Zo zien bezoekers je pagina. Klik op een potlood om een onderdeel te wijzigen.",
    viewPage: "Bekijk pagina",
    copyLink: "Kopieer link",
    copied: "Gekopieerd",
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
    subtitle: "This is how visitors see your page. Click a pencil to change a section.",
    viewPage: "View page",
    copyLink: "Copy link",
    copied: "Copied",
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

interface ArtistPageEditorProps {
  initialContent: ArtistPageContent
  artist: Artist
  artistPath: string
}

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

export function ArtistPageEditor({ initialContent, artist, artistPath }: ArtistPageEditorProps) {
  const { language } = useLanguage()
  const t = copy[language === "en" ? "en" : "nl"]
  const { toast } = useToast()

  const [saved, setSaved] = useState(initialContent)
  const [draft, setDraft] = useState(initialContent)
  const [uploading, setUploading] = useState<UploadKind | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [isSaving, startSaving] = useTransition()

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const update = (patch: Partial<ArtistPageContent>) => setDraft((current) => ({ ...current, ...patch }))

  const reportError = (error: unknown) =>
    toast({ title: error instanceof Error ? error.message : t.uploadFailed, variant: "destructive" })

  async function uploadSingle(kind: "banner" | "avatar", file: File | undefined) {
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

  async function uploadGallery(files: FileList | null) {
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

  const edit: WebsiteEditApi = {
    update,
    uploading,
    uploadSingle,
    uploadGallery,
    editProfileHref: "/dashboard/edit-profile",
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] pb-28">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground text-balance sm:text-3xl">{t.title}</h1>
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

      <ArtistWebsite artist={artist} content={draft} edit={edit} />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:px-8">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground sm:text-sm" aria-live="polite">
            {dirty ? t.unsaved : t.saved}
          </p>
          <div className="flex shrink-0 gap-2">
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
