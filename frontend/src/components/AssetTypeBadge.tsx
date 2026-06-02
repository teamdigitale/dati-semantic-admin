interface Props {
  type: string | undefined
}

/**
 * Badge compatto per il SemanticAssetType. Sigle a 3 lettere maiuscole, colore
 * dedicato per ogni tipo + tooltip con il nome esteso. Fallback monocromo per
 * tipi sconosciuti / mancanti.
 */
export default function AssetTypeBadge({ type }: Props) {
  const t = type ?? ''
  const cfg = CONFIG[t]
  if (!cfg) {
    return (
      <span className="badge bg-light text-muted" title={t || 'tipo non definito'}>
        {t ? t.slice(0, 3).toUpperCase() : '—'}
      </span>
    )
  }
  return (
    <span className={`badge ${cfg.cls}`} title={cfg.label}>
      {cfg.short}
    </span>
  )
}

const CONFIG: Record<string, { short: string; label: string; cls: string }> = {
  ONTOLOGY: { short: 'ONT', label: 'Ontologia', cls: 'bg-primary' },
  CONTROLLED_VOCABULARY: { short: 'VOC', label: 'Vocabolario controllato', cls: 'bg-info' },
  SCHEMA: { short: 'SCH', label: 'Schema dati', cls: 'bg-warning text-dark' },
}
