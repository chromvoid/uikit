# cv-badge

Non-interactive status indicator that displays short labels, counts, or colored dots.

**Headless:** [`createBadge`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/badge.md)

## Anatomy

```
<cv-badge> (host)
└── <div part="base">
    ├── <span part="prefix">
    │   └── <slot name="prefix">
    ├── <span part="label">           ← hidden when [dot]
    │   └── <slot>
    └── <span part="suffix">
        └── <slot name="suffix">
```

## Attributes

| Attribute    | Type    | Default     | Description                                                                            |
| ------------ | ------- | ----------- | -------------------------------------------------------------------------------------- |
| `variant`    | String  | `"neutral"` | Visual variant: `"primary"` \| `"success"` \| `"neutral"` \| `"warning"` \| `"danger"` |
| `size`       | String  | `"medium"`  | Size: `"small"` \| `"medium"` \| `"large"`                                             |
| `dot`        | Boolean | `false`     | Dot mode: hides textual content, shows a colored circle indicator                      |
| `pulse`      | Boolean | `false`     | Enables a pulsing animation to draw attention                                          |
| `pill`       | Boolean | `false`     | Fully rounded edges (`border-radius: 999px`)                                           |
| `dynamic`    | Boolean | `false`     | Enables live-region semantics for runtime content changes                              |
| `decorative` | Boolean | `false`     | Hides the badge from assistive technology                                              |

## Variants

| Variant   | Description                                                     |
| --------- | --------------------------------------------------------------- |
| `neutral` | Default muted style with surface background and border          |
| `primary` | Primary-tinted background and border using `--cv-color-primary` |
| `success` | Success-tinted background and border using `--cv-color-success` |
| `warning` | Warning-tinted background and border using `--cv-color-warning` |
| `danger`  | Danger-tinted background and border using `--cv-color-danger`   |

The `dot`, `pulse`, and `pill` boolean modifiers can be combined with any variant.

## Sizes

| Size     | `--cv-badge-height` | `--cv-badge-padding-inline` | `--cv-badge-font-size` | `--cv-badge-dot-size` |
| -------- | ------------------- | --------------------------- | ---------------------- | --------------------- |
| `small`  | `20px`              | `var(--cv-space-1, 4px)`    | `11px`                 | `6px`                 |
| `medium` | `24px`              | `var(--cv-space-2, 8px)`    | `12px`                 | `8px`                 |
| `large`  | `28px`              | `var(--cv-space-3, 12px)`   | `14px`                 | `10px`                |

## Slots

| Slot        | Description                      |
| ----------- | -------------------------------- |
| `(default)` | Badge label (hidden in dot mode) |
| `prefix`    | Icon or element before label     |
| `suffix`    | Icon or element after label      |

## CSS Parts

| Part     | Element  | Description                                                               |
| -------- | -------- | ------------------------------------------------------------------------- |
| `base`   | `<div>`  | Root wrapper element; receives headless `getBadgeProps()` ARIA attributes |
| `label`  | `<span>` | Wrapper around the default slot (hidden when `dot` is `true`)             |
| `prefix` | `<span>` | Wrapper around the `prefix` slot                                          |
| `suffix` | `<span>` | Wrapper around the `suffix` slot                                          |

## CSS Custom Properties

| Property                    | Default                    | Description                               |
| --------------------------- | -------------------------- | ----------------------------------------- |
| `--cv-badge-height`         | `24px`                     | Block size of the badge                   |
| `--cv-badge-padding-inline` | `var(--cv-space-2, 8px)`   | Horizontal padding                        |
| `--cv-badge-border-radius`  | `var(--cv-radius-sm, 6px)` | Border radius for badge shape             |
| `--cv-badge-gap`            | `var(--cv-space-1, 4px)`   | Spacing between badge content parts       |
| `--cv-badge-font-size`      | `12px`                     | Font size of badge content                |
| `--cv-badge-dot-size`       | `8px`                      | Diameter of the dot indicator in dot mode |

Additionally, component styles depend on theme tokens through fallback values:

| Theme Property         | Default   | Description                         |
| ---------------------- | --------- | ----------------------------------- |
| `--cv-color-border`    | `#2a3245` | Base border color                   |
| `--cv-color-surface`   | `#141923` | Surface background color            |
| `--cv-color-text`      | `#e8ecf6` | Default text color                  |
| `--cv-color-primary`   | `#65d7ff` | Primary accent color                |
| `--cv-color-success`   | `#5beba0` | Success accent color                |
| `--cv-color-warning`   | `#ffc857` | Warning accent color                |
| `--cv-color-danger`    | `#ff7d86` | Danger accent color                 |
| `--cv-duration-fast`   | `120ms`   | Transition duration                 |
| `--cv-easing-standard` | `ease`    | Transition timing function          |
| `--cv-radius-sm`       | `6px`     | Base radius used for badge fallback |
| `--cv-space-1`         | `4px`     | Small spacing scale fallback        |
| `--cv-space-2`         | `8px`     | Medium spacing scale fallback       |
| `--cv-space-3`         | `12px`    | Medium-large spacing scale fallback |

