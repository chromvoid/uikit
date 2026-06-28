import {css, unsafeCSS} from 'lit'
import type {CSSResultOrNative} from 'lit'

export type ComponentHostDisplay = 'block' | 'inline-block' | 'inline-flex' | 'contents'

export const componentResetStyles = css`
  :host([hidden]),
  [hidden] {
    display: none !important;
  }

  .cv-u-discrete-presence {
    transition-behavior: allow-discrete;
  }

  :host,
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  ul,
  ol,
  dl {
    margin: 0;
  }

  ul,
  ol {
    padding: 0;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
    color: inherit;
  }

  button {
    appearance: none;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  :focus-visible {
    outline-offset: 2px;
  }

  ::slotted(img),
  ::slotted(svg),
  ::slotted(video),
  ::slotted(canvas) {
    display: block;
    max-inline-size: 100%;
  }
`

const hostDisplayStyles = new Map<ComponentHostDisplay, CSSResultOrNative>()

export function getComponentHostDisplayStyles(display: ComponentHostDisplay): CSSResultOrNative {
  let style = hostDisplayStyles.get(display)
  if (!style) {
    style = css`
      :host {
        display: ${unsafeCSS(display)};
      }
    `
    hostDisplayStyles.set(display, style)
  }
  return style
}
