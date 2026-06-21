# cv-code-input

Segmented short-code entry for PIN, OTP, pairing, and recovery codes.

**Headless:** [`createCodeInput`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/code-input.md)

## Usage

```html
<div class="code-input-demo-shell usage-demo" data-demo="code-input" data-live-demo-height="780">
  <section class="code-input-demo-hero usage-demo__hero" aria-labelledby="code-input-demo-title">
    <div class="code-input-demo-copy usage-demo__copy">
      <span class="code-input-demo-kicker usage-demo__kicker">Segmented secret entry</span>
      <h3 id="code-input-demo-title">Collect short codes without losing form semantics or paste behavior.</h3>
      <p>
        <code>cv-code-input</code> wraps the headless model for OTP, PIN, pairing, and recovery flows. The
        visible slots stay segmented while the form value remains a single normalized code.
      </p>
    </div>

    <dl class="code-input-demo-metrics usage-demo__metrics" aria-label="Code input contract highlights">
      <div>
        <dt>Paste</dt>
        <dd>distributed from the focused segment</dd>
      </div>
      <div>
        <dt>Keyboard</dt>
        <dd>arrows, Home, End, Backspace</dd>
      </div>
      <div>
        <dt>Form</dt>
        <dd>hidden associated value</dd>
      </div>
    </dl>
  </section>

  <form
    class="code-input-demo-workbench usage-demo__workbench"
    aria-label="Pairing code verification"
    data-code-form
  >
    <section class="code-input-demo-panel usage-demo__panel" aria-labelledby="code-input-panel-title">
      <div class="code-input-demo-panel-head usage-demo__panel-head">
        <div>
          <span>Vault pairing challenge</span>
          <h4 id="code-input-panel-title">Device token from trusted display</h4>
        </div>
        <cv-badge variant="primary" pill data-code-state>waiting</cv-badge>
      </div>

      <cv-field required>
        <span slot="label" data-code-label>Pairing token</span>
        <cv-code-input
          data-code-main
          purpose="pairing"
          charset="alphanumeric"
          length="6"
          value="CV7A"
          name="pairingCode"
          required
          autocomplete="off"
        ></cv-code-input>
        <span slot="description"
          >Type or paste a full token. Completion is reported through <code>cv-complete</code>.</span
        >
      </cv-field>

      <div class="code-input-demo-actions usage-demo__actions" aria-label="Code input demo actions">
        <cv-button size="small" data-code-action="pairing">Fill pairing token</cv-button>
        <cv-button size="small" outline data-code-action="otp">Use OTP sample</cv-button>
        <cv-button size="small" variant="ghost" data-code-action="clear">Clear</cv-button>
      </div>

      <p class="code-input-demo-log usage-demo__log" role="status" aria-live="polite" data-code-output>
        Waiting for input. Focus any segment, paste a code, or use a sample action.
      </p>
    </section>

    <aside class="code-input-demo-side usage-demo__side" aria-label="Code input usage states">
      <div class="code-input-demo-contract">
        <span>Model boundary</span>
        <strong>state.value() stays normalized</strong>
        <p>
          UIKit renders the segments. The headless model owns charset filtering, focus index, and no-op gates.
        </p>
      </div>

      <div class="code-input-demo-state-list">
        <cv-field>
          <span slot="label">Masked PIN</span>
          <cv-code-input purpose="pin" length="4" mask value="2048" size="small"></cv-code-input>
        </cv-field>

        <cv-field invalid>
          <span slot="label">Recovery mismatch</span>
          <cv-code-input
            purpose="recovery"
            charset="alphanumeric"
            length="6"
            value="A7K2M9"
            invalid
          ></cv-code-input>
          <span slot="error">The recovery code no longer matches this vault.</span>
        </cv-field>

        <cv-field disabled>
          <span slot="label">Disabled OTP</span>
          <cv-code-input purpose="otp" length="6" value="654321"></cv-code-input>
        </cv-field>

        <cv-field>
          <span slot="label">Readonly audit code</span>
          <cv-code-input
            purpose="pairing"
            charset="alphanumeric"
            length="6"
            value="RD3K9X"
            readonly
          ></cv-code-input>
        </cv-field>
      </div>
    </aside>
  </form>
</div>

<script type="module">
  document
    .querySelectorAll('.code-input-demo-shell[data-demo="code-input"]:not([data-ready])')
    .forEach((shell) => {
      shell.dataset.ready = 'true'

      const main = shell.querySelector('[data-code-main]')
      const output = shell.querySelector('[data-code-output]')
      const state = shell.querySelector('[data-code-state]')
      const label = shell.querySelector('[data-code-label]')

      const scenarios = {
        pairing: {
          label: 'Pairing token',
          purpose: 'pairing',
          charset: 'alphanumeric',
          length: 6,
          value: 'CV7A9K',
          message: 'Pairing token filled from the trusted display sample.',
        },
        otp: {
          label: 'One-time code',
          purpose: 'otp',
          charset: 'numeric',
          length: 6,
          value: '493120',
          message: 'Numeric OTP sample filled. Native autocomplete remains on the first segment.',
        },
      }

      const setOutput = (message, tone = 'waiting') => {
        shell.dataset.codeState = tone
        if (output) output.textContent = message
        if (state) state.textContent = tone
      }

      const syncScenario = (scenario) => {
        if (!main) return
        main.purpose = scenario.purpose
        main.charset = scenario.charset
        main.length = scenario.length
        main.mask = false
        main.invalid = false
        main.value = scenario.value
        if (label) label.textContent = scenario.label
        void main.updateComplete?.then(() => setOutput(scenario.message, 'complete'))
      }

      shell.querySelectorAll('[data-code-action]').forEach((button) => {
        button.addEventListener('click', () => {
          const action = button.dataset.codeAction
          if (action === 'clear' && main) {
            main.value = ''
            main.invalid = false
            setOutput('Value cleared. The associated form value is empty again.', 'waiting')
            return
          }

          if (action === 'otp') {
            syncScenario(scenarios.otp)
            return
          }

          syncScenario(scenarios.pairing)
        })
      })

      shell.addEventListener('cv-input', (event) => {
        if (event.target !== main) return
        const {value, complete} = event.detail
        setOutput(
          `cv-input: value="${value || 'empty'}", complete=${String(complete)}.`,
          complete ? 'complete' : 'typing',
        )
      })

      shell.addEventListener('cv-change', (event) => {
        if (event.target !== main) return
        const {value, complete} = event.detail
        setOutput(
          `cv-change: committed value="${value || 'empty'}", complete=${String(complete)}.`,
          complete ? 'complete' : 'typing',
        )
      })

      shell.addEventListener('cv-complete', (event) => {
        if (event.target !== main) return
        setOutput(`cv-complete: "${event.detail.value}" is ready to verify.`, 'complete')
      })
    })
</script>
```

