import {css} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export type GuidancePanelVariant = 'coach-mark' | 'hint' | 'warning' | 'blocked'
export type GuidancePanelDensity = 'comfortable' | 'compact'

export class CVGuidancePanel extends ReatomLitElement {
  static elementName = 'cv-guidance-panel'

  static get properties() {
    return {
      variant: {type: String, reflect: true},
      density: {type: String, reflect: true},
      hasIcon: {type: Boolean, attribute: 'has-icon', reflect: true},
    }
  }

  declare variant: GuidancePanelVariant
  declare density: GuidancePanelDensity
  declare hasIcon: boolean

  constructor() {
    super()
    this.variant = 'coach-mark'
    this.density = 'comfortable'
    this.hasIcon = false
  }

  static styles = [
    css`
      :host {
        display: block;
        color: var(--cv-guidance-panel-color, var(--cv-color-text, #e8ecf6));
        font-size: var(--cv-guidance-panel-font-size, var(--cv-font-size-base, 14px));
        line-height: var(--cv-guidance-panel-line-height, 1.45);
        contain: content;
      }

      [part='base'] {
        display: grid;
        gap: var(--cv-guidance-panel-gap, 14px);
        padding: var(--cv-guidance-panel-padding-block, 20px) var(--cv-guidance-panel-padding-inline, 20px);
        border: 1px solid var(--cv-guidance-panel-border-color, var(--cv-color-border, #2a3245));
        border-radius: var(--cv-guidance-panel-border-radius, 14px);
        background: var(--cv-guidance-panel-background, var(--cv-color-surface-elevated, #1d2432));
        box-shadow: var(--cv-guidance-panel-shadow, none);
      }

      [part='header'] {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
        gap: var(--cv-guidance-panel-header-gap, var(--cv-space-2, 8px));
      }

      [part='icon'] {
        display: none;
        align-items: center;
        justify-content: center;
        min-inline-size: var(--cv-guidance-panel-icon-size, 20px);
        min-block-size: var(--cv-guidance-panel-icon-size, 20px);
        color: var(--cv-guidance-panel-icon-color, currentColor);
      }

      :host([has-icon]) [part='header'] {
        grid-template-columns: auto minmax(0, 1fr) auto;
      }

      :host([has-icon]) [part='icon'] {
        display: inline-flex;
      }

      [part='title'] {
        min-inline-size: 0;
        color: var(--cv-guidance-panel-title-color, var(--cv-color-text-strong, currentColor));
        font-size: var(--cv-guidance-panel-title-font-size, var(--cv-font-size-md, 16px));
        font-weight: var(--cv-guidance-panel-title-font-weight, 700);
        line-height: var(--cv-guidance-panel-title-line-height, 1.25);
      }

      [part='progress'] {
        color: var(--cv-guidance-panel-progress-color, var(--cv-color-text-muted, #9ca8bd));
        font-size: var(--cv-guidance-panel-progress-font-size, var(--cv-font-size-sm, 12px));
        line-height: 1.3;
        white-space: nowrap;
      }

      [part='body'] {
        min-inline-size: 0;
        color: var(--cv-guidance-panel-body-color, var(--cv-color-text-muted, #bac4d8));
        line-height: var(--cv-guidance-panel-body-line-height, 1.55);
      }

      [part='body'] ::slotted(*) {
        margin-block: 0;
      }

      [part='actions'] {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--cv-guidance-panel-actions-gap, 10px);
        padding-block-start: var(--cv-guidance-panel-actions-padding-block-start, 2px);
      }

      ::slotted(button) {
        min-block-size: 34px;
        padding: 0 14px;
        border: 1px solid transparent;
        border-radius: var(--cv-guidance-panel-action-radius, 999px);
        background: transparent;
        color: var(--cv-guidance-panel-action-color, var(--cv-color-text, #e8ecf6));
        font: inherit;
        font-size: var(--cv-guidance-panel-action-font-size, 13px);
        font-weight: var(--cv-guidance-panel-action-font-weight, 650);
        line-height: 1;
        cursor: pointer;
      }

      ::slotted(button:hover) {
        background: var(--cv-guidance-panel-action-hover-background, rgba(255, 255, 255, 0.08));
      }

      ::slotted(button:focus-visible) {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 2px;
      }

      ::slotted(button[data-guidance-action='primary']) {
        border-color: var(--cv-guidance-panel-primary-border-color, transparent);
        background: var(--cv-guidance-panel-primary-background, var(--cv-color-primary, #65d7ff));
        color: var(--cv-guidance-panel-primary-color, var(--cv-color-on-primary, #06131a));
      }

      ::slotted(button[data-guidance-action='primary']:hover) {
        background: var(
          --cv-guidance-panel-primary-hover-background,
          color-mix(in oklab, var(--cv-color-primary, #65d7ff) 86%, white)
        );
      }

      ::slotted(button[data-guidance-action='secondary']) {
        border-color: var(--cv-guidance-panel-secondary-border-color, var(--cv-color-border, #2a3245));
        background: var(--cv-guidance-panel-secondary-background, rgba(255, 255, 255, 0.04));
      }

      ::slotted(button[data-guidance-action='close']) {
        min-inline-size: 30px;
        min-block-size: 30px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--cv-guidance-panel-close-color, var(--cv-color-text-muted, #bac4d8));
      }

      :host([density='compact']) [part='base'] {
        gap: var(--cv-guidance-panel-compact-gap, var(--cv-space-2, 8px));
        padding: var(--cv-guidance-panel-compact-padding-block, var(--cv-space-3, 12px))
          var(--cv-guidance-panel-compact-padding-inline, var(--cv-space-3, 12px));
      }

      :host([density='compact']) [part='title'] {
        font-size: var(--cv-guidance-panel-compact-title-font-size, var(--cv-font-size-base, 14px));
      }

      :host([density='compact']) [part='body'] {
        font-size: var(--cv-guidance-panel-compact-body-font-size, var(--cv-font-size-sm, 13px));
      }

      :host([variant='coach-mark']) [part='base'] {
        border-color: color-mix(in oklab, var(--cv-color-info, #65d7ff) 44%, var(--cv-color-border, #2a3245));
        background: color-mix(
          in oklab,
          var(--cv-color-info, #65d7ff) 10%,
          var(--cv-color-surface-elevated, #1d2432)
        );
      }

      :host([variant='coach-mark']) [part='icon'] {
        color: var(--cv-color-info, #65d7ff);
      }

      :host([variant='hint']) [part='base'] {
        border-color: var(--cv-guidance-panel-hint-border-color, var(--cv-color-border, #2a3245));
        background: var(
          --cv-guidance-panel-hint-background,
          var(--cv-color-surface-subtle, var(--cv-color-surface-elevated, #1d2432))
        );
      }

      :host([variant='hint']) [part='icon'] {
        color: var(--cv-guidance-panel-hint-icon-color, var(--cv-color-text-muted, #9ca8bd));
      }

      :host([variant='warning']) [part='base'] {
        border-color: color-mix(
          in oklab,
          var(--cv-color-warning, #ffc857) 54%,
          var(--cv-color-border, #2a3245)
        );
        background: color-mix(
          in oklab,
          var(--cv-color-warning, #ffc857) 12%,
          var(--cv-color-surface-elevated, #1d2432)
        );
      }

      :host([variant='warning']) [part='icon'] {
        color: var(--cv-color-warning, #ffc857);
      }

      :host([variant='blocked']) [part='base'] {
        border-color: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 54%,
          var(--cv-color-border, #2a3245)
        );
        background: color-mix(
          in oklab,
          var(--cv-color-danger, #ff7d86) 12%,
          var(--cv-color-surface-elevated, #1d2432)
        );
      }

      :host([variant='blocked']) [part='icon'] {
        color: var(--cv-color-danger, #ff7d86);
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  private handleIconSlotChange(event: Event): void {
    const slot = event.currentTarget
    if (!(slot instanceof HTMLSlotElement)) return
    this.hasIcon = slot.assignedElements({flatten: true}).length > 0
  }

  protected override render() {
    return html`
      <section part="base" role="note" data-variant=${this.variant} data-density=${this.density}>
        <header part="header">
          <span part="icon"><slot name="icon" @slotchange=${this.handleIconSlotChange}></slot></span>
          <div part="title"><slot name="title"></slot></div>
          <div part="progress"><slot name="progress"></slot></div>
        </header>
        <div part="body"><slot></slot></div>
        <div part="actions"><slot name="actions"></slot></div>
      </section>
    `
  }
}
