import { useEffect, useRef, useState } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { CARD_CONFIG } from '@/constants'

export function CardSearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const callback = useRef(onChange)
  callback.current = onChange

  useEffect(() => {
    clearTimeout(timer.current)
    setDraft(value)
  }, [value])
  useEffect(() => () => clearTimeout(timer.current), [])

  function update(next: string) {
    setDraft(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(
      () => callback.current(next.trim()),
      CARD_CONFIG.searchDebounceMs,
    )
  }

  return (
    <div className="relative min-w-0 flex-1">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label="Search cards"
        value={draft}
        maxLength={CARD_CONFIG.searchMaxLength}
        onChange={(event) => update(event.target.value)}
        placeholder="Search by name, company, phone..."
        className="bg-background/70 pr-10 pl-9 text-sm"
      />
      {draft ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            clearTimeout(timer.current)
            setDraft('')
            onChange('')
          }}
          className="absolute top-0 right-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </div>
  )
}
