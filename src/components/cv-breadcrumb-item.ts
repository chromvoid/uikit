import {LitElement, css, html, nothing} from 'lit'

export class CVBreadcrumbItem extends LitElement {
  static elementName = 'cv-breadcrumb-item'

  static get properties() {
    return {
      value: {type: String, reflect: true},
      href: {type: String, reflect: true},
      current: {type: Boolean, reflect: true},
      showSeparator: {type: Boolean, attribute: 'show-separator', reflect: true},
      linkId: {attribute: false},
    }
  }

  declare value: string
  declare href: string
  declare current: boolean
  declare showSeparator: boolean
  declare linkId: string

  constructor() {
    super()
    this.value = ''
    this.href = ''
    this.current = false
    this.showSeparator = true
    this.linkId = ''
  }

  static styles = [
    css`
      :host {
        display: inline-flex;
        align-items: center;
        min-inline-size: 0;
        max-inline-size: 100%;
        color: var(--cv-breadcrumb-item-color, var(--cv-color-text-muted, #9aa6bf));
        font-size: var(--cv-breadcrumb-item-font-size, var(--cv-font-size-sm, 0.875rem));
        line-height: 1.2;
      }

      [part='link'] {
        display: inline-block;
        box-sizing: border-box;
        max-inline-size: var(--cv-breadcrumb-item-link-max-inline-size, 18rem);
        min-block-size: var(--cv-breadcrumb-item-link-min-block-size, 28px);
        padding-block: var(--cv-breadcrumb-item-link-padding-block, 4px);
        padding-inline: var(--cv-breadcrumb-item-link-padding-inline, 7px);
        overflow: hidden;
        border: 1px solid transparent;
        border-radius: var(--cv-breadcrumb-item-link-radius, var(--cv-radius-1, 6px));
        color: inherit;
        line-height: 1.35;
        text-decoration: none;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition:
          background-color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          border-color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          color var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease),
          box-shadow var(--cv-duration-fast, 120ms) var(--cv-easing-standard, ease);
      }

      @media (hover: hover) {
        :host(:not([current])) [part='link']:hover {
          border-color: var(--cv-breadcrumb-item-hover-border-color, var(--cv-color-border-muted, #3a465d));
          background: var(
            --cv-breadcrumb-item-hover-background,
            var(--cv-color-surface-hover, rgba(0, 229, 255, 0.08))
          );
          color: var(--cv-breadcrumb-item-hover-color, var(--cv-color-text, #e8ecf6));
        }
      }

      [part='link']:focus-visible {
        outline: 2px solid var(--cv-breadcrumb-item-focus-ring, var(--cv-color-focus-ring, #00e5ff));
        outline-offset: 2px;
        color: var(--cv-breadcrumb-item-focus-color, var(--cv-color-text, #e8ecf6));
      }

      [part='link']:active {
        background: var(
          --cv-breadcrumb-item-active-background,
          var(--cv-color-active, rgba(0, 229, 255, 0.14))
        );
        color: var(--cv-breadcrumb-item-active-color, var(--cv-color-text-strong, #eef5ff));
      }

      :host([current]) [part='link'] {
        border-color: var(
          --cv-breadcrumb-item-current-border-color,
          var(--cv-color-primary-border, rgba(0, 229, 255, 0.3))
        );
        background: var(
          --cv-breadcrumb-item-current-background,
          var(--cv-color-primary-surface, rgba(0, 229, 255, 0.12))
        );
        color: var(--cv-breadcrumb-item-current-color, var(--cv-color-text-strong, #eef5ff));
        font-weight: var(--cv-breadcrumb-item-current-font-weight, var(--cv-font-weight-semibold, 600));
        box-shadow: inset 0 1px 0 var(--cv-breadcrumb-item-current-highlight, rgba(255, 255, 255, 0.04));
      }

      [part='prefix'],
      [part='suffix'] {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        color: var(--cv-breadcrumb-item-affix-color, var(--cv-color-text-subtle, #7f8aa3));
        line-height: 1;
      }

      slot[name='prefix']::slotted(*) {
        margin-inline-end: var(--cv-breadcrumb-item-gap, var(--cv-space-2, 8px));
      }

      slot[name='suffix']::slotted(*) {
        margin-inline-start: var(--cv-breadcrumb-item-gap, var(--cv-space-2, 8px));
      }

      [part='separator'] {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        margin-inline-start: var(--cv-breadcrumb-item-gap, var(--cv-space-2, 8px));
        color: var(--cv-color-text-subtle, #7f8aa3);
        opacity: var(--cv-breadcrumb-item-separator-opacity, 0.62);
        line-height: 1;
      }

      [part='separator'][hidden] {
        display: none;
      }

      :host([current]) [part='separator'] {
        opacity: var(--cv-breadcrumb-item-current-separator-opacity, 0.5);
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
      <span part="prefix"><slot name="prefix"></slot></span>
      <a
        id=${this.linkId || nothing}
        role="link"
        href=${this.href}
        aria-current=${this.current ? 'page' : nothing}
        part="link"
      >
        <slot></slot>
      </a>
      <span part="suffix"><slot name="suffix"></slot></span>
      <span aria-hidden="true" ?hidden=${!this.showSeparator} part="separator">
        <slot name="separator">/</slot>
      </span>
    `
  }
}
