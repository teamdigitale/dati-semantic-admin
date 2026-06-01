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

/**
 * Risposta del BE per /dashboard/aggregated-count-data e /dashboard/aggregated-time-data.
 * Vedi BE: AggregateDashboardResponse (List<String> headers, List<List<Object>> rows).
 * Ogni riga ha lunghezza pari a headers.length; il tipo dei singoli valori varia per colonna
 * (string per dimensioni e date, number per i conteggi).
 *
 * NB: per dimension=STATUS le colonne sono ["DATE","STATUS","VAUE"]; "VAUE" e' un typo nel BE
 * (DashboardService.java:254). Lo gestiamo come stringa opaca.
 */
export interface AggregateDashboardResponse {
  headers: string[]
  rows: Array<Array<string | number | boolean | null>>
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
