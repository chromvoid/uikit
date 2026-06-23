import {describe, expect, it} from 'vitest'

import {resolveThemeTokens} from '../theme-engine'
import {createThemePaletteController} from './create-theme-palette-controller'
import {generateThemePaletteTokens, validateThemePaletteRecipe} from './generator'
import {
  cloneThemePaletteRecipe,
  createDefaultThemePaletteRecipe,
  normalizeThemePaletteRecipe,
} from './ranges'
import {
  parseThemePaletteStoredRecord,
  readThemePaletteStoredRecord,
  writeThemePaletteStoredRecord,
} from './storage'
import type {CVThemePaletteStorage} from './types'

class MemoryStorage implements CVThemePaletteStorage {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

describe('theme palette generator', () => {
  it('generates scheme token maps from the default recipe', () => {
    const tokens = generateThemePaletteTokens(createDefaultThemePaletteRecipe())

    expect(tokens.dark['--cv-color-bg']).toBe('var(--cv-palette-bg)')
    expect(tokens.light['--cv-palette-bg']).toContain('hwb(')
    expect(tokens.dark['--cv-color-on-primary']).toContain('hwb(')
    expect(tokens.light['--cv-color-overlay']).toContain('hwb(')
  })

  it('normalizes out-of-range channel values', () => {
    const recipe = createDefaultThemePaletteRecipe()
    recipe.schemes.dark.primary = {h: 999, w: 120, b: 120}

    const normalized = normalizeThemePaletteRecipe(recipe)

    expect(normalized.schemes.dark.primary.h).toBe(359)
    expect(normalized.schemes.dark.primary.w + normalized.schemes.dark.primary.b).toBeLessThanOrEqual(100)
  })

  it('reports contrast issues for an unsafe text recipe', () => {
    const recipe = createDefaultThemePaletteRecipe()
    recipe.schemes.dark.bg = {h: 218, w: 18, b: 76}
    recipe.schemes.dark.surface = {h: 217, w: 28, b: 64}
    recipe.schemes.dark.text = {h: 218, w: 50, b: 40}

    const result = validateThemePaletteRecipe(recipe)

    expect(result.valid).toBe(false)
    expect(result.issues.some((issue) => issue.code === 'contrast')).toBe(true)
  })
})

describe('theme palette storage', () => {
  it('ignores corrupt and unsupported records', () => {
    expect(parseThemePaletteStoredRecord('{')).toBeNull()
    expect(parseThemePaletteStoredRecord(JSON.stringify({version: 99}))).toBeNull()
  })

  it('persists compact recipe records without resolved tokens', () => {
    const storage = new MemoryStorage()
    const recipe = createDefaultThemePaletteRecipe()

    expect(writeThemePaletteStoredRecord('palette', recipe, '2026-06-23T00:00:00.000Z', storage)).toBe(true)
    const raw = storage.getItem('palette')
    expect(raw).not.toBeNull()
    expect(raw).not.toContain('"tokens"')

    const loaded = readThemePaletteStoredRecord('palette', storage)
    expect(loaded?.recipe.schemes.dark.bg).toEqual(recipe.schemes.dark.bg)
  })
})

describe('createThemePaletteController', () => {
  it('updates draft state, registers preview tokens, and saves a snapshot', () => {
    const storage = new MemoryStorage()
    const controller = createThemePaletteController({
      name: 'testPalette',
      themeName: 'test-user-palette',
      storageKey: 'palette',
      storage,
    })

    controller.actions.updateChannel('dark', 'primary', 'h', 220)

    expect(controller.state.isDirty()).toBe(true)
    expect(resolveThemeTokens('test-user-palette', 'dark')?.['--cv-palette-primary']).toContain('220')

    const snapshot = controller.actions.save()

    expect(snapshot?.themeName).toBe('test-user-palette')
    expect(snapshot?.tokens.dark['--cv-palette-primary']).toContain('220')
    expect(controller.state.isDirty()).toBe(false)
    expect(storage.getItem('palette') ?? '').not.toContain('"tokens"')
  })

  it('blocks save when validation fails and keeps the last saved recipe', () => {
    const storage = new MemoryStorage()
    const controller = createThemePaletteController({name: 'invalidPalette', storageKey: 'palette', storage})
    const saved = cloneThemePaletteRecipe(controller.state.saved())
    const invalid = cloneThemePaletteRecipe(controller.state.draft())
    invalid.schemes.dark.bg = {h: 218, w: 18, b: 76}
    invalid.schemes.dark.surface = {h: 217, w: 28, b: 64}
    invalid.schemes.dark.text = {h: 218, w: 50, b: 40}

    controller.actions.setDraftRecipe(invalid)

    expect(controller.state.validation().valid).toBe(false)
    expect(controller.actions.save()).toBeNull()
    expect(controller.state.saved()).toEqual(saved)
    expect(storage.getItem('palette')).toBeNull()
  })

  it('loads saved recipes and discards drafts', () => {
    const storage = new MemoryStorage()
    const recipe = createDefaultThemePaletteRecipe()
    recipe.schemes.light.accent.h = 310
    writeThemePaletteStoredRecord('palette', recipe, '2026-06-23T00:00:00.000Z', storage)
    const controller = createThemePaletteController({name: 'loadPalette', storageKey: 'palette', storage})

    expect(controller.actions.loadSaved()?.schemes.light.accent.h).toBe(310)

    controller.actions.updateChannel('light', 'accent', 'h', 120)
    expect(controller.state.draft().schemes.light.accent.h).toBe(120)

    controller.actions.discard()
    expect(controller.state.draft().schemes.light.accent.h).toBe(310)
  })
})
