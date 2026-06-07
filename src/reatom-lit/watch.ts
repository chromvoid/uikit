import type {AtomLike, Frame, Unsubscribe} from '@reatom/core'
import {top} from '@reatom/core'
import {noChange} from 'lit'
import {AsyncDirective, directive} from 'lit/async-directive.js'
import type {PartInfo} from 'lit/directive.js'

class AtomDirective extends AsyncDirective {
  target: AtomLike | undefined
  unsubscribe: Unsubscribe | undefined
  frame: Frame | undefined

  constructor(partInfo: PartInfo) {
    super(partInfo)
  }

  override reconnected() {
    if (this.target && this.frame) {
      this.subscribe()
    }
  }

  override disconnected() {
    this.unsubscribeCurrent()
  }

  private unsubscribeCurrent() {
    this.unsubscribe?.()
    this.unsubscribe = undefined
  }

  private subscribe() {
    if (!this.target || !this.frame) return

    this.unsubscribeCurrent()
    this.unsubscribe = this.frame.run(() => this.target!.subscribe((v: unknown) => this.setValue(v)))
  }

  render(target: AtomLike, frame: Frame) {
    this.frame = frame

    if (this.target !== target) {
      this.unsubscribeCurrent()
      this.target = target

      if (this.isConnected) {
        this.subscribe()
      }

      Promise.resolve().then(() => {
        if (!this.isConnected || this.target !== target || this.frame !== frame) {
          return
        }

        frame.run(() => {
          if (this.isConnected && this.target === target) {
            this.setValue(target())
          }
        })
      })
    }

    return noChange
  }
}

const watchDirective = directive(AtomDirective)

export const watch = (target: AtomLike) => watchDirective(target, top())
