# cv-qr-code

Display-only QR code renderer for short strings, URLs, and app-owned setup payloads.

Use `cv-qr-code` when an interface needs a scannable handoff from screen to device: public links,
pairing/setup URLs, recovery flows, or other app-owned payloads. The component keeps the QR data
path separate from visual branding so sensitive values can still be passed through the `.value`
property without reflecting back to markup.

## Anatomy

```
<cv-qr-code> (host)
└── <span part="base">
    ├── <svg part="svg" role="img">
    │   ├── <rect part="background">
    │   └── <path part="modules">
    └── <span part="logo" aria-hidden="true">
        ├── <span part="logo-backdrop">
        └── <span part="logo-content">
            └── <slot name="logo">
```

For `module-shape="rounded"` and `module-shape="dot"`, `modules` is rendered as a `<g>`
containing repeated module elements:

```
<g part="modules">
└── <rect|circle part="module">
```

When the component has no value or cannot generate a QR code, it renders:

```
<cv-qr-code> (host)
└── <span part="base" aria-hidden="true">
    └── <span part="placeholder">
```

## Attributes

| Attribute          | Type    | Default     | Description                                                                                                        |
| ------------------ | ------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `value`            | String  | `''`        | Non-secret declarative payload. For sensitive payloads, set the `.value` property instead of attribute.            |
| `error-correction` | String  | `"M"`       | Error correction level: `"L"`, `"M"`, `"Q"`, or `"H"`. Unknown runtime values fall back to `"M"`.                  |
| `quiet-zone`       | Number  | `4`         | Number of light modules around the generated QR matrix.                                                            |
| `module-shape`     | String  | `"square"`  | Module renderer: `"square"`, `"rounded"`, or `"dot"`. Unknown runtime values fall back to `"square"`.              |
| `logo-size`        | String  | `"medium"`  | Center logo overlay size: `"small"`, `"medium"`, or `"large"`. Unknown runtime values fall back to medium styling. |
| `decorative`       | Boolean | `false`     | Hides the rendered SVG from assistive technology.                                                                  |
| `aria-label`       | String  | `"QR code"` | Accessible label for the generated QR image when `decorative` is not set.                                          |

Property-only guidance:

| Property | Type   | Description                                                                                                          |
| -------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| `value`  | String | Preferred path for sensitive payloads such as OTP setup URLs. Property updates do not reflect to the host attribute. |

## Slots

| Slot   | Description                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------ |
| `logo` | Optional centered brand artwork. Use `error-correction="H"` when a logo is present and keep it modest. |

## Accessibility

- Valid, non-decorative QR output renders as `role="img"` with `aria-label`.
- `decorative` removes `role` and `aria-label` and sets `aria-hidden="true"` on the SVG.
- Slotted logo content is rendered inside an `aria-hidden="true"` overlay and is not exposed as a separate accessible image.
- Empty or invalid state renders a placeholder wrapper with `aria-hidden="true"`.
- The encoded payload is never used as the default accessible label.

## CSS Parts

| Part            | Element               | Description                                             |
| --------------- | --------------------- | ------------------------------------------------------- |
| `base`          | `<span>`              | Root visual wrapper                                     |
| `svg`           | `<svg>`               | Square SVG QR surface                                   |
| `background`    | `<rect>`              | Light background and quiet-zone surface                 |
| `modules`       | `<path>` / `<g>`      | Dark QR modules                                         |
| `module`        | `<rect>` / `<circle>` | Individual module for rounded and dot renderers         |
| `logo`          | `<span>`              | Centered logo overlay                                   |
| `logo-backdrop` | `<span>`              | Logo background that preserves contrast over QR modules |
| `logo-content`  | `<span>`              | Wrapper around the `logo` slot                          |
| `placeholder`   | `<span>`              | Empty/invalid placeholder inside base wrapper           |

## CSS Custom Properties

| Property                                | Default                         | Description                         |
| --------------------------------------- | ------------------------------- | ----------------------------------- |
| `--cv-qr-code-size`                     | `192px`                         | Host inline and block size          |
| `--cv-qr-code-background`               | `var(--cv-color-qr-background)` | QR background and quiet-zone color  |
| `--cv-qr-code-foreground`               | `var(--cv-color-qr-foreground)` | QR module color                     |
| `--cv-qr-code-logo-backdrop-background` | `var(--cv-qr-code-background)`  | Center logo backdrop color          |
| `--cv-qr-code-logo-radius`              | `var(--cv-radius-md)`           | Border radius for the logo backdrop |

Custom colors should point to existing ChromVoid `--cv-*` tokens and must preserve strong contrast
between foreground and background so scanners can read the generated QR code.

## Visual States

| Host selector         | Description                                     |
| --------------------- | ----------------------------------------------- |
| `:host([empty])`      | No payload is available                         |
| `:host([invalid])`    | Payload could not be encoded within QR capacity |
| `:host([has-logo])`   | The `logo` slot currently has assigned content  |
| `:host([decorative])` | Rendered QR is hidden from assistive technology |

## Events

None. The component is display-only.

## Usage

### Live Examples

