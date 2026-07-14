# cv-icon

Reusable icon renderer backed by the UIKit icon registry.

## Anatomy

```
<cv-icon> (host)
└── <span class="icon">
    ├── loaded SVG markup
    └── <slot> fallback or consumer-provided SVG
```

## Attributes

| Attribute | Type    | Default     | Description                                                   |
| --------- | ------- | ----------- | ------------------------------------------------------------- |
| `name`    | String  | `""`        | Registered icon name                                          |
| `src`     | String  | -           | Explicit SVG asset URL                                        |
| `size`    | String  | `"m"`       | Preset size: `xs`, `s`, `m`/`md`, or `l`/`lg`                 |
| `color`   | String  | `"default"` | `default`, `muted`, `primary`, `success`, `warning`, `danger` |
| `label`   | String  | -           | Accessible label; omitted icons are decorative                |
| `fill`    | Boolean | `false`     | Uses the current foreground as SVG fill                       |

### Logical direction aliases

UIKit provides semantic aliases for icons whose meaning follows the inline reading direction:

| Semantic name          | LTR physical asset | RTL rendering                |
| ---------------------- | ------------------ | ---------------------------- |
| `chevron-inline-start` | `chevron-left`     | Mirrored toward inline-start |
| `chevron-inline-end`   | `chevron-right`    | Mirrored toward inline-end   |
| `arrow-inline-start`   | `arrow-left`       | Mirrored toward inline-start |
| `arrow-inline-end`     | `arrow-right`      | Mirrored toward inline-end   |

Physical names such as `chevron-left`, `chevron-right`, `arrow-left`, and `arrow-right` remain physical and are never mirrored. Namespaced third-party collection names are not treated as UIKit semantic aliases.

## Slots

| Slot        | Description                                           |
| ----------- | ----------------------------------------------------- |
| `(default)` | Consumer-provided SVG or fallback while loading fails |

## CSS Custom Properties

| Property         | Default | Description                |
| ---------------- | ------- | -------------------------- |
| `--cv-icon-size` | `1em`   | Icon inline and block size |

## Usage

```html
<div data-demo="icon" data-live-demo-height="240">
  <cv-icon name="lock" color="primary" label="Locked"></cv-icon>
  <cv-icon name="check" color="success" size="l" label="Complete"></cv-icon>
</div>
```

## Events

None. The component is presentational.
