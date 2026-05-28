import { NdcClient } from '../api/NdcClient'
import type {
  RdfSyntaxValidationResult,
  ValidationJobStatusDto,
  ValidationJobSubmitted,
} from '../api/types/validation'

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
    return fetch('/bff/api/validate/syntax', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    }).then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as RdfSyntaxValidationResult
    })
  },
}
