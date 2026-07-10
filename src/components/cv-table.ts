import {createTable, type TableModel, type TableSortDirection} from '@chromvoid/headless-ui/table'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVTableCell} from './cv-table-cell'
import {CVTableColumn} from './cv-table-column'
import {CVTableRow} from './cv-table-row'

export interface CVTableEventDetail {
  sortColumnId: string | null
  sortDirection: TableSortDirection
}

export interface CVTableSelectionChangeDetail {
  selectedRowIds: string[]
  selectable: 'single' | 'multi' | undefined
}

export interface CVTableFocusChangeDetail {
  rowIndex: number | null
  columnIndex: number | null
}

export type CVTableInputEvent = CustomEvent<CVTableEventDetail>
export type CVTableChangeEvent = CustomEvent<CVTableEventDetail>
export type CVTableSelectionChangeEvent = CustomEvent<CVTableSelectionChangeDetail>
export type CVTableFocusChangeEvent = CustomEvent<CVTableFocusChangeDetail>

export interface CVTableEventMap {
  'cv-input': CVTableInputEvent
  'cv-change': CVTableChangeEvent
  'cv-selection-change': CVTableSelectionChangeEvent
  'cv-focus-change': CVTableFocusChangeEvent
}

interface TableColumnRecord {
  id: string
  index?: number
  sortable: boolean
  element: CVTableColumn
}

interface TableCellRecord {
  columnId: string
  rowHeader: boolean
  colspan?: number
  rowspan?: number
  element: CVTableCell
}

interface TableRowRecord {
  id: string
  index?: number
  cells: TableCellRecord[]
  element: CVTableRow
}

interface TableSortSnapshot {
  sortColumnId: string | null
  sortDirection: TableSortDirection
}

const sortDirections: readonly TableSortDirection[] = ['none', 'ascending', 'descending']
const tableKeysToPrevent = new Set(['Enter', ' ', 'Spacebar'])

let cvTableNonce = 0

export class CVTable extends ReatomLitElement {
  static elementName = 'cv-table'

