import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'design-react-kit'
import { useValidationReport } from '../hooks/useRepositories'
import RepoUrlLabel from './RepoUrlLabel'
import type {
  AssetValidationReport,
  ValidationIssue,
  ValidationIssueSeverity,
  ValidationReport,
  ValidationReportSummary,
} from '../api/types/validation'

interface ValidationReportModalProps {
  isOpen: boolean
  onClose: () => void
  /** Caricamento via API per repo configurato (modalita' fetch). */
  repoId?: string
  /** Report gia' in memoria (es. validazione on-demand). Se valorizzato, niente fetch. */
  report?: ValidationReport
  /** Etichetta a destra del titolo: nome repo / owner/repo / qualunque cosa identifichi il subject. */
  title?: string
  /** Back-compat: alias di {@link title}, usato dai call site esistenti. */
  repoName?: string
}

type TabKey = 'repository' | 'assets'

export default function ValidationReportModal({
  isOpen,
  onClose,
  repoId,
  report,
  title,
  repoName,
}: ValidationReportModalProps) {
  // Quando ho un report preloaded, niente fetch.
  const query = useValidationReport(repoId, { enabled: isOpen && !report })
  const effectiveReport = report ?? query.data
  const displayTitle = title ?? repoName

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="xl" scrollable>
      <ModalHeader toggle={onClose}>
        Validation report
        {displayTitle && <span className="ms-2 text-secondary fw-normal">— {displayTitle}</span>}
      </ModalHeader>
      <ModalBody>
        {!report && query.isLoading && (
          <p className="text-secondary mb-0">Caricamento del report…</p>
        )}
        {!report && query.isError && <ReportError error={query.error} />}
        {effectiveReport && <ReportContent report={effectiveReport} />}
      </ModalBody>
      <ModalFooter>
        {effectiveReport && <CopyJsonButton report={effectiveReport} />}
        <Button color="secondary" outline onClick={onClose}>
          Chiudi
        </Button>
      </ModalFooter>
    </Modal>
  )
}

function CopyJsonButton({ report }: { report: ValidationReport }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard puo' essere negato dal browser; in tal caso lasciamo perdere
      // silenziosamente: l'azione non e' bloccante.
    }
  }
  return (
    <Button color="secondary" outline onClick={onCopy}>
      <Icon
        icon={copied ? 'it-check' : 'it-copy'}
        size="sm"
        className="me-2"
      />
      {copied ? 'Copiato' : 'Copia JSON'}
    </Button>
  )
}

function ReportError({ error }: { error: unknown }) {
  // Comune: 404 quando il repo non ha ancora avuto un harvest run con report.
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('404')) {
    return (
      <p className="text-secondary mb-0">
        Nessun validation report disponibile per questo repository: probabilmente non è ancora
        stato eseguito un harvest, oppure l'ultimo run non ha generato un report.
      </p>
    )
  }
  return <p className="text-danger mb-0">Errore nel recupero del report: {message}</p>
}

function ReportContent({ report }: { report: ValidationReport }) {
  const summary = report.summary ?? computeSummary(report)
  const [tab, setTab] = useState<TabKey>(
    (report.repositoryChecks?.length ?? 0) > 0 ? 'repository' : 'assets',
  )

  const repoCount = report.repositoryChecks?.length ?? 0
  const assetCount = report.assetChecks?.length ?? 0

  return (
    <>
      <ReportMeta report={report} />
      <SummaryStrip summary={summary} />

      <ul className="nav nav-tabs mb-3" role="tablist">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${tab === 'repository' ? 'active' : ''}`}
            onClick={() => setTab('repository')}
            role="tab"
            aria-selected={tab === 'repository'}
          >
            Issues repository
            <Badge color="secondary" pill className="ms-2">
              {repoCount}
            </Badge>
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${tab === 'assets' ? 'active' : ''}`}
            onClick={() => setTab('assets')}
            role="tab"
            aria-selected={tab === 'assets'}
          >
            Asset issues
            <Badge color="secondary" pill className="ms-2">
              {assetCount}
            </Badge>
          </button>
        </li>
      </ul>

      {tab === 'repository' && <RepositoryIssuesTab issues={report.repositoryChecks ?? []} />}
      {tab === 'assets' && <AssetsTab assets={report.assetChecks ?? []} />}
    </>
  )
}

