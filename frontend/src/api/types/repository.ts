export interface Repository {
  id: string
  url: string
  branch?: string
  name?: string
  description?: string
  owner?: string
  active?: boolean
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface CreateRepositoryRequest {
  url: string
  branch?: string
  name?: string
  description?: string
  maxFileSizeBytes?: number
}

export interface UpdateRepositoryRequest extends Partial<CreateRepositoryRequest> {
  active?: boolean
}

/**
 * Posizione di un tipo di asset rilevata nel repository:
 *  - CURRENT  : in {@code assets/<folder>} (layout post-migrazione)
 *  - LEGACY   : al root con il nome originale (es. {@code Ontologie})
 *  - MIXED    : presente in entrambe le posizioni (tipicamente durante una migrazione)
 */
export type AssetTypeLayout = 'CURRENT' | 'LEGACY' | 'MIXED'

/**
 * Esito della detection di un singolo {@code SemanticAssetType}.
 *  - key    : valore enum ({@code ONTOLOGY}, {@code CONTROLLED_VOCABULARY}, {@code SCHEMA})
 *  - label  : etichetta human-readable dal BE
 *  - present: true se la directory e' presente al root o sotto {@code assets/}
 *  - layout : null se {@code present=false}
 *  - path   : percorso rilevato sul repo (es. {@code assets/ontologies})
 */
export interface AssetTypeDetection {
  key: 'ONTOLOGY' | 'CONTROLLED_VOCABULARY' | 'SCHEMA'
  label: string
  present: boolean
  layout?: AssetTypeLayout
  path?: string
}

/**
 * Risultato dell'ispezione di una URL GitHub (GET /config/repository/inspect):
 *  - exists  : risposta a {@code git ls-remote}. GitHub maschera i repo privati come "not
 *              found": se {@code exists=false}, il repo o non esiste o e' privato.
 *  - public  : tautologicamente true se siamo riusciti a leggerlo anonimi.
 *  - assetTypes: detection per ogni tipo dichiarato in {@code SemanticAssetType}. La
 *              lista e' sempre popolata (un elemento per tipo); il flag {@code present}
 *              dice se la directory e' stata trovata.
 *  - error   : impostato in caso di errore non recuperabile (URL malformata, connettivita').
 */
export interface RepositoryInspection {
  url: string
  owner?: string
  repo?: string
  exists: boolean
  public: boolean
  assetTypes: AssetTypeDetection[]
  error?: string
}
