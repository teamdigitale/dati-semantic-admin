import { NdcClient } from '../api/NdcClient'
import type { HarvesterRun, JobExecutionResponse, RunningInstance } from '../api/types/harvest'

export const HarvestService = {
  startAll: (force = false) =>
    NdcClient.post<JobExecutionResponse[]>('/jobs/harvest', undefined, { query: { force } }),

  startForRepo: (repositoryId: string, force = false) =>
    NdcClient.post<JobExecutionResponse>('/jobs/harvest', undefined, {
      query: { repositoryId, force },
    }),

  listRuns: () => NdcClient.get<HarvesterRun[]>('/jobs/harvest/run'),

  listRunning: () => NdcClient.get<RunningInstance[]>('/jobs/harvest/running'),

  cancelPending: () => NdcClient.delete<void>('/jobs/harvest/run', { responseType: 'void' }),

  clearRepo: (repoUrl: string) =>
    NdcClient.post<void>('/jobs/clear', undefined, {
      query: { repo_url: repoUrl },
      responseType: 'void',
    }),
}
