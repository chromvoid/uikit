# @chromvoid/uikit

Thin Lit UI layer over `@chromvoid/headless-ui`.

## Scope (MVP)

- `cv-theme-provider` + theme engine API
- `cv-accordion` + `cv-accordion-item`
- `cv-alert-dialog`
- `cv-alert`
- `cv-bottom-sheet`
- `cv-breadcrumb` + `cv-breadcrumb-item`
- `cv-button`
- `cv-carousel` + `cv-carousel-slide`
- `cv-checkbox`
- `cv-command-palette` + `cv-command-item`
- `cv-combobox` + `cv-combobox-option`
- `cv-context-menu` + `cv-menu-item`
- `cv-disclosure`
- `cv-dialog`
- `cv-feed` + `cv-feed-article`
- `cv-grid` + `cv-grid-column` + `cv-grid-row` + `cv-grid-cell`
- `cv-landmark`
- `cv-link`
- `cv-listbox` + `cv-option`
- `cv-menu` + `cv-menu-item`
- `cv-menu-button` + `cv-menu-item`
- `cv-meter`
- `cv-popover`
- `cv-radio-group` + `cv-radio`
- `cv-select` + `cv-select-option` + `cv-select-group`
- `cv-slider`
- `cv-slider-multi-thumb`
- `cv-spinbutton`
- `cv-switch`
- `cv-table` + `cv-table-column` + `cv-table-row` + `cv-table-cell`
- `cv-progress`
- `cv-tabs` + `cv-tab` + `cv-tab-panel`
- `cv-toast-region` + imperative toast controller
- `cv-treegrid` + `cv-treegrid-column` + `cv-treegrid-row` + `cv-treegrid-cell`
- `cv-treeview` + `cv-treeitem`
- `cv-toolbar` + `cv-toolbar-item`
- `cv-tooltip`
- `cv-window-splitter`
- vendored Reatom Lit runtime helpers

## Vendored Reatom Lit source

The `src/reatom-lit/*` files are vendored from:

- Repository: `https://github.com/kaifaty/reatom`
- Branch: `LIT_UPDATE`
- Commit: `37ea4f8f6ff7165080f0f6c44603ab508cdf7238`

## Usage

```ts
import {registerUikit} from '@chromvoid/uikit/register'

registerUikit()
```

Optional theme css defaults:

```ts
import '@chromvoid/uikit/theme/tokens.css'
```

## Package-local Workflow

```bash
npm install
npm run lint
npm run test
npm run build
npm pack --dry-run
```

Run local documentation site:

```bash
npm run docs:dev
```

Open the docs dev server through the legacy shortcut:

```bash
npm run demo
```

The interactive playground now lives inside the documentation site at `/guide/playground`.

Build the static docs output used for GitHub Pages:

```bash
npm run docs:build
```
