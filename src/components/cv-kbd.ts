import {css} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVKbdSize = 'small' | 'medium' | 'large'
type CVKbdTone = 'neutral' | 'strong'

export class CVKbd extends ReatomLitElement {
  static elementName = 'cv-kbd'

  static get properties() {
    return {
      size: {type: String, reflect: true},
      tone: {type: String, reflect: true},
    }
  }

  declare size: CVKbdSize
  declare tone: CVKbdTone

  constructor() {
    super()
    this.size = 'medium'
    this.tone = 'neutral'
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
        justify-content: center;
        min-inline-size: var(--cv-kbd-min-inline-size, 1.45em);
        min-block-size: var(--cv-kbd-min-block-size, 1.45em);
        padding-inline: var(--cv-kbd-padding-inline, 0.35em);
        border: 1px solid var(--cv-kbd-border-color, var(--cv-color-border, #2a3245));
        border-radius: var(--cv-kbd-radius, var(--cv-radius-xs, 4px));
        background: var(--cv-kbd-background, var(--cv-color-surface-2, #181f2b));
        color: var(--cv-kbd-color, var(--cv-color-text, #e8ecf6));
        font: inherit;
        font-size: var(--cv-kbd-font-size, 0.85em);
        line-height: 1;
        white-space: nowrap;
      }

      :host([size='small']) [part='base'] {
        font-size: 0.75em;
      }

      :host([size='large']) [part='base'] {
        font-size: 0.95em;
      }

      :host([tone='strong']) [part='base'] {
        border-color: var(--cv-color-border-strong, #4c5870);
        background: var(--cv-color-surface-3, #222b3a);
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  protected override render() {
    return html` <kbd part="base"><slot></slot></kbd> `
  }
}
