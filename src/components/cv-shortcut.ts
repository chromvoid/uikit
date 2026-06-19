import {css, nothing} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVKbd} from './cv-kbd'

const parseKeysAttribute = (value: string | null): readonly string[] => {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export class CVShortcut extends ReatomLitElement {
  static elementName = 'cv-shortcut'

  static get properties() {
    return {
      label: {type: String},
      keys: {
        converter: {
          fromAttribute: parseKeysAttribute,
        },
      },
      separator: {type: String},
      ariaLabel: {type: String, attribute: 'aria-label'},
    }
  }

  declare label: string
  declare keys: readonly string[]
  declare separator: string
  declare ariaLabel: string

  constructor() {
    super()
    this.label = ''
    this.keys = []
    this.separator = '+'
    this.ariaLabel = ''
  }

  static styles = [
    css`
      :host {
        display: inline-flex;
        vertical-align: baseline;
      }

      [part='base'] {
        display: inline-flex;
        align-items: center;
        gap: var(--cv-shortcut-gap, var(--cv-space-1, 4px));
      }

      [part='separator'] {
        color: var(--cv-shortcut-separator-color, var(--cv-color-text-muted, #9aa6bd));
        font-size: var(--cv-shortcut-separator-font-size, 0.8em);
      }
    `,
  ]

  static define() {
    CVKbd.define()
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  protected override render() {
    const keys = this.keys.length > 0 ? this.keys : this.parseLabel()
    const label = this.ariaLabel || this.label || keys.join(this.separator)

    return html`
      <span part="base" aria-label=${label}>
        ${
          keys.length > 0
            ? keys.map(
                (key, index) => html`
                ${index > 0 ? html`<span part="separator" aria-hidden="true">${this.separator}</span>` : nothing}
                <cv-kbd part="key">${key}</cv-kbd>
              `,
              )
            : html`
                <slot></slot>
              `
        }
      </span>
    `
  }

  private parseLabel(): string[] {
    if (!this.label.trim()) return []
    const separator = this.separator || '+'
    return this.label
      .split(separator)
      .map((part) => part.trim())
      .filter(Boolean)
  }
}
