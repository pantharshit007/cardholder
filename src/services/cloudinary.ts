import { imageUploadErrorMessage } from '@/utils/error'
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_UPLOAD_ERRORS,
  CARD_DETAIL_IMAGE_WIDTH,
  CARD_THUMBNAIL_HEIGHT,
  CARD_THUMBNAIL_WIDTH,
  BYTES_PER_MEBIBYTE,
  CLOUDINARY_API_BASE_URL,
  MAX_IMAGE_BYTES,
} from '@/constants'
import { env } from '@/env'
import type { CardImageUploadResult } from '@/types/card-upload'

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
  const allowedTypes = ALLOWED_IMAGE_MIME_TYPES as readonly string[]
  if (!allowedTypes.includes(file.type)) {
    throw new ImageValidationError(
      `Unsupported file type "${file.type}". Please choose a JPEG, PNG, or WebP image.`,
    )
  }

  if (file.size > MAX_IMAGE_BYTES) {
    const sizeInMb = (file.size / BYTES_PER_MEBIBYTE).toFixed(1)
    const limitInMb = (MAX_IMAGE_BYTES / BYTES_PER_MEBIBYTE).toFixed(0)
    throw new ImageValidationError(
      `File size (${sizeInMb}MB) exceeds the maximum limit of ${limitInMb}MB.`,
    )
  }
}

export async function uploadImageToCloudinary(
  file: File,
): Promise<CardImageUploadResult> {
  validateImageFile(file)

  const formData = new FormData()
  formData.append('file', file)

  let response: Response
  try {
    response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
  } catch {
    throw new CloudinaryUploadError(IMAGE_UPLOAD_ERRORS.networkFailed)
  }

  if (!response.ok) {
    throw new CloudinaryUploadError(imageUploadErrorMessage(response.status))
  }

  const data = (await response.json()) as {
    secure_url?: string
    upload_id?: string
    width?: number
    height?: number
    format?: string
  }

  if (!data.secure_url || !data.upload_id) {
    throw new CloudinaryUploadError(
      'Upload response did not include an image URL or upload reference.',
    )
  }

  return {
    secureUrl: data.secure_url,
    uploadId: data.upload_id,
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

export function extractPublicIdFromUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null
  try {
    const uploadSegment = '/image/upload/'
    const uploadIndex = url.indexOf(uploadSegment)
    if (uploadIndex === -1) return null

    let path = url.slice(uploadIndex + uploadSegment.length)
    const qIdx = path.indexOf('?')
    if (qIdx !== -1) path = path.slice(0, qIdx)
    const hIdx = path.indexOf('#')
    if (hIdx !== -1) path = path.slice(0, hIdx)

    const segments = path.split('/')
    const filtered: string[] = []
    let pastTransformationsAndVersion = false

    for (const seg of segments) {
      if (!pastTransformationsAndVersion) {
        if (/^v\d+$/.test(seg)) {
          pastTransformationsAndVersion = true
          continue
        }
        if (seg.includes(',') || /^[a-z]_[a-z0-9_,-]+$/i.test(seg)) {
          continue
        }
        pastTransformationsAndVersion = true
      }
      filtered.push(seg)
    }

    let fullPath = filtered.join('/')
    const dotIndex = fullPath.lastIndexOf('.')
    if (dotIndex !== -1) {
      fullPath = fullPath.slice(0, dotIndex)
    }

    return fullPath || null
  } catch {
    return null
  }
}

async function sha1Hex(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function deleteCloudinaryImage(
  publicIdOrUrl: string | null | undefined,
): Promise<boolean> {
  if (!publicIdOrUrl) return false
  if (typeof window !== 'undefined') return false

  const publicId = publicIdOrUrl.includes('/image/upload/')
    ? extractPublicIdFromUrl(publicIdOrUrl)
    : publicIdOrUrl

  if (!publicId) return false

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
      `${CLOUDINARY_API_BASE_URL}/${cloudName}/image/destroy`,
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
    return result.result === 'ok' || result.result === 'not found'
  } catch (error) {
    console.warn('Cloudinary deletion error:', error)
    return false
  }
}
