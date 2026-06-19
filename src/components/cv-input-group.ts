import {css, html} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVInputGroupSize = 'small' | 'medium' | 'large'
type CVInputGroupVariant = 'outlined' | 'filled'

export class CVInputGroup extends ReatomLitElement {
  static elementName = 'cv-input-group'

  static get properties() {
    return {
      size: {type: String, reflect: true},
      variant: {type: String, reflect: true},
      attached: {type: Boolean, reflect: true},
    }
  }

  declare size: CVInputGroupSize
  declare variant: CVInputGroupVariant
  declare attached: boolean

  constructor() {
    super()
    this.size = 'medium'
    this.variant = 'outlined'
    this.attached = false
  }

  static styles = [
    css`
      :host {
        display: inline-flex;
        max-inline-size: 100%;
        --cv-input-group-gap: var(--cv-space-2, 8px);
      }

      [part='base'] {
        display: inline-flex;
        align-items: stretch;
        gap: var(--cv-input-group-gap);
        max-inline-size: 100%;
      }

      :host([attached]) [part='base'] {
        gap: 0;
      }

      [part='prefix'],
      [part='suffix'],
      [part='actions'] {
        display: inline-flex;
        align-items: center;
        color: var(--cv-color-text-muted, #9aa6bf);
      }

      [part='control'] {
        display: inline-flex;
        min-inline-size: 0;
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
      <span part="base">
        <span part="prefix"><slot name="prefix"></slot></span>
        <span part="control"><slot></slot></span>
        <span part="suffix"><slot name="suffix"></slot></span>
        <span part="actions"><slot name="actions"></slot></span>
      </span>
    `
  }
}
