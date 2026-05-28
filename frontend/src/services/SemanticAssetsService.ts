import { NdcClient } from '../api/NdcClient'
import type { ChangeKind, SemanticAssetType } from '../api/types/audit'

/**
 * Una voce del changelog: un cambio applicato all'asset (identificato dall'IRI a livello pagina)
 * in uno specifico harvest run di uno specifico repository.
 */
export interface SemanticAssetChangelogEntry {
  runId: string
  repositoryId: string
  revision?: string
  revisionCommittedAt?: string
  createdAt: string
  changeKind: ChangeKind
  summary?: unknown
}

export interface SemanticAssetChangelogPage {
  assetIri: string
  assetType?: SemanticAssetType
  content: SemanticAssetChangelogEntry[]
  offset: number
  limit: number
  total: number
}

interface ChangelogQuery {
  iri: string
  changeKind?: ChangeKind[]
  since?: string
  until?: string
  offset?: number
  limit?: number
}

export const SemanticAssetsService = {
  /**
   * Time-series dei cambi per uno specifico asset semantico (cross-repo), ordinati per createdAt DESC.
   * NB: il backend richiede `iri` come query param obbligatorio.
   */
  changelog: (q: ChangelogQuery) =>
    NdcClient.get<SemanticAssetChangelogPage>('/semantic-assets/changelog', {
      query: {
        iri: q.iri,
        changeKind: q.changeKind,
        since: q.since,
        until: q.until,
        offset: q.offset,
        limit: q.limit,
      },
    }),
}
