import {
  createPopover,
  type PopoverDismissIntent,
  type PopoverModel,
  type PopoverOpenSource,
} from '@chromvoid/headless-ui/popover'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {
  getPlacementFallbacks,
  getPositionAreaForPlacement,
  resolvePopoverArrowOffset,
  resolvePopoverPosition,
  type CVPopoverPlacement,
  type CVPopoverRect,
} from './cv-popover-positioning'

export interface CVPopoverEventDetail {
  open: boolean
  openedBy: string | null
  dismissIntent: string | null
}

export type {CVPopoverPlacement} from './cv-popover-positioning'

export type CVPopoverAnchor = 'trigger' | 'host'
export type CVPopoverTriggerMode = 'internal' | 'external'

export interface CVPopoverShowOptions {
  source?: HTMLElement
  openedBy?: PopoverOpenSource
}

type NativePopoverElement = HTMLElement & {
  showPopover?: (options?: {source?: HTMLElement}) => void
  hidePopover?: () => void
}

const popoverTriggerKeys = new Set(['Enter', ' ', 'Spacebar', 'ArrowDown'])

function supportsNativePopover(): boolean {
  return (
    typeof HTMLElement !== 'undefined' &&
    typeof HTMLElement.prototype.showPopover === 'function' &&
    typeof HTMLElement.prototype.hidePopover === 'function'
  )
}

function supportsAnchorPositioning(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('position-area: top left') &&
    CSS.supports('top: anchor(bottom)')
  )
}

function supportsAnchorTryFallbacks(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('position-try-fallbacks: flip-block')
  )
}

function supportsNativeAnchoredAutoplacement(): boolean {
  return supportsNativePopover() && supportsAnchorPositioning() && supportsAnchorTryFallbacks()
}

function isPopoverOpen(element: HTMLElement): boolean {
  try {
    return element.matches(':popover-open')
  } catch {
    return false
  }
}

function toRect(rect: DOMRect): CVPopoverRect {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  }
}

let cvPopoverNonce = 0

export class CVPopover extends ReatomLitElement {
  static elementName = 'cv-popover'