### Markup Patterns

```html source-only
<!-- Numeric one-time code with native mobile autocomplete on the first segment -->
<cv-code-input purpose="otp" length="6" required autocomplete="one-time-code"></cv-code-input>

<!-- Masked local PIN -->
<cv-code-input purpose="pin" length="4" mask name="pin"></cv-code-input>

<!-- Alphanumeric device pairing token -->
<cv-code-input purpose="pairing" charset="alphanumeric" length="6" name="pairingCode"></cv-code-input>

<!-- Recovery code with an external validation error -->
<cv-code-input purpose="recovery" charset="alphanumeric" length="6" value="A7K2M9" invalid></cv-code-input>
```

## Attributes

| Attribute      | Type                                | Default       | Description                    |
| -------------- | ----------------------------------- | ------------- | ------------------------------ |
| `length`       | Number                              | `6`           | Segment count                  |
| `value`        | String                              | `""`          | Normalized code value          |
| `purpose`      | `pin \| otp \| pairing \| recovery` | `otp`         | Semantic input purpose         |
| `charset`      | `numeric \| alphanumeric`           | `numeric`     | Accepted character set         |
| `mask`         | Boolean                             | `false`       | Masks visible segment values   |
| `disabled`     | Boolean                             | `false`       | Blocks interaction             |
| `readonly`     | Boolean                             | `false`       | Blocks editing but keeps focus |
| `required`     | Boolean                             | `false`       | Form validation required flag  |
| `invalid`      | Boolean                             | `false`       | Marks segments as invalid      |
| `autocomplete` | String                              | purpose-based | Native autocomplete hint       |
| `name`         | String                              | `""`          | Form name                      |
| `size`         | `small \| medium \| large`          | `medium`      | Segment size                   |

## Events

| Event         | Detail                |
| ------------- | --------------------- |
| `cv-input`    | `{ value, complete }` |
| `cv-change`   | `{ value, complete }` |
| `cv-complete` | `{ value, complete }` |
