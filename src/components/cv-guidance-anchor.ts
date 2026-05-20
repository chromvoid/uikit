import {css} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export const GUIDANCE_ANCHOR_REGISTER_EVENT = 'guidance-anchor-register'
export const GUIDANCE_ANCHOR_UNREGISTER_EVENT = 'guidance-anchor-unregister'

export type CVGuidanceAnchorEventDetail = {
  anchorId: string
  surface: string
  owner: string
  element: CVGuidanceAnchor
}

export type CVGuidanceAnchorRegisterEvent = CustomEvent<CVGuidanceAnchorEventDetail>
export type CVGuidanceAnchorUnregisterEvent = CustomEvent<CVGuidanceAnchorEventDetail>

export class CVGuidanceAnchor extends ReatomLitElement {
  static elementName = 'cv-guidance-anchor'

  static get properties() {
    return {
      anchorId: {type: String, attribute: 'anchor-id', reflect: true},
      surface: {type: String, reflect: true},
      owner: {type: String, reflect: true},
    }
  }

  declare anchorId: string
  declare surface: string
  declare owner: string

  private registeredDetail: CVGuidanceAnchorEventDetail | null = null
  private unregisterEventTarget: EventTarget | null = null

  constructor() {
    super()
    this.anchorId = ''
    this.surface = ''
    this.owner = ''
  }

  static styles = [
    css`
      :host {
        display: contents;
      }

      :host([hidden]) {
        display: none;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    const root = this.getRootNode()
    this.unregisterEventTarget = root instanceof ShadowRoot ? root.host : (this.parentNode ?? root)
    this.dispatchRegister()
  }

  override disconnectedCallback(): void {
    this.dispatchUnregister(this.registeredDetail, this.unregisterEventTarget ?? undefined)
    this.unregisterEventTarget = null
    super.disconnectedCallback()
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    if (
      changedProperties.has('anchorId') ||
      changedProperties.has('surface') ||
      changedProperties.has('owner')
    ) {
      this.dispatchRegister()
    }
  }

  private createDetail(): CVGuidanceAnchorEventDetail {
    return {
      anchorId: this.anchorId,
      surface: this.surface,
      owner: this.owner,
      element: this,
    }
  }

  private createDetailKey(): string {
    return JSON.stringify([this.anchorId, this.surface, this.owner])
  }

  private hasRequiredMetadata(): boolean {
    return Boolean(this.anchorId && this.surface && this.owner)
  }

  private dispatchRegister(): void {
    if (!this.hasRequiredMetadata()) return

    const detailKey = this.createDetailKey()
    const registeredDetailKey = this.registeredDetail
      ? JSON.stringify([
          this.registeredDetail.anchorId,
          this.registeredDetail.surface,
          this.registeredDetail.owner,
        ])
      : ''
    if (detailKey === registeredDetailKey) return

    if (this.registeredDetail) {
      this.dispatchUnregister(this.registeredDetail)
    }

    const detail = this.createDetail()
    this.registeredDetail = detail
    this.dispatchEvent(
      new CustomEvent<CVGuidanceAnchorEventDetail>(GUIDANCE_ANCHOR_REGISTER_EVENT, {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchUnregister(
    detail: CVGuidanceAnchorEventDetail | null = this.registeredDetail,
    target: EventTarget = this,
  ): void {
    if (!detail) return
    if (detail === this.registeredDetail) {
      this.registeredDetail = null
    }
    target.dispatchEvent(
      new CustomEvent<CVGuidanceAnchorEventDetail>(GUIDANCE_ANCHOR_UNREGISTER_EVENT, {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    return html`<slot></slot>`
  }
}
