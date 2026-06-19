import {createCard, type CardModel} from '@chromvoid/headless-ui/card'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVCardVariant = 'elevated' | 'outlined' | 'filled'
type CVCardOptionalSlot = 'image' | 'header' | 'footer'

export interface CVCardEventDetail {
  expanded: boolean
}

let cvCardNonce = 0

export class CVCard extends ReatomLitElement {
  static elementName = 'cv-card'

  static get properties() {
    return {
      variant: {type: String, reflect: true},
      expandable: {type: Boolean, reflect: true},
      expanded: {type: Boolean, reflect: true},
      disabled: {type: Boolean, reflect: true},
    }
  }

  declare variant: CVCardVariant
  declare expandable: boolean
  declare expanded: boolean
  declare disabled: boolean

  private readonly idBase = `cv-card-${++cvCardNonce}`
  private model: CardModel
  private hasImageContent = false
  private hasHeaderContent = false
  private hasFooterContent = false

  /**
   * When true, events are suppressed. Used to distinguish programmatic
   * state changes from user interaction.
   */
  private suppressEvents = false

  constructor() {
    super()
    this.variant = 'elevated'
    this.expandable = false
    this.expanded = false
    this.disabled = false
    this.model = this.createModel()
  }

  static styles = [
    css`
      :host {
        display: block;
        --cv-card-padding: var(--cv-space-4, 16px);
        --cv-card-border-radius: var(--cv-radius-md, 8px);
        --cv-card-border-color: var(--cv-color-border, #2a3245);
        --cv-card-background: var(--cv-color-surface, #141923);
        --cv-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.24);
        --cv-card-gap: var(--cv-space-0, 0px);
        --cv-card-media-aspect-ratio: 16 / 9;
        --cv-card-header-color: var(--cv-color-text-strong, #f5f7fc);
        --cv-card-header-font-family: var(--cv-font-family-display, var(--cv-font-family-body, inherit));
        --cv-card-header-font-size: var(--cv-font-size-md, 1rem);
        --cv-card-header-font-weight: var(--cv-font-weight-semibold, 600);
        --cv-card-header-line-height: 1.25;
        --cv-card-body-color: var(--cv-color-text-muted, #9aa6bf);
        --cv-card-body-font-size: var(--cv-font-size-sm, 0.875rem);
        --cv-card-body-line-height: 1.6;
        --cv-card-footer-color: var(--cv-color-text-secondary, var(--cv-color-text-muted, #9aa6bf));
        --cv-card-footer-font-size: var(--cv-font-size-sm, 0.875rem);
        --cv-card-footer-line-height: 1.35;
        --cv-card-indicator-size: var(--cv-space-4, 16px);
        --cv-card-indicator-transition: var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
      }

      [part='base'] {
        display: flex;
        flex-direction: column;
        gap: var(--cv-card-gap);
        border-radius: var(--cv-card-border-radius);
        background: var(--cv-card-background);
        color: var(--cv-color-text, #e8ecf6);
        overflow: hidden;
      }

      [part='image'] {
        display: block;
        overflow: hidden;
      }

      [part='image'] ::slotted(img) {
        display: block;
        inline-size: 100%;
        aspect-ratio: var(--cv-card-media-aspect-ratio);
        object-fit: cover;
      }

      [part='image'][hidden],
      [part='header'][hidden],
      [part='footer'][hidden] {
        display: none;
      }

      [part='header'] {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--cv-space-3, 12px);
        padding: var(--cv-card-padding);
        color: var(--cv-card-header-color);
        font-family: var(--cv-card-header-font-family);
        font-size: var(--cv-card-header-font-size);
        font-weight: var(--cv-card-header-font-weight);
        line-height: var(--cv-card-header-line-height);
        letter-spacing: 0;
        transition: background-color var(--cv-card-indicator-transition);
      }

      :host [part='header'] ::slotted(*) {
        margin-block: 0 !important;
        color: inherit;
        font: inherit !important;
        line-height: inherit !important;
      }

      [part='body'] {
        padding: 0 var(--cv-card-padding) var(--cv-card-padding);
        color: var(--cv-card-body-color);
        font-size: var(--cv-card-body-font-size);
        line-height: var(--cv-card-body-line-height);
        letter-spacing: 0;
      }

      [part='body'][data-padded-start] {
        padding-block-start: var(--cv-card-padding);
      }

      [part='body'][hidden] {
        display: none;
      }

      :host [part='body'] ::slotted(p),
      :host [part='body'] ::slotted(ul),
      :host [part='body'] ::slotted(ol) {
        margin-block: 0 !important;
        color: inherit;
        font: inherit !important;
        line-height: inherit !important;
      }

      [part='footer'] {
        padding: 0 var(--cv-card-padding) var(--cv-card-padding);
        color: var(--cv-card-footer-color);
        font-size: var(--cv-card-footer-font-size);
        line-height: var(--cv-card-footer-line-height);
        letter-spacing: 0;
      }

      :host [part='footer'] ::slotted(*) {
        margin-block: 0 !important;
      }

      :host [part='footer'] ::slotted(p),
      :host [part='footer'] ::slotted(ul),
      :host [part='footer'] ::slotted(ol) {
        color: inherit;
        font: inherit !important;
        line-height: inherit !important;
      }

      [part='indicator'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        inline-size: var(--cv-card-indicator-size);
        block-size: var(--cv-card-indicator-size);
        font-size: var(--cv-card-indicator-size);
        transition: transform var(--cv-card-indicator-transition);
      }

      [part='indicator']::before {
        content: '';
        display: block;
        inline-size: 0.45em;
        block-size: 0.45em;
        border-block-start: 2px solid currentColor;
        border-inline-end: 2px solid currentColor;
        transform: rotate(45deg);
      }

      :host([expanded]) [part='indicator'] {
        transform: rotate(90deg);
      }

      /* --- variant: elevated (default) --- */
      :host([variant='elevated']) [part='base'] {
        box-shadow: var(--cv-card-shadow);
      }

      /* --- variant: outlined --- */
      :host([variant='outlined']) [part='base'] {
        border: 1px solid var(--cv-card-border-color);
        box-shadow: none;
      }

      /* --- variant: filled --- */
      :host([variant='filled']) [part='base'] {
        box-shadow: none;
      }

      /* --- expandable header as trigger --- */
      :host([expandable]) [part='header'] {
        cursor: pointer;
        user-select: none;
      }

      :host([expandable]:not([disabled])) [part='header']:hover {
        background-color: color-mix(in oklab, var(--cv-color-primary, #65d7ff) 8%, transparent);
      }

      :host([expandable]) [part='header']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: -2px;
      }

      /* --- disabled --- */
      :host([disabled]) {
        opacity: 0.55;
      }

      :host([disabled]) [part='header'] {
        cursor: not-allowed;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties)
    this.syncSlotPresence('image')
    this.syncSlotPresence('header')
    this.syncSlotPresence('footer')
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('expandable')) {
      // Recreate model when expandable changes to reset headless state
      this.model = this.createModel()
      return
    }

    if (changedProperties.has('disabled')) {
      this.model.actions.setDisabled(this.disabled)
    }

    if (changedProperties.has('expanded') && this.model.state.isExpanded() !== this.expanded) {
      this.suppressEvents = true
      // Temporarily clear disabled so headless action is not rejected.
      // Programmatic property changes must always be honored.
      const wasDisabled = this.model.state.isDisabled()
      if (wasDisabled) this.model.actions.setDisabled(false)
      // Temporarily ensure expandable so the action is not rejected
      const wasExpandable = this.model.state.isExpandable()
      if (!wasExpandable) {
        // If not expandable, just set the atom directly - no action needed
        this.suppressEvents = false
        return
      }
      if (this.expanded) {
        this.model.actions.expand()
      } else {
        this.model.actions.collapse()
      }
      if (wasDisabled) this.model.actions.setDisabled(true)
      this.expanded = this.model.state.isExpanded()
      this.suppressEvents = false
    }
  }

  private createModel(): CardModel {
    return createCard({
      idBase: this.idBase,
      isExpandable: this.expandable,
      isExpanded: this.expanded,
      isDisabled: this.disabled,
      onExpandedChange: this.handleExpandedChange.bind(this),
    })
  }

  private handleExpandedChange(isExpanded: boolean): void {
    this.expanded = isExpanded
    if (this.suppressEvents) return

    const detail: CVCardEventDetail = {expanded: isExpanded}
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
    this.dispatchEvent(
      new CustomEvent('cv-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  // --- Event handlers (user interaction) ---

  private handleHeaderClick() {
    const triggerProps = this.model.contracts.getTriggerProps()
    if ('onClick' in triggerProps && typeof triggerProps.onClick === 'function') {
      triggerProps.onClick()
    }
  }

  private handleHeaderKeyDown(event: KeyboardEvent) {
    const triggerProps = this.model.contracts.getTriggerProps()
    if ('onKeyDown' in triggerProps && typeof triggerProps.onKeyDown === 'function') {
      triggerProps.onKeyDown(event)
    }
  }

  private handleImageSlotChange(event: Event) {
    this.syncSlotPresence('image', event.currentTarget as HTMLSlotElement)
  }

  private handleHeaderSlotChange(event: Event) {
    this.syncSlotPresence('header', event.currentTarget as HTMLSlotElement)
  }

  private handleFooterSlotChange(event: Event) {
    this.syncSlotPresence('footer', event.currentTarget as HTMLSlotElement)
  }

  private syncSlotPresence(slotName: CVCardOptionalSlot, slot?: HTMLSlotElement) {
    const slotElement = slot ?? this.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name="${slotName}"]`)
    if (!slotElement) return

