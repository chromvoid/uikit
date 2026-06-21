# cv-listbox

Standalone listbox widget for single or multiple selection from a list of options, with keyboard navigation, typeahead, optional grouping, and virtual scroll support.

**Headless:** [`createListbox`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/listbox.md)

## Anatomy

```
<cv-listbox> (host)
└── <div part="base" role="listbox">
    └── <slot>   ← accepts <cv-option> and <cv-listbox-group> children
```

## Attributes

| Attribute                 | Type    | Default                   | Description                                                             |
| ------------------------- | ------- | ------------------------- | ----------------------------------------------------------------------- |
| `selection-mode`          | String  | `"single"`                | Selection mode: `"single"` \| `"multiple"`                              |
| `orientation`             | String  | `"vertical"`              | Layout orientation: `"vertical"` \| `"horizontal"`                      |
| `focus-strategy`          | String  | `"aria-activedescendant"` | Focus management: `"aria-activedescendant"` \| `"roving-tabindex"`      |
| `selection-follows-focus` | Boolean | `false`                   | Auto-select focused option in single mode                               |
| `range-selection`         | Boolean | `false`                   | Enable Shift+Arrow and Shift+Space range selection (multiple mode only) |
| `typeahead`               | Boolean | `true`                    | Enable typeahead character navigation                                   |
| `aria-label`              | String  | `""`                      | Accessible label for the listbox                                        |

Non-reflected properties:

| Property         | Type             | Default | Description                                           |
| ---------------- | ---------------- | ------- | ----------------------------------------------------- |
| `value`          | `string \| null` | `null`  | First selected option value (single-select shorthand) |
| `selectedValues` | `string[]`       | `[]`    | Array of all selected option values                   |

## Slots

| Slot        | Description                                                |
| ----------- | ---------------------------------------------------------- |
| `(default)` | One or more `<cv-option>` or `<cv-listbox-group>` children |

## CSS Parts

| Part   | Element | Description                                |
| ------ | ------- | ------------------------------------------ |
| `base` | `<div>` | Root listbox element with `role="listbox"` |

## CSS Custom Properties

| Property                           | Default                            | Description                            |
| ---------------------------------- | ---------------------------------- | -------------------------------------- |
| `--cv-listbox-gap`                 | `var(--cv-space-1, 4px)`           | Gap between options                    |
| `--cv-listbox-padding`             | `var(--cv-space-1, 4px)`           | Inner padding of the listbox container |
| `--cv-listbox-border-radius`       | `var(--cv-radius-md, 10px)`        | Border radius of the listbox container |
| `--cv-listbox-border-color`        | `var(--cv-color-border, #2a3245)`  | Border color                           |
| `--cv-listbox-background`          | `var(--cv-color-surface, #141923)` | Background color                       |
| `--cv-listbox-focus-outline-color` | `var(--cv-color-primary, #65d7ff)` | Focus-visible outline color            |

## Visual States

| Host selector                               | Description                               |
| ------------------------------------------- | ----------------------------------------- |
| `:host([orientation="horizontal"])`         | Horizontal layout (flexbox row direction) |
| `:host([selection-mode="multiple"])`        | Multiple selection mode active            |
| `:host([focus-strategy="roving-tabindex"])` | Options receive DOM focus directly        |

## Events

| Event       | Detail                                                    | Description                                                        |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| `cv-input`  | `{selectedValues: string[], activeValue: string \| null}` | Fires when active option or selection changes via user interaction |
| `cv-change` | `{selectedValues: string[], activeValue: string \| null}` | Fires when selected option(s) change via user interaction          |

## Keyboard Interaction

All keyboard handling is delegated to headless `actions.handleKeyDown`. The following is the resulting behavior:

| Key                          | Context                    | Action                                  |
| ---------------------------- | -------------------------- | --------------------------------------- |
| `ArrowDown` / `ArrowRight`\* | any                        | Move to next enabled option             |
| `ArrowUp` / `ArrowLeft`\*    | any                        | Move to previous enabled option         |
| `Home`                       | any                        | Move to first enabled option            |
| `End`                        | any                        | Move to last enabled option             |
| `Space` / `Enter`            | single mode                | Select active option exclusively        |
| `Space` / `Enter`            | multiple mode              | Toggle active option selection          |
| `Escape`                     | any                        | Close (for composite patterns)          |
| `Ctrl/Cmd + A`               | multiple mode              | Select all enabled options              |
| `Shift + Arrow`              | multiple + range-selection | Extend range selection                  |
| `Shift + Space`              | multiple + range-selection | Select range from anchor to active      |
| printable char               | typeahead enabled          | Typeahead navigation to matching option |

