import React from 'react'
import { useState } from 'react'
import type { Effect, Scroll } from '../../../core/types'
import { swapEndianHex } from '../../../core/binary-utils'
import { SearchableSelect } from './SearchableSelect'

interface Props {
  scrolls: Scroll[]
  itemsJson: Record<string, { name: string; type: string }>
  effectsList: string[]
  onChange: (scrolls: Scroll[]) => void
}

export function ScrollsTab({ scrolls, itemsJson, effectsList, onChange }: Props): React.JSX.Element {
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<number | null>(null)

  const filtered = filter
    ? scrolls.filter((s) => {
        const hex = swapEndianHex(s.itemId1)
        const name = itemsJson[hex]?.name ?? 'Unknown'
        return name.toLowerCase().includes(filter.toLowerCase())
      })
    : scrolls

  function updateScroll(updated: Scroll): void {
    onChange(scrolls.map((s) => (s.slot === updated.slot ? updated : s)))
  }

  function deleteScroll(slot: number): void {
    onChange(scrolls.map((s) => (s.slot === slot ? { ...s, itemId1: 0 } : s)))
    if (editing === slot) setEditing(null)
  }

  if (editing !== null) {
    const scroll = scrolls.find((s) => s.slot === editing)
    if (scroll) {
      return (
        <ScrollEditor
          scroll={scroll}
          itemsJson={itemsJson}
          effectsList={effectsList}
          onSave={(s) => {
            updateScroll(s)
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
        <span className="count">{filtered.length} scrolls</span>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Slot</th>
              <th>ID</th>
              <th>Name</th>
              <th>Tier</th>
              <th>Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const hex = swapEndianHex(s.itemId1)
              const name = itemsJson[hex]?.name ?? 'Unknown'
              return (
                <tr key={s.slot}>
                  <td>{s.slot}</td>
                  <td className="mono">{hex}</td>
                  <td>{name}</td>
                  <td>{s.tier}</td>
                  <td>{s.itemLevel1}</td>
                  <td>
                    <button onClick={() => setEditing(s.slot)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => {
                        if (confirm('Delete this scroll?')) deleteScroll(s.slot)
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
  scroll: Scroll
  itemsJson: Record<string, { name: string; type: string }>
  effectsList: string[]
  onSave: (s: Scroll) => void
  onBack: () => void
}

function ScrollEditor({ scroll, itemsJson, effectsList, onSave, onBack }: EditorProps): React.JSX.Element {
  const [local, setLocal] = useState<Scroll>({
    ...scroll,
    effects: scroll.effects.map((e) => ({ ...e }))
  })

  function setField(key: keyof Scroll, raw: string): void {
    const value = parseInt(raw, 10)
    if (!isNaN(value)) setLocal((prev) => ({ ...prev, [key]: value }))
  }

  function setEffect(index: number, field: keyof Effect, raw: string): void {
    const value = parseInt(raw, 10)
    if (isNaN(value)) return
    setLocal((prev) => ({
      ...prev,
      effects: prev.effects.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    }))
  }

  function setEffectFromDropdown(index: number, chosen: string): void {
    const id = parseInt(chosen.split(' ')[0], 16)
    if (!isNaN(id)) {
      setLocal((prev) => ({
        ...prev,
        effects: prev.effects.map((e, i) => (i === index ? { ...e, id } : e))
      }))
    }
  }

  function getEffectLabel(effect: Effect): string {
    const hex = effect.id.toString(16).padStart(8, '0').slice(-4).toUpperCase()
    return effectsList.find((e) => e.startsWith(hex)) ?? hex
  }

  const hex = swapEndianHex(local.itemId1)
  const name = itemsJson[hex]?.name ?? 'Unknown'

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
      <div className="editor-body two-col">
        <section className="editor-section">
          <h3>Properties</h3>
          {(
            [
              ['itemLevel1', 'Level'],
              ['itemLevel2', 'Level 2'],
              ['tier', 'Tier'],
              ['isLocked', 'Is Locked'],
              ['attemptsRemaining', 'Attempts Remaining'],
              ['higherLevelMod', 'Higher Level Modifier']
            ] as [keyof Scroll, string][]
          ).map(([key, label]) => (
            <div className="field-row" key={key}>
              <label>{label}</label>
              <input
                type="number"
                value={String(local[key])}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          ))}
        </section>
        <section className="editor-section">
          <h3>Effects (1–7)</h3>
          {local.effects.map((effect, i) => (
            <div className="effect-row" key={i}>
              <span className="effect-index">#{i + 1}</span>
              <SearchableSelect
                options={effectsList}
                value={getEffectLabel(effect)}
                onChange={(v) => setEffectFromDropdown(i, v)}
                placeholder="Search effect…"
                className="effect-select"
              />
              <label>Mag</label>
              <input
                type="number"
                value={effect.magnitude}
                onChange={(e) => setEffect(i, 'magnitude', e.target.value)}
                className="effect-mag"
              />
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
