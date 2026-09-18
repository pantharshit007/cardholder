import { createFileRoute } from '@tanstack/react-router'

import {
  ALLOWED_IMAGE_MIME_TYPES,
  BYTES_PER_MEBIBYTE,
  CLOUDINARY_API_BASE_URL,
  MAX_IMAGE_BYTES,
  MAX_UPLOAD_REQUEST_BYTES,
} from '@/constants'
import { env } from '@/env'
import { auth } from '@/lib/auth'
import { createCardImageUploadForUser } from '@/services/card-upload.service'
import { deleteCloudinaryImage } from '@/services/cloudinary'
import {
  readFormDataWithLimit,
  RequestBodyTooLargeError,
} from '@/utils/request-body'

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })
        if (!session?.user) {
          return new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'content-type': 'application/json' },
          })
        }

        try {
          const formData = await readFormDataWithLimit(
            request,
            MAX_UPLOAD_REQUEST_BYTES,
          )
          const file = formData.get('file')

          if (!file || !(file instanceof Blob)) {
            return new Response(
              JSON.stringify({ message: 'No image file provided.' }),
              {
                status: 400,
                headers: { 'content-type': 'application/json' },
              },
            )
          }

          if (file.size > MAX_IMAGE_BYTES) {
            return new Response(
              JSON.stringify({
                message: `Image must be smaller than ${MAX_IMAGE_BYTES / BYTES_PER_MEBIBYTE}MB.`,
              }),
              {
                status: 400,
                headers: { 'content-type': 'application/json' },
              },
            )
          }

          if (
            !ALLOWED_IMAGE_MIME_TYPES.includes(
              file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
            )
          ) {
            return new Response(
              JSON.stringify({
                message: 'Only JPG, PNG, and WebP images are allowed.',
              }),
              {
                status: 400,
                headers: { 'content-type': 'application/json' },
              },
            )
          }

          const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME
          const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET

          if (!cloudName || cloudName === 'placeholder') {
            throw new Error('Cloudinary cloud name is not configured.')
          }

          if (!uploadPreset || uploadPreset === 'placeholder') {
            throw new Error('Cloudinary upload preset is not configured.')
          }

          const cloudinaryFormData = new FormData()
          cloudinaryFormData.append('file', file)
          cloudinaryFormData.append('upload_preset', uploadPreset)

          const cloudinaryRes = await fetch(
            `${CLOUDINARY_API_BASE_URL}/${cloudName}/image/upload`,
            {
              method: 'POST',
              body: cloudinaryFormData,
            },
          )

          const result = (await cloudinaryRes.json()) as {
            secure_url?: string
            public_id?: string
            width?: number
            height?: number
            format?: string
            error?: { message?: string }
          }

          if (!cloudinaryRes.ok) {
            const errorMsg =
              result.error?.message ??
              (cloudinaryRes.statusText || 'Upload failed')
            return new Response(JSON.stringify({ message: errorMsg }), {
              status: cloudinaryRes.status,
              headers: { 'content-type': 'application/json' },
            })
          }

          if (!result.secure_url || !result.public_id) {
            throw new Error(
              'Cloudinary response did not include an image URL or public ID.',
            )
          }

          let upload
          try {
            upload = await createCardImageUploadForUser({
              userId: session.user.id,
              imageUrl: result.secure_url,
              imagePublicId: result.public_id,
            })
          } catch (error) {
            await deleteCloudinaryImage(result.public_id)
            throw error
          }

          return new Response(
            JSON.stringify({
              secure_url: upload.imageUrl,
              upload_id: upload.id,
              width: result.width,
              height: result.height,
              format: result.format,
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            },
          )
        } catch (error) {
          if (error instanceof RequestBodyTooLargeError) {
            return new Response(JSON.stringify({ message: error.message }), {
              status: 413,
              headers: { 'content-type': 'application/json' },
            })
          }

          const message =
            error instanceof Error ? error.message : 'Server upload error'
          return new Response(JSON.stringify({ message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          })
        }
      },
    },
  },
})
