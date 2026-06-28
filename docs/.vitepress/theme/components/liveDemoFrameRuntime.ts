import {setUnoUtilities} from '@chromvoid/uikit/reatom-lit'
import {registerUikit} from '@chromvoid/uikit/register'
import {unoUtilities} from '@chromvoid/uikit/styles/uno-utilities'
import {applyTheme, defineTheme} from '@chromvoid/uikit/theme'

import {FRAME_TOKEN_ALIASES} from './liveDemoFrameTokens'
import {loadLiveDemoCss} from './liveDemoStyles'

import frameThemeCss from './liveDemoFrameTheme.css?raw'
import tokenCss from '@chromvoid/uikit/theme/tokens.css?raw'

setUnoUtilities(unoUtilities)
registerUikit()

const RESIZE_MESSAGE_TYPE = 'cv-live-demo:resize'
const RENDERED_MESSAGE_TYPE = 'cv-live-demo:rendered'
const READY_MESSAGE_TYPE = 'cv-live-demo:ready'
const RENDER_COMMAND_TYPE = 'cv-live-demo:render'
const CLEAR_COMMAND_TYPE = 'cv-live-demo:clear'
const THEME_COMMAND_TYPE = 'cv-live-demo:theme'
const PALETTE_PREVIEW_MESSAGE_TYPE = 'cv-live-demo:palette-preview'
const DEMO_SIDE_EFFECT_IMPORT_RE = /import\s+['"]@chromvoid\/uikit\/theme\/tokens\.css['"]\s*;?/g
const DEMO_NAMED_IMPORT_RE =
  /import\s+\{([^}]+)\}\s+from\s+['"](@chromvoid\/uikit|@chromvoid\/uikit\/register|@chromvoid\/uikit\/theme)['"]\s*;?/g

type DocsThemeMode = 'dark' | 'light'
type DesignTokenSnapshot = Record<string, string>
type SchemeDesignTokenSnapshot = Record<DocsThemeMode, DesignTokenSnapshot>
type FrameTheme = {
  mode: DocsThemeMode
  tokens: DesignTokenSnapshot
}
type PaletteControllerElement = HTMLElement & {
  model?: {
    state?: {
      previewTokens?: () => unknown
    }
  }
}

Object.assign(window, {
  __cvLiveDemoModuleBindings: {applyTheme, defineTheme, registerUikit},
})

let cleanupCurrentDemo: (() => void) | null = null
let activeRenderId = ''
let demoStyleElement: HTMLStyleElement | null = null
let frameThemeStyleElement: HTMLStyleElement | null = null
let appliedDesignTokenNames = new Set<string>()
let appliedFrameTokenAliasNames = new Set<string>()
let pendingPaletteController: PaletteControllerElement | null = null
let palettePreviewRaf = 0

function isThemeMode(value: unknown): value is DocsThemeMode {
  return value === 'dark' || value === 'light'
}

function isDesignTokenName(value: string): boolean {
  return /^--cv-[\w-]+$/u.test(value)
}

function isDesignTokenSnapshot(value: unknown): value is DesignTokenSnapshot {
  if (typeof value !== 'object' || value === null) return false

  return Object.entries(value).every(
    ([name, tokenValue]) => isDesignTokenName(name) && typeof tokenValue === 'string',
  )
}

function isFrameTheme(value: unknown): value is FrameTheme {
  return (
    typeof value === 'object' &&
    value !== null &&
    'mode' in value &&
    'tokens' in value &&
    isThemeMode(value.mode) &&
    isDesignTokenSnapshot(value.tokens)
  )
}

function isSchemeDesignTokenSnapshot(value: unknown): value is SchemeDesignTokenSnapshot {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<Record<DocsThemeMode, unknown>>
  return isDesignTokenSnapshot(candidate.light) && isDesignTokenSnapshot(candidate.dark)
}

const initialTheme = document.documentElement.dataset.theme
const frameTheme: FrameTheme = {
  mode: isThemeMode(initialTheme) ? initialTheme : 'dark',
  tokens: {},
}

function applyDesignTokens(tokens: DesignTokenSnapshot): void {
  const rootStyle = document.documentElement.style
  const nextTokenNames = new Set<string>()
  const nextAliasNames = new Set<string>()

  for (const name of appliedDesignTokenNames) {
    if (!(name in tokens)) {
      rootStyle.removeProperty(name)
    }
  }

  for (const [name, value] of Object.entries(tokens)) {
    rootStyle.setProperty(name, value)
    nextTokenNames.add(name)
  }

  for (const [source, alias] of FRAME_TOKEN_ALIASES) {
    if (!(source in tokens)) continue

    rootStyle.setProperty(alias, tokens[source])
    nextAliasNames.add(alias)
  }

  for (const alias of appliedFrameTokenAliasNames) {
    if (!nextAliasNames.has(alias)) {
      rootStyle.removeProperty(alias)
    }
  }

  appliedDesignTokenNames = nextTokenNames
  appliedFrameTokenAliasNames = nextAliasNames
}

function ensureFrameThemeStyles(): void {
  frameThemeStyleElement ??= document.createElement('style')
  frameThemeStyleElement.dataset.liveDemoFrameTheme = 'true'
  frameThemeStyleElement.textContent = frameThemeCss
  document.head.append(frameThemeStyleElement)
}

function applyFrameTheme(theme: FrameTheme): void {
  frameTheme.mode = theme.mode
  frameTheme.tokens = theme.tokens
  document.documentElement.dataset.theme = theme.mode
  document.documentElement.classList.toggle('dark', theme.mode === 'dark')
  document.documentElement.style.colorScheme = theme.mode
  document.body.dataset.theme = theme.mode
  applyDesignTokens(theme.tokens)
  ensureFrameThemeStyles()
}

function installFrameStyles(): void {
  const style = document.createElement('style')
  style.textContent = `
    ${tokenCss}

    html,
    body {
      min-block-size: 100%;
      margin: 0;
      background: transparent;
      color: var(--cv-color-text);
      font-family:
        Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      overflow: hidden;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
  `
  document.head.append(style)
}

function setDemoStyles(css: string): void {
  if (!css && !demoStyleElement) return

  demoStyleElement ??= document.createElement('style')
  demoStyleElement.dataset.liveDemoStyles = 'true'
  demoStyleElement.textContent = css
  document.head.append(demoStyleElement)
  ensureFrameThemeStyles()
}

function runDemoScript(script: HTMLScriptElement): void {
  let source = script.textContent ?? ''
  if (!source.trim()) return

  if (script.type === 'module') {
    const executable = document.createElement('script')
    executable.type = 'module'
    source = transformDemoModuleSource(source)
    executable.textContent = source
    document.body.append(executable)
    return
  }

  try {
    new Function(source)()
  } catch (error) {
    console.error('Live demo iframe script failed', error)
  }
}

function transformDemoModuleSource(source: string): string {
  return source
    .replace(DEMO_SIDE_EFFECT_IMPORT_RE, '')
    .replace(DEMO_NAMED_IMPORT_RE, (_match, imported: string) => {
      const bindings = imported
        .split(',')
        .map((specifier) => specifier.trim().replace(/\s+as\s+/, ': '))
        .filter(Boolean)
        .join(', ')

      return `const {${bindings}} = window.__cvLiveDemoModuleBindings;`
    })
}

function measurePreviewHeight(preview: HTMLElement): number {
  const rect = preview.getBoundingClientRect()
  // In an iframe, documentElement.scrollHeight is at least the current viewport height.
  // Including it makes demos grow after upgrade/layout changes but prevents them from shrinking.
  return Math.ceil(Math.max(rect.height, preview.scrollHeight, document.body.scrollHeight))
}

function postPreviewHeight(preview: HTMLElement, id: string): void {
  window.parent.postMessage({type: RESIZE_MESSAGE_TYPE, id, height: measurePreviewHeight(preview)}, '*')
}

function observePreview(preview: HTMLElement, id: string): () => void {
  const post = () => postPreviewHeight(preview, id)
  let observer: ResizeObserver | null = null

  if ('ResizeObserver' in window) {
    observer = new ResizeObserver(post)
    observer.observe(preview)
  }

  requestAnimationFrame(post)
  requestAnimationFrame(() => requestAnimationFrame(post))
  window.addEventListener('load', post)

  return () => {
    observer?.disconnect()
    window.removeEventListener('load', post)
  }
}

function getPaletteControllerFromEvent(event: Event): PaletteControllerElement | null {
  for (const target of event.composedPath()) {
    if (!(target instanceof Element)) continue
    if (target.matches('cv-theme-palette-controller')) return target as PaletteControllerElement

    const controller = target.closest('cv-theme-palette-controller')
    if (controller instanceof HTMLElement) return controller as PaletteControllerElement
  }

  return null
}

function getPaletteController(): PaletteControllerElement | null {
  return document.querySelector('cv-theme-palette-controller') as PaletteControllerElement | null
}

function readPalettePreviewTokens(controller: PaletteControllerElement): SchemeDesignTokenSnapshot | null {
  try {
    const tokens = controller.model?.state?.previewTokens?.()
    return isSchemeDesignTokenSnapshot(tokens) ? tokens : null
  } catch {
    return null
  }
}

function applyPalettePreview(tokens: SchemeDesignTokenSnapshot): void {
  applyFrameTheme({
    mode: frameTheme.mode,
    tokens: {
      ...frameTheme.tokens,
      ...tokens[frameTheme.mode],
    },
  })
}

function flushPalettePreview(): void {
  palettePreviewRaf = 0
  const controller = pendingPaletteController ?? getPaletteController()
  pendingPaletteController = null
  if (!controller) return

  const tokens = readPalettePreviewTokens(controller)
  if (!tokens) return

  applyPalettePreview(tokens)
  window.parent.postMessage({type: PALETTE_PREVIEW_MESSAGE_TYPE, tokens}, '*')
}

function schedulePalettePreview(event: Event): void {
  const controller = getPaletteControllerFromEvent(event)
  if (!controller) return

  pendingPaletteController = controller
  if (palettePreviewRaf) return

  palettePreviewRaf = window.requestAnimationFrame(flushPalettePreview)
}

function findHashOnlyAnchor(event: MouseEvent): HTMLAnchorElement | null {
  for (const target of event.composedPath()) {
    if (!(target instanceof HTMLAnchorElement)) continue
    const href = target.getAttribute('href')
    if (href?.startsWith('#')) return target
  }

  return null
}

function preventFrameHashNavigation(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  const anchor = findHashOnlyAnchor(event)
  if (!anchor) return

  event.preventDefault()
}

function clearDemo(): void {
  cleanupCurrentDemo?.()
  cleanupCurrentDemo = null
  activeRenderId = ''
  setDemoStyles('')
  document.body.replaceChildren()
}

async function mountDemo(raw: string, id: string, styleKeys: string[], theme: FrameTheme): Promise<void> {
  clearDemo()
  applyFrameTheme(theme)
  activeRenderId = id

  const css = await loadLiveDemoCss(styleKeys)
  if (activeRenderId !== id) return

  setDemoStyles(css)
  if (!raw.trim()) return

  const template = document.createElement('template')
  template.innerHTML = raw
  const scripts = [...template.content.querySelectorAll('script')]
  scripts.forEach((script) => script.remove())

  const preview = document.createElement('main')
  preview.className = 'live-demo-preview live-demo-preview--frame'
  preview.append(template.content.cloneNode(true))

  document.body.replaceChildren(preview)
  scripts.forEach(runDemoScript)
  cleanupCurrentDemo = observePreview(preview, id)
  window.parent.postMessage({type: RENDERED_MESSAGE_TYPE, id}, '*')
}

function isRenderCommand(data: unknown): data is {
  type: typeof RENDER_COMMAND_TYPE
  id: string
  html: string
  styleKeys: string[]
  theme: FrameTheme
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'id' in data &&
    'html' in data &&
    'styleKeys' in data &&
    'theme' in data &&
    data.type === RENDER_COMMAND_TYPE &&
    typeof data.id === 'string' &&
    typeof data.html === 'string' &&
    Array.isArray(data.styleKeys) &&
    data.styleKeys.every((key) => typeof key === 'string') &&
    isFrameTheme(data.theme)
  )
}

