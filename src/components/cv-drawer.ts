import {createDrawer, type DrawerModel} from '@chromvoid/headless-ui/drawer'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {acquireBodyScrollLock, releaseBodyScrollLock} from './scroll-lock.js'

export interface CVDrawerEventDetail {
  open: boolean
}

let cvDrawerNonce = 0

function getIdSelector(id: string): string {
  return `[id="${id.replace(/["\\]/g, '\\$&')}"]`
}

const DRAG_CLOSE_DISTANCE_PX = 96
const DRAG_CLOSE_VELOCITY_PX_PER_MS = 0.75
const DRAG_SCROLL_DOMINANCE_PX = 18
const DRAG_MOVE_EPSILON_PX = 4

export class CVDrawer extends ReatomLitElement {
  static elementName = 'cv-drawer'

  static get properties() {
    return {
      open: {type: Boolean, reflect: true},
      modal: {type: Boolean, reflect: true},
      placement: {type: String, reflect: true},
      type: {type: String, reflect: true},
      closeOnEscape: {type: Boolean, attribute: 'close-on-escape', reflect: true},
      closeOnOutsidePointer: {type: Boolean, attribute: 'close-on-outside-pointer', reflect: true},
      closeOnOutsideFocus: {type: Boolean, attribute: 'close-on-outside-focus', reflect: true},
      initialFocusId: {type: String, attribute: 'initial-focus-id'},
      noHeader: {type: Boolean, attribute: 'no-header', reflect: true},
      dragToClose: {type: Boolean, attribute: 'drag-to-close', reflect: true},
    }
  }

  declare open: boolean
  declare modal: boolean
  declare placement: 'start' | 'end' | 'top' | 'bottom'
  declare type: 'dialog' | 'alertdialog'
  declare closeOnEscape: boolean
  declare closeOnOutsidePointer: boolean
  declare closeOnOutsideFocus: boolean
  declare initialFocusId: string
  declare noHeader: boolean
  declare dragToClose: boolean

  private readonly idBase = `cv-drawer-${++cvDrawerNonce}`
  private model: DrawerModel
  private lockScrollApplied = false
  private suppressLifecycleFromUpdate = false
  private lifecycleToken = 0
  private overlayVisible = false
  private renderState: 'open' | 'closed' = 'closed'
  private openAnimationFrame = 0
  private closeAnimationTimeout = 0
  private shouldAnimatePresence = false
  private dragPointerId: number | null = null
  private dragStartX = 0
  private dragStartY = 0
  private dragStartedAt = 0
  private dragMoved = false
  private overlayPointerDownOnSelf = false

  constructor() {
    super()
    this.open = false
    this.modal = true
    this.placement = 'end'
    this.type = 'dialog'
    this.closeOnEscape = true
    this.closeOnOutsidePointer = true
    this.closeOnOutsideFocus = true
    this.initialFocusId = ''
    this.noHeader = false
    this.dragToClose = false
    this.model = this.createModel()
    this.overlayVisible = this.open
    this.renderState = this.open ? 'open' : 'closed'
  }

