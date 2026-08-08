import {createAlertDialog, type AlertDialogModel} from '@chromvoid/headless-ui/alert-dialog'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {acquireBodyScrollLock, releaseBodyScrollLock} from './scroll-lock'

export interface CVAlertDialogEventDetail {
  open: boolean
}

export type CVAlertDialogInputEvent = CustomEvent<CVAlertDialogEventDetail>
export type CVAlertDialogChangeEvent = CustomEvent<CVAlertDialogEventDetail>
export type CVAlertDialogCancelEvent = CustomEvent<Record<string, never>>
export type CVAlertDialogActionEvent = CustomEvent<Record<string, never>>

let cvAlertDialogNonce = 0

export class CVAlertDialog extends ReatomLitElement {
  static elementName = 'cv-alert-dialog'

  static get properties() {
    return {
      open: {type: Boolean, reflect: true},
      closeOnEscape: {type: Boolean, attribute: 'close-on-escape', reflect: true},
      closeOnOutsidePointer: {type: Boolean, attribute: 'close-on-outside-pointer', reflect: true},
      closeOnOutsideFocus: {type: Boolean, attribute: 'close-on-outside-focus', reflect: true},
      closeOnAction: {type: Boolean, attribute: 'close-on-action', reflect: true},
      initialFocusId: {type: String, attribute: 'initial-focus-id'},
      ariaLabelledBy: {type: String, attribute: 'aria-labelledby'},
      ariaDescribedBy: {type: String, attribute: 'aria-describedby'},
    }
  }

  declare open: boolean
  declare closeOnEscape: boolean
  declare closeOnOutsidePointer: boolean
  declare closeOnOutsideFocus: boolean
  declare closeOnAction: boolean
  declare initialFocusId: string
  declare ariaLabelledBy: string
  declare ariaDescribedBy: string

  private readonly idBase = `cv-alert-dialog-${++cvAlertDialogNonce}`
  private model: AlertDialogModel
  private lockScrollApplied = false

  constructor() {
    super()
    this.open = false
    this.closeOnEscape = true
    this.closeOnOutsidePointer = true
    this.closeOnOutsideFocus = true
    this.closeOnAction = true
    this.initialFocusId = ''
    this.ariaLabelledBy = ''
    this.ariaDescribedBy = ''
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
      }

      [part='trigger']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      [part='overlay'] {
        position: fixed;
        inset: 0;
        z-index: 45;
        display: grid;
        place-items: center;
        background: var(--cv-alpha-black-62);
        padding: var(--cv-space-4, 16px);
        opacity: 1;
        transition:
          opacity var(--cv-alert-dialog-transition-duration, var(--cv-duration-fast, 120ms))
            var(--cv-easing-standard, ease),
          display var(--cv-alert-dialog-transition-duration, var(--cv-duration-fast, 120ms)) allow-discrete;
        transition-behavior: allow-discrete;
      }

      [part='overlay'][hidden] {
        display: none;
        opacity: 0;
      }

      @starting-style {
        [part='overlay']:not([hidden]) {
          opacity: 0;
        }
      }

