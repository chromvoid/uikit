# cv-fieldset

Grouped form wrapper using native fieldset/legend semantics.

**Headless:** None (UIKit-only component)

## Usage

```html
<div class="fieldset-demo-grid">
  <cv-fieldset>
    <span slot="legend">Account access</span>
    <span slot="description">Group related fields under one native legend and description.</span>

    <cv-field>
      <span slot="label">Username</span>
      <cv-input name="username" value="alex"></cv-input>
    </cv-field>

    <cv-field>
      <span slot="label">Recovery email</span>
      <cv-input name="recovery-email" type="email" placeholder="name@example.com"></cv-input>
    </cv-field>
  </cv-fieldset>

  <cv-fieldset invalid>
    <span slot="legend">Recovery methods</span>
    <span slot="description">Use invalid with an error slot for group-level validation.</span>
    <cv-checkbox name="recovery-email">Email recovery link</cv-checkbox>
    <cv-checkbox name="recovery-code">Backup code</cv-checkbox>
    <span slot="error">Select at least one recovery method.</span>
  </cv-fieldset>

  <cv-fieldset orientation="horizontal" size="small">
    <span slot="legend">Sync networks</span>
    <span slot="description">Horizontal layout keeps compact option groups in one wrapping row.</span>
    <cv-checkbox checked>Wi-Fi</cv-checkbox>
    <cv-checkbox>Cellular</cv-checkbox>
    <cv-checkbox>Roaming</cv-checkbox>
  </cv-fieldset>

  <cv-fieldset disabled>
    <span slot="legend">Organization policy</span>
    <span slot="description">Disabled state is applied through the native fieldset boundary.</span>

    <cv-field>
      <span slot="label">Policy level</span>
      <cv-select name="policy" value="strict" placeholder="Choose policy">
        <cv-select-option value="standard">Standard</cv-select-option>
        <cv-select-option value="strict">Strict</cv-select-option>
      </cv-select>
    </cv-field>

    <cv-switch checked>Require passcode on launch</cv-switch>
  </cv-fieldset>
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
