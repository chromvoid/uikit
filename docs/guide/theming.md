# Theming

UIKit tokens follow the `--cv-*` naming scheme and can be changed statically or at runtime.

## Baseline tokens

Import the packaged defaults first:

```ts
import '@chromvoid/uikit/theme/tokens.css'
```

Those tokens cover colors, spacing, typography, radius, motion, z-index, and control sizing for
both light and dark modes.

## Define a named custom theme

```ts
import {defineTheme, applyTheme} from '@chromvoid/uikit'

defineTheme('sunset', {
  '--cv-color-bg': '#101722',
  '--cv-color-surface': '#1b2231',
  '--cv-color-primary': '#ff8a65',
  '--cv-color-success': '#73f4c8',
  '--cv-color-text': '#f1f5ff',
  '--cv-color-border': '#31415b',
})

applyTheme(document, 'sunset')
```

## Use `cv-theme-provider` for scoped theming

```html
<cv-theme-provider theme="sunset" mode="dark">
  <cv-button>Scoped theme button</cv-button>
  <cv-checkbox checked>Scoped checkbox</cv-checkbox>
</cv-theme-provider>
```

`mode` supports `light`, `dark`, and `system`. In `system` mode the provider follows
`prefers-color-scheme`.

## Apply themes programmatically

```ts
import {applyTheme} from '@chromvoid/uikit/theme'

const panel = document.querySelector('#settings-panel')

if (panel) {
  applyTheme(panel, 'sunset')
}
```

## Reference surface

The full token and provider contract is documented on
[cv-theme-provider](/components/theme-provider).

## Default token source

`src/theme/tokens.css`

Use this file as a baseline and override only the tokens you need per product.
