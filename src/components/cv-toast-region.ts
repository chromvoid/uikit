import {css} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {createToastController, type CVToastController} from '../toast/create-toast-controller'
import {CVToast} from './cv-toast'

export type ToastRegionPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end'

export interface CVToastRegionCloseDetail {
  id: string
}

export type CVToastRegionCloseEvent = CustomEvent<CVToastRegionCloseDetail>

export class CVToastRegion extends ReatomLitElement {
  static elementName = 'cv-toast-region'

  static get properties() {
    return {
      controller: {attribute: false},
      position: {type: String, reflect: true},
      maxVisible: {type: Number, attribute: 'max-visible', reflect: true},
      dismissLabel: {type: String, attribute: 'dismiss-label'},
      topLayer: {type: Boolean, attribute: 'top-layer', reflect: true},
    }
  }

  declare controller: CVToastController
  declare position: ToastRegionPosition
  declare maxVisible: number
  declare dismissLabel: string
  declare topLayer: boolean

  private previousToastIds = new Set<string>()
  private topLayerVisible = false
  private topLayerUnavailable = false

  constructor() {
    super()
    this.position = 'top-end'
    this.maxVisible = 3
    this.dismissLabel = 'Dismiss notification'
    this.topLayer = false
    this.controller = createToastController({maxVisible: this.maxVisible})
  }

  static styles = [
    css`
      :host {
        display: block;
        position: var(--cv-toast-region-position, fixed);
        z-index: var(--cv-toast-region-z-index, 9999);
        inline-size: var(--cv-toast-region-width, auto);
        max-inline-size: var(--cv-toast-region-max-width, 420px);
        pointer-events: none;
      }

      :host([popover]) {
        inset: auto;
        margin: 0;
        padding: 0;
        border: 0;
        overflow: visible;
        background: transparent;
        color: inherit;
      }

      :host([position='top-start']) {
        top: var(--cv-toast-region-inset, var(--cv-space-4, 16px));
        left: var(--cv-toast-region-inset, var(--cv-space-4, 16px));
      }

      :host([position='top-center']) {
        top: var(--cv-toast-region-inset, var(--cv-space-4, 16px));
        left: 50%;
        transform: translateX(-50%);
      }

      :host([position='top-end']) {
        top: var(--cv-toast-region-inset, var(--cv-space-4, 16px));
        right: var(--cv-toast-region-inset, var(--cv-space-4, 16px));
      }

      :host([position='bottom-start']) {
        bottom: var(--cv-toast-region-inset, var(--cv-space-4, 16px));
        left: var(--cv-toast-region-inset, var(--cv-space-4, 16px));
      }

      :host([position='bottom-center']) {
        bottom: var(--cv-toast-region-inset, var(--cv-space-4, 16px));
        left: 50%;
        transform: translateX(-50%);
      }

      :host([position='bottom-end']) {
        bottom: var(--cv-toast-region-inset, var(--cv-space-4, 16px));
        right: var(--cv-toast-region-inset, var(--cv-space-4, 16px));
      }

      [part='base'] {
        display: grid;
        gap: var(--cv-toast-region-gap, var(--cv-space-2, 8px));
        pointer-events: auto;
      }

      [part='item'] {
        display: block;
        inline-size: 100%;
      }
    `,
  ]

  static define() {
    CVToast.define()
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.previousToastIds = new Set(this.controller.model.state.items().map((item) => item.id))
    this.syncTopLayerVisibility()
  }

  override disconnectedCallback(): void {
    this.hideFromTopLayer()
    super.disconnectedCallback()
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('maxVisible')) {
      // Update the controller in place rather than recreating it: recreating would wipe
      // all live toasts (without cv-close), orphan their timers, and drop a
      // user-supplied controller. This also honors a declarative `max-visible` attribute
      // set before the first update (changedProperties.get is undefined on first update).
      if (this.controller.model.state.maxVisible() !== this.maxVisible) {
        this.controller.setMaxVisible(this.maxVisible)
      }
    }

