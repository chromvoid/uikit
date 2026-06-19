import {css} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export type CVStatusTone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger'
export type CVStatusSize = 'small' | 'medium' | 'large'

export class CVStatusIndicator extends ReatomLitElement {
  static elementName = 'cv-status-indicator'

  static get properties() {
    return {
      tone: {type: String, reflect: true},
      size: {type: String, reflect: true},
      pulse: {type: Boolean, reflect: true},
      decorative: {type: Boolean, reflect: true},
    }
  }

  declare tone: CVStatusTone
  declare size: CVStatusSize
  declare pulse: boolean
  declare decorative: boolean

  constructor() {
    super()
    this.tone = 'neutral'
    this.size = 'medium'
    this.pulse = false
    this.decorative = false
  }

  static styles = [
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
        --cv-status-marker-size: 0.625rem;
        --cv-status-gap: var(--cv-space-1, 4px);
        --cv-status-color: var(--cv-color-border-strong, #4c5870);
        --cv-status-font-size: var(--cv-font-size-xs, 12px);
        --cv-status-line-height: 1.2;
        --cv-status-min-block-size: 1.2em;
      }

      :host([size='small']) {
        --cv-status-marker-size: 0.5rem;
      }

      :host([size='large']) {
        --cv-status-marker-size: 0.75rem;
      }

      :host([tone='primary']) {
        --cv-status-color: var(--cv-color-primary, #65d7ff);
      }

      :host([tone='info']) {
        --cv-status-color: var(--cv-color-info, #65d7ff);
      }

      :host([tone='success']) {
        --cv-status-color: var(--cv-color-success, #5beba0);
      }

      :host([tone='warning']) {
        --cv-status-color: var(--cv-color-warning, #ffd166);
      }

      :host([tone='danger']) {
        --cv-status-color: var(--cv-color-danger, #ff6b6b);
      }

      [part='base'] {
        display: inline-flex;
        align-items: center;
        gap: var(--cv-status-gap);
        min-inline-size: 0;
        min-block-size: var(--cv-status-min-block-size);
        color: var(--cv-status-color);
        font-size: var(--cv-status-font-size);
        line-height: var(--cv-status-line-height);
      }

      [part='marker'] {
        inline-size: var(--cv-status-marker-size);
        block-size: var(--cv-status-marker-size);
        flex: 0 0 auto;
        border-radius: 999px;
        background: currentColor;
      }

      :host([pulse]) [part='marker'] {
        box-shadow: 0 0 0 0 currentColor;
        animation: cv-status-pulse 1.4s ease-out infinite;
      }

      [part='label'] {
        min-inline-size: 0;
        color: var(--cv-status-label-color, var(--cv-color-text, #e8ecf6));
        font-size: inherit;
        line-height: inherit;
      }

      [part='icon'],
      [part='suffix'] {
        display: inline-flex;
        align-items: center;
      }

      @media (prefers-reduced-motion: reduce) {
        :host([pulse]) [part='marker'] {
          animation: none;
        }
      }

      @keyframes cv-status-pulse {
        to {
          box-shadow: 0 0 0 8px rgb(255 255 255 / 0%);
        }
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  protected override render() {
    if (this.decorative) {
      return html`
        <span part="base" aria-hidden="true">
          <span part="marker" aria-hidden="true"></span>
          <span part="icon"><slot name="icon"></slot></span>
          <span part="label"><slot></slot></span>
          <span part="suffix"><slot name="suffix"></slot></span>
        </span>
      `
    }

    return html`
      <span part="base" role="status">
        <span part="marker" aria-hidden="true"></span>
        <span part="icon"><slot name="icon"></slot></span>
        <span part="label"><slot></slot></span>
        <span part="suffix"><slot name="suffix"></slot></span>
      </span>
    `
  }
}
