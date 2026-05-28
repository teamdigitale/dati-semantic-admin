/**
 * Layer piu basso: fetch wrapper verso il BFF locale (/bff/api/**).
 * Sa solo fare HTTP: non conosce i domini applicativi (Repository, Harvest, ...).
 * Sui 401 redirige al login OAuth2.
 */

export class NdcError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message)
    this.name = 'NdcError'
  }
}

type QueryValue = string | number | boolean | string[] | undefined
type QueryParams = Record<string, QueryValue>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: QueryParams | Record<string, unknown>
  headers?: Record<string, string>
  responseType?: 'json' | 'text' | 'void'
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) v.forEach((item) => params.append(k, String(item)))
    else params.append(k, String(v))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[2]) : undefined
}

function isCsrfMethod(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && method !== 'TRACE'
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? 'GET'
  const url = `/bff/api${path}${buildQuery(opts.query)}`

  const csrfToken = isCsrfMethod(method) ? readCookie('XSRF-TOKEN') : undefined

  const init: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
      ...(opts.headers ?? {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  }

  const res = await fetch(url, init)

  if (res.status === 401) {
    // Sessione scaduta / non autenticato: ricomincia il flow OAuth2.
    window.location.href = '/oauth2/authorization/keycloak'
    // Lancia comunque per fermare il chiamante.
    throw new NdcError('Unauthorized', 401)
  }

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = await res.text().catch(() => undefined)
    }
    throw new NdcError(`HTTP ${res.status} ${res.statusText}`, res.status, body)
  }

  switch (opts.responseType) {
    case 'text':
      return (await res.text()) as T
    case 'void':
      return undefined as T
    default:
      if (res.status === 204) return undefined as T
      return (await res.json()) as T
  }
}

export const NdcClient = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),

  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),

  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
}
