import { dialog, ipcMain } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { basename } from 'path'
import { INTEGRITY_OFFSETS, PS4_PADDING_SIZE } from '../core/constants'
import { N3_DECRYPTED_FILE_SIZE } from '../core/constants-n3'
import { parseItems, parseScrolls, parseStats, parseWeapons } from '../core/save-parser'
import { parseNioh3Equipment, parseNioh3Stats, parseNioh3Storage, parseNioh3Usables } from '../core/save-parser-n3'
import { writeItems, writeScrolls, writeStats, writeWeapons } from '../core/save-writer'
import { writeNioh3Equipment, writeNioh3Stats, writeNioh3Storage, writeNioh3Usables } from '../core/save-writer-n3'
import { patchNioh3Checksum } from '../core/checksum-n3'
import type {
  CharacterStats,
  CharacterStatsN3,
  Item,
  Nioh3Equipment,
  Nioh3Usable,
  SaveMode,
  Scroll,
  Weapon
} from '../core/types'
import {
  decryptNioh3PcSave,
  decryptPcSave,
  decryptPs4Save,
  encryptNioh3PcSave,
  encryptPcSave,
  encryptPs4Save
} from './save-crypto'

interface SaveState {
  buffer: Buffer
  mode: SaveMode
  game: 'Nioh2' | 'Nioh3'
  isAlreadyDecrypted: boolean
}

let saveState: SaveState | null = null

function patchIntegrityBytes(buf: Buffer): void {
  for (const off of INTEGRITY_OFFSETS) {
    if (off < buf.length) buf.writeUInt8(0, off)
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle('save:open', async (_, game: 'Nioh2' | 'Nioh3') => {
    const result = await dialog.showOpenDialog({
      title: game === 'Nioh3' ? 'Select Nioh 3 Save File (SAVEDATA.BIN)' : 'Select Nioh 2 Save File',
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
      if (game === 'Nioh3') {
        if (fileName !== 'SAVEDATA.BIN') {
          return { success: false, error: 'Nioh 3 saves must be named SAVEDATA.BIN.' }
        }
        const buffer = await decryptNioh3PcSave(filePath)
        if (buffer.length !== N3_DECRYPTED_FILE_SIZE) {
          return {
            success: false,
            error: `Unexpected decrypted size (0x${buffer.length.toString(16)}). Are you sure this is a Nioh 3 save?`
          }
        }
        saveState = { buffer, mode: 'Nioh3', game: 'Nioh3', isAlreadyDecrypted: false }
        return {
          success: true,
          game: 'Nioh3',
          mode: 'Nioh3',
          statsN3: parseNioh3Stats(buffer),
          equipment: parseNioh3Equipment(buffer),
          usables: parseNioh3Usables(buffer),
          storage: parseNioh3Storage(buffer)
        }
      }

      // ── Nioh 2 ───────────────────────────────────────────────────────────────
      let buffer: Buffer
      let mode: SaveMode
      let isAlreadyDecrypted = false

      if (fileName === 'SAVEDATA.BIN') {
        mode = 'PC'
        buffer = await decryptPcSave(filePath)
        patchIntegrityBytes(buffer)
      } else if (fileName === 'APP.BIN') {
        mode = 'PS4'
        const ps4 = await decryptPs4Save(filePath)
        isAlreadyDecrypted = ps4.alreadyDecrypted
        const padding = Buffer.alloc(PS4_PADDING_SIZE, 0)
        buffer = Buffer.concat([padding, ps4.buffer])
        patchIntegrityBytes(buffer)
      } else {
        return {
          success: false,
          error: 'Unknown file format. Please select SAVEDATA.BIN (PC) or APP.BIN (PS4).'
        }
      }

      saveState = { buffer, mode, game: 'Nioh2', isAlreadyDecrypted }
      return {
        success: true,
        game: 'Nioh2',
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
      payload:
        | {
            game: 'Nioh2'
            stats: CharacterStats
            weapons: Weapon[]
            items: Item[]
            scrolls: Scroll[]
          }
        | {
            game: 'Nioh3'
            statsN3: CharacterStatsN3
            equipment: Nioh3Equipment[]
            usables: Nioh3Usable[]
            storage: Nioh3Usable[]
          }
    ) => {
      if (!saveState) return { success: false, error: 'No save file loaded.' }

      const { buffer, mode, isAlreadyDecrypted } = saveState

      if (payload.game === 'Nioh3') {
        writeNioh3Stats(buffer, payload.statsN3)
        writeNioh3Equipment(buffer, payload.equipment)
        writeNioh3Usables(buffer, payload.usables)
        writeNioh3Storage(buffer, payload.storage)
        patchNioh3Checksum(buffer)
      } else {
        writeStats(buffer, payload.stats)
        writeWeapons(buffer, payload.weapons)
        writeItems(buffer, payload.items)
        writeScrolls(buffer, payload.scrolls)
      }

      const result = await dialog.showSaveDialog({
        title: payload.game === 'Nioh3' ? 'Save Nioh 3 Save File' : 'Save Nioh 2 Save File',
        defaultPath: mode === 'PS4' ? 'APP.BIN' : 'SAVEDATA.BIN',
        filters: [
          { name: 'Save Files', extensions: ['BIN'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) return { success: false, error: 'Cancelled' }

      try {
        if (payload.game === 'Nioh3') {
          const encrypted = await encryptNioh3PcSave(buffer)
          writeFileSync(result.filePath, encrypted)
        } else if (mode === 'PC') {
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
        game: 'Nioh2',
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
