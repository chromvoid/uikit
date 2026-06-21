# cv-context-menu

Contextual menu triggered by right-click, keyboard invocation, or imperative `openAt(x, y)`, supporting direct `cv-menu-item` action children.

**Headless:** [`createContextMenu`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/context-menu.md)

## Anatomy

```
<cv-context-menu> (host)
├── <div part="target" tabindex="0">
│   └── <slot name="target">
└── <div part="menu" role="menu" tabindex="-1">
    └── <slot>   ← direct cv-menu-item children and inert role="separator" markup
```

## Attributes

| Attribute                  | Type    | Default | Description                                   |
| -------------------------- | ------- | ------- | --------------------------------------------- |
| `value`                    | String  | `""`    | Last selected item value                      |
| `open`                     | Boolean | `false` | Whether the menu is currently visible         |
| `anchor-x`                 | Number  | `0`     | X coordinate of the menu anchor point         |
| `anchor-y`                 | Number  | `0`     | Y coordinate of the menu anchor point         |
| `aria-label`               | String  | `""`    | Accessible label for the menu                 |
| `close-on-select`          | Boolean | `true`  | Close the menu after an item is selected      |
| `close-on-outside-pointer` | Boolean | `true`  | Close the menu on pointer interaction outside |
| `close-on-scroll`          | Boolean | `false` | Close the menu when the document scrolls      |

## Slots

| Slot        | Description                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| `target`    | Content that acts as the right-click or keyboard target zone                               |
| `(default)` | Direct `cv-menu-item` children; inert elements with `role="separator"` may separate groups |

`cv-context-menu` only indexes direct `cv-menu-item` children for selection and keyboard navigation. Separator markup is not a child component contract; use an inert element such as `<div role="separator" aria-hidden="true"></div>`. Non-item children are ignored by item navigation.

## CSS Parts

| Part     | Element | Description                                           |
| -------- | ------- | ----------------------------------------------------- |
| `target` | `<div>` | Wrapper for the trigger/target zone                   |
| `menu`   | `<div>` | Menu popup container positioned at anchor coordinates |

## CSS Custom Properties

| Property                            | Default                     | Description                                                               |
| ----------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `--cv-context-menu-x`               | `0px`                       | Inline-start position of the menu popup, set by the component from anchor |
| `--cv-context-menu-y`               | `0px`                       | Block-start position of the menu popup, set by the component from anchor  |
| `--cv-context-menu-min-inline-size` | `180px`                     | Minimum inline size of the menu popup                                     |
| `--cv-context-menu-padding`         | `var(--cv-space-1, 4px)`    | Padding inside the menu popup                                             |
| `--cv-context-menu-gap`             | `var(--cv-space-1, 4px)`    | Gap between menu items                                                    |
| `--cv-context-menu-border-radius`   | `var(--cv-radius-md, 10px)` | Border radius of the menu popup                                           |
| `--cv-context-menu-z-index`         | `80`                        | Z-index of the menu popup                                                 |

## Visual States

| Host selector         | Description           |
| --------------------- | --------------------- |
| `:host([open])`       | Menu popup is visible |
| `:host(:not([open]))` | Menu popup is hidden  |

## Events

| Event       | Detail                                                | Description                                                 |
| ----------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| `cv-input`  | `{value, activeId, open, anchorX, anchorY, openedBy}` | Fires on any state change (selection, active, open, anchor) |
| `cv-change` | `{value, activeId, open, anchorX, anchorY, openedBy}` | Fires only when the selected `value` changes                |

Event detail type:

```ts
interface CVContextMenuEventDetail {
  value: string | null
  activeId: string | null
  open: boolean
  anchorX: number
  anchorY: number
  openedBy: string | null // 'pointer' | 'keyboard' | 'programmatic' | null
}
```

## Imperative API

| Method   | Signature                        | Description                             |
| -------- | -------------------------------- | --------------------------------------- |
| `openAt` | `(x: number, y: number) => void` | Opens the menu at the given coordinates |
| `close`  | `() => void`                     | Closes the menu                         |

## Keyboard Interaction

### Target element

| Key           | Action                                  |
| ------------- | --------------------------------------- |
| `ContextMenu` | Open menu at current anchor coordinates |
| `Shift+F10`   | Open menu at current anchor coordinates |

### Menu

| Key               | Action                                     |
| ----------------- | ------------------------------------------ |
| `Escape`          | Close menu, restore focus to target        |
| `Tab`             | Close menu, restore focus to target        |
| `ArrowDown`       | Move active to next enabled item, wrapping |
| `ArrowUp`         | Move active to previous enabled item       |
| `Home`            | Move active to first enabled item          |
| `End`             | Move active to last enabled item           |
| `Enter` / `Space` | Select active item                         |

## ARIA Contract

