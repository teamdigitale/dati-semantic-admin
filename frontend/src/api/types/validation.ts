export type ValidationJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string

export interface ValidationJobSubmitted {
  id: string
  owner: string
  repo: string
  revision?: string
  status: ValidationJobStatus
  createdAt: string
}

export interface RdfSyntaxValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}

export interface ValidationJobStatusDto {
  id: string
  owner: string
  repo: string
  revision?: string
  status: ValidationJobStatus
  createdAt: string
  startedAt?: string
  endedAt?: string
  result?: unknown
  error?: string
}