    if (changedProperties.has('topLayer')) {
      this.topLayerUnavailable = false
      this.syncTopLayerAttribute()
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    if (changedProperties.has('controller')) {
      this.previousToastIds = new Set(this.controller.model.state.items().map((item) => item.id))
      this.syncTopLayerVisibility()
      return
    }

    const currentIds = new Set(this.controller.model.state.items().map((item) => item.id))
    for (const previousId of this.previousToastIds) {
      if (!currentIds.has(previousId)) {
        this.dispatchEvent(
          new CustomEvent<CVToastRegionCloseEvent['detail']>('cv-close', {
            detail: {id: previousId},
            bubbles: true,
            composed: true,
          }),
        )
      }
    }
    this.previousToastIds = currentIds
    this.syncTopLayerVisibility()
  }

  private supportsTopLayer(): boolean {
    return typeof this.showPopover === 'function' && typeof this.hidePopover === 'function'
  }

  private syncTopLayerAttribute(): void {
    if (this.topLayer && !this.topLayerUnavailable && this.supportsTopLayer()) {
      this.setAttribute('popover', 'manual')
      return
    }

    this.hideFromTopLayer()
    this.removeAttribute('popover')
  }

  private syncTopLayerVisibility(): void {
    this.syncTopLayerAttribute()
    if (!this.hasAttribute('popover')) return

    if (this.controller.model.state.visibleItems().length > 0) {
      this.showInTopLayer()
      return
    }

    this.hideFromTopLayer()
  }

  private showInTopLayer(): void {
    if (this.topLayerVisible) return

    try {
      this.showPopover()
      this.topLayerVisible = true
    } catch {
      this.topLayerUnavailable = true
      this.removeAttribute('popover')
    }
  }

  private hideFromTopLayer(): void {
    if (!this.topLayerVisible) return

    try {
      this.hidePopover()
    } catch {
      // The browser may already have removed the popover from the top layer.
    }
    this.topLayerVisible = false
  }

  private handlePause() {
    this.controller.pause()
  }

  private handleResume() {
    this.controller.resume()
  }

  private handleFocusIn() {
    this.controller.pause()
  }

  private handleFocusOut(event: FocusEvent) {
    const nextTarget = event.relatedTarget
    if (
      nextTarget instanceof Node &&
      event.currentTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return
    }
    this.controller.resume()
  }

  private handleToastClose(event: Event) {
    const customEvent = event as CustomEvent<{id: string}>
    this.controller.dismiss(customEvent.detail.id)
  }

  protected override render() {
    const model = this.controller.model
    const regionProps = model.contracts.getRegionProps()
    const items = model.state.visibleItems()
    const paused = model.state.isPaused()

    return html`
      <section
        id=${regionProps.id}
        part="base"
        data-paused=${paused ? 'true' : 'false'}
        @mouseenter=${this.handlePause}
        @mouseleave=${this.handleResume}
        @focusin=${this.handleFocusIn}
        @focusout=${this.handleFocusOut}
      >
        ${items.map((item) => {
          const toastProps = model.contracts.getToastProps(item.id)

          return html`
            <cv-toast
              id=${toastProps.id}
              role=${toastProps.role}
              data-level=${toastProps['data-level']}
              part="item"
              .toastId=${item.id}
              .level=${item.level ?? 'info'}
              .closable=${item.closable ?? true}
              .title=${item.title ?? ''}
              .message=${item.message}
              .iconName=${item.icon ?? ''}
              .progress=${Boolean(item.progress)}
              .durationMs=${item.durationMs ?? 0}
              .paused=${paused}
              .actions=${item.actions ?? []}
              .dismissLabel=${this.dismissLabel}
              @cv-close=${this.handleToastClose}
            ></cv-toast>
          `
        })}
      </section>
    `
  }
}
