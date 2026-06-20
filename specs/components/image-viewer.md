# cv-image-viewer

Fullscreen image viewer shell for modal image inspection, gallery navigation, actions, loading/error states, and thumbnail virtualization.

## Usage

```html
<div class="image-viewer-demo-shell" data-demo="image-viewer" data-live-demo-height="640">
  <section class="image-viewer-demo-launch" aria-labelledby="image-viewer-demo-title">
    <div class="image-viewer-demo-copy">
      <span class="image-viewer-demo-kicker">Controlled gallery</span>
      <h3 id="image-viewer-demo-title">Inspect generated ChromVoid imagery with committed navigation</h3>
      <p>
        The shell owns image URLs, actions, and current index. The viewer emits intent events; this demo
        commits them back into component state.
      </p>
      <div class="image-viewer-demo-actions">
        <cv-button variant="primary" data-image-viewer-open>
          <cv-icon slot="prefix" name="maximize" size="s"></cv-icon>
          Open viewer
        </cv-button>
        <output data-image-viewer-output aria-live="polite">Ready</output>
      </div>
    </div>

    <div class="image-viewer-demo-gallery" aria-label="Generated gallery images">
      <button type="button" class="image-viewer-demo-shot" data-image-viewer-index="0">
        <img data-image-viewer-thumb="chromvoid-mobile-vault-thumb.png" alt="" width="320" height="180" />
        <span>Mobile vault workspace</span>
      </button>
      <button type="button" class="image-viewer-demo-shot" data-image-viewer-index="1">
        <img data-image-viewer-thumb="hardware-vault-keypad-thumb.png" alt="" width="320" height="180" />
        <span>Hardware vault keypad</span>
      </button>
      <button type="button" class="image-viewer-demo-shot" data-image-viewer-index="2">
        <img data-image-viewer-thumb="mobile-core-bridge-thumb.png" alt="" width="320" height="180" />
        <span>Mobile core bridge</span>
      </button>
      <button type="button" class="image-viewer-demo-shot" data-image-viewer-index="3">
        <img data-image-viewer-thumb="deniable-vault-cube-thumb.png" alt="" width="320" height="180" />
        <span>Deniable vault cube</span>
      </button>
      <button type="button" class="image-viewer-demo-shot" data-image-viewer-index="4">
        <img data-image-viewer-thumb="trust-orbit-thumb.png" alt="" width="320" height="180" />
        <span>Trust orbit diagram</span>
      </button>
    </div>
  </section>

  <cv-image-viewer current-index="0"></cv-image-viewer>
</div>

<script>
  document
    .querySelectorAll('.image-viewer-demo-shell[data-demo="image-viewer"]:not([data-ready])')
    .forEach((shell) => {
      shell.dataset.ready = 'true'

      const viewer = shell.querySelector('cv-image-viewer')
      const output = shell.querySelector('[data-image-viewer-output]')
      const parentUrl = window.parent?.location?.href || window.location.href
      const assetUrl = (file) => new URL(`../images/image-viewer/${file}`, parentUrl).href
      const items = [
        {
          id: 'chromvoid-mobile-vault',
          title: 'chromvoid-mobile-vault.png',
          alt: 'Generated ChromVoid mobile vault scene with layered vault tiles',
          meta: ['generated PNG', '1795 x 876', 'mobile vault'],
          src: assetUrl('chromvoid-mobile-vault.png'),
          thumbnailSrc: assetUrl('chromvoid-mobile-vault-thumb.png'),
        },
        {
          id: 'hardware-vault-keypad',
          title: 'hardware-vault-keypad.png',
          alt: 'Generated hardware vault keypad with a security token and cyan signal path',
          meta: ['generated PNG', '1731 x 909', 'hardware vault'],
          src: assetUrl('hardware-vault-keypad.png'),
          thumbnailSrc: assetUrl('hardware-vault-keypad-thumb.png'),
        },
        {
          id: 'mobile-core-bridge',
          title: 'mobile-core-bridge.png',
          alt: 'Generated phone connected to a self-hosted core device on a desktop',
          meta: ['generated PNG', '1672 x 941', 'device bridge'],
          src: assetUrl('mobile-core-bridge.png'),
          thumbnailSrc: assetUrl('mobile-core-bridge-thumb.png'),
        },
        {
          id: 'deniable-vault-cube',
          title: 'deniable-vault-cube.png',
          alt: 'Generated transparent vault cube with deniable layers and device connections',
          meta: ['generated PNG', '1734 x 907', 'deniable vault'],
          src: assetUrl('deniable-vault-cube.png'),
          thumbnailSrc: assetUrl('deniable-vault-cube-thumb.png'),
        },
        {
          id: 'trust-orbit',
          title: 'trust-orbit.png',
          alt: 'Generated trust orbit diagram with connected devices and a central vault core',
          meta: ['generated PNG', '1672 x 941', 'trust graph'],
          src: assetUrl('trust-orbit.png'),
          thumbnailSrc: assetUrl('trust-orbit-thumb.png'),
        },
      ]

      const setStatus = (message) => {
        if (output) output.value = message
      }
      const commitIndex = (index, message) => {
        viewer.currentIndex = Math.max(0, Math.min(index, items.length - 1))
        setStatus(message || `Viewing ${items[viewer.currentIndex].title}`)
      }

      shell.querySelectorAll('[data-image-viewer-thumb]').forEach((image) => {
        image.src = assetUrl(image.dataset.imageViewerThumb)
      })

      viewer.items = items
      viewer.thumbnailWindow = {
        indices: [0, 1, 2, 3, 4],
        beforeCount: 0,
        afterCount: 0,
        thumbnailStepPx: 68,
      }
      viewer.open = true
      setStatus(`Viewing ${items[0].title}`)

      shell.querySelectorAll('[data-image-viewer-open]').forEach((control) => {
        control.addEventListener('click', () => {
          viewer.open = true
          setStatus(`Viewing ${items[viewer.currentIndex].title}`)
        })
      })

      shell.querySelectorAll('[data-image-viewer-index]').forEach((control) => {
        control.addEventListener('click', () => {
          commitIndex(Number(control.dataset.imageViewerIndex))
          viewer.open = true
        })
      })

      viewer.addEventListener('cv-input', (event) => {
        commitIndex(event.detail.index, `Navigation requested: ${items[event.detail.index].title}`)
      })
      viewer.addEventListener('cv-close', () => {
        viewer.open = false
        setStatus('Viewer closed')
      })
    })
</script>
```