      [part='content'] {
        inline-size: min(540px, calc(100vw - 32px));
        display: grid;
        gap: var(--cv-space-3, 12px);
        padding: var(--cv-space-4, 16px);
        border-radius: var(--cv-radius-lg, 14px);
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface-elevated, #1d2432);
        color: var(--cv-color-text, #e8ecf6);
      }

      [part='content']:focus-visible {
        outline: none;
      }

      [part='header'] {
        display: grid;
        gap: var(--cv-space-1, 4px);
      }

      [part='title'] {
        margin: 0;
        font-size: 1.05rem;
      }

      [part='description'] {
        margin: 0;
        color: var(--cv-color-text-muted, #9aa6bf);
      }

      [part='footer'] {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cv-space-2, 8px);
        justify-content: flex-end;
      }

      [part='cancel'],
      [part='action'] {
        min-block-size: 34px;
        padding: 0 var(--cv-space-3, 12px);
        border-radius: var(--cv-radius-sm, 6px);
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface, #141923);
        color: var(--cv-color-text, #e8ecf6);
      }

      [part='action'] {
        border-color: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7a8a) 52%,
          var(--cv-color-border, #2a3245)
        );
        background: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7a8a) 22%,
          var(--cv-color-surface, #141923)
        );
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
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('closeOnEscape') ||
      changedProperties.has('closeOnOutsidePointer') ||
      changedProperties.has('closeOnOutsideFocus') ||
      changedProperties.has('closeOnAction') ||
      changedProperties.has('initialFocusId') ||
      changedProperties.has('ariaLabelledBy') ||
      changedProperties.has('ariaDescribedBy')
    ) {
      const previousOpen = this.model.state.isOpen()
      const initialOpen = changedProperties.has('open') ? this.open : previousOpen
      this.model = this.createModel(initialOpen)

      // A config change rebuilds the model; if `open` also changed in the same
      // update the open transition would otherwise be swallowed. Emit it (but
      // not on the initial render, where every property counts as "changed").
      if (this.hasUpdated && changedProperties.has('open') && previousOpen !== this.open) {
        const detail = {open: this.open}
        this.dispatchInput(detail)
        this.dispatchChange(detail)
      }
      return
    }

    if (changedProperties.has('open') && this.model.state.isOpen() !== this.open) {
      const previous = this.captureState()
      if (this.open) {
        this.model.actions.open()
      } else {
        this.model.actions.close()
      }
      this.applyInteractionResult(previous)
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    this.syncOutsideFocusListener()
    this.syncScrollLock()

    if (changedProperties.has('open') && this.open) {
      this.focusInitialTarget()
    }
  }

  private createModel(initialOpen = this.open): AlertDialogModel {
    return createAlertDialog({
      idBase: this.idBase,
      initialOpen,
      closeOnEscape: this.closeOnEscape,
      closeOnOutsidePointer: this.closeOnOutsidePointer,
      closeOnOutsideFocus: this.closeOnOutsideFocus,
      closeOnAction: this.closeOnAction,
      initialFocusId: this.initialFocusId || undefined,
      ariaLabelledBy: this.ariaLabelledBy || undefined,
      ariaDescribedBy: this.ariaDescribedBy || undefined,
    })
  }

  private captureState() {
    return {
      open: this.model.state.isOpen(),
      restoreTargetId: this.model.state.restoreTargetId(),
    }
  }

  private dispatchInput(detail: CVAlertDialogEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(detail: CVAlertDialogEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private applyInteractionResult(previous: {open: boolean; restoreTargetId: string | null}): void {
    const nextOpen = this.model.state.isOpen()
    this.open = nextOpen

    if (previous.open !== nextOpen) {
      const detail = {open: nextOpen}
      this.dispatchInput(detail)
      this.dispatchChange(detail)
    }

    const restoreTargetId = this.model.state.restoreTargetId()
    if (restoreTargetId && previous.restoreTargetId !== restoreTargetId) {
      const trigger = this.shadowRoot?.querySelector(`[id="${restoreTargetId}"]`) as HTMLElement | null
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
    if (!this.open) {
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
    const contentProps = this.model.contracts.getDialogProps()
    const requestedId = contentProps['data-initial-focus']

    if (requestedId) {
      // Use an attribute selector so ids containing characters that need CSS
      // escaping (`:`, `.`, leading digits, …) still resolve.
      const selector = `[id="${requestedId.replace(/"/g, '\\"')}"]`
      const explicit =
        (this.querySelector(selector) as HTMLElement | null) ??
        (this.shadowRoot?.querySelector(selector) as HTMLElement | null)
      if (explicit) {
        explicit.focus()
        return
      }
    }

    const content = this.shadowRoot?.querySelector('[part="content"]') as HTMLElement | null
    content?.focus()
  }

  private handleDocumentFocusIn = (event: FocusEvent) => {
    if (!this.open) return
    if (event.composedPath().includes(this)) return

    const previous = this.captureState()
    this.model.contracts.getOverlayProps().onFocusOutside()
    this.applyInteractionResult(previous)
  }

  private handleTriggerClick() {
    const previous = this.captureState()
    if (this.open) {
      this.model.actions.close()
    } else {
      this.model.actions.open()
    }
    this.applyInteractionResult(previous)
  }

  private handleTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      this.handleTriggerClick()
    }
  }

  private handleOverlayPointerDown(event: MouseEvent) {
    if (event.target !== event.currentTarget) return

    const previous = this.captureState()
    this.model.contracts.getOverlayProps().onPointerDownOutside()
    this.applyInteractionResult(previous)
  }

  private handleContentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Respect a nested widget that already consumed Escape, and never
      // preventDefault / close when Escape dismissal is disabled.
      if (event.defaultPrevented || !this.closeOnEscape) return
      event.preventDefault()
    }

    const previous = this.captureState()
    this.model.contracts.getDialogProps().onKeyDown({key: event.key})
    this.applyInteractionResult(previous)
  }

