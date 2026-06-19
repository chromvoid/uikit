import {css, html, nothing} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export type CVStepStatus = 'pending' | 'current' | 'complete' | 'error'

export class CVStep extends ReatomLitElement {
  static elementName = 'cv-step'

  static get properties() {
    return {
      value: {type: String, reflect: true},
      status: {type: String, reflect: true},
      disabled: {type: Boolean, reflect: true},
    }
  }

  declare value: string
  declare status: CVStepStatus
  declare disabled: boolean

  constructor() {
    super()
    this.value = ''
    this.status = 'pending'
    this.disabled = false
  }

  static styles = [
    css`
      :host {
        display: block;
      }

      [part='base'] {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--cv-space-2, 8px);
        align-items: start;
        color: var(--cv-color-text-muted, #9aa6bf);
      }

      [part='marker'] {
        display: inline-grid;
        place-items: center;
        inline-size: 1.5rem;
        block-size: 1.5rem;
        border-radius: 999px;
        border: 1px solid var(--cv-color-border, #2a3245);
      }

      :host([status='current']) [part='base'],
      :host([status='complete']) [part='base'] {
        color: var(--cv-color-text, #e8ecf6);
      }

      :host([status='current']) [part='marker'] {
        border-color: var(--cv-color-primary, #65d7ff);
      }

      :host([status='complete']) [part='marker'] {
        border-color: var(--cv-color-success, #5beba0);
      }

      :host([status='error']) [part='marker'] {
        border-color: var(--cv-color-danger, #ff6b6b);
      }

      :host([disabled]) {
        opacity: 0.55;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  protected override render() {
    return html`
      <div part="base" role="listitem" aria-current=${this.status === 'current' ? 'step' : nothing}>
        <span part="marker" aria-hidden="true"><slot name="marker"></slot></span>
        <span part="content"><slot></slot></span>
      </div>
    `
  }
}
