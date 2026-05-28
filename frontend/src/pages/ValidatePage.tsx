import { useState } from 'react'
import { Button, Card, CardBody, Icon, Input, Row, Col } from 'design-react-kit'
import { useMutation } from '@tanstack/react-query'
import { ValidationService } from '../services/ValidationService'

export default function ValidatePage() {
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [revision, setRevision] = useState('')

  const submit = useMutation({
    mutationFn: () => ValidationService.submitRepo(owner, repo, revision || undefined),
  })

  return (
    <section>
      <h1 className="mb-1">Validate</h1>
      <p className="text-secondary mb-4">
        Validazione sintattica e di conformance (cookiecutter) on-demand su un repository GitHub.
      </p>

      <Card className="shadow-sm">
        <CardBody>
          <h5 className="mb-3">Conformance check repository</h5>
          <Row className="g-3">
            <Col md={4}>
              <Input
                type="text"
                label="Owner"
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="es. teamdigitale"
              />
            </Col>
            <Col md={4}>
              <Input
                type="text"
                label="Repository"
                id="repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="es. dati-semantic-csv-apis"
              />
            </Col>
            <Col md={4}>
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
    </section>
  )
}
