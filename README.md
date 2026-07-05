# @chromvoid/uikit

[![npm version](https://img.shields.io/npm/v/@chromvoid/uikit?color=65d7ff)](https://www.npmjs.com/package/@chromvoid/uikit)
[![CI](https://github.com/chromvoid/uikit/actions/workflows/ci.yml/badge.svg)](https://github.com/chromvoid/uikit/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-uikit.chromvoid.com-65d7ff)](https://uikit.chromvoid.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-2ea043.svg)](LICENSE)

ChromVoid UIKit is a Lit-based custom element layer over
[`@chromvoid/headless-ui`](https://github.com/chromvoid/headless-ui). It provides the product
surface components, theme tokens, and controller helpers used across ChromVoid interfaces.

## Links

- [Documentation](https://uikit.chromvoid.com/)
- [Component reference](https://uikit.chromvoid.com/components/)
- [Playground](https://uikit.chromvoid.com/guide/playground.html)
- [npm package](https://www.npmjs.com/package/@chromvoid/uikit)
- [GitHub repository](https://github.com/chromvoid/uikit)

## Install

```bash
bun add @chromvoid/uikit lit
```

`lit` is a peer dependency. Use the package with any npm-compatible client if your application does
not use Bun:

```bash
npm install @chromvoid/uikit lit
```

## Quick Start

Register the custom elements once at the browser shell boundary and load the default token surface:

```ts
import {registerUikit} from '@chromvoid/uikit/register'
import '@chromvoid/uikit/theme/tokens.css'

registerUikit()
```

Then compose the documented custom elements directly:

```html
<cv-theme-provider mode="dark">
  <cv-button variant="primary">Unlock vault</cv-button>
  <cv-checkbox checked>Arm sync</cv-checkbox>
  <cv-progress value="58" aria-label="Migration progress"></cv-progress>
</cv-theme-provider>
```

Use `cv-theme-provider` when a subtree needs a scoped color mode or a named runtime theme.

## What Is Included

- Accessible Lit web components backed by headless interaction contracts.
- Theme tokens, `cv-theme-provider`, and runtime theme helpers.
- Dialog and toast controllers for application-level flows.
- Spec-backed documentation generated from `specs/components`.
- A VitePress playground for validating composed component states.
- Reatom Lit runtime helpers exported under `@chromvoid/uikit/reatom-lit`.

## Entry Points

```ts
import {registerUikit} from '@chromvoid/uikit/register'
import {CVButton} from '@chromvoid/uikit/components'
import {applyTheme, defineTheme} from '@chromvoid/uikit/theme'
import {createToastController} from '@chromvoid/uikit/toast'
```

The package also exports:

- `@chromvoid/uikit/theme/tokens.css`
- `@chromvoid/uikit/html`
- `@chromvoid/uikit/reatom-lit`
- `@chromvoid/uikit/dialog`
- `@chromvoid/uikit/styles/uno-utilities`

## Component Coverage

UIKit covers application primitives such as:

- actions: `cv-button`, `cv-button-group`, `cv-toolbar`, `cv-shortcut`
- feedback: `cv-alert`, `cv-alert-dialog`, `cv-callout`, `cv-toast`, `cv-progress`
- forms: `cv-input`, `cv-textarea`, `cv-checkbox`, `cv-radio-group`, `cv-select`, `cv-combobox`
- navigation and overlays: `cv-menu`, `cv-popover`, `cv-dialog`, `cv-drawer`, `cv-bottom-sheet`
- data and structure: `cv-table`, `cv-treegrid`, `cv-grid`, `cv-listbox`, `cv-card`, `cv-feed`
- product surfaces: `cv-sidebar`, `cv-image-viewer`, `cv-operation-queue`, `cv-window-splitter`

See the [component reference](https://uikit.chromvoid.com/components/) for the full API, events,
slots, CSS parts, and live demos.

## Local Workflow

```bash
bun install --frozen-lockfile
bun run lint
bun run test
bun run build
bun pm pack --dry-run
```

Run the documentation site locally:

```bash
bun run docs:dev
```

Build the static docs output used for GitHub Pages:

```bash
bun run docs:build
```

## License

Released under the [MIT license](LICENSE).
