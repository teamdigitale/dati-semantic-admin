import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from 'design-react-kit'
import { useSearchAssets } from '../hooks/useSemanticAssets'
import type { SearchResultItem } from '../api/types/audit'

interface IriSearchInputProps {
  /** Valore controllato (l'IRI nella casella). */
  value: string
  /** Chiamato sia per le edit manuali sia per la selezione di un suggerimento. */
  onChange: (next: string) => void
  /** Numero massimo di suggerimenti mostrati. */
  maxResults?: number
  placeholder?: string
  inputId?: string
}

/**
 * Input testuale con dropdown di suggerimenti pescati da {@code /semantic-assets}.
 * Mostra titolo (grande), tipo (badge) e IRI (piccolo monospaced). Click outside
 * o tasto Esc chiudono la lista. La selezione di un item committa
 * {@code assetIri} nel campo.
 */
export default function IriSearchInput({
  value,
  onChange,
  maxResults = 10,
  placeholder,
  inputId,
}: IriSearchInputProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const suggestions = useSearchAssets(value, maxResults)
  const rawItems = suggestions.data?.data
  const items = useMemo(() => rerankByLocalMatch(rawItems ?? [], value), [rawItems, value])
  const hasItems = items.length > 0

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectItem = (iri: string) => {
    onChange(iri)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="iri-search-wrapper">
      <input
        id={inputId}
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && hasItems}
        aria-autocomplete="list"
      />
      {open && (suggestions.isFetching || hasItems) && (
        <div className="iri-suggestions">
          {suggestions.isFetching && (
            <div className="iri-suggestions-status small text-muted px-3 py-2">
              Cerco suggerimenti…
            </div>
          )}
          {hasItems && (
            <ul className="iri-suggestions-list" role="listbox">
              {items.map((item) => (
                <li key={item.assetIri} role="option">
                  <button
                    type="button"
                    className="iri-suggestion-button"
                    onMouseDown={(e) => {
                      // mousedown precede il blur dell'input: previene la
                      // chiusura del dropdown prima del click.
                      e.preventDefault()
                      selectItem(item.assetIri)
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="iri-suggestion-title">
                        {item.title ?? item.assetIri}
                      </span>
                      {item.type && (
                        <span className="badge bg-light text-muted iri-suggestion-type">
                          {item.type}
                        </span>
                      )}
                    </div>
                    <div className="iri-suggestion-iri">
                      <Icon icon="it-link" size="xs" className="me-1" />
                      <code>{item.assetIri}</code>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Riordina i risultati ES per match locale del valore digitato. ES tokenizza
 * "demo-audit" in {@code demo} + {@code audit} e pesa tutti i campi indicizzati:
 * un asset che parla d'altro ma cita "audit" in description rischia di battere
 * il vero {@code demo-audit}. Spostiamo in cima i match per titolo / ultimo
 * segmento di IRI, ordinati da equals > startsWith > contains; lascio dietro
 * l'ordine originale di ES.
 */
function rerankByLocalMatch(
  items: SearchResultItem[],
  rawQuery: string,
): SearchResultItem[] {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return items
  return [...items].sort((a, b) => matchScore(a, q) - matchScore(b, q))
}

function matchScore(item: SearchResultItem, q: string): number {
  const title = (item.title ?? '').toLowerCase()
  const iri = item.assetIri.toLowerCase()
  const lastSegment = (iri.split(/[/#]/).pop() ?? '').toLowerCase()

  if (title === q) return 0
  if (lastSegment === q) return 1
  if (title.startsWith(q)) return 2
  if (lastSegment.startsWith(q)) return 3
  if (title.includes(q)) return 4
  if (iri.includes(q)) return 5
  return 100
}
