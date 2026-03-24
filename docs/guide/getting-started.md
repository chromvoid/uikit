# Getting Started

## Install

```bash
npm i @chromvoid/uikit lit
```

## Register components

`@chromvoid/uikit/register` exports the bulk registration entry for all web components.

```ts
import {registerUikit} from '@chromvoid/uikit/register'
import '@chromvoid/uikit/theme/tokens.css'

registerUikit()
```

## Render in HTML

```html
<cv-button>Primary action</cv-button>
<cv-switch checked></cv-switch>
<cv-progress value="40" max="100"></cv-progress>
```

## Local docs and demo

```bash
npm run docs:dev
npm run demo
```
