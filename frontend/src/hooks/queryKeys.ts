export const queryKeys = {
  me: ['me'] as const,
  repositories: ['repositories'] as const,
  repositoryValidation: (id: string) => ['repository', id, 'validation-report'] as const,
  harvestRuns: ['harvest', 'runs'] as const,
  harvestRunning: ['harvest', 'running'] as const,
  latestDelta: (repoId: string) => ['audit', repoId, 'latest-delta'] as const,
  latestDeltaSummary: (repoId: string) => ['audit', repoId, 'latest-delta', 'summary'] as const,
  dashboardCount: (filters: unknown) => ['dashboard', 'count', filters] as const,
  dashboardTime: (filters: unknown) => ['dashboard', 'time', filters] as const,
}
