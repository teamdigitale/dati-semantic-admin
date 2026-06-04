import { Button, Icon, Modal, ModalBody, ModalFooter, ModalHeader } from 'design-react-kit'
import type { HarvesterRun } from '../api/types/harvest'

interface Props {
  isOpen: boolean
  onClose: () => void
  run: HarvesterRun | null
}

/**
 * Modal di dettaglio per un run terminato male:
 *  - {@code reason}: stringa generata dal BE (es. eccezione catturata)
 *  - {@code validationReport}: report harvest-conformance (NDC_ISSUES_PRESENT)
 *
 * Entrambi sono campi gia' presenti su HarvesterRun, niente fetch aggiuntivo.
 */
export default function RunFailureDetailModal({ isOpen, onClose, run }: Props) {
  if (!run) return null
  const hasReason = !!run.reason && run.reason.trim().length > 0
  const hasReport = !!run.validationReport && run.validationReport.trim().length > 0

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" scrollable centered>
      <ModalHeader toggle={onClose}>
        <Icon icon="it-warning-circle" size="sm" className="me-2" />
        Dettaglio run — {run.status}
      </ModalHeader>
      <ModalBody>
        <dl className="row small mb-3">
          <dt className="col-sm-3">Repository</dt>
          <dd className="col-sm-9">
            <code>{run.repositoryUrl ?? run.repositoryId}</code>
          </dd>
          <dt className="col-sm-3">Run id</dt>
          <dd className="col-sm-9">
            <code>{run.id}</code>
          </dd>
          <dt className="col-sm-3">Iniziato</dt>
          <dd className="col-sm-9">{new Date(run.startedAt).toLocaleString('it-IT')}</dd>
          {run.endedAt && (
            <>
              <dt className="col-sm-3">Terminato</dt>
              <dd className="col-sm-9">{new Date(run.endedAt).toLocaleString('it-IT')}</dd>
            </>
          )}
          {run.revision && (
            <>
              <dt className="col-sm-3">Revisione</dt>
              <dd className="col-sm-9">
                <code>{run.revision}</code>
              </dd>
            </>
          )}
        </dl>

        {hasReason && (
          <section className="mb-3">
            <h6 className="fw-semibold mb-2">Motivo del fallimento</h6>
            <pre className="admin-code-block small">{run.reason}</pre>
          </section>
        )}

        {hasReport && (
          <section className="mb-0">
            <h6 className="fw-semibold mb-2">Validation report</h6>
            <pre className="admin-code-block small">{run.validationReport}</pre>
          </section>
        )}

        {!hasReason && !hasReport && (
          <p className="admin-empty mb-0">Nessun dettaglio aggiuntivo disponibile per questo run.</p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" outline onClick={onClose}>
          Chiudi
        </Button>
      </ModalFooter>
    </Modal>
  )
}
