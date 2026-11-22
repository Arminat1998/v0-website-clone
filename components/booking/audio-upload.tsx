"use client"

import { useId, useState } from "react"
import { FileAudio, Upload, X } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { AUDIO_ACCEPT, audioProblem } from "@/lib/bookings/audio"

/** Picks one audio file for the booking; it is uploaded when the request is sent. */
export function AudioUpload({ label, file, onChange }: { label: string; file: File | null; onChange: (file: File | null) => void }) {
  const nl = useLanguage().language === "nl"
  const id = useId()
  const [error, setError] = useState<string | null>(null)

  const choose = (chosen: File | undefined) => {
    if (!chosen) return
    const problem = audioProblem(chosen)
    setError(
      problem === "type"
        ? nl ? "Kies een audiobestand: MP3, M4A, AAC, WAV, OGG of FLAC." : "Choose an audio file: MP3, M4A, AAC, WAV, OGG or FLAC."
        : problem === "size"
          ? nl ? "Dit bestand is groter dan 25 MB." : "This file is larger than 25 MB."
          : problem === "empty"
            ? nl ? "Dit bestand is leeg." : "This file is empty."
            : null,
    )
    if (!problem) onChange(chosen)
  }

  return (
    <div>
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
          <FileAudio className="size-5 shrink-0 text-red-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setError(null)
            }}
            aria-label={nl ? `Verwijder ${file.name}` : `Remove ${file.name}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <>
          <input
            id={id}
            type="file"
            accept={AUDIO_ACCEPT}
            aria-label={label}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event) => {
              choose(event.target.files?.[0])
              event.target.value = ""
            }}
            className="peer sr-only"
          />
          <label
            htmlFor={id}
            className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-red-500 peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
          >
            <Upload className="size-5 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium text-foreground">{nl ? "Kies een audiobestand" : "Choose an audio file"}</span>
            <span className="text-xs text-muted-foreground">{nl ? "MP3, M4A, AAC, WAV, OGG of FLAC, max. 25 MB" : "MP3, M4A, AAC, WAV, OGG or FLAC, max. 25 MB"}</span>
          </label>
        </>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
