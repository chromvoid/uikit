import {LitElement, css, html, nothing} from 'lit'

import {componentResetStyles} from '../styles/component-styles'

export class CVMenuItem extends LitElement {
  static elementName = 'cv-menu-item'

  static get properties() {
    return {
      value: {type: String, reflect: true},
      disabled: {type: Boolean, reflect: true},
      active: {type: Boolean, reflect: true},
      selected: {type: Boolean, reflect: true},
      type: {type: String, reflect: true},
      checked: {type: Boolean, reflect: true},
      label: {type: String, reflect: true},
      hasSubmenu: {type: Boolean, reflect: true, attribute: 'has-submenu'},
    }
  }

  declare value: string
  declare disabled: boolean
  declare active: boolean
  declare selected: boolean
  declare type: 'normal' | 'checkbox' | 'radio'
  declare checked: boolean
  declare label: string
  declare hasSubmenu: boolean

  constructor() {
    super()
    this.value = ''
    this.disabled = false
    this.active = false
    this.selected = false
    this.type = 'normal'
    this.checked = false
    this.label = ''
    this.hasSubmenu = false
  }

  static styles = [
    componentResetStyles,
    css`
      :host {
        display: inline-block;
        outline: none;
      }

      .item {
        gap: var(--cv-menu-item-gap, var(--cv-space-2, 8px));
        padding: var(--cv-menu-item-padding-block, var(--cv-space-2, 8px))
          var(--cv-menu-item-padding-inline, var(--cv-space-3, 12px));
        border-radius: var(--cv-menu-item-border-radius, var(--cv-radius-sm, 6px));
        color: var(--cv-color-text, #e8ecf6);
        transition:
          background var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
      }

      :host(:hover) .item {
        background: var(--cv-color-primary-ring);
      }

      :host([active]) .item {
        background: var(--cv-color-primary-ring);
      }

      :host([selected]) .item {
        background: var(--cv-color-primary-border);
      }

      :host([disabled]) .item {
        opacity: 0.5;
      }

      :host(:focus-visible) .item {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      [part='label'] {
        min-inline-size: 0;
      }

      [part='checkmark'] {
        inline-size: 1em;
        block-size: 1em;
      }

      [part='submenu-icon'] {
        margin-inline-start: auto;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  private handleSubmenuSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement
    const assigned = slot.assignedElements()
    this.hasSubmenu = assigned.length > 0
  }

  protected override render() {
    const isCheckable = this.type === 'checkbox' || this.type === 'radio'

    return html`
      <div class="item cv-u-row" part="base">
        ${isCheckable ? html`<span part="checkmark" class="cv-u-icon-slot">${this.checked ? '\u2713' : ''}</span>` : nothing}
        <span part="prefix" class="cv-u-icon-slot"><slot name="prefix"></slot></span>
        <span part="label" class="cv-u-fill"><slot></slot></span>
        <span part="suffix" class="cv-u-icon-slot"><slot name="suffix"></slot></span>
        ${
          this.hasSubmenu
            ? html`
                <span part="submenu-icon" class="cv-u-icon-slot">\u25B6</span>
              `
            : nothing
        }
      </div>
      <slot name="submenu" @slotchange=${this.handleSubmenuSlotChange}></slot>
    `
  }
}
