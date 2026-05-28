import { useQuery } from '@tanstack/react-query'
import { DashboardService } from '../services/DashboardService'
import { queryKeys } from './queryKeys'
import type {
  CountDataDimension,
  DashboardFilters,
  TimeDataDimension,
} from '../api/types/dashboard'

export function useDashboardCount(
  params: { dimension?: CountDataDimension[] } & DashboardFilters = {}
) {
  return useQuery({
    queryKey: queryKeys.dashboardCount(params),
    queryFn: () => DashboardService.aggregatedCount(params),
  })
}

export function useDashboardTime(
  params: { dimension?: TimeDataDimension[] } & DashboardFilters = {}
) {
  return useQuery({
    queryKey: queryKeys.dashboardTime(params),
    queryFn: () => DashboardService.aggregatedTime(params),
  })
}
