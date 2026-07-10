import {
  createCodeInput,
  type CodeInputCharset,
  type CodeInputModel,
  type CodeInputPurpose,
} from '@chromvoid/headless-ui/code-input'
import {css, html, nothing} from 'lit'
import type {PropertyValues} from 'lit'
import {live} from 'lit/directives/live.js'

import {FormAssociatedReatomElement} from '../form-associated/FormAssociatedReatomElement'
import type {FormAssociatedValidity} from '../form-associated/withFormAssociated'

export interface CVCodeInputValueDetail {
  value: string
  complete: boolean
}

export type CVCodeInputInputEvent = CustomEvent<CVCodeInputValueDetail>
export type CVCodeInputChangeEvent = CustomEvent<CVCodeInputValueDetail>
export type CVCodeInputCompleteEvent = CustomEvent<CVCodeInputValueDetail>

export interface CVCodeInputEventMap {
  'cv-input': CVCodeInputInputEvent
  'cv-change': CVCodeInputChangeEvent
  'cv-complete': CVCodeInputCompleteEvent
}

let cvCodeInputNonce = 0

export class CVCodeInput extends FormAssociatedReatomElement {
  static elementName = 'cv-code-input'

  static get properties() {
    return {
      value: {type: String},
      length: {type: Number},
      purpose: {type: String, reflect: true},
      charset: {type: String, reflect: true},
      mask: {type: Boolean, reflect: true},
      disabled: {type: Boolean, reflect: true},
      readonly: {type: Boolean, reflect: true},
      required: {type: Boolean, reflect: true},
      invalid: {type: Boolean, reflect: true},
      name: {type: String},
      autocomplete: {type: String},
    }
  }

  declare value: string
  declare length: number
  declare purpose: CodeInputPurpose
  declare charset: CodeInputCharset
  declare mask: boolean
  declare disabled: boolean
  declare readonly: boolean
  declare required: boolean
  declare invalid: boolean
  declare name: string
  declare autocomplete: string

  private readonly idBase = `cv-code-input-${++cvCodeInputNonce}`
  private model: CodeInputModel
  private valueOnFocus = ''
  private defaultValue = ''
  private didCaptureDefaultValue = false

  constructor() {
    super()
    this.value = ''
    this.length = 6
    this.purpose = 'otp'
    this.charset = 'numeric'
    this.mask = false
    this.disabled = false
    this.readonly = false
    this.required = false
    this.invalid = false
    this.name = ''
    this.autocomplete = ''
    this.model = this.createModel()
  }

