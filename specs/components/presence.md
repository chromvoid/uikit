# cv-presence

Lifecycle wrapper for CSS-owned enter/exit presence.

**Headless:** None (UIKit-only component)

## Attributes

| Attribute      | Type    | Default | Description                             |
| -------------- | ------- | ------- | --------------------------------------- |
| `present`      | Boolean | `false` | Desired visible state                   |
| `keep-mounted` | Boolean | `false` | Keeps content mounted while not present |

## Events

| Event            | Detail |
| ---------------- | ------ |
| `cv-enter`       | `{}`   |
| `cv-after-enter` | `{}`   |
| `cv-exit`        | `{}`   |
| `cv-after-exit`  | `{}`   |

## Boundary

Business workflow state remains outside the component. CSS owns visual motion.
