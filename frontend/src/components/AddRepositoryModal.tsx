import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Badge, Button, Icon, Modal, ModalBody, ModalFooter, ModalHeader } from 'design-react-kit'
import { useCreateRepository } from '../hooks/useRepositories'
import { RepositoryService } from '../services/RepositoryService'
import type {
  AssetTypeDetection,
  AssetTypeLayout,
  CreateRepositoryRequest,
  RepositoryInspection,
} from '../api/types/repository'

interface AddRepositoryModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormState {
  owner: string
  repo: string
  branch: string
  name: string
  description: string
  maxFileSizeBytes: string
}

const EMPTY_FORM: FormState = {
  owner: '',
  repo: '',
  branch: '',
  name: '',
  description: '',
  maxFileSizeBytes: '',
}

/** Restrittivo come {@code RepoValidationController.GITHUB_NAME_PATTERN} sul BE. */
const GITHUB_NAME = /^[A-Za-z0-9._-]+$/

function composeUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`
}

export default function AddRepositoryModal({ isOpen, onClose }: AddRepositoryModalProps) {
  const create = useCreateRepository()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const inspect = useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      RepositoryService.inspect(composeUrl(owner, repo)),
  })

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM)
      setError(null)
      create.reset()
      inspect.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const update =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
      // Una modifica a owner/repo invalida un eventuale risultato di verifica precedente.
      if (key === 'owner' || key === 'repo') inspect.reset()
    }

  const ownerTrimmed = form.owner.trim()
  const repoTrimmed = form.repo.trim()
  const canVerify =
    GITHUB_NAME.test(ownerTrimmed) && GITHUB_NAME.test(repoTrimmed) && !inspect.isPending

  const handleVerify = () => {
    setError(null)
    if (!canVerify) {
      setError('Owner e repo: solo lettere, numeri, ".", "_", "-"')
      return
    }
    inspect.mutate({ owner: ownerTrimmed, repo: repoTrimmed })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!GITHUB_NAME.test(ownerTrimmed) || !GITHUB_NAME.test(repoTrimmed)) {
      setError('Owner e repo: solo lettere, numeri, ".", "_", "-"')
      return
    }
    const name = form.name.trim()
    if (!name) {
      setError('Il nome del repository è obbligatorio.')
      return
    }

    const body: CreateRepositoryRequest = {
      url: composeUrl(ownerTrimmed, repoTrimmed),
      name,
    }
    const branch = form.branch.trim()
    const description = form.description.trim()
    const maxFileSizeRaw = form.maxFileSizeBytes.trim()

    if (branch) body.branch = branch
    if (description) body.description = description
    if (maxFileSizeRaw) {
      const n = Number(maxFileSizeRaw)
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        setError('maxFileSizeBytes deve essere un intero non negativo.')
        return
      }
      body.maxFileSizeBytes = n
    }

    create.mutate(body, {
      onSuccess: () => onClose(),
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    })
  }

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" backdrop="static" centered>
      <form onSubmit={handleSubmit}>
        <ModalHeader toggle={onClose}>Aggiungi repository</ModalHeader>
        <ModalBody>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="add-repo-owner" className="form-label">
                Owner <span className="text-danger">*</span>
              </label>
              <input
                id="add-repo-owner"
                type="text"
                className="form-control"
                value={form.owner}
                onChange={update('owner')}
                placeholder="es. teamdigitale"
                required
                autoFocus
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="add-repo-repo" className="form-label">
                Repository <span className="text-danger">*</span>
              </label>
              <input
                id="add-repo-repo"
                type="text"
                className="form-control"
                value={form.repo}
                onChange={update('repo')}
                placeholder="es. dati-semantic-csv-apis"
                required
              />
            </div>
          </div>

          <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
            <Button
              type="button"
              color="secondary"
              outline
              size="xs"
              onClick={handleVerify}
              disabled={!canVerify}
            >
              <Icon icon="it-search" size="xs" className="me-1" />
              {inspect.isPending ? 'Verifica in corso…' : 'Verifica repository'}
            </Button>
            {inspect.data && <InspectResult result={inspect.data} />}
            {inspect.isError && (
              <span className="small text-danger">
                Errore: {(inspect.error as Error)?.message ?? 'sconosciuto'}
              </span>
            )}
          </div>

          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label htmlFor="add-repo-branch" className="form-label">
                Branch
              </label>
              <input
                id="add-repo-branch"
                type="text"
                className="form-control"
                value={form.branch}
                onChange={update('branch')}
                placeholder="main"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="add-repo-name" className="form-label">
                Nome <span className="text-danger">*</span>
              </label>
              <input
                id="add-repo-name"
                type="text"
                className="form-control"
                value={form.name}
                onChange={update('name')}
                placeholder="es. Repository INPS"
                required
              />
            </div>
          </div>

          <div className="mb-3 mt-3">
            <label htmlFor="add-repo-description" className="form-label">
              Descrizione
            </label>
            <textarea
              id="add-repo-description"
              className="form-control"
              rows={2}
              value={form.description}
              onChange={update('description')}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="add-repo-max-size" className="form-label">
              Dimensione massima file (byte)
            </label>
            <input
              id="add-repo-max-size"
              type="number"
              min={0}
              step={1}
              className="form-control"
              value={form.maxFileSizeBytes}
              onChange={update('maxFileSizeBytes')}
              placeholder="0 per default"
            />
          </div>

          {error && <p className="text-danger mb-0">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" outline onClick={onClose} disabled={create.isPending}>
            Annulla
          </Button>
          <Button color="primary" type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creazione…' : 'Crea repository'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

const LAYOUT_SUFFIX: Record<AssetTypeLayout, string> = {
  CURRENT: '',
  LEGACY: ' (legacy)',
  MIXED: ' (misto)',
}

function InspectResult({ result }: { result: RepositoryInspection }) {
  if (result.error) {
    return <span className="small text-danger">{result.error}</span>
  }
  if (!result.exists) {
    return (
      <Badge color="danger" pill style={{ fontSize: '0.7rem' }}>
        <Icon icon="it-close-circle" size="xs" color="white" className="me-1" />
        Non trovato o privato
      </Badge>
    )
  }
  const anyPresent = result.assetTypes.some((t) => t.present)
  return (
    <span className="d-inline-flex align-items-center gap-1 flex-wrap">
      <Badge color="success" pill style={{ fontSize: '0.7rem' }}>
        <Icon icon="it-check" size="xs" color="white" className="me-1" />
        Esiste, pubblico
      </Badge>
      {result.assetTypes.map((t) => (
        <AssetTypeBadge key={t.key} detection={t} />
      ))}
      {!anyPresent && (
        <span className="small text-danger ms-2">
          Non sembra un repository NDC: nessun tipo di asset rilevato.
        </span>
      )}
    </span>
  )
}

function AssetTypeBadge({ detection }: { detection: AssetTypeDetection }) {
  const color = detection.present ? 'success' : 'secondary'
  const suffix = detection.present && detection.layout ? LAYOUT_SUFFIX[detection.layout] : ''
  const title = detection.present
    ? `${detection.label}: ${detection.path}`
    : `${detection.label}: non presente`
  return (
    <Badge color={color} pill style={{ fontSize: '0.7rem' }} title={title}>
      <Icon
        icon={detection.present ? 'it-check' : 'it-close'}
        size="xs"
        color="white"
        className="me-1"
      />
      {detection.label}
      {suffix}
    </Badge>
  )
}
