export type CVThemeTokenName = `--cv-${string}`

export type CVThemeTokens = Record<CVThemeTokenName, string>

export type CVThemeScheme = 'light' | 'dark'

export type CVThemeSchemeTokens = Record<CVThemeScheme, CVThemeTokens>

export type CVThemeInput = CVThemeTokens | CVThemeSchemeTokens

export interface CVThemeDefinition {
  name: string
  tokens: CVThemeTokens
  schemeTokens?: CVThemeSchemeTokens
}

export type CVThemeTarget = HTMLElement | ShadowRoot | Document
