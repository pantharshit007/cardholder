'use client'

import { Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  BuildingIcon,
  FolderIcon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
  ScanTextIcon,
  UploadCloudIcon,
  UserIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { CardAutofillSuggestions } from '@/components/card-autofill-suggestions'
import { autofillValue } from '@/utils/autofill-value'
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
import {
  ALLOWED_IMAGE_MIME_TYPES,
  CARDS_PATH,
  FIELD_LIMITS,
  MAX_IMAGE_SIZE_MEBIBYTES,
} from '@/constants'
import { createCard, discardCardUpload, updateCard } from '@/server/cards'
import {
  uploadImageToCloudinary,
  validateImageFile,
} from '@/services/cloudinary'
import type { MutationResult } from '@/types/api'
import type { CardRecord } from '@/types/card'
import type { CategoryListItem } from '@/types/category'
import { autofillCardFromImage } from '@/services/card-autofill'
import type { ExtractedCard } from '@/types/ocr'
import { categoryStripeColor } from '@/utils/category-color'

/** Create or edit a card with optional, reviewable image-based suggestions. */
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
  const discardCardUploadFn = useServerFn(discardCardUpload)

  const isEditing = Boolean(card)

  const [name, setName] = useState(card?.name ?? '')
  const [company, setCompany] = useState(card?.company ?? '')
  const [phone, setPhone] = useState(card?.phone ?? '')
  const [email, setEmail] = useState(card?.email ?? '')
  const [categoryId, setCategoryId] = useState<string>(
    card?.categoryId ?? 'none',
  )
  const [notes, setNotes] = useState(card?.notes ?? '')

  // Newly selected file
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    card?.imageUrl ?? null,
  )
  const [isDragging, setIsDragging] = useState(false)
  const [removeImage, setRemoveImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewObjectUrlRef = useRef<string | null>(null)

  const scanRef = useRef<AbortController | null>(null)
  const editedFieldsRef = useRef(new Set<keyof ExtractedCard>())
  const [isScanning, setIsScanning] = useState(false)
  const [suggestions, setSuggestions] = useState<ExtractedCard | null>(null)

  /** Prevent a pending response from changing a replaced or submitted form. */
  function cancelScan() {
    scanRef.current?.abort()
    scanRef.current = null
    setIsScanning(false)
  }

  /** Cache the latest successful scan and apply suggestions only to untouched empty fields. */
  async function handleAutofill() {
    if (!imageFile || isBusy || scanRef.current) return
    const controller = new AbortController()
    scanRef.current = controller
    setIsScanning(true)
    try {
      const fields = await autofillCardFromImage(imageFile, controller.signal)
      if (controller.signal.aborted) return
      setSuggestions(fields)
      applySuggestions(fields)
      if (Object.values(fields).some(Boolean)) {
        toast.success('Scan complete. Review the details before saving.')
      } else {
        toast.info(
          'No contact details found. Try a clearer photo or enter them manually.',
        )
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Could not scan this card. Try again or enter the details manually.',
        )
      }
    } finally {
      if (scanRef.current === controller) {
        scanRef.current = null
        setIsScanning(false)
      }
    }
  }

  /** Apply cached data automatically or after an explicit per-field/all-fields choice. */
  function applySuggestions(
    fields: ExtractedCard,
    explicit = false,
    selected?: keyof ExtractedCard,
  ) {
    const edited = new Set(editedFieldsRef.current)
    const apply = (field: keyof ExtractedCard, current: string) => {
      if (selected && selected !== field) return current
      if (
        field === 'categoryId' &&
        !categories.some((category) => category.id === fields.categoryId)
      )
        return current
      return autofillValue(
        field,
        current,
        fields[field],
        edited.has(field),
        explicit,
      )
    }
    setName((current) => apply('name', current))
    setPhone((current) => apply('phone', current))
    setEmail((current) => apply('email', current))
    setCompany((current) => apply('company', current))
    setCategoryId((current) => apply('categoryId', current))
    if (
      (!selected || selected === 'name') &&
      fields.name &&
      (explicit || (!name.trim() && !edited.has('name')))
    )
      setNameError(undefined)
    if (
      (!selected || selected === 'email') &&
      fields.email &&
      (explicit || (!email.trim() && !edited.has('email')))
    )
      setEmailError(undefined)
  }

  // Status
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>()
  const [emailError, setEmailError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()

  const isBusy = isUploading || isSaving

  useEffect(
    () => () => {
      scanRef.current?.abort()
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
      }
    },
    [],
  )

  /** Release the previous local image preview. */
  function revokePreviewObjectUrl() {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
  }

  /** Validate and preview a replacement image, discarding stale scan suggestions. */
  function handleFileSelect(file: File) {
    try {
      validateImageFile(file)
      cancelScan()
      setSuggestions(null)
      revokePreviewObjectUrl()
      const objectUrl = URL.createObjectURL(file)
      previewObjectUrlRef.current = objectUrl
      setImageFile(file)
      setPreviewUrl(objectUrl)
      setRemoveImage(false)
      setFormError(undefined)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid image file.'
      toast.error(message)
    }
  }

  /** Accept the first dropped image when the form is editable. */
  function handleDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (isBusy) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  /** Clear the preview and suggestions and mark a saved image for removal. */
  function handleRemoveImage() {
    cancelScan()
    setSuggestions(null)
    revokePreviewObjectUrl()
    setImageFile(null)
    setPreviewUrl(null)
    setRemoveImage(Boolean(card?.imageUrl))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /** Validate manual data, upload the original image, and save the card. */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isBusy) return
    cancelScan()
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

    let imageUploadId: string | null = null

    // If a new image was chosen, upload to Cloudinary
    if (imageFile) {
      setIsUploading(true)
      try {
        const uploadResult = await uploadImageToCloudinary(imageFile)
        imageUploadId = uploadResult.uploadId
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

    let result: MutationResult<CardRecord>
    try {
      result =
        isEditing && card
          ? await updateCardFn({
              data: {
                id: card.id,
                name: trimmedName,
                company: company.trim() || null,
                phone: phone.trim() || null,
                email: trimmedEmail || null,
                notes: notes.trim() || null,
                categoryId: selectedCategoryId,
                imageUploadId,
                removeImage,
              },
            })
          : await createCardFn({
              data: {
                name: trimmedName,
                company: company.trim() || null,
                phone: phone.trim() || null,
                email: trimmedEmail || null,
                notes: notes.trim() || null,
                categoryId: selectedCategoryId,
                imageUploadId,
              },
            })
    } catch (error) {
      if (imageUploadId) {
        await discardUnusedUpload(imageUploadId)
      }
      const message =
        error instanceof Error ? error.message : 'Could not save the card.'
      setFormError(message)
      toast.error(message)
      setIsSaving(false)
      return
    }

    if (!result.ok) {
      if (imageUploadId) {
        await discardUnusedUpload(imageUploadId)
      }
      setFormError(result.error)
      toast.error(result.error)
      setIsSaving(false)
      return
    }

    setSuggestions(null)
    toast.success(
      `${isEditing ? 'Updated' : 'Created'} card for ${result.data.name}.`,
    )

    try {
      await router.invalidate()
    } catch {
      toast.warning('The card was saved, but the page could not be refreshed.')
    }

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

  /** Clean up an uploaded image if saving its card fails. */
  async function discardUnusedUpload(imageUploadId: string) {
    try {
      await discardCardUploadFn({ data: { id: imageUploadId } })
    } catch (error) {
      console.warn('Failed to discard unused image upload:', error)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
      {/* Image Upload Zone */}
      <div>
        <FieldLabel
          htmlFor="card-image-file-input"
          className="mb-2 block font-medium cursor-pointer"
        >
          Card Image
        </FieldLabel>
        <p className="mb-3 text-xs text-muted-foreground">
          Upload a photo or scan of the business card (JPEG, PNG, WebP up to{' '}
          {MAX_IMAGE_SIZE_MEBIBYTES}MB).
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
              JPEG, PNG, or WebP up to {MAX_IMAGE_SIZE_MEBIBYTES}MB
            </p>
          </label>
        )}

        {imageFile ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy || isScanning}
              onClick={() => void handleAutofill()}
            >
              {isScanning ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ScanTextIcon className="size-4" />
              )}
              {isScanning ? 'Reading card…' : 'Auto-fill details'}
            </Button>
            <p role="status" className="text-xs text-muted-foreground">
              {isScanning
                ? 'Reading your image. You can keep typing.'
                : 'Fills empty fields only. Review before saving.'}
            </p>
          </div>
        ) : null}

        {suggestions ? (
          <CardAutofillSuggestions
            suggestions={suggestions}
            current={{
              name,
              phone,
              email,
              company,
              categoryId: categoryId === 'none' ? null : categoryId,
            }}
            categories={categories}
            disabled={isBusy || isScanning}
            onApply={(field) => applySuggestions(suggestions, true, field)}
          />
        ) : null}

        <input
          id="card-image-file-input"
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_MIME_TYPES.join(',')}
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
          <Field
            data-invalid={nameError ? true : undefined}
            className="sm:col-span-2"
          >
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
                editedFieldsRef.current.add('name')
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
              onChange={(e) => {
                editedFieldsRef.current.add('company')
                setCompany(e.target.value)
              }}
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
              onValueChange={(value) => {
                editedFieldsRef.current.add('categoryId')
                setCategoryId(value)
              }}
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
              onChange={(e) => {
                editedFieldsRef.current.add('phone')
                setPhone(e.target.value)
              }}
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
              onChange={(e) => {
                editedFieldsRef.current.add('email')
                setEmail(e.target.value)
                setEmailError(undefined)
              }}
              className="bg-card"
              aria-invalid={emailError ? true : undefined}
            />
            <FieldError>{emailError}</FieldError>
          </Field>

          {/* Notes */}
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="card-notes">Notes & Follow-up</FieldLabel>
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
        {isBusy ? (
          <Button type="button" variant="outline" disabled>
            Cancel
          </Button>
        ) : (
          <Button asChild type="button" variant="outline">
            <Link
              to={isEditing && card ? '/cards/$id' : CARDS_PATH}
              params={isEditing && card ? { id: card.id } : undefined}
            >
              Cancel
            </Link>
          </Button>
        )}
        <Button type="submit" disabled={isBusy} className="active:scale-[0.98]">
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
