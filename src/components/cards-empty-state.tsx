import { Link } from '@tanstack/react-router'
import { CreditCardIcon, PlusIcon, SearchXIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CARD_NEW_PATH } from '@/constants'

export function CardsEmptyState({
  isFiltered,
  onClearFilters,
}: {
  isFiltered?: boolean
  onClearFilters?: () => void
}) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/15 py-16 px-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SearchXIcon className="size-6" />
        </div>
        <h3 className="mt-4 font-display text-2xl tracking-tight text-foreground">
          No cards found
        </h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          No cards matched your current search or category filter. Try
          adjusting your search term or clearing the filter.
        </p>
        {onClearFilters ? (
          <Button
            type="button"
            variant="outline"
            onClick={onClearFilters}
            className="mt-6 active:scale-[0.98]"
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/15 py-20 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary shadow-xs">
        <CreditCardIcon className="size-7" />
      </div>
      <h2 className="mt-5 font-display text-3xl tracking-tight text-foreground">
        No business cards yet
      </h2>
      <p className="mt-2.5 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        Keep your business and visiting cards organized in one place. Add your
        first card with an image, contact info, and category.
      </p>
      <Button asChild className="mt-8 active:scale-[0.98]">
        <Link to={CARD_NEW_PATH}>
          <PlusIcon className="mr-1.5 size-4" />
          Add your first card
        </Link>
      </Button>
    </div>
  )
}
