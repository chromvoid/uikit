# cv-carousel

Slideshow component that presents slides as a native horizontal scroll-snap rail with navigation controls, slide-picker dots, and optional autoplay.

**Headless:** [`createCarousel`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/carousel.md)

## Anatomy

```
<cv-carousel> (host)
└── <section part="base" role="region" aria-roledescription="carousel">
    ├── <div part="controls">
    │   ├── <button part="control prev" aria-label="Previous slide">
    │   │   └── <cv-icon name="chevron-left">
    │   ├── <button part="control next" aria-label="Next slide">
    │   │   └── <cv-icon name="chevron-right">
    │   └── <button part="control play-pause" aria-label="Stop/Start slide rotation">
    │       └── <cv-icon name="pause-circle|circle-play">
    ├── <div part="slides" role="group">
    │   └── <slot>                         ← cv-carousel-slide elements
    └── <div part="indicators">
        └── <button part="indicator">      ← one per slide
            └── <span part="indicator-dot" aria-hidden="true">
```

## Attributes

| Attribute           | Type    | Default | Description                                                          |
| ------------------- | ------- | ------- | -------------------------------------------------------------------- |
| `value`             | String  | `""`    | Identifier of the active slide (matches `cv-carousel-slide[value]`)  |
| `active-index`      | Number  | `0`     | Zero-based index of the active slide                                 |
| `autoplay`          | Boolean | `false` | Enables automatic slide rotation                                     |
| `autoplay-interval` | Number  | `5000`  | Autoplay interval in milliseconds                                    |
| `visible-slides`    | Number  | `1`     | Number of slides exposed as visible/accessible from the active slide |
| `paused`            | Boolean | `false` | Whether autoplay is paused                                           |
| `aria-label`        | String  | `""`    | Accessible name for the carousel region                              |
| `aria-labelledby`   | String  | `""`    | ID of the element that labels the carousel                           |

`value` and `active-index` are synchronized: setting one updates the other. When both are set, `value` takes precedence.

## Slots

| Slot        | Description                  |
| ----------- | ---------------------------- |
| `(default)` | `cv-carousel-slide` elements |

## CSS Parts

| Part            | Element     | Description                                                                  |
| --------------- | ----------- | ---------------------------------------------------------------------------- |
| `base`          | `<section>` | Root wrapper with `role="region"` and `aria-roledescription="carousel"`      |
| `controls`      | `<div>`     | Container for navigation and play/pause buttons                              |
| `slides`        | `<div>`     | Horizontal native scroll-snap slide viewport with `role="group"`             |
| `indicators`    | `<div>`     | Container for indicator buttons                                              |
| `control`       | `<button>`  | Shared part on all control buttons (prev, next, play-pause)                  |
| `prev`          | `<button>`  | Previous slide button (also has `control` part)                              |
| `next`          | `<button>`  | Next slide button (also has `control` part)                                  |
| `play-pause`    | `<button>`  | Play/pause toggle button (also has `control` part)                           |
| `indicator`     | `<button>`  | Individual indicator button; `[data-active="true"]` when its slide is active |
| `indicator-dot` | `<span>`    | Visual dot/bar inside an indicator button; hidden from assistive technology  |

## CSS Custom Properties

| Property                              | Default                           | Description                                                        |
| ------------------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `--cv-carousel-gap`                   | `var(--cv-space-3, 12px)`         | Gap between base layout sections and slide rail items              |
| `--cv-carousel-control-size`          | `48px`                            | Min block/inline size of navigation and play/pause control buttons |
| `--cv-carousel-control-radius`        | `var(--cv-radius-md, 10px)`       | Border radius of control buttons                                   |
| `--cv-carousel-indicator-size`        | `10px`                            | Visual size of inactive indicator dots                             |
| `--cv-carousel-indicator-target-size` | `var(--cv-carousel-control-size)` | Touch target size of indicator buttons                             |
| `--cv-carousel-scroll-padding`        | `var(--cv-space-2, 8px)`          | Inline scroll padding used by the snap viewport                    |
| `--cv-carousel-slide-inline-size`     | `min(100%, 42rem)`                | Physical inline size of each scroll-snap slide                     |
| `--cv-carousel-mobile-peek`           | `32px`                            | Narrow viewport peek size that reveals the next slide              |
| `--cv-carousel-slide-min-height`      | `120px`                           | Minimum block size of each slide                                   |

