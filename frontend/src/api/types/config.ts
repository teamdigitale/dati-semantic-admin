export interface ConfigEntry {
  value: unknown
  writtenAt?: string
  writtenBy?: string
}

export type RepoConfig = Record<string, ConfigEntry>
