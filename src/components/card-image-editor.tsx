'use client'

import { useEffect, useRef, useState } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  FlipHorizontalIcon,
  FlipVerticalIcon,
  Loader2Icon,
  RotateCcwIcon,
  RotateCwIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IMAGE_EDITOR_CONFIG } from '@/constants'
import { validateImageFile } from '@/services/cloudinary'
import {
  exportEditedImage,
  loadEditableImage,
  transformImage,
} from '@/services/image-editor'
import type { ImageEditorProps, ImageTransform } from '@/types/image-editor'
import { fullImageCrop } from '@/utils/image-editor'

export function CardImageEditor({
  source,
  file,
  onApply,
  onClose,
}: ImageEditorProps) {
  const [original, setOriginal] = useState<HTMLImageElement | null>(null)
  const [transform, setTransform] = useState<ImageTransform>({
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  })
  const [preview, setPreview] = useState<string | null>(null)
  const [crop, setCrop] = useState(fullImageCrop)
  const [error, setError] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const activeRef = useRef(true)

  useEffect(() => {
    activeRef.current = true
    let cancelled = false
    void loadEditableImage(source)
      .then((image) => {
        if (!cancelled) setOriginal(image)
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Could not load the image.',
          )
      })
    return () => {
      cancelled = true
      activeRef.current = false
    }
  }, [source])

  useEffect(() => {
    if (!original) return
    let cancelled = false
    let objectUrl: string | null = null
    void transformImage(original, transform)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPreview(objectUrl)
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Could not edit the image.',
          )
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [original, transform])

  function changeTransform(next: ImageTransform) {
    setPreview(null)
    setError(null)
    setCrop(fullImageCrop())
    setTransform(next)
  }

  async function apply() {
    if (!preview || isApplying) return
    setIsApplying(true)
    setError(null)
    try {
      const edited = await exportEditedImage(preview, crop, file)
      validateImageFile(edited)
      if (activeRef.current) onApply(edited)
    } catch (reason) {
      if (activeRef.current)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Could not apply image changes.',
        )
    } finally {
      if (activeRef.current) setIsApplying(false)
    }
  }

  const disabled = !preview || isApplying
  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit card image</DialogTitle>
        <DialogDescription>
          Drag the crop edges to frame your card. Changes are uploaded when you
          save the card.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            changeTransform({
              ...transform,
              rotation:
                (transform.rotation +
                  IMAGE_EDITOR_CONFIG.fullTurnDegrees -
                  IMAGE_EDITOR_CONFIG.quarterTurnDegrees) %
                IMAGE_EDITOR_CONFIG.fullTurnDegrees,
            })
          }
        >
          <RotateCcwIcon /> Rotate left
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            changeTransform({
              ...transform,
              rotation:
                (transform.rotation + IMAGE_EDITOR_CONFIG.quarterTurnDegrees) %
                IMAGE_EDITOR_CONFIG.fullTurnDegrees,
            })
          }
        >
          <RotateCwIcon /> Rotate right
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            changeTransform({
              ...transform,
              flipHorizontal: !transform.flipHorizontal,
            })
          }
        >
          <FlipHorizontalIcon /> Flip horizontal
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            changeTransform({
              ...transform,
              flipVertical: !transform.flipVertical,
            })
          }
        >
          <FlipVerticalIcon /> Flip vertical
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() =>
            changeTransform({
              rotation: 0,
              flipHorizontal: false,
              flipVertical: false,
            })
          }
        >
          Reset
        </Button>
      </div>
      <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg border bg-muted/40 p-3">
        {preview ? (
          <ReactCrop
            crop={crop}
            onChange={(_, percent) => setCrop(percent)}
            disabled={isApplying}
            minWidth={IMAGE_EDITOR_CONFIG.minCropSize}
            minHeight={IMAGE_EDITOR_CONFIG.minCropSize}
            keepSelection
            ruleOfThirds
          >
            <img
              src={preview}
              alt="Crop selection for card image"
              className="block max-h-[45dvh] max-w-full object-contain"
              draggable={false}
            />
          </ReactCrop>
        ) : !error ? (
          <Loader2Icon
            aria-label="Preparing image"
            className="size-6 animate-spin text-muted-foreground"
          />
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Drag inside the crop to move it. Use arrow keys on a focused crop edge
        for precise adjustments. Rotating or flipping resets the crop.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={disabled || crop.width <= 0 || crop.height <= 0}
          onClick={() => void apply()}
        >
          {isApplying ? <Loader2Icon className="animate-spin" /> : null}
          {isApplying ? 'Applying…' : 'Apply changes'}
        </Button>
      </DialogFooter>
    </>
  )
}