\*Arrow key mapping depends on orientation: vertical uses Up/Down, horizontal uses Left/Right.

## Reactive State Mapping

`cv-listbox` is a visual adapter over headless `createListbox`.

### Attribute to Headless (UIKit -> Headless)

| UIKit Property            | Direction      | Headless Binding                                              |
| ------------------------- | -------------- | ------------------------------------------------------------- |
| `selection-mode`          | attr -> option | passed as `selectionMode` in `createListbox(options)`         |
| `orientation`             | attr -> option | passed as `orientation` in `createListbox(options)`           |
| `focus-strategy`          | attr -> option | passed as `focusStrategy` in `createListbox(options)`         |
| `selection-follows-focus` | attr -> option | passed as `selectionFollowsFocus` in `createListbox(options)` |
| `range-selection`         | attr -> option | passed as `rangeSelection` in `createListbox(options)`        |
| `typeahead`               | attr -> option | passed as `typeahead` in `createListbox(options)`             |
| `aria-label`              | attr -> option | passed as `ariaLabel` in `createListbox(options)`             |
| `value` (setter)          | prop -> action | `actions.selectOnly(id)` / `actions.clearSelected()`          |

When any configuration attribute changes, the headless model is rebuilt via `createListbox` with updated options, preserving current selection and active state where still valid.

### Headless to DOM (Headless -> UIKit)

| Headless State        | Direction       | DOM Reflection                                                                                                                |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `state.activeId()`    | state -> render | `aria-activedescendant` on `[part="base"]` (activedescendant strategy); DOM focus on active option (roving-tabindex strategy) |
| `state.selectedIds()` | state -> render | `[aria-selected]` on each `cv-option`; `selectedValues` property; `value` property                                            |
| `state.selectionMode` | state -> attr   | `[selection-mode]` host attribute                                                                                             |
| `state.focusStrategy` | state -> attr   | `[focus-strategy]` host attribute                                                                                             |
| `state.orientation`   | state -> attr   | `[orientation]` host attribute                                                                                                |
| `state.optionCount`   | state -> render | `aria-setsize` on each option via `getOptionProps`                                                                            |

### Contract Spreading

- `contracts.getRootProps()` is spread onto `[part="base"]` -- applies `role`, `tabindex`, `aria-orientation`, `aria-label`, `aria-multiselectable`, `aria-activedescendant`
- `contracts.getOptionProps(id)` is spread onto each `cv-option` -- applies `id`, `role`, `tabindex`, `aria-selected`, `aria-disabled`, `aria-setsize`, `aria-posinset`, `data-active`
- `contracts.getGroupProps(groupId)` is spread onto each `cv-listbox-group` shadow root group container -- applies `id`, `role`, `aria-labelledby`
- `contracts.getGroupLabelProps(groupId)` is spread onto each group label element -- applies `id`, `role`
- `contracts.getGroupOptions(groupId)` drives which options render within a group
- `contracts.getUngroupedOptions()` drives which options render outside any group

### UIKit-Only Concerns (NOT in headless)

- Option visual styling (active highlight, selected highlight, disabled opacity)
- Group visual styling (label header, indentation)
- Virtual scroll viewport management and option recycling
- `cv-input` and `cv-change` event dispatch based on state diffing after user interactions
- `preventDefault` on navigation keys to prevent page scroll
- Slot change detection to rebuild the headless model when child options are added/removed

## Behavioral Contract

### Option Collection

- `cv-listbox` scans its light DOM children (direct `cv-option` and `cv-option` within `cv-listbox-group`) to build the options array for the headless model
- Each `cv-option` must have a `value` attribute; if omitted, an auto-generated fallback `option-{n}` is assigned
- The `textContent` of each `cv-option` is used as the option label for typeahead matching
- Initial selection is read from `cv-option[selected]` attributes at first render
- On `slotchange`, the model is rebuilt with the updated option list, preserving still-valid selection and active state

