import type { CSSProperties } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { VisitingCardData } from '@/types/visiting-card'

export function VisitingCard({
  card,
  className,
  style,
}: {
  card: VisitingCardData
  className?: string
  style?: CSSProperties
}) {
  return (
    <article
      style={style}
      className={cn(
        'relative flex min-h-44 flex-col justify-between overflow-hidden rounded-md border border-foreground/10 bg-card p-5 text-card-foreground shadow-[0_18px_40px_-24px_oklch(0.3_0.04_50_/_0.45)]',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-primary"
      />
      <div className="flex items-start justify-between gap-3 pl-2">
        <Badge variant="outline">{card.category}</Badge>
        <Avatar className="size-8 rounded-md">
          <AvatarFallback className="rounded-md bg-secondary font-display text-xs">
            {card.initials}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="pl-2">
        <p className="font-display text-2xl leading-none tracking-tight">
          {card.name}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{card.company}</p>
        <p className="mt-1 font-mono text-xs tracking-wide text-foreground/80">
          {card.phone}
        </p>
      </div>
    </article>
  )
}
