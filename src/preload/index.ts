import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  openSave: (game: 'Nioh2' | 'Nioh3') => ipcRenderer.invoke('save:open', game),
  writeSave: (
    payload:
      | { game: 'Nioh2'; stats: unknown; weapons: unknown[]; items: unknown[]; scrolls: unknown[] }
      | { game: 'Nioh3'; statsN3: unknown; equipment: unknown[]; usables: unknown[]; storage: unknown[] }
  ) => ipcRenderer.invoke('save:write', payload),
  importSave: () => ipcRenderer.invoke('save:import')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
