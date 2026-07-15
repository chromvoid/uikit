import {LitElement, css, html} from 'lit'

export class CVGridCell extends LitElement {
  static elementName = 'cv-grid-cell'

  static get properties() {
    return {
      column: {type: String, reflect: true},
      disabled: {type: Boolean, reflect: true},
      active: {type: Boolean, reflect: true},
      selected: {type: Boolean, reflect: true},
    }
  }

  declare column: string
  declare disabled: boolean
  declare active: boolean
  declare selected: boolean

  constructor() {
    super()
    this.column = ''
    this.disabled = false
    this.active = false
    this.selected = false
  }

  static styles = [
    css`
      :host {
        display: table-cell;
        padding: var(--cv-space-2, 8px) var(--cv-space-3, 12px);
        border-bottom: 1px solid var(--cv-color-border-soft);
        color: var(--cv-color-text, #e8ecf6);
        outline: none;
      }

      :host([active]) {
        background: var(--cv-color-active);
      }

      :host([selected]) {
        background: var(--cv-color-primary-ring);
      }

      :host([disabled]) {
        opacity: 0.55;
      }

      :host(:focus-visible) {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: -2px;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  protected override render() {
    return html` <slot></slot> `
  }
}
