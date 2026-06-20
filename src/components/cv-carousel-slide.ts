import {LitElement, css, html} from 'lit'

export class CVCarouselSlide extends LitElement {
  static elementName = 'cv-carousel-slide'

  static get properties() {
    return {
      value: {type: String, reflect: true},
      label: {type: String, reflect: true},
      active: {type: Boolean, reflect: true},
    }
  }

  declare value: string
  declare label: string
  declare active: boolean

  constructor() {
    super()
    this.value = ''
    this.label = ''
    this.active = false
  }

  static styles = [
    css`
      :host {
        display: block;
        flex: 0 0 var(--cv-carousel-slide-inline-size, 100%);
        scroll-snap-align: center;
        scroll-snap-stop: always;
      }

      :host([hidden]) {
        display: none;
      }

      [part='base'] {
        display: block;
        min-block-size: 120px;
        padding: var(--cv-space-4, 16px);
        border-radius: var(--cv-radius-md, 10px);
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface, #141923);
        color: var(--cv-color-text, #e8ecf6);
        transition:
          border-color 120ms ease,
          opacity 120ms ease;
      }

      :host([inert]) {
        pointer-events: none;
      }

      :host([aria-hidden='true']) [part='base'] {
        opacity: 0.72;
      }

      :host([active]) [part='base'] {
        border-color: var(--cv-color-primary, #65d7ff);
        opacity: 1;
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
      <div part="base"><slot></slot></div>
    `
  }
}
