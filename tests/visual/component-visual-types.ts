export type UikitVisualTheme = 'dark' | 'light'
export type UikitVisualViewport = 'mobile-360' | 'mobile-390' | 'mobile-430' | 'compact' | 'default' | 'wide'
export type UikitVisualTier = 'smoke' | 'full'

export type UikitVisualCase = {
  id: string
  component: string
  tier: UikitVisualTier
  title: string
  states: readonly string[]
  themes: readonly UikitVisualTheme[]
  viewports: readonly UikitVisualViewport[]
  mount: (root: HTMLElement) => void | Promise<void>
  interaction?: {
    hover?: string
    focus?: string
    click?: string
  }
  clipSelector?: string
  diagnosticsIgnoredSelectors?: readonly string[]
  requiredSelectors?: readonly string[]
  fullPage?: boolean
}

export type UikitVisualExclusion = {
  component: string
  reason: string
  coveredBy?: string
}

export const UIKIT_VISUAL_THEMES = ['dark', 'light'] as const satisfies readonly UikitVisualTheme[]
export const UIKIT_VISUAL_DEFAULT_VIEWPORTS = [
  'default',
] as const satisfies readonly UikitVisualViewport[]

export const UIKIT_VISUAL_VIEWPORTS: Record<
  UikitVisualViewport,
  {width: number; height: number}
> = {
  'mobile-360': {width: 360, height: 640},
  'mobile-390': {width: 390, height: 844},
  'mobile-430': {width: 430, height: 844},
  compact: {width: 390, height: 760},
  default: {width: 900, height: 720},
  wide: {width: 1280, height: 820},
}
