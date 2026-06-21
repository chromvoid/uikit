# cv-treeview

Hierarchical tree widget providing APG-aligned keyboard navigation, expansion/collapse, and single- or multiple-select behavior over slotted `cv-treeitem` children.

**Headless:** [`createTreeview`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/treeview.md)

## Anatomy

```
<cv-treeview> (host)
└── <div part="base" role="tree">
    └── <slot>   ← accepts cv-treeitem children
```

## Attributes

| Attribute         | Type   | Default    | Description                                                                                                                                    |
| ----------------- | ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`           | String | `""`       | Selected item identifier in single-select mode; reflects the first entry of `selectedIds` from headless state; empty string means no selection |
| `values`          | —      | `[]`       | Property-only (not an HTML attribute). Array of selected item id strings in multiple-select mode; reflects `selectedIds` from headless state   |
| `expanded-values` | —      | `[]`       | Property-only (not an HTML attribute). Array of expanded item id strings; reflects `expandedIds` from headless state                           |
| `selection-mode`  | String | `"single"` | Item selection mode: `single` \| `multiple`                                                                                                    |
| `aria-label`      | String | `""`       | Accessible label applied to the root `[role=tree]` element                                                                                     |

## Slots

| Slot        | Description                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------- |
| `(default)` | Accepts `cv-treeitem` elements as root-level tree nodes; slot changes trigger model rebuild |

## CSS Parts

| Part   | Element | Description                                                                                                |
| ------ | ------- | ---------------------------------------------------------------------------------------------------------- |
| `base` | `<div>` | Root interactive element with `role="tree"`; receives all ARIA tree attributes and keyboard event handling |

## CSS Custom Properties

| Property                           | Default                  | Description                                                             |
| ---------------------------------- | ------------------------ | ----------------------------------------------------------------------- |
| `--cv-treeview-indent-size`        | `1.5rem`                 | Per-level indentation of child items                                    |
| `--cv-treeview-indent-guide-width` | `0px`                    | Width of the vertical indent guide line; set to `1px` to show the guide |
| `--cv-treeview-indent-guide-color` | `var(--cv-color-border)` | Color of the vertical indent guide line                                 |
| `--cv-treeview-indent-guide-style` | `solid`                  | Border style of the indent guide line (`solid`, `dotted`, `dashed`)     |

Additionally, component styles depend on theme tokens through fallback values:

| Theme Property       | Default   | Description                                                |
| -------------------- | --------- | ---------------------------------------------------------- |
| `--cv-color-border`  | `#2a3245` | Border color for the base wrapper                          |
| `--cv-color-surface` | `#141923` | Background color for the base wrapper                      |
| `--cv-color-primary` | `#65d7ff` | Focus outline color for the base wrapper                   |
| `--cv-radius-md`     | `10px`    | Border radius for the base wrapper                         |
| `--cv-space-1`       | `4px`     | Gap between tree items and padding within the base wrapper |

## Visual States

| Host selector                 | Description                                                           |
| ----------------------------- | --------------------------------------------------------------------- |
| `:host`                       | `display: block`                                                      |
| `[part="base"]:focus-visible` | `outline: 2px solid var(--cv-color-primary)` at `outline-offset: 1px` |

## Events

| Event       | Detail                                                                                            | Description                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `cv-input`  | `{ value: string \| null, values: string[], activeId: string \| null, expandedValues: string[] }` | Fires on any user interaction that changes active item, selection, or expansion state                                          |
| `cv-change` | `{ value: string \| null, values: string[], activeId: string \| null, expandedValues: string[] }` | Fires when selection or expansion state commits (subset of `cv-input` cases; active-item-only changes do not fire `cv-change`) |

`value` in the detail is `null` when no item is selected, otherwise the id string of the first selected item. `values` contains all selected ids (single-select mode will have at most one entry).

`cv-input` and `cv-change` only fire for user-driven interactions (keyboard, pointer). Programmatic changes via `value`, `values`, or `expandedValues` properties do not re-dispatch these events.

