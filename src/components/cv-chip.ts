import {css, nothing} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export type CVChipActionSource = 'click' | 'keyboard'
type CVChipVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
type CVChipSize = 'small' | 'medium' | 'large'

export interface CVChipActionDetail {
  value: string
  source: CVChipActionSource
}

export interface CVChipRemoveDetail {
  value: string
}

export type CVChipActionEvent = CustomEvent<CVChipActionDetail>
export type CVChipRemoveEvent = CustomEvent<CVChipRemoveDetail>

export class CVChip extends ReatomLitElement {
  static elementName = 'cv-chip'

  static get properties() {
    return {
      value: {type: String, reflect: true},
      selected: {type: Boolean, reflect: true},
      disabled: {type: Boolean, reflect: true},
      removable: {type: Boolean, reflect: true},
      variant: {type: String, reflect: true},
      size: {type: String, reflect: true},
      pill: {type: Boolean, reflect: true},
    }
  }

  declare value: string
  declare selected: boolean
  declare disabled: boolean
  declare removable: boolean
  declare variant: CVChipVariant
  declare size: CVChipSize
  declare pill: boolean

  constructor() {
    super()
    this.value = ''
    this.selected = false
    this.disabled = false
    this.removable = false
    this.variant = 'neutral'
    this.size = 'medium'
    this.pill = false
  }

  static styles = [
    css`
      :host {
        display: inline-flex;
        min-inline-size: 0;
        max-inline-size: 100%;
        vertical-align: middle;
      }

      [part='base'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--cv-chip-gap, var(--cv-space-1, 4px));
        min-inline-size: 0;
        max-inline-size: 100%;
        min-block-size: var(--cv-chip-block-size, 2rem);
        padding-inline: var(--cv-chip-padding-inline, var(--cv-space-2, 8px));
        border: 1px solid var(--cv-chip-border-color, var(--cv-color-border, #2a3245));
        border-radius: var(--cv-chip-radius, var(--cv-radius-sm, 6px));
        background: var(--cv-chip-background, var(--cv-color-surface, #141923));
        color: var(--cv-chip-color, var(--cv-color-text, #e8ecf6));
        font: inherit;
        font-size: var(--cv-chip-font-size, var(--cv-font-size-sm, 14px));
        line-height: 1;
        cursor: pointer;
        user-select: none;
        overflow: hidden;
        white-space: nowrap;
      }

      :host([pill]) [part='base'] {
        border-radius: 999px;
      }

      :host([size='small']) [part='base'] {
        min-block-size: 1.5rem;
        font-size: var(--cv-font-size-xs, 12px);
      }

      :host([size='large']) [part='base'] {
        min-block-size: 2.25rem;
      }

      :host([selected]) [part='base'] {
        border-color: var(--cv-chip-selected-border-color, var(--cv-color-primary, #65d7ff));
        background: var(--cv-chip-selected-background, var(--cv-color-primary-subtle, #193442));
      }

      :host([disabled]) [part='base'] {
        cursor: default;
        opacity: 0.6;
      }

      [part='base']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 2px;
      }

      [part='prefix'],
      [part='suffix'],
      [part='remove-button'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
      }

      [part='label'] {
        display: block;
        min-inline-size: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      [part='remove-button'] {
        margin-inline-end: -0.2em;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        line-height: 1;
        cursor: pointer;
      }

      [part='remove-button']:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector<HTMLButtonElement>('[part="base"]')?.focus(options)
  }

  protected override render() {
    return html`
      <span
        part="base"
        role="button"
        tabindex=${this.disabled ? '-1' : '0'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-pressed=${this.selected ? 'true' : 'false'}
        @click=${this.handleClick}
        @keydown=${this.handleKeydown}
      >
        <span part="prefix"><slot name="prefix"></slot></span>
        <span part="label"><slot></slot></span>
        <span part="suffix"><slot name="suffix"></slot></span>
        ${
          this.removable
            ? html`
              <button
                part="remove-button"
                type="button"
                aria-label="Remove"
                ?disabled=${this.disabled}
                @click=${this.handleRemoveClick}
              >
                ×
              </button>
            `
            : nothing
        }
      </span>
    `
  }

  private handleClick() {
    this.dispatchAction('click')
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
    event.preventDefault()
    this.dispatchAction('keyboard')
  }

  private handleRemoveClick(event: Event) {
    event.stopPropagation()
    if (this.disabled) return
    this.dispatchEvent(
      new CustomEvent<CVChipRemoveDetail>('cv-chip-remove', {
        detail: {value: this.value},
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchAction(source: CVChipActionSource) {
    if (this.disabled) return
    this.dispatchEvent(
      new CustomEvent<CVChipActionDetail>('cv-chip-action', {
        detail: {value: this.value, source},
        bubbles: true,
        composed: true,
      }),
    )
  }
}
