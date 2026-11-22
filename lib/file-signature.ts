const starts = (bytes: Uint8Array, signature: number[], offset = 0) => signature.every((byte, index) => bytes[offset + index] === byte)
const ascii = (bytes: Uint8Array, text: string, offset: number) => starts(bytes, [...text].map((char) => char.charCodeAt(0)), offset)

const SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (bytes) => starts(bytes, [0xff, 0xd8, 0xff]),
  "image/png": (bytes) => starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/webp": (bytes) => ascii(bytes, "RIFF", 0) && ascii(bytes, "WEBP", 8),
  // An ISO media file whose brands, at the start of the file, include AVIF.
  "image/avif": (bytes) => ascii(bytes, "ftyp", 4) && /avi[fs]/.test(String.fromCharCode(...bytes.slice(8, 64))),
  // PDF readers accept some bytes in front of the header.
  "application/pdf": (bytes) => String.fromCharCode(...bytes).includes("%PDF-"),
}

/** True when the content of the file is what its type says. The type itself comes from the browser. */
export async function matchesFileType(file: File) {
  const check = SIGNATURES[file.type]
  return Boolean(check?.(new Uint8Array(await file.slice(0, 1024).arrayBuffer())))
}
