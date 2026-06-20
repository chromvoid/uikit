import {LitElement, css, nothing} from 'lit'
import {html as staticHtml, literal} from 'lit/static-html.js'

type CVAccordionItemPanelMotionState = 'closed' | 'opening' | 'open' | 'closing'

interface CVAccordionItemTriggerState {
  id: string
  role: 'button'
  tabindex: '0' | '-1'
  ariaExpanded: 'true' | 'false'
  ariaControls: string
  ariaDisabled: 'true' | 'false'
}

interface CVAccordionItemPanelState {
  id: string
  role: 'region'
  ariaLabelledBy: string
  hidden: boolean
}

export interface CVAccordionItemContracts {
  headerId: string
  headingLevel: number
  trigger: CVAccordionItemTriggerState
  panel: CVAccordionItemPanelState
}

export interface CVAccordionItemTriggerKeydownDetail {
  key: string
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

export type CVAccordionItemTriggerClickEvent = CustomEvent<null>
export type CVAccordionItemTriggerFocusEvent = CustomEvent<null>
export type CVAccordionItemTriggerKeydownEvent = CustomEvent<CVAccordionItemTriggerKeydownDetail>

export interface CVAccordionItemEventMap {
  'cv-accordion-item-trigger-click': CVAccordionItemTriggerClickEvent
  'cv-accordion-item-trigger-focus': CVAccordionItemTriggerFocusEvent
  'cv-accordion-item-trigger-keydown': CVAccordionItemTriggerKeydownEvent
}

export class CVAccordionItem extends LitElement {
  static elementName = 'cv-accordion-item'
  private static readonly closeFallbackMs = 360

  static get properties() {
    return {
      value: {type: String, reflect: true},
      disabled: {type: Boolean, reflect: true},
      expanded: {type: Boolean, reflect: true},
      active: {type: Boolean, reflect: true},
    }
  }

  declare value: string
  declare disabled: boolean
  declare expanded: boolean
  declare active: boolean

  private headerId = ''
  private headingLevel = 3
  private triggerState: CVAccordionItemTriggerState = {
    id: '',
    role: 'button',
    tabindex: '-1',
    ariaExpanded: 'false',
    ariaControls: '',
    ariaDisabled: 'false',
  }
  private panelState: CVAccordionItemPanelState = {
    id: '',
    role: 'region',
    ariaLabelledBy: '',
    hidden: true,
  }
  private panelMotionState: CVAccordionItemPanelMotionState = 'closed'
  private openingFrame: number | null = null
  private closeFallbackTimer: number | null = null

  constructor() {
    super()
    this.value = ''
    this.disabled = false
    this.expanded = false
    this.active = false
  }

