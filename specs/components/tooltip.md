# cv-tooltip

Contextual information overlay that appears near a trigger element on hover, focus, click, or programmatic control.

**Headless:** [`createTooltip`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/tooltip.md)

## Anatomy

```
<cv-tooltip> (host)
└── <span part="base">
    ├── <span part="trigger">
    │   └── <slot name="trigger">
    └── <span part="content" role="tooltip">
        ├── <slot name="content">
        └── <span part="arrow">           ← only when [arrow]
```

## Attributes

| Attribute    | Type    | Default         | Description                                                                |
| ------------ | ------- | --------------- | -------------------------------------------------------------------------- |
| `open`       | Boolean | `false`         | Reflects tooltip visibility; can be set to programmatically show or hide   |
| `disabled`   | Boolean | `false`         | Disables all trigger interactions; removes `aria-describedby` from trigger |
| `show-delay` | Number  | `120`           | Milliseconds to wait before showing the tooltip                            |
| `hide-delay` | Number  | `80`            | Milliseconds to wait before hiding the tooltip                             |
| `trigger`    | String  | `'hover focus'` | Space-separated trigger modes: `hover` \| `focus` \| `click` \| `manual`   |
| `arrow`      | Boolean | `false`         | Renders the `part="arrow"` CSS triangle pointing toward the trigger        |

## Slots

| Slot      | Description                                                                  |
| --------- | ---------------------------------------------------------------------------- |
| `trigger` | The element that activates the tooltip (receives `aria-describedby` linkage) |
| `content` | Rich HTML tooltip body content                                               |

## CSS Parts

| Part      | Element  | Description                                                          |
| --------- | -------- | -------------------------------------------------------------------- |
| `base`    | `<span>` | Root layout wrapper, positioned relatively                           |
| `trigger` | `<span>` | Wrapper around the trigger slot; receives event listeners            |
| `content` | `<span>` | Tooltip body container with `role="tooltip"`; hidden when not open   |
| `arrow`   | `<span>` | Optional CSS triangle indicator; rendered only when `[arrow]` is set |

## CSS Custom Properties

Component styles depend on theme tokens through inline fallback values:

> **Note:** Component-level `--cv-tooltip-*` custom property indirection is not implemented.
> Styles reference theme tokens directly.

| Theme Property                | Default                         | Description                 |
| ----------------------------- | ------------------------------- | --------------------------- |
| `--cv-color-surface-elevated` | `#1d2432`                       | Elevated surface background |
| `--cv-color-border`           | `#2a3245`                       | Border color                |
| `--cv-color-text`             | `#e8ecf6`                       | Default text color          |
| `--cv-shadow-1`               | `0 2px 8px rgba(0, 0, 0, 0.24)` | Drop shadow                 |
| `--cv-radius-sm`              | `6px`                           | Border radius               |
| `--cv-space-1`                | `4px`                           | Small spacing scale         |
| `--cv-space-2`                | `8px`                           | Medium spacing scale        |

## Visual States

| Host selector       | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `:host([open])`     | Tooltip content is visible; `[part="content"]` has `hidden` removed |
| `:host([disabled])` | All trigger interactions are blocked; `aria-describedby` is removed |
| `:host([arrow])`    | Arrow indicator (`[part="arrow"]`) is rendered and visible          |

## Events

| Event       | Detail              | Description                                                   |
| ----------- | ------------------- | ------------------------------------------------------------- |
| `cv-input`  | `{ open: boolean }` | Fires on every open/close transition triggered by interaction |
| `cv-change` | `{ open: boolean }` | Fires when the open state commits after interaction           |

Both events bubble and are composed. They are dispatched together on every transition of `isOpen`.

## Reactive State Mapping

`cv-tooltip` is a visual adapter over headless `createTooltip`.

| UIKit Property | Direction     | Headless Binding                                                    |
| -------------- | ------------- | ------------------------------------------------------------------- |
| `open`         | attr → action | `actions.open()` / `actions.close()` depending on value             |
| `disabled`     | attr → action | `actions.setDisabled(value)`                                        |
| `show-delay`   | attr → option | passed as `showDelay` to `createTooltip(options)` (recreates model) |
| `hide-delay`   | attr → option | passed as `hideDelay` to `createTooltip(options)` (recreates model) |
| `trigger`      | attr → option | passed as `trigger` to `createTooltip(options)`                     |

| Headless State       | Direction    | DOM Reflection              |
| -------------------- | ------------ | --------------------------- |
| `state.isOpen()`     | state → attr | `[open]` host attribute     |
| `state.isDisabled()` | state → attr | `[disabled]` host attribute |

