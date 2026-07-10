import {atom, computed} from '@reatom/core'
import {css, type PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVDialog} from './cv-dialog'

export interface CVBottomSheetEventDetail {
  open: boolean
  detent?: CVBottomSheetDetent
}

export type CVBottomSheetDetent = 'collapsed' | 'middle' | 'expanded'
export type CVBottomSheetInputEvent = CustomEvent<CVBottomSheetEventDetail>
export type CVBottomSheetChangeEvent = CustomEvent<CVBottomSheetEventDetail>

export interface CVBottomSheetEventMap {
  'cv-input': CVBottomSheetInputEvent
  'cv-change': CVBottomSheetChangeEvent
}

const DRAG_DISMISS_DISTANCE_PX = 96
const DRAG_DISMISS_VELOCITY_PX_PER_MS = 0.75
const DRAG_DETENT_DISTANCE_PX = 64
const DRAG_DETENT_VELOCITY_PX_PER_MS = 0.5
const DETENT_ORDER: CVBottomSheetDetent[] = ['collapsed', 'middle', 'expanded']
const openBottomSheets = new Set<HTMLElement>()

export const cvBottomSheetOpenCount = atom(0, 'cvBottomSheet.openCount')
export const cvAnyBottomSheetOpen = computed(() => cvBottomSheetOpenCount() > 0, 'cvBottomSheet.anyOpen')

function syncOpenBottomSheetRegistry(sheet: HTMLElement, open: boolean): void {
  const previousCount = openBottomSheets.size

  if (open) {
    openBottomSheets.add(sheet)
  } else {
    openBottomSheets.delete(sheet)
  }

  if (openBottomSheets.size !== previousCount) {
    cvBottomSheetOpenCount.set(openBottomSheets.size)
  }
}

export class CVBottomSheet extends ReatomLitElement {
  static elementName = 'cv-bottom-sheet'

  static get properties() {
    return {
      open: {type: Boolean, reflect: true},
      modal: {type: Boolean, reflect: true},
      type: {type: String, reflect: true},
      closeOnEscape: {type: Boolean, attribute: 'close-on-escape', reflect: true},
      closeOnOutsidePointer: {
        type: Boolean,
        attribute: 'close-on-outside-pointer',
        reflect: true,
      },
      closeOnOutsideFocus: {type: Boolean, attribute: 'close-on-outside-focus', reflect: true},
      initialFocusId: {type: String, attribute: 'initial-focus-id'},
      noHeader: {type: Boolean, attribute: 'no-header', reflect: true},
      closable: {type: Boolean, reflect: true},
      showHandle: {type: Boolean, attribute: 'show-handle', reflect: true},
      dragToClose: {type: Boolean, attribute: 'drag-to-close', reflect: true},
      detents: {type: String, reflect: true},
      detent: {type: String, reflect: true},
      handleLabel: {type: String, attribute: 'handle-label'},
    }
  }

  declare open: boolean
  declare modal: boolean
  declare type: 'dialog' | 'alertdialog'
  declare closeOnEscape: boolean
  declare closeOnOutsidePointer: boolean
  declare closeOnOutsideFocus: boolean
  declare initialFocusId: string
  declare noHeader: boolean
  declare closable: boolean
  declare showHandle: boolean
  declare dragToClose: boolean
  declare detents: string
  declare detent: CVBottomSheetDetent
  declare handleLabel: string

  private dragPointerId: number | null = null
  private dragStartY = 0
  private dragStartedAt = 0
  private dragStartDetent: CVBottomSheetDetent = 'expanded'
  private dragMoved = false
  private suppressNextHandleClick = false

  constructor() {
    super()
    this.open = false
    this.modal = true
    this.type = 'dialog'
    this.closeOnEscape = true
    this.closeOnOutsidePointer = true
    this.closeOnOutsideFocus = true
    this.initialFocusId = ''
    this.noHeader = false
    this.closable = true
    this.showHandle = true
    this.dragToClose = true
    this.detents = ''
    this.detent = 'expanded'
    this.handleLabel = 'Resize sheet'
  }