## Reactive State Mapping

`cv-treeview` is a visual adapter over headless `createTreeview`.

### UIKit properties → headless actions

| UIKit Property          | Direction     | Headless Binding                                                                                 |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `value` (attr)          | attr → action | `actions.select(value)` in single-select mode; `actions.clearSelected()` when empty              |
| `values` (prop)         | prop → action | `actions.clearSelected()` then `actions.toggleSelected(id)` per id (multiple mode; diff-applied) |
| `expandedValues` (prop) | prop → action | `actions.expand(id)` / `actions.collapse(id)` (diff-applied)                                     |
| `selection-mode` (attr) | attr → option | passed as `selectionMode` to `createTreeview(options)` on model rebuild                          |
| `aria-label` (attr)     | attr → option | passed as `ariaLabel` to `createTreeview(options)` on model rebuild                              |

### Headless state → DOM attributes

| Headless Signal       | Direction         | DOM Reflection                                                                                                                                                                 |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `state.selectedIds()` | state → prop/attr | `values` property; `value` attribute (first selected id or `""`); `[selected]` on matching `cv-treeitem` elements; `aria-selected="true"` on selected items via `getItemProps` |
| `state.activeId()`    | state → prop      | `[active]` on matching `cv-treeitem` element; `tabindex="0"` on active item via `getItemProps`; focus moved to active element                                                  |
| `state.expandedIds()` | state → prop      | `expandedValues` property; `[expanded]` on matching `cv-treeitem` elements; child visibility toggled via `[hidden]` attribute on non-expanded branch children                  |

### Contracts spread onto DOM elements

