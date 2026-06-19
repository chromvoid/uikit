# cv-field

Form-field wrapper that standardizes label, description, error, required, disabled, and invalid
linkage for one slotted control.

**Headless:** None (UIKit-only component)

## Anatomy

```text
<cv-field>
├── <label part="label"><slot name="label"></slot></label>
├── <div part="control"><slot></slot></div>
├── <div part="description"><slot name="description"></slot></div>
└── <div part="error"><slot name="error"></slot></div>
```

## Attributes

| Attribute     | Type      | Default     | Description                                   |
| ------------- | --------- | ----------- | --------------------------------------------- | ------------------ | ------------ |
| `for`         | String    | auto        | Explicit id of the control to label           |
| `required`    | Boolean   | `false`     | Propagated to supported direct child controls |
| `disabled`    | Boolean   | `false`     | Propagated to supported direct child controls |
| `invalid`     | Boolean   | `false`     | Propagated as invalid/aria-invalid            |
| `size`        | `small    | medium      | large`                                        | `medium`           | Density hint |
| `orientation` | `vertical | horizontal` | `vertical`                                    | Layout orientation |

## Events

None.

## Boundary

`cv-field` owns only form-field anatomy and ARIA linkage. Validation rules and business state remain
in consumers or form controls.
