import {css, html, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVStep} from './cv-step'

type CVStepsOrientation = 'horizontal' | 'vertical'

export interface CVStepSelectDetail {
  value: string
}

export class CVSteps extends ReatomLitElement {
  static elementName = 'cv-steps'

  static get properties() {
    return {
      current: {type: String, reflect: true},
      orientation: {type: String, reflect: true},
      selectable: {type: Boolean, reflect: true},
    }
  }

  declare current: string
  declare orientation: CVStepsOrientation
  declare selectable: boolean

  private steps: CVStep[] = []

  constructor() {
    super()
    this.current = ''
    this.orientation = 'horizontal'
    this.selectable = false
  }

  static styles = [
    css`
      :host {
        display: block;
      }

      [part='base'] {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cv-steps-gap, var(--cv-space-3, 12px));
        margin: 0;
        padding: 0;
        list-style: none;
      }

      :host([orientation='vertical']) [part='base'] {
        flex-direction: column;
      }
    `,
  ]

  static define() {
    CVStep.define()
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    if (changedProperties.has('current')) {
      this.syncSteps()
    }
  }

  private handleSlotChange(event: Event) {
    const slot = event.currentTarget as HTMLSlotElement
    this.steps = slot
      .assignedElements({flatten: true})
      .filter((element): element is CVStep => element instanceof CVStep)
    this.syncSteps()
  }

  private syncSteps() {
    for (const step of this.steps) {
      if (step.value && step.value === this.current) {
        step.status = 'current'
      } else if (step.status === 'current') {
        step.status = 'pending'
      }
    }
  }

  private handleClick(event: MouseEvent) {
    if (!this.selectable) return
    const step = event.composedPath().find((target): target is CVStep => target instanceof CVStep)
    if (!step || step.disabled || !step.value) return
    this.dispatchEvent(
      new CustomEvent<CVStepSelectDetail>('cv-step-select', {
        detail: {value: step.value},
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    return html`
      <div
        part="base"
        role="list"
        aria-orientation=${this.orientation}
        tabindex=${this.selectable ? '0' : nothing}
        @click=${this.handleClick}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `
  }
}
