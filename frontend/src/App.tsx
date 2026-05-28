import { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { api, type Me } from './api/client'
import RepositoriesPage from './pages/RepositoriesPage'
import HarvestPage from './pages/HarvestPage'
import AuditPage from './pages/AuditPage'
import ValidatePage from './pages/ValidatePage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .me()
      .then(setMe)
      .catch(() => {
        // 401 → redirect a login OAuth2
        window.location.href = '/oauth2/authorization/keycloak'
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 16 }}>Caricamento…</div>
  if (!me) return null

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <strong>NDC Admin</strong>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/repositories">Repository</Link>
          <Link to="/harvest">Harvest</Link>
          <Link to="/audit">Audit</Link>
          <Link to="/validate">Validate</Link>
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <span>{me.name}</span>
          <a href="/logout">Logout</a>
        </div>
      </header>
      <main style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/repositories" element={<RepositoriesPage />} />
          <Route path="/harvest" element={<HarvestPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/validate" element={<ValidatePage />} />
        </Routes>
      </main>
    </div>
  )
}
