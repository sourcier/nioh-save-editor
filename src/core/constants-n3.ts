// ── Nioh 3 Stats offsets ───────────────────────────────────────────────────────
export const N3_AMRITA_OFFSET     = 0x3AED52
export const N3_GOLD_OFFSET       = 0x3AED62
export const N3_CONSTITUTION      = 0x3AEE6C
export const N3_HEART             = 0x3AEE70
export const N3_STAMINA           = 0x3AEE74
export const N3_STRENGTH          = 0x3AEE78
export const N3_SKILL             = 0x3AEE7C
export const N3_INTELLECT         = 0x3AEE80
export const N3_MAGIC             = 0x3AEE84

// ── Nioh 3 Equipment (weapons + armor) ────────────────────────────────────────
// 0xF0 bytes per slot, 0x9C4 slots
export const N3_ITEM_START  = 0x24125E
export const N3_ITEM_SIZE   = 0xF0
export const N3_ITEM_SLOTS  = 0x9C4  // 2500

// ── Nioh 3 Usables (consumables / materials) ──────────────────────────────────
// 0xE8 bytes per slot, 0x5DC slots
export const N3_USABLE_START = 0x2D3A2A
export const N3_USABLE_SIZE  = 0xE8
export const N3_USABLE_SLOTS = 0x5DC  // 1500

// ── Nioh 3 Storage box ────────────────────────────────────────────────────────
// 0xE8 bytes per slot, 0x189 slots
export const N3_STORAGE_START = 0x328996
export const N3_STORAGE_SIZE  = 0xE8
export const N3_STORAGE_SLOTS = 0x189  // 393

// ── Nioh 3 Effect structure constants ─────────────────────────────────────────
export const N3_EFFECT_SIZE  = 0x18   // 24 bytes per effect
export const N3_EFFECT_COUNT = 7      // 7 effects per item

// ── Offsets within a Nioh 3 equipment slot ────────────────────────────────────
export const N3_EQ_ITEM_ID           = 0x00  // u16
export const N3_EQ_APPEARANCE_ID     = 0x02  // u16
export const N3_EQ_QUANTITY          = 0x04  // u16
export const N3_EQ_ITEM_LEVEL        = 0x06  // u16
export const N3_EQ_ITEM_LEVEL_PRE    = 0x08  // u16
export const N3_EQ_PLUS_VALUE        = 0x0A  // u16
export const N3_EQ_FAMILIARITY       = 0x14  // u32
export const N3_EQ_FLAGS1            = 0x18  // u8
export const N3_EQ_FLAGS2            = 0x1A  // u8
export const N3_EQ_INV_INDEX         = 0x1C  // u16
export const N3_EQ_UI1               = 0x28  // u8
export const N3_EQ_UI2               = 0x29  // u8
export const N3_EQ_RARITY            = 0x30  // u8
export const N3_EQ_EFFECTS_BASE      = 0x38  // 7 × 0x18 bytes
export const N3_EQ_EQUIPPED_FLAG1    = 0xE8  // u8  (equipment only)
export const N3_EQ_EQUIPPED_FLAG2    = 0xEC  // u8  (equipment only)

// ── Offsets within a Nioh 3 effect (0x18 bytes) ───────────────────────────────
export const N3_EFF_ID           = 0x00  // u16
export const N3_EFF_VALUE        = 0x04  // u32
export const N3_EFF_CATEGORY     = 0x09  // u8
export const N3_EFF_EXTRA        = 0x0A  // u8

// ── Checksum constants ─────────────────────────────────────────────────────────
export const N3_CHECKSUM_SEED_OFFSET   = 0x900190  // u32 seed
export const N3_CHECKSUM_RESULT_OFFSET = 0x900194  // u32 computed checksum
export const N3_CHECKSUM_DATA_START    = 0x190
export const N3_CHECKSUM_DATA_END      = 0x900190

// ── Detection: expected decrypted file size for Nioh 3 ───────────────────────
export const N3_DECRYPTED_FILE_SIZE = 0x9001B0