| Contract                     | Spread target                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contracts.getTreeProps()`   | `[part="base"]` — applies `role`, `tabindex`, `aria-label`, `aria-multiselectable`                                                                                                                                                                                                                                                                   |
| `contracts.getItemProps(id)` | Each `cv-treeitem` element — applies `id`, `role`, `tabindex`, `aria-level`, `aria-posinset`, `aria-setsize`, `aria-selected`, `aria-expanded` (branch only), `aria-disabled` (disabled only), `data-active`, `data-expanded`; UIKit also writes `active`, `selected`, `expanded`, `branch`, `level`, `disabled`, and `hidden` as element properties |

### Pointer and keyboard action triggers

| User Trigger                                    | Action Called                                                                                                    |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `click` on a `cv-treeitem`                      | `actions.setActive(id)`; then `actions.toggleSelected(id)` (multiple mode) or `actions.select(id)` (single mode) |
| `cv-treeitem-toggle` event from a `cv-treeitem` | `actions.toggleExpanded(id)`                                                                                     |
| `focus` on a `cv-treeitem`                      | `actions.setActive(id)`                                                                                          |
| `keydown` on `[part="base"]`                    | `actions.handleKeyDown(event)`                                                                                   |
| slot content change                             | Model rebuilt from DOM (`rebuildModelFromSlot(preserveState: true)`)                                             |
| `selection-mode` / `aria-label` change          | Model rebuilt from DOM (`rebuildModelFromSlot(preserveState: true)`)                                             |

## Keyboard Interaction

Derived from headless `handleKeyDown` contract:

| Key                 | Behavior                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `ArrowUp`           | Move focus to previous visible enabled item; in single-select mode also moves selection to that item (selection-follows-focus)        |
| `ArrowDown`         | Move focus to next visible enabled item; in single-select mode also moves selection to that item (selection-follows-focus)            |
| `ArrowRight`        | If focused item is a collapsed branch: expand it (focus stays). If focused item is an expanded branch: move focus to first child item |
| `ArrowLeft`         | If focused item is an expanded branch: collapse it (focus stays). If focused item is collapsed or a leaf: move focus to parent item   |
| `Home`              | Move focus to first visible enabled item; in single-select mode also moves selection to that item (selection-follows-focus)           |
| `End`               | Move focus to last visible enabled item; in single-select mode also moves selection to that item (selection-follows-focus)            |
| `Enter`             | Select the currently focused item (both modes; replaces selection)                                                                    |
| `Space`             | Toggle selection on the currently focused item (both modes; in multiple mode, focus and selection are independent)                    |
| `Ctrl+A` / `Meta+A` | Select all enabled items (multiple mode only)                                                                                         |

**Selection-follows-focus** applies in single-select mode only. When `ArrowUp`, `ArrowDown`, `Home`, or `End` moves focus to a new enabled visible node, `selectedIds` is simultaneously updated to contain only that node's id. In multiple-select mode, focus and selection remain independent.

Keys `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Enter`, and `Space` are always `preventDefault()`-ed when handled.

## ARIA

| Element         | Role       | Required Attributes                                                                                                                        |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `[part="base"]` | `tree`     | `aria-label` (recommended); `aria-multiselectable="true"` when `selection-mode="multiple"`                                                 |
| `cv-treeitem`   | `treeitem` | `aria-level`, `aria-posinset`, `aria-setsize`, `aria-selected`; `aria-expanded` (branch items only); `aria-disabled` (disabled items only) |

`aria-level` starts at `1` for root items. `aria-multiselectable` is `"true"` when `selection-mode="multiple"`, omitted otherwise.

## Usage

```html
<div class="treeview-demo-shell usage-demo" data-demo="treeview" data-live-demo-height="780">
  <section class="treeview-demo-hero usage-demo__hero" aria-labelledby="treeview-demo-title">
    <div class="treeview-demo-copy usage-demo__copy">
      <span class="treeview-demo-kicker usage-demo__kicker">APG tree adapter</span>
      <h3 id="treeview-demo-title">Hierarchy, selection, and expansion stay on one headless contract.</h3>
      <p>
        Use treeview when the user needs to scan nested vault scopes, move through branches with arrow keys,
        and keep selection separate from layout chrome.
      </p>
    </div>

    <dl class="treeview-demo-metrics usage-demo__metrics" aria-label="Treeview behavior summary">
      <div>
        <dt>Root role</dt>
        <dd>tree</dd>
      </div>
      <div>
        <dt>Selection</dt>
        <dd>single or multiple</dd>
      </div>
      <div>
        <dt>Keys</dt>
        <dd>arrows, Home, End, Space</dd>
      </div>
    </dl>
  </section>

  <section class="treeview-demo-workbench usage-demo__workbench" aria-labelledby="treeview-demo-workbench-title">
    <div class="treeview-demo-section-header usage-demo__section-header">
      <span class="treeview-demo-kicker usage-demo__kicker">Operational navigation</span>
      <h4 id="treeview-demo-workbench-title">Vault namespace tree with selected export scopes</h4>
    </div>

    <div class="treeview-demo-layout">
      <article class="treeview-demo-panel usage-demo__panel" aria-labelledby="treeview-demo-vault-title">
        <header class="treeview-demo-panel-header usage-demo__panel-header">
          <div>
            <span class="treeview-demo-label">Single select</span>
            <h5 id="treeview-demo-vault-title">Vault namespaces</h5>
          </div>
          <cv-badge variant="success" size="small">active</cv-badge>
        </header>

        <cv-treeview id="treeview-demo-vault" aria-label="Vault namespace tree" selection-mode="single">
          <cv-treeitem value="vaults" label="Vaults">
            <span slot="label" class="treeview-demo-node">
              <span class="treeview-demo-glyph" aria-hidden="true">V</span>
              <span class="treeview-demo-node-copy">
                <strong>Vaults</strong>
                <small>3 namespaces</small>
              </span>
              <cv-badge variant="primary" size="small">live</cv-badge>
            </span>

            <cv-treeitem value="vaults-primary" label="Primary vault" slot="children">
              <span slot="label" class="treeview-demo-node">
                <span class="treeview-demo-glyph" aria-hidden="true">P</span>
                <span class="treeview-demo-node-copy">
                  <strong>Primary vault</strong>
                  <small>hardware assisted</small>
                </span>
              </span>

              <cv-treeitem value="vaults-primary-credentials" label="Credentials" slot="children">
                <span slot="label" class="treeview-demo-node">
                  <span class="treeview-demo-glyph" aria-hidden="true">C</span>
                  <span class="treeview-demo-node-copy">
                    <strong>Credentials</strong>
                    <small>14 records</small>
                  </span>
                </span>
              </cv-treeitem>
              <cv-treeitem value="vaults-primary-notes" label="Secure notes" slot="children">
                <span slot="label" class="treeview-demo-node">
                  <span class="treeview-demo-glyph" aria-hidden="true">N</span>
                  <span class="treeview-demo-node-copy">
                    <strong>Secure notes</strong>
                    <small>sealed locally</small>
                  </span>
                </span>
              </cv-treeitem>
            </cv-treeitem>

            <cv-treeitem value="vaults-decoy" label="Decoy surface" slot="children">
              <span slot="label" class="treeview-demo-node">
                <span class="treeview-demo-glyph treeview-demo-glyph--violet" aria-hidden="true">D</span>
                <span class="treeview-demo-node-copy">
                  <strong>Decoy surface</strong>
                  <small>visible under inspection</small>
                </span>
                <cv-badge variant="neutral" size="small">visible</cv-badge>
              </span>
            </cv-treeitem>

            <cv-treeitem value="vaults-archive" label="Cold archive" slot="children">
              <span slot="label" class="treeview-demo-node">
                <span class="treeview-demo-glyph" aria-hidden="true">A</span>
                <span class="treeview-demo-node-copy">
                  <strong>Cold archive</strong>
                  <small>offline recovery</small>
                </span>
              </span>
            </cv-treeitem>
          </cv-treeitem>

          <cv-treeitem value="routes" label="Routes">
            <span slot="label" class="treeview-demo-node">
              <span class="treeview-demo-glyph" aria-hidden="true">R</span>
              <span class="treeview-demo-node-copy">
                <strong>Access routes</strong>
                <small>device and relay paths</small>
              </span>
            </span>

            <cv-treeitem value="routes-relay" label="USB relay" slot="children">
              <span slot="label" class="treeview-demo-node">
                <span class="treeview-demo-glyph" aria-hidden="true">U</span>
                <span class="treeview-demo-node-copy">
                  <strong>USB relay</strong>
                  <small>paired</small>
                </span>
              </span>
            </cv-treeitem>
            <cv-treeitem value="routes-remote" label="Remote session" slot="children" disabled>
              <span slot="label" class="treeview-demo-node">
                <span class="treeview-demo-glyph treeview-demo-glyph--muted" aria-hidden="true">X</span>
                <span class="treeview-demo-node-copy">
                  <strong>Remote session</strong>
                  <small>disabled in this threat model</small>
                </span>
              </span>
            </cv-treeitem>
          </cv-treeitem>
        </cv-treeview>
      </article>

      <article class="treeview-demo-panel usage-demo__panel" aria-labelledby="treeview-demo-access-title">
        <header class="treeview-demo-panel-header usage-demo__panel-header">
          <div>
            <span class="treeview-demo-label">Multiple select</span>
            <h5 id="treeview-demo-access-title">Export scope</h5>
          </div>
          <cv-badge variant="warning" size="small">review</cv-badge>
        </header>

        <cv-treeview id="treeview-demo-access" aria-label="Export scope tree" selection-mode="multiple">
          <cv-treeitem value="hardware" label="Hardware boundary">
            <span slot="label" class="treeview-demo-node">
              <span class="treeview-demo-glyph" aria-hidden="true">H</span>
              <span class="treeview-demo-node-copy">
                <strong>Hardware boundary</strong>
                <small>device-owned material</small>
              </span>
            </span>

            <cv-treeitem value="hardware-relay" label="Relay device" slot="children">
              <span slot="label" class="treeview-demo-node">
                <span class="treeview-demo-glyph" aria-hidden="true">R</span>
                <span class="treeview-demo-node-copy">
                  <strong>Relay device</strong>
                  <small>include pairing manifest</small>
                </span>
              </span>
            </cv-treeitem>
            <cv-treeitem value="hardware-backup-key" label="Backup key" slot="children">
              <span slot="label" class="treeview-demo-node">
                <span class="treeview-demo-glyph" aria-hidden="true">K</span>
                <span class="treeview-demo-node-copy">
                  <strong>Backup key</strong>
                  <small>not selected</small>
                </span>
              </span>
            </cv-treeitem>
          </cv-treeitem>

          <cv-treeitem value="policies" label="Policies">
            <span slot="label" class="treeview-demo-node">
              <span class="treeview-demo-glyph treeview-demo-glyph--violet" aria-hidden="true">P</span>
              <span class="treeview-demo-node-copy">
                <strong>Policies</strong>
                <small>operator-facing guidance</small>
              </span>
            </span>

            <cv-treeitem value="policies-border" label="Border playbook" slot="children">
              <span slot="label" class="treeview-demo-node">
                <span class="treeview-demo-glyph treeview-demo-glyph--violet" aria-hidden="true">B</span>
                <span class="treeview-demo-node-copy">
                  <strong>Border playbook</strong>
                  <small>selected for handoff</small>
                </span>
              </span>
            </cv-treeitem>
            <cv-treeitem value="policies-counsel" label="Counsel packet" slot="children">
              <span slot="label" class="treeview-demo-node">
                <span class="treeview-demo-glyph treeview-demo-glyph--violet" aria-hidden="true">C</span>
                <span class="treeview-demo-node-copy">
                  <strong>Counsel packet</strong>
                  <small>selected for review</small>
                </span>
              </span>
            </cv-treeitem>
          </cv-treeitem>

          <cv-treeitem value="journalist-archive" label="Journalist archive" disabled>
            <span slot="label" class="treeview-demo-node">
              <span class="treeview-demo-glyph treeview-demo-glyph--muted" aria-hidden="true">J</span>
              <span class="treeview-demo-node-copy">
                <strong>Journalist archive</strong>
                <small>blocked by export policy</small>
              </span>
            </span>
          </cv-treeitem>
        </cv-treeview>
      </article>
    </div>

    <div class="treeview-demo-hints" aria-label="Keyboard hints">
      <span>ArrowRight expands a branch</span>
      <span>ArrowLeft collapses or moves to parent</span>
      <span>Space toggles selection</span>
      <span>Ctrl+A selects all in multiple mode</span>
    </div>

    <output class="treeview-demo-readout" for="treeview-demo-vault treeview-demo-access" aria-live="polite">
      Vault focus: awaiting selection | Export bundle: none
    </output>
  </section>
