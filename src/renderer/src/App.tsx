import { useState } from 'react'
import type {
  CharacterStats,
  CharacterStatsN3,
  Item,
  Nioh3Equipment,
  Nioh3Usable,
  SaveMode,
  Scroll,
  Weapon
} from '../../core/types'
import { StatsTab } from './components/StatsTab'
import { WeaponsTab } from './components/WeaponsTab'
import { ItemsTab } from './components/ItemsTab'
import { ScrollsTab } from './components/ScrollsTab'
import { Nioh3StatsTab } from './components/Nioh3StatsTab'
import { Nioh3EquipmentTab } from './components/Nioh3EquipmentTab'
import { Nioh3ItemsTab } from './components/Nioh3ItemsTab'
import itemsData from '../../data/items.json'
import effectsData from '../../data/effects.json'
import itemsDataN3 from '../../data/items-n3.json'
import effectsDataN3 from '../../data/effects-n3.json'

type Nioh2Tab = 'stats' | 'weapons' | 'items' | 'scrolls'
type Nioh3Tab = 'stats' | 'equipment' | 'usables' | 'storage'

interface Nioh2AppState {
  game: 'Nioh2'
  mode: SaveMode
  stats: CharacterStats
  weapons: Weapon[]
  items: Item[]
  scrolls: Scroll[]
}

interface Nioh3AppState {
  game: 'Nioh3'
  mode: 'Nioh3'
  statsN3: CharacterStatsN3
  equipment: Nioh3Equipment[]
  usables: Nioh3Usable[]
  storage: Nioh3Usable[]
}

type AppState = Nioh2AppState | Nioh3AppState

// ── Nioh 2 data ───────────────────────────────────────────────────────────────
const effectsList: string[] = (effectsData as { id: string; Effect: string }[]).map(
  (e) => `${e.id} - ${e.Effect}`
)
const itemsJson = itemsData as Record<string, { name: string; type: string }>

// ── Nioh 3 data ───────────────────────────────────────────────────────────────
const effectsListN3: string[] = (effectsDataN3 as { id: string; Effect: string }[]).map(
  (e) => `${e.id} - ${e.Effect}`
)
const itemsJsonN3 = itemsDataN3 as Record<string, { name: string; type: string }>

