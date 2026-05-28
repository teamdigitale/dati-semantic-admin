import { NdcClient } from '../api/NdcClient'
import type {
  AggregateDashboardResponse,
  CountDataDimension,
  DashboardFilters,
  TimeDataDimension,
} from '../api/types/dashboard'

export const DashboardService = {
  aggregatedCount: (params: { dimension?: CountDataDimension[] } & DashboardFilters) =>
    NdcClient.get<AggregateDashboardResponse>('/dashboard/aggregated-count-data', {
      query: { ...params } as Record<string, unknown>,
    }),

  aggregatedTime: (params: { dimension?: TimeDataDimension[] } & DashboardFilters) =>
    NdcClient.get<AggregateDashboardResponse>('/dashboard/aggregated-time-data', {
      query: { ...params } as Record<string, unknown>,
    }),

  rawData: (filters: DashboardFilters & { page?: number; size?: number }) =>
    NdcClient.get<unknown>('/dashboard/raw-data', {
      query: { ...filters } as Record<string, unknown>,
    }),
}
