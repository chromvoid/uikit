import {setUnoUtilities} from '@chromvoid/uikit/reatom-lit'
import {registerUikit} from '@chromvoid/uikit/register'
import {unoUtilities} from '@chromvoid/uikit/styles/uno-utilities'
import {applyTheme, defineTheme} from '@chromvoid/uikit/theme'
import tokenCss from '@chromvoid/uikit/theme/tokens.css?raw'

import frameThemeCss from './liveDemoFrameTheme.css?raw'
import {loadLiveDemoCss} from './liveDemoStyles'

setUnoUtilities(unoUtilities)
registerUikit()

const RESIZE_MESSAGE_TYPE = 'cv-live-demo:resize'
const RENDERED_MESSAGE_TYPE = 'cv-live-demo:rendered'
const READY_MESSAGE_TYPE = 'cv-live-demo:ready'
const RENDER_COMMAND_TYPE = 'cv-live-demo:render'
const CLEAR_COMMAND_TYPE = 'cv-live-demo:clear'
const THEME_COMMAND_TYPE = 'cv-live-demo:theme'
const DEMO_SIDE_EFFECT_IMPORT_RE = /import\s+['"]@chromvoid\/uikit\/theme\/tokens\.css['"]\s*;?/g
const DEMO_NAMED_IMPORT_RE =
  /import\s+\{([^}]+)\}\s+from\s+['"](@chromvoid\/uikit|@chromvoid\/uikit\/register|@chromvoid\/uikit\/theme)['"]\s*;?/g
const FRAME_TOKEN_ALIASES: ReadonlyArray<readonly [source: string, alias: string]> = [
  ['--cv-color-bg', '--cv-frame-color-bg'],
  ['--cv-color-surface', '--cv-frame-color-surface'],
  ['--cv-color-surface-2', '--cv-frame-color-surface-2'],
  ['--cv-color-surface-3', '--cv-frame-color-surface-3'],
  ['--cv-color-surface-4', '--cv-frame-color-surface-4'],
  ['--cv-color-surface-elevated', '--cv-frame-color-surface-elevated'],
  ['--cv-color-surface-secondary', '--cv-frame-color-surface-secondary'],
  ['--cv-color-surface-tertiary', '--cv-frame-color-surface-tertiary'],
  ['--cv-color-surface-glass', '--cv-frame-color-surface-glass'],
  ['--cv-color-surface-glass-strong', '--cv-frame-color-surface-glass-strong'],
  ['--cv-color-surface-secondary-glass-soft', '--cv-frame-color-surface-secondary-glass-soft'],
  ['--cv-color-surface-secondary-glass', '--cv-frame-color-surface-secondary-glass'],
  ['--cv-color-surface-secondary-glass-strong', '--cv-frame-color-surface-secondary-glass-strong'],
  ['--cv-color-surface-tertiary-glass', '--cv-frame-color-surface-tertiary-glass'],
  ['--cv-color-surface-tertiary-glass-strong', '--cv-frame-color-surface-tertiary-glass-strong'],
  ['--cv-color-border', '--cv-frame-color-border'],
  ['--cv-color-border-faint', '--cv-frame-color-border-faint'],
  ['--cv-color-border-muted', '--cv-frame-color-border-muted'],
  ['--cv-color-border-soft', '--cv-frame-color-border-soft'],
  ['--cv-color-border-strong', '--cv-frame-color-border-strong'],
  ['--cv-color-border-glass', '--cv-frame-color-border-glass'],
  ['--cv-color-text', '--cv-frame-color-text'],
  ['--cv-color-text-muted', '--cv-frame-color-text-muted'],
  ['--cv-color-text-subtle', '--cv-frame-color-text-subtle'],
  ['--cv-color-text-strong', '--cv-frame-color-text-strong'],
  ['--cv-color-text-strongest', '--cv-frame-color-text-strongest'],
  ['--cv-color-primary', '--cv-frame-color-primary'],
  ['--cv-color-primary-dark', '--cv-frame-color-primary-dark'],
  ['--cv-color-primary-darker', '--cv-frame-color-primary-darker'],
  ['--cv-color-primary-subtle', '--cv-frame-color-primary-subtle'],
  ['--cv-color-primary-muted', '--cv-frame-color-primary-muted'],
  ['--cv-color-primary-surface', '--cv-frame-color-primary-surface'],
  ['--cv-color-primary-surface-strong', '--cv-frame-color-primary-surface-strong'],
  ['--cv-color-primary-border', '--cv-frame-color-primary-border'],
  ['--cv-color-primary-border-strong', '--cv-frame-color-primary-border-strong'],
  ['--cv-color-primary-ring', '--cv-frame-color-primary-ring'],
  ['--cv-color-on-primary', '--cv-frame-color-on-primary'],
  ['--cv-color-success', '--cv-frame-color-success'],
  ['--cv-color-success-surface', '--cv-frame-color-success-surface'],
  ['--cv-color-success-surface-strong', '--cv-frame-color-success-surface-strong'],
  ['--cv-color-success-border', '--cv-frame-color-success-border'],
  ['--cv-color-success-border-strong', '--cv-frame-color-success-border-strong'],
  ['--cv-color-warning', '--cv-frame-color-warning'],
  ['--cv-color-warning-surface', '--cv-frame-color-warning-surface'],
  ['--cv-color-warning-surface-strong', '--cv-frame-color-warning-surface-strong'],
  ['--cv-color-warning-border', '--cv-frame-color-warning-border'],
  ['--cv-color-warning-border-strong', '--cv-frame-color-warning-border-strong'],
  ['--cv-color-danger', '--cv-frame-color-danger'],
  ['--cv-color-danger-surface', '--cv-frame-color-danger-surface'],
  ['--cv-color-danger-surface-strong', '--cv-frame-color-danger-surface-strong'],
  ['--cv-color-danger-border', '--cv-frame-color-danger-border'],
  ['--cv-color-danger-border-strong', '--cv-frame-color-danger-border-strong'],
  ['--cv-color-info', '--cv-frame-color-info'],
  ['--cv-color-info-surface', '--cv-frame-color-info-surface'],
  ['--cv-color-info-surface-strong', '--cv-frame-color-info-surface-strong'],
  ['--cv-color-info-border', '--cv-frame-color-info-border'],
  ['--cv-color-info-border-strong', '--cv-frame-color-info-border-strong'],
  ['--cv-color-focus-ring', '--cv-frame-color-focus-ring'],
  ['--cv-color-active', '--cv-frame-color-active'],
  ['--cv-color-selected', '--cv-frame-color-selected'],
  ['--cv-shadow-sm', '--cv-frame-shadow-sm'],
  ['--cv-shadow-md', '--cv-frame-shadow-md'],
  ['--cv-shadow-lg', '--cv-frame-shadow-lg'],
  ['--cv-shadow-xl', '--cv-frame-shadow-xl'],
  ['--cv-alpha-white-8', '--cv-frame-alpha-white-8'],
  ['--cv-alpha-white-15', '--cv-frame-alpha-white-15'],
  ['--cv-alpha-black-10', '--cv-frame-alpha-black-10'],
]

type DocsThemeMode = 'dark' | 'light'
type DesignTokenSnapshot = Record<string, string>
type FrameTheme = {
  mode: DocsThemeMode
  tokens: DesignTokenSnapshot
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

function isThemeMode(value: unknown): value is DocsThemeMode {
  return value === 'dark' || value === 'light'
}

function isDesignTokenName(value: string): boolean {
  return /^--cv-[\w-]+$/u.test(value)
}

function isDesignTokenSnapshot(value: unknown): value is DesignTokenSnapshot {
  if (typeof value !== 'object' || value === null) return false

  return Object.entries(value).every(([name, tokenValue]) => isDesignTokenName(name) && typeof tokenValue === 'string')
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

function isRenderCommand(
  data: unknown,
): data is {
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
window.addEventListener('message', handleParentMessage)
window.parent.postMessage({type: READY_MESSAGE_TYPE}, '*')
