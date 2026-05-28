import { Button, Card, CardBody, Icon, Row, Col } from 'design-react-kit'
import {
  useCancelPendingHarvests,
  useHarvestRuns,
  useRunningInstances,
  useStartHarvestAll,
} from '../hooks/useHarvest'

export default function HarvestPage() {
  const runs = useHarvestRuns()
  const running = useRunningInstances()
  const startAll = useStartHarvestAll()
  const cancelAll = useCancelPendingHarvests()

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Harvest</h1>
          <p className="text-secondary mb-0">Gestione dei job di harvesting.</p>
        </div>
        <div className="d-flex gap-2">
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
      </div>

      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <CardBody>
              <h5 className="mb-3">In esecuzione</h5>
              {running.isLoading && <p>Caricamento…</p>}
              {running.data && running.data.length === 0 && (
                <p className="text-secondary mb-0">Nessun job in esecuzione.</p>
              )}
              {running.data && running.data.length > 0 && (
                <ul className="list-unstyled mb-0">
                  {running.data.map((r) => (
                    <li key={r.runId} className="border-bottom py-2">
                      <code>{r.runId}</code> — {r.repositoryId}
                      <div className="text-secondary small">
                        iniziato {new Date(r.startedAt).toLocaleString('it-IT')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <CardBody>
          <h5 className="mb-3">Storico run</h5>
          {runs.isLoading && <p>Caricamento…</p>}
          {runs.data && runs.data.length === 0 && (
            <p className="text-secondary mb-0">Nessun run registrato.</p>
          )}
          {runs.data && runs.data.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
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
