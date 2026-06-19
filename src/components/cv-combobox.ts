import {
  createCombobox,
  type ComboboxMatchMode,
  type ComboboxModel,
  type ComboboxOptionGroup,
  type ComboboxType,
  type ComboboxVisibleGroup,
} from '@chromvoid/headless-ui/combobox'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVComboboxGroup} from './cv-combobox-group'
import {CVComboboxOption} from './cv-combobox-option'

export interface CVComboboxEventDetail {
  value: string | null
  inputValue: string
  activeId: string | null
  open: boolean
  selectedIds: string[]
}

export type CVComboboxInputEvent = CustomEvent<CVComboboxEventDetail>
export type CVComboboxChangeEvent = CustomEvent<CVComboboxEventDetail>
export type CVComboboxClearEvent = CustomEvent<Record<string, never>>

export interface CVComboboxEventMap {
  'cv-input': CVComboboxInputEvent
  'cv-change': CVComboboxChangeEvent
  'cv-clear': CVComboboxClearEvent
}

interface ComboboxOptionRecord {
  id: string
  label: string
  disabled: boolean
  element: CVComboboxOption
  groupId?: string
}

interface ComboboxGroupRecord {
  id: string
  label: string
  element: CVComboboxGroup
  optionIds: string[]
}

const comboboxNavigationKeys = new Set(['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Escape'])

function isVisibleGroup(item: unknown): item is ComboboxVisibleGroup {
  return (
    typeof item === 'object' &&
    item !== null &&
    'options' in item &&
    Array.isArray((item as {options?: unknown}).options)
  )
}

let cvComboboxNonce = 0

export class CVCombobox extends ReatomLitElement {
  static elementName = 'cv-combobox'
  static override hostDisplay = 'inline-block' as const

  static get properties() {
    return {
      value: {type: String, reflect: true},
      inputValue: {type: String, attribute: 'input-value'},
      open: {type: Boolean, reflect: true},
      type: {type: String, reflect: true},
      multiple: {type: Boolean, reflect: true},
      clearable: {type: Boolean, reflect: true},
      maxTagsVisible: {type: Number, attribute: 'max-tags-visible'},
      openOnFocus: {type: Boolean, attribute: 'open-on-focus', reflect: true},
      openOnClick: {type: Boolean, attribute: 'open-on-click', reflect: true},
      closeOnSelect: {type: Boolean, attribute: 'close-on-select', reflect: true},
      matchMode: {type: String, attribute: 'match-mode', reflect: true},
      placeholder: {type: String},
      ariaLabel: {type: String, attribute: 'aria-label'},
      invalid: {type: Boolean, reflect: true},
    }
  }

  declare value: string
  declare inputValue: string
  declare open: boolean
  declare type: ComboboxType
  declare multiple: boolean
  declare clearable: boolean
  declare maxTagsVisible: number
  declare openOnFocus: boolean
  declare openOnClick: boolean
  declare closeOnSelect: boolean
  declare matchMode: ComboboxMatchMode
  declare placeholder: string
  declare ariaLabel: string
  declare invalid: boolean

  private readonly idBase = `cv-combobox-${++cvComboboxNonce}`
  private optionRecords: ComboboxOptionRecord[] = []
  private groupRecords: ComboboxGroupRecord[] = []
  private optionListeners = new WeakMap<CVComboboxOption, {click: EventListener; mouseenter: EventListener}>()
  private model?: ComboboxModel

  constructor() {
    super()
    this.value = ''
    this.inputValue = ''
    this.open = false
    this.type = 'editable'
    this.multiple = false
    this.clearable = false
    this.maxTagsVisible = 3
    this.openOnFocus = true
    this.openOnClick = true
    this.closeOnSelect = true
    this.matchMode = 'includes'
    this.placeholder = ''
    this.ariaLabel = ''
    this.invalid = false
  }

