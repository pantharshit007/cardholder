import { CATEGORY_COLOR_HEXES, DEFAULT_CATEGORY_STRIPE } from '@/constants'

export type CategoryColorHex = (typeof CATEGORY_COLOR_HEXES)[number]

export function isCategoryColorHex(value: string): value is CategoryColorHex {
  return (CATEGORY_COLOR_HEXES as readonly string[]).includes(value)
}

export function categoryStripeColor(color: string | null): string {
  if (color && isCategoryColorHex(color)) {
    return color
  }

  return DEFAULT_CATEGORY_STRIPE
}
