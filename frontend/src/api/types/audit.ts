import type { HarvesterRunStatus } from './harvest'

export type ChangeKind = 'CREATED' | 'UPDATED' | 'DELETED' | string
export type SemanticAssetType =
  | 'ONTOLOGY'
  | 'CONTROLLED_VOCABULARY'
  | 'SCHEMA'
  | string

export interface RunInfo {
  id: string
  repositoryId: string
  revision?: string
  revisionCommittedAt?: string
  startedAt: string
  endedAt?: string
  status: HarvesterRunStatus
}

export interface ResourceDeltaItem {
  assetIri: string
  assetType: SemanticAssetType
  changeKind: ChangeKind
  summary?: unknown
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
