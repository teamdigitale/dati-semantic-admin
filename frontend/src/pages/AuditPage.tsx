import { useState } from 'react'
import { Button, Card, CardBody, CardTitle, Icon, Input, Row, Col } from 'design-react-kit'
import { useRepositories } from '../hooks/useRepositories'
import { useChangelog, useLatestDelta, useLatestDeltaSummary } from '../hooks/useAudit'

export default function AuditPage() {
  const repos = useRepositories()
  const [selectedRepoId, setSelectedRepoId] = useState<string>('')
  const [iriInput, setIriInput] = useState<string>('')
  const [activeIri, setActiveIri] = useState<string>('')

  const summary = useLatestDeltaSummary(selectedRepoId || undefined)
  const delta = useLatestDelta(selectedRepoId || undefined, { limit: 20 })
  const changelog = useChangelog(activeIri || undefined, 0, 20)

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
                  </tr>
                </thead>
                <tbody>
                  {delta.data.content.map((item) => (
                    <tr key={item.assetIri + item.harvesterRunId}>
                      <td className="text-truncate" style={{ maxWidth: 360 }}>
                        <code>{item.assetIri}</code>
                      </td>
                      <td>{item.assetType}</td>
                      <td>
                        <span className="badge bg-info">{item.changeKind}</span>
                      </td>
                      <td className="small">{new Date(item.createdAt).toLocaleString('it-IT')}</td>
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
              <Input
                type="text"
                label="Asset IRI"
                id="iri-input"
                value={iriInput}
                onChange={(e) => setIriInput(e.target.value)}
                placeholder="https://w3id.org/italia/onto/..."
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
                    </tr>
                  </thead>
                  <tbody>
                    {changelog.data.content.map((entry) => (
                      <tr key={entry.runId + entry.createdAt}>
                        <td>{entry.repositoryId}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </section>
  )
}
