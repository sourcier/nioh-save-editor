import React, { useState } from 'react'
import type { CharacterStats } from '../../../core/types'

interface Props {
  stats: CharacterStats
  onChange: (stats: CharacterStats) => void
}

interface StatField {
  key: keyof CharacterStats
  label: string
  max?: number
}

interface StatGroup {
  title: string
  fields: StatField[]
}

const STAT_GROUPS: StatGroup[] = [
  {
    title: 'General',
    fields: [
      { key: 'amrita', label: 'Amrita', max: 9999999 },
      { key: 'gold', label: 'Gold', max: 9999999 },
      { key: 'level', label: 'Level', max: 300 },
      { key: 'soulFragments', label: 'Soul Fragments', max: 9999999 }
    ]
  },
  {
    title: 'Attributes',
    fields: [
      { key: 'constitution', label: 'Constitution', max: 99 },
      { key: 'heart', label: 'Heart', max: 99 },
      { key: 'courage', label: 'Courage', max: 99 },
      { key: 'stamina', label: 'Stamina', max: 99 },
      { key: 'strength', label: 'Strength', max: 99 },
      { key: 'skill', label: 'Skill', max: 99 },
      { key: 'dexterity', label: 'Dexterity', max: 99 },
      { key: 'magic', label: 'Magic', max: 99 }
    ]
  },
  {
    title: 'Proficiency',
    fields: [
      { key: 'ninjitsu', label: 'Ninjitsu', max: 999999 },
      { key: 'onmyo', label: 'Onmyo Magic', max: 999999 },
      { key: 'sword', label: 'Sword', max: 999999 },
      { key: 'dualSword', label: 'Dual Swords', max: 999999 },
      { key: 'spear', label: 'Spear', max: 999999 },
      { key: 'axe', label: 'Axe', max: 999999 },
      { key: 'kusarigama', label: 'Kusarigama', max: 999999 },
      { key: 'odachi', label: 'Odachi', max: 999999 },
      { key: 'tonfa', label: 'Tonfa', max: 999999 },
      { key: 'hatchet', label: 'Hatchets', max: 999999 },
      { key: 'switchglaive', label: 'Switchglaive', max: 999999 },
      { key: 'splitstaff', label: 'Splitstaff', max: 999999 },
      { key: 'fist', label: 'Fists', max: 999999 }
    ]
  },
]

export function StatsTab({ stats, onChange }: Props): React.JSX.Element {
  const [drafts, setDrafts] = useState<Partial<Record<keyof CharacterStats, string>>>({})

  function handleChange(key: keyof CharacterStats, raw: string): void {
    setDrafts((d) => ({ ...d, [key]: raw }))
  }

  function commitField(key: keyof CharacterStats, raw: string): void {
    setDrafts((d) => { const n = { ...d }; delete n[key]; return n })
    const value = parseInt(raw, 10)
    if (!isNaN(value)) onChange({ ...stats, [key]: value })
  }

  return (
    <div className="tab-content stats-tab">
      {STAT_GROUPS.map((group) => (
        <div className="stat-group" key={group.title}>
          <h3 className="stat-group-title">{group.title}</h3>
          {group.fields.map(({ key, label }) => (
            <div className="stat-row" key={key}>
              <label htmlFor={`stat-${key}`}>{label}</label>
              <input
                id={`stat-${key}`}
                type="text"
                inputMode="numeric"
                value={drafts[key] ?? String(stats[key])}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={(e) => commitField(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