</div>

<script>
  document
    .querySelectorAll('.treeview-demo-shell[data-demo="treeview"]:not([data-ready])')
    .forEach((shell) => {
      shell.dataset.ready = 'true'

      customElements.whenDefined('cv-treeview').then(async () => {
        const vaultTree = shell.querySelector('#treeview-demo-vault')
        const accessTree = shell.querySelector('#treeview-demo-access')
        const readout = shell.querySelector('.treeview-demo-readout')
        if (!vaultTree || !accessTree || !readout) return

        const labels = new Map([
          ['vaults-primary-credentials', 'Primary credentials'],
          ['vaults-primary-notes', 'Secure notes'],
          ['vaults-decoy', 'Decoy surface'],
          ['routes-relay', 'USB relay'],
          ['hardware-relay', 'Relay device'],
          ['hardware-backup-key', 'Backup key'],
          ['policies-border', 'Border playbook'],
          ['policies-counsel', 'Counsel packet'],
        ])

        const syncReadout = () => {
          const selectedAccess = (accessTree.values ?? []).map((value) => labels.get(value) ?? value)
          const expandedCount =
            (vaultTree.expandedValues?.length ?? 0) + (accessTree.expandedValues?.length ?? 0)
          const vaultFocus = labels.get(vaultTree.value) || vaultTree.value || 'none'
          readout.textContent = `Vault focus: ${vaultFocus} | Export bundle: ${
            selectedAccess.length > 0 ? selectedAccess.join(', ') : 'none'
          } | Expanded branches: ${expandedCount}`
        }

        await Promise.all([vaultTree.updateComplete, accessTree.updateComplete])
        vaultTree.expandedValues = ['vaults', 'vaults-primary', 'routes']
        accessTree.expandedValues = ['hardware', 'policies']
        await Promise.all([vaultTree.updateComplete, accessTree.updateComplete])

        vaultTree.value = 'vaults-primary-credentials'
        accessTree.values = ['hardware-relay', 'policies-border', 'policies-counsel']
        await Promise.all([vaultTree.updateComplete, accessTree.updateComplete])

        vaultTree.addEventListener('cv-input', syncReadout)
        accessTree.addEventListener('cv-input', syncReadout)
        vaultTree.addEventListener('cv-change', syncReadout)
        accessTree.addEventListener('cv-change', syncReadout)
        syncReadout()
      })
    })
