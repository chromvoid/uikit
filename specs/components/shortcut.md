# cv-shortcut

Display primitive for keyboard shortcut labels.

Shortcut resolution, platform-specific labels, and command matching remain owned by consumers. `cv-shortcut` only renders a label or key list.

## Anatomy

```
<cv-shortcut> (host)
└── <span part="base" aria-label="...">
    ├── <cv-kbd part="key">
    ├── <span part="separator">
    └── <cv-kbd part="key">
```

When `label` and `keys` are empty, the default slot is rendered instead.

## Attributes And Properties

| Name         | Type                          | Default | Description                                                         |
| ------------ | ----------------------------- | ------- | ------------------------------------------------------------------- |
| `label`      | String                        | `""`    | Preformatted shortcut label such as `Ctrl + K`                      |
| `keys`       | String or `readonly string[]` | `[]`    | Comma-separated attribute or property key list rendered as `cv-kbd` |
| `separator`  | String                        | `"+"`   | Separator used to split `label` and render between keys             |
| `aria-label` | String                        | `""`    | Accessible label override                                           |

## Slots

| Slot        | Description                                  |
| ----------- | -------------------------------------------- |
| `(default)` | Fallback custom rendering when no keys exist |

## CSS Parts

| Part        | Description               |
| ----------- | ------------------------- |
| `base`      | Root wrapper              |
| `key`       | Inner `cv-kbd` keycap     |
| `separator` | Separator between keycaps |

## Events

None.

## Usage

Use `label` for static markup with the default `+` separator. Use `keys` for explicit key lists, either as a comma-separated attribute or as a JavaScript property; a non-empty `keys` value is rendered instead of parsing `label`.

```html
<cv-shortcut label="Ctrl + K"></cv-shortcut>
<cv-shortcut keys="Shift,Enter" separator="/"></cv-shortcut>

<cv-shortcut id="programmatic-shortcut"></cv-shortcut>
<script type="module">
  document.querySelector('#programmatic-shortcut').keys = ['Meta', 'Shift', 'P']
</script>
```
