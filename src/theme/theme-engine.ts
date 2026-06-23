import type {
  CVThemeDefinition,
  CVThemeInput,
  CVThemeScheme,
  CVThemeSchemeTokens,
  CVThemeTarget,
  CVThemeTokenName,
  CVThemeTokens,
} from './types'

const themes = new Map<string, CVThemeDefinition>()
const appliedTokensByElement = new WeakMap<HTMLElement, Set<CVThemeTokenName>>()

const CV_TOKEN_PREFIX = '--cv-'

function validateThemeTokens(tokens: CVThemeTokens): void {
  for (const key of Object.keys(tokens)) {
    if (!key.startsWith(CV_TOKEN_PREFIX)) {
      throw new Error(`Invalid theme token "${key}". Tokens must use the "--cv-*" prefix.`)
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSchemeTokenInput(tokens: CVThemeInput): tokens is CVThemeSchemeTokens {
  if (!isRecord(tokens)) return false
  const candidate = tokens as Partial<Record<CVThemeScheme, unknown>>

  return isRecord(candidate.light) && isRecord(candidate.dark)
}

function cloneTokens(tokens: CVThemeTokens): CVThemeTokens {
  return {...tokens}
}

function cloneSchemeTokens(tokens: CVThemeSchemeTokens): CVThemeSchemeTokens {
  return {
    light: cloneTokens(tokens.light),
    dark: cloneTokens(tokens.dark),
  }
}

function cloneDefinition(definition: CVThemeDefinition): CVThemeDefinition {
  return {
    name: definition.name,
    tokens: cloneTokens(definition.tokens),
    ...(definition.schemeTokens ? {schemeTokens: cloneSchemeTokens(definition.schemeTokens)} : {}),
  }
}

function resolveTargetElement(target: CVThemeTarget): HTMLElement {
  if (target instanceof HTMLElement) {
    return target
  }

  if (target instanceof Document) {
    return target.documentElement
  }

  return target.host as HTMLElement
}

export function defineTheme(name: string, tokens: CVThemeInput): CVThemeDefinition {
  if (!name.trim()) {
    throw new Error('Theme name must be a non-empty string.')
  }

  let definition: CVThemeDefinition

  if (isSchemeTokenInput(tokens)) {
    validateThemeTokens(tokens.light)
    validateThemeTokens(tokens.dark)
    definition = {
      name,
      tokens: cloneTokens(tokens.dark),
      schemeTokens: cloneSchemeTokens(tokens),
    }
  } else {
    validateThemeTokens(tokens)
    definition = {
      name,
      tokens: cloneTokens(tokens),
    }
  }

  themes.set(name, definition)

  return cloneDefinition(definition)
}

export function getTheme(name: string): CVThemeDefinition | undefined {
  const definition = themes.get(name)
  if (!definition) return undefined

  return cloneDefinition(definition)
}

export function resolveThemeTokens(name: string, scheme: CVThemeScheme): CVThemeTokens | undefined {
  const definition = themes.get(name)
  if (!definition) return undefined

  if (definition.schemeTokens) {
    return cloneTokens(definition.schemeTokens[scheme])
  }

  return cloneTokens(definition.tokens)
}

export function applyTheme(target: CVThemeTarget, name: string): HTMLElement {
  const definition = themes.get(name)
  if (!definition) {
    throw new Error(`Unknown theme: ${name}`)
  }

  const element = resolveTargetElement(target)
  const previousTokens = appliedTokensByElement.get(element)
  if (previousTokens) {
    for (const key of previousTokens) {
      element.style.removeProperty(key)
    }
  }

  const nextTokenNames = new Set<CVThemeTokenName>()
  for (const [key, value] of Object.entries(resolveThemeTokens(name, 'dark') ?? {}) as Array<
    [CVThemeTokenName, string]
  >) {
    element.style.setProperty(key, value)
    nextTokenNames.add(key)
  }

  element.setAttribute('data-cv-theme', definition.name)
  appliedTokensByElement.set(element, nextTokenNames)

  return element
}