  static styles = [
    css`
      :host {
        inline-size: 260px;
        --cv-combobox-border-color: var(--cv-color-border, #2a3245);
        --cv-combobox-border-radius: var(--cv-radius-sm, 6px);
        --cv-combobox-background: var(--cv-color-surface, #141923);
      }

      [part='base'] {
        display: grid;
        gap: var(--cv-space-1, 4px);
      }

      [part='input-wrapper'] {
        flex-wrap: wrap;
        gap: var(--cv-space-1, 4px);
        min-block-size: 36px;
        padding: 0 var(--cv-space-3, 12px);
        border: 1px solid var(--cv-combobox-border-color);
        border-radius: var(--cv-combobox-border-radius);
        background: var(--cv-combobox-background);
      }

      [part='input'] {
        min-inline-size: 60px;
        block-size: 100%;
        min-block-size: 36px;
        border: none;
        background: transparent;
        color: var(--cv-color-text, #e8ecf6);
        outline: none;
        padding: 0;
      }

      [part='input']:focus-visible {
        outline: none;
      }

      :host([invalid]) [part='input-wrapper'] {
        border-color: var(--cv-color-danger, #ef4444);
      }

      [part='trigger'] {
        gap: var(--cv-space-2, 8px);
        min-block-size: 36px;
        border: none;
        background: transparent;
        color: var(--cv-color-text, #e8ecf6);
        cursor: pointer;
        outline: none;
        padding: 0;
      }

      [part='trigger']:focus-visible {
        outline: none;
      }

      [part='label'] {
        text-align: start;
      }

      [part='tags'] {
        flex-wrap: wrap;
        gap: var(--cv-space-1, 4px);
      }

      [part='tag'] {
        gap: var(--cv-space-1, 4px);
        padding: 2px var(--cv-space-2, 8px);
        border-radius: var(--cv-radius-sm, 6px);
        background: var(--cv-color-primary-ring);
        font-size: 0.85em;
      }

      [part='tag-remove'] {
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        padding: 0;
        font-size: 1em;
        line-height: 1;
      }

      [part='tag-overflow'] {
        font-size: 0.85em;
        color: var(--cv-color-text-muted, #9aa6bf);
      }

      [part='clear-button'] {
        border: none;
        background: transparent;
        color: var(--cv-color-text-muted, #9aa6bf);
        cursor: pointer;
        padding: 0 var(--cv-space-1, 4px);
      }

      [part='expand-icon'] {
        color: var(--cv-color-text-muted, #9aa6bf);
      }

      [part='listbox'] {
        gap: var(--cv-space-1, 4px);
        max-block-size: 220px;
        overflow: auto;
        padding: var(--cv-space-1, 4px);
        background: var(--cv-color-surface, #141923);
        opacity: 1;
        transform: translate3d(0, 0, 0);
        transition:
          opacity var(--cv-combobox-listbox-transition-duration, var(--cv-duration-fast, 120ms))
            var(--cv-easing-standard, ease),
          transform var(--cv-combobox-listbox-transition-duration, var(--cv-duration-fast, 120ms))
            var(--cv-easing-standard, ease),
          display var(--cv-combobox-listbox-transition-duration, var(--cv-duration-fast, 120ms))
            allow-discrete;
        transition-behavior: allow-discrete;
      }

      [part='listbox'][hidden] {
        opacity: 0;
        transform: translate3d(0, -2px, 0);
      }

      @starting-style {
        [part='listbox']:not([hidden]) {
          opacity: 0;
          transform: translate3d(0, -2px, 0);
        }
      }

      [part='group'] {
        display: grid;
        gap: var(--cv-space-1, 4px);
      }

      [part='group-label'] {
        padding: var(--cv-space-1, 4px) var(--cv-space-2, 8px);
        font-size: 0.75rem;
        letter-spacing: 0.02em;
        color: var(--cv-color-text-muted, #9aa6bf);
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
      // Reconnect: disconnectedCallback detached per-option listeners but the
      // model already exists, so a remove()+append() would leave options inert
      // (no slotchange fires). Reattach so clicks/hover keep working.
      this.attachOptionListeners()
    }

    this.syncOutsidePointerListener()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.detachOptionListeners()
    this.syncOutsidePointerListener(true)
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('ariaLabel') ||
      changedProperties.has('closeOnSelect') ||
      changedProperties.has('matchMode') ||
      changedProperties.has('type') ||
      changedProperties.has('multiple') ||
      changedProperties.has('clearable')
    ) {
      this.rebuildModelFromSlot(true, false)
      return
    }

    if (!this.model) return

    if (changedProperties.has('value')) {
      const next = this.value.trim()
      const previous = this.captureState()
      if (next.length === 0) {
        this.model.actions.clearSelection()
        this.applyInteractionResult(previous)
      } else if (this.multiple) {
        // Multi-mode: parse space-delimited ids
        const ids = this.parseMultipleValueIds()
        const currentIds = this.model.state.selectedIds()
        if (ids.join(' ') !== currentIds.join(' ')) {
          if (this.hasUnknownSelectedIds(ids)) {
            // A disabled id can never become selectable, so revert the property
            // to the model's actual selection to avoid a permanent desync. A
            // merely-absent id may belong to an option added later (slot rebuild
            // re-applies it), so leave the property untouched in that case.
            if (this.hasDisabledSelectedIds(ids)) {
              this.value = currentIds.join(' ')
            }
            return
          }

          // Clear and re-select each id
          this.model.actions.clearSelection()
          for (const id of ids) {
            this.model.actions.toggleOption(id)
          }
          this.applyInteractionResult(previous)
        }
      } else if (this.model.state.selectedId() !== next) {
        this.model.actions.select(next)
        this.applyInteractionResult(previous)
      }
    }

    if (changedProperties.has('inputValue') && this.model.state.inputValue() !== this.inputValue) {
      const previous = this.captureState()
      this.model.actions.setInputValue(this.inputValue)
      this.applyInteractionResult(previous)
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
    this.syncOutsidePointerListener()

    if (
      !changedProperties.has('value') &&
      !changedProperties.has('inputValue') &&
      !changedProperties.has('open')
    ) {
      this.syncOptionElements()
    }
  }

  private getOptionElements(): CVComboboxOption[] {
    const result: CVComboboxOption[] = []
    for (const child of Array.from(this.children)) {
      if (child.tagName.toLowerCase() === CVComboboxOption.elementName) {
        result.push(child as CVComboboxOption)
      } else if (child.tagName.toLowerCase() === CVComboboxGroup.elementName) {
        for (const groupChild of Array.from(child.children)) {
          if (groupChild.tagName.toLowerCase() === CVComboboxOption.elementName) {
            result.push(groupChild as CVComboboxOption)
          }
        }
      }
    }
    return result
  }

  private getGroupElements(): CVComboboxGroup[] {
    return Array.from(this.children).filter(
      (element): element is CVComboboxGroup => element.tagName.toLowerCase() === CVComboboxGroup.elementName,
    )
  }

  private ensureOptionValue(option: CVComboboxOption, index: number): string {
    const normalized = option.value?.trim()
    if (normalized) return normalized

    const fallback = `option-${index + 1}`
    option.value = fallback
    return fallback
  }

  private parseMultipleValueIds(): string[] {
    return this.value.trim().split(/\s+/).filter(Boolean)
  }

  private hasUnknownSelectedIds(ids: readonly string[]): boolean {
    const enabledIds = new Set(
      this.optionRecords.filter((record) => !record.disabled).map((record) => record.id),
    )
    return ids.some((id) => !enabledIds.has(id))
  }

  private hasDisabledSelectedIds(ids: readonly string[]): boolean {
    const disabledIds = new Set(
      this.optionRecords.filter((record) => record.disabled).map((record) => record.id),
    )
    return ids.some((id) => disabledIds.has(id))
  }

  private resolveInitialSelected(optionElements: CVComboboxOption[]): string | null {
    const fromProperty = this.value.trim()
    if (fromProperty.length > 0) return fromProperty

    for (const [index, option] of optionElements.entries()) {
      if (option.selected && !option.disabled) {
        return this.ensureOptionValue(option, index)
      }
    }

    return null
  }

  private rebuildModelFromSlot(preserveState: boolean, requestRender = true): void {
    const optionElements = this.getOptionElements()
    const groupElements = this.getGroupElements()

    const previousState = preserveState
      ? this.captureState()
      : {
          selectedId: this.resolveInitialSelected(optionElements),
          selectedIds: this.multiple ? this.parseMultipleValueIds() : [],
          inputValue: this.inputValue,
          activeId: null,
          isOpen: this.open,
        }

    this.detachOptionListeners()

    // Build group records
    let groupNonce = 0
    this.groupRecords = groupElements.map((element) => {
      const id = `group-${++groupNonce}`
      const label = element.label || element.getAttribute('label') || ''
      const optionIds: string[] = []
      return {id, label, element, optionIds}
    })

    // Build option records with group assignment
    let optionIndex = 0
    this.optionRecords = []

    // Map from group element to group record
    const groupElementMap = new Map<CVComboboxGroup, ComboboxGroupRecord>()
    for (const gr of this.groupRecords) {
      groupElementMap.set(gr.element, gr)
    }

    for (const child of Array.from(this.children)) {
      if (child.tagName.toLowerCase() === CVComboboxOption.elementName) {
        const element = child as CVComboboxOption
        const id = this.ensureOptionValue(element, optionIndex)
        const label = element.textContent?.trim() || id
        this.optionRecords.push({id, label, disabled: element.disabled, element})
        optionIndex++
      } else if (child.tagName.toLowerCase() === CVComboboxGroup.elementName) {
        const groupRecord = groupElementMap.get(child as CVComboboxGroup)
        for (const groupChild of Array.from(child.children)) {
          if (groupChild.tagName.toLowerCase() === CVComboboxOption.elementName) {
            const element = groupChild as CVComboboxOption
            const id = this.ensureOptionValue(element, optionIndex)
            const label = element.textContent?.trim() || id
            const record: ComboboxOptionRecord = {
              id,
              label,
              disabled: element.disabled,
              element,
              groupId: groupRecord?.id,
            }
            this.optionRecords.push(record)
            groupRecord?.optionIds.push(id)
            optionIndex++
          }
        }
      }
    }

    const enabledIds = new Set(
      this.optionRecords.filter((record) => !record.disabled).map((record) => record.id),
    )

    // Build headless options structure (with groups if any)
    const hasGroups = this.groupRecords.length > 0
    let headlessOptions: Array<{id: string; label: string; disabled?: boolean} | ComboboxOptionGroup>

    if (hasGroups) {
      headlessOptions = []
      const usedGroupIds = new Set<string>()

      for (const child of Array.from(this.children)) {
        if (child.tagName.toLowerCase() === CVComboboxOption.elementName) {
          const record = this.optionRecords.find((r) => r.element === child)
          if (record) {
            headlessOptions.push({id: record.id, label: record.label, disabled: record.disabled})
          }
        } else if (child.tagName.toLowerCase() === CVComboboxGroup.elementName) {
          const groupRecord = groupElementMap.get(child as CVComboboxGroup)
          if (groupRecord && !usedGroupIds.has(groupRecord.id)) {
            usedGroupIds.add(groupRecord.id)
            headlessOptions.push({
              id: groupRecord.id,
              label: groupRecord.label,
              options: groupRecord.optionIds.map((optId) => {
                const rec = this.optionRecords.find((r) => r.id === optId)!
                return {id: rec.id, label: rec.label, disabled: rec.disabled}
              }),
            })
          }
        }
      }
    } else {
      headlessOptions = this.optionRecords.map((record) => ({
        id: record.id,
        label: record.label,
        disabled: record.disabled,
      }))
    }

    // Determine initial selection
    let initialSelectedId: string | null = null
    let initialSelectedIds: string[] | undefined

    if (this.multiple) {
      const prevIds = this.parseMultipleValueIds()
      initialSelectedIds = prevIds.filter((id) => enabledIds.has(id))
    } else {
      initialSelectedId =
        previousState.selectedId && enabledIds.has(previousState.selectedId) ? previousState.selectedId : null
    }

    // Determine effective closeOnSelect
    const effectiveCloseOnSelect = this.multiple ? false : this.closeOnSelect

    this.model = createCombobox({
      idBase: this.idBase,
      options: headlessOptions,
      type: this.type,
      multiple: this.multiple,
      clearable: this.clearable,
      ariaLabel: this.ariaLabel || undefined,
      initialInputValue: previousState.inputValue,
      initialSelectedId: this.multiple ? undefined : initialSelectedId,
      initialSelectedIds: this.multiple ? initialSelectedIds : undefined,
      initialOpen: previousState.isOpen,
      closeOnSelect: effectiveCloseOnSelect,
      matchMode: this.matchMode === 'startsWith' ? 'startsWith' : 'includes',
    })

    if (previousState.activeId && enabledIds.has(previousState.activeId)) {
      this.model.actions.setActive(previousState.activeId)
    }

    this.attachOptionListeners()
    this.syncOptionElements()
    this.syncHostState()

    if (requestRender) {
      this.requestUpdate()
    }
  }

  private syncHostState(): void {
    if (!this.model) return

    if (this.multiple) {
      const ids = this.model.state.selectedIds()
      this.value = ids.join(' ')
    } else {
      this.value = this.model.state.selectedId() ?? ''
    }
    this.inputValue = this.model.state.inputValue()
    this.open = this.model.state.isOpen()
  }

  private detachOptionListeners(): void {
    for (const record of this.optionRecords) {
      const listeners = this.optionListeners.get(record.element)
      if (!listeners) continue

      record.element.removeEventListener('click', listeners.click)
      record.element.removeEventListener('mouseenter', listeners.mouseenter)
      this.optionListeners.delete(record.element)
    }
  }

  private attachOptionListeners(): void {
    if (!this.model) return

    for (const record of this.optionRecords) {
      const click = (event: Event) => {
        event.preventDefault()
        this.handleOptionClick(record.id)
      }

      const mouseenter = () => {
        this.handleOptionMouseEnter(record.id)
      }

      record.element.addEventListener('click', click)
      record.element.addEventListener('mouseenter', mouseenter)
      this.optionListeners.set(record.element, {click, mouseenter})
    }
  }

  private syncOptionElements(): void {
    if (!this.model) return

    const isOpen = this.model.state.isOpen()
    const visibleOptions = this.model.contracts.getVisibleOptions()

    // Build a set of visible option ids (flat)
    const visibleIds = new Set<string>()
    const visibleGroupIds = new Set<string>()
    for (const item of visibleOptions) {
      if (isVisibleGroup(item)) {
        visibleGroupIds.add(item.id)
        for (const opt of item.options) {
          visibleIds.add(opt.id)
        }
      } else {
        visibleIds.add(item.id)
      }
    }

    for (const record of this.optionRecords) {
      const props = this.model.contracts.getOptionProps(record.id)

      record.element.id = props.id
      record.element.setAttribute('role', props.role)
      record.element.setAttribute('tabindex', props.tabindex)
      record.element.setAttribute('aria-selected', props['aria-selected'])

      if (props['aria-disabled']) {
        record.element.setAttribute('aria-disabled', props['aria-disabled'])
      } else {
        record.element.removeAttribute('aria-disabled')
      }

      if (props['data-active'] === 'true') {
        record.element.setAttribute('data-active', 'true')
        record.element.active = true
      } else {
        record.element.removeAttribute('data-active')
        record.element.active = false
      }

      record.element.selected = props['aria-selected'] === 'true'
      record.element.disabled = props['aria-disabled'] === 'true'
      record.element.hidden = !isOpen || !visibleIds.has(record.id)
    }

    // Sync group element visibility
    for (const groupRecord of this.groupRecords) {
      const allHidden = groupRecord.optionIds.every((id) => !visibleIds.has(id))
      groupRecord.element.hidden = !isOpen || allHidden
    }
  }

  private captureState() {
    return {
      selectedId: this.model?.state.selectedId() ?? (this.value.trim() || null),
      selectedIds: this.model?.state.selectedIds() ?? [],
      inputValue: this.model?.state.inputValue() ?? this.inputValue,
      activeId: this.model?.state.activeId() ?? null,
      isOpen: this.model?.state.isOpen() ?? this.open,
    }
  }

  private makeEventDetail(): CVComboboxEventDetail {
    const state = this.captureState()
    return {
      value: this.multiple
        ? state.selectedIds.length > 0
          ? state.selectedIds.join(' ')
          : null
        : state.selectedId,
      inputValue: state.inputValue,
      activeId: state.activeId,
      open: state.isOpen,
      selectedIds: state.selectedIds,
    }
  }

  private dispatchInput(detail: CVComboboxEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(detail: CVComboboxEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private applyInteractionResult(previousState: {
    selectedId: string | null
    selectedIds: string[]
    inputValue: string
    activeId: string | null
    isOpen: boolean
  }): void {
    if (!this.model) return

    this.syncOptionElements()

    const nextState = this.captureState()
    this.syncHostState()

    const selectedChanged = this.multiple
      ? previousState.selectedIds.join(' ') !== nextState.selectedIds.join(' ')
      : previousState.selectedId !== nextState.selectedId
    const inputChanged = previousState.inputValue !== nextState.inputValue
    const activeChanged = previousState.activeId !== nextState.activeId
    const openChanged = previousState.isOpen !== nextState.isOpen

    if (!selectedChanged && !inputChanged && !activeChanged && !openChanged) return

    const detail = this.makeEventDetail()

    this.dispatchInput(detail)
    if (selectedChanged) {
      this.dispatchChange(detail)
    }
  }

  private syncOutsidePointerListener(forceOff = false): void {
    const shouldListen = !forceOff && this.open
    if (shouldListen) {
      document.addEventListener('pointerdown', this.handleDocumentPointerDown)
    } else {
      document.removeEventListener('pointerdown', this.handleDocumentPointerDown)
    }
  }

  private handleDocumentPointerDown = (event: Event) => {
    if (!this.model || !this.model.state.isOpen()) return

    const path = event.composedPath()
    if (path.includes(this)) return

    const previous = this.captureState()
    this.model.actions.close()
    this.applyInteractionResult(previous)
  }

  private handleInputChange(event: Event) {
    if (!this.model) return

    const value = (event.currentTarget as HTMLInputElement).value
    const previous = this.captureState()
    this.model.actions.setInputValue(value)
    this.applyInteractionResult(previous)
  }

  private handleInputFocus() {
    if (!this.model || this.model.state.isOpen() || !this.openOnFocus) return

    const previous = this.captureState()
    this.model.actions.open()
    this.applyInteractionResult(previous)
  }

  private handleInputClick() {
    if (!this.model || this.model.state.isOpen() || !this.openOnClick) return

    const previous = this.captureState()
    this.model.actions.open()
    this.applyInteractionResult(previous)
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.model) return

    // In editable mode the keystrokes land in a real text <input>: the user must
    // be able to type a space and move the caret with Home/End. Only swallow the
    // pure navigation keys (Arrows/Enter/Escape) for editable comboboxes; for
    // select-only triggers all navigation keys are claimed.
    const isEditable = this.type !== 'select-only'
    const shouldPreventDefault = isEditable
      ? event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'Enter' ||
        event.key === 'Escape'
      : comboboxNavigationKeys.has(event.key) || event.key === ' '

    if (shouldPreventDefault) {
      event.preventDefault()
    }

    const previous = this.captureState()
    this.model.actions.handleKeyDown({
      key: event.key,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
    })
    this.applyInteractionResult(previous)
  }

  private handleOptionMouseEnter(id: string): void {
    if (!this.model) return

    const previous = this.captureState()
    this.model.actions.setActive(id)
    this.applyInteractionResult(previous)
  }

  private handleOptionClick(id: string): void {
    if (!this.model) return

    const previous = this.captureState()
    this.model.actions.select(id)
    this.applyInteractionResult(previous)
  }

  private handleClearClick(event: Event) {
    event.stopPropagation()
    if (!this.model) return

    const previous = this.captureState()
    this.model.actions.clear()
    this.applyInteractionResult(previous)

    this.dispatchEvent(
      new CustomEvent<CVComboboxClearEvent['detail']>('cv-clear', {
        detail: {},
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleTagRemove(id: string): void {
    if (!this.model) return

    const previous = this.captureState()
    this.model.actions.removeSelected(id)
    this.applyInteractionResult(previous)
  }

  private handleSlotChange() {
    this.rebuildModelFromSlot(true, true)
  }

  private getSelectedOptionLabel(): string {
    if (!this.model) return this.placeholder
    const selectedId = this.model.state.selectedId()
    if (!selectedId) return this.placeholder
    const record = this.optionRecords.find((r) => r.id === selectedId)
    return record?.label ?? this.placeholder
  }

  private getSelectedRecords(): ComboboxOptionRecord[] {
    if (!this.model) return []
    const ids = this.model.state.selectedIds()
    return ids
      .map((id) => this.optionRecords.find((r) => r.id === id))
      .filter((r): r is ComboboxOptionRecord => r != null)
  }

  private renderTags() {
    if (!this.multiple) return nothing

    const selectedRecords = this.getSelectedRecords()
    if (selectedRecords.length === 0) return nothing

    const maxVisible = this.maxTagsVisible > 0 ? this.maxTagsVisible : selectedRecords.length
    const visibleRecords = selectedRecords.slice(0, maxVisible)
    const overflowCount = selectedRecords.length - maxVisible

    return html`
      <div part="tags" class="cv-u-row">
        ${visibleRecords.map(
          (record) => html`
            <span part="tag" class="cv-u-row">
              <span part="tag-label">${record.label}</span>
              <button
                part="tag-remove"
                class="cv-u-icon-slot"
                aria-label="Remove ${record.label}"
                @click=${(e: Event) => {
                  e.stopPropagation()
                  this.handleTagRemove(record.id)
                }}
              >&times;</button>
            </span>
          `,
        )}
        ${overflowCount > 0 ? html`<span part="tag-overflow">+${overflowCount} more</span>` : nothing}
      </div>
    `
  }

  private renderClearButton() {
    if (!this.clearable) return nothing
    if (!this.model?.state.hasSelection()) return nothing

    return html`
      <button part="clear-button" class="cv-u-icon-slot" aria-label="Clear" @click=${this.handleClearClick}>
        &times;
      </button>
    `
  }

  private renderListboxContent() {
    if (!this.model || this.groupRecords.length === 0) {
      return html`<slot @slotchange=${this.handleSlotChange}></slot>`
    }

    // Grouped rendering: render groups with their options inside the shadow listbox
    const visibleOptions = this.model.contracts.getVisibleOptions()
    const visibleGroupIds = new Set<string>()
    const visibleOptionIdsInGroup = new Map<string, Set<string>>()

    for (const item of visibleOptions) {
      if (isVisibleGroup(item)) {
        visibleGroupIds.add(item.id)
        const optIds = new Set(item.options.map((o) => o.id))
        visibleOptionIdsInGroup.set(item.id, optIds)
      }
    }

    return html`
      ${this.groupRecords.map((groupRecord) => {
        const groupProps = this.model!.contracts.getGroupProps(groupRecord.id)
        const groupLabelProps = this.model!.contracts.getGroupLabelProps(groupRecord.id)
        const isGroupVisible = visibleGroupIds.has(groupRecord.id)

        return html`
          <div
            part="group"
            id=${groupProps.id}
            role=${groupProps.role}
            aria-labelledby=${groupProps['aria-labelledby']}
            ?hidden=${!this.open || !isGroupVisible}
          >
            <div
              part="group-label"
              id=${groupLabelProps.id}
              role=${groupLabelProps.role}
            >${groupRecord.label}</div>
            <slot name=${groupRecord.id}></slot>
          </div>
        `
      })}
      <slot @slotchange=${this.handleSlotChange}></slot>
    `
  }

  protected override render() {
    const isSelectOnly = this.type === 'select-only'

    const inputProps = this.model?.contracts.getInputProps() ?? {
      id: `${this.idBase}-input`,
      role: 'combobox' as const,
      tabindex: '0' as const,
      'aria-haspopup': 'listbox' as const,
      'aria-expanded': this.open ? 'true' : 'false',
      'aria-controls': `${this.idBase}-listbox`,
      'aria-autocomplete': isSelectOnly ? undefined : ('list' as const),
      'aria-activedescendant': undefined,
      'aria-label': this.ariaLabel || undefined,
    }

    const listboxProps = this.model?.contracts.getListboxProps() ?? {
      id: `${this.idBase}-listbox`,
      role: 'listbox' as const,
      tabindex: '-1' as const,
      'aria-label': this.ariaLabel || undefined,
    }

    const hasGroups = this.groupRecords.length > 0

    return html`
      <div part="base">
        <div part="input-wrapper" class="cv-u-control-shell">
          ${this.renderTags()}
          ${
            isSelectOnly
              ? html`
                <div
                  id=${inputProps.id}
                  role=${inputProps.role}
                  tabindex=${inputProps.tabindex}
                  aria-haspopup=${inputProps['aria-haspopup']}
                  aria-expanded=${inputProps['aria-expanded']}
                  aria-controls=${inputProps['aria-controls']}
                  aria-activedescendant=${inputProps['aria-activedescendant'] ?? nothing}
                  aria-label=${inputProps['aria-label'] ?? nothing}
                  aria-invalid=${this.invalid ? 'true' : nothing}
                  part="trigger"
                  class="cv-u-row cv-u-fill"
                  @click=${this.handleInputClick}
                  @keydown=${this.handleKeyDown}
                >
                  <span part="label" class="cv-u-fill">${this.getSelectedOptionLabel()}</span>
                </div>
              `
              : html`
                <input
                  id=${inputProps.id}
                  role=${inputProps.role}
                  tabindex=${inputProps.tabindex}
                  aria-haspopup=${inputProps['aria-haspopup']}
                  aria-expanded=${inputProps['aria-expanded']}
                  aria-controls=${inputProps['aria-controls']}
                  aria-autocomplete=${inputProps['aria-autocomplete'] ?? nothing}
                  aria-activedescendant=${inputProps['aria-activedescendant'] ?? nothing}
                  aria-label=${inputProps['aria-label'] ?? nothing}
                  aria-invalid=${this.invalid ? 'true' : nothing}
                  .value=${this.inputValue}
                  placeholder=${this.placeholder}
                  part="input"
                  class="cv-u-fill"
                  @input=${this.handleInputChange}
                  @focus=${this.handleInputFocus}
                  @click=${this.handleInputClick}
                  @keydown=${this.handleKeyDown}
                />
              `
          }
          ${this.renderClearButton()}
        </div>

        <div
          id=${listboxProps.id}
          role=${listboxProps.role}
          tabindex=${listboxProps.tabindex}
          aria-label=${listboxProps['aria-label'] ?? nothing}
          aria-multiselectable=${listboxProps['aria-multiselectable'] ?? nothing}
          ?hidden=${!this.open}
          part="listbox"
          class="cv-u-panel-shell cv-u-discrete-presence"
        >
          ${hasGroups ? this.renderListboxContent() : html`<slot @slotchange=${this.handleSlotChange}></slot>`}
        </div>
      </div>
    `
  }
}
