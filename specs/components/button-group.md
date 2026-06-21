# cv-button-group

Action grouping for related buttons.

**Headless:** None (UIKit-only component)

## Usage

```html
<div class="button-group-demo-shell" data-demo="button-group">
  <section class="button-group-demo-hero" aria-labelledby="button-group-demo-title">
    <div class="button-group-demo-copy">
      <span class="button-group-demo-kicker">Grouped actions</span>
      <h3 id="button-group-demo-title">
        Use button group when separate actions should read as one command unit.
      </h3>
      <p>
        The group owns layout and joined shape only. Every child stays a normal <code>cv-button</code> with
        its own click target, focus stop, variant, disabled state, and accessible label.
      </p>
    </div>

    <dl class="button-group-demo-metrics" aria-label="Button group contract summary">
      <div>
        <dt>Semantics</dt>
        <dd>role="group"</dd>
      </div>
      <div>
        <dt>Focus</dt>
        <dd>normal button order</dd>
      </div>
      <div>
        <dt>Shape</dt>
        <dd>loose or attached</dd>
      </div>
    </dl>
  </section>

  <section class="button-group-demo-workbench" aria-labelledby="button-group-demo-workbench-title">
    <div class="button-group-demo-section-header">
      <span class="button-group-demo-kicker">Vault action footer</span>
      <h4 id="button-group-demo-workbench-title">
        Attach related actions when the visual unit is stronger than three separate buttons.
      </h4>
    </div>

    <div class="button-group-demo-surface">
      <header class="button-group-demo-surface-header">
        <div>
          <span class="button-group-demo-label">Visible route</span>
          <strong>border-checkpoint.visible</strong>
        </div>
        <span class="button-group-demo-pill">3 independent actions</span>
      </header>

      <div class="button-group-demo-primary-action">
        <cv-button-group attached aria-label="Visible vault actions">
          <cv-button variant="primary" preset="action-primary">Open</cv-button>
          <cv-button>Lock</cv-button>
          <cv-button variant="danger" outline>Wipe</cv-button>
        </cv-button-group>
        <p>Joined edges make the cluster scan as one footer control without changing each button contract.</p>
      </div>

      <div class="button-group-demo-proof-grid" aria-label="Action grouping details">
        <div>
          <span>Group label</span>
          <strong>Visible vault actions</strong>
        </div>
        <div>
          <span>Tab behavior</span>
          <strong>Open → Lock → Wipe</strong>
        </div>
        <div>
          <span>Ownership</span>
          <strong>buttons keep variants</strong>
        </div>
      </div>
    </div>
  </section>

  <section class="button-group-demo-modes" aria-labelledby="button-group-demo-modes-title">
    <div class="button-group-demo-section-header">
      <span class="button-group-demo-kicker">Layouts and emphasis</span>
      <h4 id="button-group-demo-modes-title">
        Switch orientation and attachment to match the workflow density.
      </h4>
    </div>

    <div class="button-group-demo-mode-grid">
      <div class="button-group-demo-mode">
        <span class="button-group-demo-label">Loose horizontal</span>
        <cv-button-group aria-label="Audit filters">
          <cv-button size="small">Details</cv-button>
          <cv-button size="small" outline>Route</cv-button>
          <cv-button size="small" variant="ghost">Logs</cv-button>
        </cv-button-group>
        <p>Use spacing when each action should keep a distinct surface.</p>
      </div>

      <div class="button-group-demo-mode">
        <span class="button-group-demo-label">Attached vertical</span>
        <cv-button-group attached orientation="vertical" aria-label="Review actions">
          <cv-button size="small">Approve</cv-button>
          <cv-button size="small">Request review</cv-button>
          <cv-button size="small" disabled>Archived</cv-button>
        </cv-button-group>
        <p>Use a vertical stack for side panels, review queues, and narrow mobile slots.</p>
      </div>

      <div class="button-group-demo-mode">
        <span class="button-group-demo-label">Mixed emphasis</span>
        <cv-button-group attached aria-label="Relay controls">
          <cv-button size="small" variant="primary">Enable</cv-button>
          <cv-button size="small">Pause</cv-button>
          <cv-button size="small" variant="danger" outline>Block</cv-button>
        </cv-button-group>
        <p>Variants stay on the child buttons, so primary and destructive intent remain explicit.</p>
      </div>
    </div>
  </section>
</div>
```

## Anatomy

```text
<cv-button-group>
└── <div part="base" role="group"><slot></slot></div>
```

## Attributes

| Attribute     | Type                           | Default        | Description                                                                 |
| ------------- | ------------------------------ | -------------- | --------------------------------------------------------------------------- |
| `orientation` | `horizontal` \| `vertical`     | `"horizontal"` | Layout direction                                                            |
| `attached`    | Boolean                        | `false`        | Joined button treatment with shared outer radius and flat internal seams    |
| `size`        | `small` \| `medium` \| `large` | `"medium"`     | Group density attribute; set matching child button sizes for visible sizing |
| `aria-label`  | String                         | `""`           | Accessible group label                                                      |

## Boundary

This is not a toolbar. It does not implement roving focus; every child remains in the normal Tab order.
Use `cv-toolbar` when one composite command surface should manage arrow-key navigation between tools.