  static get properties() {
    return {
      open: {type: Boolean, reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
      ariaLabelledBy: {type: String, attribute: 'aria-labelledby'},
      closeOnEscape: {type: Boolean, attribute: 'close-on-escape', reflect: true},
      closeOnOutsidePointer: {type: Boolean, attribute: 'close-on-outside-pointer', reflect: true},
      closeOnOutsideFocus: {type: Boolean, attribute: 'close-on-outside-focus', reflect: true},
      placement: {type: String, reflect: true},
      anchor: {type: String, reflect: true},
      triggerMode: {type: String, attribute: 'trigger-mode', reflect: true},
      offset: {type: Number, reflect: true},
      arrow: {type: Boolean, reflect: true},
    }
  }

  declare open: boolean
  declare ariaLabel: string
  declare ariaLabelledBy: string
  declare closeOnEscape: boolean
  declare closeOnOutsidePointer: boolean
  declare closeOnOutsideFocus: boolean
  declare placement: CVPopoverPlacement
  declare anchor: CVPopoverAnchor
  declare triggerMode: CVPopoverTriggerMode
  declare offset: number
  declare arrow: boolean

  private readonly idBase = `cv-popover-${++cvPopoverNonce}`
  private model: PopoverModel
  private previousOpen = false
  private hasLayoutListeners = false
  private layoutFrame = -1
  private focusContentOnNextUpdate = false
  private restoreFocusTarget: HTMLElement | null = null
  private _sourceEl: HTMLElement | null = null

  get sourceEl(): HTMLElement | null {
    return this._sourceEl
  }

  set sourceEl(value: HTMLElement | null) {
    const previous = this._sourceEl
    if (previous === value) return
    this._sourceEl = value
    this.requestUpdate('sourceEl', previous)
  }

  constructor() {
    super()
    this.open = false
    this.ariaLabel = ''
    this.ariaLabelledBy = ''
    this.closeOnEscape = true
    this.closeOnOutsidePointer = true
    this.closeOnOutsideFocus = true
    this.placement = 'bottom-start'
    this.anchor = 'trigger'
    this.triggerMode = 'internal'
    this.offset = 4
    this.arrow = false
    this.model = this.createModel()
    this.previousOpen = this.model.state.isOpen()
  }

  static styles = [
    css`
      :host {
        display: inline-block;
      }

      :host([trigger-mode='external'][anchor='trigger']) {
        display: contents;
      }

      [part='base'] {
        position: relative;
        display: inline-grid;
        gap: var(--cv-space-1, 4px);
      }

      :host([trigger-mode='external'][anchor='trigger']) [part='base'] {
        position: static;
        display: contents;
        gap: 0;
      }

      [part='trigger'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-block-size: 36px;
        padding: 0 var(--cv-space-3, 12px);
        border-radius: var(--cv-radius-sm, 6px);
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface, #141923);
        color: var(--cv-color-text, #e8ecf6);
      }

      [part='trigger']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      [part='content'] {
        position: absolute;
        inset-inline-start: 0;
        inset-block-start: calc(100% + var(--cv-popover-offset, var(--cv-space-1, 4px)));
        z-index: var(--cv-popover-z-index, 20);
        min-inline-size: var(
          --cv-popover-min-inline-size,
          max(220px, var(--cv-popover-anchor-inline-size, 0px))
        );
        max-inline-size: var(--cv-popover-max-inline-size, min(560px, calc(100vw - 32px)));
        display: grid;
        gap: var(--cv-popover-gap, var(--cv-space-2, 8px));
        padding: var(--cv-popover-padding, var(--cv-space-3, 12px));
        border-radius: var(--cv-popover-border-radius, var(--cv-radius-md, 10px));
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface-elevated, #1d2432);
        box-shadow: var(--cv-shadow-1, 0 2px 8px rgba(0, 0, 0, 0.24));
        color: var(--cv-color-text, #e8ecf6);
        margin: 0;
        overflow: visible;
        opacity: 1;
        transform: translate3d(0, 0, 0);
        transition:
          opacity var(--cv-popover-transition-duration, var(--cv-duration-fast, 120ms))
            var(--cv-easing-standard, ease),
          transform var(--cv-popover-transition-duration, var(--cv-duration-fast, 120ms))
            var(--cv-easing-standard, ease),
          display var(--cv-popover-transition-duration, var(--cv-duration-fast, 120ms)) allow-discrete;
        transition-behavior: allow-discrete;
      }

      [part='content'][hidden] {
        display: none;
        opacity: 0;
        transform: translate3d(0, -2px, 0);
      }

      [part='content'][popover]:not(:popover-open) {
        display: none;
        opacity: 0;
        transform: translate3d(0, -2px, 0);
      }

      @starting-style {
        [part='content']:not([hidden]) {
          opacity: 0;
          transform: translate3d(0, -2px, 0);
        }
      }

      [part='content']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      [part='arrow'] {
        position: absolute;
        z-index: -1;
        display: block;
        inline-size: var(--cv-popover-arrow-size, 12px);
        block-size: var(--cv-popover-arrow-size, 12px);
        background: var(--cv-popover-arrow-background, var(--cv-color-surface-elevated, #1d2432));
        border: 1px solid var(--cv-popover-arrow-border-color, var(--cv-color-border-strong, #3d4a5f));
        transform: rotate(45deg);
        pointer-events: none;
      }

      [part='content'][data-placement^='bottom'] [part='arrow'] {
        inset-block-start: calc(var(--cv-popover-arrow-size, 10px) / -2);
        inset-inline-start: var(--cv-popover-arrow-inline-start, var(--cv-space-4, 16px));
      }

      [part='content'][data-placement^='top'] [part='arrow'] {
        inset-block-end: calc(var(--cv-popover-arrow-size, 10px) / -2);
        inset-inline-start: var(--cv-popover-arrow-inline-start, var(--cv-space-4, 16px));
        transform: rotate(225deg);
      }

      [part='content'][data-placement^='right'] [part='arrow'] {
        inset-inline-start: calc(var(--cv-popover-arrow-size, 10px) / -2);
        inset-block-start: var(--cv-popover-arrow-block-start, var(--cv-space-4, 16px));
        transform: rotate(315deg);
      }

      [part='content'][data-placement^='left'] [part='arrow'] {
        inset-inline-end: calc(var(--cv-popover-arrow-size, 10px) / -2);
        inset-block-start: var(--cv-popover-arrow-block-start, var(--cv-space-4, 16px));
        transform: rotate(135deg);
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.syncOutsideListeners()
    // Re-attach layout (resize/scroll) listeners when reconnected while open;
    // disconnectedCallback tears them down, and without this they would not
    // come back until the next property change triggers updated().
    if (this.model.state.isOpen() && !supportsNativeAnchoredAutoplacement()) {
      this.toggleLayoutListeners(true)
      this.scheduleLayout()
    }
  }

  override disconnectedCallback(): void {
    this.syncOutsideListeners(true)
    this.toggleLayoutListeners(false)
    this.cancelLayoutFrame()

    if (supportsNativePopover()) {
      const content = this.getContentElement()
      if (content && isPopoverOpen(content)) {
        try {
          content.hidePopover?.()
        } catch {
          // ignore
        }
      }
    }

    super.disconnectedCallback()
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('ariaLabel') ||
      changedProperties.has('ariaLabelledBy') ||
      changedProperties.has('closeOnEscape') ||
      changedProperties.has('closeOnOutsidePointer') ||
      changedProperties.has('closeOnOutsideFocus')
    ) {
      const wasOpen = this.model.state.isOpen()
      this.model = this.createModel(wasOpen)
      this.previousOpen = wasOpen
    }

    if (changedProperties.has('open') && this.model.state.isOpen() !== this.open) {
      if (this.open) {
        this.prepareAnchorForOpen()
        this.model.actions.open('programmatic')
      } else {
        this.model.actions.close('programmatic')
      }

      this.emitToggleEvents()
      this.syncOutsideListeners()
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    this.syncOutsideListeners()
    this.syncNativePopover()

    const modelOpen = this.model.state.isOpen()
    const shouldTrackLayout = modelOpen && !supportsNativeAnchoredAutoplacement()
    this.toggleLayoutListeners(shouldTrackLayout)

    if (modelOpen) {
      this.scheduleLayout()
    } else {
      this.cancelLayoutFrame()
      const content = this.getContentElement()
      if (content) {
        this.clearInlineLayout(content)
        content.dataset['placement'] = this.placement
        content.dataset['anchorPositioning'] = 'false'
      }
    }

    if (this.focusContentOnNextUpdate && modelOpen) {
      this.focusContentOnNextUpdate = false
      this.getContentElement()?.focus({preventScroll: true})
    }

    if (
      modelOpen &&
      (changedProperties.has('placement') ||
        changedProperties.has('offset') ||
        changedProperties.has('anchor') ||
        changedProperties.has('triggerMode') ||
        changedProperties.has('sourceEl'))
    ) {
      this.scheduleLayout()
    }
  }

  show(options: CVPopoverShowOptions = {}): void {
    if (options.source) {
      this.sourceEl = options.source
    }

    this.prepareAnchorForOpen(options.source)
    this.model.actions.open(options.openedBy ?? 'programmatic')
    this.emitToggleEvents()
    this.syncOutsideListeners()
    this.requestUpdate()
  }

  hide(intent: PopoverDismissIntent = 'programmatic'): void {
    this.model.actions.close(intent)
    this.emitToggleEvents()
    this.syncOutsideListeners()
    this.requestUpdate()
  }

  toggle(options: CVPopoverShowOptions = {}): void {
    if (this.model.state.isOpen()) {
      this.hide('programmatic')
      return
    }

    this.show(options)
  }

  private createModel(initialOpen = this.open): PopoverModel {
    return createPopover({
      idBase: this.idBase,
      initialOpen,
      ariaLabel: this.ariaLabel || undefined,
      ariaLabelledBy: this.ariaLabelledBy || undefined,
      closeOnEscape: this.closeOnEscape,
      closeOnOutsidePointer: this.closeOnOutsidePointer,
      closeOnOutsideFocus: this.closeOnOutsideFocus,
      useNativePopover: supportsNativePopover(),
    })
  }

  private getContentElement(): NativePopoverElement | null {
    return this.shadowRoot?.querySelector('[part="content"]') as NativePopoverElement | null
  }

  private getTriggerElement(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null
  }

  private resolveAnchorElement(): HTMLElement | null {
    if (this.anchor === 'host') {
      return this
    }

    if (this.triggerMode === 'external') {
      return this.sourceEl ?? this
    }

    return this.getTriggerElement() ?? this
  }

  private prepareAnchorForOpen(source?: HTMLElement): void {
    if (source) {
      this.sourceEl = source
    }

    const anchor = source ?? this.resolveAnchorElement()
    if (anchor) {
      this.restoreFocusTarget = anchor
    }
  }

  private buildEventDetail(): CVPopoverEventDetail {
    return {
      open: this.model.state.isOpen(),
      openedBy: this.model.state.openedBy(),
      dismissIntent: this.model.state.lastDismissIntent(),
    }
  }

  private emitToggleEvents(): void {
    const isOpen = this.model.state.isOpen()
    if (isOpen === this.previousOpen) return

    const detail = this.buildEventDetail()
    const beforeToggleEvent = new CustomEvent('beforetoggle', {
      detail,
      bubbles: true,
      composed: true,
      cancelable: detail.open,
    })
    this.dispatchEvent(beforeToggleEvent)

    if (detail.open && beforeToggleEvent.defaultPrevented) {
      this.model.actions.close('programmatic')
      this.open = false
      this.previousOpen = false
      this.focusContentOnNextUpdate = false
      this.requestUpdate()
      return
    }

    this.open = isOpen
    this.previousOpen = isOpen
    this.focusContentOnNextUpdate = isOpen

    this.dispatchEvent(
      new CustomEvent('toggle', {
        detail,
        bubbles: false,
        composed: true,
        cancelable: false,
      }),
    )

    if (!isOpen) {
      // Match native popover semantics: only pull focus back to the trigger
      // when focus is still inside the popover at close time. On a light
      // dismiss caused by focus leaving (Tab out / outside focus), focus has
      // already moved elsewhere and must be left where the user put it,
      // otherwise keyboard users get yanked back and cannot tab past.
      if (this.containsActiveElement()) {
        this.restoreFocus()
      }
    }
  }

  private containsActiveElement(): boolean {
    let active: Element | null = document.activeElement
    while (active) {
      if (active === this) return true
      const root = active.getRootNode()
      active = root instanceof ShadowRoot ? root.host : null
    }
    return false
  }

  private restoreFocus(): void {
    const target = this.restoreFocusTarget
    if (target?.isConnected) {
      try {
        target.focus()
      } catch {
        // ignore
      }
      return
    }

    const restoreId = this.model.state.restoreTargetId()
    if (!restoreId) return

    const trigger = this.shadowRoot?.querySelector(`[id="${restoreId}"]`) as HTMLElement | null
    trigger?.focus()
  }

  private syncOutsideListeners(forceOff = false): void {
    const shouldListen = !forceOff && this.model.state.isOpen()
    if (shouldListen) {
      document.addEventListener('pointerdown', this.handleDocumentPointerDown)
      document.addEventListener('focusin', this.handleDocumentFocusIn)
    } else {
      document.removeEventListener('pointerdown', this.handleDocumentPointerDown)
      document.removeEventListener('focusin', this.handleDocumentFocusIn)
    }
  }

  private handleDocumentPointerDown = (event: Event) => {
    if (!this.model.state.isOpen()) return

    const path = event.composedPath()
    if (path.includes(this)) return

    this.model.contracts.getContentProps().onPointerDownOutside()
    this.emitToggleEvents()
    this.syncOutsideListeners()
    this.requestUpdate()
  }

  private handleDocumentFocusIn = (event: FocusEvent) => {
    if (!this.model.state.isOpen()) return

    const path = event.composedPath()
    if (path.includes(this)) return

    this.model.contracts.getContentProps().onFocusOutside()
    this.emitToggleEvents()
    this.syncOutsideListeners()
    this.requestUpdate()
  }

  private handleTriggerClick() {
    this.prepareAnchorForOpen(this.getTriggerElement() ?? undefined)
    this.model.contracts.getTriggerProps().onClick()
    this.emitToggleEvents()
    this.syncOutsideListeners()
    this.requestUpdate()
  }

  private handleTriggerKeyDown(event: KeyboardEvent) {
    if (popoverTriggerKeys.has(event.key)) {
      event.preventDefault()
    }

    this.prepareAnchorForOpen(this.getTriggerElement() ?? undefined)
    this.model.contracts.getTriggerProps().onKeyDown({key: event.key})
    this.emitToggleEvents()
    this.syncOutsideListeners()
    this.requestUpdate()
  }

  private handleContentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Already consumed by a nested widget/popover — don't act again.
      if (event.defaultPrevented) return
      // Only swallow Escape (preventDefault/stopPropagation) when it actually
      // closes this popover. With closeOnEscape=false the key must bubble to
      // any ancestor (e.g. a parent dialog). When it does close us, stop here
      // so a single Escape only dismisses the topmost popover in a stack.
      if (this.closeOnEscape) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    this.model.contracts.getContentProps().onKeyDown({key: event.key})
    this.emitToggleEvents()
    this.syncOutsideListeners()
    this.requestUpdate()
  }

  private handleNativeToggle = (event: Event) => {
    if (!supportsNativePopover()) return

    const toggleEvent = event as Event & {newState?: 'open' | 'closed'}
    const newState = toggleEvent.newState === 'closed' ? 'closed' : 'open'
    this.model.actions.handleNativeToggle(newState)
    this.emitToggleEvents()
    this.syncOutsideListeners()
    this.requestUpdate()
  }

  private clearInlineLayout(content: HTMLElement): void {
    content.style.position = ''
    content.style.top = ''
    content.style.left = ''
    content.style.right = ''
    content.style.bottom = ''
    content.style.insetInlineStart = ''
    content.style.insetBlockStart = ''
    content.style.insetInlineEnd = ''
    content.style.insetBlockEnd = ''
    content.style.transform = ''
    content.style.translate = ''
    content.style.margin = ''
    content.style.marginTop = ''
    content.style.marginRight = ''
    content.style.marginBottom = ''
    content.style.marginLeft = ''
    content.style.removeProperty('position-area')
    content.style.removeProperty('position-try-fallbacks')
    content.style.removeProperty('--cv-popover-anchor-inline-size')
    content.style.removeProperty('--cv-popover-arrow-inline-start')
    content.style.removeProperty('--cv-popover-arrow-block-start')
  }

  private syncArrowPosition(content: HTMLElement, anchor: HTMLElement, placement: CVPopoverPlacement): void {
    const arrow = content.querySelector('[part="arrow"]') as HTMLElement | null
    if (!arrow) return

    const contentRect = toRect(content.getBoundingClientRect())
    const anchorRect = toRect(anchor.getBoundingClientRect())
    const arrowWidth = arrow.offsetWidth || arrow.getBoundingClientRect().width
    const arrowHeight = arrow.offsetHeight || arrow.getBoundingClientRect().height
    const [side] = placement.split('-')

    if (side === 'top' || side === 'bottom') {
      content.style.setProperty(
        '--cv-popover-arrow-inline-start',
        `${resolvePopoverArrowOffset(anchorRect, contentRect, arrowWidth, 'inline')}px`,
      )
      content.style.removeProperty('--cv-popover-arrow-block-start')
      return
    }

    content.style.setProperty(
      '--cv-popover-arrow-block-start',
      `${resolvePopoverArrowOffset(anchorRect, contentRect, arrowHeight, 'block')}px`,
    )
    content.style.removeProperty('--cv-popover-arrow-inline-start')
  }

  private applyDirectionalOffset(content: HTMLElement, placement: CVPopoverPlacement): void {
    content.style.margin = '0'
    content.style.marginTop = ''
    content.style.marginRight = ''
    content.style.marginBottom = ''
    content.style.marginLeft = ''

    const [side] = placement.split('-')
    const value = `${this.offset}px`

    switch (side) {
      case 'top':
        content.style.marginBottom = value
        break
      case 'right':
        content.style.marginLeft = value
        break
      case 'bottom':
        content.style.marginTop = value
        break
      case 'left':
        content.style.marginRight = value
        break
    }
  }

  private syncNativePopover(): void {
    if (!supportsNativePopover()) return

    const content = this.getContentElement()
    if (!content) return

    const isOpen = this.model.state.isOpen()
    const popoverOpen = isPopoverOpen(content)

    if (isOpen && !popoverOpen) {
      const anchor = this.resolveAnchorElement()
      try {
        if (anchor) {
          content.showPopover?.({source: anchor})
        } else {
          content.showPopover?.()
        }
      } catch {
        // ignore open failures
      }
      return
    }

    if (!isOpen && popoverOpen) {
      try {
        content.hidePopover?.()
      } catch {
        // ignore close failures
      }
    }
  }

  private syncPopoverLayout(): void {
    const content = this.getContentElement()
    const anchor = this.resolveAnchorElement()
    if (!content || !anchor) return

    const anchorRect = toRect(anchor.getBoundingClientRect())

    if (supportsNativeAnchoredAutoplacement()) {
      this.clearInlineLayout(content)
      content.style.setProperty(
        '--cv-popover-anchor-inline-size',
        `${Math.max(0, Math.round(anchorRect.width))}px`,
      )
      content.dataset['anchorPositioning'] = 'true'
      content.dataset['placement'] = this.placement
      content.style.position = 'fixed'
      content.style.inset = 'auto'
      content.style.margin = '0'
      this.applyDirectionalOffset(content, this.placement)
      content.style.setProperty('position-area', getPositionAreaForPlacement(this.placement))
      content.style.setProperty(
        'position-try-fallbacks',
        getPlacementFallbacks(this.placement)
          .slice(1)
          .map((candidate) => getPositionAreaForPlacement(candidate))
          .join(', '),
      )
      this.syncArrowPosition(content, anchor, this.placement)
      return
    }

    const contentRect = toRect(content.getBoundingClientRect())
    const resolved = resolvePopoverPosition(anchorRect, contentRect, this.placement, this.offset, {
      width: window.innerWidth,
      height: window.innerHeight,
      padding: 8,
    })

    this.clearInlineLayout(content)
    content.style.setProperty(
      '--cv-popover-anchor-inline-size',
      `${Math.max(0, Math.round(anchorRect.width))}px`,
    )
    content.dataset['anchorPositioning'] = 'false'
    content.dataset['placement'] = resolved.placement
    content.style.position = 'fixed'
    content.style.top = `${resolved.top}px`
    content.style.left = `${resolved.left}px`
    content.style.transform = 'none'
    content.style.translate = 'none'
    this.syncArrowPosition(content, anchor, resolved.placement)
  }

  private cancelLayoutFrame(): void {
    if (this.layoutFrame === -1) return
    cancelAnimationFrame(this.layoutFrame)
    this.layoutFrame = -1
  }

  private scheduleLayout(): void {
    this.cancelLayoutFrame()
    this.layoutFrame = requestAnimationFrame(() => {
      this.layoutFrame = -1
      this.syncPopoverLayout()
    })
  }

  private toggleLayoutListeners(nextState: boolean): void {
    if (this.hasLayoutListeners === nextState) return

    this.hasLayoutListeners = nextState
    if (nextState) {
      window.addEventListener('resize', this.handleViewportChange)
      window.addEventListener('scroll', this.handleViewportChange, true)
      return
    }

    window.removeEventListener('resize', this.handleViewportChange)
    window.removeEventListener('scroll', this.handleViewportChange, true)
  }

  private handleViewportChange = () => {
    if (!this.model.state.isOpen()) return
    this.scheduleLayout()
  }

  protected override render() {
    const triggerProps = this.model.contracts.getTriggerProps()
    const contentProps = this.model.contracts.getContentProps()
    const renderTrigger = this.triggerMode === 'internal'

    return html`
      <div part="base">
        ${
          renderTrigger
            ? html`
              <button
                id=${triggerProps.id}
                role=${triggerProps.role}
                tabindex=${triggerProps.tabindex}
                aria-haspopup=${triggerProps['aria-haspopup']}
                aria-expanded=${triggerProps['aria-expanded']}
                aria-controls=${triggerProps['aria-controls']}
                part="trigger"
                type="button"
                @click=${this.handleTriggerClick}
                @keydown=${this.handleTriggerKeyDown}
              >
                <slot name="trigger">Open popover</slot>
              </button>
            `
            : nothing
        }

        <div
          id=${contentProps.id}
          role=${contentProps.role}
          tabindex=${contentProps.tabindex}
          aria-modal=${contentProps['aria-modal']}
          aria-label=${contentProps['aria-label'] ?? nothing}
          aria-labelledby=${contentProps['aria-labelledby'] ?? nothing}
          popover=${contentProps.popover ?? nothing}
          ?hidden=${contentProps.hidden ?? false}
          class="cv-u-discrete-presence"
          data-placement=${this.placement}
          data-anchor=${this.anchor}
          data-trigger-mode=${this.triggerMode}
          data-anchor-positioning="false"
          style=${`--cv-popover-offset:${this.offset}px;`}
          part="content"
          @keydown=${this.handleContentKeyDown}
          @toggle=${this.handleNativeToggle}
        >
          <slot></slot>
          ${
            this.arrow
              ? html`
                  <span part="arrow"><slot name="arrow"></slot></span>
                `
              : nothing
          }
        </div>
      </div>
    `
  }
}