    this.setSlotPresence(slotName, this.slotHasContent(slotElement))
  }

  private slotHasContent(slot: HTMLSlotElement): boolean {
    return slot.assignedNodes({flatten: true}).some((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) return true
      return Boolean(node.textContent?.trim())
    })
  }

  private setSlotPresence(slotName: CVCardOptionalSlot, hasContent: boolean) {
    if (slotName === 'image') {
      if (this.hasImageContent === hasContent) return
      this.hasImageContent = hasContent
    }

    if (slotName === 'header') {
      if (this.hasHeaderContent === hasContent) return
      this.hasHeaderContent = hasContent
    }

    if (slotName === 'footer') {
      if (this.hasFooterContent === hasContent) return
      this.hasFooterContent = hasContent
    }

    this.requestUpdate()
  }

  protected override render() {
    const triggerProps = this.model.contracts.getTriggerProps() as {
      id?: string
      role?: string
      tabindex?: number | string
      'aria-expanded'?: string | boolean
      'aria-controls'?: string
      'aria-disabled'?: string | boolean
    }
    const contentProps = this.model.contracts.getContentProps() as {
      id?: string
      role?: string
      'aria-labelledby'?: string
      hidden?: boolean
    }

    const isExpandable = this.model.state.isExpandable()
    const isHeaderVisible = isExpandable || this.hasHeaderContent

    // Spread trigger props onto header only when expandable
    const headerId = isExpandable ? triggerProps.id : undefined
    const headerRole = isExpandable ? triggerProps.role : undefined
    const headerTabindex = isExpandable ? triggerProps.tabindex : undefined
    const headerAriaExpanded = isExpandable ? triggerProps['aria-expanded'] : undefined
    const headerAriaControls = isExpandable ? triggerProps['aria-controls'] : undefined
    const headerAriaDisabled = isExpandable ? triggerProps['aria-disabled'] : undefined

    // Spread content props onto body only when expandable
    const bodyId = isExpandable ? contentProps.id : undefined
    const bodyRole = isExpandable ? contentProps.role : undefined
    const bodyAriaLabelledby = isExpandable ? contentProps['aria-labelledby'] : undefined
    const bodyHidden = isExpandable ? contentProps.hidden : false

    return html`
      <div part="base">
        <div part="image" ?hidden=${!this.hasImageContent}>
          <slot name="image" @slotchange=${this.handleImageSlotChange}></slot>
        </div>

        <div
          id=${headerId ?? nothing}
          role=${headerRole ?? nothing}
          tabindex=${headerTabindex ?? nothing}
          aria-expanded=${headerAriaExpanded ?? nothing}
          aria-controls=${headerAriaControls ?? nothing}
          aria-disabled=${headerAriaDisabled ?? nothing}
          part="header"
          ?hidden=${!isHeaderVisible}
          @click=${this.handleHeaderClick}
          @keydown=${this.handleHeaderKeyDown}
        >
          <slot name="header" @slotchange=${this.handleHeaderSlotChange}></slot>
          ${
            isExpandable
              ? html`
                  <span part="indicator" aria-hidden="true"></span>
                `
              : nothing
          }
        </div>

        <div
          id=${bodyId ?? nothing}
          role=${bodyRole ?? nothing}
          aria-labelledby=${bodyAriaLabelledby ?? nothing}
          ?hidden=${bodyHidden}
          ?data-padded-start=${!isHeaderVisible}
          part="body"
        >
          <slot></slot>
        </div>

        <div part="footer" ?hidden=${!this.hasFooterContent}>
          <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
        </div>
      </div>
    `
  }
}
