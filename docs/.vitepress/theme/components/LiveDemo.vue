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

onMounted(() => {
  if (!container.value) return
  const raw = decoded.value
  hasScript.value = /<script[\s>]/i.test(raw)
  const html = raw.replace(/<script[\s\S]*?<\/script>/gi, '')
  container.value.innerHTML = html
})
</script>

<template>
  <cv-card class="live-demo-card" variant="outlined">
    <div slot="header" class="live-demo-header">
      <div class="live-demo-meta">
        <cv-badge variant="primary" pill size="small">Live demo</cv-badge>
        <cv-badge :variant="hasScript ? 'warning' : 'success'" pill size="small">
          {{ hasScript ? 'Document script' : 'Static preview' }}
        </cv-badge>
      </div>
      <p class="live-demo-title">Rendered inside the documentation shell</p>
    </div>

    <div class="live-demo-body">
      <div ref="container" class="live-demo-preview" />
      <cv-callout v-if="hasScript" class="live-demo-script-note" variant="warning">
        This example includes script logic that must run in a real document.
      </cv-callout>
    </div>

    <cv-disclosure slot="footer" class="live-demo-source">
      <span slot="trigger">View source</span>
      <div v-html="highlightedHtml" />
    </cv-disclosure>
  </cv-card>
</template>
