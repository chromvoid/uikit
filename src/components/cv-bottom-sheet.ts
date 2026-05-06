import {css} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVDialog} from './cv-dialog'

export interface CVBottomSheetEventDetail {
  open: boolean
}

const DRAG_DISMISS_DISTANCE_PX = 96
const DRAG_DISMISS_VELOCITY_PX_PER_MS = 0.75
const SHEET_DISMISS_ANIMATION_MS = 180

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
      showHandle: {type: Boolean, attribute: 'show-handle', reflect: true},
      dragToClose: {type: Boolean, attribute: 'drag-to-close', reflect: true},
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
  declare showHandle: boolean
  declare dragToClose: boolean

  private dragPointerId: number | null = null
  private dragStartY = 0
  private dragStartedAt = 0
  private dismissAnimationTimer: number | null = null

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
    this.showHandle = true
    this.dragToClose = true
  }

  static styles = css`
    :host {
      display: contents;
    }

    cv-dialog {
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
    }

    cv-dialog::part(trigger) {
      display: none;
    }

    cv-dialog::part(overlay) {
      place-items: end center;
      padding-block-start: max(var(--cv-bottom-sheet-safe-top, 16px), env(safe-area-inset-top, 0px));
      padding-block-end: var(--cv-bottom-sheet-safe-bottom, env(safe-area-inset-bottom, 0px));
      padding-inline: var(--cv-bottom-sheet-inline-inset, 0px);
    }

    cv-dialog::part(content) {
      inline-size: var(--cv-bottom-sheet-width, 100%);
      max-inline-size: var(--cv-bottom-sheet-max-width, 100%);
      max-block-size: var(--cv-bottom-sheet-max-height, min(82dvh, calc(100dvh - 32px)));
      gap: 0;
      overflow: hidden;
      padding: 0;
      border-block-end: 0;
      border-radius: var(
        --cv-bottom-sheet-border-radius,
        var(--cv-radius-lg, 14px) var(--cv-radius-lg, 14px) 0 0
      );
      transform: translateY(var(--cv-bottom-sheet-drag-offset, 0));
      transition: transform var(--cv-bottom-sheet-dismiss-duration, 180ms) var(--cv-easing-standard, ease);
      will-change: transform;
    }

    cv-dialog.is-dragging::part(content) {
      transition: none;
    }

    cv-dialog.is-dismissing::part(content) {
      transform: translateY(calc(100% + 32px));
    }

    cv-dialog::part(body) {
      min-block-size: 0;
      overflow: auto;
      padding: 0;
    }

    .sheet-handle {
      inline-size: 100%;
      min-block-size: var(--cv-bottom-sheet-handle-block-size, 32px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding-block: var(--cv-bottom-sheet-handle-padding-block, 12px 8px);
      cursor: grab;
      touch-action: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
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
      cv-dialog::part(content) {
        transition-duration: 0ms;
      }
    }
  `

  static define() {
    CVDialog.define()
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override disconnectedCallback(): void {
    this.clearDismissAnimationTimer()
    this.resetSheetDragState()
    super.disconnectedCallback()
  }

  private getDialogElement(): HTMLElement | null {
    return this.shadowRoot?.querySelector('cv-dialog') as HTMLElement | null
  }

  private clearDismissAnimationTimer(): void {
    if (this.dismissAnimationTimer === null) return
    window.clearTimeout(this.dismissAnimationTimer)
    this.dismissAnimationTimer = null
  }

  private resetSheetDragState(): void {
    this.dragPointerId = null
    this.dragStartY = 0
    this.dragStartedAt = 0

    const dialog = this.getDialogElement()
    dialog?.classList.remove('is-dragging', 'is-dismissing')
    dialog?.style.removeProperty('--cv-bottom-sheet-drag-offset')
  }

  private setSheetDragOffset(offset: number): void {
    const safeOffset = Math.max(0, offset)
    this.getDialogElement()?.style.setProperty('--cv-bottom-sheet-drag-offset', `${Math.round(safeOffset)}px`)
  }

  private dispatchInput(detail: CVBottomSheetEventDetail): void {
    this.dispatchEvent(new CustomEvent('cv-input', {detail, bubbles: true, composed: true}))
  }

  private dispatchChange(detail: CVBottomSheetEventDetail): void {
    this.dispatchEvent(new CustomEvent('cv-change', {detail, bubbles: true, composed: true}))
  }

  private commitUserClose(): void {
    if (!this.open) return

    const detail = {open: false}
    this.open = false
    this.dispatchInput(detail)
    this.dispatchChange(detail)
  }

  private animateSheetDismiss(): void {
    if (this.dismissAnimationTimer !== null) return

    const dialog = this.getDialogElement()
    if (!dialog) {
      this.commitUserClose()
      return
    }

    this.dragPointerId = null
    dialog.classList.remove('is-dragging')
    dialog.style.removeProperty('--cv-bottom-sheet-drag-offset')
    dialog.classList.add('is-dismissing')
    this.dismissAnimationTimer = window.setTimeout(() => {
      this.dismissAnimationTimer = null
      this.commitUserClose()
    }, SHEET_DISMISS_ANIMATION_MS)
  }

  private handleDialogChange(event: CustomEvent<CVBottomSheetEventDetail>): void {
    if (typeof event.detail.open !== 'boolean') return
    this.open = event.detail.open
  }

  private handleDragPointerDown(event: PointerEvent): void {
    if (!this.dragToClose) return
    if (this.dismissAnimationTimer !== null) return
    if (typeof event.button === 'number' && event.button !== 0) return

    this.dragPointerId = event.pointerId
    this.dragStartY = event.clientY
    this.dragStartedAt = performance.now()
    this.setSheetDragOffset(0)
    this.getDialogElement()?.classList.add('is-dragging')
    const handle = event.currentTarget as HTMLElement | null
    handle?.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  private handleDragPointerMove(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return

    const offset = Math.max(0, event.clientY - this.dragStartY)
    this.setSheetDragOffset(offset)
    if (offset > 0) {
      event.preventDefault()
    }
  }

  private handleDragPointerUp(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return

    const handle = event.currentTarget as HTMLElement | null
    handle?.releasePointerCapture?.(event.pointerId)
    const elapsed = Math.max(1, performance.now() - this.dragStartedAt)
    const offset = Math.max(0, event.clientY - this.dragStartY)
    const velocity = offset / elapsed

    if (offset >= DRAG_DISMISS_DISTANCE_PX || velocity >= DRAG_DISMISS_VELOCITY_PX_PER_MS) {
      this.animateSheetDismiss()
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

  protected override render() {
    return html`
      <cv-dialog
        class="sheet-dialog"
        exportparts="trigger, overlay, content, header, title, description, header-close, body, footer"
        .open=${this.open}
        .modal=${this.modal}
        .type=${this.type}
        .closeOnEscape=${this.closeOnEscape}
        .closeOnOutsidePointer=${this.closeOnOutsidePointer}
        .closeOnOutsideFocus=${this.closeOnOutsideFocus}
        .initialFocusId=${this.initialFocusId}
        .noHeader=${this.noHeader}
        @cv-change=${this.handleDialogChange}
      >
        <slot name="title" slot="title"></slot>
        <slot name="description" slot="description"></slot>
        <slot name="header-close" slot="header-close"></slot>
        ${
          this.showHandle
            ? html`
                <div
                  class="sheet-handle"
                  part="handle"
                  aria-hidden="true"
                  @pointerdown=${this.handleDragPointerDown}
                  @pointermove=${this.handleDragPointerMove}
                  @pointerup=${this.handleDragPointerUp}
                  @pointercancel=${this.handleDragPointerCancel}
                >
                  <span class="sheet-grabber" part="grabber"></span>
                </div>
              `
            : null
        }
        <slot></slot>
        <slot name="footer" slot="footer"></slot>
      </cv-dialog>
    `
  }
}
