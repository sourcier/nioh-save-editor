import type { CharacterStats, Item, Scroll, Weapon } from './types'
import {
  AMRITA_OFFSET,
  AXE,
  CONSTITUTION,
  COURAGE,
  DEXTERITY,
  DUAL_SWORD,
  GOLD_OFFSET,
  HATCHET,
  HEART,
  ITEM_SIZE,
  ITEM_START,
  KUSARIGAMA,
  MAGIC,
  NINJITSU,
  ODACHI,
  ONMYO,
  PLAYER_LEVEL,
  SCROLL_SIZE,
  SCROLL_START,
  SKILL,
  STAMINA,
  STRENGTH,
  SWORD,
  TONFA,
  WEAPON_SIZE,
  WEAPON_START
} from './constants'
import { writeBigLE, writeEffects, writeLE } from './binary-utils'

export function writeStats(buf: Buffer, stats: CharacterStats): void {
  writeLE(buf, AMRITA_OFFSET, stats.amrita, 4)
  writeLE(buf, GOLD_OFFSET, stats.gold, 4)
  writeLE(buf, PLAYER_LEVEL, stats.level, 4)
  writeLE(buf, CONSTITUTION, stats.constitution, 4)
  writeLE(buf, HEART, stats.heart, 4)
  writeLE(buf, COURAGE, stats.courage, 4)
  writeLE(buf, STAMINA, stats.stamina, 4)
  writeLE(buf, STRENGTH, stats.strength, 4)
  writeLE(buf, SKILL, stats.skill, 4)
  writeLE(buf, DEXTERITY, stats.dexterity, 4)
  writeLE(buf, MAGIC, stats.magic, 4)
  writeLE(buf, NINJITSU, stats.ninjitsu, 4)
  writeLE(buf, ONMYO, stats.onmyo, 4)
  writeLE(buf, SWORD, stats.sword, 4)
  writeLE(buf, DUAL_SWORD, stats.dualSword, 4)
  writeLE(buf, AXE, stats.axe, 4)
  writeLE(buf, KUSARIGAMA, stats.kusarigama, 4)
  writeLE(buf, ODACHI, stats.odachi, 4)
  writeLE(buf, TONFA, stats.tonfa, 4)
  writeLE(buf, HATCHET, stats.hatchet, 4)
}

export function writeWeapons(buf: Buffer, weapons: Weapon[]): void {
  for (const weapon of weapons) {
    let off = WEAPON_START + weapon.slot * WEAPON_SIZE

    writeLE(buf, off, weapon.itemId, 2); off += 2
    writeLE(buf, off, weapon.refashion, 2); off += 2
    writeLE(buf, off, weapon.quantity, 2); off += 2
    writeLE(buf, off, weapon.weaponLevel, 2); off += 2
    writeLE(buf, off, weapon.weaponLevelStart, 2); off += 2
    writeLE(buf, off, weapon.higherLevelModifier, 2); off += 2
    writeLE(buf, off, weapon.familiarity, 4); off += 4
    writeLE(buf, off, weapon.leftRight1, 1); off += 1
    writeLE(buf, off, weapon.leftRight2, 1); off += 1
    writeLE(buf, off, weapon.leftRight3, 1); off += 1
    writeLE(buf, off, weapon.leftRight4, 1); off += 1
    writeLE(buf, off, weapon.weaponTier, 1); off += 1
    writeLE(buf, off, weapon.leftRight5, 1); off += 1
    writeLE(buf, off, weapon.leftRight6, 1); off += 1
    writeLE(buf, off, weapon.leftRight7, 1); off += 1
    writeLE(buf, off, weapon.yokaiWeaponGauge, 2); off += 2
    writeLE(buf, off, weapon.rcmdLevel, 2); off += 2
    writeLE(buf, off, weapon.empty1, 2); off += 2
    writeLE(buf, off, weapon.remodelType, 1); off += 1
    writeLE(buf, off, weapon.attemptRemaining, 1); off += 1
    writeBigLE(buf, off, weapon.extra1, 16); off += 16

    off = writeEffects(buf, off, weapon.effects)

    writeLE(buf, off, weapon.empty2, 4); off += 4
    writeLE(buf, off, weapon.isEquipped, 1); off += 1
    writeBigLE(buf, off, weapon.empty3, 7)
  }
}

export function writeItems(buf: Buffer, items: Item[]): void {
  for (const item of items) {
    const off = ITEM_START + item.slot * ITEM_SIZE
    writeLE(buf, off, item.itemId, 2)
    writeLE(buf, off + 2, item.refashion, 2)
    writeLE(buf, off + 4, item.quantity, 2)
  }
}

export function writeScrolls(buf: Buffer, scrolls: Scroll[]): void {
  for (const scroll of scrolls) {
    const base = SCROLL_START + scroll.slot * SCROLL_SIZE
    if (base + SCROLL_SIZE > buf.length) continue

    let off = base
    writeLE(buf, off, scroll.itemId1, 2); off += 2
    writeLE(buf, off, scroll.itemId2, 2); off += 2
    writeLE(buf, off, scroll.itemId3, 2); off += 2
    writeLE(buf, off, scroll.itemLevel1, 2); off += 2
    writeLE(buf, off, scroll.itemLevel2, 2); off += 2
    writeLE(buf, off, scroll.higherLevelMod, 2); off += 2
    writeLE(buf, off, scroll.unk1, 4); off += 4
    writeLE(buf, off, scroll.extra1, 2); off += 2
    writeLE(buf, off, scroll.isLocked, 1); off += 1
    writeLE(buf, off, scroll.extra2, 1); off += 1
    writeLE(buf, off, scroll.tier, 1); off += 1
    writeLE(buf, off, scroll.unk2, 1); off += 1
    writeBigLE(buf, off, scroll.unk3, 9); off += 9
    writeLE(buf, off, scroll.attemptsRemaining, 1); off += 1
    writeBigLE(buf, off, scroll.unk4, 16); off += 16

    off = writeEffects(buf, off, scroll.effects)

    writeLE(buf, off, scroll.extra3, 4)
  }
}
