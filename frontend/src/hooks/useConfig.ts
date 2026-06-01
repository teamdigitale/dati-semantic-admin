import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfigService } from '../services/ConfigService'
import { queryKeys } from './queryKeys'

export function useConfigMetadata() {
  return useQuery({
    queryKey: queryKeys.configMetadata,
    queryFn: ConfigService.metadata,
    // I metadata sono dati statici per la durata del runtime BE: niente refetch
    // automatico su window focus / mount.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export function useRepoConfig(repoId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.repositoryConfig(repoId ?? '_'),
    queryFn: () => ConfigService.get(repoId!),
    enabled: !!repoId,
  })
}

export function useUpdateConfigKey(repoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      ConfigService.updateKey(repoId, key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.repositoryConfig(repoId) }),
  })
}

export function useDeleteConfigKey(repoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => ConfigService.deleteKey(repoId, key),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.repositoryConfig(repoId) }),
  })
}
