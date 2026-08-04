import React, { useState } from 'react'
import type { CharacterStatsN3 } from '../../../core/types'

interface Props {
  stats: CharacterStatsN3
  onChange: (stats: CharacterStatsN3) => void
}

interface StatField {
  key: keyof CharacterStatsN3
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
      { key: 'gold', label: 'Gold', max: 9999999 }
    ]
  },
  {
    title: 'Attributes',
    fields: [
      { key: 'constitution', label: 'Constitution', max: 9999 },
      { key: 'heart', label: 'Heart', max: 9999 },
      { key: 'stamina', label: 'Stamina', max: 9999 },
      { key: 'strength', label: 'Strength', max: 9999 },
      { key: 'skill', label: 'Skill', max: 9999 },
      { key: 'intellect', label: 'Intellect', max: 9999 },
      { key: 'magic', label: 'Magic', max: 9999 }
    ]
  }
]

export function Nioh3StatsTab({ stats, onChange }: Props): React.JSX.Element {
  const [drafts, setDrafts] = useState<Partial<Record<keyof CharacterStatsN3, string>>>({})

  function handleChange(key: keyof CharacterStatsN3, raw: string): void {
    setDrafts((d) => ({ ...d, [key]: raw }))
  }

  function commitField(key: keyof CharacterStatsN3, raw: string): void {
    setDrafts((d) => {
      const n = { ...d }
      delete n[key]
      return n
    })
    const value = parseInt(raw, 10)
    if (!isNaN(value)) onChange({ ...stats, [key]: value })
  }

  return (
    <div className="tab-content stats-tab">
      {STAT_GROUPS.map((group) => (
        <div className="stat-group" key={group.title}>
          <h3 className="stat-group-title">{group.title}</h3>
          <div className="stat-fields">
            {group.fields.map(({ key, label, max }) => {
              const raw = drafts[key] ?? String(stats[key])
              return (
                <label key={key} className="stat-field">
                  <span>{label}</span>
                  <input
                    type="number"
                    value={raw}
                    min={0}
                    max={max}
                    onChange={(e) => handleChange(key, e.target.value)}
                    onBlur={(e) => commitField(key, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitField(key, (e.target as HTMLInputElement).value)
                    }}
                  />
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
