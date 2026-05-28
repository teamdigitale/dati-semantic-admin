import { NdcClient } from '../api/NdcClient'
import type { RepoConfig } from '../api/types/config'

export const ConfigService = {
  get: (repoId: string) => NdcClient.get<RepoConfig>(`/config/${repoId}`),

  set: (repoId: string, body: Record<string, unknown>) =>
    NdcClient.post<void>(`/config/${repoId}`, body, { responseType: 'void' }),

  /**
   * NB: il backend espone `value` come @RequestParam (query string), non body JSON.
   * Endpoint: PUT /config/{repoId}/{configKey}?value=...
   */
  updateKey: (repoId: string, key: string, value: string) =>
    NdcClient.put<void>(`/config/${repoId}/${encodeURIComponent(key)}`, undefined, {
      query: { value },
      responseType: 'void',
    }),

  deleteKey: (repoId: string, key: string) =>
    NdcClient.delete<void>(`/config/${repoId}/${encodeURIComponent(key)}`, {
      responseType: 'void',
    }),
}
