import { Badge, Card, CardBody, CardTitle, CardText, Icon, Row, Col } from 'design-react-kit'
import { useHarvestRuns, useRunningInstances } from '../hooks/useHarvest'
import { useRepositories } from '../hooks/useRepositories'
import { useStatus } from '../hooks/useStatus'
import { useDashboardCount } from '../hooks/useDashboard'
import RepoUrlLabel from '../components/RepoUrlLabel'
import type { AggregateDashboardResponse } from '../api/types/dashboard'

interface StatCardProps {
  title: string
  value: string | number
  iconName: string
  loading?: boolean
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'info'
}

function StatCard({ title, value, iconName, loading, color = 'primary' }: StatCardProps) {
  return (
    <Card className="admin-stat-card h-100">
      <CardBody className="admin-card-body">
        <div className="admin-stat-content">
          <div className={`admin-stat-icon bg-${color}`}>
            <Icon icon={iconName} size="sm" color="white" />
          </div>
          <div className="admin-stat-copy">
            <CardText className="admin-stat-label">{title}</CardText>
            <CardTitle tag="h3" className="admin-stat-value">
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
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Stato di salute dell'harvester NDC.</p>
        </div>
      </div>

      <Row className="g-4 mb-4">
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

      <Row className="g-4">
        <Col lg={6}>
          <Card className="admin-card h-100">
            <CardBody className="admin-card-body">
              <CardTitle tag="h5" className="admin-card-title">
                Distribuzione per stato
              </CardTitle>
              {countByStatus.isLoading && <p className="small text-secondary mb-0">Caricamento…</p>}
              {countByStatus.isError && (
                <p className="text-danger mb-0">Errore nel recupero delle statistiche aggregate.</p>
              )}
              {countByStatus.data && <StatusDistributionList data={countByStatus.data} />}
            </CardBody>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="admin-card h-100">
            <CardBody className="admin-card-body">
              <CardTitle tag="h5" className="admin-card-title">
                Run recenti
              </CardTitle>
              {runs.isLoading && <p>Caricamento…</p>}
              {runs.data && runs.data.length === 0 && (
                <p className="text-secondary mb-0">Nessun run registrato.</p>
              )}
              {runs.data && runs.data.length > 0 && (
                <div className="table-responsive">
                  <table className="admin-table table table-hover table-sm mb-0">
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
                          <td>
                            {r.repositoryUrl ? (
                              <RepoUrlLabel url={r.repositoryUrl} />
                            ) : (
                              <code className="small">{r.repositoryId}</code>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${statusBadge(r.status)}`}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="small">{new Date(r.startedAt).toLocaleString('it-IT')}</td>
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

/**
 * Stato semantico calcolato dal BE in SemanticContentStats.getStatusType().
 * Non e' un enum formale, e' logica hardcoded: lo trattiamo come stringa
 * opaca e stiliamo solo i valori noti, gli altri ricadono sul default.
 */
const SEMANTIC_STATUS_STYLE: Record<
  string,
  { color: string; icon: string; pill?: boolean }
> = {
  Stabile: { color: 'success', icon: 'it-check-circle' },
  Bozza: { color: 'warning', icon: 'it-pencil' },
  Archiviato: { color: 'secondary', icon: 'it-folder' },
  'Accesso Ristretto': { color: 'info', icon: 'it-lock' },
  unknown: { color: 'light', icon: 'it-help-circle' },
}

function SemanticStatusBadge({ status }: { status: string }) {
  const style = SEMANTIC_STATUS_STYLE[status] ?? { color: 'light', icon: 'it-help-circle' }
  // I badge "light" hanno contrasto basso: forziamo il testo scuro.
  const className = style.color === 'light' ? 'text-dark' : ''
  const iconColor = style.color === 'light' ? undefined : 'white'
  return (
    <Badge color={style.color} pill className={className}>
      <Icon icon={style.icon} size="xs" color={iconColor} className="me-1" />
      {status}
    </Badge>
  )
}

/**
 * Distribuzione status: per ogni anno mostra totale annuo + un'inline list di
 * badge per ciascun status con il rispettivo conteggio.
 * Filtra fuori gli anni a zero (rumore) e ordina per anno decrescente.
 *
 * La response del BE per dimension=STATUS ha colonne [DATE, STATUS, VAUE]
 * (l'header "VAUE" e' un typo intenzionalmente lasciato sul BE per back-compat,
 * vedi memory project_dashboard_vaue_typo).
 */
function StatusDistributionList({ data }: { data: AggregateDashboardResponse }) {
  const dateIdx = data.headers.findIndex((h) => h.toUpperCase() === 'DATE')
  const statusIdx = data.headers.findIndex((h) => h.toUpperCase() === 'STATUS')
  const countIdx = data.headers.findIndex(
    (_, i) => i !== dateIdx && i !== statusIdx,
  )

  if (!data.rows || data.rows.length === 0 || dateIdx === -1 || statusIdx === -1 || countIdx === -1) {
    return <p className="small text-secondary mb-0">Nessun dato disponibile.</p>
  }

  const grouped = new Map<string, Array<{ status: string; count: number }>>()
  for (const row of data.rows) {
    const year = String(row[dateIdx])
    const status = String(row[statusIdx])
    const count = Number(row[countIdx]) || 0
    const arr = grouped.get(year) ?? []
    arr.push({ status, count })
    grouped.set(year, arr)
  }

  const groups = Array.from(grouped.entries())
    .map(([year, items]) => ({
      year,
      items,
      total: items.reduce((a, b) => a + b.count, 0),
    }))
    .sort((a, b) => b.year.localeCompare(a.year))

  if (groups.length === 0) {
    return <p className="small text-secondary mb-0">Nessun dato disponibile.</p>
  }

  return (
    <ul className="list-unstyled mb-0">
      {groups.map((g, idx) => (
        <li
          key={g.year}
          className={`py-2 ${idx < groups.length - 1 ? 'border-bottom' : ''}`}
        >
          <div className="d-flex justify-content-between align-items-baseline mb-1">
            <span className="fw-semibold">{g.year}</span>
            <span className="small text-secondary">
              {g.total.toLocaleString('it-IT')} totali
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {g.items.map((it) => (
              <span
                key={it.status}
                className="d-inline-flex align-items-center gap-1 small"
              >
                <SemanticStatusBadge status={it.status} />
                <span className="text-secondary">{it.count.toLocaleString('it-IT')}</span>
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}
