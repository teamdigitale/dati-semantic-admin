import { NdcClient } from '../api/NdcClient'
import type { ChangeKind, DeltaSummary, SearchResult, SemanticAssetType } from '../api/types/audit'

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
  summary?: DeltaSummary
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

interface SearchQuery {
  q: string
  limit?: number
  offset?: number
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

  /**
   * Ricerca full-text NDC ({@code GET /semantic-assets}, operationId {@code search}).
   * Usata qui per l'autocomplete sull'IRI nella AuditPage: l'utente cerca per
   * titolo / parole chiave, il datalist propone {@code title — type} e committa
   * l'{@code assetIri}.
   */
  search: (q: SearchQuery) =>
    NdcClient.get<SearchResult>('/semantic-assets', {
      query: { q: q.q, limit: q.limit, offset: q.offset },
    }),
}
