import {createRadioGroup, type RadioGroupModel} from '@chromvoid/headless-ui/radio-group'
import {css, html, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {FormAssociatedReatomElement} from '../form-associated/FormAssociatedReatomElement'
import type {FormAssociatedValidity} from '../form-associated/withFormAssociated'
import {CVRadio} from './cv-radio'

type CVRadioGroupOrientation = 'horizontal' | 'vertical'
type CVRadioGroupVariant = 'default' | 'segmented'

export interface CVRadioGroupEventDetail {
  value: string | null
  activeId: string | null
}

export type CVRadioGroupInputEvent = CustomEvent<CVRadioGroupEventDetail>
export type CVRadioGroupChangeEvent = CustomEvent<CVRadioGroupEventDetail>

interface RadioRecord {
  id: string
  label: string
  disabled: boolean
  hasDescription: boolean
  element: CVRadio
}

const radioGroupNavigationKeys = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  ' ',
  'Spacebar',
])

let cvRadioGroupNonce = 0

export class CVRadioGroup extends FormAssociatedReatomElement {
  static elementName = 'cv-radio-group'

  static get properties() {
    return {
      name: {type: String},
      value: {type: String, reflect: true},
      orientation: {type: String, reflect: true},
      variant: {type: String, reflect: true},
      disabled: {type: Boolean, reflect: true},
      required: {type: Boolean, reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
    }
  }

  declare name: string
  declare value: string
  declare orientation: CVRadioGroupOrientation
  declare variant: CVRadioGroupVariant
  declare disabled: boolean
  declare required: boolean
  declare ariaLabel: string

  private readonly idBase = `cv-radio-group-${++cvRadioGroupNonce}`
  private radioRecords: RadioRecord[] = []
  private radioListeners = new WeakMap<CVRadio, {click: EventListener; keydown: EventListener}>()
  private model?: RadioGroupModel
  private defaultValue = ''
  private didCaptureDefaultValue = false
  private checkedObserver?: MutationObserver
  private reconcilingChecked = false

  constructor() {
    super()
    this.name = ''
    this.value = ''
    this.orientation = 'horizontal'
    this.variant = 'default'
    this.disabled = false
    this.required = false
    this.ariaLabel = ''
  }

  static styles = [
    css`
      :host {
        display: inline-block;
        --cv-radio-group-gap: var(--cv-space-2, 8px);
      }

      [part='base'] {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--cv-radio-group-gap);
        padding: var(--cv-space-1, 4px);
        border-radius: var(--cv-radius-md, 10px);
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface, #141923);
      }

      :host([orientation='vertical']) [part='base'] {
        display: inline-grid;
        justify-items: start;
      }

      :host([variant='segmented']) {
        --cv-radio-group-gap: 2px;
      }

      :host([variant='segmented']) [part='base'] {
        padding: 2px;
      }

      [part='base']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      :host([disabled]) [part='base'] {
        opacity: 0.7;
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
    if (!this.model) {
      this.rebuildModelFromSlot(false, false)
    } else {
      // Reconnect: disconnectedCallback() detached the per-radio listeners, but the
      // model survives, so connectedCallback skips the rebuild that would re-attach
      // them. Without this, clicks on radios are dead after a move in the DOM
      // (keyboard appears to work only because keydown bubbles to the shadow base).
      this.attachRadioListeners()
    }
    if (!this.didCaptureDefaultValue) {
      this.defaultValue = this.model?.state.value() ?? ''
      this.didCaptureDefaultValue = true
    }
    this.syncFormAssociatedState()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.detachRadioListeners()
    this.checkedObserver?.disconnect()
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('orientation') || changedProperties.has('ariaLabel')) {
      this.rebuildModelFromSlot(true, false)
      this.syncFormAssociatedState()
      return
    }

    if (changedProperties.has('disabled')) {
      this.model?.actions.setDisabled(this.isEffectivelyDisabled())
    }

    if (changedProperties.has('value') && this.model) {
      const next = (this.value ?? '').trim()
      if (next.length === 0) {
        this.restoreValue(null)
        this.syncFormAssociatedState()
        return
      }

      const enabledIds = new Set(
        this.radioRecords.filter((record) => !record.disabled).map((record) => record.id),
      )
      if (!enabledIds.has(next)) {
        // Value targets an unknown/disabled radio: the model rejects it, so revert
        // the property to the model's value instead of leaving a stale string.
        this.value = this.model.state.value() ?? ''
        this.syncFormAssociatedState()
        return
      }

      if (this.model.state.value() !== next) {
        const previousValue = this.model.state.value()
        const previousActive = this.model.state.activeId()
        this.model.actions.select(next)
        // Programmatic value writes must be silent, matching native form controls.
        this.applyInteractionResult(previousValue, previousActive, true)
      }
    }

    if (
      changedProperties.has('value') ||
      changedProperties.has('disabled') ||
      changedProperties.has('required') ||
      changedProperties.has('name')
    ) {
      this.syncFormAssociatedState()
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    if (!changedProperties.has('value')) {
      this.syncRadioElements()
    }
    if (
      changedProperties.has('value') ||
      changedProperties.has('disabled') ||
      changedProperties.has('required') ||
      changedProperties.has('name') ||
      changedProperties.has('orientation') ||
      changedProperties.has('variant') ||
      changedProperties.has('ariaLabel')
    ) {
      this.syncFormAssociatedState()
    }
  }

  private getRadioElements(): CVRadio[] {
    return Array.from(this.children).filter(
      (element): element is CVRadio => element.tagName.toLowerCase() === CVRadio.elementName,
    )
  }

  private ensureRadioValue(radio: CVRadio, index: number): string {
    const normalized = radio.value?.trim()
    if (normalized) return normalized

    const fallback = `radio-${index + 1}`
    radio.value = fallback
    return fallback
  }

  private resolveConfiguredValue(radios: CVRadio[]): string | null {
    const propertyValue = (this.value ?? '').trim()
    if (propertyValue.length > 0) {
      return propertyValue
    }

    for (const [index, radio] of radios.entries()) {
      if (radio.checked && !radio.disabled) {
        return this.ensureRadioValue(radio, index)
      }
    }

    return null
  }

  private rebuildModelFromSlot(preserveSelection: boolean, requestRender = true): void {
    const radios = this.getRadioElements()

    const configuredValue = this.resolveConfiguredValue(radios)
    const previousValue = preserveSelection ? (this.model?.state.value() ?? configuredValue) : configuredValue
    const previousActive = preserveSelection ? (this.model?.state.activeId() ?? previousValue) : previousValue

    this.detachRadioListeners()

    this.radioRecords = radios.map((element, index) => {
      const id = this.ensureRadioValue(element, index)
      const label = element.textContent?.trim() || id
      const hasDescription = element.querySelector('[slot="description"]') !== null

      return {
        id,
        label,
        disabled: element.disabled,
        hasDescription,
        element,
      }
    })

    const enabledIds = new Set(
      this.radioRecords.filter((record) => !record.disabled).map((record) => record.id),
    )
    const initialValue = previousValue && enabledIds.has(previousValue) ? previousValue : null
    const initialActiveId =
      previousActive && enabledIds.has(previousActive)
        ? previousActive
        : (initialValue ?? this.radioRecords.find((record) => !record.disabled)?.id ?? null)

    this.model = createRadioGroup({
      idBase: this.idBase,
      items: this.radioRecords.map((record) => ({
        id: record.id,
        disabled: record.disabled,
        describedBy: record.hasDescription ? `${this.idBase}-radio-${record.id}-desc` : undefined,
      })),
      orientation: this.orientation,
      isDisabled: this.isEffectivelyDisabled(),
      ariaLabel: this.ariaLabel || undefined,
      initialValue,
      initialActiveId,
    })

    this.attachRadioListeners()
    this.syncRadioElements()
    this.value = this.model.state.value() ?? ''

    if (requestRender) {
      this.requestUpdate()
    }
  }

  private detachRadioListeners(): void {
    for (const record of this.radioRecords) {
      const listeners = this.radioListeners.get(record.element)
      if (!listeners) continue

      record.element.removeEventListener('click', listeners.click)
      record.element.removeEventListener('keydown', listeners.keydown)
      this.radioListeners.delete(record.element)
    }
  }

  private attachRadioListeners(): void {
    if (!this.model) return

    for (const record of this.radioRecords) {
      const click = () => {
        this.handleRadioClick(record.id)
      }

      const keydown = (event: Event) => {
        const keyboardEvent = event as KeyboardEvent
        const hasModifier =
          keyboardEvent.ctrlKey || keyboardEvent.metaKey || keyboardEvent.altKey
        // Only swallow navigation keys we own; let everything else (modifier combos,
        // typing, parent shortcuts) bubble normally.
        if (!hasModifier && radioGroupNavigationKeys.has(keyboardEvent.key)) {
          event.stopPropagation()
        }
        this.handleGroupKeyDown(keyboardEvent)
      }

      record.element.addEventListener('click', click)
      record.element.addEventListener('keydown', keydown)
      this.radioListeners.set(record.element, {click, keydown})
    }

    this.observeCheckedAttribute()
  }

  private observeCheckedAttribute(): void {
    if (!this.checkedObserver) {
      this.checkedObserver = new MutationObserver((mutations) => {
        this.handleCheckedMutations(mutations)
      })
    }
    this.checkedObserver.disconnect()
    for (const record of this.radioRecords) {
      this.checkedObserver.observe(record.element, {
        attributes: true,
        attributeFilter: ['checked'],
      })
    }
  }

  private handleCheckedMutations(mutations: MutationRecord[]): void {
    if (this.reconcilingChecked || !this.model) return

    // A consumer set `radio.checked = true` directly, bypassing the group model.
    // Without reconciling, two radios stay visually checked at once. Adopt the most
    // recent enabled radio that was turned on as the group's selection and notify.
    let target: string | null = null
    for (const mutation of mutations) {
      const radio = mutation.target as CVRadio
      if (!radio.checked) continue
      const record = this.radioRecords.find((entry) => entry.element === radio)
      if (record && !record.disabled) {
        target = record.id
      }
    }

    if (target === null || this.model.state.value() === target) {
      // Keep DOM consistent even when no model change is needed.
      this.reconcilingChecked = true
      this.syncRadioElements()
      this.reconcilingChecked = false
      return
    }

    const previousValue = this.model.state.value()
    const previousActive = this.model.state.activeId()
    this.reconcilingChecked = true
    this.model.actions.select(target)
    this.applyInteractionResult(previousValue, previousActive)
    this.reconcilingChecked = false
  }

  private syncRadioElements(): void {
    if (!this.model) return

    for (const record of this.radioRecords) {
      const props = this.model.contracts.getRadioProps(record.id)

      record.element.id = props.id
      record.element.setAttribute('role', props.role)
      record.element.setAttribute('tabindex', props.tabindex)
      record.element.setAttribute('aria-checked', props['aria-checked'])

      if (props['aria-disabled']) {
        record.element.setAttribute('aria-disabled', props['aria-disabled'])
      } else {
        record.element.removeAttribute('aria-disabled')
      }

      // Only wire aria-describedby when the description target actually exists.
      // The headless contract returns an IDREF (`${idBase}-radio-${id}-desc`) but
      // never creates the element; we adopt that id onto the slotted description so
      // the reference is not dangling.
      const describedById = props['aria-describedby']
      const descriptionEl = record.element.querySelector('[slot="description"]')
      if (describedById && descriptionEl) {
        descriptionEl.id = describedById
        record.element.setAttribute('aria-describedby', describedById)
      } else {
        record.element.removeAttribute('aria-describedby')
      }

      if (props['data-active'] === 'true') {
        record.element.setAttribute('data-active', 'true')
        record.element.active = true
      } else {
        record.element.removeAttribute('data-active')
        record.element.active = false
      }

      record.element.checked = props['aria-checked'] === 'true'
      record.element.disabled = props['aria-disabled'] === 'true'
      record.element.variant = this.variant
    }
  }

  private focusActiveRadio(): void {
    if (!this.model) return
    const activeId = this.model.state.activeId()
    if (!activeId) return

    const activeRecord = this.radioRecords.find((record) => record.id === activeId)
    activeRecord?.element.focus()
  }

  private dispatchInput(detail: CVRadioGroupEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(detail: CVRadioGroupEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private applyInteractionResult(
    previousValue: string | null,
    previousActive: string | null,
    silent = false,
  ): void {
    if (!this.model) return

    this.syncRadioElements()

    const nextValue = this.model.state.value()
    const nextActive = this.model.state.activeId()
    const valueChanged = previousValue !== nextValue
    const activeChanged = previousActive !== nextActive

    this.value = nextValue ?? ''
    this.syncFormAssociatedState()

    if (silent || (!valueChanged && !activeChanged)) return

    const detail: CVRadioGroupEventDetail = {
      value: nextValue,
      activeId: nextActive,
    }

    this.dispatchInput(detail)
    if (valueChanged) {
      this.dispatchChange(detail)
    }

    if (activeChanged) {
      this.focusActiveRadio()
    }
  }

  private handleRadioClick(id: string): void {
    if (!this.model) return

    const previousValue = this.model.state.value()
    const previousActive = this.model.state.activeId()
    this.model.contracts.getRadioProps(id).onClick()
    this.applyInteractionResult(previousValue, previousActive)
  }

  private handleGroupKeyDown(event: KeyboardEvent) {
    if (!this.model) return

    // Don't hijack browser/parent shortcuts (e.g. Ctrl+ArrowDown, Cmd+Space) or
    // keys the radio group doesn't act on. Only navigation keys without modifiers
    // are handled and prevented.
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey
    if (hasModifier || !radioGroupNavigationKeys.has(event.key)) {
      return
    }

    event.preventDefault()

    const previousValue = this.model.state.value()
    const previousActive = this.model.state.activeId()
    this.model.contracts.getRootProps().onKeyDown(event)
    this.applyInteractionResult(previousValue, previousActive)
  }

  private handleSlotChange() {
    this.rebuildModelFromSlot(true, true)
  }

  protected override onFormDisabledChanged(_disabled: boolean): void {
    this.model?.actions.setDisabled(this.isEffectivelyDisabled())
  }

  protected override onFormReset(): void {
    this.restoreValue(this.defaultValue || null)
  }

  protected override onFormStateRestore(state: string | File | FormData | null): void {
    this.restoreValue(typeof state === 'string' ? state : null)
  }

  protected override isFormAssociatedDisabled(): boolean {
    return this.isEffectivelyDisabled()
  }

  protected override getFormAssociatedValue(): string | File | FormData | null {
    return this.model?.state.value() ?? null
  }

  protected override getFormAssociatedValidity(): FormAssociatedValidity {
    if (this.required && !this.model?.state.value()) {
      return {
        flags: {valueMissing: true},
        message: 'Please select an option.',
      }
    }

    return {flags: {}}
  }

  private isEffectivelyDisabled(): boolean {
    return this.disabled || this.formDisabled
  }

  private restoreValue(nextValue: string | null): void {
    for (const record of this.radioRecords) {
      record.element.checked = nextValue !== null && record.id === nextValue
    }

    this.value = nextValue ?? ''
    this.rebuildModelFromSlot(false, false)
    this.syncRadioElements()
    this.syncFormAssociatedState()
  }

  protected override render() {
    const rootProps = this.model?.contracts.getRootProps() ?? {
      role: 'radiogroup' as const,
      'aria-label': this.ariaLabel || undefined,
      'aria-labelledby': undefined,
      'aria-disabled': this.isEffectivelyDisabled() ? 'true' : undefined,
      'aria-orientation': this.orientation,
    }

    return html`
      <div
        role=${rootProps.role}
        aria-label=${rootProps['aria-label'] ?? nothing}
        aria-labelledby=${rootProps['aria-labelledby'] ?? nothing}
        aria-disabled=${rootProps['aria-disabled'] ?? nothing}
        aria-orientation=${rootProps['aria-orientation']}
        part="base"
        @keydown=${this.handleGroupKeyDown}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `
  }
}
