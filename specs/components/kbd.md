# cv-kbd

Single keyboard keycap primitive.

## Anatomy

```
<cv-kbd> (host)
└── <kbd part="base">
    └── <slot>
```

## Attributes

| Attribute | Type   | Default     | Description                         |
| --------- | ------ | ----------- | ----------------------------------- |
| `size`    | String | `"medium"`  | `"small"`, `"medium"`, or `"large"` |
| `tone`    | String | `"neutral"` | `"neutral"` or `"strong"`           |

## Slots

| Slot        | Description |
| ----------- | ----------- |
| `(default)` | Key label   |

## CSS Parts

| Part   | Description       |
| ------ | ----------------- |
| `base` | Native `kbd` node |

## Events

None. The component does not listen for keyboard shortcuts.

## Usage

```html
<cv-kbd>Esc</cv-kbd> <cv-kbd tone="strong">Enter</cv-kbd>
```
