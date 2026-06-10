import { useState } from 'react'
import type { CharacterStats, Item, SaveMode, Scroll, Weapon } from '../../core/types'
import { StatsTab } from './components/StatsTab'
import { WeaponsTab } from './components/WeaponsTab'
import { ItemsTab } from './components/ItemsTab'
import { ScrollsTab } from './components/ScrollsTab'
import itemsData from '../../data/items.json'
import effectsData from '../../data/effects.json'

type Tab = 'stats' | 'weapons' | 'items' | 'scrolls'

interface AppState {
  mode: SaveMode
  stats: CharacterStats
  weapons: Weapon[]
  items: Item[]
  scrolls: Scroll[]
}

const effectsList: string[] = (effectsData as { id: string; Effect: string }[]).map(
  (e) => `${e.id} - ${e.Effect}`
)

const itemsJson = itemsData as Record<string, { name: string; type: string }>

function App(): React.JSX.Element {
  const [appState, setAppState] = useState<AppState | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('stats')
  const [status, setStatus] = useState<string>('No save file loaded.')
  const [busy, setBusy] = useState(false)

  async function openFile(): Promise<void> {
    setBusy(true)
    setStatus('Opening file…')
    try {
      const result = (await window.api.openSave()) as
        | { success: true; mode: SaveMode; stats: CharacterStats; weapons: Weapon[]; items: Item[]; scrolls: Scroll[] }
        | { success: false; error: string }

      if (!result.success) {
        setStatus(result.error === 'Cancelled' ? 'No file selected.' : `Error: ${result.error}`)
        return
      }

      setAppState({
        mode: result.mode,
        stats: result.stats,
        weapons: result.weapons,
        items: result.items,
        scrolls: result.scrolls
      })

      const weaponCount = result.weapons.filter((w) => w.itemId !== 0).length
      const itemCount = result.items.filter((i) => i.itemId !== 0).length
      setStatus(
        `Loaded ${result.mode} save — ${weaponCount} weapons, ${itemCount} items, ${result.scrolls.length} scrolls`
      )
    } finally {
      setBusy(false)
    }
  }

  async function saveFile(): Promise<void> {
    if (!appState) return
    setBusy(true)
    setStatus('Saving…')
    try {
      const result = (await window.api.writeSave({
        stats: appState.stats,
        weapons: appState.weapons,
        items: appState.items,
        scrolls: appState.scrolls
      })) as { success: boolean; error?: string }

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
    if (!confirm('This will replace your current character data. Continue?')) return

    setBusy(true)
    setStatus('Importing…')
    try {
      const result = (await window.api.importSave()) as
        | { success: true; stats: CharacterStats; weapons: Weapon[]; items: Item[]; scrolls: Scroll[] }
        | { success: false; error: string }

      if (!result.success) {
        setStatus(result.error === 'Cancelled' ? 'Import cancelled.' : `Import failed: ${result.error}`)
        return
      }

      setAppState((prev) => prev ? {
        ...prev,
        stats: result.stats,
        weapons: result.weapons,
        items: result.items,
        scrolls: result.scrolls
      } : null)
      setStatus('Character imported. Load in-game to apply.')
    } finally {
      setBusy(false)
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'stats', label: 'Stats' },
    { id: 'weapons', label: 'Weapons' },
    { id: 'items', label: 'Items' },
    { id: 'scrolls', label: 'Scrolls' }
  ]

  return (
    <div className="app">
      <header className="app-header">
        <h1>Nioh 2 Save Editor</h1>
        <div className="header-actions">
          <button onClick={openFile} disabled={busy}>Open Save</button>
          <button onClick={saveFile} disabled={busy || !appState} className="primary">
            Save File
          </button>
          <button onClick={importSave} disabled={busy || !appState}>
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
            {TABS.map(({ id, label }) => (
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
            {activeTab === 'stats' && (
              <StatsTab
                stats={appState.stats}
                onChange={(stats) => setAppState((prev) => prev ? { ...prev, stats } : null)}
              />
            )}
            {activeTab === 'weapons' && (
              <WeaponsTab
                weapons={appState.weapons}
                itemsJson={itemsJson}
                effectsList={effectsList}
                onChange={(weapons) => setAppState((prev) => prev ? { ...prev, weapons } : null)}
              />
            )}
            {activeTab === 'items' && (
              <ItemsTab
                items={appState.items}
                itemsJson={itemsJson}
                onChange={(items) => setAppState((prev) => prev ? { ...prev, items } : null)}
              />
            )}
            {activeTab === 'scrolls' && (
              <ScrollsTab
                scrolls={appState.scrolls}
                itemsJson={itemsJson}
                effectsList={effectsList}
                onChange={(scrolls) => setAppState((prev) => prev ? { ...prev, scrolls } : null)}
              />
            )}
          </main>
        </>
      ) : (
        <div className="welcome">
          <p>Open a Nioh 2 save file to get started.</p>
          <p className="hint">Supported: <strong>SAVEDATA.BIN</strong> (PC Steam) · <strong>APP.BIN</strong> (PS4)</p>
        </div>
      )}
    </div>
  )
}

export default App
