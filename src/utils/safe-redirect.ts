import { DEFAULT_POST_AUTH_PATH, LOGIN_PATH, SIGNUP_PATH } from '@/constants'

const AUTH_PATHS = [LOGIN_PATH, SIGNUP_PATH] as const

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (authPath) => pathname === authPath || pathname.startsWith(`${authPath}/`),
  )
}

export function safeRedirectPath(value: string | undefined): string {
  if (!value || !/^\/(?!\/|\\)/.test(value) || value.includes('\\')) {
    return DEFAULT_POST_AUTH_PATH
  }

  const pathname = value.split(/[?#]/, 1)[0] ?? value
  if (isAuthPath(pathname)) {
    return DEFAULT_POST_AUTH_PATH
  }

  return value
}
