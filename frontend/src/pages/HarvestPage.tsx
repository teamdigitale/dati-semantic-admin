import { useEffect, useMemo, useReducer, useState } from 'react'
import { Badge, Button, Card, CardBody, Icon, Row, Col, Spinner } from 'design-react-kit'
import {
  useCancelPendingHarvests,
  useHarvestRunsByBatch,
  useRunningInstances,
  useStartHarvestAll,
} from '../hooks/useHarvest'
import { useRepositories } from '../hooks/useRepositories'
import { useIsAdmin } from '../hooks/useHasRole'
import RepoUrlLabel from '../components/RepoUrlLabel'
import type { HarvesterRun, HarvesterRunStatus, RunningInstance } from '../api/types/harvest'

/** Quanti batch (correlation_id) mostriamo per pagina nello Storico. */
const PAGE_SIZE = 10
const COMPACT_BADGE: React.CSSProperties = { fontSize: '0.7rem' }
/** Per quanti polling tick teniamo visibile in elenco un job terminato. */
const FINISHED_GRACE_TICKS = 2
/** Frequenza polling del backend per "in esecuzione" e "storico" mentre c'e' attivita'. */
const POLL_MS = 5_000

export default function HarvestPage() {
  const running = useRunningInstances(POLL_MS)
  const repositories = useRepositories()
  const startAll = useStartHarvestAll()
  const cancelAll = useCancelPendingHarvests()
  const isAdmin = useIsAdmin()
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const repoNameById = useMemo(() => {
    const map = new Map<string, string>()
    repositories.data?.forEach((r) => {
      if (r.name && r.name.trim()) map.set(r.id, r.name.trim())
      else map.set(r.id, r.url)
    })
    return map
  }, [repositories.data])

  const displayed = useDisplayedRunning(running.data)
  const hasActivity = displayed.length > 0
  // Convenzione N+1: avanziamo l'offset di PAGE_SIZE per ogni pagina, ma
  // chiediamo PAGE_SIZE+1 batch al BE per dedurre hasNext dal risultato.
  const runs = useHarvestRunsByBatch(page * PAGE_SIZE, PAGE_SIZE + 1, hasActivity ? POLL_MS : false)

  const groups = useMemo(() => groupRuns(runs.data ?? []), [runs.data])
  const hasNext = groups.length > PAGE_SIZE
  const pagedGroups = hasNext ? groups.slice(0, PAGE_SIZE) : groups
  const totalRunsOnPage = useMemo(
    () => pagedGroups.reduce((acc, g) => acc + g.runs.length, 0),
    [pagedGroups]
  )

  const toggleExpanded = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Harvest</h1>
          <p className="admin-page-subtitle">Gestione dei job di harvesting.</p>
        </div>
        {isAdmin && (
          <div className="admin-actions d-flex flex-wrap gap-2">
            <Button
              color="primary"
              onClick={() => startAll.mutate(false)}
              disabled={startAll.isPending}
            >
              <Icon icon="it-refresh" size="sm" color="white" className="me-2" />
              Avvia tutto
            </Button>
            <Button
              color="warning"
              onClick={() => {
                if (
                  confirm(
                    "Avviare l'harvest di tutti i repository con force=true?\n" +
                      "Saranno rieseguiti anche i run gia' processati con la stessa revision."
                  )
                ) {
                  startAll.mutate(true)
                }
              }}
              disabled={startAll.isPending}
            >
              <Icon icon="it-warning-circle" size="sm" className="me-2" />
              Avvia tutto (force)
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
        <Col md={12}>
          <Card className="admin-card h-100">
            <CardBody className="admin-card-body">
              <h2 className="admin-card-title">In esecuzione</h2>
              {running.isLoading && displayed.length === 0 && (
                <p className="small text-secondary mb-0">Caricamento…</p>
              )}
              {!running.isLoading && displayed.length === 0 && (
                <p className="admin-empty mb-0">Nessun job in esecuzione.</p>
              )}
              {displayed.length > 0 && (
                <RunningTable items={displayed} repoNameById={repoNameById} />
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card className="admin-card">
        <CardBody className="admin-card-body">
          <div className="d-flex justify-content-between align-items-baseline mb-2">
            <h2 className="admin-card-title mb-0">Storico run</h2>
            {pagedGroups.length > 0 && (
              <span className="small text-secondary">
                {pagedGroups.length} batch in pagina · {totalRunsOnPage} run
              </span>
            )}
          </div>
          {runs.isLoading && <p className="small text-secondary mb-0">Caricamento…</p>}
          {runs.data && runs.data.length === 0 && (
            <p className="admin-empty mb-0">Nessun run registrato.</p>
          )}
          {pagedGroups.length > 0 && (
            <>
              <div className="table-responsive">
                <table className="table table-hover table-sm small mb-0 admin-table align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }} />
                      <th>Avvio</th>
                      <th>Fine</th>
                      <th style={{ width: 110 }}>Durata</th>
                      <th style={{ width: 80 }} className="text-end">
                        Run
                      </th>
                      <th style={{ width: 200 }}>Esito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedGroups.map((g) => (
                      <BatchRow
                        key={g.key}
                        group={g}
                        expanded={expanded.has(g.key)}
                        onToggle={() => toggleExpanded(g.key)}
                        repoNameById={repoNameById}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {(page > 0 || hasNext) && (
                <Pagination
                  page={page}
                  hasNext={hasNext}
                  onPrev={() => setPage((p) => Math.max(0, p - 1))}
                  onNext={() => setPage((p) => p + 1)}
                />
              )}
            </>
          )}
        </CardBody>
      </Card>
    </section>
  )
}

// ------------------------------------------------------------------------------------
// In esecuzione: stato locale che tiene in lista anche i job appena terminati,
// con durata aggiornata in tempo reale (sui running) o congelata (sui terminati).
// ------------------------------------------------------------------------------------

interface DisplayedRunningItem {
  id: string
  run: HarvesterRun
  threadName: string
  pollsAfterFinish?: number
  frozenEndMs?: number
}

function reconcileDisplayed(
  prev: DisplayedRunningItem[],
  fresh: RunningInstance[]
): DisplayedRunningItem[] {
  const freshIds = new Set(fresh.map((r) => r.harvesterRun.id))
  const next: DisplayedRunningItem[] = []
  for (const r of fresh) {
    next.push({
      id: r.harvesterRun.id,
      run: r.harvesterRun,
      threadName: r.threadName,
    })
  }
  for (const prevItem of prev) {
    if (freshIds.has(prevItem.id)) continue
    if (prevItem.pollsAfterFinish === undefined) {
      next.push({ ...prevItem, pollsAfterFinish: 0, frozenEndMs: Date.now() })
    } else if (prevItem.pollsAfterFinish < FINISHED_GRACE_TICKS) {
      next.push({ ...prevItem, pollsAfterFinish: prevItem.pollsAfterFinish + 1 })
    }
  }
  return next
}

function useDisplayedRunning(running: RunningInstance[] | undefined): DisplayedRunningItem[] {
  const [items, setItems] = useState<DisplayedRunningItem[]>([])
  useEffect(() => {
    if (running === undefined) return
    setItems((prev) => reconcileDisplayed(prev, running))
  }, [running])
  return items
}

function useTick(intervalMs: number): number {
  const [tick, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const id = setInterval(bump, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return tick
}

function RunningTable({
  items,
  repoNameById,
}: {
  items: DisplayedRunningItem[]
  repoNameById: Map<string, string>
}) {
  useTick(1_000)
  return (
    <div className="table-responsive">
      <table className="admin-table table table-sm small mb-0 align-middle">
        <thead>
          <tr>
            <th style={{ width: 40 }} />
            <th>Repository</th>
            <th style={{ width: 120 }}>Durata</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const finished = item.pollsAfterFinish !== undefined
            const startMs = new Date(item.run.startedAt).getTime()
            const endMs = item.frozenEndMs ?? Date.now()
            const elapsedMs = Math.max(0, endMs - startMs)
            return (
              <tr key={item.id} className={finished ? 'text-secondary' : undefined}>
                <td>
                  {finished ? (
                    <Icon icon="it-check-circle" size="sm" color="success" />
                  ) : (
                    <Spinner active small label="In esecuzione" />
                  )}
                </td>
                <td>
                  <RepoLabel run={item.run} repoNameById={repoNameById} />
                </td>
                <td>
                  <code>{formatDuration(elapsedMs)}</code>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Cella "Repository" usata sia in "In esecuzione" sia nei dettagli dello
 * Storico run. Preferisce il nome configurato sul repo (piu' human-friendly);
 * se il run e' di un repo cancellato dalla configurazione, fallback su
 * {@link RepoUrlLabel} con la URL GitHub; ultimo fallback id raw.
 */
function RepoLabel({
  run,
  repoNameById,
}: {
  run: HarvesterRun
  repoNameById: Map<string, string>
}) {
  const name = repoNameById.get(run.repositoryId)
  if (name) {
    return (
      <span
        className="text-truncate d-inline-block"
        style={{ maxWidth: 320 }}
        title={run.repositoryUrl ?? run.repositoryId}
      >
        {name}
      </span>
    )
  }
  if (run.repositoryUrl) {
    return <RepoUrlLabel url={run.repositoryUrl} />
  }
  return <code className="small">{run.repositoryId}</code>
}

function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

// ------------------------------------------------------------------------------------
// Storico run: raggruppato per correlationId (fallback su run.id se assente)
// ------------------------------------------------------------------------------------

type BatchOutcome = 'green' | 'yellow' | 'red' | 'running'

interface RunGroup {
  key: string
  runs: HarvesterRun[]
  startedAt: string
  endedAt: string | null
  hasRunning: boolean
  failedCount: number
  outcome: BatchOutcome
}

function groupRuns(runs: HarvesterRun[]): RunGroup[] {
  const map = new Map<string, HarvesterRun[]>()
  for (const r of runs) {
    // Fallback difensivo: in DB CORRELATION_ID e' NOT NULL dalla V2, ma il tipo
    // TS lo ha opzionale e in scenari non-standard (insert manuali, future migration)
    // potrebbe essere assente. In tal caso ogni run forma un batch da 1.
    const key = r.correlationId && r.correlationId.length > 0 ? r.correlationId : r.id
    const arr = map.get(key) ?? []
    arr.push(r)
    map.set(key, arr)
  }
  const groups: RunGroup[] = []
  for (const [key, runs] of map.entries()) {
    let minStart = runs[0].startedAt
    let maxEnd: string | null = runs[0].endedAt ?? null
    let hasRunning = false
    let failedCount = 0
    for (const r of runs) {
      if (new Date(r.startedAt).getTime() < new Date(minStart).getTime()) minStart = r.startedAt
      if (!r.endedAt || r.status === 'RUNNING') {
        hasRunning = true
      } else if (maxEnd === null || new Date(r.endedAt).getTime() > new Date(maxEnd).getTime()) {
        maxEnd = r.endedAt
      }
      if (r.status === 'FAILURE') failedCount += 1
    }
    let outcome: BatchOutcome
    if (hasRunning) outcome = 'running'
    else if (failedCount === runs.length) outcome = 'red'
    else if (failedCount > 0) outcome = 'yellow'
    else outcome = 'green'

    groups.push({
      key,
      runs,
      startedAt: minStart,
      endedAt: hasRunning ? null : maxEnd,
      hasRunning,
      failedCount,
      outcome,
    })
  }
  // piu' recenti in cima
  groups.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  return groups
}

function BatchRow({
  group,
  expanded,
  onToggle,
  repoNameById,
}: {
  group: RunGroup
  expanded: boolean
  onToggle: () => void
  repoNameById: Map<string, string>
}) {
  // Durata del batch: dal piu' vecchio start al piu' recente end. Se ancora
  // in corso (almeno un run non terminato) mostriamo "—".
  const startMs = new Date(group.startedAt).getTime()
  const endMs = group.endedAt ? new Date(group.endedAt).getTime() : null
  const durationText = endMs !== null ? formatDuration(endMs - startMs) : null

  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }} aria-expanded={expanded}>
        <td>
          <Icon icon={expanded ? 'it-arrow-down' : 'it-chevron-right'} size="xs" />
        </td>
        <td>{new Date(group.startedAt).toLocaleString('it-IT')}</td>
        <td>
          {group.endedAt ? (
            new Date(group.endedAt).toLocaleString('it-IT')
          ) : (
            <span className="text-secondary">—</span>
          )}
        </td>
        <td>
          {durationText ? <code>{durationText}</code> : <span className="text-secondary">—</span>}
        </td>
        <td className="text-end">{group.runs.length}</td>
        <td>
          <BatchOutcomeBadge group={group} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="admin-expanded-cell bg-light">
            <BatchDetail runs={group.runs} repoNameById={repoNameById} />
          </td>
        </tr>
      )}
    </>
  )
}

function BatchOutcomeBadge({ group }: { group: RunGroup }) {
  const { outcome, failedCount, runs } = group
  if (outcome === 'running') {
    return (
      <Badge color="info" pill className="text-uppercase" style={COMPACT_BADGE}>
        <Icon icon="it-refresh" size="xs" color="white" className="me-1" />
        In corso
      </Badge>
    )
  }
  if (outcome === 'green') {
    return (
      <Badge color="success" pill className="text-uppercase" style={COMPACT_BADGE}>
        <Icon icon="it-check-circle" size="xs" color="white" className="me-1" />
        Completato
      </Badge>
    )
  }
  if (outcome === 'yellow') {
    return (
      <Badge color="warning" pill className="text-uppercase" style={COMPACT_BADGE}>
        <Icon icon="it-warning-circle" size="xs" color="white" className="me-1" />
        Parziale ({failedCount}/{runs.length} failed)
      </Badge>
    )
  }
  return (
    <Badge color="danger" pill className="text-uppercase" style={COMPACT_BADGE}>
      <Icon icon="it-close-circle" size="xs" color="white" className="me-1" />
      Fallito
    </Badge>
  )
}

function BatchDetail({
  runs,
  repoNameById,
}: {
  runs: HarvesterRun[]
  repoNameById: Map<string, string>
}) {
  return (
    <div className="table-responsive p-2">
      <table className="admin-table table table-sm small mb-0 align-middle">
        <thead>
          <tr>
            <th>Repository</th>
            <th style={{ width: 160 }}>Stato</th>
            <th>Inizio</th>
            <th>Fine</th>
            <th style={{ width: 110 }}>Durata</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const startMs = new Date(r.startedAt).getTime()
            const endMs = r.endedAt ? new Date(r.endedAt).getTime() : null
            const duration =
              endMs !== null ? (
                formatDuration(endMs - startMs)
              ) : (
                <span className="text-secondary">—</span>
              )
            return (
              <tr key={r.id}>
                <td>
                  <RepoLabel run={r} repoNameById={repoNameById} />
                </td>
                <td>
                  <RunStatusBadge status={r.status} />
                </td>
                <td>{new Date(r.startedAt).toLocaleString('it-IT')}</td>
                <td>{r.endedAt ? new Date(r.endedAt).toLocaleString('it-IT') : '—'}</td>
                <td>
                  <code>{duration}</code>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const STATUS_STYLE: Record<HarvesterRunStatus, { color: string; icon: string }> = {
  SUCCESS: { color: 'success', icon: 'it-check-circle' },
  FAILURE: { color: 'danger', icon: 'it-close-circle' },
  RUNNING: { color: 'info', icon: 'it-refresh' },
  UNCHANGED: { color: 'secondary', icon: 'it-minus-circle' },
  ALREADY_RUNNING: { color: 'warning', icon: 'it-warning-circle' },
  NDC_ISSUES_PRESENT: { color: 'warning', icon: 'it-warning-circle' },
}

function RunStatusBadge({ status }: { status: HarvesterRunStatus }) {
  const style = STATUS_STYLE[status] ?? { color: 'secondary', icon: 'it-help-circle' }
  return (
    <Badge color={style.color} pill className="text-uppercase" style={COMPACT_BADGE}>
      <Icon icon={style.icon} size="xs" color="white" className="me-1" />
      {status}
    </Badge>
  )
}

function Pagination({
  page,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <nav
      className="d-flex justify-content-end align-items-center gap-2 mt-2"
      aria-label="Paginazione"
    >
      <Button color="secondary" outline size="xs" onClick={onPrev} disabled={page === 0}>
        <Icon icon="it-chevron-left" size="xs" className="me-1" />
        Precedente
      </Button>
      <span className="small text-secondary">Pagina {page + 1}</span>
      <Button color="secondary" outline size="xs" onClick={onNext} disabled={!hasNext}>
        Successiva
        <Icon icon="it-chevron-right" size="xs" className="ms-1" />
      </Button>
    </nav>
  )
}
