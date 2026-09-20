'use client'

import { Link, useRouterState } from '@tanstack/react-router'
import { FilterIcon, PlusIcon } from 'lucide-react'
import { CardSearchInput } from '@/components/card-search-input'

import { CardGridItem } from '@/components/card-grid-item'
import { CardsEmptyState } from '@/components/cards-empty-state'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CARD_NEW_PATH } from '@/constants'
import type { CardSortOption } from '@/constants'
import type { CardListItem, CardListSearch } from '@/types/card'
import type { CategoryListItem } from '@/types/category'
import { categoryStripeColor } from '@/utils/category-color'
import { formatCardCount } from '@/utils/format'

export function CardsPage({
  cards,
  categories,
  filters,
  onFiltersChange,
}: {
  cards: CardListItem[]
  categories: CategoryListItem[]
  filters: CardListSearch
  onFiltersChange: (filters: CardListSearch, replace?: boolean) => void
}) {
  const search = filters.search ?? ''
  const categoryId = filters.categoryId ?? 'all'
  const sort = filters.sort ?? 'newest'
  const isFiltered = Boolean(search || categoryId !== 'all')
  const isLoading = useRouterState({ select: (state) => state.isLoading })

  function handleClearFilters() {
    onFiltersChange({ sort: filters.sort })
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 md:px-8">
      {/* Header Section */}
      <section className="animate-rise pt-4 lg:pt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
              Collection
            </p>
            <h1 className="mt-2 font-display text-4xl leading-[0.95] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Visiting Cards
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {cards.length > 0
                ? `${formatCardCount(cards.length)}${isFiltered ? ' found' : ' in your collection'}`
                : 'All your business contacts in one place'}
            </p>
          </div>

          <Button asChild className="w-fit shrink-0 active:scale-[0.98]">
            <Link to={CARD_NEW_PATH}>
              <PlusIcon className="mr-1.5 size-4" />
              Add card
            </Link>
          </Button>
        </div>
      </section>

      {/* Filter / Search toolbar (only shown if user has cards) */}
      {cards.length > 0 || isFiltered ? (
        <section className="mt-8 flex flex-col gap-3 rounded-xl border border-foreground/10 bg-card/60 p-3 sm:flex-row sm:items-center">
          {/* Search */}
          <CardSearchInput
            value={search}
            onChange={(value) =>
              onFiltersChange({ ...filters, search: value || undefined }, true)
            }
          />

          <div className="flex items-center gap-2">
            {/* Category Filter */}
            <Select
              value={categoryId}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  categoryId: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger
                aria-label="Filter by category"
                className="w-full sm:w-44 bg-background/70 text-xs"
              >
                <FilterIcon className="mr-1.5 size-3.5 text-muted-foreground" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: categoryStripeColor(cat.color),
                        }}
                      />
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Control */}
            <Select
              value={sort}
              onValueChange={(val) =>
                onFiltersChange({ ...filters, sort: val as CardSortOption })
              }
            >
              <SelectTrigger
                aria-label="Sort cards"
                className="w-full sm:w-36 bg-background/70 text-xs"
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name_asc">Name (A–Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z–A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
      ) : null}

      {/* Cards List / Grid */}
      <section className="mt-8" aria-busy={isLoading}>
        <p role="status" className="mb-3 text-sm text-muted-foreground">
          {isLoading ? 'Updating cards…' : formatCardCount(cards.length)}
        </p>
        {cards.length === 0 ? (
          <CardsEmptyState
            isFiltered={isFiltered}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card) => (
              <CardGridItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
