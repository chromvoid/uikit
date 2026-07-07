# cv-bottom-sheet

Mobile modal sheet primitive that reuses `cv-dialog` for modal state, focus management, scroll lock, backdrop dismissal, Escape handling, and lifecycle events.

## Usage

```html
<div class="bottom-sheet-demo-shell" data-demo="bottom-sheet" data-live-demo-height="820">
  <section class="bottom-sheet-demo-stage" aria-labelledby="bottom-sheet-demo-title">
    <div class="bottom-sheet-demo-copy">
      <span class="bottom-sheet-demo-kicker">Mobile modal primitive</span>
      <h3 id="bottom-sheet-demo-title">Bottom sheet keeps mobile decisions close to the thumb.</h3>
      <p>
        Use it for short, contextual decisions that should stay inside the current task: route review,
        dirty-close confirmation, sort/filter controls, and compact metadata.
      </p>

      <div class="bottom-sheet-demo-mode-list" role="group" aria-label="Bottom sheet demo scenario">
        <cv-button
          class="bottom-sheet-demo-mode"
          data-sheet-mode="route"
          variant="primary"
          aria-pressed="true"
        >
          Route review
        </cv-button>
        <cv-button
          class="bottom-sheet-demo-mode"
          data-sheet-mode="detents"
          variant="secondary"
          aria-pressed="false"
        >
          Detents
        </cv-button>
        <cv-button
          class="bottom-sheet-demo-mode"
          data-sheet-mode="dirty"
          variant="secondary"
          aria-pressed="false"
        >
          Dirty close
        </cv-button>
      </div>
    </div>

    <div class="bottom-sheet-demo-phone" aria-label="Mobile vault preview">
      <div class="bottom-sheet-demo-statusbar">
        <span>09:41</span>
        <span>Core paired</span>
      </div>

      <div class="bottom-sheet-demo-app">
        <header class="bottom-sheet-demo-app-header">
          <span class="bottom-sheet-demo-kicker">Active vault</span>
          <strong>Field notes</strong>
        </header>

        <div class="bottom-sheet-demo-file">
          <span class="bottom-sheet-demo-file-mark">N</span>
          <div>
            <strong>border-route.md</strong>
            <span>Edited 3 min ago &middot; local only</span>
          </div>
        </div>

        <dl class="bottom-sheet-demo-readout" aria-label="Current bottom sheet state">
          <div>
            <dt>Mode</dt>
            <dd data-sheet-readout-mode>Route review</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd data-sheet-readout-state>closed</dd>
          </div>
          <div>
            <dt>Detent</dt>
            <dd data-sheet-readout-detent>none</dd>
          </div>
        </dl>

        <cv-button class="bottom-sheet-demo-open" variant="primary">Open active sheet</cv-button>
      </div>

      <cv-bottom-sheet
        class="bottom-sheet-demo-sheet"
        initial-focus-id="bottom-sheet-demo-primary"
        aria-label="Bottom sheet demo"
      >
        <span slot="title" data-sheet-title>Review exposure route</span>
        <span slot="description" data-sheet-description>
          Choose what remains visible before the vault leaves the trusted device.
        </span>

        <div class="bottom-sheet-demo-sheet-view" data-sheet-view="route">
          <div class="bottom-sheet-demo-route">
            <div class="bottom-sheet-demo-route-step">
              <span>D</span>
              <div>
                <strong>Deniable vault</strong>
                <small>Visible container, safe to disclose</small>
              </div>
            </div>
            <div class="bottom-sheet-demo-route-step bottom-sheet-demo-route-step--active">
              <span>T</span>
              <div>
                <strong>Travel profile</strong>
                <small>Only selected notes and media are exposed</small>
              </div>
            </div>
            <div class="bottom-sheet-demo-route-step">
              <span>H</span>
              <div>
                <strong>Hidden layer</strong>
                <small>No UI affordance in this route</small>
              </div>
            </div>
          </div>
        </div>

        <div class="bottom-sheet-demo-sheet-view" data-sheet-view="detents" hidden>
          <div class="bottom-sheet-demo-detent-actions" role="group" aria-label="Set demo detent">
            <cv-button data-sheet-detent="collapsed" variant="secondary">Collapsed</cv-button>
            <cv-button data-sheet-detent="middle" variant="secondary">Middle</cv-button>
            <cv-button data-sheet-detent="expanded" variant="secondary">Expanded</cv-button>
          </div>
          <ul class="bottom-sheet-demo-metadata">
            <li><span>GPS</span><strong>available</strong></li>
            <li><span>Import stream</span><strong>original bytes</strong></li>
            <li><span>Preview cache</span><strong>ephemeral</strong></li>
          </ul>
        </div>

        <div class="bottom-sheet-demo-sheet-view" data-sheet-view="dirty" hidden>
          <div class="bottom-sheet-demo-warning">
            <span>!</span>
            <div>
              <strong>Unsaved note edits</strong>
              <p>Closing now drops the local draft. Save before leaving the document route.</p>
            </div>
          </div>
        </div>

        <div class="bottom-sheet-demo-footer" slot="footer">
          <cv-button id="bottom-sheet-demo-primary" data-sheet-primary variant="primary"
            >Apply route</cv-button
          >
          <cv-button data-sheet-close variant="secondary">Close</cv-button>
        </div>
      </cv-bottom-sheet>
    </div>
  </section>

  <section class="bottom-sheet-demo-contract" aria-label="Bottom sheet contract summary">
    <article>
      <span class="bottom-sheet-demo-label">Dialog base</span>
      <strong>Focus, Escape, backdrop, scroll lock</strong>
      <p>
        <code>cv-bottom-sheet</code> reuses <code>cv-dialog</code>, so modal behavior and lifecycle events
        stay consistent.
      </p>
    </article>
    <article>
      <span class="bottom-sheet-demo-label">Motion axis</span>
      <strong>Bottom-up transform</strong>
      <p>The sheet swaps centered dialog motion for vertical translate, drag offset, and detent snapping.</p>
    </article>
    <article>
      <span class="bottom-sheet-demo-label">Mobile viewport</span>
      <strong>Safe-area and keyboard aware</strong>
      <p>Viewport and keyboard insets flow through CSS variables instead of consumer-side layout math.</p>
    </article>
  </section>
</div>

<script>
  document
    .querySelectorAll('.bottom-sheet-demo-shell[data-demo="bottom-sheet"]:not([data-ready])')
    .forEach((shell) => {
      shell.dataset.ready = 'true'

      const sheet = shell.querySelector('.bottom-sheet-demo-sheet')
      const phone = shell.querySelector('.bottom-sheet-demo-phone')
      const openButton = shell.querySelector('.bottom-sheet-demo-open')
      const closeButton = shell.querySelector('[data-sheet-close]')
      const primaryButton = shell.querySelector('[data-sheet-primary]')
      const modeButtons = [...shell.querySelectorAll('[data-sheet-mode]')]
      const detentButtons = [...shell.querySelectorAll('[data-sheet-detent]')]
      const views = [...shell.querySelectorAll('[data-sheet-view]')]
      const title = shell.querySelector('[data-sheet-title]')
      const description = shell.querySelector('[data-sheet-description]')
      const readoutMode = shell.querySelector('[data-sheet-readout-mode]')
      const readoutState = shell.querySelector('[data-sheet-readout-state]')
      const readoutDetent = shell.querySelector('[data-sheet-readout-detent]')

      const modes = {
        route: {
          label: 'Route review',
          title: 'Review exposure route',
          description: 'Choose what remains visible before the vault leaves the trusted device.',
          primary: 'Apply route',
          detents: '',
          detent: 'expanded',
          type: 'dialog',
        },
        detents: {
          label: 'Detents',
          title: 'Inspect import metadata',
          description: 'Snap compact, middle, or expanded inside the gallery.',
          primary: 'Confirm metadata',
          detents: 'collapsed middle expanded',
          detent: 'middle',
          type: 'dialog',
        },
        dirty: {
          label: 'Dirty close',
          title: 'Save note before closing?',
          description: 'Use alertdialog when the sheet blocks a risky route transition.',
          primary: 'Save draft',
          detents: '',
          detent: 'expanded',
          type: 'alertdialog',
        },
      }

      let currentMode = 'route'

      const syncSheetFrame = () => {
        if (!sheet || !phone) return

        const rect = phone.getBoundingClientRect()
        sheet.style.setProperty('--bottom-sheet-demo-phone-top', `${Math.round(rect.top)}px`)
        sheet.style.setProperty('--bottom-sheet-demo-phone-left', `${Math.round(rect.left)}px`)
        sheet.style.setProperty('--bottom-sheet-demo-phone-width', `${Math.round(rect.width)}px`)
        sheet.style.setProperty('--bottom-sheet-demo-phone-height', `${Math.round(rect.height)}px`)
        sheet.style.setProperty(
          '--bottom-sheet-demo-expanded-height',
          `${Math.max(320, Math.round(rect.height * 0.78))}px`,
        )
        sheet.style.setProperty(
          '--bottom-sheet-demo-middle-height',
          `${Math.max(300, Math.round(rect.height * 0.66))}px`,
        )
      }

      const updateReadout = (eventDetail) => {
        if (readoutMode) readoutMode.textContent = modes[currentMode].label
        if (readoutState) readoutState.textContent = sheet?.open ? 'open' : 'closed'
        if (readoutDetent)
          readoutDetent.textContent = eventDetail?.detent ?? (sheet?.detents ? sheet.detent : 'none')
      }

      const setMode = (mode) => {
        currentMode = mode
        const config = modes[mode]

        modeButtons.forEach((button) => {
          const active = button.dataset.sheetMode === mode
          button.setAttribute('aria-pressed', active ? 'true' : 'false')
          button.setAttribute('variant', active ? 'primary' : 'secondary')
        })

        views.forEach((view) => {
          view.hidden = view.dataset.sheetView !== mode
        })

        if (title) title.textContent = config.title
        if (description) description.textContent = config.description
        if (primaryButton) primaryButton.textContent = config.primary

        if (sheet) {
          sheet.type = config.type
          sheet.detents = config.detents
          sheet.detent = config.detent
          sheet.modal = false
        }

        syncSheetFrame()
        updateReadout()
      }

      modeButtons.forEach((button) => {
        button.addEventListener('click', () => setMode(button.dataset.sheetMode))
      })

      detentButtons.forEach((button) => {
        button.addEventListener('click', () => {
          if (!sheet) return
          sheet.detent = button.dataset.sheetDetent
          updateReadout({detent: sheet.detent})
        })
      })

      openButton?.addEventListener('click', () => {
        syncSheetFrame()
        if (sheet) sheet.open = true
        updateReadout()
      })

      closeButton?.addEventListener('click', () => {
        if (sheet) sheet.open = false
        updateReadout()
      })

      primaryButton?.addEventListener('click', () => {
        if (sheet) sheet.open = false
        updateReadout()
        openButton?.focus({preventScroll: true})
      })

      sheet?.addEventListener('cv-change', (event) => {
        syncSheetFrame()
        updateReadout(event.detail)
        if (event.detail.open) return
        openButton?.focus({preventScroll: true})
      })

      window.addEventListener('resize', syncSheetFrame)
      if ('ResizeObserver' in window && phone) {
        new ResizeObserver(syncSheetFrame).observe(phone)
      }

      setMode(currentMode)
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
| `--cv-bottom-sheet-safe-top`         | `16px`                            | Top viewport clearance           |
| `--cv-bottom-sheet-safe-bottom`      | app safe-area bottom token        | Bottom viewport clearance        |
| `--cv-bottom-sheet-collapsed-height` | `148px`                           | Collapsed detent height          |
| `--cv-bottom-sheet-middle-height`    | `min(52dvh, 440px)`               | Middle detent height             |
| `--cv-bottom-sheet-expanded-height`  | `min(92dvh, calc(100dvh - 32px))` | Expanded detent height           |
| `--cv-bottom-sheet-overlay-color`    | `var(--cv-color-overlay)`         | Backdrop color                   |
| `--cv-bottom-sheet-border-radius`    | top corners rounded               | Sheet corner radius              |
| `--cv-bottom-sheet-grabber-color`    | `var(--cv-color-border-strong)`   | Grabber color                    |
| `--cv-bottom-sheet-dismiss-duration` | `180ms`                           | Drag dismiss transition duration |

When available, the app-level `--safe-area-top` and `--visual-viewport-block-size` tokens supply
the top clearance and visible viewport height used for sheet sizing while software keyboards are
open. Keyboard clearance still flows through `--cv-bottom-sheet-keyboard-inset` /
`--visual-viewport-bottom-inset`.

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