function ReportMeta({ report }: { report: ValidationReport }) {
  return (
    <dl className="row small mb-3">
      {report.repositoryUrl && (
        <>
          <dt className="col-sm-3 text-secondary">Repository</dt>
          <dd className="col-sm-9 mb-1">
            <RepoUrlLabel url={report.repositoryUrl} />
          </dd>
        </>
      )}
      {report.revision && (
        <>
          <dt className="col-sm-3 text-secondary">Revision</dt>
          <dd className="col-sm-9 mb-1">
            <code>{report.revision}</code>
          </dd>
        </>
      )}
      {report.generatedAt !== undefined && (
        <>
          <dt className="col-sm-3 text-secondary">Generato</dt>
          <dd className="col-sm-9 mb-1">{formatGeneratedAt(report.generatedAt)}</dd>
        </>
      )}
    </dl>
  )
}

function SummaryStrip({ summary }: { summary: ValidationReportSummary }) {
  return (
    <div className="d-flex flex-wrap gap-2 mb-3">
      <SummaryPill
        color={summary.blocking > 0 ? 'danger' : 'secondary'}
        icon="it-close-circle"
        label="Blocking"
        value={summary.blocking}
      />
      <SummaryPill
        color={summary.warning > 0 ? 'warning' : 'secondary'}
        icon="it-warning-circle"
        label="Warning"
        value={summary.warning}
      />
      <SummaryPill
        color={summary.improvement > 0 ? 'info' : 'secondary'}
        icon="it-info-circle"
        label="Improvement"
        value={summary.improvement}
      />
      <SummaryPill
        color="primary"
        icon="it-files"
        label="Asset totali"
        value={summary.totalAssets}
      />
      <SummaryPill
        color={summary.assetsWithIssues > 0 ? 'warning' : 'success'}
        icon={summary.assetsWithIssues > 0 ? 'it-warning' : 'it-check-circle'}
        label="Asset con issue"
        value={summary.assetsWithIssues}
      />
    </div>
  )
}

function SummaryPill({
  color,
  icon,
  label,
  value,
}: {
  color: string
  icon: string
  label: string
  value: number
}) {
  return (
    <div className="border rounded p-2 d-flex align-items-center gap-2 bg-light">
      <Icon icon={icon} size="sm" color={color} />
      <div className="lh-1">
        <div className="fw-semibold">{value.toLocaleString('it-IT')}</div>
        <div className="small text-secondary">{label}</div>
      </div>
    </div>
  )
}

