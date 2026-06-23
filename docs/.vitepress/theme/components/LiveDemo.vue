<script setup lang="ts">
import {useData} from 'vitepress'
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'

import iframeRuntimeUrl from './liveDemoFrameRuntime.ts?worker&url'
import {extractLiveDemoStyleKeys} from './liveDemoStyleKeys'

const props = defineProps<{
  code: string
  highlighted: string
}>()


const DEFAULT_FRAME_HEIGHT = 160
const MAX_POOLED_FRAMES = 2
const RESIZE_MESSAGE_TYPE = 'cv-live-demo:resize'
const RENDERED_MESSAGE_TYPE = 'cv-live-demo:rendered'
const READY_MESSAGE_TYPE = 'cv-live-demo:ready'
const RENDER_COMMAND_TYPE = 'cv-live-demo:render'
const CLEAR_COMMAND_TYPE = 'cv-live-demo:clear'
const THEME_COMMAND_TYPE = 'cv-live-demo:theme'

type DocsThemeMode = 'dark' | 'light'
type DesignTokenSnapshot = Record<string, string>


type FrameTheme = {
  mode: DocsThemeMode
  tokens: DesignTokenSnapshot
}


const container = ref<HTMLElement | null>(null)
const frameHost = ref<HTMLElement | null>(null)
const frameHeight = ref(DEFAULT_FRAME_HEIGHT)
const frameReady = ref(false)
const mounted = ref(false)


type FrameRender = {
  id: string
  html: string
  styleKeys: string[]
  theme: FrameTheme
}


type PooledFrame = {
  element: HTMLIFrameElement
  pooled: boolean
  ready: boolean
  busy: boolean
  owner: symbol | null
  pendingRender: FrameRender | null
}


type FramePoolState = {
  idSequence: number
  parkingLot: HTMLElement | null
  frames: PooledFrame[]
}


declare global {
  interface Window {
    __cvLiveDemoFramePool?: FramePoolState
  }
}


function getFramePoolState(): FramePoolState {
  return (window.__cvLiveDemoFramePool ??= {
    idSequence: 0,
    parkingLot: null,
    frames: [],
  })
}


function decodeBase64Utf8(value: string): string {
  const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}


function readDesignTokenSnapshot(): DesignTokenSnapshot {
  const computedStyle = getComputedStyle(document.documentElement)
  const tokens: DesignTokenSnapshot = {}

  for (let index = 0; index < computedStyle.length; index += 1) {
    const name = computedStyle.item(index)
    if (!name.startsWith('--cv-')) continue

    const value = computedStyle.getPropertyValue(name).trim()
    if (value) {
      tokens[name] = value
    }
  }

  return tokens
}


function buildFrameTheme(): FrameTheme {
  return {
    mode: themeMode.value,
    tokens: readDesignTokenSnapshot(),
  }
}


const decoded = computed(() => decodeBase64Utf8(props.code))
const highlightedHtml = computed(() => decodeBase64Utf8(props.highlighted))
const {isDark} = useData()
const themeMode = computed<DocsThemeMode>(() => (isDark.value ? 'dark' : 'light'))
const isInline = computed(() => /\sdata-live-demo-inline(?:[\s=>]|$)/i.test(decoded.value))
const styleKeys = computed(() => extractLiveDemoStyleKeys(decoded.value))
const minFrameHeight = computed(() => {
  const match = decoded.value.match(/\sdata-live-demo-height=["']?(\d{2,4})["']?/i)
  const parsedHeight = Number.parseInt(match?.[1] ?? '', 10)
  return Number.isFinite(parsedHeight) ? parsedHeight : DEFAULT_FRAME_HEIGHT
})
const frameOwner = Symbol('LiveDemo frame owner')
let frameLease: PooledFrame | null = null
let currentRenderId = ''
let framePositionRaf = 0
let frameHostObserver: ResizeObserver | null = null


watch(
  [decoded, minFrameHeight, isInline],
  () => {
    frameHeight.value = minFrameHeight.value
    frameReady.value = isInline.value
  },
  {immediate: true},
)


watch(
  [decoded, isInline],
  () => {
    if (!mounted.value) return

    if (isInline.value) {
      releaseCurrentFrame()
      void nextTick(mountInlineDemo)
      return
    }

    void nextTick(mountFrameDemo)
  },
  {flush: 'post'},
)


watch([frameHeight, frameReady], updateFrameElementState)


watch(themeMode, () => {
  if (!mounted.value || isInline.value) return

  void nextTick(() => {
    if (!mounted.value || isInline.value) return

    const theme = buildFrameTheme()
    if (frameLease?.pendingRender) {
      frameLease.pendingRender.theme = theme
    }
    postFrameTheme(theme)
    updateFrameElementState()
  })
})


function runDemoScript(script: HTMLScriptElement): void {
  const source = script.textContent ?? ''
  if (!source.trim()) return


  if (script.type === 'module') {
    const executable = document.createElement('script')
    executable.type = 'module'
    executable.textContent = source
    container.value?.append(executable)
    return
  }


  try {
    new Function(source)()
  } catch (error) {
    console.error('Live demo script failed', error)
  }
}


function isFrameResizeMessage(
  data: unknown,
): data is {type: typeof RESIZE_MESSAGE_TYPE; id: string; height: number} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'id' in data &&
    'height' in data &&
    data.type === RESIZE_MESSAGE_TYPE &&
    typeof data.id === 'string' &&
    typeof data.height === 'number' &&
    Number.isFinite(data.height)
  )
}


