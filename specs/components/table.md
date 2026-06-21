# cv-table

Data table for displaying structured tabular content with optional sorting, row selection, and grid-style keyboard navigation.

**Headless:** [`createTable`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/table.md)

## Anatomy

```
<cv-table> (host)
└── <div part="base" role="table|grid">
    ├── <div role="rowgroup" part="head">
    │   └── <div role="row" part="head-row">
    │       └── <slot name="columns">       ← accepts <cv-table-column class="usage-demo__column-label"> children
    └── <div role="rowgroup" part="body" @cv-table-row-slotchange>
        └── <slot name="rows">               ← accepts <cv-table-row> children
```

## Attributes

| Attribute            | Type    | Default  | Description                                                                       |
| -------------------- | ------- | -------- | --------------------------------------------------------------------------------- |
| `sort-column`        | String  | `""`     | Currently sorted column id (reflected)                                            |
| `sort-direction`     | String  | `"none"` | Sort direction: `none` \| `ascending` \| `descending` (reflected)                 |
| `aria-label`         | String  | `""`     | Accessible label for the table root                                               |
| `aria-labelledby`    | String  | `""`     | `aria-labelledby` reference for the table root                                    |
| `total-column-count` | Number  | `0`      | Logical column count for virtualization (reflected)                               |
| `total-row-count`    | Number  | `0`      | Logical row count for virtualization (reflected)                                  |
| `selectable`         | String  | `""`     | Row selection mode: `single` \| `multi`. Empty or absent disables selection.      |
| `interactive`        | Boolean | `false`  | Enables grid navigation mode (switches role to `grid`, activates roving tabindex) |
| `sticky-header`      | Boolean | `false`  | Makes the header row stick to the top when scrolling                              |
| `striped`            | Boolean | `false`  | Alternating row background colors                                                 |
| `compact`            | Boolean | `false`  | Reduced cell padding for denser display                                           |
| `bordered`           | Boolean | `false`  | Visible borders between all cells                                                 |
| `page-size`          | Number  | `10`     | Rows per page for PageUp/PageDown in grid navigation mode (minimum 1)             |

## Slots

| Slot      | Description                                                                           |
| --------- | ------------------------------------------------------------------------------------- |
| `columns` | `<cv-table-column class="usage-demo__column-label">` children defining column headers |
| `rows`    | `<cv-table-row>` children containing table data rows                                  |

## CSS Parts

| Part       | Element | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| `base`     | `<div>` | Root table/grid element with role and ARIA attributes |
| `head`     | `<div>` | Header rowgroup wrapper                               |
| `head-row` | `<div>` | Header row containing column slots                    |
| `body`     | `<div>` | Body rowgroup wrapper containing row slots            |

## CSS Custom Properties

| Property                                 | Default                                          | Description                                    |
| ---------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `--cv-table-border-radius`               | `var(--cv-radius-md, 10px)`                      | Border radius of the table container           |
| `--cv-table-border-color`                | `var(--cv-color-border, #2a3245)`                | Border color of the table and cells            |
| `--cv-table-background`                  | `var(--cv-color-surface, #141923)`               | Table background color                         |
| `--cv-table-header-background`           | `var(--cv-color-surface-glass-strong)`           | Header row background                          |
| `--cv-table-stripe-background`           | `var(--cv-color-surface-secondary-glass-strong)` | Background for alternating rows when `striped` |
| `--cv-table-row-selected-background`     | `var(--cv-color-primary-surface)`                | Background for selected rows                   |
| `--cv-table-cell-padding-block`          | `var(--cv-space-2, 8px)`                         | Vertical cell padding                          |
| `--cv-table-cell-padding-inline`         | `var(--cv-space-3, 12px)`                        | Horizontal cell padding                        |
| `--cv-table-compact-cell-padding-block`  | `var(--cv-space-1, 4px)`                         | Vertical cell padding in compact mode          |
| `--cv-table-compact-cell-padding-inline` | `var(--cv-space-2, 8px)`                         | Horizontal cell padding in compact mode        |
| `--cv-table-focus-outline-color`         | `var(--cv-color-primary, #65d7ff)`               | Focus ring color for grid navigation           |

Additionally, component styles depend on theme tokens through fallback values:

