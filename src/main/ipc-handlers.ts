import { dialog, ipcMain } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { basename } from 'path'
import { INTEGRITY_OFFSETS, PS4_PADDING_SIZE } from '../core/constants'
import { parseItems, parseScrolls, parseStats, parseWeapons } from '../core/save-parser'
import { writeItems, writeScrolls, writeStats, writeWeapons } from '../core/save-writer'
import type { CharacterStats, Item, SaveMode, Scroll, Weapon } from '../core/types'
import {
  decryptPcSave,
  decryptPs4Save,
  encryptPcSave,
  encryptPs4Save
} from './save-crypto'

interface SaveState {
  buffer: Buffer
  mode: SaveMode
  isAlreadyDecrypted: boolean
}

let saveState: SaveState | null = null

function patchIntegrityBytes(buf: Buffer): void {
  for (const off of INTEGRITY_OFFSETS) {
    if (off < buf.length) buf.writeUInt8(0, off)
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle('save:open', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Nioh 2 Save File',
      filters: [
        { name: 'Save Files', extensions: ['BIN'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Cancelled' }
    }

    const filePath = result.filePaths[0]
    const fileName = basename(filePath)

    try {
      let buffer: Buffer
      let mode: SaveMode
      let isAlreadyDecrypted = false

      if (fileName === 'SAVEDATA.BIN') {
        mode = 'PC'
        buffer = await decryptPcSave(filePath)
      } else if (fileName === 'APP.BIN') {
        mode = 'PS4'
        const ps4 = await decryptPs4Save(filePath)
        isAlreadyDecrypted = ps4.alreadyDecrypted
        // PS4: prepend 0x148 zero bytes to align offsets with PC format
        const padding = Buffer.alloc(PS4_PADDING_SIZE, 0)
        buffer = Buffer.concat([padding, ps4.buffer])
      } else {
        return {
          success: false,
          error: 'Unknown file format. Please select SAVEDATA.BIN (PC) or APP.BIN (PS4).'
        }
      }

      patchIntegrityBytes(buffer)
      saveState = { buffer, mode, isAlreadyDecrypted }

      return {
        success: true,
        mode,
        stats: parseStats(buffer),
        weapons: parseWeapons(buffer),
        items: parseItems(buffer),
        scrolls: parseScrolls(buffer)
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'save:write',
    async (
      _,
      payload: {
        stats: CharacterStats
        weapons: Weapon[]
        items: Item[]
        scrolls: Scroll[]
      }
    ) => {
      if (!saveState) return { success: false, error: 'No save file loaded.' }

      const { buffer, mode, isAlreadyDecrypted } = saveState

      writeStats(buffer, payload.stats)
      writeWeapons(buffer, payload.weapons)
      writeItems(buffer, payload.items)
      writeScrolls(buffer, payload.scrolls)

      const result = await dialog.showSaveDialog({
        title: 'Save Nioh 2 Save File',
        defaultPath: mode === 'PC' ? 'SAVEDATA.BIN' : 'APP.BIN',
        filters: [
          { name: 'Save Files', extensions: ['BIN'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) return { success: false, error: 'Cancelled' }

      try {
        if (mode === 'PC') {
          const encrypted = await encryptPcSave(buffer)
          writeFileSync(result.filePath, encrypted)
        } else if (isAlreadyDecrypted) {
          // Save Wizard PS4 flow: strip padding and write raw
          const raw = buffer.subarray(PS4_PADDING_SIZE)
          writeFileSync(result.filePath, raw)
        } else {
          // PS4 with ps4.exe: write temp decrypted, re-encrypt
          const { tmpdir } = await import('os')
          const { join } = await import('path')
          const tmpPath = join(tmpdir(), 'APP.BIN_decr')
          writeFileSync(tmpPath, buffer.subarray(PS4_PADDING_SIZE))
          const encrypted = await encryptPs4Save(tmpPath)
          writeFileSync(result.filePath, encrypted)
        }
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('save:import', async () => {
    if (!saveState) return { success: false, error: 'Load your current save file first.' }

    const result = await dialog.showOpenDialog({
      title: 'Select Save File to Import From',
      filters: [
        { name: 'Save Files', extensions: ['BIN'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Cancelled' }
    }

    const filePath = result.filePaths[0]
    const fileName = basename(filePath)

    try {
      let importBuffer: Buffer

      if (fileName === 'SAVEDATA.BIN') {
        importBuffer = await decryptPcSave(filePath)
      } else if (fileName === 'APP.BIN') {
        const ps4 = await decryptPs4Save(filePath)
        const padding = Buffer.alloc(PS4_PADDING_SIZE, 0)
        importBuffer = Buffer.concat([padding, ps4.buffer])
      } else {
        return { success: false, error: 'Unknown file format.' }
      }

      patchIntegrityBytes(importBuffer)

      const merged = Buffer.concat([
        saveState.buffer.subarray(0, 0x178),
        importBuffer.subarray(0x178)
      ])

      if (merged.length !== 0x296f28) {
        return { success: false, error: 'Import failed: size mismatch between save files.' }
      }

      saveState.buffer = merged

      return {
        success: true,
        stats: parseStats(merged),
        weapons: parseWeapons(merged),
        items: parseItems(merged),
        scrolls: parseScrolls(merged)
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}

// Keep unused import happy
const _unused: ReadonlyArray<typeof readFileSync> = [readFileSync]
void _unused