</script>
```

## Child Elements

### cv-treeitem

Represents a single tree node. Slotted directly into `cv-treeview` (root items) or into `slot="children"` of a parent `cv-treeitem` (child items). State attributes (`active`, `selected`, `expanded`, `branch`, `level`, `hidden`) are managed by the parent `cv-treeview`; authors should not set them manually.

#### Anatomy

```
<cv-treeitem> (host)
├── <div part="row">
│   ├── <button part="toggle" aria-hidden?=${!branch} hidden?=${!branch}>
│   │   └── ▸ or ▾ (expand/collapse icon)
│   └── <span part="label">
│       └── <slot name="label">   ← falls back to [label] attribute text
└── <div part="children" role="group" hidden?=${!expanded}>
    └── <slot name="children">    ← accepts nested cv-treeitem children
```

#### Attributes

| Attribute  | Type    | Default | Description                                                                                                                                                                                                          |
| ---------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`    | String  | `""`    | Item identifier. Auto-assigned as `"item-N"` by parent if empty                                                                                                                                                      |
| `label`    | String  | `""`    | Fallback text displayed in the `label` slot when no slotted content is provided                                                                                                                                      |
| `disabled` | Boolean | `false` | Marks item as disabled; excluded from navigation and selection                                                                                                                                                       |
| `active`   | Boolean | `false` | Set by parent `cv-treeview` when this item is the currently focused item; drives row-level active highlight                                                                                                          |
| `selected` | Boolean | `false` | Set by parent `cv-treeview` when this item is selected; drives row-level selection highlight                                                                                                                         |
| `expanded` | Boolean | `false` | Set by parent `cv-treeview`; controls visibility of `[part="children"]` and reflects `aria-expanded`                                                                                                                 |
| `branch`   | Boolean | `false` | Set by parent `cv-treeview` when this item has child items; shows the toggle button                                                                                                                                  |
| `level`    | Number  | `1`     | Nesting depth written by parent `cv-treeview` from `getItemProps()['aria-level']`; drives indentation via `--cv-tree-level` inline property; root items get `1`, child items get `2`, grandchild items get `3`, etc. |
| `hidden`   | Boolean | `false` | Set by parent `cv-treeview` when item is not visible due to an ancestor being collapsed; maps to `display: none`                                                                                                     |

