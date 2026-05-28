import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<unknown[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listRepositories()
      .then(setRepos)
      .catch((e) => setError(String(e)))
  }, [])

  return (
    <section>
      <h1>Repository</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!repos && !error && <p>Caricamento…</p>}
      {repos && <pre>{JSON.stringify(repos, null, 2)}</pre>}
    </section>
  )
}