  static styles = [
    css`
      :host {
        display: inline-block;
        --_cv-code-input-size: 40px;
        --_cv-code-input-gap: var(--cv-space-2, 8px);
        --_cv-code-input-border-radius: var(--cv-radius-sm, 6px);
        --_cv-code-input-border-color: var(--cv-color-border, #2a3245);
        --_cv-code-input-background: var(--cv-color-surface, #141923);
        --_cv-code-input-color: var(--cv-color-text, #e8ecf6);
      }

      [part='group'] {
        display: inline-flex;
        gap: var(--_cv-code-input-gap);
        align-items: center;
      }

      [part='input'] {
        box-sizing: border-box;
        inline-size: var(--_cv-code-input-size);
        block-size: var(--_cv-code-input-size);
        border: 1px solid var(--_cv-code-input-border-color);
        border-radius: var(--_cv-code-input-border-radius);
        background: var(--_cv-code-input-background);
        color: var(--_cv-code-input-color);
        font: inherit;
        font-variant-numeric: tabular-nums;
        text-align: center;
        outline: none;
      }

      [part='input']:focus-visible {
        box-shadow: 0 0 0 2px var(--cv-color-primary, #65d7ff);
      }

      :host([invalid]) [part='input'] {
        border-color: var(--cv-color-danger, #ef4444);
      }

      :host([disabled]) [part='input'] {
        opacity: 0.55;
        cursor: not-allowed;
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

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('purpose') ||
      changedProperties.has('charset') ||
      changedProperties.has('mask') ||
      changedProperties.has('autocomplete') ||
      changedProperties.has('name')
    ) {
      this.model = this.createModel()
      this.syncValueFromModel()
      this.syncFormAssociatedState()
      return
    }

    if (changedProperties.has('length')) {
      this.model.actions.setLength(this.length)
      this.syncValueFromModel()
    }

    if (changedProperties.has('value') && this.model.state.value() !== (this.value ?? '')) {
      this.model.actions.setValue(this.value ?? '')
      this.syncValueFromModel()
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

    this.syncFormAssociatedState()
  }

  protected override onFormDisabledChanged(_disabled: boolean): void {
    this.model.actions.setDisabled(this.isEffectivelyDisabled())
  }

  protected override onFormReset(): void {
    this.value = this.defaultValue
    this.model.actions.setValue(this.defaultValue)
    this.syncValueFromModel()
  }

  protected override onFormStateRestore(state: string | File | FormData | null): void {
    if (typeof state !== 'string') return
    this.value = state
    this.model.actions.setValue(state)
    this.syncValueFromModel()
  }

  override focus(options?: FocusOptions): void {
    const input = this.getInputAt(this.model.state.activeIndex())
    if (input) {
      input.focus(options)
      return
    }
    super.focus(options)
  }

  protected override isFormAssociatedDisabled(): boolean {
    return this.isEffectivelyDisabled()
  }

  protected override getFormAssociatedValue(): string | File | FormData | null {
    return this.model.state.value()
  }

  protected override getFormAssociatedValidity(): FormAssociatedValidity {
    if (this.invalid) {
      return {
        flags: {customError: true},
        message: 'Invalid value',
      }
    }

    if (this.required && !this.model.state.isComplete()) {
      return {
        flags: {valueMissing: true},
        message: 'Please fill out this field.',
      }
    }

    return {flags: {}}
  }

  private createModel(): CodeInputModel {
    return createCodeInput({
      idBase: this.idBase,
      value: this.value,
      length: this.length,
      purpose: this.purpose,
      charset: this.charset,
      mask: this.mask,
      disabled: this.isEffectivelyDisabled(),
      readonly: this.readonly,
      required: this.required,
      autocomplete: this.autocomplete || undefined,
      name: this.name,
    })
  }

  private isEffectivelyDisabled(): boolean {
    return this.disabled || this.formDisabled
  }

  private getEventIndex(event: Event): number {
    const target = event.currentTarget as HTMLElement
    const index = Number(target.dataset.index)
    return Number.isFinite(index) ? index : 0
  }

  private getInputAt(index: number): HTMLInputElement | null {
    return this.renderRoot.querySelector(`[part='input'][data-index='${index}']`)
  }

  private syncValueFromModel(): void {
    const nextValue = this.model.state.value()
    if (this.value !== nextValue) {
      this.value = nextValue
    }
  }

  private dispatchValueEvent(name: 'cv-input' | 'cv-change' | 'cv-complete'): void {
    this.dispatchEvent(
      new CustomEvent<CVCodeInputValueDetail>(name, {
        detail: {
          value: this.model.state.value(),
          complete: this.model.state.isComplete(),
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private syncAfterUserInput(previousValue: string): void {
    this.syncValueFromModel()
    this.syncFormAssociatedState()
    this.requestUpdate()
    if (this.model.state.value() !== previousValue) {
      this.dispatchValueEvent('cv-input')
      if (this.model.state.isComplete()) {
        this.dispatchValueEvent('cv-complete')
      }
    }
    void this.updateComplete.then(() => this.focus())
  }

  private handleNativeInput(event: Event) {
    const previousValue = this.model.state.value()
    const inputEvent = event as InputEvent
    const target = event.currentTarget as HTMLInputElement
    this.model.actions.inputAt(this.getEventIndex(event), inputEvent.data ?? target.value)
    this.syncAfterUserInput(previousValue)
  }

  private handleNativePaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text') ?? ''
    if (!text) return
    event.preventDefault()
    const previousValue = this.model.state.value()
    this.model.actions.inputAt(this.getEventIndex(event), text)
    this.syncAfterUserInput(previousValue)
  }

  private handleNativeFocus(event: FocusEvent) {
    const previousTarget = event.relatedTarget
    if (!(previousTarget instanceof Node) || !this.renderRoot.contains(previousTarget)) {
      this.valueOnFocus = this.model.state.value()
    }
    this.model.actions.setActiveIndex(this.getEventIndex(event))
  }

  private handleNativeBlur(event: FocusEvent) {
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && this.renderRoot.contains(nextTarget)) return

    const currentValue = this.model.state.value()
    if (currentValue !== this.valueOnFocus) {
      this.dispatchValueEvent('cv-change')
    }
  }

  private handleNativeKeyDown(event: KeyboardEvent) {
    const index = this.getEventIndex(event)
    const previousValue = this.model.state.value()

    if (event.key === 'Backspace') {
      event.preventDefault()
      this.model.actions.backspaceAt(index)
      this.syncAfterUserInput(previousValue)
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      this.model.actions.moveBy(-1)
      void this.updateComplete.then(() => this.focus())
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      this.model.actions.moveBy(1)
      void this.updateComplete.then(() => this.focus())
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      this.model.actions.moveFirst()
      void this.updateComplete.then(() => this.focus())
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      this.model.actions.moveLast()
      void this.updateComplete.then(() => this.focus())
    }
  }

  protected override render() {
    const groupProps = this.model.contracts.getGroupProps()
    const length = this.model.state.length()

    return html`
      <div
        part="group"
        role=${groupProps.role}
        aria-disabled=${groupProps['aria-disabled'] ?? nothing}
        aria-readonly=${groupProps['aria-readonly'] ?? nothing}
      >
        ${Array.from({length}, (_, index) => {
          const props = this.model.contracts.getInputProps(index)
          return html`
            <input
              id=${props.id}
              part="input"
              data-index=${String(index)}
              type=${props.type}
              inputmode=${props.inputmode}
              autocomplete=${props.autocomplete ?? nothing}
              maxlength=${props.maxlength}
              tabindex=${props.tabindex}
              aria-label=${props['aria-label']}
              aria-disabled=${props['aria-disabled'] ?? nothing}
              aria-readonly=${props['aria-readonly'] ?? nothing}
              aria-required=${props['aria-required'] ?? nothing}
              aria-invalid=${this.invalid ? 'true' : nothing}
              ?disabled=${props.disabled}
              ?readonly=${props.readonly}
              ?required=${props.required}
              .value=${live(props.value)}
              @input=${this.handleNativeInput}
              @paste=${this.handleNativePaste}
              @focus=${this.handleNativeFocus}
              @blur=${this.handleNativeBlur}
              @keydown=${this.handleNativeKeyDown}
            />
          `
        })}
      </div>
    `
  }
}
