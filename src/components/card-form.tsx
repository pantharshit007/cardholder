'use client'

import { Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  BuildingIcon,
  FolderIcon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
  UploadCloudIcon,
  UserIcon,
  XIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CARDS_PATH, FIELD_LIMITS } from '@/constants'
import { createCard, updateCard } from '@/server/cards'
import {
  uploadImageToCloudinary,
  validateImageFile,
} from '@/services/cloudinary'
import type { CardRecord } from '@/types/card'
import type { CategoryListItem } from '@/types/category'
import { categoryStripeColor } from '@/utils/category-color'

export function CardForm({
  card,
  categories,
  onSuccess,
}: {
  card?: CardRecord
  categories: CategoryListItem[]
  onSuccess?: (card: CardRecord) => void
}) {
  const router = useRouter()
  const createCardFn = useServerFn(createCard)
  const updateCardFn = useServerFn(updateCard)

  const isEditing = Boolean(card)

  const [name, setName] = useState(card?.name ?? '')
  const [company, setCompany] = useState(card?.company ?? '')
  const [phone, setPhone] = useState(card?.phone ?? '')
  const [email, setEmail] = useState(card?.email ?? '')
  const [categoryId, setCategoryId] = useState<string>(
    card?.categoryId ?? 'none',
  )
  const [notes, setNotes] = useState(card?.notes ?? '')

  // Existing image info
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    card?.imageUrl ?? null,
  )
  const [currentImagePublicId, setCurrentImagePublicId] = useState<
    string | null
  >(card?.imagePublicId ?? null)

  // Newly selected file
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    card?.imageUrl ?? null,
  )
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Status
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>()
  const [emailError, setEmailError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()

  const isBusy = isUploading || isSaving

  function handleFileSelect(file: File) {
    try {
      validateImageFile(file)
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setFormError(undefined)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid image file.'
      toast.error(message)
    }
  }

  function handleDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (isBusy) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  function handleRemoveImage() {
    setImageFile(null)
    setPreviewUrl(null)
    setCurrentImageUrl(null)
    setCurrentImagePublicId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameError(undefined)
    setEmailError(undefined)
    setFormError(undefined)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('Please enter a name for this card.')
      return
    }

    const trimmedEmail = email.trim()
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    let finalImageUrl = currentImageUrl
    let finalImagePublicId = currentImagePublicId

    // If a new image was chosen, upload to Cloudinary
    if (imageFile) {
      setIsUploading(true)
      try {
        const uploadResult = await uploadImageToCloudinary(imageFile)
        finalImageUrl = uploadResult.secureUrl
        finalImagePublicId = uploadResult.publicId
      } catch (error) {
        setIsUploading(false)
        const message =
          error instanceof Error
            ? error.message
            : 'Image upload failed. Please try again.'
        setFormError(message)
        toast.error(message)
        return
      }
      setIsUploading(false)
    }

    setIsSaving(true)

    const selectedCategoryId =
      categoryId && categoryId !== 'none' ? categoryId : null

    try {
      if (isEditing && card) {
        const result = await updateCardFn({
          data: {
            id: card.id,
            name: trimmedName,
            company: company.trim() || null,
            phone: phone.trim() || null,
            email: trimmedEmail || null,
            notes: notes.trim() || null,
            categoryId: selectedCategoryId,
            imageUrl: finalImageUrl,
            imagePublicId: finalImagePublicId,
          },
        })

        if (!result.ok) {
          setFormError(result.error)
          toast.error(result.error)
          setIsSaving(false)
          return
        }

        toast.success(`Updated card for ${result.data.name}.`)
        await router.invalidate()
        setIsSaving(false)

        if (onSuccess) {
          onSuccess(result.data)
        } else {
          void router.navigate({
            to: '/cards/$id',
            params: { id: result.data.id },
          })
        }
      } else {
        const result = await createCardFn({
          data: {
            name: trimmedName,
            company: company.trim() || null,
            phone: phone.trim() || null,
            email: trimmedEmail || null,
            notes: notes.trim() || null,
            categoryId: selectedCategoryId,
            imageUrl: finalImageUrl,
            imagePublicId: finalImagePublicId,
          },
        })

        if (!result.ok) {
          setFormError(result.error)
          toast.error(result.error)
          setIsSaving(false)
          return
        }

        toast.success(`Created card for ${result.data.name}.`)
        await router.invalidate()
        setIsSaving(false)

        if (onSuccess) {
          onSuccess(result.data)
        } else {
          void router.navigate({
            to: '/cards/$id',
            params: { id: result.data.id },
          })
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not save the card.'
      setFormError(message)
      toast.error(message)
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
      {/* Image Upload Zone */}
      <div>
        <FieldLabel htmlFor="card-image-file-input" className="mb-2 block font-medium cursor-pointer">
          Card Image
        </FieldLabel>
        <p className="mb-3 text-xs text-muted-foreground">
          Upload a photo or scan of the business card (JPEG, PNG, WebP up to 5MB).
        </p>

        {previewUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-foreground/15 bg-muted/40 shadow-xs">
            <div className="flex max-h-72 w-full items-center justify-center overflow-hidden bg-black/5 p-4 dark:bg-white/5">
              <img
                src={previewUrl}
                alt="Business card preview"
                className="max-h-64 max-w-full rounded-md object-contain shadow-xs"
              />
            </div>
            <div className="flex items-center justify-between border-t border-foreground/10 bg-card px-4 py-2.5">
              <span className="truncate text-xs text-muted-foreground">
                {imageFile ? imageFile.name : 'Saved card image'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={handleRemoveImage}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <XIcon className="mr-1 size-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <label
            htmlFor="card-image-file-input"
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-foreground/20 hover:border-foreground/40 hover:bg-muted/30'
            }`}
          >
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
              <UploadCloudIcon className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Click to select or drag and drop card image
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG, or WebP up to 5MB
            </p>
          </label>
        )}

        <input
          id="card-image-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={isBusy}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Form Fields */}
      <FieldGroup>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Name */}
          <Field data-invalid={nameError ? true : undefined} className="sm:col-span-2">
            <FieldLabel htmlFor="card-name">
              <span className="flex items-center gap-1.5">
                <UserIcon className="size-3.5 text-muted-foreground" />
                Contact Name <span className="text-primary">*</span>
              </span>
            </FieldLabel>
            <Input
              id="card-name"
              name="name"
              value={name}
              maxLength={FIELD_LIMITS.name}
              placeholder="e.g. Jane Doe"
              disabled={isBusy}
              autoFocus={!isEditing}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(undefined)
              }}
              className="bg-card"
              aria-invalid={nameError ? true : undefined}
            />
            <FieldError>{nameError}</FieldError>
          </Field>

          {/* Company */}
          <Field>
            <FieldLabel htmlFor="card-company">
              <span className="flex items-center gap-1.5">
                <BuildingIcon className="size-3.5 text-muted-foreground" />
                Company / Organization
              </span>
            </FieldLabel>
            <Input
              id="card-company"
              name="company"
              value={company}
              maxLength={FIELD_LIMITS.company}
              placeholder="e.g. Acme Corp"
              disabled={isBusy}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-card"
            />
          </Field>

          {/* Category */}
          <Field>
            <FieldLabel htmlFor="card-category">
              <span className="flex items-center gap-1.5">
                <FolderIcon className="size-3.5 text-muted-foreground" />
                Category
              </span>
            </FieldLabel>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isBusy}
            >
              <SelectTrigger id="card-category" className="w-full bg-card">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Uncategorized</span>
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor: categoryStripeColor(cat.color),
                        }}
                      />
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Phone */}
          <Field>
            <FieldLabel htmlFor="card-phone">
              <span className="flex items-center gap-1.5">
                <PhoneIcon className="size-3.5 text-muted-foreground" />
                Phone
              </span>
            </FieldLabel>
            <Input
              id="card-phone"
              name="phone"
              type="tel"
              value={phone}
              maxLength={FIELD_LIMITS.phone}
              placeholder="e.g. +1 (555) 012-3456"
              disabled={isBusy}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-card font-mono text-sm"
            />
          </Field>

          {/* Email */}
          <Field data-invalid={emailError ? true : undefined}>
            <FieldLabel htmlFor="card-email">
              <span className="flex items-center gap-1.5">
                <MailIcon className="size-3.5 text-muted-foreground" />
                Email
              </span>
            </FieldLabel>
            <Input
              id="card-email"
              name="email"
              type="email"
              value={email}
              maxLength={FIELD_LIMITS.email}
              placeholder="e.g. jane@example.com"
              disabled={isBusy}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card"
              aria-invalid={emailError ? true : undefined}
            />
            <FieldError>{emailError}</FieldError>
          </Field>

          {/* Notes */}
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="card-notes">
              Notes & Follow-up
            </FieldLabel>
            <Textarea
              id="card-notes"
              name="notes"
              value={notes}
              maxLength={FIELD_LIMITS.notes}
              rows={4}
              placeholder="Met at design conference; discussed collaboration on Q3 redesign..."
              disabled={isBusy}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-card resize-y"
            />
          </Field>
        </div>

        {formError ? <FieldError>{formError}</FieldError> : null}
      </FieldGroup>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-foreground/10 pt-6">
        <Button
          asChild
          type="button"
          variant="outline"
          disabled={isBusy}
        >
          <Link
            to={
              isEditing && card
                ? '/cards/$id'
                : CARDS_PATH
            }
            params={isEditing && card ? { id: card.id } : undefined}
          >
            Cancel
          </Link>
        </Button>
        <Button
          type="submit"
          disabled={isBusy}
          className="active:scale-[0.98]"
        >
          {isUploading ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Uploading image...
            </>
          ) : isSaving ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            'Save changes'
          ) : (
            'Create card'
          )}
        </Button>
      </div>
    </form>
  )
}
