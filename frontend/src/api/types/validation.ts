export type ValidationJobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export interface ValidationJobSubmitted {
  validationId: string
  status: ValidationJobStatus
  repoUrl?: string
  revision?: string
  submittedAt: string
}

export interface ValidationProgress {
  step?: string
  percentage?: number
  message?: string
}

export interface ValidationReport {
  // forma effettiva del report harvester (campi opzionali, dettagliati lato BE)
  [key: string]: unknown
}

export interface ValidationJobStatusDto {
  validationId: string
  status: ValidationJobStatus
  owner?: string
  repo?: string
  revision?: string
  repoUrl?: string
  submittedAt: string
  completedAt?: string
  progress?: ValidationProgress
  report?: ValidationReport
  errorMessage?: string
}

export interface RdfSyntaxValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}
