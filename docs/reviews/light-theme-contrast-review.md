# UIKit docs light theme contrast review

Date: 2026-07-04

Target: `https://uikit.chromvoid.com`

Scope: rendered text contrast in the published UIKit VitePress docs light theme. The audit used
WCAG AA text thresholds: `4.5:1` for normal text and `3:1` for large text. Hidden and disabled text
was excluded.

Route source: `packages/uikit/docs/.vitepress/dist/**/*.html`, excluding `404.html`.

Visit policy: one browser navigation per listed URL. The pass opened 72 URLs once each in Chromium,
with `vitepress-theme-appearance=light`, `data-theme="light"`, `colorScheme=light`, and a
`1440x1100` viewport. All URLs returned HTTP `200`.

## Summary

| Finding | Severity | Affected pages | Lowest ratio | Required |
| --- | --- | ---: | ---: | ---: |
| Footer VitePress links use a too-light brand cyan | P1 | 71 | `2.25:1` | `4.5:1` |
| Light code-block syntax colors fail on docs code background | P1 | 12 | `3.22:1` | `4.5:1` |
| Component catalog stat-card inline code is too light | P2 | 1 | `1.99:1` | `4.5:1` |
| `cv-field` error text is slightly under threshold in light theme | P2 | 1 | `4.29:1` | `4.5:1` |

The home page `/` had no text-contrast failures in this pass.

## Findings

### P1. Footer links fail across nearly every docs page

The VitePress doc footer renders the edit link and previous/next page titles in `rgb(0 184 204)`
over the light docs background `rgb(244 248 251)`, producing `2.25:1`. This is well below the
`4.5:1` requirement for normal text.

Examples:

| URL | Text | Ratio |
| --- | --- | ---: |
| `/guide/architecture.html` | `Edit this page on GitHub` | `2.25:1` |
| `/guide/architecture.html` | `Getting Started` | `2.25:1` |
| `/components/` | `cv-theme-provider` | `2.25:1` |
| `/components/window-splitter.html` | `Edit this page on GitHub` | `2.25:1` |

Likely source: `packages/uikit/docs/.vitepress/theme/custom.css`
light theme maps `--vp-c-brand-1` to `--cv-color-primary` at line 2225. VitePress footer links are
outside `.vp-doc a`, so they do not receive the darker light-theme override at lines 2353-2369.

Recommended fix: in the light theme, either map the VitePress brand link token to
`--cv-color-primary-darker` or add a scoped `.VPDocFooter` light-theme override for footer anchors.
Keep the source of truth in docs theme tokens rather than patching individual generated pages.

Affected pages: every audited page except `/`.

### P1. Code-block syntax colors fail in light theme

Several Shiki `github-light` token colors fall below `4.5:1` on the docs light code background
`rgb(242 246 251)`.

Observed failing token groups:

| Token color | Example text | Ratio |
| --- | --- | ---: |
| `rgb(227 98 9)` | `value`, `activeId`, `--cv-color-accent` | `3.22:1` |
| `rgb(215 58 73)` | `import`, `type`, `const`, `=` | `4.22:1` |
| `rgb(34 134 58)` | `cv-accordion`, `cv-theme-provider` | `4.26:1` |
| `rgb(106 115 125)` | comments such as `<!-- Basic context menu -->` | `4.44:1` |

Likely source: `packages/uikit/docs/.vitepress/theme/custom.css`
sets `--vp-code-block-bg: var(--cv-color-surface-2)` at line 2235 and styles code containers at
lines 2446-2454, but the Shiki span colors remain from the `github-light` theme.

Recommended fix: switch the light code theme to an accessible high-contrast palette, or override the
specific Shiki token colors in `[data-theme='light']` so every token clears `4.5:1` on
`--vp-code-block-bg`. Changing only the background will not fix the orange token, which already
fails on very light surfaces.

Affected pages:

- `/guide/getting-started.html`
- `/guide/theming.html`
- `/components/accordion.html`
- `/components/code-input.html`
- `/components/context-menu.html`
- `/components/image-viewer.html`
- `/components/menu.html`
- `/components/qr-code.html`
- `/components/shortcut.html`
- `/components/theme-palette.html`
- `/components/theme-provider.html`
- `/components/tooltip.html`

### P2. Component catalog inline code label fails

On `/components/`, the stat-card label `Synced from specs/components` contains inline
`<code>specs/components</code>` rendered as `rgb(0 184 204)` on `rgb(230 234 240)`, producing only
`1.99:1`.

Likely source:

- `packages/uikit/docs/.vitepress/theme/components/ComponentCatalog.vue`
  uses `<span class="uikit-stat-label">Synced from <code>specs/components</code></span>` at line 26.
- `packages/uikit/docs/.vitepress/theme/custom.css` only covers
  inline code inside `p`, `li`, `td`, and `th` at lines 2446-2454, so this `span code` case is not
  covered.

Recommended fix: add a light-theme inline-code rule for `.uikit-stat-label code` or generalize the
docs inline-code selector to cover non-paragraph labels while keeping contrast against stat-card
surfaces.

### P2. `cv-field` error text is slightly under AA in light theme

On `/guide/playground.html`, the invalid `cv-field` error text
`Route is not available in the visible profile.` renders as `rgb(230 52 43)` on white, producing
`4.29:1`. The text is small (`12px`), so it requires `4.5:1`.

Likely source:

