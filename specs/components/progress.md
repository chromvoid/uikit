# cv-progress

A read-only indicator that communicates determinate or indeterminate loading/completion progress.

**Headless:** [`createProgress`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/progress.md)

## Anatomy

```
<cv-progress class="usage-demo__progress-host"> (host)
└── <div part="base" role="progressbar">
    └── <div part="indicator">
        └── <span part="label">
            └── <slot>
```

## Attributes

| Attribute       | Type    | Default | Description                                                                         |
| --------------- | ------- | ------- | ----------------------------------------------------------------------------------- |
| `value`         | Number  | `0`     | Current progress value; clamped to `[min, max]`                                     |
| `min`           | Number  | `0`     | Minimum boundary                                                                    |
| `max`           | Number  | `100`   | Maximum boundary                                                                    |
| `indeterminate` | Boolean | `false` | Switches to indeterminate (animated) mode                                           |
| `tone`          | String  | —       | Semantic tone: `upload` \| `queued` \| `success` \| `danger` \| `warning`           |
| `value-text`    | String  | —       | Static override for `aria-valuetext`; takes precedence over the percentage fallback |
| `aria-label`    | String  | —       | Accessible label passed through to headless                                         |

## Slots

| Slot        | Description                                                        |
| ----------- | ------------------------------------------------------------------ |
| `(default)` | Label content rendered inside the indicator (e.g. percentage text) |

## CSS Parts

| Part        | Element  | Description                                              |
| ----------- | -------- | -------------------------------------------------------- |
| `base`      | `<div>`  | Outer track container with `role="progressbar"`          |
| `indicator` | `<div>`  | Filled portion representing current progress             |
| `label`     | `<span>` | Content overlay inside indicator; wraps the default slot |

## Tones

| Tone      | Description                      |
| --------- | -------------------------------- |
| `upload`  | Primary upload/transfer progress |
| `queued`  | Muted queued progress            |
| `success` | Success/completed progress       |
| `danger`  | Failed/error progress            |
| `warning` | Paused/warning progress          |

## CSS Custom Properties

| Property                        | Default                            | Description                                                                            |
| ------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `--cv-progress-height`          | `10px`                             | Block size (height) of the track                                                       |
| `--cv-progress-labeled-height`  | `18px`                             | Default track height when label content is present and `--cv-progress-height` is unset |
| `--cv-progress-track-color`     | `var(--cv-color-surface, #141923)` | Background color of the track                                                          |
| `--cv-progress-indicator-color` | `var(--cv-color-primary, #65d7ff)` | Base color of the filled indicator                                                     |
| `--cv-progress-label-color`     | `var(--cv-color-text, #e8ecf6)`    | Text color for the label slot content                                                  |
| `--cv-progress-label-font-size` | Calculated from track height       | Font size for the label slot content                                                   |

- The visual label is hidden when the effective track height is below `14px`; progress value remains exposed through ARIA.

## Visual States

| Host selector            | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `:host([indeterminate])` | Animated sliding bar; indicator width fixed, translateX animation  |
| `:host([data-complete])` | Success appearance when `value >= max` (uses `--cv-color-success`) |

## Reactive State Mapping

`cv-progress` is a visual adapter over headless `createProgress`.

| UIKit Property  | Direction     | Headless Binding                                   |
| --------------- | ------------- | -------------------------------------------------- |
| `value`         | attr → action | `actions.setValue(value)`                          |
| `min`           | attr → option | Passed as `min` in `createProgress(options)`       |
| `max`           | attr → option | Passed as `max` in `createProgress(options)`       |
| `indeterminate` | attr → action | `actions.setIndeterminate(value)`                  |
| `value-text`    | attr → option | Passed as `valueText` in `createProgress(options)` |
| `aria-label`    | attr → option | Passed as `ariaLabel` in `createProgress(options)` |

| Headless State            | Direction     | DOM Reflection                                          |
| ------------------------- | ------------- | ------------------------------------------------------- |
| `state.percentage()`      | state → style | Sets `--cv-progress-width` on indicator for inline-size |
| `state.isIndeterminate()` | state → attr  | `[indeterminate]` host attribute                        |
| `state.isComplete()`      | state → attr  | `[data-complete]` host attribute                        |

