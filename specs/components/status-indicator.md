# cv-status-indicator

Inline status marker with optional label and suffix content.

## Anatomy

```
<cv-status-indicator> (host)
└── <span part="base" role="status">
    ├── <span part="marker">
    ├── <span part="icon">
    │   └── <slot name="icon">
    ├── <span part="label">
    │   └── <slot>
    └── <span part="suffix">
        └── <slot name="suffix">
```

## Attributes

| Attribute    | Type    | Default     | Description                                                                 |
| ------------ | ------- | ----------- | --------------------------------------------------------------------------- |
| `tone`       | String  | `"neutral"` | `"neutral"`, `"primary"`, `"info"`, `"success"`, `"warning"`, or `"danger"` |
| `size`       | String  | `"medium"`  | `"small"`, `"medium"`, or `"large"`                                         |
| `pulse`      | Boolean | `false`     | Enables marker pulse animation                                              |
| `decorative` | Boolean | `false`     | Uses `aria-hidden="true"` instead of status semantics                       |

## Slots

| Slot        | Description                  |
| ----------- | ---------------------------- |
| `(default)` | Optional text label          |
| `icon`      | Optional leading icon        |
| `suffix`    | Optional trailing decoration |

## CSS Parts

| Part     | Description          |
| -------- | -------------------- |
| `base`   | Root status wrapper  |
| `marker` | Colored status dot   |
| `icon`   | Icon slot wrapper    |
| `label`  | Default slot wrapper |
| `suffix` | Suffix slot wrapper  |

## CSS Custom Properties

| Property                     | Default                                  | Description                                                |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `--cv-status-marker-size`    | `0.625rem`                               | Diameter of the colored status marker                      |
| `--cv-status-gap`            | `var(--cv-space-1, 4px)`                 | Gap between marker, label, icon, and suffix                |
| `--cv-status-color`          | `var(--cv-color-border-strong, #4c5870)` | Marker color before tone overrides                         |
| `--cv-status-font-size`      | `var(--cv-font-size-xs, 12px)`           | Label font size and base line box size                     |
| `--cv-status-line-height`    | `1.2`                                    | Label line height                                          |
| `--cv-status-min-block-size` | `1.2em`                                  | Minimum base height used to align marker-only status items |
| `--cv-status-label-color`    | `var(--cv-color-text, #e8ecf6)`          | Label text color                                           |

## Events

None. The component is display-only.

## Usage

```html
<cv-status-indicator tone="success">Synced</cv-status-indicator>
<cv-status-indicator tone="warning" pulse>Pending</cv-status-indicator>
<cv-status-indicator decorative tone="danger"></cv-status-indicator>
```
