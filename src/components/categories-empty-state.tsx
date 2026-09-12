import { Button } from '@/components/ui/button'

export function CategoriesEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border-y border-dashed border-foreground/15 py-12">
      <p className="font-display text-2xl leading-none tracking-tight">
        The drawers are unmarked.
      </p>
      <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        Add a tab before you start filing cards. Names like Clients, Press, or
        Vendors keep the tray sortable later.
      </p>
      <Button
        type="button"
        className="mt-6 active:scale-[0.98]"
        onClick={onAdd}
      >
        Add a drawer
      </Button>
    </div>
  )
}
