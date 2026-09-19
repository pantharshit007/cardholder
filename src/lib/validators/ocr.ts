import { z } from 'zod'

import { FIELD_LIMITS, OCR_CONFIG } from '@/constants'

export const ocrImageSchema = z
  .instanceof(Blob)
  .refine(
    (file) => file.size > 0 && file.size <= OCR_CONFIG.maxImageBytes,
    'Scan image must be under 1 MB.',
  )
  .refine(
    (file) => OCR_CONFIG.allowedMimeTypes.some((type) => type === file.type),
    'Scan image must be JPEG or PNG.',
  )

export const ocrTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(OCR_CONFIG.maxTextLength)

export const extractedCardSchema = z
  .object({
    name: z.string().trim().max(FIELD_LIMITS.name).nullable(),
    phone: z.string().trim().max(FIELD_LIMITS.phone).nullable(),
    email: z
      .union([z.string().trim().email().max(FIELD_LIMITS.email), z.literal('')])
      .nullable(),
    categoryId: z.string().uuid().nullable(),
    company: z.string().trim().max(FIELD_LIMITS.company).nullable(),
  })
  .strict()

export const ocrResponseSchema = z.object({
  IsErroredOnProcessing: z.boolean(),
  OCRExitCode: z.coerce.number(),
  ParsedResults: z
    .array(
      z.object({
        FileParseExitCode: z.coerce.number(),
        ParsedText: z.string(),
      }),
    )
    .optional(),
})
