import { ALLOWED_IMAGE_MIME_TYPES, IMAGE_EDITOR_CONFIG } from '@/constants'
import type { ImageCrop, ImageTransform } from '@/types/image-editor'
import { editedImageFileName, imageCropPixels } from '@/utils/image-editor'

/** Load a local or CORS-enabled saved image for canvas editing. */
export function loadEditableImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(
        new Error(
          'Could not open this image for editing. Try uploading it again.',
        ),
      )
    image.src = source
  })
}

/** Encode a canvas using the configured quality and browser-supported format. */
function canvasBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else
          reject(
            new Error(
              'Could not prepare the edited image. Try a smaller image.',
            ),
          )
      },
      mimeType,
      IMAGE_EDITOR_CONFIG.exportQuality,
    )
  })
}

/** Render transforms at original resolution so cropping matches the preview. */
export async function transformImage(
  image: HTMLImageElement,
  transform: ImageTransform,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const swapDimensions =
    transform.rotation % (IMAGE_EDITOR_CONFIG.quarterTurnDegrees * 2) !== 0
  canvas.width = swapDimensions ? image.naturalHeight : image.naturalWidth
  canvas.height = swapDimensions ? image.naturalWidth : image.naturalHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image editing is unavailable in this browser.')
  context.translate(canvas.width / 2, canvas.height / 2)
  context.scale(
    transform.flipHorizontal ? -1 : 1,
    transform.flipVertical ? -1 : 1,
  )
  context.rotate(
    (transform.rotation * Math.PI) / (IMAGE_EDITOR_CONFIG.fullTurnDegrees / 2),
  )
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
  return canvasBlob(canvas, IMAGE_EDITOR_CONFIG.defaultMimeType)
}

/** Export a source-resolution crop, preserving allowed formats or using WebP. */
export async function exportEditedImage(
  source: string,
  crop: ImageCrop,
  originalFile: File | null,
): Promise<File> {
  const image = await loadEditableImage(source)
  const pixels = imageCropPixels(crop, image.naturalWidth, image.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = pixels.width
  canvas.height = pixels.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image editing is unavailable in this browser.')
  context.drawImage(
    image,
    pixels.x,
    pixels.y,
    pixels.width,
    pixels.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  const allowed = ALLOWED_IMAGE_MIME_TYPES as readonly string[]
  const mimeType =
    originalFile && allowed.includes(originalFile.type)
      ? originalFile.type
      : IMAGE_EDITOR_CONFIG.fallbackExportMimeType
  const blob = await canvasBlob(canvas, mimeType)
  return new File(
    [blob],
    editedImageFileName(
      originalFile?.name ?? IMAGE_EDITOR_CONFIG.defaultFileName,
      blob.type,
    ),
    { type: blob.type },
  )
}
