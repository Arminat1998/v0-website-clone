"use client"

import { useCallback, useEffect, useState } from "react"
import Cropper from "react-easy-crop"
import { Loader2, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { useLanguage } from "@/contexts/language-context"
import { cropImageToFile, fileToDataUrl, type PixelArea } from "@/lib/crop-image"

export interface CropOptions {
  aspect: number
  round?: boolean
}

interface ImageCropDialogProps extends CropOptions {
  file: File | null
  onCancel: () => void
  onConfirm: (cropped: File) => void
}

const copy = {
  nl: {
    title: "Foto bijsnijden",
    description: "Sleep om de foto te verplaatsen en gebruik de schuifregelaar om in te zoomen.",
    zoom: "Zoom",
    cancel: "Annuleren",
    confirm: "Bijsnijden en gebruiken",
    error: "Bijsnijden is mislukt. Probeer het opnieuw.",
    type: "Dit bestand is geen foto die we kunnen openen. Kies een JPG, PNG, WebP of AVIF.",
    size: "Deze foto is groter dan 15 MB. Kies een kleinere foto.",
    close: "Sluiten",
  },
  en: {
    title: "Crop photo",
    description: "Drag to reposition the photo and use the slider to zoom.",
    zoom: "Zoom",
    cancel: "Cancel",
    confirm: "Crop and use",
    error: "Cropping failed. Please try again.",
    type: "This file is not a photo we can open. Choose a JPG, PNG, WebP or AVIF.",
    size: "This photo is larger than 15 MB. Choose a smaller photo.",
    close: "Close",
  },
}

const MAX_SOURCE_BYTES = 15 * 1024 * 1024

export function ImageCropDialog({ file, aspect, round, onCancel, onConfirm }: ImageCropDialogProps) {
  const { language } = useLanguage()
  const t = copy[language === "nl" ? "nl" : "en"]
  const [source, setSource] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<PixelArea | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [invalid, setInvalid] = useState<"type" | "size" | null>(null)

  useEffect(() => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setArea(null)
    setFailed(false)
    setSource(null)
    setInvalid(null)
    if (!file) return
    if (!file.type.startsWith("image/")) return setInvalid("type")
    if (file.size > MAX_SOURCE_BYTES) return setInvalid("size")
    let active = true
    fileToDataUrl(file)
      .then((url) => {
        // The name and type can lie; only a photo the browser can open may be cropped.
        const image = new window.Image()
        image.onload = () => active && setSource(url)
        image.onerror = () => active && setInvalid("type")
        image.src = url
      })
      .catch(() => active && setInvalid("type"))
    return () => {
      active = false
    }
  }, [file])

  const handleComplete = useCallback((_: unknown, pixels: PixelArea) => setArea(pixels), [])

  async function confirm() {
    if (!file || !source || !area) return
    setBusy(true)
    setFailed(false)
    try {
      onConfirm(await cropImageToFile(source, area, file.name))
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={file !== null} onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent className="max-h-[92dvh] gap-4 overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        {invalid && (
          <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-foreground">
            {t[invalid]}
          </p>
        )}

        <div className={invalid ? "hidden" : "relative h-72 w-full overflow-hidden rounded-lg bg-black sm:h-96"}>
          {source ? (
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={round ? "round" : "rect"}
              showGrid={!round}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleComplete}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-white" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className={invalid ? "hidden" : "flex items-center gap-3"}>
          <ZoomOut className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Slider
            aria-label={t.zoom}
            min={1}
            max={4}
            step={0.01}
            value={[zoom]}
            onValueChange={([value]) => setZoom(value)}
          />
          <ZoomIn className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>

        {failed && <p role="alert" className="text-sm text-destructive">{t.error}</p>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {invalid ? t.close : t.cancel}
          </Button>
          {!invalid && (
            <Button type="button" onClick={confirm} disabled={busy || !area}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {t.confirm}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