  static styles = [
    css`
      :host {
        display: inline-block;
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
        cursor: pointer;
      }

      [part='trigger']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      [part='overlay'] {
        position: fixed;
        inset: 0;
        z-index: var(--cv-drawer-z-index, 40);
        display: flex;
        overflow: clip;
        contain: paint;
        background: var(--cv-drawer-overlay-color, var(--cv-color-overlay));
        opacity: var(--cv-drawer-overlay-closed-opacity, 1);
        transition:
          opacity var(--cv-drawer-overlay-transition-duration, 0ms) ease,
          display var(--cv-drawer-overlay-transition-duration, 0ms) allow-discrete;
        transition-behavior: allow-discrete;
      }

      [part='overlay'][hidden] {
        display: none;
      }

      [part='overlay'][data-state='open'] {
        opacity: 1;
      }

      [part='overlay'][data-dragging='true'] {
        opacity: var(--cv-drawer-drag-overlay-opacity, 1);
        transition: none;
      }

      [part='panel'] {
        --cv-drawer-drag-offset-x: 0px;
        --cv-drawer-drag-offset-y: 0px;
        position: fixed;
        overflow: auto;
        display: grid;
        grid-template-rows: auto 1fr auto;
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface-elevated, #1d2432);
        color: var(--cv-color-text, #e8ecf6);
        opacity: 0;
        will-change: transform, opacity;
        transition:
          transform var(--cv-drawer-transition-duration, 250ms) ease,
          opacity var(--cv-drawer-transition-duration, 250ms) ease;
        transition-behavior: allow-discrete;
      }

      [part='panel']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      /* Placement: start (inline-start edge) */
      [part='panel'][data-placement='start'] {
        inset-block: 0;
        inset-inline-start: 0;
        inline-size: var(--cv-drawer-size, 360px);
        max-inline-size: var(--cv-drawer-max-size, calc(100dvh - 32px));
        border-radius: 0 var(--cv-drawer-border-radius, var(--cv-radius-lg, 14px))
          var(--cv-drawer-border-radius, var(--cv-radius-lg, 14px)) 0;
        transform: translate3d(-100%, 0, 0);
        touch-action: pan-y;
      }

      /* Placement: end (inline-end edge) */
      [part='panel'][data-placement='end'] {
        inset-block: 0;
        inset-inline-end: 0;
        inline-size: var(--cv-drawer-size, 360px);
        max-inline-size: var(--cv-drawer-max-size, calc(100dvh - 32px));
        border-radius: var(--cv-drawer-border-radius, var(--cv-radius-lg, 14px)) 0 0
          var(--cv-drawer-border-radius, var(--cv-radius-lg, 14px));
        transform: translate3d(100%, 0, 0);
        touch-action: pan-y;
      }

      /* Placement: top */
      [part='panel'][data-placement='top'] {
        inset-inline: 0;
        inset-block-start: 0;
        block-size: var(--cv-drawer-size, 360px);
        max-block-size: var(--cv-drawer-max-size, calc(100dvh - 32px));
        border-radius: 0 0 var(--cv-drawer-border-radius, var(--cv-radius-lg, 14px))
          var(--cv-drawer-border-radius, var(--cv-radius-lg, 14px));
        transform: translate3d(0, -100%, 0);
        touch-action: pan-x;
      }

      /* Placement: bottom */
      [part='panel'][data-placement='bottom'] {
        inset-inline: 0;
        inset-block-end: 0;
        block-size: var(--cv-drawer-size, 360px);
        max-block-size: var(--cv-drawer-max-size, calc(100dvh - 32px));
        border-radius: var(--cv-drawer-border-radius, var(--cv-radius-lg, 14px))
          var(--cv-drawer-border-radius, var(--cv-radius-lg, 14px)) 0 0;
        transform: translate3d(0, 100%, 0);
        touch-action: pan-x;
      }

      [part='panel'][data-state='open'] {
        opacity: 1;
      }

      [part='panel'][data-placement='start'][data-state='open'],
      [part='panel'][data-placement='end'][data-state='open'] {
        transform: translate3d(var(--cv-drawer-drag-offset-x, 0px), 0, 0);
      }

      [part='panel'][data-placement='top'][data-state='open'],
      [part='panel'][data-placement='bottom'][data-state='open'] {
        transform: translate3d(0, var(--cv-drawer-drag-offset-y, 0px), 0);
      }

      [part='panel'][data-dragging='true'] {
        transition: none;
      }

      @media (prefers-reduced-motion: reduce) {
        [part='overlay'],
        [part='panel'] {
          transition-duration: 0ms;
        }
      }

      [part='header'] {
        display: grid;
        gap: var(--cv-space-1, 4px);
        padding: var(--cv-drawer-header-spacing, var(--cv-space-4, 16px));
      }

      [part='title'] {
        margin: 0;
        font-size: 1.05rem;
      }

      [part='description'] {
        margin: 0;
        color: var(--cv-color-text-muted, #9aa6bf);
      }

      [part='header-close'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-block-size: 28px;
        min-inline-size: 28px;
        padding: 0;
        border-radius: var(--cv-radius-sm, 6px);
        border: none;
        background: transparent;
        color: var(--cv-color-text-muted, #9aa6bf);
        cursor: pointer;
      }

      [part='header-close']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      [part='body'] {
        padding: var(--cv-drawer-body-spacing, var(--cv-space-4, 16px));
        overflow: auto;
      }

      [part='footer'] {
        display: flex;
        gap: var(--cv-space-2, 8px);
        justify-content: flex-end;
        padding: var(--cv-drawer-footer-spacing, var(--cv-space-4, 16px));
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
    this.syncOutsideFocusListener()
    this.syncScrollLock()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.syncOutsideFocusListener(true)
    this.releaseScrollLock()
    this.clearAnimationQueue()
    this.resetDragState()
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)
    this.shouldAnimatePresence = false

    if (
      changedProperties.has('modal') ||
      changedProperties.has('type') ||
      changedProperties.has('closeOnEscape') ||
      changedProperties.has('closeOnOutsidePointer') ||
      changedProperties.has('closeOnOutsideFocus') ||
      changedProperties.has('initialFocusId') ||
      changedProperties.has('placement')
    ) {
      const wasOpen = this.model.state.isOpen()
      this.model = this.createModel(wasOpen)
    }

    if (changedProperties.has('open') && this.model.state.isOpen() !== this.open) {
      if (this.open) {
        this.model.actions.open()
      } else {
        this.model.actions.close()
      }
    }

    if (changedProperties.has('open')) {
      this.clearAnimationQueue()

      if (this.open) {
        this.overlayVisible = true
        this.renderState = this.hasUpdated ? 'closed' : 'open'
      } else {
        this.renderState = 'closed'
        if (!this.hasUpdated) {
          this.overlayVisible = false
        }
      }

      this.shouldAnimatePresence = this.hasUpdated
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    this.syncOutsideFocusListener()
    this.syncScrollLock()

    if (changedProperties.has('open')) {
      this.syncRenderedState()

      if (this.suppressLifecycleFromUpdate) {
        this.suppressLifecycleFromUpdate = false
      } else if (changedProperties.get('open') !== this.open) {
        this.dispatchLifecycleTransition(this.open)
      }

      if (this.shouldAnimatePresence) {
        if (this.open) {
          this.startOpenAnimation()
        } else {
          this.startCloseAnimation()
        }
      }
      this.shouldAnimatePresence = false

      if (this.open) {
        this.focusInitialTarget()
      }
    }
  }

  private clearAnimationQueue(): void {
    if (this.openAnimationFrame) {
      cancelAnimationFrame(this.openAnimationFrame)
      this.openAnimationFrame = 0
    }

    if (this.closeAnimationTimeout) {
      window.clearTimeout(this.closeAnimationTimeout)
      this.closeAnimationTimeout = 0
    }
  }

  private startOpenAnimation(): void {
    this.resetDragState()
    this.openAnimationFrame = requestAnimationFrame(() => {
      this.openAnimationFrame = 0

      if (!this.open) return

      this.renderState = 'open'
      this.syncRenderedState()
    })
  }

  private startCloseAnimation(): void {
    const duration = this.getTransitionDuration()

    if (duration === 0) {
      this.overlayVisible = false
      this.resetDragState()
      this.syncRenderedState()
      return
    }

    this.closeAnimationTimeout = window.setTimeout(() => {
      this.closeAnimationTimeout = 0

      if (this.open) return

      this.overlayVisible = false
      this.resetDragState()
      this.syncRenderedState()
    }, duration)
  }

  private syncRenderedState(): void {
    const overlay = this.shadowRoot?.querySelector('[part="overlay"]') as HTMLElement | null
    const panel = this.shadowRoot?.querySelector('[part="panel"]') as HTMLElement | null

    if (overlay) {
      overlay.hidden = !this.overlayVisible
      overlay.dataset['state'] = this.renderState
    }

    if (panel) {
      panel.dataset['state'] = this.renderState
    }
  }

  private getTransitionDuration(): number {
    const overlay = this.shadowRoot?.querySelector('[part="overlay"]') as HTMLElement | null
    const panel = this.shadowRoot?.querySelector('[part="panel"]') as HTMLElement | null

    return Math.max(this.readTransitionDuration(overlay), this.readTransitionDuration(panel))
  }

  private readTransitionDuration(element: HTMLElement | null): number {
    if (!element) return 0

    const styles = getComputedStyle(element)
    const durations = this.parseTimeValues(styles.transitionDuration)
    const delays = this.parseTimeValues(styles.transitionDelay)
    const transitionCount = Math.max(durations.length, delays.length)
    let maxDuration = 0

    for (let index = 0; index < transitionCount; index += 1) {
      const duration = durations[index] ?? durations[durations.length - 1] ?? 0
      const delay = delays[index] ?? delays[delays.length - 1] ?? 0
      maxDuration = Math.max(maxDuration, duration + delay)
    }

    return maxDuration
  }

  private parseTimeValues(value: string): number[] {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        if (entry.endsWith('ms')) return Number.parseFloat(entry)
        if (entry.endsWith('s')) return Number.parseFloat(entry) * 1000
        return Number.parseFloat(entry) || 0
      })
  }

  private createModel(initialOpen = this.open): DrawerModel {
    return createDrawer({
      idBase: this.idBase,
      initialOpen,
      isModal: this.modal,
      type: this.type,
      placement: this.placement,
      closeOnEscape: this.closeOnEscape,
      closeOnOutsidePointer: this.closeOnOutsidePointer,
      closeOnOutsideFocus: this.closeOnOutsideFocus,
      initialFocusId: this.initialFocusId || undefined,
    })
  }

  private captureState() {
    return {
      open: this.model.state.isOpen(),
      restoreTargetId: this.model.state.restoreTargetId(),
    }
  }

  private dispatchInput(detail: CVDrawerEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(detail: CVDrawerEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchLifecycleEvent(name: string): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchLifecycleTransition(open: boolean): void {
    const token = ++this.lifecycleToken

    this.dispatchLifecycleEvent(open ? 'cv-show' : 'cv-hide')

    this.updateComplete.then(() => {
      if (this.lifecycleToken !== token) return
      this.dispatchLifecycleEvent(open ? 'cv-after-show' : 'cv-after-hide')
    })
  }

  private applyInteractionResult(previous: {open: boolean; restoreTargetId: string | null}): void {
    const nextOpen = this.model.state.isOpen()

    if (previous.open !== nextOpen) {
      const detail = {open: nextOpen}
      this.suppressLifecycleFromUpdate = true
      this.open = nextOpen

      this.dispatchLifecycleTransition(nextOpen)
      this.dispatchInput(detail)
      this.dispatchChange(detail)
    } else {
      this.open = nextOpen
    }

    const restoreTargetId = this.model.state.restoreTargetId()
    if (restoreTargetId && previous.restoreTargetId !== restoreTargetId) {
      const trigger = this.shadowRoot?.querySelector(getIdSelector(restoreTargetId)) as HTMLElement | null
      trigger?.focus()
    }
  }

  private syncOutsideFocusListener(forceOff = false): void {
    const shouldListen = !forceOff && this.open
    if (shouldListen) {
      document.addEventListener('focusin', this.handleDocumentFocusIn)
    } else {
      document.removeEventListener('focusin', this.handleDocumentFocusIn)
    }
  }

  private syncScrollLock(): void {
    if (!this.model.state.shouldLockScroll()) {
      this.releaseScrollLock()
      return
    }

    if (this.lockScrollApplied) return

    acquireBodyScrollLock()
    this.lockScrollApplied = true
  }

  private releaseScrollLock(): void {
    if (!this.lockScrollApplied) return

    releaseBodyScrollLock()
    this.lockScrollApplied = false
  }

  private getDragElements(): {panel: HTMLElement | null; overlay: HTMLElement | null} {
    return {
      panel: this.shadowRoot?.querySelector('[part="panel"]') as HTMLElement | null,
      overlay: this.shadowRoot?.querySelector('[part="overlay"]') as HTMLElement | null,
    }
  }

  private resetDragState(): void {
    this.dragPointerId = null
    this.dragStartX = 0
    this.dragStartY = 0
    this.dragStartedAt = 0
    this.dragMoved = false

    const {panel, overlay} = this.getDragElements()
    panel?.removeAttribute('data-dragging')
    panel?.style.removeProperty('--cv-drawer-drag-offset-x')
    panel?.style.removeProperty('--cv-drawer-drag-offset-y')
    overlay?.removeAttribute('data-dragging')
    overlay?.style.removeProperty('--cv-drawer-drag-overlay-opacity')
  }

  private finishDragInteraction(): void {
    this.dragPointerId = null
    this.dragStartedAt = 0
    this.dragMoved = false

    const {panel, overlay} = this.getDragElements()
    panel?.removeAttribute('data-dragging')
    overlay?.removeAttribute('data-dragging')
  }

  private isHorizontalPlacement(): boolean {
    return this.placement === 'start' || this.placement === 'end'
  }

  private getClosingDistance(event: PointerEvent): number {
    switch (this.placement) {
      case 'start':
        return this.dragStartX - event.clientX
      case 'end':
        return event.clientX - this.dragStartX
      case 'top':
        return this.dragStartY - event.clientY
      case 'bottom':
        return event.clientY - this.dragStartY
      default:
        return 0
    }
  }

  private getVisualDragOffset(closingDistance: number): number {
    const offset = Math.max(0, closingDistance)
    return this.placement === 'start' || this.placement === 'top' ? -offset : offset
  }

  private getPanelDragSize(panel: HTMLElement | null): number {
    if (!panel) return DRAG_CLOSE_DISTANCE_PX

    const rect = panel.getBoundingClientRect()
    const size = this.isHorizontalPlacement() ? rect.width : rect.height
    return Math.max(size, DRAG_CLOSE_DISTANCE_PX)
  }

  private shouldCancelDragForScroll(event: PointerEvent): boolean {
    if (this.dragMoved) return false

    const mainDelta = this.isHorizontalPlacement()
      ? Math.abs(event.clientX - this.dragStartX)
      : Math.abs(event.clientY - this.dragStartY)
    const crossDelta = this.isHorizontalPlacement()
      ? Math.abs(event.clientY - this.dragStartY)
      : Math.abs(event.clientX - this.dragStartX)

    return crossDelta > DRAG_SCROLL_DOMINANCE_PX && crossDelta > mainDelta
  }

  private setDragOffset(closingDistance: number): void {
    const {panel, overlay} = this.getDragElements()
    const visualOffset = this.getVisualDragOffset(closingDistance)
    const panelSize = this.getPanelDragSize(panel)
    const progress = Math.min(Math.max(Math.max(0, closingDistance) / panelSize, 0), 1)
    const overlayOpacity = Math.max(0.55, 1 - progress * 0.45)

    if (this.isHorizontalPlacement()) {
      panel?.style.setProperty('--cv-drawer-drag-offset-x', `${Math.round(visualOffset)}px`)
      panel?.style.setProperty('--cv-drawer-drag-offset-y', '0px')
    } else {
      panel?.style.setProperty('--cv-drawer-drag-offset-x', '0px')
      panel?.style.setProperty('--cv-drawer-drag-offset-y', `${Math.round(visualOffset)}px`)
    }

    overlay?.style.setProperty('--cv-drawer-drag-overlay-opacity', String(overlayOpacity))
  }

  private commitDragClose(): void {
    if (!this.open) return

    const previous = this.captureState()
    this.model.actions.close()
    this.applyInteractionResult(previous)
  }

  private trySetPointerCapture(target: HTMLElement | null, pointerId: number): void {
    try {
      target?.setPointerCapture?.(pointerId)
    } catch {
      // Synthetic PointerEvents used by browser tests do not always register an active pointer.
    }
  }

  private tryReleasePointerCapture(target: HTMLElement | null, pointerId: number): void {
    try {
      target?.releasePointerCapture?.(pointerId)
    } catch {
      // Release is best-effort because the pointer may already be cancelled or synthetic.
    }
  }

  private focusInitialTarget(): void {
    const panelProps = this.model.contracts.getPanelProps()
    const requestedId = panelProps['data-initial-focus']

    if (requestedId) {
      const selector = getIdSelector(requestedId)
      const explicit =
        (this.querySelector(selector) as HTMLElement | null) ??
        (this.shadowRoot?.querySelector(selector) as HTMLElement | null)
      if (explicit) {
        explicit.focus()
        return
      }
    }

    const panel = this.shadowRoot?.querySelector('[part="panel"]') as HTMLElement | null
    panel?.focus()
  }

  private handleDocumentFocusIn = (event: FocusEvent) => {
    if (!this.open) return

    const path = event.composedPath()
    if (path.includes(this)) return

    const previous = this.captureState()
    this.model.actions.handleOutsideFocus()
    this.applyInteractionResult(previous)
  }

  private handleTriggerClick() {
    const previous = this.captureState()
    this.model.contracts.getTriggerProps().onClick()
    this.applyInteractionResult(previous)
  }

  private handleTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
    }

    const previous = this.captureState()
    this.model.contracts.getTriggerProps().onKeyDown({key: event.key})
    this.applyInteractionResult(previous)
  }

  private handleOverlayPointerDown(event: MouseEvent) {
    // Remember whether the pointer sequence started on the overlay itself.
    // A drag that begins inside the panel and is released over the overlay
    // must not dismiss the drawer.
    this.overlayPointerDownOnSelf = event.target === event.currentTarget
  }

  private handleOverlayClick(event: MouseEvent) {
    const startedOnSelf = this.overlayPointerDownOnSelf
    this.overlayPointerDownOnSelf = false

    if (event.target !== event.currentTarget) return
    if (!startedOnSelf) return
    if (!this.open) return

    const previous = this.captureState()
    this.model.contracts.getOverlayProps().onPointerDownOutside()
    this.applyInteractionResult(previous)
  }

  private handlePanelKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Respect a nested widget that already handled Escape, and never
      // preventDefault when Escape-to-close is disabled.
      if (event.defaultPrevented || !this.closeOnEscape) return
      event.preventDefault()
    }

    const previous = this.captureState()
    this.model.contracts.getPanelProps().onKeyDown({key: event.key})
    this.applyInteractionResult(previous)
  }

  private handleHeaderCloseClick() {
    const previous = this.captureState()
    this.model.contracts.getHeaderCloseButtonProps().onClick()
    this.applyInteractionResult(previous)
  }

  private handlePanelPointerDown(event: PointerEvent) {
    if (!this.open || !this.dragToClose) return
    if (event.pointerType !== 'touch') return
    if (event.isPrimary === false) return
    if (typeof event.button === 'number' && event.button !== 0) return

    this.dragPointerId = event.pointerId
    this.dragStartX = event.clientX
    this.dragStartY = event.clientY
    this.dragStartedAt = performance.now()
    this.dragMoved = false
    this.setDragOffset(0)

    const {panel, overlay} = this.getDragElements()
    panel?.setAttribute('data-dragging', 'true')
    overlay?.setAttribute('data-dragging', 'true')

    const target = event.currentTarget as HTMLElement | null
    this.trySetPointerCapture(target, event.pointerId)
  }

  private handlePanelPointerMove(event: PointerEvent) {
    if (this.dragPointerId !== event.pointerId) return

    if (this.shouldCancelDragForScroll(event)) {
      const target = event.currentTarget as HTMLElement | null
      this.tryReleasePointerCapture(target, event.pointerId)
      this.resetDragState()
      return
    }

    const closingDistance = Math.max(0, this.getClosingDistance(event))
    this.dragMoved ||= closingDistance > DRAG_MOVE_EPSILON_PX
    this.setDragOffset(closingDistance)

    if (closingDistance > 0) {
      event.preventDefault()
    }
  }

  private handlePanelPointerUp(event: PointerEvent) {
    if (this.dragPointerId !== event.pointerId) return

    const target = event.currentTarget as HTMLElement | null
    this.tryReleasePointerCapture(target, event.pointerId)

    const elapsed = Math.max(1, performance.now() - this.dragStartedAt)
    const closingDistance = Math.max(0, this.getClosingDistance(event))
    const velocity = closingDistance / elapsed
    const shouldClose = closingDistance >= DRAG_CLOSE_DISTANCE_PX || velocity >= DRAG_CLOSE_VELOCITY_PX_PER_MS

    if (shouldClose) {
      this.finishDragInteraction()
      this.commitDragClose()
      return
    }

    this.resetDragState()
  }

  private handlePanelPointerCancel(event: PointerEvent) {
    if (this.dragPointerId !== event.pointerId) return
    const target = event.currentTarget as HTMLElement | null
    this.tryReleasePointerCapture(target, event.pointerId)
    this.resetDragState()
  }

  protected override render() {
    const triggerProps = this.model.contracts.getTriggerProps()
    const overlayProps = this.model.contracts.getOverlayProps()
    const panelProps = this.model.contracts.getPanelProps()
    const titleProps = this.model.contracts.getTitleProps()
    const descriptionProps = this.model.contracts.getDescriptionProps()
    const headerCloseProps = this.model.contracts.getHeaderCloseButtonProps()

    return html`
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
        <slot name="trigger">Open drawer</slot>
      </button>

      <div
        id=${overlayProps.id}
        data-open=${overlayProps['data-open']}
        data-state=${this.renderState}
        ?hidden=${!this.overlayVisible}
        class="cv-u-discrete-presence"
        part="overlay"
        @mousedown=${this.handleOverlayPointerDown}
        @click=${this.handleOverlayClick}
      >
        <section
          id=${panelProps.id}
          role=${panelProps.role}
          tabindex=${panelProps.tabindex}
          aria-modal=${panelProps['aria-modal']}
          aria-labelledby=${panelProps['aria-labelledby'] ?? nothing}
          aria-describedby=${panelProps['aria-describedby'] ?? nothing}
          data-placement=${panelProps['data-placement']}
          data-state=${this.renderState}
          data-initial-focus=${panelProps['data-initial-focus'] ?? nothing}
          class="cv-u-discrete-presence"
          part="panel"
          @keydown=${this.handlePanelKeyDown}
          @pointerdown=${this.handlePanelPointerDown}
          @pointermove=${this.handlePanelPointerMove}
          @pointerup=${this.handlePanelPointerUp}
          @pointercancel=${this.handlePanelPointerCancel}
        >
          <header part="header" ?hidden=${this.noHeader}>
            <h2 id=${titleProps.id} part="title">
              <slot name="title">Drawer</slot>
            </h2>
            <p id=${descriptionProps.id} part="description">
              <slot name="description"></slot>
            </p>
            <button
              id=${headerCloseProps.id}
              role=${headerCloseProps.role}
              tabindex=${headerCloseProps.tabindex}
              aria-label=${headerCloseProps['aria-label']}
              type="button"
              part="header-close"
              @click=${this.handleHeaderCloseClick}
            >
              <slot name="header-close">&#10005;</slot>
            </button>
          </header>

          <div part="body">
            <slot></slot>
          </div>

          <footer part="footer">
            <slot name="footer"></slot>
          </footer>
        </section>
      </div>
    `
  }
}