function isFrameRenderedMessage(data: unknown): data is {type: typeof RENDERED_MESSAGE_TYPE; id: string} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'id' in data &&
    data.type === RENDERED_MESSAGE_TYPE &&
    typeof data.id === 'string'
  )
}


function isFrameReadyMessage(data: unknown): data is {type: typeof READY_MESSAGE_TYPE} {
  return typeof data === 'object' && data !== null && 'type' in data && data.type === READY_MESSAGE_TYPE
}


function handleFrameMessage(event: MessageEvent): void {
  if (!frameLease || event.source !== frameLease.element.contentWindow) return


  if (isFrameReadyMessage(event.data)) {
    frameLease.ready = true
    flushFrameRender(frameLease)
    return
  }


  if (isFrameRenderedMessage(event.data) && event.data.id === currentRenderId) {
    frameReady.value = true
    updateFrameElementState()
    return
  }


  if (!isFrameResizeMessage(event.data) || event.data.id !== currentRenderId) return


  frameHeight.value = Math.max(minFrameHeight.value, Math.ceil(event.data.height))
  frameReady.value = true
  updateFrameElementState()
}


function buildFrameSrcdoc(theme: DocsThemeMode): string {
  const closingScript = '</' + 'script>'
  const htmlClass = theme === 'dark' ? ' class="dark"' : ''
  return `<!doctype html>
<html lang="en" data-theme="${theme}"${htmlClass}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html {
        min-block-size: 100%;
        color-scheme: ${theme};
      }

      body {
        min-block-size: 100%;
        margin: 0;
        background: Canvas;
        color: CanvasText;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        overflow: hidden;
      }
    </style>
    <script type="module" src="${iframeRuntimeUrl}">${closingScript}
  </head>
  <body></body>
</html>`
}


function postFrameTheme(theme: FrameTheme): void {
  frameLease?.element.contentWindow?.postMessage({type: THEME_COMMAND_TYPE, theme}, '*')
}


function getFrameParkingLot(): HTMLElement {
  const state = getFramePoolState()
  if (state.parkingLot?.isConnected) return state.parkingLot


  state.parkingLot = document.createElement('div')
  state.parkingLot.dataset.liveDemoFramePool = 'true'
  state.parkingLot.style.cssText =
    'position:fixed;inset:0;z-index:1;overflow:visible;pointer-events:none;contain:layout;'
  document.body.append(state.parkingLot)
  return state.parkingLot
}


function flushFrameRender(frame: PooledFrame): void {
  if (!frame.ready || !frame.pendingRender) return


  frame.element.contentWindow?.postMessage(
    {
      type: RENDER_COMMAND_TYPE,
      id: frame.pendingRender.id,
      html: frame.pendingRender.html,
      styleKeys: frame.pendingRender.styleKeys,
      theme: frame.pendingRender.theme,
    },
    '*',
  )
  frame.pendingRender = null
}


function createPooledFrame(pooled: boolean): PooledFrame {
  const element = document.createElement('iframe')
  const frame: PooledFrame = {
    element,
    pooled,
    ready: false,
    busy: false,
    owner: null,
    pendingRender: null,
  }


  element.className = 'live-demo-frame'
  element.title = 'Isolated live demo preview'
  element.dataset.liveDemoFramePooled = pooled ? 'true' : 'false'
  element.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-popups', 'allow-popups-to-escape-sandbox')
  element.srcdoc = buildFrameSrcdoc(themeMode.value)
  element.style.colorScheme = themeMode.value
  parkFrameElement(element)
  element.addEventListener('load', () => {
    frame.ready = true
    flushFrameRender(frame)
  })


  return frame
}


function parkFrameElement(element: HTMLIFrameElement): void {
  delete element.dataset.liveDemoFrameActive
  element.className = 'live-demo-frame'
  element.removeAttribute('height')
  element.style.position = 'fixed'
  element.style.inset = 'auto'
  element.style.left = '-10000px'
  element.style.top = '-10000px'
  element.style.width = '0px'
  element.style.height = '0px'
  element.style.pointerEvents = 'none'
  element.style.visibility = 'hidden'
}


function warmFramePool(): void {
  if (typeof document === 'undefined') return


  const state = getFramePoolState()
  const parking = getFrameParkingLot()
  while (state.frames.length < MAX_POOLED_FRAMES) {
    const frame = createPooledFrame(true)
    state.frames.push(frame)
    parking.append(frame.element)
  }
}


