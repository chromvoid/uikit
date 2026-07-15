import {
  createCopyButton,
  type ClipboardAdapter,
  type CopyButtonModel,
  type CopyButtonValue,
} from '@chromvoid/headless-ui/copy-button'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVCopyButtonSize = 'small' | 'medium' | 'large'
type CVCopyButtonAppearance = 'default' | 'plain'

const DEFAULT_SUCCESS_LABEL = 'Copied'
const DEFAULT_ERROR_LABEL = 'Copy failed'

export interface CVCopyButtonCopyDetail {
  value: string
}

export interface CVCopyButtonErrorDetail {
  error: unknown
}

export type CVCopyButtonCopyEvent = CustomEvent<CVCopyButtonCopyDetail>
export type CVCopyButtonErrorEvent = CustomEvent<CVCopyButtonErrorDetail>

export interface CVCopyButtonEventMap {
  'cv-copy': CVCopyButtonCopyEvent
  'cv-error': CVCopyButtonErrorEvent
}

// Default SVG icons
const copyIcon = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
`
const successIcon = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
`
const errorIcon = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
`

export class CVCopyButton extends ReatomLitElement {
  static elementName = 'cv-copy-button'

  static get properties() {
    return {
      value: {attribute: false},
      clipboard: {attribute: false},
      disabled: {type: Boolean, reflect: true},
      feedbackDuration: {type: Number, reflect: true, attribute: 'feedback-duration'},
      size: {type: String, reflect: true},
      appearance: {type: String, reflect: true},
      successLabel: {type: String, attribute: 'success-label'},
      errorLabel: {type: String, attribute: 'error-label'},
      ariaLabel: {type: String, attribute: 'aria-label'},
    }
  }

  declare value: CopyButtonValue
  declare disabled: boolean
  declare feedbackDuration: number
  declare size: CVCopyButtonSize
  declare appearance: CVCopyButtonAppearance

  private model!: CopyButtonModel
  private clipboardAdapter?: ClipboardAdapter
  private successText = DEFAULT_SUCCESS_LABEL
  private errorText = DEFAULT_ERROR_LABEL
  private idleAriaLabel: string | null = null

  get clipboard(): ClipboardAdapter | undefined {
    return this.clipboardAdapter
  }

  set clipboard(clip: ClipboardAdapter | undefined) {
    const old = this.clipboardAdapter
    if (old === clip) return

    this.clipboardAdapter = clip
    this.maybeRebuildModel()
    this.requestUpdate('clipboard', old)
  }

  /**
   * Recreate the model so a cosmetic/config setter takes effect — but never
   * while feedback is on screen or a copy is in flight. Tearing down the model
   * mid-feedback would reset a visible success/error to idle, orphan the pending
   * revert timer, and let the replaced model fire late events. When the model is
   * busy we defer: the in-flight model keeps its closure values, and the next
   * idle rebuild (or reset) picks up the new ones.
   */
  private maybeRebuildModel(): void {
    if (!this.model) return
    if (this.model.state.status() !== 'idle' || this.model.state.isCopying()) return
    this.model = this._createModel()
  }

  get successLabel(): string {
    return this.successText
  }

  set successLabel(label: string | null | undefined) {
    const old = this.successText
    const next = label || DEFAULT_SUCCESS_LABEL
    if (old === next) return

    this.successText = next
    this.maybeRebuildModel()
    this.requestUpdate('successLabel', old)
  }

  get errorLabel(): string {
    return this.errorText
  }

  set errorLabel(label: string | null | undefined) {
    const old = this.errorText
    const next = label || DEFAULT_ERROR_LABEL
    if (old === next) return

    this.errorText = next
    this.maybeRebuildModel()
    this.requestUpdate('errorLabel', old)
  }

  get ariaLabel(): string | null {
    return this.idleAriaLabel
  }

  set ariaLabel(label: string | null | undefined) {
    const old = this.idleAriaLabel
    const next = label ?? null
    if (old === next) return

    this.idleAriaLabel = next
    this.maybeRebuildModel()
    this.requestUpdate('ariaLabel', old)
  }

  /** @internal Overridable clipboard adapter for testing */
  get _clipboard() {
    return this.clipboard
  }

  set _clipboard(clip: ClipboardAdapter | undefined) {
    this.clipboard = clip
  }

  constructor() {
    super()
    this.value = ''
    this.disabled = false
    this.feedbackDuration = 1500
    this.size = 'medium'
    this.appearance = 'default'
    this.model = this._createModel()
  }

  static styles = [
    css`
      :host {
        display: inline-block;
        --cv-copy-button-size: 36px;
        --cv-copy-button-border-radius: var(--cv-radius-sm, 6px);
        --cv-copy-button-success-color: var(--cv-color-success, #4ade80);
        --cv-copy-button-error-color: var(--cv-color-danger, #ff7d86);
      }

      [part='base'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--cv-copy-button-size);
        height: var(--cv-copy-button-size);
        border-radius: var(--cv-copy-button-border-radius);
        border: 1px solid var(--cv-copy-button-border-color, var(--cv-color-border, #2a3245));
        background: var(--cv-copy-button-background, var(--cv-color-surface, #141923));
        color: var(--cv-copy-button-color, var(--cv-color-text, #e8ecf6));
        cursor: pointer;
        user-select: none;
        padding: 0;
        position: relative;
        transition:
          background var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          border-color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
      }

      [part='base']:hover {
        background: var(
          --cv-copy-button-hover-background,
          var(--cv-copy-button-background, var(--cv-color-surface, #141923))
        );
        border-color: var(--cv-copy-button-hover-border-color, var(--cv-color-primary, #65d7ff));
        color: var(--cv-copy-button-hover-color, var(--cv-copy-button-color, var(--cv-color-text, #e8ecf6)));
      }

      [part='base']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 2px;
      }

      [part='copy-icon'],
      [part='success-icon'],
      [part='error-icon'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0;
        pointer-events: none;
        transform: scale(0.78);
        transition:
          opacity var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          transform var(--cv-duration-fast, 120ms) var(--cv-easing-decelerate, ease-out);
      }

      [part='copy-icon'] svg,
      [part='success-icon'] svg,
      [part='error-icon'] svg,
      [part='copy-icon'] ::slotted(svg),
      [part='success-icon'] ::slotted(svg),
      [part='error-icon'] ::slotted(svg) {
        width: 50%;
        height: 50%;
      }

      [part='status'] {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      /* --- disabled --- */
      :host([disabled]) {
        opacity: 0.55;
        cursor: not-allowed;
      }

      :host([disabled]) [part='base'] {
        cursor: not-allowed;
        pointer-events: none;
      }

      :host([appearance='plain']) [part='base'] {
        background: var(--cv-copy-button-plain-background, transparent);
        border-color: var(--cv-copy-button-plain-border-color, transparent);
      }

      :host([appearance='plain']) [part='base']:hover {
        background: var(
          --cv-copy-button-plain-hover-background,
          var(--cv-copy-button-hover-background, transparent)
        );
        border-color: var(
          --cv-copy-button-plain-hover-border-color,
          var(--cv-copy-button-plain-border-color, transparent)
        );
        color: var(--cv-copy-button-plain-hover-color, var(--cv-copy-button-hover-color, currentColor));
      }

      :host([status='idle']) [part='copy-icon'],
      :host([status='success']) [part='success-icon'],
      :host([status='error']) [part='error-icon'] {
        opacity: 1;
        transform: scale(1);
      }

      /* --- status: success --- */
      :host([status='success']) [part='base'] {
        color: var(--cv-copy-button-success-color);
        border-color: var(--cv-copy-button-success-color);
      }

      /* --- status: error --- */
      :host([status='error']) [part='base'] {
        color: var(--cv-copy-button-error-color);
        border-color: var(--cv-copy-button-error-color);
      }

      /* --- copying --- */
      :host([copying]) {
        cursor: progress;
      }

      :host([copying]) [part='base'] {
        cursor: progress;
      }

      /* --- sizes --- */
      :host([size='small']) {
        --cv-copy-button-size: 30px;
      }

      :host([size='large']) {
        --cv-copy-button-size: 42px;
      }

      @media (prefers-reduced-motion: reduce) {
        [part='copy-icon'],
        [part='success-icon'],
        [part='error-icon'] {
          transform: none;
          transition: opacity var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
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
    // Cancel any pending revert timer so a removed button does not fire feedback
    // resets / events after it has left the DOM.
    this.model?.actions.reset()
  }

  private _createModel(): CopyButtonModel {
    return createCopyButton({
      value: this.value,
      isDisabled: this.disabled,
      feedbackDuration: this.feedbackDuration,
      ariaLabel: this.ariaLabel ?? undefined,
      successLabel: this.successLabel,
      errorLabel: this.errorLabel,
      clipboard: this.clipboard,
      onCopy: (value: string) => {
        this.dispatchEvent(
          new CustomEvent<CVCopyButtonCopyEvent['detail']>('cv-copy', {
            detail: {value},
            bubbles: true,
            composed: true,
          }),
        )
      },
      onError: (error: unknown) => {
        this.dispatchEvent(
          new CustomEvent<CVCopyButtonErrorEvent['detail']>('cv-error', {
            detail: {error},
            bubbles: true,
            composed: true,
          }),
        )
      },
    })
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('disabled')) {
      this.model.actions.setDisabled(this.disabled)
    }

    if (changedProperties.has('feedbackDuration')) {
      this.model.actions.setFeedbackDuration(this.feedbackDuration)
    }

    if (changedProperties.has('value')) {
      this.model.actions.setValue(this.value)
    }
  }

  private _syncHostAttributes(): void {
    const status = this.model.state.status()
    const isCopying = this.model.state.isCopying()

    // Reflect status attribute
    this.setAttribute('status', status)

    // Reflect copying attribute
    if (isCopying) {
      this.setAttribute('copying', '')
    } else {
      this.removeAttribute('copying')
    }
  }

  private handleClick(e: Event) {
    this.model.contracts.getButtonProps().onClick(e)
  }

  private handleKeyDown(e: KeyboardEvent) {
    this.model.contracts.getButtonProps().onKeyDown(e)
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.model.contracts.getButtonProps().onKeyUp(e)
  }

  protected override render() {
    this._syncHostAttributes()

    const buttonProps = this.model.contracts.getButtonProps()
    const statusProps = this.model.contracts.getStatusProps()
    const copyIconProps = this.model.contracts.getIconContainerProps('copy')
    const successIconProps = this.model.contracts.getIconContainerProps('success')
    const errorIconProps = this.model.contracts.getIconContainerProps('error')

    const statusText = this.model.state.status()
    const statusAnnouncement =
      statusText === 'success' ? this.successLabel : statusText === 'error' ? this.errorLabel : nothing

    return html`
      <div
        part="base"
        role=${buttonProps.role}
        tabindex=${buttonProps.tabindex}
        aria-disabled=${buttonProps['aria-disabled']}
        aria-label=${buttonProps['aria-label'] ?? nothing}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
        @keyup=${this.handleKeyUp}
      >
        <span part="copy-icon" aria-hidden=${copyIconProps['aria-hidden']}>
          <slot name="copy-icon">${copyIcon}</slot>
        </span>
        <span part="success-icon" aria-hidden=${successIconProps['aria-hidden']}>
          <slot name="success-icon">${successIcon}</slot>
        </span>
        <span part="error-icon" aria-hidden=${errorIconProps['aria-hidden']}>
          <slot name="error-icon">${errorIcon}</slot>
        </span>
        <span
          part="status"
          role=${statusProps.role}
          aria-live=${statusProps['aria-live']}
          aria-atomic=${statusProps['aria-atomic']}
          >${statusAnnouncement}</span
        >
      </div>
    `
  }
}
