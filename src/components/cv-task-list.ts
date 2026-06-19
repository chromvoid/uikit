import {css} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

type CVTaskListDensity = 'comfortable' | 'compact'

export class CVTaskList extends ReatomLitElement {
  static elementName = 'cv-task-list'

  static get properties() {
    return {
      label: {type: String},
      busy: {type: Boolean, reflect: true},
      empty: {type: Boolean, reflect: true},
      density: {type: String, reflect: true},
      hasHeaderSlot: {type: Boolean, state: true},
      hasFooterSlot: {type: Boolean, state: true},
    }
  }

  declare label: string
  declare busy: boolean
  declare empty: boolean
  declare density: CVTaskListDensity
  declare private hasHeaderSlot: boolean
  declare private hasFooterSlot: boolean

  constructor() {
    super()
    this.label = 'Tasks'
    this.busy = false
    this.empty = false
    this.density = 'comfortable'
    this.hasHeaderSlot = false
    this.hasFooterSlot = false
  }

  static styles = [
    css`
      @keyframes cv-task-list-busy-scan {
        from {
          transform: translateX(-120%);
        }

        to {
          transform: translateX(220%);
        }
      }

      :host {
        display: block;
        color: var(--cv-task-list-color, var(--cv-color-text, #e8ecf6));
        --cv-task-list-gap: var(--cv-space-3, 12px);
        --cv-task-list-padding: var(--cv-space-4, 16px);
        --cv-task-list-radius: var(--cv-radius-md, 10px);
        --cv-task-list-row-gap: var(--cv-space-2, 8px);
        --cv-task-list-row-padding-block: var(--cv-space-3, 12px);
        --cv-task-list-row-padding-inline: var(--cv-space-3, 12px);
        --cv-task-list-row-radius: var(--cv-radius-sm, 6px);
        --cv-task-list-row-column-gap: var(--cv-space-3, 12px);
      }

      :host([density='compact']) {
        --cv-task-list-gap: var(--cv-space-2, 8px);
        --cv-task-list-padding: var(--cv-space-3, 12px);
        --cv-task-list-row-gap: var(--cv-space-1, 4px);
        --cv-task-list-row-padding-block: var(--cv-space-2, 8px);
        --cv-task-list-row-padding-inline: var(--cv-space-2, 8px);
      }

      [part='base'] {
        position: relative;
        display: grid;
        gap: var(--cv-task-list-gap);
        box-sizing: border-box;
        min-inline-size: 0;
        padding: var(--cv-task-list-padding);
        overflow: hidden;
        border: var(--cv-task-list-border, 1px solid var(--cv-color-border, #2a3245));
        border-radius: var(--cv-task-list-radius);
        background: var(--cv-task-list-background, var(--cv-color-surface-2, #181f2b));
        box-shadow: var(--cv-task-list-shadow, var(--cv-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.24)));
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
        background: linear-gradient(
          90deg,
          transparent,
          var(--cv-task-list-highlight-color, var(--cv-color-border-strong, #4c5870)),
          transparent
        );
        opacity: 0.62;
        pointer-events: none;
      }

      :host([busy]) [part='base'] {
        border-color: var(--cv-task-list-busy-border-color, var(--cv-color-primary-border, #2f6a78));
        box-shadow:
          var(--cv-task-list-shadow, var(--cv-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.24))),
          0 0 0 1px var(--cv-color-primary-ring, rgba(101, 215, 255, 0.24));
      }

      :host([busy]) [part='base']::after {
        content: '';
        position: absolute;
        inset: 0 auto auto 0;
        inline-size: 42%;
        block-size: 2px;
        background: linear-gradient(90deg, transparent, var(--cv-color-primary, #65d7ff), transparent);
        opacity: 0.86;
        animation: cv-task-list-busy-scan 1.24s linear infinite;
        pointer-events: none;
      }

      [part='header'],
      [part='footer'] {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--cv-space-2, 8px);
        min-inline-size: 0;
      }

      [part='header'][hidden],
      [part='footer'][hidden] {
        display: none;
      }

      [part='header'] {
        color: var(--cv-task-list-header-color, var(--cv-color-text-strong, #f5f7fc));
        font-size: var(--cv-task-list-header-font-size, var(--cv-font-size-sm, 14px));
        font-weight: var(--cv-task-list-header-font-weight, var(--cv-font-weight-semibold, 600));
        line-height: 1.3;
      }

      [part='footer'] {
        color: var(--cv-task-list-footer-color, var(--cv-color-text-muted, #9aa6bd));
        font-size: var(--cv-task-list-footer-font-size, var(--cv-font-size-xs, 12px));
        line-height: 1.4;
      }

      [part='list'] {
        display: grid;
        gap: var(--cv-task-list-row-gap);
        min-inline-size: 0;
      }

      slot[name='header'],
      slot[name='footer'],
      slot[name='empty'] {
        display: contents;
      }

      slot[name='header']::slotted(*) {
        margin-block: 0;
      }

      [part='list'] slot::slotted([role='listitem']) {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--cv-task-list-row-gap) var(--cv-task-list-row-column-gap);
        box-sizing: border-box;
        min-inline-size: 0;
        padding: var(--cv-task-list-row-padding-block) var(--cv-task-list-row-padding-inline);
        border: 1px solid var(--cv-task-list-row-border-color, var(--cv-color-border-muted, #2a3245));
        border-radius: var(--cv-task-list-row-radius);
        background: var(--cv-task-list-row-background, var(--cv-color-surface-glass-subtle, #141923));
        color: var(--cv-task-list-row-color, var(--cv-color-text, #e8ecf6));
        overflow-wrap: anywhere;
        transition:
          border-color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          background-color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
      }

      [part='list'] slot::slotted([role='listitem']:hover),
      [part='list'] slot::slotted([role='listitem']:focus-within) {
        border-color: var(--cv-task-list-row-border-color-hover, var(--cv-color-border-strong, #4c5870));
        background: var(--cv-task-list-row-background-hover, var(--cv-color-surface-glass, #141923));
      }

      :host([busy]) [part='list'] slot::slotted([role='listitem']) {
        border-color: var(--cv-task-list-row-busy-border-color, var(--cv-color-primary-border, #2f6a78));
      }

      :host([density='compact']) [part='list'] slot::slotted([role='listitem']) {
        font-size: var(--cv-task-list-compact-row-font-size, var(--cv-font-size-sm, 14px));
      }

      [part='empty'] {
        display: grid;
        min-inline-size: 0;
        color: var(--cv-color-text-muted, #9aa6bd);
      }

      slot[name='empty']::slotted(*) {
        min-inline-size: 0;
        max-inline-size: 100%;
      }

      slot[name='empty']::slotted(:not(cv-empty-state)) {
        display: grid;
        place-items: center;
        box-sizing: border-box;
        min-block-size: var(--cv-task-list-empty-min-block-size, 96px);
        padding: var(--cv-task-list-empty-padding, var(--cv-space-5, 20px));
        border: 1px dashed var(--cv-task-list-empty-border-color, var(--cv-color-border-muted, #2a3245));
        border-radius: var(--cv-task-list-row-radius);
        background: var(--cv-task-list-empty-background, var(--cv-color-surface-glass-subtle, #141923));
        text-align: center;
      }

      slot[name='empty']::slotted(cv-empty-state) {
        --cv-empty-state-padding: var(--cv-task-list-empty-padding, var(--cv-space-5, 20px));
        --cv-empty-state-border: 1px dashed
          var(--cv-task-list-empty-border-color, var(--cv-color-border-muted, #2a3245));
        --cv-empty-state-radius: var(--cv-task-list-row-radius);
        --cv-empty-state-background: var(
          --cv-task-list-empty-background,
          var(--cv-color-surface-glass-subtle, #141923)
        );
        --cv-empty-state-title-color: var(--cv-task-list-empty-title-color, var(--cv-color-text, #e8ecf6));
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
      <section part="base" aria-label=${this.label} aria-busy=${this.busy ? 'true' : 'false'}>
        <div part="header" ?hidden=${!this.hasHeaderSlot}>
          <slot name="header" @slotchange=${this.handleHeaderSlotChange}></slot>
        </div>
        ${
          this.empty
            ? html`
                <div part="empty"><slot name="empty"></slot></div>
              `
            : html`
                <div part="list" role="list"><slot></slot></div>
              `
        }
        <div part="footer" ?hidden=${!this.hasFooterSlot}>
          <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
        </div>
      </section>
    `
  }

  private handleHeaderSlotChange(event: Event) {
    this.hasHeaderSlot = this.hasAssignedElements(event)
  }

  private handleFooterSlotChange(event: Event) {
    this.hasFooterSlot = this.hasAssignedElements(event)
  }

  private hasAssignedElements(event: Event): boolean {
    const slot = event.currentTarget as HTMLSlotElement | null
    return Boolean(slot?.assignedElements({flatten: true}).length)
  }
}