- `contracts.getTriggerProps()` is spread onto `[part="trigger"]` to apply `id`, `aria-describedby`, and all active event handlers (`onPointerEnter`, `onPointerLeave`, `onFocus`, `onBlur`, `onClick`, `onKeyDown`) depending on the active `trigger` modes.
- `contracts.getTooltipProps()` is spread onto `[part="content"]` to apply `id`, `role="tooltip"`, `tabindex="-1"`, and `hidden`.
- `aria-describedby` is also propagated to assigned slotted trigger elements directly via `syncTriggerAria`.
- UIKit dispatches `cv-input` and `cv-change` events by observing transitions of `isOpen` caused by interaction; programmatic `open`/`close` calls that do not change state do not re-emit.
- UIKit does not own trigger or delay logic; headless state is the source of truth.
- When `show-delay` or `hide-delay` changes, the model is recreated with the current `open` state preserved as `initialOpen`.
- Public methods `show()` and `hide()` delegate to `model.actions.show()` / `model.actions.hide()` for `manual` mode consumers.

## Usage

```html
<div class="tooltip-demo-shell" data-demo="tooltip" data-live-demo-height="760">
  <section class="tooltip-demo-hero" aria-labelledby="tooltip-demo-title">
    <div class="tooltip-demo-copy">
      <span class="tooltip-demo-kicker">Context hint primitive</span>
      <h3 id="tooltip-demo-title">Expose precise context without turning dense controls into prose.</h3>
      <p>
        Tooltip keeps hover, focus, click, delay, and ARIA linkage in the headless model. UIKit owns the
        anchored surface, arrow, and product-scale density.
      </p>
    </div>

    <dl class="tooltip-demo-metrics" aria-label="Tooltip contract summary">
      <div>
        <dt>ARIA</dt>
        <dd>role="tooltip" + describedby</dd>
      </div>
      <div>
        <dt>Triggers</dt>
        <dd>hover / focus / click / manual</dd>
      </div>
      <div>
        <dt>Delay</dt>
        <dd>show + hide timers</dd>
      </div>
    </dl>
  </section>

  <section class="tooltip-demo-workbench" aria-labelledby="tooltip-demo-workbench-title">
    <div class="tooltip-demo-section-header">
      <span class="tooltip-demo-kicker">Vault control surface</span>
      <h4 id="tooltip-demo-workbench-title">Use tooltips for compact mechanisms, limits, and labels.</h4>
    </div>

    <div class="tooltip-demo-board" aria-label="Tooltip examples in a vault control list">
      <article class="tooltip-demo-panel" aria-label="Visible route controls">
        <header class="tooltip-demo-panel-head">
          <div>
            <span class="tooltip-demo-label">visible route</span>
            <strong>travel-profile.visible</strong>
          </div>
          <span class="tooltip-demo-status">coercion profile active</span>
        </header>

        <div class="tooltip-demo-targets" aria-label="Tooltip targets in context">
          <div class="tooltip-demo-target tooltip-demo-target--primary">
            <cv-tooltip
              arrow
              open
              show-delay="0"
              hide-delay="120"
              class="tooltip-demo-tip tooltip-demo-tip--primary"
            >
              <button slot="trigger" type="button" class="tooltip-demo-hotspot tooltip-demo-hotspot--primary">
                Visible profile
              </button>
              <span slot="content">Only the visible route is enumerated in this surface.</span>
            </cv-tooltip>
            <span class="tooltip-demo-target-copy">
              <strong>Current route label</strong>
              <span>Always-open example for a persistent explanatory hint.</span>
            </span>
          </div>

          <div class="tooltip-demo-target">
            <cv-tooltip arrow show-delay="180" hide-delay="120">
              <button slot="trigger" type="button" class="tooltip-demo-hotspot">Sync proof</button>
              <span slot="content"
                >Hover or focus keeps the proof label discoverable without adding a column.</span
              >
            </cv-tooltip>
            <span class="tooltip-demo-target-copy">
              <strong>Hover + focus</strong>
              <span>Compact mechanism detail for mouse and keyboard users.</span>
            </span>
          </div>

          <div class="tooltip-demo-target">
            <cv-tooltip arrow trigger="click" class="tooltip-demo-tip tooltip-demo-tip--click">
              <button slot="trigger" type="button" class="tooltip-demo-hotspot">Relay mode</button>
              <span slot="content"
                >Click mode is useful for touch-oriented controls and inspection affordances.</span
              >
            </cv-tooltip>
            <span class="tooltip-demo-target-copy">
              <strong>Click trigger</strong>
              <span>Press the target to keep the explanation open until the next press.</span>
            </span>
          </div>

          <div class="tooltip-demo-target tooltip-demo-target--violet">
            <cv-tooltip arrow open trigger="manual" id="tooltip-demo-manual">
              <button slot="trigger" type="button" class="tooltip-demo-hotspot tooltip-demo-hotspot--violet">
                Hidden layer
              </button>
              <span slot="content">Manual mode lets a parent tour or guidance host own visibility.</span>
            </cv-tooltip>
            <span class="tooltip-demo-target-copy">
              <strong>Manual mode</strong>
              <span>Controlled by the buttons in the behavior panel.</span>
            </span>
          </div>
        </div>
      </article>

      <aside class="tooltip-demo-panel tooltip-demo-panel--side" aria-label="Tooltip behavior examples">
        <div class="tooltip-demo-mode-grid">
          <div>
            <span class="tooltip-demo-label">Default</span>
            <cv-tooltip arrow>
              <button slot="trigger" type="button" class="tooltip-demo-chip">hover + focus</button>
              <span slot="content">Default trigger combines pointer and keyboard discovery.</span>
            </cv-tooltip>
          </div>

          <div>
            <span class="tooltip-demo-label">Delayed</span>
            <cv-tooltip show-delay="420" hide-delay="180">
              <button slot="trigger" type="button" class="tooltip-demo-chip">420ms show</button>
              <span slot="content">Delay prevents accidental flashes during fast pointer movement.</span>
            </cv-tooltip>
          </div>

          <div>
            <span class="tooltip-demo-label">Disabled</span>
            <cv-tooltip disabled>
              <button slot="trigger" type="button" class="tooltip-demo-chip tooltip-demo-chip--disabled">
                no describedby
              </button>
              <span slot="content">This content is never announced while disabled.</span>
            </cv-tooltip>
          </div>
        </div>

        <div class="tooltip-demo-manual-controls" aria-label="Manual tooltip controls">
          <button type="button" class="tooltip-demo-control" data-tooltip-demo-show>Show manual</button>
          <button type="button" class="tooltip-demo-control" data-tooltip-demo-hide>Hide manual</button>
        </div>

        <output class="tooltip-demo-readout" aria-live="polite" data-tooltip-demo-readout>
          Manual tooltip is open. Hover, focus, or click the hotspots to inspect behavior.
        </output>
      </aside>
    </div>
  </section>
</div>

<script>
  document.querySelectorAll('.tooltip-demo-shell[data-demo="tooltip"]:not([data-ready])').forEach((shell) => {
    shell.dataset.ready = 'true'

    const manualTooltip = shell.querySelector('#tooltip-demo-manual')
    const showButton = shell.querySelector('[data-tooltip-demo-show]')
    const hideButton = shell.querySelector('[data-tooltip-demo-hide]')
    const readout = shell.querySelector('[data-tooltip-demo-readout]')

    const setReadout = (message) => {
      if (readout) readout.textContent = message
    }

    showButton?.addEventListener('click', () => {
      manualTooltip?.show()
      setReadout('Manual tooltip shown through show().')
    })

    hideButton?.addEventListener('click', () => {
      manualTooltip?.hide()
      setReadout('Manual tooltip hidden through hide().')
    })

    shell.addEventListener('cv-change', (event) => {
      const tooltip = event.target instanceof HTMLElement ? event.target.closest('cv-tooltip') : null
      if (!tooltip || tooltip.id === 'tooltip-demo-manual') return
      setReadout(`cv-change: tooltip is ${event.detail.open ? 'open' : 'closed'}.`)
    })
  })
</script>
```

```html source-only
<!-- Default: hover + focus triggers -->
<cv-tooltip>
  <button slot="trigger">Hover me</button>
  <span slot="content">Contextual info</span>
</cv-tooltip>

<!-- Click trigger only -->
<cv-tooltip trigger="click">
  <button slot="trigger">Click me</button>
  <span slot="content">Shown on click</span>
</cv-tooltip>

<!-- With arrow indicator -->
<cv-tooltip arrow>
  <button slot="trigger">With arrow</button>
  <span slot="content">Tooltip with arrow</span>
</cv-tooltip>
```

```html source-only
<!-- Manual mode (programmatic control) -->
<cv-tooltip trigger="manual" id="my-tip">
  <button slot="trigger">Target</button>
  <span slot="content">Shown programmatically</span>
</cv-tooltip>
<script>
  document.querySelector('#my-tip').show()
</script>

<!-- Disabled -->
<cv-tooltip disabled>
  <button slot="trigger">No tooltip</button>
  <span slot="content">Never shown</span>
</cv-tooltip>
```
