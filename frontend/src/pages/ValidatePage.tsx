import { useState } from 'react'
import { Button, Card, CardBody, CardTitle, Icon, Input, Row, Col } from 'design-react-kit'
import { useMutation } from '@tanstack/react-query'
import { ValidationService } from '../services/ValidationService'

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

      <Row className="g-4">
        <Col lg={6}>
          <RepoCheckCard />
        </Col>
        <Col lg={6}>
          <SyntaxCheckCard />
        </Col>
        <Col xs={12}>
          <JobStatusCard />
        </Col>
      </Row>
    </section>
  )
}

function RepoCheckCard() {
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [revision, setRevision] = useState('')

  const submit = useMutation({
    mutationFn: () => ValidationService.submitRepo(owner, repo, revision || undefined),
  })

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
            />
          </Col>
        </Row>
        <div className="mt-3">
          <Button
            color="primary"
            disabled={!owner || !repo || submit.isPending}
            onClick={() => submit.mutate()}
          >
            <Icon icon="it-check-circle" size="sm" color="white" className="me-2" />
            {submit.isPending ? 'Invio…' : 'Avvia validazione'}
          </Button>
        </div>
        {submit.isError && (
          <p className="text-danger mt-3 mb-0">
            Errore: {(submit.error as Error)?.message ?? 'sconosciuto'}
          </p>
        )}
        {submit.data && (
          <div className="alert alert-success mt-3 mb-0">
            Job avviato. ID: <code>{submit.data.validationId}</code> — stato:{' '}
            <strong>{submit.data.status}</strong>
          </div>
        )}
      </CardBody>
    </Card>
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

function JobStatusCard() {
  const [validationId, setValidationId] = useState('')

  const poll = useMutation({
    mutationFn: () => ValidationService.jobStatus(validationId),
  })

  return (
    <Card className="admin-card">
      <CardBody className="admin-card-body">
        <CardTitle tag="h5" className="admin-card-title">
          <Icon icon="it-search" size="sm" />
          Stato job di validazione
        </CardTitle>
        <p className="admin-card-hint">
          Polling manuale dello stato di un job lanciato sopra (o da CI esterna).
        </p>
        <Row className="g-2 align-items-end">
          <Col md={8}>
            <Input
              type="text"
              label="Validation ID"
              id="validation-id"
              value={validationId}
              onChange={(e) => setValidationId(e.target.value)}
              placeholder="uuid del job"
            />
          </Col>
          <Col md={4}>
            <Button
              color="primary"
              outline
              disabled={!validationId || poll.isPending}
              onClick={() => poll.mutate()}
            >
              <Icon icon="it-refresh" size="sm" className="me-2" />
              Polla
            </Button>
          </Col>
        </Row>
        {poll.isError && (
          <p className="text-danger mt-3 mb-0">
            Errore: {(poll.error as Error)?.message ?? 'sconosciuto'}
          </p>
        )}
        {poll.data && (
          <pre
            className="admin-code-block mt-3 small mb-0"
            style={{ maxHeight: 320, overflow: 'auto' }}
          >
            {JSON.stringify(poll.data, null, 2)}
          </pre>
        )}
      </CardBody>
    </Card>
  )
}
