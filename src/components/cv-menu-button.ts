import {createMenuButton, type MenuButtonModel} from '@chromvoid/headless-ui/menu-button'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVIcon} from './cv-icon'
import {CVMenuItem} from './cv-menu-item'
import {
  clearPopoverLayout,
  getPlacementFallbacks,
  getPositionAreaForPlacement,
  isPopoverOpen,
  resolvePopoverBlockPosition,
  supportsNativeAnchoredAutoplacement,
  supportsNativePopover,
  toPopoverRect,
  type CVPopoverPlacement,
  type NativePopoverElement,
} from './cv-popover-positioning'
import {observeInheritedDirection, readInheritedDirection} from './text-direction.js'

export interface CVMenuButtonEventDetail {
  value: string | null
  activeId: string | null
  open: boolean
}

export type CVMenuButtonInputEvent = CustomEvent<CVMenuButtonEventDetail>
export type CVMenuButtonChangeEvent = CustomEvent<CVMenuButtonEventDetail>
export type CVMenuButtonActionEvent = CustomEvent<Record<string, never>>

export interface CVMenuButtonEventMap {
  'cv-input': CVMenuButtonInputEvent
  'cv-change': CVMenuButtonChangeEvent
  'cv-action': CVMenuButtonActionEvent
}

interface MenuItemRecord {
  id: string
  label: string
  disabled: boolean
  element: CVMenuItem
}

const menuButtonKeysToPrevent = new Set([
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'Enter',
  ' ',
  'Spacebar',
  'Escape',
  'Tab',
])

let cvMenuButtonNonce = 0
type CVMenuButtonPreset = 'icon-overflow'

export class CVMenuButton extends ReatomLitElement {
  static elementName = 'cv-menu-button'
  static override hostDisplay = 'inline-block' as const

  static get properties() {
    return {
      value: {type: String, reflect: true},
      open: {type: Boolean, reflect: true},
      disabled: {type: Boolean, reflect: true},
      split: {type: Boolean, reflect: true},
      size: {type: String, reflect: true},
      variant: {type: String, reflect: true},
      preset: {type: String, reflect: true},
      closeOnSelect: {type: Boolean, attribute: 'close-on-select', reflect: true},
      preserveFocusOnPointerOpen: {
        type: Boolean,
        attribute: 'preserve-focus-on-pointer-open',
        reflect: true,
      },
      ariaLabel: {type: String, attribute: 'aria-label'},
    }
  }

  declare value: string
  declare open: boolean
  declare disabled: boolean
  declare split: boolean
  declare size: 'small' | 'medium' | 'large'
  declare variant: 'default' | 'primary' | 'danger' | 'ghost'
  declare preset: CVMenuButtonPreset | undefined
  declare closeOnSelect: boolean
  declare preserveFocusOnPointerOpen: boolean
  declare ariaLabel: string

  private readonly idBase = `cv-menu-button-${++cvMenuButtonNonce}`
  private itemRecords: MenuItemRecord[] = []
  private itemListeners = new WeakMap<CVMenuItem, {click: EventListener; keydown: EventListener}>()
  private hasPrefixContent = false
  private hasLabelContent = false
  private hasSuffixContent = false
  private model?: MenuButtonModel
  private hasLayoutListeners = false
  private layoutFrame = -1
  private directionObserver: MutationObserver | null = null
  private pointerOpenPreserveRequested = false
  private preserveFocusForOpenSession = false

  constructor() {
    super()
    this.value = ''
    this.open = false
    this.disabled = false
    this.split = false
    this.size = 'medium'
    this.variant = 'default'
    this.preset = undefined
    this.closeOnSelect = true
    this.preserveFocusOnPointerOpen = false
    this.ariaLabel = ''
  }

