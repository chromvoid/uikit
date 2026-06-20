# cv-image-viewer

Fullscreen image viewer shell for modal image inspection, gallery navigation, actions, loading/error states, and thumbnail virtualization.

## Usage

```html
<cv-image-viewer open current-index="0" data-live-demo-height="560"></cv-image-viewer>
<script type="module">
  const viewer = document.querySelector('cv-image-viewer')
  viewer.items = [
    {
      id: 1,
      title: 'report.png',
      alt: 'Report preview',
      meta: ['1 / 2', 'image/png'],
      src: '/files/report.png',
      thumbnailSrc: '/files/report-thumb.png',
    },
    {
      id: 2,
      title: 'diagram.jpg',
      src: '/files/diagram.jpg',
    },
  ]
  viewer.actions = [
    {value: 'download', label: 'Download', icon: 'download'},
    {value: 'share', label: 'Share', icon: 'share-2'},
    {value: 'delete', label: 'Delete', icon: 'trash', dangerous: true},
  ]
  viewer.addEventListener('cv-input', (event) => {
    viewer.currentIndex = event.detail.index
  })
  viewer.addEventListener('cv-change', (event) => {
    console.log('Committed image index', event.detail.index)
  })
  viewer.addEventListener('cv-close', () => {
    viewer.open = false
  })
</script>

<!-- Custom mobile viewport with app-owned gestures -->
<cv-image-viewer open layout="mobile">
  <app-mobile-image-track slot="viewport"></app-mobile-image-track>
  <app-thumbnail-strip slot="footer"></app-thumbnail-strip>
  <app-metadata-sheet slot="overlay"></app-metadata-sheet>
</cv-image-viewer>
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
        │   │   └── <slot name="viewport">fallback image state</slot>
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

## Keyboard

| Key          | Behavior                           |
| ------------ | ---------------------------------- |
| `Escape`     | Emits `cv-close` with `escape`     |
| `ArrowLeft`  | Emits `cv-input` for previous item |
| `ArrowRight` | Emits `cv-input` for next item     |
| `Home`       | Emits `cv-input` for first item    |
| `End`        | Emits `cv-input` for last item     |
| `Tab`        | Remains trapped by `cv-dialog`     |
