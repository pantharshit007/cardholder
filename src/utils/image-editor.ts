import { IMAGE_EDITOR_CONFIG } from '@/constants'
import type { ImageCrop, ImageRectangle } from '@/types/image-editor'

export function fullImageCrop(): ImageCrop {
  return {
    unit: '%',
    x: 0,
    y: 0,
    width: IMAGE_EDITOR_CONFIG.percentScale,
    height: IMAGE_EDITOR_CONFIG.percentScale,
  }
}

/** Convert responsive crop coordinates to bounded source-image pixels. */
export function imageCropPixels(
  crop: ImageCrop,
  width: number,
  height: number,
): ImageRectangle {
  const scale = IMAGE_EDITOR_CONFIG.percentScale
  const x = Math.max(
    0,
    Math.min(width - 1, Math.round((crop.x * width) / scale)),
  )
  const y = Math.max(
    0,
    Math.min(height - 1, Math.round((crop.y * height) / scale)),
  )
  return {
    x,
    y,
    width: Math.max(
      1,
      Math.min(width - x, Math.round((crop.width * width) / scale)),
    ),
    height: Math.max(
      1,
      Math.min(height - y, Math.round((crop.height * height) / scale)),
    ),
  }
}

/** Only intercept image clipboard data; ordinary text pastes stay untouched. */
export function clipboardImage(data: DataTransfer): File | null {
  for (const item of Array.from(data.items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      return item.getAsFile()
    }
  }
  return null
}

export function editedImageFileName(name: string, mimeType: string): string {
  const extensions: Record<string, string> = IMAGE_EDITOR_CONFIG.mimeExtensions
  const base =
    name.replace(/\.[^.]+$/, '') || IMAGE_EDITOR_CONFIG.defaultFileName
  return `${base}-edited.${extensions[mimeType] ?? 'png'}`
}