  static styles = css`
    :host {
      display: contents;
    }

    cv-dialog {
      --_cv-bottom-sheet-overlay-block-start: max(
        var(--cv-bottom-sheet-safe-top, 16px),
        env(safe-area-inset-top, 0px)
      );
      --_cv-bottom-sheet-safe-bottom-inset: var(
        --cv-bottom-sheet-safe-bottom,
        env(safe-area-inset-bottom, 0px)
      );
      --_cv-bottom-sheet-keyboard-bottom-inset: var(--cv-bottom-sheet-keyboard-inset, 0px);
      --_cv-bottom-sheet-visible-viewport-block-size: var(--cv-bottom-sheet-viewport-block-size, 100dvh);
      --_cv-bottom-sheet-overlay-block-end: calc(
        var(--_cv-bottom-sheet-safe-bottom-inset) + var(--_cv-bottom-sheet-keyboard-bottom-inset)
      );
      --_cv-bottom-sheet-available-block-size: max(
        0px,
        calc(
          var(--_cv-bottom-sheet-visible-viewport-block-size) - var(
              --_cv-bottom-sheet-overlay-block-start
            ) - var(--_cv-bottom-sheet-safe-bottom-inset)
        )
      );
      --cv-dialog-z-index: var(--cv-bottom-sheet-z-index, 40);
      --cv-dialog-width: var(--cv-bottom-sheet-width, 100%);
      --cv-dialog-max-height: var(--cv-bottom-sheet-max-height, min(82dvh, calc(100dvh - 32px)));
      --cv-dialog-border-radius: var(
        --cv-bottom-sheet-border-radius,
        var(--cv-radius-lg, 14px) var(--cv-radius-lg, 14px) 0 0
      );
      --cv-dialog-overlay-color: var(--cv-bottom-sheet-overlay-color, var(--cv-color-overlay));
      --cv-dialog-padding-block: 0px;
      --cv-dialog-padding-inline: 0px;
      --cv-dialog-content-transition-property: transform;
      --cv-dialog-transition-duration: var(--cv-bottom-sheet-dismiss-duration, 180ms);
      --cv-dialog-transition-easing-open: var(--cv-easing-decelerate, cubic-bezier(0, 0, 0.2, 1));
      --cv-dialog-transition-easing-close: var(--cv-easing-standard, ease);
      --cv-dialog-content-closed-transform: translateY(
        calc(100% + var(--_cv-bottom-sheet-overlay-block-end) + 32px)
      );
      --cv-dialog-content-open-transform: translateY(var(--_cv-bottom-sheet-drag-offset, 0px));
    }

    cv-dialog::part(overlay) {
      place-items: end center;
      padding-block-start: var(--_cv-bottom-sheet-overlay-block-start);
      padding-block-end: 0px;
      transform: translateY(calc(0px - var(--_cv-bottom-sheet-overlay-block-end)));
      padding-inline: var(--cv-bottom-sheet-inline-inset, 0px);
      transition: transform 0.12s ease;
    }

    cv-dialog::part(content) {
      inline-size: var(--cv-bottom-sheet-width, 100%);
      max-inline-size: var(--cv-bottom-sheet-max-width, 100%);
      max-block-size: min(
        var(--cv-bottom-sheet-max-height, min(82dvh, calc(100dvh - 32px))),
        var(--_cv-bottom-sheet-available-block-size)
      );
      gap: 0;
      grid-template-rows: auto minmax(0, 1fr) auto;
      overflow: hidden;
      padding: 0;
      border-block-end: 0;
      border-radius: var(
        --cv-bottom-sheet-border-radius,
        var(--cv-radius-lg, 14px) var(--cv-radius-lg, 14px) 0 0
      );
      will-change: transform;
    }

    cv-dialog.has-detents {
      --_cv-bottom-sheet-detent-max-block-size: min(
        var(--cv-bottom-sheet-expanded-height, min(92dvh, calc(100dvh - 32px))),
        var(--_cv-bottom-sheet-available-block-size)
      );
      --_cv-bottom-sheet-active-detent-block-size: var(--_cv-bottom-sheet-detent-max-block-size);
      --cv-bottom-sheet-detent-visible-height: min(
        var(--_cv-bottom-sheet-active-detent-block-size),
        var(--_cv-bottom-sheet-detent-max-block-size)
      );
      --_cv-bottom-sheet-detent-offset: 0px;
      --cv-dialog-content-open-transform: translateY(
        calc(var(--_cv-bottom-sheet-detent-offset, 0px) + var(--_cv-bottom-sheet-drag-offset, 0px))
      );
    }

    cv-dialog.has-detents::part(content) {
      block-size: var(--cv-bottom-sheet-detent-visible-height);
    }

    cv-dialog.has-detents::part(body) {
      max-block-size: none;
    }

    cv-dialog::part(header) {
      padding: var(--cv-bottom-sheet-header-padding, var(--cv-space-4, 16px));
    }

    cv-dialog.detent-collapsed {
      --_cv-bottom-sheet-active-detent-block-size: var(--cv-bottom-sheet-collapsed-height, 148px);
      --_cv-bottom-sheet-detent-offset: 0px;
    }

    cv-dialog.detent-middle {
      --_cv-bottom-sheet-active-detent-block-size: var(--cv-bottom-sheet-middle-height, min(52dvh, 440px));
      --_cv-bottom-sheet-detent-offset: 0px;
    }

    cv-dialog.detent-expanded {
      --_cv-bottom-sheet-active-detent-block-size: var(
        --cv-bottom-sheet-expanded-height,
        min(92dvh, calc(100dvh - 32px))
      );
      --_cv-bottom-sheet-detent-offset: 0px;
    }

    cv-dialog.is-dragging::part(content) {
      transition: none;
    }

    cv-dialog::part(body) {
      min-block-size: 0;
      overflow: auto;
      padding: var(--cv-bottom-sheet-body-padding, 0 var(--cv-space-4, 16px) var(--cv-space-4, 16px));
    }

    cv-dialog::part(footer) {
      padding: var(
        --cv-bottom-sheet-footer-padding,
        var(--cv-space-3, 12px) var(--cv-space-4, 16px) var(--cv-space-4, 16px)
      );
    }

    cv-dialog:not(.has-footer)::part(footer) {
      display: none;
      padding: 0;
    }

    .sheet-handle {
      box-sizing: border-box;
      inline-size: 100%;
      min-block-size: var(--cv-bottom-sheet-handle-block-size, 48px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding-block: var(--cv-bottom-sheet-handle-padding-block, 12px 20px);
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .sheet-handle:focus-visible {
      outline: 2px solid var(--cv-color-primary, #65d7ff);
      outline-offset: -2px;
    }

    .sheet-handle:active {
      cursor: grabbing;
    }

    .sheet-grabber {
      inline-size: var(--cv-bottom-sheet-grabber-width, 44px);
      block-size: var(--cv-bottom-sheet-grabber-height, 4px);
      border-radius: 999px;
      background: var(--cv-bottom-sheet-grabber-color, var(--cv-color-border-strong, #64748b));
    }

    @media (prefers-reduced-motion: reduce) {
      cv-dialog {
        --cv-bottom-sheet-dismiss-duration: 0ms;
        --cv-dialog-transition-duration: 0ms;
      }
    }
  `

