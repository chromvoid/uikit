import {cloneThemePaletteRecipe, normalizeThemePaletteRecipe} from './ranges'
import {
  CV_THEME_PALETTE_VERSION,
  type CVThemePaletteRecipe,
  type CVThemePaletteStorage,
  type CVThemePaletteStoredRecord,
} from './types'

export function getThemePaletteStorage(): CVThemePaletteStorage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRecipe(value: unknown): value is CVThemePaletteRecipe {
  if (!isObject(value)) return false
  if (value.version !== CV_THEME_PALETTE_VERSION) return false
  if (!isObject(value.schemes)) return false
  return isObject(value.schemes.light) && isObject(value.schemes.dark)
}

export function parseThemePaletteStoredRecord(value: string | null): CVThemePaletteStoredRecord | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as unknown
    if (!isObject(parsed) || parsed.version !== CV_THEME_PALETTE_VERSION || !isRecipe(parsed.recipe)) return null

    return {
      version: CV_THEME_PALETTE_VERSION,
      recipe: normalizeThemePaletteRecipe(parsed.recipe),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    }
  } catch {
    return null
  }
}

export function readThemePaletteStoredRecord(
  key: string,
  storage: CVThemePaletteStorage | undefined = getThemePaletteStorage(),
): CVThemePaletteStoredRecord | null {
  if (!storage) return null

  try {
    return parseThemePaletteStoredRecord(storage.getItem(key))
  } catch {
    return null
  }
}

export function writeThemePaletteStoredRecord(
  key: string,
  recipe: CVThemePaletteRecipe,
  updatedAt: string,
  storage: CVThemePaletteStorage | undefined = getThemePaletteStorage(),
): boolean {
  if (!storage) return false

  const record: CVThemePaletteStoredRecord = {
    version: CV_THEME_PALETTE_VERSION,
    recipe: cloneThemePaletteRecipe(normalizeThemePaletteRecipe(recipe)),
    updatedAt,
  }

  try {
    storage.setItem(key, JSON.stringify(record))
    return true
  } catch {
    return false
  }
}

export function removeThemePaletteStoredRecord(
  key: string,
  storage: CVThemePaletteStorage | undefined = getThemePaletteStorage(),
): boolean {
  if (!storage) return false

  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}
