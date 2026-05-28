/**
 * Wrapper di fetch verso il BFF locale (/bff/api/**).
 * Le credenziali (cookie JSESSIONID) viaggiano automatic same-origin.
 */

export interface Me {
  username: string
  name: string
  email: string
  scopes: string[]
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/bff/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  me: () => request<Me>('/me'),

  // Repository
  listRepositories: () => request<unknown[]>('/config/repository'),
  createRepository: (body: unknown) =>
    request<void>('/config/repository', { method: 'POST', body: JSON.stringify(body) }),
  deleteRepository: (id: string) =>
    request<void>(`/config/repository/${id}`, { method: 'DELETE' }),

  // Harvest
  startHarvest: () => request<unknown>('/jobs/harvest', { method: 'POST' }),
  startHarvestForRepo: (repositoryId: string) =>
    request<unknown>(`/jobs/harvest?repositoryId=${encodeURIComponent(repositoryId)}`, {
      method: 'POST',
    }),
  listRuns: () => request<unknown[]>('/jobs/harvest/run'),
  listRunning: () => request<unknown[]>('/jobs/harvest/running'),

  // Audit
  latestDelta: (repoId: string) =>
    request<unknown>(`/config/repository/${repoId}/runs/latest/delta`),

  // Validation
  validateRepo: (owner: string, repo: string) =>
    request<unknown>(`/validate/repo/${owner}/${repo}`, { method: 'POST' }),
}
