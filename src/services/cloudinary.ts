import {
  ALLOWED_IMAGE_MIME_TYPES,
  CARD_DETAIL_IMAGE_WIDTH,
  CARD_THUMBNAIL_HEIGHT,
  CARD_THUMBNAIL_WIDTH,
  MAX_IMAGE_BYTES,
} from '@/constants'
import { env } from '@/env'

export type CloudinaryUploadResult = {
  secureUrl: string
  publicId: string
}

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

export function validateImageFile(file: File): void {
  const isAllowedType = (
    ALLOWED_IMAGE_MIME_TYPES as readonly string[]
  ).includes(file.type)

  if (!isAllowedType) {
    throw new ImageValidationError(
      'Only JPG, PNG, and WebP image files are allowed.',
    )
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageValidationError(
      'Image file size cannot exceed 5MB.',
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

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Network error during upload.'
    throw new CloudinaryUploadError(
      `Failed to connect to Cloudinary: ${message}`,
    )
  }

  if (!response.ok) {
    let errorDetail = response.statusText
    try {
      const errorJson = (await response.json()) as {
        error?: { message?: string }
      }
      if (errorJson.error?.message) {
        errorDetail = errorJson.error.message
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
  }

  if (!data.secure_url || !data.public_id) {
    throw new CloudinaryUploadError(
      'Cloudinary response did not include image URL or public ID.',
    )
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
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
  publicId: string,
): Promise<boolean> {
  if (typeof window !== 'undefined') {
    return false
  }

  try {
    const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME
    const apiKey = env.CLOUDINARY_API_KEY
    const apiSecret = env.CLOUDINARY_API_SECRET

    if (
      !cloudName ||
      cloudName === 'placeholder' ||
      !apiKey ||
      !apiSecret
    ) {
      console.warn(
        'Cloudinary delete skipped: CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET not configured.',
      )
      return false
    }

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = await sha1Hex(stringToSign)

    const formData = new FormData()
    formData.append('public_id', publicId)
    formData.append('timestamp', timestamp)
    formData.append('api_key', apiKey)
    formData.append('signature', signature)

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      console.warn(
        `Cloudinary asset deletion returned status ${response.status}`,
      )
      return false
    }

    const data = (await response.json()) as { result?: string }
    return data.result === 'ok'
  } catch (error) {
    console.warn('Cloudinary delete failed (best-effort):', error)
    return false
  }
}
