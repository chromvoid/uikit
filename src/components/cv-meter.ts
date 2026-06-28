import {createMeter, type MeterModel} from '@chromvoid/headless-ui/meter'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

let cvMeterNonce = 0

export class CVMeter extends ReatomLitElement {
  static elementName = 'cv-meter'

  static get properties() {
    return {
      value: {type: Number, reflect: true},
      min: {type: Number, reflect: true},
      max: {type: Number, reflect: true},
      low: {type: Number, reflect: true},
      high: {type: Number, reflect: true},
      optimum: {type: Number, reflect: true},
      valueText: {type: String, attribute: 'value-text'},
      ariaLabel: {type: String, attribute: 'aria-label'},
      ariaLabelledBy: {type: String, attribute: 'aria-labelledby'},
      ariaDescribedBy: {type: String, attribute: 'aria-describedby'},
    }
  }

  declare value: number
  declare min: number
  declare max: number
  declare low: number | null
  declare high: number | null
  declare optimum: number | null
  declare valueText: string
  declare ariaLabel: string
  declare ariaLabelledBy: string
  declare ariaDescribedBy: string

  private readonly idBase = `cv-meter-${++cvMeterNonce}`
  private model: MeterModel

  constructor() {
    super()
    this.value = 0
    this.min = 0
    this.max = 100
    this.low = null
    this.high = null
    this.optimum = null
    this.valueText = ''
    this.ariaLabel = ''
    this.ariaLabelledBy = ''
    this.ariaDescribedBy = ''
    this.model = this.createModel()
  }

  static styles = [
    css`
      :host {
        display: block;
        --cv-meter-effective-height: var(--cv-meter-height, 10px);
      }

      :host(:not(:empty)) {
        --cv-meter-effective-height: var(--cv-meter-height, var(--cv-meter-labeled-height, 18px));
      }

      [part='base'] {
        position: relative;
        inline-size: 100%;
        block-size: var(--cv-meter-effective-height);
        border-radius: var(--cv-meter-border-radius, 999px);
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface, #141923);
        overflow: hidden;
        container-type: size;
      }

      [part='indicator'] {
        block-size: 100%;
        inline-size: 100%;
        border-radius: inherit;
        background: var(--cv-gradient-progress-primary, var(--cv-gradient-primary));
        transform: scaleX(var(--cv-meter-value-scale, 0));
        transform-origin: left center;
        transition: transform var(--cv-meter-transition-duration, var(--cv-duration-normal, 220ms))
          var(--cv-easing-standard, ease);
        position: relative;
      }

      [part='label'] {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        max-inline-size: 100%;
        overflow: hidden;
        color: var(--cv-meter-label-color, var(--cv-color-text, #e8ecf6));
        font-size: var(
          --cv-meter-label-font-size,
          min(var(--cv-font-size-xs, 0.75rem), max(0px, calc(var(--cv-meter-effective-height) - 3px)))
        );
        line-height: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
        pointer-events: none;
      }

      [part='label'] slot {
        line-height: inherit;
      }

      ::slotted(*) {
        color: inherit;
        font-size: inherit;
        line-height: inherit;
      }

      @container (max-height: 13px) {
        [part='label'] {
          display: none;
        }
      }

      [part='indicator'][data-status='low'] {
        background: var(--cv-gradient-progress-warning, var(--cv-gradient-primary));
      }

      [part='indicator'][data-status='high'] {
        background: var(--cv-gradient-progress-danger, var(--cv-gradient-primary));
      }

      [part='indicator'][data-status='optimum'] {
        background: var(--cv-gradient-progress-success, var(--cv-gradient-success));
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    const shouldRecreateModel =
      changedProperties.has('min') ||
      changedProperties.has('max') ||
      changedProperties.has('low') ||
      changedProperties.has('high') ||
      changedProperties.has('optimum') ||
      changedProperties.has('valueText') ||
      changedProperties.has('ariaLabel') ||
      changedProperties.has('ariaLabelledBy') ||
      changedProperties.has('ariaDescribedBy')

    if (shouldRecreateModel) {
      this.model = this.createModel()
    } else if (changedProperties.has('value')) {
      const nextValue = this.sanitizeValue(this.value)
      if (this.model.state.value() !== nextValue) {
        this.model.actions.setValue(nextValue)
      }
    }

    this.syncVisualState()
  }

  // A non-finite `value` (NaN/Infinity) must not reach the headless model:
  // `clamp(NaN, …)` returns NaN, which would surface as aria-valuenow="NaN"
  // and --cv-meter-value-scale:NaN. Coerce non-finite input to the range minimum.
  private sanitizeValue(value: number): number {
    return Number.isFinite(value) ? value : Math.min(this.min, this.max)
  }

  private createModel(): MeterModel {
    return createMeter({
      idBase: this.idBase,
      value: this.sanitizeValue(this.value),
      min: this.min,
      max: this.max,
      low: this.toFiniteOrUndefined(this.low),
      high: this.toFiniteOrUndefined(this.high),
      optimum: this.toFiniteOrUndefined(this.optimum),
      ariaLabel: this.ariaLabel || undefined,
      ariaLabelledBy: this.ariaLabelledBy || undefined,
      ariaDescribedBy: this.ariaDescribedBy || undefined,
      formatValueText: this.valueText ? () => this.valueText : undefined,
    })
  }

  private toFiniteOrUndefined(value: number | null): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
  }

  private syncVisualState(): void {
    const percentage = Math.max(0, Math.min(100, this.model.state.percentage()))
    this.style.setProperty('--cv-meter-value-scale', String(percentage / 100))
  }

  protected override render() {
    const props = this.model.contracts.getMeterProps()
    const status = this.model.state.status()

    return html`
      <div
        id=${props.id}
        role=${props.role}
        aria-valuenow=${props['aria-valuenow']}
        aria-valuemin=${props['aria-valuemin']}
        aria-valuemax=${props['aria-valuemax']}
        aria-valuetext=${props['aria-valuetext'] ?? nothing}
        aria-label=${props['aria-label'] ?? nothing}
        aria-labelledby=${props['aria-labelledby'] ?? nothing}
        aria-describedby=${props['aria-describedby'] ?? nothing}
        part="base"
      >
        <div part="indicator" data-status=${status}></div>
        <span part="label"><slot></slot></span>
      </div>
    `
  }
}
