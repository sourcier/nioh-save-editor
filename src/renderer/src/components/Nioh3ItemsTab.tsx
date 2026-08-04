import React, { useState } from 'react'
import type { Nioh3Usable, Nioh3Effect } from '../../../core/types'
import { swapEndianHex, nioh3EffectIdToHex } from '../../../core/binary-utils'
import { SearchableSelect } from './SearchableSelect'
import { SortableTh } from './SortableTh'
import { useSort } from '../hooks/useSort'

const RARITY_LABELS: Record<number, string> = {
  0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Exotic', 4: 'Divine', 5: 'Ethereal'
}

interface Props {
  items: Nioh3Usable[]
  itemsJson: Record<string, { name: string; type: string }>
  effectsList: string[]
  label: string
  onChange: (items: Nioh3Usable[]) => void
}

type UsableSortKey = 'slot' | 'id' | 'name' | 'type' | 'quantity' | 'level' | 'rarity'

export function Nioh3ItemsTab({
  items,
  itemsJson,
  effectsList,
  label,
  onChange
}: Props): React.JSX.Element {
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<number | null>(null)

  const active = items.filter((i) => i.itemId !== 0)
  const filtered = active.filter((i) => {
    const hex = swapEndianHex(i.itemId)
    const name = itemsJson[hex]?.name ?? 'Unknown'
    const type = itemsJson[hex]?.type ?? ''
    return (
      !filter ||
      name.toLowerCase().includes(filter.toLowerCase()) ||
      type.toLowerCase().includes(filter.toLowerCase())
    )
  })

  const { sorted, sortKey, sortDir, requestSort } = useSort<Nioh3Usable, UsableSortKey>(
    filtered,
    (item, key) => {
      const hex = swapEndianHex(item.itemId)
      switch (key) {
        case 'slot': return item.slot
        case 'id': return hex
        case 'name': return itemsJson[hex]?.name ?? 'Unknown'
        case 'type': return itemsJson[hex]?.type ?? ''
        case 'quantity': return item.quantity
        case 'level': return item.itemLevel
        case 'rarity': return item.rarity
      }
    }
  )

  function updateItem(updated: Nioh3Usable): void {
    onChange(items.map((i) => (i.slot === updated.slot ? updated : i)))
  }

  if (editing !== null) {
    const item = items.find((i) => i.slot === editing)
    if (item) {
      return (
        <UsableEditor
          item={item}
          itemsJson={itemsJson}
          effectsList={effectsList}
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
        <span className="count">{filtered.length} {label.toLowerCase()}</span>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <SortableTh label="Slot" sortKeyValue="slot" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="ID" sortKeyValue="id" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Name" sortKeyValue="name" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Type" sortKeyValue="type" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Qty" sortKeyValue="quantity" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Level" sortKeyValue="level" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Rarity" sortKeyValue="rarity" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => {
              const hex = swapEndianHex(item.itemId)
              const name = itemsJson[hex]?.name ?? 'Unknown'
              const type = itemsJson[hex]?.type ?? '?'
              return (
                <tr key={item.slot}>
                  <td>{item.slot}</td>
                  <td className="mono">{hex}</td>
                  <td>{name}</td>
                  <td>{type}</td>
                  <td>{item.quantity}</td>
                  <td>{item.itemLevel}</td>
                  <td>{RARITY_LABELS[item.rarity] ?? item.rarity}</td>
                  <td>
                    <button onClick={() => setEditing(item.slot)}>Edit</button>
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
  item: Nioh3Usable
  itemsJson: Record<string, { name: string; type: string }>
  effectsList: string[]
  onSave: (item: Nioh3Usable) => void
  onBack: () => void
}

function UsableEditor({ item, itemsJson, effectsList, onSave, onBack }: EditorProps): React.JSX.Element {
  const [local, setLocal] = useState<Nioh3Usable>({
    ...item,
    effects: item.effects.map((e) => ({ ...e }))
  })
  const [fieldDrafts, setFieldDrafts] = useState<Partial<Record<keyof Nioh3Usable, string>>>({})
  const [magDrafts, setMagDrafts] = useState<Partial<Record<number, string>>>({})

  function commitNumeric(key: keyof Nioh3Usable, raw: string): void {
    setFieldDrafts((d) => { const n = { ...d }; delete n[key]; return n })
    const value = parseInt(raw, 10)
    if (!isNaN(value)) setLocal((prev) => ({ ...prev, [key]: value }))
  }

  function commitEffectMagnitude(index: number, raw: string): void {
    setMagDrafts((d) => { const n = { ...d }; delete n[index]; return n })
    const value = parseInt(raw, 10)
    if (isNaN(value)) return
    setLocal((prev) => ({
      ...prev,
      effects: prev.effects.map((e, i) => (i === index ? { ...e, value } : e))
    }))
  }

  function setEffectFromDropdown(index: number, chosen: string): void {
    const hexId = chosen.split(' ')[0]
    const id = parseInt(hexId, 16)
    if (isNaN(id)) return
    setLocal((prev) => ({
      ...prev,
      effects: prev.effects.map((e, i) => (i === index ? { ...e, id } : e))
    }))
  }

  const hex = swapEndianHex(local.itemId)
  const name = itemsJson[hex]?.name ?? 'Unknown'

  return (
    <div className="editor">
      <div className="editor-header">
        <button onClick={onBack}>← Back</button>
        <h2>Editing: {name} (Slot {local.slot})</h2>
        <button className="primary" onClick={() => onSave(local)}>Save Changes</button>
      </div>
      <div className="editor-body">
        <section className="editor-section">
          <h3>Properties</h3>
          <div className="field-grid">
            {(
              [
                ['quantity', 'Quantity'],
                ['itemLevel', 'Item Level'],
                ['plusValue', 'Plus Value'],
                ['rarity', 'Rarity (0–5)'],
                ['familiarityRaw', 'Familiarity (raw)']
              ] as [keyof Nioh3Usable, string][]
            ).map(([key, label]) => {
              const raw = fieldDrafts[key] ?? String(local[key])
              return (
                <label key={key} className="stat-field">
                  <span>{label}</span>
                  <input
                    type="number"
                    min={0}
                    value={raw}
                    onChange={(e) => setFieldDrafts((d) => ({ ...d, [key]: e.target.value }))}
                    onBlur={(e) => commitNumeric(key, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitNumeric(key, (e.target as HTMLInputElement).value)
                    }}
                  />
                </label>
              )
            })}
          </div>
        </section>

        <section className="editor-section">
          <h3>Effects</h3>
          <div className="effects-list">
            {local.effects.map((eff: Nioh3Effect, i: number) => {
              const effHex = nioh3EffectIdToHex(eff.id)
              const currentChoice = `${effHex} - ${effectsList.find((e) => e.startsWith(effHex + ' '))?.split(' - ')[1] ?? 'Unknown'}`
              return (
                <div key={i} className="effect-row">
                  <span className="effect-label">#{i + 1}</span>
                  <div className="effect-select-wrap">
                    <SearchableSelect
                      options={effectsList}
                      value={currentChoice}
                      onChange={(chosen) => setEffectFromDropdown(i, chosen)}
                      placeholder="Search effects…"
                    />
                  </div>
                  <label className="effect-mag-field">
                    <span>Value</span>
                    <input
                      type="number"
                      min={0}
                      value={magDrafts[i] ?? String(eff.value)}
                      onChange={(e) => setMagDrafts((d) => ({ ...d, [i]: e.target.value }))}
                      onBlur={(e) => commitEffectMagnitude(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEffectMagnitude(i, (e.target as HTMLInputElement).value)
                      }}
                    />
                  </label>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
