import {css} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVChip, type CVChipActionEvent, type CVChipRemoveEvent} from './cv-chip'
import {
  createChipGroupModel,
  parseChipValues,
  serializeChipValues,
  type CVChipGroupInputDetail,
  type CVChipGroupModel,
  type CVChipGroupOrientation,
  type CVChipRecord,
  type CVChipSelectionMode,
} from './cv-chip-group.model'

export type {CVChipGroupInputDetail, CVChipGroupOrientation, CVChipSelectionMode} from './cv-chip-group.model'

export type CVChipGroupInputEvent = CustomEvent<CVChipGroupInputDetail>
export type CVChipGroupChangeEvent = CustomEvent<CVChipGroupInputDetail>

let cvChipGroupNonce = 0

export class CVChipGroup extends ReatomLitElement {
  static elementName = 'cv-chip-group'

  static get properties() {
    return {
      selectionMode: {type: String, attribute: 'selection-mode', reflect: true},
      value: {type: String, reflect: true},
      orientation: {type: String, reflect: true},
      disabled: {type: Boolean, reflect: true},
    }
  }

  declare selectionMode: CVChipSelectionMode
  declare value: string
  declare orientation: CVChipGroupOrientation
  declare disabled: boolean

  private readonly idBase = `cv-chip-group-${++cvChipGroupNonce}`
  private readonly model: CVChipGroupModel
  private chips: CVChip[] = []
  private readonly chipDisabledDefaults = new WeakMap<CVChip, boolean>()

  constructor() {
    super()
    this.selectionMode = 'none'
    this.value = ''
    this.orientation = 'horizontal'
    this.disabled = false
    this.model = createChipGroupModel(this.idBase)
  }

  static styles = [
    css`
      :host {
        display: inline-block;
      }

      [part='base'] {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--cv-chip-group-gap, var(--cv-space-2, 8px));
      }

      :host([orientation='vertical']) [part='base'] {
        display: inline-grid;
        justify-items: start;
      }
    `,
  ]

  static define() {
    CVChip.define()
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.model.actions.setSelectionMode(this.selectionMode)
    this.model.actions.setDisabled(this.disabled)
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('selectionMode')) {
      this.model.actions.setSelectionMode(this.selectionMode)
      this.syncModelValueFromHost()
    }

    if (changedProperties.has('disabled')) {
      this.model.actions.setDisabled(this.disabled)
      this.syncChipState()
    }

    if (changedProperties.has('value')) {
      this.syncModelValueFromHost()
      this.syncChipState()
    }
  }

  protected override render() {
    return html`
      <div
        part="base"
        role="group"
        aria-disabled=${this.disabled ? 'true' : 'false'}
        @cv-chip-action=${this.handleChipAction}
        @cv-chip-remove=${this.handleChipRemove}
        @keydown=${this.handleKeydown}
      >
        <slot @slotchange=${this.handleSlotchange}></slot>
      </div>
    `
  }

  private handleSlotchange(event: Event) {
    const slot = event.currentTarget as HTMLSlotElement
    this.chips = slot
      .assignedElements({flatten: true})
      .filter((element): element is CVChip => element instanceof CVChip)
    for (const chip of this.chips) {
      if (!this.chipDisabledDefaults.has(chip)) {
        this.chipDisabledDefaults.set(chip, chip.disabled)
      }
    }
    this.model.actions.setRecords(this.getChipRecords())
    this.syncModelValueFromHost()
    this.syncChipState()
  }

  private handleChipAction(event: CVChipActionEvent) {
    if (this.disabled || this.selectionMode === 'none') return
    const result = this.model.actions.toggle(event.detail.value)
    if (!result) return

    const detail = {...result, source: event.detail.source}
    this.updateValueFromModel()
    this.syncChipState()
    this.dispatchChipGroupEvent('cv-input', detail)
    this.dispatchChipGroupEvent('cv-change', detail)
  }

  private handleChipRemove(event: CVChipRemoveEvent) {
    if (this.disabled || this.selectionMode === 'none') return
    if (!this.model.state.isSelected(event.detail.value)) return
    const result = this.model.actions.toggle(event.detail.value)
    if (!result) return
    const detail = {...result, source: 'click' as const}
    this.updateValueFromModel()
    this.syncChipState()
    this.dispatchChipGroupEvent('cv-input', detail)
    this.dispatchChipGroupEvent('cv-change', detail)
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const key = event.key
    const horizontal = this.orientation !== 'vertical'
    const previous = horizontal ? 'ArrowLeft' : 'ArrowUp'
    const next = horizontal ? 'ArrowRight' : 'ArrowDown'
    if (key !== previous && key !== next && key !== 'Home' && key !== 'End') return

    event.preventDefault()
    const index =
      key === 'Home'
        ? this.model.actions.moveActive('first')
        : key === 'End'
          ? this.model.actions.moveActive('last')
          : this.model.actions.moveActive(key === next ? 1 : -1)
    this.chips[index]?.focus()
  }

  private getChipRecords(): readonly CVChipRecord[] {
    return this.chips.map((chip) => ({
      value: chip.value,
      disabled: this.chipDisabledDefaults.get(chip) ?? chip.disabled,
    }))
  }

  private syncModelValueFromHost() {
    const value = this.selectionMode === 'multiple' ? parseChipValues(this.value) : this.value
    this.model.actions.setValue(value)
  }

  private updateValueFromModel() {
    const value = this.model.state.value()
    this.value = typeof value === 'string' ? value : serializeChipValues(value)
  }

  private syncChipState() {
    for (const chip of this.chips) {
      chip.selected = this.model.state.isSelected(chip.value)
      chip.disabled = this.disabled || (this.chipDisabledDefaults.get(chip) ?? false)
    }
  }

  private dispatchChipGroupEvent(name: 'cv-input' | 'cv-change', detail: CVChipGroupInputDetail) {
    this.dispatchEvent(
      new CustomEvent<CVChipGroupInputDetail>(name, {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }
}