- `contracts.getProgressProps()` is spread onto the inner `[part="base"]` element to apply `role`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`, `aria-label`, and `id`.
- ARIA value attributes are present only in determinate mode; headless omits them in indeterminate mode.
- `aria-valuetext` resolution order (determinate only): `valueText` static override > rounded percentage fallback.
- UIKit does not own clamping or completion logic; headless state is the source of truth.

## Events

None. `cv-progress` is a read-only indicator with no user-modifiable state.

## Usage

```html
<div class="progress-demo-shell usage-demo" data-demo="progress" data-live-demo-height="640">
  <section class="progress-demo-hero usage-demo__hero" aria-labelledby="progress-demo-title">
    <div class="progress-demo-copy usage-demo__copy">
      <span class="progress-demo-kicker usage-demo__kicker">Linear operation state</span>
      <h3 id="progress-demo-title">Track a running job without turning it into an interaction.</h3>
      <p>
        Use <code>cv-progress</code> for read-only work: encrypted exports, verification passes, sync queues,
        and loading states. The component owns ARIA progress semantics while the workflow owns the value and
        tone.
      </p>
    </div>

    <dl class="progress-demo-metrics usage-demo__metrics" aria-label="Progress contract summary">
      <div>
        <dt>Semantics</dt>
        <dd>role="progressbar"</dd>
      </div>
      <div>
        <dt>Value</dt>
        <dd>min / max / value</dd>
      </div>
      <div>
        <dt>Fallback</dt>
        <dd>indeterminate</dd>
      </div>
    </dl>
  </section>

  <section
    class="progress-demo-workbench usage-demo__workbench"
    aria-labelledby="progress-demo-workbench-title"
  >
    <div class="progress-demo-panel usage-demo__panel">
      <header class="progress-demo-panel-head usage-demo__panel-head">
        <div class="usage-demo__flow usage-demo__flow--tight">
          <span class="progress-demo-kicker usage-demo__kicker">Encrypted export</span>
          <h4 id="progress-demo-workbench-title">media-archive.cvault</h4>
        </div>
        <cv-badge variant="primary" pulse>Running</cv-badge>
      </header>

      <div class="progress-demo-primary-progress usage-demo__flow usage-demo__flow--loose">
        <div class="progress-demo-progress-label usage-demo__baseline-row">
          <span class="usage-demo__meta usage-demo__label">Transfer window</span>
          <strong>1.8 GB / 2.4 GB</strong>
        </div>
        <cv-progress
          class="progress-demo-main-progress usage-demo__progress-host"
          tone="upload"
          value="74"
          value-text="74%"
          aria-label="Encrypted export transfer progress"
        >
          74%
        </cv-progress>
      </div>

      <div class="progress-demo-proof-grid usage-demo__grid--thirds" aria-label="Current transfer details">
        <div class="usage-demo__flow usage-demo__flow--tight">
          <span class="usage-demo__meta usage-demo__label">Range</span>
          <strong>0-100</strong>
        </div>
        <div class="usage-demo__flow usage-demo__flow--tight">
          <span class="usage-demo__meta usage-demo__label">Text</span>
          <strong>value-text="74%"</strong>
        </div>
        <div class="usage-demo__flow usage-demo__flow--tight">
          <span class="usage-demo__meta usage-demo__label">Tone</span>
          <strong>upload</strong>
        </div>
      </div>
    </div>

    <aside class="progress-demo-queue usage-demo__flow" aria-label="Export queue stages">
      <div class="progress-demo-step progress-demo-step--complete usage-demo__flow usage-demo__flow--loose">
        <div class="usage-demo__flow usage-demo__flow--tight">
          <span class="usage-demo__meta usage-demo__label">Step 1</span>
          <strong>Encrypt chunks</strong>
        </div>
        <cv-progress
          class="usage-demo__progress-host"
          tone="success"
          value="100"
          aria-label="Encrypt chunks complete"
        ></cv-progress>
      </div>

      <div class="progress-demo-step progress-demo-step--active usage-demo__flow usage-demo__flow--loose">
        <div class="usage-demo__flow usage-demo__flow--tight">
          <span class="usage-demo__meta usage-demo__label">Step 2</span>
          <strong>Upload sealed archive</strong>
        </div>
        <cv-progress
          class="usage-demo__progress-host"
          tone="upload"
          value="74"
          aria-label="Upload sealed archive progress"
        ></cv-progress>
      </div>

      <div class="progress-demo-step usage-demo__flow usage-demo__flow--loose">
        <div class="usage-demo__flow usage-demo__flow--tight">
          <span class="usage-demo__meta usage-demo__label">Step 3</span>
          <strong>Verify remote manifest</strong>
        </div>
        <cv-progress
          class="usage-demo__progress-host"
          tone="queued"
          value="16"
          aria-label="Verify remote manifest queued"
        ></cv-progress>
      </div>
    </aside>
  </section>

  <section class="progress-demo-tones usage-demo__section" aria-labelledby="progress-demo-tones-title">
    <div class="progress-demo-section-header usage-demo__section-header">
      <span class="progress-demo-kicker usage-demo__kicker">State palette</span>
      <h4 id="progress-demo-tones-title">Choose tone by operation state, not decoration.</h4>
    </div>

    <div class="progress-demo-tone-grid">
      <div class="progress-demo-tone usage-demo__flow usage-demo__flow--loose">
        <span class="usage-demo__meta usage-demo__label">Default</span>
        <cv-progress
          class="usage-demo__progress-host"
          value="42"
          aria-label="Default determinate progress"
        ></cv-progress>
      </div>
      <div class="progress-demo-tone usage-demo__flow usage-demo__flow--loose">
        <span class="usage-demo__meta usage-demo__label">Queued</span>
        <cv-progress
          class="usage-demo__progress-host"
          tone="queued"
          value="28"
          aria-label="Queued progress"
        ></cv-progress>
      </div>
      <div class="progress-demo-tone usage-demo__flow usage-demo__flow--loose">
        <span class="usage-demo__meta usage-demo__label">Success</span>
        <cv-progress
          class="usage-demo__progress-host"
          tone="success"
          value="100"
          aria-label="Completed progress"
        ></cv-progress>
      </div>
      <div class="progress-demo-tone usage-demo__flow usage-demo__flow--loose">
        <span class="usage-demo__meta usage-demo__label">Warning</span>
        <cv-progress
          class="usage-demo__progress-host"
          tone="warning"
          value="58"
          aria-label="Paused progress"
        ></cv-progress>
      </div>
      <div class="progress-demo-tone usage-demo__flow usage-demo__flow--loose">
        <span class="usage-demo__meta usage-demo__label">Danger</span>
        <cv-progress
          class="usage-demo__progress-host"
          tone="danger"
          value="34"
          aria-label="Failed progress"
        ></cv-progress>
      </div>
      <div class="progress-demo-tone usage-demo__flow usage-demo__flow--loose">
        <span class="usage-demo__meta usage-demo__label">Indeterminate</span>
        <cv-progress
          class="usage-demo__progress-host"
          indeterminate
          aria-label="Waiting for remote manifest"
        ></cv-progress>
      </div>
    </div>
  </section>
</div>
```
