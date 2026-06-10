import type { Effect } from './types'

export function readLE(buf: Buffer, offset: number, byteSize: number): number {
  switch (byteSize) {
    case 1:
      return buf.readUInt8(offset)
    case 2:
      return buf.readUInt16LE(offset)
    case 4:
      return buf.readUInt32LE(offset)
    default:
      throw new Error(`Unsupported byte size: ${byteSize}`)
  }
}

export function readBigLE(buf: Buffer, offset: number, byteSize: number): bigint {
  let val = 0n
  for (let i = 0; i < byteSize; i++) {
    val |= BigInt(buf.readUInt8(offset + i)) << BigInt(i * 8)
  }
  return val
}

export function writeLE(buf: Buffer, offset: number, value: number, byteSize: number): void {
  switch (byteSize) {
    case 1:
      buf.writeUInt8(value & 0xff, offset)
      break
    case 2:
      buf.writeUInt16LE(value & 0xffff, offset)
      break
    case 4:
      buf.writeUInt32LE(value >>> 0, offset)
      break
    default:
      throw new Error(`Unsupported byte size: ${byteSize}`)
  }
}

export function writeBigLE(buf: Buffer, offset: number, value: bigint, byteSize: number): void {
  for (let i = 0; i < byteSize; i++) {
    buf.writeUInt8(Number((value >> BigInt(i * 8)) & 0xffn), offset + i)
  }
}

/** Convert item id (little-endian u16) → 4-char uppercase hex with byte-swap for JSON lookup */
export function swapEndianHex(val: number): string {
  const swapped = ((val & 0xff) << 8) | (val >> 8)
  return swapped.toString(16).padStart(4, '0').toUpperCase()
}

export function readEffects(buf: Buffer, offset: number, count: number): { effects: Effect[]; offset: number } {
  const effects: Effect[] = []
  for (let i = 0; i < count; i++) {
    effects.push({
      id: readLE(buf, offset, 4),
      magnitude: readLE(buf, offset + 4, 4),
      footerPart1: readLE(buf, offset + 8, 2),
      footerPart2: readLE(buf, offset + 10, 2)
    })
    offset += 12
  }
  return { effects, offset }
}

export function writeEffects(buf: Buffer, offset: number, effects: Effect[]): number {
  for (const effect of effects) {
    writeLE(buf, offset, effect.id, 4)
    writeLE(buf, offset + 4, effect.magnitude, 4)
    writeLE(buf, offset + 8, effect.footerPart1, 2)
    writeLE(buf, offset + 10, effect.footerPart2, 2)
    offset += 12
  }
  return offset
}