| Theme Property       | Default   | Description                                          |
| -------------------- | --------- | ---------------------------------------------------- |
| `--cv-color-border`  | `#2a3245` | Base border color                                    |
| `--cv-color-surface` | `#141923` | Surface background color                             |
| `--cv-color-text`    | `#e8ecf6` | Default text color                                   |
| `--cv-color-primary` | `#65d7ff` | Primary accent color (focus, selection, active sort) |
| `--cv-radius-md`     | `10px`    | Border radius fallback                               |
| `--cv-space-1`       | `4px`     | Small spacing scale                                  |
| `--cv-space-2`       | `8px`     | Medium spacing scale                                 |
| `--cv-space-3`       | `12px`    | Medium-large spacing scale                           |

## Visual States

| Host selector            | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `:host([striped])`       | Alternating row backgrounds via `--cv-table-stripe-background` |
| `:host([compact])`       | Reduced cell padding via compact custom properties             |
| `:host([bordered])`      | Visible borders between all cells                              |
| `:host([sticky-header])` | Header row uses `position: sticky; top: 0`                     |
| `:host([interactive])`   | Grid navigation mode active; focus ring on active cell         |
| `:host([selectable])`    | Row selection enabled; selected rows highlighted               |

## Events

| Event                 | Detail                                                              | Description                                             |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| `cv-input`            | `{sortColumnId: string \| null, sortDirection: TableSortDirection}` | Fires on sort interaction (before commit)               |
| `cv-change`           | `{sortColumnId: string \| null, sortDirection: TableSortDirection}` | Fires when sort state changes                           |
| `cv-selection-change` | `{selectedRowIds: string[], selectable: 'single' \| 'multi'}`       | Fires when row selection changes via user interaction   |
| `cv-focus-change`     | `{rowIndex: number \| null, columnIndex: number \| null}`           | Fires when focused cell changes in grid navigation mode |

Sort events (`cv-input` / `cv-change`) fire only when sort state changes due to user interaction (column header click or keyboard activation). They share the same detail shape and follow the convention where `cv-input` fires on interaction and `cv-change` fires on committed state change.

`cv-table` does not reorder slotted rows by itself. Consumers own data ordering and should update row order from `cv-change` when visual sorting is needed.

`cv-selection-change` fires when selection changes due to user interaction (row click, Space key, Ctrl+A). It does not fire for programmatic attribute changes.

`cv-focus-change` fires when the focused cell changes during grid navigation. It does not fire for programmatic `setFocusedCell` calls.

## Reactive State Mapping

`cv-table` is a visual adapter over headless `createTable`.

### UIKit Property to Headless Binding

| UIKit Property       | Direction     | Headless Binding                                                                   |
| -------------------- | ------------- | ---------------------------------------------------------------------------------- |
| `sort-column`        | attr → action | `actions.sortBy(value, direction)` or `actions.clearSort()` when attribute changes |
| `sort-direction`     | attr → action | `actions.sortBy(column, value)` or `actions.clearSort()` when attribute changes    |
| `aria-label`         | attr → option | passed as `ariaLabel` in `createTable(options)`                                    |
| `aria-labelledby`    | attr → option | passed as `ariaLabelledBy` in `createTable(options)`                               |
| `total-column-count` | attr → option | passed as `totalColumnCount` in `createTable(options)`                             |
| `total-row-count`    | attr → option | passed as `totalRowCount` in `createTable(options)`                                |
| `selectable`         | attr → option | passed as `selectable` in `createTable(options)`                                   |
| `interactive`        | attr → option | passed as `interactive` in `createTable(options)`                                  |
| `page-size`          | attr → option | passed as `pageSize` in `createTable(options)`                                     |

### Headless State to DOM Reflection

| Headless State               | Direction    | DOM Reflection                                          |
| ---------------------------- | ------------ | ------------------------------------------------------- |
| `state.sortColumnId()`       | state → attr | `cv-table[sort-column]` host attribute                  |
| `state.sortDirection()`      | state → attr | `cv-table[sort-direction]` host attribute               |
| `state.selectedRowIds()`     | state → attr | `cv-table-row[selected]` boolean attribute on each row  |
| `state.focusedRowIndex()`    | state → DOM  | Active cell receives `tabindex="0"` and `.focus()` call |
| `state.focusedColumnIndex()` | state → DOM  | Active cell receives `tabindex="0"` and `.focus()` call |

### Headless Actions Called