#### Slots

| Slot       | Description                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| `label`    | Item label content; falls back to the `label` attribute value                                                  |
| `children` | Accepts nested `cv-treeitem` elements; rendered inside `[part="children"]`, hidden when `[expanded]` is absent |

#### CSS Parts

| Part       | Element    | Description                                                                                                                                                                                       |
| ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `row`      | `<div>`    | Row layout element; uses CSS grid with toggle button and label; left-padding computed from `--cv-treeview-indent-size` and `--cv-tree-level` (inline custom property set by parent `cv-treeview`) |
| `toggle`   | `<button>` | Expand/collapse trigger button; hidden (visibility-hidden) when `[branch]` is absent                                                                                                              |
| `label`    | `<span>`   | Wrapper around the `label` slot                                                                                                                                                                   |
| `children` | `<div>`    | Container for nested child items; `display: none` when `[expanded]` is absent                                                                                                                     |

#### CSS Custom Properties

`cv-treeitem` defines the following custom properties with defaults on `:host`, which can be overridden by the parent `cv-treeview` or any ancestor:

| Property                           | Default                  | Description                                                                                                      |
| ---------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `--cv-treeview-indent-size`        | `1.5rem`                 | Per-level indentation; used directly in `[part="row"]` padding calculation via `--cv-tree-level` inline property |
| `--cv-treeview-indent-guide-width` | `0px`                    | Width of the vertical indent guide line on `[part="children"]`; set to `1px` to show the guide                   |
| `--cv-treeview-indent-guide-color` | `var(--cv-color-border)` | Color of the vertical indent guide line                                                                          |
| `--cv-treeview-indent-guide-style` | `solid`                  | Border style of the vertical indent guide line                                                                   |

