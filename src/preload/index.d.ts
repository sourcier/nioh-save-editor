import { ElectronAPI } from '@electron-toolkit/preload'

interface SaveApi {
  openSave: (game: 'Nioh2' | 'Nioh3') => Promise<unknown>
  writeSave: (
    payload:
      | { game: 'Nioh2'; stats: unknown; weapons: unknown[]; items: unknown[]; scrolls: unknown[] }
      | { game: 'Nioh3'; statsN3: unknown; equipment: unknown[]; usables: unknown[]; storage: unknown[] }
  ) => Promise<unknown>
  importSave: () => Promise<unknown>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SaveApi
  }
}
