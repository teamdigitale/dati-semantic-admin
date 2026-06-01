import type { HarvesterRunStatus } from './harvest'

export type ChangeKind = 'ADDED' | 'REMOVED' | 'MODIFIED'
export type SemanticAssetType = 'ONTOLOGY' | 'CONTROLLED_VOCABULARY' | 'SCHEMA'

export interface RunInfo {
  id: string
  repositoryId: string
  revision?: string
  revisionCommittedAt?: string
  startedAt: string
  endedAt?: string
  status: HarvesterRunStatus
}

/**
 * Oggetto RDF di una triple cosi' come serializzato dai classifier del BE:
 *  - {@code uri}     : risorsa IRI
 *  - {@code literal} : letterale, con opzionali {@code lang} (tag linguistico,
 *                     es. "it") o {@code datatype} (IRI del tipo XSD)
 *  - {@code bnode}   : blank node, {@code value} contiene il label locale
 */
export type RdfTerm =
  | { type: 'uri'; value: string }
  | { type: 'literal'; value: string; lang?: string; datatype?: string }
  | { type: 'bnode'; value: string }

export interface DeltaTriple {
  p: string
  o: RdfTerm
}

export interface DeltaModifiedItem {
  iri: string
  triplesAdded: DeltaTriple[]
  triplesRemoved: DeltaTriple[]
}

export interface DeltaSectionCounts {
  added: number
  removed: number
  modified: number
}

/**
 * Shape uniforme per le sezioni {@code classes} e {@code properties} del summary.
 * Per i casi {@code ADDED}/{@code REMOVED} (intero asset aggiunto/rimosso) le liste
 * sono vuote ma i {@code counts} restano popolati.
 */
export interface DeltaSection {
  added: string[]
  removed: string[]
  modified: DeltaModifiedItem[]
  counts: DeltaSectionCounts
}

export interface DeltaDeprecated {
  items: string[]
  count: number
}

export interface DeltaTripleStats {
  added: number | string
  removed: number | string
}

/**
 * Summary semantico per asset, prodotto dai classifier su {@code HarvesterFinishedEvent}.
 * Riferimento: backlog/GOV-AUDIT/collaudo/expected-outputs/*.json.
 */
export interface DeltaSummary {
  classes?: DeltaSection
  properties?: DeltaSection
  deprecated?: DeltaDeprecated
  tripleStats?: DeltaTripleStats
}

export interface ResourceDeltaItem {
  assetIri: string
  assetType: SemanticAssetType
  changeKind: ChangeKind
  summary?: DeltaSummary
  createdAt: string
  harvesterRunId: string
}

export interface ResourceDeltaPage {
  run: RunInfo
  content: ResourceDeltaItem[]
  offset: number
  limit: number
  total: number
}

export interface ResourceDeltaSummary {
  run: RunInfo
  byChangeKind: Record<ChangeKind, number>
  byAssetType: Record<SemanticAssetType, number>
  crossTab: Record<SemanticAssetType, Record<ChangeKind, number>>
}

/**
 * Voce della search NDC ({@code GET /semantic-assets/search}); shape generata
 * da OpenAPI ({@code SearchResultItem}). Qui teniamo solo i campi che servono
 * per l'autocomplete (titolo + tipo + IRI), gli altri sono opzionali.
 */
export interface SearchResultItem {
  assetIri: string
  title?: string
  description?: string
  type?: string
}

export interface SearchResult {
  totalCount: number
  offset: number
  limit: number
  data: SearchResultItem[]
}
