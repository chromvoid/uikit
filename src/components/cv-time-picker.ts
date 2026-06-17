import {css, html} from 'lit'
import type {PropertyValues} from 'lit'

import {FormAssociatedReatomElement} from '../form-associated/FormAssociatedReatomElement'
import type {FormAssociatedValidity} from '../form-associated/withFormAssociated'
import {
  createTimePickerModel,
  isValidTimeValue,
  normalizeMinuteStep,
  type CVTimePickerModel,
  type CVTimePickerSource,
  type CVTimePickerStateChange,
} from './cv-time-picker.model'

export interface CVTimePickerInputEventDetail {
  value: string
  inputValue: string
  invalid: boolean
  source: CVTimePickerSource
}

export interface CVTimePickerChangeEventDetail {
  value: string
  previousValue: string
  source: CVTimePickerSource
}

export type CVTimePickerInputEvent = CustomEvent<CVTimePickerInputEventDetail>
export type CVTimePickerChangeEvent = CustomEvent<CVTimePickerChangeEventDetail>

type CVTimePickerSize = 'small' | 'medium' | 'large'

let cvTimePickerNonce = 0

export class CVTimePicker extends FormAssociatedReatomElement {
  static elementName = 'cv-time-picker'

  static get properties() {
    return {
      name: {type: String},
      value: {type: String, reflect: true},
      disabled: {type: Boolean, reflect: true},
      readonly: {type: Boolean, reflect: true},
      required: {type: Boolean, reflect: true},
      placeholder: {type: String},
      size: {type: String, reflect: true},
      min: {type: String},
      max: {type: String},
      minuteStep: {type: Number, attribute: 'minute-step'},
      hourCycle: {type: Number, attribute: 'hour-cycle'},
      ariaLabel: {type: String, attribute: 'aria-label'},
      inputInvalid: {type: Boolean, attribute: 'input-invalid', reflect: true},
      hasValue: {type: Boolean, attribute: 'has-value', reflect: true},
    }
  }

  declare name: string
  declare value: string
  declare disabled: boolean
  declare readonly: boolean
  declare required: boolean
  declare placeholder: string
  declare size: CVTimePickerSize
  declare min: string
  declare max: string
  declare minuteStep: number
  declare hourCycle: 12 | 24
  declare ariaLabel: string
  declare inputInvalid: boolean
  declare hasValue: boolean

  private readonly idBase = `cv-time-picker-${++cvTimePickerNonce}`
  private readonly model: CVTimePickerModel
  private defaultValue = ''
  private didCaptureDefaultValue = false

  constructor() {
    super()
    this.name = ''
    this.value = ''
    this.disabled = false
    this.readonly = false
    this.required = false
    this.placeholder = 'Select time'
    this.size = 'medium'
    this.min = ''
    this.max = ''
    this.minuteStep = 1
    this.hourCycle = 24
    this.ariaLabel = ''
    this.inputInvalid = false
    this.hasValue = false
    this.model = createTimePickerModel(this.idBase)
  }

