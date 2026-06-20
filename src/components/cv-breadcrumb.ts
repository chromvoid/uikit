import {createBreadcrumb, type BreadcrumbModel} from '@chromvoid/headless-ui/breadcrumb'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVBreadcrumbItem} from './cv-breadcrumb-item'

interface BreadcrumbItemRecord {
  id: string
  label: string
  href: string
  current: boolean
  element: CVBreadcrumbItem
}

// Tracks the generated host id assigned to a given item element so re-syncs do
// not clobber a user-assigned `id` and so we never reassign past a user value.
const generatedIdByElement = new WeakMap<CVBreadcrumbItem, string>()

let cvBreadcrumbNonce = 0

export class CVBreadcrumb extends ReatomLitElement {
  static elementName = 'cv-breadcrumb'

  static get properties() {
    return {
      value: {type: String, reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
      ariaLabelledBy: {type: String, attribute: 'aria-labelledby'},
    }
  }

  declare value: string
  declare ariaLabel: string
  declare ariaLabelledBy: string

  private readonly idBase = `cv-breadcrumb-${++cvBreadcrumbNonce}`
  private itemRecords: BreadcrumbItemRecord[] = []
  private model: BreadcrumbModel

  constructor() {
    super()
    this.value = ''
    this.ariaLabel = ''
    this.ariaLabelledBy = ''
    this.model = createBreadcrumb({
      idBase: this.idBase,
      items: [],
    })
  }

  static styles = [
    css`
      :host {
        display: block;
        min-inline-size: 0;
        max-inline-size: 100%;
      }

      [part='base'] {
        display: block;
        min-inline-size: 0;
        max-inline-size: 100%;
      }

      [part='list'] {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        row-gap: var(--cv-breadcrumb-row-gap, var(--cv-space-1, 4px));
        column-gap: var(--cv-breadcrumb-gap, var(--cv-space-2, 8px));
        min-inline-size: 0;
        max-inline-size: 100%;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      ::slotted(cv-breadcrumb-item) {
        min-inline-size: 0;
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
    this.rebuildModelFromSlot(false, false, this.value?.trim() || null)
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('ariaLabel') || changedProperties.has('ariaLabelledBy')) {
      this.rebuildModelFromSlot(true, false)
      return
    }

    if (changedProperties.has('value')) {
      const normalized = this.value?.trim() ?? ''
      if (this.value !== normalized) {
        this.value = normalized
      }

      this.rebuildModelFromSlot(true, false, normalized || null)
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    if (!changedProperties.has('value')) {
      this.syncItemElements()
    }
  }

  get items(): string[] {
    return this.itemRecords.map((item) => item.id)
  }

  private getItemElements(): CVBreadcrumbItem[] {
    return Array.from(this.children).filter(
      (element): element is CVBreadcrumbItem =>
        element.tagName.toLowerCase() === CVBreadcrumbItem.elementName,
    )
  }

  private ensureItemValue(item: CVBreadcrumbItem, index: number): string {
    const normalized = item.value?.trim()
    if (normalized) return normalized

    const fallback = `item-${index + 1}`
    item.value = fallback
    return fallback
  }

  private ensureItemHref(item: CVBreadcrumbItem): string {
    const normalized = item.href?.trim()
    if (normalized) return normalized

    item.href = '#'
    return '#'
  }

  /**
   * Derives the accessible label from the item's default-slot content only,
   * excluding nodes assigned to the prefix/suffix/separator slots so a custom
   * separator or icon does not leak into the model label.
   */
  private getItemLabel(item: CVBreadcrumbItem, index: number): string {
    let label = ''
    for (const node of Array.from(item.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        label += node.textContent ?? ''
        continue
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const slot = (node as Element).getAttribute('slot')
        if (slot === 'prefix' || slot === 'suffix' || slot === 'separator') continue
        label += node.textContent ?? ''
      }
    }

    return label.trim() || item.value?.trim() || `item-${index + 1}`
  }

  private rebuildModelFromSlot(
    preserveCurrent: boolean,
    requestRender = true,
    forcedCurrentId: string | null = null,
  ): void {
    const itemElements = this.getItemElements()
    const previousCurrentId = preserveCurrent ? this.model.state.currentId() : null

    this.itemRecords = itemElements.map((element, index) => ({
      id: this.ensureItemValue(element, index),
      label: this.getItemLabel(element, index),
      href: this.ensureItemHref(element),
      current: element.current,
      element,
    }))

    const preferredCurrentId = forcedCurrentId ?? previousCurrentId

    this.model = createBreadcrumb({
      idBase: this.idBase,
      ariaLabel: this.ariaLabel || undefined,
      ariaLabelledBy: this.ariaLabelledBy || undefined,
      items: this.itemRecords.map((record) => ({
        id: record.id,
        label: record.label,
        href: record.href,
        isCurrent: preferredCurrentId ? record.id === preferredCurrentId : record.current,
      })),
    })

    this.syncItemElements()
    this.value = this.model.state.currentId() ?? ''

    if (requestRender) {
      this.requestUpdate()
    }
  }

  private syncItemElements(): void {
    for (const [index, record] of this.itemRecords.entries()) {
      const itemProps = this.model.contracts.getItemProps(record.id)
      const linkProps = this.model.contracts.getLinkProps(record.id)
      const separatorProps = this.model.contracts.getSeparatorProps(record.id)

      // Preserve a user-assigned id: only stamp the generated id when the host
      // has no id, or still carries an id we generated earlier.
      const currentId = record.element.id
      const previousGenerated = generatedIdByElement.get(record.element)
      if (!currentId || currentId === previousGenerated) {
        if (record.element.id !== itemProps.id) {
          record.element.id = itemProps.id
        }
        generatedIdByElement.set(record.element, itemProps.id)
      }

      record.element.linkId = linkProps.id
      record.element.href = linkProps.href
      record.element.current = linkProps['aria-current'] === 'page'
      record.element.showSeparator =
        index < this.itemRecords.length - 1 && separatorProps['aria-hidden'] === 'true'
      record.element.setAttribute('data-current', itemProps['data-current'])
    }
  }

  private handleSlotChange() {
    this.rebuildModelFromSlot(true, true)
  }

  protected override render() {
    const rootProps = this.model.contracts.getRootProps()
    const listProps = this.model.contracts.getListProps()

    return html`
      <nav
        role=${rootProps.role}
        aria-label=${rootProps['aria-label'] ?? nothing}
        aria-labelledby=${rootProps['aria-labelledby'] ?? nothing}
        part="base"
      >
        <ol role=${listProps.role ?? nothing} part="list">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </ol>
      </nav>
    `
  }
}