### Pointer Interaction

- Clicking a `cv-option` calls `actions.setActive(id)` followed by `actions.selectOnly(id)` (single) or `actions.toggleSelected(id)` (multiple)
- Pointer interactions dispatch `cv-input` and `cv-change` events based on state diffing

### Focus Management

- When `focus-strategy="aria-activedescendant"` (default): `[part="base"]` has `tabindex="0"` and receives DOM focus; `aria-activedescendant` points to the active option; all options have `tabindex="-1"`
- When `focus-strategy="roving-tabindex"`: `[part="base"]` has `tabindex="-1"`; the active option has `tabindex="0"` and receives DOM focus; other options have `tabindex="-1"`

### Virtual Scroll Support

- `aria-setsize` and `aria-posinset` from `getOptionProps` support virtual scrolling
- When using virtual scrolling, only a subset of options is rendered, but each carries correct setsize/posinset reflecting the full option list
- Virtual scroll viewport management is a UIKit concern, not headless

## Usage

The demo keeps the headless contract visible: active focus, selected values,
group labels, range selection, and alternate focus/orientation modes are shown
in one operational surface. For option label composition, prefix/suffix slots,
and rich option content, see [`cv-option`](./option.md).

```html
<div class="listbox-demo-shell usage-demo" data-demo="listbox" data-live-demo-height="860">
  <section class="listbox-demo-hero usage-demo__hero" aria-labelledby="listbox-demo-title">
    <div class="listbox-demo-copy usage-demo__copy">
      <span class="listbox-demo-kicker usage-demo__kicker">Collection selection primitive</span>
      <h3 id="listbox-demo-title">Choose one visible route, then compose the export fields.</h3>
      <p>
        <code>cv-listbox</code> adapts the headless model into DOM focus, ARIA state, grouped options, and
        keyboard selection without owning the visual content inside each option.
      </p>
    </div>

    <dl class="listbox-demo-metrics usage-demo__metrics" aria-label="Listbox contract summary">
      <div>
        <dt>Default focus</dt>
        <dd><code>aria-activedescendant</code> on the listbox root</dd>
      </div>
      <div>
        <dt>Selection modes</dt>
        <dd>single, multiple, optional range</dd>
      </div>
      <div>
        <dt>Keyboard</dt>
        <dd>arrows, Home/End, typeahead, Space/Enter</dd>
      </div>
    </dl>
  </section>

  <section class="listbox-demo-workbench usage-demo__workbench" aria-labelledby="listbox-demo-workbench-title">
    <div class="listbox-demo-section-header usage-demo__section-header">
      <span class="listbox-demo-kicker usage-demo__kicker">Interactive contract</span>
      <h4 id="listbox-demo-workbench-title">
        Grouped single-select and multi-select examples share one event readout.
      </h4>
    </div>

    <div class="listbox-demo-layout">
      <article
        class="listbox-demo-panel listbox-demo-panel--primary usage-demo__panel"
        aria-labelledby="listbox-demo-route-title"
      >
        <header class="listbox-demo-panel-header usage-demo__panel-header">
          <div>
            <span class="listbox-demo-label">Single select with groups</span>
            <h5 id="listbox-demo-route-title">Visible profile route</h5>
          </div>
          <cv-badge variant="primary">active root</cv-badge>
        </header>

        <cv-listbox class="listbox-demo-primary" aria-label="Visible vault route">
          <cv-listbox-group label="Visible surfaces">
            <cv-option value="daily" data-label="Daily vault">
              <span slot="prefix" class="listbox-demo-glyph">D</span>
              <span class="listbox-demo-option-copy">
                <strong>Daily vault</strong>
                <small>Default work profile</small>
              </span>
              <cv-badge slot="suffix" variant="neutral">stable</cv-badge>
            </cv-option>
            <cv-option value="travel" data-label="Travel profile" selected>
              <span slot="prefix" class="listbox-demo-glyph listbox-demo-glyph--violet">T</span>
              <span class="listbox-demo-option-copy">
                <strong>Travel profile</strong>
                <small>Deniable border route</small>
              </span>
              <cv-badge slot="suffix" variant="primary">visible</cv-badge>
            </cv-option>
          </cv-listbox-group>
          <cv-listbox-group label="Hidden layers">
            <cv-option value="sealed" data-label="Sealed core">
              <span slot="prefix" class="listbox-demo-glyph">S</span>
              <span class="listbox-demo-option-copy">
                <strong>Sealed core</strong>
                <small>Requires hardware proof</small>
              </span>
              <cv-badge slot="suffix" variant="success">paired</cv-badge>
            </cv-option>
            <cv-option value="remote" data-label="Remote recovery" disabled>
              <span slot="prefix" class="listbox-demo-glyph listbox-demo-glyph--muted">R</span>
              <span class="listbox-demo-option-copy">
                <strong>Remote recovery</strong>
                <small>Disabled until quorum returns</small>
              </span>
              <cv-badge slot="suffix" variant="neutral">disabled</cv-badge>
            </cv-option>
          </cv-listbox-group>
        </cv-listbox>
      </article>

      <article class="listbox-demo-panel usage-demo__panel" aria-labelledby="listbox-demo-export-title">
        <header class="listbox-demo-panel-header usage-demo__panel-header">
          <div>
            <span class="listbox-demo-label">Multiple select with range</span>
            <h5 id="listbox-demo-export-title">Export field set</h5>
          </div>
          <cv-badge variant="neutral">Shift + Arrow</cv-badge>
        </header>

        <cv-listbox selection-mode="multiple" range-selection aria-label="Export fields">
          <cv-option value="name" data-label="Record name" selected>
            <span slot="prefix" class="listbox-demo-glyph">N</span>
            <span class="listbox-demo-option-copy">
              <strong>Record name</strong>
              <small>Shown in review table</small>
            </span>
          </cv-option>
          <cv-option value="owner" data-label="Owner" selected>
            <span slot="prefix" class="listbox-demo-glyph">O</span>
            <span class="listbox-demo-option-copy">
              <strong>Owner</strong>
              <small>Operational accountability</small>
            </span>
          </cv-option>
          <cv-option value="risk" data-label="Risk flag">
            <span slot="prefix" class="listbox-demo-glyph listbox-demo-glyph--violet">R</span>
            <span class="listbox-demo-option-copy">
              <strong>Risk flag</strong>
              <small>Visible in elevated review</small>
            </span>
          </cv-option>
          <cv-option value="raw" data-label="Raw secret" disabled>
            <span slot="prefix" class="listbox-demo-glyph listbox-demo-glyph--muted">X</span>
            <span class="listbox-demo-option-copy">
              <strong>Raw secret</strong>
              <small>Never exported from this route</small>
            </span>
          </cv-option>
        </cv-listbox>
      </article>
    </div>

    <output class="listbox-demo-readout" aria-live="polite" data-listbox-readout>
      Selection events appear here.
    </output>

    <div class="listbox-demo-mode-grid" aria-label="Listbox mode examples">
      <article class="listbox-demo-mode" aria-labelledby="listbox-demo-horizontal-title">
        <span class="listbox-demo-label">Horizontal orientation</span>
        <h5 id="listbox-demo-horizontal-title">Review lane</h5>
        <cv-listbox orientation="horizontal" aria-label="Review lane">
          <cv-option value="all" data-label="All" selected>All</cv-option>
          <cv-option value="paired" data-label="Paired">Paired</cv-option>
          <cv-option value="blocked" data-label="Blocked">Blocked</cv-option>
        </cv-listbox>
      </article>

      <article class="listbox-demo-mode" aria-labelledby="listbox-demo-roving-title">
        <span class="listbox-demo-label">Roving tabindex</span>
        <h5 id="listbox-demo-roving-title">Direct option focus</h5>
        <cv-listbox focus-strategy="roving-tabindex" aria-label="Review depth">
          <cv-option value="summary" data-label="Summary" selected>Summary</cv-option>
          <cv-option value="proof" data-label="Proof">Proof</cv-option>
          <cv-option value="events" data-label="Events">Events</cv-option>
        </cv-listbox>
      </article>
    </div>
  </section>
</div>

<script>
  document.querySelectorAll('.listbox-demo-shell[data-demo="listbox"]:not([data-ready])').forEach((shell) => {
    shell.dataset.ready = 'true'

    const readout = shell.querySelector('[data-listbox-readout]')
    const getLabel = (option) =>
      option?.dataset.label || option?.textContent?.trim().replace(/\s+/g, ' ') || 'none'
    const getSelectedLabels = (listbox) =>
      Array.from(listbox?.querySelectorAll('cv-option') ?? [])
        .filter((option) => option.selected || option.hasAttribute('selected'))
        .map(getLabel)

    const update = () => {
      if (!readout) return

      const route = shell.querySelector('.listbox-demo-primary')
      const fields = shell.querySelector('cv-listbox[selection-mode="multiple"]')
      const routeActive = getLabel(route?.querySelector('cv-option[data-active="true"]'))
      const routeSelected = getSelectedLabels(route)[0] || 'none'
      const fieldSelected = getSelectedLabels(fields)

      readout.textContent = `Route: ${routeSelected}. Active option: ${routeActive}. Export fields: ${
        fieldSelected.length > 0 ? fieldSelected.join(', ') : 'none'
      }.`
    }

    shell.querySelectorAll('cv-listbox').forEach((listbox) => {
      listbox.addEventListener('cv-input', update)
      listbox.addEventListener('cv-change', update)
    })

    requestAnimationFrame(update)
  })
</script>
```

