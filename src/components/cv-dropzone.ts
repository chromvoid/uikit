import {css, nothing} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVSpinner} from './cv-spinner'

export class CVDropzone extends ReatomLitElement {
  static elementName = 'cv-dropzone'

  static get properties() {
    return {
      active: {type: Boolean, reflect: true},
      loading: {type: Boolean, reflect: true},
      disabled: {type: Boolean, reflect: true},
      message: {type: String},
      loadingLabel: {type: String, attribute: 'loading-label'},
    }
  }

  declare active: boolean
  declare loading: boolean
  declare disabled: boolean
  declare message: string
  declare loadingLabel: string

  constructor() {
    super()
    this.active = false
    this.loading = false
    this.disabled = false
    this.message = ''
    this.loadingLabel = 'Loading'
  }

  static styles = [
    css`
      :host {
        display: block;
        position: relative;
        min-inline-size: 0;
        min-block-size: 0;
      }

      [part='base'] {
        position: relative;
        min-inline-size: 0;
        min-block-size: 0;
        block-size: 100%;
      }

      [part='content'] {
        min-inline-size: 0;
        min-block-size: 0;
        transition: opacity var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
      }

      [part='overlay'],
      [part='loading-overlay'] {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: var(--cv-dropzone-overlay-padding, var(--cv-space-4, 16px));
        text-align: center;
        pointer-events: none;
      }

      [part='overlay'] {
        border: var(--cv-dropzone-overlay-border, 3px dashed var(--cv-color-primary, #65d7ff));
        border-radius: var(--cv-dropzone-overlay-radius, var(--cv-radius-3, 16px));
        background: var(--cv-dropzone-overlay-background, var(--cv-color-primary-subtle, #193442));
        color: var(--cv-dropzone-overlay-color, var(--cv-color-primary, #65d7ff));
        font-weight: 600;
        opacity: 0;
        z-index: 1;
        transition:
          opacity var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          transform var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
      }

      :host([active]) [part='overlay'] {
        opacity: 1;
      }

      :host([active]) [part='content'] {
        opacity: 0;
      }

      [part='loading-overlay'] {
        gap: var(--cv-space-2, 8px);
        background: var(--cv-dropzone-loading-background, var(--cv-color-surface-2, #181f2b));
        color: var(--cv-color-text, #e8ecf6);
        z-index: 1;
      }

      :host([disabled]) {
        opacity: 0.7;
      }
    `,
  ]

  static define() {
    CVSpinner.define()
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  protected override render() {
    return html`
      <div
        part="base"
        aria-busy=${this.loading ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
      >
        <div part="content"><slot></slot></div>
        <div part="overlay">
          <slot name="message">${this.message}</slot>
        </div>
        ${this.loading
          ? html`
              <div part="loading-overlay" role="status">
                <slot name="loading"><cv-spinner aria-hidden="true"></cv-spinner>${this.loadingLabel}</slot>
              </div>
            `
          : nothing}
      </div>
    `
  }
}
