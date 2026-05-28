import { useState } from 'react'
import { Button, Card, CardBody, Icon } from 'design-react-kit'
import { useRepositories, useDeleteRepository } from '../hooks/useRepositories'
import { useStartHarvestRepo } from '../hooks/useHarvest'
import { useRepoConfig } from '../hooks/useConfig'
import { useIsAdmin } from '../hooks/useHasRole'
import { RepositoryService } from '../services/RepositoryService'
import type { Repository } from '../api/types/repository'

export default function RepositoriesPage() {
  const repos = useRepositories()
  const startHarvest = useStartHarvestRepo()
  const remove = useDeleteRepository()
  const isAdmin = useIsAdmin()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="mb-1">Repository</h1>
          <p className="text-secondary mb-0">Repository censiti e harvestati periodicamente.</p>
        </div>
        {isAdmin && (
          <Button color="primary" disabled>
            <Icon icon="it-plus" size="sm" color="white" className="me-2" />
            Aggiungi repository
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardBody>
          {repos.isLoading && <p>Caricamento…</p>}
          {repos.isError && <p className="text-danger">Errore nel recupero dei repository.</p>}
          {repos.data && repos.data.length === 0 && (
            <p className="text-secondary">Nessun repository censito.</p>
          )}
          {repos.data && repos.data.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Nome</th>
                    <th>URL</th>
                    <th>Branch</th>
                    <th>Stato</th>
                    <th className="text-end">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {repos.data.map((r) => (
                    <RepoRow
                      key={r.id}
                      repo={r}
                      expanded={expandedId === r.id}
                      onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      isAdmin={isAdmin}
                      onHarvest={() => startHarvest.mutate({ repositoryId: r.id })}
                      harvestPending={startHarvest.isPending}
                      onDelete={() => {
                        if (confirm(`Eliminare il repository ${r.name ?? r.id}?`)) {
                          remove.mutate(r.id)
                        }
                      }}
                      deletePending={remove.isPending}
                    />
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

interface RepoRowProps {
  repo: Repository
  expanded: boolean
  onToggle: () => void
  isAdmin: boolean
  onHarvest: () => void
  harvestPending: boolean
  onDelete: () => void
  deletePending: boolean
}

function RepoRow({
  repo,
  expanded,
  onToggle,
  isAdmin,
  onHarvest,
  harvestPending,
  onDelete,
  deletePending,
}: RepoRowProps) {
  return (
    <>
      <tr>
        <td>
          <button
            type="button"
            className="btn btn-link p-0"
            aria-label={expanded ? 'Chiudi dettaglio' : 'Apri dettaglio'}
            onClick={onToggle}
          >
            <Icon icon={expanded ? 'it-chevron-top' : 'it-chevron-right'} size="sm" />
          </button>
        </td>
        <td>{repo.name ?? <span className="text-secondary">—</span>}</td>
        <td className="text-truncate" style={{ maxWidth: 320 }}>
          <a href={repo.url} target="_blank" rel="noreferrer">
            {repo.url}
          </a>
        </td>
        <td>
          <code>{repo.branch ?? 'main'}</code>
        </td>
        <td>
          {repo.active === false ? (
            <span className="badge bg-secondary">disattivo</span>
          ) : (
            <span className="badge bg-success">attivo</span>
          )}
        </td>
        <td className="text-end">
          {isAdmin && (
            <>
              <Button
                size="xs"
                color="primary"
                outline
                className="me-2"
                onClick={onHarvest}
                disabled={harvestPending}
              >
                <Icon icon="it-refresh" size="sm" className="me-1" />
                Harvest
              </Button>
              <Button size="xs" color="danger" outline onClick={onDelete} disabled={deletePending}>
                <Icon icon="it-delete" size="sm" />
              </Button>
            </>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-light p-3">
            <RepoDetail repoId={repo.id} />
          </td>
        </tr>
      )}
    </>
  )
}

function RepoDetail({ repoId }: { repoId: string }) {
  const config = useRepoConfig(repoId)
  const [report, setReport] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)

  const loadReport = async () => {
    setReport(null)
    setReportError(null)
    try {
      const r = await RepositoryService.validationReport(repoId)
      setReport(r)
    } catch (e) {
      setReportError(String(e))
    }
  }

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <h6>Config</h6>
        {config.isLoading && <p className="small text-secondary">Caricamento…</p>}
        {config.isError && <p className="small text-danger">Errore nel recupero della config.</p>}
        {config.data && Object.keys(config.data).length === 0 && (
          <p className="small text-secondary">Nessuna chiave di configurazione.</p>
        )}
        {config.data && Object.keys(config.data).length > 0 && (
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Chiave</th>
                <th>Valore</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(config.data).map(([k, v]) => (
                <tr key={k}>
                  <td>
                    <code>{k}</code>
                  </td>
                  <td>
                    <code>{JSON.stringify(v.value)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="col-md-6">
        <h6>Validation report</h6>
        <Button color="primary" outline size="xs" onClick={loadReport}>
          <Icon icon="it-download" size="sm" className="me-1" />
          Carica ultimo report
        </Button>
        {reportError && <p className="small text-danger mt-2 mb-0">{reportError}</p>}
        {report && (
          <pre
            className="bg-white border p-2 small mt-2 mb-0"
            style={{ maxHeight: 240, overflow: 'auto' }}
          >
            {report}
          </pre>
        )}
      </div>
    </div>
  )
}
