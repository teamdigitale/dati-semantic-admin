export type ChangeKind = 'ADDED' | 'REMOVED' | 'MODIFIED' | string
export type SemanticAssetType = 'ONTOLOGY' | 'CONTROLLED_VOCABULARY' | 'SCHEMA' | string

export interface ResourceDeltaEntry {
  iri: string
  changeKind: ChangeKind
  assetType: SemanticAssetType
  rightHolder?: string
  title?: string
}

export interface ResourceDeltaPage {
  runId: string
  startedAt: string
  endedAt?: string
  page: number
  size: number
  totalElements: number
  totalPages: number
  content: ResourceDeltaEntry[]
}

export interface ResourceDeltaSummary {
  runId: string
  startedAt: string
  endedAt?: string
  crossTab: Record<SemanticAssetType, Record<ChangeKind, number>>
  byChangeKind: Record<ChangeKind, number>
  byAssetType: Record<SemanticAssetType, number>
  total: number
}
