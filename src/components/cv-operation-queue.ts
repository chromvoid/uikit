import {css} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import type {CVStatusTone} from './cv-status-indicator'

type CVOperationQueueDensity = 'comfortable' | 'compact'

export class CVOperationQueue extends ReatomLitElement {
  static elementName = 'cv-operation-queue'

  static get properties() {
    return {
      label: {type: String},
      busy: {type: Boolean, reflect: true},
      empty: {type: Boolean, reflect: true},
      density: {type: String, reflect: true},
      tone: {type: String, reflect: true},
    }
  }

  declare label: string
  declare busy: boolean
  declare empty: boolean
  declare density: CVOperationQueueDensity
  declare tone: CVStatusTone

  constructor() {
    super()
    this.label = 'Operations'
    this.busy = false
    this.empty = false
    this.density = 'comfortable'
    this.tone = 'neutral'
  }

  static styles = [
    css`
      :host {
        display: block;
        --cv-operation-queue-gap: var(--cv-space-3, 12px);
      }

      :host([density='compact']) {
        --cv-operation-queue-gap: var(--cv-space-2, 8px);
      }

      [part='base'] {
        display: grid;
        gap: var(--cv-operation-queue-gap);
        min-inline-size: 0;
      }

      [part='header'] {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--cv-space-2, 8px);
        min-inline-size: 0;
      }

      [part='title'],
      [part='summary'],
      [part='body'],
      [part='empty'],
      [part='footer'] {
        min-inline-size: 0;
      }

      [part='title'] {
        font-weight: 650;
      }

      [part='summary'],
      [part='empty'] {
        color: var(--cv-color-text-muted, #9aa6bd);
      }

      [part='actions'],
      [part='icon'] {
        display: inline-flex;
        align-items: center;
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
      <section
        part="base"
        aria-label=${this.label}
        aria-busy=${this.busy ? 'true' : 'false'}
        data-tone=${this.tone}
      >
        <header part="header">
          <span part="icon"><slot name="icon"></slot></span>
          <div part="title"><span part="summary"><slot name="summary">${this.label}</slot></span></div>
          <div part="actions"><slot name="actions"></slot></div>
        </header>
        ${
          this.empty
            ? html`
                <div part="empty"><slot name="empty"></slot></div>
              `
            : html`
                <div part="body"><slot></slot></div>
              `
        }
        <footer part="footer"><slot name="footer"></slot></footer>
      </section>
    `
  }
}
