export type HarvesterRunStatus =
  | 'SUCCESS'
  | 'UNCHANGED'
  | 'ALREADY_RUNNING'
  | 'RUNNING'
  | 'NDC_ISSUES_PRESENT'
  | 'FAILURE'

export interface HarvesterRun {
  id: string
  correlationId?: string
  repositoryId: string
  repositoryUrl?: string
  instance?: string
  startedAt: string
  startedBy?: string
  endedAt?: string
  revision?: string
  revisionCommittedAt?: string
  status: HarvesterRunStatus
  reason?: string
  validationReport?: string
}

export interface RunningInstance {
  threadName: string
  harvesterRun: HarvesterRun
}

export interface JobExecutionResponse {
  runId: string
  correlationId?: string
  repositoryId: string
  repositoryUrl?: string
  startedAt?: string
  forced: boolean
}
