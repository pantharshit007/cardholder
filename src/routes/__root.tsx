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

const cryptoPolyfillScript = `
try {
  var g = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this;
  if (g && !g.crypto) { g.crypto = {}; }
  if (g && g.crypto && typeof g.crypto.randomUUID !== 'function') {
    var polyfill = function() {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, function(c) {
        var rand = 0;
        if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
          var arr = new Uint8Array(1);
          g.crypto.getRandomValues(arr);
          rand = arr[0];
        } else {
          rand = Math.floor(Math.random() * 256);
        }
        return (+c ^ (rand & (15 >> (+c / 4)))).toString(16);
      });
    };
    try { Object.defineProperty(g.crypto, 'randomUUID', { value: polyfill, writable: true, configurable: true }); } catch (_) {
      try { g.crypto.randomUUID = polyfill; } catch (__) {}
    }
    try {
      if (typeof Crypto !== 'undefined' && Crypto.prototype && typeof Crypto.prototype.randomUUID !== 'function') {
        Object.defineProperty(Crypto.prototype, 'randomUUID', { value: polyfill, writable: true, configurable: true });
      }
    } catch (_) {}
  }
} catch (_) {}
`

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
    scripts: [
      {
        children: cryptoPolyfillScript,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootComponent() {
  return (
    <AppProviders>
      <Outlet />
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
