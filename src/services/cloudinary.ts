import {
  ALLOWED_IMAGE_MIME_TYPES,
  CARD_DETAIL_IMAGE_WIDTH,
  CARD_THUMBNAIL_HEIGHT,
  CARD_THUMBNAIL_WIDTH,
  MAX_IMAGE_BYTES,
} from '@/constants'
import { env } from '@/env'

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageValidationError'
  }
}

export class CloudinaryUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CloudinaryUploadError'
  }
}

export interface CloudinaryUploadResult {
  secureUrl: string
  publicId: string
  width?: number
  height?: number
  format?: string
}

export function validateImageFile(file: File): void {
  const allowedTypes = ALLOWED_IMAGE_MIME_TYPES as readonly string[]
  if (!allowedTypes.includes(file.type)) {
    throw new ImageValidationError(
      `Unsupported file type "${file.type}". Please choose a JPEG, PNG, or WebP image.`,
    )
  }

  if (file.size > MAX_IMAGE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1)
    const limitInMb = (MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(0)
    throw new ImageValidationError(
      `File size (${sizeInMb}MB) exceeds the maximum limit of ${limitInMb}MB.`,
    )
  }
}

export async function uploadImageToCloudinary(
  file: File,
): Promise<CloudinaryUploadResult> {
  validateImageFile(file)

  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || cloudName === 'placeholder') {
    throw new CloudinaryUploadError(
      'Cloudinary cloud name is not configured (VITE_CLOUDINARY_CLOUD_NAME).',
    )
  }

  if (!uploadPreset || uploadPreset === 'placeholder') {
    throw new CloudinaryUploadError(
      'Cloudinary upload preset is not configured (VITE_CLOUDINARY_UPLOAD_PRESET).',
    )
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  let response: Response | null = null
  let directUploadFailed = false

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    })
  } catch {
    directUploadFailed = true
  }

  // If direct browser-to-Cloudinary upload failed (e.g. ERR_ALPN_NEGOTIATION_FAILED, CORS, adblockers),
  // fall back to uploading through the server endpoint.
  if (directUploadFailed || !response) {
    try {
      const serverFormData = new FormData()
      serverFormData.append('file', file)
      response = await fetch('/api/upload', {
        method: 'POST',
        body: serverFormData,
      })
    } catch (fallbackError) {
      const message =
        fallbackError instanceof Error
          ? fallbackError.message
          : 'Network error during upload.'
      throw new CloudinaryUploadError(
        `Failed to connect to Cloudinary: ${message}`,
      )
    }
  }

  if (!response.ok) {
    let errorDetail = response.statusText
    try {
      const errorJson = (await response.json()) as {
        error?: { message?: string }
        message?: string
      }
      if (errorJson.error?.message) {
        errorDetail = errorJson.error.message
      } else if (errorJson.message) {
        errorDetail = errorJson.message
      }
    } catch {
      // Ignore JSON parse failure on error response
    }

    throw new CloudinaryUploadError(
      `Cloudinary upload failed (${response.status}): ${errorDetail}`,
    )
  }

  const data = (await response.json()) as {
    secure_url?: string
    public_id?: string
    width?: number
    height?: number
    format?: string
  }

  if (!data.secure_url || !data.public_id) {
    throw new CloudinaryUploadError(
      'Cloudinary response did not include image URL or public ID.',
    )
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  }
}

export function getCardThumbnailUrl(
  imageUrl: string | null | undefined,
  options?: { width?: number; height?: number },
): string {
  if (!imageUrl) return ''

  const uploadSegment = '/image/upload/'
  const uploadIndex = imageUrl.indexOf(uploadSegment)

  if (uploadIndex === -1) {
    return imageUrl
  }

  const width = options?.width ?? CARD_THUMBNAIL_WIDTH
  const height = options?.height ?? CARD_THUMBNAIL_HEIGHT
  const transformation = `c_fill,w_${width},h_${height},f_auto,q_auto`

  const prefix = imageUrl.slice(0, uploadIndex + uploadSegment.length)
  const suffix = imageUrl.slice(uploadIndex + uploadSegment.length)

  return `${prefix}${transformation}/${suffix}`
}

export function getCardDetailImageUrl(
  imageUrl: string | null | undefined,
): string {
  if (!imageUrl) return ''

  const uploadSegment = '/image/upload/'
  const uploadIndex = imageUrl.indexOf(uploadSegment)

  if (uploadIndex === -1) {
    return imageUrl
  }

  const transformation = `c_limit,w_${CARD_DETAIL_IMAGE_WIDTH},f_auto,q_auto`

  const prefix = imageUrl.slice(0, uploadIndex + uploadSegment.length)
  const suffix = imageUrl.slice(uploadIndex + uploadSegment.length)

  return `${prefix}${transformation}/${suffix}`
}

async function sha1Hex(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function deleteCloudinaryImage(
  publicId: string | null | undefined,
): Promise<boolean> {
  if (!publicId) return false
  if (typeof window !== 'undefined') return false

  const apiKey = env.CLOUDINARY_API_KEY
  const apiSecret = env.CLOUDINARY_API_SECRET
  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME

  if (!apiKey || !apiSecret || !cloudName || cloudName === 'placeholder') {
    console.warn(
      'Skipping Cloudinary deletion: API credentials are not configured.',
    )
    return false
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = await sha1Hex(toSign)

    const formData = new FormData()
    formData.append('public_id', publicId)
    formData.append('timestamp', timestamp)
    formData.append('api_key', apiKey)
    formData.append('signature', signature)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      },
    )

    if (!response.ok) {
      console.warn(
        `Cloudinary deletion failed with status ${response.status}: ${response.statusText}`,
      )
      return false
    }

    const result = (await response.json()) as { result?: string }
    return result.result === 'ok'
  } catch (error) {
    console.warn('Cloudinary deletion error:', error)
    return false
  }
}
