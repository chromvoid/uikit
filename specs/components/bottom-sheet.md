# cv-bottom-sheet

Mobile modal sheet primitive that reuses `cv-dialog` for modal state, focus management, scroll lock, backdrop dismissal, Escape handling, and lifecycle events.

## Usage

```html
<cv-bottom-sheet open no-header>
  <span slot="title">Player</span>
  <div>Sheet content</div>
</cv-bottom-sheet>
```

## Anatomy

```
<cv-bottom-sheet> (host)
└── <cv-dialog exportparts="...">
    └── <div part="handle">
        └── <span part="grabber">
    └── <slot>
```

The underlying dialog exports `trigger`, `overlay`, `content`, `header`, `title`, `description`, `header-close`, `body`, and `footer` parts. `cv-bottom-sheet` adds `handle` and `grabber`.

## Attributes

| Attribute                  | Type    | Default    | Description                                             |
| -------------------------- | ------- | ---------- | ------------------------------------------------------- |
| `open`                     | Boolean | `false`    | Whether the sheet is visible                            |
| `modal`                    | Boolean | `true`     | Enables dialog modal behavior                           |
| `type`                     | String  | `"dialog"` | ARIA role type: `dialog` \| `alertdialog`               |
| `close-on-escape`          | Boolean | `true`     | Whether Escape closes the sheet                         |
| `close-on-outside-pointer` | Boolean | `true`     | Whether backdrop pointer/click closes the sheet         |
| `close-on-outside-focus`   | Boolean | `true`     | Whether outside focus closes the sheet                  |
| `initial-focus-id`         | String  | ---        | Id of element to focus when the sheet opens             |
| `no-header`                | Boolean | `false`    | Hides the dialog header                                 |
| `show-handle`              | Boolean | `true`     | Renders the drag affordance                             |
| `drag-to-close`            | Boolean | `true`     | Enables pull-down close from the handle                 |

## Slots

| Slot           | Description                                              |
| -------------- | -------------------------------------------------------- |
| `(default)`    | Sheet body content                                       |
| `title`        | Accessible title forwarded to `cv-dialog`                |
| `description`  | Accessible description forwarded to `cv-dialog`          |
| `header-close` | Header close icon forwarded to `cv-dialog`               |
| `footer`       | Footer content forwarded to `cv-dialog`                  |

## CSS Custom Properties

| Property                                  | Default                          | Description                         |
| ----------------------------------------- | -------------------------------- | ----------------------------------- |
| `--cv-bottom-sheet-z-index`               | `40`                             | Overlay stack level                 |
| `--cv-bottom-sheet-width`                 | `100%`                           | Sheet inline size                   |
| `--cv-bottom-sheet-max-width`             | `100%`                           | Sheet maximum inline size           |
| `--cv-bottom-sheet-max-height`            | `min(82dvh, calc(100dvh - 32px))` | Sheet maximum block size            |
| `--cv-bottom-sheet-overlay-color`         | `var(--cv-color-overlay)`        | Backdrop color                      |
| `--cv-bottom-sheet-border-radius`         | top corners rounded              | Sheet corner radius                 |
| `--cv-bottom-sheet-grabber-color`         | `var(--cv-color-border-strong)`  | Grabber color                       |
| `--cv-bottom-sheet-dismiss-duration`      | `180ms`                          | Drag dismiss transition duration    |

## Events

Matches `cv-dialog`: `cv-input`, `cv-change`, `cv-show`, `cv-after-show`, `cv-hide`, and `cv-after-hide`.

`cv-input` and `cv-change` fire for dialog user interactions and for successful drag-to-close. Programmatic `open` changes do not emit input/change.

## Interaction Rules

- Backdrop pointer/click and Escape are delegated to `cv-dialog`.
- Pull-down dismissal starts only from `part="handle"`.
- Drag closes at `96px` downward movement or `0.75px/ms` downward velocity.
- Below-threshold drags snap back without changing `open`.
