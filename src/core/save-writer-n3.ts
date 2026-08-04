import type { CharacterStatsN3, Nioh3Equipment, Nioh3Usable } from './types'
import {
  N3_AMRITA_OFFSET,
  N3_CONSTITUTION,
  N3_EQ_APPEARANCE_ID,
  N3_EQ_EFFECTS_BASE,
  N3_EQ_EQUIPPED_FLAG1,
  N3_EQ_EQUIPPED_FLAG2,
  N3_EQ_FAMILIARITY,
  N3_EQ_FLAGS1,
  N3_EQ_FLAGS2,
  N3_EQ_INV_INDEX,
  N3_EQ_ITEM_ID,
  N3_EQ_ITEM_LEVEL,
  N3_EQ_ITEM_LEVEL_PRE,
  N3_EQ_PLUS_VALUE,
  N3_EQ_QUANTITY,
  N3_EQ_RARITY,
  N3_EQ_UI1,
  N3_EQ_UI2,
  N3_GOLD_OFFSET,
  N3_HEART,
  N3_INTELLECT,
  N3_ITEM_SIZE,
  N3_ITEM_START,
  N3_MAGIC,
  N3_SKILL,
  N3_STAMINA,
  N3_STORAGE_SIZE,
  N3_STORAGE_START,
  N3_STRENGTH,
  N3_USABLE_SIZE,
  N3_USABLE_START
} from './constants-n3'
import { writeLE, writeNioh3Effects } from './binary-utils'

export function writeNioh3Stats(buf: Buffer, stats: CharacterStatsN3): void {
  writeLE(buf, N3_AMRITA_OFFSET, stats.amrita, 4)
  writeLE(buf, N3_GOLD_OFFSET, stats.gold, 4)
  writeLE(buf, N3_CONSTITUTION, stats.constitution, 2)
  writeLE(buf, N3_HEART, stats.heart, 2)
  writeLE(buf, N3_STAMINA, stats.stamina, 2)
  writeLE(buf, N3_STRENGTH, stats.strength, 2)
  writeLE(buf, N3_SKILL, stats.skill, 2)
  writeLE(buf, N3_INTELLECT, stats.intellect, 2)
  writeLE(buf, N3_MAGIC, stats.magic, 2)
}

export function writeNioh3Equipment(buf: Buffer, items: Nioh3Equipment[]): void {
  for (const item of items) {
    const base = N3_ITEM_START + item.slot * N3_ITEM_SIZE
    writeLE(buf, base + N3_EQ_ITEM_ID, item.itemId, 2)
    writeLE(buf, base + N3_EQ_APPEARANCE_ID, item.appearanceId, 2)
    writeLE(buf, base + N3_EQ_QUANTITY, item.quantity, 2)
    writeLE(buf, base + N3_EQ_ITEM_LEVEL, item.itemLevel, 2)
    writeLE(buf, base + N3_EQ_ITEM_LEVEL_PRE, item.itemLevelPreForge, 2)
    writeLE(buf, base + N3_EQ_PLUS_VALUE, item.plusValue, 2)
    writeLE(buf, base + N3_EQ_FAMILIARITY, item.familiarityRaw, 4)
    writeLE(buf, base + N3_EQ_FLAGS1, item.equipmentFlags1, 1)
    writeLE(buf, base + N3_EQ_FLAGS2, item.equipmentFlags2, 1)
    writeLE(buf, base + N3_EQ_INV_INDEX, item.invIndex, 2)
    writeLE(buf, base + N3_EQ_UI1, item.ui1, 1)
    writeLE(buf, base + N3_EQ_UI2, item.ui2, 1)
    writeLE(buf, base + N3_EQ_RARITY, item.rarity, 1)
    writeNioh3Effects(buf, base + N3_EQ_EFFECTS_BASE, item.effects)
    writeLE(buf, base + N3_EQ_EQUIPPED_FLAG1, item.equippedFlag1, 1)
    writeLE(buf, base + N3_EQ_EQUIPPED_FLAG2, item.equippedFlag2, 1)
  }
}

function writeNioh3UsableSlots(buf: Buffer, items: Nioh3Usable[], start: number, size: number): void {
  for (const item of items) {
    const base = start + item.slot * size
    writeLE(buf, base + N3_EQ_ITEM_ID, item.itemId, 2)
    writeLE(buf, base + N3_EQ_APPEARANCE_ID, item.appearanceId, 2)
    writeLE(buf, base + N3_EQ_QUANTITY, item.quantity, 2)
    writeLE(buf, base + N3_EQ_ITEM_LEVEL, item.itemLevel, 2)
    writeLE(buf, base + N3_EQ_ITEM_LEVEL_PRE, item.itemLevelPreForge, 2)
    writeLE(buf, base + N3_EQ_PLUS_VALUE, item.plusValue, 2)
    writeLE(buf, base + N3_EQ_FAMILIARITY, item.familiarityRaw, 4)
    writeLE(buf, base + N3_EQ_FLAGS1, item.equipmentFlags1, 1)
    writeLE(buf, base + N3_EQ_INV_INDEX, item.invIndex, 2)
    writeLE(buf, base + N3_EQ_UI1, item.ui1, 1)
    writeLE(buf, base + N3_EQ_UI2, item.ui2, 1)
    writeLE(buf, base + N3_EQ_RARITY, item.rarity, 1)
    writeNioh3Effects(buf, base + N3_EQ_EFFECTS_BASE, item.effects)
  }
}

export function writeNioh3Usables(buf: Buffer, items: Nioh3Usable[]): void {
  writeNioh3UsableSlots(buf, items, N3_USABLE_START, N3_USABLE_SIZE)
}

export function writeNioh3Storage(buf: Buffer, items: Nioh3Usable[]): void {
  writeNioh3UsableSlots(buf, items, N3_STORAGE_START, N3_STORAGE_SIZE)
}
