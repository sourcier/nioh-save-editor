import { existsSync } from 'fs'
import { join } from 'path'
import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import type { SaveMode } from '../core/types'
import { niohCrypt, isDecrypted } from './nioh-crypto'

const execFileAsync = promisify(execFile)

/**
 * Run an interactive CLI tool that prints "Press Enter To Exit…" and waits for
 * stdin.  We spawn it with a piped stdin and immediately write \n so it exits
 * cleanly instead of hanging forever.
 */
function runInteractiveExe(exe: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] })
    // Dismiss the "Press Enter To Exit..." prompt immediately
    child.stdin.write('\n')
    child.stdin.end()
    child.on('close', (code) => {
      if (code === 0 || code === null) resolve()
      else reject(new Error(`pc.exe exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

function getToolsDir(): string {
  if (process.env['NODE_ENV'] === 'development' || !process.resourcesPath) {
    return join(__dirname, '../../tools')
  }
  return join(process.resourcesPath, 'tools')
}

/**
 * Decrypt a PC SAVEDATA.BIN using the pure-TypeScript implementation.
 * Falls back to pc.exe if the native implementation fails (e.g. unexpected file format).
 */
export async function decryptPcSave(filePath: string): Promise<Buffer> {
  const { readFileSync } = await import('fs')
  const raw = Buffer.from(readFileSync(filePath))

  if (isDecrypted(raw)) return raw  // already decrypted

  try {
    const result = niohCrypt(raw)
    if (!isDecrypted(result)) {
      throw new Error('Native decryption produced unexpected output — magic bytes not found.')
    }
    return result
  } catch (nativeErr) {
    // Fall back to exe on Windows if native fails
    const toolsDir = getToolsDir()
    const exe = join(toolsDir, 'nioh2-pc', 'pc.exe')
    if (!existsSync(exe)) {
      throw new Error(
        `Native decryption failed (${nativeErr}) and pc.exe not found at ${exe}.`
      )
    }
    const { copyFileSync } = await import('fs')
    const tmpPath = join(toolsDir, 'nioh2-pc', 'SAVEDATA.BIN')
    copyFileSync(filePath, tmpPath)
    await execFileAsync(exe, [tmpPath], { cwd: join(toolsDir, 'nioh2-pc') })
    return Buffer.from(readFileSync(join(toolsDir, 'nioh2-pc', 'decr_SAVEDATA.BIN')))
  }
}

/**
 * Re-encrypt a decrypted PC save buffer.
 * Uses pure-TypeScript native crypto; falls back to pc.exe on failure.
 */
export async function encryptPcSave(decryptedBuf: Buffer): Promise<Buffer> {
  if (!isDecrypted(decryptedBuf)) return decryptedBuf  // already encrypted

  try {
    return niohCrypt(decryptedBuf)
  } catch (nativeErr) {
    const toolsDir = getToolsDir()
    const exe = join(toolsDir, 'nioh2-pc', 'pc.exe')
    if (!existsSync(exe)) {
      throw new Error(
        `Native encryption failed (${nativeErr}) and pc.exe not found at ${exe}.`
      )
    }
    const { writeFileSync, readFileSync } = await import('fs')
    const tmpPath = join(toolsDir, 'nioh2-pc', 'decr_SAVEDATA.BIN')
    writeFileSync(tmpPath, decryptedBuf)
    await execFileAsync(exe, [tmpPath], { cwd: join(toolsDir, 'nioh2-pc') })
    return Buffer.from(readFileSync(join(toolsDir, 'nioh2-pc', 'decr_decr_SAVEDATA.BIN')))
  }
}

/**
 * PS4 saves exported by Save Wizard are already raw game data (magic 00 00 00 00).
 * For those we need no decryption tool at all. For PS4-encrypted saves (with
 * PS4-level encryption intact) we still need ps4.exe on Windows.
 */
export async function decryptPs4Save(filePath: string): Promise<{ buffer: Buffer; alreadyDecrypted: boolean }> {
  const { readFileSync, copyFileSync } = await import('fs')
  const raw = Buffer.from(readFileSync(filePath))
  const magic = raw.subarray(0, 4)

  if (magic.every((b) => b === 0)) {
    // Save Wizard output — no crypto needed
    return { buffer: raw, alreadyDecrypted: true }
  }

  // PS4-encrypted save — needs ps4.exe (Windows only)
  const toolsDir = getToolsDir()
  const exe = join(toolsDir, 'ps4', 'ps4.exe')
  if (!existsSync(exe)) {
    throw new Error(
      `PS4-encrypted saves require ps4.exe at ${exe}.\n` +
      `If you have a Save Wizard decrypted file (first 4 bytes are 00 00 00 00), open that instead.`
    )
  }

  const dst = join(toolsDir, 'ps4', 'APP.BIN')
  copyFileSync(filePath, dst)
  await execFileAsync(exe, [dst], { cwd: join(toolsDir, 'ps4') })
  const decryptedPath = join(toolsDir, 'ps4', 'APP.BIN_out.bin')
  return { buffer: Buffer.from(readFileSync(decryptedPath)), alreadyDecrypted: false }
}

export async function encryptPs4Save(decryptedPath: string): Promise<Buffer> {
  const toolsDir = getToolsDir()
  const exe = join(toolsDir, 'ps4', 'ps4.exe')
  if (!existsSync(exe)) {
    throw new Error(`PS4 re-encryption requires ps4.exe at ${exe}.`)
  }
  await execFileAsync(exe, [decryptedPath], { cwd: join(toolsDir, 'ps4') })
  const { readFileSync } = await import('fs')
  return Buffer.from(readFileSync(join(toolsDir, 'ps4', 'APP.BIN_out.bin_out.bin')))
}

// ── Nioh 3 PC ─────────────────────────────────────────────────────────────────

/**
 * Decrypt a Nioh 3 SAVEDATA.BIN using the nioh3-pc/pc.exe tool.
 * The exe is expected at tools/nioh3-pc/pc.exe and was obtained from
 * https://github.com/alfizari/Nioh-3-Save-Editor (PC/ folder).
 */
export async function decryptNioh3PcSave(filePath: string): Promise<Buffer> {
  const toolsDir = getToolsDir()
  const exe = join(toolsDir, 'nioh3-pc', 'pc.exe')
  if (!existsSync(exe)) {
    throw new Error(
      `Nioh 3 decryption requires pc.exe at ${exe}.\n` +
      `Copy pc.exe from the PC/ folder of https://github.com/alfizari/Nioh-3-Save-Editor into tools/nioh3-pc/.`
    )
  }

  const { copyFileSync, readFileSync } = await import('fs')
  const workDir = join(toolsDir, 'nioh3-pc')
  copyFileSync(filePath, join(workDir, 'SAVEDATA.BIN'))

  // Use relative filename so the exe writes decr_SAVEDATA.BIN into its own directory.
  // Pass \n to stdin because the exe always ends with "Press Enter To Exit...".
  await runInteractiveExe(exe, ['SAVEDATA.BIN'], workDir)
  return Buffer.from(readFileSync(join(workDir, 'decr_SAVEDATA.BIN')))
}

/**
 * Re-encrypt a Nioh 3 decrypted buffer using nioh3-pc/pc.exe.
 */
export async function encryptNioh3PcSave(decryptedBuf: Buffer): Promise<Buffer> {
  const toolsDir = getToolsDir()
  const exe = join(toolsDir, 'nioh3-pc', 'pc.exe')
  if (!existsSync(exe)) {
    throw new Error(`Nioh 3 re-encryption requires pc.exe at ${exe}.`)
  }

  const { writeFileSync, readFileSync } = await import('fs')
  const workDir = join(toolsDir, 'nioh3-pc')
  writeFileSync(join(workDir, 'decr_SAVEDATA.BIN'), decryptedBuf)

  await runInteractiveExe(exe, ['decr_SAVEDATA.BIN'], workDir)
  return Buffer.from(readFileSync(join(workDir, 'decr_decr_SAVEDATA.BIN')))
}

// Legacy aliases kept for backward compatibility
export const SaveMode_unused = null as unknown as SaveMode

