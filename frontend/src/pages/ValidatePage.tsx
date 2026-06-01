import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Icon,
  Input,
  Row,
  Col,
  Spinner,
} from 'design-react-kit'
import { useMutation } from '@tanstack/react-query'
import { ValidationService } from '../services/ValidationService'
import ValidationReportModal from '../components/ValidationReportModal'
import { isTerminal, useValidationJobPolling } from '../hooks/useValidation'
import type { ValidationJobStatus } from '../api/types/validation'

export default function ValidatePage() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Validate</h1>
          <p className="admin-page-subtitle">
            Strumenti di validazione on-demand: conformance di un repository GitHub, validazione
            sintattica RDF di un file, polling dello stato di un job.
          </p>
        </div>
      </div>

      <div className="alert alert-warning d-flex align-items-start gap-2 mb-4" role="status">
        <Icon icon="it-info-circle" size="sm" className="mt-1" />
        <div>
          <strong>Risultati effimeri.</strong> I job di validazione vengono mantenuti in memoria sul
          backend e vengono <strong>eliminati automaticamente dopo 30 minuti</strong> dall'ultima
          interrogazione. Se servono in modo persistente esportali (bottone "Copia JSON" nel report)
          prima di chiudere la pagina.
        </div>
      </div>

      <Row className="g-4">
        <Col lg={6}>
          <RepoCheckCard />
        </Col>
        <Col lg={6}>
          <SyntaxCheckCard />
        </Col>
      </Row>
    </section>
  )
}

function RepoCheckCard() {
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [revision, setRevision] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const submit = useMutation({
    mutationFn: () => ValidationService.submitRepo(owner, repo, revision || undefined),
    onSuccess: (data) => setJobId(data.validationId),
  })

  const job = useValidationJobPolling(jobId)
  const status: ValidationJobStatus | undefined = job.data?.status
  const terminal = isTerminal(status)
  const hasReport = terminal && status === 'COMPLETED' && !!job.data?.report

  const reset = () => {
    setJobId(null)
    submit.reset()
    job.refetch().catch(() => {
      /* il refetch non parte se enabled=false dopo reset; ignoriamo */
    })
  }

  const subjectLabel = `${owner}/${repo}${revision ? `@${revision}` : ''}`

  return (
    <Card className="admin-card h-100">
      <CardBody className="admin-card-body">
        <CardTitle tag="h5" className="admin-card-title">
          <Icon icon="it-github" size="sm" />
          Conformance check repository
        </CardTitle>
        <p className="admin-card-hint">
          Valida un repository GitHub contro il template cookiecutter NDC.
        </p>
        <Row className="g-2">
          <Col md={6}>
            <Input
              type="text"
              label="Owner"
              id="owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="teamdigitale"
              disabled={!!jobId && !terminal}
            />
          </Col>
          <Col md={6}>
            <Input
              type="text"
              label="Repository"
              id="repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="dati-semantic-csv-apis"
              disabled={!!jobId && !terminal}
            />
          </Col>
          <Col md={6}>
            <Input
              type="text"
              label="Revisione (opzionale)"
              id="revision"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="main / sha / tag"
              disabled={!!jobId && !terminal}
            />
          </Col>
        </Row>
        <div className="mt-3 d-flex gap-2 flex-wrap">
          <Button
            color="primary"
            disabled={!owner || !repo || submit.isPending || (!!jobId && !terminal)}
            onClick={() => submit.mutate()}
          >
            <Icon icon="it-check-circle" size="sm" color="white" className="me-2" />
            {submit.isPending
              ? 'Invio…'
              : terminal
                ? 'Avvia nuova validazione'
                : 'Avvia validazione'}
          </Button>
          {jobId && (
            <Button color="secondary" outline onClick={reset} disabled={!terminal}>
              <Icon icon="it-close" size="sm" className="me-2" />
              Reset
            </Button>
          )}
        </div>
        {submit.isError && (
          <p className="text-danger mt-3 mb-0">
            Errore avvio: {(submit.error as Error)?.message ?? 'sconosciuto'}
          </p>
        )}
        {jobId && (
          <JobProgressBox
            jobId={jobId}
            status={status}
            terminal={terminal}
            hasReport={hasReport}
            errorMessage={job.data?.errorMessage}
            queryError={job.error}
            onOpenReport={() => setReportOpen(true)}
          />
        )}
      </CardBody>
      {hasReport && job.data?.report && (
        <ValidationReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          report={job.data.report}
          title={subjectLabel}
        />
      )}
    </Card>
  )
}