## Anatomy

```
<cv-image-viewer> (host)
└── <cv-dialog no-header> (modal shell, role="dialog")
    ├── <span slot="title">current image title</span>
    └── <section part="base">
        ├── <header part="header">
        │   ├── <div part="title-group">
        │   │   ├── <div part="title">
        │   │   └── <div part="meta">
        │   └── <div part="header-actions">
        │       ├── action buttons or overflow menu
        │       └── close button
        ├── <main part="viewport-region">
        │   ├── <div part="viewport">
        │   │   └── <slot name="viewport">fallback image state / image-stage</slot>
        │   ├── previous/next controls
        │   ├── busy overlay
        │   └── <div part="overlay">
        │       └── <slot name="overlay">
        └── <footer part="footer">
            └── <slot name="footer">virtual thumbnail rail</slot>
```

## Attributes

| Attribute         | Type    | Default | Description                                      |
| ----------------- | ------- | ------- | ------------------------------------------------ |
| `open`            | Boolean | `false` | Whether the modal viewer is visible              |
| `current-index`   | Number  | `0`     | Selected item index                              |
| `busy`            | Boolean | `false` | Shows a modal busy affordance above the viewport |
| `busy-label`      | String  | Loading | Accessible label for the busy affordance         |
| `chrome-visible`  | Boolean | `true`  | Shows or hides header and footer chrome          |
| `layout`          | String  | `auto`  | `desktop`, `mobile`, or responsive `auto`        |
| `show-thumbnails` | Boolean | `true`  | Enables the built-in thumbnail rail fallback     |

## Properties

| Property          | Type                                   | Description                                  |
| ----------------- | -------------------------------------- | -------------------------------------------- |
| `items`           | `CVImageViewerItem[]`                  | App-provided image records                   |
| `actions`         | `CVImageViewerAction[]`                | App-provided action descriptors              |
| `thumbnailWindow` | `CVImageViewerThumbnailWindow \| null` | Virtual thumbnail window for large galleries |

