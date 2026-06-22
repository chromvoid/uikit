# cv-tabs

Tabbed interface for switching between related content panels. Use tabs when each panel is a peer view of
the same object or workflow, not as a replacement for page navigation.

**Headless:** [`createTabs`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/tabs.md)

## Anatomy

```
<cv-tabs> (host)
└── <div part="base">
    ├── <div part="list" role="tablist">
    │   ├── <slot name="nav">            ← accepts <cv-tab> children
    │   └── <div part="indicator">       ← animated active indicator
    └── <div part="panels">
        └── <slot>                         ← accepts <cv-tab-panel> children
```

## Attributes

| Attribute         | Type   | Default        | Description                         |
| ----------------- | ------ | -------------- | ----------------------------------- |
| `value`           | String | `""`           | Currently selected tab value        |
| `orientation`     | String | `"horizontal"` | Layout: `horizontal` \| `vertical`  |
| `activation-mode` | String | `"automatic"`  | Activation: `automatic` \| `manual` |
| `aria-label`      | String | `""`           | Accessible label for the tablist    |

## Slots

| Slot        | Description               |
| ----------- | ------------------------- |
| `nav`       | `<cv-tab>` children       |
| `(default)` | `<cv-tab-panel>` children |

## CSS Parts

| Part        | Element | Description                                                 |
| ----------- | ------- | ----------------------------------------------------------- |
| `base`      | `<div>` | Root layout container                                       |
| `list`      | `<div>` | Tablist wrapper                                             |
| `indicator` | `<div>` | Animated active indicator positioned under the selected tab |
| `panels`    | `<div>` | Panel container                                             |

## CSS Custom Properties

| Property                    | Default                            | Description                                                                            |
| --------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `--cv-tabs-indicator-color` | `var(--cv-color-primary, #65d7ff)` | Color of the active indicator                                                          |
| `--cv-tabs-indicator-size`  | `3px`                              | Indicator thickness: height for horizontal orientation, width for vertical orientation |

Additionally, component styles depend on theme tokens through fallback values:

| Theme Property       | Default   | Description                     |
| -------------------- | --------- | ------------------------------- |
| `--cv-space-1`       | `4px`     | Gap between tabs, list padding  |
| `--cv-space-2`       | `8px`     | Gap between list and panels     |
| `--cv-space-3`       | `12px`    | Panels padding                  |
| `--cv-radius-md`     | `10px`    | List and panels border radius   |
| `--cv-color-border`  | `#2a3245` | List and panels border          |
| `--cv-color-surface` | `#141923` | List and panels background      |
| `--cv-color-primary` | `#65d7ff` | Focus and selected accent color |

## Visual States

| Host selector                     | Description                                         |
| --------------------------------- | --------------------------------------------------- |
| `:host([orientation="vertical"])` | Layout switches to vertical tablist + panel columns |

## Events

| Event       | Detail                                                         | Description                                                                                              |
| ----------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `cv-input`  | `{activeTabId: string \| null, selectedTabId: string \| null}` | Fires on any active or selected state change, including active-only changes that do not change selection |
| `cv-change` | `{activeTabId: string \| null, selectedTabId: string \| null}` | Fires when selected tab changes                                                                          |

`cv-input` fires on every user-driven state transition (active or selected). `cv-change` fires only when `selectedTabId` changes. Both events share the same detail shape. In `manual` activation mode, arrow-key navigation fires `cv-input` (active change) without `cv-change`; pressing `Enter`/`Space` fires both `cv-input` and `cv-change`.

## Reactive State Mapping

`cv-tabs` is a visual adapter over headless `createTabs` reactive state.

### UIKit Property to Headless Binding

| UIKit Property    | Direction     | Headless Binding                                       |
| ----------------- | ------------- | ------------------------------------------------------ |
| `value`           | attr → action | `actions.select(value)` when `value` attribute changes |
| `orientation`     | attr → option | passed as `orientation` in `createTabs(options)`       |
| `activation-mode` | attr → option | passed as `activationMode` in `createTabs(options)`    |
| `aria-label`      | attr → option | passed as `ariaLabel` in `createTabs(options)`         |

### Headless State to DOM Reflection

| Headless State          | Direction    | DOM Reflection                                                        |
| ----------------------- | ------------ | --------------------------------------------------------------------- |
| `state.selectedTabId()` | state → attr | `cv-tabs[value]` host attribute                                       |
| `state.activeTabId()`   | state → attr | `cv-tab[active]` boolean attribute on the active tab element          |
| `state.selectedTabId()` | state → attr | `cv-tab[selected]` boolean attribute on the selected tab element      |
| `state.selectedTabId()` | state → attr | `cv-tab-panel[selected]` and `cv-tab-panel[hidden]` on panel elements |

