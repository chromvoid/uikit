# Changelog

## 2.0.0

### Added

- Added logical RTL behavior for overlays, disclosure indicators, and directional icons.
- Added always-on-top dialog stacking for application-critical modal surfaces.
- Added updated bottom-sheet behavior and component contracts.

### Changed

- Updated `@chromvoid/headless-ui` to `0.4.0` for the shared logical-direction contracts.
- Standardized product font stacks and refined button, form, radio-group, popover, and mobile image-viewer behavior.

### Breaking

- Removed ChromVoid product-specific splash, lockscreen, media mini-player, audio waveform, payment-card, and scroll-edge token families from `theme/tokens.css`.
- Renamed undocumented runtime-only component properties to the private `--_cv-*` namespace.

### Preserved

- Existing UIKit foundation tokens remain under `--cv-*`.
- Documented component customization properties remain unchanged.
- `CVThemeTokenName`, `defineTheme`, `applyTheme`, and `cv-theme-provider` keep their existing API.
