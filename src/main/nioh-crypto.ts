/**
 * Pure TypeScript port of pawREP's Nioh Savedata Decryption Tool
 * (https://github.com/pawREP/Nioh-Savedata-Decryption-Tool)
 *
 * The save file uses AES-128 in CTR mode with a custom, non-invertible SBox.
 * Because the SBox is non-invertible, the forward AES encrypt pass is used for
 * both encryption and decryption (CTR mode property: E(E(data)) = data).
 *
 * Supports PC SAVEDATA.BIN and can also detect already-decrypted PS4 APP.BIN.
 */

// ── Custom SBox (same table used for both SubBytes and InvSubBytes) ────────────
// prettier-ignore
const SBOX = new Uint8Array([
  0x1C,0x2F,0x03,0x53,0xA3,0x01,0x49,0xDA,0xA6,0xCD,0xE0,0x8A,0x19,0xA7,0x04,0xD4,
  0x06,0x1A,0xDA,0x49,0x08,0xE2,0xF6,0xB2,0x9E,0xE1,0x22,0x49,0xCE,0x7B,0x7E,0x5E,
  0xA0,0x09,0x2A,0x63,0xAF,0x49,0xCE,0x70,0x7B,0x3C,0x23,0x80,0xFA,0x17,0x47,0xF2,
  0x62,0x62,0x6C,0x59,0x10,0xCC,0x29,0x9C,0xB5,0x46,0x58,0xC7,0x44,0x13,0xE7,0x38,
  0xD5,0xAF,0x27,0x83,0xD4,0xD5,0xA0,0x9E,0xE3,0x76,0x3B,0x85,0x04,0xD9,0xD6,0x98,
  0x60,0x66,0xD4,0x78,0x53,0xEA,0xCA,0x0E,0x8D,0x56,0x53,0x44,0xE2,0xEF,0xBD,0xA9,
  0x9B,0x10,0x0A,0xA1,0x13,0x93,0xF0,0x43,0x0B,0x7C,0x39,0x8A,0x47,0xDF,0xD3,0xC5,
  0x0E,0x34,0x31,0xA6,0xAE,0x5A,0xB8,0xE7,0xE6,0x31,0x43,0xC0,0xAA,0x0F,0xE0,0x82,
  0x12,0x4C,0xD1,0xDF,0x8B,0xA5,0xAC,0x70,0xC5,0x3D,0x1B,0x8E,0x93,0x17,0x4D,0x79,
  0x4E,0xCE,0x63,0xC4,0x33,0x0E,0x14,0x57,0xF0,0xD8,0x19,0x5B,0x9B,0x61,0x71,0xF2,
  0x2B,0x33,0x7E,0xFD,0x2C,0x0B,0xB6,0x23,0x20,0xB9,0xD4,0x91,0x19,0x94,0x04,0xA4,
  0x30,0x13,0x8A,0xF1,0xD0,0x05,0xEC,0x5E,0xAC,0x4A,0xD4,0xD6,0xA5,0x17,0x7F,0xF9,
  0xE5,0xF6,0x00,0x29,0xD7,0x93,0x2D,0x5E,0x2C,0xF1,0x81,0xA3,0xB7,0x63,0x39,0x57,
  0xC2,0x33,0x87,0x2D,0xA8,0x3F,0x02,0xCC,0x08,0x67,0x74,0x60,0xD8,0xF0,0xDA,0x67,
  0x40,0x64,0x87,0x55,0xBB,0x7F,0xF2,0x10,0xC9,0x03,0x14,0xB5,0x80,0x66,0xCB,0x91,
  0xF6,0x1F,0x79,0x58,0x88,0xBC,0x95,0xC2,0x06,0x5F,0xE9,0x09,0x32,0xED,0x9B,0x85,
])

// Round constants for AES-128 key schedule (same as standard AES)
// prettier-ignore
const RCON = new Uint8Array([0x8d,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36])

const Nb = 4  // columns in AES state
const Nk = 4  // 32-bit words in key (AES-128)
const Nr = 10 // rounds for AES-128
const BLOCK = 16

