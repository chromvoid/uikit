import {css} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export class CVFeedArticle extends ReatomLitElement {
  static elementName = 'cv-feed-article'

  static get properties() {
    return {
      articleId: {type: String, attribute: 'article-id', reflect: true},
      active: {type: Boolean, reflect: true},
      disabled: {type: Boolean, reflect: true},
    }
  }

  declare articleId: string
  declare active: boolean
  declare disabled: boolean

  constructor() {
    super()
    this.articleId = ''
    this.active = false
    this.disabled = false
  }

  static styles = [
    css`
      :host {
        display: block;
        outline: none;
      }

      [part='base'] {
        padding: var(--cv-feed-article-padding, var(--cv-space-3, 12px));
        border-radius: var(--cv-feed-article-border-radius, var(--cv-radius-sm, 6px));
      }

      :host([active]) [part='base'] {
        outline: var(--cv-feed-article-focus-ring, 2px solid var(--cv-color-primary, #65d7ff));
        outline-offset: -2px;
      }

      :host([disabled]) {
        opacity: 0.5;
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

    // Notify the parent cv-feed when disabled changes after mount. slotchange
    // does not fire for attribute-only mutations, so the parent would otherwise
    // never learn the article became (un)disabled.
    if (changedProperties.has('disabled') && changedProperties.get('disabled') !== undefined) {
      this.dispatchEvent(
        new CustomEvent('cv-feed-article-disabled-change', {
          bubbles: true,
          composed: true,
        }),
      )
    }
  }

  protected override render() {
    // The host element carries role="article" (set by cv-feed along with
    // aria-posinset/aria-setsize). A second role on the shadow base would
    // produce a nested article in the a11y tree and double-count posinset/
    // setsize, so the base is left as a presentational wrapper.
    return html`
      <div part="base">
        <slot></slot>
      </div>
    `
  }
}