## Visual States

| Host selector                | Description                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `:host([variant="neutral"])` | Default muted background with border                                                   |
| `:host([variant="primary"])` | Primary-tinted background and border                                                   |
| `:host([variant="success"])` | Success-tinted background and border                                                   |
| `:host([variant="warning"])` | Warning-tinted background and border                                                   |
| `:host([variant="danger"])`  | Danger-tinted background and border                                                    |
| `:host([dot])`               | Dot mode: hides label/prefix/suffix, renders a colored circle of `--cv-badge-dot-size` |
| `:host([pulse])`             | Applies a repeating scale/opacity animation to draw attention                          |
| `:host([pill])`              | Fully rounded edges (`border-radius: 999px`)                                           |
| `:host([size="small"])`      | Small size overrides                                                                   |
| `:host([size="large"])`      | Large size overrides                                                                   |
| `:host([dot][pulse])`        | Dot with pulse animation combined                                                      |
| `:host([decorative])`        | Decorative mode; no visual change, ARIA-hidden via headless                            |

## Reactive State Mapping

`cv-badge` is a visual adapter over headless `createBadge`.

| UIKit Property | Direction      | Headless Binding                                |
| -------------- | -------------- | ----------------------------------------------- |
| `variant`      | attr -> action | `actions.setVariant(value)`                     |
| `size`         | attr -> action | `actions.setSize(value)`                        |
| `dot`          | attr -> action | `actions.setDot(value)`                         |
| `pulse`        | attr -> action | `actions.setPulse(value)`                       |
| `pill`         | attr -> action | `actions.setPill(value)`                        |
| `dynamic`      | attr -> action | `actions.setDynamic(value)`                     |
| `decorative`   | attr -> action | `actions.setDecorative(value)`                  |
| `aria-label`   | attr -> option | passed as `ariaLabel` in `createBadge(options)` |

| Headless State    | Direction     | DOM Reflection                                                           |
| ----------------- | ------------- | ------------------------------------------------------------------------ |
| `state.variant()` | state -> attr | `[variant]` host attribute                                               |
| `state.size()`    | state -> attr | `[size]` host attribute                                                  |
| `state.dot()`     | state -> attr | `[dot]` host attribute                                                   |
| `state.pulse()`   | state -> attr | `[pulse]` host attribute                                                 |
| `state.pill()`    | state -> attr | `[pill]` host attribute                                                  |
| `state.isEmpty()` | state -> DOM  | Hides `[part="label"]`, `[part="prefix"]`, `[part="suffix"]` when `true` |

- `contracts.getBadgeProps()` is spread onto the inner `[part="base"]` element to apply `role`, `aria-live`, `aria-atomic`, `aria-hidden`, and `aria-label` as applicable.
- UIKit does not own ARIA logic; headless state is the source of truth for all accessibility attributes.
- Badge is non-interactive: no `tabindex`, no keyboard handlers, no focus management.

## Events

Badge is non-interactive. No `input`, `change`, or custom events are emitted.

## Usage

