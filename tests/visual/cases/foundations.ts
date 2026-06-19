import type {UikitVisualCase} from '../component-visual-types'
import {visualCase} from './helpers'

export const foundationCases: readonly UikitVisualCase[] = [
  visualCase({
    id: 'cv-theme-provider/nested-surface',
    component: 'cv-theme-provider',
    title: 'Nested theme provider with themed controls',
    states: ['dark-provider', 'surface', 'nested-controls'],
    html: `
      <cv-theme-provider mode="dark">
        <div class="visual-stack">
          <cv-card variant="outlined">
            <span slot="header">Nested provider surface</span>
            <p>Token-driven card content with a primary action and status badge.</p>
            <div slot="footer" class="visual-row">
              <cv-button variant="primary">Continue</cv-button>
              <cv-badge variant="success" pill>Synced</cv-badge>
            </div>
          </cv-card>
        </div>
      </cv-theme-provider>
    `,
  }),
  visualCase({
    id: 'cv-badge/states',
    component: 'cv-badge',
    title: 'Badge variants, sizes, pill, and dot states',
    states: ['neutral', 'primary', 'success', 'warning', 'danger', 'small', 'large', 'pill', 'dot'],
    html: `
      <div class="visual-stack">
        <div class="visual-row">
          <cv-badge variant="neutral">Neutral</cv-badge>
          <cv-badge variant="primary">Primary</cv-badge>
          <cv-badge variant="success">Success</cv-badge>
          <cv-badge variant="warning">Warning</cv-badge>
          <cv-badge variant="danger">Danger</cv-badge>
        </div>
        <div class="visual-row">
          <cv-badge size="small">Small</cv-badge>
          <cv-badge pill>Long pill badge</cv-badge>
          <cv-badge size="large" variant="primary">Large</cv-badge>
          <cv-badge dot variant="success" aria-label="Online"></cv-badge>
          <cv-badge dot pulse variant="danger" aria-label="Live alert"></cv-badge>
        </div>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-callout/states',
    component: 'cv-callout',
    title: 'Callout variants with closable and dense states',
    states: ['info', 'success', 'warning', 'danger', 'neutral', 'closable', 'dense'],
    html: `
      <div class="visual-grid">
        <cv-callout variant="info">Info callout with normal density.</cv-callout>
        <cv-callout variant="success">Success callout after a completed action.</cv-callout>
        <cv-callout variant="warning" closable>Warning callout with close affordance.</cv-callout>
        <cv-callout variant="danger" density="dense">Danger callout with dense spacing.</cv-callout>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-card/states',
    component: 'cv-card',
    title: 'Card variants, expandable content, and disabled state',
    states: ['elevated', 'outlined', 'filled', 'expanded', 'disabled', 'long-content'],
    html: `
      <div class="visual-grid">
        <cv-card variant="elevated">
          <span slot="header">Elevated</span>
          <p class="visual-long-text">Default card body with text that wraps over multiple lines.</p>
          <cv-button slot="footer" size="small">Open</cv-button>
        </cv-card>
        <cv-card variant="outlined" expandable expanded>
          <span slot="header">Expanded outline</span>
          <p>Expandable card body is visible and keeps footer spacing stable.</p>
        </cv-card>
        <cv-card variant="filled" expandable disabled>
          <span slot="header">Disabled filled</span>
          <p>Disabled expandable card should render without active affordance.</p>
        </cv-card>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-link/states',
    component: 'cv-link',
    title: 'Link default, focus, and long label states',
    states: ['default', 'focus', 'long-label'],
    interaction: {focus: 'cv-link[data-visual-id="focus"]'},
    html: `
      <div class="visual-row">
        <cv-link href="#default">Default link</cv-link>
        <cv-link data-visual-id="focus" href="#focus">Focused link</cv-link>
        <cv-link class="visual-long-text" href="#long">Link with a deliberately long wrapping label for layout checks</cv-link>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-landmark/regions',
    component: 'cv-landmark',
    title: 'Landmark region and complementary surfaces',
    states: ['region', 'complementary', 'labelled'],
    html: `
      <div class="visual-grid">
        <cv-landmark type="region" label="Vault summary">
          <div class="visual-panel">Region landmark content</div>
        </cv-landmark>
        <cv-landmark type="complementary" label="Related actions">
          <div class="visual-panel">Complementary landmark content</div>
        </cv-landmark>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-scroll-area/states',
    component: 'cv-scroll-area',
    title: 'Scroll area vertical and both-axis overflow',
    states: ['vertical', 'both', 'stable-scrollbar', 'snap'],
    html: `
      <div class="visual-row">
        <cv-scroll-area class="visual-scrollbox" scrollbar="stable" snap>
          <div class="visual-scroll-content">
            <div class="visual-list-row"><span>Activity row one</span><cv-badge>12:00</cv-badge></div>
            <div class="visual-list-row"><span>Activity row two with longer text</span><cv-badge>12:10</cv-badge></div>
            <div class="visual-list-row"><span>Activity row three</span><cv-badge>12:22</cv-badge></div>
            <div class="visual-list-row"><span>Activity row four</span><cv-badge>12:38</cv-badge></div>
          </div>
        </cv-scroll-area>
        <cv-scroll-area class="visual-scrollbox" orientation="both">
          <div class="visual-scroll-content">
            <div class="visual-list-row"><span>Wide scrollable workspace lane</span><cv-badge variant="primary">Active</cv-badge></div>
            <div class="visual-list-row"><span>Second wide lane</span><cv-badge variant="warning">Queued</cv-badge></div>
          </div>
        </cv-scroll-area>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-separator/orientations',
    component: 'cv-separator',
    title: 'Separator horizontal, labelled, and vertical orientations',
    states: ['horizontal', 'labelled', 'vertical', 'decorative-false'],
    html: `
      <div class="visual-stack">
        <cv-separator decorative="false">Section label</cv-separator>
        <div class="visual-row">
          <span>Left</span>
          <cv-separator orientation="vertical"></cv-separator>
          <span>Right</span>
        </div>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-visually-hidden/content',
    component: 'cv-visually-hidden',
    title: 'Visually hidden content in visible context',
    states: ['hidden-content', 'visible-neighbors'],
    html: `
      <div class="visual-row">
        <cv-badge>Visible before</cv-badge>
        <cv-visually-hidden>Screen reader only copy</cv-visually-hidden>
        <cv-badge variant="primary">Visible after</cv-badge>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-presence/states',
    component: 'cv-presence',
    title: 'Presence present and kept mounted hidden states',
    states: ['present', 'keep-mounted-hidden'],
    html: `
      <div class="visual-row">
        <cv-presence present>
          <cv-badge variant="success">Present content</cv-badge>
        </cv-presence>
        <cv-presence keep-mounted>
          <cv-badge variant="warning">Kept hidden content</cv-badge>
        </cv-presence>
      </div>
    `,
  }),
]
