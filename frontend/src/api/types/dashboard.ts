export type Granularity = 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'

export type CountDataDimension =
  | 'STATUS'
  | 'RESOURCE_TYPE'
  | 'RIGHT_HOLDER'
  | 'REPOSITORY_URL'
  | 'HAS_ERRORS'
  | 'HAS_WARNINGS'
  | string

export type TimeDataDimension = 'REPOSITORY_URL' | string

export interface AggregateDashboardResponse {
  bucketLabels: string[]
  series: Array<{
    name: string
    values: number[]
  }>
}

export interface SemanticContentStatRow {
  date: string
  repositoryUrl: string
  rightHolder?: string
  resourceType?: string
  status?: string
  hasErrors?: boolean
  hasWarnings?: boolean
  count?: number
}

export interface DashboardFilters {
  date?: string
  startDate?: string
  endDate?: string
  granularity?: Granularity
  status?: string[]
  resourceType?: string[]
  rightHolder?: string[]
  repositoryUrl?: string[]
  hasErrors?: string[]
  hasWarnings?: string[]
}
