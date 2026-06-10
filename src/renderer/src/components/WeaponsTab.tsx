import React from 'react'
import { useState } from 'react'
import type { Effect, Weapon } from '../../../core/types'
import { swapEndianHex } from '../../../core/binary-utils'
import { SearchableSelect } from './SearchableSelect'

interface Props {
  weapons: Weapon[]
  itemsJson: Record<string, { name: string; type: string }>
  effectsList: string[]
  onChange: (weapons: Weapon[]) => void
}

export function WeaponsTab({ weapons, itemsJson, effectsList, onChange }: Props): React.JSX.Element {
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<number | null>(null)

  const active = weapons.filter((w) => w.itemId !== 0)
  const filtered = filter
    ? active.filter((w) => {
        const hex = swapEndianHex(w.itemId)
        const name = itemsJson[hex]?.name ?? 'Unknown'
        const type = itemsJson[hex]?.type ?? ''
        return (
          name.toLowerCase().includes(filter.toLowerCase()) ||
          type.toLowerCase().includes(filter.toLowerCase())
        )
      })
    : active

  function updateWeapon(updated: Weapon): void {
    const next = weapons.map((w) => (w.slot === updated.slot ? updated : w))
    onChange(next)
  }

  function deleteWeapon(slot: number): void {
    const next = weapons.map((w) => (w.slot === slot ? { ...w, itemId: 0 } : w))
    onChange(next)
    if (editing === slot) setEditing(null)
  }

  if (editing !== null) {
    const weapon = weapons.find((w) => w.slot === editing)
    if (weapon) {
      return (
        <WeaponEditor
          weapon={weapon}
          itemsJson={itemsJson}
          effectsList={effectsList}
          onSave={(w) => {
            updateWeapon(w)
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
          placeholder="Filter by name or type…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && (
          <button onClick={() => setFilter('')}>Clear</button>
        )}
        <span className="count">{filtered.length} weapons</span>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Slot</th>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Level</th>
              <th>Tier</th>
              <th>Familiarity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => {
              const hex = swapEndianHex(w.itemId)
              const name = itemsJson[hex]?.name ?? 'Unknown'
              const type = itemsJson[hex]?.type ?? '?'
              return (
                <tr key={w.slot}>
                  <td>{w.slot}</td>
                  <td className="mono">{hex}</td>
                  <td>{name}</td>
                  <td>{type}</td>
                  <td>{w.weaponLevel}</td>
                  <td>{w.weaponTier}</td>
                  <td>{w.familiarity}</td>
                  <td>
                    <button onClick={() => setEditing(w.slot)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => {
                        if (confirm('Delete this weapon?')) deleteWeapon(w.slot)
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
  weapon: Weapon
  itemsJson: Record<string, { name: string; type: string }>
  effectsList: string[]
  onSave: (w: Weapon) => void
  onBack: () => void
}

const EFFECT_COUNT = 7

function WeaponEditor({ weapon, itemsJson, effectsList, onSave, onBack }: EditorProps): React.JSX.Element {
  const [local, setLocal] = useState<Weapon>({ ...weapon, effects: weapon.effects.map((e) => ({ ...e })) })

  function setField(key: keyof Weapon, raw: string): void {
    const value = parseInt(raw, 10)
    if (!isNaN(value)) setLocal((prev) => ({ ...prev, [key]: value }))
  }

  function setEffect(index: number, field: keyof Effect, raw: string): void {
    const value = parseInt(raw, 10)
    if (isNaN(value)) return
    setLocal((prev) => {
      const effects = prev.effects.map((e, i) => (i === index ? { ...e, [field]: value } : e))
      return { ...prev, effects }
    })
  }

  function setEffectFromDropdown(index: number, chosen: string): void {
    const hexId = chosen.split(' ')[0]
    const id = parseInt(hexId, 16)
    if (!isNaN(id)) {
      setLocal((prev) => {
        const effects = prev.effects.map((e, i) => (i === index ? { ...e, id } : e))
        return { ...prev, effects }
      })
    }
  }

  function getEffectLabel(effect: Effect): string {
    const hex = effect.id.toString(16).padStart(8, '0').slice(-4).toUpperCase()
    return effectsList.find((e) => e.startsWith(hex)) ?? hex
  }

  const hex = swapEndianHex(local.itemId)
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
              ['itemId', 'Item ID'],
              ['refashion', 'Refashion'],
              ['quantity', 'Quantity'],
              ['weaponLevel', 'Level'],
              ['weaponLevelStart', 'Level Start'],
              ['higherLevelModifier', 'Higher Level Modifier'],
              ['familiarity', 'Familiarity'],
              ['weaponTier', 'Tier'],
              ['yokaiWeaponGauge', 'Yokai Weapon Gauge'],
              ['rcmdLevel', 'Recommended Level'],
              ['remodelType', 'Remodel Type'],
              ['attemptRemaining', 'Attempts Remaining'],
              ['isEquipped', 'Is Equipped']
            ] as [keyof Weapon, string][]
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
          <h3>Effects (1–{EFFECT_COUNT})</h3>
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
