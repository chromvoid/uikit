import {createButton, type ButtonModel} from '@chromvoid/headless-ui/button'
import {css, html, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {FormAssociatedReatomElement} from '../form-associated/FormAssociatedReatomElement'

let cvButtonNonce = 0

type CVButtonVariant = 'default' | 'primary' | 'danger' | 'ghost'
type CVButtonSize = 'small' | 'medium' | 'large'
type CVButtonType = 'button' | 'submit' | 'reset'
type CVButtonPreset = 'action-primary' | 'action-primary-subtle'

const passthroughAttributes = [
  'aria-controls',
  'aria-current',
  'aria-expanded',
  'aria-haspopup',
  'aria-hidden',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-pressed',
  'aria-selected',
  'role',
  'title',
] as const

export interface CVButtonInputDetail {
  pressed: boolean
  toggle: boolean
}

export interface CVButtonChangeDetail {
  pressed: boolean
}

export class CVButton extends FormAssociatedReatomElement {
  static elementName = 'cv-button'

  static get properties() {
    return {
      disabled: {type: Boolean, reflect: true},
      toggle: {type: Boolean, reflect: true},
      pressed: {type: Boolean, reflect: true},
      loading: {type: Boolean, reflect: true},
      variant: {type: String, reflect: true},
      outline: {type: Boolean, reflect: true},
      pill: {type: Boolean, reflect: true},
      size: {type: String, reflect: true},
      preset: {type: String, reflect: true},
      type: {type: String, reflect: true},
      unstyled: {type: Boolean, reflect: true},
      buttonTabIndex: {type: String, attribute: 'button-tabindex'},
    }
  }

  static override get observedAttributes(): string[] {
    return Array.from(new Set([...super.observedAttributes, ...passthroughAttributes]))
  }

  declare disabled: boolean
  declare toggle: boolean
  declare pressed: boolean
  declare loading: boolean
  declare variant: CVButtonVariant
  declare outline: boolean
  declare pill: boolean
  declare size: CVButtonSize
  declare preset: CVButtonPreset | undefined
  declare type: CVButtonType
  declare unstyled: boolean
  declare buttonTabIndex: string | null

  private model: ButtonModel
  private suppressKeyboardClick = false

  constructor() {
    super()
    this.disabled = false
    this.toggle = false
    this.pressed = false
    this.loading = false
    this.variant = 'default'
    this.outline = false
    this.pill = false
    this.size = 'medium'
    this.preset = undefined
    this.type = 'button'
    this.unstyled = false
    this.buttonTabIndex = null
    this.model = this.createModel()
  }

  static styles = [
    css`
      :host {
        display: inline-block;
        max-inline-size: 100%;
        vertical-align: middle;
        cursor: pointer;
        user-select: none;
        --cv-button-min-height: 36px;
        --cv-button-padding-inline: var(--cv-space-3, 12px);
        --cv-button-padding-block: var(--cv-space-2, 8px);
        --cv-button-border-radius: var(--cv-radius-sm, 6px);
        --cv-button-gap: var(--cv-space-2, 8px);
        --cv-button-font-size: var(--cv-button-font-size-medium, var(--cv-font-size-base, 14px));
        --cv-button-font-weight: var(--cv-button-font-weight-medium, inherit);
        --cv-button-accent-color: var(--cv-color-primary, #65d7ff);
        --cv-button-text-color: var(--cv-color-text, #e8ecf6);
        --cv-button-border-color: var(--cv-color-border, #2a3245);
        --cv-button-background: var(--cv-color-surface, #141923);
        --cv-button-text-color-hover: var(--cv-button-text-color);
        --cv-button-border-color-hover: color-mix(
          in oklab,
          var(--cv-button-accent-color) 74%,
          var(--cv-button-border-color)
        );
        --cv-button-background-hover: color-mix(
          in oklab,
          var(--cv-button-accent-color) 10%,
          var(--cv-button-background)
        );
        --cv-button-text-color-active: var(--cv-button-text-color);
        --cv-button-border-color-active: color-mix(
          in oklab,
          var(--cv-button-accent-color) 86%,
          var(--cv-button-border-color)
        );
        --cv-button-background-active: color-mix(
          in oklab,
          var(--cv-button-accent-color) 18%,
          var(--cv-button-background)
        );
        --cv-button-text-color-pressed: var(--cv-button-text-color);
        --cv-button-border-color-pressed: var(--cv-button-border-color-active);
        --cv-button-background-pressed: color-mix(
          in oklab,
          var(--cv-button-accent-color) 30%,
          var(--cv-button-background)
        );
        --cv-button-text-color-pressed-hover: var(--cv-button-text-color-pressed);
        --cv-button-border-color-pressed-hover: var(--cv-button-border-color-pressed);
        --cv-button-background-pressed-hover: var(--cv-button-background-active);
        --cv-button-focus-ring-color: var(--cv-button-accent-color);
      }

      [part='base'] {
        display: inline-flex;
        align-items: center;
        width: 100%;
        justify-content: center;
        gap: var(--cv-button-gap);
        padding: var(--cv-button-padding-block) var(--cv-button-padding-inline);
        min-height: var(--cv-button-min-height);
        font-size: var(--cv-button-font-size);
        font-weight: var(--cv-button-font-weight);
        border-radius: var(--cv-button-border-radius);
        border: 1px solid var(--cv-button-border-color);
        background: var(--cv-button-background);
        color: var(--cv-button-text-color);
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
        transition:
          background var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          border-color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
      }

      [part='label'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--cv-button-gap);
      }

      [part='prefix'],
      [part='suffix'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      /* --- variant: primary --- */
      :host([variant='primary']) [part='base'] {
        --cv-button-accent-color: var(--cv-color-primary, #65d7ff);
        --cv-button-border-color: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 52%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-background: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 22%,
          var(--cv-color-surface, #141923)
        );
        --cv-button-border-color-hover: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 72%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-background-hover: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 30%,
          var(--cv-color-surface, #141923)
        );
        --cv-button-border-color-active: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 84%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-background-active: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 36%,
          var(--cv-color-surface, #141923)
        );
        --cv-button-background-pressed: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 38%,
          var(--cv-color-surface, #141923)
        );
        --cv-button-background-pressed-hover: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 44%,
          var(--cv-color-surface, #141923)
        );
      }

      /* --- variant: danger --- */
      :host([variant='danger']) [part='base'] {
        --cv-button-accent-color: var(--cv-color-danger, #ff7d86);
        --cv-button-border-color: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 52%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-background: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 22%,
          var(--cv-color-surface, #141923)
        );
        --cv-button-border-color-hover: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 72%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-background-hover: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 30%,
          var(--cv-color-surface, #141923)
        );
        --cv-button-border-color-active: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 84%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-background-active: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 36%,
          var(--cv-color-surface, #141923)
        );
        --cv-button-background-pressed: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 32%,
          var(--cv-color-surface, #141923)
        );
        --cv-button-background-pressed-hover: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 38%,
          var(--cv-color-surface, #141923)
        );
      }

      /* --- variant: ghost --- */
      :host([variant='ghost']) [part='base'] {
        --cv-button-background: transparent;
        --cv-button-border-color: transparent;
        --cv-button-border-color-hover: transparent;
        --cv-button-background-hover: rgb(from var(--cv-button-accent-color) r g b / 0.1);
        --cv-button-border-color-active: transparent;
        --cv-button-background-active: rgb(from var(--cv-button-accent-color) r g b / 0.16);
        --cv-button-border-color-pressed: transparent;
        --cv-button-border-color-pressed-hover: transparent;
        --cv-button-background-pressed: rgb(from var(--cv-button-accent-color) r g b / 0.14);
        --cv-button-background-pressed-hover: rgb(from var(--cv-button-accent-color) r g b / 0.18);
      }

      /* --- outline modifier --- */
      :host([outline]) [part='base'] {
        --cv-button-background: transparent;
        --cv-button-border-color: var(--cv-color-border, #2a3245);
        --cv-button-background-hover: rgb(from var(--cv-button-accent-color) r g b / 0.1);
        --cv-button-background-active: rgb(from var(--cv-button-accent-color) r g b / 0.16);
        --cv-button-background-pressed: rgb(from var(--cv-button-accent-color) r g b / 0.16);
        --cv-button-background-pressed-hover: rgb(from var(--cv-button-accent-color) r g b / 0.2);
      }

      :host([outline][variant='primary']) [part='base'] {
        --cv-button-border-color: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 52%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-border-color-hover: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 76%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-border-color-active: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 90%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-background-pressed: var(--cv-color-primary-surface-strong);
        --cv-button-background-pressed-hover: var(--cv-color-primary-ring);
      }

      :host([outline][variant='danger']) [part='base'] {
        --cv-button-border-color: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 52%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-border-color-hover: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 76%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-border-color-active: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 90%,
          var(--cv-color-border, #2a3245)
        );
        --cv-button-background-pressed: var(--cv-color-danger-surface);
        --cv-button-background-pressed-hover: var(--cv-color-danger-surface-strong);
      }

      /* --- pill modifier --- */
      :host([pill]) {
        --cv-button-border-radius: 999px;
      }

      /* --- hover --- */
      [part='base']:hover:not(:disabled) {
        background: var(--cv-button-background-hover);
        border-color: var(--cv-button-border-color-hover);
        color: var(--cv-button-text-color-hover);
      }

      [part='base']:focus-visible {
        outline: 2px solid var(--cv-button-focus-ring-color);
        outline-offset: 2px;
      }

      [part='base']:active:not(:disabled) {
        background: var(--cv-button-background-active);
        border-color: var(--cv-button-border-color-active);
        color: var(--cv-button-text-color-active);
      }

      /* --- pressed states --- */
      :host([pressed]) [part='base'] {
        background: var(--cv-button-background-pressed);
        border-color: var(--cv-button-border-color-pressed);
        color: var(--cv-button-text-color-pressed);
      }

      :host([pressed]) [part='base']:hover:not(:disabled) {
        background: var(--cv-button-background-pressed-hover);
        border-color: var(--cv-button-border-color-pressed-hover);
        color: var(--cv-button-text-color-pressed-hover);
      }

      /* --- sizes --- */
      :host([size='small']) {
        --cv-button-min-height: 30px;
        --cv-button-padding-inline: var(--cv-space-2, 8px);
        --cv-button-padding-block: var(--cv-space-1, 4px);
        --cv-button-font-size: var(--cv-button-font-size-small, var(--cv-font-size-sm, 13px));
      }

      :host([size='large']) {
        --cv-button-min-height: 42px;
        --cv-button-padding-inline: var(--cv-space-4, 16px);
        --cv-button-padding-block: var(--cv-space-2, 8px);
        --cv-button-font-size: var(--cv-button-font-size-large, var(--cv-font-size-md, 16px));
      }

      :host([preset='action-primary']) {
        --cv-button-background: var(--cv-button-action-primary-background, var(--cv-color-primary-dark));
        --cv-button-background-hover: var(
          --cv-button-action-primary-background-hover,
          var(--cv-color-primary)
        );
        --cv-button-background-active: var(
          --cv-button-action-primary-background-active,
          var(--cv-color-primary-darker)
        );
        --cv-button-border-color: var(
          --cv-button-action-primary-border-color,
          var(--cv-color-primary-border-strong)
        );
        --cv-button-border-color-hover: var(
          --cv-button-action-primary-border-color-hover,
          var(--cv-color-primary-border-strong)
        );
        --cv-button-border-color-active: var(
          --cv-button-action-primary-border-color-active,
          var(--cv-color-primary-border-strong)
        );
        --cv-button-text-color: var(--cv-button-action-primary-text-color, var(--cv-color-on-primary));
        --cv-button-text-color-hover: var(
          --cv-button-action-primary-text-color-hover,
          var(--cv-color-on-primary)
        );
        --cv-button-text-color-active: var(
          --cv-button-action-primary-text-color-active,
          var(--cv-color-on-primary)
        );
        --cv-button-focus-ring-color: var(
          --cv-button-action-primary-focus-ring-color,
          var(--cv-color-primary-ring)
        );
      }

      :host([preset='action-primary-subtle']) {
        --cv-button-background: var(
          --cv-button-action-primary-subtle-background,
          var(--cv-color-primary-surface-strong)
        );
        --cv-button-background-hover: var(
          --cv-button-action-primary-subtle-background-hover,
          var(--cv-color-primary-muted)
        );
        --cv-button-background-active: var(
          --cv-button-action-primary-subtle-background-active,
          var(--cv-color-primary-surface)
        );
        --cv-button-border-color: var(
          --cv-button-action-primary-subtle-border-color,
          var(--cv-color-primary-border-strong)
        );
        --cv-button-border-color-hover: var(
          --cv-button-action-primary-subtle-border-color-hover,
          var(--cv-color-primary-border-strong)
        );
        --cv-button-border-color-active: var(
          --cv-button-action-primary-subtle-border-color-active,
          var(--cv-color-primary-border-strong)
        );
        --cv-button-text-color: var(
          --cv-button-action-primary-subtle-text-color,
          var(--cv-color-text-strong)
        );
        --cv-button-text-color-hover: var(
          --cv-button-action-primary-subtle-text-color-hover,
          var(--cv-color-text-strongest)
        );
        --cv-button-text-color-active: var(
          --cv-button-action-primary-subtle-text-color-active,
          var(--cv-color-text-strongest)
        );
        --cv-button-focus-ring-color: var(
          --cv-button-action-primary-subtle-focus-ring-color,
          var(--cv-color-primary-ring)
        );
      }

      /* --- spinner --- */
      [part='spinner'] {
        inline-size: 14px;
        block-size: 14px;
        border-radius: 999px;
        border: 2px solid rgb(from var(--cv-button-accent-color) r g b / 0.32);
        border-top-color: var(--cv-button-accent-color);
        animation: cv-button-spin 800ms linear infinite;
      }

      :host([loading]) [part='base'] {
        cursor: progress;
      }

      :host([loading]) {
        cursor: progress;
      }

      :host([loading]) [part='label'] {
        opacity: 0.72;
      }

      /* --- disabled --- */
      :host([disabled]) {
        cursor: not-allowed;
      }

      :host([disabled]) [part='base'] {
        opacity: 0.55;
        cursor: not-allowed;
      }

      :host([unstyled]) {
        --cv-button-min-height: 0;
        --cv-button-padding-inline: 0;
        --cv-button-padding-block: 0;
        --cv-button-border-radius: inherit;
      }

      :host([unstyled]) [part='base'] {
        box-sizing: border-box;
        inline-size: 100%;
        block-size: 100%;
        min-inline-size: 0;
        min-block-size: 0;
        padding: var(--cv-button-padding-block) var(--cv-button-padding-inline);
        border: 0;
        border-radius: inherit;
        background: transparent;
        color: inherit;
        box-shadow: none;
        font: inherit;
        letter-spacing: inherit;
        line-height: inherit;
        text-align: inherit;
      }

      :host([unstyled]) [part='base']:hover:not(:disabled),
      :host([unstyled]) [part='base']:active:not(:disabled),
      :host([unstyled][pressed]) [part='base'],
      :host([unstyled][pressed]) [part='base']:hover:not(:disabled) {
        border-color: transparent;
        background: transparent;
        color: inherit;
      }

      @keyframes cv-button-spin {
        to {
          transform: rotate(360deg);
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
    this.addEventListener('click', this.handleHostClick, {capture: true})
  }

  override disconnectedCallback(): void {
    this.removeEventListener('click', this.handleHostClick, {capture: true})
    super.disconnectedCallback()
  }

  override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    super.attributeChangedCallback(name, oldValue, newValue)
    if (
      oldValue !== newValue &&
      passthroughAttributes.includes(name as (typeof passthroughAttributes)[number])
    ) {
      this.requestUpdate()
    }
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)
    if (changedProperties.has('toggle')) {
      this.model = this.createModel()
      return
    }

    if (changedProperties.has('disabled')) {
      this.model.actions.setDisabled(this.disabled)
    }

    if (changedProperties.has('loading')) {
      this.model.actions.setLoading(this.loading)
    }

    if (this.toggle && changedProperties.has('pressed')) {
      this.model.actions.setPressed(this.pressed)
    }
  }

  private createModel(): ButtonModel {
    const initialPressed = this.toggle ? this.pressed : undefined

    return createButton({
      idBase: `cv-button-${++cvButtonNonce}`,
      isDisabled: this.disabled,
      isLoading: this.loading,
      isPressed: initialPressed,
      onPress: this.handlePress.bind(this),
    })
  }

  private dispatchInput(detail: CVButtonInputDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(detail: CVButtonChangeDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handlePress() {
    const nextPressed = this.model.state.isPressed()
    const wasPressed = this.pressed

    if (this.toggle) {
      this.pressed = nextPressed

      this.dispatchInput({
        pressed: nextPressed,
        toggle: this.toggle,
      })

      if (wasPressed !== nextPressed) {
        this.dispatchChange({pressed: nextPressed})
      }
    }

    this.triggerFormAction()
  }

  private getButtonType(): CVButtonType {
    if (this.type === 'submit' || this.type === 'reset') {
      return this.type
    }

    return 'button'
  }

  protected override isFormAssociatedDisabled(): boolean {
    return this.disabled || this.loading || this.formDisabled
  }

  protected override getFormAssociatedValue(): string | File | FormData | null {
    return null
  }

  private triggerFormAction() {
    const actionType = this.getButtonType()
    if (actionType === 'button') return
    if (this.isFormAssociatedDisabled()) return

    const form = this.form
    if (!form) return

    if (actionType === 'reset') {
      form.reset()
      return
    }

    form.requestSubmit()
  }

  private handleClick(event: MouseEvent) {
    if (this.suppressKeyboardClick && event.detail === 0) {
      this.suppressKeyboardClick = false
      event.preventDefault()
      return
    }

    this.suppressKeyboardClick = false
    this.model.contracts.getButtonProps().onClick()
  }

  private handleHostClick(event: MouseEvent) {
    if (event.composedPath()[0] !== this) {
      return
    }

    if (this.isFormAssociatedDisabled()) {
      event.preventDefault()
      event.stopImmediatePropagation()
      return
    }

    this.model.contracts.getButtonProps().onClick()
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.suppressKeyboardClick = true
    }

    this.model.contracts.getButtonProps().onKeyDown(event)
  }

  private handleKeyUp(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Spacebar') {
      this.suppressKeyboardClick = true
    }

    this.model.contracts.getButtonProps().onKeyUp(event)
  }

  private handleContentSlotChange() {
    this.requestUpdate()
  }

  private hasSlotContent(name: 'prefix' | 'suffix'): boolean {
    return Array.from(this.children ?? []).some((child) => child.getAttribute('slot') === name)
  }

  private getPassthroughAttribute(name: (typeof passthroughAttributes)[number]) {
    return this.getAttribute(name) ?? nothing
  }

  protected override render() {
    const props = this.model.contracts.getButtonProps()
    const isUnavailable = this.disabled || this.loading
    const hasPrefixContent = this.hasSlotContent('prefix')
    const hasSuffixContent = this.hasSlotContent('suffix')
    const tabIndex = this.buttonTabIndex ?? props.tabindex
    const ariaPressed = props['aria-pressed'] ?? this.getPassthroughAttribute('aria-pressed')

    return html`
      <button
        id=${props.id}
        type="button"
        role=${this.getAttribute('role') ?? props.role}
        tabindex=${tabIndex}
        ?disabled=${isUnavailable}
        aria-disabled=${props['aria-disabled'] ?? nothing}
        aria-busy=${props['aria-busy'] ?? nothing}
        aria-controls=${this.getPassthroughAttribute('aria-controls')}
        aria-current=${this.getPassthroughAttribute('aria-current')}
        aria-expanded=${this.getPassthroughAttribute('aria-expanded')}
        aria-haspopup=${this.getPassthroughAttribute('aria-haspopup')}
        aria-hidden=${this.getPassthroughAttribute('aria-hidden')}
        aria-label=${this.getPassthroughAttribute('aria-label')}
        aria-labelledby=${this.getPassthroughAttribute('aria-labelledby')}
        aria-describedby=${this.getPassthroughAttribute('aria-describedby')}
        aria-pressed=${ariaPressed}
        aria-selected=${this.getPassthroughAttribute('aria-selected')}
        title=${this.getPassthroughAttribute('title')}
        part="base"
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
        @keyup=${this.handleKeyUp}
      >
        ${
          this.loading
            ? html`
                <span part="spinner" aria-hidden="true"></span>
              `
            : nothing
        }
        <span part="prefix" class="cv-u-icon-slot" ?hidden=${!hasPrefixContent}
          ><slot name="prefix" @slotchange=${this.handleContentSlotChange}></slot
        ></span>
        <span part="label" class="cv-u-inline-center"><slot></slot></span>
        <span part="suffix" class="cv-u-icon-slot" ?hidden=${!hasSuffixContent}
          ><slot name="suffix" @slotchange=${this.handleContentSlotChange}></slot
        ></span>
      </button>
    `
  }
}
