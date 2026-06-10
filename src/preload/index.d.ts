import { ElectronAPI } from '@electron-toolkit/preload'

interface SaveApi {
  openSave: () => Promise<unknown>
  writeSave: (payload: {
    stats: unknown
    weapons: unknown[]
    items: unknown[]
    scrolls: unknown[]
  }) => Promise<unknown>
  importSave: () => Promise<unknown>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SaveApi
  }
}