## Child Elements

### cv-option

Individual selectable option within a `cv-listbox` or `cv-listbox-group`. The parent `cv-listbox` manages all ARIA attributes on this element via headless contracts.

#### Anatomy

```
<cv-option> (host)
└── <div part="base">
    └── <slot>
```

#### Attributes

| Attribute  | Type    | Default | Description                                                                   |
| ---------- | ------- | ------- | ----------------------------------------------------------------------------- |
| `value`    | String  | `""`    | Unique identifier for this option. Auto-generated as `option-{n}` if omitted. |
| `disabled` | Boolean | `false` | Whether the option is disabled                                                |
| `selected` | Boolean | `false` | Whether the option is selected. Managed by parent.                            |
| `active`   | Boolean | `false` | Whether the option is the active (highlighted) option. Managed by parent.     |

#### Slots

| Slot        | Description          |
| ----------- | -------------------- |
| `(default)` | Option label content |

#### CSS Parts

| Part   | Element | Description                         |
| ------ | ------- | ----------------------------------- |
| `base` | `<div>` | Root wrapper for the option content |

#### Visual States

| Host selector           | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `:host([selected])`     | Option is currently selected (primary tint at 34%)                   |
| `:host([active])`       | Option is the active/highlighted option (primary tint at 22%)        |
| `:host([disabled])`     | Option is disabled (opacity 0.55)                                    |
| `:host(:focus-visible)` | Focus ring when option receives DOM focus (roving-tabindex strategy) |

