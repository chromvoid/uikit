import {createInput, type InputModel, type InputType} from '@chromvoid/headless-ui/input'
import {css, html, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {FormAssociatedReatomElement} from '../form-associated/FormAssociatedReatomElement'
import type {FormAssociatedValidity} from '../form-associated/withFormAssociated'

let cvInputNonce = 0

function hasAssignedSlotContent(slot: HTMLSlotElement): boolean {
  return slot
    .assignedNodes({flatten: true})
    .some((node) => node.nodeType === Node.ELEMENT_NODE || Boolean(node.textContent?.trim()))
}

type CVInputSize = 'small' | 'medium' | 'large'
type CVInputVariant = 'outlined' | 'filled'
type CVInputPreset = 'search-mobile'

export interface CVInputValueDetail {
  value: string
}

export type CVInputInputEvent = CustomEvent<CVInputValueDetail>
export type CVInputChangeEvent = CustomEvent<CVInputValueDetail>
export type CVInputClearEvent = CustomEvent<Record<string, never>>
export type CVInputFocusEvent = CustomEvent<Record<string, never>>
export type CVInputBlurEvent = CustomEvent<Record<string, never>>

export interface CVInputEventMap {
  'cv-input': CVInputInputEvent
  'cv-change': CVInputChangeEvent
  'cv-clear': CVInputClearEvent
  'cv-focus': CVInputFocusEvent
  'cv-blur': CVInputBlurEvent
}

export class CVInput extends FormAssociatedReatomElement {
  static elementName = 'cv-input'
  static override hostDisplay = 'inline-block' as const

  static get properties() {
    return {
      value: {type: String},
      type: {type: String},
      placeholder: {type: String},
      disabled: {type: Boolean, reflect: true},
      readonly: {type: Boolean, reflect: true},
      required: {type: Boolean, reflect: true},
      clearable: {type: Boolean, reflect: true},
      passwordToggle: {type: Boolean, reflect: true, attribute: 'password-toggle'},
      size: {type: String, reflect: true},
      variant: {type: String, reflect: true},
      preset: {type: String, reflect: true},
      name: {type: String},
      autofocus: {type: Boolean, reflect: true},
      autocomplete: {type: String},
      maxlength: {type: Number},
      invalid: {type: Boolean, reflect: true},
    }
  }

  declare value: string
  declare type: InputType
  declare placeholder: string
  declare disabled: boolean
  declare readonly: boolean
  declare required: boolean
  declare clearable: boolean
  declare passwordToggle: boolean
  declare size: CVInputSize
  declare variant: CVInputVariant
  declare preset: CVInputPreset | undefined
  declare name: string
  declare autofocus: boolean
  declare autocomplete: string
  declare maxlength: number | undefined
  declare invalid: boolean

  private model: InputModel
  private _valueOnFocus = ''
  private defaultValue = ''
  private didCaptureDefaultValue = false
  private didAutoFocus = false
  private hasLabelSlot = false

  constructor() {
    super()
    this.value = ''
    this.type = 'text'
    this.placeholder = ''
    this.disabled = false
    this.readonly = false
    this.required = false
    this.clearable = false
    this.passwordToggle = false
    this.size = 'medium'
    this.variant = 'outlined'
    this.preset = undefined
    this.name = ''
    this.autofocus = false
    this.autocomplete = ''
    this.maxlength = undefined
    this.invalid = false

    this.model = this.createModel()
  }

  static styles = [
    css`
      :host {
        --cv-input-height: 36px;
        --cv-input-padding-inline: var(--cv-space-3, 12px);
        --cv-input-font-size: var(--cv-font-size-base, 14px);
        --cv-input-border-radius: var(--cv-radius-sm, 6px);
        --cv-input-border-color: var(--cv-color-border, #2a3245);
        --cv-input-background: transparent;
        --cv-input-color: var(--cv-color-text, #e8ecf6);
        --cv-input-placeholder-color: var(--cv-color-text-muted, #6b7a99);
        --cv-input-focus-ring: 0 0 0 2px var(--cv-color-primary, #65d7ff);
        --cv-input-icon-size: 1em;
        --cv-input-gap: var(--cv-space-2, 8px);
        --cv-input-transition-duration: var(--cv-duration-fast, 120ms);
      }

      [part='base'] {
        gap: var(--cv-input-gap);
        padding-inline: var(--cv-input-padding-inline);
        height: var(--cv-input-height);
        font-size: var(--cv-input-font-size);
        border-radius: var(--cv-input-border-radius);
        border: 1px solid var(--cv-input-border-color);
        background: var(--cv-input-background);
        color: var(--cv-input-color);
        cursor: text;
        transition:
          border-color var(--cv-input-transition-duration) var(--cv-easing-standard, ease),
          background var(--cv-input-transition-duration) var(--cv-easing-standard, ease),
          box-shadow var(--cv-input-transition-duration) var(--cv-easing-standard, ease);
        box-sizing: border-box;
        width: 100%;
      }

      [part='input'] {
        width: 100%;
        border: none;
        outline: none;
        background: transparent;
        color: inherit;
        font: inherit;
        padding: 0;
        margin: 0;
      }

      [part='input']::placeholder {
        color: var(--cv-input-placeholder-color);
      }

      [part='prefix'],
      [part='suffix'],
      [part='clear-button'],
      [part='password-toggle'] {
        font-size: var(--cv-input-icon-size);
      }

      [part='clear-button'],
      [part='password-toggle'] {
        cursor: pointer;
        user-select: none;
      }

      [part='password-toggle-icon'] {
        width: var(--cv-input-icon-size, 1em);
        height: var(--cv-input-icon-size, 1em);
        display: block;
      }

      [part='form-control-label'] {
        display: block;
        margin-bottom: 5px;
      }

      [part='form-control-label'][hidden] {
        display: none;
      }

      [part='form-control-help-text'] {
        display: block;
      }

      /* --- variant: outlined (default) --- */
      :host([variant='outlined']) [part='base'] {
        border-color: var(--cv-input-border-color);
        background: var(--cv-input-background);
      }

      /* --- variant: filled --- */
      :host([variant='filled']) [part='base'] {
        background: var(--cv-color-surface, #141923);
        border-color: transparent;
      }

      /* --- focused --- */
      :host([focused]) [part='base'] {
        box-shadow: var(--cv-input-focus-ring);
      }

      :host([invalid]) [part='base'] {
        border-color: var(--cv-color-danger, #ef4444);
      }

      :host([invalid][focused]) [part='base'] {
        box-shadow: 0 0 0 2px var(--cv-color-danger-border-strong);
      }

      /* --- sizes --- */
      :host([size='small']) {
        --cv-input-height: 30px;
        --cv-input-padding-inline: var(--cv-space-2, 8px);
        --cv-input-font-size: var(--cv-font-size-sm, 13px);
      }

      :host([size='large']) {
        --cv-input-height: 42px;
        --cv-input-padding-inline: var(--cv-space-4, 16px);
        --cv-input-font-size: var(--cv-font-size-md, 16px);
      }

      :host([preset='search-mobile']) {
        --cv-input-height: var(--cv-input-search-mobile-height, 42px);
        --cv-input-padding-inline: var(--cv-input-search-mobile-padding-inline, 14px);
        --cv-input-font-size: var(--cv-input-search-mobile-font-size, 16px);
        --cv-input-border-radius: var(--cv-input-search-mobile-border-radius, 14px);
        --cv-input-background: var(--cv-input-search-mobile-background, var(--cv-color-surface-2));
        --cv-input-border-color: var(--cv-input-search-mobile-border-color, var(--cv-color-border-glass));
        --cv-input-placeholder-color: var(
          --cv-input-search-mobile-placeholder-color,
          var(--cv-color-text-muted)
        );
        --cv-input-icon-size: var(--cv-input-search-mobile-icon-size, 20px);
      }

      :host([preset='search-mobile']) [part='base'] {
        box-shadow: var(
          --cv-input-search-mobile-shadow,
          inset 0 1px 2px var(--cv-alpha-black-10),
          0 1px 0 var(--cv-alpha-white-4)
        );
      }

      :host([preset='search-mobile']:hover) {
        --cv-input-border-color: var(
          --cv-input-search-mobile-border-color-hover,
          var(--cv-color-primary-border)
        );
      }

      /* --- disabled --- */
      :host([disabled]) [part='base'] {
        opacity: 0.55;
        cursor: not-allowed;
      }

      :host([disabled]) [part='input'] {
        cursor: not-allowed;
      }

      /* --- readonly --- */
      :host([readonly]) [part='base'] {
        cursor: default;
      }

      :host([readonly]) [part='input'] {
        cursor: default;
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
    if (!this.didCaptureDefaultValue) {
      this.defaultValue = this.value
      this.didCaptureDefaultValue = true
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    if ((changedProperties.has('autofocus') || changedProperties.size === 0) && this.autofocus) {
      this.scheduleAutofocus()
    }
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('value') && this.model.state.value() !== this.value) {
      this.model.actions.setValue(this.value)
    }

    if (changedProperties.has('type')) {
      this.model.actions.setType(this.type)
    }

    if (changedProperties.has('disabled')) {
      this.model.actions.setDisabled(this.isEffectivelyDisabled())
    }

    if (changedProperties.has('readonly')) {
      this.model.actions.setReadonly(this.readonly)
    }

    if (changedProperties.has('required')) {
      this.model.actions.setRequired(this.required)
    }

    if (changedProperties.has('placeholder')) {
      this.model.actions.setPlaceholder(this.placeholder)
    }

    if (changedProperties.has('clearable')) {
      this.model.actions.setClearable(this.clearable)
    }

    if (changedProperties.has('passwordToggle')) {
      this.model.actions.setPasswordToggle(this.passwordToggle)
    }

    // Reflect headless state to host attributes
    this.toggleAttribute('focused', this.model.state.focused())
    this.toggleAttribute('filled', this.model.state.filled())

    this.syncFormAssociatedState()
  }

  protected override onFormDisabledChanged(_disabled: boolean): void {
    this.model.actions.setDisabled(this.isEffectivelyDisabled())
  }

  protected override onFormReset(): void {
    this.value = this.defaultValue
    this.model.actions.setValue(this.defaultValue)
  }

  protected override onFormStateRestore(state: string | File | FormData | null): void {
    if (typeof state !== 'string') return
    this.value = state
    this.model.actions.setValue(state)
  }

  override focus(options?: FocusOptions): void {
    const input = this.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null
    if (input) {
      input.focus(options)
      return
    }
    super.focus(options)
  }

  select(): void {
    const input = this.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null
    input?.select()
  }

  private createModel(): InputModel {
    return createInput({
      idBase: `cv-input-${++cvInputNonce}`,
      value: this.value,
      type: this.type,
      disabled: this.isEffectivelyDisabled(),
      readonly: this.readonly,
      required: this.required,
      placeholder: this.placeholder,
      clearable: this.clearable,
      passwordToggle: this.passwordToggle,
      onInput: (value: string) => {
        this.value = value
        this.dispatchEvent(
          new CustomEvent<CVInputInputEvent['detail']>('cv-input', {
            detail: {value},
            bubbles: true,
            composed: true,
          }),
        )
      },
      onClear: () => {
        this.value = ''
        this.dispatchEvent(
          new CustomEvent<CVInputClearEvent['detail']>('cv-clear', {
            detail: {},
            bubbles: true,
            composed: true,
          }),
        )
      },
    })
  }

  private isEffectivelyDisabled(): boolean {
    return this.disabled || this.formDisabled
  }

  protected override isFormAssociatedDisabled(): boolean {
    return this.isEffectivelyDisabled()
  }

  protected override getFormAssociatedValue(): string | File | FormData | null {
    return this.model.state.value()
  }

  protected override getFormAssociatedValidity(): FormAssociatedValidity {
    const value = this.model.state.value()
    if (this.invalid) {
      return {
        flags: {customError: true},
        message: 'Invalid value',
      }
    }

    if (this.required && value.length === 0) {
      return {
        flags: {valueMissing: true},
        message: 'Please fill out this field.',
      }
    }

    return {flags: {}}
  }

  private scheduleAutofocus() {
    if (this.didAutoFocus || !this.autofocus || this.isEffectivelyDisabled()) return
    this.didAutoFocus = true
    queueMicrotask(() => {
      this.focus({preventScroll: true})
    })
  }

  private handleNativeInput(event: Event) {
    const target = event.target as HTMLInputElement
    this.model.actions.handleInput(target.value)
    this.syncFormAssociatedState()
  }

  private handleNativeFocus() {
    this._valueOnFocus = this.model.state.value()
    this.model.actions.setFocused(true)
    this.requestUpdate()
    this.dispatchEvent(
      new CustomEvent<CVInputFocusEvent['detail']>('cv-focus', {
        detail: {},
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleNativeBlur() {
    this.model.actions.setFocused(false)
    this.requestUpdate()
    const currentValue = this.model.state.value()

    this.dispatchEvent(
      new CustomEvent<CVInputBlurEvent['detail']>('cv-blur', {
        detail: {},
        bubbles: true,
        composed: true,
      }),
    )

    if (currentValue !== this._valueOnFocus) {
      this.dispatchEvent(
        new CustomEvent<CVInputChangeEvent['detail']>('cv-change', {
          detail: {value: currentValue},
          bubbles: true,
          composed: true,
        }),
      )
    }

    this.syncFormAssociatedState()
  }

  private handleNativeKeyDown(event: KeyboardEvent) {
    if (
      event.key === 'Enter' &&
      !event.defaultPrevented &&
      !event.shiftKey &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const form = this.form ?? this.closest('form')
      if (form) {
        event.preventDefault()
        form.requestSubmit()
      }
    }

    const wasFilled = this.model.state.filled()
    this.model.actions.handleKeyDown(event)
    // If Escape cleared the value, the onClear callback already dispatched cv-clear
    // but we need to sync the local value
    if (wasFilled && !this.model.state.filled()) {
      this.value = ''
    }

    this.syncFormAssociatedState()
  }

  private handleClearClick() {
    this.model.actions.clear()
    // onClear callback handles the cv-clear event dispatch and value sync
    this.value = this.model.state.value()
    this.syncFormAssociatedState()
  }

  private handlePasswordToggleClick() {
    this.model.actions.togglePasswordVisibility()
    this.requestUpdate()
  }

  private handleLabelSlotChange(event: Event) {
    const next = hasAssignedSlotContent(event.target as HTMLSlotElement)
    if (this.hasLabelSlot === next) return

    this.hasLabelSlot = next
    this.requestUpdate()
  }

  protected override render() {
    const inputProps = this.model.contracts.getInputProps()
    const clearButtonProps = this.model.contracts.getClearButtonProps()
    const passwordToggleProps = this.model.contracts.getPasswordToggleProps()
    const passwordVisible = this.model.state.passwordVisible()

    const resolvedAutocomplete = this.autocomplete || inputProps.autocomplete
    const maxLength =
      typeof this.maxlength === 'number' && Number.isFinite(this.maxlength) ? this.maxlength : null

    return html`
      <span part="form-control-label" ?hidden=${!this.hasLabelSlot}>
        <slot name="label" @slotchange=${this.handleLabelSlotChange}></slot>
      </span>
      <div part="base" class="cv-u-control-shell">
        <span part="prefix" class="cv-u-icon-slot"><slot name="prefix"></slot></span>
        <input
          part="input"
          class="cv-u-fill"
          id=${inputProps.id}
          type=${inputProps.type}
          .value=${this.model.state.value()}
          tabindex=${inputProps.tabindex}
          aria-disabled=${inputProps['aria-disabled'] ?? nothing}
          aria-readonly=${inputProps['aria-readonly'] ?? nothing}
          aria-required=${inputProps['aria-required'] ?? nothing}
          aria-invalid=${this.invalid ? 'true' : nothing}
          placeholder=${inputProps.placeholder ?? nothing}
          name=${this.name || nothing}
          maxlength=${maxLength ?? nothing}
          ?disabled=${inputProps.disabled}
          ?readonly=${inputProps.readonly}
          autocomplete=${resolvedAutocomplete ?? nothing}
          @input=${this.handleNativeInput}
          @focus=${this.handleNativeFocus}
          @blur=${this.handleNativeBlur}
          @keydown=${this.handleNativeKeyDown}
        />
        <span
          part="clear-button"
          class="cv-u-icon-slot"
          role=${clearButtonProps.role}
          aria-label=${clearButtonProps['aria-label']}
          tabindex=${clearButtonProps.tabindex}
          ?hidden=${clearButtonProps.hidden}
          aria-hidden=${clearButtonProps['aria-hidden'] ?? nothing}
          @click=${this.handleClearClick}
        >
          <slot name="clear-icon">&times;</slot>
        </span>
        <span
          part="password-toggle"
          class="cv-u-icon-slot"
          role=${passwordToggleProps.role}
          aria-label=${passwordToggleProps['aria-label']}
          aria-pressed=${passwordToggleProps['aria-pressed']}
          tabindex=${passwordToggleProps.tabindex}
          ?hidden=${passwordToggleProps.hidden}
          aria-hidden=${passwordToggleProps['aria-hidden'] ?? nothing}
          @click=${this.handlePasswordToggleClick}
        >
          ${
            passwordVisible
              ? html`
                  <slot name="hide-password-icon"
                    ><svg
                      part="password-toggle-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" /></svg
                  ></slot>
                `
              : html`
                  <slot name="show-password-icon"
                    ><svg
                      part="password-toggle-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" /></svg
                  ></slot>
                `
          }
        </span>
        <span part="suffix" class="cv-u-icon-slot"><slot name="suffix"></slot></span>
      </div>
      <span part="form-control-help-text"><slot name="help-text"></slot></span>
    `
  }
}
