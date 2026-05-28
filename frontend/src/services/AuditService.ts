import { NdcClient } from '../api/NdcClient'
import type { ResourceDeltaPage, ResourceDeltaSummary } from '../api/types/audit'

interface DeltaQuery {
  offset?: number
  limit?: number
}

export const AuditService = {
  runDelta: (repositoryId: string, runId: string, q: DeltaQuery = {}) =>
    NdcClient.get<ResourceDeltaPage>(`/config/repository/${repositoryId}/runs/${runId}/delta`, {
      query: { offset: q.offset, limit: q.limit },
    }),

  latestDelta: (repositoryId: string, q: DeltaQuery = {}) =>
    NdcClient.get<ResourceDeltaPage>(`/config/repository/${repositoryId}/runs/latest/delta`, {
      query: { offset: q.offset, limit: q.limit },
    }),

  runDeltaSummary: (repositoryId: string, runId: string) =>
    NdcClient.get<ResourceDeltaSummary>(
      `/config/repository/${repositoryId}/runs/${runId}/delta/summary`
    ),

  latestDeltaSummary: (repositoryId: string) =>
    NdcClient.get<ResourceDeltaSummary>(
      `/config/repository/${repositoryId}/runs/latest/delta/summary`
    ),
}