function App(): React.JSX.Element {
  const [appState, setAppState] = useState<AppState | null>(null)
  const [selectedGame, setSelectedGame] = useState<'Nioh2' | 'Nioh3' | null>(null)
  const [activeTab, setActiveTab] = useState<Nioh2Tab | Nioh3Tab>('stats')
  const [status, setStatus] = useState<string>('No save file loaded.')
  const [busy, setBusy] = useState(false)
  const [loadCount, setLoadCount] = useState(0)

  function selectGame(game: 'Nioh2' | 'Nioh3'): void {
    setSelectedGame(game)
    setAppState(null)
    setStatus('No save file loaded.')
  }

  function changeGame(): void {
    setSelectedGame(null)
    setAppState(null)
    setStatus('No save file loaded.')
  }

  async function openFile(): Promise<void> {
    if (!selectedGame) return
    setBusy(true)
    setStatus('Opening file…')
    try {
      const result = (await window.api.openSave(selectedGame)) as
        | { success: true; game: 'Nioh2'; mode: SaveMode; stats: CharacterStats; weapons: Weapon[]; items: Item[]; scrolls: Scroll[] }
        | { success: true; game: 'Nioh3'; mode: 'Nioh3'; statsN3: CharacterStatsN3; equipment: Nioh3Equipment[]; usables: Nioh3Usable[]; storage: Nioh3Usable[] }
        | { success: false; error: string }

      if (!result.success) {
        setStatus(result.error === 'Cancelled' ? 'No file selected.' : `Error: ${result.error}`)
        return
      }

      if (result.game === 'Nioh3') {
        setAppState({
          game: 'Nioh3',
          mode: 'Nioh3',
          statsN3: result.statsN3,
          equipment: result.equipment,
          usables: result.usables,
          storage: result.storage
        })
        setActiveTab('stats')
        const eqCount = result.equipment.filter((e) => e.itemId !== 0).length
        const usableCount = result.usables.filter((u) => u.itemId !== 0).length
        setStatus(`Loaded Nioh 3 PC save — ${eqCount} equipment, ${usableCount} usables`)
      } else {
        setAppState({
          game: 'Nioh2',
          mode: result.mode,
          stats: result.stats,
          weapons: result.weapons,
          items: result.items,
          scrolls: result.scrolls
        })
        setActiveTab('stats')
        const weaponCount = result.weapons.filter((w) => w.itemId !== 0).length
        const itemCount = result.items.filter((i) => i.itemId !== 0).length
        setStatus(
          `Loaded ${result.mode} save — ${weaponCount} weapons, ${itemCount} items, ${result.scrolls.length} scrolls`
        )
      }
      setLoadCount((c) => c + 1)
    } finally {
      setBusy(false)
    }
  }

  async function saveFile(): Promise<void> {
    if (!appState) return
    setBusy(true)
    setStatus('Saving…')
    try {
      let result: { success: boolean; error?: string }
      if (appState.game === 'Nioh3') {
        result = (await window.api.writeSave({
          game: 'Nioh3',
          statsN3: appState.statsN3,
          equipment: appState.equipment,
          usables: appState.usables,
          storage: appState.storage
        })) as { success: boolean; error?: string }
      } else {
        result = (await window.api.writeSave({
          game: 'Nioh2',
          stats: appState.stats,
          weapons: appState.weapons,
          items: appState.items,
          scrolls: appState.scrolls
        })) as { success: boolean; error?: string }
      }
      setStatus(result.success ? 'Saved successfully!' : `Save failed: ${result.error}`)
    } finally {
      setBusy(false)
    }
  }

  async function importSave(): Promise<void> {
    if (!appState) {
      setStatus('Load your save file first.')
      return
    }
    if (appState.game === 'Nioh3') {
      setStatus('Import is only supported for Nioh 2 saves.')
      return
    }
    if (!confirm('This will replace your current character data. Continue?')) return

    setBusy(true)
    setStatus('Importing…')
    try {
      const result = (await window.api.importSave()) as
        | { success: true; game: 'Nioh2'; stats: CharacterStats; weapons: Weapon[]; items: Item[]; scrolls: Scroll[] }
        | { success: false; error: string }

      if (!result.success) {
        setStatus(result.error === 'Cancelled' ? 'Import cancelled.' : `Import failed: ${result.error}`)
        return
      }

      setAppState((prev) =>
        prev && prev.game === 'Nioh2'
          ? {
              ...prev,
              stats: result.stats,
              weapons: result.weapons,
              items: result.items,
              scrolls: result.scrolls
            }
          : prev
      )
      setLoadCount((c) => c + 1)
      setStatus('Character imported. Load in-game to apply.')
    } finally {
      setBusy(false)
    }
  }

  const title = 'Nioh Save Editor'

  const NIOH2_TABS: { id: Nioh2Tab; label: string }[] = [
    { id: 'stats', label: 'Stats' },
    { id: 'weapons', label: 'Weapons' },
    { id: 'items', label: 'Items' },
    { id: 'scrolls', label: 'Scrolls' }
  ]

  const NIOH3_TABS: { id: Nioh3Tab; label: string }[] = [
    { id: 'stats', label: 'Stats' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'usables', label: 'Usables' },
    { id: 'storage', label: 'Storage' }
  ]

  if (!selectedGame) {
    return (
      <div className="app">
        <div className="game-select-page">
          <h1 className="game-select-title">{title}</h1>
          <p className="game-select-subtitle">Choose a game to begin editing your save file</p>
          <div className="game-select-cards">
            <button
              className="game-card game-card--nioh2"
              onClick={() => selectGame('Nioh2')}
            >
              <span className="game-card-eyebrow">仁王</span>
              <span className="game-card-name">Nioh 2</span>
              <span className="game-card-desc">PC (SAVEDATA.BIN) &amp; PS4 (APP.BIN)</span>
              <span className="game-card-cta">Select →</span>
            </button>
            <button
              className="game-card game-card--nioh3"
              onClick={() => selectGame('Nioh3')}
            >
              <span className="game-card-eyebrow">仁王</span>
              <span className="game-card-name">Nioh 3</span>
              <span className="game-card-desc">PC (SAVEDATA.BIN)</span>
              <span className="game-card-cta">Select →</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>{title}</h1>
        <div className="header-actions">
          <button className="change-game-btn" onClick={changeGame} disabled={busy}>
            ← {selectedGame === 'Nioh2' ? 'Nioh 2' : 'Nioh 3'}
          </button>
          <button onClick={openFile} disabled={busy}>Open Save</button>
          <button onClick={saveFile} disabled={busy || !appState} className="primary">
            Save File
          </button>
          <button onClick={importSave} disabled={busy || !appState || appState.game === 'Nioh3'}>
            Import Save
          </button>
          {appState && (
            <span className="mode-badge">{appState.mode}</span>
          )}
        </div>
      </header>

      <div className="status-bar">{status}</div>

      {appState ? (
        <>
          <nav className="tab-bar">
            {appState.game === 'Nioh3'
              ? NIOH3_TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    className={`tab-btn ${activeTab === id ? 'active' : ''}`}
                    onClick={() => setActiveTab(id)}
                  >
                    {label}
                  </button>
                ))
              : NIOH2_TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    className={`tab-btn ${activeTab === id ? 'active' : ''}`}
                    onClick={() => setActiveTab(id)}
                  >
                    {label}
                  </button>
                ))}
          </nav>

          <main className="tab-main">
            {appState.game === 'Nioh3' ? (
              <>
                {activeTab === 'stats' && (
                  <Nioh3StatsTab
                    stats={appState.statsN3}
                    onChange={(statsN3) =>
                      setAppState((prev) => prev && prev.game === 'Nioh3' ? { ...prev, statsN3 } : prev)
                    }
                  />
                )}
                {activeTab === 'equipment' && (
                  <Nioh3EquipmentTab
                    key={loadCount}
                    equipment={appState.equipment}
                    itemsJson={itemsJsonN3}
                    effectsList={effectsListN3}
                    onChange={(equipment) =>
                      setAppState((prev) => prev && prev.game === 'Nioh3' ? { ...prev, equipment } : prev)
                    }
                  />
                )}
                {activeTab === 'usables' && (
                  <Nioh3ItemsTab
                    key={`${loadCount}-usables`}
                    items={appState.usables}
                    itemsJson={itemsJsonN3}
                    effectsList={effectsListN3}
                    label="Usables"
                    onChange={(usables) =>
                      setAppState((prev) => prev && prev.game === 'Nioh3' ? { ...prev, usables } : prev)
                    }
                  />
                )}
                {activeTab === 'storage' && (
                  <Nioh3ItemsTab
                    key={`${loadCount}-storage`}
                    items={appState.storage}
                    itemsJson={itemsJsonN3}
                    effectsList={effectsListN3}
                    label="Storage"
                    onChange={(storage) =>
                      setAppState((prev) => prev && prev.game === 'Nioh3' ? { ...prev, storage } : prev)
                    }
                  />
                )}
              </>
            ) : (
              <>
                {activeTab === 'stats' && (
                  <StatsTab
                    stats={appState.stats}
                    onChange={(stats) => setAppState((prev) => prev && prev.game === 'Nioh2' ? { ...prev, stats } : null)}
                  />
                )}
                {activeTab === 'weapons' && (
                  <WeaponsTab
                    key={loadCount}
                    weapons={appState.weapons}
                    itemsJson={itemsJson}
                    effectsList={effectsList}
                    onChange={(weapons) => setAppState((prev) => prev && prev.game === 'Nioh2' ? { ...prev, weapons } : null)}
                  />
                )}
                {activeTab === 'items' && (
                  <ItemsTab
                    key={loadCount}
                    items={appState.items}
                    itemsJson={itemsJson}
                    onChange={(items) => setAppState((prev) => prev && prev.game === 'Nioh2' ? { ...prev, items } : null)}
                  />
                )}
                {activeTab === 'scrolls' && (
                  <ScrollsTab
                    scrolls={appState.scrolls}
                    itemsJson={itemsJson}
                    effectsList={effectsList}
                    onChange={(scrolls) => setAppState((prev) => prev && prev.game === 'Nioh2' ? { ...prev, scrolls } : null)}
                  />
                )}
              </>
            )}
          </main>
        </>
      ) : (
        <div className="welcome">
          <p>Open a save file to get started.</p>
          <p className="hint">
            {selectedGame === 'Nioh3'
              ? <><strong>Nioh 3</strong> — open <strong>SAVEDATA.BIN</strong> (PC)</>
              : <><strong>Nioh 2</strong> — open <strong>SAVEDATA.BIN</strong> (PC) or <strong>APP.BIN</strong> (PS4)</>}
          </p>
        </div>
      )}
    </div>
  )
}

export default App