function RepositoryIssuesTab({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) {
    return <p className="small text-secondary mb-0">Nessuna issue a livello repository.</p>
  }
  return (
    <div className="border rounded" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
      <table className="table table-sm small mb-0 align-middle admin-table">
        <thead className="position-sticky top-0 bg-white">
          <tr>
            <th>Code</th>
            <th style={{ width: 160 }}>Categoria</th>
            <th>Dettagli</th>
            <th style={{ width: 130 }}>Esito</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, idx) => (
            <IssueTableRow key={idx} issue={issue} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function IssueTableRow({ issue }: { issue: ValidationIssue }) {
  const location = formatLocation(issue)
  return (
    <tr>
      <td>
        <code className="small">{displayCode(issue)}</code>
      </td>
      <td>
        <CategoryChip category={issue.category} />
      </td>
      <td>
        {(issue.details || location) ? (
          <>
            {location && <div className="text-secondary small mb-1">{location}</div>}
            {issue.details && (
              <pre
                className="bg-light p-2 mb-0 small"
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {issue.details}
              </pre>
            )}
          </>
        ) : (
          <span className="text-secondary">—</span>
        )}
      </td>
      <td>
        <OutcomeBadge issue={issue} />
      </td>
    </tr>
  )
}

/**
 * Tutte le repository check sono prefissate "conformance." dal BE
 * (ValidationReportCollector.addRepositoryChecks). E' un prefisso costante,
 * fa rumore: lo togliamo in display, ma teniamo i campi raw a disposizione
 * (es. issue.code resta intero se servisse per debug).
 */
function displayCode(issue: ValidationIssue): string {
  const raw = issue.code ?? issue.name
  if (!raw) return '—'
  const prefix = 'conformance.'
  return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw
}

/**
 * Categorie note delle ValidationIssue a livello repository, derivate dal BE
 * (RepositoryStructureValidator.CAT_STRUCTURE / CAT_CI / CAT_HOOKS,
 * ControlledVocabularyPathProcessor.category("publication")).
 * Categorie non note vengono renderizzate con icona generica + nome raw.
 */
const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  structure: { icon: 'it-folder', color: 'primary' },
  ci: { icon: 'it-tool', color: 'info' },
  hooks: { icon: 'it-code-circle', color: 'warning' },
  publication: { icon: 'it-share', color: 'success' },
}

function CategoryChip({ category }: { category?: string }) {
  if (!category) return <span className="text-secondary">—</span>
  const meta = CATEGORY_META[category.toLowerCase()] ?? { icon: 'it-note', color: 'secondary' }
  return (
    <span className="d-inline-flex align-items-center gap-1">
      <Icon icon={meta.icon} size="xs" color={meta.color} />
      <code className="small">{category}</code>
    </span>
  )
}

/** Stile compatto per i badge di esito (font piu' piccolo per risparmiare spazio). */
const BADGE_COMPACT_STYLE = { fontSize: '0.7rem' }

/**
 * Esito di una check: severity se presente, altrimenti fall-back sul campo
 * "result" (es. "PASSED", "FAILED", "OK"). Cosi' il rendering non duplica
 * il concetto piu' volte come faceva la vecchia IssueRow.
 */
function OutcomeBadge({ issue }: { issue: ValidationIssue }) {
  if (issue.severity) return <SeverityBadge severity={issue.severity} />
  const result = issue.result?.toUpperCase()
  if (result === 'PASSED' || result === 'OK' || result === 'SUCCESS') {
    return (
      <Badge color="success" pill className="text-uppercase" style={BADGE_COMPACT_STYLE}>
        <Icon icon="it-check" size="xs" color="white" className="me-1" />
        Passed
      </Badge>
    )
  }
  if (result === 'FAILED' || result === 'ERROR' || result === 'FAILURE') {
    return (
      <Badge color="danger" pill className="text-uppercase" style={BADGE_COMPACT_STYLE}>
        <Icon icon="it-close" size="xs" color="white" className="me-1" />
        Failed
      </Badge>
    )
  }
  if (result) {
    return (
      <Badge color="secondary" pill className="text-uppercase" style={BADGE_COMPACT_STYLE}>
        {result}
      </Badge>
    )
  }
  return <span className="text-secondary small">—</span>
}

/** Restituisce {primary, secondary} deduplicando name e message identici. */
function splitNameMessage(issue: ValidationIssue): { primary?: string; secondary?: string } {
  const name = issue.name?.trim()
  const message = issue.message?.trim()
  if (name && message && name !== message) return { primary: name, secondary: message }
  return { primary: name ?? message }
}

function formatLocation(issue: ValidationIssue): string | null {
  const parts: string[] = []
  if (issue.field) parts.push(`field ${issue.field}`)
  if (issue.line != null) parts.push(`line ${issue.line}`)
  if (issue.col != null) parts.push(`col ${issue.col}`)
  return parts.length > 0 ? parts.join(' · ') : null
}

function AssetsTab({ assets }: { assets: AssetValidationReport[] }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return assets
    return assets.filter((a) => a.assetPath.toLowerCase().includes(q))
  }, [assets, query])

  if (assets.length === 0) {
    return <p className="small text-secondary mb-0">Nessun asset nel report.</p>
  }

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-2">
        <div className="input-group input-group-sm flex-grow-1">
          <span className="input-group-text">
            <Icon icon="it-search" size="xs" />
          </span>
          <input
            type="search"
            className="form-control"
            placeholder="Cerca per asset path…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="small text-secondary text-nowrap">
          {filtered.length === assets.length
            ? `${assets.length} asset`
            : `${filtered.length} di ${assets.length}`}
        </span>
      </div>

      <div
        className="border rounded"
        style={{ maxHeight: '60vh', overflowY: 'auto' }}
      >
        {filtered.length === 0 ? (
          <p className="small text-secondary p-3 mb-0">Nessun asset trovato per la ricerca.</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {filtered.map((asset, idx) => {
              const key = `${asset.assetPath}-${idx}`
              return (
                <AssetRow
                  key={key}
                  asset={asset}
                  isOpen={expanded.has(key)}
                  onToggle={() => toggle(key)}
                />
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function AssetRow({
  asset,
  isOpen,
  onToggle,
}: {
  asset: AssetValidationReport
  isOpen: boolean
  onToggle: () => void
}) {
  const counts = countSeverities(asset.issues)
  const hasIssues = asset.issues.length > 0

  return (
    <li className="border-bottom last-no-border">
      <button
        type="button"
        className="btn btn-link text-decoration-none text-start w-100 p-2 d-flex justify-content-between align-items-center"
        onClick={onToggle}
        disabled={!hasIssues}
        aria-expanded={isOpen}
      >
        <span className="text-truncate me-2" style={{ minWidth: 0 }}>
          <Icon
            icon={isOpen ? 'it-arrow-down' : 'it-chevron-right'}
            size="xs"
            className="me-2"
          />
          {asset.assetType && (
            <Badge color="secondary" className="me-2 small">
              {asset.assetType}
            </Badge>
          )}
          <code className="small">{asset.assetPath}</code>
          {asset.skipped && (
            <Badge color="info" className="ms-2 small">
              skipped
            </Badge>
          )}
        </span>
        <span className="d-inline-flex gap-1">
          {counts.BLOCKING > 0 && (
            <Badge color="danger" pill>
              {counts.BLOCKING} blocking
            </Badge>
          )}
          {counts.WARNING > 0 && (
            <Badge color="warning" pill>
              {counts.WARNING} warning
            </Badge>
          )}
          {counts.IMPROVEMENT > 0 && (
            <Badge color="info" pill>
              {counts.IMPROVEMENT} improvement
            </Badge>
          )}
          {!hasIssues && (
            <Badge color="success" pill>
              <Icon icon="it-check" size="xs" color="white" className="me-1" />
              ok
            </Badge>
          )}
        </span>
      </button>
      {isOpen && hasIssues && (
        <div className="border-top p-2 bg-light">
          <IssueList issues={asset.issues} />
        </div>
      )}
    </li>
  )
}

function IssueList({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) return null
  return (
    <ul className="list-unstyled mb-0">
      {issues.map((issue, idx) => (
        <li key={idx} className={`small ${idx > 0 ? 'border-top pt-2 mt-2' : ''}`}>
          <IssueRow issue={issue} />
        </li>
      ))}
    </ul>
  )
}

function IssueRow({ issue }: { issue: ValidationIssue }) {
  const { primary, secondary } = splitNameMessage(issue)
  const location = formatLocation(issue)
  return (
    <div>
      <div className="d-flex flex-wrap align-items-baseline gap-2 mb-1">
        <OutcomeBadge issue={issue} />
        {issue.code && issue.code !== primary && (
          <code className="text-secondary">{issue.code}</code>
        )}
        {issue.category && <span className="text-secondary">· {issue.category}</span>}
      </div>
      {primary && (
        <div className="mb-1">
          <strong>{primary}</strong>
          {secondary && <span className="text-secondary"> — {secondary}</span>}
        </div>
      )}
      {location && <div className="text-secondary">{location}</div>}
      {issue.details && <pre className="bg-white border p-2 mb-0 mt-1 small">{issue.details}</pre>}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: ValidationIssueSeverity | undefined }) {
  if (!severity) return null
  const styles: Record<ValidationIssueSeverity, { color: string; icon: string }> = {
    BLOCKING: { color: 'danger', icon: 'it-close-circle' },
    WARNING: { color: 'warning', icon: 'it-warning-circle' },
    IMPROVEMENT: { color: 'info', icon: 'it-info-circle' },
  }
  const s = styles[severity]
  return (
    <Badge color={s.color} pill className="text-uppercase" style={BADGE_COMPACT_STYLE}>
      <Icon icon={s.icon} size="xs" color="white" className="me-1" />
      {severity}
    </Badge>
  )
}

function countSeverities(issues: ValidationIssue[]): Record<ValidationIssueSeverity, number> {
  const counts: Record<ValidationIssueSeverity, number> = {
    BLOCKING: 0,
    WARNING: 0,
    IMPROVEMENT: 0,
  }
  for (const issue of issues) {
    if (issue.severity) counts[issue.severity] += 1
  }
  return counts
}

function computeSummary(report: ValidationReport): ValidationReportSummary {
  const allIssues = [
    ...(report.repositoryChecks ?? []),
    ...(report.assetChecks ?? []).flatMap((a) => a.issues ?? []),
  ]
  const counts = countSeverities(allIssues)
  return {
    blocking: counts.BLOCKING,
    warning: counts.WARNING,
    improvement: counts.IMPROVEMENT,
    totalAssets: report.assetChecks?.length ?? 0,
    assetsWithIssues: (report.assetChecks ?? []).filter((a) => (a.issues?.length ?? 0) > 0).length,
  }
}

/**
 * Parsa il timestamp generatedAt del report:
 *  - number  -> epoch-seconds.nanos (formato attualmente emesso dal BE perche'
 *    l'ObjectMapper di HarvesterService non disabilita WRITE_DATES_AS_TIMESTAMPS)
 *  - string  -> ISO-8601, gestito per robustezza (se in futuro il BE cambia)
 */
function formatGeneratedAt(value: number | string): string {
  let date: Date
  if (typeof value === 'number') {
    date = new Date(value * 1000)
  } else {
    date = new Date(value)
  }
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('it-IT')
}
