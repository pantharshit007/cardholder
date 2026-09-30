import type { PercentCrop } from 'react-image-crop'

export type ImageCrop = PercentCrop

export type ImageTransform = {
  rotation: number
  flipHorizontal: boolean
  flipVertical: boolean
}

export type ImageRectangle = {
  x: number
  y: number
  width: number
  height: number
}

export type CardImageInputProps = {
  previewUrl: string | null
  file: File | null
  disabled: boolean
  editorOpen: boolean
  onEditorOpenChange: (open: boolean) => void
  onClipboardReadingChange: (reading: boolean) => void
  onSelect: (file: File) => void
  onRemove: () => void
}

export type ImageEditorProps = {
  source: string
  file: File | null
  onApply: (file: File) => void
  onClose: () => void
}
