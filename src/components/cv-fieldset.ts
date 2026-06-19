import {css, html, nothing} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVFieldsetOrientation = 'vertical' | 'horizontal'
type CVFieldsetSize = 'small' | 'medium' | 'large'

let cvFieldsetNonce = 0

function hasAssignedSlotContent(slot: HTMLSlotElement): boolean {
  return slot
    .assignedNodes({flatten: true})
    .some((node) => node.nodeType === Node.ELEMENT_NODE || Boolean(node.textContent?.trim()))
}

export class CVFieldset extends ReatomLitElement {
  static elementName = 'cv-fieldset'

  static get properties() {
    return {
      disabled: {type: Boolean, reflect: true},
      invalid: {type: Boolean, reflect: true},
      orientation: {type: String, reflect: true},
      size: {type: String, reflect: true},
    }
  }

  declare disabled: boolean
  declare invalid: boolean
  declare orientation: CVFieldsetOrientation
  declare size: CVFieldsetSize

  private readonly idBase = `cv-fieldset-${++cvFieldsetNonce}`
  private hasLegend = false
  private hasDescription = false
  private hasError = false

  constructor() {
    super()
    this.disabled = false
    this.invalid = false
    this.orientation = 'vertical'
    this.size = 'medium'
  }

  static styles = [
    css`
      :host {
        display: block;
      }

      [part='base'] {
        display: grid;
        gap: var(--cv-fieldset-gap, var(--cv-space-2, 8px));
        min-inline-size: 0;
        margin: 0;
        padding: 0;
        border: 0;
      }

      [part='legend'] {
        padding: 0;
        color: var(--cv-color-text, #e8ecf6);
        font-size: var(--cv-font-size-sm, 13px);
      }

      [part='legend'][hidden],
      [part='description'][hidden],
      [part='error'][hidden] {
        display: none;
      }

      [part='fields'] {
        display: grid;
        gap: var(--cv-fieldset-field-gap, var(--cv-space-2, 8px));
      }

      :host([orientation='horizontal']) [part='fields'] {
        display: flex;
        flex-wrap: wrap;
        align-items: start;
      }

      [part='description'],
      [part='error'] {
        font-size: var(--cv-font-size-xs, 12px);
        line-height: 1.35;
      }

      [part='description'] {
        color: var(--cv-color-text-muted, #9aa6bf);
      }

      [part='error'] {
        color: var(--cv-color-danger, #ff6b6b);
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  private handleLegendSlotChange(event: Event) {
    this.hasLegend = hasAssignedSlotContent(event.currentTarget as HTMLSlotElement)
    this.requestUpdate()
  }

  private handleDescriptionSlotChange(event: Event) {
    this.hasDescription = hasAssignedSlotContent(event.currentTarget as HTMLSlotElement)
    this.requestUpdate()
  }

  private handleErrorSlotChange(event: Event) {
    this.hasError = hasAssignedSlotContent(event.currentTarget as HTMLSlotElement)
    this.requestUpdate()
  }

  protected override render() {
    const describedBy = [
      this.hasDescription ? `${this.idBase}-description` : null,
      this.invalid && this.hasError ? `${this.idBase}-error` : null,
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <fieldset
        part="base"
        ?disabled=${this.disabled}
        aria-invalid=${this.invalid ? 'true' : nothing}
        aria-describedby=${describedBy || nothing}
      >
        <legend part="legend" ?hidden=${!this.hasLegend}>
          <slot name="legend" @slotchange=${this.handleLegendSlotChange}></slot>
        </legend>
        <div id=${`${this.idBase}-description`} part="description" ?hidden=${!this.hasDescription}>
          <slot name="description" @slotchange=${this.handleDescriptionSlotChange}></slot>
        </div>
        <div part="fields"><slot></slot></div>
        <div
          id=${`${this.idBase}-error`}
          part="error"
          role=${this.invalid && this.hasError ? 'alert' : nothing}
          ?hidden=${!this.hasError}
        >
          <slot name="error" @slotchange=${this.handleErrorSlotChange}></slot>
        </div>
      </fieldset>
    `
  }
}
