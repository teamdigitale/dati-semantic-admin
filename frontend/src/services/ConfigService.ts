import { NdcClient } from '../api/NdcClient'
import type { RepoConfig } from '../api/types/config'

export const ConfigService = {
  get: (repoId: string) => NdcClient.get<RepoConfig>(`/config/${repoId}`),

  set: (repoId: string, body: Record<string, unknown>) =>
    NdcClient.post<void>(`/config/${repoId}`, body, { responseType: 'void' }),

  updateKey: (repoId: string, key: string, value: unknown) =>
    NdcClient.put<void>(`/config/${repoId}/${encodeURIComponent(key)}`, { value }, {
      responseType: 'void',
    }),

  deleteKey: (repoId: string, key: string) =>
    NdcClient.delete<void>(`/config/${repoId}/${encodeURIComponent(key)}`, {
      responseType: 'void',
    }),
}
