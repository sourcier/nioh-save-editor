import React from 'react'
import type { SortDir } from '../hooks/useSort'

interface Props<K extends string> {
  label: string
  sortKeyValue: K
  activeKey: K | null
  dir: SortDir
  onSort: (key: K) => void
}

export function SortableTh<K extends string>({
  label,
  sortKeyValue,
  activeKey,
  dir,
  onSort
}: Props<K>): React.JSX.Element {
  const active = activeKey === sortKeyValue
  return (
    <th
      className={`sortable-th ${active ? 'sortable-th--active' : ''}`}
      onClick={() => onSort(sortKeyValue)}
    >
      {label}
      <span className="sort-arrow">{active ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}</span>
    </th>
  )
}
