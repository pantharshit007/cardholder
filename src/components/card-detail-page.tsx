'use client'

import { Link, useRouter } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  Trash2Icon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { DeleteCardDialog } from '@/components/delete-card-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CARDS_PATH } from '@/constants'
import { getCardDetailImageUrl } from '@/services/cloudinary'
import type { CardRecord } from '@/types/card'
import { initialsFromName } from '@/utils/auth-user'
import { categoryStripeColor } from '@/utils/category-color'
import { formatDate } from '@/utils/format'

export function CardDetailPage({ card }: { card: CardRecord }) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const stripeColor = categoryStripeColor(card.categoryColor ?? null)
  const detailImageUrl = card.imageUrl
    ? getCardDetailImageUrl(card.imageUrl)
    : null

  async function copyToClipboard(text: string, type: 'phone' | 'email') {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'phone') {
        setCopiedPhone(true)
        setTimeout(() => setCopiedPhone(false), 2000)
        toast.success('Phone number copied to clipboard.')
      } else {
        setCopiedEmail(true)
        setTimeout(() => setCopiedEmail(false), 2000)
        toast.success('Email copied to clipboard.')
      }
    } catch {
      toast.error('Failed to copy to clipboard.')
    }
  }

  function handleDeleted() {
    void router.navigate({ to: CARDS_PATH })
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 md:px-8">
      {/* Navigation & Action Bar */}
      <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between lg:pt-8">
        <Link
          to={CARDS_PATH}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to all cards
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="active:scale-[0.98]">
            <Link to="/cards/$id/edit" params={{ id: card.id }}>
              <PencilIcon className="mr-1.5 size-3.5" />
              Edit
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-[0.98]"
          >
            <Trash2Icon className="mr-1.5 size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <section className="animate-rise mt-6">
        <div className="flex flex-wrap items-center gap-3">
          {card.categoryName ? (
            <Badge variant="outline" className="text-xs">
              <span
                aria-hidden="true"
                className="mr-1.5 size-2 rounded-full"
                style={{ backgroundColor: stripeColor }}
              />
              {card.categoryName}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Uncategorized
            </Badge>
          )}
        </div>

        <h1 className="mt-2 font-display text-4xl leading-[0.95] tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {card.name}
        </h1>

        {card.company ? (
          <p className="mt-2 flex items-center gap-2 text-lg text-muted-foreground">
            <BuildingIcon className="size-4 text-muted-foreground" />
            {card.company}
          </p>
        ) : null}
      </section>

      {/* Main Grid: Card Image & Info */}
      <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Left: Card Visual */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-card shadow-xs">
            {detailImageUrl ? (
              <div className="group relative flex items-center justify-center bg-muted/40 p-4 sm:p-8">
                <img
                  src={detailImageUrl}
                  alt={`${card.name}'s business card`}
                  className="max-h-[500px] w-auto max-w-full rounded-lg object-contain shadow-md"
                />
                {card.imageUrl ? (
                  <a
                    href={card.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-md bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-xs transition-opacity hover:bg-background"
                  >
                    <ExternalLinkIcon className="size-3" />
                    Open full image
                  </a>
                ) : null}
              </div>
            ) : (
              /* High fidelity placeholder business card */
              <div className="relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden bg-card p-8 text-card-foreground sm:p-12">
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-2.5"
                  style={{ backgroundColor: stripeColor }}
                />
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs tracking-widest text-muted-foreground/60 uppercase">
                    Visiting Card
                  </span>
                  <Avatar className="size-12 rounded-lg border border-foreground/10">
                    <AvatarFallback className="rounded-lg bg-secondary font-display text-base">
                      {initialsFromName(card.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="space-y-1">
                  <p className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                    {card.name}
                  </p>
                  {card.company ? (
                    <p className="text-base text-muted-foreground">{card.company}</p>
                  ) : null}
                </div>

                <div className="space-y-1 border-t border-foreground/10 pt-4 font-mono text-xs text-foreground/80">
                  {card.phone ? <p>{card.phone}</p> : null}
                  {card.email ? <p>{card.email}</p> : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Details & Meta */}
        <div className="space-y-6 lg:col-span-5">
          {/* Contact Details Card */}
          <div className="rounded-2xl border border-foreground/10 bg-card p-6 shadow-xs">
            <h2 className="font-mono text-xs tracking-widest text-primary uppercase">
              Contact Information
            </h2>

            <div className="mt-5 space-y-4">
              {/* Phone */}
              {card.phone ? (
                <div className="flex items-center justify-between rounded-xl border border-foreground/10 bg-muted/20 p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase">
                      <PhoneIcon className="size-3" />
                      Phone
                    </p>
                    <a
                      href={`tel:${card.phone}`}
                      className="mt-0.5 block truncate font-mono text-sm font-medium text-foreground hover:underline"
                    >
                      {card.phone}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void copyToClipboard(card.phone!, 'phone')}
                    className="size-8 p-0"
                    aria-label="Copy phone"
                  >
                    {copiedPhone ? (
                      <CheckIcon className="size-4 text-green-500" />
                    ) : (
                      <CopyIcon className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              ) : null}

              {/* Email */}
              {card.email ? (
                <div className="flex items-center justify-between rounded-xl border border-foreground/10 bg-muted/20 p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase">
                      <MailIcon className="size-3" />
                      Email
                    </p>
                    <a
                      href={`mailto:${card.email}`}
                      className="mt-0.5 block truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {card.email}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void copyToClipboard(card.email!, 'email')}
                    className="size-8 p-0"
                    aria-label="Copy email"
                  >
                    {copiedEmail ? (
                      <CheckIcon className="size-4 text-green-500" />
                    ) : (
                      <CopyIcon className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              ) : null}

              {!card.phone && !card.email ? (
                <p className="text-sm text-muted-foreground italic">
                  No phone number or email address saved for this card.
                </p>
              ) : null}
            </div>
          </div>

          {/* Notes Card */}
          {card.notes ? (
            <div className="rounded-2xl border border-foreground/10 bg-card p-6 shadow-xs">
              <h2 className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-primary uppercase">
                <FileTextIcon className="size-3.5" />
                Notes
              </h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {card.notes}
              </div>
            </div>
          ) : null}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              Added {formatDate(card.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <DeleteCardDialog
        card={card}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDeleted}
      />
    </main>
  )
}
