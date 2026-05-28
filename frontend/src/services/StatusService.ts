import { NdcClient } from '../api/NdcClient'

export interface ApplicationStatus {
  status?: string
  [key: string]: unknown
}

export const StatusService = {
  get: () => NdcClient.get<ApplicationStatus>('/status'),
}