function errorMessageOf(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'sconosciuto'
  }
}

const JOB_STATUS_STYLE: Record<ValidationJobStatus, { color: string; label: string }> = {
  PENDING: { color: 'secondary', label: 'In coda' },
  CLONING: { color: 'info', label: 'Cloning' },
  DISCOVERING: { color: 'info', label: 'Discovering' },
  VALIDATING: { color: 'info', label: 'Validating' },
  COMPLETED: { color: 'success', label: 'Completato' },
  FAILED: { color: 'danger', label: 'Fallito' },
}

function JobProgressBox({
  jobId,
  status,
  terminal,
  hasReport,
  errorMessage,
  queryError,
  onOpenReport,
}: {
  jobId: string
  status: ValidationJobStatus | undefined
  terminal: boolean
  hasReport: boolean
  errorMessage?: string
  queryError: unknown
  onOpenReport: () => void
}) {
  const effectiveStatus = status ?? 'PENDING'
  // Fallback difensivo: se in futuro il BE aggiunge nuovi stati non riconosciuti,
  // mostriamo il nome raw invece che far crashare il render.
  const style = JOB_STATUS_STYLE[effectiveStatus] ?? {
    color: 'secondary',
    label: effectiveStatus,
  }
  const alertClass = terminal ? (hasReport ? 'alert-success' : 'alert-danger') : 'alert-info'

  return (
    <div className={`alert mt-3 mb-0 ${alertClass}`}>
      <div className="d-flex align-items-center gap-2 flex-wrap">
        {!terminal && <Spinner active small label="Validazione in corso" />}
        <Badge color={style.color} pill className="text-uppercase" style={{ fontSize: '0.7rem' }}>
          {style.label}
        </Badge>
        <span className="small">
          Job <code>{jobId}</code>
        </span>
        {hasReport && (
          <Button color="primary" size="xs" onClick={onOpenReport} className="ms-auto">
            <Icon icon="it-search" size="xs" color="white" className="me-1" />
            Vedi report
          </Button>
        )}
      </div>
      {errorMessage && (
        <p className="small mt-2 mb-0">
          <strong>Dettagli:</strong> {errorMessage}
        </p>
      )}
      {queryError !== null && queryError !== undefined && (
        <p className="small mt-2 mb-0">Errore polling: {errorMessageOf(queryError)}</p>
      )}
    </div>
  )
}

function SyntaxCheckCard() {
  const [file, setFile] = useState<File | null>(null)

  const submit = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Nessun file selezionato')
      return ValidationService.syntax(file)
    },
  })

  return (
    <Card className="admin-card h-100">
      <CardBody className="admin-card-body">
        <CardTitle tag="h5" className="admin-card-title">
          <Icon icon="it-file" size="sm" />
          Validazione sintattica RDF
        </CardTitle>
        <p className="admin-card-hint">Carica un file Turtle/RDF e verifica la sintassi.</p>
        <input
          type="file"
          className="form-control admin-file-input mb-3"
          accept=".ttl,.rdf,.nt,.n3,.jsonld"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button
          color="primary"
          disabled={!file || submit.isPending}
          onClick={() => submit.mutate()}
        >
          <Icon icon="it-upload" size="sm" color="white" className="me-2" />
          {submit.isPending ? 'Validazione…' : 'Valida sintassi'}
        </Button>
        {submit.isError && (
          <p className="text-danger mt-3 mb-0">
            Errore: {(submit.error as Error)?.message ?? 'sconosciuto'}
          </p>
        )}
        {submit.data && (
          <div
            className={`alert mt-3 mb-0 ${submit.data.valid ? 'alert-success' : 'alert-danger'}`}
          >
            <strong>{submit.data.valid ? 'Sintassi valida' : 'Sintassi invalida'}</strong>
            {submit.data.errors && submit.data.errors.length > 0 && (
              <ul className="mb-0 mt-2">
                {submit.data.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
