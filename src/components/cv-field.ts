import {css, html, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVFieldOrientation = 'vertical' | 'horizontal'
type CVFieldSize = 'small' | 'medium' | 'large'

let cvFieldNonce = 0

function hasAssignedSlotContent(slot: HTMLSlotElement): boolean {
  return slot
    .assignedNodes({flatten: true})
    .some((node) => node.nodeType === Node.ELEMENT_NODE || Boolean(node.textContent?.trim()))
}

export class CVField extends ReatomLitElement {
  static elementName = 'cv-field'

  static get properties() {
    return {
      for: {type: String, reflect: true},
      required: {type: Boolean, reflect: true},
      disabled: {type: Boolean, reflect: true},
      invalid: {type: Boolean, reflect: true},
      orientation: {type: String, reflect: true},
      size: {type: String, reflect: true},
    }
  }

  declare for: string
  declare required: boolean
  declare disabled: boolean
  declare invalid: boolean
  declare orientation: CVFieldOrientation
  declare size: CVFieldSize

  private readonly idBase = `cv-field-${++cvFieldNonce}`
  private control: HTMLElement | null = null
  private hasLabel = false
  private hasDescription = false
  private hasError = false

  constructor() {
    super()
    this.for = ''
    this.required = false
    this.disabled = false
    this.invalid = false
    this.orientation = 'vertical'
    this.size = 'medium'
  }

  static styles = [
    css`
      :host {
        display: grid;
        gap: var(--cv-field-gap, var(--cv-space-1, 4px));
      }

      :host([orientation='horizontal']) {
        grid-template-columns: minmax(8rem, max-content) minmax(0, 1fr);
        align-items: start;
        column-gap: var(--cv-field-horizontal-gap, var(--cv-space-3, 12px));
      }

      [part='label'] {
        color: var(--cv-field-label-color, var(--cv-color-text, #e8ecf6));
        font-size: var(--cv-field-label-font-size, var(--cv-font-size-sm, 13px));
      }

      [part='label'][hidden],
      [part='description'][hidden],
      [part='error'][hidden] {
        display: none;
      }

      [part='control'] {
        min-inline-size: 0;
      }

      [part='description'],
      [part='error'] {
        font-size: var(--cv-field-meta-font-size, var(--cv-font-size-xs, 12px));
        line-height: 1.35;
      }

      [part='description'] {
        color: var(--cv-field-description-color, var(--cv-color-text-muted, #9aa6bf));
      }

      [part='error'] {
        color: var(--cv-field-error-color, var(--cv-color-danger, #ff6b6b));
      }

      :host([orientation='horizontal']) [part='control'],
      :host([orientation='horizontal']) [part='description'],
      :host([orientation='horizontal']) [part='error'] {
        grid-column: 2;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    if (
      changedProperties.has('for') ||
      changedProperties.has('required') ||
      changedProperties.has('disabled') ||
      changedProperties.has('invalid')
    ) {
      this.syncControl()
    }
  }

  private handleControlSlotChange(event: Event) {
    const slot = event.currentTarget as HTMLSlotElement
    this.control =
      slot
        .assignedElements({flatten: true})
        .find((element): element is HTMLElement => element instanceof HTMLElement) ?? null
    this.syncControl()
  }

  private handleLabelSlotChange(event: Event) {
    this.hasLabel = hasAssignedSlotContent(event.currentTarget as HTMLSlotElement)
    this.requestUpdate()
    this.syncControl()
  }

  private handleDescriptionSlotChange(event: Event) {
    this.hasDescription = hasAssignedSlotContent(event.currentTarget as HTMLSlotElement)
    this.requestUpdate()
    this.syncControl()
  }

  private handleErrorSlotChange(event: Event) {
    this.hasError = hasAssignedSlotContent(event.currentTarget as HTMLSlotElement)
    this.requestUpdate()
    this.syncControl()
  }

  private syncControl() {
    if (!this.control) return

    const controlId = this.for || this.control.id || `${this.idBase}-control`
    if (!this.control.id) {
      this.control.id = controlId
    }

    this.setBooleanControlState('required', this.required)
    this.setBooleanControlState('disabled', this.disabled)
    this.setBooleanControlState('invalid', this.invalid)

    if (this.hasLabel) {
      this.control.setAttribute('aria-labelledby', `${this.idBase}-label`)
    } else {
      this.control.removeAttribute('aria-labelledby')
    }

    const descriptions = [
      this.hasDescription ? `${this.idBase}-description` : null,
      this.invalid && this.hasError ? `${this.idBase}-error` : null,
    ].filter(Boolean)

    if (descriptions.length > 0) {
      this.control.setAttribute('aria-describedby', descriptions.join(' '))
    } else {
      this.control.removeAttribute('aria-describedby')
    }

    if (this.invalid) {
      this.control.setAttribute('aria-invalid', 'true')
    } else {
      this.control.removeAttribute('aria-invalid')
    }
  }

  private setBooleanControlState(name: 'required' | 'disabled' | 'invalid', value: boolean) {
    if (!this.control) return
    if (name in this.control) {
      ;(this.control as unknown as Record<string, boolean>)[name] = value
    }
    this.control.toggleAttribute(name, value)
  }

  protected override render() {
    const controlId = this.for || this.control?.id || `${this.idBase}-control`

    return html`
      <label id=${`${this.idBase}-label`} part="label" for=${controlId} ?hidden=${!this.hasLabel}>
        <slot name="label" @slotchange=${this.handleLabelSlotChange}></slot>
      </label>
      <div part="control">
        <slot @slotchange=${this.handleControlSlotChange}></slot>
      </div>
      <div id=${`${this.idBase}-description`} part="description" ?hidden=${!this.hasDescription}>
        <slot name="description" @slotchange=${this.handleDescriptionSlotChange}></slot>
      </div>
      <div
        id=${`${this.idBase}-error`}
        part="error"
        role=${this.invalid && this.hasError ? 'alert' : nothing}
        ?hidden=${!this.hasError}
      >
        <slot name="error" @slotchange=${this.handleErrorSlotChange}></slot>
      </div>
    `
  }
}