  private handleCancelClick() {
    const previous = this.captureState()
    this.model.contracts.getCancelButtonProps().onClick()
    this.applyInteractionResult(previous)
    this.dispatchEvent(new CustomEvent('cv-cancel', {bubbles: true, composed: true}))
  }

  private handleActionClick() {
    const previous = this.captureState()
    this.model.contracts.getActionButtonProps().onClick()
    this.applyInteractionResult(previous)
    this.dispatchEvent(new CustomEvent('cv-action', {bubbles: true, composed: true}))
  }

  protected override render() {
    const dialogProps = this.model.contracts.getDialogProps()
    const overlayProps = this.model.contracts.getOverlayProps()
    const titleProps = this.model.contracts.getTitleProps()
    const descriptionProps = this.model.contracts.getDescriptionProps()
    const cancelProps = this.model.contracts.getCancelButtonProps()
    const actionProps = this.model.contracts.getActionButtonProps()

    return html`
      <button
        id="${this.idBase}-trigger"
        part="trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded=${this.open ? 'true' : 'false'}
        @click=${this.handleTriggerClick}
        @keydown=${this.handleTriggerKeyDown}
      >
        <slot name="trigger">Open alert dialog</slot>
      </button>

      <div
        id=${overlayProps.id}
        ?hidden=${overlayProps.hidden}
        class="cv-u-discrete-presence"
        data-open=${overlayProps['data-open']}
        part="overlay"
        @mousedown=${this.handleOverlayPointerDown}
      >
        <section
          id=${dialogProps.id}
          role=${dialogProps.role}
          tabindex=${dialogProps.tabindex}
          aria-modal=${dialogProps['aria-modal']}
          aria-labelledby=${dialogProps['aria-labelledby']}
          aria-describedby=${dialogProps['aria-describedby']}
          data-initial-focus=${dialogProps['data-initial-focus'] ?? nothing}
          part="content"
          @keydown=${this.handleContentKeyDown}
        >
          <header part="header">
            <h2 id=${titleProps.id} part="title">
              <slot name="title">Confirm action</slot>
            </h2>
            <p id=${descriptionProps.id} part="description">
              <slot name="description">This action cannot be undone.</slot>
            </p>
          </header>

          <footer part="footer">
            <button
              id=${cancelProps.id}
              role=${cancelProps.role}
              tabindex=${cancelProps.tabindex}
              type="button"
              part="cancel"
              @click=${this.handleCancelClick}
            >
              <slot name="cancel">Cancel</slot>
            </button>

            <button
              id=${actionProps.id}
              role=${actionProps.role}
              tabindex=${actionProps.tabindex}
              type="button"
              part="action"
              @click=${this.handleActionClick}
            >
              <slot name="action">Confirm</slot>
            </button>
          </footer>
        </section>
      </div>
    `
  }
}
