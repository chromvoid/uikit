import {css, html, nothing} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVSeparatorOrientation = 'horizontal' | 'vertical'

export class CVSeparator extends ReatomLitElement {
  static elementName = 'cv-separator'

  static get properties() {
    return {
      orientation: {type: String, reflect: true},
      decorative: {type: Boolean, reflect: true},
    }
  }

  declare orientation: CVSeparatorOrientation
  declare decorative: boolean

  constructor() {
    super()
    this.orientation = 'horizontal'
    this.decorative = true
  }

  static styles = [
    css`
      :host {
        display: block;
      }

      [part='base'] {
        display: flex;
        align-items: center;
        gap: var(--cv-space-2, 8px);
        color: var(--cv-color-text-muted, #9aa6bf);
      }

      [part='base']::before,
      [part='base']::after {
        content: '';
        flex: 1 1 auto;
        border-block-start: 1px solid var(--cv-color-border, #2a3245);
      }

      :host([orientation='vertical']) {
        display: inline-block;
        align-self: stretch;
      }

      :host([orientation='vertical']) [part='base'] {
        block-size: 100%;
        inline-size: 1px;
        background: var(--cv-color-border, #2a3245);
      }

      :host([orientation='vertical']) [part='base']::before,
      :host([orientation='vertical']) [part='base']::after {
        content: none;
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
      <div
        part="base"
        role=${this.decorative ? nothing : 'separator'}
        aria-orientation=${this.decorative ? nothing : this.orientation}
        aria-hidden=${this.decorative ? 'true' : nothing}
      >
        <slot></slot>
      </div>
    `
  }
}
