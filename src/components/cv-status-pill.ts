import {css} from 'lit'

import {CVStatusIndicator, type CVStatusSize, type CVStatusTone} from './cv-status-indicator'

export {type CVStatusSize, type CVStatusTone} from './cv-status-indicator'

export class CVStatusPill extends CVStatusIndicator {
  static override elementName = 'cv-status-pill'

  static override styles = [
    ...CVStatusIndicator.styles,
    css`
      :host {
        --cv-status-pill-padding-inline: var(--cv-space-2, 8px);
        --cv-status-pill-block-size: 1.5rem;
        --cv-status-pill-radius: 999px;
      }

      :host([size='small']) {
        --cv-status-pill-block-size: 1.25rem;
        --cv-status-pill-padding-inline: var(--cv-space-1, 4px);
      }

      :host([size='large']) {
        --cv-status-pill-block-size: 1.75rem;
        --cv-status-pill-padding-inline: var(--cv-space-3, 12px);
      }

      [part='base'] {
        min-block-size: var(--cv-status-pill-block-size);
        padding-inline: var(--cv-status-pill-padding-inline);
        border: 1px solid var(--cv-status-pill-border-color, var(--cv-status-color));
        border-radius: var(--cv-status-pill-radius);
        background: var(--cv-status-pill-background, var(--cv-color-surface, #141923));
      }
    `,
  ]

  declare tone: CVStatusTone
  declare size: CVStatusSize
}