// ── GF(2^8) multiply by 2 ─────────────────────────────────────────────────────
function xtime(x: number): number {
  return ((x << 1) ^ (((x >> 7) & 1) * 0x1b)) & 0xff
}

// ── AES-128 key expansion (modified: initial round key bytes are byte-reversed per word) ──
function keyExpansion(key: Uint8Array): Uint8Array {
  const roundKey = new Uint8Array((Nr + 1) * Nb * 4)

  // First round key: copy key with bytes reversed within each 32-bit word
  for (let i = 0; i < Nk; i++) {
    roundKey[i * 4 + 0] = key[i * 4 + 3]
    roundKey[i * 4 + 1] = key[i * 4 + 2]
    roundKey[i * 4 + 2] = key[i * 4 + 1]
    roundKey[i * 4 + 3] = key[i * 4 + 0]
  }

  const temp = new Uint8Array(4)
  for (let i = Nk; i < Nb * (Nr + 1); i++) {
    temp[0] = roundKey[(i - 1) * 4 + 0]
    temp[1] = roundKey[(i - 1) * 4 + 1]
    temp[2] = roundKey[(i - 1) * 4 + 2]
    temp[3] = roundKey[(i - 1) * 4 + 3]

    if (i % Nk === 0) {
      // RotWord
      const k = temp[0]
      temp[0] = temp[1]; temp[1] = temp[2]; temp[2] = temp[3]; temp[3] = k
      // SubWord
      temp[0] = SBOX[temp[0]]; temp[1] = SBOX[temp[1]]
      temp[2] = SBOX[temp[2]]; temp[3] = SBOX[temp[3]]
      temp[0] ^= RCON[i / Nk]
    }

    roundKey[i * 4 + 0] = roundKey[(i - Nk) * 4 + 0] ^ temp[0]
    roundKey[i * 4 + 1] = roundKey[(i - Nk) * 4 + 1] ^ temp[1]
    roundKey[i * 4 + 2] = roundKey[(i - Nk) * 4 + 2] ^ temp[2]
    roundKey[i * 4 + 3] = roundKey[(i - Nk) * 4 + 3] ^ temp[3]
  }

  return roundKey
}

// ── AES-128 ECB encrypt (16-byte block, custom SBox) ──────────────────────────
function aesEcbEncrypt(input: Uint8Array, key: Uint8Array): Uint8Array {
  const roundKey = keyExpansion(key)

  // Load state column-major: state[col][row]
  const state: number[][] = Array.from({ length: 4 }, (_, col) =>
    Array.from({ length: 4 }, (_, row) => input[col * 4 + row])
  )

  function addRoundKey(round: number): void {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        state[i][j] ^= roundKey[round * Nb * 4 + i * Nb + j]
      }
    }
  }

  function subBytes(): void {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) state[j][i] = SBOX[state[j][i]]
  }

  function shiftRows(): void {
    let t: number
    // Row 1: shift left 1
    t = state[0][1]; state[0][1] = state[1][1]; state[1][1] = state[2][1]; state[2][1] = state[3][1]; state[3][1] = t
    // Row 2: shift left 2
    t = state[0][2]; state[0][2] = state[2][2]; state[2][2] = t
    t = state[1][2]; state[1][2] = state[3][2]; state[3][2] = t
    // Row 3: shift left 3
    t = state[0][3]; state[0][3] = state[3][3]; state[3][3] = state[2][3]; state[2][3] = state[1][3]; state[1][3] = t
  }

  function mixColumns(): void {
    for (let i = 0; i < 4; i++) {
      const t = state[i][0]
      const Tmp = state[i][0] ^ state[i][1] ^ state[i][2] ^ state[i][3]
      let Tm: number
      Tm = xtime(state[i][0] ^ state[i][1]); state[i][0] ^= Tm ^ Tmp
      Tm = xtime(state[i][1] ^ state[i][2]); state[i][1] ^= Tm ^ Tmp
      Tm = xtime(state[i][2] ^ state[i][3]); state[i][2] ^= Tm ^ Tmp
      Tm = xtime(state[i][3] ^ t);           state[i][3] ^= Tm ^ Tmp
    }
  }

  addRoundKey(0)
  for (let round = 1; round < Nr; round++) {
    subBytes()
    shiftRows()
    mixColumns()
    addRoundKey(round)
  }
  subBytes()
  shiftRows()
  addRoundKey(Nr)

  const out = new Uint8Array(BLOCK)
  for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++) out[col * 4 + row] = state[col][row]
  return out
}

