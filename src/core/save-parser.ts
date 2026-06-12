import type { CharacterStats, Item, Scroll, Weapon } from './types'
import {
  AMRITA_OFFSET,
  AXE,
  CONSTITUTION,
  COURAGE,
  DEXTERITY,
  DUAL_SWORD,
  FIST,
  GOLD_OFFSET,
  HATCHET,
  HEART,
  ITEM_SIZE,
  ITEM_SLOTS,
  ITEM_START,
  KUSARIGAMA,
  MAGIC,
  NINJITSU,
  SOUL_FRAGMENTS,
  ODACHI,
  ONMYO,
  PLAYER_LEVEL,
  SCROLL_SIZE,
  SCROLL_SLOTS,
  SCROLL_START,
  SKILL,
  SPEAR,
  SPLITSTAFF,
  STAMINA,
  STRENGTH,
  SWORD,
  SWITCHGLAIVE,
  TONFA,
  WEAPON_SIZE,
  WEAPON_SLOTS,
  WEAPON_START
} from './constants'
import { readBigLE, readEffects, readLE } from './binary-utils'

export function parseStats(buf: Buffer): CharacterStats {
  return {
    amrita: readLE(buf, AMRITA_OFFSET, 4),
    gold: readLE(buf, GOLD_OFFSET, 4),
    level: readLE(buf, PLAYER_LEVEL, 4),
    constitution: readLE(buf, CONSTITUTION, 4),
    heart: readLE(buf, HEART, 4),
    courage: readLE(buf, COURAGE, 4),
    stamina: readLE(buf, STAMINA, 4),
    strength: readLE(buf, STRENGTH, 4),
    skill: readLE(buf, SKILL, 4),
    dexterity: readLE(buf, DEXTERITY, 4),
    magic: readLE(buf, MAGIC, 4),
    ninjitsu: readLE(buf, NINJITSU, 4),
    onmyo: readLE(buf, ONMYO, 4),
    soulFragments: readLE(buf, SOUL_FRAGMENTS, 4),
    sword: readLE(buf, SWORD, 4),
    dualSword: readLE(buf, DUAL_SWORD, 4),
    spear: readLE(buf, SPEAR, 4),
    axe: readLE(buf, AXE, 4),
    kusarigama: readLE(buf, KUSARIGAMA, 4),
    odachi: readLE(buf, ODACHI, 4),
    tonfa: readLE(buf, TONFA, 4),
    hatchet: readLE(buf, HATCHET, 4),
    switchglaive: readLE(buf, SWITCHGLAIVE, 4),
    splitstaff: readLE(buf, SPLITSTAFF, 4),
    fist: readLE(buf, FIST, 4)
  }
}

export function parseWeapons(buf: Buffer): Weapon[] {
  const weapons: Weapon[] = []

  for (let slot = 0; slot < WEAPON_SLOTS; slot++) {
    let off = WEAPON_START + slot * WEAPON_SIZE

    const itemId = readLE(buf, off, 2); off += 2
    const refashion = readLE(buf, off, 2); off += 2
    const quantity = readLE(buf, off, 2); off += 2
    const weaponLevel = readLE(buf, off, 2); off += 2
    const weaponLevelStart = readLE(buf, off, 2); off += 2
    const higherLevelModifier = readLE(buf, off, 2); off += 2
    const familiarity = readLE(buf, off, 4); off += 4
    const leftRight1 = readLE(buf, off, 1); off += 1
    const leftRight2 = readLE(buf, off, 1); off += 1
    const leftRight3 = readLE(buf, off, 1); off += 1
    const leftRight4 = readLE(buf, off, 1); off += 1
    const weaponTier = readLE(buf, off, 1); off += 1
    const leftRight5 = readLE(buf, off, 1); off += 1
    const leftRight6 = readLE(buf, off, 1); off += 1
    const leftRight7 = readLE(buf, off, 1); off += 1
    const yokaiWeaponGauge = readLE(buf, off, 2); off += 2
    const rcmdLevel = readLE(buf, off, 2); off += 2
    const empty1 = readLE(buf, off, 2); off += 2
    const remodelType = readLE(buf, off, 1); off += 1
    const attemptRemaining = readLE(buf, off, 1); off += 1
    const extra1 = readBigLE(buf, off, 16); off += 16

    const { effects, offset: effOff } = readEffects(buf, off, 7)
    off = effOff

    const empty2 = readLE(buf, off, 4); off += 4
    const isEquipped = readLE(buf, off, 1); off += 1
    const empty3 = readBigLE(buf, off, 7); off += 7

    weapons.push({
      slot,
      itemId,
      refashion,
      quantity,
      weaponLevel,
      weaponLevelStart,
      higherLevelModifier,
      familiarity,
      leftRight1,
      leftRight2,
      leftRight3,
      leftRight4,
      weaponTier,
      leftRight5,
      leftRight6,
      leftRight7,
      yokaiWeaponGauge,
      rcmdLevel,
      empty1,
      remodelType,
      attemptRemaining,
      extra1,
      effects,
      empty2,
      isEquipped,
      empty3
    })
  }

  return weapons
}

export function parseItems(buf: Buffer): Item[] {
  const items: Item[] = []

  for (let slot = 0; slot < ITEM_SLOTS; slot++) {
    let off = ITEM_START + slot * ITEM_SIZE

    const itemId = readLE(buf, off, 2); off += 2
    const refashion = readLE(buf, off, 2); off += 2
    const quantity = readLE(buf, off, 2)

    items.push({ slot, itemId, refashion, quantity })
  }

  return items
}

export function parseScrolls(buf: Buffer): Scroll[] {
  const scrolls: Scroll[] = []

  for (let slot = 0; slot < SCROLL_SLOTS; slot++) {
    const base = SCROLL_START + slot * SCROLL_SIZE
    if (base + SCROLL_SIZE > buf.length) break

    const itemId1 = readLE(buf, base, 2)
    if (itemId1 === 0) continue

    let off = base
    const id1 = readLE(buf, off, 2); off += 2
    const id2 = readLE(buf, off, 2); off += 2
    const id3 = readLE(buf, off, 2); off += 2
    const level1 = readLE(buf, off, 2); off += 2
    const level2 = readLE(buf, off, 2); off += 2
    const higherLevelMod = readLE(buf, off, 2); off += 2
    const unk1 = readLE(buf, off, 4); off += 4
    const extra1 = readLE(buf, off, 2); off += 2
    const isLocked = readLE(buf, off, 1); off += 1
    const extra2 = readLE(buf, off, 1); off += 1
    const tier = readLE(buf, off, 1); off += 1
    const unk2 = readLE(buf, off, 1); off += 1
    const unk3 = readBigLE(buf, off, 9); off += 9
    const attemptsRemaining = readLE(buf, off, 1); off += 1
    const unk4 = readBigLE(buf, off, 16); off += 16

    const { effects, offset: effOff } = readEffects(buf, off, 7)
    off = effOff

    const extra3 = readLE(buf, off, 4)

    scrolls.push({
      slot,
      itemId1: id1,
      itemId2: id2,
      itemId3: id3,
      itemLevel1: level1,
      itemLevel2: level2,
      higherLevelMod,
      unk1,
      extra1,
      isLocked,
      extra2,
      tier,
      unk2,
      unk3,
      attemptsRemaining,
      unk4,
      effects,
      extra3
    })
  }

  return scrolls
}
