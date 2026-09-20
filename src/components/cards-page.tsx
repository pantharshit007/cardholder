'use client'

import { Link } from '@tanstack/react-router'
import { FilterIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { CardGridItem } from '@/components/card-grid-item'
import { CardsEmptyState } from '@/components/cards-empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CARD_NEW_PATH } from '@/constants'
import type { CardSortOption } from '@/constants'
import type { CardListItem } from '@/types/card'
import type { CategoryListItem } from '@/types/category'
import { categoryStripeColor } from '@/utils/category-color'
import { formatCardCount } from '@/utils/format'

export function CardsPage({
  cards,
  categories,
}: {
  cards: CardListItem[]
  categories: CategoryListItem[]
}) {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('all')
  const [sort, setSort] = useState<CardSortOption>('newest')

  const isFiltered = Boolean(search.trim() || categoryId !== 'all')

  const filteredCards = useMemo(() => {
    let result = [...cards]

    if (categoryId !== 'all') {
      if (categoryId === 'uncategorized') {
        result = result.filter((card) => !card.categoryId)
      } else {
        result = result.filter((card) => card.categoryId === categoryId)
      }
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (card) =>
          card.name.toLowerCase().includes(q) ||
          (card.phone && card.phone.toLowerCase().includes(q)) ||
          (card.company && card.company.toLowerCase().includes(q)) ||
          (card.email && card.email.toLowerCase().includes(q)) ||
          (card.location && card.location.toLowerCase().includes(q)) ||
          (card.notes && card.notes.toLowerCase().includes(q)),
      )
    }

    result.sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      if (sort === 'name_asc') {
        return a.name.localeCompare(b.name)
      }
      if (sort === 'name_desc') {
        return b.name.localeCompare(a.name)
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  }, [cards, categoryId, search, sort])

  function handleClearFilters() {
    setSearch('')
    setCategoryId('all')
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
                ? `${formatCardCount(cards.length)} in your collection`
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
      {cards.length > 0 ? (
        <section className="mt-8 flex flex-col gap-3 rounded-xl border border-foreground/10 bg-card/60 p-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, phone..."
              className="pl-9 bg-background/70 text-sm"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter */}
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full sm:w-44 bg-background/70 text-xs">
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
              onValueChange={(val) => setSort(val as CardSortOption)}
            >
              <SelectTrigger className="w-full sm:w-36 bg-background/70 text-xs">
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
      <section className="mt-8">
        {cards.length === 0 ? (
          <CardsEmptyState />
        ) : filteredCards.length === 0 ? (
          <CardsEmptyState
            isFiltered={isFiltered}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card) => (
              <CardGridItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
