import {
  createTreegrid,
  type TreegridCellId,
  type TreegridCellRole,
  type TreegridModel,
  type TreegridRow,
  type TreegridSelectionMode,
} from '@chromvoid/headless-ui/treegrid'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVTreegridCell, type CVTreegridRowToggleEvent} from './cv-treegrid-cell'
import {CVTreegridColumn} from './cv-treegrid-column'
import {CVTreegridRow} from './cv-treegrid-row'

export interface CVTreegridEventDetail {
  value: string | null
  activeCell: TreegridCellId | null
  selectedValues: string[]
  expandedValues: string[]
}

interface TreegridColumnRecord {
  id: string
  index?: number
  disabled: boolean
  cellRole: TreegridCellRole
  element: CVTreegridColumn
}

interface TreegridRowRecord {
  id: string
  index?: number
  disabled: boolean
  parentId: string | null
  children: string[]
  element: CVTreegridRow
}

interface TreegridCellRecord {
  rowId: string
  colId: string
  disabled: boolean
  valid: boolean
  element: CVTreegridCell
}

interface TreegridSnapshot {
  activeCellId: TreegridCellId | null
  selectedRowIds: string[]
  expandedRowIds: string[]
}

const keysToPrevent = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'Enter',
  ' ',
  'Spacebar',
])

const cellKey = (rowId: string, colId: string): string => `${rowId}::${colId}`

const sameSetMembers = (left: readonly string[], right: readonly string[]) => {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((value) => rightSet.has(value))
}

const sameCellId = (left: TreegridCellId | null, right: TreegridCellId | null) =>
  left?.rowId === right?.rowId && left?.colId === right?.colId

const unique = (values: readonly string[]): string[] => [...new Set(values)]

let cvTreegridNonce = 0

export class CVTreegrid extends ReatomLitElement {
  static elementName = 'cv-treegrid'

