# cv-bottom-sheet

Mobile modal sheet primitive that reuses `cv-dialog` for modal state, focus management, scroll lock, backdrop dismissal, Escape handling, and lifecycle events.

## Usage

```html
<div class="bottom-sheet-demo-surface" data-demo="bottom-sheet" data-live-demo-height="560">
  <div class="bottom-sheet-demo-copy">
    <span class="bottom-sheet-demo-kicker">Isolated preview</span>
    <h3>Open the sheet inside this frame.</h3>
    <p>
      The sheet keeps its normal modal dialog behavior. The iframe is the preview viewport, so the backdrop
      covers this frame instead of the documentation shell.
    </p>
    <cv-button class="bottom-sheet-demo-open" variant="primary">Open bottom sheet</cv-button>
  </div>

  <cv-bottom-sheet class="bottom-sheet-demo-sheet" initial-focus-id="bottom-sheet-demo-close">
    <span slot="title">Player</span>
    <p>Sheet content stays inside the preview container instead of covering the documentation page.</p>
    <cv-button id="bottom-sheet-demo-close" slot="footer">Close</cv-button>
  </cv-bottom-sheet>
</div>

<script>
  document
    .querySelectorAll('.bottom-sheet-demo-surface[data-demo="bottom-sheet"]:not([data-ready])')
    .forEach((surface) => {
      surface.dataset.ready = 'true'

      const sheet = surface.querySelector('.bottom-sheet-demo-sheet')
      const openButton = surface.querySelector('.bottom-sheet-demo-open')
      const closeButton = surface.querySelector('#bottom-sheet-demo-close')

      openButton?.addEventListener('click', () => {
        if (sheet) sheet.open = true
      })

      closeButton?.addEventListener('click', () => {
        if (sheet) sheet.open = false
      })

      sheet?.addEventListener('cv-change', (event) => {
        if (event.detail.open) return
        openButton?.focus({preventScroll: true})
      })
    })
</script>
```

## Anatomy

```
<cv-bottom-sheet> (host)
└── <cv-dialog exportparts="...">
    └── <button part="handle">
        └── <span part="grabber">
    └── <slot>
```

The underlying dialog exports `trigger`, `overlay`, `content`, `header`, `title`, `description`, `header-close`, `body`, and `footer` parts. `cv-bottom-sheet` adds `handle` and `grabber`.

## Attributes

| Attribute                  | Type    | Default        | Description                                                |
| -------------------------- | ------- | -------------- | ---------------------------------------------------------- |
| `open`                     | Boolean | `false`        | Whether the sheet is visible                               |
| `modal`                    | Boolean | `true`         | Enables dialog modal behavior                              |
| `type`                     | String  | `"dialog"`     | ARIA role type: `dialog` \| `alertdialog`                  |
| `close-on-escape`          | Boolean | `true`         | Whether Escape closes the sheet                            |
| `close-on-outside-pointer` | Boolean | `true`         | Whether backdrop pointer/click closes the sheet            |
| `close-on-outside-focus`   | Boolean | `true`         | Whether outside focus closes the sheet                     |
| `initial-focus-id`         | String  | ---            | Id of element to focus when the sheet opens                |
| `no-header`                | Boolean | `false`        | Hides the dialog header                                    |
| `show-handle`              | Boolean | `true`         | Renders the drag affordance                                |
| `drag-to-close`            | Boolean | `true`         | Enables pull-down close from the handle                    |
| `detents`                  | String  | `""`           | Space/comma-separated detents: `collapsed middle expanded` |
| `detent`                   | String  | `expanded`     | Active detent: `collapsed` \| `middle` \| `expanded`       |
| `handle-label`             | String  | `Resize sheet` | Accessible label for the handle button                     |

## Slots

| Slot           | Description                                     |
| -------------- | ----------------------------------------------- |
| `(default)`    | Sheet body content                              |
| `title`        | Accessible title forwarded to `cv-dialog`       |
| `description`  | Accessible description forwarded to `cv-dialog` |
| `header-close` | Header close icon forwarded to `cv-dialog`      |
| `footer`       | Footer content forwarded to `cv-dialog`         |

## CSS Custom Properties

| Property                             | Default                           | Description                      |
| ------------------------------------ | --------------------------------- | -------------------------------- |
| `--cv-bottom-sheet-z-index`          | `40`                              | Overlay stack level              |
| `--cv-bottom-sheet-width`            | `100%`                            | Sheet inline size                |
| `--cv-bottom-sheet-max-width`        | `100%`                            | Sheet maximum inline size        |
| `--cv-bottom-sheet-max-height`       | `min(82dvh, calc(100dvh - 32px))` | Sheet maximum block size         |
| `--cv-bottom-sheet-collapsed-height` | `148px`                           | Collapsed detent height          |
| `--cv-bottom-sheet-middle-height`    | `min(52dvh, 440px)`               | Middle detent height             |
| `--cv-bottom-sheet-expanded-height`  | `min(92dvh, calc(100dvh - 32px))` | Expanded detent height           |
| `--cv-bottom-sheet-overlay-color`    | `var(--cv-color-overlay)`         | Backdrop color                   |
| `--cv-bottom-sheet-border-radius`    | top corners rounded               | Sheet corner radius              |
| `--cv-bottom-sheet-grabber-color`    | `var(--cv-color-border-strong)`   | Grabber color                    |
| `--cv-bottom-sheet-dismiss-duration` | `180ms`                           | Drag dismiss transition duration |

When available, the app-level `--visual-viewport-block-size` token supplies the visible viewport
height used for sheet sizing while software keyboards are open. Keyboard clearance still flows
through `--cv-bottom-sheet-keyboard-inset` / `--visual-viewport-bottom-inset`.

`cv-bottom-sheet` composes with `cv-dialog` presence state by overriding dialog content motion variables. The sheet uses bottom-up `translateY(...)` transforms for open, close, drag, detent, and dismiss states instead of the centered dialog scale transform.

## Events

Matches `cv-dialog`: `cv-input`, `cv-change`, `cv-show`, `cv-after-show`, `cv-hide`, and `cv-after-hide`.

`cv-after-show` and `cv-after-hide` follow the underlying `cv-dialog` presence transition. Reduced-motion and zero-duration paths complete immediately.

`cv-input` and `cv-change` fire for dialog user interactions, successful drag-to-close, and user-driven detent changes. Programmatic `open` / `detent` changes do not emit input/change.

When `detents` is set, event detail is `{open, detent}`. In default open-close mode, event detail remains `{open}`.

## Interaction Rules

- Backdrop pointer/click and Escape are delegated to `cv-dialog`.
- Drag starts only from `part="handle"`.
- Without `detents`, drag closes at `96px` downward movement or `0.75px/ms` downward velocity.
- With `detents`, upward/downward drags snap one detent at a time; dragging down from the smallest detent dismisses when `drag-to-close` is enabled.
- Tapping the handle advances to the next larger detent when one exists.
- Below-threshold drags snap back without changing `open` or `detent`.
