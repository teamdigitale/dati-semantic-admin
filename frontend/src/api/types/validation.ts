/**
 * Stati del job di validazione on-demand, mirror dell'enum BE
 * {@code ValidationJob.Status}.
 *  - PENDING: in coda
 *  - CLONING: sta clonando il repo da GitHub
 *  - DISCOVERING: scopre gli asset nel repo
 *  - VALIDATING: validazione in corso
 *  - COMPLETED: terminato con report
 *  - FAILED: terminato con errore
 * Gli stati terminali (COMPLETED, FAILED) interrompono il polling.
 */
export type ValidationJobStatus =
  | 'PENDING'
  | 'CLONING'
  | 'DISCOVERING'
  | 'VALIDATING'
  | 'COMPLETED'
  | 'FAILED'

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

/**
 * Mirror lato FE del report harvester serializzato dal BE
 * (it.gov.innovazione.ndc.harvester.model.validation.ValidationReport).
 */
export type ValidationIssueSeverity = 'BLOCKING' | 'WARNING' | 'IMPROVEMENT'

export interface ValidationIssue {
  code?: string
  severity?: ValidationIssueSeverity
  message?: string
  name?: string
  category?: string
  result?: string
  details?: string
  field?: string
  line?: number | null
  col?: number | null
}

export interface AssetValidationReport {
  assetPath: string
  assetType?: string
  issues: ValidationIssue[]
  skipped?: boolean
}

export interface ValidationReportSummary {
  blocking: number
  warning: number
  improvement: number
  totalAssets: number
  assetsWithIssues: number
}

export interface ValidationReport {
  /**
   * NB: il BE serializza l'Instant come epoch-seconds decimale
   * (es. 1780323042.4785028) perche' l'ObjectMapper di HarvesterService non
   * disabilita WRITE_DATES_AS_TIMESTAMPS. Lato FE gestiamo il parsing in modo
   * difensivo accettando sia number sia ISO string.
   */
  generatedAt?: number | string
  repositoryUrl?: string
  revision?: string
  repositoryChecks: ValidationIssue[]
  assetChecks: AssetValidationReport[]
  /** Calcolato dal getter Java getSummary(); ricalcoliamo lato FE se assente. */
  summary?: ValidationReportSummary
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