### Headless Actions Called

| Action                         | UIKit Trigger                                 |
| ------------------------------ | --------------------------------------------- |
| `actions.select(id)`           | Tab is clicked or tapped (pointer activation) |
| `actions.handleKeyDown(event)` | `keydown` event on a tab element              |

### Headless Contracts Spread

| Contract                      | UIKit Target                                                 |
| ----------------------------- | ------------------------------------------------------------ |
| `contracts.getTabListProps()` | Spread onto `[part="list"]` element                          |
| `contracts.getTabProps(id)`   | Spread onto each `cv-tab` element (via attribute sync)       |
| `contracts.getPanelProps(id)` | Spread onto each `cv-tab-panel` element (via attribute sync) |

### UIKit-Only Concerns (Not in Headless)

- **Active indicator**: Positioned and animated at the UIKit layer using `selectedTabId` to determine which tab to highlight.
- **Closable tabs**: Close button rendering and close orchestration are UIKit concerns. Headless handles selection fallback implicitly through model rebuild with an updated tab list (without the closed tab).
- **`cv-input` / `cv-change` events**: Custom DOM events dispatched by the UIKit wrapper, not part of the headless model.

UIKit does not own tab selection logic; headless state is the source of truth.

## Usage

```html
<div class="tabs-demo-shell">
  <section class="tabs-demo-hero" aria-labelledby="tabs-demo-title">
    <div class="tabs-demo-copy">
      <span class="tabs-demo-kicker">Selection surface</span>
      <h3 id="tabs-demo-title">One active panel inside a known context.</h3>
      <p>
        Tabs keep sibling views close together, expose selected and focused state through the headless model,
        and preserve keyboard movement without forcing a route change.
      </p>
    </div>

    <dl class="tabs-demo-metrics" aria-label="Tabs behavior summary">
      <div>
        <dt>State</dt>
        <dd>value</dd>
      </div>
      <div>
        <dt>Keys</dt>
        <dd>Arrows</dd>
      </div>
      <div>
        <dt>Modes</dt>
        <dd>Auto / manual</dd>
      </div>
    </dl>
  </section>

  <section class="tabs-demo-section" aria-labelledby="tabs-demo-horizontal-title">
    <div class="tabs-demo-section-header">
      <span class="tabs-demo-kicker">Horizontal</span>
      <h4 id="tabs-demo-horizontal-title">Use for compact panels with the same visual weight</h4>
    </div>

    <cv-tabs value="overview" aria-label="Vault record tabs">
      <cv-tab slot="nav" value="overview">Overview</cv-tab>
      <cv-tab slot="nav" value="history">History</cv-tab>
      <cv-tab slot="nav" value="access">Access</cv-tab>
      <cv-tab slot="nav" value="recovery" disabled>Recovery</cv-tab>

      <cv-tab-panel tab="overview">
        <div class="tabs-demo-panel-content">
          <h5>Overview</h5>
          <p>Show the current record summary, freshness, and the next safe action.</p>
        </div>
      </cv-tab-panel>
      <cv-tab-panel tab="history">
        <div class="tabs-demo-panel-content">
          <h5>History</h5>
          <p>Review recent changes without leaving the record detail surface.</p>
        </div>
      </cv-tab-panel>
      <cv-tab-panel tab="access">
        <div class="tabs-demo-panel-content">
          <h5>Access</h5>
          <p>Audit who can unlock or export this entry in the current vault context.</p>
        </div>
      </cv-tab-panel>
      <cv-tab-panel tab="recovery">
        <div class="tabs-demo-panel-content">
          <h5>Recovery</h5>
          <p>Disabled tabs stay visible when a state exists but is not available yet.</p>
        </div>
      </cv-tab-panel>
    </cv-tabs>
  </section>

  <section class="tabs-demo-section" aria-labelledby="tabs-demo-vertical-title">
    <div class="tabs-demo-section-header">
      <span class="tabs-demo-kicker">Vertical manual</span>
      <h4 id="tabs-demo-vertical-title">Use for longer labels and settings-style grouping</h4>
    </div>

    <cv-tabs value="policy" orientation="vertical" activation-mode="manual" aria-label="Vault policy tabs">
      <cv-tab slot="nav" value="policy">Threat model</cv-tab>
      <cv-tab slot="nav" value="devices">Trusted devices</cv-tab>
      <cv-tab slot="nav" value="exports">Export policy</cv-tab>

      <cv-tab-panel tab="policy">
        <div class="tabs-demo-panel-content">
          <h5>Threat model</h5>
          <p>
            In manual mode, arrow keys move focus first. Press Enter or Space to commit the selected panel.
          </p>
        </div>
      </cv-tab-panel>
      <cv-tab-panel tab="devices">
        <div class="tabs-demo-panel-content">
          <h5>Trusted devices</h5>
          <p>Use the vertical layout when the tab list behaves like a local settings rail.</p>
        </div>
      </cv-tab-panel>
      <cv-tab-panel tab="exports">
        <div class="tabs-demo-panel-content">
          <h5>Export policy</h5>
          <p>Panels keep the same width as the container, so content does not jump between tabs.</p>
        </div>
      </cv-tab-panel>
    </cv-tabs>
  </section>

  <section class="tabs-demo-note" aria-labelledby="tabs-demo-close-title">
    <span class="tabs-demo-kicker">Closable tabs</span>
    <h4 id="tabs-demo-close-title">Close buttons are opt-in, not a default tab affordance.</h4>
    <p>
      Add <code>closable</code> only for removable workspace tabs such as open files or temporary records. The
      consumer must remove the matching <code>cv-tab</code> and <code>cv-tab-panel</code> after the
      <code>cv-close</code> event.
    </p>
  </section>
</div>
```

