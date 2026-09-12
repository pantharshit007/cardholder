'use client'

import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  AUTH_NAME_MAX_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
  FIELD_LIMITS,
  LOGIN_PATH,
} from '@/constants'
import { authClient } from '@/lib/auth-client'
import { signUpSchema } from '@/lib/validators/auth'
import { authErrorMessage } from '@/utils/auth-error'

export function SignupForm() {
  const router = useRouter()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = signUpSchema.safeParse({
      name,
      email: email.trim(),
      password,
      confirmPassword,
    })

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      })
      return
    }

    setErrors({})
    setFormError(null)
    setPending(true)

    const { error } = await authClient.signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (error) {
      const message = authErrorMessage(error, 'Could not create the account.')
      setFormError(message)
      toast.error(message)
      setPending(false)
      return
    }

    await router.invalidate()
    await navigate({ to: '/', replace: true })
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="signup-name">Name</FieldLabel>
          <Input
            id="signup-name"
            name="name"
            autoComplete="name"
            value={name}
            maxLength={AUTH_NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            className="bg-card"
            aria-invalid={errors.name ? true : undefined}
          />
          <FieldError>{errors.name}</FieldError>
        </Field>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="signup-email">Email</FieldLabel>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            maxLength={FIELD_LIMITS.email}
            onChange={(event) => setEmail(event.target.value)}
            className="bg-card"
            aria-invalid={errors.email ? true : undefined}
          />
          <FieldError>{errors.email}</FieldError>
        </Field>
        <Field data-invalid={errors.password ? true : undefined}>
          <FieldLabel htmlFor="signup-password">Password</FieldLabel>
          <PasswordInput
            id="signup-password"
            name="password"
            autoComplete="new-password"
            value={password}
            maxLength={AUTH_PASSWORD_MAX_LENGTH}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={errors.password ? true : undefined}
          />
          <FieldError>{errors.password}</FieldError>
        </Field>
        <Field data-invalid={errors.confirmPassword ? true : undefined}>
          <FieldLabel htmlFor="signup-confirm-password">
            Confirm password
          </FieldLabel>
          <PasswordInput
            id="signup-confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            maxLength={AUTH_PASSWORD_MAX_LENGTH}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={errors.confirmPassword ? true : undefined}
          />
          <FieldError>{errors.confirmPassword}</FieldError>
        </Field>
        {formError ? <FieldError>{formError}</FieldError> : null}
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="w-full active:scale-[0.98] sm:w-fit"
        >
          {pending ? 'Creating account' : 'Create account'}
        </Button>
      </FieldGroup>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to={LOGIN_PATH}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
