import {css} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export type CVSkeletonVariant = 'block' | 'text' | 'circle'

export class CVSkeleton extends ReatomLitElement {
  static elementName = 'cv-skeleton'

  static get properties() {
    return {
      variant: {type: String, reflect: true},
      lines: {type: Number, reflect: true},
      animated: {type: Boolean, reflect: true},
      decorative: {type: Boolean, reflect: true},
      label: {type: String},
    }
  }

  declare variant: CVSkeletonVariant
  declare lines: number
  declare animated: boolean
  declare decorative: boolean
  declare label: string

  constructor() {
    super()
    this.variant = 'block'
    this.lines = 1
    this.animated = true
    this.decorative = false
    this.label = 'Loading'
  }

  static styles = [
    css`
      :host {
        display: block;
        inline-size: var(--cv-skeleton-inline-size, 100%);
        block-size: var(--cv-skeleton-block-size, 1rem);
      }

      [part='base'] {
        display: grid;
        gap: var(--cv-skeleton-line-gap, var(--cv-space-2, 8px));
        inline-size: 100%;
        block-size: 100%;
      }

      [part='line'] {
        display: block;
        inline-size: 100%;
        block-size: var(--cv-skeleton-line-block-size, 1rem);
        border-radius: var(--cv-skeleton-radius, var(--cv-radius-sm, 6px));
        background: var(--cv-skeleton-background, var(--cv-color-surface-3, #222b3a));
      }

      :host([variant='circle']) {
        inline-size: var(--cv-skeleton-size, 2.5rem);
        block-size: var(--cv-skeleton-size, 2.5rem);
      }

      :host([variant='circle']) [part='line'] {
        block-size: 100%;
        border-radius: 999px;
      }

      :host([variant='text']) {
        block-size: auto;
      }

      :host([animated]) [part='line'] {
        background:
          linear-gradient(
            90deg,
            transparent,
            var(--cv-skeleton-highlight, rgb(255 255 255 / 8%)),
            transparent
          ),
          var(--cv-skeleton-background, var(--cv-color-surface-3, #222b3a));
        background-size: 220% 100%;
        animation: cv-skeleton-shimmer 1.2s linear infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        :host([animated]) [part='line'] {
          animation: none;
        }
      }

      @keyframes cv-skeleton-shimmer {
        from {
          background-position: 120% 0;
        }

        to {
          background-position: -120% 0;
        }
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  protected override render() {
    const lineCount = this.variant === 'text' ? this.getLineCount() : 1

    if (this.decorative) {
      return html`
        <span part="base" aria-hidden="true">
          ${Array.from(
            {length: lineCount},
            () =>
              html`
                <span part="line"></span>
              `,
          )}
        </span>
      `
    }

    return html`
      <span part="base" role="status" aria-label=${this.label || 'Loading'}>
        ${Array.from(
          {length: lineCount},
          () =>
            html`
              <span part="line"></span>
            `,
        )}
      </span>
    `
  }

  private getLineCount(): number {
    if (!Number.isFinite(this.lines)) return 1
    return Math.max(1, Math.floor(this.lines))
  }
}
