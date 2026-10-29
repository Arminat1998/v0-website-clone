"use client"

import { useCallback, useRef, useState } from "react"
import { ImageCropDialog, type CropOptions } from "@/components/image-crop-dialog"

interface CropRequest extends CropOptions {
  file: File
  resolve: (file: File | null) => void
}

/**
 * Opens a crop modal for an image and resolves with the cropped file (or null when cancelled).
 * Requests are queued, so several files can be cropped one after the other.
 */
export function useImageCrop() {
  const queue = useRef<CropRequest[]>([])
  const [current, setCurrent] = useState<CropRequest | null>(null)

  const advance = useCallback(() => setCurrent(queue.current.shift() ?? null), [])

  const requestCrop = useCallback(
    (file: File, options: CropOptions) =>
      new Promise<File | null>((resolve) => {
        const request = { ...options, file, resolve }
        setCurrent((active) => {
          if (active) {
            queue.current.push(request)
            return active
          }
          return request
        })
      }),
    [],
  )

  const finish = (result: File | null) => {
    current?.resolve(result)
    advance()
  }

  const cropDialog = (
    <ImageCropDialog
      file={current?.file ?? null}
      aspect={current?.aspect ?? 1}
      round={current?.round}
      onCancel={() => finish(null)}
      onConfirm={(cropped) => finish(cropped)}
    />
  )

  return { requestCrop, cropDialog }
}