| Action                                          | UIKit Trigger                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `actions.sortBy(columnId, direction)`           | Column header click or keyboard activation cycles sort direction      |
| `actions.clearSort()`                           | Sort direction cycles back to `none`                                  |
| `actions.selectRow(rowId)`                      | Row click when `selectable="single"`                                  |
| `actions.toggleRowSelection(rowId)`             | Row click when `selectable="multi"`, or Space key in interactive mode |
| `actions.selectAllRows()`                       | Ctrl/Cmd+A in interactive mode when `selectable="multi"`              |
| `actions.clearSelection()`                      | Programmatic API                                                      |
| `actions.deselectRow(rowId)`                    | Programmatic API                                                      |
| `actions.handleKeyDown(event)`                  | `keydown` event on the grid root when `interactive` is `true`         |
| `actions.moveFocus(direction)`                  | Arrow key navigation (delegated via `handleKeyDown`)                  |
| `actions.moveFocusToStart()`                    | Ctrl/Cmd+Home (delegated via `handleKeyDown`)                         |
| `actions.moveFocusToEnd()`                      | Ctrl/Cmd+End (delegated via `handleKeyDown`)                          |
| `actions.moveFocusToRowStart()`                 | Home key (delegated via `handleKeyDown`)                              |
| `actions.moveFocusToRowEnd()`                   | End key (delegated via `handleKeyDown`)                               |
| `actions.pageUp()`                              | PageUp key (delegated via `handleKeyDown`)                            |
| `actions.pageDown()`                            | PageDown key (delegated via `handleKeyDown`)                          |
| `actions.setFocusedCell(rowIndex, columnIndex)` | Cell click in interactive mode                                        |

### Headless Contracts Spread

| Contract                                      | UIKit Target                                     |
| --------------------------------------------- | ------------------------------------------------ |
| `contracts.getTableProps()`                   | Spread onto `[part="base"]` root element         |
| `contracts.getRowProps(rowId)`                | Spread onto each `cv-table-row` element          |
| `contracts.getCellProps(rowId, colId, span?)` | Spread onto each `cv-table-cell` element         |
| `contracts.getColumnHeaderProps(colId)`       | Spread onto each `cv-table-column` element       |
| `contracts.getRowHeaderProps(rowId, colId)`   | Spread onto `cv-table-cell[row-header]` elements |

### UIKit-Only Concerns (Not in Headless)

- **Display variants** (`striped`, `compact`, `bordered`): CSS-only visual modifiers, not part of headless state.
- **Sticky header** (`sticky-header`): CSS `position: sticky` on header, not part of headless state.
- **Visual selection indicators**: Row background highlighting for selected rows.
- **DOM focus management**: Calling `.focus()` on cells when `focusedRowIndex`/`focusedColumnIndex` change in headless state.
- **`preventDefault()`**: Called on keyboard events handled by `handleKeyDown` to prevent scrolling.
- **`cv-input` / `cv-change` / `cv-selection-change` / `cv-focus-change` events**: Custom DOM events dispatched by the UIKit wrapper, not part of the headless model.
- **Auto-generated fallback values**: `value` attributes on columns and rows receive auto-generated fallbacks (`column-N`, `row-N`) when not explicitly set.
- **Slot-based model rebuild**: Model is rebuilt from slotted children on `slotchange` events.

UIKit does not own sort, selection, or navigation logic; headless state is the source of truth.

## Usage