## Visual States

| Host selector           | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `:host([autoplay])`     | Autoplay is enabled                                        |
| `:host([paused])`       | Autoplay is paused (user-initiated or focus/hover-induced) |
| `:host([active-index])` | Reflects the current active slide index                    |

## Events

| Event       | Detail                                                                | Description                                              |
| ----------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| `cv-input`  | `{activeIndex: number, activeValue: string \| null, paused: boolean}` | Fires on any state change (active index or paused state) |
| `cv-change` | `{activeIndex: number, activeValue: string \| null, paused: boolean}` | Fires when the active slide index changes                |

Both events bubble and are composed. `cv-input` fires on every state change (index or pause). `cv-change` fires only when the active index changes.

## Reactive State Mapping

`cv-carousel` is a visual adapter over headless `createCarousel`.

| UIKit Property      | Direction      | Headless Binding                                                  |
| ------------------- | -------------- | ----------------------------------------------------------------- |
| `active-index`      | attr -> action | `actions.moveTo(value)`                                           |
| `value`             | attr -> action | resolved to index via slide records, then `actions.moveTo(index)` |
| `paused`            | attr -> action | `actions.pause()` / `actions.play()`                              |
| `autoplay`          | attr -> option | passed as `autoplay` in `createCarousel(options)`                 |
| `autoplay-interval` | attr -> option | passed as `autoplayIntervalMs` in `createCarousel(options)`       |
| `visible-slides`    | attr -> option | passed as `visibleSlides` in `createCarousel(options)`            |
| `aria-label`        | attr -> option | passed as `ariaLabel` in `createCarousel(options)`                |
| `aria-labelledby`   | attr -> option | passed as `ariaLabelledBy` in `createCarousel(options)`           |

| Headless State                | Direction       | DOM Reflection                                                 |
| ----------------------------- | --------------- | -------------------------------------------------------------- |
| `state.activeSlideIndex()`    | state -> attr   | `[active-index]` host attribute                                |
| `state.isPaused()`            | state -> attr   | `[paused]` host attribute                                      |
| `state.slideCount()`          | state -> render | determines number of indicator buttons                         |
| `state.visibleSlideIndices()` | state -> render | determines `aria-hidden`, `inert`, and `data-active` on slides |

**Contract spreading:**

- `contracts.getRootProps()` is spread onto `[part="base"]` (`role`, `aria-roledescription`, `aria-label`, `aria-labelledby`, `aria-live`, focus/pointer handlers).
- `contracts.getSlideGroupProps()` is spread onto `[part="slides"]` (`role`, `aria-label`).
- `contracts.getSlideProps(index)` is spread onto each `cv-carousel-slide` element (`role`, `aria-roledescription`, `aria-label`, `aria-hidden`, `data-active`). Slides outside `visibleSlideIndices()` remain in the scroll rail but receive `inert`.
- `contracts.getPrevButtonProps()` is spread onto `[part="prev"]` (`aria-controls`, `aria-label`, `onClick`).
- `contracts.getNextButtonProps()` is spread onto `[part="next"]` (`aria-controls`, `aria-label`, `onClick`).
- `contracts.getPlayPauseButtonProps()` is spread onto `[part="play-pause"]` (`aria-controls`, `aria-label`, `onClick`). Returns `aria-label` only, no `aria-pressed` per W3C APG guidance.
- `contracts.getIndicatorProps(index)` is spread onto each `[part="indicator"]` (`aria-controls`, `aria-label`, `aria-current`, `data-active`, `onClick`).

**UIKit does NOT own:**

- Navigation logic (wrapping, clamping) -- headless `moveNext`/`movePrev`/`moveTo`.
- Autoplay timer lifecycle -- headless manages start/stop/resume.
- `aria-live` toggling -- headless sets `off` during autoplay, `polite` on manual navigation.
- Pause-on-focus / pause-on-hover -- headless focus/pointer handlers.
- Active index source of truth -- native scroll calls back into headless `actions.moveTo(index)` instead of mutating UIKit state.

## Keyboard Interaction

Keyboard events are delegated to `actions.handleKeyDown()`. The UIKit layer only prevents default on carousel-relevant keys.

| Key          | Action                 |
| ------------ | ---------------------- |
| `ArrowRight` | Move to next slide     |
| `ArrowLeft`  | Move to previous slide |
| `Home`       | Move to first slide    |
| `End`        | Move to last slide     |

