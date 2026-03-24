<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {withBase} from 'vitepress'

import {createToastController} from '@chromvoid/uikit'

const props = defineProps<{
  compact?: boolean
}>()

const toastController = createToastController()
const toastRegion = ref<{controller?: unknown} | null>(null)
const alertElement = ref<{show: (message: string) => void; hide: () => void} | null>(null)
const selectElement = ref<HTMLElement | null>(null)
const meterElement = ref<HTMLElement | null>(null)

let removeSelectListener: (() => void) | null = null

function showToast() {
  toastController.push({
    message: 'Toast from the documentation playground',
    level: 'success',
    durationMs: 2200,
  })
}

function showAlert(message: string) {
  alertElement.value?.show(message)
}

function hideAlert() {
  alertElement.value?.hide()
}

onMounted(() => {
  if (toastRegion.value) {
    toastRegion.value.controller = toastController
  }

  const select = selectElement.value
  const meter = meterElement.value

  if (!select || !meter) {
    return
  }

  const onSelectChange = (event: Event) => {
    const detail = (event as CustomEvent<{value: string | null}>).detail
    const selectedValue = detail.value ?? 'balanced'
    const meterByPreset: Record<string, number> = {
      silent: 24,
      balanced: 46,
      turbo: 78,
      locked: 46,
    }

    meter.setAttribute('value', String(meterByPreset[selectedValue] ?? 46))
  }

  select.addEventListener('cv-change', onSelectChange as EventListener)
  removeSelectListener = () => {
    select.removeEventListener('cv-change', onSelectChange as EventListener)
  }
})

onBeforeUnmount(() => {
  removeSelectListener?.()
})
</script>

<template>
  <section class="component-playground">
    <div class="components-hero">
      <p class="components-kicker">Interactive Playground</p>
      <h2 class="components-title">
        {{ compact ? 'Preview the kit in-place' : 'Validate the kit inside the docs' }}
      </h2>
      <p class="components-description">
        {{
          compact
            ? 'Use the same reference site for onboarding, API lookup, and live interaction checks.'
            : 'Use this page to validate states, composition patterns, and controller-based interactions without leaving the documentation site.'
        }}
      </p>
      <div v-if="!compact" class="components-hero-actions">
        <a
          class="component-action component-action-primary"
          :href="withBase('/guide/getting-started.html')"
        >
          Quick start
        </a>
        <a class="component-action" :href="withBase('/components/')">Reference catalog</a>
      </div>
    </div>

    <div class="component-grid">
      <article class="component-card">
        <h3>Buttons / Switch</h3>
        <p>Primary actions and binary toggles.</p>
        <div class="example-row">
          <cv-button>Continue</cv-button>
          <cv-button toggle pressed>Toggle</cv-button>
          <cv-button disabled>Disabled</cv-button>
          <cv-switch checked></cv-switch>
        </div>
      </article>

      <article class="component-card">
        <h3>Checkbox / Listbox</h3>
        <p>Selection controls with keyboard semantics.</p>
        <div class="example-row">
          <cv-checkbox checked>Enable sync</cv-checkbox>
          <cv-checkbox indeterminate>Indeterminate state</cv-checkbox>
        </div>
        <cv-listbox selection-mode="multiple" aria-label="UIKit demo options">
          <cv-option value="alpha" selected>Alpha</cv-option>
          <cv-option value="beta">Beta</cv-option>
          <cv-option value="gamma">Gamma</cv-option>
          <cv-option value="delta" disabled>Delta (disabled)</cv-option>
        </cv-listbox>
      </article>

      <article class="component-card">
        <h3>Progress / Slider</h3>
        <p>Feedback and range input components.</p>
        <cv-progress value="60" max="100"></cv-progress>
        <cv-slider value="35" min="0" max="100" aria-label="volume"></cv-slider>
        <cv-meter
          ref="meterElement"
          value="46"
          min="0"
          max="100"
          low="25"
          high="80"
          optimum="50"
        ></cv-meter>
      </article>

      <article class="component-card">
        <h3>Radio Group</h3>
        <p>Single-choice selection pattern.</p>
        <cv-radio-group aria-label="plan">
          <cv-radio value="starter" checked>Starter</cv-radio>
          <cv-radio value="pro">Pro</cv-radio>
          <cv-radio value="enterprise">Enterprise</cv-radio>
        </cv-radio-group>
      </article>

      <article class="component-card">
        <h3>Select / Disclosure</h3>
        <p>Popup single-select and collapsible region.</p>
        <cv-select ref="selectElement" value="balanced" aria-label="performance profile">
          <cv-select-option value="silent">Silent</cv-select-option>
          <cv-select-option value="balanced">Balanced</cv-select-option>
          <cv-select-option value="turbo">Turbo</cv-select-option>
          <cv-select-option value="locked" disabled>Locked</cv-select-option>
        </cv-select>
        <cv-disclosure>
          <span slot="trigger">Advanced diagnostics</span>
          Realtime overlays, memory tracing and latency probes are enabled for this profile.
        </cv-disclosure>
      </article>

      <article class="component-card">
        <h3>Alert</h3>
        <p>Live-region notifications with imperative show/hide API.</p>
        <div class="example-row">
          <cv-button @click="showAlert('Configuration saved successfully')">Show success</cv-button>
          <cv-button @click="showAlert('Please check advanced diagnostics settings')">
            Show warning
          </cv-button>
          <cv-button @click="hideAlert">Hide</cv-button>
        </div>
        <cv-alert ref="alertElement" duration-ms="2400" aria-live="polite"></cv-alert>
      </article>

      <article class="component-card">
        <h3>Accordion / Link</h3>
        <p>Structured FAQ-style sections and semantic links.</p>
        <cv-accordion allow-multiple aria-label="Demo FAQ">
          <cv-accordion-item value="sync">
            <span slot="trigger">How does sync work?</span>
            Data is encrypted locally and synced only after explicit authorization.
          </cv-accordion-item>
          <cv-accordion-item value="export">
            <span slot="trigger">Can I export data?</span>
            Export supports encrypted backup and plain-text migration formats.
          </cv-accordion-item>
          <cv-accordion-item value="legacy" disabled>
            <span slot="trigger">Legacy mode</span>
            This section is disabled in the playground.
          </cv-accordion-item>
        </cv-accordion>
        <div class="example-row">
          <cv-link href="#overview">Jump to overview</cv-link>
          <cv-link href="#api">Open API section</cv-link>
        </div>
      </article>

      <article class="component-card">
        <h3>Tabs</h3>
        <p>Structured tab and panel composition.</p>
        <cv-tabs aria-label="section tabs">
          <cv-tab value="overview" selected>Overview</cv-tab>
          <cv-tab value="security">Security</cv-tab>
          <cv-tab value="api">API</cv-tab>
          <cv-tab-panel tab="overview">Overview content.</cv-tab-panel>
          <cv-tab-panel tab="security">Security content.</cv-tab-panel>
          <cv-tab-panel tab="api">API content.</cv-tab-panel>
        </cv-tabs>
      </article>

      <article class="component-card">
        <h3>Toast Region</h3>
        <p>Imperative notifications driven by controller.</p>
        <div class="example-row">
          <cv-button @click="showToast">Show toast</cv-button>
        </div>
        <cv-toast-region ref="toastRegion"></cv-toast-region>
      </article>
    </div>
  </section>
</template>
