import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

function getRuntimeEnv(): Record<string, string | boolean | undefined> {
  const fromVite = import.meta.env as Record<
    string,
    string | boolean | undefined
  >
  const fromProcess =
    typeof process === 'undefined'
      ? {}
      : (process.env as Record<string, string | undefined>)

  return { ...fromProcess, ...fromVite }
}

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    /** Optional override; defaults to `pg` in development and `neon` in production. */
    DB_DRIVER: z.enum(['pg', 'neon']).optional(),
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    OCR_SPACE_API_KEY: z.string().default('helloworld'),
  },
  clientPrefix: 'VITE_',
  client: {
    VITE_CLOUDINARY_CLOUD_NAME: z.string().min(1),
    VITE_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
  },
  runtimeEnv: getRuntimeEnv(),
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
})
