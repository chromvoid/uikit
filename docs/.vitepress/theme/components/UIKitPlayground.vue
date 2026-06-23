<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {withBase} from 'vitepress'

import {createToastController} from '@chromvoid/uikit'

type ProfileValue = 'silent' | 'balanced' | 'turbo' | 'locked'

const props = defineProps<{
  compact?: boolean
}>()

const meterByPreset: Record<ProfileValue, number> = {
  silent: 24,
  balanced: 46,
  turbo: 78,
  locked: 46,
}

const profileLabelByPreset: Record<ProfileValue, string> = {
  silent: 'Silent profile',
  balanced: 'Balanced profile',
  turbo: 'Turbo profile',
  locked: 'Locked profile',
}

const toastController = createToastController()
const toastRegion = ref<{controller?: unknown} | null>(null)
const alertElement = ref<{show: (message: string) => void; hide: () => void} | null>(null)
const selectedProfile = ref<ProfileValue>('balanced')

const profileMeter = computed(() => meterByPreset[selectedProfile.value])
const selectedProfileLabel = computed(() => profileLabelByPreset[selectedProfile.value])

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

function handleProfileChange(event: Event) {
  const value = (event as CustomEvent<{value?: string | null}>).detail?.value

  if (value && value in meterByPreset) {
    selectedProfile.value = value as ProfileValue
  }
}

onMounted(() => {
  if (toastRegion.value) {
    toastRegion.value.controller = toastController
  }
})
</script>

