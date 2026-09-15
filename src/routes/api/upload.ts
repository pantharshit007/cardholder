import { createFileRoute } from '@tanstack/react-router'

import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from '@/constants'
import { env } from '@/env'
import { auth } from '@/lib/auth'

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
          const formData = await request.formData()
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
                message: `Image must be smaller than ${MAX_IMAGE_BYTES / (1024 * 1024)}MB.`,
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

          const cloudinaryFormData = new FormData()
          cloudinaryFormData.append('file', file)
          cloudinaryFormData.append('upload_preset', uploadPreset)

          const cloudinaryRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
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

          return new Response(
            JSON.stringify({
              secure_url: result.secure_url,
              public_id: result.public_id,
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
