import { useQuery } from '@tanstack/react-query'
import { ValidationService } from '../services/ValidationService'
import { queryKeys } from './queryKeys'
import type { ValidationJobStatus, ValidationJobStatusDto } from '../api/types/validation'

const TERMINAL: ReadonlySet<ValidationJobStatus> = new Set(['COMPLETED', 'FAILED'])

export function isTerminal(status: ValidationJobStatus | undefined): boolean {
  return !!status && TERMINAL.has(status)
}

/**
 * Polling automatico dello stato di un job di validazione on-demand.
 * - 2s di intervallo finche' il job e' in PENDING/RUNNING
 * - si ferma da solo al primo COMPLETED/FAILED/CANCELLED
 * - disabilitato finche' validationId e' null
 */
export function useValidationJobPolling(validationId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.validationJob(validationId ?? '_'),
    queryFn: () => ValidationService.jobStatus(validationId!),
    enabled: !!validationId,
    refetchInterval: (query) => {
      const data = query.state.data as ValidationJobStatusDto | undefined
      if (!data) return 2_000
      return isTerminal(data.status) ? false : 2_000
    },
    refetchOnWindowFocus: false,
  })
}
