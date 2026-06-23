# cv-accordion

Vertically stacked set of interactive sections that expand or collapse to reveal content.

**Headless:** [`createAccordion`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/accordion.md)

## Anatomy

```
<cv-accordion> (host)
└── <section part="base" aria-label="…">
    └── <slot>                                     ← cv-accordion-item elements
```

## Attributes

| Attribute             | Type    | Default | Description                                                                                  |
| --------------------- | ------- | ------- | -------------------------------------------------------------------------------------------- |
| `value`               | String  | `""`    | Expanded section value (single mode). Reflects the first expanded item's `value`.            |
| `allow-multiple`      | Boolean | `false` | Allow multiple sections expanded simultaneously                                              |
| `allow-zero-expanded` | Boolean | `true`  | Allow all sections to be collapsed. When `false`, at least one section must remain expanded. |
| `heading-level`       | Number  | `3`     | Heading level (1–6) for all item headers                                                     |
| `aria-label`          | String  | `""`    | Accessible label for the accordion group                                                     |

**JS-only property:**

| Property         | Type       | Default | Description                                                            |
| ---------------- | ---------- | ------- | ---------------------------------------------------------------------- |
| `expandedValues` | `string[]` | `[]`    | Array of expanded section values (meaningful in `allow-multiple` mode) |

## Slots

| Slot        | Description                  |
| ----------- | ---------------------------- |
| `(default)` | `cv-accordion-item` elements |

## CSS Parts

| Part   | Element     | Description                    |
| ------ | ----------- | ------------------------------ |
| `base` | `<section>` | Root wrapper with `aria-label` |

## CSS Custom Properties

| Property             | Default                  | Description                     |
| -------------------- | ------------------------ | ------------------------------- |
| `--cv-accordion-gap` | `var(--cv-space-2, 8px)` | Spacing between accordion items |

## Visual States

| Host selector             | Description                       |
| ------------------------- | --------------------------------- |
| `:host([allow-multiple])` | Multiple sections can be expanded |

## Events

| Event       | Detail                      | Description                                                |
| ----------- | --------------------------- | ---------------------------------------------------------- |
| `cv-input`  | `{value, values, activeId}` | Fires on any interaction (expand/collapse or focus change) |
| `cv-change` | `{value, values, activeId}` | Fires only when expanded sections change                   |

**Event detail shape:**

| Field      | Type             | Description                                  |
| ---------- | ---------------- | -------------------------------------------- |
| `value`    | `string \| null` | First expanded item value, or `null` if none |
| `values`   | `string[]`       | All expanded item values                     |
| `activeId` | `string \| null` | Currently focused item value                 |

## Usage

Use `cv-accordion` for a true grouped composite: related sections with controlled expansion state, roving focus, heading semantics, multiple expanded values, or a rule that at least one section stays open. Use `cv-disclosure` or native `<details>/<summary>` for independent one-off reveals.

