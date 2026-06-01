import { Routes, Route, Navigate } from 'react-router-dom'
import { Spinner } from 'design-react-kit'
import { useMe } from './hooks/useMe'
import { AppLayout } from './components/Layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import RepositoriesPage from './pages/RepositoriesPage'
import HarvestPage from './pages/HarvestPage'
import AuditPage from './pages/AuditPage'
import ValidatePage from './pages/ValidatePage'
import SystemConfigPage from './pages/SystemConfigPage'

export default function App() {
  const me = useMe()

  if (me.isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner active />
      </div>
    )
  }

  // Se non autenticato il NdcClient ha gia' redirezionato a /oauth2/...
  if (!me.data) return null

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/repositories" element={<RepositoriesPage />} />
        <Route path="/harvest" element={<HarvestPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/validate" element={<ValidatePage />} />
        <Route path="/system-config" element={<SystemConfigPage />} />
      </Routes>
    </AppLayout>
  )
}
