import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  openSave: () => ipcRenderer.invoke('save:open'),
  writeSave: (payload: {
    stats: unknown
    weapons: unknown[]
    items: unknown[]
    scrolls: unknown[]
  }) => ipcRenderer.invoke('save:write', payload),
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
