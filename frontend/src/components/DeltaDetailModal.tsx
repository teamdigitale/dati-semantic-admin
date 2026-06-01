import { Badge, Button, Icon, Modal, ModalBody, ModalFooter, ModalHeader } from 'design-react-kit'
import DeltaSummaryDetail from './DeltaSummaryDetail'
import type { ChangeKind, DeltaSummary, SemanticAssetType } from '../api/types/audit'

/**
 * Payload minimale di una "modifica" da mostrare nel modal.
 * Soddisfatto sia da {@code ResourceDeltaItem} (tabella delta) sia da
 * {@code SemanticAssetChangelogEntry} (tabella changelog) — in quest'ultimo
 * caso {@code assetIri}/{@code assetType} vengono dalla pagina, non dall'entry.
 */
export interface DeltaDetailPayload {
  assetIri: string
  assetType?: SemanticAssetType
  changeKind: ChangeKind
  createdAt: string
  summary?: DeltaSummary
}

interface DeltaDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: DeltaDetailPayload | null
  /** Naviga alla modifica anteriore (piu' vecchia). Bottone nascosto se omesso. */
  onPrev?: () => void
  /** Naviga alla modifica successiva (piu' recente). Bottone nascosto se omesso. */
  onNext?: () => void
  /**
   * Posizione corrente nella lista navigabile, mostrata come "(N/total)" nel titolo.
   * La lista arriva DESC per createdAt (index 0 = piu' recente), quindi convertiamo
   * a 1-based crescente nel tempo: {@code N = total - index}.
   */
  position?: { index: number; total: number }
}

const CHANGE_KIND_STYLE: Record<ChangeKind, { color: string; label: string }> = {
  ADDED: { color: 'success', label: 'Aggiunto' },
  REMOVED: { color: 'danger', label: 'Rimosso' },
  MODIFIED: { color: 'warning', label: 'Modificato' },
}

/**
 * Dettaglio strutturato di una modifica semantica.
 * Stessa shape grafica di {@code RepoConfigModal} / {@code ValidationReportModal}:
 * header con identifier dell'asset, body con la vista strutturata del summary,
 * footer con sola azione "Chiudi".
 */
export default function DeltaDetailModal({
  isOpen,
  onClose,
  item,
  onPrev,
  onNext,
  position,
}: DeltaDetailModalProps) {
  const style = item ? CHANGE_KIND_STYLE[item.changeKind] : undefined

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" scrollable>
      <ModalHeader toggle={onClose}>
        Dettaglio modifiche
        {position && (
          <span className="ms-2 text-secondary fw-normal">
            ({position.total - position.index}/{position.total})
          </span>
        )}
        {item && (
          <span className="ms-2 text-secondary fw-normal">
            — <code>{item.assetIri}</code>
          </span>
        )}
      </ModalHeader>
      <ModalBody>
        {item && (
          <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
            {item.assetType && (
              <Badge color="secondary" pill style={{ fontSize: '0.75rem' }}>
                {item.assetType}
              </Badge>
            )}
            {style && (
              <Badge color={style.color} pill style={{ fontSize: '0.75rem' }}>
                {style.label}
              </Badge>
            )}
            <span className="small text-muted">
              {new Date(item.createdAt).toLocaleString('it-IT')}
            </span>
          </div>
        )}
        {item && <DeltaSummaryDetail summary={item.summary} />}
      </ModalBody>
      <ModalFooter>
        <div className="me-auto d-flex gap-2">
          {onPrev && (
            <Button color="secondary" outline onClick={onPrev} title="Modifica anteriore">
              <Icon icon="it-arrow-left" size="sm" className="me-1" />
              Anteriore
            </Button>
          )}
          {onNext && (
            <Button color="secondary" outline onClick={onNext} title="Modifica successiva">
              Successiva
              <Icon icon="it-arrow-right" size="sm" className="ms-1" />
            </Button>
          )}
        </div>
        <Button color="secondary" outline onClick={onClose}>
          Chiudi
        </Button>
      </ModalFooter>
    </Modal>
  )
}
