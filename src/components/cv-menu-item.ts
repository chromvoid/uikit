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
        display: flex;
        align-items: center;
        inline-size: 100%;
        min-inline-size: 0;
        gap: var(--cv-menu-item-gap, var(--cv-space-2, 8px));
        padding: var(--cv-menu-item-padding-block, var(--cv-space-2, 8px))
          var(--cv-menu-item-padding-inline, var(--cv-space-3, 12px));
        border-radius: var(--cv-menu-item-border-radius, var(--cv-radius-sm, 6px));
        color: var(--cv-menu-item-color, var(--cv-color-text));
        background: var(--cv-menu-item-background, transparent);
        box-shadow: var(--cv-menu-item-shadow, none);
        transition:
          background var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          box-shadow var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
      }

      :host(:hover) .item {
        color: var(--cv-menu-item-hover-color, var(--cv-menu-item-color, var(--cv-color-text)));
        background: var(--cv-menu-item-hover-background, var(--cv-color-primary-ring));
        box-shadow: var(--cv-menu-item-hover-shadow, var(--cv-menu-item-shadow, none));
      }

      :host([active]) .item {
        color: var(--cv-menu-item-active-color, var(--cv-menu-item-color, var(--cv-color-text)));
        background: var(--cv-menu-item-active-background, var(--cv-color-primary-ring));
        box-shadow: var(--cv-menu-item-active-shadow, var(--cv-menu-item-shadow, none));
      }

      :host([selected]) .item {
        color: var(--cv-menu-item-selected-color, var(--cv-menu-item-color, var(--cv-color-text)));
        background: var(--cv-menu-item-selected-background, var(--cv-color-primary-border));
        box-shadow: var(--cv-menu-item-selected-shadow, var(--cv-menu-item-shadow, none));
      }

      :host([disabled]) .item {
        opacity: 0.5;
      }

      :host(:focus-visible) .item {
        outline: 2px solid var(--cv-menu-item-focus-ring, var(--cv-color-focus-ring));
        outline-offset: 1px;
      }

      [part='label'] {
        flex: 1 1 auto;
        min-inline-size: 0;
      }

      [part='prefix'],
      [part='suffix'],
      [part='checkmark'] {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
      }

      [part='checkmark'] {
        inline-size: 1em;
        block-size: 1em;
      }

      [part='submenu-icon'] {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
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
