# cv-spinner

Indeterminate loading spinner with SVG track and indicator animation.

**Headless:** [`createSpinner`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/spinner.md)

## Anatomy

```
<cv-spinner> (host)
└── <svg part="base" role="progressbar" aria-label="...">
    ├── <circle part="track">
    └── <circle part="indicator">
```

## Attributes

| Attribute | Type   | Default     | Description                                       |
| --------- | ------ | ----------- | ------------------------------------------------- |
| `label`   | String | `"Loading"` | Accessible name announced by assistive technology |

No `size` attribute is provided. Sizing is controlled entirely via CSS `font-size` on the host element; the SVG scales relative to `1em`.

## Slots

None. The spinner is purely visual with no slotted content.

## CSS Parts

| Part        | Element    | Description                                    |
| ----------- | ---------- | ---------------------------------------------- |
| `base`      | `<svg>`    | Root SVG element with ARIA attributes          |
| `track`     | `<circle>` | Background circle (static ring)                |
| `indicator` | `<circle>` | Animated arc indicating indeterminate progress |

## CSS Custom Properties

| Property                       | Default                            | Description                              |
| ------------------------------ | ---------------------------------- | ---------------------------------------- |
| `--cv-spinner-track-width`     | `4px`                              | Stroke width of both track and indicator |
| `--cv-spinner-track-color`     | `var(--cv-color-border, #2a3245)`  | Color of the background track ring       |
| `--cv-spinner-indicator-color` | `var(--cv-color-primary, #65d7ff)` | Color of the animated indicator arc      |
| `--cv-spinner-speed`           | `600ms`                            | Duration of one full rotation cycle      |

## Visual States

None. The spinner is always animating when rendered; there are no conditional visual states.

## Events

None. The spinner is purely presentational and does not emit events.

## Reactive State Mapping

`cv-spinner` is a visual adapter over headless `createSpinner`.

| UIKit Property | Direction      | Headless Binding          |
| -------------- | -------------- | ------------------------- |
| `label`        | attr -> action | `actions.setLabel(value)` |

| Headless State  | Direction         | DOM Reflection                   |
| --------------- | ----------------- | -------------------------------- |
| `state.label()` | state -> contract | Consumed via `getSpinnerProps()` |

- `contracts.getSpinnerProps()` is spread onto the inner `[part="base"]` SVG element to apply `role="progressbar"` and `aria-label`.
- UIKit does not own ARIA semantics; headless state is the source of truth.
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext` are never present (indeterminate mode only).

## Usage

```html
<div class="spinner-demo-shell usage-demo" data-demo="spinner" data-live-demo-height="760">
  <section class="spinner-demo-hero usage-demo__hero" aria-labelledby="spinner-demo-title">
    <div class="spinner-demo-copy usage-demo__copy">
      <span class="spinner-demo-kicker usage-demo__kicker">Indeterminate feedback</span>
      <h3 id="spinner-demo-title">Use spinner when work is active but progress cannot be measured.</h3>
      <p>
        Keep the spinner close to the control or region it represents. The visible surface stays small; the
        accessible label carries the actual loading task for assistive technology.
      </p>
    </div>

    <dl class="spinner-demo-metrics usage-demo__metrics" aria-label="Spinner contract summary">
      <div>
        <dt>ARIA</dt>
        <dd>progressbar with label</dd>
      </div>
      <div>
        <dt>Mode</dt>
        <dd>indeterminate only</dd>
      </div>
      <div>
        <dt>Sizing</dt>
        <dd>CSS font-size</dd>
      </div>
    </dl>
  </section>

  <section class="spinner-demo-board usage-demo__workbench" aria-labelledby="spinner-demo-board-title">
    <div class="spinner-demo-stage" role="status" aria-live="polite">
      <div class="spinner-demo-stage-head usage-demo__surface-header">
        <div>
          <span>Vault handoff</span>
          <strong id="spinner-demo-board-title">Checking relay route before export</strong>
        </div>
        <span class="spinner-demo-badge usage-demo__meta usage-demo__label">pending</span>
      </div>

      <div class="spinner-demo-core">
        <div class="spinner-demo-grid" aria-hidden="true"></div>
        <cv-spinner class="spinner-demo-core-spinner" label="Loading vault handoff status"></cv-spinner>
      </div>

      <div class="spinner-demo-step-list usage-demo__compact-list" aria-label="Loading checkpoints">
        <div>
          <span>01</span>
          <p>visible vault selected</p>
        </div>
        <div>
          <span>02</span>
          <p>relay policy resolving</p>
        </div>
        <div>
          <span>03</span>
          <p>proof channel waiting</p>
        </div>
      </div>
    </div>

    <aside class="spinner-demo-side usage-demo__side" aria-label="Spinner placement examples">
      <div class="spinner-demo-side-head usage-demo__side-head">
        <span class="spinner-demo-kicker usage-demo__kicker">Placement</span>
        <h4>Match scale to the surface that is blocked.</h4>
      </div>

      <div class="spinner-demo-inline-status">
        <cv-spinner class="spinner-demo-spinner-xs" label="Checking route"></cv-spinner>
        <span>Checking route</span>
      </div>

      <div class="spinner-demo-inline-status spinner-demo-inline-status--violet">
        <cv-spinner class="spinner-demo-spinner-sm" label="Preparing hidden layer"></cv-spinner>
        <span>Preparing hidden layer</span>
      </div>

      <div class="spinner-demo-inline-status spinner-demo-inline-status--amber">
        <cv-spinner class="spinner-demo-spinner-md" label="Waiting for device response"></cv-spinner>
        <span>Waiting for device</span>
      </div>
    </aside>
  </section>

  <section class="spinner-demo-section usage-demo__section" aria-labelledby="spinner-demo-scale-title">
    <div class="spinner-demo-section-header usage-demo__section-header">
      <span class="spinner-demo-kicker usage-demo__kicker">Scale and tone</span>
      <h4 id="spinner-demo-scale-title">Size from the owning layout and reserve color for status meaning.</h4>
    </div>

    <div class="spinner-demo-matrix" aria-label="Spinner scale and tone matrix">
      <div>
        <span>Toolbar</span>
        <cv-spinner class="spinner-demo-spinner-xs" label="Loading toolbar action"></cv-spinner>
      </div>
      <div>
        <span>Inline</span>
        <cv-spinner class="spinner-demo-spinner-sm" label="Loading inline status"></cv-spinner>
      </div>
      <div>
        <span>Panel</span>
        <cv-spinner class="spinner-demo-spinner-md" label="Loading panel"></cv-spinner>
      </div>
      <div>
        <span>Blocking region</span>
        <cv-spinner class="spinner-demo-spinner-lg" label="Loading blocking region"></cv-spinner>
      </div>
    </div>
  </section>
</div>
```