```html
<div class="accordion-demo-shell" data-demo="accordion" data-live-demo-height="760">
  <section class="accordion-demo-hero" aria-labelledby="accordion-demo-title">
    <div class="accordion-demo-copy">
      <span class="accordion-demo-kicker">Composite disclosure</span>
      <h3 id="accordion-demo-title">Grouped sections with roving focus and controlled expansion.</h3>
      <p>
        Use it when a surface needs one source of truth for expanded values, keyboard movement between
        headers, or an invariant such as one section always staying open.
      </p>
    </div>

    <dl class="accordion-demo-metrics">
      <div>
        <dt>Mode</dt>
        <dd>single or multiple</dd>
      </div>
      <div>
        <dt>Focus</dt>
        <dd>Arrow keys, Home, End</dd>
      </div>
      <div>
        <dt>Event payload</dt>
        <dd>{value, values, activeId}</dd>
      </div>
    </dl>
  </section>

  <section class="accordion-demo-board" aria-label="Accordion usage examples">
    <div class="accordion-demo-panel accordion-demo-panel--primary">
      <div class="accordion-demo-section-header">
        <span class="accordion-demo-label">Single controlled value</span>
        <h4>Credential record audit trail</h4>
      </div>

      <cv-accordion
        id="credential-accordion"
        class="accordion-demo-primary-accordion"
        value="identity"
        aria-label="Credential record sections"
      >
        <cv-accordion-item value="identity">
          <span slot="trigger">Identity and target</span>
          <div class="accordion-demo-content">
            <p>Visible record fields stay compact while the current section owns the review context.</p>
            <ul>
              <li>Login URL and account handle</li>
              <li>Last verified workspace</li>
              <li>Visible alias for shared records</li>
            </ul>
          </div>
        </cv-accordion-item>

        <cv-accordion-item value="rotation">
          <span slot="trigger">Rotation policy</span>
          <div class="accordion-demo-content">
            <p>The panel can host forms, status rows, or explanatory content without leaving the group.</p>
            <dl class="accordion-demo-proof-list">
              <div>
                <dt>Next check</dt>
                <dd>14 days</dd>
              </div>
              <div>
                <dt>Signal</dt>
                <dd>breach monitor clean</dd>
              </div>
            </dl>
          </div>
        </cv-accordion-item>

        <cv-accordion-item value="recovery" disabled>
          <span slot="trigger">Recovery material locked</span>
          <p>Disabled items stay in the order but cannot be toggled or selected.</p>
        </cv-accordion-item>
      </cv-accordion>
    </div>

    <aside class="accordion-demo-side" aria-label="Multiple and required-open examples">
      <div class="accordion-demo-panel">
        <div class="accordion-demo-section-header">
          <span class="accordion-demo-label">Multiple values</span>
          <h4>Security checks can stay open together.</h4>
        </div>

        <cv-accordion id="security-accordion" allow-multiple aria-label="Security checks">
          <cv-accordion-item value="password">
            <span slot="trigger">Password policy</span>
            <p>Length, rotation, and breach-monitoring requirements.</p>
          </cv-accordion-item>
          <cv-accordion-item value="devices">
            <span slot="trigger">Trusted devices</span>
            <p>Devices that can unlock this workspace.</p>
          </cv-accordion-item>
        </cv-accordion>
      </div>

      <div class="accordion-demo-panel accordion-demo-event-panel">
        <div class="accordion-demo-section-header">
          <span class="accordion-demo-label">Event contract</span>
          <h4>Read interaction state from events, not the DOM.</h4>
        </div>

        <output id="accordion-event-output" class="accordion-demo-event-output" aria-live="polite">
          value: identity | values: identity | activeId: identity
        </output>
      </div>

      <div class="accordion-demo-panel">
        <div class="accordion-demo-section-header">
          <span class="accordion-demo-label">Required open</span>
          <h4>At least one setup step remains expanded.</h4>
        </div>

        <cv-accordion id="required-accordion" value="intro" aria-label="Required setup">
          <cv-accordion-item value="intro">
            <span slot="trigger">Threat model note</span>
            <p>Read the visible-state assumptions before changing the setup.</p>
          </cv-accordion-item>
          <cv-accordion-item value="details">
            <span slot="trigger">Operational details</span>
            <p>Configuration rules and review notes stay available.</p>
          </cv-accordion-item>
        </cv-accordion>
      </div>
    </aside>
  </section>
</div>

<script type="module">
  const securityAccordion = document.querySelector('#security-accordion')
  const requiredAccordion = document.querySelector('#required-accordion')
  const credentialAccordion = document.querySelector('#credential-accordion')
  const eventOutput = document.querySelector('#accordion-event-output')

  securityAccordion.expandedValues = ['password', 'devices']
  requiredAccordion.allowZeroExpanded = false

  credentialAccordion.addEventListener('cv-input', (event) => {
    const {value, values, activeId} = event.detail
    eventOutput.value = `value: ${value ?? 'none'} | values: ${values.join(', ') || 'none'} | activeId: ${
      activeId ?? 'none'
    }`
  })
</script>
```

```html live-demo-source-only
<!-- Controlled single mode (default) -->
<cv-accordion value="identity" aria-label="Credential sections">
  <cv-accordion-item value="identity">
    <span slot="trigger">Identity</span>
    <p>Username, display name, and login URL.</p>
  </cv-accordion-item>
  <cv-accordion-item value="recovery">
    <span slot="trigger">Recovery</span>
    <p>Backup codes and recovery contact notes.</p>
  </cv-accordion-item>
</cv-accordion>

<!-- Multiple mode with a controlled expandedValues property -->
<cv-accordion id="security-accordion" allow-multiple aria-label="Security checks">
  <cv-accordion-item value="password">
    <span slot="trigger">Password policy</span>
    <p>Length, rotation, and breach-monitoring requirements.</p>
  </cv-accordion-item>
  <cv-accordion-item value="devices">
    <span slot="trigger">Trusted devices</span>
    <p>Devices that can unlock this workspace.</p>
  </cv-accordion-item>
</cv-accordion>

<script type="module">
  document.querySelector('#security-accordion').expandedValues = ['password', 'devices']
</script>

<!-- One section must stay open.
     In plain HTML, set allowZeroExpanded as a JS property because
     boolean attributes cannot represent false. -->
<cv-accordion id="required-accordion" value="intro" aria-label="Required setup">
  <cv-accordion-item value="intro">
    <span slot="trigger">Introduction</span>
    <p>Read this before changing the setup.</p>
  </cv-accordion-item>
  <cv-accordion-item value="details">
    <span slot="trigger">Details</span>
    <p>Configuration rules and operational notes.</p>
  </cv-accordion-item>
</cv-accordion>

<script type="module">
  document.querySelector('#required-accordion').allowZeroExpanded = false
</script>

<!-- Custom heading level -->
<cv-accordion heading-level="4">
  <cv-accordion-item value="s1">
    <span slot="trigger">Under an h3</span>
    <p>Content here.</p>
  </cv-accordion-item>
</cv-accordion>

<!-- Custom icons -->
<cv-accordion>
  <cv-accordion-item value="custom">
    <span slot="trigger">Custom icons</span>
    <span slot="expand-icon">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12h14"></path>
        <path d="M12 5v14"></path>
      </svg>
    </span>
    <span slot="collapse-icon">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12h14"></path>
      </svg>
    </span>
    <p>Content with plus/minus icons.</p>
  </cv-accordion-item>
</cv-accordion>

<!-- Disabled item -->
<cv-accordion>
  <cv-accordion-item value="enabled">
    <span slot="trigger">Enabled</span>
    <p>This section works.</p>
  </cv-accordion-item>
  <cv-accordion-item value="locked" disabled>
    <span slot="trigger">Locked</span>
    <p>This section cannot be toggled.</p>
  </cv-accordion-item>
</cv-accordion>
```

