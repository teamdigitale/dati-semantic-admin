import { Button, Card, CardBody, Icon } from 'design-react-kit'
import { useRepositories, useDeleteRepository } from '../hooks/useRepositories'
import { useStartHarvestRepo } from '../hooks/useHarvest'
import { useIsAdmin } from '../hooks/useHasRole'

export default function RepositoriesPage() {
  const repos = useRepositories()
  const startHarvest = useStartHarvestRepo()
  const remove = useDeleteRepository()
  const isAdmin = useIsAdmin()

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
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
                    <th>Nome</th>
                    <th>URL</th>
                    <th>Branch</th>
                    {isAdmin && <th className="text-end">Azioni</th>}
                  </tr>
                </thead>
                <tbody>
                  {repos.data.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name ?? <span className="text-secondary">—</span>}</td>
                      <td className="text-truncate" style={{ maxWidth: 360 }}>
                        <a href={r.url} target="_blank" rel="noreferrer">
                          {r.url}
                        </a>
                      </td>
                      <td>
                        <code>{r.branch ?? 'main'}</code>
                      </td>
                      {isAdmin && (
                        <td className="text-end">
                          <Button
                            size="xs"
                            color="primary"
                            outline
                            className="me-2"
                            onClick={() => startHarvest.mutate({ repositoryId: r.id })}
                            disabled={startHarvest.isPending}
                          >
                            <Icon icon="it-refresh" size="sm" className="me-1" />
                            Harvest
                          </Button>
                          <Button
                            size="xs"
                            color="danger"
                            outline
                            onClick={() => {
                              if (confirm(`Eliminare il repository ${r.name ?? r.id}?`)) {
                                remove.mutate(r.id)
                              }
                            }}
                            disabled={remove.isPending}
                          >
                            <Icon icon="it-delete" size="sm" />
                          </Button>
                        </td>
                      )}
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