## Native Scroll And Swipe

The UIKit adapter uses native horizontal overflow and CSS scroll snap on `[part="slides"]`:

- Touch and trackpad swipe are handled by the browser's native horizontal scroll behavior.
- Buttons and indicators remain the single-pointer fallback for users who cannot or do not want to drag.
- Programmatic navigation (`next`, `prev`, indicator click, `value`, `active-index`) scrolls the active slide into view.
- User scroll is synchronized back into headless state by selecting the slide nearest the viewport center.
- Programmatic scroll is guarded so intermediate smooth-scroll positions do not emit duplicate `cv-change` events.
- `prefers-reduced-motion: reduce` uses non-smooth programmatic scroll behavior.

This is a UIKit-only concern; the headless model does not handle native scroll mechanics.

## Imperative API

| Method    | Description               |
| --------- | ------------------------- |
| `next()`  | Advance to the next slide |
| `prev()`  | Go to the previous slide  |
| `play()`  | Resume autoplay           |
| `pause()` | Pause autoplay            |

## Usage

```html
<!-- Basic carousel -->
<cv-carousel aria-label="Product gallery">
  <cv-carousel-slide value="vault">Vault setup</cv-carousel-slide>
  <cv-carousel-slide value="keys">Key recovery</cv-carousel-slide>
  <cv-carousel-slide value="audit">Audit trail</cv-carousel-slide>
</cv-carousel>

<!-- Autoplay carousel -->
<cv-carousel aria-label="News feed" autoplay autoplay-interval="3000">
  <cv-carousel-slide value="release">Release note</cv-carousel-slide>
  <cv-carousel-slide value="maintenance">Maintenance window</cv-carousel-slide>
</cv-carousel>

<!-- Multiple accessible slides from the active index -->
<cv-carousel aria-label="Team members" visible-slides="3">
  <cv-carousel-slide value="member-1">Alice</cv-carousel-slide>
  <cv-carousel-slide value="member-2">Bob</cv-carousel-slide>
  <cv-carousel-slide value="member-3">Charlie</cv-carousel-slide>
  <cv-carousel-slide value="member-4">Diana</cv-carousel-slide>
</cv-carousel>

<!-- Controlled by value -->
<cv-carousel aria-label="Steps" value="step-2">
  <cv-carousel-slide value="step-1">Step 1</cv-carousel-slide>
  <cv-carousel-slide value="step-2">Step 2</cv-carousel-slide>
  <cv-carousel-slide value="step-3">Step 3</cv-carousel-slide>
</cv-carousel>
```

## Child Elements

### cv-carousel-slide

Individual slide within a carousel. The parent `cv-carousel` manages all ARIA attributes on this element via headless contracts.

#### Anatomy

```
<cv-carousel-slide> (host)
└── <div part="base">
    └── <slot>
```

#### Attributes

| Attribute | Type    | Default | Description                                                                 |
| --------- | ------- | ------- | --------------------------------------------------------------------------- |
| `value`   | String  | `""`    | Unique identifier for this slide. Auto-generated as `slide-{n}` if omitted. |
| `label`   | String  | `""`    | Accessible label for the slide. Falls back to `textContent` if omitted.     |
| `active`  | Boolean | `false` | Whether this slide is currently active. Managed by parent.                  |

#### Slots

| Slot        | Description   |
| ----------- | ------------- |
| `(default)` | Slide content |

#### CSS Parts

| Part   | Element | Description                        |
| ------ | ------- | ---------------------------------- |
| `base` | `<div>` | Root wrapper for the slide content |

#### CSS Custom Properties

| Property                         | Default                     | Description                     |
| -------------------------------- | --------------------------- | ------------------------------- |
| `--cv-carousel-slide-min-height` | `120px`                     | Minimum block size of the slide |
| `--cv-carousel-slide-padding`    | `var(--cv-space-4, 16px)`   | Padding inside the slide        |
| `--cv-carousel-slide-radius`     | `var(--cv-radius-md, 10px)` | Border radius of the slide      |

#### Visual States

| Host selector     | Description                                                                          |
| ----------------- | ------------------------------------------------------------------------------------ |
| `:host([active])` | Slide is currently active; border uses `--cv-color-primary`                          |
| `:host([inert])`  | Slide remains in the native scroll rail but is not interactive/accessibility-visible |
