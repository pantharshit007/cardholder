import { DEFAULT_POST_AUTH_PATH, LOGIN_PATH, SIGNUP_PATH } from '@/constants'

export function safeRedirectPath(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_POST_AUTH_PATH
  }

  if (value === LOGIN_PATH || value.startsWith(`${LOGIN_PATH}?`)) {
    return DEFAULT_POST_AUTH_PATH
  }

  if (value === SIGNUP_PATH || value.startsWith(`${SIGNUP_PATH}?`)) {
    return DEFAULT_POST_AUTH_PATH
  }

  return value
}
