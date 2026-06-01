import { Button, Card, CardBody, Icon, Row, Col } from 'design-react-kit'
import {
  useCancelPendingHarvests,
  useHarvestRuns,
  useRunningInstances,
  useStartHarvestAll,
} from '../hooks/useHarvest'
import { useIsAdmin } from '../hooks/useHasRole'

export default function HarvestPage() {
  const runs = useHarvestRuns()
  const running = useRunningInstances()
  const startAll = useStartHarvestAll()
  const cancelAll = useCancelPendingHarvests()
  const isAdmin = useIsAdmin()

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Harvest</h1>
          <p className="admin-page-subtitle">Gestione dei job di harvesting.</p>
        </div>
        {isAdmin && (
          <div className="admin-actions">
            <Button
              color="primary"
              onClick={() => startAll.mutate(false)}
              disabled={startAll.isPending}
            >
              <Icon icon="it-refresh" size="sm" color="white" className="me-2" />
              Avvia tutto
            </Button>
            <Button
              color="danger"
              outline
              onClick={() => {
                if (confirm('Cancellare tutti i job pending?')) cancelAll.mutate()
              }}
              disabled={cancelAll.isPending}
            >
              <Icon icon="it-close-circle" size="sm" className="me-2" />
              Cancella pending
            </Button>
          </div>
        )}
      </div>

      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="admin-card h-100">
            <CardBody className="admin-card-body">
              <h2 className="admin-card-title">In esecuzione</h2>
              {running.isLoading && <p>Caricamento…</p>}
              {running.data && running.data.length === 0 && (
                <p className="admin-empty">Nessun job in esecuzione.</p>
              )}
              {running.data && running.data.length > 0 && (
                <ul className="list-unstyled mb-0">
                  {running.data.map((r) => (
                    <li key={r.harvesterRun.id} className="border-bottom py-2">
                      <code>{r.harvesterRun.id}</code> —{' '}
                      {r.harvesterRun.repositoryUrl ?? r.harvesterRun.repositoryId}
                      <div className="text-secondary small">
                        thread <code>{r.threadName}</code> · iniziato{' '}
                        {new Date(r.harvesterRun.startedAt).toLocaleString('it-IT')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card className="admin-card">
        <CardBody className="admin-card-body">
          <h2 className="admin-card-title">Storico run</h2>
          {runs.isLoading && <p>Caricamento…</p>}
          {runs.data && runs.data.length === 0 && (
            <p className="admin-empty">Nessun run registrato.</p>
          )}
          {runs.data && runs.data.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover mb-0 admin-table">
                <thead>
                  <tr>
                    <th>Repository</th>
                    <th>Stato</th>
                    <th>Inizio</th>
                    <th>Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.data.map((r) => (
                    <tr key={r.id}>
                      <td className="text-truncate" style={{ maxWidth: 320 }}>
                        {r.repositoryUrl ?? r.repositoryId}
                      </td>
                      <td>{r.status}</td>
                      <td>{new Date(r.startedAt).toLocaleString('it-IT')}</td>
                      <td>{r.endedAt ? new Date(r.endedAt).toLocaleString('it-IT') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </section>
  )
}
