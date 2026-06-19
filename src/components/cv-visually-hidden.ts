import {css, html} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export class CVVisuallyHidden extends ReatomLitElement {
  static elementName = 'cv-visually-hidden'

  static get properties() {
    return {
      focusable: {type: Boolean, reflect: true},
    }
  }

  declare focusable: boolean

  constructor() {
    super()
    this.focusable = false
  }

  static styles = [
    css`
      :host {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
      }

      :host([focusable]:focus-within) {
        position: static;
        inline-size: auto;
        block-size: auto;
        margin: 0;
        overflow: visible;
        clip: auto;
        clip-path: none;
        white-space: normal;
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
      <slot></slot>
    `
  }
}
