import React, { useState } from 'react'
import type { Nioh3Equipment, Nioh3Effect } from '../../../core/types'
import { swapEndianHex, nioh3EffectIdToHex } from '../../../core/binary-utils'
import { SearchableSelect } from './SearchableSelect'
import { SortableTh } from './SortableTh'
import { useSort } from '../hooks/useSort'

const RARITY_LABELS: Record<number, string> = {
  0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Exotic', 4: 'Divine', 5: 'Ethereal'
}

interface Props {
  equipment: Nioh3Equipment[]
  itemsJson: Record<string, { name: string; type: string }>
  effectsList: string[]
  onChange: (equipment: Nioh3Equipment[]) => void
}

type EquipmentSortKey = 'slot' | 'id' | 'name' | 'type' | 'level' | 'plus' | 'rarity'

export function Nioh3EquipmentTab({
  equipment,
  itemsJson,
  effectsList,
  onChange
}: Props): React.JSX.Element {
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [editing, setEditing] = useState<number | null>(null)

  const active = equipment.filter((e) => e.itemId !== 0)
  const types = [
    ...new Set(active.map((e) => itemsJson[swapEndianHex(e.itemId)]?.type ?? '').filter(Boolean))
  ].sort()
  const filtered = active.filter((e) => {
    const hex = swapEndianHex(e.itemId)
    const name = itemsJson[hex]?.name ?? 'Unknown'
    const type = itemsJson[hex]?.type ?? ''
    const matchesText =
      !filter ||
      name.toLowerCase().includes(filter.toLowerCase()) ||
      type.toLowerCase().includes(filter.toLowerCase())
    const matchesType = !typeFilter || type === typeFilter
    return matchesText && matchesType
  })

  const { sorted, sortKey, sortDir, requestSort } = useSort<Nioh3Equipment, EquipmentSortKey>(
    filtered,
    (e, key) => {
      const hex = swapEndianHex(e.itemId)
      switch (key) {
        case 'slot': return e.slot
        case 'id': return hex
        case 'name': return itemsJson[hex]?.name ?? 'Unknown'
        case 'type': return itemsJson[hex]?.type ?? ''
        case 'level': return e.itemLevel
        case 'plus': return e.plusValue
        case 'rarity': return e.rarity
      }
    }
  )

  function updateItem(updated: Nioh3Equipment): void {
    onChange(equipment.map((e) => (e.slot === updated.slot ? updated : e)))
  }

  if (editing !== null) {
    const item = equipment.find((e) => e.slot === editing)
    if (item) {
      return (
        <EquipmentEditor
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
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="count">{filtered.length} items</span>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <SortableTh label="Slot" sortKeyValue="slot" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="ID" sortKeyValue="id" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Name" sortKeyValue="name" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Type" sortKeyValue="type" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Level" sortKeyValue="level" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="+" sortKeyValue="plus" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Rarity" sortKeyValue="rarity" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => {
              const hex = swapEndianHex(e.itemId)
              const name = itemsJson[hex]?.name ?? 'Unknown'
              const type = itemsJson[hex]?.type ?? '?'
              return (
                <tr key={e.slot}>
                  <td>{e.slot}</td>
                  <td className="mono">{hex}</td>
                  <td>{name}</td>
                  <td>{type}</td>
                  <td>{e.itemLevel}</td>
                  <td>{e.plusValue}</td>
                  <td>{RARITY_LABELS[e.rarity] ?? e.rarity}</td>
                  <td>
                    <button onClick={() => setEditing(e.slot)}>Edit</button>
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
  item: Nioh3Equipment
  itemsJson: Record<string, { name: string; type: string }>
  effectsList: string[]
  onSave: (item: Nioh3Equipment) => void
  onBack: () => void
}

function EquipmentEditor({ item, itemsJson, effectsList, onSave, onBack }: EditorProps): React.JSX.Element {
  const [local, setLocal] = useState<Nioh3Equipment>({
    ...item,
    effects: item.effects.map((e) => ({ ...e }))
  })
  const [fieldDrafts, setFieldDrafts] = useState<Partial<Record<keyof Nioh3Equipment, string>>>({})
  const [magDrafts, setMagDrafts] = useState<Partial<Record<number, string>>>({})

  function commitNumeric(key: keyof Nioh3Equipment, raw: string): void {
    setFieldDrafts((d) => { const n = { ...d }; delete n[key]; return n })
    const value = parseInt(raw, 10)
    if (!isNaN(value)) setLocal((prev) => ({ ...prev, [key]: value }))
  }

  function setEffectMagnitude(index: number, raw: string): void {
    setMagDrafts((d) => ({ ...d, [index]: raw }))
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
                ['itemLevel', 'Item Level'],
                ['itemLevelPreForge', 'Pre-Forge Level'],
                ['plusValue', 'Plus Value'],
                ['quantity', 'Quantity'],
                ['rarity', 'Rarity (0–5)'],
                ['familiarityRaw', 'Familiarity (raw)']
              ] as [keyof Nioh3Equipment, string][]
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
                      onChange={(e) => setEffectMagnitude(i, e.target.value)}
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
