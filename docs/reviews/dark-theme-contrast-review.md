# UIKit docs dark theme contrast review

Date: 2026-07-05

Target: `https://uikit.chromvoid.com`

Scope: rendered text contrast in the published UIKit VitePress docs dark theme. The audit used
WCAG AA text thresholds: `4.5:1` for normal text and `3:1` for large text. Hidden and disabled text
was excluded.

Route source: `packages/uikit/docs/.vitepress/dist/**/*.html`, excluding `404.html`.

Visit policy: one browser navigation per listed URL. The pass opened 73 URLs once each in Chromium,
with `vitepress-theme-appearance=dark`, `data-theme="dark"`, `colorScheme=dark`, and a
`1440x1100` viewport. 72 URLs returned HTTP `200`; `/reviews/light-theme-contrast-review.html`
returned HTTP `404` on the published site and was not audited as a rendered docs page.

The browser scan measures computed foreground color against computed background color. After the
pass, gradient-backed button findings were checked against their actual CSS gradients and excluded
as false positives.

## Summary

| Finding | Severity | Affected pages | Lowest ratio | Required |
| --- | --- | ---: | ---: | ---: |
| Live-demo primary trigger text uses a dark surface token on dark surfaces | P1 | 2 | `1.08:1` | `4.5:1` |
| Dark Shiki comment tokens fail on the docs code-block background | P2 | 7 | `3.97:1` | `4.5:1` |

All regular docs pages, navigation, footer links, component catalog cards, and most live demos passed
the rendered text-contrast pass.

## Findings

### P1. Live-demo primary trigger text is unreadable

Two iframe live demos render primary trigger labels with dark surface text over a dark demo surface.
Both are small uppercase labels, so they require `4.5:1`.

Examples:

| URL | Text | Foreground | Background | Ratio |
| --- | --- | --- | --- | ---: |
| `/components/drawer.html` | `Policy` | `rgb(16 23 34)` | `rgb(11 13 18)` | `1.08:1` |
| `/components/tooltip.html` | `Visible profile` | `rgb(16 23 34)` | `rgb(11 13 18)` | `1.08:1` |

Likely source:

- `packages/uikit/docs/.vitepress/theme/live-demo-examples/drawer.css` lines 165-169 set
  `.drawer-demo-drawer--settings::part(trigger)` to `color: var(--live-demo-surface)` while keeping
  `background: var(--live-demo-gradient-panel)`.
- `packages/uikit/docs/.vitepress/theme/live-demo-examples/tooltip.css` lines 264-268 set
  `.tooltip-demo-hotspot--primary` to `color: var(--live-demo-surface)` while keeping
  `background: var(--live-demo-gradient-primary-soft)`.

Recommended fix: keep the source of truth in the live-demo styles. If these triggers remain on dark
surface gradients, use `--live-demo-text` or `--live-demo-text-strong`. If they should be filled
primary/cyan controls, change the background to a real primary surface and pair it with
`--live-demo-on-cyan` / `--cv-color-on-primary`.

### P2. Dark code-block comments are below AA

Shiki comment spans using `rgb(106 115 125)` render on the dark docs code background
`rgb(9 16 25)`, producing `3.97:1`. The text is normal-sized `14px` code, so it requires `4.5:1`.

Examples:

| URL | Text | Ratio |
| --- | --- | ---: |
| `/components/accordion.html` | `<!-- Controlled single mode (default) -->` | `3.97:1` |
| `/components/context-menu.html` | `// 'pointer' \| 'keyboard' \| 'programmatic' \| null` | `3.97:1` |
| `/components/theme-provider.html` | `/* overrides */` | `3.97:1` |

Likely source: `packages/uikit/docs/.vitepress/theme/custom.css` sets the dark code block background
at line 16. The file has light-theme Shiki overrides at lines 2457-2470, but no matching dark-theme
override for the `--shiki-dark:#6A737D` comment token.

Recommended fix: add a scoped dark-theme Shiki override for the comment token, for example mapping
`--shiki-dark:#6A737D` to `--cv-color-text-muted` or a dedicated docs code-comment token that clears
`4.5:1` on `--vp-code-block-bg`. Keep it in the docs theme layer instead of changing individual
markdown examples.

Affected pages:

- `/components/accordion.html`
- `/components/code-input.html`
- `/components/context-menu.html`
- `/components/image-viewer.html`
- `/components/qr-code.html`
- `/components/theme-provider.html`
- `/components/tooltip.html`

## Excluded observations

The raw computed-color pass also flagged five gradient-backed CTAs because their CSS uses
`background` gradients without a solid `background-color`, so the scanner fell through to the page
background. These were excluded after source checks:

- `.VPButton.medium.brand` at `packages/uikit/docs/.vitepress/theme/custom.css` lines 333-337 uses
  `color: #041018` over a `#71d7ff` to `#3394ca` gradient. The lower endpoint contrast is `5.70:1`.
