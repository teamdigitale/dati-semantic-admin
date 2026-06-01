import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SemanticAssetsService } from '../services/SemanticAssetsService'
import { queryKeys } from './queryKeys'

const SEARCH_MIN_CHARS = 2
const SEARCH_DEFAULT_LIMIT = 10
const SEARCH_DEBOUNCE_MS = 250

/** Hook utilita': ritarda l'aggiornamento del valore di {@code delayMs} per evitare query per ogni tasto. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

/**
 * Autocomplete sugli asset semantici via {@code /semantic-assets/search}.
 * Esegue la query solo se {@code q} ha almeno {@link SEARCH_MIN_CHARS} caratteri,
 * dopo un debounce di {@link SEARCH_DEBOUNCE_MS} ms.
 */
export function useSearchAssets(q: string, limit: number = SEARCH_DEFAULT_LIMIT) {
  const debouncedQ = useDebouncedValue(q.trim(), SEARCH_DEBOUNCE_MS)
  return useQuery({
    queryKey: queryKeys.semanticAssetsSearch(debouncedQ, limit),
    queryFn: () => SemanticAssetsService.search({ q: debouncedQ, limit }),
    enabled: debouncedQ.length >= SEARCH_MIN_CHARS,
    staleTime: 30_000,
  })
}
