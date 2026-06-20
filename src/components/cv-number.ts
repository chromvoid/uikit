import {createNumber, type NumberModel} from '@chromvoid/headless-ui/number'
import {css, html, nothing} from 'lit'
import type {PropertyValues} from 'lit'
import {live} from 'lit/directives/live.js'

import {FormAssociatedReatomElement} from '../form-associated/FormAssociatedReatomElement'
import type {FormAssociatedValidity} from '../form-associated/withFormAssociated'
import {getNumberValidityState, hasNumberValidityErrors} from './cv-number-validity'
import {hasTextEditableFocus} from './focus-utils'

type CVNumberSize = 'small' | 'medium' | 'large'
type CVNumberVariant = 'outlined' | 'filled'

export interface CVNumberValueDetail {
  value: number
}

export type CVNumberChangeEvent = CustomEvent<CVNumberValueDetail>
export type CVNumberClearEvent = CustomEvent<Record<string, never>>
export type CVNumberFocusEvent = CustomEvent<Record<string, never>>
export type CVNumberBlurEvent = CustomEvent<Record<string, never>>

export interface CVNumberEventMap {
  'cv-change': CVNumberChangeEvent
  'cv-clear': CVNumberClearEvent
  'cv-focus': CVNumberFocusEvent
  'cv-blur': CVNumberBlurEvent
}

let cvNumberNonce = 0
const SWIPE_STEP_THRESHOLD_PX = 34
const WHEEL_STEP_THRESHOLD_PX = 48
const WHEEL_LINE_HEIGHT_PX = 16
const WHEEL_PAGE_HEIGHT_PX = 800
const MAX_WHEEL_STEPS_PER_EVENT = 4
const WHEEL_RESET_DELAY_MS = 180
const STEPPER_FEEDBACK_DURATION_MS = 140
const TOUCH_VIBRATION_DURATION_MS = 6
const TOUCH_VIBRATION_THROTTLE_MS = 80
const LONG_PRESS_DELAY_MS = 420
const LONG_PRESS_INITIAL_INTERVAL_MS = 150
const LONG_PRESS_MIN_INTERVAL_MS = 55
const LONG_PRESS_ACCELERATION = 0.82

type StepDirection = -1 | 1
type StepSource = 'click' | 'long-press' | 'swipe' | 'wheel'

export class CVNumber extends FormAssociatedReatomElement {
  static elementName = 'cv-number'
  static override hostDisplay = 'inline-block' as const

