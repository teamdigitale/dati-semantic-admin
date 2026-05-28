import { NdcClient } from '../api/NdcClient'
import type {
  RdfSyntaxValidationResult,
  ValidationJobStatusDto,
  ValidationJobSubmitted,
} from '../api/types/validation'

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[2]) : undefined
}

export const ValidationService = {
  submitRepo: (owner: string, repo: string, revision?: string) => {
    const path = revision
      ? `/validate/repo/${owner}/${repo}/${revision}`
      : `/validate/repo/${owner}/${repo}`
    return NdcClient.post<ValidationJobSubmitted>(path)
  },

  jobStatus: (validationId: string) =>
    NdcClient.get<ValidationJobStatusDto>(`/validate/repo/${validationId}`),

  syntax: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const csrfToken = readCookie('XSRF-TOKEN')
    return fetch('/bff/api/validate/syntax', {
      method: 'POST',
      credentials: 'include',
      headers: csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {},
      body: fd,
    }).then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as RdfSyntaxValidationResult
    })
  },
}
