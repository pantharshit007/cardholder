'use client'

import { CATEGORY_COLORS } from '@/constants'
import { cn } from '@/lib/utils'
import type { CategoryColorHex } from '@/utils/category-color'

export function CategoryColorSwatches({
  value,
  onChange,
  disabled,
}: {
  value: CategoryColorHex | null
  onChange: (color: CategoryColorHex | null) => void
  disabled?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Category color"
      className="flex flex-wrap items-center gap-2"
    >
      <Swatch
        label="No color"
        selected={value === null}
        disabled={disabled}
        onSelect={() => onChange(null)}
      />
      {CATEGORY_COLORS.map((option) => (
        <Swatch
          key={option.hex}
          label={option.label}
          color={option.hex}
          selected={value === option.hex}
          disabled={disabled}
          onSelect={() => onChange(option.hex)}
        />
      ))}
    </div>
  )
}

function Swatch({
  label,
  color,
  selected,
  disabled,
  onSelect,
}: {
  label: string
  color?: CategoryColorHex
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-label={label}
      aria-checked={selected}
      disabled={disabled}
      title={label}
      onClick={onSelect}
      className={cn(
        'relative size-7 rounded-full border border-foreground/15 transition-transform outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] disabled:opacity-50',
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      {!color ? (
        <span
          aria-hidden="true"
          className="absolute inset-[5px] rounded-full border border-foreground/30"
        />
      ) : null}
    </button>
  )
}