  static styles = [
    css`
      :host {
        display: inline-block;
        inline-size: var(--cv-time-picker-inline-size, 180px);
      }

      [part='base'] {
        display: flex;
        align-items: center;
        gap: var(--cv-space-2, 8px);
        min-block-size: var(--cv-time-picker-min-block-size, 36px);
        padding: var(--cv-time-picker-padding-block, var(--cv-space-2, 8px))
          var(--cv-time-picker-padding-inline, var(--cv-space-3, 12px));
        border: 1px solid var(--cv-time-picker-border-color, var(--cv-color-border, #2a3245));
        border-radius: var(--cv-time-picker-radius, var(--cv-radius-md, 10px));
        background: var(--cv-time-picker-background, var(--cv-color-surface, #141923));
      }

      :host([input-invalid]) [part='base'] {
        border-color: var(--cv-color-danger, #ff6b6b);
      }

      [part='input'] {
        min-inline-size: 0;
        flex: 1 1 auto;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--cv-color-text, #e8ecf6);
        font: inherit;
      }

      [part='input']::placeholder {
        color: var(--cv-color-text-muted, #9aa6bd);
      }

      [part='controls'] {
        display: inline-grid;
        gap: 1px;
      }

      [part='step-button'],
      [part='clear-button'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: var(--cv-radius-xs, 4px);
        background: transparent;
        color: var(--cv-color-text-muted, #9aa6bd);
        font: inherit;
        cursor: pointer;
      }

      [part='step-button']:disabled,
      [part='clear-button']:disabled {
        cursor: default;
        opacity: 0.5;
      }

      [part='step-button']:focus-visible,
      [part='clear-button']:focus-visible,
      [part='input']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 2px;
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
    this.syncModelConfig()
    this.syncHostStateFromModel()
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)
    if (
      changedProperties.has('value') ||
      changedProperties.has('disabled') ||
      changedProperties.has('readonly') ||
      changedProperties.has('required') ||
      changedProperties.has('min') ||
      changedProperties.has('max') ||
      changedProperties.has('minuteStep')
    ) {
      this.syncModelConfig()
      this.syncHostStateFromModel()
      this.syncFormAssociatedState()
    }
  }

  protected override onFormDisabledChanged(_disabled: boolean): void {
    this.syncModelConfig()
    this.syncFormAssociatedState()
  }

  protected override onFormReset(): void {
    this.value = this.defaultValue
    this.syncModelConfig()
    this.syncHostStateFromModel()
  }

  protected override onFormStateRestore(state: string | File | FormData | null): void {
    if (typeof state !== 'string') return
    this.value = state
    this.syncModelConfig()
    this.syncHostStateFromModel()
  }

  protected override isFormAssociatedDisabled(): boolean {
    return this.isEffectivelyDisabled()
  }

  protected override getFormAssociatedValue(): string | File | FormData | null {
    return this.isEffectivelyDisabled() ? null : this.value || null
  }

  protected override getFormAssociatedValidity(): FormAssociatedValidity {
    if (this.inputInvalid) {
      return {flags: {badInput: true}, message: 'Please enter a valid time.'}
    }
    if (this.required && !this.value) {
      return {flags: {valueMissing: true}, message: 'Please fill out this field.'}
    }
    return {flags: {}}
  }

  protected override render() {
    const interactive = !this.isEffectivelyDisabled() && !this.readonly
    return html`
      <div part="base">
        <input
          part="input"
          id=${this.idBase}
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder=${this.placeholder}
          aria-label=${this.ariaLabel || this.placeholder}
          aria-invalid=${this.inputInvalid ? 'true' : 'false'}
          .value=${this.model.state.inputValue()}
          ?disabled=${this.isEffectivelyDisabled()}
          ?readonly=${this.readonly}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @blur=${this.handleBlur}
          @keydown=${this.handleKeydown}
        />
        <span part="controls" aria-hidden=${interactive ? 'false' : 'true'}>
          <button part="step-button" type="button" ?disabled=${!interactive} @click=${this.handleIncrement}>
            ▲
          </button>
          <button part="step-button" type="button" ?disabled=${!interactive} @click=${this.handleDecrement}>
            ▼
          </button>
        </span>
        <button
          part="clear-button"
          type="button"
          aria-label="Clear time"
          ?disabled=${!interactive || !this.hasValue}
          @click=${this.handleClear}
        >
          ×
        </button>
      </div>
    `
  }

  private syncModelConfig() {
    this.model.actions.setConfig({
      value: this.value,
      min: isValidTimeValue(this.min) ? this.min : '',
      max: isValidTimeValue(this.max) ? this.max : '',
      minuteStep: normalizeMinuteStep(this.minuteStep),
      disabled: this.isEffectivelyDisabled(),
      readonly: this.readonly,
      required: this.required,
    })
  }

  private syncHostStateFromModel() {
    const nextValue = this.model.state.value()
    if (this.value !== nextValue) this.value = nextValue
    this.inputInvalid = this.model.state.invalid()
    this.hasValue = this.model.state.hasValue()
    this.syncFormAssociatedState()
  }

  private handleInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const change = this.model.actions.setInput(input.value, 'input')
    this.inputInvalid = change.invalid
    this.dispatchInput(change)
  }

  private handleChange() {
    this.commit('input')
  }

  private handleBlur() {
    this.commit('input')
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (event.key === 'Enter') {
      event.preventDefault()
      this.commit('input')
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.step(1)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.step(-1)
    }
  }

  private handleIncrement() {
    this.step(1)
  }

  private handleDecrement() {
    this.step(-1)
  }

  private handleClear() {
    const change = this.model.actions.clear()
    this.applyChange(change)
  }

  private commit(source: CVTimePickerSource) {
    const change = this.model.actions.commit(source)
    this.applyChange(change)
  }

  private step(direction: -1 | 1) {
    if (this.isEffectivelyDisabled() || this.readonly) return
    const change = this.model.actions.step(direction)
    this.applyChange(change)
  }

  private applyChange(change: CVTimePickerStateChange) {
    this.dispatchInput(change)
    this.syncHostStateFromModel()
    if (change.previousValue !== change.value) {
      this.dispatchChange(change)
    }
  }

  private dispatchInput(change: CVTimePickerStateChange) {
    this.dispatchEvent(
      new CustomEvent<CVTimePickerInputEventDetail>('cv-input', {
        detail: {
          value: change.value,
          inputValue: change.inputValue,
          invalid: change.invalid,
          source: change.source,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(change: CVTimePickerStateChange) {
    this.dispatchEvent(
      new CustomEvent<CVTimePickerChangeEventDetail>('cv-change', {
        detail: {
          value: change.value,
          previousValue: change.previousValue,
          source: change.source,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private isEffectivelyDisabled(): boolean {
    return this.disabled || this.formDisabled
  }
}
