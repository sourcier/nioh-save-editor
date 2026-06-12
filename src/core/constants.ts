// ── Stats offsets ──────────────────────────────────────────────────────────────
export const AMRITA_OFFSET = 0x7b8d0
export const GOLD_OFFSET = 0x7b8d8
export const PLAYER_LEVEL = 0x1c4904
export const CONSTITUTION = 0x1c490c
export const HEART = 0x1c4910
export const COURAGE = 0x1c4928
export const STAMINA = 0x1c4914
export const STRENGTH = 0x1c4918
export const SKILL = 0x1c491c
export const DEXTERITY = 0x1c4920
export const MAGIC = 0x1c4924

// ── Proficiency offsets ────────────────────────────────────────────────────────
export const NINJITSU = 0x1c4b58
export const ONMYO = 0x1c4b64
export const SOUL_FRAGMENTS = 0x1c4b70
export const SWORD = 0x1c4a8c
export const DUAL_SWORD = 0x1c4a98
export const SPEAR = 0x1c4aa4
export const AXE = 0x1c4ab0
export const KUSARIGAMA = 0x1c4abc
export const ODACHI = 0x1c4ac8
export const TONFA = 0x1c4ad4
export const HATCHET = 0x1c4ae0
export const SWITCHGLAIVE = 0x1c4aec
export const SPLITSTAFF = 0x1c4af8
export const FIST = 0x1c4b04

// ── Inventory offsets ──────────────────────────────────────────────────────────
export const WEAPON_START = 0xed508
export const WEAPON_SIZE = 0x90
export const WEAPON_SLOTS = 700

export const ITEM_START = 0x105ec8
export const ITEM_SIZE = 0x88
export const ITEM_SLOTS = 900

export const SCROLL_START = 0x294080
export const SCROLL_SIZE = 0x88
export const SCROLL_SLOTS = 248

// ── Integrity check bytes to zero out ─────────────────────────────────────────
export const INTEGRITY_OFFSETS = [
  0x7b882 + 0x158,
  0x7b884 + 0x158,
  0x7b7e4 + 0x158,
  0xecf4a + 0x158
]

// ── PS4 padding ────────────────────────────────────────────────────────────────
export const PS4_PADDING_SIZE = 0x148
