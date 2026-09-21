import { GOOGLE_MAPS_SEARCH_URL } from '@/constants'

export function getGoogleMapsSearchUrl(location: string): string {
  const url = new URL(GOOGLE_MAPS_SEARCH_URL)
  url.searchParams.set('api', '1')
  url.searchParams.set('query', location)
  return url.toString()
}
