/**
 * Metadata di una chiave di configurazione esposta dal BE
 * (endpoint GET /config/metadata). Source-of-truth lato BE per:
 *  - tipo di valore (input da rendere lato FE)
 *  - scope di applicabilita' (su quali repoId la chiave viene letta)
 *  - read-only (chiavi gestite programmaticamente, non scrivibili dal pannello)
 *  - allowedValues (popola i select per i tipi ENUM)
 */
export type ConfigType = 'LONG' | 'BOOLEAN' | 'ENUM'
export type ConfigScope = 'GLOBAL' | 'REPO'

export interface ConfigKeyMetadata {
  name: string
  description: string
  type: ConfigType
  readOnly: boolean
  scopes: ConfigScope[]
  allowedValues: string[]
}
