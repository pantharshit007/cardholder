export type CardImageUpload = {
  id: string
  imageUrl: string
  imagePublicId: string
}

export type CardImageUploadResult = {
  secureUrl: string
  uploadId: string
  width?: number
  height?: number
  format?: string
}