  static get properties() {
    return {
      value: {type: String, reflect: true},
      selectedValues: {attribute: false},
      expandedValues: {attribute: false},
      selectionMode: {type: String, attribute: 'selection-mode', reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
      ariaLabelledBy: {type: String, attribute: 'aria-labelledby'},
    }
  }

  declare value: string
  declare selectedValues: string[]
  declare expandedValues: string[]
  declare selectionMode: TreegridSelectionMode
  declare ariaLabel: string
  declare ariaLabelledBy: string

  private readonly idBase = `cv-treegrid-${++cvTreegridNonce}`
  private columnRecords: TreegridColumnRecord[] = []
  private rowRecords: TreegridRowRecord[] = []
  private cellRecords: TreegridCellRecord[] = []
  private columnById = new Map<string, TreegridColumnRecord>()
  private rowById = new Map<string, TreegridRowRecord>()
  private cellListeners = new WeakMap<CVTreegridCell, {focus: EventListener; click: EventListener}>()
  private model: TreegridModel
  private _programmaticChange = false
  private fallbackRowCounter = 0

  constructor() {
    super()
    this.value = ''
    this.selectedValues = []
    this.expandedValues = []
    this.selectionMode = 'single'
    this.ariaLabel = ''
    this.ariaLabelledBy = ''
    this.model = createTreegrid({
      idBase: this.idBase,
      rows: [],
      columns: [],
    })
  }

  static styles = [
    css`
      :host {
        display: block;
        --cv-treegrid-column-count: 1;
      }

      [part='base'] {
        display: block;
        border: 1px solid var(--cv-color-border, #2a3245);
        border-radius: var(--cv-radius-md, 10px);
        overflow: auto;
        background: var(--cv-color-surface, #141923);
      }

      [part='base']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 1px;
      }

      slot[name='definitions'] {
        display: none;
      }

      [part='header'] {
        display: grid;
        grid-template-columns: repeat(var(--cv-treegrid-column-count), minmax(0, 1fr));
        border-bottom: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface-2, #181f2b);
      }

      [part='columnheader'] {
        min-inline-size: 0;
        padding: var(--cv-space-2, 8px) var(--cv-space-3, 12px);
        color: var(--cv-color-text-muted, #8892a6);
        font-size: var(--cv-font-size-sm, 13px);
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.detachCellListeners()
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('selectionMode') ||
      changedProperties.has('ariaLabel') ||
      changedProperties.has('ariaLabelledBy')
    ) {
      this.rebuildModelFromSlot(true, false)
      return
    }

    if (
      changedProperties.has('value') ||
      changedProperties.has('selectedValues') ||
      changedProperties.has('expandedValues')
    ) {
      this.applyProgrammaticUpdates(changedProperties)
    }
  }

  private applyProgrammaticUpdates(changedProperties: PropertyValues): void {
    const previous = this.captureSnapshot()
    let changed = false

    this._programmaticChange = true
    try {
      if (changedProperties.has('expandedValues')) {
        const next = this.normalizeExpandedValues(this.expandedValues)
        if (!sameSetMembers(next, [...this.model.state.expandedRowIds()])) {
          this.setExpandedRows(next)
          changed = true
        }
      }

      if (changedProperties.has('selectedValues')) {
        const next = this.normalizeRowIds(this.selectedValues)
        if (!sameSetMembers(next, [...this.model.state.selectedRowIds()])) {
          if (this.selectionMode === 'single') {
            this.setSelectedRows(next.slice(0, 1))
          } else {
            this.setSelectedRows(next)
          }

          changed = true
        }
      }

      if (changedProperties.has('value')) {
        const value = this.parseCellValue((this.value ?? '').trim())
        const next = value ?? null
        if (next && !sameCellId(next, this.model.state.activeCellId())) {
          this.setActiveCell(next)
          changed = true
        }
      }

      if (changed) {
        this.applyInteractionResult(previous)
      }
    } finally {
      this._programmaticChange = false
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    if (
      !changedProperties.has('value') &&
      !changedProperties.has('selectedValues') &&
      !changedProperties.has('expandedValues')
    ) {
      this.syncElementsFromModel()
      return
    }

    if (!changedProperties.has('value')) {
      this.syncElementsFromModel()
    }
  }

  private getColumnElements(): CVTreegridColumn[] {
    return Array.from(this.children).filter(
      (element): element is CVTreegridColumn =>
        element.tagName.toLowerCase() === CVTreegridColumn.elementName,
    )
  }

  private getRowElements(container: ParentNode): CVTreegridRow[] {
    return Array.from((container as Element).children).filter(
      (element): element is CVTreegridRow => element.tagName.toLowerCase() === CVTreegridRow.elementName,
    )
  }

  private getCellElements(row: CVTreegridRow): CVTreegridCell[] {
    return Array.from(row.children).filter(
      (element): element is CVTreegridCell => element.tagName.toLowerCase() === CVTreegridCell.elementName,
    )
  }

  private resolveIndex(value: number): number | undefined {
    if (!Number.isFinite(value) || value < 1) {
      return undefined
    }

    return Math.floor(value)
  }

  private ensureColumnValue(column: CVTreegridColumn, index: number): string {
    const normalized = column.value?.trim() || column.getAttribute('value')?.trim()
    if (normalized) {
      column.value = normalized
      return normalized
    }

    const fallback = `column-${index + 1}`
    column.value = fallback
    return fallback
  }

  private ensureRowValue(row: CVTreegridRow): string {
    const normalized = row.value?.trim() || row.getAttribute('value')?.trim()
    if (normalized) {
      row.value = normalized
      return normalized
    }

    const fallback = `row-${++this.fallbackRowCounter}`
    row.value = fallback
    return fallback
  }

  private resolveCellColumn(cell: CVTreegridCell, index: number): string {
    const normalized = cell.column?.trim() || cell.getAttribute('column')?.trim()
    if (normalized && this.columnById.has(normalized)) {
      cell.column = normalized
      return normalized
    }

    const fallback = this.columnRecords[index]?.id
    return fallback ?? ''
  }

  private parseCellValue(value: string): TreegridCellId | null {
    const [rowId, colId, ...rest] = value.split('::')
    if (rest.length > 0 || !rowId || !colId) return null

    return {rowId, colId}
  }

  private cellIdToString(cell: TreegridCellId | null): string {
    if (!cell) return ''
    return cellKey(cell.rowId, cell.colId)
  }

  private normalizeRowIds(values: readonly string[]): string[] {
    const rows = values.map((value) => value.trim()).filter((value) => value.length > 0)

    return unique(rows).filter((id) => this.rowById.has(id))
  }

  private normalizeExpandedValues(values: readonly string[]): string[] {
    const ids = values.map((value) => value.trim()).filter((value) => value.length > 0)

    return unique(ids).filter((id) => this.rowById.has(id))
  }

  private captureSnapshot(): TreegridSnapshot {
    return {
      activeCellId: this.model.state.activeCellId(),
      selectedRowIds: [...this.model.state.selectedRowIds()],
      expandedRowIds: [...this.model.state.expandedRowIds()],
    }
  }

  private rebuildModelFromSlot(preserveState: boolean, requestUpdate = true): void {
    const fallbackSelection = this.normalizeRowIds(this.selectedValues)
    const fallbackExpanded = this.normalizeExpandedValues(this.expandedValues)
    const fallbackActive = this.parseCellValue((this.value ?? '').trim())
    const previous = preserveState
      ? this.captureSnapshot()
      : {
          activeCellId: fallbackActive,
          selectedRowIds: this.selectionMode === 'single' ? fallbackSelection.slice(0, 1) : fallbackSelection,
          expandedRowIds: fallbackExpanded,
        }

    this.detachCellListeners()
    this.columnRecords = []
    this.rowRecords = []
    this.cellRecords = []
    this.columnById.clear()
    this.rowById.clear()
    this.fallbackRowCounter = 0

    this.parseColumns()
    const rows = this.parseRows(this)

    const validCells = this.cellRecords.filter((record) => record.valid)

    // Ragged rows: a row may be missing a cell for some column. The headless model
    // builds a full Cartesian (row × column) grid, so ArrowDown into a row that lacks
    // the active column's cell would leave roving tabindex on a non-existent element.
    // Mark every (row, col) pair that has no rendered valid cell as disabled so
    // keyboard navigation skips it (same fix as cv-grid).
    const presentCellKeys = new Set(validCells.map((cell) => cellKey(cell.rowId, cell.colId)))
    const missingCells: Array<{rowId: string; colId: string}> = []
    for (const row of this.rowRecords) {
      for (const column of this.columnRecords) {
        if (!presentCellKeys.has(cellKey(row.id, column.id))) {
          missingCells.push({rowId: row.id, colId: column.id})
        }
      }
    }

    const nextActive = previous.activeCellId
      ? previous.activeCellId
      : (this.value ?? '').trim()
        ? this.parseCellValue(this.value ?? '')
        : null

    const selectedFromState =
      this.selectionMode === 'single' ? previous.selectedRowIds.slice(0, 1) : previous.selectedRowIds

    this.model = createTreegrid({
      idBase: this.idBase,
      rows,
      columns: this.columnRecords.map((column) => ({
        id: column.id,
        index: column.index,
        disabled: column.disabled,
        cellRole: column.cellRole,
      })),
      disabledCells: [
        ...validCells.filter((cell) => cell.disabled).map((cell) => ({rowId: cell.rowId, colId: cell.colId})),
        ...missingCells,
      ],
      selectionMode: this.selectionMode,
      ariaLabel: this.ariaLabel || undefined,
      ariaLabelledBy: this.ariaLabelledBy || undefined,
      initialActiveCellId: this.normalizeActiveCell(nextActive, validCells),
      initialSelectedRowIds:
        this.selectionMode === 'single'
          ? this.normalizeRowIds(selectedFromState).slice(0, 1)
          : this.normalizeRowIds(selectedFromState),
      initialExpandedRowIds: this.normalizeExpandedValues(previous.expandedRowIds),
    })

    this.attachCellListeners()
    this.syncElementsFromModel()
    this.syncControlledValuesFromModel()

    if (requestUpdate) {
      this.requestUpdate()
    }
  }

  private parseColumns(): void {
    this.columnRecords = this.getColumnElements().map((element, index) => {
      const id = this.ensureColumnValue(element, index)
      element.slot = 'definitions'

      return {
        id,
        index: this.resolveIndex(element.index),
        disabled: element.disabled || element.hasAttribute('disabled'),
        cellRole: element.cellRole,
        element,
      }
    })

    this.columnById = new Map(this.columnRecords.map((column) => [column.id, column]))
  }

  private parseRows(container: ParentNode, parentId: string | null = null): TreegridRow[] {
    return this.getRowElements(container).map((rowElement, rowIndex) => {
      const id = this.ensureRowValue(rowElement)
      const parsedChildren = this.parseRows(rowElement, id)
      const childIds = parsedChildren.map((child) => child.id)

      if (parentId != null) {
        rowElement.slot = 'children'
      } else {
        rowElement.slot = ''
      }

      const record: TreegridRowRecord = {
        id,
        index: this.resolveIndex(rowElement.index),
        disabled: rowElement.disabled || rowElement.hasAttribute('disabled'),
        parentId,
        children: childIds,
        element: rowElement,
      }

      this.rowRecords.push(record)
      this.rowById.set(id, record)

      const rowCells = this.getCellElements(rowElement).map((cell, cellIndex) => {
        const colId = this.resolveCellColumn(cell, cellIndex)
        const valid = this.columnById.has(colId)

        return {
          rowId: id,
          colId,
          disabled: cell.disabled || cell.hasAttribute('disabled'),
          valid,
          element: cell,
        }
      })

      this.cellRecords.push(...rowCells)
      return {
        id,
        index: this.resolveIndex(rowElement.index),
        disabled: rowElement.disabled || rowElement.hasAttribute('disabled'),
        children: parsedChildren,
      } as TreegridRow
    })
  }

  private normalizeActiveCell(
    candidate: TreegridCellId | null,
    validCells: TreegridCellRecord[],
  ): TreegridCellId | null {
    if (!candidate) return null
    const key = this.cellKey(candidate)
    if (!validCells.some((cell) => this.cellKey(cell) === key && cell.valid)) {
      return null
    }

    return candidate
  }

  private cellKey(cell: Pick<TreegridCellRecord, 'rowId' | 'colId'>): string {
    return cellKey(cell.rowId, cell.colId)
  }

  private detachCellListeners(): void {
    for (const record of this.cellRecords) {
      const listeners = this.cellListeners.get(record.element)
      if (!listeners) continue

      record.element.removeEventListener('focus', listeners.focus)
      record.element.removeEventListener('click', listeners.click)
      this.cellListeners.delete(record.element)
    }
  }

  private attachCellListeners(): void {
    for (const record of this.cellRecords) {
      if (!record.valid) continue

      const focus = () => this.handleCellFocus(record)
      const click = () => this.handleCellPointer(record)

      record.element.addEventListener('focus', focus)
      record.element.addEventListener('click', click)
      this.cellListeners.set(record.element, {focus, click})
    }
  }

  private getVisibleRowIds(expandedRowIds: ReadonlySet<string>): Set<string> {
    const visible = new Set<string>()
    const roots = this.rowRecords.filter((record) => record.parentId == null)

    const visit = (rowId: string) => {
      const row = this.rowById.get(rowId)
      if (!row) return

      visible.add(rowId)
      if (!expandedRowIds.has(rowId)) return

      for (const childId of row.children) {
        visit(childId)
      }
    }

    for (const row of roots) {
      visit(row.id)
    }

    return visible
  }

  private getTreeColumnId(): string | null {
    return (
      this.columnRecords.find((record) => record.cellRole === 'rowheader')?.id ??
      this.columnRecords[0]?.id ??
      null
    )
  }

  private getTreeCellByRow(treeColumnId: string | null): Map<string, TreegridCellRecord> {
    const treeCells = new Map<string, TreegridCellRecord>()

    for (const cell of this.cellRecords) {
      if (!cell.valid) continue

      const current = treeCells.get(cell.rowId)
      if (!current || cell.colId === treeColumnId) {
        treeCells.set(cell.rowId, cell)
      }
    }

    return treeCells
  }

  private resetTreeCellElement(element: CVTreegridCell): void {
    element.treeControl = false
    element.branch = false
    element.expanded = false
    element.level = 1
    element.rowId = ''
  }

  private syncElementsFromModel(): void {
    if (!this.model) return

    const visibleRows = this.getVisibleRowIds(this.model.state.expandedRowIds())
    const columnCount = String(this.model.state.columnCount())
    const treeCellByRow = this.getTreeCellByRow(this.getTreeColumnId())
    const rowStateById = new Map<string, {branch: boolean; expanded: boolean; level: number}>()
    this.style.setProperty('--cv-treegrid-column-count', columnCount)

    for (const record of this.rowRecords) {
      const rowProps = this.model.contracts.getRowProps(record.id)
      const branch = record.children.length > 0
      const expanded = rowProps['aria-expanded'] === 'true'
      const level = Number(rowProps['aria-level'])
      const visible = visibleRows.has(record.id)

      record.element.style.setProperty('--cv-treegrid-column-count', columnCount)
      record.element.id = rowProps.id
      record.element.setAttribute('role', rowProps.role)
      record.element.setAttribute('aria-level', String(rowProps['aria-level']))
      record.element.setAttribute('aria-posinset', String(rowProps['aria-posinset']))
      record.element.setAttribute('aria-setsize', String(rowProps['aria-setsize']))
      record.element.setAttribute('aria-rowindex', String(rowProps['aria-rowindex']))
      record.element.setAttribute('aria-selected', rowProps['aria-selected'])
      record.element.setAttribute('tabindex', '-1')

      if (rowProps['aria-expanded']) {
        record.element.setAttribute('aria-expanded', rowProps['aria-expanded'])
      } else {
        record.element.removeAttribute('aria-expanded')
      }

      if (rowProps['aria-disabled']) {
        record.element.setAttribute('aria-disabled', rowProps['aria-disabled'])
      } else {
        record.element.removeAttribute('aria-disabled')
      }

      record.element.active = this.model.state.activeCellId()?.rowId === record.id
      record.element.selected = rowProps['aria-selected'] === 'true'
      record.element.disabled = rowProps['aria-disabled'] === 'true'
      record.element.expanded = expanded
      record.element.branch = branch
      record.element.hidden = !visible
      record.element.level = level

      if (!record.element.expanded) {
        record.element.expanded = false
      }

      rowStateById.set(record.id, {branch, expanded: record.element.expanded, level})
    }

    for (const record of this.cellRecords) {
      if (!record.valid || !visibleRows.has(record.rowId)) {
        this.resetTreeCellElement(record.element)
        record.element.hidden = true
        continue
      }

      try {
        const cellProps = this.model.contracts.getCellProps(record.rowId, record.colId)
        const rowState = rowStateById.get(record.rowId)
        const isTreeCell = treeCellByRow.get(record.rowId)?.element === record.element

        record.element.id = cellProps.id
        record.element.setAttribute('role', cellProps.role)
        record.element.setAttribute('tabindex', cellProps.tabindex)
        record.element.setAttribute('aria-colindex', String(cellProps['aria-colindex']))
        record.element.setAttribute('aria-selected', cellProps['aria-selected'])

        if (cellProps['aria-disabled']) {
          record.element.setAttribute('aria-disabled', cellProps['aria-disabled'])
        } else {
          record.element.removeAttribute('aria-disabled')
        }

        record.element.active = cellProps['data-active'] === 'true'
        record.element.selected = cellProps['aria-selected'] === 'true'
        record.element.disabled = cellProps['aria-disabled'] === 'true'
        record.element.hidden = false

        if (isTreeCell && rowState) {
          record.element.treeControl = true
          record.element.branch = rowState.branch
          record.element.expanded = rowState.expanded
          record.element.level = rowState.level
          record.element.rowId = record.rowId
        } else {
          this.resetTreeCellElement(record.element)
        }
      } catch {
        this.resetTreeCellElement(record.element)
        record.element.hidden = true
      }
    }
  }

  private syncControlledValuesFromModel(): void {
    this.value = this.cellIdToString(this.model.state.activeCellId())
    this.selectedValues = [...this.model.state.selectedRowIds()]
    this.expandedValues = [...this.model.state.expandedRowIds()]
  }

  private getEventDetail(): CVTreegridEventDetail {
    return {
      value: (this.value ?? '').trim() || null,
      activeCell: this.model.state.activeCellId(),
      selectedValues: [...this.model.state.selectedRowIds()],
      expandedValues: [...this.model.state.expandedRowIds()],
    }
  }

  private dispatchInput(detail: CVTreegridEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(detail: CVTreegridEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private applyInteractionResult(previous: TreegridSnapshot): void {
    if (!this.model) return

    this.syncElementsFromModel()
    const next = this.captureSnapshot()
    this.syncControlledValuesFromModel()

    const activeChanged = !sameCellId(previous.activeCellId, next.activeCellId)
    const selectedChanged = !sameSetMembers(previous.selectedRowIds, next.selectedRowIds)
    const expandedChanged = !sameSetMembers(previous.expandedRowIds, next.expandedRowIds)
    if (!activeChanged && !selectedChanged && !expandedChanged) {
      return
    }

    if (!this._programmaticChange) {
      const detail = this.getEventDetail()
      this.dispatchInput(detail)

      if (selectedChanged || expandedChanged) {
        this.dispatchChange(detail)
      }
    }

    // Programmatic writes (value=/selectedValues=/expandedValues=) must not steal focus,
    // matching native form-control behavior.
    if (activeChanged && !this._programmaticChange) {
      this.focusActiveCell()
    }
  }

  private setActiveCell(cell: TreegridCellId): void {
    try {
      const props = this.model.contracts.getCellProps(cell.rowId, cell.colId)
      props.onFocus()
    } catch {
      // ignore invalid ids
    }
  }

  private focusActiveCell(): void {
    const activeCell = this.model.state.activeCellId()
    if (!activeCell) return

    const activeRecord = this.cellRecords.find((record) => {
      if (record.rowId !== activeCell.rowId || record.colId !== activeCell.colId || !record.valid)
        return false
      return true
    })
    if (!activeRecord || activeRecord.element.disabled) return

    activeRecord.element.focus()
  }

  private selectRowFromActive(additive: boolean): void {
    const activeCell = this.model.state.activeCellId()
    if (!activeCell) return

    const activeRowId = activeCell.rowId
    if (this.selectionMode === 'multiple' && additive) {
      this.model.actions.toggleRowSelection(activeRowId)
      return
    }

    this.model.actions.selectRow(activeRowId)
  }

  private setSelectedRows(next: readonly string[]): void {
    const valid = this.normalizeRowIds(next)
    const target = new Set(valid)

    if (this.selectionMode === 'single') {
      const selected = target.values().next().value
      if (selected) {
        this.model.actions.selectRow(selected)
      } else {
        this.model.state.selectedRowIds.set(new Set<string>())
      }
      return
    }

    const current = new Set(this.model.state.selectedRowIds())

    for (const id of current) {
      if (!target.has(id)) {
        this.model.actions.toggleRowSelection(id)
      }
    }

    for (const id of target) {
      if (!current.has(id)) {
        this.model.actions.toggleRowSelection(id)
      }
    }
  }

  private setExpandedRows(next: readonly string[]): void {
    const target = new Set(this.normalizeExpandedValues(next))
    const current = new Set(this.model.state.expandedRowIds())

    for (const id of current) {
      if (!target.has(id)) {
        this.model.actions.collapseRow(id)
      }
    }

    for (const id of target) {
      if (!current.has(id)) {
        this.model.actions.expandRow(id)
      }
    }
  }

  private handleCellFocus(record: TreegridCellRecord) {
    if (record.element.disabled) return

    const previous = this.captureSnapshot()
    this.model.contracts.getCellProps(record.rowId, record.colId).onFocus()
    this.applyInteractionResult(previous)
  }

  private handleCellPointer(record: TreegridCellRecord) {
    if (record.element.disabled) return

    const previous = this.captureSnapshot()
    this.setActiveCellFromRecord(record)
    // In multiple mode, any pointer click (with or without Ctrl/Meta) accumulates
    // selection via toggleRowSelection. In single mode, plain click replaces selection.
    const additive = this.selectionMode === 'multiple'
    this.selectRowFromActive(additive)
    this.applyInteractionResult(previous)
    this.focusActiveCell()
  }

  private handleRowToggle(event: CVTreegridRowToggleEvent) {
    event.stopPropagation()

    const rowId = event.detail.rowId
    if (!this.rowById.has(rowId)) return

    const previous = this.captureSnapshot()
    this.model.actions.toggleRowExpanded(rowId)
    this.applyInteractionResult(previous)
  }

  private setActiveCellFromRecord(record: Pick<TreegridCellRecord, 'rowId' | 'colId'>): void {
    this.setActiveCell({rowId: record.rowId, colId: record.colId})
  }

  private handleTreegridKeyDown(event: KeyboardEvent) {
    if (!keysToPrevent.has(event.key)) {
      return
    }

    // Alt+Arrow (and Alt+Home/End) are browser-reserved and ignored by the model;
    // don't preventDefault or forward them so native shortcuts keep working.
    if (event.altKey) {
      return
    }

    event.preventDefault()
    const previous = this.captureSnapshot()

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      this.selectRowFromActive(event.ctrlKey || event.metaKey)
      this.applyInteractionResult(previous)
      return
    }

    this.model.actions.handleKeyDown({
      key: event.key,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
    })

    this.applyInteractionResult(previous)
  }

  private handleSlotChange() {
    this.rebuildModelFromSlot(true, true)
  }

  private getColumnLabel(record: TreegridColumnRecord): string {
    return (
      record.element.label ||
      record.element.getAttribute('label') ||
      record.element.textContent?.trim() ||
      record.id
    )
  }

  protected override render() {
    const root = this.model.contracts.getTreegridProps()
    const hasColumns = this.columnRecords.length > 0

    return html`
      <div
        part="base"
        role=${root.role}
        tabindex=${root.tabindex}
        aria-label=${root['aria-label'] ?? nothing}
        aria-labelledby=${root['aria-labelledby'] ?? nothing}
        aria-rowcount=${String(root['aria-rowcount'])}
        aria-colcount=${String(root['aria-colcount'])}
        aria-multiselectable=${root['aria-multiselectable']}
        @keydown=${this.handleTreegridKeyDown}
        @cv-treegrid-row-slotchange=${this.handleSlotChange}
        @cv-treegrid-row-toggle=${this.handleRowToggle}
      >
        <slot name="definitions" @slotchange=${this.handleSlotChange}></slot>
        ${hasColumns
          ? html`
              <div part="header" role="row">
                ${this.columnRecords.map(
                  (column, index) => html`
                    <span part="columnheader" role="columnheader" aria-colindex=${String(index + 1)}>
                      ${column.id === this.getTreeColumnId()
                        ? html`<span part="tree-column-header">${this.getColumnLabel(column)}</span>`
                        : this.getColumnLabel(column)}
                    </span>
                  `,
                )}
              </div>
            `
          : nothing}
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `
  }
}
