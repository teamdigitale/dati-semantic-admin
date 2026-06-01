import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Icon, Toggle } from 'design-react-kit'
import {
  useConfigMetadata,
  useRepoConfig,
  useUpdateConfigKey,
  useDeleteConfigKey,
} from '../hooks/useConfig'
import type { ConfigKeyMetadata, ConfigScope } from '../api/types/configMetadata'

interface ConfigEditorProps {
  repoId: string
  /** filtra le chiavi mostrate in base allo scope di appartenenza */
  scope: ConfigScope
  /** quando false l'editor mostra solo i valori in lettura */
  editable?: boolean
}

/**
 * Editor di configurazione data-driven dai metadata esposti dal BE
 * (GET /config/metadata). Il FE non sa quali chiavi esistano: lo decide il BE
 * tramite l'enum ConfigKey e le sue annotazioni (type, scopes, readOnly,
 * allowedValues).
 */
export default function ConfigEditor({ repoId, scope, editable = true }: ConfigEditorProps) {
  const metadata = useConfigMetadata()
  const config = useRepoConfig(repoId)
  const update = useUpdateConfigKey(repoId)
  const remove = useDeleteConfigKey(repoId)

  if (metadata.isLoading || config.isLoading) {
    return <p className="small text-secondary mb-0">Caricamento…</p>
  }
  if (metadata.isError) {
    return <p className="small text-danger mb-0">Errore nel recupero dei metadata.</p>
  }
  if (config.isError) {
    return <p className="small text-danger mb-0">Errore nel recupero della configurazione.</p>
  }
  if (!metadata.data) return null

  const visible = metadata.data.filter((m) => m.scopes.includes(scope))
  if (visible.length === 0) {
    return (
      <p className="small text-secondary mb-0">
        Nessuna chiave applicabile a questo scope.
      </p>
    )
  }

  return (
    <div className="config-editor">
      {visible.map((meta) => {
        const entry = config.data?.[meta.name]
        return (
          <ConfigRow
            key={meta.name}
            meta={meta}
            entry={entry}
            editable={editable}
            saving={update.isPending}
            removing={remove.isPending}
            onSave={(value) => update.mutate({ key: meta.name, value })}
            onDelete={() => remove.mutate(meta.name)}
          />
        )
      })}
    </div>
  )
}

interface ConfigRowProps {
  meta: ConfigKeyMetadata
  entry: { value: unknown; writtenBy?: string; writtenAt?: string } | undefined
  editable: boolean
  saving: boolean
  removing: boolean
  onSave: (value: string) => void
  onDelete: () => void
}

function ConfigRow({ meta, entry, editable, saving, removing, onSave, onDelete }: ConfigRowProps) {
  const effectiveEditable = editable && !meta.readOnly
  const currentValue = entry?.value
  const initialDraft = useMemo(() => valueToDraft(currentValue, meta), [currentValue, meta])
  const [draft, setDraft] = useState<string>(initialDraft)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(initialDraft)
    setLocalError(null)
  }, [initialDraft])

  const dirty = draft !== initialDraft
  const valuePresent = entry !== undefined

  const handleSave = () => {
    setLocalError(null)
    const err = validateDraft(draft, meta)
    if (err) {
      setLocalError(err)
      return
    }
    onSave(draft)
  }

  return (
    <div className="config-editor-row border rounded p-3 mb-3">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div className="flex-grow-1" style={{ minWidth: 240 }}>
          <div className="d-flex align-items-baseline gap-2 flex-wrap">
            <code className="text-uppercase">{meta.name}</code>
            {!valuePresent && (
              <Badge color="secondary" pill className="text-uppercase">
                non impostato
              </Badge>
            )}
            {meta.readOnly && (
              <Badge color="warning" pill className="text-uppercase">
                <Icon icon="it-lock" size="xs" color="white" className="me-1" />
                Sola lettura
              </Badge>
            )}
          </div>
          <p className="small text-secondary mb-2 mt-1">{meta.description}</p>
          {meta.type === 'LONG' && (
            <input
              type="number"
              min={0}
              step={1}
              className="form-control"
              value={draft}
              disabled={!effectiveEditable}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="0"
            />
          )}
          {meta.type === 'BOOLEAN' && (
            <div className="d-flex align-items-center gap-3">
              <Toggle
                label=""
                checked={draft === 'true'}
                disabled={!effectiveEditable}
                onChange={(e) => setDraft((e.target as HTMLInputElement).checked ? 'true' : 'false')}
              />
              <StatusBadge active={draft === 'true'} />
            </div>
          )}
          {meta.type === 'ENUM' && (
            <select
              className="form-select"
              value={draft || meta.allowedValues[0] || ''}
              disabled={!effectiveEditable}
              onChange={(e) => setDraft(e.target.value)}
            >
              {meta.allowedValues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          )}
          {localError && <p className="small text-danger mt-2 mb-0">{localError}</p>}
          {entry?.writtenBy && entry?.writtenAt && (
            <p className="small text-secondary mt-2 mb-0">
              Ultima modifica: <strong>{entry.writtenBy}</strong> il{' '}
              {new Date(entry.writtenAt).toLocaleString()}
            </p>
          )}
        </div>
        {effectiveEditable && (
          <div className="d-flex flex-column gap-2" style={{ minWidth: 140 }}>
            <Button color="primary" size="sm" disabled={!dirty || saving} onClick={handleSave}>
              <Icon icon="it-check" size="sm" className="me-1" />
              Salva
            </Button>
            <Button
              color="danger"
              outline
              size="sm"
              disabled={!valuePresent || removing}
              onClick={onDelete}
            >
              <Icon icon="it-delete" size="sm" className="me-1" />
              Rimuovi
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <Badge color="success" pill className="text-uppercase">
        <Icon icon="it-check" size="xs" color="white" className="me-1" />
        Attivo
      </Badge>
    )
  }
  return (
    <Badge color="secondary" pill className="text-uppercase">
      <Icon icon="it-close" size="xs" color="white" className="me-1" />
      Disattivo
    </Badge>
  )
}

function valueToDraft(value: unknown, meta: ConfigKeyMetadata): string {
  if (value === undefined || value === null) {
    if (meta.type === 'BOOLEAN') return 'false'
    if (meta.type === 'ENUM') return meta.allowedValues[0] ?? ''
    return ''
  }
  return String(value)
}

function validateDraft(draft: string, meta: ConfigKeyMetadata): string | null {
  if (meta.type === 'LONG') {
    if (!draft.trim()) return 'Valore obbligatorio.'
    const n = Number(draft)
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      return 'Deve essere un intero non negativo.'
    }
    return null
  }
  if (meta.type === 'BOOLEAN') {
    return draft === 'true' || draft === 'false' ? null : 'Deve essere true o false.'
  }
  if (meta.type === 'ENUM') {
    return meta.allowedValues.includes(draft)
      ? null
      : `Valore non valido. Ammessi: ${meta.allowedValues.join(', ')}.`
  }
  return null
}
