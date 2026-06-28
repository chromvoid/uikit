import {createProgress, type ProgressModel} from '@chromvoid/headless-ui/progress'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

let cvProgressNonce = 0
type CVProgressTone = 'upload' | 'queued' | 'success' | 'danger' | 'warning'

export class CVProgress extends ReatomLitElement {
  static elementName = 'cv-progress'

  static get properties() {
    return {
      value: {type: Number, reflect: true},
      min: {type: Number, reflect: true},
      max: {type: Number, reflect: true},
      indeterminate: {type: Boolean, reflect: true},
      valueText: {type: String, attribute: 'value-text'},
      ariaLabel: {type: String, attribute: 'aria-label'},
      tone: {type: String, reflect: true},
    }
  }

  declare value: number
  declare min: number
  declare max: number
  declare indeterminate: boolean
  declare valueText: string
  declare ariaLabel: string
  declare tone: CVProgressTone | undefined

  private readonly idBase = `cv-progress-${++cvProgressNonce}`
  private model: ProgressModel

  constructor() {
    super()
    this.value = 0
    this.min = 0
    this.max = 100
    this.indeterminate = false
    this.valueText = ''
    this.ariaLabel = ''
    this.tone = undefined
    this.model = this.createModel()
  }

  static styles = [
    css`
      :host {
        display: block;
        --cv-progress-effective-height: var(--cv-progress-height, 10px);
      }

      :host(:not(:empty)) {
        --cv-progress-effective-height: var(--cv-progress-height, var(--cv-progress-labeled-height, 18px));
      }

      [part='base'] {
        position: relative;
        inline-size: 100%;
        block-size: var(--cv-progress-effective-height);
        border-radius: 999px;
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-progress-track-color, var(--cv-color-surface, #141923));
        overflow: hidden;
        container-type: size;
      }

      [part='indicator'] {
        block-size: 100%;
        inline-size: 100%;
        border-radius: inherit;
        background: var(
          --cv-progress-indicator-background,
          var(--cv-gradient-progress-primary, var(--cv-gradient-primary))
        );
        transform: scaleX(var(--cv-progress-value-scale, 0));
        transform-origin: left center;
        transition: transform var(--cv-duration-normal, 220ms) var(--cv-easing-standard, ease);
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
        color: var(--cv-progress-label-color, var(--cv-color-text, #e8ecf6));
        font-size: var(
          --cv-progress-label-font-size,
          min(var(--cv-font-size-xs, 0.75rem), max(0px, calc(var(--cv-progress-effective-height) - 3px)))
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

      :host([indeterminate]) [part='indicator'] {
        inline-size: 35%;
        animation: cv-progress-indeterminate 1.15s linear infinite;
        transform: translateX(-120%);
      }

      :host([data-complete]) [part='indicator'] {
        background: var(--cv-gradient-progress-success, var(--cv-gradient-success));
      }

      :host([tone='upload']) {
        --cv-progress-height: var(--cv-progress-upload-height, 6px);
        --cv-progress-track-color: var(--cv-progress-upload-track-color, var(--cv-color-border));
        --cv-progress-indicator-background: var(
          --cv-progress-upload-indicator-background,
          var(--cv-gradient-primary)
        );
      }

      :host([tone='queued']) {
        --cv-progress-indicator-background: var(
          --cv-progress-tone-queued-background,
          var(--cv-color-border-strong)
        );
      }

      :host([tone='success']) {
        --cv-progress-indicator-background: var(
          --cv-progress-tone-success-background,
          var(--cv-color-success)
        );
      }

      :host([tone='danger']) {
        --cv-progress-indicator-background: var(--cv-progress-tone-danger-background, var(--cv-color-danger));
      }

      :host([tone='warning']) {
        --cv-progress-indicator-background: var(
          --cv-progress-tone-warning-background,
          var(--cv-color-warning)
        );
      }

      @keyframes cv-progress-indeterminate {
        0% {
          transform: translateX(-120%);
        }
        100% {
          transform: translateX(320%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        :host([indeterminate]) [part='indicator'] {
          animation-duration: 4.6s;
        }
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
      changedProperties.has('valueText') ||
      changedProperties.has('ariaLabel')

    if (shouldRecreateModel) {
      this.model = this.createModel()
    } else if (changedProperties.has('value') && this.model.state.value() !== this.value) {
      this.model.actions.setValue(this.value)
    }

    if (changedProperties.has('indeterminate')) {
      this.model.actions.setIndeterminate(this.indeterminate)
    }

    this.syncVisualState()
  }

  private createModel(): ProgressModel {
    return createProgress({
      idBase: this.idBase,
      value: this.value,
      min: this.min,
      max: this.max,
      isIndeterminate: this.indeterminate,
      valueText: this.valueText || undefined,
      ariaLabel: this.ariaLabel || undefined,
    })
  }

  private syncVisualState(): void {
    const percentage = Math.max(0, Math.min(100, this.model.state.percentage()))
    this.style.setProperty('--cv-progress-value-scale', String(percentage / 100))
    this.toggleAttribute('data-complete', this.model.state.isComplete())
  }

  protected override render() {
    const props = this.model.contracts.getProgressProps()

    return html`
      <div
        id=${props.id}
        role=${props.role}
        aria-valuenow=${props['aria-valuenow'] ?? nothing}
        aria-valuemin=${props['aria-valuemin'] ?? nothing}
        aria-valuemax=${props['aria-valuemax'] ?? nothing}
        aria-valuetext=${props['aria-valuetext'] ?? nothing}
        aria-label=${props['aria-label'] ?? nothing}
        aria-labelledby=${props['aria-labelledby'] ?? nothing}
        aria-describedby=${props['aria-describedby'] ?? nothing}
        part="base"
      >
        <div part="indicator"></div>
        <span part="label"><slot></slot></span>
      </div>
    `
  }
}
