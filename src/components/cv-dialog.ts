import {createDialog, type DialogModel} from '@chromvoid/headless-ui/dialog'
import {css, nothing, type PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export interface CVDialogEventDetail {
  open: boolean
}

type PopoverHostElement = HTMLElement & {
  showPopover?: () => void
  hidePopover?: () => void
}

let cvDialogNonce = 0
let hasWarnedAboutTriggerSlot = false

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

export class CVDialog extends ReatomLitElement {
  static elementName = 'cv-dialog'

  static get properties() {
    return {
      open: {type: Boolean, reflect: true},
      modal: {type: Boolean, reflect: true},
      type: {type: String, reflect: true},
      closeOnEscape: {type: Boolean, attribute: 'close-on-escape', reflect: true},
      closeOnOutsidePointer: {type: Boolean, attribute: 'close-on-outside-pointer', reflect: true},
      closeOnOutsideFocus: {type: Boolean, attribute: 'close-on-outside-focus', reflect: true},
      initialFocusId: {type: String, attribute: 'initial-focus-id'},
      noHeader: {type: Boolean, attribute: 'no-header', reflect: true},
      closable: {type: Boolean},
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

  private readonly idBase = `cv-dialog-${++cvDialogNonce}`
  private model: DialogModel
  private lockScrollApplied = false
  private previousBodyOverflow = ''
  private suppressLifecycleFromUpdate = false
  private lifecycleToken = 0
  private focusRestoreTarget: HTMLElement | null = null
  private suppressNextNativeCancel = false
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
    this.noHeader = false
    this.closable = true
    this.model = this.createModel()
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

      .portal-shell {
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
        background: var(--cv-dialog-overlay-color, color-mix(in oklab, black 56%, transparent));
        padding: var(--cv-space-4, 16px);
      }

      [part='overlay'][hidden] {
        display: none;
      }

      [part='content'] {
        box-sizing: border-box;
        inline-size: var(--cv-dialog-width, min(560px, calc(100vw - 32px)));
        max-block-size: var(--cv-dialog-max-height, calc(100dvh - 32px));
        overflow: auto;
        display: grid;
        gap: var(--cv-space-3, 12px);
        padding: var(--cv-space-4, 16px);
        border-radius: var(--cv-dialog-border-radius, var(--cv-radius-lg, 14px));
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface-elevated, #1d2432);
        color: var(--cv-color-text, #e8ecf6);
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
        background: color-mix(in oklab, var(--cv-color-text, #e8ecf6) 8%, transparent);
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
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.warnAboutDeprecatedTriggerSlot()
    this.syncOutsideFocusListener()
    this.syncScrollLock()
  }

  override disconnectedCallback(): void {
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
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    this.warnAboutDeprecatedTriggerSlot()
    this.syncTopLayerVisibility()
    this.syncOutsideFocusListener()
    this.syncScrollLock()

    if (changedProperties.has('open')) {
      const previousOpen = changedProperties.get('open')
      if (this.suppressLifecycleFromUpdate) {
        this.suppressLifecycleFromUpdate = false
      } else if (previousOpen !== undefined && previousOpen !== this.open) {
        this.dispatchLifecycleTransition(this.open)
        if (previousOpen === true && this.open === false) {
          this.restoreFocus(this.model.state.restoreTargetId())
        }
      }

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

    if (!nextOpen) {
      this.restoreFocus(previous.restoreTargetId)
    }
  }

  private captureFocusRestoreTarget(): void {
    this.focusRestoreTarget = getFocusRestoreTarget()
  }

  private restoreFocus(restoreTargetId: string | null): void {
    const target =
      (this.focusRestoreTarget?.isConnected ? this.focusRestoreTarget : null) ??
      (restoreTargetId
        ? ((this.shadowRoot?.querySelector(`[id="${restoreTargetId}"]`) as HTMLElement | null) ?? null)
        : null)

    target?.focus({preventScroll: true})
    this.focusRestoreTarget = null
  }

  private getPortalOverlay(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part="overlay"]') as HTMLElement | null
  }

  private getModalShell(): HTMLDialogElement | null {
    return this.shadowRoot?.querySelector('dialog.portal-shell') as HTMLDialogElement | null
  }

  private getPopoverShell(): PopoverHostElement | null {
    return this.shadowRoot?.querySelector('.popover-shell') as PopoverHostElement | null
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

      if (this.open) {
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

    if (this.open) {
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

  private syncOutsideFocusListener(forceOff = false): void {
    const shouldListen = !forceOff && this.open
    if (shouldListen) {
      document.addEventListener('focusin', this.handleDocumentFocusInBound)
    } else {
      document.removeEventListener('focusin', this.handleDocumentFocusInBound)
    }
  }

  private syncScrollLock(): void {
    if (!this.model.state.shouldLockScroll()) {
      this.releaseScrollLock()
      return
    }

    if (this.lockScrollApplied) return

    this.previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    this.lockScrollApplied = true
  }

  private releaseScrollLock(): void {
    if (!this.lockScrollApplied) return

    document.body.style.overflow = this.previousBodyOverflow
    this.lockScrollApplied = false
  }

  private focusInitialTarget(): void {
    const contentProps = this.model.contracts.getContentProps()
    const requestedId = contentProps['data-initial-focus']

    if (requestedId) {
      const explicit =
        (this.querySelector(`#${requestedId}`) as HTMLElement | null) ??
        (this.shadowRoot?.querySelector(`#${requestedId}`) as HTMLElement | null)
      if (explicit) {
        explicit.focus()
        return
      }
    }

    const content = this.shadowRoot?.querySelector('[part="content"]') as HTMLElement | null
    content?.focus()
  }

  private warnAboutDeprecatedTriggerSlot(): void {
    if (hasWarnedAboutTriggerSlot) return
    if (!this.querySelector('[slot="trigger"]')) return

    hasWarnedAboutTriggerSlot = true
    console.warn(
      '[cv-dialog] slot="trigger" is deprecated. Control dialog visibility with `.open` or use createDialogController/dialogService.',
    )
  }

  private handleDocumentFocusIn(event: FocusEvent) {
    if (!this.open) return

    const path = event.composedPath()
    const overlay = this.getPortalOverlay()
    if (path.includes(this) || (overlay && path.includes(overlay))) return

    const previous = this.captureState()
    this.model.actions.handleOutsideFocus()
    this.applyInteractionResult(previous)
  }

  private handleTriggerClick() {
    this.captureFocusRestoreTarget()
    const previous = this.captureState()
    this.model.contracts.getTriggerProps().onClick()
    this.applyInteractionResult(previous)
  }

  private handleTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
    }

    this.captureFocusRestoreTarget()
    const previous = this.captureState()
    this.model.contracts.getTriggerProps().onKeyDown({key: event.key})
    this.applyInteractionResult(previous)
  }

  private handleOverlayPointerDown(event: MouseEvent) {
    if (event.target !== event.currentTarget) return

    const previous = this.captureState()
    this.model.contracts.getOverlayProps().onPointerDownOutside()
    this.applyInteractionResult(previous)
  }

  private handleContentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
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
        data-open=${this.model.contracts.getOverlayProps()['data-open']}
        ?hidden=${this.model.contracts.getOverlayProps().hidden}
        part="overlay"
        @mousedown=${this.handleOverlayPointerDown}
      >
        <section
          id=${contentProps.id}
          role=${contentProps.role}
          tabindex=${contentProps.tabindex}
          aria-modal=${contentProps['aria-modal']}
          aria-labelledby=${contentProps['aria-labelledby'] ?? nothing}
          aria-describedby=${contentProps['aria-describedby'] ?? nothing}
          data-initial-focus=${contentProps['data-initial-focus'] ?? nothing}
          part="content"
          @keydown=${this.handleContentKeyDown}
        >
          <header part="header" ?hidden=${this.noHeader}>
            <h2 id=${titleProps.id} part="title">
              <slot name="title">Dialog</slot>
            </h2>
            <p id=${descriptionProps.id} part="description">
              <slot name="description"></slot>
            </p>
            ${
              this.closable
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
                          <line x1="12" y1="4" x2="4" y2="12" />
                        </svg></slot
                      >
                    </button>
                  `
                : nothing
            }
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
    const triggerProps = this.model.contracts.getTriggerProps()

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
        <slot name="trigger">Open dialog</slot>
      </button>

      ${
        this.modal
          ? html`
              <dialog class="portal-shell" ?hidden=${!this.open} @cancel=${this.handleNativeCancel}>
                ${this.renderContent()}
              </dialog>
            `
          : html`
              <div class="portal-shell popover-shell" popover="manual" ?hidden=${!this.open}>
                ${this.renderContent()}
              </div>
            `
      }
    `
  }
}
