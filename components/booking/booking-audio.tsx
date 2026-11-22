"use client"

import { Download, FileAudio } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { audioDisplayName, audioUrl, hasAudioFile, type AudioKind } from "@/lib/bookings/audio"

/** The uploaded music of a booking: player and download, or a note for older bookings without a stored file. */
export function BookingAudio({ bookingId, kind, stored }: { bookingId: number; kind: AudioKind; stored: string }) {
  const nl = useLanguage().language === "nl"
  const name = audioDisplayName(stored)
  return (
    <span className="flex min-w-0 flex-col gap-2">
      <span className="flex min-w-0 items-center gap-1.5">
        <FileAudio className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate" title={name}>{name}</span>
      </span>
      {hasAudioFile(stored) ? (
        <>
          <audio controls preload="none" src={audioUrl(bookingId, kind)} aria-label={name} className="h-10 w-full max-w-sm" />
          <a href={audioUrl(bookingId, kind, true)} className="inline-flex items-center gap-1.5 self-start text-sm text-red-700 hover:underline dark:text-red-400">
            <Download className="size-4" aria-hidden />
            {nl ? "Downloaden" : "Download"}
          </a>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">
          {nl ? "Alleen de bestandsnaam is bewaard. Vraag de klant om het nummer of een link." : "Only the file name was saved. Ask the client for the song or a link."}
        </span>
      )}
    </span>
  )
}