function acquireFrame(owner: symbol): PooledFrame {
  warmFramePool()


  const state = getFramePoolState()
  let frame = state.frames.find((candidate) => !candidate.busy)
  if (!frame) {
    frame = createPooledFrame(false)
    getFrameParkingLot().append(frame.element)
  }
  frame.busy = true
  frame.owner = owner
  frame.pendingRender = null
  return frame
}


function releaseFrame(frame: PooledFrame, owner: symbol, renderId: string): void {
  if (frame.owner !== owner) return


  frame.element.contentWindow?.postMessage({type: CLEAR_COMMAND_TYPE, id: renderId}, '*')
  parkFrameElement(frame.element)
  frame.pendingRender = null
  frame.owner = null
  frame.busy = false


  if (!frame.pooled) frame.element.remove()
}


function releaseCurrentFrame(): void {
  if (!frameLease) return


  releaseFrame(frameLease, frameOwner, currentRenderId)
  frameLease = null
  currentRenderId = ''
}


function updateFrameElementState(): void {
  const frame = frameLease
  if (frameHost.value) {
    frameHost.value.style.blockSize = `${frameHeight.value}px`
  }
  if (!frame || !frameHost.value) return


  const rect = frameHost.value.getBoundingClientRect()
  frame.element.height = String(frameHeight.value)
  frame.element.className = frameReady.value ? 'live-demo-frame live-demo-frame--ready' : 'live-demo-frame'
  frame.element.dataset.liveDemoFrameActive = 'true'
  frame.element.style.colorScheme = themeMode.value
  frame.element.style.position = 'fixed'
  frame.element.style.inset = 'auto'
  frame.element.style.left = `${rect.left}px`
  frame.element.style.top = `${rect.top}px`
  frame.element.style.width = `${rect.width}px`
  frame.element.style.height = `${frameHeight.value}px`
  frame.element.style.pointerEvents = 'auto'
  frame.element.style.visibility = 'visible'
}


async function mountInlineDemo(): Promise<void> {
  if (!container.value || !isInline.value) return


  const html = decoded.value
  const keys = styleKeys.value
  const {loadLiveDemoCss} = await import('./liveDemoStyles')
  const css = await loadLiveDemoCss(keys)
  if (!container.value || !isInline.value || decoded.value !== html) return


  const template = document.createElement('template')
  template.innerHTML = html
  const scripts = [...template.content.querySelectorAll('script')]
  scripts.forEach((script) => script.remove())


  const style = document.createElement('style')
  style.dataset.liveDemoStyles = 'true'
  style.textContent = css


  container.value.replaceChildren(style, template.content.cloneNode(true))
  scripts.forEach(runDemoScript)
}


function mountFrameDemo(): void {
  if (!frameHost.value || isInline.value) return


  if (!frameLease) {
    frameLease = acquireFrame(frameOwner)
  }


  frameReady.value = false
  currentRenderId = `live-demo-${++getFramePoolState().idSequence}`
  frameLease.pendingRender = {
    id: currentRenderId,
    html: decoded.value,
    styleKeys: styleKeys.value,
    theme: buildFrameTheme(),
  }
  updateFrameElementState()
  observeFrameHost()
  flushFrameRender(frameLease)
}


function scheduleFramePositionUpdate(): void {
  if (framePositionRaf) return


  framePositionRaf = window.requestAnimationFrame(() => {
    framePositionRaf = 0
    updateFrameElementState()
  })
}


function observeFrameHost(): void {
  frameHostObserver?.disconnect()
  frameHostObserver = null


  if (!frameHost.value || !('ResizeObserver' in window)) return


  frameHostObserver = new ResizeObserver(scheduleFramePositionUpdate)
  frameHostObserver.observe(frameHost.value)
}


onMounted(() => {
  mounted.value = true
  window.addEventListener('message', handleFrameMessage)
  window.addEventListener('scroll', scheduleFramePositionUpdate, true)
  window.addEventListener('resize', scheduleFramePositionUpdate)

  if (isInline.value) {
    mountInlineDemo()
    return
  }

  void nextTick(mountFrameDemo)
})


onUnmounted(() => {
  mounted.value = false
  window.removeEventListener('message', handleFrameMessage)
  window.removeEventListener('scroll', scheduleFramePositionUpdate, true)
  window.removeEventListener('resize', scheduleFramePositionUpdate)
  frameHostObserver?.disconnect()
  if (framePositionRaf) {
    window.cancelAnimationFrame(framePositionRaf)
    framePositionRaf = 0
  }
  releaseCurrentFrame()
})
</script>

<template>
  <section class="live-demo-card" aria-label="Component live demo">
    <div class="live-demo-body" :class="{'live-demo-body--frame-pending': !isInline && !frameReady}">
      <div v-if="!isInline" ref="frameHost" class="live-demo-frame-host" />
      <div v-else ref="container" class="live-demo-preview" />
    </div>

    <footer class="live-demo-footer">
      <cv-disclosure class="live-demo-source">
        <span slot="trigger">View source</span>
        <div v-html="highlightedHtml" />
      </cv-disclosure>
    </footer>
  </section>
</template>
