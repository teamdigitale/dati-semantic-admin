export type HarvesterRunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILURE'
  | 'CANCELLED'
  | string

export interface HarvesterRun {
  id: string
  repositoryId: string
  repositoryUrl?: string
  revision?: string
  startedAt: string
  endedAt?: string
  status: HarvesterRunStatus
  validationReport?: string
}

export interface RunningInstance {
  runId: string
  repositoryId: string
  startedAt: string
}

export interface JobExecutionResponse {
  jobId?: string
  repositoryUrl?: string
  status?: string
  message?: string
}