```html
<div class="table-demo-shell usage-demo" data-demo="table" data-live-demo-height="760">
  <section class="table-demo-hero usage-demo__hero" aria-labelledby="table-demo-title">
    <div class="table-demo-copy usage-demo__copy">
      <span class="table-demo-kicker usage-demo__kicker">Structured vault data</span>
      <h3 id="table-demo-title">Use table for scan-first records, not freeform cards.</h3>
      <p>
        Sort state, row selection, sticky headers, density modifiers, and grid keyboard navigation all stay on
        the same headless table contract.
      </p>
    </div>

    <dl class="table-demo-metrics usage-demo__metrics" aria-label="Table behavior summary">
      <div>
        <dt>Root</dt>
        <dd>table / grid</dd>
      </div>
      <div>
        <dt>Rows</dt>
        <dd>multi-select</dd>
      </div>
      <div>
        <dt>Keys</dt>
        <dd>arrows + page</dd>
      </div>
    </dl>
  </section>

  <section class="table-demo-workbench usage-demo__workbench" aria-labelledby="table-demo-workbench-title">
    <div class="table-demo-section-header usage-demo__section-header">
      <span class="table-demo-kicker usage-demo__kicker">Operational inventory</span>
      <h4 id="table-demo-workbench-title">Sortable status table with selected vault layers</h4>
    </div>

    <div class="table-demo-toolbar usage-demo__toolbar" aria-label="Active table capabilities">
      <span>striped</span>
      <span>compact</span>
      <span>bordered</span>
      <span>sticky-header</span>
      <span>interactive</span>
    </div>

    <div class="table-demo-scroll usage-demo__scroll-surface">
      <cv-table
        id="table-demo-vaults"
        aria-label="Vault layer inventory"
        sort-column="layer"
        sort-direction="ascending"
        selectable="multi"
        interactive
        striped
        compact
        bordered
        sticky-header
        page-size="2"
        total-row-count="6"
        total-column-count="5"
      >
        <cv-table-column
          class="usage-demo__column-label"
          slot="columns"
          value="layer"
          label="Layer"
          sortable
        ></cv-table-column>
        <cv-table-column
          class="usage-demo__column-label"
          slot="columns"
          value="owner"
          label="Owner"
          sortable
        ></cv-table-column>
        <cv-table-column
          class="usage-demo__column-label"
          slot="columns"
          value="state"
          label="State"
        ></cv-table-column>
        <cv-table-column
          class="usage-demo__column-label"
          slot="columns"
          value="exposure"
          label="Exposure"
        ></cv-table-column>
        <cv-table-column
          class="usage-demo__column-label"
          slot="columns"
          value="ttl"
          label="TTL"
        ></cv-table-column>

        <cv-table-row slot="rows" value="primary-vault">
          <cv-table-cell column="layer" row-header>Primary vault</cv-table-cell>
          <cv-table-cell column="owner">Alex</cv-table-cell>
          <cv-table-cell column="state"
            ><cv-badge class="usage-demo__dense-badge" variant="success" size="small"
              >Verified</cv-badge
            ></cv-table-cell
          >
          <cv-table-cell column="exposure">Hidden</cv-table-cell>
          <cv-table-cell column="ttl">30 days</cv-table-cell>
        </cv-table-row>
        <cv-table-row slot="rows" value="decoy-surface">
          <cv-table-cell column="layer" row-header>Decoy surface</cv-table-cell>
          <cv-table-cell column="owner">Traveler</cv-table-cell>
          <cv-table-cell column="state"
            ><cv-badge class="usage-demo__dense-badge" variant="primary" size="small"
              >Visible</cv-badge
            ></cv-table-cell
          >
          <cv-table-cell column="exposure">Inspectable</cv-table-cell>
          <cv-table-cell column="ttl">Active</cv-table-cell>
        </cv-table-row>
        <cv-table-row slot="rows" value="relay-core">
          <cv-table-cell column="layer" row-header>Relay core</cv-table-cell>
          <cv-table-cell column="owner">Device</cv-table-cell>
          <cv-table-cell column="state"
            ><cv-badge class="usage-demo__dense-badge" variant="success" size="small"
              >Paired</cv-badge
            ></cv-table-cell
          >
          <cv-table-cell column="exposure">Hardware</cv-table-cell>
          <cv-table-cell column="ttl">Session</cv-table-cell>
        </cv-table-row>
        <cv-table-row slot="rows" value="legal-archive">
          <cv-table-cell column="layer" row-header>Legal archive</cv-table-cell>
          <cv-table-cell column="owner">Counsel</cv-table-cell>
          <cv-table-cell column="state"
            ><cv-badge class="usage-demo__dense-badge" variant="warning" size="small"
              >Review</cv-badge
            ></cv-table-cell
          >
          <cv-table-cell column="exposure">Shared</cv-table-cell>
          <cv-table-cell column="ttl">7 days</cv-table-cell>
        </cv-table-row>
        <cv-table-row slot="rows" value="recovery-share">
          <cv-table-cell column="layer" row-header>Recovery share</cv-table-cell>
          <cv-table-cell column="owner">Maria</cv-table-cell>
          <cv-table-cell column="state"
            ><cv-badge class="usage-demo__dense-badge" variant="neutral" size="small"
              >Dormant</cv-badge
            ></cv-table-cell
          >
          <cv-table-cell column="exposure">Sealed</cv-table-cell>
          <cv-table-cell column="ttl">90 days</cv-table-cell>
        </cv-table-row>
        <cv-table-row slot="rows" value="expired-export">
          <cv-table-cell column="layer" row-header>Expired export</cv-table-cell>
          <cv-table-cell column="owner">Legacy</cv-table-cell>
          <cv-table-cell column="state"
            ><cv-badge class="usage-demo__dense-badge" variant="danger" size="small"
              >Blocked</cv-badge
            ></cv-table-cell
          >
          <cv-table-cell column="exposure">None</cv-table-cell>
          <cv-table-cell column="ttl">Expired</cv-table-cell>
        </cv-table-row>
      </cv-table>
    </div>

    <output class="table-demo-readout usage-demo__log" for="table-demo-vaults" aria-live="polite">
      Sort: layer ascending | Selected: none | Focus: awaiting grid navigation
    </output>
  </section>
</div>

<script>
  document.querySelectorAll('.table-demo-shell[data-demo="table"]:not([data-ready])').forEach((shell) => {
    shell.dataset.ready = 'true'

    customElements.whenDefined('cv-table').then(async () => {
      const table = shell.querySelector('#table-demo-vaults')
      const readout = shell.querySelector('.table-demo-readout')
      if (!table || !readout) return

      let focusLabel = 'awaiting grid navigation'
      const selectedLabels = new Map([
        ['primary-vault', 'Primary vault'],
        ['decoy-surface', 'Decoy surface'],
        ['relay-core', 'Relay core'],
        ['legal-archive', 'Legal archive'],
        ['recovery-share', 'Recovery share'],
        ['expired-export', 'Expired export'],
      ])
      const rowSortData = new Map([
        ['primary-vault', {layer: 'Primary vault', owner: 'Alex'}],
        ['decoy-surface', {layer: 'Decoy surface', owner: 'Traveler'}],
        ['relay-core', {layer: 'Relay core', owner: 'Device'}],
        ['legal-archive', {layer: 'Legal archive', owner: 'Counsel'}],
        ['recovery-share', {layer: 'Recovery share', owner: 'Maria'}],
        ['expired-export', {layer: 'Expired export', owner: 'Legacy'}],
      ])
      const originalRowOrder = new Map(
        [...table.querySelectorAll('cv-table-row')].map((row, index) => [row.value, index]),
      )

      const applySort = () => {
        const column = table.sortColumn
        const direction = table.sortDirection

        const rows = [...table.querySelectorAll('cv-table-row')]
        if (!column || direction === 'none') {
          rows.sort((a, b) => (originalRowOrder.get(a.value) ?? 0) - (originalRowOrder.get(b.value) ?? 0))
          table.append(...rows)
          return
        }

        rows.sort((a, b) => {
          const aValue = rowSortData.get(a.value)?.[column] || ''
          const bValue = rowSortData.get(b.value)?.[column] || ''
          const result = aValue.localeCompare(bValue, undefined, {sensitivity: 'base'})
          return direction === 'descending' ? -result : result
        })
        table.append(...rows)
      }

      const syncReadout = () => {
        const selected = [...table.querySelectorAll('cv-table-row[selected]')]
          .map((row) => selectedLabels.get(row.value) || row.value)
          .join(', ')
        const column = table.sortColumn || 'none'
        const direction = table.sortDirection || 'none'
        const sortLabel = column === 'none' || direction === 'none' ? 'none' : `${column} ${direction}`
        readout.textContent = `Sort: ${sortLabel} | Selected: ${selected || 'none'} | Focus: ${focusLabel}`
      }

      table.addEventListener('cv-change', async () => {
        applySort()
        await table.updateComplete
        syncReadout()
      })
      table.addEventListener('cv-selection-change', syncReadout)
      table.addEventListener('cv-focus-change', (event) => {
        const {rowIndex, columnIndex} = event.detail
        focusLabel =
          rowIndex == null || columnIndex == null ? 'none' : `row ${rowIndex + 1}, column ${columnIndex + 1}`
        syncReadout()
      })

      await table.updateComplete
      shell.querySelector('cv-table-row[value="primary-vault"]')?.click()
      shell.querySelector('cv-table-row[value="relay-core"]')?.click()
      await table.updateComplete
      applySort()
      await table.updateComplete
      syncReadout()
    })
  })
</script>
```

