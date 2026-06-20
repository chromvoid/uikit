import {setUnoUtilities} from '@chromvoid/uikit/reatom-lit'
import {registerUikit} from '@chromvoid/uikit/register'
import {unoUtilities} from '@chromvoid/uikit/styles/uno-utilities'
import {applyTheme, defineTheme} from '@chromvoid/uikit/theme'

import '@chromvoid/uikit/theme/tokens.css'
import liveDemoExamplesCss from '../live-demo-examples.css?raw'

setUnoUtilities(unoUtilities)
registerUikit()

const RESIZE_MESSAGE_TYPE = 'cv-live-demo:resize'
const RENDERED_MESSAGE_TYPE = 'cv-live-demo:rendered'
const READY_MESSAGE_TYPE = 'cv-live-demo:ready'
const RENDER_COMMAND_TYPE = 'cv-live-demo:render'
const CLEAR_COMMAND_TYPE = 'cv-live-demo:clear'
const DEMO_SIDE_EFFECT_IMPORT_RE = /import\s+['"]@chromvoid\/uikit\/theme\/tokens\.css['"]\s*;?/g
const DEMO_NAMED_IMPORT_RE =
  /import\s+\{([^}]+)\}\s+from\s+['"](@chromvoid\/uikit|@chromvoid\/uikit\/register|@chromvoid\/uikit\/theme)['"]\s*;?/g

Object.assign(window, {
  __cvLiveDemoModuleBindings: {applyTheme, defineTheme, registerUikit},
})

let cleanupCurrentDemo: (() => void) | null = null
let activeRenderId = ''

function installFrameStyles(): void {
  const style = document.createElement('style')
  style.textContent = `
    html,
    body {
      min-block-size: 100%;
      margin: 0;
      background: #070d16;
      color: #eef5ff;
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

  const demoStyle = document.createElement('style')
  demoStyle.textContent = liveDemoExamplesCss
  document.head.append(demoStyle)
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
  return Math.ceil(
    Math.max(
      rect.height,
      preview.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
    ),
  )
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
  document.body.replaceChildren()
}

function mountDemo(raw: string, id: string): void {
  clearDemo()
  activeRenderId = id
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
): data is {type: typeof RENDER_COMMAND_TYPE; id: string; html: string} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'id' in data &&
    'html' in data &&
    data.type === RENDER_COMMAND_TYPE &&
    typeof data.id === 'string' &&
    typeof data.html === 'string'
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

  if (isRenderCommand(event.data)) {
    mountDemo(event.data.html, event.data.id)
    return
  }

  if (isClearCommand(event.data)) {
    if (event.data.id && activeRenderId !== event.data.id) return
    clearDemo()
  }
}

installFrameStyles()
document.addEventListener('click', preventFrameHashNavigation)
window.addEventListener('message', handleParentMessage)
window.parent.postMessage({type: READY_MESSAGE_TYPE}, '*')
