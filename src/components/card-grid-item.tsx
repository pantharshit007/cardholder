import { Link } from '@tanstack/react-router'
import { BuildingIcon, MailIcon, PhoneIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getCardThumbnailUrl } from '@/services/cloudinary'
import type { CardListItem } from '@/types/card'
import { initialsFromName } from '@/utils/auth-user'
import { categoryStripeColor } from '@/utils/category-color'

export function CardGridItem({ card }: { card: CardListItem }) {
  const stripeColor = categoryStripeColor(card.categoryColor ?? null)
  const thumbnailUrl = card.imageUrl ? getCardThumbnailUrl(card.imageUrl) : null

  return (
    <Link
      to="/cards/$id"
      params={{ id: card.id }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-foreground/10 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md active:translate-y-0"
    >
      {/* Category accent stripe */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 z-10 w-1.5 transition-all group-hover:w-2"
        style={{ backgroundColor: stripeColor }}
      />

      {/* Card Header / Image or Monogram */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/60">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${card.name}'s business card`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full flex-col justify-between p-4 pl-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
                Visiting Card
              </span>
              <Avatar className="size-8 rounded-md border border-foreground/10">
                <AvatarFallback className="rounded-md bg-secondary font-display text-xs">
                  {initialsFromName(card.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-0.5">
              <p className="font-display text-lg tracking-tight text-foreground/90">
                {card.name}
              </p>
              {card.company ? (
                <p className="text-xs text-muted-foreground">{card.company}</p>
              ) : null}
            </div>
          </div>
        )}

        {/* Category Pill floating on thumbnail if image exists */}
        {card.categoryName && thumbnailUrl ? (
          <div className="absolute top-2.5 right-2.5">
            <Badge
              variant="secondary"
              className="bg-background/85 backdrop-blur-xs text-xs font-normal shadow-2xs"
            >
              <span
                aria-hidden="true"
                className="mr-1.5 size-2 rounded-full"
                style={{ backgroundColor: stripeColor }}
              />
              {card.categoryName}
            </Badge>
          </div>
        ) : null}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between p-4 pl-5">
        <div>
          {/* If no thumbnail, show category badge inline */}
          {card.categoryName && !thumbnailUrl ? (
            <div className="mb-2">
              <Badge variant="outline" className="text-xs font-normal">
                <span
                  aria-hidden="true"
                  className="mr-1.5 size-2 rounded-full"
                  style={{ backgroundColor: stripeColor }}
                />
                {card.categoryName}
              </Badge>
            </div>
          ) : null}

          <h3 className="font-display text-xl leading-tight font-medium tracking-tight text-foreground group-hover:text-primary transition-colors">
            {card.name}
          </h3>

          {card.company ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BuildingIcon className="size-3 shrink-0" />
              <span className="truncate">{card.company}</span>
            </p>
          ) : null}
        </div>

        {/* Contact details */}
        <div className="mt-4 space-y-1.5 border-t border-foreground/10 pt-3 text-xs">
          {card.phone ? (
            <p className="flex items-center gap-2 font-mono text-foreground/80">
              <PhoneIcon className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{card.phone}</span>
            </p>
          ) : null}

          {card.email ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MailIcon className="size-3 shrink-0" />
              <span className="truncate">{card.email}</span>
            </p>
          ) : null}

          {!card.phone && !card.email ? (
            <p className="text-muted-foreground/60 italic">No contact info</p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