The examples below show the intended presentation range: a default high-contrast QR, a shaped
variant for visual hierarchy, a token-colored variant, and a branded variant with the ChromVoid mark
in the center.

```html
<div class="qr-demo-shell usage-demo" data-demo="qr-code" data-live-demo-height="680">
  <section class="qr-demo-hero usage-demo__hero" aria-labelledby="qr-demo-title">
    <div class="qr-demo-copy usage-demo__copy">
      <span class="qr-demo-kicker usage-demo__kicker">Screen to device handoff</span>
      <h3 id="qr-demo-title">Make the transfer scannable without exposing sensitive payloads</h3>
      <p>
        Use the attribute form for public URLs. For setup secrets and recovery payloads, write
        <code>.value</code> from app state so the encoded data never has to be reflected in markup.
      </p>
      <div class="qr-demo-signal-row" aria-label="QR code reliability guidance">
        <span class="qr-demo-signal">High contrast</span>
        <span class="qr-demo-signal">Quiet zone kept</span>
        <span class="qr-demo-signal">Logo requires H</span>
      </div>
    </div>

    <figure class="qr-demo-feature">
      <span class="qr-demo-feature-label">Public pairing URL</span>
      <cv-qr-code
        class="qr-demo-featured"
        value="https://chromvoid.com/pair?device=vault"
        error-correction="H"
        module-shape="rounded"
        aria-label="ChromVoid pairing URL QR code"
      >
        <img slot="logo" src="/assets/landing/icon-64x64-tight.png" alt="" />
      </cv-qr-code>
      <figcaption>Branded handoff with visible quiet zone and high error correction.</figcaption>
    </figure>
  </section>

  <div class="qr-demo-board usage-demo__workbench" aria-label="QR code rendering variants">
    <figure class="qr-demo-card">
      <cv-qr-code value="https://chromvoid.com" aria-label="ChromVoid website QR code"></cv-qr-code>
      <figcaption>
        <strong>Standard link</strong>
        <span>Default square modules for public, non-secret URLs.</span>
      </figcaption>
    </figure>

    <figure class="qr-demo-card">
      <cv-qr-code
        value="https://chromvoid.com"
        error-correction="H"
        module-shape="dot"
        aria-label="ChromVoid dotted QR code"
      ></cv-qr-code>
      <figcaption>
        <strong>Custom shape</strong>
        <span>Dot modules keep the payload readable while softening the surface.</span>
      </figcaption>
    </figure>

    <figure class="qr-demo-card">
      <cv-qr-code
        class="qr-demo-colored"
        value="https://chromvoid.com"
        error-correction="H"
        module-shape="dot"
        aria-label="ChromVoid colored QR code"
      ></cv-qr-code>
      <figcaption>
        <strong>Token color</strong>
        <span>Use QR-specific custom properties and preserve scanner contrast.</span>
      </figcaption>
    </figure>

    <figure class="qr-demo-card">
      <cv-qr-code
        class="qr-demo-branded"
        value="https://chromvoid.com"
        error-correction="H"
        module-shape="rounded"
        aria-label="ChromVoid branded QR code"
      >
        <img slot="logo" src="/assets/landing/icon-64x64-tight.png" alt="" />
      </cv-qr-code>
      <figcaption>
        <strong>Branded handoff</strong>
        <span>Use high error correction when a centered logo overlays modules.</span>
      </figcaption>
    </figure>
  </div>
</div>
```

### Markup Patterns

```html source-only
<!-- Non-secret declarative value -->
<cv-qr-code value="https://chromvoid.com" aria-label="ChromVoid website QR code"></cv-qr-code>

<!-- Higher error correction -->
<cv-qr-code value="https://chromvoid.com" error-correction="H"></cv-qr-code>

<!-- Branded QR with centered logo -->
<cv-qr-code value="https://chromvoid.com" error-correction="H" module-shape="rounded">
  <img slot="logo" src="/assets/landing/icon-64x64-tight.png" alt="" />
</cv-qr-code>

<!-- Token-backed color customization -->
<cv-qr-code
  class="brand-qr"
  value="https://chromvoid.com"
  error-correction="H"
  module-shape="dot"
></cv-qr-code>

<!-- Decorative QR when nearby copy already names the action -->
<cv-qr-code value="https://chromvoid.com" decorative></cv-qr-code>
```

```css
.brand-qr {
  --cv-qr-code-background: var(--cv-color-qr-background);
  --cv-qr-code-foreground: var(--cv-color-primary-darker);
  --cv-qr-code-logo-backdrop-background: var(--cv-qr-code-background);
}
```

```ts
// Preferred for sensitive payloads.
const qrCode = document.querySelector('cv-qr-code')!
qrCode.value = 'otpauth://totp/ChromVoid?secret=...'
```

## Scan Reliability

- Use `error-correction="H"` whenever a logo overlays the QR matrix.
- Keep the quiet zone visible and avoid setting `quiet-zone` below the default for branded QR codes.
- Keep the background light unless the custom color pair is manually scan-verified across common camera apps.
- Keep logo content modest; `logo-size="large"` should be reserved for short payloads with manual scan verification.
- Custom foreground/background colors must remain high contrast in both light and dark themes.
