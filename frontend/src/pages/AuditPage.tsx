import { useMemo, useState } from 'react'
import { Button, Card, CardBody, CardTitle, Icon, Row, Col } from 'design-react-kit'
import { useRepositories } from '../hooks/useRepositories'
import { useChangelog, useLatestDelta, useLatestDeltaSummary } from '../hooks/useAudit'
import DeltaDetailModal, { type DeltaDetailPayload } from '../components/DeltaDetailModal'
import IriSearchInput from '../components/IriSearchInput'
import type { Repository } from '../api/types/repository'

type DetailContext = { kind: 'delta' | 'changelog'; index: number } | null

export default function AuditPage() {
  const repos = useRepositories()
  const [selectedRepoId, setSelectedRepoId] = useState<string>('')
  const [iriInput, setIriInput] = useState<string>('')
  const [activeIri, setActiveIri] = useState<string>('')

  const summary = useLatestDeltaSummary(selectedRepoId || undefined)
  const delta = useLatestDelta(selectedRepoId || undefined, { limit: 20 })
  const changelog = useChangelog(activeIri || undefined, 0, 20)
  const [detailCtx, setDetailCtx] = useState<DetailContext>(null)

  const repoById = useMemo<Map<string, Repository>>(() => {
    const map = new Map<string, Repository>()
    repos.data?.forEach((r) => map.set(r.id, r))
    return map
  }, [repos.data])

  const detailItem = useMemo<DeltaDetailPayload | null>(() => {
    if (!detailCtx) return null
    if (detailCtx.kind === 'delta') {
      return delta.data?.content[detailCtx.index] ?? null
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
  }, [detailCtx, delta.data, changelog.data])

  const detailListLen = detailCtx
    ? detailCtx.kind === 'delta'
      ? (delta.data?.content.length ?? 0)
      : (changelog.data?.content.length ?? 0)
    : 0

  const detailNav = useMemo<{ onPrev?: () => void; onNext?: () => void }>(() => {
    if (!detailCtx) return {}
    // Liste DESC per createdAt: indice piu' alto = piu' vecchio = "anteriore".
    const hasPrev = detailCtx.index < detailListLen - 1
    const hasNext = detailCtx.index > 0
    return {
      onPrev: hasPrev ? () => setDetailCtx({ ...detailCtx, index: detailCtx.index + 1 }) : undefined,
      onNext: hasNext ? () => setDetailCtx({ ...detailCtx, index: detailCtx.index - 1 }) : undefined,
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
            Delta semantico per repository (ultimo run) e changelog per singolo asset (cross-repo).
          </p>
        </div>
      </div>

      {/* --- Delta per repository (ultimo run) --- */}
      <Card className="admin-card mb-4">
        <CardBody className="admin-card-body">
          <CardTitle tag="h5" className="admin-card-title">
            <Icon icon="it-folder" size="sm" />
            Delta dell'ultimo run
          </CardTitle>
          <Row className="g-3 align-items-end mb-3">
            <Col md={6}>
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
          </Row>

          {selectedRepoId && summary.isLoading && <p>Caricamento summary…</p>}
          {selectedRepoId && summary.data && (
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

          {selectedRepoId && delta.data && delta.data.content.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0 admin-table">
                <thead>
                  <tr>
                    <th>Asset IRI</th>
                    <th>Tipo</th>
                    <th>Cambio</th>
                    <th>Quando</th>
                    <th className="text-end" style={{ width: 80 }}>
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {delta.data.content.map((item, index) => (
                    <tr key={item.assetIri + item.harvesterRunId}>
                      <td className="text-truncate" style={{ maxWidth: 360 }}>
                        <code>{item.assetIri}</code>
                      </td>
                      <td>{item.assetType}</td>
                      <td>
                        <span className="badge bg-info">{item.changeKind}</span>
                      </td>
                      <td className="small">{new Date(item.createdAt).toLocaleString('it-IT')}</td>
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
                </tbody>
              </table>
            </div>
          )}
          {selectedRepoId && delta.data && delta.data.content.length === 0 && (
            <p className="admin-empty">Nessuna modifica nell'ultimo run.</p>
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
                          <RepoCell repoId={entry.repositoryId} repo={repoById.get(entry.repositoryId)} />
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
