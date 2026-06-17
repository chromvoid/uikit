import {css} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVTaskListDensity = 'comfortable' | 'compact'

export class CVTaskList extends ReatomLitElement {
  static elementName = 'cv-task-list'

  static get properties() {
    return {
      label: {type: String},
      busy: {type: Boolean, reflect: true},
      empty: {type: Boolean, reflect: true},
      density: {type: String, reflect: true},
    }
  }

  declare label: string
  declare busy: boolean
  declare empty: boolean
  declare density: CVTaskListDensity

  constructor() {
    super()
    this.label = 'Tasks'
    this.busy = false
    this.empty = false
    this.density = 'comfortable'
  }

  static styles = [
    css`
      :host {
        display: block;
      }

      [part='base'] {
        display: grid;
        gap: var(--cv-task-list-gap, var(--cv-space-2, 8px));
        min-inline-size: 0;
      }

      [part='header'],
      [part='footer'] {
        min-inline-size: 0;
      }

      [part='list'] {
        display: grid;
        gap: var(--cv-task-list-row-gap, var(--cv-space-2, 8px));
        min-inline-size: 0;
      }

      :host([density='compact']) [part='list'] {
        gap: var(--cv-task-list-row-gap-compact, var(--cv-space-1, 4px));
      }

      [part='empty'] {
        color: var(--cv-color-text-muted, #9aa6bd);
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
      <section part="base" aria-label=${this.label} aria-busy=${this.busy ? 'true' : 'false'}>
        <div part="header"><slot name="header"></slot></div>
        ${
          this.empty
            ? html`
                <div part="empty"><slot name="empty"></slot></div>
              `
            : html`
                <div part="list" role="list"><slot></slot></div>
              `
        }
        <div part="footer"><slot name="footer"></slot></div>
      </section>
    `
  }
}
