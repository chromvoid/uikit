# cv-alert

Passive live-region message that announces important updates without taking focus.

**Headless:** [`createAlert`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/alert.md)

## Anatomy

```
<cv-alert> (host)
└── <div part="base" role="alert">
    ├── <div part="message">  ← current message text
    └── <slot>                  ← optional additional static content
```

## Attributes

| Attribute     | Type            | Default       | Description                                                |
| ------------- | --------------- | ------------- | ---------------------------------------------------------- |
| `duration-ms` | Number          | `0`           | Auto-hide timeout in milliseconds (`0` disables auto-hide) |
| `aria-live`   | String          | `"assertive"` | Live-region priority: `assertive` \| `polite`              |
| `aria-atomic` | Boolean         | `true`        | Announces the whole region when content changes            |
| `visible`     | Boolean (state) | `false`       | Reflected visibility state managed by component state      |

## Slots

| Slot        | Description                                            |
| ----------- | ------------------------------------------------------ |
| `(default)` | Optional static, non-interactive supplementary content |

## CSS Parts

| Part      | Element | Description                                           |
| --------- | ------- | ----------------------------------------------------- |
| `base`    | `<div>` | Live-region wrapper carrying role and ARIA attributes |
| `message` | `<div>` | Current message text                                  |

## CSS Custom Properties

| Property                         | Default                                     | Description                             |
| -------------------------------- | ------------------------------------------- | --------------------------------------- |
| `--cv-alert-gap`                 | `var(--cv-space-2, 8px)`                    | Gap between message and slotted content |
| `--cv-alert-padding-inline`      | `var(--cv-space-3, 12px)`                   | Horizontal padding for alert container  |
| `--cv-alert-padding-block`       | `var(--cv-space-2, 8px)`                    | Vertical padding for alert container    |
| `--cv-alert-radius`              | `var(--cv-radius-sm, 6px)`                  | Border radius                           |
| `--cv-alert-border-color`        | `var(--cv-color-border, #2a3245)`           | Border color                            |
| `--cv-alert-background`          | `var(--cv-color-surface-elevated, #1d2432)` | Background color                        |
| `--cv-alert-color`               | `var(--cv-color-text, #e8ecf6)`             | Text color                              |
| `--cv-alert-transition-duration` | `var(--cv-duration-fast, 120ms)`            | Transition duration for show/hide       |
| `--cv-alert-transition-easing`   | `var(--cv-easing-standard, ease)`           | Transition timing function              |
| `--cv-alert-hidden-translate-y`  | `-2px`                                      | Vertical offset when hidden             |

## Visual States

| Host selector            | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `:host([visible])`       | Visible state; base is fully opaque and interactive     |
| `:host(:not([visible]))` | Hidden state; base fades and translates slightly upward |

## Events

| Event       | Detail                                | Description                    |
| ----------- | ------------------------------------- | ------------------------------ |
| `cv-input`  | `{visible: boolean, message: string}` | Fires when alert state updates |
| `cv-change` | `{visible: boolean, message: string}` | Fires when visibility toggles  |

## Accessibility

- Root element always uses `role="alert"`.
- `aria-live` and `aria-atomic` are sourced from headless `getAlertProps()`.
- Component is passive and does not move focus or manage keyboard interaction.
- For interactive/decision-required flows, use `cv-alert-dialog`.

## Usage

