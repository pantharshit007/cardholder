export type PublicUser = {
  id: string
  name: string
  isAdmin: boolean
  emailVerified: boolean
  email: string
  image: string | null
}

export type AuthSettings = {
  allowSignup: boolean
}

export type LoginSearch = {
  redirect?: string
}