## Child Elements

### cv-table-column

Column header definition within the table header row.

#### Anatomy

```
<cv-table-column class="usage-demo__column-label"> (host)
└── <span part="base">
    ├── <slot>${label}</slot>
    └── sort indicator (▲/▼)     ← only when sort-direction is ascending/descending
```

#### Attributes

| Attribute        | Type    | Default  | Description                                                                   |
| ---------------- | ------- | -------- | ----------------------------------------------------------------------------- |
| `value`          | String  | `""`     | Unique column identifier. Auto-generated as `column-N` if empty.              |
| `label`          | String  | `""`     | Column header text (used as default slot fallback)                            |
| `index`          | Number  | `0`      | 1-based aria-colindex override for virtualized tables                         |
| `sortable`       | Boolean | `false`  | Enables sort interaction on this column                                       |
| `sort-direction` | String  | `"none"` | Current sort state: `none` \| `ascending` \| `descending` (managed by parent) |

#### Slots

| Slot        | Description                                             |
| ----------- | ------------------------------------------------------- |
| `(default)` | Column header content (falls back to `label` attribute) |

#### CSS Parts

| Part   | Element  | Description                                             |
| ------ | -------- | ------------------------------------------------------- |
| `base` | `<span>` | Inline-flex wrapper containing label and sort indicator |

