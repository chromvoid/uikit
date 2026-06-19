import {css} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import type {CVStatusTone} from './cv-status-indicator'

type CVOperationQueueDensity = 'comfortable' | 'compact'

export class CVOperationQueue extends ReatomLitElement {
  static elementName = 'cv-operation-queue'

  static get properties() {
    return {
      label: {type: String},
      busy: {type: Boolean, reflect: true},
      empty: {type: Boolean, reflect: true},
      density: {type: String, reflect: true},
      tone: {type: String, reflect: true},
      hasIconSlot: {type: Boolean, state: true},
      hasActionsSlot: {type: Boolean, state: true},
      hasFooterSlot: {type: Boolean, state: true},
    }
  }

  declare label: string
  declare busy: boolean
  declare empty: boolean
  declare density: CVOperationQueueDensity
  declare tone: CVStatusTone
  declare private hasIconSlot: boolean
  declare private hasActionsSlot: boolean
  declare private hasFooterSlot: boolean

  constructor() {
    super()
    this.label = 'Operations'
    this.busy = false
    this.empty = false
    this.density = 'comfortable'
    this.tone = 'neutral'
    this.hasIconSlot = false
    this.hasActionsSlot = false
    this.hasFooterSlot = false
  }

  static styles = [
    css`
      @keyframes cv-operation-queue-busy-scan {
        from {
          transform: translateX(-120%);
        }

        to {
          transform: translateX(220%);
        }
      }

      :host {
        display: block;
        inline-size: var(--cv-operation-queue-inline-size, 100%);
        color: var(--cv-operation-queue-color, var(--cv-color-text, #e8ecf6));
        --cv-operation-queue-gap: var(--cv-space-3, 12px);
        --cv-operation-queue-padding: var(--cv-space-4, 16px);
        --cv-operation-queue-radius: var(--cv-radius-md, 10px);
        --cv-operation-queue-border: 1px solid var(--cv-color-border, #2a3245);
        --cv-operation-queue-background: var(--cv-color-surface-2, #181f2b);
        --cv-operation-queue-shadow: var(--cv-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.24));
        --cv-operation-queue-overflow: hidden;
        --cv-operation-queue-header-gap: var(--cv-space-2, 8px);
        --cv-operation-queue-body-gap: var(--cv-space-2, 8px);
        --cv-operation-queue-footer-gap: var(--cv-space-2, 8px);
        --cv-operation-queue-row-background: color-mix(
          in oklab,
          var(--cv-operation-queue-background) 88%,
          var(--cv-operation-queue-accent-color) 4%
        );
        --cv-operation-queue-empty-min-block-size: 96px;
        --cv-operation-queue-accent-color: var(--cv-color-border-strong, #4c5870);
        --cv-operation-queue-accent-border: var(--cv-color-border-strong, #4c5870);
        --cv-operation-queue-accent-ring: transparent;
        --cv-operation-queue-busy-line-opacity: 0.86;
      }

      :host([density='compact']) {
        --cv-operation-queue-gap: var(--cv-space-2, 8px);
        --cv-operation-queue-padding: var(--cv-space-3, 12px);
        --cv-operation-queue-body-gap: var(--cv-space-1, 4px);
      }

      :host([tone='primary']),
      :host([tone='info']) {
        --cv-operation-queue-accent-color: var(--cv-color-primary, #65d7ff);
        --cv-operation-queue-accent-border: var(--cv-color-primary-border, rgba(101, 215, 255, 0.3));
        --cv-operation-queue-accent-ring: var(--cv-color-primary-ring, rgba(101, 215, 255, 0.24));
      }

      :host([tone='success']) {
        --cv-operation-queue-accent-color: var(--cv-color-success, #5beba0);
        --cv-operation-queue-accent-border: var(--cv-color-success-border, rgba(91, 235, 160, 0.3));
        --cv-operation-queue-accent-ring: var(--cv-color-success-ring, rgba(91, 235, 160, 0.1));
      }

      :host([tone='warning']) {
        --cv-operation-queue-accent-color: var(--cv-color-warning, #ffd166);
        --cv-operation-queue-accent-border: var(--cv-color-warning-border, rgba(255, 209, 102, 0.3));
        --cv-operation-queue-accent-ring: var(--cv-color-warning-ring, rgba(255, 209, 102, 0.1));
      }

      :host([tone='danger']) {
        --cv-operation-queue-accent-color: var(--cv-color-danger, #ff6b6b);
        --cv-operation-queue-accent-border: var(--cv-color-danger-border, rgba(255, 107, 107, 0.3));
        --cv-operation-queue-accent-ring: var(--cv-color-danger-ring, rgba(255, 107, 107, 0.1));
      }

      [part='base'] {
        position: relative;
        display: grid;
        gap: var(--cv-operation-queue-gap);
        box-sizing: border-box;
        min-inline-size: 0;
        padding: var(--cv-operation-queue-padding);
        overflow: var(--cv-operation-queue-overflow);
        border: var(--cv-operation-queue-border);
        border-radius: var(--cv-operation-queue-radius);
        background: var(--cv-operation-queue-background);
        box-shadow: var(--cv-operation-queue-shadow);
        color: inherit;
        transition:
          border-color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          box-shadow var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
      }

      [part='base']::before {
        content: '';
        position: absolute;
        inset: 0 0 auto;
        block-size: 1px;
        background: linear-gradient(90deg, transparent, var(--cv-operation-queue-accent-border), transparent);
        opacity: 0.52;
        pointer-events: none;
      }

      :host([busy]) [part='base'] {
        border-color: var(--cv-operation-queue-accent-border);
        box-shadow:
          var(--cv-operation-queue-shadow),
          0 0 0 1px var(--cv-operation-queue-accent-ring);
      }

      :host([busy]) [part='base']::after {
        content: '';
        position: absolute;
        inset: 0 auto auto 0;
        inline-size: 42%;
        block-size: 2px;
        background: linear-gradient(90deg, transparent, var(--cv-operation-queue-accent-color), transparent);
        opacity: var(--cv-operation-queue-busy-line-opacity);
        animation: cv-operation-queue-busy-scan 1.24s linear infinite;
        pointer-events: none;
      }

      [part='header'] {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--cv-operation-queue-header-gap);
        min-inline-size: 0;
      }

      [part='title'],
      [part='summary'],
      [part='body'],
      [part='empty'],
      [part='footer'] {
        min-inline-size: 0;
      }

      [part='title'] {
        grid-column: 2;
        display: grid;
        gap: var(--cv-space-1, 4px);
        color: var(--cv-color-text-strong, #f5f7fc);
        font-weight: var(--cv-font-weight-semibold, 650);
        line-height: 1.3;
      }

      [part='summary'],
      [part='empty'] {
        color: var(--cv-color-text-muted, #9aa6bd);
      }

      [part='summary'] {
        color: var(--cv-operation-queue-summary-color, var(--cv-color-text-strong, #f5f7fc));
      }

      [part='body'] {
        display: grid;
        gap: var(--cv-operation-queue-body-gap);
      }

      [part='empty'] {
        display: grid;
        place-items: center;
        box-sizing: border-box;
        min-block-size: var(--cv-operation-queue-empty-min-block-size);
        padding: var(--cv-space-5, 20px);
        border: 1px dashed var(--cv-color-border-muted, #2a3245);
        border-radius: var(--cv-radius-sm, 6px);
        background: var(--cv-color-surface-glass-subtle, #141923);
        text-align: center;
      }

      [part='footer'] {
        display: grid;
        gap: var(--cv-operation-queue-footer-gap);
        color: var(--cv-color-text-muted, #9aa6bd);
        font-size: var(--cv-font-size-xs, 12px);
        line-height: 1.4;
      }

      [part='icon'] {
        grid-column: 1;
        color: var(--cv-operation-queue-accent-color);
      }

      [part='actions'],
      [part='icon'] {
        display: inline-flex;
        align-items: center;
      }

      [part='actions'] {
        grid-column: 3;
        justify-content: end;
        gap: var(--cv-space-2, 8px);
      }

      [part='actions'][hidden],
      [part='footer'][hidden],
      [part='icon'][hidden] {
        display: none;
      }

      slot[name='icon'],
      slot[name='summary'],
      slot[name='actions'],
      slot[name='footer'],
      slot[name='empty'] {
        display: contents;
      }

      slot[name='icon']::slotted(*),
      slot[name='summary']::slotted(*),
      slot[name='actions']::slotted(*),
      slot[name='footer']::slotted(*) {
        color: inherit;
      }

      slot[name='actions']::slotted(cv-button) {
        --cv-button-text-color: var(--cv-operation-queue-summary-color, var(--cv-color-text-strong, #f5f7fc));
      }

      slot:not([name])::slotted(cv-task-list) {
        color: var(--cv-operation-queue-color, var(--cv-color-text, #e8ecf6));
        --cv-task-list-padding: 0;
        --cv-task-list-border: 0;
        --cv-task-list-background: transparent;
        --cv-task-list-shadow: 0 0 0 transparent;
        --cv-task-list-radius: 0;
        --cv-task-list-row-color: var(--cv-operation-queue-color, var(--cv-color-text, #e8ecf6));
        --cv-task-list-row-background: var(--cv-operation-queue-row-background);
        --cv-task-list-row-background-hover: color-mix(
          in oklab,
          var(--cv-operation-queue-row-background) 82%,
          var(--cv-operation-queue-accent-color) 10%
        );
        --cv-task-list-row-border-color: var(--cv-color-border-muted, #2a3245);
        --cv-task-list-row-border-color-hover: var(--cv-operation-queue-accent-border);
      }

      @media (prefers-reduced-motion: reduce) {
        :host([busy]) [part='base']::after {
          inline-size: 100%;
          animation: none;
        }
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
      <section
        part="base"
        aria-label=${this.label}
        aria-busy=${this.busy ? 'true' : 'false'}
        data-tone=${this.tone}
      >
        <header part="header">
          <span part="icon" ?hidden=${!this.hasIconSlot}>
            <slot name="icon" @slotchange=${this.handleIconSlotChange}></slot>
          </span>
          <div part="title"><span part="summary"><slot name="summary">${this.label}</slot></span></div>
          <div part="actions" ?hidden=${!this.hasActionsSlot}>
            <slot name="actions" @slotchange=${this.handleActionsSlotChange}></slot>
          </div>
        </header>
        ${
          this.empty
            ? html`
                <div part="empty"><slot name="empty"></slot></div>
              `
            : html`
                <div part="body"><slot></slot></div>
              `
        }
        <footer part="footer" ?hidden=${!this.hasFooterSlot}>
          <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
        </footer>
      </section>
    `
  }

  private handleIconSlotChange(event: Event) {
    this.hasIconSlot = this.hasAssignedElements(event)
  }

  private handleActionsSlotChange(event: Event) {
    this.hasActionsSlot = this.hasAssignedElements(event)
  }

  private handleFooterSlotChange(event: Event) {
    this.hasFooterSlot = this.hasAssignedElements(event)
  }

  private hasAssignedElements(event: Event): boolean {
    const slot = event.currentTarget as HTMLSlotElement | null
    return Boolean(slot?.assignedElements({flatten: true}).length)
  }
}
