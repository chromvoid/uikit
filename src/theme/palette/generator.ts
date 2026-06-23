import type {CVThemeScheme, CVThemeSchemeTokens, CVThemeTokenName, CVThemeTokens} from '../types'
import {
  CV_THEME_PALETTE_ROLES,
  CV_THEME_PALETTE_SCHEMES,
  type CVHwbColor,
  type CVThemePaletteRecipe,
  type CVThemePaletteRole,
  type CVThemePaletteValidationIssue,
  type CVThemePaletteValidationResult,
} from './types'
import {normalizeThemePaletteRecipe} from './ranges'

const HWB_FUNCTION_NAME = 'hwb'
const MIN_TEXT_CONTRAST = 4.5
const BLACK: CVHwbColor = {h: 0, w: 0, b: 100}
const WHITE: CVHwbColor = {h: 0, w: 100, b: 0}

const formatNumber = (value: number): string => {
  const rounded = Number(value.toFixed(1))
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)
}

export function formatHwbColor(color: CVHwbColor, alpha?: number): string {
  const base = `${HWB_FUNCTION_NAME}(${formatNumber(color.h)} ${formatNumber(color.w)}% ${formatNumber(color.b)}%`
  if (alpha === undefined) return `${base})`
  return `${base} / ${formatNumber(alpha)})`
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Number(value.toFixed(1))))
}

function shiftColor(color: CVHwbColor, whiteDelta: number, blackDelta: number): CVHwbColor {
  return {
    h: color.h,
    w: clampPercent(color.w + whiteDelta),
    b: clampPercent(color.b + blackDelta),
  }
}

function shadeForScheme(scheme: CVThemeScheme, color: CVHwbColor, amount: number): CVHwbColor {
  return scheme === 'dark' ? shiftColor(color, -amount, amount) : shiftColor(color, -amount * 0.6, amount)
}

