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
import { SIGNUP_PATH } from '@/constants'
import { authClient } from '@/lib/auth-client'
import { signInSchema } from '@/lib/validators/auth'
import { authErrorMessage } from '@/utils/auth-error'
import { safeRedirectPath } from '@/utils/safe-redirect'

export function LoginForm({
  allowSignup,
  redirectTo,
}: {
  allowSignup: boolean
  redirectTo?: string
}) {
  const router = useRouter()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
  }>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = signInSchema.safeParse({
      email: email.trim(),
      password,
    })

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      })
      return
    }

    setErrors({})
    setFormError(null)
    setPending(true)

    const { error } = await authClient.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (error) {
      const message = authErrorMessage(error, 'Could not sign in.')
      setFormError(message)
      toast.error(message)
      setPending(false)
      return
    }

    await router.invalidate()
    const next = safeRedirectPath(redirectTo)
    await navigate({ href: next, replace: true })
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="bg-card"
            aria-invalid={errors.email ? true : undefined}
          />
          <FieldError>{errors.email}</FieldError>
        </Field>
        <Field data-invalid={errors.password ? true : undefined}>
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={errors.password ? true : undefined}
          />
          <FieldError>{errors.password}</FieldError>
        </Field>
        {formError ? <FieldError>{formError}</FieldError> : null}
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="w-full active:scale-[0.98] sm:w-fit"
        >
          {pending ? 'Opening the case' : 'Open the case'}
        </Button>
      </FieldGroup>
      {allowSignup ? (
        <p className="mt-6 text-sm text-muted-foreground">
          New here?{' '}
          <Link
            to={SIGNUP_PATH}
            className="text-foreground underline-offset-4 hover:underline"
          >
            Create the first account
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Signup is closed. Use the account already on this case.
        </p>
      )}
    </form>
  )
}
