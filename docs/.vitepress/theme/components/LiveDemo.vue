<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'

import iframeRuntimeUrl from './liveDemoFrameRuntime.ts?worker&url'

const props = defineProps<{
  code: string
  highlighted: string
}>()

const DEFAULT_FRAME_HEIGHT = 160
const RESIZE_MESSAGE_TYPE = 'cv-live-demo:resize'

const container = ref<HTMLElement | null>(null)
const iframe = ref<HTMLIFrameElement | null>(null)
const hasScript = ref(false)
const frameHeight = ref(DEFAULT_FRAME_HEIGHT)


function decodeBase64Utf8(value: string): string {
  const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}


const decoded = computed(() => decodeBase64Utf8(props.code))
const highlightedHtml = computed(() => decodeBase64Utf8(props.highlighted))
const isInline = computed(() => /\sdata-live-demo-inline(?:[\s=>]|$)/i.test(decoded.value))
const minFrameHeight = computed(() => {
  const match = decoded.value.match(/\sdata-live-demo-height=["']?(\d{2,4})["']?/i)
  const parsedHeight = Number.parseInt(match?.[1] ?? '', 10)
  return Number.isFinite(parsedHeight) ? parsedHeight : DEFAULT_FRAME_HEIGHT
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


function serializeJsonPayload(value: string): string {
  return JSON.stringify(value)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}


function isFrameResizeMessage(data: unknown): data is {type: typeof RESIZE_MESSAGE_TYPE; height: number} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'height' in data &&
    data.type === RESIZE_MESSAGE_TYPE &&
    typeof data.height === 'number' &&
    Number.isFinite(data.height)
  )
}


function handleFrameMessage(event: MessageEvent): void {
  if (event.source !== iframe.value?.contentWindow || !isFrameResizeMessage(event.data)) return

  frameHeight.value = Math.max(minFrameHeight.value, Math.ceil(event.data.height))
}


function renderFrameDemo(raw: string): void {
  if (!iframe.value) return

  frameHeight.value = minFrameHeight.value


  const payload = serializeJsonPayload(raw)
  const closingScript = '</' + 'script>'
  iframe.value.srcdoc = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script id="live-demo-payload" type="application/json">${payload}${closingScript}
    <script type="module" src="${iframeRuntimeUrl}">${closingScript}
  </head>
  <body></body>
</html>`
}


onMounted(() => {
  const raw = decoded.value
  hasScript.value = /<script[\s>]/i.test(raw)

  if (!isInline.value) {
    window.addEventListener('message', handleFrameMessage)
    renderFrameDemo(raw)
    return
  }

  if (!container.value) return

  const template = document.createElement('template')
  template.innerHTML = raw
  const scripts = [...template.content.querySelectorAll('script')]
  scripts.forEach((script) => script.remove())

  container.value.replaceChildren(template.content.cloneNode(true))
  scripts.forEach(runDemoScript)
})


onUnmounted(() => {
  window.removeEventListener('message', handleFrameMessage)
})
</script>

<template>
  <cv-card class="live-demo-card" variant="outlined">
    <div slot="header" class="live-demo-header">
      <div class="live-demo-meta">
        <cv-badge variant="primary" pill size="small">Live demo</cv-badge>
        <cv-badge :variant="hasScript ? 'primary' : 'success'" pill size="small">
          {{ hasScript ? 'Interactive preview' : 'Static preview' }}
        </cv-badge>
        <cv-badge v-if="!isInline" variant="primary" pill size="small">Isolated frame</cv-badge>
      </div>
      <p class="live-demo-title">
        {{
          isInline ? 'Rendered inside the documentation shell' : 'Rendered inside an isolated preview frame'
        }}
      </p>
    </div>

    <div class="live-demo-body">
      <iframe
        v-if="!isInline"
        ref="iframe"
        class="live-demo-frame"
        title="Isolated live demo preview"
        sandbox="allow-scripts allow-same-origin"
        :height="frameHeight"
      />
      <div v-else ref="container" class="live-demo-preview" />
    </div>

    <cv-disclosure slot="footer" class="live-demo-source">
      <span slot="trigger">View source</span>
      <div v-html="highlightedHtml" />
    </cv-disclosure>
  </cv-card>
</template>
