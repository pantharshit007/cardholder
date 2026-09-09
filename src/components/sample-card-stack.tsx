import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VisitingCard } from '@/components/visiting-card'
import { LANDING_CARD_STACK } from '@/constants'
import type { VisitingCardData } from '@/types/visiting-card'

const SAMPLE_CARDS: Array<VisitingCardData> = [
  {
    name: 'Kaori Fujimoto',
    company: 'Desk & Stamp',
    phone: '+81 90 4182 6631',
    category: 'Print',
    initials: 'KF',
  },
  {
    name: 'Levente Barta',
    company: 'Paperwright',
    phone: '+36 30 519 2847',
    category: 'Studio',
    initials: 'LB',
  },
  {
    name: 'Nkechi Okafor',
    company: 'Harbor Type',
    phone: '+1 (415) 629-4083',
    category: 'Press',
    initials: 'NO',
  },
]

export function SampleCardStack() {
  return (
    <section className="relative min-h-96 w-full overflow-x-hidden lg:min-h-[32rem]">
      <Card className="absolute top-0 right-0 z-0 w-[min(100%,19rem)] rotate-2 animate-rise bg-card/80 shadow-none delay-100">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            A card waiting in the case
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <Skeleton className="h-28 w-full rounded-md" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardContent>
      </Card>

      {SAMPLE_CARDS.map((card, index) => {
        const layout = LANDING_CARD_STACK[index]
        if (!layout) {
          return null
        }

        return (
          <VisitingCard
            key={card.phone}
            card={card}
            className="absolute w-[min(100%,20.5rem)] animate-rise"
            style={{
              top: `${layout.topRem}rem`,
              left: `${layout.leftPercent}%`,
              zIndex: layout.zIndex,
              transform: `rotate(${layout.rotateDeg}deg)`,
              animationDelay: `${layout.delayMs}ms`,
            }}
          />
        )
      })}
    </section>
  )
}
