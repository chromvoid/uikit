---
layout: home

hero:
  name: ChromVoid UIKit
  text: UI kit for ChromVoid product surfaces
  tagline: Accessible Lit web components, headless behavior from @chromvoid/headless-ui, and token-driven theming shaped for production application work.
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
    details: The interactive playground lives inside the docs and covers live controller and state scenarios.
  - title: GitHub Pages ready
    details: Static-safe routing, generated reference pages, and a deploy workflow ship with the package.
---

<section class="uikit-intro">
  <div class="uikit-intro-copy">
    <p class="components-kicker">Surface layer</p>
    <h2 class="uikit-intro-title">Built for product shells, not isolated gallery demos.</h2>
  </div>
  <p class="uikit-intro-body">
    UIKit is the surface layer for ChromVoid products. Behavior stays in headless models, while the
    package exposes a focused set of Lit custom elements, theme tokens, and controller helpers for
    real application flows.
  </p>
  <ul class="uikit-intro-signals" aria-label="UIKit focus areas">
    <li class="uikit-intro-signal">
      <span class="uikit-intro-signal-title">Custom elements</span>
      <span class="uikit-intro-signal-copy">Composable slots, parts, and DOM contracts.</span>
    </li>
    <li class="uikit-intro-signal">
      <span class="uikit-intro-signal-title">Theme tokens</span>
      <span class="uikit-intro-signal-copy">Scoped runtime themes without forking component logic.</span>
    </li>
    <li class="uikit-intro-signal">
      <span class="uikit-intro-signal-title">Controllers</span>
      <span class="uikit-intro-signal-copy">Dialog and toast flows kept close to the kit.</span>
    </li>
  </ul>
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

## Why This Site Exists

<div class="component-grid">
  <section class="component-card">
    <p class="components-kicker">Reference</p>
    <h3>Docs stay close to the specs</h3>
    <p>
      Component pages are generated from <code>specs/components</code>, so the published API
      reference stays aligned with the real contract instead of drifting into hand-maintained copy.
    </p>
  </section>
  <section class="component-card">
    <p class="components-kicker">Tooling</p>
    <h3>One static surface</h3>
    <p>
      Guides, reference pages, and the live playground ship from the same VitePress build and work
      under the GitHub Pages subpath without rewrite assumptions.
    </p>
  </section>
  <section class="component-card">
    <p class="components-kicker">Workflow</p>
    <h3>Built for product teams</h3>
    <p>
      Start with install and registration, move into theming and architecture, then validate
      composed states in the playground before wiring a real shell.
    </p>
  </section>
</div>

## Quick Start

<section class="uikit-quickstart" aria-label="Quick start setup and preview">
  <div class="uikit-quickstart-copy">
    <p class="components-kicker">Install path</p>
    <h3>Register once, load tokens, compose real product states.</h3>
    <p>
      The default entry point keeps registration explicit while the theme provider scopes the visual
      system around the components you render.
    </p>
    <ol class="uikit-quickstart-steps" aria-label="Quick start sequence">
      <li>
        <span>01</span>
        <strong>Wire the bundle</strong>
        <p>Import the bulk register entry and the token CSS in the browser entry.</p>
      </li>
      <li>
        <span>02</span>
        <strong>Scope the surface</strong>
        <p>Wrap composed UI in <code>cv-theme-provider</code> when a product shell owns theme mode.</p>
      </li>
      <li>
        <span>03</span>
        <strong>Validate the state</strong>
        <p>Render controls, selection, and progress together before moving into a feature route.</p>
      </li>
    </ol>
  </div>

  <div class="uikit-quickstart-stage">
    <div class="uikit-quickstart-code-grid" aria-label="Quick start code snippets">
      <figure class="uikit-quickstart-code">
        <figcaption>entry.ts</figcaption>
        <pre><code>import &#123;registerUikit&#125; from '@chromvoid/uikit/register'
import '@chromvoid/uikit/theme/tokens.css'

registerUikit()</code></pre>
      </figure>
      <figure class="uikit-quickstart-code">
        <figcaption>shell.html</figcaption>
        <pre><code>&lt;cv-theme-provider mode="dark"&gt;
  &lt;cv-button&gt;Unlock vault&lt;/cv-button&gt;
  &lt;cv-checkbox checked&gt;Arm sync&lt;/cv-checkbox&gt;
  &lt;cv-progress value="58" aria-label="Migration progress"&gt;&lt;/cv-progress&gt;
&lt;/cv-theme-provider&gt;</code></pre>
      </figure>
    </div>

    <cv-theme-provider class="uikit-quickstart-preview" mode="dark">
      <div class="uikit-quickstart-preview-copy">
        <span>Rendered state</span>
        <strong>Vault migration controls</strong>
      </div>
      <div class="uikit-quickstart-preview-actions">
        <cv-button>Unlock vault</cv-button>
        <cv-checkbox checked>Arm sync</cv-checkbox>
      </div>
      <cv-progress value="58" aria-label="Migration progress"></cv-progress>
    </cv-theme-provider>
  </div>
</section>

## How The Package Is Layered

<div class="uikit-architecture-strip">
  <article class="uikit-architecture-step">
    <span>01</span>
    <h3>Headless models</h3>
    <p>
      Interaction and accessibility contracts stay in <code>@chromvoid/headless-ui</code> where
      they remain testable outside the render layer.
    </p>
  </article>
  <article class="uikit-architecture-step">
    <span>02</span>
    <h3>Lit adapters</h3>
    <p>
      UIKit custom elements translate those models into slots, parts, attributes, events, and DOM
      contracts that application shells can compose directly.
    </p>
  </article>
  <article class="uikit-architecture-step">
    <span>03</span>
    <h3>Theme engine</h3>
    <p>
      Tokens, runtime themes, and <code>cv-theme-provider</code> let products scope visual identity
      without forking component logic.
    </p>
  </article>
  <article class="uikit-architecture-step">
    <span>04</span>
    <h3>Controller helpers</h3>
    <p>
      Toast and dialog helpers keep common orchestration flows close to the package while the visual
      contract stays on the documented elements.
    </p>
  </article>
</div>

## Choose Your Entry Point

<div class="component-links">
  <a class="component-link" href="./guide/getting-started.html">Install and register the full kit</a>
  <a class="component-link" href="./guide/architecture.html">Understand the package layering</a>
  <a class="component-link" href="./guide/theming.html">Customize tokens and runtime themes</a>
  <a class="component-link" href="./components/">Browse the generated component catalog</a>
</div>

## Need Live Validation?

<div class="uikit-callout">
  <div class="uikit-callout-copy">
    <p class="components-kicker">Playground</p>
    <h3>Use the docs as the working surface</h3>
    <p>
      The live playground keeps controller-backed alerts, toasts, selection patterns, and composed
      component states in one dedicated page instead of a separate demo app.
    </p>
  </div>
  <div class="uikit-callout-actions">
    <a class="component-action component-action-primary" href="./guide/playground.html">
      Open playground
    </a>
    <a class="component-action" href="./components/">Browse reference</a>
  </div>
</div>
