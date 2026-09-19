import { isSharedAddressIpv4 } from '@/utils/ip-address'

/** Share the configured and local/proxy origin policy with API routes. */
export function getTrustedOrigins(
  request: Request | undefined,
  baseUrl: string,
): string[] {
  const origins = new Set<string>()

  if (baseUrl) {
    origins.add(baseUrl)
  }

  const origin = request?.headers.get('origin')
  const host = request?.headers.get('host')

  if (origin) {
    try {
      const url = new URL(origin)
      if (
        (host && url.host === host) ||
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.endsWith('.ts.net') ||
        isSharedAddressIpv4(url.hostname) ||
        url.hostname === 'my-dabba'
      ) {
        origins.add(origin)
      }
    } catch {
      // Ignore malformed origin
    }
  }

  return Array.from(origins)
}
