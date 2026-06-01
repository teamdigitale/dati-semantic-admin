import { Card, CardBody } from 'design-react-kit'
import { Navigate } from 'react-router-dom'
import ConfigEditor from '../components/ConfigEditor'
import { useIsAdmin } from '../hooks/useHasRole'

/**
 * Configurazione system-wide (scope NDC). L'elenco delle chiavi viene
 * derivato dai metadata esposti dal BE: questa pagina filtra in
 * scope=GLOBAL e ConfigEditor renderizza solo le chiavi applicabili.
 */
export default function SystemConfigPage() {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Configurazione di sistema</h1>
          <p className="admin-page-subtitle">
            Chiavi NDC-wide. Le singole repository possono sovrascrivere alcuni di questi
            valori (vedi dettaglio repository).
          </p>
        </div>
      </div>

      <Card className="admin-card">
        <CardBody className="admin-card-body">
          <ConfigEditor repoId="ndc" scope="GLOBAL" />
        </CardBody>
      </Card>
    </section>
  )
}
