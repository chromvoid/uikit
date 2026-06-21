# cv-fieldset

Grouped form wrapper using native fieldset/legend semantics.

**Headless:** None (UIKit-only component)

## Usage

```html
<div class="fieldset-demo-shell usage-demo" data-demo="fieldset" data-live-demo-height="900" data-theme="dark">
  <section class="fieldset-demo-hero usage-demo__hero" aria-labelledby="fieldset-demo-title">
    <div class="fieldset-demo-copy usage-demo__copy">
      <span class="fieldset-demo-kicker usage-demo__kicker">Form grouping primitive</span>
      <h3 id="fieldset-demo-title">
        Fieldset keeps related controls behind one native legend, description, and error boundary.
      </h3>
      <p>
        Use it when a decision belongs to a group: recovery channels, sync routes, policy locks, or any
        validation rule that should be announced once for several controls.
      </p>
    </div>

    <dl class="fieldset-demo-metrics usage-demo__metrics" aria-label="Fieldset contract summary">
      <div>
        <dt>Semantics</dt>
        <dd>fieldset + legend</dd>
      </div>
      <div>
        <dt>Slots</dt>
        <dd>legend / description / error</dd>
      </div>
      <div>
        <dt>States</dt>
        <dd>invalid / disabled / horizontal</dd>
      </div>
    </dl>
  </section>

  <section class="fieldset-demo-board" aria-labelledby="fieldset-demo-form-title">
    <div class="fieldset-demo-section-header usage-demo__section-header">
      <span class="fieldset-demo-kicker usage-demo__kicker">Vault setup form</span>
      <h4 id="fieldset-demo-form-title">
        Group controls by the decision they support, not by visual convenience.
      </h4>
    </div>

    <form class="fieldset-demo-form" aria-label="Visible vault setup">
      <cv-fieldset class="fieldset-demo-primary">
        <span slot="legend">Visible profile boundary</span>
        <span slot="description">
          These fields describe the profile a user can safely present under pressure.
        </span>

        <div class="fieldset-demo-two-up">
          <cv-field>
            <span slot="label">Profile name</span>
            <cv-input name="profile" value="travel-profile"></cv-input>
          </cv-field>

          <cv-field>
            <span slot="label">Route owner</span>
            <cv-input name="owner" value="alex"></cv-input>
          </cv-field>
        </div>

        <cv-field>
          <span slot="label">Disclosure policy</span>
          <cv-select name="policy" value="visible" placeholder="Choose policy">
            <cv-select-option value="visible">Visible profile only</cv-select-option>
            <cv-select-option value="sealed">Require local unlock</cv-select-option>
            <cv-select-option value="blocked">Block remote writes</cv-select-option>
          </cv-select>
        </cv-field>
      </cv-fieldset>

      <cv-fieldset class="fieldset-demo-recovery" orientation="horizontal">
        <span slot="legend">Allowed recovery channels</span>
        <span slot="description">
          Horizontal layout is for compact option groups that still need one shared explanation.
        </span>
        <cv-checkbox checked name="recovery" value="code">Local recovery code</cv-checkbox>
        <cv-checkbox name="recovery" value="trusted-device">Trusted device prompt</cv-checkbox>
        <cv-checkbox name="recovery" value="operator-contact">Operator contact</cv-checkbox>
      </cv-fieldset>
    </form>

    <aside class="fieldset-demo-proof" aria-label="Fieldset behavior boundaries">
      <span class="fieldset-demo-label">Contract boundary</span>
      <ol>
        <li>
          <strong>Legend labels the group.</strong>
          <span>Assistive technology announces the decision before individual controls.</span>
        </li>
        <li>
          <strong>Description and error share one boundary.</strong>
          <span>The group receives the explanatory and invalid state, not every child label.</span>
        </li>
        <li>
          <strong>Values stay in children.</strong>
          <span>Fieldset owns anatomy and state hints; form controls own input values.</span>
        </li>
      </ol>
    </aside>
  </section>

  <section class="fieldset-demo-section usage-demo__section" aria-labelledby="fieldset-demo-states-title">
    <div class="fieldset-demo-section-header usage-demo__section-header">
      <span class="fieldset-demo-kicker usage-demo__kicker">State matrix</span>
      <h4 id="fieldset-demo-states-title">
        Keep group-level validation, compact choice rows, and disabled policy boundaries explicit.
      </h4>
    </div>

    <div class="fieldset-demo-state-grid" aria-label="Fieldset state examples">
      <article class="fieldset-demo-state-card">
        <span class="fieldset-demo-label">Invalid group</span>
        <cv-fieldset invalid>
          <span slot="legend">Recovery method</span>
          <span slot="description">At least one channel must be available before export.</span>
          <cv-checkbox name="recovery-method" value="email">Email recovery link</cv-checkbox>
          <cv-checkbox name="recovery-method" value="code">Backup code</cv-checkbox>
          <span slot="error">Select at least one recovery method.</span>
        </cv-fieldset>
      </article>

      <article class="fieldset-demo-state-card">
        <span class="fieldset-demo-label">Horizontal choice row</span>
        <cv-fieldset orientation="horizontal" size="small">
          <span slot="legend">Sync networks</span>
          <span slot="description">Use wrapping rows for short labels only.</span>
          <cv-checkbox checked name="network" value="wifi">Wi-Fi</cv-checkbox>
          <cv-checkbox name="network" value="cellular">Cellular</cv-checkbox>
          <cv-checkbox name="network" value="roaming">Roaming</cv-checkbox>
        </cv-fieldset>
      </article>

      <article class="fieldset-demo-state-card">
        <span class="fieldset-demo-label">Disabled policy</span>
        <cv-fieldset disabled>
          <span slot="legend">Organization policy</span>
          <span slot="description">Disabled state is applied through the native fieldset boundary.</span>
          <cv-field>
            <span slot="label">Policy level</span>
            <cv-input name="policy-level" value="strict"></cv-input>
          </cv-field>
          <cv-switch checked name="passcode">Require passcode on launch</cv-switch>
        </cv-fieldset>
      </article>
    </div>
  </section>
</div>
```

## Anatomy

```text
<cv-fieldset>
└── <fieldset part="base">
    ├── <legend part="legend"><slot name="legend"></slot></legend>
    ├── <div part="description"><slot name="description"></slot></div>
    ├── <div part="fields"><slot></slot></div>
    └── <div part="error"><slot name="error"></slot></div>
```

## Attributes

| Attribute     | Type                           | Default      | Description                      |
| ------------- | ------------------------------ | ------------ | -------------------------------- |
| `disabled`    | Boolean                        | `false`      | Disables grouped native controls |
| `invalid`     | Boolean                        | `false`      | Marks the group invalid          |
| `orientation` | `vertical` \| `horizontal`     | `"vertical"` | Layout orientation               |
| `size`        | `small` \| `medium` \| `large` | `"medium"`   | Density hint                     |

## Boundary

`cv-fieldset` does not own field values or validation logic.
