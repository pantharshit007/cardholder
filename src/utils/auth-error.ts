const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Email or password is wrong.',
  USER_ALREADY_EXISTS: 'That email is already registered.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'That email is already registered.',
  EMAIL_PASSWORD_SIGN_UP_DISABLED: 'Signup is closed.',
  PASSWORD_TOO_SHORT: 'Password is too short.',
  PASSWORD_TOO_LONG: 'Password is too long.',
  INVALID_EMAIL: 'Enter a valid email.',
}

export function authErrorMessage(
  error: { message?: string; code?: string } | null | undefined,
  fallback: string,
): string {
  if (!error) {
    return fallback
  }

  if (error.code) {
    const mapped = AUTH_ERROR_MESSAGES[error.code]
    if (mapped) {
      return mapped
    }
  }

  return error.message ?? fallback
}