  static define() {
    CVDialog.define()
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    syncOpenBottomSheetRegistry(this, this.open)
  }

  override disconnectedCallback(): void {
    syncOpenBottomSheetRegistry(this, false)
    this.resetSheetDragState()
    super.disconnectedCallback()
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties)

    if (changedProperties.has('open')) {
      syncOpenBottomSheetRegistry(this, this.open)
    }
  }

  private getDialogElement(): HTMLElement | null {
    return this.shadowRoot?.querySelector('cv-dialog') as HTMLElement | null
  }

  private getEnabledDetents(): CVBottomSheetDetent[] {
    const values = (this.detents ?? '').split(/[,\s]+/).filter(Boolean)
    const seen = new Set<CVBottomSheetDetent>()
    const enabled: CVBottomSheetDetent[] = []

    for (const value of values) {
      if (!this.isDetent(value) || seen.has(value)) continue
      seen.add(value)
      enabled.push(value)
    }

    return DETENT_ORDER.filter((detent) => seen.has(detent))
  }

  private hasDetents(): boolean {
    return this.getEnabledDetents().length > 0
  }

  private isDetent(value: string): value is CVBottomSheetDetent {
    return value === 'collapsed' || value === 'middle' || value === 'expanded'
  }

  private getResolvedDetent(): CVBottomSheetDetent {
    const enabled = this.getEnabledDetents()
    if (enabled.includes(this.detent)) return this.detent
    return enabled[0] ?? 'expanded'
  }

  private getResolvedDetentIndex(): number {
    return this.getEnabledDetents().indexOf(this.getResolvedDetent())
  }

  private canDragAboveStartDetent(): boolean {
    const enabled = this.getEnabledDetents()
    const index = enabled.indexOf(this.dragStartDetent)

    return index >= 0 && index < enabled.length - 1
  }

  private resetSheetDragState(): void {
    this.dragPointerId = null
    this.dragStartY = 0
    this.dragStartedAt = 0
    this.dragStartDetent = this.getResolvedDetent()
    this.dragMoved = false

    const dialog = this.getDialogElement()
    dialog?.classList.remove('is-dragging')
    dialog?.style.removeProperty('--_cv-bottom-sheet-drag-offset')
  }

  private setSheetDragOffset(offset: number, allowNegative = false): void {
    const safeOffset = allowNegative ? offset : Math.max(0, offset)
    this.getDialogElement()?.style.setProperty(
      '--_cv-bottom-sheet-drag-offset',
      `${Math.round(safeOffset)}px`,
    )
  }

  private createEventDetail(open: boolean): CVBottomSheetEventDetail {
    if (!this.hasDetents()) {
      return {open}
    }

    return {
      open,
      detent: this.getResolvedDetent(),
    }
  }

  private dispatchInput(detail: CVBottomSheetEventDetail): void {
    this.dispatchEvent(new CustomEvent('cv-input', {detail, bubbles: true, composed: true}))
  }

  private dispatchChange(detail: CVBottomSheetEventDetail): void {
    this.dispatchEvent(new CustomEvent('cv-change', {detail, bubbles: true, composed: true}))
  }

  private commitUserClose(): void {
    if (!this.open) return

    const detail = this.createEventDetail(false)
    this.open = false
    this.dispatchInput(detail)
    this.dispatchChange(detail)
  }

  private commitUserDetent(detent: CVBottomSheetDetent): void {
    if (!this.open || !this.hasDetents() || detent === this.getResolvedDetent()) return

    this.detent = detent
    const detail = this.createEventDetail(true)
    this.dispatchInput(detail)
    this.dispatchChange(detail)
  }

  private commitDragClose(): void {
    const dialog = this.getDialogElement()
    this.dragPointerId = null
    dialog?.classList.remove('is-dragging')
    this.commitUserClose()
  }

  private handleDialogInput(event: CustomEvent<CVBottomSheetEventDetail>): void {
    if (event.target !== event.currentTarget) return
    if (typeof event.detail.open !== 'boolean') return
    event.stopPropagation()
    this.open = event.detail.open
    this.dispatchInput(this.createEventDetail(this.open))
  }

  private handleDialogChange(event: CustomEvent<CVBottomSheetEventDetail>): void {
    if (event.target !== event.currentTarget) return
    if (typeof event.detail.open !== 'boolean') return
    event.stopPropagation()
    this.open = event.detail.open
    this.dispatchChange(this.createEventDetail(this.open))
  }

  private handleDragPointerDown(event: PointerEvent): void {
    if (!this.open) return
    if (!this.dragToClose && !this.hasDetents()) return
    if (typeof event.button === 'number' && event.button !== 0) return

    this.dragPointerId = event.pointerId
    this.dragStartY = event.clientY
    this.dragStartedAt = performance.now()
    this.dragStartDetent = this.getResolvedDetent()
    this.dragMoved = false
    this.setSheetDragOffset(0, this.hasDetents())
    this.getDialogElement()?.classList.add('is-dragging')
    const handle = event.currentTarget as HTMLElement | null
    handle?.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  private handleDragPointerMove(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return

    const offset = event.clientY - this.dragStartY
    this.dragMoved ||= Math.abs(offset) > 4
    this.setSheetDragOffset(offset, this.canDragAboveStartDetent())
    if (offset !== 0) {
      event.preventDefault()
    }
  }

  private getNextDetentForDrag(offset: number, velocity: number): CVBottomSheetDetent | null {
    const enabled = this.getEnabledDetents()
    const index = enabled.indexOf(this.dragStartDetent)
    if (index < 0) return this.getResolvedDetent()

    const shouldExpand = offset <= -DRAG_DETENT_DISTANCE_PX || velocity <= -DRAG_DETENT_VELOCITY_PX_PER_MS
    if (shouldExpand) {
      return enabled[Math.min(index + 1, enabled.length - 1)] ?? this.dragStartDetent
    }

    const shouldCollapse = offset >= DRAG_DETENT_DISTANCE_PX || velocity >= DRAG_DETENT_VELOCITY_PX_PER_MS
    if (!shouldCollapse) {
      return this.dragStartDetent
    }

    if (index > 0) {
      return enabled[index - 1] ?? this.dragStartDetent
    }

    return null
  }

  private handleDragPointerUp(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return

    const handle = event.currentTarget as HTMLElement | null
    handle?.releasePointerCapture?.(event.pointerId)
    const elapsed = Math.max(1, performance.now() - this.dragStartedAt)
    const offset = event.clientY - this.dragStartY
    const velocity = offset / elapsed
    this.suppressNextHandleClick = this.dragMoved

    if (this.hasDetents()) {
      const nextDetent = this.getNextDetentForDrag(offset, velocity)

      if (nextDetent === null && this.dragToClose) {
        this.commitDragClose()
        return
      }

      this.resetSheetDragState()
      if (nextDetent) {
        this.commitUserDetent(nextDetent)
      }
      return
    }

    const dismissOffset = Math.max(0, offset)
    const dismissVelocity = dismissOffset / elapsed
    if (dismissOffset >= DRAG_DISMISS_DISTANCE_PX || dismissVelocity >= DRAG_DISMISS_VELOCITY_PX_PER_MS) {
      this.commitDragClose()
      return
    }

    this.resetSheetDragState()
  }

  private handleDragPointerCancel(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return
    const handle = event.currentTarget as HTMLElement | null
    handle?.releasePointerCapture?.(event.pointerId)
    this.resetSheetDragState()
  }

  private handleHandleClick(event: Event): void {
    if (this.suppressNextHandleClick) {
      this.suppressNextHandleClick = false
      return
    }
    if (!this.hasDetents()) return

    const enabled = this.getEnabledDetents()
    const index = this.getResolvedDetentIndex()
    const next = enabled[index + 1]
    if (!next) return

    event.preventDefault()
    this.commitUserDetent(next)
  }

  private handleDialogAfterHide(): void {
    this.resetSheetDragState()
  }

  private hasFooterSlotContent(): boolean {
    return Array.from(this.children ?? []).some((child) => child.getAttribute('slot') === 'footer')
  }

  private handleFooterSlotChange(): void {
    this.requestUpdate()
  }

  protected override render() {
    const hasDetents = this.hasDetents()
    const hasFooter = this.hasFooterSlotContent()
    const dialogClass = [
      'sheet-dialog',
      hasDetents ? 'has-detents' : '',
      hasDetents ? `detent-${this.getResolvedDetent()}` : '',
      hasFooter ? 'has-footer' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <cv-dialog
        class=${dialogClass}
        exportparts="overlay, content, header, title, description, header-close, body, footer"
        .open=${this.open}
        .modal=${this.modal}
        .type=${this.type}
        .closeOnEscape=${this.closeOnEscape}
        .closeOnOutsidePointer=${this.closeOnOutsidePointer}
        .closeOnOutsideFocus=${this.closeOnOutsideFocus}
        .initialFocusId=${this.initialFocusId}
        .preventInitialTextFocus=${true}
        .noHeader=${this.noHeader}
        .closable=${this.closable}
        @cv-input=${this.handleDialogInput}
        @cv-change=${this.handleDialogChange}
        @cv-after-hide=${this.handleDialogAfterHide}
      >
        <slot name="title" slot="title"></slot>
        <slot name="description" slot="description"></slot>
        <slot name="header-close" slot="header-close"
          ><svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          >
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" /></svg
        ></slot>
        ${
          this.showHandle
            ? html`
                <button
                  slot="before-header"
                  class="sheet-handle"
                  part="handle"
                  type="button"
                  aria-label=${this.handleLabel}
                  @pointerdown=${this.handleDragPointerDown}
                  @pointermove=${this.handleDragPointerMove}
                  @pointerup=${this.handleDragPointerUp}
                  @pointercancel=${this.handleDragPointerCancel}
                  @click=${this.handleHandleClick}
                >
                  <span class="sheet-grabber" part="grabber"></span>
                </button>
              `
            : null
        }
        <slot></slot>
        <slot name="footer" slot="footer" @slotchange=${this.handleFooterSlotChange}></slot>
      </cv-dialog>
    `
  }
}
