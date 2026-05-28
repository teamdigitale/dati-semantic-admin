import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HarvestService } from '../services/HarvestService'
import { queryKeys } from './queryKeys'

export function useHarvestRuns() {
  return useQuery({
    queryKey: queryKeys.harvestRuns,
    queryFn: HarvestService.listRuns,
  })
}

export function useRunningInstances(refetchMs = 5_000) {
  return useQuery({
    queryKey: queryKeys.harvestRunning,
    queryFn: HarvestService.listRunning,
    refetchInterval: refetchMs,
  })
}

export function useStartHarvestAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (force?: boolean) => HarvestService.startAll(force ?? false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.harvestRuns })
      qc.invalidateQueries({ queryKey: queryKeys.harvestRunning })
    },
  })
}

export function useStartHarvestRepo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ repositoryId, force }: { repositoryId: string; force?: boolean }) =>
      HarvestService.startForRepo(repositoryId, force ?? false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.harvestRuns })
      qc.invalidateQueries({ queryKey: queryKeys.harvestRunning })
    },
  })
}

export function useCancelPendingHarvests() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: HarvestService.cancelPending,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.harvestRuns })
      qc.invalidateQueries({ queryKey: queryKeys.harvestRunning })
    },
  })
}

export function useClearRepoCache() {
  return useMutation({
    mutationFn: (repoUrl: string) => HarvestService.clearRepo(repoUrl),
  })
}
