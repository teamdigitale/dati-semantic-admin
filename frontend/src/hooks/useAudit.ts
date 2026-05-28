import { useQuery } from '@tanstack/react-query'
import { AuditService } from '../services/AuditService'
import { SemanticAssetsService } from '../services/SemanticAssetsService'
import { queryKeys } from './queryKeys'

export function useLatestDelta(
  repositoryId: string | undefined,
  opts: { offset?: number; limit?: number } = {}
) {
  return useQuery({
    queryKey: [...queryKeys.latestDelta(repositoryId ?? '_'), opts.offset, opts.limit],
    queryFn: () =>
      AuditService.latestDelta(repositoryId!, { offset: opts.offset, limit: opts.limit }),
    enabled: !!repositoryId,
  })
}

export function useLatestDeltaSummary(repositoryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.latestDeltaSummary(repositoryId ?? '_'),
    queryFn: () => AuditService.latestDeltaSummary(repositoryId!),
    enabled: !!repositoryId,
  })
}

export function useChangelog(iri: string | undefined, offset = 0, limit = 20) {
  return useQuery({
    queryKey: queryKeys.changelog(iri ?? '', offset, limit),
    queryFn: () => SemanticAssetsService.changelog({ iri: iri!, offset, limit }),
    enabled: !!iri,
  })
}