#### Visual States

| Host selector                          | Description                                            |
| -------------------------------------- | ------------------------------------------------------ |
| `:host([sortable])`                    | `cursor: pointer` indicating interactive sort          |
| `:host([sort-direction="ascending"])`  | Primary color text with ascending indicator (▲)        |
| `:host([sort-direction="descending"])` | Primary color text with descending indicator (▼)       |
| `:host(:focus-visible)`                | Focus ring for keyboard activation of sortable columns |

---

### cv-table-row

Data row containing cells within the table body.

#### Anatomy

```
<cv-table-row> (host)
└── <slot>                       ← accepts <cv-table-cell> children
```

#### Attributes

| Attribute  | Type    | Default | Description                                                  |
| ---------- | ------- | ------- | ------------------------------------------------------------ |
| `value`    | String  | `""`    | Unique row identifier. Auto-generated as `row-N` if empty.   |
| `index`    | Number  | `0`     | 1-based aria-rowindex override for virtualized tables        |
| `selected` | Boolean | `false` | Whether this row is selected (reflected from headless state) |

#### CSS Parts

| Part   | Element | Description                             |
| ------ | ------- | --------------------------------------- |
| `base` | host    | Row element (uses `display: table-row`) |

#### Events

| Event                     | Detail | Description                                                                  |
| ------------------------- | ------ | ---------------------------------------------------------------------------- |
| `cv-table-row-slotchange` | --     | Fires when slotted cell children change; bubbles to parent for model rebuild |

#### Visual States

| Host selector       | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `:host([selected])` | Selected row background via `--cv-table-row-selected-background` |

---

### cv-table-cell

Individual data cell within a table row.

#### Anatomy

```
<cv-table-cell> (host)
└── <slot>
```

#### Attributes

| Attribute    | Type    | Default | Description                                                                   |
| ------------ | ------- | ------- | ----------------------------------------------------------------------------- |
| `column`     | String  | `""`    | Column id this cell belongs to. Auto-resolved from positional index if empty. |
| `row-header` | Boolean | `false` | Marks this cell as a row header (`role="rowheader"`)                          |
| `colspan`    | Number  | `0`     | Column span (applied as `aria-colspan` when >= 2)                             |
| `rowspan`    | Number  | `0`     | Row span (applied as `aria-rowspan` when >= 2)                                |

#### Slots

| Slot        | Description  |
| ----------- | ------------ |
| `(default)` | Cell content |

#### CSS Parts

| Part   | Element | Description                               |
| ------ | ------- | ----------------------------------------- |
| `base` | host    | Cell element (uses `display: table-cell`) |

#### Visual States

| Host selector                 | Description                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `:host([row-header])`         | Bold text (`font-weight: 600`) for row header cells                                 |
| `:host([data-active="true"])` | Active cell in grid navigation mode (receives `tabindex="0"` via headless contract) |
