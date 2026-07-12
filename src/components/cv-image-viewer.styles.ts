import {css} from 'lit'

export const cvImageViewerStyles = css`
  :host {
    display: contents;
    --_cv-image-viewer-background: var(--cv-alpha-black-95);
    --_cv-image-viewer-panel: var(--cv-color-surface-glass);
    --_cv-image-viewer-panel-strong: var(--cv-color-surface-glass-strong);
    --_cv-image-viewer-border: var(--cv-color-border-glass);
    --_cv-image-viewer-text: var(--cv-color-text-strongest);
    --_cv-image-viewer-muted: var(--cv-color-text-muted);
    --_cv-image-viewer-backdrop: var(--cv-color-background, #070b12);
    --_cv-image-viewer-image-transition-duration: var(--cv-duration-normal, 250ms);
    --_cv-image-viewer-image-transition-easing: var(--cv-easing-decelerate, cubic-bezier(0, 0, 0.2, 1));
  }

  cv-dialog {
    --cv-dialog-width: 100vw;
    --cv-dialog-max-height: 100dvh;
    --cv-dialog-border-radius: 0;
    --cv-dialog-overlay-color: transparent;
    --cv-dialog-overlay-padding-block-start: 0px;
    --cv-dialog-overlay-padding-inline-end: 0px;
    --cv-dialog-overlay-padding-block-end: 0px;
    --cv-dialog-overlay-padding-inline-start: 0px;
    --cv-dialog-content-transition-property: opacity;
    --cv-dialog-content-closed-transform: none;
    --cv-dialog-content-open-transform: none;
  }

  cv-dialog::part(content) {
    inline-size: 100vw;
    max-inline-size: 100vw;
    block-size: 100dvh;
    max-block-size: 100dvh;
    overflow: hidden;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  cv-dialog::part(body) {
    display: contents;
  }

  [part='base'] {
    box-sizing: border-box;
    position: relative;
    inline-size: 100vw;
    block-size: 100dvh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    overflow: hidden;
    background:
      linear-gradient(180deg, var(--cv-color-primary-surface) 0%, transparent 34%),
      linear-gradient(var(--_cv-image-viewer-background), var(--_cv-image-viewer-background)),
      var(--_cv-image-viewer-backdrop);
    color: var(--_cv-image-viewer-text);
  }

  [part='header'],
  [part='footer'] {
    position: relative;
    z-index: 4;
    min-inline-size: 0;
    border-color: var(--_cv-image-viewer-border);
    background: var(--_cv-image-viewer-panel);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    transition:
      opacity var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
      transform var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
  }

  [part='header'] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--cv-space-3, 12px);
    padding: max(
        var(--cv-space-3, 12px),
        var(--cv-image-viewer-safe-area-block-start, env(safe-area-inset-top, 0px))
      )
      max(var(--cv-space-4, 16px), env(safe-area-inset-right, 0px)) var(--cv-space-3, 12px)
      max(var(--cv-space-4, 16px), env(safe-area-inset-left, 0px));
    border-block-end: 1px solid var(--_cv-image-viewer-border);
  }

  [part='title-group'] {
    display: grid;
    gap: var(--cv-space-1, 4px);
    min-inline-size: 0;
  }

  [part='title'] {
    min-inline-size: 0;
    overflow: hidden;
    color: var(--_cv-image-viewer-text);
    font-size: var(--cv-image-viewer-title-font-size, var(--cv-font-size-lg, 18px));
    font-weight: var(--cv-font-weight-semibold, 600);
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part='meta'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--cv-space-2, 8px);
    min-inline-size: 0;
    color: var(--_cv-image-viewer-muted);
    font-size: var(--cv-font-size-sm, 13px);
  }

  [part='header-actions'] {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--cv-space-2, 8px);
    min-inline-size: 0;
  }

  [part='viewport-region'] {
    position: relative;
    min-block-size: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    overflow: hidden;
  }

  [part='viewport'] {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: 0;
    display: grid;
    place-items: center;
    padding: var(--_cv-image-viewer-viewport-padding, var(--cv-space-6, 24px));
    touch-action: pinch-zoom pan-x pan-y;
  }

  [part='image'] {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
    object-position: center;
    user-select: none;
    -webkit-user-drag: none;
  }

  [part='image-stage'] {
    inline-size: 100%;
    block-size: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
    isolation: isolate;
  }

  [part='image-stage'] [part='image'] {
    grid-area: 1 / 1;
  }

  [part='image'][data-transition-phase='current'] {
    z-index: 1;
  }

  [part='image'][data-transition-phase='outgoing'] {
    z-index: 2;
    pointer-events: none;
  }

  [part='image-stage'][data-transition-direction='forward'] [part='image'][data-transition-phase='current'] {
    animation: cv-image-viewer-current-forward var(--_cv-image-viewer-image-transition-duration)
      var(--_cv-image-viewer-image-transition-easing) both;
  }

  [part='image-stage'][data-transition-direction='forward'] [part='image'][data-transition-phase='outgoing'] {
    animation: cv-image-viewer-outgoing-forward var(--_cv-image-viewer-image-transition-duration)
      var(--_cv-image-viewer-image-transition-easing) both;
  }

  [part='image-stage'][data-transition-direction='backward'] [part='image'][data-transition-phase='current'] {
    animation: cv-image-viewer-current-backward var(--_cv-image-viewer-image-transition-duration)
      var(--_cv-image-viewer-image-transition-easing) both;
  }

  [part='image-stage'][data-transition-direction='backward']
    [part='image'][data-transition-phase='outgoing'] {
    animation: cv-image-viewer-outgoing-backward var(--_cv-image-viewer-image-transition-duration)
      var(--_cv-image-viewer-image-transition-easing) both;
  }

  @keyframes cv-image-viewer-current-forward {
    from {
      opacity: 0;
      transform: translateX(28px);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes cv-image-viewer-outgoing-forward {
    from {
      opacity: 1;
      transform: translateX(0);
    }

    to {
      opacity: 0;
      transform: translateX(-28px);
    }
  }

  @keyframes cv-image-viewer-current-backward {
    from {
      opacity: 0;
      transform: translateX(-28px);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes cv-image-viewer-outgoing-backward {
    from {
      opacity: 1;
      transform: translateX(0);
    }

    to {
      opacity: 0;
      transform: translateX(28px);
    }
  }

  [part='state'] {
    max-inline-size: min(520px, 86vw);
    display: inline-grid;
    justify-items: center;
    gap: var(--cv-space-3, 12px);
    padding: var(--cv-space-4, 16px);
    color: var(--_cv-image-viewer-muted);
    font-size: var(--cv-font-size-sm, 13px);
    line-height: 1.45;
    text-align: center;
  }

  [part='state'] cv-spinner {
    inline-size: 48px;
    block-size: 48px;
  }

  [part~='nav'] {
    position: absolute;
    z-index: 3;
    inset-block-start: 50%;
    transform: translateY(-50%);
    display: inline-flex;
  }

  [part~='nav-previous'] {
    inset-inline-start: max(var(--cv-space-4, 16px), env(safe-area-inset-left, 0px));
  }

  [part~='nav-next'] {
    inset-inline-end: max(var(--cv-space-4, 16px), env(safe-area-inset-right, 0px));
  }

  cv-button.viewer-icon-button {
    --cv-button-min-height: 40px;
    --cv-button-padding-inline: 0;
    --cv-button-padding-block: 0;
    --cv-button-border-radius: var(--cv-radius-sm, 6px);
    --cv-button-border-color: var(--cv-alpha-white-20);
    --cv-button-background: var(--cv-alpha-white-10);
    --cv-button-background-hover: var(--cv-alpha-white-15);
    --cv-button-text-color: var(--_cv-image-viewer-text);
    inline-size: 40px;
    block-size: 40px;
  }

  cv-button.viewer-icon-button[data-dangerous='true'] {
    --cv-button-text-color: var(--cv-color-danger);
    color: var(--cv-color-danger);
  }

  cv-button.nav-button {
    --cv-button-min-height: 48px;
    inline-size: 48px;
    block-size: 48px;
    border-radius: 50%;
  }

  cv-menu-button.viewer-menu-button {
    --cv-menu-button-min-height: 40px;
    --cv-menu-button-padding-inline: 0;
    --cv-menu-button-padding-block: 0;
    --cv-menu-button-border-radius: var(--cv-radius-sm, 6px);
    --cv-menu-button-background: var(--cv-alpha-white-10);
    --cv-menu-button-border-color: var(--cv-alpha-white-20);
    --cv-menu-button-menu-z-index: 70;
    inline-size: 40px;
    block-size: 40px;
    color: var(--_cv-image-viewer-text);
  }

  cv-menu-button.viewer-menu-button::part(trigger) {
    inline-size: 40px;
    block-size: 40px;
    min-inline-size: 40px;
    min-block-size: 40px;
    padding: 0;
  }

  cv-menu-item[data-dangerous='true'],
  cv-menu-item[data-dangerous='true']::part(base) {
    color: var(--cv-color-danger);
  }

  [part='busy-overlay'] {
    position: absolute;
    z-index: 5;
    inset: 0;
    display: grid;
    place-items: center;
    padding: var(--cv-space-4, 16px);
    background: var(--cv-alpha-black-50);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }

  [part='busy-status'] {
    display: inline-flex;
    align-items: center;
    gap: var(--cv-space-3, 12px);
    max-inline-size: min(340px, 100%);
    padding: var(--cv-space-3, 12px) var(--cv-space-4, 16px);
    border: 1px solid var(--cv-alpha-white-15);
    border-radius: var(--cv-radius-md, 8px);
    background: var(--_cv-image-viewer-panel-strong);
    box-shadow: 0 18px 48px var(--cv-alpha-black-35);
    color: var(--_cv-image-viewer-text);
    font-size: var(--cv-font-size-sm, 13px);
    font-weight: var(--cv-font-weight-semibold, 600);
  }

  [part='footer'] {
    display: block;
    min-block-size: 0;
    padding: var(--cv-space-3, 12px) max(var(--cv-space-4, 16px), env(safe-area-inset-right, 0px))
      max(var(--cv-space-3, 12px), env(safe-area-inset-bottom, 0px))
      max(var(--cv-space-4, 16px), env(safe-area-inset-left, 0px));
    border-block-start: 1px solid var(--_cv-image-viewer-border);
  }

  [part='thumbnails'] {
    display: flex;
    align-items: center;
    gap: var(--cv-space-2, 8px);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
  }

  [part='thumbnail-window-spacer'] {
    flex: 0 0 auto;
    min-inline-size: var(--cv-space-2, 8px);
    color: var(--_cv-image-viewer-muted);
    font-size: var(--cv-font-size-xs, 12px);
  }

  [part='thumbnail'] {
    flex: 0 0 auto;
    inline-size: var(--cv-image-viewer-thumbnail-size, 56px);
    block-size: var(--cv-image-viewer-thumbnail-size, 56px);
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid var(--cv-alpha-white-15);
    border-radius: var(--cv-radius-sm, 6px);
    background: var(--cv-alpha-white-8);
    color: var(--_cv-image-viewer-muted);
    cursor: pointer;
    overflow: hidden;
  }

  [part='thumbnail'][aria-current='true'] {
    border-color: var(--cv-color-primary-border-strong);
    background: var(--cv-color-primary-surface);
    box-shadow: 0 0 0 1px var(--cv-color-primary-ring);
  }

  [part='thumbnail']:focus-visible {
    outline: 2px solid var(--cv-color-primary);
    outline-offset: 2px;
  }

  [part='thumbnail'] img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }

  [part='thumbnail-placeholder'] {
    padding: var(--cv-space-1, 4px);
    font-size: var(--cv-font-size-xs, 12px);
  }

  [part='overlay'] {
    position: absolute;
    z-index: 6;
    inset: 0;
    pointer-events: none;
  }

  ::slotted([slot='overlay']) {
    pointer-events: auto;
  }

  :host([chrome-visible='false']) [part='header'],
  :host([chrome-visible='false']) [part='footer'] {
    opacity: 0;
    pointer-events: none;
  }

  :host([chrome-visible='false']) [part='header'] {
    transform: translateY(-8px);
  }

  :host([chrome-visible='false']) [part='footer'] {
    transform: translateY(8px);
  }

  :host([layout='mobile']) [part='base'] {
    --_cv-image-viewer-viewport-padding: 0;
  }

  :host([layout='mobile']) [part='header'] {
    align-items: start;
    gap: var(--cv-space-2, 8px);
    padding-block: max(
        var(--cv-space-2, 8px),
        var(--cv-image-viewer-safe-area-block-start, env(safe-area-inset-top, 0px))
      )
      var(--cv-space-2, 8px);
    padding-inline: max(var(--cv-space-3, 12px), env(safe-area-inset-left, 0px))
      max(var(--cv-space-3, 12px), env(safe-area-inset-right, 0px));
  }

  :host([layout='mobile']) [part='title-group'] {
    align-content: center;
    gap: var(--cv-space-1, 4px);
    padding-block: var(--cv-space-1, 4px);
  }

  :host([layout='mobile']) [part='title'] {
    font-size: var(--cv-font-size-md, 16px);
    line-height: 1.25;
    text-align: start;
  }

  :host([layout='mobile']) [part='meta'] {
    justify-content: flex-start;
    font-size: var(--cv-font-size-xs, 12px);
  }

  :host([layout='mobile']) [part='meta'] > span + span::before {
    content: '·';
    margin-inline: var(--cv-space-2, 8px);
    color: var(--cv-color-text-subtle);
  }

  :host([layout='mobile']) [part='header-actions'] {
    align-self: center;
    gap: var(--cv-space-1, 4px);
  }

  :host([layout='mobile']) cv-button.viewer-icon-button {
    --cv-button-border-radius: 50%;
  }

  :host([layout='mobile']) cv-menu-button.viewer-menu-button {
    --cv-menu-button-border-radius: 50%;
  }

  :host([layout='mobile']) cv-menu-button.viewer-menu-button::part(dropdown-icon) {
    display: none;
  }

  :host([layout='mobile']) [part='footer'] {
    padding-inline: max(var(--cv-space-3, 12px), env(safe-area-inset-left, 0px))
      max(var(--cv-space-3, 12px), env(safe-area-inset-right, 0px));
  }

  :host([layout='mobile']) [part~='nav'] {
    display: none;
  }

  @media (max-width: 720px) {
    :host([layout='auto']) [part='base'] {
      --_cv-image-viewer-viewport-padding: 0;
    }

    :host([layout='auto']) [part='title'] {
      font-size: var(--cv-font-size-base, 14px);
    }

    :host([layout='auto']) [part~='nav'] {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part='header'],
    [part='footer'] {
      transition-duration: 0ms;
    }

    [part='image-stage'][data-transition-direction] [part='image'][data-transition-phase] {
      animation: none;
    }

    [part='image'][data-transition-phase='outgoing'] {
      display: none;
    }
  }
`
