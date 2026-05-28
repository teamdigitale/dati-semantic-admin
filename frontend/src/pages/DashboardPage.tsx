import { Card, CardBody, CardTitle, CardText, Icon, Row, Col } from 'design-react-kit'
import { useHarvestRuns, useRunningInstances } from '../hooks/useHarvest'
import { useRepositories } from '../hooks/useRepositories'
import { useStatus } from '../hooks/useStatus'
import { useDashboardCount } from '../hooks/useDashboard'

interface StatCardProps {
  title: string
  value: string | number
  iconName: string
  loading?: boolean
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'info'
}

function StatCard({ title, value, iconName, loading, color = 'primary' }: StatCardProps) {
  return (
    <Card className="shadow-sm h-100">
      <CardBody>
        <div className="d-flex align-items-center gap-3">
          <div
            className={`bg-${color} text-white rounded-circle p-3 d-flex align-items-center justify-content-center`}
            style={{ width: 48, height: 48 }}
          >
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
  const status = useStatus()
  const repos = useRepositories()
  const runs = useHarvestRuns()
  const running = useRunningInstances()
  const countByStatus = useDashboardCount({ dimension: ['STATUS'] })

  const totalRepos = repos.data?.length ?? 0
  const inProgress = running.data?.length ?? 0
  const failedRuns = runs.data?.filter((r) => r.status === 'FAILURE').length ?? 0

  return (
    <section>
      <h1 className="mb-1">Dashboard</h1>
      <p className="text-secondary mb-4">Stato di salute dell'harvester NDC.</p>

      <Row className="g-3 mb-4">
        <Col md={6} lg={3}>
          <StatCard
            title="Stato BE"
            value={status.isError ? 'DOWN' : (status.data?.status ?? 'UP')}
            iconName={status.isError ? 'it-close-circle' : 'it-check-circle'}
            color={status.isError ? 'danger' : 'success'}
            loading={status.isLoading}
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Repository censiti"
            value={totalRepos}
            iconName="it-folder"
            loading={repos.isLoading}
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Run in esecuzione"
            value={inProgress}
            iconName="it-refresh"
            color={inProgress > 0 ? 'info' : 'primary'}
            loading={running.isLoading}
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Run falliti"
            value={failedRuns}
            iconName="it-close-circle"
            color={failedRuns > 0 ? 'danger' : 'primary'}
            loading={runs.isLoading}
          />
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <CardBody>
              <CardTitle tag="h5">Distribuzione per stato (catalogo)</CardTitle>
              <p className="text-secondary small mb-3">
                Da <code>/dashboard/aggregated-count-data</code> con dimensione <code>STATUS</code>.
              </p>
              {countByStatus.isLoading && <p>Caricamento…</p>}
              {countByStatus.isError && (
                <p className="text-danger mb-0">
                  Errore nel recupero delle statistiche aggregate.
                </p>
              )}
              {countByStatus.data && (
                <pre className="bg-light p-2 small mb-0" style={{ maxHeight: 240, overflow: 'auto' }}>
                  {JSON.stringify(countByStatus.data, null, 2)}
                </pre>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <CardBody>
              <CardTitle tag="h5">Run recenti</CardTitle>
              {runs.isLoading && <p>Caricamento…</p>}
              {runs.data && runs.data.length === 0 && (
                <p className="text-secondary mb-0">Nessun run registrato.</p>
              )}
              {runs.data && runs.data.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-hover table-sm mb-0">
                    <thead>
                      <tr>
                        <th>Repository</th>
                        <th>Stato</th>
                        <th>Iniziato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.data.slice(0, 8).map((r) => (
                        <tr key={r.id}>
                          <td className="text-truncate" style={{ maxWidth: 200 }}>
                            {r.repositoryUrl ?? r.repositoryId}
                          </td>
                          <td>
                            <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
                          </td>
                          <td className="small">
                            {new Date(r.startedAt).toLocaleString('it-IT')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
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
    case 'UNCHANGED':
      return 'bg-secondary'
    case 'NDC_ISSUES_PRESENT':
      return 'bg-warning text-dark'
    case 'ALREADY_RUNNING':
      return 'bg-warning text-dark'
    default:
      return 'bg-light text-dark'
  }
}
