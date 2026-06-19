# cv-scroll-area

Native-first scroll container with optional scroll-snap styling.

**Headless:** None (UIKit-only component)

## Attributes

| Attribute     | Type      | Default    | Description                             |
| ------------- | --------- | ---------- | --------------------------------------- | ---------- | ------------------- |
| `orientation` | `vertical | horizontal | both`                                   | `vertical` | Scroll axis         |
| `snap`        | Boolean   | `false`    | Enables scroll-snap on slotted children |
| `scrollbar`   | `auto     | stable     | hidden`                                 | `auto`     | Scrollbar treatment |

## Boundary

The component uses browser scrolling and CSS. It does not own scroll state.