  static styles = [
    css`
      :host {
        --cv-menu-button-min-height: 36px;
        --cv-menu-button-padding-inline: var(--cv-space-3, 12px);
        --cv-menu-button-padding-block: var(--cv-space-2, 8px);
        --cv-menu-button-border-radius: var(--cv-radius-sm, 6px);
        --cv-menu-button-border-color: var(--cv-color-border, #2a3245);
        --cv-menu-button-background: var(--cv-color-surface, #141923);
        --cv-menu-button-gap: var(--cv-space-2, 8px);
        --cv-menu-button-font-size: inherit;
        --cv-menu-button-menu-offset: var(--cv-space-1, 4px);
        --cv-menu-button-menu-align: start;
        --cv-menu-button-menu-min-inline-size: 180px;
        --cv-menu-button-menu-z-index: 20;
      }

      [part='base'] {
        position: relative;
        display: inline-flex;
      }

      /* --- shared button styles --- */
      [part='trigger'],
      [part='action'],
      [part='dropdown'] {
        display: inline-flex;
        justify-content: center;
        gap: var(--cv-menu-button-gap);
        min-block-size: var(--cv-menu-button-min-height);
        padding: var(--cv-menu-button-padding-block) var(--cv-menu-button-padding-inline);
        border: 1px solid var(--cv-menu-button-border-color);
        border-radius: var(--cv-menu-button-border-radius);
        background: var(--cv-menu-button-background);
        font-size: var(--cv-menu-button-font-size);
        color: var(--cv-color-text, #e8ecf6);
        cursor: pointer;
        font: inherit;
      }

      [part='trigger']:focus-visible,
      [part='action']:focus-visible,
      [part='dropdown']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      /* --- label / prefix / suffix / dropdown-icon --- */
      [part='dropdown-icon'] svg {
        width: 12px;
        height: 12px;
        fill: currentColor;
      }

      /* --- menu popup --- */
      [part='menu'] {
        position: absolute;
        left: 0;
        top: calc(100% + var(--cv-menu-button-menu-offset));
        z-index: var(--cv-menu-button-menu-z-index);
        box-sizing: border-box;
        inline-size: fit-content;
        min-inline-size: var(--cv-menu-button-menu-min-inline-size);
        max-inline-size: var(--cv-menu-button-menu-max-inline-size, calc(100vw - 16px));
        max-block-size: var(--cv-menu-button-menu-max-block-size, calc(100dvh - 16px));
        display: inline-grid;
        gap: var(--cv-space-1, 4px);
        align-content: start;
        padding: var(--cv-space-1, 4px);
        background: var(--cv-color-surface-elevated, #1d2432);
        overflow-y: auto;
      }

      [part='menu'][popover]:not(:popover-open) {
        display: none;
      }

      ::slotted([slot='menu']) {
        display: block;
      }

      /* --- :host([open]) --- */
      :host([open]) [part='trigger'],
      :host([open]) [part='dropdown'] {
        border-color: var(--cv-color-primary, #65d7ff);
      }

      /* --- :host([disabled]) --- */
      :host([disabled]) {
        opacity: 0.55;
        pointer-events: none;
        cursor: not-allowed;
      }

      /* --- :host([split]) --- */
      :host([split]) [part='base'] {
        display: inline-flex;
      }

      :host([split]) [part='action'] {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
        border-inline-end: none;
      }

      :host([split]) [part='dropdown'] {
        border-start-start-radius: 0;
        border-end-start-radius: 0;
        padding-inline: var(--cv-space-2, 8px);
      }

      /* --- sizes --- */
      :host([size='small']) {
        --cv-menu-button-min-height: 30px;
        --cv-menu-button-padding-inline: var(--cv-space-2, 8px);
        --cv-menu-button-padding-block: var(--cv-space-1, 4px);
      }

      :host([size='large']) {
        --cv-menu-button-min-height: 42px;
        --cv-menu-button-padding-inline: var(--cv-space-4, 16px);
        --cv-menu-button-padding-block: var(--cv-space-2, 8px);
      }

      :host([preset='icon-overflow']) {
        --cv-menu-button-gap: 0;
        --cv-menu-button-padding-inline: 0;
        --cv-menu-button-padding-block: 0;
        --cv-menu-button-menu-offset: var(--cv-menu-button-icon-overflow-menu-offset, var(--cv-space-1, 4px));
        --cv-menu-button-menu-min-inline-size: var(
          --cv-menu-button-icon-overflow-menu-min-inline-size,
          180px
        );
        --cv-menu-button-menu-max-inline-size: var(
          --cv-menu-button-icon-overflow-menu-max-inline-size,
          min(280px, calc(100vw - 16px))
        );
      }

      /* --- variant: default --- */
      :host([variant='default']) [part='trigger'],
      :host([variant='default']) [part='action'],
      :host([variant='default']) [part='dropdown'] {
        border-color: var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface, #141923);
      }

      /* --- variant: primary --- */
      :host([variant='primary']) [part='trigger'],
      :host([variant='primary']) [part='action'],
      :host([variant='primary']) [part='dropdown'] {
        border-color: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 52%,
          var(--cv-color-border, #2a3245)
        );
        background: color-mix(
          in oklab,
          var(--cv-color-primary, #65d7ff) 22%,
          var(--cv-color-surface, #141923)
        );
      }

      /* --- variant: danger --- */
      :host([variant='danger']) [part='trigger'],
      :host([variant='danger']) [part='action'],
      :host([variant='danger']) [part='dropdown'] {
        border-color: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 52%,
          var(--cv-color-border, #2a3245)
        );
        background: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 22%,
          var(--cv-color-surface, #141923)
        );
      }

      /* --- variant: ghost --- */
      :host([variant='ghost']) [part='trigger'],
      :host([variant='ghost']) [part='action'],
      :host([variant='ghost']) [part='dropdown'] {
        background: transparent;
        border-color: transparent;
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
    this.syncContentParts()
    if (!this.model) {
      this.rebuildModelFromSlot(false, false)
    } else {
      // Reconnect: disconnectedCallback detached item listeners but the model
      // survives, so no slotchange fires to re-attach them.
      this.attachItemListeners()
    }

    this.syncOutsidePointerListener()
    this.syncDirectionObserver(this.open)
    if (this.open) {
      this.syncNativeMenu()
      this.toggleLayoutListeners(!supportsNativeAnchoredAutoplacement())
      this.scheduleLayout()
    }
  }

  override disconnectedCallback(): void {
    this.detachItemListeners()
    this.syncOutsidePointerListener(true)
    this.toggleLayoutListeners(false)
    this.syncDirectionObserver(false)
    this.cancelLayoutFrame()

    const menu = this.getMenuElement()
    if (supportsNativePopover() && menu && isPopoverOpen(menu)) {
      try {
        menu.hidePopover?.()
      } catch {
        // Ignore native cleanup failures during detach.
      }
    }

    super.disconnectedCallback()
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('closeOnSelect') ||
      changedProperties.has('ariaLabel') ||
      changedProperties.has('split')
    ) {
      this.rebuildModelFromSlot(true, false)
      return
    }

    if (!this.model) return

    if (changedProperties.has('value')) {
      // removeAttribute('value') yields null via Lit's String converter; guard
      // against null.trim() and normalize back to a string.
      const next = (this.value ?? '').trim()
      if (this.value !== next) {
        this.value = next
      }

      if (next.length === 0) {
        // Programmatically clearing the value must drop the stale selection
        // instead of leaving the old item marked selected/aria-selected. The
        // selection is tracked component-side via this.value; rebuild with no
        // initial value so the previously-selected item is de-selected.
        const previousValue = (changedProperties.get('value') as string | null | undefined)?.trim()
        if (previousValue) {
          const previous = this.captureState()
          this.rebuildModelFromSlot(true, false, true)
          this.applyInteractionResult(previous, null)
        }
      } else {
        const record = this.itemRecords.find((item) => item.id === next)
        if (record && !record.disabled) {
          const previous = this.captureState()
          const wasOpen = this.model.state.isOpen()
          this.model.actions.select(next)
          // A programmatic value write routes through select + closeOnSelect and
          // would otherwise close an open menu. Mirror cv-menu's re-open guard so
          // setting the value does not collapse the open menu.
          if (wasOpen && !this.model.state.isOpen()) {
            this.model.actions.open()
          }
          this.applyInteractionResult(previous, next)
        }
      }
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
    this.syncNativeMenu()

    const shouldTrackLayout = this.open && !supportsNativeAnchoredAutoplacement()
    this.toggleLayoutListeners(shouldTrackLayout)
    this.syncDirectionObserver(this.open)

    if (this.open) {
      const menu = this.getMenuElement()
      if (menu) {
        menu.style.visibility = 'hidden'
      }
      this.scheduleLayout()
    } else {
      this.cancelLayoutFrame()
      const menu = this.getMenuElement()
      if (menu) {
        this.clearMenuLayout(menu)
      }
    }

    if (!changedProperties.has('value') && !changedProperties.has('open')) {
      this.syncItemElements()
    }
  }

  private getMenuElement(): NativePopoverElement | null {
    return this.shadowRoot?.querySelector('[part="menu"]') as NativePopoverElement | null
  }

  private getBaseElement(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part="base"]') as HTMLElement | null
  }

  private clearMenuLayout(menu: HTMLElement): void {
    clearPopoverLayout(menu)
    menu.style.minWidth = ''
    menu.style.visibility = ''
  }

  private getMenuOffset(): number {
    const raw = getComputedStyle(this).getPropertyValue('--cv-menu-button-menu-offset').trim()
    const parsed = Number.parseFloat(raw)
    return Number.isFinite(parsed) ? parsed : 4
  }

  private getMenuMinInlineSize(): number {
    const raw = getComputedStyle(this).getPropertyValue('--cv-menu-button-menu-min-inline-size').trim()
    const parsed = Number.parseFloat(raw)
    return Number.isFinite(parsed) ? parsed : 180
  }

  private getMenuPlacement(): CVPopoverPlacement {
    const rawAlign = getComputedStyle(this).getPropertyValue('--cv-menu-button-menu-align').trim()
    const align = rawAlign === 'center' || rawAlign === 'end' ? rawAlign : 'start'

    if (align === 'center') return 'bottom'
    if (align === 'end') return 'bottom-end'
    return 'bottom-start'
  }

  private applyMenuLayout(menu: HTMLElement, base: HTMLElement): void {
    const baseRect = base.getBoundingClientRect()
    const minWidth = Math.max(this.getMenuMinInlineSize(), Math.ceil(baseRect.width))
    const placement = this.getMenuPlacement()
    const direction = readInheritedDirection(this)

    clearPopoverLayout(menu)
    menu.style.minWidth = `${minWidth}px`

    if (supportsNativeAnchoredAutoplacement()) {
      menu.style.position = 'fixed'
      menu.style.inset = 'auto'
      menu.style.margin = '0'
      menu.style.marginTop = `${this.getMenuOffset()}px`
      menu.style.setProperty('position-area', getPositionAreaForPlacement(placement, direction))
      menu.style.setProperty(
        'position-try-fallbacks',
        getPlacementFallbacks(placement, direction)
          .slice(1)
          .map((candidate) => getPositionAreaForPlacement(candidate, direction))
          .join(', '),
      )
      menu.style.visibility = 'visible'
      return
    }

    menu.style.position = 'fixed'
    menu.style.top = '0px'
    menu.style.left = '0px'
    menu.style.visibility = 'hidden'

    const resolved = resolvePopoverBlockPosition(
      toPopoverRect(baseRect),
      toPopoverRect(menu.getBoundingClientRect()),
      placement,
      this.getMenuOffset(),
      {width: window.innerWidth, height: window.innerHeight, padding: 8},
      direction,
    )

    menu.style.top = `${resolved.top}px`
    menu.style.left = `${resolved.left}px`
    menu.style.visibility = 'visible'
  }

  private syncMenuLayout(): void {
    const menu = this.getMenuElement()
    const base = this.getBaseElement()
    if (!menu || !base) return

    this.applyMenuLayout(menu, base)
  }

  private cancelLayoutFrame(): void {
    if (this.layoutFrame === -1) return
    cancelAnimationFrame(this.layoutFrame)
    this.layoutFrame = -1
  }

  private scheduleLayout(): void {
    this.cancelLayoutFrame()
    this.layoutFrame = requestAnimationFrame(() => {
      this.layoutFrame = -1
      this.syncMenuLayout()
    })
  }

  private toggleLayoutListeners(nextState: boolean): void {
    if (this.hasLayoutListeners === nextState) return

    this.hasLayoutListeners = nextState
    if (nextState) {
      window.addEventListener('resize', this.handleViewportChange)
      window.addEventListener('scroll', this.handleViewportChange, true)
      return
    }

    window.removeEventListener('resize', this.handleViewportChange)
    window.removeEventListener('scroll', this.handleViewportChange, true)
  }

  private handleViewportChange = () => {
    if (!this.open) return
    this.scheduleLayout()
  }

  private syncDirectionObserver(shouldObserve: boolean): void {
    if (!shouldObserve) {
      this.directionObserver?.disconnect()
      this.directionObserver = null
      return
    }

    if (this.directionObserver) return

    this.directionObserver = observeInheritedDirection(this, () => {
      if (this.open) this.scheduleLayout()
    })
  }

  private syncNativeMenu(): void {
    if (!supportsNativePopover()) return

    const menu = this.getMenuElement()
    if (!menu) return

    const popoverOpen = isPopoverOpen(menu)
    if (this.open && !popoverOpen) {
      try {
        const source = this.getBaseElement()
        if (source) {
          menu.showPopover?.({source})
        } else {
          menu.showPopover?.()
        }
      } catch {
        // Ignore native open failures; component state remains authoritative.
      }
      return
    }

    if (!this.open && popoverOpen) {
      try {
        menu.hidePopover?.()
      } catch {
        // Ignore native close failures during state reconciliation.
      }
    }
  }

  private getItemElements(): CVMenuItem[] {
    return Array.from(this.children).filter(
      (element): element is CVMenuItem =>
        element.getAttribute('slot') === 'menu' && element.tagName.toLowerCase() === CVMenuItem.elementName,
    )
  }

  private syncContentParts(): boolean {
    const nextPrefixContent = this.hasNamedSlotContent('prefix')
    const nextLabelContent = this.hasDefaultSlotContent()
    const nextSuffixContent = this.hasNamedSlotContent('suffix')

    const changed =
      this.hasPrefixContent !== nextPrefixContent ||
      this.hasLabelContent !== nextLabelContent ||
      this.hasSuffixContent !== nextSuffixContent

    this.hasPrefixContent = nextPrefixContent
    this.hasLabelContent = nextLabelContent
    this.hasSuffixContent = nextSuffixContent

    return changed
  }

  private hasNamedSlotContent(slotName: string): boolean {
    return Array.from(this.children).some((node) => node.getAttribute('slot') === slotName)
  }

  private hasDefaultSlotContent(): boolean {
    for (const node of this.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        return true
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue
      }

      const element = node as Element
      const slotName = element.getAttribute('slot')
      if (!slotName) {
        return true
      }
    }

    return false
  }

  private ensureItemValue(item: CVMenuItem, index: number): string {
    const normalized = item.value?.trim()
    if (normalized) return normalized

    const fallback = `item-${index + 1}`
    item.value = fallback
    return fallback
  }

  private rebuildModelFromSlot(
    preserveState: boolean,
    requestRender = true,
    forceClearSelection = false,
  ): void {
    const itemElements = this.getItemElements()

    const previous = preserveState
      ? this.captureState()
      : {activeId: null, open: this.open, value: this.value || null}

    if (forceClearSelection) {
      previous.value = null
    }
    this.detachItemListeners()

    this.itemRecords = itemElements.map((element, index) => {
      const id = this.ensureItemValue(element, index)
      const label = element.textContent?.trim() || id

      return {
        id,
        label,
        disabled: element.disabled,
        element,
      }
    })

    const enabledIds = new Set(
      this.itemRecords.filter((record) => !record.disabled).map((record) => record.id),
    )
    const initialActiveId = previous.activeId && enabledIds.has(previous.activeId) ? previous.activeId : null

    this.model = createMenuButton({
      idBase: this.idBase,
      items: this.itemRecords.map((record) => ({
        id: record.id,
        label: record.label,
        disabled: record.disabled,
      })),
      ariaLabel: this.ariaLabel || undefined,
      initialOpen: previous.open,
      initialActiveId,
      closeOnSelect: this.closeOnSelect,
    })

    this.value = previous.value ?? ''
    this.open = this.model.state.isOpen()
    this.prefetchMenuIcons()
    this.attachItemListeners()
    this.syncItemElements()

    if (requestRender) {
      this.requestUpdate()
    }
  }

  private prefetchMenuIcons(): void {
    const names: string[] = []
    for (const record of this.itemRecords) {
      const icons = record.element.querySelectorAll<HTMLElement>(CVIcon.elementName)
      for (const icon of icons) {
        const name = icon.getAttribute('name')
        if (name) names.push(name)
      }
    }
    if (names.length > 0) {
      CVIcon.prefetch(names)
    }
  }

  private detachItemListeners(): void {
    for (const record of this.itemRecords) {
      const listeners = this.itemListeners.get(record.element)
      if (!listeners) continue

      record.element.removeEventListener('click', listeners.click)
      record.element.removeEventListener('keydown', listeners.keydown)
      this.itemListeners.delete(record.element)
    }
  }

  private attachItemListeners(): void {
    if (!this.model) return

    for (const record of this.itemRecords) {
      const click = (event: Event) => {
        event.preventDefault()
        this.handleItemClick(record.id)
      }

      const keydown = (event: Event) => {
        event.stopPropagation()
        this.handleKeyDown(event as KeyboardEvent)
      }

      record.element.addEventListener('click', click)
      record.element.addEventListener('keydown', keydown)
      this.itemListeners.set(record.element, {click, keydown})
    }
  }

  private syncItemElements(): void {
    if (!this.model) return

    for (const record of this.itemRecords) {
      const props = this.model.contracts.getItemProps(record.id)
      this.applyItemElementState(record.element, props, this.value === record.id, !this.open)
    }
  }

  private applyItemElementState(
    element: CVMenuItem,
    props: ReturnType<MenuButtonModel['contracts']['getItemProps']>,
    selected: boolean,
    hidden: boolean,
  ): void {
    element.id = props.id
    element.setAttribute('role', props.role)
    element.setAttribute('tabindex', props.tabindex)

    if (props['aria-disabled']) {
      element.setAttribute('aria-disabled', props['aria-disabled'])
    } else {
      element.removeAttribute('aria-disabled')
    }

    element.setAttribute('data-active', props['data-active'])
    element.active = props['data-active'] === 'true'
    element.selected = selected
    element.disabled = props['aria-disabled'] === 'true'
    element.hidden = hidden
  }

  private captureState() {
    return {
      value: (this.value ?? '').trim() || null,
      activeId: this.model?.state.activeId() ?? null,
      open: this.model?.state.isOpen() ?? this.open,
      restoreTargetId: this.model?.state.restoreTargetId() ?? null,
    }
  }

  private dispatchInput(detail: CVMenuButtonEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(detail: CVMenuButtonEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchAction(): void {
    this.dispatchEvent(
      new CustomEvent<CVMenuButtonActionEvent['detail']>('cv-action', {
        detail: {},
        bubbles: true,
        composed: true,
      }),
    )
  }

  private focusActiveItem(): void {
    if (!this.model || !this.open) return

    const activeId = this.model.state.activeId()
    if (!activeId) return

    const activeRecord = this.itemRecords.find((record) => record.id === activeId)
    activeRecord?.element.focus()
  }

  private applyInteractionResult(
    previous: {value: string | null; activeId: string | null; open: boolean; restoreTargetId: string | null},
    nextSelectedValue?: string | null,
  ): void {
    if (!this.model) return

    const next = this.captureState()
    const value = nextSelectedValue === undefined ? previous.value : nextSelectedValue

    this.value = value ?? ''
    this.open = next.open
    this.syncItemElements()

    const valueChanged = previous.value !== value
    const activeChanged = previous.activeId !== next.activeId
    const openChanged = previous.open !== next.open

    if (valueChanged || activeChanged || openChanged) {
      const detail: CVMenuButtonEventDetail = {
        value,
        activeId: next.activeId,
        open: next.open,
      }

      this.dispatchInput(detail)
      if (valueChanged) {
        this.dispatchChange(detail)
      }
    }

    const skipActiveFocus = this.preserveFocusForOpenSession && !previous.open && next.open
    if (activeChanged && !skipActiveFocus) {
      this.focusActiveItem()
    }

    if (next.restoreTargetId && !this.preserveFocusForOpenSession) {
      const trigger = this.shadowRoot?.querySelector(`[id="${next.restoreTargetId}"]`) as HTMLElement | null
      trigger?.focus()
    }

    if (!next.open) {
      this.preserveFocusForOpenSession = false
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
    this.model.actions.handleOutsidePointer()
    this.applyInteractionResult(previous)
  }

  private handleItemClick(id: string): void {
    if (!this.model) return
    const record = this.itemRecords.find((item) => item.id === id)
    if (!record || record.disabled) return

    const previous = this.captureState()
    this.model.actions.select(id)
    this.applyInteractionResult(previous, id)
  }

  private handleTriggerPointerDown(event: PointerEvent): void {
    if (this.disabled || !this.preserveFocusOnPointerOpen || this.open) return

    event.preventDefault()
    this.pointerOpenPreserveRequested = true
  }

  private handleTriggerClick() {
    if (this.disabled || !this.model) return

    const previous = this.captureState()
    if (this.pointerOpenPreserveRequested && !previous.open) {
      this.preserveFocusForOpenSession = true
    }
    this.pointerOpenPreserveRequested = false
    this.model.contracts.getTriggerProps().onClick()
    this.applyInteractionResult(previous)
  }

  private handleActionClick() {
    if (this.disabled) return
    this.dispatchAction()
  }

  private handleDropdownClick() {
    if (this.disabled || !this.model) return

    const previous = this.captureState()
    if (this.pointerOpenPreserveRequested && !previous.open) {
      this.preserveFocusForOpenSession = true
    }
    this.pointerOpenPreserveRequested = false
    this.model.contracts.getTriggerProps().onClick()
    this.applyInteractionResult(previous)
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.model) return

    // Tab must move focus out of the menu. The headless model already closes the
    // menu on Tab, but preventDefaulting it here trapped keyboard focus inside.
    // Let the browser perform the default Tab focus move (no preventDefault).
    if (event.key !== 'Tab' && menuButtonKeysToPrevent.has(event.key)) {
      event.preventDefault()
    }

    const previous = this.captureState()
    const selectedCandidate =
      this.model.state.isOpen() && (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
        ? this.model.state.activeId()
        : previous.value

    this.model.actions.handleKeyDown({
      key: event.key,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
    })

    this.applyInteractionResult(previous, selectedCandidate)
  }

  private handleMenuSlotChange() {
    this.rebuildModelFromSlot(true, true)
  }

  private handleContentSlotChange() {
    if (this.syncContentParts()) {
      this.requestUpdate()
    }
  }

  private renderDropdownIcon() {
    return html`
      <span part="dropdown-icon" class="cv-u-icon-slot" aria-hidden="true"
        ><svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          /></svg
      ></span>
    `
  }

  private renderSplitMode() {
    const triggerProps = this.model?.contracts.getTriggerProps()

    const menuProps = this.model?.contracts.getMenuProps() ?? {
      id: `${this.idBase}-menu`,
      role: 'menu' as const,
      tabindex: '-1' as const,
      'aria-label': this.ariaLabel || undefined,
      hidden: !this.open,
    }

    return html`
      <div part="base">
        <button
          type="button"
          part="action"
          class="cv-u-control-shell"
          ?disabled=${this.disabled}
          @click=${this.handleActionClick}
        >
          <span part="prefix" class="cv-u-icon-slot" ?hidden=${!this.hasPrefixContent}
            ><slot name="prefix" @slotchange=${this.handleContentSlotChange}></slot
          ></span>
          <span part="label" class="cv-u-row" ?hidden=${!this.hasLabelContent}
            ><slot @slotchange=${this.handleContentSlotChange}></slot
          ></span>
          <span part="suffix" class="cv-u-icon-slot" ?hidden=${!this.hasSuffixContent}
            ><slot name="suffix" @slotchange=${this.handleContentSlotChange}></slot
          ></span>
        </button>

        <button
          id=${triggerProps?.id ?? `${this.idBase}-trigger`}
          type="button"
          part="dropdown"
          tabindex=${triggerProps?.tabindex ?? '0'}
          aria-haspopup=${triggerProps?.['aria-haspopup'] ?? 'menu'}
          aria-expanded=${triggerProps?.['aria-expanded'] ?? (this.open ? 'true' : 'false')}
          aria-controls=${triggerProps?.['aria-controls'] ?? `${this.idBase}-menu`}
          aria-label=${triggerProps?.['aria-label'] ?? 'More options'}
          ?disabled=${this.disabled}
          @pointerdown=${this.handleTriggerPointerDown}
          @click=${this.handleDropdownClick}
          @keydown=${this.handleKeyDown}
          class="cv-u-control-shell"
        >
          ${this.renderDropdownIcon()}
        </button>

        <div
          id=${menuProps.id}
          role=${menuProps.role}
          tabindex=${menuProps.tabindex}
          aria-label=${menuProps['aria-label'] ?? nothing}
          popover=${supportsNativePopover() ? 'manual' : nothing}
          ?hidden=${menuProps.hidden}
          part="menu"
          class="cv-u-panel-shell"
          @keydown=${this.handleKeyDown}
        >
          <slot name="menu" @slotchange=${this.handleMenuSlotChange}></slot>
        </div>
      </div>
    `
  }

  private renderStandardMode() {
    const triggerProps = this.model?.contracts.getTriggerProps() ?? {
      id: `${this.idBase}-trigger`,
      role: 'button' as const,
      tabindex: '0' as const,
      'aria-haspopup': 'menu' as const,
      'aria-expanded': this.open ? 'true' : 'false',
      'aria-controls': `${this.idBase}-menu`,
      'aria-label': this.ariaLabel || undefined,
    }

    const menuProps = this.model?.contracts.getMenuProps() ?? {
      id: `${this.idBase}-menu`,
      role: 'menu' as const,
      tabindex: '-1' as const,
      'aria-label': this.ariaLabel || undefined,
      hidden: !this.open,
    }

    return html`
      <div part="base">
        <button
          id=${triggerProps.id}
          role=${triggerProps.role}
          tabindex=${triggerProps.tabindex}
          aria-haspopup=${triggerProps['aria-haspopup']}
          aria-expanded=${triggerProps['aria-expanded']}
          aria-controls=${triggerProps['aria-controls']}
          aria-label=${triggerProps['aria-label'] ?? nothing}
          type="button"
          part="trigger"
          class="cv-u-control-shell"
          ?disabled=${this.disabled}
          @pointerdown=${this.handleTriggerPointerDown}
          @click=${this.handleTriggerClick}
          @keydown=${this.handleKeyDown}
        >
          <span part="prefix" class="cv-u-icon-slot" ?hidden=${!this.hasPrefixContent}
            ><slot name="prefix" @slotchange=${this.handleContentSlotChange}></slot
          ></span>
          <span part="label" class="cv-u-row" ?hidden=${!this.hasLabelContent}
            ><slot @slotchange=${this.handleContentSlotChange}></slot
          ></span>
          <span part="suffix" class="cv-u-icon-slot" ?hidden=${!this.hasSuffixContent}
            ><slot name="suffix" @slotchange=${this.handleContentSlotChange}></slot
          ></span>
          ${this.renderDropdownIcon()}
        </button>

        <div
          id=${menuProps.id}
          role=${menuProps.role}
          tabindex=${menuProps.tabindex}
          aria-label=${menuProps['aria-label'] ?? nothing}
          popover=${supportsNativePopover() ? 'manual' : nothing}
          ?hidden=${menuProps.hidden}
          part="menu"
          class="cv-u-panel-shell"
          @keydown=${this.handleKeyDown}
        >
          <slot name="menu" @slotchange=${this.handleMenuSlotChange}></slot>
        </div>
      </div>
    `
  }

  protected override render() {
    if (this.split) {
      return this.renderSplitMode()
    }
    return this.renderStandardMode()
  }
}