```html
<div class="alert-demo-shell usage-demo" data-demo="alert" data-live-demo-height="420">
  <section class="alert-demo-hero usage-demo__hero" aria-labelledby="alert-demo-title">
    <div class="alert-demo-copy usage-demo__copy">
      <span class="alert-demo-kicker usage-demo__kicker">Passive live region</span>
      <h3 id="alert-demo-title">Announce operation status without moving focus.</h3>
      <p>
        Use <code>cv-alert</code> for time-sensitive state changes. The component owns the live-region
        contract, while the caller decides message priority and auto-dismiss timing.
      </p>
    </div>

    <dl class="alert-demo-metrics usage-demo__metrics" aria-label="Alert contract summary">
      <div>
        <dt>Root role</dt>
        <dd>alert</dd>
      </div>
      <div>
        <dt>Priority</dt>
        <dd>assertive / polite</dd>
      </div>
      <div>
        <dt>Focus</dt>
        <dd>never moved</dd>
      </div>
    </dl>
  </section>

  <section class="alert-demo-workbench usage-demo__workbench" aria-labelledby="alert-demo-workbench-title">
    <div class="alert-demo-panel usage-demo__panel">
      <div class="alert-demo-section-header usage-demo__section-header">
        <span class="alert-demo-kicker usage-demo__kicker">Vault sync panel</span>
        <h4 id="alert-demo-workbench-title">
          Trigger status changes from a workflow and watch the same live region update.
        </h4>
      </div>

      <div class="alert-demo-actions usage-demo__actions" aria-label="Alert scenarios">
        <cv-button data-alert-action="saved" variant="primary">Save policy</cv-button>
        <cv-button data-alert-action="warning">Warn operator</cv-button>
        <cv-button data-alert-action="critical" variant="danger">Block export</cv-button>
        <cv-button data-alert-action="hide">Hide alert</cv-button>
      </div>

      <cv-alert data-alert-region aria-live="polite" duration-ms="5200">
        <span class="alert-demo-alert-meta" data-alert-meta>polite / auto-dismiss</span>
      </cv-alert>
    </div>

    <aside class="alert-demo-side usage-demo__side" aria-label="Alert state and event output">
      <dl class="alert-demo-state" aria-label="Current alert state">
        <div>
          <dt>Visible</dt>
          <dd data-alert-visible>false</dd>
        </div>
        <div>
          <dt>aria-live</dt>
          <dd data-alert-priority>polite</dd>
        </div>
        <div>
          <dt>duration-ms</dt>
          <dd data-alert-duration>5200</dd>
        </div>
        <div>
          <dt>Last event</dt>
          <dd data-alert-event>idle</dd>
        </div>
      </dl>

      <p class="alert-demo-log usage-demo__log" role="status" aria-live="polite" data-alert-log>
        Waiting for an alert update. Trigger a scenario from the workflow panel.
      </p>
    </aside>
  </section>
</div>

<script type="module">
  const scenarios = {
    saved: {
      state: 'success',
      ariaLive: 'polite',
      durationMs: 5200,
      meta: 'polite / auto-dismiss',
      message: 'Vault policy saved. Visible profile settings were updated.',
    },
    warning: {
      state: 'warning',
      ariaLive: 'polite',
      durationMs: 0,
      meta: 'polite / persistent',
      message: 'Recovery window closes in 18 minutes. Confirm operator handoff before leaving.',
    },
    critical: {
      state: 'critical',
      ariaLive: 'assertive',
      durationMs: 0,
      meta: 'assertive / persistent',
      message: 'Export blocked. Coercion profile is active and hidden namespaces stay unavailable.',
    },
  }

  document.querySelectorAll('.alert-demo-shell[data-demo="alert"]:not([data-ready])').forEach((shell) => {
    shell.dataset.ready = 'true'

    const alert = shell.querySelector('[data-alert-region]')
    const meta = shell.querySelector('[data-alert-meta]')
    const visible = shell.querySelector('[data-alert-visible]')
    const priority = shell.querySelector('[data-alert-priority]')
    const duration = shell.querySelector('[data-alert-duration]')
    const lastEvent = shell.querySelector('[data-alert-event]')
    const log = shell.querySelector('[data-alert-log]')

    const setText = (target, value) => {
      if (target) target.textContent = value
    }

    const updateState = (detail, eventName) => {
      const nextVisible = Boolean(detail?.visible)
      const message = String(detail?.message ?? '')

      if (!nextVisible) {
        delete shell.dataset.alertState
      }

      setText(visible, nextVisible ? 'true' : 'false')
      setText(priority, alert?.ariaLive ?? 'polite')
      setText(duration, String(alert?.durationMs ?? 0))
      setText(lastEvent, eventName)

      if (log) {
        log.textContent = nextVisible
          ? `${eventName}: ${message}`
          : `${eventName}: alert hidden, live region is idle.`
      }
    }

    const showScenario = async (name) => {
      const scenario = scenarios[name]
      if (!alert || !scenario) return

      shell.dataset.alertState = scenario.state
      alert.ariaLive = scenario.ariaLive
      alert.durationMs = scenario.durationMs
      setText(meta, scenario.meta)
      setText(priority, scenario.ariaLive)
      setText(duration, String(scenario.durationMs))

      await alert.updateComplete
      alert.show(scenario.message)
    }

    shell.querySelector('[data-alert-action="saved"]')?.addEventListener('click', () => {
      void showScenario('saved')
    })

    shell.querySelector('[data-alert-action="warning"]')?.addEventListener('click', () => {
      void showScenario('warning')
    })

    shell.querySelector('[data-alert-action="critical"]')?.addEventListener('click', () => {
      void showScenario('critical')
    })

    shell.querySelector('[data-alert-action="hide"]')?.addEventListener('click', () => {
      alert?.hide()
    })

    alert?.addEventListener('cv-input', (event) => {
      updateState(event.detail, 'cv-input')
    })

    alert?.addEventListener('cv-change', (event) => {
      updateState(event.detail, 'cv-change')
    })

    window.setTimeout(() => {
      void showScenario('warning')
    }, 260)
  })
</script>
```
