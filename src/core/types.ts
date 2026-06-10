export type SaveMode = 'PC' | 'PS4'

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
  sword: number
  dualSword: number
  axe: number
  kusarigama: number
  odachi: number
  tonfa: number
  hatchet: number
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
