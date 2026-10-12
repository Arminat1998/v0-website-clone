"use client"

import { useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { FileText, Loader2, UploadCloud, X } from "lucide-react"
import { useBookingT } from "@/lib/booking-i18n"
import type { UploadedInvoiceFile } from "@/app/actions/invoices"
import { INVOICE_FILE_TYPES, MAX_INVOICE_FILE_BYTES } from "@/lib/bookings/invoicing"

interface Props {
  bookingId: number
  file: UploadedInvoiceFile | null
  onChange: (file: UploadedInvoiceFile | null) => void
}

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function InvoiceUpload({ bookingId, file, onChange }: Props) {
  const { t } = useBookingT()
  const ti = t.invoice
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(selected: File) {
    setError(null)
    if (!(INVOICE_FILE_TYPES as readonly string[]).includes(selected.type)) return setError(ti.invalidType)
    if (selected.size > MAX_INVOICE_FILE_BYTES) return setError(ti.tooLarge)

    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", selected)
      body.append("bookingId", bookingId.toString())
      const response = await fetch("/api/invoices/upload", { method: "POST", body })
      if (!response.ok) throw new Error("upload_failed")
      onChange((await response.json()) as UploadedInvoiceFile)
    } catch {
      setError(ti.uploadError)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files[0]
    if (dropped) void upload(dropped)
  }

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (selected) void upload(selected)
    event.target.value = ""
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-green-500/30 bg-green-500/10 p-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-card text-green-500">
          <FileText className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          {ti.remove}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        aria-busy={uploading}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-red-500 bg-red-500/5" : "border-border hover:border-red-500/50 hover:bg-accent"
        }`}
      >
        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-red-500" aria-hidden /> : <UploadCloud className="h-6 w-6 text-red-500" aria-hidden />}
        <p className="text-sm font-medium text-foreground">{uploading ? ti.uploading : ti.dropTitle}</p>
        <p className="text-xs text-muted-foreground">{ti.dropHint}</p>
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="sr-only" onChange={handleSelect} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
