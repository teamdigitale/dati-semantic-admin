import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardBody, CardTitle, Icon, Row, Col } from 'design-react-kit'
import { useRepositories } from '../hooks/useRepositories'
import { useChangelog, useRunDelta, useRunDeltaSummary } from '../hooks/useAudit'
import { useHarvestRuns } from '../hooks/useHarvest'
import DeltaDetailModal, { type DeltaDetailPayload } from '../components/DeltaDetailModal'
import IriSearchInput from '../components/IriSearchInput'
import Pagination from '../components/Pagination'
import AssetTypeBadge from '../components/AssetTypeBadge'
import type { Repository } from '../api/types/repository'
import type { HarvesterRun } from '../api/types/harvest'

type DetailContext = { kind: 'delta' | 'changelog'; index: number } | null
type ActiveRunCtx = { repoId: string; runId: string } | null

const PAGE_SIZE = 10

export default function AuditPage() {
  const repos = useRepositories()
  const allRuns = useHarvestRuns()
  const [selectedRepoId, setSelectedRepoId] = useState<string>('')
  const [selectedRunId, setSelectedRunId] = useState<string>('')
  const [activeRun, setActiveRun] = useState<ActiveRunCtx>(null)
  const [iriInput, setIriInput] = useState<string>('')
  const [activeIri, setActiveIri] = useState<string>('')
  const [deltaPage, setDeltaPage] = useState(0)
  const [changelogPage, setChangelogPage] = useState(0)
  const [deltaFilter, setDeltaFilter] = useState('')

  // Runs del repo selezionato, ordinati per data DESC (piu' recente prima).
  const runsForRepo = useMemo<HarvesterRun[]>(() => {
    if (!selectedRepoId || !allRuns.data) return []
    return [...allRuns.data]
      .filter((r) => r.repositoryId === selectedRepoId)
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
  }, [allRuns.data, selectedRepoId])

  // Quando cambia repo: reset run selezionato all'ultimo, scarta activeRun.
  useEffect(() => {
    setSelectedRunId(runsForRepo[0]?.id ?? '')
    setActiveRun(null)
    setDeltaPage(0)
  }, [selectedRepoId, runsForRepo])

  // Reset paginazione changelog quando cambia IRI.
  useEffect(() => setChangelogPage(0), [activeIri])

  const summary = useRunDeltaSummary(activeRun?.repoId, activeRun?.runId)
  const delta = useRunDelta(activeRun?.repoId, activeRun?.runId, {
    offset: deltaPage * PAGE_SIZE,
    limit: PAGE_SIZE,
  })
  const changelog = useChangelog(activeIri || undefined, changelogPage * PAGE_SIZE, PAGE_SIZE)
  const [detailCtx, setDetailCtx] = useState<DetailContext>(null)

  const repoById = useMemo<Map<string, Repository>>(() => {
    const map = new Map<string, Repository>()
    repos.data?.forEach((r) => map.set(r.id, r))
    return map
  }, [repos.data])

  // Filtro client-side della pagina corrente del delta. Si applica a IRI e
  // assetType (case-insensitive); nav del detail modal opera sulla lista filtrata.
  const filteredDeltaItems = useMemo(() => {
    if (!delta.data) return []
    const q = deltaFilter.trim().toLowerCase()
    if (!q) return delta.data.content
    return delta.data.content.filter(
      (item) =>
        item.assetIri.toLowerCase().includes(q) || (item.assetType ?? '').toLowerCase().includes(q)
    )
  }, [delta.data, deltaFilter])

  const detailItem = useMemo<DeltaDetailPayload | null>(() => {
    if (!detailCtx) return null
    if (detailCtx.kind === 'delta') {
      return filteredDeltaItems[detailCtx.index] ?? null
    }
    if (!changelog.data) return null
    const entry = changelog.data.content[detailCtx.index]
    if (!entry) return null
    return {
      assetIri: changelog.data.assetIri,
      assetType: changelog.data.assetType,
      changeKind: entry.changeKind,
      createdAt: entry.createdAt,
      summary: entry.summary,
    }
  }, [detailCtx, filteredDeltaItems, changelog.data])

  const detailListLen = detailCtx
    ? detailCtx.kind === 'delta'
      ? filteredDeltaItems.length
      : (changelog.data?.content.length ?? 0)
    : 0

  const detailNav = useMemo<{ onPrev?: () => void; onNext?: () => void }>(() => {
    if (!detailCtx) return {}
    // Liste DESC per createdAt: indice piu' alto = piu' vecchio = "anteriore".
    const hasPrev = detailCtx.index < detailListLen - 1
    const hasNext = detailCtx.index > 0
    return {
      onPrev: hasPrev
        ? () => setDetailCtx({ ...detailCtx, index: detailCtx.index + 1 })
        : undefined,
      onNext: hasNext
        ? () => setDetailCtx({ ...detailCtx, index: detailCtx.index - 1 })
        : undefined,
    }
  }, [detailCtx, detailListLen])

  const detailPosition =
    detailCtx && detailListLen > 0 ? { index: detailCtx.index, total: detailListLen } : undefined

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Audit</h1>
          <p className="admin-page-subtitle">
            Delta semantico di uno specifico run e changelog per singolo asset (cross-repo).
          </p>
        </div>
      </div>

      {/* --- Delta per repository (run scelto dall'utente) --- */}
      <Card className="admin-card mb-4">
        <CardBody className="admin-card-body">
          <CardTitle tag="h5" className="admin-card-title">
            <Icon icon="it-folder" size="sm" />
            Delta di un run
          </CardTitle>
          <Row className="g-3 align-items-end mb-3">
            <Col md={5}>
              <label htmlFor="repo-select" className="form-label small">
                Repository
              </label>
              <select
                id="repo-select"
                className="form-select"
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
              >
                <option value="">— Seleziona —</option>
                {repos.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name ?? r.url}
                  </option>
                ))}
              </select>
            </Col>
            <Col md={5}>
              <label htmlFor="run-select" className="form-label small">
                Run
              </label>
              <select
                id="run-select"
                className="form-select"
                value={selectedRunId}
                onChange={(e) => setSelectedRunId(e.target.value)}
                disabled={!selectedRepoId || runsForRepo.length === 0}
              >
                {!selectedRepoId && <option value="">— Seleziona prima un repository —</option>}
                {selectedRepoId && allRuns.isLoading && <option value="">Caricamento run…</option>}
                {selectedRepoId && !allRuns.isLoading && runsForRepo.length === 0 && (
                  <option value="">Nessun run per questo repository</option>
                )}
                {runsForRepo.map((r) => (
                  <option key={r.id} value={r.id}>
                    {formatRunLabel(r)}
                  </option>
                ))}
              </select>
            </Col>
            <Col md={2}>
              <Button
                color="primary"
                outline
                disabled={!selectedRepoId || !selectedRunId}
                onClick={() => setActiveRun({ repoId: selectedRepoId, runId: selectedRunId })}
              >
                <Icon icon="it-search" size="sm" className="me-2" />
                Carica delta
              </Button>
            </Col>
          </Row>

          {!activeRun && (
            <p className="admin-empty">Seleziona repository e run, poi premi "Carica delta".</p>
          )}
          {activeRun && summary.isLoading && <p>Caricamento summary…</p>}
          {activeRun && summary.data && (
            <div className="mb-3">
              <h6>Summary</h6>
              <Row className="g-2">
                {Object.entries(summary.data.byChangeKind).map(([kind, count]) => (
                  <Col key={kind} xs={6} md={3}>
                    <div className="admin-summary-tile">
                      <small>{kind}</small>
                      <div>{count}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {activeRun && delta.data && delta.data.content.length > 0 && (
            <>
              <Row className="g-2 align-items-end mb-2">
                <Col md={6}>
                  <label htmlFor="delta-filter" className="form-label small">
                    Filtro pagina
                  </label>
                  <input
                    id="delta-filter"
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Filtra per IRI o tipo asset…"
                    value={deltaFilter}
                    onChange={(e) => setDeltaFilter(e.target.value)}
                  />
                </Col>
              </Row>
              <div className="table-responsive">
                <table className="table table-hover table-sm mb-0 admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}>Tipo</th>
                      <th>Asset IRI</th>
                      <th>Cambio</th>
                      <th>Quando</th>
                      <th className="text-end" style={{ width: 80 }}>
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeltaItems.map((item, index) => (
                      <tr key={item.assetIri + item.harvesterRunId}>
                        <td>
                          <AssetTypeBadge type={item.assetType} />
                        </td>
                        <td className="text-truncate" style={{ maxWidth: 360 }}>
                          <code>{item.assetIri}</code>
                        </td>
                        <td>
                          <span className="badge bg-info">{item.changeKind}</span>
                        </td>
                        <td className="small">
                          {new Date(item.createdAt).toLocaleString('it-IT')}
                        </td>
                        <td className="text-end">
                          <Button
                            size="xs"
                            color="secondary"
                            outline
                            title="Dettaglio modifiche"
                            aria-label="Dettaglio modifiche"
                            onClick={() => setDetailCtx({ kind: 'delta', index })}
                          >
                            <Icon icon="it-zoom-in" size="sm" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredDeltaItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted small py-3">
                          Nessuna riga nella pagina corrente combacia con "{deltaFilter}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={deltaPage}
                pageSize={PAGE_SIZE}
                total={delta.data.total}
                onPageChange={setDeltaPage}
              />
            </>
          )}
          {activeRun && delta.data && delta.data.content.length === 0 && (
            <p className="admin-empty">Nessuna modifica in questo run.</p>
          )}
        </CardBody>
      </Card>

      {/* --- Changelog per singolo asset --- */}
      <Card className="admin-card">
        <CardBody className="admin-card-body">
          <CardTitle tag="h5" className="admin-card-title">
            <Icon icon="it-clock" size="sm" />
            Changelog per asset (cross-repository)
          </CardTitle>
          <p className="admin-card-hint">
            Time-series dei cambi a un singolo asset semantico, identificato per IRI. Da{' '}
            <code>/semantic-assets/changelog?iri=...</code>.
          </p>

          <Row className="g-2 align-items-end mb-3">
            <Col md={9}>
              <label htmlFor="iri-input" className="form-label small">
                Asset IRI
              </label>
              <IriSearchInput
                inputId="iri-input"
                value={iriInput}
                onChange={setIriInput}
                placeholder="Cerca per titolo o incolla un IRI…"
              />
            </Col>
            <Col md={3}>
              <Button
                color="primary"
                outline
                disabled={!iriInput.trim()}
                onClick={() => setActiveIri(iriInput.trim())}
              >
                <Icon icon="it-search" size="sm" className="me-2" />
                Carica changelog
              </Button>
            </Col>
          </Row>

          {!activeIri && (
            <p className="admin-empty">Inserisci un IRI e premi "Carica changelog".</p>
          )}
          {activeIri && changelog.isLoading && <p>Caricamento…</p>}
          {activeIri && changelog.isError && (
            <p className="text-danger mb-0">
              Errore nel recupero del changelog: {(changelog.error as Error)?.message}
            </p>
          )}
          {activeIri && changelog.data && changelog.data.content.length === 0 && (
            <p className="admin-empty">Nessuna voce per l'IRI specificato.</p>
          )}
          {activeIri && changelog.data && changelog.data.content.length > 0 && (
            <>
              <p className="small mb-2">
                Asset: <code>{changelog.data.assetIri}</code>
                {changelog.data.assetType && (
                  <>
                    {' '}
                    — tipo <strong>{changelog.data.assetType}</strong>
                  </>
                )}{' '}
                — <strong>{changelog.data.total}</strong> voci totali
              </p>
              <div className="table-responsive">
                <table className="table table-hover table-sm mb-0 admin-table">
                  <thead>
                    <tr>
                      <th>Repository</th>
                      <th>Revisione</th>
                      <th>Cambio</th>
                      <th>Run</th>
                      <th>Quando</th>
                      <th className="text-end" style={{ width: 80 }}>
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {changelog.data.content.map((entry, index) => (
                      <tr key={entry.runId + entry.createdAt}>
                        <td>
                          <RepoCell
                            repoId={entry.repositoryId}
                            repo={repoById.get(entry.repositoryId)}
                          />
                        </td>
                        <td>
                          <code>{entry.revision ?? '—'}</code>
                        </td>
                        <td>
                          <span className="badge bg-info">{entry.changeKind}</span>
                        </td>
                        <td className="text-truncate" style={{ maxWidth: 180 }}>
                          <code>{entry.runId}</code>
                        </td>
                        <td className="small">
                          {new Date(entry.createdAt).toLocaleString('it-IT')}
                        </td>
                        <td className="text-end">
                          <Button
                            size="xs"
                            color="secondary"
                            outline
                            title="Dettaglio modifiche"
                            aria-label="Dettaglio modifiche"
                            onClick={() => setDetailCtx({ kind: 'changelog', index })}
                          >
                            <Icon icon="it-zoom-in" size="sm" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={changelogPage}
                pageSize={PAGE_SIZE}
                total={changelog.data.total}
                onPageChange={setChangelogPage}
              />
            </>
          )}
        </CardBody>
      </Card>

      <DeltaDetailModal
        isOpen={detailItem !== null}
        onClose={() => setDetailCtx(null)}
        item={detailItem}
        onPrev={detailNav.onPrev}
        onNext={detailNav.onNext}
        position={detailPosition}
      />
    </section>
  )
}

/**
 * Etichetta utente-friendly per un run nella dropdown: solo data-ora locale + status.
 * Niente runId (tecnico, non interessa l'utente).
 */
function formatRunLabel(run: HarvesterRun): string {
  const when = run.startedAt
    ? new Date(run.startedAt).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'data ignota'
  return `${when} — ${run.status}`
}

function RepoCell({ repoId, repo }: { repoId: string; repo: Repository | undefined }) {
  if (!repo) {
    return (
      <code className="small text-muted" title={`Repository non più configurato — id: ${repoId}`}>
        {repoId}
      </code>
    )
  }
  const label = repo.name ?? repo.url
  return <span title={repo.url}>{label}</span>
}