<template>
  <section class="component-playground" :class="{'component-playground--compact': props.compact}">
    <div class="playground-hero">
      <div class="playground-hero-copy">
        <p class="components-kicker">Interactive Playground</p>
        <h2 class="playground-title">
          {{ props.compact ? 'Preview the kit in-place' : 'UIKit components in working product states' }}
        </h2>
        <p class="components-description">
          {{
            props.compact
              ? 'Use the same reference site for onboarding, API lookup, and live interaction checks.'
              : 'Validate controls, feedback, navigation, and composed surface patterns in the same documentation site as the generated API reference.'
          }}
        </p>
        <div v-if="!props.compact" class="components-hero-actions">
          <a
            class="component-action component-action-primary"
            :href="withBase('/guide/getting-started.html')"
          >
            Quick start
          </a>
          <a class="component-action" :href="withBase('/components/')">Reference catalog</a>
        </div>
      </div>

      <dl class="playground-overview" aria-label="Playground coverage summary">
        <div>
          <dt>Families</dt>
          <dd>4</dd>
          <span>actions, forms, feedback, structure</span>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>live</dd>
          <span>registered custom elements</span>
        </div>
        <div>
          <dt>State</dt>
          <dd>bound</dd>
          <span>select drives meter output</span>
        </div>
      </dl>
    </div>

    <nav v-if="!props.compact" class="playground-jump" aria-label="Playground sections">
      <a href="#playground-surface">Surface</a>
      <a href="#playground-actions">Actions</a>
      <a href="#playground-forms">Forms</a>
      <a href="#playground-feedback">Feedback</a>
      <a href="#playground-structure">Structure</a>
    </nav>

    <section id="playground-surface" class="playground-stage" aria-labelledby="playground-stage-title">
      <div class="playground-stage-copy">
        <p class="components-kicker">Composed Surface</p>
        <h3 id="playground-stage-title">Vault route control desk</h3>
        <p>
          A compact product-style surface keeps status, actions, form state, live feedback, and
          progress together without leaving the component layer.
        </p>
        <div class="playground-chip-row" aria-label="Surface status labels">
          <cv-badge variant="success" pill>paired</cv-badge>
          <cv-badge variant="primary" pill>keyboard ready</cv-badge>
          <cv-badge variant="warning" pill>profile switchable</cv-badge>
        </div>
      </div>

      <div class="playground-console" aria-label="Composed component preview">
        <div class="playground-console-header">
          <div>
            <span>Route</span>
            <strong>border-core / visible</strong>
          </div>
          <cv-status-indicator tone="success" pulse>paired</cv-status-indicator>
        </div>

        <div class="playground-console-actions" aria-label="Route actions">
          <cv-button preset="action-primary">Unlock route</cv-button>
          <cv-button variant="ghost" toggle pressed>Audit pinned</cv-button>
          <cv-button variant="danger" outline>Block export</cv-button>
        </div>

        <div class="playground-console-grid">
          <cv-field>
            <span slot="label">Runtime profile</span>
            <span slot="description">{{ selectedProfileLabel }} updates the headroom meter.</span>
            <cv-select
              :value="selectedProfile"
              aria-label="Runtime profile"
              @cv-change="handleProfileChange"
            >
              <cv-select-option value="silent">Silent</cv-select-option>
              <cv-select-option value="balanced">Balanced</cv-select-option>
              <cv-select-option value="turbo">Turbo</cv-select-option>
              <cv-select-option value="locked" disabled>Locked</cv-select-option>
            </cv-select>
          </cv-field>

          <div class="playground-meter-panel" aria-label="Route health">
            <div>
              <span>Headroom</span>
              <strong>{{ profileMeter }}%</strong>
            </div>
            <cv-meter
              :value="profileMeter"
              min="0"
              max="100"
              low="25"
              high="80"
              optimum="50"
              aria-label="Performance headroom"
            ></cv-meter>
          </div>
        </div>

        <cv-progress value="68" max="100" aria-label="Vault migration progress">68%</cv-progress>
      </div>
    </section>

    <section id="playground-actions" class="playground-section" aria-labelledby="playground-actions-title">
      <div class="playground-section-header">
        <p class="components-kicker">Actions</p>
        <h3 id="playground-actions-title">Commands, toggles, and compact status labels</h3>
      </div>

      <div class="playground-showcase-grid">
        <article class="playground-card">
          <h4>Button states</h4>
          <p>Primary, secondary, disabled, loading, and pressed states in one control row.</p>
          <div class="playground-row">
            <cv-button preset="action-primary">Save route</cv-button>
            <cv-button variant="ghost">Details</cv-button>
            <cv-button loading>Committing</cv-button>
            <cv-button disabled>Unavailable</cv-button>
            <cv-button toggle pressed>Pinned</cv-button>
          </div>
        </article>

        <article class="playground-card">
          <h4>Switches and chips</h4>
          <p>Binary and token-like controls keep dense state readable.</p>
          <div class="playground-row playground-row--center">
            <cv-switch checked aria-label="Enable realtime sync"></cv-switch>
            <cv-chip selected pill value="audit">Audit</cv-chip>
            <cv-chip removable value="relay">Relay</cv-chip>
            <cv-chip disabled value="locked">Locked</cv-chip>
          </div>
        </article>
      </div>
    </section>

    <section id="playground-forms" class="playground-section" aria-labelledby="playground-forms-title">
      <div class="playground-section-header">
        <p class="components-kicker">Forms</p>
        <h3 id="playground-forms-title">Selection, text input, and validation structure</h3>
      </div>

      <div class="playground-showcase-grid">
        <article class="playground-card playground-card--wide">
          <h4>Field anatomy</h4>
          <p>Label, helper text, invalid state, and the slotted control stay visually aligned.</p>
          <div class="playground-form-grid">
            <cv-field required>
              <span slot="label">Vault alias</span>
              <span slot="description">Required state is owned by the field wrapper.</span>
              <cv-input value="border-core"></cv-input>
            </cv-field>

            <cv-field invalid>
              <span slot="label">Relay route</span>
              <span slot="description">Helper copy remains available before error text.</span>
              <cv-input value="unknown relay" invalid></cv-input>
              <span slot="error">Route is not available in the visible profile.</span>
            </cv-field>
          </div>
        </article>

        <article class="playground-card">
          <h4>Choices</h4>
          <p>Radio and multi-select controls expose selected and disabled states.</p>
          <div class="playground-stack">
            <cv-radio-group aria-label="Plan">
              <cv-radio value="starter" checked>Starter</cv-radio>
              <cv-radio value="pro">Pro</cv-radio>
              <cv-radio value="enterprise">Enterprise</cv-radio>
            </cv-radio-group>
            <cv-listbox
              selection-mode="multiple"
              focus-strategy="roving-tabindex"
              aria-label="UIKit demo options"
            >
              <cv-option value="alpha" selected>Alpha</cv-option>
              <cv-option value="beta">Beta</cv-option>
              <cv-option value="gamma">Gamma</cv-option>
              <cv-option value="delta" disabled>Delta (disabled)</cv-option>
            </cv-listbox>
          </div>
        </article>
      </div>
    </section>

    <section id="playground-feedback" class="playground-section" aria-labelledby="playground-feedback-title">
      <div class="playground-section-header">
        <p class="components-kicker">Feedback</p>
        <h3 id="playground-feedback-title">Progress, alerts, toasts, and passive indicators</h3>
      </div>

      <div class="playground-showcase-grid">
        <article class="playground-card">
          <h4>Progress stack</h4>
          <p>Linear, meter, and ring outputs cover task completion and bounded health.</p>
          <div class="playground-feedback-grid">
            <cv-progress value="60" max="100" aria-label="Migration progress">60%</cv-progress>
            <cv-meter
              value="46"
              min="0"
              max="100"
              low="25"
              high="80"
              optimum="50"
              aria-label="Performance headroom"
            ></cv-meter>
            <cv-progress-ring value="72" max="100" aria-label="Sync readiness">72%</cv-progress-ring>
          </div>
        </article>

        <article class="playground-card">
          <h4>Live feedback</h4>
          <p>Controller-backed regions can be triggered from normal product commands.</p>
          <div class="playground-row">
            <cv-button @click="showAlert('Configuration saved successfully')">Show alert</cv-button>
            <cv-button @click="hideAlert">Hide</cv-button>
            <cv-button @click="showToast">Show toast</cv-button>
          </div>
          <cv-alert ref="alertElement" duration-ms="2400" aria-live="polite"></cv-alert>
          <cv-toast-region ref="toastRegion" position="bottom-end"></cv-toast-region>
        </article>
      </div>
    </section>

    <section id="playground-structure" class="playground-section" aria-labelledby="playground-structure-title">
      <div class="playground-section-header">
        <p class="components-kicker">Structure</p>
        <h3 id="playground-structure-title">Tabs, disclosure, accordion, and links</h3>
      </div>

      <div class="playground-showcase-grid">
        <article class="playground-card playground-card--wide">
          <h4>Tabbed panels</h4>
          <p>Tabs keep related panels in one keyboard-managed structure.</p>
          <cv-tabs value="overview" aria-label="Section tabs">
            <cv-tab slot="nav" value="overview">Overview</cv-tab>
            <cv-tab slot="nav" value="security">Security</cv-tab>
            <cv-tab slot="nav" value="api">API</cv-tab>
            <cv-tab-panel tab="overview">
              Overview content keeps product context close to the active tab.
            </cv-tab-panel>
            <cv-tab-panel tab="security">
              Security content can carry a focused trust-boundary summary.
            </cv-tab-panel>
            <cv-tab-panel tab="api">API content links back to generated component contracts.</cv-tab-panel>
          </cv-tabs>
        </article>

        <article class="playground-card">
          <h4>Disclosure and accordion</h4>
          <p>Expandable primitives cover one-off details and grouped sections.</p>
          <div class="playground-stack">
            <cv-disclosure>
              <span slot="trigger">Advanced diagnostics</span>
              Realtime overlays, memory tracing, and latency probes are enabled for this profile.
            </cv-disclosure>
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
            <div class="playground-row">
              <cv-link href="#playground-surface">Back to surface</cv-link>
              <cv-link :href="withBase('/components/')">Open catalog</cv-link>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
