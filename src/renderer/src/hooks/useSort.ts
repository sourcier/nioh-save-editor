import { useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'

/**
 * Generic client-side table sorting hook.
 *
 * `getValue(row, key)` should return the comparable value (string or number)
 * for a given column key — this lets callers sort by derived/looked-up
 * values (e.g. an item name resolved from a JSON lookup) rather than only
 * raw row fields.
 */
export function useSort<T, K extends string>(
  rows: T[],
  getValue: (row: T, key: K) => string | number
): {
  sorted: T[]
  sortKey: K | null
  sortDir: SortDir
  requestSort: (key: K) => void
} {
  const [sortKey, setSortKey] = useState<K | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function requestSort(key: K): void {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const va = getValue(a, sortKey)
      const vb = getValue(b, sortKey)
      let cmp: number
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb
      } else {
        cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' })
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDir])

  return { sorted, sortKey, sortDir, requestSort }
}
