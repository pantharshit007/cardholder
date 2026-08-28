import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { AppProviders } from '@/components/app-providers'
import { NotFound } from '@/components/not-found'
import { APP_NAME } from '@/constants'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: APP_NAME,
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: RootNotFound,
  shellComponent: RootDocument,
})

function RootComponent() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  )
}

function RootNotFound() {
  return (
    <AppProviders>
      <NotFound />
    </AppProviders>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-[100dvh] font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