## Child Elements

### cv-tab

Individual tab trigger within the tablist.

#### Anatomy

```
<cv-tab> (host)
└── <div class="tab" part="base">
    ├── <slot>
    └── <button part="close-button">     ← only when [closable]
```

#### Attributes

| Attribute  | Type    | Default | Description                                             |
| ---------- | ------- | ------- | ------------------------------------------------------- |
| `value`    | String  | `""`    | Unique identifier linking this tab to a panel           |
| `disabled` | Boolean | `false` | Prevents selection and keyboard activation              |
| `active`   | Boolean | `false` | Whether this tab has roving focus (managed by parent)   |
| `selected` | Boolean | `false` | Whether this tab's panel is visible (managed by parent) |
| `closable` | Boolean | `false` | Shows close affordance for removal flows                |

#### Slots

| Slot        | Description       |
| ----------- | ----------------- |
| `(default)` | Tab label content |

#### CSS Parts

| Part           | Element    | Description                                                |
| -------------- | ---------- | ---------------------------------------------------------- |
| `base`         | `<div>`    | Tab interactive wrapper                                    |
| `close-button` | `<button>` | Close affordance (rendered only when `closable` is `true`) |

#### Visual States

| Host selector       | Description                                      |
| ------------------- | ------------------------------------------------ |
| `:host([active])`   | Focused tab in roving tabindex model             |
| `:host([selected])` | Selected tab with visible panel                  |
| `:host([disabled])` | Disabled appearance and non-interactive behavior |

#### Events

| Event      | Detail            | Description                                                     |
| ---------- | ----------------- | --------------------------------------------------------------- |
| `cv-close` | `{value: string}` | Requests removal of this tab when close affordance is activated |

The `cv-close` event bubbles and is composed. It is dispatched when the user activates the close button. The `value` in the detail corresponds to the tab's `value` attribute. The parent `cv-tabs` handles close orchestration: it determines a fallback tab, transitions selection if the closed tab was active or selected, and expects the consumer to remove the `cv-tab` and `cv-tab-panel` elements from the DOM.

---

### cv-tab-panel

Content panel associated with a tab.

#### Anatomy

```
<cv-tab-panel> (host)
└── <div part="base" role="tabpanel">
    └── <slot>
```

#### Attributes

| Attribute  | Type    | Default | Description                                       |
| ---------- | ------- | ------- | ------------------------------------------------- |
| `tab`      | String  | `""`    | Value of the associated `<cv-tab>`                |
| `selected` | Boolean | `false` | Whether this panel is visible (managed by parent) |

#### Slots

| Slot        | Description   |
| ----------- | ------------- |
| `(default)` | Panel content |

#### CSS Parts

| Part   | Element | Description           |
| ------ | ------- | --------------------- |
| `base` | `<div>` | Panel content wrapper |

#### Visual States

| Host selector     | Description                       |
| ----------------- | --------------------------------- |
| `:host([hidden])` | Hidden when panel is not selected |
