import {action, atom, computed} from '@reatom/core'

import {defineTheme} from '../theme-engine'
import type {CVThemeScheme, CVThemeSchemeTokens} from '../types'
import {generateThemePaletteTokens, validateThemePaletteRecipe} from './generator'
import {cloneThemePaletteRecipe, createDefaultThemePaletteRecipe, normalizeThemePaletteRecipe} from './ranges'
import {
  getThemePaletteStorage,
  parseThemePaletteStoredRecord,
  removeThemePaletteStoredRecord,
  writeThemePaletteStoredRecord,
} from './storage'
import {
  CV_THEME_PALETTE_STORAGE_KEY,
  CV_THEME_PALETTE_VERSION,
  type CVHwbColor,
  type CVThemePaletteChannel,
  type CVThemePaletteRecipe,
  type CVThemePaletteSavedSnapshot,
  type CVThemePaletteStorage,
  type CVThemePaletteRole,
} from './types'

export interface CreateThemePaletteControllerOptions {
  name?: string
  themeName?: string
  storageKey?: string
  storage?: CVThemePaletteStorage
  initialRecipe?: CVThemePaletteRecipe
  onPreview?: (themeName: string, tokens: CVThemeSchemeTokens) => void
}

function serializeRecipe(recipe: CVThemePaletteRecipe): string {
  return JSON.stringify(recipe)
}

function createSavedSnapshot(
  themeName: string,
  recipe: CVThemePaletteRecipe,
  tokens: CVThemeSchemeTokens,
  savedAt: string,
): CVThemePaletteSavedSnapshot {
  return {
    version: CV_THEME_PALETTE_VERSION,
    themeName,
    recipe: cloneThemePaletteRecipe(recipe),
    tokens,
    savedAt,
  }
}

