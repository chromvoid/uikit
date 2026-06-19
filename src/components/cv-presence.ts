import {css, html, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export type CVPresenceEnterEvent = CustomEvent<Record<string, never>>
export type CVPresenceAfterEnterEvent = CustomEvent<Record<string, never>>
export type CVPresenceExitEvent = CustomEvent<Record<string, never>>
export type CVPresenceAfterExitEvent = CustomEvent<Record<string, never>>

export class CVPresence extends ReatomLitElement {
  static elementName = 'cv-presence'

  static get properties() {
    return {
      present: {type: Boolean, reflect: true},
      keepMounted: {type: Boolean, attribute: 'keep-mounted', reflect: true},
    }
  }

  declare present: boolean
  declare keepMounted: boolean

  private rendered = false
  private initialized = false

  constructor() {
    super()
    this.present = false
    this.keepMounted = false
  }

  static styles = [
    css`
      :host {
        display: contents;
      }

      [part='base'][data-state='hidden'] {
        display: none;
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
    if (changedProperties.has('present') && this.present) {
      this.rendered = true
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    if (!this.initialized) {
      this.initialized = true
      this.rendered = this.present
      return
    }

    if (!changedProperties.has('present')) return

    if (this.present) {
      this.dispatchLifecycle('cv-enter')
      queueMicrotask(() => this.dispatchLifecycle('cv-after-enter'))
      return
    }

    this.dispatchLifecycle('cv-exit')
    queueMicrotask(() => {
      this.dispatchLifecycle('cv-after-exit')
      if (!this.keepMounted) {
        this.rendered = false
        this.requestUpdate()
      }
    })
  }

  private dispatchLifecycle(name: 'cv-enter' | 'cv-after-enter' | 'cv-exit' | 'cv-after-exit') {
    this.dispatchEvent(
      new CustomEvent<Record<string, never>>(name, {detail: {}, bubbles: true, composed: true}),
    )
  }

  protected override render() {
    const shouldRender = this.present || this.keepMounted || this.rendered
    if (!shouldRender) return nothing

    return html`
      <span part="base" data-state=${this.present ? 'present' : this.keepMounted ? 'hidden' : 'exiting'}>
        <slot></slot>
      </span>
    `
  }
}
