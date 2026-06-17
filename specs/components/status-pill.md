# cv-status-pill

Pill-shaped status display for durable state labels.

`cv-status-pill` shares the same tone and size vocabulary as `cv-status-indicator`, but frames the marker and label inside a bordered pill. Use status components for state. Use `cv-badge` for counts or metadata labels.

## Anatomy

```
<cv-status-pill> (host)
└── <span part="base" role="status">
    ├── <span part="marker">
    ├── <span part="icon">
    ├── <span part="label">
    └── <span part="suffix">
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
| `(default)` | Status label                 |
| `icon`      | Optional leading icon        |
| `suffix`    | Optional trailing decoration |

## CSS Parts

| Part     | Description          |
| -------- | -------------------- |
| `base`   | Root pill wrapper    |
| `marker` | Colored status dot   |
| `icon`   | Icon slot wrapper    |
| `label`  | Default slot wrapper |
| `suffix` | Suffix slot wrapper  |

## Events

None. The component is display-only.

## Usage

```html
<cv-status-pill tone="success">Active</cv-status-pill>
<cv-status-pill tone="danger" pulse>Failed</cv-status-pill>
```
