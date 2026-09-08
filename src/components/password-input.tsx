'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={cn('bg-card pr-9', className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}