## Child Elements

### cv-accordion-item

#### Anatomy

```
<cv-accordion-item> (host)
└── <div part="base">
    ├── <h3 part="header" id="…">          ← heading level from parent
    │   └── <button part="trigger" aria-expanded="…" aria-controls="…">
    │       ├── <slot name="trigger">       ← header label
    │       └── <span part="indicator trigger-icon" aria-hidden="true">
    │           ├── <slot name="expand-icon">css chevron</slot>   ← shown when collapsed
    │           └── <slot name="collapse-icon">css chevron</slot>  ← shown when expanded
    └── <div part="panel" role="region" aria-labelledby="…" data-state="…">
        └── <div part="panel-content">
            └── <slot>                      ← panel content
```

#### Attributes

| Attribute  | Type    | Default | Description                                                                   |
| ---------- | ------- | ------- | ----------------------------------------------------------------------------- |
| `value`    | String  | `""`    | Unique identifier for this section. Auto-generated as `section-{n}` if empty. |
| `disabled` | Boolean | `false` | Prevents toggling this section                                                |
| `expanded` | Boolean | `false` | Whether panel content is visible (reflected, managed by parent)               |
| `active`   | Boolean | `false` | Whether this item's trigger has roving focus (reflected, managed by parent)   |

#### Slots

| Slot            | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `(default)`     | Panel content                                                      |
| `trigger`       | Header label text                                                  |
| `expand-icon`   | Icon shown when the panel is collapsed. Default: CSS-drawn chevron |
| `collapse-icon` | Icon shown when the panel is expanded. Default: CSS-drawn chevron  |

#### CSS Parts

| Part            | Element    | Description                                                                                |
| --------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `base`          | `<div>`    | Cohesive item surface                                                                      |
| `header`        | `<h3>`     | Heading element (level controlled by parent's `heading-level`)                             |
| `trigger`       | `<button>` | Interactive toggle button                                                                  |
| `indicator`     | `<span>`   | Wrapper around expand/collapse icon slots                                                  |
| `trigger-icon`  | `<span>`   | Compatibility alias on the same element as `indicator`                                     |
| `panel`         | `<div>`    | Expandable content region; `data-state` is `closed`, `opening`, `open`, or `closing`       |
| `panel-content` | `<div>`    | Inner panel content wrapper used to animate height without clipping the outer item surface |

#### CSS Custom Properties

| Property                                     | Default                             | Description                                  |
| -------------------------------------------- | ----------------------------------- | -------------------------------------------- |
| `--cv-accordion-item-trigger-min-height`     | `44px`                              | Minimum height of the trigger button         |
| `--cv-accordion-item-trigger-padding-inline` | `var(--cv-space-4, 16px)`           | Horizontal padding of trigger                |
| `--cv-accordion-item-trigger-border-radius`  | `var(--cv-radius-md, 10px)`         | Border radius of trigger                     |
| `--cv-accordion-item-trigger-gap`            | `var(--cv-space-3, 12px)`           | Gap between trigger label and icon           |
| `--cv-accordion-item-panel-padding`          | `var(--cv-space-4, 16px)`           | Padding inside the panel content wrapper     |
| `--cv-accordion-item-panel-border-radius`    | `var(--cv-radius-md, 10px)`         | Border radius of the item surface            |
| `--cv-accordion-item-gap`                    | `var(--cv-space-0, 0px)`            | Gap between trigger and panel                |
| `--cv-accordion-item-indicator-size`         | `22px`                              | Size of the indicator icon area              |
| `--cv-accordion-item-duration`               | `var(--cv-duration-medium, 250ms)`  | Transition duration for panel and state glow |
| `--cv-accordion-item-easing`                 | `var(--cv-easing-decelerate, ease)` | Easing function for panel and state motion   |

#### Visual States

| Host selector       | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `:host([expanded])` | Panel visible; collapse-icon shown, expand-icon hidden; active border signal |
| `:host([active])`   | Trigger has roving focus; item border and indicator receive primary signal   |
| `:host([disabled])` | Trigger opacity reduced (`0.55`), `cursor: not-allowed`, interaction blocked |

#### Panel Motion

`expanded` reflects the headless accordion state immediately. The item keeps the panel mounted only for the visual close transition:

- `data-state="open"`: panel is visible and interactive.
- `data-state="opening"`: panel is mounted for the next animation frame before transitioning to `open`.
- `data-state="closing"`: panel remains mounted, has `aria-hidden="true"` and `inert`, and transitions to the collapsed visual state.
- `data-state="closed"`: panel is `hidden`.

When `prefers-reduced-motion: reduce` matches, close transitions complete immediately.
