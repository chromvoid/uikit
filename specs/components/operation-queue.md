# cv-operation-queue

Aggregate shell for long-running operation batches such as upload, download, export, sync, or background maintenance queues.

Use it when the user needs one scannable control surface for batch status, batch-level actions, task detail, and aggregate progress. Use `cv-task-list` alone when there is no batch summary or batch-level action.

The queue shell owns layout, accessibility shell semantics, busy/tone styling, empty state placement, and optional region visibility. Consumers still own task data, progress math, retry/cancel behavior, formatting, auto-hide behavior, and any operation model.

## Anatomy

```
<cv-operation-queue> (host)
└── <section part="base" aria-label="Operations">
    ├── <header part="header">
    │   ├── <span part="icon"> optional
    │   ├── <div part="title">
    │   │   └── <span part="summary">
    │   └── <div part="actions"> optional
    ├── <div part="body">
    │   └── <slot>
    ├── <div part="empty"> optional
    └── <footer part="footer"> optional
```

## Attributes

| Attribute | Type    | Default         | Description                                        |
| --------- | ------- | --------------- | -------------------------------------------------- |
| `label`   | String  | `"Operations"`  | Accessible label and fallback summary              |
| `busy`    | Boolean | `false`         | Sets `aria-busy` and shows the busy accent line    |
| `empty`   | Boolean | `false`         | Renders empty slot instead of body                 |
| `density` | String  | `"comfortable"` | `"comfortable"` or `"compact"`                     |
| `tone`    | String  | `"neutral"`     | Semantic queue tone for the aggregate batch status |

## Slots

| Slot        | Description                                              |
| ----------- | -------------------------------------------------------- |
| `icon`      | Leading aggregate status icon or indicator               |
| `summary`   | Header title/summary content; falls back to `label`      |
| `actions`   | Batch-level actions such as pause, cancel all, or retry  |
| `(default)` | Queue body content, commonly a flattened `cv-task-list`  |
| `empty`     | Empty-state content rendered when `empty` is set         |
| `footer`    | Aggregate progress, counts, bytes, timestamps, or limits |

## CSS Parts

| Part      | Description                 |
| --------- | --------------------------- |
| `base`    | Root section                |
| `header`  | Header layout               |
| `icon`    | Leading status slot wrapper |
| `title`   | Summary slot wrapper        |
| `summary` | Summary text area           |
| `actions` | Actions slot wrapper        |
| `body`    | Default body wrapper        |
| `empty`   | Empty slot wrapper          |
| `footer`  | Footer slot wrapper         |

## CSS Custom Properties

| Property                                    | Default                            | Description                        |
| ------------------------------------------- | ---------------------------------- | ---------------------------------- |
| `--cv-operation-queue-inline-size`          | `100%`                             | Host inline size                   |
| `--cv-operation-queue-gap`                  | `var(--cv-space-3, 12px)`          | Gap between shell regions          |
| `--cv-operation-queue-padding`              | `var(--cv-space-4, 16px)`          | Root section padding               |
| `--cv-operation-queue-radius`               | `var(--cv-radius-md, 10px)`        | Root section radius                |
| `--cv-operation-queue-border`               | `1px solid var(--cv-color-border)` | Root section border                |
| `--cv-operation-queue-background`           | `var(--cv-color-surface-2)`        | Root section background            |
| `--cv-operation-queue-shadow`               | `var(--cv-shadow-sm)`              | Root section shadow                |
| `--cv-operation-queue-body-gap`             | `var(--cv-space-2, 8px)`           | Gap inside the default body region |
| `--cv-operation-queue-empty-min-block-size` | `96px`                             | Minimum empty-state block size     |
| `--cv-operation-queue-busy-line-opacity`    | `0.86`                             | Busy accent line opacity           |

- Directly slotted `cv-task-list` is visually flattened by default so `cv-operation-queue` can own the outer panel while `cv-task-list` owns row semantics.

## Visual States

| Selector                     | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| `:host([busy])`              | Sets `aria-busy="true"` and shows a restrained scan line |
| `:host([empty])`             | Renders `slot="empty"` instead of the default body       |
| `:host([density="compact"])` | Reduces shell and body spacing                           |
| `:host([tone="info"])`       | Uses the primary/info accent for active batches          |
| `:host([tone="success"])`    | Uses success accent for completed batches                |
| `:host([tone="warning"])`    | Uses warning accent for paused or waiting batches        |
| `:host([tone="danger"])`     | Uses danger accent for failed batches                    |

## Events

None.

## Usage

```html
<cv-operation-queue label="Encrypted export queue" busy tone="info">
  <cv-status-indicator slot="icon" tone="info" pulse decorative></cv-status-indicator>
  <span slot="summary">Encrypted export - 2 active / 1 queued</span>
  <cv-button slot="actions" size="small" variant="ghost">Pause</cv-button>

  <cv-task-list label="Transfer tasks" density="compact">
    <div role="listitem">
      <div>
        <strong>Encrypt media archive</strong><br />
        <span>Chunk 18 of 25 - 72%</span>
        <cv-progress value="72" value-text="72%" aria-label="Encrypt media archive progress"></cv-progress>
      </div>
      <cv-badge variant="primary" pulse>Running</cv-badge>
    </div>

    <div role="listitem">
      <div>
        <strong>Verify metadata manifest</strong><br />
        <span>Checksums match before transfer</span>
      </div>
      <cv-badge variant="success">Done</cv-badge>
    </div>

    <div role="listitem">
      <div>
        <strong>Upload encrypted backup</strong><br />
        <span>Waiting for network slot</span>
      </div>
      <cv-button size="small" variant="ghost">Cancel</cv-button>
    </div>
  </cv-task-list>

  <div slot="footer">
    <span>1.8 GB of 2.4 GB transferred - retry window open</span>
    <cv-progress
      tone="upload"
      value="74"
      value-text="74%"
      aria-label="Encrypted export transfer progress"
    ></cv-progress>
  </div>
</cv-operation-queue>

<cv-operation-queue label="No background operations" empty>
  <cv-empty-state
    slot="empty"
    icon="check"
    headline="Queue is clear"
    description="New uploads, exports, and sync jobs will appear here."
  ></cv-empty-state>
</cv-operation-queue>
```