  static styles = [
    css`
      :host {
        display: block;
        --cv-accordion-item-duration: var(--cv-duration-medium, 250ms);
        --cv-accordion-item-easing: var(--cv-easing-decelerate, cubic-bezier(0, 0, 0.2, 1));
        --cv-accordion-item-trigger-min-height: 44px;
        --cv-accordion-item-trigger-padding-inline: var(--cv-space-4, 16px);
        --cv-accordion-item-trigger-border-radius: var(--cv-radius-md, 10px);
        --cv-accordion-item-trigger-gap: var(--cv-space-3, 12px);
        --cv-accordion-item-panel-padding: var(--cv-space-4, 16px);
        --cv-accordion-item-panel-border-radius: var(--cv-radius-md, 10px);
        --cv-accordion-item-gap: var(--cv-space-0, 0px);
        --cv-accordion-item-indicator-size: 22px;
      }

      [part='base'] {
        display: grid;
        gap: var(--cv-accordion-item-gap);
        overflow: clip;
        border: 1px solid var(--cv-color-border-muted, var(--cv-color-border, #2a3245));
        border-radius: var(--cv-accordion-item-panel-border-radius);
        background: linear-gradient(
          180deg,
          var(--cv-color-surface-2, #162030) 0%,
          var(--cv-color-surface, #101722) 100%
        );
        color: var(--cv-color-text, #e8ecf6);
        transition:
          border-color var(--cv-accordion-item-duration) var(--cv-accordion-item-easing),
          background-color var(--cv-accordion-item-duration) var(--cv-accordion-item-easing),
          box-shadow var(--cv-accordion-item-duration) var(--cv-accordion-item-easing);
      }

      [part='header'] {
        margin: 0;
        font: inherit;
      }

      [part='trigger'] {
        inline-size: 100%;
        min-block-size: var(--cv-accordion-item-trigger-min-height);
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--cv-accordion-item-trigger-gap);
        padding: 0 var(--cv-accordion-item-trigger-padding-inline);
        border: 0;
        border-radius: calc(var(--cv-accordion-item-trigger-border-radius) - 1px);
        background: transparent;
        color: var(--cv-color-text, #e8ecf6);
        font: inherit;
        font-weight: var(--cv-font-weight-medium, 500);
        letter-spacing: 0;
        text-align: start;
        cursor: pointer;
        transition:
          background-color var(--cv-accordion-item-duration) var(--cv-accordion-item-easing),
          color var(--cv-accordion-item-duration) var(--cv-accordion-item-easing);
      }

      [part='trigger']:hover {
        background: var(--cv-color-surface-hover, hwb(186 0% 0% / 0.07));
      }

      [part='trigger']:focus-visible {
        outline: 2px solid var(--cv-color-focus-ring, var(--cv-color-primary, #65d7ff));
        outline-offset: -2px;
      }

      [part='trigger'] ::slotted(*) {
        margin-block: 0 !important;
        color: inherit;
        font: inherit !important;
        line-height: inherit !important;
      }

      [part~='indicator'] {
        inline-size: var(--cv-accordion-item-indicator-size);
        block-size: var(--cv-accordion-item-indicator-size);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        border-radius: var(--cv-radius-sm, 6px);
        background: var(--cv-color-surface-highlight, hwb(215 93.3% 0% / 0.06));
        color: var(--cv-color-text-muted, #9aa6bf);
        transition:
          background-color var(--cv-accordion-item-duration) var(--cv-accordion-item-easing),
          color var(--cv-accordion-item-duration) var(--cv-accordion-item-easing);
      }

      [part~='indicator'] slot {
        inline-size: 100%;
        block-size: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      [part~='indicator'] slot[name='collapse-icon'] {
        display: none;
      }

      :host([expanded]) [part~='indicator'] slot[name='expand-icon'] {
        display: none;
      }

      :host([expanded]) [part~='indicator'] slot[name='collapse-icon'] {
        display: inline-flex;
      }

      [part~='indicator'] slot::slotted(*) {
        inline-size: 1em;
        block-size: 1em;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: inherit;
      }

      [part~='indicator'] slot::slotted(svg) {
        display: block;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      [part~='indicator'] slot::slotted(cv-icon) {
        --cv-icon-size: 1em;
      }

      [part='default-expand-icon'],
      [part='default-collapse-icon'] {
        inline-size: 0.46em;
        block-size: 0.46em;
        border-block-start: 2px solid currentColor;
        border-inline-end: 2px solid currentColor;
        transform: rotate(45deg);
      }

      [part='default-collapse-icon'] {
        transform: rotate(90deg);
      }

      [part='panel'] {
        display: grid;
        grid-template-rows: 0fr;
        overflow: hidden;
        border-block-start: 1px solid transparent;
        color: var(--cv-color-text-muted, #9aa6bf);
        opacity: 0;
        transform: translateY(-4px);
        transition:
          grid-template-rows var(--cv-accordion-item-duration) var(--cv-accordion-item-easing),
          opacity var(--cv-accordion-item-duration) var(--cv-accordion-item-easing),
          transform var(--cv-accordion-item-duration) var(--cv-accordion-item-easing),
          border-color var(--cv-accordion-item-duration) var(--cv-accordion-item-easing);
      }

      [part='panel'][data-state='open'] {
        grid-template-rows: 1fr;
        border-block-start-color: var(--cv-color-border-faint, hwb(214 17.3% 63.5% / 0.18));
        opacity: 1;
        transform: translateY(0);
      }

      [part='panel'][hidden] {
        display: none;
      }

      [part='panel-content'] {
        min-block-size: 0;
        overflow: hidden;
      }

      [part='panel-content'] slot {
        display: grid;
        gap: var(--cv-space-2, 8px);
        padding: var(--cv-accordion-item-panel-padding);
      }

      [part='panel-content'] ::slotted(*) {
        margin-block: 0 !important;
        color: inherit;
      }

      :host([expanded]) [part='base'] {
        border-color: var(--cv-color-border-soft, var(--cv-color-border, #2a3245));
        box-shadow: inset 0 1px 0 var(--cv-alpha-white-4, hwb(0 100% 0% / 0.04));
      }

      :host([active]) [part='trigger'] {
        color: var(--cv-color-text-strong, var(--cv-color-text, #e8ecf6));
      }

      :host([active]) [part='base'] {
        border-color: var(--cv-color-primary-border-strong, var(--cv-color-primary, #65d7ff));
      }

      :host([active]) [part~='indicator'],
      :host([expanded]) [part~='indicator'] {
        background: var(--cv-color-primary-surface, hwb(186 0% 0% / 0.12));
        color: var(--cv-color-primary, #65d7ff);
      }

      :host([disabled]) [part='trigger'] {
        cursor: not-allowed;
        opacity: 0.55;
      }

      :host([disabled]) [part='trigger']:hover {
        background: transparent;
      }

      @media (prefers-reduced-motion: reduce) {
        [part='base'],
        [part='trigger'],
        [part~='indicator'],
        [part='panel'] {
          transition-duration: 1ms;
        }
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.cancelPanelTimers()
  }

  applyContracts(contracts: CVAccordionItemContracts): void {
    this.headerId = contracts.headerId
    this.headingLevel = contracts.headingLevel
    this.triggerState = contracts.trigger
    this.panelState = contracts.panel
    const nextExpanded = contracts.trigger.ariaExpanded === 'true'
    this.expanded = nextExpanded
    this.active = contracts.trigger.tabindex === '0'
    this.syncPanelMotionState(nextExpanded)
    this.requestUpdate()
  }

  focusTrigger(): void {
    const trigger = this.renderRoot.querySelector('[part="trigger"]') as HTMLButtonElement | null
    trigger?.focus()
  }

  private handleTriggerClick() {
    this.dispatchEvent(
      new CustomEvent<CVAccordionItemTriggerClickEvent['detail']>('cv-accordion-item-trigger-click', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleTriggerFocus() {
    this.dispatchEvent(
      new CustomEvent<CVAccordionItemTriggerFocusEvent['detail']>('cv-accordion-item-trigger-focus', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleTriggerKeyDown(event: KeyboardEvent) {
    const dispatched = this.dispatchEvent(
      new CustomEvent<CVAccordionItemTriggerKeydownEvent['detail']>('cv-accordion-item-trigger-keydown', {
        detail: {
          key: event.key,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
        },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    )

    if (!dispatched) {
      event.preventDefault()
    }
  }

  private handlePanelTransitionEnd(event: TransitionEvent) {
    if (event.target !== event.currentTarget || this.panelMotionState !== 'closing') {
      return
    }

    this.finishClosing()
  }

  private syncPanelMotionState(nextExpanded: boolean) {
    if (!this.hasUpdated) {
      this.cancelPanelTimers()
      this.panelMotionState = nextExpanded ? 'open' : 'closed'
      return
    }

    if (nextExpanded) {
      this.cancelPanelTimers()
      if (this.shouldReduceMotion()) {
        this.setPanelMotionState('open')
        return
      }

      if (this.panelMotionState === 'closed') {
        this.setPanelMotionState('opening')
        this.scheduleOpeningFrame()
        return
      }

      this.setPanelMotionState('open')
      return
    }

    this.cancelOpeningFrame()
    if (this.panelMotionState === 'closed') {
      return
    }

    if (this.shouldReduceMotion()) {
      this.finishClosing()
      return
    }

    this.setPanelMotionState('closing')
    this.scheduleCloseFallback()
  }

  private scheduleOpeningFrame() {
    void this.updateComplete.then(() => {
      if (!this.isConnected || !this.expanded || this.panelMotionState !== 'opening') {
        return
      }

      this.openingFrame = this.requestAnimationFrame(() => {
        // Keep the mounted collapsed frame visible for one paint. If we switch
        // to `open` in the same frame, browsers can coalesce styles and skip
        // the opening transition.
        if (!this.isConnected || !this.expanded || this.panelMotionState !== 'opening') {
          this.openingFrame = null
          return
        }

        this.openingFrame = this.requestAnimationFrame(() => {
          this.openingFrame = null
          if (!this.isConnected || !this.expanded || this.panelMotionState !== 'opening') {
            return
          }

          this.setPanelMotionState('open')
        })
      })
    })
  }

  private scheduleCloseFallback() {
    this.cancelCloseFallback()
    void this.updateComplete.then(() => {
      if (!this.isConnected || this.expanded || this.panelMotionState !== 'closing') {
        return
      }

      this.cancelCloseFallback()
      this.closeFallbackTimer = window.setTimeout(() => {
        this.closeFallbackTimer = null
        this.finishClosing()
      }, CVAccordionItem.closeFallbackMs)
    })
  }

  private finishClosing() {
    this.cancelPanelTimers()
    if (this.expanded) {
      this.setPanelMotionState('open')
      return
    }

    this.setPanelMotionState('closed')
  }

  private cancelPanelTimers() {
    this.cancelOpeningFrame()
    this.cancelCloseFallback()
  }

  private cancelCloseFallback() {
    if (this.closeFallbackTimer != null) {
      window.clearTimeout(this.closeFallbackTimer)
      this.closeFallbackTimer = null
    }
  }

  private cancelOpeningFrame() {
    if (this.openingFrame != null) {
      this.cancelAnimationFrame(this.openingFrame)
      this.openingFrame = null
    }
  }

  private setPanelMotionState(state: CVAccordionItemPanelMotionState) {
    if (this.panelMotionState === state) {
      return
    }

    this.panelMotionState = state
    this.requestUpdate()
  }

  private shouldReduceMotion() {
    if (typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  private requestAnimationFrame(callback: FrameRequestCallback) {
    if (typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(callback)
    }

    return window.setTimeout(() => {
      callback(window.performance.now())
    }, 16)
  }

  private cancelAnimationFrame(handle: number) {
    if (typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(handle)
      return
    }

    window.clearTimeout(handle)
  }

  private static readonly headingTags = {
    1: literal`h1`,
    2: literal`h2`,
    3: literal`h3`,
    4: literal`h4`,
    5: literal`h5`,
    6: literal`h6`,
  } as const

  protected override render() {
    const level = Math.max(1, Math.min(6, Math.trunc(this.headingLevel) || 3)) as 1 | 2 | 3 | 4 | 5 | 6
    const headingTag = CVAccordionItem.headingTags[level]
    const panelHidden = this.panelMotionState === 'closed'
    const panelClosing = this.panelMotionState === 'closing'

    return staticHtml`
      <div part="base">
        <${headingTag} id=${this.headerId} part="header">
          <button
            id=${this.triggerState.id}
            role=${this.triggerState.role}
            tabindex=${this.triggerState.tabindex}
            aria-expanded=${this.triggerState.ariaExpanded}
            aria-controls=${this.triggerState.ariaControls}
            aria-disabled=${this.triggerState.ariaDisabled}
            ?disabled=${this.triggerState.ariaDisabled === 'true'}
            part="trigger"
            type="button"
            @click=${this.handleTriggerClick}
            @focus=${this.handleTriggerFocus}
            @keydown=${this.handleTriggerKeyDown}
          >
            <slot name="trigger"></slot>
            <span part="indicator trigger-icon" aria-hidden="true">
              <slot name="expand-icon"><span part="default-expand-icon"></span></slot>
              <slot name="collapse-icon"><span part="default-collapse-icon"></span></slot>
            </span>
          </button>
        </${headingTag}>

        <div
          id=${this.panelState.id}
          role=${this.panelState.role}
          aria-labelledby=${this.panelState.ariaLabelledBy || nothing}
          aria-hidden=${panelClosing ? 'true' : nothing}
          ?hidden=${panelHidden}
          ?inert=${panelClosing}
          data-state=${this.panelMotionState}
          part="panel"
          @transitionend=${this.handlePanelTransitionEnd}
        >
          <div part="panel-content">
            <slot></slot>
          </div>
        </div>
      </div>
    `
  }
}