- `packages/uikit/src/components/cv-field.ts` defaults
  `[part='error']` to `--cv-field-error-color, var(--cv-color-danger, #ff6b6b)` at lines 92-94.
- `packages/uikit/src/theme/tokens.css` light theme sets
  `--cv-palette-danger` / `--cv-color-danger` at lines 489 and 566.

Recommended fix: treat error text as a text role, not as the raw danger accent. Add or reuse a
light-theme danger text token and make `cv-field` default `--cv-field-error-color` resolve to that
text-safe token, or use `--cv-color-danger-dark` for the field error fallback.

## Page Matrix

`Issues` are deduplicated rendered text nodes from the browser audit, not separate root causes.

| URL | Status | Issues | Categories |
| --- | ---: | ---: | --- |
| `/` | 200 | 0 | - |
| `/guide/architecture.html` | 200 | 3 | footer links |
| `/guide/getting-started.html` | 200 | 4 | footer links, code highlighting |
| `/guide/playground.html` | 200 | 3 | footer links, field error text |
| `/guide/theming.html` | 200 | 8 | footer links, code highlighting |
| `/components/` | 200 | 3 | footer links, catalog code label |
| `/components/accordion.html` | 200 | 19 | footer links, code highlighting |
| `/components/alert.html` | 200 | 3 | footer links |
| `/components/badge.html` | 200 | 3 | footer links |
| `/components/bottom-sheet.html` | 200 | 3 | footer links |
| `/components/breadcrumb.html` | 200 | 3 | footer links |
| `/components/button-group.html` | 200 | 3 | footer links |
| `/components/button.html` | 200 | 3 | footer links |
| `/components/callout.html` | 200 | 3 | footer links |
| `/components/card.html` | 200 | 3 | footer links |
| `/components/carousel.html` | 200 | 3 | footer links |
| `/components/checkbox.html` | 200 | 3 | footer links |
| `/components/chip-group.html` | 200 | 3 | footer links |
| `/components/chip.html` | 200 | 3 | footer links |
| `/components/code-input.html` | 200 | 8 | footer links, code highlighting |
| `/components/combobox.html` | 200 | 3 | footer links |
| `/components/context-menu.html` | 200 | 23 | footer links, code highlighting |
| `/components/copy-button.html` | 200 | 3 | footer links |
| `/components/date-picker.html` | 200 | 3 | footer links |
| `/components/dialog.html` | 200 | 3 | footer links |
| `/components/disclosure.html` | 200 | 3 | footer links |
| `/components/drawer.html` | 200 | 3 | footer links |
| `/components/dropzone.html` | 200 | 3 | footer links |
| `/components/empty-state.html` | 200 | 3 | footer links |
| `/components/feed.html` | 200 | 3 | footer links |
| `/components/field.html` | 200 | 3 | footer links |
| `/components/fieldset.html` | 200 | 3 | footer links |
| `/components/grid.html` | 200 | 3 | footer links |
| `/components/guidance-anchor.html` | 200 | 3 | footer links |
| `/components/guidance-panel.html` | 200 | 3 | footer links |
| `/components/image-viewer.html` | 200 | 27 | footer links, code highlighting |
| `/components/input.html` | 200 | 3 | footer links |
| `/components/kbd.html` | 200 | 3 | footer links |
| `/components/link.html` | 200 | 3 | footer links |
| `/components/listbox.html` | 200 | 3 | footer links |
| `/components/menu.html` | 200 | 9 | footer links, code highlighting |
| `/components/meter.html` | 200 | 3 | footer links |
| `/components/number.html` | 200 | 3 | footer links |
| `/components/operation-queue.html` | 200 | 3 | footer links |
| `/components/option.html` | 200 | 3 | footer links |
| `/components/pagination.html` | 200 | 3 | footer links |
| `/components/popover.html` | 200 | 3 | footer links |
| `/components/progress-ring.html` | 200 | 3 | footer links |
| `/components/progress.html` | 200 | 3 | footer links |
| `/components/qr-code.html` | 200 | 19 | footer links, code highlighting |
| `/components/radio-group.html` | 200 | 3 | footer links |
| `/components/select.html` | 200 | 3 | footer links |
| `/components/shortcut.html` | 200 | 6 | footer links, code highlighting |
| `/components/sidebar.html` | 200 | 3 | footer links |
| `/components/skeleton.html` | 200 | 3 | footer links |
| `/components/spinner.html` | 200 | 3 | footer links |
| `/components/status-indicator.html` | 200 | 3 | footer links |
| `/components/steps.html` | 200 | 3 | footer links |
| `/components/switch.html` | 200 | 3 | footer links |
| `/components/table.html` | 200 | 3 | footer links |
| `/components/tabs.html` | 200 | 3 | footer links |
| `/components/task-list.html` | 200 | 3 | footer links |
| `/components/textarea.html` | 200 | 3 | footer links |
| `/components/theme-palette.html` | 200 | 12 | footer links, code highlighting |
| `/components/theme-provider.html` | 200 | 16 | footer links, code highlighting |
| `/components/time-picker.html` | 200 | 3 | footer links |
| `/components/toast.html` | 200 | 3 | footer links |
| `/components/toolbar.html` | 200 | 3 | footer links |
| `/components/tooltip.html` | 200 | 12 | footer links, code highlighting |
| `/components/treegrid.html` | 200 | 3 | footer links |
| `/components/treeview.html` | 200 | 3 | footer links |
| `/components/window-splitter.html` | 200 | 2 | footer links |
