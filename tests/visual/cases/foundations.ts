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
    title: 'Card variants with media and expanded disclosure',
    states: ['elevated', 'outlined-media', 'filled-expanded', 'long-content'],
    html: `
      <div class="visual-grid">
        <cv-card variant="elevated">
          <span slot="header">Security report</span>
          <p class="visual-long-text">Default card body with text that wraps over multiple lines.</p>
          <cv-button slot="footer" size="small">Open</cv-button>
        </cv-card>
        <cv-card variant="outlined">
          <img slot="image" alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23070b12'/%3E%3Cpath d='M92 248 220 132 324 196 448 104 548 168' fill='none' stroke='%2300e5ff' stroke-width='18' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='448' cy='104' r='28' fill='%23b388ff'/%3E%3C/svg%3E" />
          <span slot="header">Media card</span>
          <p>Outlined card with a stable local media area.</p>
        </cv-card>
        <cv-card variant="filled" expandable expanded>
          <span slot="header">Compatibility disclosure</span>
          <p>Expandable fallback remains available while new flows use disclosure primitives.</p>
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
]
