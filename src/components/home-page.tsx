import { FoundationDemo } from '@/components/foundation-demo'
import { SiteHeader } from '@/components/site-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VisitingCard  } from '@/components/visiting-card'
import type {VisitingCardData} from '@/components/visiting-card';
import { APP_NAME } from '@/constants'

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

export function HomePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-start gap-12 px-4 pb-16 md:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:pt-6">
        <section className="animate-rise pt-4 lg:pt-10">
          <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
            Private card case
          </p>
          <h1 className="mt-4 max-w-[16ch] font-display text-5xl leading-[0.92] tracking-tight text-foreground md:text-6xl">
            Keep the names you were handed in a hallway.
          </h1>
          <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
            {APP_NAME} stores visiting cards as name, phone, category, and a
            photo. This page is the styling baseline: Tailwind utilities, a
            shadcn button and input, and a light/dark paper theme.
          </p>
          <FoundationDemo />
        </section>

        <section className="relative min-h-96 w-full overflow-x-hidden lg:min-h-[32rem]">
          <Card className="absolute top-0 right-0 z-0 w-[min(100%,19rem)] rotate-2 animate-rise bg-card/80 shadow-none delay-100">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Scanning a card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <Skeleton className="h-28 w-full rounded-md" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>

          {SAMPLE_CARDS.map((card, index) => (
            <VisitingCard
              key={card.phone}
              card={card}
              className="absolute w-[min(100%,20.5rem)] animate-rise"
              style={{
                top: `${index * 5.5 + 4}rem`,
                left: index === 1 ? '8%' : index === 2 ? '0%' : '18%',
                zIndex: index + 1,
                transform: `rotate(${index === 1 ? -4 : index === 2 ? 3 : -1.5}deg)`,
                animationDelay: `${(index + 2) * 90}ms`,
              }}
            />
          ))}
        </section>
      </main>
    </div>
  )
}
