'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FIELD_LIMITS } from '@/constants'

export function FoundationDemo() {
  const [name, setName] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Enter a name so the sample toast has something to show.')
      return
    }
    toast.success(`Saved a local preview for ${trimmed}.`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 max-w-md space-y-2"
      noValidate
    >
      <Label htmlFor="sample-name">Name on the card</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id="sample-name"
          name="name"
          value={name}
          maxLength={FIELD_LIMITS.name}
          placeholder="Kaori Fujimoto"
          onChange={(event) => setName(event.target.value)}
          className="bg-card"
        />
        <Button type="submit" className="shrink-0 active:scale-[0.98]">
          Try a toast
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        This is a styling check, not a saved card. Auth and the database land
        later.
      </p>
    </form>
  )
}