// ── Helper utilities ───────────────────────────────────────────────────────────
function flip32BitEndianness(arr: Uint8Array): void {
  for (let i = 0; i < 4; i++) {
    const a = arr[4 * i]; const b = arr[4 * i + 1]
    const c = arr[4 * i + 2]; const d = arr[4 * i + 3]
    arr[4 * i] = d; arr[4 * i + 1] = c; arr[4 * i + 2] = b; arr[4 * i + 3] = a
  }
}

function incrByteArray(arr: Uint8Array, incr = 0): void {
  if (incr >= arr.length) return
  const idx = arr.length - incr - 1
  if (arr[idx] === 0xff) {
    arr[idx] = 0x00
    incrByteArray(arr, incr + 1)
  } else {
    arr[idx]++
  }
}

// ── Root crypto blob (148 bytes, hardcoded in pawREP's original C++ code) ─────
// prettier-ignore
const ROOT_CRYPTO_BLOB = new Uint8Array([
  0x54,0x19,0x31,0x3E,0xF4,0x6B,0xE4,0x24,0xCD,0xA7,0x96,0x6F,0xAB,0xF0,0x69,0xCA,
  0x00,0x00,0x80,0xBF,0xEC,0x3B,0x9D,0xA1,0x46,0x0C,0xDD,0x33,0xF3,0xD2,0x58,0xE0,
  0xC0,0x9F,0xC7,0xD4,0xF6,0xEF,0xDC,0x70,0x92,0x6F,0x52,0xD8,0xF1,0xBD,0x54,0x36,
  0xA2,0xCB,0xAC,0xA3,0x99,0xFC,0xC8,0xD2,0xA9,0x61,0x72,0x6B,0xD7,0x8D,0x15,0xB8,
  0x80,0xAC,0xA0,0xB5,0x9A,0xA0,0xEE,0x1E,0x8B,0xF5,0xD9,0xDA,0x2C,0x92,0xAE,0xB4,
  0x9D,0x92,0xE0,0x79,0xAA,0x76,0x55,0x31,0xBC,0xE3,0x02,0x00,0x7A,0xB9,0x53,0x7F,
  0xE2,0x60,0xF5,0x26,0x2B,0x1E,0x7D,0xA7,0x5D,0xD1,0xBD,0x84,0x23,0x3B,0xE4,0x32,
  0x33,0x03,0xA4,0x81,0x84,0x98,0x97,0xAB,0x63,0x7A,0x82,0x25,0x39,0x9F,0xC0,0x73,
  0x49,0x63,0x94,0xFD,0xD8,0xDE,0xA8,0xC8,0xB0,0x36,0x52,0xCD,0x07,0xD6,0xA2,0x0A,
  0xF2,0x00,0x8C,0x62,
])

const HEADER_SIZE = 0x148

