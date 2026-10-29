export interface PixelArea {
  x: number
  y: number
  width: number
  height: number
}

const MAX_OUTPUT_WIDTH = 2000

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Image could not be loaded"))
    image.src = src
  })
}

export async function cropImageToFile(src: string, area: PixelArea, originalName: string): Promise<File> {
  const image = await loadImage(src)
  const scale = Math.min(1, MAX_OUTPUT_WIDTH / area.width)
  const width = Math.round(area.width * scale)
  const height = Math.round(area.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is not supported")
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92))
  if (!blob) throw new Error("Image could not be cropped")

  const baseName = originalName.replace(/\.[^.]+$/, "") || "photo"
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" })
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("File could not be read"))
    reader.readAsDataURL(file)
  })
}
