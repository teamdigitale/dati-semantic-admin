import { NdcClient } from '../api/NdcClient'

export interface SemanticAssetChangelogEntry {
  assetIri: string
  changeKind: string
  occurredAt: string
  runId?: string
  [key: string]: unknown
}

export interface SemanticAssetChangelogPage {
  content: SemanticAssetChangelogEntry[]
  total: number
  offset: number
  limit: number
}

export const SemanticAssetsService = {
  changelog: (opts: { offset?: number; limit?: number } = {}) =>
    NdcClient.get<SemanticAssetChangelogPage>('/semantic-assets/changelog', {
      query: { offset: opts.offset, limit: opts.limit },
    }),
}
