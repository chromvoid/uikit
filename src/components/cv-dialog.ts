import {createDialog, type DialogModel} from '@chromvoid/headless-ui/dialog'
import {css, nothing, type PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {isTextEditableFocusTarget} from './focus-utils'
import {acquireBodyScrollLock, releaseBodyScrollLock} from './scroll-lock.js'

export interface CVDialogEventDetail {
  open: boolean
}

type PopoverHostElement = HTMLElement & {
  showPopover?: () => void
  hidePopover?: () => void
}

type DialogPresenceState = 'closed' | 'opening' | 'open' | 'closing'

let cvDialogNonce = 0
let cvDialogOpenOrderNonce = 0
let topLayerReorderInProgress = false

// Stack of currently-open dialogs in open order. Only the topmost dialog
// reacts to outside-focus dismissal, so opening/closing a stacked dialog does
// not cascade-close the dialogs beneath it.
const openDialogStack: CVDialog[] = []
const openDialogOrder = new WeakMap<CVDialog, number>()

function sortOpenDialogStack(): void {
  openDialogStack.sort((left, right) => {
    const alwaysOnTopOrder = Number(left.alwaysOnTop) - Number(right.alwaysOnTop)
    if (alwaysOnTopOrder !== 0) return alwaysOnTopOrder

    return (openDialogOrder.get(left) ?? 0) - (openDialogOrder.get(right) ?? 0)
  })
}

function getDeepActiveElement(): HTMLElement | null {
  let activeElement = document.activeElement
  while (
    activeElement instanceof HTMLElement &&
    activeElement.shadowRoot?.activeElement instanceof HTMLElement
  ) {
    activeElement = activeElement.shadowRoot.activeElement
  }

  return activeElement instanceof HTMLElement ? activeElement : null
}

function getFocusRestoreTarget(): HTMLElement | null {
  const activeElement = getDeepActiveElement()
  if (!activeElement || activeElement === document.body || activeElement === document.documentElement) {
    return null
  }

  return activeElement
}

function getIdSelector(id: string): string {
  return `[id="${id.replace(/["\\]/g, '\\$&')}"]`
}

function findComposedElementById(root: ParentNode, id: string): HTMLElement | null {
  const direct = root.querySelector?.(getIdSelector(id))
  if (direct instanceof HTMLElement) return direct

  const elements = Array.from(root.querySelectorAll?.('*') ?? [])
  for (const element of elements) {
    if (element.shadowRoot) {
      const shadowMatch = findComposedElementById(element.shadowRoot, id)
      if (shadowMatch) return shadowMatch
    }

    if (typeof HTMLSlotElement === 'undefined' || !(element instanceof HTMLSlotElement)) continue
    for (const assigned of element.assignedElements({flatten: true})) {
      if (assigned.id === id && assigned instanceof HTMLElement) return assigned
      const assignedMatch = findComposedElementById(assigned, id)
      if (assignedMatch) return assignedMatch
      if (assigned.shadowRoot) {
        const assignedShadowMatch = findComposedElementById(assigned.shadowRoot, id)
        if (assignedShadowMatch) return assignedShadowMatch
      }
    }
  }

  return null
}

export class CVDialog extends ReatomLitElement {
  static elementName = 'cv-dialog'

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
      preventInitialTextFocus: {type: Boolean, attribute: false},
      noHeader: {type: Boolean, attribute: 'no-header', reflect: true},
      closable: {type: Boolean},
      alwaysOnTop: {type: Boolean, attribute: 'always-on-top', reflect: true},
    }
  }

  declare open: boolean
  declare modal: boolean
  declare type: 'dialog' | 'alertdialog'
  declare closeOnEscape: boolean
  declare closeOnOutsidePointer: boolean
  declare closeOnOutsideFocus: boolean
  declare initialFocusId: string
  declare preventInitialTextFocus: boolean
  declare noHeader: boolean
  declare closable: boolean
  declare alwaysOnTop: boolean

  private readonly idBase = `cv-dialog-${++cvDialogNonce}`
  private model: DialogModel
  private lockScrollApplied = false
  private suppressLifecycleFromUpdate = false
  private lifecycleToken = 0
  private focusRestoreTarget: HTMLElement | null = null
  private focusRestoreHost: HTMLElement | null = null
  private portalVisible = false
  private presenceState: DialogPresenceState = 'closed'
  private presenceAnimationTimeout = 0
  private pendingFocusRestoreTargetId: string | null = null
  private shouldAnimatePresence = false
  private suppressNextNativeCancel = false
  private overlayPointerDownOnSelf = false
  private lastTouchClientY = 0
  private readonly handleDocumentFocusInBound = (event: FocusEvent) => this.handleDocumentFocusIn(event)

  constructor() {
    super()
    this.open = false
    this.modal = true
    this.type = 'dialog'
    this.closeOnEscape = true
    this.closeOnOutsidePointer = true
    this.closeOnOutsideFocus = true
    this.initialFocusId = ''
    this.preventInitialTextFocus = false
    this.noHeader = false
    this.closable = true
    this.alwaysOnTop = false
    this.model = this.createModel()
    this.portalVisible = this.open
    this.presenceState = this.open ? 'open' : 'closed'
  }

  static styles = [
    css`
      :host {
        display: contents;
        --_cv-dialog-viewport-inset-block-start: var(
          --cv-dialog-safe-area-block-start,
          env(safe-area-inset-top, 0px)
        );
        --_cv-dialog-viewport-inset-inline-end: var(
          --cv-dialog-safe-area-inline-end,
          env(safe-area-inset-right, 0px)
        );
        --_cv-dialog-viewport-inset-block-end: calc(
          var(--cv-dialog-safe-area-block-end, env(safe-area-inset-bottom, 0px)) +
            var(--cv-dialog-keyboard-inset, 0px)
        );
        --_cv-dialog-viewport-inset-inline-start: var(
          --cv-dialog-safe-area-inline-start,
          env(safe-area-inset-left, 0px)
        );
        --cv-dialog-overlay-padding-block-start: calc(
          var(--cv-dialog-padding-block, var(--cv-space-4, 16px)) +
            var(--_cv-dialog-viewport-inset-block-start)
        );
        --cv-dialog-overlay-padding-inline-end: calc(
          var(--cv-dialog-padding-inline, var(--cv-space-4, 16px)) +
            var(--_cv-dialog-viewport-inset-inline-end)
        );
        --cv-dialog-overlay-padding-block-end: calc(
          var(--cv-dialog-padding-block, var(--cv-space-4, 16px)) + var(--_cv-dialog-viewport-inset-block-end)
        );
        --cv-dialog-overlay-padding-inline-start: calc(
          var(--cv-dialog-padding-inline, var(--cv-space-4, 16px)) +
            var(--_cv-dialog-viewport-inset-inline-start)
        );
        --_cv-dialog-available-inline-size: calc(
          100vw - var(--cv-dialog-overlay-padding-inline-start) - var(--cv-dialog-overlay-padding-inline-end)
        );
        --_cv-dialog-available-block-size: calc(
          100dvh - var(--cv-dialog-overlay-padding-block-start) - var(--cv-dialog-overlay-padding-block-end)
        );
        --cv-dialog-transition-duration: var(--cv-duration-fast, 120ms);
        --cv-dialog-transition-easing-open: var(--cv-easing-decelerate, cubic-bezier(0, 0, 0.2, 1));
        --cv-dialog-transition-easing-close: var(--cv-easing-accelerate, cubic-bezier(0.4, 0, 1, 1));
        --cv-dialog-content-transition-property: opacity, transform;
        --cv-dialog-content-closed-transform: translate3d(0, 8px, 0) scale(0.98);
        --cv-dialog-content-open-transform: translate3d(0, 0, 0) scale(1);
      }

      .portal-shell {
        position: fixed;
        inset: 0;
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: inherit;
        inline-size: 100vw;
        max-inline-size: none;
        block-size: 100dvh;
        max-block-size: none;
        overflow: visible;
        transition:
          display var(--cv-dialog-transition-duration) allow-discrete,
          overlay var(--cv-dialog-transition-duration) allow-discrete;
        transition-behavior: allow-discrete;
      }

      .portal-shell::backdrop {
        background: transparent;
      }

      .portal-shell[hidden] {
        display: none;
      }

      .popover-shell {
        position: fixed;
        inset: 0;
      }

      [part='overlay'] {
        position: fixed;
        inset: 0;
        z-index: var(--cv-dialog-z-index, 40);
        display: grid;
        place-items: center;
        background: transparent;
        padding-block: var(--cv-dialog-overlay-padding-block-start) var(--cv-dialog-overlay-padding-block-end);
        padding-inline: var(--cv-dialog-overlay-padding-inline-start)
          var(--cv-dialog-overlay-padding-inline-end);
        overscroll-behavior: contain;
        transition: display var(--cv-dialog-transition-duration) allow-discrete;
        transition-behavior: allow-discrete;
      }

      [part='overlay']::before {
        content: '';
        position: fixed;
        inset: 0;
        background: var(--cv-dialog-overlay-color, var(--cv-color-overlay));
        opacity: 0;
        transition: opacity var(--cv-dialog-transition-duration) var(--cv-dialog-transition-easing-open);
        pointer-events: none;
      }

      [part='overlay'][hidden] {
        display: none;
      }

      [part='overlay'][data-state='opening']::before,
      [part='overlay'][data-state='open']::before {
        opacity: 1;
      }

      [part='overlay'][data-state='closing']::before {
        opacity: 0;
        transition-timing-function: var(--cv-dialog-transition-easing-close);
      }

      [part='content'] {
        position: relative;
        z-index: 1;
        box-sizing: border-box;
        inline-size: var(--cv-dialog-width, var(--cv-dialog-width-m, min(560px, calc(100vw - 32px))));
        max-inline-size: min(var(--cv-dialog-width, 100%), var(--_cv-dialog-available-inline-size));
        max-block-size: min(
          var(--cv-dialog-max-height, var(--_cv-dialog-available-block-size)),
          var(--_cv-dialog-available-block-size)
        );
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        display: grid;
        gap: var(--cv-space-3, 12px);
        padding: var(--cv-space-4, 16px);
        border-radius: var(--cv-dialog-border-radius, var(--cv-radius-lg, 14px));
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface-elevated, #1d2432);
        color: var(--cv-color-text, #e8ecf6);
        opacity: 0;
        transform: var(--cv-dialog-content-closed-transform);
        transition-property: var(--cv-dialog-content-transition-property);
        transition-duration: var(--cv-dialog-transition-duration);
        transition-timing-function: var(--cv-dialog-transition-easing-open);
        will-change: opacity, transform;
      }

      [part='content'][data-state='opening'],
      [part='content'][data-state='open'] {
        opacity: 1;
        transform: var(--cv-dialog-content-open-transform);
      }

      [part='content'][data-state='closing'] {
        opacity: 0;
        transform: var(--cv-dialog-content-closed-transform);
        transition-timing-function: var(--cv-dialog-transition-easing-close);
      }

      [part='content']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      [part='header'] {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        row-gap: var(--cv-space-1, 4px);
        column-gap: var(--cv-space-3, 12px);
        align-items: start;
      }

      [part='header'],
      [part='body'],
      [part='footer'] {
        min-inline-size: 0;
      }

      [part='title'] {
        grid-column: 1;
        margin: 0;
        font-size: var(--cv-dialog-title-font-size, 1.05rem);
        font-weight: var(--cv-dialog-title-font-weight, 600);
        line-height: var(--cv-dialog-title-line-height, 1.2);
        min-inline-size: 0;
      }

      [part='description'] {
        grid-column: 1;
        margin: 0;
        color: var(--cv-color-text-muted, #9aa6bf);
        min-inline-size: 0;
      }

      [part='header-close'] {
        grid-column: 2;
        grid-row: 1 / span 2;
        align-self: start;
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
        transition:
          color 0.15s ease,
          background 0.15s ease;
      }

      [part='header-close']:hover {
        color: var(--cv-color-text, #e8ecf6);
        background: var(--cv-color-surface-highlight);
      }

      [part='header-close']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      ::slotted([slot='title']) {
        color: var(--cv-color-text, #e8ecf6);
        font-size: var(--cv-dialog-title-font-size, 1.05rem);
        font-weight: var(--cv-dialog-title-font-weight, 600);
        line-height: var(--cv-dialog-title-line-height, 1.2);
      }

      ::slotted([slot='description']) {
        color: var(--cv-color-text-muted, #9aa6bf);
      }

      [part='footer'] {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cv-space-2, 8px);
        justify-content: flex-end;
      }

      @starting-style {
        [part='overlay'][data-state='opening']::before,
        [part='overlay'][data-state='open']::before {
          opacity: 0;
        }

        [part='content'][data-state='opening'],
        [part='content'][data-state='open'] {
          opacity: 0;
          transform: var(--cv-dialog-content-closed-transform);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        :host {
          --cv-dialog-transition-duration: 0ms;
          --cv-dialog-content-closed-transform: none;
          --cv-dialog-content-open-transform: none;
        }

        [part='content'] {
          transform: none;
        }
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
    this.clearPresenceAnimationQueue()
    this.closeNativeShells()
    super.disconnectedCallback()
    this.syncOutsideFocusListener(true)
    this.releaseScrollLock()
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('modal') ||
      changedProperties.has('type') ||
      changedProperties.has('closeOnEscape') ||
      changedProperties.has('closeOnOutsidePointer') ||
      changedProperties.has('closeOnOutsideFocus') ||
      changedProperties.has('initialFocusId')
    ) {
      const wasOpen = this.model.state.isOpen()
      this.model = this.createModel(wasOpen)
    }

    if (changedProperties.has('open') && this.open && changedProperties.get('open') !== true) {
      this.captureFocusRestoreTarget()
    }

    if (changedProperties.has('open') && this.model.state.isOpen() !== this.open) {
      if (this.open) {
        this.model.actions.open()
      } else {
        this.model.actions.close()
      }
    }

    if (changedProperties.has('open')) {
      this.clearPresenceAnimationQueue()

      if (this.open) {
        this.portalVisible = true
        this.presenceState = this.hasUpdated ? 'opening' : 'open'
      } else {
        this.presenceState = 'closing'
        if (!this.hasUpdated) {
          this.portalVisible = false
          this.presenceState = 'closed'
        }
      }

      this.shouldAnimatePresence = this.hasUpdated
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    this.syncTopLayerVisibility()
    this.syncOutsideFocusListener()
    if (
      changedProperties.has('open') ||
      changedProperties.has('modal') ||
      changedProperties.has('alwaysOnTop')
    ) {
      this.syncTopLayerStackOrder()
    }
    this.syncScrollLock()
    this.syncRenderedPresenceState()

    if (changedProperties.has('open')) {
      const previousOpen = changedProperties.get('open')
      const hasLogicalTransition = previousOpen !== undefined && previousOpen !== this.open
      if (this.suppressLifecycleFromUpdate) {
        this.suppressLifecycleFromUpdate = false
      } else if (hasLogicalTransition) {
        this.dispatchLifecycleTransition(this.open)
      }

      if (hasLogicalTransition && previousOpen === true && this.open === false) {
        this.queueFocusRestore(this.model.state.restoreTargetId())
      }

      if (hasLogicalTransition) {
        if (this.shouldAnimatePresence) {
          if (this.open) {
            this.startOpenPresenceTransition()
          } else {
            this.startClosePresenceTransition()
          }
        } else {
          this.finishPresenceTransition(this.open)
        }
      }
      this.shouldAnimatePresence = false

      if (this.open) {
        queueMicrotask(() => this.focusInitialTarget())
      }
    }
  }

  private createModel(initialOpen = this.open): DialogModel {
    return createDialog({
      idBase: this.idBase,
      initialOpen,
      isModal: this.modal,
      type: this.type,
      closeOnEscape: this.closeOnEscape,
      closeOnOutsidePointer: this.closeOnOutsidePointer,
      closeOnOutsideFocus: this.closeOnOutsideFocus,
      initialFocusId: this.initialFocusId || undefined,
    })
  }

  private clearPresenceAnimationQueue(): void {
    if (this.presenceAnimationTimeout) {
      window.clearTimeout(this.presenceAnimationTimeout)
      this.presenceAnimationTimeout = 0
    }
  }

  private startOpenPresenceTransition(): void {
    if (!this.open) return

    this.presenceState = 'open'
    this.syncRenderedPresenceState()

    const duration = this.getPresenceTransitionDuration()
    if (duration === 0) {
      this.finishPresenceTransition(true)
      return
    }

    const token = this.lifecycleToken
    this.presenceAnimationTimeout = window.setTimeout(() => {
      this.presenceAnimationTimeout = 0
      if (!this.open || token !== this.lifecycleToken) return
      this.finishPresenceTransition(true)
    }, duration)
  }

  private startClosePresenceTransition(): void {
    const duration = this.getPresenceTransitionDuration()

    if (duration === 0) {
      this.finishPresenceTransition(false)
      return
    }

    const token = this.lifecycleToken
    this.presenceAnimationTimeout = window.setTimeout(() => {
      this.presenceAnimationTimeout = 0
      if (this.open || token !== this.lifecycleToken) return
      this.finishPresenceTransition(false)
    }, duration)
  }

  private finishPresenceTransition(open: boolean): void {
    if (this.open !== open) return

    if (open) {
      this.portalVisible = true
      this.presenceState = 'open'
      this.syncRenderedPresenceState()
      this.dispatchLifecycleEvent('cv-after-show')
      return
    }

    this.portalVisible = false
    this.presenceState = 'closed'
    this.syncTopLayerVisibility()
    this.syncScrollLock()
    this.syncRenderedPresenceState()
    this.restoreQueuedFocus()
    this.dispatchLifecycleEvent('cv-after-hide')
  }

  private syncRenderedPresenceState(): void {
    const shell = this.getCurrentPortalShell()
    const overlay = this.getPortalOverlay()
    const content = this.getContentElement()

    if (shell) {
      shell.dataset['state'] = this.presenceState
      shell.hidden = !this.portalVisible
    }

    if (overlay) {
      overlay.hidden = !this.portalVisible
      overlay.dataset['state'] = this.presenceState
    }

    if (content) {
      content.dataset['state'] = this.presenceState
    }
  }

  private shouldLockScrollForPresence(): boolean {
    return this.portalVisible && this.modal
  }

  private getPresenceTransitionDuration(): number {
    return Math.max(
      this.readTransitionDuration(this.getPortalOverlay()),
      this.readTransitionDuration(this.getContentElement()),
    )
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

  private captureState() {
    return {
      open: this.model.state.isOpen(),
      restoreTargetId: this.model.state.restoreTargetId(),
    }
  }

  private dispatchInput(detail: CVDialogEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(detail: CVDialogEventDetail): void {
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
    ++this.lifecycleToken
    this.dispatchLifecycleEvent(open ? 'cv-show' : 'cv-hide')
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

    if (!nextOpen) {
      this.queueFocusRestore(previous.restoreTargetId)
    }
  }

  private captureFocusRestoreTarget(): void {
    this.focusRestoreTarget = getFocusRestoreTarget()
    const host = document.activeElement
    this.focusRestoreHost =
      host instanceof HTMLElement && host !== document.body && host !== document.documentElement
        ? host
        : null
  }

  private queueFocusRestore(restoreTargetId: string | null): void {
    this.pendingFocusRestoreTargetId = restoreTargetId
  }

  private restoreQueuedFocus(): void {
    this.restoreFocus(this.pendingFocusRestoreTargetId)
    this.pendingFocusRestoreTargetId = null
  }

  private restoreFocus(restoreTargetId: string | null): void {
    const target =
      (this.focusRestoreTarget?.isConnected ? this.focusRestoreTarget : null) ??
      (this.focusRestoreHost?.isConnected ? this.focusRestoreHost : null) ??
      (restoreTargetId
        ? ((this.shadowRoot?.querySelector(`[id="${restoreTargetId}"]`) as HTMLElement | null) ?? null)
        : null)

    target?.focus({preventScroll: true})
    this.focusRestoreTarget = null
    this.focusRestoreHost = null
  }

  private getPortalOverlay(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part="overlay"]') as HTMLElement | null
  }

  private getContentElement(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part="content"]') as HTMLElement | null
  }

  private getModalShell(): HTMLDialogElement | null {
    return this.shadowRoot?.querySelector('dialog.portal-shell') as HTMLDialogElement | null
  }

  private getPopoverShell(): PopoverHostElement | null {
    return this.shadowRoot?.querySelector('.popover-shell') as PopoverHostElement | null
  }

  private getCurrentPortalShell(): HTMLElement | null {
    return this.modal ? this.getModalShell() : this.getPopoverShell()
  }

  private isPopoverOpen(shell: PopoverHostElement): boolean {
    return shell.dataset['popoverOpen'] === 'true'
  }

  private openPopoverShell(shell: PopoverHostElement): void {
    shell.hidden = false

    if (typeof shell.showPopover === 'function') {
      try {
        shell.showPopover()
      } catch {
        // noop fallback for tests or unsupported environments
      }
    }

    shell.dataset['popoverOpen'] = 'true'
  }

  private closePopoverShell(shell: PopoverHostElement): void {
    if (typeof shell.hidePopover === 'function' && this.isPopoverOpen(shell)) {
      try {
        shell.hidePopover()
      } catch {
        // noop fallback for tests or unsupported environments
      }
    }

    delete shell.dataset['popoverOpen']
    shell.hidden = true
  }

  private syncTopLayerVisibility(): void {
    const modalShell = this.getModalShell()
    const popoverShell = this.getPopoverShell()

    if (this.modal) {
      if (popoverShell) {
        this.closePopoverShell(popoverShell)
      }

      if (!modalShell) return

      if (this.portalVisible) {
        modalShell.hidden = false
        if (!modalShell.open) {
          try {
            modalShell.showModal()
          } catch {
            modalShell.setAttribute('open', '')
          }
        }
      } else {
        if (modalShell.open) {
          try {
            modalShell.close()
          } catch {
            modalShell.removeAttribute('open')
          }
        }
        modalShell.hidden = true
      }

      return
    }

    if (modalShell?.open) {
      try {
        modalShell.close()
      } catch {
        modalShell.removeAttribute('open')
      }
    }
    if (modalShell) {
      modalShell.hidden = true
    }

    if (!popoverShell) return

    if (this.portalVisible) {
      this.openPopoverShell(popoverShell)
    } else {
      this.closePopoverShell(popoverShell)
    }
  }

  private closeNativeShells(): void {
    const modalShell = this.getModalShell()
    const popoverShell = this.getPopoverShell()

    if (modalShell?.open) {
      try {
        modalShell.close()
      } catch {
        modalShell.removeAttribute('open')
      }
    }
    if (popoverShell) {
      this.closePopoverShell(popoverShell)
    }
  }

  private syncTopLayerStackOrder(): void {
    if (!this.open) return

    sortOpenDialogStack()
    const topmostDialog = openDialogStack[openDialogStack.length - 1]
    if (!topmostDialog || topmostDialog === this) return

    topmostDialog.promoteTopLayerShell()
  }

  private promoteTopLayerShell(): void {
    if (!this.portalVisible) return

    topLayerReorderInProgress = true
    try {
      if (this.modal) {
        const shell = this.getModalShell()
        if (!shell?.open) return

        try {
          shell.close()
          shell.showModal()
        } catch {
          shell.setAttribute('open', '')
        }
        return
      }

      const shell = this.getPopoverShell()
      if (!shell || !this.isPopoverOpen(shell)) return
      this.closePopoverShell(shell)
      this.openPopoverShell(shell)
    } finally {
      topLayerReorderInProgress = false
    }
  }

  private syncOutsideFocusListener(forceOff = false): void {
    const shouldListen = !forceOff && this.open
    if (shouldListen) {
      this.pushOntoOpenStack()
      document.addEventListener('focusin', this.handleDocumentFocusInBound)
    } else {
      this.removeFromOpenStack()
      document.removeEventListener('focusin', this.handleDocumentFocusInBound)
    }
  }

  private pushOntoOpenStack(): void {
    if (!openDialogStack.includes(this)) {
      openDialogOrder.set(this, ++cvDialogOpenOrderNonce)
      openDialogStack.push(this)
    }
    sortOpenDialogStack()
  }

  private removeFromOpenStack(): void {
    const index = openDialogStack.indexOf(this)
    if (index >= 0) openDialogStack.splice(index, 1)
    openDialogOrder.delete(this)
  }

  private isTopmostOpenDialog(): boolean {
    return openDialogStack[openDialogStack.length - 1] === this
  }

  private syncScrollLock(): void {
    if (!this.shouldLockScrollForPresence()) {
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

  private focusInitialTarget(): void {
    const contentProps = this.model.contracts.getContentProps()
    const requestedId = contentProps['data-initial-focus']

    if (requestedId) {
      const explicit =
        findComposedElementById(this, requestedId) ?? findComposedElementById(this.renderRoot, requestedId)
      if (explicit) {
        if (this.preventInitialTextFocus && isTextEditableFocusTarget(explicit)) {
          this.getContentElement()?.focus()
          return
        }

        explicit.focus()
        return
      }
    }

    this.getContentElement()?.focus()
  }

  private getTouchClientY(event: TouchEvent): number | null {
    const touch = event.touches[0] ?? event.changedTouches[0]
    return touch?.clientY ?? null
  }

  private isVerticallyScrollable(element: HTMLElement): boolean {
    const styles = window.getComputedStyle(element)
    const overflowY = styles.overflowY || styles.overflow
    return /(auto|scroll|overlay)/.test(overflowY) && element.scrollHeight > element.clientHeight
  }

  private collectScrollableContentAncestors(event: Event, content: HTMLElement): HTMLElement[] {
    const path = event.composedPath()
    const contentIndex = path.indexOf(content)

    if (contentIndex >= 0) {
      return path
        .slice(0, contentIndex + 1)
        .filter((node): node is HTMLElement => node instanceof HTMLElement)
    }

    const {target} = event
    const eventTarget =
      target instanceof HTMLElement
        ? target
        : target instanceof Node && target.parentElement instanceof HTMLElement
          ? target.parentElement
          : null
    if (!eventTarget || !content.contains(eventTarget)) return []

    const ancestors: HTMLElement[] = []
    let current: HTMLElement | null = eventTarget
    while (current) {
      ancestors.push(current)
      if (current === content) return ancestors
      current = current.parentElement
    }

    return []
  }

  private canScrollDialogContent(event: Event, deltaY: number): boolean {
    const content = this.getContentElement()
    if (!content) return false

    for (const current of this.collectScrollableContentAncestors(event, content)) {
      if (!this.isVerticallyScrollable(current)) continue

      const maxScrollTop = current.scrollHeight - current.clientHeight
      if (deltaY < 0 && current.scrollTop > 0) return true
      if (deltaY > 0 && current.scrollTop < maxScrollTop) return true
      if (deltaY === 0) return true
    }

    return false
  }

  private handleDocumentFocusIn(event: FocusEvent) {
    if (!this.open) return
    if (topLayerReorderInProgress) return

    // Only the topmost open dialog reacts to outside focus. Otherwise opening
    // a stacked dialog B focuses its content, which would dismiss the
    // underlying dialog A — and restoring focus to A's opener would in turn
    // dismiss B. With a stack, a dialog beneath another open dialog never
    // treats focus changes as outside-focus dismissals.
    if (!this.isTopmostOpenDialog()) return

    const path = event.composedPath()
    const overlay = this.getPortalOverlay()
    if (path.includes(this) || (overlay && path.includes(overlay))) return

    // Also ignore focus moving into another open cv-dialog (a stacked overlay
    // that has not yet registered as topmost when this handler runs).
    if (this.focusTargetBelongsToOpenDialog(path)) return

    const previous = this.captureState()
    this.model.actions.handleOutsideFocus()
    this.applyInteractionResult(previous)
  }

  private focusTargetBelongsToOpenDialog(path: EventTarget[]): boolean {
    for (const node of path) {
      if (node instanceof CVDialog && node !== this && node.open) {
        return true
      }
    }

    return false
  }

  private handleOverlayMouseDown(event: MouseEvent) {
    // Remember whether the pointer sequence started on the overlay itself
    // (not inside the dialog content). A drag that begins inside the content
    // and is released over the overlay must not dismiss the dialog.
    this.overlayPointerDownOnSelf = event.target === event.currentTarget
  }

  private handleOverlayClick(event: MouseEvent) {
    const startedOnSelf = this.overlayPointerDownOnSelf
    this.overlayPointerDownOnSelf = false

    if (event.target !== event.currentTarget) return
    if (!startedOnSelf) return

    const previous = this.captureState()
    this.model.contracts.getOverlayProps().onPointerDownOutside()
    this.applyInteractionResult(previous)
  }

  private handleOverlayTouchStart(event: TouchEvent) {
    const clientY = this.getTouchClientY(event)
    if (clientY !== null) {
      this.lastTouchClientY = clientY
    }
  }

  private handleOverlayTouchMove(event: TouchEvent) {
    if (!this.open || !this.modal) return

    const clientY = this.getTouchClientY(event)
    if (clientY === null) {
      event.preventDefault()
      return
    }

    const deltaY = this.lastTouchClientY - clientY
    this.lastTouchClientY = clientY

    if (this.canScrollDialogContent(event, deltaY)) return
    event.preventDefault()
  }

  private handleOverlayWheel(event: WheelEvent) {
    if (!this.open || !this.modal) return
    if (this.canScrollDialogContent(event, event.deltaY)) return
    event.preventDefault()
  }

  private handleContentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Respect a nested widget that already handled Escape, and never
      // hijack the key (preventDefault + suppress native cancel) when
      // Escape-to-close is disabled.
      if (event.defaultPrevented || !this.closeOnEscape) return
      event.preventDefault()
      this.suppressNextNativeCancel = true
    }

    const previous = this.captureState()
    this.model.contracts.getContentProps().onKeyDown({key: event.key})
    this.applyInteractionResult(previous)
  }

  private handleNativeCancel(event: Event) {
    event.preventDefault()

    if (this.suppressNextNativeCancel) {
      this.suppressNextNativeCancel = false
      return
    }

    if (!this.closeOnEscape) return

    const previous = this.captureState()
    this.model.contracts.getContentProps().onKeyDown({key: 'Escape'})
    this.applyInteractionResult(previous)
  }

  private handleHeaderCloseClick() {
    const previous = this.captureState()
    this.model.contracts.getHeaderCloseButtonProps().onClick()
    this.applyInteractionResult(previous)
  }

  private renderContent() {
    const contentProps = this.model.contracts.getContentProps()
    const titleProps = this.model.contracts.getTitleProps()
    const descriptionProps = this.model.contracts.getDescriptionProps()
    const headerCloseProps = this.model.contracts.getHeaderCloseButtonProps()

    return html`
      <div
        id=${this.model.contracts.getOverlayProps().id}
        class="cv-u-discrete-presence"
        data-open=${this.model.contracts.getOverlayProps()['data-open']}
        data-state=${this.presenceState}
        ?hidden=${!this.portalVisible}
        part="overlay"
        @mousedown=${this.handleOverlayMouseDown}
        @click=${this.handleOverlayClick}
        @touchstart=${this.handleOverlayTouchStart}
        @touchmove=${this.handleOverlayTouchMove}
        @wheel=${this.handleOverlayWheel}
      >
        <section
          id=${contentProps.id}
          class="cv-u-discrete-presence"
          role=${contentProps.role}
          tabindex=${contentProps.tabindex}
          aria-modal=${contentProps['aria-modal']}
          aria-labelledby=${contentProps['aria-labelledby'] ?? nothing}
          aria-describedby=${contentProps['aria-describedby'] ?? nothing}
          data-initial-focus=${contentProps['data-initial-focus'] ?? nothing}
          data-state=${this.presenceState}
          part="content"
          @keydown=${this.handleContentKeyDown}
        >
          <slot name="before-header"></slot>

          <header part="header" ?hidden=${this.noHeader}>
            <h2 id=${titleProps.id} part="title">
              <slot name="title">Dialog</slot>
            </h2>
            <p id=${descriptionProps.id} part="description">
              <slot name="description"></slot>
            </p>
            ${this.closable
              ? html`
                  <button
                    id=${headerCloseProps.id}
                    role=${headerCloseProps.role}
                    tabindex=${headerCloseProps.tabindex}
                    aria-label=${headerCloseProps['aria-label']}
                    type="button"
                    part="header-close"
                    @click=${this.handleHeaderCloseClick}
                  >
                    <slot name="header-close"
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
                  </button>
                `
              : nothing}
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

  protected override render() {
    return html`
      ${this.modal
        ? html`
            <dialog
              class="portal-shell cv-u-discrete-presence"
              data-state=${this.presenceState}
              ?hidden=${!this.portalVisible}
              @cancel=${this.handleNativeCancel}
            >
              ${this.renderContent()}
            </dialog>
          `
        : html`
            <div
              class="portal-shell popover-shell cv-u-discrete-presence"
              popover="manual"
              data-state=${this.presenceState}
              ?hidden=${!this.portalVisible}
            >
              ${this.renderContent()}
            </div>
          `}
    `
  }
}
