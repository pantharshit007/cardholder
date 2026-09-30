'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ClipboardPasteIcon,
  CropIcon,
  UploadCloudIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { CardImageEditor } from '@/components/card-image-editor'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FieldLabel } from '@/components/ui/field'
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_EDITOR_CONFIG,
  MAX_IMAGE_SIZE_MEBIBYTES,
} from '@/constants'
import type { CardImageInputProps } from '@/types/image-editor'

/** Select, paste, replace, remove, or edit a card image before upload. */
export function CardImageInput({
  previewUrl,
  file,
  disabled,
  editorOpen,
  onEditorOpenChange,
  onClipboardReadingChange,
  onSelect,
  onRemove,
}: CardImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isReadingClipboard, setIsReadingClipboard] = useState(false)
  const clipboardRequestRef = useRef(0)

  useEffect(
    () => () => {
      clipboardRequestRef.current++
    },
    [],
  )

  /** Read an allowed clipboard image with keyboard-paste guidance on failure. */
  async function pasteFromClipboard() {
    if (disabled || isReadingClipboard) return
    if (!('clipboard' in navigator) || !('read' in navigator.clipboard)) {
      toast.info(
        'Copy an image, then press Ctrl+V or ⌘V anywhere in this form.',
      )
      return
    }
    const request = ++clipboardRequestRef.current
    setIsReadingClipboard(true)
    onClipboardReadingChange(true)
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const mimeType = item.types.find((type) =>
          (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(type),
        )
        if (!mimeType) continue
        const blob = await item.getType(mimeType)
        if (clipboardRequestRef.current !== request) return
        const extensions: Record<string, string> =
          IMAGE_EDITOR_CONFIG.mimeExtensions
        onSelect(
          new File(
            [blob],
            `${IMAGE_EDITOR_CONFIG.clipboardFileName}.${extensions[mimeType]}`,
            { type: mimeType },
          ),
        )
        return
      }
      toast.info(
        'No image found in your clipboard. Copy an image first, then paste it here.',
      )
    } catch {
      toast.info(
        'Clipboard access is unavailable. Copy an image, then press Ctrl+V or ⌘V in this form.',
      )
    } finally {
      if (clipboardRequestRef.current === request) {
        setIsReadingClipboard(false)
        onClipboardReadingChange(false)
      }
    }
  }

  const controlsDisabled = disabled || isReadingClipboard
  return (
    <div>
      <FieldLabel
        htmlFor="card-image-file-input"
        className="mb-2 block cursor-pointer font-medium"
      >
        Card Image
      </FieldLabel>
      <p className="mb-3 text-xs text-muted-foreground">
        Upload or paste a card image, then crop, rotate, or flip it before
        saving. JPEG, PNG, or WebP up to {MAX_IMAGE_SIZE_MEBIBYTES}MB.
      </p>
      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-foreground/15 bg-muted/40 shadow-xs">
          <div className="flex max-h-72 w-full items-center justify-center overflow-hidden bg-black/5 p-4 dark:bg-white/5">
            <img
              src={previewUrl}
              alt="Business card preview"
              className="max-h-64 max-w-full rounded-md object-contain shadow-xs"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-foreground/10 bg-card px-4 py-2.5">
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {file?.name ?? 'Saved card image'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={controlsDisabled}
                onClick={() => onEditorOpenChange(true)}
              >
                <CropIcon /> Edit image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={controlsDisabled}
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={controlsDisabled}
                onClick={onRemove}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <XIcon /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor="card-image-file-input"
          onDragOver={(event) => {
            event.preventDefault()
            if (!controlsDisabled) setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            if (!controlsDisabled && event.dataTransfer.files[0])
              onSelect(event.dataTransfer.files[0])
          }}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${controlsDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${isDragging ? 'border-primary bg-primary/5' : 'border-foreground/20 hover:border-foreground/40 hover:bg-muted/30'}`}
        >
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <UploadCloudIcon className="size-6" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Click to select or drag and drop card image
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Or copy an image and paste with Ctrl+V / ⌘V
          </p>
        </label>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={controlsDisabled}
        onClick={() => void pasteFromClipboard()}
      >
        <ClipboardPasteIcon />
        {isReadingClipboard ? 'Reading clipboard…' : 'Paste image'}
      </Button>
      <input
        id="card-image-file-input"
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_MIME_TYPES.join(',')}
        className="sr-only"
        disabled={controlsDisabled}
        onChange={(event) => {
          const selected = event.target.files?.[0]
          if (selected) onSelect(selected)
          event.target.value = ''
        }}
      />
      <Dialog open={editorOpen} onOpenChange={onEditorOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          {editorOpen && previewUrl ? (
            <CardImageEditor
              source={previewUrl}
              file={file}
              onApply={(edited) => {
                onSelect(edited)
                onEditorOpenChange(false)
              }}
              onClose={() => onEditorOpenChange(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
