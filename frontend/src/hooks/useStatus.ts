import { useQuery } from '@tanstack/react-query'
import { StatusService } from '../services/StatusService'
import { queryKeys } from './queryKeys'

export function useStatus(refetchMs = 30_000) {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: StatusService.get,
    refetchInterval: refetchMs,
    retry: false, // se BE down, vogliamo vederlo subito non riprovare
  })
}
