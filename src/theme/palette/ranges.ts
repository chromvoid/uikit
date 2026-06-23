import type {CVThemeScheme} from '../types'
import {
  CV_THEME_PALETTE_ROLES,
  CV_THEME_PALETTE_SCHEMES,
  CV_THEME_PALETTE_VERSION,
  type CVHwbColor,
  type CVThemePaletteChannel,
  type CVThemePaletteHwbRange,
  type CVThemePaletteRecipe,
  type CVThemePaletteRanges,
  type CVThemePaletteRole,
} from './types'

const hueRange = {min: 0, max: 359, step: 1}

const range = (wMin: number, wMax: number, bMin: number, bMax: number): CVThemePaletteHwbRange => ({
  h: hueRange,
  w: {min: wMin, max: wMax, step: 0.1},
  b: {min: bMin, max: bMax, step: 0.1},
})

export const CV_THEME_PALETTE_RANGES: CVThemePaletteRanges = {
  dark: {
    bg: range(0, 18, 76, 98),
    surface: range(2, 28, 64, 94),
    text: range(50, 100, 0, 40),
    primary: range(0, 44, 0, 56),
    accent: range(0, 70, 0, 56),
    success: range(0, 44, 0, 56),
    warning: range(0, 58, 0, 48),
    danger: range(0, 58, 0, 48),
  },
  light: {
    bg: range(84, 100, 0, 16),
    surface: range(82, 100, 0, 18),
    text: range(0, 48, 46, 98),
    primary: range(0, 52, 0, 64),
    accent: range(0, 68, 0, 64),
    success: range(0, 52, 0, 64),
    warning: range(0, 58, 0, 64),
    danger: range(0, 58, 0, 64),
  },
}

export const CV_THEME_PALETTE_DEFAULT_RECIPE: CVThemePaletteRecipe = {
  version: CV_THEME_PALETTE_VERSION,
  schemes: {
    dark: {
      bg: {h: 218, w: 2.7, b: 92.9},
      surface: {h: 217, w: 6.3, b: 86.7},
      text: {h: 215, w: 93.3, b: 0},
      primary: {h: 186, w: 0, b: 0},
      accent: {h: 262, w: 53.3, b: 0},
      success: {h: 159, w: 0, b: 3.9},
      warning: {h: 39, w: 12.5, b: 0},
      danger: {h: 3, w: 18.8, b: 0},
    },
    light: {
      bg: {h: 206, w: 95.7, b: 1.6},
      surface: {h: 0, w: 100, b: 0},
      text: {h: 221, w: 7.1, b: 86.7},
      primary: {h: 186, w: 0, b: 20},
      accent: {h: 262, w: 36, b: 20},
      success: {h: 159, w: 0, b: 23.1},
      warning: {h: 39, w: 11.4, b: 9.8},
      danger: {h: 3, w: 16.9, b: 9.8},
    },
  },
}

const cloneColor = (color: CVHwbColor): CVHwbColor => ({...color})

export function cloneThemePaletteRecipe(recipe: CVThemePaletteRecipe): CVThemePaletteRecipe {
  return {
    version: CV_THEME_PALETTE_VERSION,
    schemes: {
      light: cloneThemePaletteScheme(recipe.schemes.light),
      dark: cloneThemePaletteScheme(recipe.schemes.dark),
    },
  }
}

function cloneThemePaletteScheme(
  scheme: Record<CVThemePaletteRole, CVHwbColor>,
): Record<CVThemePaletteRole, CVHwbColor> {
  const next = {} as Record<CVThemePaletteRole, CVHwbColor>
  for (const role of CV_THEME_PALETTE_ROLES) {
    next[role] = cloneColor(scheme[role])
  }
  return next
}

export function createDefaultThemePaletteRecipe(): CVThemePaletteRecipe {
  return cloneThemePaletteRecipe(CV_THEME_PALETTE_DEFAULT_RECIPE)
}

export function clampThemePaletteChannel(
  scheme: CVThemeScheme,
  role: CVThemePaletteRole,
  channel: CVThemePaletteChannel,
  value: number,
): number {
  const bounds = CV_THEME_PALETTE_RANGES[scheme][role][channel]
  if (!Number.isFinite(value)) return bounds.min
  const stepped = Math.round(value / bounds.step) * bounds.step
  return Math.min(bounds.max, Math.max(bounds.min, Number(stepped.toFixed(1))))
}

export function clampThemePaletteColor(
  scheme: CVThemeScheme,
  role: CVThemePaletteRole,
  color: CVHwbColor,
): CVHwbColor {
  const next = {
    h: clampThemePaletteChannel(scheme, role, 'h', color.h),
    w: clampThemePaletteChannel(scheme, role, 'w', color.w),
    b: clampThemePaletteChannel(scheme, role, 'b', color.b),
  }

  if (next.w + next.b <= 100) return next

  const overflow = next.w + next.b - 100
  if (next.b >= next.w) {
    next.b = Math.max(CV_THEME_PALETTE_RANGES[scheme][role].b.min, Number((next.b - overflow).toFixed(1)))
  } else {
    next.w = Math.max(CV_THEME_PALETTE_RANGES[scheme][role].w.min, Number((next.w - overflow).toFixed(1)))
  }

  return next
}

export function normalizeThemePaletteRecipe(recipe: CVThemePaletteRecipe): CVThemePaletteRecipe {
  const fallback = CV_THEME_PALETTE_DEFAULT_RECIPE
  const next = createDefaultThemePaletteRecipe()

  for (const scheme of CV_THEME_PALETTE_SCHEMES) {
    for (const role of CV_THEME_PALETTE_ROLES) {
      next.schemes[scheme][role] = clampThemePaletteColor(
        scheme,
        role,
        recipe.schemes?.[scheme]?.[role] ?? fallback.schemes[scheme][role],
      )
    }
  }

  return next
}
