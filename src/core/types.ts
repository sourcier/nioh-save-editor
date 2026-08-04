export type SaveMode = 'PC' | 'PS4' | 'Nioh3'

export interface Effect {
  id: number
  magnitude: number
  footerPart1: number
  footerPart2: number
}

export interface Weapon {
  slot: number
  itemId: number
  refashion: number
  quantity: number
  weaponLevel: number
  weaponLevelStart: number
  higherLevelModifier: number
  familiarity: number
  leftRight1: number
  leftRight2: number
  leftRight3: number
  leftRight4: number
  weaponTier: number
  leftRight5: number
  leftRight6: number
  leftRight7: number
  yokaiWeaponGauge: number
  rcmdLevel: number
  empty1: number
  remodelType: number
  attemptRemaining: number
  extra1: bigint
  effects: Effect[]
  empty2: number
  isEquipped: number
  empty3: bigint
}

export interface Item {
  slot: number
  itemId: number
  refashion: number
  quantity: number
}

export interface Scroll {
  slot: number
  itemId1: number
  itemId2: number
  itemId3: number
  itemLevel1: number
  itemLevel2: number
  higherLevelMod: number
  unk1: number
  extra1: number
  isLocked: number
  extra2: number
  tier: number
  unk2: number
  unk3: bigint
  attemptsRemaining: number
  unk4: bigint
  effects: Effect[]
  extra3: number
}

export interface CharacterStats {
  amrita: number
  gold: number
  level: number
  constitution: number
  heart: number
  courage: number
  stamina: number
  strength: number
  skill: number
  dexterity: number
  magic: number
  ninjitsu: number
  onmyo: number
  soulFragments: number
  sword: number
  dualSword: number
  spear: number
  axe: number
  kusarigama: number
  odachi: number
  tonfa: number
  hatchet: number
  switchglaive: number
  splitstaff: number
  fist: number
}

export interface SaveData {
  mode: SaveMode
  stats: CharacterStats
  weapons: Weapon[]
  items: Item[]
  scrolls: Scroll[]
}

export interface OpenFileResult {
  success: true
  mode: SaveMode
  stats: CharacterStats
  weapons: Weapon[]
  items: Item[]
  scrolls: Scroll[]
}

export interface ErrorResult {
  success: false
  error: string
}

export type IpcResult<T> = T | ErrorResult

export interface ItemData {
  name: string
  type: string
}

export interface EffectData {
  id: string
  Effect: string
}

// ── Nioh 3 types ──────────────────────────────────────────────────────────────

export interface Nioh3Effect {
  id: number        // u16 — raw little-endian value
  value: number     // u32
  categoryIcon: number  // u8
  effectExtra: number   // u8
}

/** Equipment slot (weapons, armour) — 0xF0 bytes per slot */
export interface Nioh3Equipment {
  slot: number
  itemId: number        // u16
  appearanceId: number  // u16
  quantity: number      // u16
  itemLevel: number     // u16
  itemLevelPreForge: number // u16
  plusValue: number     // u16
  familiarityRaw: number  // u32
  equipmentFlags1: number // u8
  equipmentFlags2: number // u8
  invIndex: number      // u16
  ui1: number           // u8
  ui2: number           // u8
  rarity: number        // u8
  effects: Nioh3Effect[]
  equippedFlag1: number // u8
  equippedFlag2: number // u8
}

/** Usable / Storage slot — 0xE8 bytes per slot */
export interface Nioh3Usable {
  slot: number
  itemId: number        // u16
  appearanceId: number  // u16
  quantity: number      // u16
  itemLevel: number     // u16
  itemLevelPreForge: number // u16
  plusValue: number     // u16
  familiarityRaw: number  // u32
  equipmentFlags1: number // u8
  invIndex: number      // u16
  ui1: number           // u8
  ui2: number           // u8
  rarity: number        // u8
  effects: Nioh3Effect[]
}

export interface CharacterStatsN3 {
  amrita: number
  gold: number
  constitution: number
  heart: number
  stamina: number
  strength: number
  skill: number
  intellect: number
  magic: number
}

export interface OpenFileResultNioh2 {
  success: true
  game: 'Nioh2'
  mode: 'PC' | 'PS4'
  stats: CharacterStats
  weapons: Weapon[]
  items: Item[]
  scrolls: Scroll[]
}

export interface OpenFileResultNioh3 {
  success: true
  game: 'Nioh3'
  mode: 'Nioh3'
  statsN3: CharacterStatsN3
  equipment: Nioh3Equipment[]
  usables: Nioh3Usable[]
  storage: Nioh3Usable[]
}

export type AnyOpenFileResult = OpenFileResultNioh2 | OpenFileResultNioh3
