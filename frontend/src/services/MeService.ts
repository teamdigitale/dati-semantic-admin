import { NdcClient } from '../api/NdcClient'
import type { Me } from '../api/types/me'

export const MeService = {
  current: () => NdcClient.get<Me>('/me'),
}
