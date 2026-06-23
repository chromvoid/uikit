import type {CVThemeScheme, CVThemeSchemeTokens} from '../types'

export const CV_THEME_PALETTE_VERSION = 1

export const CV_THEME_PALETTE_STORAGE_KEY = 'cv-theme-palette:v1'

export const CV_THEME_PALETTE_ROLES = [
  'bg',
  'surface',
  'text',
  'primary',
  'accent',
  'success',
  'warning',
  'danger',
] as const

export const CV_THEME_PALETTE_SCHEMES = ['light', 'dark'] as const satisfies readonly CVThemeScheme[]

export const CV_THEME_PALETTE_CHANNELS = ['h', 'w', 'b'] as const

export type CVThemePaletteRole = (typeof CV_THEME_PALETTE_ROLES)[number]

export type CVThemePaletteChannel = (typeof CV_THEME_PALETTE_CHANNELS)[number]

export interface CVHwbColor {
  h: number
  w: number
  b: number
}

export interface CVThemePaletteRecipe {
  version: typeof CV_THEME_PALETTE_VERSION
  schemes: Record<CVThemeScheme, Record<CVThemePaletteRole, CVHwbColor>>
}

export interface CVThemePaletteSavedSnapshot {
  version: typeof CV_THEME_PALETTE_VERSION
  themeName: string
  recipe: CVThemePaletteRecipe
  tokens: CVThemeSchemeTokens
  savedAt: string
}

export interface CVThemePaletteRange {
  min: number
  max: number
  step: number
}

export interface CVThemePaletteHwbRange {
  h: CVThemePaletteRange
  w: CVThemePaletteRange
  b: CVThemePaletteRange
}

export type CVThemePaletteRanges = Record<CVThemeScheme, Record<CVThemePaletteRole, CVThemePaletteHwbRange>>

export interface CVThemePaletteValidationIssue {
  code: string
  message: string
  scheme?: CVThemeScheme
  role?: CVThemePaletteRole
  channel?: CVThemePaletteChannel
}

export interface CVThemePaletteValidationResult {
  valid: boolean
  issues: CVThemePaletteValidationIssue[]
}

export interface CVThemePaletteStoredRecord {
  version: typeof CV_THEME_PALETTE_VERSION
  recipe: CVThemePaletteRecipe
  updatedAt: string
}

export interface CVThemePaletteStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
