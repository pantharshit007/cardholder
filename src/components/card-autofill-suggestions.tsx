import { Button } from '@/components/ui/button'
import { AUTOFILL_FIELDS } from '@/constants'
import type { ExtractedCard, CardAutofillSuggestionsProps } from '@/types/ocr'

/** Review the last scan without re-uploading or replacing values implicitly. */
export function CardAutofillSuggestions({
  suggestions,
  current,
  categories,
  disabled,
  onApply,
}: CardAutofillSuggestionsProps) {
  const display = (key: keyof ExtractedCard, value: string | null) =>
    key === 'categoryId'
      ? (categories.find((category) => category.id === value)?.name ??
        'Uncategorized')
      : value || 'Empty'
  const available = AUTOFILL_FIELDS.filter(
    ({ key }) =>
      suggestions[key] &&
      (key !== 'categoryId' ||
        categories.some((category) => category.id === suggestions[key])),
  )
  if (!available.length) return null
  return (
    <details className="mt-4 rounded-xl border border-foreground/15 bg-card p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Review suggestions from last scan
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">
        Compare with your entries and choose what to replace. No new scan is
        needed.
      </p>
      <div className="mt-4 divide-y divide-border">
        {available.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-start justify-between gap-3 py-3"
          >
            <div className="min-w-0 text-sm">
              <p className="font-medium">{label}</p>
              <p className="break-words text-muted-foreground">
                Current: {display(key, current[key])}
              </p>
              <p className="break-words">
                Suggested: {display(key, suggestions[key])}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || current[key] === suggestions[key]}
              onClick={() => onApply(key)}
            >
              Use suggestion
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onApply()}
        >
          Apply all suggestions
        </Button>
        <p className="text-xs text-muted-foreground">
          Replaces matching fields. Missing suggestions leave your entries
          intact.
        </p>
      </div>
    </details>
  )
}