Additionally, component styles depend on theme tokens:

| Theme Property       | Default   | Description                                                 |
| -------------------- | --------- | ----------------------------------------------------------- |
| `--cv-color-primary` | `#65d7ff` | Active/selected row background tint and focus outline color |
| `--cv-color-border`  | `#2a3245` | Toggle button border color                                  |
| `--cv-color-surface` | `#141923` | Toggle button background color                              |
| `--cv-color-text`    | `#e8ecf6` | Toggle button icon color                                    |
| `--cv-radius-sm`     | `6px`     | Border radius of `[part="row"]` and `[part="toggle"]`       |
| `--cv-radius-xs`     | `4px`     | Border radius of `[part="toggle"]`                          |
| `--cv-space-1`       | `4px`     | Gap between toggle button and label in `[part="row"]`       |
| `--cv-space-2`       | `8px`     | Inline-end padding of `[part="row"]`                        |

#### Visual States

| Host selector                         | Description                                                           |
| ------------------------------------- | --------------------------------------------------------------------- |
| `:host`                               | `display: block`, `outline: none`                                     |
| `:host([hidden])`                     | `display: none`                                                       |
| `:host([active]) [part="row"]`        | `background: var(--cv-color-primary-ring)`                            |
| `:host([selected]) [part="row"]`      | `background: var(--cv-color-primary-border)`                          |
| `:host([disabled]) [part="row"]`      | `opacity: 0.55`                                                       |
| `:host([expanded]) [part="children"]` | Visible (default); children hidden only when `[expanded]` is absent   |
| `:host([branch]) [part="toggle"]`     | Toggle button rendered and visible                                    |
| `:host(:focus-visible) [part="row"]`  | `outline: 2px solid var(--cv-color-primary)` at `outline-offset: 1px` |

#### Events

| Event                | Detail           | Description                                                                                                                                                                                                                                   |
| -------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cv-treeitem-toggle` | `{ id: string }` | Fired (bubbling, composed) when the user clicks the `[part="toggle"]` button; intercepted by the parent `cv-treeview` to call `actions.toggleExpanded(id)`; `stopPropagation()` is called by the parent so the event does not escape the tree |

## Out of Scope

- Async/lazy loading of child nodes (pagination or lazy fetch)
- Drag-and-drop node reordering
- Checkbox or radio variant tree items
- Typeahead (jump to node by typed character)
- Leaf-only selection mode (preventing branch-node selection)