---

### cv-listbox-group

Groups related options under a visible label header. Must be a direct child of `cv-listbox`.

#### Anatomy

```
<cv-listbox-group> (host)
├── <div part="label">   ← group label text
└── <slot>               ← accepts <cv-option> children
```

#### Attributes

| Attribute | Type   | Default | Description                                                                                           |
| --------- | ------ | ------- | ----------------------------------------------------------------------------------------------------- |
| `label`   | String | `""`    | Visible group header text. Also used for `aria-labelledby` linkage via headless `getGroupLabelProps`. |

#### Slots

| Slot        | Description                        |
| ----------- | ---------------------------------- |
| `(default)` | One or more `<cv-option>` children |

#### CSS Parts

| Part    | Element | Description              |
| ------- | ------- | ------------------------ |
| `label` | `<div>` | Group label text element |

#### CSS Custom Properties

| Property                             | Default                               | Description                         |
| ------------------------------------ | ------------------------------------- | ----------------------------------- |
| `--cv-listbox-group-label-color`     | `var(--cv-color-text-muted, #8892a6)` | Group label text color              |
| `--cv-listbox-group-label-font-size` | `0.85em`                              | Group label font size               |
| `--cv-listbox-group-gap`             | `var(--cv-space-1, 4px)`              | Gap between group label and options |

#### Visual States

| Host selector | Description                                       |
| ------------- | ------------------------------------------------- |
| `:host`       | Block display with group role and aria-labelledby |
