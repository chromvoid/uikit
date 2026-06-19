import {css, html, nothing, type PropertyValues} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVButtonGroupOrientation = 'horizontal' | 'vertical'
type CVButtonGroupPosition = 'first' | 'middle' | 'last' | 'only'
type CVButtonGroupSize = 'small' | 'medium' | 'large'

export class CVButtonGroup extends ReatomLitElement {
  static elementName = 'cv-button-group'

  static get properties() {
    return {
      orientation: {type: String, reflect: true},
      attached: {type: Boolean, reflect: true},
      size: {type: String, reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
    }
  }

  declare orientation: CVButtonGroupOrientation
  declare attached: boolean
  declare size: CVButtonGroupSize
  declare ariaLabel: string

  private groupedButtons = new Set<HTMLElement>()

  constructor() {
    super()
    this.orientation = 'horizontal'
    this.attached = false
    this.size = 'medium'
    this.ariaLabel = ''
  }

  static styles = [
    css`
      :host {
        display: inline-flex;
        --cv-button-group-gap: var(--cv-space-2, 8px);
      }

      [part='base'] {
        display: inline-flex;
        gap: var(--cv-button-group-gap);
      }

      :host([orientation='vertical']) [part='base'] {
        flex-direction: column;
      }

      :host([attached]) [part='base'] {
        gap: 0;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  protected override render() {
    return html`
      <div part="base" role="group" aria-label=${this.ariaLabel || nothing}>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `
  }

  protected override updated(changedProperties: PropertyValues<this>) {
    super.updated(changedProperties)
    if (changedProperties.has('attached') || changedProperties.has('orientation')) {
      this.syncButtonShape()
    }
  }

  override disconnectedCallback() {
    this.clearButtonShape()
    super.disconnectedCallback()
  }

  private handleSlotChange() {
    this.syncButtonShape()
  }

  private syncButtonShape() {
    this.clearButtonShape()

    if (!this.attached) return

    const slot = this.shadowRoot?.querySelector('slot')
    const buttons =
      slot
        ?.assignedElements({flatten: true})
        .filter((element): element is HTMLElement => element.localName === 'cv-button') ?? []
    const orientation = this.orientation === 'vertical' ? 'vertical' : 'horizontal'

    buttons.forEach((button, index) => {
      const position = this.getButtonPosition(index, buttons.length)
      button.setAttribute('data-cv-button-group-position', position)
      button.setAttribute('data-cv-button-group-orientation', orientation)
      this.groupedButtons.add(button)
    })
  }

  private getButtonPosition(index: number, count: number): CVButtonGroupPosition {
    if (count === 1) return 'only'
    if (index === 0) return 'first'
    if (index === count - 1) return 'last'
    return 'middle'
  }

  private clearButtonShape() {
    for (const button of this.groupedButtons) {
      button.removeAttribute('data-cv-button-group-position')
      button.removeAttribute('data-cv-button-group-orientation')
    }

    this.groupedButtons.clear()
  }
}
