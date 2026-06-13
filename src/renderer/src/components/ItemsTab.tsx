import React from 'react'
import { useState } from 'react'
import type { Item } from '../../../core/types'
import { swapEndianHex } from '../../../core/binary-utils'

interface Props {
  items: Item[]
  itemsJson: Record<string, { name: string; type: string }>
  onChange: (items: Item[]) => void
}

export function ItemsTab({ items, itemsJson, onChange }: Props): React.JSX.Element {
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<number | null>(null)

  const active = items.filter((i) => i.itemId !== 0)
  const types = [...new Set(active.map((i) => itemsJson[swapEndianHex(i.itemId)]?.type ?? '').filter(Boolean))].sort()
  const filtered = active.filter((item) => {
    const hex = swapEndianHex(item.itemId)
    const name = itemsJson[hex]?.name ?? 'Unknown'
    const type = itemsJson[hex]?.type ?? ''
    const matchesText = !filter || name.toLowerCase().includes(filter.toLowerCase()) || type.toLowerCase().includes(filter.toLowerCase())
    const matchesType = !typeFilter || type === typeFilter
    return matchesText && matchesType
  })

  function updateItem(updated: Item): void {
    onChange(items.map((i) => (i.slot === updated.slot ? updated : i)))
  }

  function deleteItem(slot: number): void {
    onChange(items.map((i) => (i.slot === slot ? { ...i, itemId: 0, quantity: 0 } : i)))
    if (editing === slot) setEditing(null)
    setSelected((prev) => { const next = new Set(prev); next.delete(slot); return next })
  }

  function maxSelected(): void {
    onChange(items.map((i) => (selected.has(i.slot) ? { ...i, quantity: 999 } : i)))
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.slot))

  function toggleSelectAll(): void {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((i) => next.delete(i.slot))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((i) => next.add(i.slot))
        return next
      })
    }
  }

  if (editing !== null) {
    const item = items.find((i) => i.slot === editing)
    if (item) {
      return (
        <ItemEditor
          item={item}
          itemsJson={itemsJson}
          onSave={(updated) => {
            updateItem(updated)
            setEditing(null)
          }}
          onBack={() => setEditing(null)}
        />
      )
    }
  }

  return (
    <div className="tab-content">
      <div className="toolbar">
        <input
          type="text"
          placeholder="Filter by name…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && <button onClick={() => setFilter('')}>Clear</button>}
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setSelected(new Set()) }}>
          <option value="">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={toggleSelectAll}>
          {allFilteredSelected ? 'Deselect All' : 'Select All'}
        </button>
        <span className="count">{selected.size > 0 ? `${selected.size} selected / ` : ''}{filtered.length} items</span>
        <button onClick={maxSelected} disabled={selected.size === 0}>Max Out Selected</button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} /></th>
              <th>Slot</th>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const hex = swapEndianHex(item.itemId)
              const name = itemsJson[hex]?.name ?? 'Unknown'
              const type = itemsJson[hex]?.type ?? '?'
              return (
                <tr key={item.slot} className={selected.has(item.slot) ? 'row-selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(item.slot)}
                      onChange={() => setSelected((prev) => {
                        const next = new Set(prev)
                        next.has(item.slot) ? next.delete(item.slot) : next.add(item.slot)
                        return next
                      })}
                    />
                  </td>
                  <td>{item.slot}</td>
                  <td className="mono">{hex}</td>
                  <td>{name}</td>
                  <td>{type}</td>
                  <td>{item.quantity}</td>
                  <td>
                    <button onClick={() => setEditing(item.slot)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => {
                        if (confirm('Delete this item?')) deleteItem(item.slot)
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface EditorProps {
  item: Item
  itemsJson: Record<string, { name: string; type: string }>
  onSave: (item: Item) => void
  onBack: () => void
}

function ItemEditor({ item, itemsJson, onSave, onBack }: EditorProps): React.JSX.Element {
  const [local, setLocal] = useState<Item>({ ...item })
  const [drafts, setDrafts] = useState<Partial<Record<keyof Item, string>>>({})

  const hex = swapEndianHex(local.itemId)
  const name = itemsJson[hex]?.name ?? 'Unknown'

  function setField(key: keyof Item, raw: string): void {
    setDrafts((d) => ({ ...d, [key]: raw }))
  }

  function commitField(key: keyof Item, raw: string): void {
    setDrafts((d) => { const n = { ...d }; delete n[key]; return n })
    const value = parseInt(raw, 10)
    if (!isNaN(value)) setLocal((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="tab-content editor-panel">
      <div className="editor-header">
        <button onClick={onBack}>← Back</button>
        <h2>
          Editing: {name} <span className="mono">({hex})</span>
        </h2>
        <button className="primary" onClick={() => onSave(local)}>
          Apply Changes
        </button>
      </div>
      <div className="editor-body">
        <section className="editor-section">
          <h3>Properties</h3>
          {([['itemId', 'Item ID'], ['refashion', 'Refashion'], ['quantity', 'Quantity']] as [keyof Item, string][]).map(
            ([key, label]) => (
              <div className="field-row" key={key}>
                <label>{label}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={drafts[key] ?? String(local[key])}
                  onChange={(e) => setField(key, e.target.value)}
                  onBlur={(e) => commitField(key, e.target.value)}
                />
              </div>
            )
          )}
        </section>
      </div>
    </div>
  )
}