// ── Key derivation ─────────────────────────────────────────────────────────────
function deconstructRootKeyPair(
  type: 'HEADER' | 'BODY',
  blob: Uint8Array
): { rootKey: Uint8Array; rootIV: Uint8Array } {
  const buffer = new Uint8Array(32)
  const rootKey = new Uint8Array(BLOCK)
  const rootIV = new Uint8Array(BLOCK)

  if (type === 'HEADER') {
    for (let i = 0; i < 4; i++) {
      const c1 = blob[8 + i], c2 = blob[0 + i], c3 = blob[12 + i], c4 = blob[4 + i]
      buffer[ 0 + i] = c1 ^ blob[20 + i]
      buffer[ 4 + i] = c2 ^ blob[24 + i]
      buffer[ 8 + i] = c3 ^ blob[28 + i]
      buffer[12 + i] = c4 ^ blob[32 + i]
      buffer[16 + i] = c1 ^ blob[36 + i]
      buffer[20 + i] = c2 ^ blob[40 + i]
      buffer[24 + i] = c3 ^ blob[44 + i]
      buffer[28 + i] = c4 ^ blob[48 + i]
    }
    rootKey.set(buffer.subarray(0, BLOCK))
    rootIV.set(buffer.subarray(BLOCK, BLOCK * 2))
  } else {
    for (let i = 0; i < 4; i++) {
      const c1 = blob[0 + i], c2 = blob[8 + i], c3 = blob[12 + i]
      const c4 = blob[56 + i], c5 = blob[52 + i], c6 = blob[60 + i], c7 = blob[4 + i]
      buffer[ 0 + i] = c2 ^ blob[68 + i]
      buffer[ 4 + i] = c1 ^ blob[72 + i]
      buffer[ 8 + i] = c3 ^ blob[76 + i]
      buffer[12 + i] = c7 ^ blob[80 + i]
      buffer[16 + i] = c2 ^ c5
      buffer[20 + i] = c1 ^ c4
      buffer[24 + i] = c3 ^ c6
      buffer[28 + i] = c7 ^ blob[64 + i]
    }
    // Body: reverse order — rootIV first, then rootKey
    rootIV.set(buffer.subarray(0, BLOCK))
    rootKey.set(buffer.subarray(BLOCK, BLOCK * 2))
  }

  flip32BitEndianness(rootKey)
  return { rootKey, rootIV }
}

function keySetup(
  type: 'HEADER' | 'BODY',
  blob: Uint8Array,
  saveClear?: Uint8Array
): { sKey1: Uint8Array; sIV1: Uint8Array; sKey2: Uint8Array; sIV2: Uint8Array } {
  const { rootKey, rootIV } = deconstructRootKeyPair(type, blob)

  const sKey1 = new Uint8Array(BLOCK)
  const sIV1 = new Uint8Array(BLOCK)
  const sKey2 = new Uint8Array(BLOCK)
  const sIV2 = new Uint8Array(BLOCK)

  if (type === 'HEADER') {
    sKey1.set(blob.subarray(84, 100))
    sIV1.set(blob.subarray(116, 132))
    sKey2.set(blob.subarray(100, 116))
    sIV2.set(blob.subarray(132, 148))
  } else {
    // Body sub-keys come from the decrypted header at fixed offsets
    if (!saveClear) throw new Error('saveClear required for BODY key setup')
    sKey1.set(saveClear.subarray(0x40, 0x50))
    sIV1.set(saveClear.subarray(0x50, 0x60))
    sKey2.set(saveClear.subarray(0x60, 0x70))
    sIV2.set(saveClear.subarray(0x70, 0x80))
  }

  const out1 = aesEcbEncrypt(rootIV, rootKey)
  for (let i = 0; i < BLOCK; i++) sKey1[i] ^= out1[i]
  flip32BitEndianness(sKey1)

  const out2 = aesEcbEncrypt(rootIV, rootKey)
  for (let i = 0; i < BLOCK; i++) sIV1[i] ^= out2[i]

  const out3 = aesEcbEncrypt(sIV1, sKey1)
  for (let i = 0; i < BLOCK; i++) sKey2[i] ^= out3[i]
  flip32BitEndianness(sKey2)

  const out4 = aesEcbEncrypt(sIV1, sKey1)
  for (let i = 0; i < BLOCK; i++) sIV2[i] ^= out4[i]

  return { sKey1, sIV1, sKey2, sIV2 }
}

// ── CTR pass: XOR data[start..start+n_rounds*BLOCK] with keystream ────────────
function ctrPass(
  src: Uint8Array,
  dst: Uint8Array,
  start: number,
  nRounds: number,
  iv: Uint8Array,
  key: Uint8Array
): void {
  const ivLocal = new Uint8Array(iv)
  for (let i = 0; i < nRounds; i++) {
    const ks = aesEcbEncrypt(ivLocal, key)
    incrByteArray(ivLocal)
    for (let j = 0; j < BLOCK; j++) {
      dst[start + i * BLOCK + j] = src[start + i * BLOCK + j] ^ ks[j]
    }
  }
}

