export type AutofillStage = 'upload' | 'ocr' | 'categories' | 'extraction'

export type AutofillFailure = {
  stage: AutofillStage
  status: number
  message: string
  reason: string
  upstreamStatus?: number
}

export type ImageUploadStage =
  | 'input'
  | 'configuration'
  | 'provider'
  | 'database'
