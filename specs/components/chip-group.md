# cv-chip-group

Selection container for slotted `cv-chip` elements.

Use `cv-chip-group` when several chips represent one choice set or a multi-select facet list. The group owns
selection state, keeps child `selected` states in sync, and adds roving keyboard focus for arrow-key navigation.

## Anatomy

```
<cv-chip-group selection-mode="multiple">
  <cv-chip value="photos">Photos</cv-chip>
  <cv-chip value="docs" removable>Docs</cv-chip>
</cv-chip-group>
```

Shadow structure:

```
<cv-chip-group> (host)
└── <div part="base" role="group">
    └── <slot> ← cv-chip children
```

## Attributes

| Attribute        | Type    | Default        | Description                                         |
| ---------------- | ------- | -------------- | --------------------------------------------------- |
| `selection-mode` | String  | `"none"`       | `"none"`, `"single"`, or `"multiple"`               |
| `value`          | String  | `""`           | Single value or space-separated multiple values     |
| `orientation`    | String  | `"horizontal"` | `"horizontal"` or `"vertical"` roving key direction |
| `disabled`       | Boolean | `false`        | Disables group selection and child chip interaction |

## Slots

| Slot        | Description             |
| ----------- | ----------------------- |
| `(default)` | Slotted `cv-chip` items |

## CSS Parts

| Part   | Description            |
| ------ | ---------------------- |
| `base` | Group layout container |

## Events

| Event       | Detail                                      | Description                             |
| ----------- | ------------------------------------------- | --------------------------------------- |
| `cv-input`  | `{ value, changedValue, selected, source }` | Emitted by group before/at user commit  |
| `cv-change` | `{ value, changedValue, selected, source }` | Emitted by group after selection commit |

`cv-chip-group` emits user events only from user interaction. Programmatic `value` updates sync selected
chips without emitting events.

## Keyboard

| Key           | Behavior                                   |
| ------------- | ------------------------------------------ |
| `Enter`/Space | Activates the focused chip                 |
| Arrow keys    | Move roving focus according to orientation |
| `Home`/`End`  | Move focus to first or last chip           |

## Selection modes

| Mode       | Behavior                                                               |
| ---------- | ---------------------------------------------------------------------- |
| `none`     | Chips still emit their own `cv-chip-action`; the group does not select |
| `single`   | One selected value at a time; clicking the selected chip clears it     |
| `multiple` | Adds or removes values; host `value` serializes them with spaces       |

## Usage

```html
<div class="chip-group-demo-shell" data-demo="chip-group">
  <section class="chip-group-demo-hero" aria-labelledby="chip-group-demo-title">
    <div class="chip-group-demo-copy">
      <span class="chip-group-demo-kicker">Selection model</span>
      <h3 id="chip-group-demo-title">Use groups when chips form one choice system.</h3>
      <p>
        The group owns selection, updates child chip states, and emits form-like input/change events only
        after user interaction.
      </p>
    </div>

    <dl class="chip-group-demo-metrics" aria-label="Chip group behavior summary">
      <div>
        <dt>Single</dt>
        <dd>One value</dd>
      </div>
      <div>
        <dt>Multiple</dt>
        <dd>Value list</dd>
      </div>
      <div>
        <dt>Keyboard</dt>
        <dd>Roving focus</dd>
      </div>
    </dl>
  </section>

  <section class="chip-group-demo-section" aria-labelledby="chip-group-demo-single-title">
    <div class="chip-group-demo-section-header">
      <span class="chip-group-demo-kicker">Single selection</span>
      <h4 id="chip-group-demo-single-title">One active facet at a time</h4>
    </div>

    <div class="chip-group-demo-panel">
      <cv-chip-group selection-mode="single" value="all" aria-label="Content filter">
        <cv-chip value="all">All</cv-chip>
        <cv-chip value="files">Files</cv-chip>
        <cv-chip value="notes">Notes</cv-chip>
        <cv-chip value="media" disabled>Media</cv-chip>
      </cv-chip-group>
      <output class="chip-group-demo-output" aria-live="polite">Current value: all</output>
    </div>
  </section>

  <section class="chip-group-demo-section" aria-labelledby="chip-group-demo-multiple-title">
    <div class="chip-group-demo-section-header">
      <span class="chip-group-demo-kicker">Multiple selection</span>
      <h4 id="chip-group-demo-multiple-title">Selected chips serialize into the host value</h4>
    </div>

    <div class="chip-group-demo-panel">
      <cv-chip-group selection-mode="multiple" value="local otp" aria-label="Vault facets">
        <cv-chip value="local" removable>Local</cv-chip>
        <cv-chip value="otp" removable>OTP seeds</cv-chip>
        <cv-chip value="shared">Shared</cv-chip>
        <cv-chip value="archived">Archived</cv-chip>
      </cv-chip-group>
      <output class="chip-group-demo-output" aria-live="polite">Current value: local otp</output>
    </div>
  </section>

  <section class="chip-group-demo-section" aria-labelledby="chip-group-demo-keyboard-title">
    <div class="chip-group-demo-section-header">
      <span class="chip-group-demo-kicker">Keyboard flow</span>
      <h4 id="chip-group-demo-keyboard-title">Orientation controls the arrow-key direction</h4>
    </div>

    <div class="chip-group-demo-keyboard-grid">
      <div class="chip-group-demo-panel">
        <span class="chip-group-demo-label">Horizontal</span>
        <cv-chip-group selection-mode="single" value="usb" aria-label="Transport" orientation="horizontal">
          <cv-chip value="usb">USB</cv-chip>
          <cv-chip value="webrtc">WebRTC</cv-chip>
          <cv-chip value="wss">WSS</cv-chip>
        </cv-chip-group>
      </div>

      <div class="chip-group-demo-panel">
        <span class="chip-group-demo-label">Vertical</span>
        <cv-chip-group selection-mode="single" value="strict" aria-label="Policy" orientation="vertical">
          <cv-chip value="strict">Strict</cv-chip>
          <cv-chip value="balanced">Balanced</cv-chip>
          <cv-chip value="quiet">Quiet</cv-chip>
        </cv-chip-group>
      </div>
    </div>
  </section>
</div>

<script>
  document
    .querySelectorAll('.chip-group-demo-shell[data-demo="chip-group"]:not([data-ready])')
    .forEach((shell) => {
      shell.dataset.ready = 'true'
      shell.querySelectorAll('cv-chip-group').forEach((group) => {
        const panel = group.closest('.chip-group-demo-panel')
        const output = panel?.querySelector('.chip-group-demo-output')
        group.addEventListener('cv-change', (event) => {
          if (!output) return
          const value = Array.isArray(event.detail.value) ? event.detail.value.join(' ') : event.detail.value
          output.textContent = `Current value: ${value || 'empty'}`
        })
      })
    })
</script>
```
