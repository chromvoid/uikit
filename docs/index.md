---
layout: home

hero:
  name: ChromVoid UIKit
  text: Production-ready Lit components for ChromVoid surfaces
  tagline: Accessible web components, headless behavior from @chromvoid/headless-ui, and token-driven theming packaged for real product work.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Open Playground
      link: /guide/playground
    - theme: alt
      text: Browse Components
      link: /components/

features:
  - title: Spec-backed reference
    details: Component API pages are generated from the specs directory so docs stay aligned with the source of truth.
  - title: Playground included
    details: The old standalone demo now lives inside the docs as an interactive page with working controllers and live states.
  - title: GitHub Pages ready
    details: Static-safe routing, generated reference pages, and a deploy workflow ship with the package.
---

<section class="uikit-intro">
  <p>
    UIKit is the surface layer for ChromVoid products. Behavior stays in headless models, while the
    package exposes a focused set of Lit custom elements, theme tokens, and controller helpers for
    real application flows.
  </p>
</section>

<div class="uikit-stats">
  <article class="uikit-stat">
    <span class="uikit-stat-value">45</span>
    <span class="uikit-stat-label">Spec-backed reference pages</span>
  </article>
  <article class="uikit-stat">
    <span class="uikit-stat-value">1 site</span>
    <span class="uikit-stat-label">Guides, playground, and API reference in one place</span>
  </article>
  <article class="uikit-stat">
    <span class="uikit-stat-value">0 rewrites</span>
    <span class="uikit-stat-label">GitHub Pages-safe output with static routing</span>
  </article>
</div>

## Quick Start

```ts
import {registerUikit} from '@chromvoid/uikit/register'
import '@chromvoid/uikit/theme/tokens.css'

registerUikit()
```

```html
<cv-theme-provider mode="dark">
  <cv-button>Unlock vault</cv-button>
  <cv-checkbox checked>Arm sync</cv-checkbox>
  <cv-progress value="58" aria-label="Migration progress"></cv-progress>
</cv-theme-provider>
```

## How The Package Is Layered

<div class="component-grid">
  <section class="component-card">
    <h3>Headless First</h3>
    <p>
      Interaction logic comes from <code>@chromvoid/headless-ui</code>, so state machines and
      keyboard behavior stay testable outside the visual layer.
    </p>
  </section>
  <section class="component-card">
    <h3>Thin Lit Adapters</h3>
    <p>
      Custom elements adapt those headless models into a consistent DOM contract with parts, slots,
      attributes, and theme-token hooks.
    </p>
  </section>
  <section class="component-card">
    <h3>Theme As Data</h3>
    <p>
      Use static tokens, named runtime themes, or <code>cv-theme-provider</code> to scope a visual
      identity without forking component logic.
    </p>
  </section>
</div>

## Live Playground

<ClientOnly>
  <UIKitPlayground compact />
</ClientOnly>