export function createThemePaletteController(options: CreateThemePaletteControllerOptions = {}) {
  const name = options.name ?? 'cvThemePalette'
  const resolveStorage = () => options.storage ?? getThemePaletteStorage()
  const initialRecipe = normalizeThemePaletteRecipe(
    options.initialRecipe ?? createDefaultThemePaletteRecipe(),
  )
  const themeName = atom(options.themeName ?? 'cv-user-palette', `${name}.themeName`)
  const storageKey = atom(options.storageKey ?? CV_THEME_PALETTE_STORAGE_KEY, `${name}.storageKey`)
  const draft = atom<CVThemePaletteRecipe>(cloneThemePaletteRecipe(initialRecipe), `${name}.draft`)
  const saved = atom<CVThemePaletteRecipe>(cloneThemePaletteRecipe(initialRecipe), `${name}.saved`)
  const storageAvailable = atom(Boolean(resolveStorage()), `${name}.storageAvailable`)
  const storageError = atom('', `${name}.storageError`)
  const lastSavedSnapshot = atom<CVThemePaletteSavedSnapshot | null>(null, `${name}.lastSavedSnapshot`)

  const validation = computed(() => validateThemePaletteRecipe(draft()), `${name}.validation`)
  const previewTokens = computed(() => generateThemePaletteTokens(draft()), `${name}.previewTokens`)
  const isDirty = computed(() => serializeRecipe(draft()) !== serializeRecipe(saved()), `${name}.isDirty`)
  const canSave = computed(() => isDirty() && validation().valid, `${name}.canSave`)

  const applyPreviewTheme = () => {
    const tokens = previewTokens()
    const name = themeName()
    defineTheme(name, tokens)
    options.onPreview?.(name, tokens)
  }

  const setThemeName = action((nextThemeName: string) => {
    const normalized = nextThemeName.trim() || 'cv-user-palette'
    themeName.set(normalized)
    applyPreviewTheme()
  }, `${name}.setThemeName`)

  const setStorageKey = action((nextStorageKey: string) => {
    storageKey.set(nextStorageKey.trim() || CV_THEME_PALETTE_STORAGE_KEY)
  }, `${name}.setStorageKey`)

  const setDraftRecipe = action((nextRecipe: CVThemePaletteRecipe) => {
    draft.set(normalizeThemePaletteRecipe(nextRecipe))
    applyPreviewTheme()
  }, `${name}.setDraftRecipe`)

  const updateColor = action((scheme: CVThemeScheme, role: CVThemePaletteRole, value: CVHwbColor) => {
    const next = cloneThemePaletteRecipe(draft())
    next.schemes[scheme][role] = value
    draft.set(normalizeThemePaletteRecipe(next))
    applyPreviewTheme()
  }, `${name}.updateColor`)

  const updateChannel = action(
    (scheme: CVThemeScheme, role: CVThemePaletteRole, channel: CVThemePaletteChannel, value: number) => {
      const next = cloneThemePaletteRecipe(draft())
      next.schemes[scheme][role] = {
        ...next.schemes[scheme][role],
        [channel]: value,
      }
      draft.set(normalizeThemePaletteRecipe(next))
      applyPreviewTheme()
    },
    `${name}.updateChannel`,
  )

  const loadSaved = action((): CVThemePaletteRecipe | null => {
    const storage = resolveStorage()
    storageAvailable.set(Boolean(storage))
    if (!storage) {
      storageError.set('')
      return null
    }

    let raw: string | null
    try {
      raw = storage.getItem(storageKey())
    } catch {
      storageError.set('storage-read-failed')
      return null
    }

    const record = parseThemePaletteStoredRecord(raw)
    if (!record) {
      storageError.set(raw ? 'storage-invalid-record' : '')
      return null
    }

    const recipe = cloneThemePaletteRecipe(record.recipe)
    saved.set(recipe)
    draft.set(cloneThemePaletteRecipe(recipe))
    storageError.set('')
    applyPreviewTheme()
    return recipe
  }, `${name}.loadSaved`)

  const save = action((): CVThemePaletteSavedSnapshot | null => {
    const result = validation()
    if (!result.valid) return null

    const recipe = cloneThemePaletteRecipe(normalizeThemePaletteRecipe(draft()))
    const tokens = generateThemePaletteTokens(recipe)
    const savedAt = new Date().toISOString()
    const storage = resolveStorage()
    const didPersist = writeThemePaletteStoredRecord(storageKey(), recipe, savedAt, storage)
    storageAvailable.set(Boolean(storage))
    storageError.set(didPersist || !storage ? '' : 'storage-write-failed')
    saved.set(cloneThemePaletteRecipe(recipe))
    draft.set(cloneThemePaletteRecipe(recipe))
    defineTheme(themeName(), tokens)

    const snapshot = createSavedSnapshot(themeName(), recipe, tokens, savedAt)
    lastSavedSnapshot.set(snapshot)
    return snapshot
  }, `${name}.save`)

  const discard = action(() => {
    draft.set(cloneThemePaletteRecipe(saved()))
    storageError.set('')
    applyPreviewTheme()
  }, `${name}.discard`)

  const resetDefaults = action(() => {
    draft.set(createDefaultThemePaletteRecipe())
    storageError.set('')
    applyPreviewTheme()
  }, `${name}.resetDefaults`)

  const clearSaved = action(() => {
    removeThemePaletteStoredRecord(storageKey(), resolveStorage())
    const defaults = createDefaultThemePaletteRecipe()
    saved.set(cloneThemePaletteRecipe(defaults))
    draft.set(cloneThemePaletteRecipe(defaults))
    lastSavedSnapshot.set(null)
    storageError.set('')
    applyPreviewTheme()
  }, `${name}.clearSaved`)

  applyPreviewTheme()

  return {
    state: {
      themeName,
      storageKey,
      draft,
      saved,
      storageAvailable,
      storageError,
      validation,
      previewTokens,
      isDirty,
      canSave,
      lastSavedSnapshot,
    },
    actions: {
      setThemeName,
      setStorageKey,
      setDraftRecipe,
      updateChannel,
      updateColor,
      loadSaved,
      save,
      discard,
      resetDefaults,
      clearSaved,
    },
  }
}

export type CVThemePaletteController = ReturnType<typeof createThemePaletteController>
