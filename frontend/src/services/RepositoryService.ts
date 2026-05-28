import { NdcClient } from '../api/NdcClient'
import type {
  CreateRepositoryRequest,
  Repository,
  UpdateRepositoryRequest,
} from '../api/types/repository'

export const RepositoryService = {
  list: () => NdcClient.get<Repository[]>('/config/repository'),

  create: (body: CreateRepositoryRequest) =>
    NdcClient.post<void>('/config/repository', body, { responseType: 'void' }),

  update: (id: string, body: UpdateRepositoryRequest) =>
    NdcClient.patch<void>(`/config/repository/${id}`, body, { responseType: 'void' }),

  remove: (id: string) =>
    NdcClient.delete<void>(`/config/repository/${id}`, { responseType: 'void' }),

  validationReport: (id: string) =>
    NdcClient.get<string>(`/config/repository/${id}/validation-report`, { responseType: 'text' }),
}
