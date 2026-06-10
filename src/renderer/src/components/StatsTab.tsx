import React from 'react'
import type { CharacterStats } from '../../../core/types'

interface Props {
  stats: CharacterStats
  onChange: (stats: CharacterStats) => void
}

const STAT_FIELDS: { key: keyof CharacterStats; label: string; max?: number }[] = [
  { key: 'amrita', label: 'Amrita', max: 9999999 },
  { key: 'gold', label: 'Gold', max: 9999999 },
  { key: 'level', label: 'Level', max: 300 },
  { key: 'constitution', label: 'Constitution', max: 99 },
  { key: 'heart', label: 'Heart', max: 99 },
  { key: 'courage', label: 'Courage', max: 99 },
  { key: 'stamina', label: 'Stamina', max: 99 },
  { key: 'strength', label: 'Strength', max: 99 },
  { key: 'skill', label: 'Skill', max: 99 },
  { key: 'dexterity', label: 'Dexterity', max: 99 },
  { key: 'magic', label: 'Magic', max: 99 },
  { key: 'ninjitsu', label: 'Ninjitsu Proficiency', max: 999999 },
  { key: 'onmyo', label: 'Onmyo Proficiency', max: 999999 },
  { key: 'sword', label: 'Sword Proficiency', max: 999999 },
  { key: 'dualSword', label: 'Dual Sword Proficiency', max: 999999 },
  { key: 'axe', label: 'Axe Proficiency', max: 999999 },
  { key: 'kusarigama', label: 'Kusarigama Proficiency', max: 999999 },
  { key: 'odachi', label: 'Odachi Proficiency', max: 999999 },
  { key: 'tonfa', label: 'Tonfa Proficiency', max: 999999 },
  { key: 'hatchet', label: 'Hatchet Proficiency', max: 999999 }
]

export function StatsTab({ stats, onChange }: Props): React.JSX.Element {
  function handleChange(key: keyof CharacterStats, raw: string): void {
    const value = parseInt(raw, 10)
    if (!isNaN(value)) onChange({ ...stats, [key]: value })
  }

  return (
    <div className="tab-content stats-tab">
      <div className="stats-grid">
        {STAT_FIELDS.map(({ key, label }) => (
          <div className="stat-row" key={key}>
            <label htmlFor={`stat-${key}`}>{label}</label>
            <input
              id={`stat-${key}`}
              type="number"
              value={stats[key]}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
