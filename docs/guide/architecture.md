# Architecture

UIKit is intentionally thin. It does not reimplement behavior that already exists in
`@chromvoid/headless-ui`; it adapts those models into Lit custom elements, exposes theme tokens,
and adds a few imperative helpers for common application flows.

## Layer model

| Layer                         | Purpose                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `@chromvoid/headless-ui`      | State models, interaction contracts, ARIA semantics, and keyboard behavior                  |
| `@chromvoid/uikit` components | Lit custom elements that map attributes, slots, CSS parts, and DOM events onto those models |
| Theme engine                  | Named token sets, scoped providers, and runtime theme application                           |
| Controllers                   | Imperative helpers such as dialog and toast orchestration                                   |

## Primary entry points

| Entry                               | Use                                                         |
| ----------------------------------- | ----------------------------------------------------------- |
| `@chromvoid/uikit/register`         | Register the full component set once in the browser         |
| `@chromvoid/uikit/theme/tokens.css` | Load the default token surface                              |
| `@chromvoid/uikit/theme`            | Define and apply custom themes programmatically             |
| `@chromvoid/uikit/dialog`           | Use dialog controller helpers                               |
| `@chromvoid/uikit/toast`            | Use toast controller helpers                                |
| `@chromvoid/uikit/components`       | Import specific element classes when you need direct access |

## Why the docs are generated

Component reference pages are generated from `specs/components/*.md` before every docs build. That
keeps the rendered VitePress site aligned with the source-of-truth specifications instead of
maintaining a second hand-written API surface.

This also means:

- adding a new component spec automatically becomes a docs task
- sidebar structure stays centralized in the docs catalog
- GitHub Pages deploys the same static output that local developers preview

## Controllers and runtime helpers

Some flows are easier to wire imperatively than declaratively:

- `createToastController()` pushes items into `cv-toast-region`
- `createDialogController()` coordinates dialog stacks
- `registerUikit()` bulk-registers the component set for documentation, prototypes, and apps

Those helpers live next to the components, but the actual visual contracts remain on the custom
elements documented in the reference section.
