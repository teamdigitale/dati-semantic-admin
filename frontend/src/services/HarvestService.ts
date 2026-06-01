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

  /**
   * Run raggruppati per correlation_id, paginati server-side sul batch.
   * Body identico a {@link listRuns}: una lista piatta di {@code HarvesterRun}.
   * Il chiamante decide la dimensione di pagina avanzando {@code offset};
   * con la convenzione N+1 ({@code limit = pageSize + 1}) puo' derivare
   * {@code hasNext} dal numero di correlation_id distinti nel risultato.
   */
  listRunsByBatch: (offset: number, limit: number) =>
    NdcClient.get<HarvesterRun[]>('/jobs/harvest/run/by-batch', {
      query: { offset, limit },
    }),

  listRunning: () => NdcClient.get<RunningInstance[]>('/jobs/harvest/running'),

  cancelPending: () => NdcClient.delete<void>('/jobs/harvest/run', { responseType: 'void' }),

  clearRepo: (repoUrl: string) =>
    NdcClient.post<void>('/jobs/clear', undefined, {
      query: { repo_url: repoUrl },
      responseType: 'void',
    }),
}
