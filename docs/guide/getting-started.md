# Getting Started

<section class="getting-started-hero">
  <div class="getting-started-hero-copy">
    <p class="components-kicker">Activation path</p>
    <h2>Bring the ChromVoid surface layer online without building a demo app first.</h2>
    <p>
      Install the package, register the custom elements once, load the token surface, and validate a
      themed composition inside the docs before wiring a product shell.
    </p>
    <div class="components-hero-actions">
      <a class="component-action component-action-primary" href="#install">Start setup</a>
      <a class="component-action" href="/guide/playground">Open playground</a>
    </div>
  </div>
  <div class="getting-started-console" aria-label="UIKit setup path">
    <span class="getting-started-console-line"><strong>01</strong> add package and peer runtime</span>
    <span class="getting-started-console-line"><strong>02</strong> load tokens at the app boundary</span>
    <span class="getting-started-console-line"><strong>03</strong> register custom elements once</span>
    <span class="getting-started-console-line"><strong>04</strong> compose inside cv-theme-provider</span>
  </div>
</section>

<div class="getting-started-flow" aria-label="Getting started flow">
  <article class="getting-started-flow-step">
    <span>Install</span>
    <strong>Package and Lit runtime</strong>
  </article>
  <article class="getting-started-flow-step">
    <span>Register</span>
    <strong>One browser entrypoint</strong>
  </article>
  <article class="getting-started-flow-step">
    <span>Compose</span>
    <strong>Real custom elements</strong>
  </article>
  <article class="getting-started-flow-step">
    <span>Validate</span>
    <strong>Docs, playground, reference</strong>
  </article>
</div>

## Install

Add UIKit and its Lit peer dependency from the workspace or application package.

```bash
bun add @chromvoid/uikit lit
```

## Register components once

`@chromvoid/uikit/register` exports the bulk registration entry for all web components. Call it at
the browser shell boundary, next to the token import.

```ts
import {registerUikit} from '@chromvoid/uikit/register'
import '@chromvoid/uikit/theme/tokens.css'

registerUikit()
```

<div class="getting-started-note">
  <p class="components-kicker">Boundary rule</p>
  <p>
    Registration is a shell concern. Feature code should compose documented elements instead of
    re-registering the kit per route or per component.
  </p>
</div>

## Render your first surface

Wrap the composition with `cv-theme-provider` when you want a scoped color mode or runtime theme.
The docs render this snippet as a live custom-element preview.

```html
<section
  class="getting-started-surface"
  data-demo="getting-started"
  data-live-demo-height="280"
  aria-label="Vault bootstrap preview"
>
  <div class="getting-started-surface-copy">
    <span class="getting-started-eyebrow">Vault bootstrap</span>
    <strong>Ready for shell wiring</strong>
    <span>Tokens, actions, binary state, and progress share one surface.</span>
  </div>
  <div class="getting-started-surface-actions">
    <cv-button variant="primary" pill>Unlock vault</cv-button>
    <cv-switch checked>Core paired</cv-switch>
  </div>
  <div class="getting-started-surface-progress">
    <span>Bootstrap progress</span>
    <strong>64%</strong>
    <cv-progress value="64" max="100" aria-label="Bootstrap progress"></cv-progress>
  </div>
</section>
```

<div class="component-grid">
  <section class="component-card">
    <p class="components-kicker">Custom elements</p>
    <h3>Use stable DOM contracts</h3>
    <p>
      Components expose slots, attributes, events, CSS parts, and documented behavior without
      coupling application state to the docs site.
    </p>
  </section>
  <section class="component-card">
    <p class="components-kicker">Token surface</p>
    <h3>Keep visual identity scoped</h3>
    <p>
      Import the default tokens once, then use providers or named themes when a subtree needs a
      controlled visual mode.
    </p>
  </section>
  <section class="component-card">
    <p class="components-kicker">Validation loop</p>
    <h3>Check composition before wiring</h3>
    <p>
      Move from this quick start into the playground when you need to test controllers, stateful
      controls, or larger component combinations.
    </p>
  </section>
</div>

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

The documentation site is the primary interactive surface for the package.

```bash
bun run docs:dev
bun run demo
```

<div class="uikit-callout">
  <div class="uikit-callout-copy">
    <p class="components-kicker">Local loop</p>
    <h3>Use the docs before a product shell exists.</h3>
    <p>
      <code>docs:dev</code> prepares generated reference pages, builds the package, and starts
      VitePress. <code>demo</code> keeps the compatibility entrypoint for opening the same docs
      server.
    </p>
  </div>
  <div class="uikit-callout-actions">
    <a class="component-action component-action-primary" href="/guide/playground">
      Open playground
    </a>
    <a class="component-action" href="/components/">Browse reference</a>
  </div>
</div>

## Next steps

<div class="component-links">
  <a class="component-link" href="/guide/architecture">Understand package layering</a>
  <a class="component-link" href="/guide/theming">Customize tokens and runtime themes</a>
  <a class="component-link" href="/guide/playground">Test working component compositions</a>
  <a class="component-link" href="/components/">Browse full API reference pages</a>
</div>