```ts
type CVImageViewerItem = {
  id: string | number
  title: string
  alt?: string
  meta?: readonly string[]
  src?: string | null
  thumbnailSrc?: string | null
  loading?: boolean
  error?: string | null
}

type CVImageViewerAction = {
  value: string
  label: string
  icon?: string
  // Destructive visual affordance only; consumers still own confirmation.
  dangerous?: boolean
  disabled?: boolean
  loading?: boolean
}

type CVImageViewerThumbnailWindow = {
  indices: number[]
  beforeCount: number
  afterCount: number
  thumbnailStepPx: number
}
```

## Slots

| Slot       | Description                                                              |
| ---------- | ------------------------------------------------------------------------ |
| `viewport` | Replaces the fallback image renderer with an app-owned renderer or track |
| `footer`   | Replaces the built-in thumbnail rail with an app-owned footer            |
| `overlay`  | App-owned overlay sheets or panels rendered above the viewport           |

## CSS Parts

| Part                      | Description                              |
| ------------------------- | ---------------------------------------- |
| `base`                    | Fullscreen viewer layout container       |
| `header`                  | Header chrome                            |
| `title-group`             | Title and metadata container             |
| `title`                   | Current item title                       |
| `meta`                    | Counter and metadata row                 |
| `header-actions`          | Actions and close control                |
| `viewport-region`         | Main viewport area                       |
| `viewport`                | Fallback or slotted image viewport       |
| `image-stage`             | Built-in current/outgoing image stack    |
| `image`                   | Built-in fallback image                  |
| `state`                   | Empty/loading/error state                |
| `nav nav-previous`        | Previous image control                   |
| `nav nav-next`            | Next image control                       |
| `busy-overlay`            | Busy overlay                             |
| `busy-status`             | Busy status chip                         |
| `overlay`                 | Slotted overlay layer                    |
| `footer`                  | Footer chrome                            |
| `thumbnails`              | Built-in thumbnail rail                  |
| `thumbnail`               | Built-in thumbnail button                |
| `thumbnail-window-spacer` | Virtual-window before/after count marker |
| `thumbnail-placeholder`   | Thumbnail fallback label                 |

## Events

| Event                  | Detail                                                           | Description                              |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| `cv-close`             | `{reason: 'control' \| 'escape' \| 'backdrop'}`                  | User requested close                     |
| `cv-input`             | `{index, itemId, direction, source}`                             | User requested a navigation index        |
| `cv-change`            | `{index, itemId, direction, source}`                             | External `currentIndex` commit observed  |
| `cv-action`            | `{value, itemId, index}`                                         | User invoked an action                   |
| `cv-image-error`       | `{itemId, index, sourceUrl}`                                     | Built-in fallback image failed to render |
| `cv-thumbnail-metrics` | `{viewportWidth, thumbnailStepPx, centerIndex}`                  | Built-in thumbnail rail metrics changed  |
| `cv-prime`             | `{index, itemId, reason: 'open' \| 'navigation' \| 'thumbnail'}` | Viewer requests resource priming         |

`cv-image-viewer` never fetches app files or owns catalog state. Consumers provide source URLs, loading/error state, actions, and thumbnail windows. The viewer is controlled: navigation controls emit `cv-input`, consumers commit `currentIndex`, then the viewer emits `cv-change` for the committed prop change.

The built-in fallback viewport animates committed image changes with a directional slide/fade based on the navigation direction. Slotted viewport content remains fully consumer-owned. The transition respects `prefers-reduced-motion`.

Navigation `source` values are `control`, `gesture`, `keyboard`, `thumbnail`, or `programmatic`. On desktop, the built-in viewport treats a clearly horizontal wheel gesture as touchpad gallery navigation: one continuous swipe emits at most one `cv-input` request, while vertical wheel input and zoom/meta gestures are ignored.

## Keyboard

| Key          | Behavior                           |
| ------------ | ---------------------------------- |
| `Escape`     | Emits `cv-close` with `escape`     |
| `ArrowLeft`  | Emits `cv-input` for previous item |
| `ArrowRight` | Emits `cv-input` for next item     |
| `Home`       | Emits `cv-input` for first item    |
| `End`        | Emits `cv-input` for last item     |
| `Tab`        | Remains trapped by `cv-dialog`     |
