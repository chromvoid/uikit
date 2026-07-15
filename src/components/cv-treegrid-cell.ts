import {LitElement, css, html, nothing} from 'lit'

export interface CVTreegridRowToggleDetail {
  rowId: string
}

export type CVTreegridRowToggleEvent = CustomEvent<CVTreegridRowToggleDetail>

export interface CVTreegridCellEventMap {
  'cv-treegrid-row-toggle': CVTreegridRowToggleEvent
}

export class CVTreegridCell extends LitElement {
  static elementName = 'cv-treegrid-cell'

  static get properties() {
    return {
      column: {type: String, reflect: true},
      disabled: {type: Boolean, reflect: true},
      active: {type: Boolean, reflect: true},
      selected: {type: Boolean, reflect: true},
      treeControl: {type: Boolean, attribute: 'tree-control', reflect: true},
      branch: {type: Boolean, reflect: true},
      expanded: {type: Boolean, reflect: true},
      level: {type: Number, reflect: true},
      rowId: {type: String, attribute: false},
    }
  }

  declare column: string
  declare disabled: boolean
  declare active: boolean
  declare selected: boolean
  declare treeControl: boolean
  declare branch: boolean
  declare expanded: boolean
  declare level: number
  declare rowId: string

  constructor() {
    super()
    this.column = ''
    this.disabled = false
    this.active = false
    this.selected = false
    this.treeControl = false
    this.branch = false
    this.expanded = false
    this.level = 1
    this.rowId = ''
  }

  static styles = [
    css`
      :host {
        display: block;
        --cv-treegrid-indent-size: var(--cv-treegrid-child-indent, 14px);
        --cv-treegrid-toggle-size: 22px;
        --cv-treegrid-guide-color: var(--cv-color-border, #2a3245);
        padding-inline: var(--cv-space-2, 8px);
        padding-block: var(--cv-space-1, 4px);
        color: var(--cv-color-text, #e8ecf6);
        outline: none;
      }

      :host([active]) {
        background: var(--cv-color-selected);
      }

      :host([selected]) {
        font-weight: 600;
      }

      :host([disabled]) {
        opacity: 0.55;
      }

      :host(:focus-visible) {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: -2px;
      }

      [part='tree'] {
        position: relative;
        display: grid;
        grid-template-columns: var(--cv-treegrid-toggle-size) minmax(0, 1fr);
        align-items: center;
        gap: var(--cv-space-1, 4px);
        min-inline-size: 0;
        padding-inline-start: calc(var(--cv-treegrid-indent-size) * max(var(--cv-treegrid-level, 1) - 1, 0));
      }

      [part='guide'] {
        position: absolute;
        inset-block: 0;
        inset-inline-start: calc(
          var(--cv-treegrid-indent-size) * max(var(--cv-treegrid-level, 1) - 1, 0) -
            (var(--cv-treegrid-indent-size) / 2)
        );
        border-inline-start: 1px solid var(--cv-treegrid-guide-color);
        opacity: 0.55;
        pointer-events: none;
      }

      :host([level='1']) [part='guide'] {
        display: none;
      }

      [part='toggle'] {
        inline-size: var(--cv-treegrid-toggle-size);
        block-size: var(--cv-treegrid-toggle-size);
        border: 1px solid var(--cv-color-border, #2a3245);
        border-radius: var(--cv-radius-xs, 4px);
        background: var(--cv-color-surface, #141923);
        color: var(--cv-color-primary, #65d7ff);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        font: inherit;
        line-height: 1;
        cursor: pointer;
      }

      [part='toggle'][hidden] {
        display: inline-flex;
        visibility: hidden;
        pointer-events: none;
      }

      [part='toggle']:not([hidden]):hover {
        border-color: var(--cv-color-primary-border, var(--cv-color-primary, #65d7ff));
        color: var(--cv-color-primary, #65d7ff);
      }

      [part='toggle']:not([hidden]):active {
        background: var(--cv-color-selected, rgba(101, 215, 255, 0.18));
      }

      [part='toggle']:disabled {
        cursor: default;
        opacity: 0.55;
      }

      [part='toggle-icon'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: 1em;
        block-size: 1em;
        font-size: 12px;
        font-weight: 700;
      }

      [part='content'] {
        min-inline-size: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  private handleToggleClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (!this.branch || this.disabled || !this.rowId) return

    this.dispatchEvent(
      new CustomEvent<CVTreegridRowToggleDetail>('cv-treegrid-row-toggle', {
        detail: {rowId: this.rowId},
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    this.style.setProperty('--cv-treegrid-level', String(this.level || 1))

    if (!this.treeControl) {
      return html` <slot></slot> `
    }

    return html`
      <span part="tree">
        <span part="guide" aria-hidden="true"></span>
        <button
          type="button"
          part="toggle"
          tabindex="-1"
          aria-hidden=${this.branch ? 'false' : 'true'}
          aria-label=${this.expanded ? 'Collapse row' : 'Expand row'}
          aria-expanded=${this.branch ? String(this.expanded) : nothing}
          ?hidden=${!this.branch}
          ?disabled=${this.disabled || !this.branch}
          @click=${this.handleToggleClick}
        >
          <span part="toggle-icon" aria-hidden="true">${this.expanded ? '▾' : '▸'}</span>
        </button>
        <span part="content"><slot></slot></span>
      </span>
    `
  }
}
