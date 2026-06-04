import { Card, CardBody, CardText, CardTitle, Icon } from 'design-react-kit'

interface Props {
  title: string
  value: number | null
  previous?: number | null
  iconName: string
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'info'
  loading?: boolean
  /** Etichetta del periodo di confronto (default: "rispetto all'anno precedente"). */
  comparisonLabel?: string
}

/**
 * Card KPI ispirata alla dashboard pubblica wp-ndc:
 * valore corrente + delta assoluto e percentuale vs periodo precedente.
 * Il segno e il colore del delta si calcolano qui dentro.
 */
export default function KpiCard({
  title,
  value,
  previous,
  iconName,
  color = 'primary',
  loading,
  comparisonLabel = "rispetto all'anno precedente",
}: Props) {
  const delta = computeDelta(value, previous)
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
              {loading ? '…' : (value?.toLocaleString('it-IT') ?? '—')}
            </CardTitle>
            {delta && (
              <p className={`admin-kpi-delta admin-kpi-delta-${delta.direction} small mb-0 mt-1`}>
                <span className="admin-kpi-delta-value">
                  {delta.signedAbs}
                  {delta.signedPct && ` (${delta.signedPct})`}
                </span>{' '}
                <span className="text-secondary">{comparisonLabel}</span>
              </p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

interface DeltaInfo {
  direction: 'up' | 'down' | 'flat'
  signedAbs: string
  signedPct: string
}

function computeDelta(
  current: number | null | undefined,
  previous: number | null | undefined
): DeltaInfo | null {
  if (current == null || previous == null) return null
  const diff = current - previous
  const direction: DeltaInfo['direction'] = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
  const sign = diff > 0 ? '+' : ''
  // Da 0: la percentuale non e' definita; usiamo l'etichetta "nuovo" se
  // current > 0, altrimenti omettiamo del tutto la parentesi.
  const fromZero = previous === 0
  const pct = fromZero ? null : (diff / previous) * 100
  let signedPct: string
  if (pct != null) signedPct = `${sign}${pct.toFixed(1)}%`
  else if (current && current > 0) signedPct = 'nuovo'
  else signedPct = ''
  return {
    direction,
    signedAbs: `${sign}${diff.toLocaleString('it-IT')}`,
    signedPct,
  }
}
