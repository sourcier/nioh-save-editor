import {
  N3_CHECKSUM_DATA_END,
  N3_CHECKSUM_DATA_START,
  N3_CHECKSUM_RESULT_OFFSET,
  N3_CHECKSUM_SEED_OFFSET
} from './constants-n3'

/**
 * Compute the Nioh 3 save checksum.
 *
 * Algorithm (ported from checksum.py in alfizari/Nioh-3-Save-Editor):
 *   - Split data[0x190..0x900190] into 0x2400 blocks of 0x400 bytes each
 *   - For each block accumulate two signed 64-bit sums, then combine them
 *   - Combine each block's sum into a running 64-bit total, XORed with the seed
 *   - Fold the 64-bit total into a 32-bit result
 */
export function computeNioh3Checksum(buf: Buffer): number {
  const seed = buf.readUInt32LE(N3_CHECKSUM_SEED_OFFSET)
  const seedBig = BigInt(seed)

  const blockSize  = 0x400
  const dataLength = N3_CHECKSUM_DATA_END - N3_CHECKSUM_DATA_START  // 0x900000
  const blockCount = dataLength / blockSize                           // 0x2400
  const mask64 = (1n << 64n) - 1n

  let total = 0n

  for (let b = 0; b < blockCount; b++) {
    let acc1 = 0n
    let acc2 = 0n
    const base = N3_CHECKSUM_DATA_START + b * blockSize

    for (let i = 0; i < blockSize; i += 16) {
      acc1 += buf.readBigInt64LE(base + i)
      acc2 += buf.readBigInt64LE(base + i + 8)
    }

    const blockSum = (acc1 + acc2) & mask64

    // Python: total = (total + block_sum ^ seed) & mask
    // `+` binds tighter than `^` in Python, so this is:
    //   total = ((total + block_sum) ^ seed) & mask
    total = ((total + blockSum) ^ seedBig) & mask64
  }

  // Fold 64-bit → 32-bit: (total // 0xFFFFFFFF) + (total & 0xFFFFFFFF)
  const folded = (total / 0xFFFFFFFFn) + (total & 0xFFFFFFFFn)
  return Number(folded & 0xFFFFFFFFn)
}

/**
 * Patch the Nioh 3 checksum in-place.
 * Reads the seed from offset 0x900190, computes the checksum over
 * data[0x190..0x900190], and writes it at offset 0x900194.
 */
export function patchNioh3Checksum(buf: Buffer): void {
  const checksum = computeNioh3Checksum(buf)
  buf.writeUInt32LE(checksum, N3_CHECKSUM_RESULT_OFFSET)
}
