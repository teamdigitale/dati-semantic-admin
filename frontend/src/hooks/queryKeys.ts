export const queryKeys = {
  me: ['me'] as const,
  status: ['status'] as const,
  repositories: ['repositories'] as const,
  repositoryValidation: (id: string) => ['repository', id, 'validation-report'] as const,
  repositoryValidationReport: (id: string) => ['repository', id, 'last-validation-report'] as const,
  repositoryConfig: (id: string) => ['repository', id, 'config'] as const,
  configMetadata: ['config', 'metadata'] as const,
  harvestRuns: ['harvest', 'runs'] as const,
  harvestRunsByBatch: (offset: number, limit: number) =>
    ['harvest', 'runs', 'by-batch', offset, limit] as const,
  validationJob: (id: string) => ['validation-job', id] as const,
  harvestRunning: ['harvest', 'running'] as const,
  latestDelta: (repoId: string) => ['audit', repoId, 'latest-delta'] as const,
  latestDeltaSummary: (repoId: string) => ['audit', repoId, 'latest-delta', 'summary'] as const,
  changelog: (iri: string, offset: number, limit: number) =>
    ['audit', 'changelog', iri, offset, limit] as const,
  semanticAssetsSearch: (q: string, limit: number) =>
    ['semantic-assets', 'search', q, limit] as const,
  dashboardCount: (filters: unknown) => ['dashboard', 'count', filters] as const,
  dashboardTime: (filters: unknown) => ['dashboard', 'time', filters] as const,
}