```html
<div class="badge-demo-shell usage-demo" data-demo="badge" data-live-demo-height="720">
  <section class="badge-demo-hero usage-demo__hero" aria-labelledby="badge-demo-title">
    <div class="badge-demo-copy usage-demo__copy">
      <span class="badge-demo-kicker usage-demo__kicker">Passive status</span>
      <h3 id="badge-demo-title">Use badges for state, counts, and compact risk labels.</h3>
      <p>
        Badge stays non-interactive: it can announce dynamic changes, mark decorative labels, or collapse into
        a dot without becoming a chip, button, or filter control.
      </p>
    </div>

    <dl class="badge-demo-metrics usage-demo__metrics" aria-label="Badge contract highlights">
      <div>
        <dt>Interaction</dt>
        <dd>none</dd>
      </div>
      <div>
        <dt>Live region</dt>
        <dd>opt-in with dynamic</dd>
      </div>
      <div>
        <dt>Shapes</dt>
        <dd>label / pill / dot</dd>
      </div>
    </dl>
  </section>

  <section class="badge-demo-board" aria-label="Vault state badge examples">
    <div class="badge-demo-record">
      <div class="badge-demo-record-head">
        <div>
          <span>Vault surface</span>
          <strong>travel-profile.visible</strong>
        </div>
        <cv-badge variant="success" pill>verified</cv-badge>
      </div>

      <div class="badge-demo-row">
        <div>
          <span>Visible layer</span>
          <strong>Decoy workspace shown during border review</strong>
        </div>
        <cv-badge variant="primary" pill>
          <span class="badge-demo-mark" slot="prefix">V</span>
          exposed
        </cv-badge>
      </div>

      <div class="badge-demo-row">
        <div>
          <span>Hidden layer</span>
          <strong>Sealed core mounted only after hardware trust check</strong>
        </div>
        <cv-badge variant="neutral" pill>not in visible route</cv-badge>
      </div>

      <div class="badge-demo-row badge-demo-row--warning">
        <div>
          <span>Review queue</span>
          <strong>Two entries need policy confirmation</strong>
        </div>
        <cv-badge variant="warning" dynamic pill>2 pending</cv-badge>
      </div>

      <div class="badge-demo-row badge-demo-row--danger">
        <div>
          <span>Relay state</span>
          <strong>Remote write disabled by local policy</strong>
        </div>
        <cv-badge variant="danger" pill>
          blocked
          <span class="badge-demo-mark" slot="suffix">!</span>
        </cv-badge>
      </div>
    </div>

    <aside class="badge-demo-panel usage-demo__panel" aria-label="Status dot examples">
      <div class="badge-demo-panel-head usage-demo__panel-head">
        <span class="badge-demo-kicker usage-demo__kicker">Dot mode</span>
        <h4>When a label is already nearby, use a labelled dot.</h4>
      </div>

      <div class="badge-demo-dot-list">
        <div>
          <cv-badge variant="success" dot aria-label="Synced"></cv-badge>
          <span>Synced to local index</span>
        </div>
        <div>
          <cv-badge variant="primary" dot pulse aria-label="New vault events"></cv-badge>
          <span>New vault events</span>
        </div>
        <div>
          <cv-badge variant="warning" dot aria-label="Needs review"></cv-badge>
          <span>Needs policy review</span>
        </div>
        <div>
          <cv-badge variant="danger" dot pulse aria-label="Critical relay block"></cv-badge>
          <span>Relay block active</span>
        </div>
      </div>
    </aside>
  </section>

  <section class="badge-demo-section usage-demo__section" aria-labelledby="badge-demo-variants-title">
    <div class="badge-demo-section-header usage-demo__section-header">
      <span class="badge-demo-kicker usage-demo__kicker">Variants and sizes</span>
      <h4 id="badge-demo-variants-title">One component covers passive labels, counts, and semantic tone.</h4>
    </div>

    <div class="badge-demo-matrix" aria-label="Badge variants and size examples">
      <div>
        <span>Neutral</span>
        <cv-badge variant="neutral">Default</cv-badge>
        <cv-badge variant="neutral" pill>Muted pill</cv-badge>
        <cv-badge variant="neutral" pill decorative>Decorative</cv-badge>
        <cv-badge variant="neutral" dot aria-label="Neutral dot"></cv-badge>
      </div>
      <div>
        <span>Primary</span>
        <cv-badge variant="primary">New</cv-badge>
        <cv-badge variant="primary" pill>Visible</cv-badge>
        <cv-badge variant="primary" dot aria-label="Primary dot"></cv-badge>
      </div>
      <div>
        <span>Success</span>
        <cv-badge variant="success">Paired</cv-badge>
        <cv-badge variant="success" pill>Verified</cv-badge>
        <cv-badge variant="success" dot aria-label="Success dot"></cv-badge>
      </div>
      <div>
        <span>Warning</span>
        <cv-badge variant="warning">Pending</cv-badge>
        <cv-badge variant="warning" pill>Needs review</cv-badge>
        <cv-badge variant="warning" dot aria-label="Warning dot"></cv-badge>
      </div>
      <div>
        <span>Danger</span>
        <cv-badge variant="danger">Blocked</cv-badge>
        <cv-badge variant="danger" pill>Threat</cv-badge>
        <cv-badge variant="danger" dot aria-label="Danger dot"></cv-badge>
      </div>
      <div>
        <span>Size</span>
        <cv-badge variant="primary" size="small">3</cv-badge>
        <cv-badge variant="primary">12</cv-badge>
        <cv-badge variant="primary" size="large" pill>99+</cv-badge>
      </div>
    </div>
  </section>
</div>
```
