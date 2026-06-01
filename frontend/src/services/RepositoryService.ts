import { NdcClient } from '../api/NdcClient'
import type {
  CreateRepositoryRequest,
  Repository,
  RepositoryInspection,
  UpdateRepositoryRequest,
} from '../api/types/repository'
import type { ValidationReport } from '../api/types/validation'

export const RepositoryService = {
  list: () => NdcClient.get<Repository[]>('/config/repository'),

  inspect: (url: string) =>
    NdcClient.get<RepositoryInspection>('/config/repository/inspect', { query: { url } }),

  create: (body: CreateRepositoryRequest) =>
    NdcClient.post<void>('/config/repository', body, { responseType: 'void' }),

  update: (id: string, body: UpdateRepositoryRequest) =>
    NdcClient.patch<void>(`/config/repository/${id}`, body, { responseType: 'void' }),

  remove: (id: string) =>
    NdcClient.delete<void>(`/config/repository/${id}`, { responseType: 'void' }),

  /**
   * Endpoint BE risponde Content-Type: application/json con la stringa JSON
   * serializzata dell'oggetto ValidationReport: lasciamo che axios la parsi.
   */
  validationReport: (id: string) =>
    NdcClient.get<ValidationReport>(`/config/repository/${id}/validation-report`),
}
