# cv-time-picker

Form-associated time-only control with public `HH:mm` values.

The control is timezone-free. It owns generic input, stepping, clear, and validity state. Consumers own domain-specific labels and persistence.

## Anatomy

```
<cv-time-picker> (host)
└── <div part="base">
    ├── <input part="input">
    ├── <span part="controls">
    │   ├── <button part="step-button">
    │   └── <button part="step-button">
    └── <button part="clear-button">
```

## Attributes

| Attribute       | Type    | Default         | Description                                |
| --------------- | ------- | --------------- | ------------------------------------------ |
| `name`          | String  | `""`            | Form field name                            |
| `value`         | String  | `""`            | Committed value in `HH:mm` format          |
| `disabled`      | Boolean | `false`         | Disables interaction and form value        |
| `readonly`      | Boolean | `false`         | Blocks user editing while keeping value    |
| `required`      | Boolean | `false`         | Requires a committed value                 |
| `placeholder`   | String  | `"Select time"` | Input placeholder                          |
| `size`          | String  | `"medium"`      | `"small"`, `"medium"`, or `"large"`        |
| `min`           | String  | `""`            | Minimum accepted `HH:mm` value             |
| `max`           | String  | `""`            | Maximum accepted `HH:mm` value             |
| `minute-step`   | Number  | `1`             | Minute step, invalid values fall back to 1 |
| `hour-cycle`    | Number  | `24`            | Display hint, `12` or `24`                 |
| `aria-label`    | String  | `""`            | Input accessible label override            |
| `input-invalid` | Boolean | `false`         | Derived invalid input state                |
| `has-value`     | Boolean | `false`         | Derived committed-value state              |

## Slots

None in V1.

## CSS Parts

| Part           | Description                |
| -------------- | -------------------------- |
| `base`         | Root control wrapper       |
| `input`        | Text input                 |
| `controls`     | Step button wrapper        |
| `step-button`  | Increment/decrement button |
| `clear-button` | Clear button               |

## Events

| Event       | Detail                                   | Description                        |
| ----------- | ---------------------------------------- | ---------------------------------- |
| `cv-input`  | `{ value, inputValue, invalid, source }` | User input, step, or clear request |
| `cv-change` | `{ value, previousValue, source }`       | User commit changed the value      |

`source` is `"input"`, `"step"`, or `"clear"`. Programmatic property updates do not emit user events.

## Form Contract

- Form value is the committed `HH:mm` value.
- Disabled controls submit `null`.
- Reset restores the captured default value.
- Required, invalid draft, and range failures are reported through form-associated validity.

## Usage

```html
<cv-time-picker name="reminder-time" required></cv-time-picker>
<cv-time-picker value="09:30" min="08:00" max="18:00" minute-step="15"></cv-time-picker>
```
