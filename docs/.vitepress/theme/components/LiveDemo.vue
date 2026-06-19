<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'

const props = defineProps<{
  code: string
  highlighted: string
}>()


const container = ref<HTMLElement | null>(null)
const hasScript = ref(false)


function decodeBase64Utf8(value: string): string {
  const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}


const decoded = computed(() => decodeBase64Utf8(props.code))
const highlightedHtml = computed(() => decodeBase64Utf8(props.highlighted))


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


onMounted(() => {
  if (!container.value) return
  const raw = decoded.value
  hasScript.value = /<script[\s>]/i.test(raw)

  const template = document.createElement('template')
  template.innerHTML = raw
  const scripts = [...template.content.querySelectorAll('script')]
  scripts.forEach((script) => script.remove())

  container.value.replaceChildren(template.content.cloneNode(true))
  scripts.forEach(runDemoScript)
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
      </div>
      <p class="live-demo-title">Rendered inside the documentation shell</p>
    </div>

    <div class="live-demo-body">
      <div ref="container" class="live-demo-preview" />
    </div>

    <cv-disclosure slot="footer" class="live-demo-source">
      <span slot="trigger">View source</span>
      <div v-html="highlightedHtml" />
    </cv-disclosure>
  </cv-card>
</template>