- `.component-action-primary` at `packages/uikit/docs/.vitepress/theme/custom.css` lines 872-877 uses
  `color: #03121b` over an alpha-blended `#70dbff` to `#3c8bc0` gradient. The lower composited
  endpoint contrast is `4.61:1`.

Affected raw-scan labels were `Get Started`, `Start setup`, `Quick start`, and `Open playground`.

## Page Matrix

`Issues` are confirmed rendered text failures after excluding the gradient-backed CTA false
positives.

| URL | Status | Issues | Categories |
| --- | ---: | ---: | --- |
| `/` | 200 | 0 | - |
| `/guide/architecture.html` | 200 | 0 | - |
| `/guide/getting-started.html` | 200 | 0 | - |
| `/guide/playground.html` | 200 | 0 | - |
| `/guide/theming.html` | 200 | 0 | - |
| `/components/` | 200 | 0 | - |
| `/components/accordion.html` | 200 | 8 | code comments |
| `/components/alert.html` | 200 | 0 | - |
| `/components/badge.html` | 200 | 0 | - |
| `/components/bottom-sheet.html` | 200 | 0 | - |
| `/components/breadcrumb.html` | 200 | 0 | - |
| `/components/button-group.html` | 200 | 0 | - |
| `/components/button.html` | 200 | 0 | - |
| `/components/callout.html` | 200 | 0 | - |
| `/components/card.html` | 200 | 0 | - |
| `/components/carousel.html` | 200 | 0 | - |
| `/components/checkbox.html` | 200 | 0 | - |
| `/components/chip-group.html` | 200 | 0 | - |
| `/components/chip.html` | 200 | 0 | - |
| `/components/code-input.html` | 200 | 4 | code comments |
| `/components/combobox.html` | 200 | 0 | - |
| `/components/context-menu.html` | 200 | 5 | code comments |
| `/components/copy-button.html` | 200 | 0 | - |
| `/components/date-picker.html` | 200 | 0 | - |
| `/components/dialog.html` | 200 | 0 | - |
| `/components/disclosure.html` | 200 | 0 | - |
| `/components/drawer.html` | 200 | 1 | demo trigger text |
| `/components/dropzone.html` | 200 | 0 | - |
| `/components/empty-state.html` | 200 | 0 | - |
| `/components/feed.html` | 200 | 0 | - |
| `/components/field.html` | 200 | 0 | - |
| `/components/fieldset.html` | 200 | 0 | - |
| `/components/grid.html` | 200 | 0 | - |
| `/components/guidance-anchor.html` | 200 | 0 | - |
| `/components/guidance-panel.html` | 200 | 0 | - |
| `/components/image-viewer.html` | 200 | 1 | code comments |
| `/components/input.html` | 200 | 0 | - |
| `/components/kbd.html` | 200 | 0 | - |
| `/components/link.html` | 200 | 0 | - |
| `/components/listbox.html` | 200 | 0 | - |
| `/components/menu.html` | 200 | 0 | - |
| `/components/meter.html` | 200 | 0 | - |
| `/components/number.html` | 200 | 0 | - |
| `/components/operation-queue.html` | 200 | 0 | - |
| `/components/option.html` | 200 | 0 | - |
| `/components/pagination.html` | 200 | 0 | - |
| `/components/popover.html` | 200 | 0 | - |
| `/components/progress-ring.html` | 200 | 0 | - |
| `/components/progress.html` | 200 | 0 | - |
| `/components/qr-code.html` | 200 | 6 | code comments |
| `/components/radio-group.html` | 200 | 0 | - |
| `/components/select.html` | 200 | 0 | - |
| `/components/shortcut.html` | 200 | 0 | - |
| `/components/sidebar.html` | 200 | 0 | - |
| `/components/skeleton.html` | 200 | 0 | - |
| `/components/spinner.html` | 200 | 0 | - |
| `/components/status-indicator.html` | 200 | 0 | - |
| `/components/steps.html` | 200 | 0 | - |
| `/components/switch.html` | 200 | 0 | - |
| `/components/table.html` | 200 | 0 | - |
| `/components/tabs.html` | 200 | 0 | - |
| `/components/task-list.html` | 200 | 0 | - |
| `/components/textarea.html` | 200 | 0 | - |
| `/components/theme-palette.html` | 200 | 0 | - |
| `/components/theme-provider.html` | 200 | 1 | code comments |
| `/components/time-picker.html` | 200 | 0 | - |
| `/components/toast.html` | 200 | 0 | - |
| `/components/toolbar.html` | 200 | 0 | - |
| `/components/tooltip.html` | 200 | 6 | code comments, demo trigger text |
| `/components/treegrid.html` | 200 | 0 | - |
| `/components/treeview.html` | 200 | 0 | - |
| `/components/window-splitter.html` | 200 | 0 | - |
| `/reviews/light-theme-contrast-review.html` | 404 | 0 | unpublished on target |
