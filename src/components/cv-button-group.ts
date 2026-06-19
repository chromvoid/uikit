import {css, html, nothing} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVButtonGroupOrientation = 'horizontal' | 'vertical'
type CVButtonGroupSize = 'small' | 'medium' | 'large'

export class CVButtonGroup extends ReatomLitElement {
  static elementName = 'cv-button-group'

  static get properties() {
    return {
      orientation: {type: String, reflect: true},
      attached: {type: Boolean, reflect: true},
      size: {type: String, reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
    }
  }

  declare orientation: CVButtonGroupOrientation
  declare attached: boolean
  declare size: CVButtonGroupSize
  declare ariaLabel: string

  constructor() {
    super()
    this.orientation = 'horizontal'
    this.attached = false
    this.size = 'medium'
    this.ariaLabel = ''
  }

  static styles = [
    css`
      :host {
        display: inline-flex;
        --cv-button-group-gap: var(--cv-space-2, 8px);
      }

      [part='base'] {
        display: inline-flex;
        gap: var(--cv-button-group-gap);
      }

      :host([orientation='vertical']) [part='base'] {
        flex-direction: column;
      }

      :host([attached]) [part='base'] {
        gap: 0;
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
      <div part="base" role="group" aria-label=${this.ariaLabel || nothing}>
        <slot></slot>
      </div>
    `
  }
}
