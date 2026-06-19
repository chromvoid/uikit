# cv-button-group

Action grouping for related buttons.

**Headless:** None (UIKit-only component)

## Usage

```html
<div class="example-row">
  <cv-button-group attached aria-label="Vault actions">
    <cv-button variant="primary">Unlock</cv-button>
    <cv-button>Lock</cv-button>
    <cv-button variant="danger">Wipe</cv-button>
  </cv-button-group>

  <cv-button-group orientation="vertical" aria-label="Review actions">
    <cv-button size="small">Approve</cv-button>
    <cv-button size="small">Request review</cv-button>
    <cv-button size="small" disabled>Archived</cv-button>
  </cv-button-group>
</div>
```

## Anatomy

```text
<cv-button-group>
└── <div part="base" role="group"><slot></slot></div>
```

## Attributes

| Attribute     | Type                           | Default        | Description                                                              |
| ------------- | ------------------------------ | -------------- | ------------------------------------------------------------------------ |
| `orientation` | `horizontal` \| `vertical`     | `"horizontal"` | Layout direction                                                         |
| `attached`    | Boolean                        | `false`        | Joined button treatment with shared outer radius and flat internal seams |
| `size`        | `small` \| `medium` \| `large` | `"medium"`     | Propagated density hint                                                  |
| `aria-label`  | String                         | `""`           | Accessible group label                                                   |

## Boundary

This is not a toolbar. It does not implement roving focus; use `cv-toolbar` for toolbar semantics.
