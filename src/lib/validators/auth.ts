import { z } from 'zod'

import {
  AUTH_NAME_MAX_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  FIELD_LIMITS,
} from '@/constants'

export const signInSchema = z.object({
  email: z.email().max(FIELD_LIMITS.email),
  password: z
    .string()
    .min(1, 'Enter your password.')
    .max(AUTH_PASSWORD_MAX_LENGTH),
})

export const signUpSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a name.').max(AUTH_NAME_MAX_LENGTH),
    email: z.email().max(FIELD_LIMITS.email),
    password: z
      .string()
      .min(
        AUTH_PASSWORD_MIN_LENGTH,
        `Use at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
      )
      .max(AUTH_PASSWORD_MAX_LENGTH),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