| Element | Attribute       | Value                                   |
| ------- | --------------- | --------------------------------------- |
| menu    | `role`          | `menu`                                  |
| menu    | `tabindex`      | `-1`                                    |
| menu    | `aria-label`    | optional label text                     |
| menu    | `hidden`        | reflects `!open`                        |
| menu    | `data-anchor-x` | string of `anchorX`                     |
| menu    | `data-anchor-y` | string of `anchorY`                     |
| target  | `id`            | `{idBase}-target`                       |
| item    | `role`          | from `cv-menu-item` headless item props |
| item    | `tabindex`      | `-1`                                    |
| item    | `aria-disabled` | present when disabled                   |

## Reactive State Mapping

`cv-context-menu` is a visual adapter over headless `createContextMenu`.

| UIKit Property             | Direction      | Headless Binding                                                               |
| -------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `value`                    | attr -> action | `actions.select(value)` when value changes                                     |
| `open`                     | attr -> action | `actions.openAt(anchorX, anchorY)` when `true`; `actions.close()` when `false` |
| `anchor-x` / `anchor-y`    | attr -> action | passed to `actions.openAt(x, y)`                                               |
| `aria-label`               | attr -> option | passed as `ariaLabel` in `createContextMenu(options)`                          |
| `close-on-select`          | attr -> option | passed as `closeOnSelect` in `createContextMenu(options)`                      |
| `close-on-outside-pointer` | attr -> option | passed as `closeOnOutsidePointer` in `createContextMenu(options)`              |
| `close-on-scroll`          | attr -> DOM    | attaches a document scroll close listener only while `open && closeOnScroll`   |

| Headless State                        | Direction      | DOM Reflection                                                                   |
| ------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| `state.isOpen()`                      | state -> attr  | `[open]` host attribute, menu `[hidden]`                                         |
| `state.activeId()`                    | state -> DOM   | `[data-active]` on item elements, focus management                               |
| `state.anchorX()` / `state.anchorY()` | state -> attr  | `[anchor-x]` / `[anchor-y]` host attributes and host-owned CSS custom properties |
| `state.openedBy()`                    | state -> event | included in `cv-input`/`cv-change` event detail                                  |
| `state.restoreTargetId()`             | state -> DOM   | focus restored to target element on close                                        |

Contracts applied to DOM elements:

- `contracts.getTargetProps()` -> target wrapper (`[part="target"]`): provides `id`, `onContextMenu`, `onKeyDown`
- `contracts.getMenuProps()` -> menu container (`[part="menu"]`): provides `id`, `role`, `tabindex`, `hidden`, `aria-label`, `data-anchor-x`, `data-anchor-y`, `onKeyDown`
- `contracts.getItemProps(id)` -> each direct `cv-menu-item`: provides `id`, `role`, `tabindex`, `aria-disabled`, `data-active`, `onClick`

UIKit does not own activation or navigation logic; headless state is the source of truth.

## Usage

```html
<!-- Basic context menu -->
<cv-context-menu aria-label="File actions" data-live-demo-height="420">
  <div slot="target">Right-click here</div>
  <cv-menu-item value="copy">Copy</cv-menu-item>
  <cv-menu-item value="paste">Paste</cv-menu-item>
  <cv-menu-item value="delete" disabled>Delete</cv-menu-item>
</cv-context-menu>

<!-- With inert separators -->
<cv-context-menu aria-label="Edit actions">
  <div slot="target">Right-click here</div>
  <cv-menu-item value="cut">Cut</cv-menu-item>
  <cv-menu-item value="copy">Copy</cv-menu-item>
  <cv-menu-item value="paste">Paste</cv-menu-item>
  <div role="separator" aria-hidden="true"></div>
  <cv-menu-item value="select-all">Select All</cv-menu-item>
</cv-context-menu>

<!-- With prefix and suffix affordances from cv-menu-item -->
<cv-context-menu aria-label="File actions">
  <div slot="target">Content area</div>
  <cv-menu-item value="rename">
    <cv-icon slot="prefix" name="pencil"></cv-icon>
    Rename
    <span class="usage-demo__adornment" slot="suffix">F2</span>
  </cv-menu-item>
</cv-context-menu>

<!-- Imperative positioning -->
<cv-context-menu id="my-menu" aria-label="Custom menu" close-on-scroll>
  <div slot="target">Content area</div>
  <cv-menu-item value="action1">Action 1</cv-menu-item>
</cv-context-menu>
<script>
  document.getElementById('my-menu').openAt(200, 150)
</script>
```

## Child Elements

### cv-menu-item

Actionable item within the context menu. `cv-context-menu` owns selection, active state, visibility, and ARIA props for direct `cv-menu-item` children. `cv-menu-item` owns its visual structure, including `prefix`, default label, and `suffix` slots.

See `packages/uikit/specs/components/menu.md` for the shared `cv-menu-item` visual contract.

### Inert separators

Use plain inert markup between items when a divider is needed:

```html
<div role="separator" aria-hidden="true"></div>
```

Separators are ignored by item navigation and do not receive `cv-context-menu` item props.
