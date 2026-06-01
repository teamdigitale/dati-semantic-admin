import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'design-react-kit'
import ConfigEditor from './ConfigEditor'
import RepoUrlLabel from './RepoUrlLabel'
import type { Repository } from '../api/types/repository'

interface RepoConfigModalProps {
  isOpen: boolean
  onClose: () => void
  repo: Repository | null
  /** Quando false l'editor mostra i valori in sola lettura. */
  editable: boolean
}

/**
 * Modal per editare la configurazione di un singolo repository.
 * Wrappa {@link ConfigEditor} scope=REPO con header e azione "Chiudi".
 */
export default function RepoConfigModal({
  isOpen,
  onClose,
  repo,
  editable,
}: RepoConfigModalProps) {
  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" scrollable>
      <ModalHeader toggle={onClose}>
        Configurazione repository
        {repo && (
          <span className="ms-2 text-secondary fw-normal">
            —{' '}
            {repo.name ? repo.name : <RepoUrlLabel url={repo.url} asLink={false} />}
          </span>
        )}
      </ModalHeader>
      <ModalBody>
        {repo && <ConfigEditor repoId={repo.id} scope="REPO" editable={editable} />}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" outline onClick={onClose}>
          Chiudi
        </Button>
      </ModalFooter>
    </Modal>
  )
}