  static get properties() {
    return {
      sortColumn: {type: String, attribute: 'sort-column', reflect: true},
      sortDirection: {type: String, attribute: 'sort-direction', reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
      ariaLabelledBy: {type: String, attribute: 'aria-labelledby'},
      totalColumnCount: {type: Number, attribute: 'total-column-count', reflect: true},
      totalRowCount: {type: Number, attribute: 'total-row-count', reflect: true},
      selectable: {type: String, reflect: true},
      interactive: {type: Boolean, reflect: true},
      stickyHeader: {type: Boolean, attribute: 'sticky-header', reflect: true},
      striped: {type: Boolean, reflect: true},
      compact: {type: Boolean, reflect: true},
      bordered: {type: Boolean, reflect: true},
      pageSize: {type: Number, attribute: 'page-size', reflect: true},
    }
  }

  declare sortColumn: string
  declare sortDirection: TableSortDirection
  declare ariaLabel: string
  declare ariaLabelledBy: string
  declare totalColumnCount: number
  declare totalRowCount: number
  declare selectable: 'single' | 'multi' | undefined
  declare interactive: boolean
  declare stickyHeader: boolean
  declare striped: boolean
  declare compact: boolean
  declare bordered: boolean
  declare pageSize: number

  private readonly idBase = `cv-table-${++cvTableNonce}`
  private columnRecords: TableColumnRecord[] = []
  private rowRecords: TableRowRecord[] = []
  private columnListeners = new WeakMap<CVTableColumn, {click: EventListener; keydown: EventListener}>()
  private rowListeners = new WeakMap<CVTableRow, EventListener>()
  private childObserver: MutationObserver | null = null
  private model: TableModel

  constructor() {
    super()
    this.sortColumn = ''
    this.sortDirection = 'none'
    this.ariaLabel = ''
    this.ariaLabelledBy = ''
    this.totalColumnCount = 0
    this.totalRowCount = 0
    this.selectable = undefined
    this.interactive = false
    this.stickyHeader = false
    this.striped = false
    this.compact = false
    this.bordered = false
    this.pageSize = 10
    this.model = createTable({
      idBase: this.idBase,
      columns: [],
      rows: [],
      ariaLabel: 'Table',
    })
  }

  static styles = [
    css`
      :host {
        display: block;
      }

      [part='base'] {
        display: table;
        inline-size: 100%;
        border-collapse: collapse;
        border-spacing: 0;
        border: 1px solid var(--cv-table-border-color, var(--cv-color-border, #2a3245));
        border-radius: var(--cv-table-border-radius, var(--cv-radius-md, 10px));
        overflow: hidden;
        background: var(--cv-table-background, var(--cv-color-surface, #141923));
      }

      [part='head'] {
        display: table-header-group;
      }

      [part='head-row'] {
        display: table-row;
        background: var(--cv-table-header-background, var(--cv-color-surface-glass-strong));
      }

      :host([sticky-header]) [part='head-row'] {
        position: sticky;
        top: 0;
        z-index: 1;
      }

      [part='body'] {
        display: table-row-group;
      }

      :host([striped]) ::slotted(cv-table-row:nth-child(even)) {
        background: var(--cv-table-stripe-background, var(--cv-color-surface-secondary-glass-strong));
      }

      :host([compact]) ::slotted(cv-table-row) {
        --cv-table-cell-padding-block: var(--cv-table-compact-cell-padding-block, var(--cv-space-1, 4px));
        --cv-table-cell-padding-inline: var(--cv-table-compact-cell-padding-inline, var(--cv-space-2, 8px));
      }

      :host([bordered]) ::slotted(cv-table-row) {
        --_cv-table-cell-border: 1px solid var(--cv-table-border-color, var(--cv-color-border, #2a3245));
      }

      :host([interactive]) {
        outline: none;
      }

      :host([selectable]) ::slotted(cv-table-row) {
        cursor: pointer;
      }

      [part='base']:focus-visible {
        outline: 2px solid var(--cv-table-focus-outline-color, var(--cv-color-primary, #65d7ff));
        outline-offset: -2px;
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
    this.rebuildModelFromSlot(false, false)
    this.observeChildren()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.childObserver?.disconnect()
    this.childObserver = null
    this.detachColumnListeners()
    this.detachRowListeners()
  }

  /**
   * Rows / columns added after the first render WITHOUT an explicit `slot`
   * attribute never get auto-assigned to a named slot until a slotchange fires,
   * and a slotchange on a named slot only fires once the element already carries
   * that slot — a chicken-and-egg deadlock. Observe direct children so that
   * late-added cv-table-row / cv-table-column elements (and removals) trigger a
   * rebuild which assigns their slot and registers them in the model.
   */
  private observeChildren(): void {
    if (this.childObserver) return

    this.childObserver = new MutationObserver((mutations) => {
      const touchesTableChild = mutations.some((mutation) =>
        [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
          if (!(node instanceof Element)) return false
          const tag = node.tagName.toLowerCase()
          return tag === CVTableColumn.elementName || tag === CVTableRow.elementName
        }),
      )

      if (touchesTableChild) {
        this.rebuildModelFromSlot(true, true)
      }
    })

    this.childObserver.observe(this, {childList: true})
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('ariaLabel') ||
      changedProperties.has('ariaLabelledBy') ||
      changedProperties.has('totalColumnCount') ||
      changedProperties.has('totalRowCount') ||
      changedProperties.has('selectable') ||
      changedProperties.has('interactive') ||
      changedProperties.has('pageSize')
    ) {
      this.rebuildModelFromSlot(true, false)
      return
    }

    if (changedProperties.has('sortColumn') || changedProperties.has('sortDirection')) {
      const nextSortColumn = this.normalizeText(this.sortColumn) || null
      const nextSortDirection = this.normalizeSortDirection(this.sortDirection)

      const current = this.captureSortState()
      if (current.sortColumnId === nextSortColumn && current.sortDirection === nextSortDirection) {
        return
      }

      if (!nextSortColumn || nextSortDirection === 'none') {
        this.model.actions.clearSort()
      } else {
        this.model.actions.sortBy(nextSortColumn, nextSortDirection)
      }

      // Programmatic property/attribute writes are silent, matching native
      // form controls (user interactions go through handleColumnClick/KeyDown).
      this.applySortInteraction(current, true)
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    if (!changedProperties.has('sortColumn') && !changedProperties.has('sortDirection')) {
      this.syncElementsFromModel()
    }
  }

  // Lit's String converter resolves a removed attribute to `null`, so guard
  // against `null.trim()` TypeErrors when sort-column / aria-label /
  // aria-labelledby are removed at runtime.
  private normalizeText(value: string | null | undefined): string {
    return (value ?? '').trim()
  }

  private normalizeSortDirection(value: string): TableSortDirection {
    if ((sortDirections as readonly string[]).includes(value)) {
      return value as TableSortDirection
    }

    return 'none'
  }

  private resolveIndex(value: number, attributeValue?: string | null): number | undefined {
    const fallback = Number.parseInt(this.normalizeText(attributeValue), 10)
    const resolved = Number.isFinite(value) && value >= 1 ? value : fallback

    if (!Number.isFinite(resolved) || resolved < 1) {
      return undefined
    }

    return Math.floor(resolved)
  }

  private resolveSpan(value: number, attributeValue?: string | null): number | undefined {
    const fallback = Number.parseInt(this.normalizeText(attributeValue), 10)
    const resolved = Number.isFinite(value) && value >= 2 ? value : fallback

    if (!Number.isFinite(resolved) || resolved < 2) {
      return undefined
    }

    return Math.floor(resolved)
  }

  private getColumnElements(): CVTableColumn[] {
    return Array.from(this.children).filter(
      (element): element is CVTableColumn => element.tagName.toLowerCase() === CVTableColumn.elementName,
    )
  }

  private getRowElements(): CVTableRow[] {
    return Array.from(this.children).filter(
      (element): element is CVTableRow => element.tagName.toLowerCase() === CVTableRow.elementName,
    )
  }

  private getCellElements(row: CVTableRow): CVTableCell[] {
    return Array.from(row.children).filter(
      (element): element is CVTableCell => element.tagName.toLowerCase() === CVTableCell.elementName,
    )
  }

  private ensureColumnValue(column: CVTableColumn, index: number): string {
    const normalized = this.normalizeText(column.value) || this.normalizeText(column.getAttribute('value'))
    if (normalized) return normalized

    const fallback = `column-${index + 1}`
    column.value = fallback
    return fallback
  }

  private ensureRowValue(row: CVTableRow, index: number): string {
    const normalized = this.normalizeText(row.value) || this.normalizeText(row.getAttribute('value'))
    if (normalized) return normalized

    const fallback = `row-${index + 1}`
    row.value = fallback
    return fallback
  }

  private resolveCellColumnId(cell: CVTableCell, index: number): string {
    const normalized = this.normalizeText(cell.column) || this.normalizeText(cell.getAttribute('column'))
    if (normalized) return normalized

    const fallback = this.columnRecords[index]?.id ?? ''
    cell.column = fallback
    return fallback
  }

  private captureSortState(): TableSortSnapshot {
    return {
      sortColumnId: this.model.state.sortColumnId(),
      sortDirection: this.model.state.sortDirection(),
    }
  }

  private rebuildModelFromSlot(preserveSort: boolean, requestRender = true): void {
    // Pattern 9: a `sort-column` set declaratively (or via property) before the
    // columns are slotted resolves against an empty model, so when preserving
    // from the model returns null, fall back to the declared property values.
    const declaredSort = {
      sortColumnId: this.normalizeText(this.sortColumn) || null,
      sortDirection: this.normalizeSortDirection(this.sortDirection),
    }
    let previousSort: TableSortSnapshot
    if (preserveSort) {
      const captured = this.captureSortState()
      previousSort = captured.sortColumnId ? captured : declaredSort
    } else {
      previousSort = declaredSort
    }

    // Preserve selection & focus across a model rebuild (config-prop change,
    // late row/column registration, slotchange). createTable would otherwise
    // silently reset both with no cv-selection-change.
    const previousSelectedRowIds = Array.from(this.model.state.selectedRowIds())
    const previousFocusedRowIndex = this.model.state.focusedRowIndex()
    const previousFocusedColumnIndex = this.model.state.focusedColumnIndex()

    this.detachColumnListeners()
    this.detachRowListeners()

    this.columnRecords = this.getColumnElements().map((element, index) => {
      const id = this.ensureColumnValue(element, index)
      element.slot = 'columns'

      return {
        id,
        index: this.resolveIndex(element.index, element.getAttribute('index')),
        sortable: element.sortable || element.hasAttribute('sortable'),
        element,
      }
    })

    const columnIds = new Set(this.columnRecords.map((record) => record.id))

    this.rowRecords = this.getRowElements().map((row, rowIndex) => {
      const id = this.ensureRowValue(row, rowIndex)
      row.slot = 'rows'

      const cells = this.getCellElements(row).map((cell, cellIndex) => ({
        columnId: this.resolveCellColumnId(cell, cellIndex),
        rowHeader: cell.rowHeader || cell.hasAttribute('row-header'),
        colspan: this.resolveSpan(cell.colspan, cell.getAttribute('colspan')),
        rowspan: this.resolveSpan(cell.rowspan, cell.getAttribute('rowspan')),
        element: cell,
      }))

      return {
        id,
        index: this.resolveIndex(row.index, row.getAttribute('index')),
        cells,
        element: row,
      }
    })

    const initialSortColumnId =
      previousSort.sortColumnId && columnIds.has(previousSort.sortColumnId) ? previousSort.sortColumnId : null
    const initialSortDirection = initialSortColumnId ? previousSort.sortDirection : 'none'

    const normalizedLabel = this.normalizeText(this.ariaLabel)
    const normalizedLabelledBy = this.normalizeText(this.ariaLabelledBy)

    const currentRowIds = new Set(this.rowRecords.map((row) => row.id))
    const preservedSelectedRowIds = previousSelectedRowIds.filter((id) => currentRowIds.has(id))

    this.model = createTable({
      idBase: this.idBase,
      columns: this.columnRecords.map((column) => ({
        id: column.id,
        index: column.index,
      })),
      rows: this.rowRecords.map((row) => ({
        id: row.id,
        index: row.index,
      })),
      totalColumnCount: this.totalColumnCount > 0 ? this.totalColumnCount : undefined,
      totalRowCount: this.totalRowCount > 0 ? this.totalRowCount : undefined,
      ariaLabel: normalizedLabel || (!normalizedLabelledBy ? 'Table' : undefined),
      ariaLabelledBy: normalizedLabelledBy || undefined,
      initialSortColumnId,
      initialSortDirection,
      initialSelectedRowIds: preservedSelectedRowIds,
      initialFocusedRowIndex: previousFocusedRowIndex,
      initialFocusedColumnIndex: previousFocusedColumnIndex,
      selectable: this.selectable || false,
      interactive: this.interactive,
      pageSize: this.pageSize > 0 ? this.pageSize : 10,
    })

    this.attachColumnListeners()
    this.attachRowListeners()
    this.syncElementsFromModel()
    this.syncControlledValuesFromModel()

    if (requestRender) {
      this.requestUpdate()
    }
  }

  private detachColumnListeners(): void {
    for (const record of this.columnRecords) {
      const listeners = this.columnListeners.get(record.element)
      if (!listeners) continue

      record.element.removeEventListener('click', listeners.click)
      record.element.removeEventListener('keydown', listeners.keydown)
      this.columnListeners.delete(record.element)
    }
  }

  private attachColumnListeners(): void {
    for (const record of this.columnRecords) {
      const click = () => this.handleColumnClick(record.id, record.sortable)
      const keydown = (event: Event) =>
        this.handleColumnKeyDown(event as KeyboardEvent, record.id, record.sortable)

      record.element.addEventListener('click', click)
      record.element.addEventListener('keydown', keydown)
      this.columnListeners.set(record.element, {click, keydown})
    }
  }

  private detachRowListeners(): void {
    for (const record of this.rowRecords) {
      const listener = this.rowListeners.get(record.element)
      if (!listener) continue

      record.element.removeEventListener('click', listener)
      this.rowListeners.delete(record.element)
    }
  }

  private attachRowListeners(): void {
    if (!this.selectable) return

    for (const record of this.rowRecords) {
      const click = () => this.handleRowClick(record.id)
      record.element.addEventListener('click', click)
      this.rowListeners.set(record.element, click)
    }
  }

  private handleRowClick(rowId: string): void {
    if (!this.selectable) return

    if (this.selectable === 'single') {
      this.model.actions.selectRow(rowId)
    } else {
      this.model.actions.toggleRowSelection(rowId)
    }

    this.syncElementsFromModel()
    this.dispatchSelectionChange()
  }

  private dispatchSelectionChange(): void {
    const selectedSet = this.model.state.selectedRowIds()
    const detail: CVTableSelectionChangeDetail = {
      selectedRowIds: Array.from(selectedSet),
      selectable: this.selectable,
    }

    this.dispatchEvent(
      new CustomEvent<CVTableSelectionChangeEvent['detail']>('cv-selection-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchFocusChange(): void {
    const detail: CVTableFocusChangeDetail = {
      rowIndex: this.model.state.focusedRowIndex(),
      columnIndex: this.model.state.focusedColumnIndex(),
    }

    this.dispatchEvent(
      new CustomEvent<CVTableFocusChangeEvent['detail']>('cv-focus-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleGridKeyDown(event: KeyboardEvent): void {
    if (!this.interactive) return

    const prevRow = this.model.state.focusedRowIndex()
    const prevCol = this.model.state.focusedColumnIndex()

    this.model.actions.handleKeyDown({
      key: event.key,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
    })

    const newRow = this.model.state.focusedRowIndex()
    const newCol = this.model.state.focusedColumnIndex()

    // Check if the key was handled (focus moved or selection changed)
    const navigationKeys = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      ' ',
    ])

    const ctrlOrMeta = event.ctrlKey || event.metaKey
    const isCtrlA = (event.key === 'a' || event.key === 'A') && ctrlOrMeta
    // Only intercept Ctrl/Cmd+A (select-all) when multi-selection is active;
    // otherwise let the browser handle it.
    const isSelectAll = isCtrlA && this.selectable === 'multi'

    if (navigationKeys.has(event.key) || isSelectAll) {
      event.preventDefault()
    }

    // If focus changed, sync and dispatch
    if (newRow !== prevRow || newCol !== prevCol) {
      this.syncElementsFromModel()
      this.dispatchFocusChange()
    }

    // If Space was pressed (selection may have changed)
    if (event.key === ' ' && this.selectable) {
      this.syncElementsFromModel()
      this.dispatchSelectionChange()
    }

    // If Ctrl+A was pressed (select all)
    if (isCtrlA && this.selectable === 'multi') {
      this.syncElementsFromModel()
      this.dispatchSelectionChange()
    }
  }

  private syncControlledValuesFromModel(): void {
    this.sortColumn = this.model.state.sortColumnId() ?? ''
    this.sortDirection = this.model.state.sortDirection()
  }

  private syncElementsFromModel(): void {
    const validColumnIds = new Set(this.columnRecords.map((column) => column.id))

    for (const record of this.columnRecords) {
      const headerProps = this.model.contracts.getColumnHeaderProps(record.id)

      record.element.id = headerProps.id
      record.element.slot = 'columns'
      record.element.setAttribute('role', headerProps.role)
      record.element.setAttribute('aria-colindex', String(headerProps['aria-colindex']))
      // aria-sort is only meaningful on sortable columns; non-sortable columns
      // must not advertise aria-sort="none".
      if (record.sortable) {
        record.element.setAttribute('aria-sort', headerProps['aria-sort'] ?? 'none')
      } else {
        record.element.removeAttribute('aria-sort')
      }
      record.element.sortDirection = headerProps['aria-sort'] ?? 'none'
      record.element.sortable = record.sortable

      if (record.sortable) {
        record.element.setAttribute('tabindex', '0')
      } else {
        record.element.removeAttribute('tabindex')
      }
    }

    for (const row of this.rowRecords) {
      const rowProps = this.model.contracts.getRowProps(row.id)
      row.element.id = rowProps.id
      row.element.slot = 'rows'
      row.element.setAttribute('role', rowProps.role)
      row.element.setAttribute('aria-rowindex', String(rowProps['aria-rowindex']))

      // Selection: aria-selected and selected attribute
      if (rowProps['aria-selected'] != null) {
        row.element.setAttribute('aria-selected', rowProps['aria-selected'])
        row.element.selected = rowProps['aria-selected'] === 'true'
      } else {
        row.element.removeAttribute('aria-selected')
        row.element.selected = false
      }

      for (const cell of row.cells) {
        const hasColumn = validColumnIds.has(cell.columnId)
        cell.element.hidden = !hasColumn
        if (!hasColumn) continue

        if (cell.rowHeader) {
          const rowHeaderProps = this.model.contracts.getRowHeaderProps(row.id, cell.columnId)
          cell.element.id = rowHeaderProps.id
          cell.element.setAttribute('role', rowHeaderProps.role)
          cell.element.setAttribute('aria-rowindex', String(rowHeaderProps['aria-rowindex']))
          cell.element.setAttribute('aria-colindex', String(rowHeaderProps['aria-colindex']))
          cell.element.removeAttribute('aria-colspan')
          cell.element.removeAttribute('aria-rowspan')
          cell.element.removeAttribute('tabindex')
          cell.element.removeAttribute('data-active')
          continue
        }

        const cellProps = this.model.contracts.getCellProps(row.id, cell.columnId, {
          colspan: cell.colspan,
          rowspan: cell.rowspan,
        })

        cell.element.id = cellProps.id
        cell.element.setAttribute('role', cellProps.role)
        cell.element.setAttribute('aria-colindex', String(cellProps['aria-colindex']))
        cell.element.removeAttribute('aria-rowindex')

        if (cellProps['aria-colspan']) {
          cell.element.setAttribute('aria-colspan', String(cellProps['aria-colspan']))
        } else {
          cell.element.removeAttribute('aria-colspan')
        }

        if (cellProps['aria-rowspan']) {
          cell.element.setAttribute('aria-rowspan', String(cellProps['aria-rowspan']))
        } else {
          cell.element.removeAttribute('aria-rowspan')
        }

        // Grid navigation: tabindex and data-active
        if (cellProps.tabindex != null) {
          cell.element.setAttribute('tabindex', cellProps.tabindex)
        } else {
          cell.element.removeAttribute('tabindex')
        }

        if (cellProps['data-active'] != null) {
          cell.element.setAttribute('data-active', cellProps['data-active'])
        } else {
          cell.element.removeAttribute('data-active')
        }
      }
    }
  }

  private dispatchInput(detail: CVTableEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(detail: CVTableEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private applySortInteraction(previous: TableSortSnapshot, silent = false): void {
    this.syncElementsFromModel()

    const next = this.captureSortState()
    this.syncControlledValuesFromModel()

    if (silent) {
      return
    }

    if (previous.sortColumnId === next.sortColumnId && previous.sortDirection === next.sortDirection) {
      return
    }

    const detail: CVTableEventDetail = {
      sortColumnId: next.sortColumnId,
      sortDirection: next.sortDirection,
    }
    this.dispatchInput(detail)
    this.dispatchChange(detail)
  }

  private nextSortDirection(columnId: string): TableSortDirection {
    const currentColumn = this.model.state.sortColumnId()
    const currentDirection = this.model.state.sortDirection()

    if (currentColumn !== columnId || currentDirection === 'none') {
      return 'ascending'
    }

    if (currentDirection === 'ascending') {
      return 'descending'
    }

    return 'none'
  }

  private handleColumnClick(columnId: string, sortable: boolean): void {
    if (!sortable) return

    const previous = this.captureSortState()
    const nextDirection = this.nextSortDirection(columnId)

    if (nextDirection === 'none') {
      this.model.actions.sortBy(columnId, 'none')
    } else {
      this.model.actions.sortBy(columnId, nextDirection)
    }

    this.applySortInteraction(previous)
  }

  private handleColumnKeyDown(event: KeyboardEvent, columnId: string, sortable: boolean): void {
    if (!sortable) return
    if (!tableKeysToPrevent.has(event.key)) return

    event.preventDefault()
    this.handleColumnClick(columnId, sortable)
  }

  private handleColumnsSlotChange() {
    this.rebuildModelFromSlot(true, true)
  }

  private handleRowsSlotChange() {
    this.rebuildModelFromSlot(true, true)
  }

  private handleRowSlotChange() {
    this.rebuildModelFromSlot(true, true)
  }

  protected override render() {
    const tableProps = this.model.contracts.getTableProps()

    return html`
      <div
        id=${tableProps.id}
        role=${tableProps.role}
        aria-label=${tableProps['aria-label'] ?? nothing}
        aria-labelledby=${tableProps['aria-labelledby'] ?? nothing}
        aria-colcount=${String(tableProps['aria-colcount'])}
        aria-rowcount=${String(tableProps['aria-rowcount'])}
        aria-multiselectable=${tableProps['aria-multiselectable'] ?? nothing}
        tabindex=${tableProps.tabindex ?? nothing}
        part="base"
        @keydown=${this.handleGridKeyDown}
      >
        <div role="rowgroup" part="head">
          <div role="row" part="head-row">
            <slot name="columns" @slotchange=${this.handleColumnsSlotChange}></slot>
          </div>
        </div>
        <div role="rowgroup" part="body" @cv-table-row-slotchange=${this.handleRowSlotChange}>
          <slot name="rows" @slotchange=${this.handleRowsSlotChange}></slot>
        </div>
      </div>
    `
  }
}
