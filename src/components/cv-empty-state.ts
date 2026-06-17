import {css, nothing} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVIcon} from './cv-icon'

export type CVEmptyStateVariant = 'panel' | 'dropzone'

export class CVEmptyState extends ReatomLitElement {
  static elementName = 'cv-empty-state'

  static get properties() {
    return {
      icon: {type: String},
      headline: {type: String},
      description: {type: String},
      iconFill: {type: Boolean, attribute: 'icon-fill'},
      variant: {type: String, reflect: true},
      hasDefaultSlot: {type: Boolean, state: true},
      hasActionsSlot: {type: Boolean, state: true},
    }
  }

  declare icon: string
  declare headline: string
  declare description: string
  declare iconFill: boolean
  declare variant: CVEmptyStateVariant
  declare private hasDefaultSlot: boolean
  declare private hasActionsSlot: boolean

  constructor() {
    super()
    this.icon = ''
    this.headline = ''
    this.description = ''
    this.iconFill = false
    this.variant = 'panel'
    this.hasDefaultSlot = false
    this.hasActionsSlot = false
  }

  static styles = [
    css`
      @keyframes cv-empty-state-reveal {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
        }

        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      :host {
        display: grid;
        box-sizing: border-box;
        inline-size: 100%;
        min-inline-size: 0;
        align-self: start;
        color: var(--cv-color-text-muted);
      }

      :host([hidden]) {
        display: none;
      }

      [part='base'] {
        display: grid;
        justify-items: center;
        gap: var(--cv-empty-state-gap, var(--cv-space-2, 8px));
        box-sizing: border-box;
        inline-size: 100%;
        min-inline-size: 0;
        padding: var(--cv-empty-state-padding, var(--cv-space-6, 24px));
        border: var(--cv-empty-state-border, 1px dashed var(--cv-color-border, #2a3245));
        border-radius: var(--cv-empty-state-radius, var(--cv-radius-2, 12px));
        background: var(--cv-empty-state-background, var(--cv-color-surface-2, #181f2b));
        text-align: center;
        animation: cv-empty-state-reveal 0.32s var(--cv-easing-standard, ease-out);
      }

      @media (prefers-reduced-motion: reduce) {
        [part='base'] {
          animation: none;
        }
      }

      :host([variant='dropzone']) [part='base'] {
        min-block-size: var(--cv-empty-state-min-block-size, 220px);
        border-color: var(--cv-empty-state-dropzone-border, var(--cv-color-border-strong, #4c5870));
        background: var(--cv-empty-state-dropzone-background, var(--cv-gradient-surface, #181f2b));
      }

      :host(.drop-active) [part='base'] {
        border-color: var(--cv-empty-state-drop-active-border, var(--cv-color-primary, #65d7ff));
        background: var(--cv-empty-state-drop-active-background, var(--cv-color-primary-subtle, #193442));
      }

      [part='icon'] {
        color: var(--cv-empty-state-icon-color, var(--cv-color-accent, #65d7ff));
        font-size: var(--cv-empty-state-icon-size, 32px);
        opacity: var(--cv-empty-state-icon-opacity, 0.82);
      }

      :host([variant='dropzone']) [part='icon'] {
        color: var(--cv-empty-state-dropzone-icon-color, var(--cv-color-border-strong, #4c5870));
        opacity: var(--cv-empty-state-dropzone-icon-opacity, 0.42);
      }

      [part='title'],
      [part='description'] {
        margin: 0;
        min-inline-size: 0;
        overflow-wrap: anywhere;
      }

      [part='title'] {
        max-inline-size: var(--cv-empty-state-title-max-inline-size, 34ch);
        color: var(--cv-empty-state-title-color, var(--cv-color-text, #e8ecf6));
        font-size: var(--cv-empty-state-title-font-size, var(--cv-font-size-sm, 14px));
        font-weight: var(--cv-empty-state-title-font-weight, 680);
        line-height: 1.24;
      }

      [part='description'] {
        max-inline-size: var(--cv-empty-state-description-max-inline-size, 42ch);
        color: var(--cv-color-text-muted, #9aa6bd);
        font-size: var(--cv-empty-state-description-font-size, var(--cv-font-size-xs, 12px));
        line-height: 1.45;
      }

      [part='body'],
      [part='actions'] {
        display: grid;
        justify-items: center;
        min-inline-size: 0;
      }

      [part='body'][hidden],
      [part='actions'][hidden] {
        display: none;
      }

      [part='body'] {
        margin-block-start: var(--cv-empty-state-body-margin-block-start, var(--cv-space-2, 8px));
      }

      [part='actions'] {
        margin-block-start: var(--cv-empty-state-actions-margin-block-start, var(--cv-space-2, 8px));
      }

      slot[name='actions']::slotted(*) {
        max-inline-size: 100%;
      }
    `,
  ]

  static define() {
    CVIcon.define()
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  protected override render() {
    return html`
      <section part="base" role="status">
        ${
          this.icon
            ? html`<cv-icon part="icon" name=${this.icon} ?fill=${this.iconFill} aria-hidden="true"></cv-icon>`
            : nothing
        }
        <p part="title">${this.headline}</p>
        ${this.description ? html`<p part="description">${this.description}</p>` : nothing}
        <div part="body" ?hidden=${!this.hasDefaultSlot}>
          <slot @slotchange=${this.handleDefaultSlotChange}></slot>
        </div>
        <div part="actions" ?hidden=${!this.hasActionsSlot}>
          <slot name="actions" @slotchange=${this.handleActionsSlotChange}></slot>
        </div>
      </section>
    `
  }

  private handleDefaultSlotChange(event: Event) {
    this.hasDefaultSlot = this.hasAssignedElements(event)
  }

  private handleActionsSlotChange(event: Event) {
    this.hasActionsSlot = this.hasAssignedElements(event)
  }

  private hasAssignedElements(event: Event): boolean {
    const slot = event.currentTarget as HTMLSlotElement | null
    return Boolean(slot?.assignedElements({flatten: true}).length)
  }
}
