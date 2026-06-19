import {css, html} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVScrollAreaOrientation = 'vertical' | 'horizontal' | 'both'
type CVScrollAreaScrollbar = 'auto' | 'stable' | 'hidden'

export class CVScrollArea extends ReatomLitElement {
  static elementName = 'cv-scroll-area'

  static get properties() {
    return {
      orientation: {type: String, reflect: true},
      snap: {type: Boolean, reflect: true},
      scrollbar: {type: String, reflect: true},
    }
  }

  declare orientation: CVScrollAreaOrientation
  declare snap: boolean
  declare scrollbar: CVScrollAreaScrollbar

  constructor() {
    super()
    this.orientation = 'vertical'
    this.snap = false
    this.scrollbar = 'auto'
  }

  static styles = [
    css`
      :host {
        display: block;
        min-block-size: 0;
        min-inline-size: 0;
      }

      [part='viewport'] {
        block-size: 100%;
        inline-size: 100%;
        overflow: auto;
      }

      :host([orientation='vertical']) [part='viewport'] {
        overflow-x: hidden;
        overflow-y: auto;
      }

      :host([orientation='horizontal']) [part='viewport'] {
        overflow-x: auto;
        overflow-y: hidden;
      }

      :host([scrollbar='stable']) [part='viewport'] {
        scrollbar-gutter: stable;
      }

      :host([scrollbar='hidden']) [part='viewport'] {
        scrollbar-width: none;
      }

      :host([scrollbar='hidden']) [part='viewport']::-webkit-scrollbar {
        display: none;
      }

      :host([snap]) [part='viewport'] {
        scroll-snap-type: y proximity;
      }

      :host([snap][orientation='horizontal']) [part='viewport'] {
        scroll-snap-type: x proximity;
      }

      :host([snap][orientation='both']) [part='viewport'] {
        scroll-snap-type: both proximity;
      }

      :host([snap]) ::slotted(*) {
        scroll-snap-align: start;
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
      <div part="viewport"><slot></slot></div>
    `
  }
}
