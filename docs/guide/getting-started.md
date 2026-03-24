# Getting Started

## Install

```bash
npm i @chromvoid/uikit lit
```

## Register components once

`@chromvoid/uikit/register` exports the bulk registration entry for all web components.

```ts
import {registerUikit} from '@chromvoid/uikit/register'
import '@chromvoid/uikit/theme/tokens.css'

registerUikit()
```

## Render your first surface

```html
<cv-theme-provider mode="dark">
  <cv-button>Primary action</cv-button>
  <cv-switch checked></cv-switch>
  <cv-progress value="40" max="100" aria-label="Bootstrap progress"></cv-progress>
</cv-theme-provider>
```

## Scope a theme

Use `cv-theme-provider` for a subtree, or apply a named theme at runtime.

```ts
import {applyTheme, defineTheme} from '@chromvoid/uikit/theme'

defineTheme('amber', {
  '--cv-color-primary': '#ff9d4d',
  '--cv-color-primary-dark': '#e67d2e',
  '--cv-color-surface': '#171d29',
  '--cv-color-border': '#31415b',
})

applyTheme(document, 'amber')
```

## Preview locally

The documentation site is now the primary interactive surface for the package.

```bash
npm run docs:dev
npm run demo
```

- `npm run docs:dev` starts VitePress with generated reference pages.
- `npm run demo` is a compatibility alias that opens the docs dev server.

## Next steps

- Read [Architecture](/guide/architecture) for package layout and entry points.
- Use [Theming](/guide/theming) to customize tokens and color modes.
- Open [Playground](/guide/playground) to test working component compositions.
- Browse [Components](/components/) for full API reference pages.
