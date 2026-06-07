import type {AbstractRender, Constructor, Frame, Unsubscribe} from '@reatom/core'
import {reatomAbstractRender, top} from '@reatom/core'
import type {LitElement, PropertyValues} from 'lit'

const __inner_update = Symbol('Inner update')

export const __reatom_user_render__ = Symbol.for('reatom.user_render')

type ReatomUserRenderHolder = {
  [__reatom_user_render__]?: (this: LitElement) => unknown
}

export const withReatomElement = <T extends Constructor<LitElement>>(superClass: T): T => {
  return class ReatomLitElement extends superClass {
    private __frame: Frame
    private __changedProps?: PropertyValues
    private __abstractRender: AbstractRender<PropertyValues | undefined, unknown>
    private __unmount?: Unsubscribe
    private __hasRenderedWithReatom = false

    // oxlint-disable-next-line typescript-eslint/no-explicit-any -- TypeScript mixin constructors must use any[].
    constructor(...args: any[]) {
      super(...args)

      this.__frame = top()

      this.__abstractRender = reatomAbstractRender({
        frame: this.__frame,
        render: () => {
          const symbolRender = (this.constructor.prototype as ReatomUserRenderHolder)[__reatom_user_render__]
          if (symbolRender) {
            return symbolRender.call(this)
          }

          const prototype = Object.getPrototypeOf(Object.getPrototypeOf(this))
          const userRender = prototype?.render
          return userRender?.call(this)
        },
        rerender: () => {
          return this.requestUpdate(__inner_update, 1)
        },
        name: 'ReatomElement',
        abortOnUnmount: false,
      })
    }

    private __mountAbstractRender() {
      if (!this.isConnected || this.__unmount || !this.__hasRenderedWithReatom) return

      this.__unmount = this.__abstractRender.mount()
    }

    override render() {
      const {result} = this.__abstractRender.render(this.__changedProps)
      this.__hasRenderedWithReatom = true
      return result
    }

    override shouldUpdate(_changedProperties: PropertyValues): boolean {
      if (_changedProperties.size === 1 && _changedProperties.has(__inner_update)) {
        // updates from Reatom are internal
      }
      this.__changedProps = _changedProperties
      return true
    }

    override connectedCallback(): void {
      super.connectedCallback()
      this.__mountAbstractRender()
    }

    override updated(changedProperties: PropertyValues): void {
      super.updated(changedProperties)
      this.__mountAbstractRender()
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback()
      if (this.__unmount) {
        try {
          this.__unmount()
        } catch {
          // ignore unmount errors
        }
        this.__unmount = undefined
      }
    }
  } as T
}
