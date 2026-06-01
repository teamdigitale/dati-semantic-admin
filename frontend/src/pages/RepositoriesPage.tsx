import { useState } from 'react'
import { Button, Card, CardBody, Icon } from 'design-react-kit'
import AddRepositoryModal from '../components/AddRepositoryModal'
import RepoConfigModal from '../components/RepoConfigModal'
import RepoUrlLabel from '../components/RepoUrlLabel'
import ValidationReportModal from '../components/ValidationReportModal'
import { useRepositories, useDeleteRepository } from '../hooks/useRepositories'
import { useStartHarvestRepo } from '../hooks/useHarvest'
import { useIsAdmin } from '../hooks/useHasRole'
import type { Repository } from '../api/types/repository'

export default function RepositoriesPage() {
  const repos = useRepositories()
  const startHarvest = useStartHarvestRepo()
  const remove = useDeleteRepository()
  const isAdmin = useIsAdmin()
  const [addOpen, setAddOpen] = useState(false)
  const [configRepo, setConfigRepo] = useState<Repository | null>(null)
  const [validationRepo, setValidationRepo] = useState<Repository | null>(null)

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Repository</h1>
          <p className="admin-page-subtitle">Repository censiti e harvestati periodicamente.</p>
        </div>
        {isAdmin && (
          <Button color="primary" onClick={() => setAddOpen(true)}>
            <Icon icon="it-plus" size="sm" color="white" className="me-2" />
            Aggiungi repository
          </Button>
        )}
      </div>

      {isAdmin && <AddRepositoryModal isOpen={addOpen} onClose={() => setAddOpen(false)} />}
      <RepoConfigModal
        isOpen={configRepo !== null}
        onClose={() => setConfigRepo(null)}
        repo={configRepo}
        editable={isAdmin}
      />
      <ValidationReportModal
        isOpen={validationRepo !== null}
        onClose={() => setValidationRepo(null)}
        repoId={validationRepo?.id}
        repoName={validationRepo?.name ?? validationRepo?.url}
      />

      <Card className="admin-card">
        <CardBody className="admin-card-body">
          {repos.isLoading && <p>Caricamento…</p>}
          {repos.isError && (
            <p className="admin-empty text-danger">Errore nel recupero dei repository.</p>
          )}
          {repos.data && repos.data.length === 0 && (
            <p className="admin-empty">Nessun repository censito.</p>
          )}
          {repos.data && repos.data.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle admin-table">
                <thead>
                  <tr>
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
                      isAdmin={isAdmin}
                      onConfig={() => setConfigRepo(r)}
                      onValidation={() => setValidationRepo(r)}
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
  isAdmin: boolean
  onConfig: () => void
  onValidation: () => void
  onHarvest: () => void
  harvestPending: boolean
  onDelete: () => void
  deletePending: boolean
}

function RepoRow({
  repo,
  isAdmin,
  onConfig,
  onValidation,
  onHarvest,
  harvestPending,
  onDelete,
  deletePending,
}: RepoRowProps) {
  return (
    <tr>
      <td>{repo.name ?? <span className="text-secondary">—</span>}</td>
      <td>
        <RepoUrlLabel url={repo.url} />
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
        <div className="d-inline-flex gap-1">
          <Button
            size="xs"
            color="secondary"
            outline
            title="Configurazione repository"
            aria-label="Configurazione repository"
            onClick={onConfig}
          >
            <Icon icon="it-settings" size="sm" />
          </Button>
          <Button
            size="xs"
            color="secondary"
            outline
            title="Ultimo validation report"
            aria-label="Ultimo validation report"
            onClick={onValidation}
          >
            <Icon icon="it-file" size="sm" />
          </Button>
          {isAdmin && (
            <>
              <Button
                size="xs"
                color="primary"
                outline
                title="Avvia harvest"
                aria-label="Avvia harvest"
                onClick={onHarvest}
                disabled={harvestPending}
              >
                <Icon icon="it-refresh" size="sm" />
              </Button>
              <Button
                size="xs"
                color="danger"
                outline
                title="Elimina repository"
                aria-label="Elimina repository"
                onClick={onDelete}
                disabled={deletePending}
              >
                <Icon icon="it-delete" size="sm" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