// ── Header de/encryption (double CTR pass, different from body) ────────────────
function processHeader(
  encr: Uint8Array,
  clear: Uint8Array,
  sKey1: Uint8Array,
  sIV1: Uint8Array,
  sKey2: Uint8Array,
  sIV2: Uint8Array
): void {
  const nRounds = Math.floor(HEADER_SIZE / BLOCK) + 1
  const tmp = new Uint8Array(nRounds * BLOCK)

  // First pass with key2/IV2 into tmp
  ctrPass(encr, tmp, 0, nRounds, sIV2, sKey2)

  // Second pass XOR tmp with keystream from key1/IV1 into clear
  const tmp2 = new Uint8Array(nRounds * BLOCK)
  ctrPass(tmp, tmp2, 0, nRounds, sIV1, sKey1)
  clear.set(tmp2.subarray(0, HEADER_SIZE), 0)
}

// ── Body de/encryption ─────────────────────────────────────────────────────────
function processBody(
  encr: Uint8Array,
  clear: Uint8Array,
  sKey1: Uint8Array,
  sIV1: Uint8Array,
  sKey2: Uint8Array,
  sIV2: Uint8Array
): void {
  const bodySize = encr.length - HEADER_SIZE
  const nRounds = Math.floor(bodySize / BLOCK)

  // First pass key2/IV2
  ctrPass(encr, clear, HEADER_SIZE, nRounds, sIV2, sKey2)

  // Second pass key1/IV1
  const tmp = new Uint8Array(clear)
  ctrPass(tmp, clear, HEADER_SIZE, nRounds, sIV1, sKey1)
}

// ── Detect encrypted/decrypted ─────────────────────────────────────────────────
const NIOH_MAGIC = new Uint8Array([0x4e, 0x49, 0x4f, 0x48]) // 'NIOH'

export function isDecrypted(buf: Uint8Array | Buffer): boolean {
  return buf[0] === NIOH_MAGIC[0] && buf[1] === NIOH_MAGIC[1] &&
    buf[2] === NIOH_MAGIC[2] && buf[3] === NIOH_MAGIC[3]
}

// ── Main crypt function (same operation for encrypt and decrypt) ───────────────
export function niohCrypt(input: Buffer): Buffer {
  const encr = new Uint8Array(input)
  const clear = new Uint8Array(input.length)

  if (isDecrypted(encr)) {
    // Encrypting: copy header, then process body then header
    clear.set(encr.subarray(0, HEADER_SIZE), 0)
    const { sKey1, sIV1, sKey2, sIV2 } = keySetup('BODY', ROOT_CRYPTO_BLOB, clear)
    processBody(encr, clear, sKey1, sIV1, sKey2, sIV2)
    const { sKey1: hk1, sIV1: hiv1, sKey2: hk2, sIV2: hiv2 } = keySetup('HEADER', ROOT_CRYPTO_BLOB)
    processHeader(clear, clear, hk1, hiv1, hk2, hiv2)
  } else {
    // Decrypting: header first, then body
    const { sKey1: hk1, sIV1: hiv1, sKey2: hk2, sIV2: hiv2 } = keySetup('HEADER', ROOT_CRYPTO_BLOB)
    processHeader(encr, clear, hk1, hiv1, hk2, hiv2)

    const { sKey1, sIV1, sKey2, sIV2 } = keySetup('BODY', ROOT_CRYPTO_BLOB, clear)
    processBody(encr, clear, sKey1, sIV1, sKey2, sIV2)

    // Zero out body sub-keys in cleared output (sub-keys are randomly generated, no need to keep)
    const ZERO = new Uint8Array(BLOCK)
    clear.set(ZERO, 0x40)
    clear.set(ZERO, 0x50)
    clear.set(ZERO, 0x60)
    clear.set(ZERO, 0x70)
  }

  return Buffer.from(clear)
}
