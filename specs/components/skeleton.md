# cv-skeleton

Generic loading placeholder for blocks, text rows, and circular media.

## Anatomy

```
<cv-skeleton> (host)
└── <span part="base" role="status">
    └── <span part="line"> ...one or more...
```

Decorative skeletons replace status semantics with `aria-hidden="true"`.

## Attributes

| Attribute    | Type    | Default     | Description                                 |
| ------------ | ------- | ----------- | ------------------------------------------- |
| `variant`    | String  | `"block"`   | `"block"`, `"text"`, or `"circle"`          |
| `lines`      | Number  | `1`         | Number of text lines, clamped to at least 1 |
| `animated`   | Boolean | `true`      | Enables shimmer animation                   |
| `decorative` | Boolean | `false`     | Hides the skeleton from assistive tech      |
| `label`      | String  | `"Loading"` | Accessible label when not decorative        |

## Slots

None.

## CSS Parts

| Part   | Description                    |
| ------ | ------------------------------ |
| `base` | Root semantic wrapper          |
| `line` | Individual placeholder segment |

## CSS Custom Properties

| Property                        | Description             |
| ------------------------------- | ----------------------- |
| `--cv-skeleton-inline-size`     | Host inline size        |
| `--cv-skeleton-block-size`      | Host block size         |
| `--cv-skeleton-line-gap`        | Gap between text lines  |
| `--cv-skeleton-line-block-size` | Block size of each line |
| `--cv-skeleton-size`            | Circle size             |

## Events

None. The component is presentational.

## Usage

```html
<div class="skeleton-demo-shell" data-demo="skeleton" data-live-demo-height="620">
  <section class="skeleton-demo-hero" aria-labelledby="skeleton-demo-title">
    <div class="skeleton-demo-copy">
      <span class="skeleton-demo-kicker">Loading contract</span>
      <h3 id="skeleton-demo-title">Reserve the final interface shape before data arrives.</h3>
      <p>
        Use <code>cv-skeleton</code> when the layout is known but encrypted records, thumbnails, or remote
        status still need to resolve. Keep one announced loading boundary and mark repeated chrome as
        decorative.
      </p>
    </div>

    <dl class="skeleton-demo-metrics" aria-label="Skeleton contract summary">
      <div>
        <dt>Variants</dt>
        <dd>block / text / circle</dd>
      </div>
      <div>
        <dt>Motion</dt>
        <dd>shimmer + reduced motion</dd>
      </div>
      <div>
        <dt>ARIA</dt>
        <dd>status or decorative</dd>
      </div>
    </dl>
  </section>

  <section class="skeleton-demo-board" aria-labelledby="skeleton-demo-board-title">
    <div class="skeleton-demo-section-header">
      <span class="skeleton-demo-kicker">Vault list placeholder</span>
      <h4 id="skeleton-demo-board-title">Match the loading surface to the content that will replace it.</h4>
    </div>

    <div class="skeleton-demo-workspace" aria-label="Vault loading preview">
      <header class="skeleton-demo-toolbar">
        <div class="skeleton-demo-identity">
          <cv-skeleton class="skeleton-demo-avatar" variant="circle" decorative></cv-skeleton>
          <div>
            <cv-skeleton class="skeleton-demo-title-line" label="Loading vault list"></cv-skeleton>
            <cv-skeleton class="skeleton-demo-meta-line" decorative></cv-skeleton>
          </div>
        </div>
        <cv-skeleton class="skeleton-demo-action" decorative></cv-skeleton>
      </header>

      <div class="skeleton-demo-records" aria-label="Loading record rows">
        <div class="skeleton-demo-row">
          <cv-skeleton class="skeleton-demo-icon" variant="circle" decorative></cv-skeleton>
          <div>
            <cv-skeleton class="skeleton-demo-row-title" decorative></cv-skeleton>
            <cv-skeleton class="skeleton-demo-row-meta skeleton-demo-row-meta--wide" decorative></cv-skeleton>
          </div>
          <cv-skeleton class="skeleton-demo-chip" decorative></cv-skeleton>
        </div>

        <div class="skeleton-demo-row">
          <cv-skeleton class="skeleton-demo-icon" variant="circle" decorative></cv-skeleton>
          <div>
            <cv-skeleton
              class="skeleton-demo-row-title skeleton-demo-row-title--short"
              decorative
            ></cv-skeleton>
            <cv-skeleton class="skeleton-demo-row-meta" decorative></cv-skeleton>
          </div>
          <cv-skeleton class="skeleton-demo-chip skeleton-demo-chip--muted" decorative></cv-skeleton>
        </div>

        <div class="skeleton-demo-row">
          <cv-skeleton class="skeleton-demo-icon" variant="circle" decorative></cv-skeleton>
          <div>
            <cv-skeleton class="skeleton-demo-row-title" decorative></cv-skeleton>
            <cv-skeleton
              class="skeleton-demo-row-meta skeleton-demo-row-meta--narrow"
              decorative
            ></cv-skeleton>
          </div>
          <cv-skeleton class="skeleton-demo-chip" decorative></cv-skeleton>
        </div>
      </div>
    </div>

    <aside class="skeleton-demo-variants" aria-label="Skeleton variants">
      <div class="skeleton-demo-variant">
        <span class="skeleton-demo-label">Text stack</span>
        <cv-skeleton variant="text" lines="4" label="Loading note body"></cv-skeleton>
      </div>
      <div class="skeleton-demo-variant skeleton-demo-variant--media">
        <span class="skeleton-demo-label">Media block</span>
        <cv-skeleton class="skeleton-demo-media" decorative></cv-skeleton>
      </div>
      <div class="skeleton-demo-variant skeleton-demo-variant--compact">
        <span class="skeleton-demo-label">Avatar + label</span>
        <div class="skeleton-demo-inline">
          <cv-skeleton
            class="skeleton-demo-avatar skeleton-demo-avatar--small"
            variant="circle"
            decorative
          ></cv-skeleton>
          <cv-skeleton
            class="skeleton-demo-row-title skeleton-demo-row-title--inline"
            decorative
          ></cv-skeleton>
        </div>
      </div>
    </aside>
  </section>
</div>
```

## Loading Pattern

- Use `label` on the skeleton that represents the whole loading region.
- Use `decorative` on repeated row, avatar, thumbnail, and button placeholders inside that region.
- Size skeletons with CSS custom properties from the owning layout so the placeholder reserves the same space as the final UI.
