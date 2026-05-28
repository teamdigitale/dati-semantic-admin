import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RepositoryService } from '../services/RepositoryService'
import { queryKeys } from './queryKeys'
import type { CreateRepositoryRequest, UpdateRepositoryRequest } from '../api/types/repository'

export function useRepositories() {
  return useQuery({
    queryKey: queryKeys.repositories,
    queryFn: RepositoryService.list,
  })
}

export function useCreateRepository() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateRepositoryRequest) => RepositoryService.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.repositories }),
  })
}

export function useUpdateRepository() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRepositoryRequest }) =>
      RepositoryService.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.repositories }),
  })
}

export function useDeleteRepository() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => RepositoryService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.repositories }),
  })
}
