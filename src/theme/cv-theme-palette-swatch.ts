import {css, html, LitElement} from 'lit'
import type {PropertyValues} from 'lit'

export class CVThemePaletteSwatch extends LitElement {
  static elementName = 'cv-theme-palette-swatch'

  static get properties() {
    return {
      color: {type: String},
      label: {type: String},
    }
  }

  declare color: string
  declare label: string

  constructor() {
    super()
    this.color = ''
    this.label = ''
  }

  static styles = [
    css`
      :host {
        display: inline-grid;
        inline-size: 28px;
        block-size: 28px;
        border: 1px solid var(--cv-color-border);
        border-radius: var(--cv-radius-sm);
        background: var(--_cv-theme-palette-swatch-color, var(--cv-color-surface-2));
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    if (changedProperties.has('color')) {
      if (this.color) {
        this.style.setProperty('--_cv-theme-palette-swatch-color', this.color)
      } else {
        this.style.removeProperty('--_cv-theme-palette-swatch-color')
      }
    }
    if (changedProperties.has('label')) {
      if (this.label) {
        this.setAttribute('aria-label', this.label)
      } else {
        this.removeAttribute('aria-label')
      }
    }
  }

  protected override render() {
    return html``
  }
}
