# cv-operation-queue

Slotted shell for upload, download, export, or background operation panels.

The queue shell does not own task status, progress values, retry/cancel behavior, formatting, or auto-hide behavior.

## Anatomy

```
<cv-operation-queue> (host)
└── <section part="base" aria-label="Operations">
    ├── <header part="header">
    │   ├── <span part="icon">
    │   ├── <div part="title">
    │   └── <div part="actions">
    ├── <div part="body">
    │   └── <slot>
    ├── <div part="empty"> optional
    └── <footer part="footer">
```

## Attributes

| Attribute | Type    | Default         | Description                         |
| --------- | ------- | --------------- | ----------------------------------- |
| `label`   | String  | `"Operations"`  | Accessible label and fallback title |
| `busy`    | Boolean | `false`         | Sets `aria-busy`                    |
| `empty`   | Boolean | `false`         | Renders empty slot instead of body  |
| `density` | String  | `"comfortable"` | `"comfortable"` or `"compact"`      |
| `tone`    | String  | `"neutral"`     | Semantic queue tone                 |

## Slots

| Slot        | Description                  |
| ----------- | ---------------------------- |
| `icon`      | Leading icon                 |
| `summary`   | Header title/summary content |
| `actions`   | Header actions               |
| `(default)` | Queue body content           |
| `empty`     | Empty content                |
| `footer`    | Footer content               |

## CSS Parts

| Part      | Description          |
| --------- | -------------------- |
| `base`    | Root section         |
| `header`  | Header layout        |
| `title`   | Summary slot wrapper |
| `summary` | Summary text area    |
| `actions` | Actions slot wrapper |
| `body`    | Default body wrapper |
| `empty`   | Empty slot wrapper   |
| `footer`  | Footer slot wrapper  |

## Events

None.

## Usage

```html
<cv-operation-queue label="Upload queue" busy tone="info">
  <span slot="summary">2 uploads active</span>
  <cv-button slot="actions">Cancel all</cv-button>
  <upload-task-row></upload-task-row>
</cv-operation-queue>
```
