import { Badge } from 'design-react-kit'
import type {
  DeltaModifiedItem,
  DeltaSection,
  DeltaSummary,
  DeltaTriple,
  RdfTerm,
} from '../api/types/audit'

interface DeltaSummaryDetailProps {
  summary?: DeltaSummary
}

/**
 * Vista strutturata del summary di una riga di delta:
 * sezioni {@code Classi} / {@code Proprietà} / {@code Deprecati}, con elenchi
 * di IRI aggiunti/rimossi e — per i MODIFIED — il diff a livello di triple.
 * Sorgente di verita' dello shape: {@code backlog/GOV-AUDIT/collaudo/expected-outputs/}.
 */
export default function DeltaSummaryDetail({ summary }: DeltaSummaryDetailProps) {
  if (!summary) {
    return <p className="admin-empty mb-0">Nessun summary disponibile per questa riga.</p>
  }

  const sections: Array<{ label: string; data?: DeltaSection }> = [
    { label: 'Classi', data: summary.classes },
    { label: 'Proprietà', data: summary.properties },
  ]
  const visibleSections = sections.filter((s) => isSectionNonEmpty(s.data))
  const hasDeprecated = (summary.deprecated?.count ?? 0) > 0

  if (visibleSections.length === 0 && !hasDeprecated) {
    return <p className="admin-empty mb-0">Nessun dettaglio strutturato disponibile.</p>
  }

  return (
    <div className="d-flex flex-column gap-3">
      {visibleSections.map((s) => (
        <SectionBlock key={s.label} label={s.label} section={s.data as DeltaSection} />
      ))}
      {hasDeprecated && <DeprecatedBlock items={summary.deprecated!.items} />}
      {summary.tripleStats && (
        <p className="small text-muted mb-0">
          Statistiche triple — aggiunte: <strong>{String(summary.tripleStats.added)}</strong>,
          rimosse: <strong>{String(summary.tripleStats.removed)}</strong>
        </p>
      )}
    </div>
  )
}

function isSectionNonEmpty(s?: DeltaSection): boolean {
  if (!s) return false
  return (
    (s.counts.added ?? 0) > 0 ||
    (s.counts.removed ?? 0) > 0 ||
    (s.counts.modified ?? 0) > 0 ||
    s.added.length > 0 ||
    s.removed.length > 0 ||
    s.modified.length > 0
  )
}

function SectionBlock({ label, section }: { label: string; section: DeltaSection }) {
  return (
    <div className="delta-summary-section">
      <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
        <h6 className="mb-0">{label}</h6>
        <CountChip variant="added" count={section.counts.added} />
        <CountChip variant="removed" count={section.counts.removed} />
        <CountChip variant="modified" count={section.counts.modified} />
      </div>

      {section.added.length > 0 && <IriList variant="added" iris={section.added} />}
      {section.removed.length > 0 && <IriList variant="removed" iris={section.removed} />}
      {section.modified.length > 0 && (
        <div className="d-flex flex-column gap-2 mt-2">
          {section.modified.map((m) => (
            <ModifiedItemBlock key={m.iri} item={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function DeprecatedBlock({ items }: { items: string[] }) {
  return (
    <div className="delta-summary-section">
      <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
        <h6 className="mb-0">Deprecati</h6>
        <Badge color="warning" pill style={{ fontSize: '0.7rem' }}>
          {items.length}
        </Badge>
      </div>
      <IriList variant="deprecated" iris={items} />
    </div>
  )
}

type Variant = 'added' | 'removed' | 'modified' | 'deprecated'

const VARIANT_STYLE: Record<Variant, { color: string; symbol: string; label: string }> = {
  added: { color: 'success', symbol: '+', label: 'aggiunti' },
  removed: { color: 'danger', symbol: '−', label: 'rimossi' },
  modified: { color: 'warning', symbol: '~', label: 'modificati' },
  deprecated: { color: 'warning', symbol: '!', label: 'deprecati' },
}

function CountChip({ variant, count }: { variant: Variant; count: number }) {
  const style = VARIANT_STYLE[variant]
  if (count === 0) {
    return (
      <span className="badge bg-light text-muted" style={{ fontSize: '0.7rem' }}>
        {style.label}: 0
      </span>
    )
  }
  return (
    <Badge color={style.color} pill style={{ fontSize: '0.7rem' }}>
      {style.label}: {count}
    </Badge>
  )
}

function IriList({ variant, iris }: { variant: Variant; iris: string[] }) {
  const style = VARIANT_STYLE[variant]
  return (
    <ul className="delta-summary-iri-list mb-0">
      {iris.map((iri) => (
        <li key={iri}>
          <span className={`delta-summary-symbol text-${style.color}`}>{style.symbol}</span>
          <code title={iri}>{shortIri(iri)}</code>
        </li>
      ))}
    </ul>
  )
}

function ModifiedItemBlock({ item }: { item: DeltaModifiedItem }) {
  return (
    <div className="delta-summary-modified">
      <div className="mb-1">
        <span className="delta-summary-symbol text-warning">~</span>
        <code title={item.iri}>{shortIri(item.iri)}</code>
      </div>
      <ul className="delta-summary-triples mb-0">
        {item.triplesRemoved.map((t, idx) => (
          <TripleRow key={`r${idx}`} triple={t} variant="removed" />
        ))}
        {item.triplesAdded.map((t, idx) => (
          <TripleRow key={`a${idx}`} triple={t} variant="added" />
        ))}
      </ul>
    </div>
  )
}

function TripleRow({ triple, variant }: { triple: DeltaTriple; variant: 'added' | 'removed' }) {
  const style = VARIANT_STYLE[variant]
  return (
    <li>
      <span className={`delta-summary-symbol text-${style.color}`}>{style.symbol}</span>
      <code className="me-2" title={triple.p}>
        {shortIri(triple.p)}
      </code>
      <span className="delta-summary-object">{formatTerm(triple.o)}</span>
    </li>
  )
}

function formatTerm(t: RdfTerm): string {
  if (t.type === 'uri') return shortIri(t.value)
  if (t.type === 'bnode') return `_:${t.value}`
  const v = `"${t.value}"`
  if (t.lang) return `${v}@${t.lang}`
  if (t.datatype) return `${v}^^${shortIri(t.datatype)}`
  return v
}

function shortIri(iri: string): string {
  const hash = iri.lastIndexOf('#')
  if (hash >= 0 && hash < iri.length - 1) return iri.slice(hash + 1)
  const slash = iri.lastIndexOf('/')
  if (slash >= 0 && slash < iri.length - 1) return iri.slice(slash + 1)
  return iri
}
