# cv-button-group

Action grouping for related buttons.

**Headless:** None (UIKit-only component)

## Anatomy

```text
<cv-button-group>
└── <div part="base" role="group"><slot></slot></div>
```

## Attributes

| Attribute     | Type        | Default   | Description             |
| ------------- | ----------- | --------- | ----------------------- | ---------------- | ----------------------- |
| `orientation` | `horizontal | vertical` | `horizontal`            | Layout direction |
| `attached`    | Boolean     | `false`   | Joined button treatment |
| `size`        | `small      | medium    | large`                  | `medium`         | Propagated density hint |
| `aria-label`  | String      | empty     | Accessible group label  |

## Boundary

This is not a toolbar. It does not implement roving focus; use `cv-toolbar` for toolbar semantics.
