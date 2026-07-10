# Changelog

## 2.0.0

### Breaking

- Removed ChromVoid product-specific splash, lockscreen, media mini-player, audio waveform, payment-card, and scroll-edge token families from `theme/tokens.css`.
- Renamed undocumented runtime-only component properties to the private `--_cv-*` namespace.

### Preserved

- Existing UIKit foundation tokens remain under `--cv-*`.
- Documented component customization properties remain unchanged.
- `CVThemeTokenName`, `defineTheme`, `applyTheme`, and `cv-theme-provider` keep their existing API.