  static get properties() {
    return {
      value: {type: Number},
      defaultValue: {type: Number, attribute: 'default-value'},
      min: {type: Number},
      max: {type: Number},
      step: {type: Number},
      largeStep: {type: Number, attribute: 'large-step'},
      name: {type: String},
      disabled: {type: Boolean, reflect: true},
      readOnly: {type: Boolean, attribute: 'read-only', reflect: true},
      required: {type: Boolean, reflect: true},
      clearable: {type: Boolean, reflect: true},
      stepper: {type: Boolean, reflect: true},
      placeholder: {type: String},
      size: {type: String, reflect: true},
      variant: {type: String, reflect: true},
      invalid: {type: Boolean, reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
      ariaLabelledBy: {type: String, attribute: 'aria-labelledby'},
      ariaDescribedBy: {type: String, attribute: 'aria-describedby'},
    }
  }

  declare value: number
  declare defaultValue: number | undefined
  declare min: number | undefined
  declare max: number | undefined
  declare step: number
  declare largeStep: number
  declare name: string
  declare disabled: boolean
  declare readOnly: boolean
  declare required: boolean
  declare clearable: boolean
  declare stepper: boolean
  declare placeholder: string
  declare size: CVNumberSize
  declare variant: CVNumberVariant
  declare invalid: boolean
  declare ariaLabel: string
  declare ariaLabelledBy: string
  declare ariaDescribedBy: string

  private readonly idBase = `cv-number-${++cvNumberNonce}`
  private model!: NumberModel
  private modelInitialized = false
  private _valueOnFocus: number | null = null
  private customValidityMessage = ''
  private initialValueSnapshot = 0
  private hasInitialValueSnapshot = false
  private swipePointerId: number | null = null
  private swipePointerTarget: HTMLElement | null = null
  private swipeStartX = 0
  private swipeStartY = 0
  private swipeStepOriginX = 0
  private swipeAxisLocked = false
  private wheelAccumulator = 0
  private wheelDirection: StepDirection | 0 = 0
  private wheelResetTimer: ReturnType<typeof setTimeout> | null = null
  private stepperPressPointerId: number | null = null
  private stepperPressPointerTarget: HTMLElement | null = null
  private stepperPressPointerType = ''
  private stepperPressDirection: StepDirection | 0 = 0
  private stepperPressRepeated = false
  private stepperPressTimer: ReturnType<typeof setTimeout> | null = null
  private stepperPressIntervalMs = LONG_PRESS_INITIAL_INTERVAL_MS
  private suppressNextStepperClick = false
  private stepperFeedbackTimer: ReturnType<typeof setTimeout> | null = null
  private lastTouchVibrationAt = 0

  constructor() {
    super()
    this.value = 0
    this.defaultValue = undefined
    this.min = undefined
    this.max = undefined
    this.step = 1
    this.largeStep = 10
    this.name = ''
    this.disabled = false
    this.readOnly = false
    this.required = false
    this.clearable = false
    this.stepper = false
    this.placeholder = ''
    this.size = 'medium'
    this.variant = 'outlined'
    this.invalid = false
    this.ariaLabel = ''
    this.ariaLabelledBy = ''
    this.ariaDescribedBy = ''
  }

  static styles = [
    css`
      :host {
        --cv-number-height: 36px;
        --cv-number-padding-inline: var(--cv-space-3, 12px);
        --cv-number-font-size: var(--cv-font-size-base, 14px);
        --cv-number-border-radius: var(--cv-radius-sm, 6px);
        --cv-number-border-color: var(--cv-color-border, #2a3245);
        --cv-number-background: transparent;
        --cv-number-color: var(--cv-color-text, #e8ecf6);
        --cv-number-placeholder-color: var(--cv-color-text-muted, #6b7a99);
        --cv-number-focus-ring: 0 0 0 2px var(--cv-color-primary, #65d7ff);
        --cv-number-icon-size: 1em;
        --cv-number-gap: var(--cv-space-2, 8px);
        --cv-number-transition-duration: var(--cv-duration-fast, 120ms);
        --cv-number-stepper-width: 28px;
        --cv-number-stepper-button-inline-size: var(--cv-number-stepper-width, 28px);
        --cv-number-stepper-button-gap: 2px;
      }

      [part='base'] {
        gap: var(--cv-number-gap);
        padding-inline: var(--cv-number-padding-inline);
        height: var(--cv-number-height);
        min-width: 0;
        font-size: var(--cv-number-font-size);
        border-radius: var(--cv-number-border-radius);
        border: 1px solid var(--cv-number-border-color);
        background: var(--cv-number-background);
        color: var(--cv-number-color);
        cursor: text;
        transition:
          border-color var(--cv-number-transition-duration) var(--cv-easing-standard, ease),
          background var(--cv-number-transition-duration) var(--cv-easing-standard, ease),
          box-shadow var(--cv-number-transition-duration) var(--cv-easing-standard, ease);
        box-sizing: border-box;
        width: 100%;
      }

      [part='input'] {
        width: 100%;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        color: inherit;
        font: inherit;
        padding: 0;
        margin: 0;
        font-variant-numeric: tabular-nums;
      }

      [part='input']::placeholder {
        color: var(--cv-number-placeholder-color);
      }

      [part='prefix'],
      [part='suffix'],
      [part='clear-button'] {
        font-size: var(--cv-number-icon-size);
      }

      [part='clear-button'] {
        cursor: pointer;
        user-select: none;
      }

      [part='stepper'] {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        align-self: center;
        gap: var(--cv-number-stepper-button-gap);
        min-inline-size: 0;
        max-block-size: 100%;
      }

      [part='increment'],
      [part='decrement'] {
        display: grid;
        place-items: center;
        appearance: none;
        inline-size: var(--cv-number-stepper-button-inline-size);
        min-inline-size: var(--cv-number-stepper-button-inline-size);
        block-size: max(22px, calc(var(--cv-number-height) - 8px));
        max-block-size: calc(var(--cv-number-height) - 4px);
        min-block-size: 0;
        box-sizing: border-box;
        font: inherit;
        font-size: 0.86em;
        font-weight: 700;
        border-radius: 4px;
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface-elevated, #1d2432);
        color: var(--cv-color-text, #e8ecf6);
        padding: 0;
        line-height: 1;
        cursor: pointer;
        touch-action: manipulation;
        transition:
          border-color var(--cv-number-transition-duration) var(--cv-easing-standard, ease),
          background var(--cv-number-transition-duration) var(--cv-easing-standard, ease),
          color var(--cv-number-transition-duration) var(--cv-easing-standard, ease),
          opacity var(--cv-number-transition-duration) var(--cv-easing-standard, ease),
          transform var(--cv-number-transition-duration) var(--cv-easing-standard, ease),
          box-shadow var(--cv-number-transition-duration) var(--cv-easing-standard, ease);
      }

      [part='increment']:hover,
      [part='decrement']:hover {
        border-color: var(--cv-color-primary-border-strong, var(--cv-color-primary, #65d7ff));
        background: var(--cv-color-surface-hover, rgba(101, 215, 255, 0.1));
      }

      [part='increment']:active,
      [part='decrement']:active {
        background: var(--cv-color-active, rgba(101, 215, 255, 0.18));
        transform: translateY(1px);
      }

      [part='increment']:focus-visible,
      [part='decrement']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      [part='increment'][aria-disabled='true'],
      [part='decrement'][aria-disabled='true'] {
        opacity: 0.48;
        cursor: default;
        color: var(--cv-color-text-muted, #6b7a99);
        background: var(--cv-color-surface-secondary-glass-soft, var(--cv-color-surface-elevated, #1d2432));
        border-color: var(--cv-color-border-muted, var(--cv-color-border, #2a3245));
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
        transform: none;
      }

      :host([stepper-active='increment']) [part='increment'],
      :host([stepper-active='decrement']) [part='decrement'] {
        border-color: var(--cv-color-primary-border-strong, var(--cv-color-primary, #65d7ff));
        background: var(--cv-color-active, rgba(101, 215, 255, 0.18));
        box-shadow: 0 0 0 1px var(--cv-color-primary-border-strong, var(--cv-color-primary, #65d7ff));
      }

      :host([stepper-active='increment']) [part='increment'] {
        transform: translateY(-1px);
      }

      :host([stepper-active='decrement']) [part='decrement'] {
        transform: translateY(1px);
      }

      :host([stepper]) [part='base'] {
        touch-action: pan-y pinch-zoom;
        -webkit-tap-highlight-color: transparent;
      }

      @media (prefers-reduced-motion: reduce) {
        [part='increment'],
        [part='decrement'] {
          transition-duration: 0.01ms;
          transform: none;
        }

        :host([stepper-active='increment']) [part='increment'],
        :host([stepper-active='decrement']) [part='decrement'] {
          transform: none;
        }
      }

      :host([variant='outlined']) [part='base'] {
        border-color: var(--cv-number-border-color);
        background: var(--cv-number-background);
      }

      :host([variant='filled']) [part='base'] {
        background: var(--cv-color-surface-2, #181f2b);
        border-color: transparent;
        box-shadow: inset 0 0 0 1px
          color-mix(in oklab, var(--cv-color-border, #2a3245) 46%, var(--cv-color-surface-2, #181f2b));
      }

      :host([focused]) [part='base'] {
        box-shadow: var(--cv-number-focus-ring);
      }

      :host([invalid]) [part='base'] {
        border-color: var(--cv-color-danger, #ef4444);
      }

      :host([invalid][focused]) [part='base'] {
        box-shadow: 0 0 0 2px var(--cv-color-danger-border-strong);
      }

      :host([size='small']) {
        --cv-number-height: 30px;
        --cv-number-padding-inline: var(--cv-space-2, 8px);
        --cv-number-font-size: var(--cv-font-size-sm, 13px);
      }

      :host([size='large']) {
        --cv-number-height: 42px;
        --cv-number-padding-inline: var(--cv-space-4, 16px);
        --cv-number-font-size: var(--cv-font-size-md, 16px);
      }

      :host([disabled]) {
        pointer-events: none;
      }

      :host([disabled]) [part='base'] {
        opacity: 0.55;
        cursor: not-allowed;
      }

      :host([disabled]) [part='input'] {
        cursor: not-allowed;
      }

      :host([read-only]) [part='base'] {
        cursor: default;
      }

      :host([read-only]) [part='input'] {
        cursor: default;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  private isEffectivelyDisabled(): boolean {
    return this.disabled || this.formDisabled
  }

  protected override isFormAssociatedDisabled(): boolean {
    return this.isEffectivelyDisabled()
  }

  protected override getFormAssociatedValue(): string | File | FormData | null {
    if (!this.modelInitialized) return String(this.value)
    return String(this.model.state.value())
  }

  protected override getFormAssociatedValidity(): FormAssociatedValidity {
    const validity = getNumberValidityState({
      customValidityMessage: this.customValidityMessage,
      invalid: this.invalid,
      required: this.required,
      value: this.modelInitialized ? this.model.state.value() : this.value,
      min: this.toFiniteOrUndefined(this.min),
      max: this.toFiniteOrUndefined(this.max),
      step: this.step,
    })

    if (hasNumberValidityErrors(validity.flags)) {
      return {
        flags: validity.flags,
        message: validity.message,
        anchor: this.inputElement ?? undefined,
      }
    }

    return {flags: {}}
  }

  private get inputElement(): HTMLInputElement | null {
    return this.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null
  }

  setCustomValidity(message: string): void {
    this.customValidityMessage = message
    this.syncFormAssociatedState()
  }

  stepUp(times = 1): void {
    this.applyProgrammaticMutation(() => {
      for (let i = 0; i < this.normalizeTimes(times); i++) {
        this.model.actions.increment()
      }
    })
  }

  stepDown(times = 1): void {
    this.applyProgrammaticMutation(() => {
      for (let i = 0; i < this.normalizeTimes(times); i++) {
        this.model.actions.decrement()
      }
    })
  }

  pageUp(times = 1): void {
    this.applyProgrammaticMutation(() => {
      for (let i = 0; i < this.normalizeTimes(times); i++) {
        this.model.actions.incrementLarge()
      }
    })
  }

  pageDown(times = 1): void {
    this.applyProgrammaticMutation(() => {
      for (let i = 0; i < this.normalizeTimes(times); i++) {
        this.model.actions.decrementLarge()
      }
    })
  }

  setValue(value: number): void {
    this.applyProgrammaticMutation(() => {
      this.model.actions.setValue(value)
    })
  }

  getValue(): number {
    this.ensureModel()
    return this.model.state.value()
  }

  setRange(min: number | null | undefined, max: number | null | undefined): void {
    this.min = min ?? undefined
    this.max = max ?? undefined
  }

  private applyProgrammaticMutation(mutate: () => void): void {
    this.ensureModel()
    mutate()
    this.syncValueFromModel()
    this.syncFormAssociatedState()
    this.requestUpdate()
  }

  private normalizeTimes(value: number): number {
    if (!Number.isFinite(value)) return 1
    const normalized = Math.floor(Math.abs(value))
    return Math.max(normalized, 1)
  }

  private toFiniteOrUndefined(value: number | undefined | null): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
  }

  private createModel(): NumberModel {
    return createNumber({
      idBase: this.idBase,
      value: this.value,
      defaultValue: this.toFiniteOrUndefined(this.defaultValue),
      min: this.toFiniteOrUndefined(this.min),
      max: this.toFiniteOrUndefined(this.max),
      step: this.step,
      largeStep: this.largeStep,
      disabled: this.isEffectivelyDisabled(),
      readonly: this.readOnly,
      required: this.required,
      clearable: this.clearable,
      stepper: this.stepper,
      placeholder: this.placeholder,
      ariaLabel: this.ariaLabel || undefined,
      ariaLabelledBy: this.ariaLabelledBy || undefined,
      ariaDescribedBy: this.ariaDescribedBy || undefined,
      onClear: () => {
        this.syncValueFromModel()
        this.dispatchEvent(
          new CustomEvent<CVNumberClearEvent['detail']>('cv-clear', {
            detail: {},
            bubbles: true,
            composed: true,
          }),
        )
      },
    })
  }

  private ensureModel(): void {
    if (!this.modelInitialized) {
      this.model = this.createModel()
      this.modelInitialized = true
    }
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    // First render: create the model with all finalized properties
    if (!this.modelInitialized) {
      this.ensureModel()
      this.syncValueFromModel()
      this.reflectHostAttributes()
      this.syncFormAssociatedState()
      return
    }

    // Recreate model when immutable numeric options change after initialization.
    if (
      changedProperties.has('min') ||
      changedProperties.has('max') ||
      changedProperties.has('step') ||
      changedProperties.has('largeStep') ||
      changedProperties.has('defaultValue') ||
      changedProperties.has('ariaLabel') ||
      changedProperties.has('ariaLabelledBy') ||
      changedProperties.has('ariaDescribedBy')
    ) {
      // Recreating the model drops the in-flight draft text and the `focused`
      // flag. Preserve both so a config change (e.g. min/max) mid-edit does not
      // wipe the user's typing or drop the focus ring while DOM focus is live.
      const preservedDraft = this.model.state.draftText()
      const preservedFocused = this.model.state.focused()
      this.model = this.createModel()
      if (preservedDraft !== null) {
        this.model.actions.setDraftText(preservedDraft)
      }
      if (preservedFocused) {
        this.model.actions.setFocused(true)
      }
      this.syncValueFromModel()
      this.syncFormAssociatedState()
      this.reflectHostAttributes()
      return
    }

    // Sync mutable state to headless
    if (changedProperties.has('value') && this.model.state.value() !== this.value) {
      this.model.actions.setValue(this.value)
      this.syncValueFromModel()
    }

    if (changedProperties.has('disabled')) {
      this.model.actions.setDisabled(this.isEffectivelyDisabled())
    }

    if (changedProperties.has('readOnly')) {
      this.model.actions.setReadOnly(this.readOnly)
    }

    if (changedProperties.has('required')) {
      this.model.actions.setRequired(this.required)
    }

    if (changedProperties.has('clearable')) {
      this.model.actions.setClearable(this.clearable)
    }

    if (changedProperties.has('stepper')) {
      this.model.actions.setStepper(this.stepper)
    }

    if (changedProperties.has('placeholder')) {
      this.model.actions.setPlaceholder(this.placeholder)
    }

    this.reflectHostAttributes()
    this.syncFormAssociatedState()
  }

  private reflectHostAttributes(): void {
    this.toggleAttribute('focused', this.model.state.focused())
    this.toggleAttribute('filled', this.model.state.filled())
  }

  private syncValueFromModel(): void {
    const nextValue = this.model.state.value()
    if (this.value !== nextValue) {
      this.value = nextValue
    }
  }

  protected override onFormDisabledChanged(_disabled: boolean): void {
    if (!this.modelInitialized) return
    this.model.actions.setDisabled(this.isEffectivelyDisabled())
  }

  protected override onFormReset(): void {
    if (!this.modelInitialized) return
    this.model.actions.setValue(this.initialValueSnapshot)
    this.syncValueFromModel()
  }

  protected override onFormStateRestore(state: string | File | FormData | null): void {
    if (typeof state !== 'string') return
    if (!this.modelInitialized) return
    const parsed = Number(state)
    if (!Number.isFinite(parsed)) return
    this.model.actions.setValue(parsed)
    this.syncValueFromModel()
  }

  get type(): string {
    return 'cv-number'
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasInitialValueSnapshot) {
      this.initialValueSnapshot = this.value
      this.hasInitialValueSnapshot = true
    }
    this.addEventListener('pointerdown', this.handleHostPointerDown)
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('pointerdown', this.handleHostPointerDown)
    this.resetWheelGesture()
    this.resetSwipeGesture()
    this.resetStepperPress(undefined, false)
    this.clearStepperFeedback()
  }

  // A tap on the shell padding hits non-editable content, so the WebView
  // hides the IME before focus reaches the inner input — a visible keyboard
  // flash when moving between fields. Claim the tap and focus the input
  // synchronously instead, so the IME sees an input-to-input transition.
  // Only intercepts while some field already holds focus: with the keyboard
  // down, the default flow must stay intact (a scroll gesture starting on the
  // field must not pop the keyboard open).
  private handleHostPointerDown = (event: PointerEvent): void => {
    if (this.isEffectivelyDisabled()) return
    if (!hasTextEditableFocus()) return

    const input = this.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null
    if (!input || event.composedPath().includes(input)) return

    event.preventDefault()
    try {
      input.focus({preventScroll: true})
    } catch {
      input.focus()
    }
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

  private handleNativeInput(event: Event) {
    const target = event.target as HTMLInputElement
    this.model.actions.handleInput(target.value)
    this.requestUpdate()
  }

  private handleNativeFocus() {
    this._valueOnFocus = this.model.state.value()
    this.model.actions.setFocused(true)
    this.requestUpdate()
    this.dispatchEvent(
      new CustomEvent<CVNumberFocusEvent['detail']>('cv-focus', {
        detail: {},
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleNativeBlur() {
    this.model.actions.setFocused(false)
    this.syncValueFromModel()
    this.requestUpdate()

    this.dispatchEvent(
      new CustomEvent<CVNumberBlurEvent['detail']>('cv-blur', {
        detail: {},
        bubbles: true,
        composed: true,
      }),
    )

    const valueAfterCommit = this.model.state.value()
    if (this._valueOnFocus !== null && valueAfterCommit !== this._valueOnFocus) {
      this.dispatchEvent(
        new CustomEvent<CVNumberChangeEvent['detail']>('cv-change', {
          detail: {value: valueAfterCommit},
          bubbles: true,
          composed: true,
        }),
      )
    }

    this._valueOnFocus = null
  }

  private handleNativeKeyDown(event: KeyboardEvent) {
    // Respect upstream handling and avoid hijacking browser/OS shortcuts
    // (e.g. Ctrl+ArrowUp, Cmd+Home). Modifier-laden navigation keys must fall
    // through to the platform.
    if (event.defaultPrevented) return
    if (event.ctrlKey || event.metaKey || event.altKey) return

    const previousValue = this.model.state.value()
    this.model.actions.handleKeyDown(event)
    this.syncValueFromModel()
    this.requestUpdate()

    const newValue = this.model.state.value()

    if (event.key === 'Enter') {
      if (newValue !== previousValue) {
        this.dispatchEvent(
          new CustomEvent<CVNumberChangeEvent['detail']>('cv-change', {
            detail: {value: newValue},
            bubbles: true,
            composed: true,
          }),
        )
      }
    } else if (
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'PageUp' ||
      event.key === 'PageDown' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      if (newValue !== previousValue) {
        this.dispatchEvent(
          new CustomEvent<CVNumberChangeEvent['detail']>('cv-change', {
            detail: {value: newValue},
            bubbles: true,
            composed: true,
          }),
        )
      }
    }
    // Escape is handled by the onClear callback in the model
  }

  private dispatchChange(value: number): void {
    this.dispatchEvent(
      new CustomEvent<CVNumberChangeEvent['detail']>('cv-change', {
        detail: {value},
        bubbles: true,
        composed: true,
      }),
    )
  }

  private applyUserStepDelta(delta: number): boolean {
    if (!Number.isFinite(delta) || delta === 0) return false
    if (!this.canUseStepperGesture()) return false

    const previousValue = this.model.state.value()
    const times = Math.abs(Math.trunc(delta))
    if (times === 0) return false

    for (let i = 0; i < times; i++) {
      if (delta > 0) {
        this.model.actions.increment()
      } else {
        this.model.actions.decrement()
      }
    }

    this.syncValueFromModel()
    this.requestUpdate()

    const newValue = this.model.state.value()
    if (newValue !== previousValue) {
      this.dispatchChange(newValue)
      return true
    }

    return false
  }

  private canUseStepperGesture(): boolean {
    return this.stepper && !this.isEffectivelyDisabled() && !this.readOnly
  }

  private canUseDesktopWheelGesture(): boolean {
    if (!this.canUseStepperGesture()) return false
    if (typeof window.matchMedia !== 'function') return true
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
  }

  private handleBaseWheel(event: WheelEvent): void {
    if (event.defaultPrevented) return
    if (!this.canUseDesktopWheelGesture()) return
    if (!this.model.state.focused()) return
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
    if (!Number.isFinite(event.deltaY) || event.deltaY === 0) return
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return

    const normalizedDeltaY = this.normalizeWheelDeltaY(event)
    if (!Number.isFinite(normalizedDeltaY) || normalizedDeltaY === 0) return

    event.preventDefault()
    const direction: StepDirection = normalizedDeltaY < 0 ? 1 : -1

    if (this.wheelDirection !== direction) {
      this.wheelAccumulator = 0
      this.wheelDirection = direction
    }

    this.wheelAccumulator += Math.abs(normalizedDeltaY)
    this.scheduleWheelReset()

    const rawSteps = Math.trunc(this.wheelAccumulator / WHEEL_STEP_THRESHOLD_PX)
    if (rawSteps === 0) return

    const steps = Math.min(rawSteps, MAX_WHEEL_STEPS_PER_EVENT)
    this.wheelAccumulator -= steps * WHEEL_STEP_THRESHOLD_PX
    if (rawSteps > MAX_WHEEL_STEPS_PER_EVENT) {
      this.wheelAccumulator = 0
    }

    if (this.applyUserStepDelta(direction * steps)) {
      this.showStepperFeedback(direction, 'wheel')
    }
  }

  private normalizeWheelDeltaY(event: WheelEvent): number {
    if (event.deltaMode === 1) return event.deltaY * WHEEL_LINE_HEIGHT_PX
    if (event.deltaMode === 2) return event.deltaY * WHEEL_PAGE_HEIGHT_PX
    return event.deltaY
  }

  private scheduleWheelReset(): void {
    if (this.wheelResetTimer !== null) {
      clearTimeout(this.wheelResetTimer)
    }

    this.wheelResetTimer = setTimeout(() => this.resetWheelGesture(), WHEEL_RESET_DELAY_MS)
  }

  private resetWheelGesture(): void {
    if (this.wheelResetTimer !== null) {
      clearTimeout(this.wheelResetTimer)
    }

    this.wheelResetTimer = null
    this.wheelAccumulator = 0
    this.wheelDirection = 0
  }

  private getPointerId(event: PointerEvent): number {
    return Number.isFinite(event.pointerId) ? event.pointerId : 1
  }

  private trySetPointerCapture(target: HTMLElement | null, pointerId: number): void {
    try {
      target?.setPointerCapture?.(pointerId)
    } catch {
      // Synthetic PointerEvents in tests may not register an active pointer.
    }
  }

  private tryReleasePointerCapture(target: HTMLElement | null, pointerId: number): void {
    try {
      target?.releasePointerCapture?.(pointerId)
    } catch {
      // Release is best-effort because the pointer may already be cancelled.
    }
  }

  private eventPathIncludesPart(event: Event, part: string): boolean {
    return event.composedPath().some((target) => {
      return target instanceof HTMLElement && target.getAttribute('part') === part
    })
  }

  private handleBasePointerDown(event: PointerEvent): void {
    if (!this.canUseStepperGesture()) return
    if (event.pointerType !== 'touch') return
    if (event.isPrimary === false) return
    if (typeof event.button === 'number' && event.button !== 0) return
    if (
      this.eventPathIncludesPart(event, 'increment') ||
      this.eventPathIncludesPart(event, 'decrement') ||
      this.eventPathIncludesPart(event, 'clear-button')
    ) {
      return
    }

    this.swipePointerId = this.getPointerId(event)
    this.swipePointerTarget = event.currentTarget as HTMLElement | null
    this.swipeStartX = event.clientX
    this.swipeStartY = event.clientY
    this.swipeStepOriginX = event.clientX
    this.swipeAxisLocked = false
    this.trySetPointerCapture(this.swipePointerTarget, this.swipePointerId)
  }

  private handleBasePointerMove(event: PointerEvent): void {
    if (this.swipePointerId !== this.getPointerId(event)) return

    const deltaX = event.clientX - this.swipeStartX
    const deltaY = event.clientY - this.swipeStartY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    if (!this.swipeAxisLocked) {
      if (absDeltaY > 12 && absDeltaY > absDeltaX) {
        this.resetSwipeGesture(event)
        return
      }

      if (absDeltaX < 12 || absDeltaX <= absDeltaY) return
      this.swipeAxisLocked = true
    }

    const stepDelta = Math.trunc((event.clientX - this.swipeStepOriginX) / SWIPE_STEP_THRESHOLD_PX)
    if (stepDelta === 0) return

    event.preventDefault()
    this.swipeStepOriginX += stepDelta * SWIPE_STEP_THRESHOLD_PX
    if (this.applyUserStepDelta(stepDelta)) {
      this.showStepperFeedback(stepDelta > 0 ? 1 : -1, 'swipe', event.pointerType)
    }
  }

  private handleBasePointerUp(event: PointerEvent): void {
    if (this.swipePointerId !== this.getPointerId(event)) return
    this.resetSwipeGesture(event)
  }

  private handleBasePointerCancel(event: PointerEvent): void {
    if (this.swipePointerId !== this.getPointerId(event)) return
    this.resetSwipeGesture(event)
  }

  private resetSwipeGesture(event?: PointerEvent): void {
    const pointerId = event ? this.getPointerId(event) : this.swipePointerId
    if (pointerId !== null) {
      this.tryReleasePointerCapture(this.swipePointerTarget, pointerId)
    }

    this.swipePointerId = null
    this.swipePointerTarget = null
    this.swipeStartX = 0
    this.swipeStartY = 0
    this.swipeStepOriginX = 0
    this.swipeAxisLocked = false
  }

  private handleIncrementPointerDown(event: PointerEvent): void {
    this.handleStepperPointerDown(event, 1)
  }

  private handleDecrementPointerDown(event: PointerEvent): void {
    this.handleStepperPointerDown(event, -1)
  }

  private handleStepperPointerDown(event: PointerEvent, direction: StepDirection): void {
    if (!this.canUseStepperGesture()) return
    if (event.isPrimary === false) return
    if (typeof event.button === 'number' && event.button !== 0) return

    this.resetStepperPress(undefined, false)
    this.stepperPressPointerId = this.getPointerId(event)
    this.stepperPressPointerTarget = event.currentTarget as HTMLElement | null
    this.stepperPressPointerType = event.pointerType || ''
    this.stepperPressDirection = direction
    this.stepperPressRepeated = false
    this.stepperPressIntervalMs = LONG_PRESS_INITIAL_INTERVAL_MS
    this.trySetPointerCapture(this.stepperPressPointerTarget, this.stepperPressPointerId)
    this.stepperPressTimer = setTimeout(() => this.runStepperPressRepeat(), LONG_PRESS_DELAY_MS)
  }

  private handleStepperPointerUp(event: PointerEvent): void {
    if (this.stepperPressPointerId !== this.getPointerId(event)) return
    this.resetStepperPress(event, this.stepperPressRepeated)
  }

  private handleStepperPointerCancel(event: PointerEvent): void {
    if (this.stepperPressPointerId !== this.getPointerId(event)) return
    this.resetStepperPress(event, false)
  }

  private handleStepperLostPointerCapture(event: PointerEvent): void {
    if (this.stepperPressPointerId !== this.getPointerId(event)) return
    this.resetStepperPress(event, false)
  }

  private runStepperPressRepeat(): void {
    if (this.stepperPressDirection === 0) return

    this.stepperPressRepeated = true
    this.suppressNextStepperClick = true

    if (this.applyUserStepDelta(this.stepperPressDirection)) {
      this.showStepperFeedback(this.stepperPressDirection, 'long-press', this.stepperPressPointerType)
    }

    this.stepperPressIntervalMs = Math.max(
      LONG_PRESS_MIN_INTERVAL_MS,
      Math.round(this.stepperPressIntervalMs * LONG_PRESS_ACCELERATION),
    )
    this.stepperPressTimer = setTimeout(() => this.runStepperPressRepeat(), this.stepperPressIntervalMs)
  }

  private resetStepperPress(event?: PointerEvent, suppressNextClick = false): void {
    if (this.stepperPressTimer !== null) {
      clearTimeout(this.stepperPressTimer)
    }

    const pointerId = event ? this.getPointerId(event) : this.stepperPressPointerId
    if (pointerId !== null) {
      this.tryReleasePointerCapture(this.stepperPressPointerTarget, pointerId)
    }

    this.stepperPressPointerId = null
    this.stepperPressPointerTarget = null
    this.stepperPressPointerType = ''
    this.stepperPressDirection = 0
    this.stepperPressRepeated = false
    this.stepperPressTimer = null
    this.stepperPressIntervalMs = LONG_PRESS_INITIAL_INTERVAL_MS
    this.suppressNextStepperClick = suppressNextClick
  }

  private handleUserStepClick(direction: StepDirection): void {
    if (this.suppressNextStepperClick) {
      this.suppressNextStepperClick = false
      return
    }

    if (this.applyUserStepDelta(direction)) {
      this.showStepperFeedback(direction, 'click')
    }
  }

  private handleIncrementClick(): void {
    this.handleUserStepClick(1)
  }

  private handleDecrementClick(): void {
    this.handleUserStepClick(-1)
  }

  private showStepperFeedback(direction: StepDirection, source: StepSource, pointerType = ''): void {
    if (this.stepperFeedbackTimer !== null) {
      clearTimeout(this.stepperFeedbackTimer)
    }

    this.setAttribute('stepper-active', direction > 0 ? 'increment' : 'decrement')
    this.stepperFeedbackTimer = setTimeout(() => this.clearStepperFeedback(), STEPPER_FEEDBACK_DURATION_MS)

    if (source === 'swipe' || source === 'long-press') {
      this.maybeVibrate(pointerType)
    }
  }

  private clearStepperFeedback(): void {
    if (this.stepperFeedbackTimer !== null) {
      clearTimeout(this.stepperFeedbackTimer)
    }

    this.stepperFeedbackTimer = null
    this.removeAttribute('stepper-active')
  }

  private maybeVibrate(pointerType: string): void {
    if (pointerType !== 'touch') return
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    if (this.prefersReducedMotion()) return

    const now = Date.now()
    if (now - this.lastTouchVibrationAt < TOUCH_VIBRATION_THROTTLE_MS) return

    this.lastTouchVibrationAt = now
    navigator.vibrate(TOUCH_VIBRATION_DURATION_MS)
  }

  private prefersReducedMotion(): boolean {
    if (typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  private handleClearClick() {
    this.model.actions.clear()
    this.syncValueFromModel()
    this.requestUpdate()
    // cv-clear event is dispatched by the onClear callback in createModel
  }

  protected override render() {
    this.ensureModel()

    const inputProps = this.model.contracts.getInputProps()
    const incrementProps = this.model.contracts.getIncrementButtonProps()
    const decrementProps = this.model.contracts.getDecrementButtonProps()
    const clearButtonProps = this.model.contracts.getClearButtonProps()

    // Draft text management: display draftText when non-null, otherwise String(value)
    const draftText = this.model.state.draftText()
    const displayValue = draftText !== null ? draftText : String(this.model.state.value())

    return html`
      <div
        part="base"
        class="cv-u-control-shell"
        @wheel=${this.handleBaseWheel}
        @pointerdown=${this.handleBasePointerDown}
        @pointermove=${this.handleBasePointerMove}
        @pointerup=${this.handleBasePointerUp}
        @pointercancel=${this.handleBasePointerCancel}
      >
        <span part="prefix" class="cv-u-icon-slot"><slot name="prefix"></slot></span>
        <input
          part="input"
          class="cv-u-fill"
          id=${inputProps.id}
          role=${inputProps.role}
          tabindex=${inputProps.tabindex}
          inputmode=${inputProps.inputmode}
          aria-valuenow=${inputProps['aria-valuenow']}
          aria-valuemin=${inputProps['aria-valuemin'] ?? nothing}
          aria-valuemax=${inputProps['aria-valuemax'] ?? nothing}
          aria-valuetext=${inputProps['aria-valuetext'] ?? nothing}
          aria-disabled=${inputProps['aria-disabled'] ?? nothing}
          aria-readonly=${inputProps['aria-readonly'] ?? nothing}
          aria-required=${inputProps['aria-required'] ?? nothing}
          aria-invalid=${this.invalid ? 'true' : nothing}
          aria-label=${inputProps['aria-label'] ?? nothing}
          aria-labelledby=${inputProps['aria-labelledby'] ?? nothing}
          aria-describedby=${inputProps['aria-describedby'] ?? nothing}
          placeholder=${inputProps.placeholder ?? nothing}
          autocomplete=${inputProps.autocomplete}
          ?disabled=${this.isEffectivelyDisabled()}
          ?readonly=${this.readOnly}
          .value=${live(displayValue)}
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
          part="stepper"
          ?hidden=${incrementProps.hidden}
          aria-hidden=${incrementProps['aria-hidden'] ?? nothing}
        >
          <button
            part="increment"
            type="button"
            id=${incrementProps.id}
            tabindex=${incrementProps.tabindex}
            aria-label=${incrementProps['aria-label']}
            aria-disabled=${incrementProps['aria-disabled'] ?? nothing}
            ?hidden=${incrementProps.hidden}
            aria-hidden=${incrementProps['aria-hidden'] ?? nothing}
            @click=${this.handleIncrementClick}
            @pointerdown=${this.handleIncrementPointerDown}
            @pointerup=${this.handleStepperPointerUp}
            @pointercancel=${this.handleStepperPointerCancel}
            @lostpointercapture=${this.handleStepperLostPointerCapture}
          >
            +
          </button>
          <button
            part="decrement"
            type="button"
            id=${decrementProps.id}
            tabindex=${decrementProps.tabindex}
            aria-label=${decrementProps['aria-label']}
            aria-disabled=${decrementProps['aria-disabled'] ?? nothing}
            ?hidden=${decrementProps.hidden}
            aria-hidden=${decrementProps['aria-hidden'] ?? nothing}
            @click=${this.handleDecrementClick}
            @pointerdown=${this.handleDecrementPointerDown}
            @pointerup=${this.handleStepperPointerUp}
            @pointercancel=${this.handleStepperPointerCancel}
            @lostpointercapture=${this.handleStepperLostPointerCapture}
          >
            -
          </button>
        </span>
        <span part="suffix" class="cv-u-icon-slot"><slot name="suffix"></slot></span>
      </div>
    `
  }
}
