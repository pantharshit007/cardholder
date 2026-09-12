import { Button } from '@/components/ui/button'

export function CategoriesEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border-y border-dashed border-foreground/15 py-12">
      <p className="font-display text-2xl leading-none tracking-tight">
        No categories yet.
      </p>
      <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        Create your first category to keep related cards together. For example:
        Clients, Vendors, or Services.
      </p>
      <Button
        type="button"
        className="mt-6 active:scale-[0.98]"
        onClick={onAdd}
      >
        Add category
      </Button>
    </div>
  )
}