function isThemeCommand(data: unknown): data is {type: typeof THEME_COMMAND_TYPE; theme: FrameTheme} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'theme' in data &&
    data.type === THEME_COMMAND_TYPE &&
    isFrameTheme(data.theme)
  )
}

function isClearCommand(data: unknown): data is {type: typeof CLEAR_COMMAND_TYPE; id?: string} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    data.type === CLEAR_COMMAND_TYPE &&
    (!('id' in data) || typeof data.id === 'string')
  )
}

function handleParentMessage(event: MessageEvent): void {
  if (event.source !== window.parent) return

  if (isThemeCommand(event.data)) {
    applyFrameTheme(event.data.theme)
    return
  }

  if (isRenderCommand(event.data)) {
    void mountDemo(event.data.html, event.data.id, event.data.styleKeys, event.data.theme)
    return
  }

  if (isClearCommand(event.data)) {
    if (event.data.id && activeRenderId !== event.data.id) return
    clearDemo()
  }
}

installFrameStyles()
applyFrameTheme(frameTheme)
document.addEventListener('click', preventFrameHashNavigation)
document.addEventListener('click', schedulePalettePreview, true)
document.addEventListener('cv-input', schedulePalettePreview, true)
document.addEventListener('cv-change', schedulePalettePreview, true)
window.addEventListener('message', handleParentMessage)
window.parent.postMessage({type: READY_MESSAGE_TYPE}, '*')