function tintForScheme(scheme: CVThemeScheme, color: CVHwbColor, amount: number): CVHwbColor {
  return scheme === 'dark' ? shiftColor(color, amount, -amount * 0.5) : shiftColor(color, amount, -amount)
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

function hueToRgb(hue: number): [number, number, number] {
  const h = normalizeHue(hue) / 60
  const c = 1
  const x = c * (1 - Math.abs((h % 2) - 1))

  if (h < 1) return [c, x, 0]
  if (h < 2) return [x, c, 0]
  if (h < 3) return [0, c, x]
  if (h < 4) return [0, x, c]
  if (h < 5) return [x, 0, c]
  return [c, 0, x]
}

function hwbToRgb(color: CVHwbColor): [number, number, number] {
  const w = color.w / 100
  const b = color.b / 100
  if (w + b >= 1) {
    const gray = w / (w + b)
    return [gray, gray, gray]
  }

  const [r, g, blue] = hueToRgb(color.h)
  const factor = 1 - w - b
  return [r * factor + w, g * factor + w, blue * factor + w]
}

function linearize(channel: number): number {
  if (channel <= 0.03928) return channel / 12.92
  return ((channel + 0.055) / 1.055) ** 2.4
}

export function relativeHwbLuminance(color: CVHwbColor): number {
  const [red, green, blue] = hwbToRgb(color)
  const r = linearize(red)
  const g = linearize(green)
  const b = linearize(blue)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function hwbContrastRatio(a: CVHwbColor, b: CVHwbColor): number {
  const light = Math.max(relativeHwbLuminance(a), relativeHwbLuminance(b))
  const dark = Math.min(relativeHwbLuminance(a), relativeHwbLuminance(b))
  return (light + 0.05) / (dark + 0.05)
}

function readableTextFor(background: CVHwbColor): CVHwbColor {
  return hwbContrastRatio(background, BLACK) >= hwbContrastRatio(background, WHITE) ? BLACK : WHITE
}

function addToken(tokens: Partial<CVThemeTokens>, name: CVThemeTokenName, value: string): void {
  tokens[name] = value
}

function addRoleTokens(
  tokens: Partial<CVThemeTokens>,
  role: 'primary' | 'accent' | 'success' | 'warning' | 'danger',
  color: CVHwbColor,
  scheme: CVThemeScheme,
): void {
  const dark = shadeForScheme(scheme, color, 16)
  const darker = shadeForScheme(scheme, color, 32)
  const hover = tintForScheme(scheme, color, 10)
  const text = readableTextFor(color)

  addToken(tokens, `--cv-color-${role}`, formatHwbColor(color))
  addToken(tokens, `--cv-color-${role}-dark`, formatHwbColor(dark))
  addToken(tokens, `--cv-color-${role}-surface`, formatHwbColor(color, scheme === 'dark' ? 0.15 : 0.12))
  addToken(tokens, `--cv-color-${role}-surface-strong`, formatHwbColor(color, scheme === 'dark' ? 0.24 : 0.2))
  addToken(tokens, `--cv-color-${role}-border`, formatHwbColor(color, scheme === 'dark' ? 0.3 : 0.25))
  addToken(tokens, `--cv-color-${role}-border-strong`, formatHwbColor(color, scheme === 'dark' ? 0.42 : 0.36))
  addToken(tokens, `--cv-color-${role}-ring`, formatHwbColor(color, scheme === 'dark' ? 0.16 : 0.14))

  if (role === 'primary') {
    addToken(tokens, '--cv-palette-primary-dark', formatHwbColor(dark))
    addToken(tokens, '--cv-palette-primary-darker', formatHwbColor(darker))
    addToken(tokens, '--cv-palette-on-primary', formatHwbColor(text))
    addToken(tokens, '--cv-color-primary-darker', formatHwbColor(darker))
    addToken(tokens, '--cv-color-primary-subtle', formatHwbColor(color, scheme === 'dark' ? 0.1 : 0.08))
    addToken(tokens, '--cv-color-primary-muted', formatHwbColor(color, scheme === 'dark' ? 0.18 : 0.16))
    addToken(tokens, '--cv-color-on-primary', formatHwbColor(text))
  }

  if (role === 'accent') {
    addToken(tokens, '--cv-palette-accent-hover', formatHwbColor(hover))
    addToken(tokens, '--cv-palette-accent-contrast', formatHwbColor(text))
    addToken(tokens, '--cv-color-accent-light', formatHwbColor(tintForScheme(scheme, color, 18)))
    addToken(tokens, '--cv-color-accent-dark', formatHwbColor(dark))
    addToken(tokens, '--cv-color-accent-hover', formatHwbColor(hover))
    addToken(tokens, '--cv-color-accent-contrast', formatHwbColor(text))
  }

  if (role === 'success' || role === 'warning' || role === 'danger') {
    addToken(tokens, `--cv-palette-${role}-dark`, formatHwbColor(dark))
    addToken(tokens, `--cv-palette-${role}-text`, formatHwbColor(text))
    addToken(tokens, `--cv-color-${role}-text`, formatHwbColor(text))
  }
}

function generateSchemeTokens(scheme: CVThemeScheme, recipe: CVThemePaletteRecipe): CVThemeTokens {
  const roles = recipe.schemes[scheme]
  const bg = roles.bg
  const surface = roles.surface
  const text = roles.text
  const primary = roles.primary
  const accent = roles.accent

  const surface2 = tintForScheme(scheme, surface, scheme === 'dark' ? 3.1 : -3.2)
  const surface3 = tintForScheme(scheme, surface, scheme === 'dark' ? 8.6 : -6.6)
  const surface4 = tintForScheme(scheme, surface, scheme === 'dark' ? 12.9 : -11)
  const textStrong = tintForScheme(scheme, text, scheme === 'dark' ? 4 : -4)
  const border = scheme === 'dark' ? shiftColor(surface, 11, -23) : shiftColor(text, 3, -14)
  const overlay = scheme === 'dark' ? shiftColor(bg, -1.5, 2) : shiftColor(text, -5, 6)
  const tokens: Partial<CVThemeTokens> = {}

  addToken(tokens, '--cv-palette-bg', formatHwbColor(bg))
  addToken(tokens, '--cv-palette-surface', formatHwbColor(surface))
  addToken(tokens, '--cv-palette-surface-2', formatHwbColor(surface2))
  addToken(tokens, '--cv-palette-surface-3', formatHwbColor(surface3))
  addToken(tokens, '--cv-palette-surface-4', formatHwbColor(surface4))
  addToken(tokens, '--cv-palette-text', formatHwbColor(text))
  addToken(tokens, '--cv-palette-text-strong', formatHwbColor(textStrong))
  addToken(tokens, '--cv-palette-border', formatHwbColor(border, scheme === 'dark' ? 1 : 0.14))
  addToken(tokens, '--cv-palette-primary', formatHwbColor(primary))
  addToken(tokens, '--cv-palette-accent', formatHwbColor(accent))
  addToken(tokens, '--cv-palette-success', formatHwbColor(roles.success))
  addToken(tokens, '--cv-palette-warning', formatHwbColor(roles.warning))
  addToken(tokens, '--cv-palette-danger', formatHwbColor(roles.danger))

  addToken(tokens, '--cv-color-bg', 'var(--cv-palette-bg)')
  addToken(tokens, '--cv-color-surface', 'var(--cv-palette-surface)')
  addToken(tokens, '--cv-color-surface-2', 'var(--cv-palette-surface-2)')
  addToken(tokens, '--cv-color-surface-3', 'var(--cv-palette-surface-3)')
  addToken(tokens, '--cv-color-surface-4', 'var(--cv-palette-surface-4)')
  addToken(tokens, '--cv-color-surface-elevated', scheme === 'dark' ? 'var(--cv-color-surface-2)' : 'var(--cv-color-surface)')
  addToken(tokens, '--cv-color-surface-secondary', 'var(--cv-color-surface-2)')
  addToken(tokens, '--cv-color-surface-tertiary', 'var(--cv-color-surface-3)')
  addToken(tokens, '--cv-color-surface-hover', formatHwbColor(primary, scheme === 'dark' ? 0.07 : 0.06))
  addToken(tokens, '--cv-color-surface-glass-subtle', formatHwbColor(surface, scheme === 'dark' ? 0.32 : 0.54))
  addToken(tokens, '--cv-color-surface-glass', formatHwbColor(surface, scheme === 'dark' ? 0.6 : 0.72))
  addToken(tokens, '--cv-color-surface-glass-strong', formatHwbColor(surface, scheme === 'dark' ? 0.82 : 0.84))
  addToken(
    tokens,
    '--cv-color-surface-secondary-glass-soft',
    formatHwbColor(surface2, scheme === 'dark' ? 0.4 : 0.58),
  )
  addToken(tokens, '--cv-color-surface-secondary-glass', formatHwbColor(surface2, scheme === 'dark' ? 0.78 : 0.82))
  addToken(
    tokens,
    '--cv-color-surface-secondary-glass-strong',
    formatHwbColor(surface2, scheme === 'dark' ? 0.88 : 0.9),
  )
  addToken(tokens, '--cv-color-surface-tertiary-glass', formatHwbColor(surface3, scheme === 'dark' ? 0.6 : 0.72))
  addToken(
    tokens,
    '--cv-color-surface-tertiary-glass-strong',
    formatHwbColor(surface3, scheme === 'dark' ? 0.76 : 0.84),
  )
  addToken(tokens, '--cv-color-surface-highlight', formatHwbColor(text, scheme === 'dark' ? 0.06 : 0.05))

  addToken(tokens, '--cv-color-text', 'var(--cv-palette-text)')
  addToken(tokens, '--cv-color-text-primary', 'var(--cv-color-text)')
  addToken(tokens, '--cv-color-text-muted', formatHwbColor(text, scheme === 'dark' ? 0.72 : 0.7))
  addToken(tokens, '--cv-color-text-secondary', 'var(--cv-color-text-muted)')
  addToken(tokens, '--cv-color-text-subtle', formatHwbColor(text, scheme === 'dark' ? 0.54 : 0.5))
  addToken(tokens, '--cv-color-text-strong', 'var(--cv-palette-text-strong)')
  addToken(tokens, '--cv-color-text-strongest', formatHwbColor(scheme === 'dark' ? WHITE : BLACK))

  addToken(tokens, '--cv-color-border', 'var(--cv-palette-border)')
  addToken(tokens, '--cv-color-border-faint', formatHwbColor(border, scheme === 'dark' ? 0.18 : 0.06))
  addToken(tokens, '--cv-color-border-muted', formatHwbColor(border, scheme === 'dark' ? 0.52 : 0.08))
  addToken(tokens, '--cv-color-border-soft', formatHwbColor(border, scheme === 'dark' ? 0.64 : 0.14))
  addToken(tokens, '--cv-color-border-strong', formatHwbColor(border, scheme === 'dark' ? 0.86 : 0.22))
  addToken(tokens, '--cv-color-border-accent', formatHwbColor(primary, scheme === 'dark' ? 0.38 : 0.3))
  addToken(tokens, '--cv-color-border-glass', formatHwbColor(border, scheme === 'dark' ? 0.4 : 0.18))

  addToken(tokens, '--cv-color-brand', 'var(--cv-color-primary)')
  addRoleTokens(tokens, 'primary', primary, scheme)
  addRoleTokens(tokens, 'accent', accent, scheme)
  addRoleTokens(tokens, 'success', roles.success, scheme)
  addRoleTokens(tokens, 'warning', roles.warning, scheme)
  addRoleTokens(tokens, 'danger', roles.danger, scheme)

  addToken(tokens, '--cv-color-cyan', 'var(--cv-color-primary)')
  addToken(tokens, '--cv-color-cyan-light', formatHwbColor(tintForScheme(scheme, primary, 18)))
  addToken(tokens, '--cv-color-cyan-dark', 'var(--cv-color-primary-dark)')
  addToken(tokens, '--cv-color-info', 'var(--cv-color-primary)')
  addToken(tokens, '--cv-color-info-text', 'var(--cv-color-text)')
  addToken(tokens, '--cv-color-info-surface', 'var(--cv-color-primary-surface)')
  addToken(tokens, '--cv-color-info-surface-strong', 'var(--cv-color-primary-surface-strong)')
  addToken(tokens, '--cv-color-info-border', 'var(--cv-color-primary-border)')
  addToken(tokens, '--cv-color-info-border-strong', 'var(--cv-color-primary-border-strong)')
  addToken(tokens, '--cv-color-info-ring', 'var(--cv-color-primary-ring)')
  addToken(tokens, '--cv-color-focus', 'var(--cv-color-primary)')
  addToken(tokens, '--cv-color-focus-ring', 'var(--cv-color-primary)')
  addToken(tokens, '--cv-color-hover', formatHwbColor(primary, scheme === 'dark' ? 0.1 : 0.08))
  addToken(tokens, '--cv-color-active', formatHwbColor(primary, scheme === 'dark' ? 0.18 : 0.14))
  addToken(tokens, '--cv-color-selected', formatHwbColor(primary, scheme === 'dark' ? 0.16 : 0.12))
  addToken(tokens, '--cv-color-overlay', formatHwbColor(overlay, scheme === 'dark' ? 0.72 : 0.38))

  return tokens as CVThemeTokens
}

export function generateThemePaletteTokens(recipe: CVThemePaletteRecipe): CVThemeSchemeTokens {
  const normalized = normalizeThemePaletteRecipe(recipe)
  return {
    light: generateSchemeTokens('light', normalized),
    dark: generateSchemeTokens('dark', normalized),
  }
}

function validateContrast(
  issues: CVThemePaletteValidationIssue[],
  scheme: CVThemeScheme,
  foregroundRole: CVThemePaletteRole,
  backgroundRole: CVThemePaletteRole,
  foreground: CVHwbColor,
  background: CVHwbColor,
): void {
  const contrast = hwbContrastRatio(foreground, background)
  if (contrast >= MIN_TEXT_CONTRAST) return

  issues.push({
    code: 'contrast',
    scheme,
    role: foregroundRole,
    message: `${scheme} ${foregroundRole} contrast against ${backgroundRole} is ${contrast.toFixed(2)}:1`,
  })
}

export function validateThemePaletteRecipe(recipe: CVThemePaletteRecipe): CVThemePaletteValidationResult {
  const normalized = normalizeThemePaletteRecipe(recipe)
  const issues: CVThemePaletteValidationIssue[] = []

  for (const scheme of CV_THEME_PALETTE_SCHEMES) {
    const roles = normalized.schemes[scheme]
    for (const role of CV_THEME_PALETTE_ROLES) {
      const color = roles[role]
      if (color.w + color.b > 100) {
        issues.push({
          code: 'hwb-range',
          scheme,
          role,
          message: `${scheme} ${role} whiteness and blackness must not exceed 100`,
        })
      }
    }

    validateContrast(issues, scheme, 'text', 'bg', roles.text, roles.bg)
    validateContrast(issues, scheme, 'text', 'surface', roles.text, roles.surface)
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
