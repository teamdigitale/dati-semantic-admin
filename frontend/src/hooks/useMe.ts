import { useQuery } from '@tanstack/react-query'
import { MeService } from '../services/MeService'
import { queryKeys } from './queryKeys'

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: MeService.current,
    staleTime: 5 * 60_000,
  })
}
