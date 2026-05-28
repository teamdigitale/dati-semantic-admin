import { NdcClient } from '../api/NdcClient'
import type { ResourceDeltaPage, ResourceDeltaSummary } from '../api/types/audit'

interface DeltaQuery {
  page?: number
  size?: number
}

export const AuditService = {
  runDelta: (repositoryId: string, runId: string, q: DeltaQuery = {}) =>
    NdcClient.get<ResourceDeltaPage>(`/config/repository/${repositoryId}/runs/${runId}/delta`, {
      query: { page: q.page, size: q.size },
    }),

  latestDelta: (repositoryId: string, q: DeltaQuery = {}) =>
    NdcClient.get<ResourceDeltaPage>(`/config/repository/${repositoryId}/runs/latest/delta`, {
      query: { page: q.page, size: q.size },
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
