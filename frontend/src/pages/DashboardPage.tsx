import { Card, CardBody, CardTitle, CardText, Icon, Row, Col } from 'design-react-kit'
import { useHarvestRuns, useRunningInstances } from '../hooks/useHarvest'
import { useRepositories } from '../hooks/useRepositories'

interface StatCardProps {
  title: string
  value: string | number
  iconName: string
  loading?: boolean
}

function StatCard({ title, value, iconName, loading }: StatCardProps) {
  return (
    <Card className="shadow-sm h-100">
      <CardBody>
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary text-white rounded-circle p-3 d-flex align-items-center justify-content-center">
            <Icon icon={iconName} size="sm" color="white" />
          </div>
          <div>
            <CardText className="text-secondary text-uppercase small mb-1">{title}</CardText>
            <CardTitle tag="h3" className="mb-0">
              {loading ? '…' : value}
            </CardTitle>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function DashboardPage() {
  const repos = useRepositories()
  const runs = useHarvestRuns()
  const running = useRunningInstances()

  const totalRepos = repos.data?.length ?? 0
  const totalRuns = runs.data?.length ?? 0
  const inProgress = running.data?.length ?? 0
  const failedRuns =
    runs.data?.filter((r) => r.status === 'FAILURE').length ?? 0

  return (
    <section>
      <h1 className="mb-1">Dashboard</h1>
      <p className="text-secondary mb-4">Stato di salute dell'harvester NDC.</p>

      <Row className="g-3 mb-4">
        <Col md={6} lg={3}>
          <StatCard title="Repository censiti" value={totalRepos} iconName="it-folder" loading={repos.isLoading} />
        </Col>
        <Col md={6} lg={3}>
          <StatCard title="Run totali" value={totalRuns} iconName="it-files" loading={runs.isLoading} />
        </Col>
        <Col md={6} lg={3}>
          <StatCard title="In esecuzione" value={inProgress} iconName="it-refresh" loading={running.isLoading} />
        </Col>
        <Col md={6} lg={3}>
          <StatCard title="Run falliti" value={failedRuns} iconName="it-close-circle" loading={runs.isLoading} />
        </Col>
      </Row>

      <Card className="shadow-sm">
        <CardBody>
          <CardTitle tag="h5">Run recenti</CardTitle>
          {runs.isLoading && <p>Caricamento…</p>}
          {runs.isError && <p className="text-danger">Errore nel recupero dei run.</p>}
          {runs.data && runs.data.length === 0 && (
            <p className="text-secondary">Nessun run registrato.</p>
          )}
          {runs.data && runs.data.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Repository</th>
                    <th>Revisione</th>
                    <th>Stato</th>
                    <th>Iniziato</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.data.slice(0, 10).map((r) => (
                    <tr key={r.id}>
                      <td className="text-truncate" style={{ maxWidth: 280 }}>
                        {r.repositoryUrl ?? r.repositoryId}
                      </td>
                      <td><code>{r.revision ?? '-'}</code></td>
                      <td>
                        <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
                      </td>
                      <td>{new Date(r.startedAt).toLocaleString('it-IT')}</td>
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

function statusBadge(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return 'bg-success'
    case 'FAILURE':
      return 'bg-danger'
    case 'RUNNING':
      return 'bg-info'
    case 'PENDING':
      return 'bg-warning text-dark'
    case 'CANCELLED':
      return 'bg-secondary'
    default:
      return 'bg-light text-dark'
  }
}
