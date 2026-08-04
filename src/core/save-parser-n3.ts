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
  N3_EFFECT_COUNT,
  N3_GOLD_OFFSET,
  N3_HEART,
  N3_INTELLECT,
  N3_ITEM_SIZE,
  N3_ITEM_SLOTS,
  N3_ITEM_START,
  N3_MAGIC,
  N3_SKILL,
  N3_STAMINA,
  N3_STORAGE_SIZE,
  N3_STORAGE_SLOTS,
  N3_STORAGE_START,
  N3_STRENGTH,
  N3_USABLE_SIZE,
  N3_USABLE_SLOTS,
  N3_USABLE_START
} from './constants-n3'
import { readLE, readNioh3Effects } from './binary-utils'

export function parseNioh3Stats(buf: Buffer): CharacterStatsN3 {
  return {
    amrita:       readLE(buf, N3_AMRITA_OFFSET, 4),
    gold:         readLE(buf, N3_GOLD_OFFSET, 4),
    constitution: readLE(buf, N3_CONSTITUTION, 2),
    heart:        readLE(buf, N3_HEART, 2),
    stamina:      readLE(buf, N3_STAMINA, 2),
    strength:     readLE(buf, N3_STRENGTH, 2),
    skill:        readLE(buf, N3_SKILL, 2),
    intellect:    readLE(buf, N3_INTELLECT, 2),
    magic:        readLE(buf, N3_MAGIC, 2)
  }
}

function parseNioh3EquipmentSlot(buf: Buffer, slot: number): Nioh3Equipment {
  const base = N3_ITEM_START + slot * N3_ITEM_SIZE
  return {
    slot,
    itemId:           readLE(buf, base + N3_EQ_ITEM_ID, 2),
    appearanceId:     readLE(buf, base + N3_EQ_APPEARANCE_ID, 2),
    quantity:         readLE(buf, base + N3_EQ_QUANTITY, 2),
    itemLevel:        readLE(buf, base + N3_EQ_ITEM_LEVEL, 2),
    itemLevelPreForge: readLE(buf, base + N3_EQ_ITEM_LEVEL_PRE, 2),
    plusValue:        readLE(buf, base + N3_EQ_PLUS_VALUE, 2),
    familiarityRaw:   readLE(buf, base + N3_EQ_FAMILIARITY, 4),
    equipmentFlags1:  readLE(buf, base + N3_EQ_FLAGS1, 1),
    equipmentFlags2:  readLE(buf, base + N3_EQ_FLAGS2, 1),
    invIndex:         readLE(buf, base + N3_EQ_INV_INDEX, 2),
    ui1:              readLE(buf, base + N3_EQ_UI1, 1),
    ui2:              readLE(buf, base + N3_EQ_UI2, 1),
    rarity:           readLE(buf, base + N3_EQ_RARITY, 1),
    effects:          readNioh3Effects(buf, base + N3_EQ_EFFECTS_BASE, N3_EFFECT_COUNT),
    equippedFlag1:    readLE(buf, base + N3_EQ_EQUIPPED_FLAG1, 1),
    equippedFlag2:    readLE(buf, base + N3_EQ_EQUIPPED_FLAG2, 1)
  }
}

function parseNioh3UsableSlot(buf: Buffer, slot: number, start: number, size: number): Nioh3Usable {
  const base = start + slot * size
  return {
    slot,
    itemId:           readLE(buf, base + N3_EQ_ITEM_ID, 2),
    appearanceId:     readLE(buf, base + N3_EQ_APPEARANCE_ID, 2),
    quantity:         readLE(buf, base + N3_EQ_QUANTITY, 2),
    itemLevel:        readLE(buf, base + N3_EQ_ITEM_LEVEL, 2),
    itemLevelPreForge: readLE(buf, base + N3_EQ_ITEM_LEVEL_PRE, 2),
    plusValue:        readLE(buf, base + N3_EQ_PLUS_VALUE, 2),
    familiarityRaw:   readLE(buf, base + N3_EQ_FAMILIARITY, 4),
    equipmentFlags1:  readLE(buf, base + N3_EQ_FLAGS1, 1),
    invIndex:         readLE(buf, base + N3_EQ_INV_INDEX, 2),
    ui1:              readLE(buf, base + N3_EQ_UI1, 1),
    ui2:              readLE(buf, base + N3_EQ_UI2, 1),
    rarity:           readLE(buf, base + N3_EQ_RARITY, 1),
    effects:          readNioh3Effects(buf, base + N3_EQ_EFFECTS_BASE, N3_EFFECT_COUNT)
  }
}

export function parseNioh3Equipment(buf: Buffer): Nioh3Equipment[] {
  const equipment: Nioh3Equipment[] = []
  for (let slot = 0; slot < N3_ITEM_SLOTS; slot++) {
    equipment.push(parseNioh3EquipmentSlot(buf, slot))
  }
  return equipment
}

export function parseNioh3Usables(buf: Buffer): Nioh3Usable[] {
  const usables: Nioh3Usable[] = []
  for (let slot = 0; slot < N3_USABLE_SLOTS; slot++) {
    usables.push(parseNioh3UsableSlot(buf, slot, N3_USABLE_START, N3_USABLE_SIZE))
  }
  return usables
}

export function parseNioh3Storage(buf: Buffer): Nioh3Usable[] {
  const storage: Nioh3Usable[] = []
  for (let slot = 0; slot < N3_STORAGE_SLOTS; slot++) {
    storage.push(parseNioh3UsableSlot(buf, slot, N3_STORAGE_START, N3_STORAGE_SIZE))
  }
  return storage
}
