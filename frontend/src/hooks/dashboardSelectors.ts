import type { AggregateDashboardResponse } from '../api/types/dashboard'

/**
 * Le response /dashboard/aggregated-count-data hanno schema fisso:
 * headers = ["DATE", "<DIMENSION_NAME>", "VAUE"] (con "VAUE" typo BE).
 *
 * Le funzioni qui prendono per buona quella shape ed estraggono valori
 * normalizzati. Snapshot annuali: ogni riga rappresenta il conteggio
 * cumulativo della dimensione fino a fine anno.
 */

type Row = AggregateDashboardResponse['rows'][number]

function colIndexes(resp: AggregateDashboardResponse): {
  dateIdx: number
  dimIdx: number
  countIdx: number
} | null {
  const h = resp.headers.map((s) => s.toUpperCase())
  const dateIdx = h.indexOf('DATE')
  const countIdx = h.findIndex((c) => c === 'VAUE' || c === 'VALUE' || c === 'COUNT')
  const dimIdx = h.findIndex((_, i) => i !== dateIdx && i !== countIdx)
  if (dateIdx < 0 || countIdx < 0 || dimIdx < 0) return null
  return { dateIdx, dimIdx, countIdx }
}

function rowDate(row: Row, idx: number): string {
  return String(row[idx] ?? '')
}

function rowDim(row: Row, idx: number): string {
  return String(row[idx] ?? '')
}

function rowCount(row: Row, idx: number): number {
  return Number(row[idx] ?? 0) || 0
}

/**
 * Mappa "anno" -> Map("DimensionValue" -> count). Filtra fuori i conteggi a zero
 * solo dopo aver costruito la map, cosi' i caller possono comunque sapere se un
 * anno ha tutto a zero.
 */
export function groupByYear(
  resp: AggregateDashboardResponse | undefined
): Map<string, Map<string, number>> | null {
  if (!resp || !resp.rows.length) return null
  const idx = colIndexes(resp)
  if (!idx) return null
  const out = new Map<string, Map<string, number>>()
  for (const r of resp.rows) {
    const y = rowDate(r, idx.dateIdx)
    const dim = rowDim(r, idx.dimIdx)
    const c = rowCount(r, idx.countIdx)
    let bucket = out.get(y)
    if (!bucket) {
      bucket = new Map()
      out.set(y, bucket)
    }
    bucket.set(dim, (bucket.get(dim) ?? 0) + c)
  }
  return out
}

export function latestTwoYears(grouped: Map<string, Map<string, number>>): {
  current: string | null
  previous: string | null
} {
  const years = [...grouped.keys()].sort()
  return {
    current: years.at(-1) ?? null,
    previous: years.at(-2) ?? null,
  }
}

/** Somma tutti i conteggi della dimensione per uno specifico anno (ignora zeri impliciti). */
export function totalForYear(
  grouped: Map<string, Map<string, number>>,
  year: string | null
): number | null {
  if (!year) return null
  const bucket = grouped.get(year)
  if (!bucket) return null
  let sum = 0
  for (const v of bucket.values()) sum += v
  return sum
}

/**
 * Conteggio per uno specifico valore di dimensione in uno specifico anno.
 * Matching CASE-INSENSITIVE e con normalizzazione `_`/spazio: il BE ritorna
 * resource_type come "ontology", "controlled vocabulary", "schema" (lowercase
 * con spazio), mentre il caller usa la forma enum "ONTOLOGY", "CONTROLLED_VOCABULARY".
 */
export function valueForYear(
  grouped: Map<string, Map<string, number>>,
  year: string | null,
  dimValue: string
): number | null {
  if (!year) return null
  const bucket = grouped.get(year)
  if (!bucket) return null
  const target = normalize(dimValue)
  for (const [k, v] of bucket) {
    if (normalize(k) === target) return v
  }
  return 0
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s_-]+/g, '_')
}

/** Numero di valori distinti di dimensione con conteggio > 0 nell'anno. */
export function distinctNonZeroForYear(
  grouped: Map<string, Map<string, number>>,
  year: string | null
): number | null {
  if (!year) return null
  const bucket = grouped.get(year)
  if (!bucket) return null
  let n = 0
  for (const v of bucket.values()) if (v > 0) n++
  return n
}
