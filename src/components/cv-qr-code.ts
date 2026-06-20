import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'
import qrcode from 'qrcode-generator'

import {html, svg} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export type CVQrCodeErrorCorrection = 'L' | 'M' | 'Q' | 'H'
export type CVQrCodeModuleShape = 'square' | 'rounded' | 'dot'
export type CVQrCodeLogoSize = 'small' | 'medium' | 'large'

type CVQrCodeModule = {
  x: number
  y: number
}

type CVQrCodeRenderData =
  | {
      status: 'empty' | 'invalid'
    }
  | {
      status: 'ready'
      viewBoxSize: number
      modules: CVQrCodeModule[]
      modulesPath: string
    }

const DEFAULT_ARIA_LABEL = 'QR code'
const DEFAULT_ERROR_CORRECTION: CVQrCodeErrorCorrection = 'M'
const DEFAULT_MODULE_SHAPE: CVQrCodeModuleShape = 'square'
const DEFAULT_LOGO_SIZE: CVQrCodeLogoSize = 'medium'
const DEFAULT_QUIET_ZONE = 4
const EMPTY_RENDER_DATA: CVQrCodeRenderData = {status: 'empty'}
const ROUNDED_MODULE_RADIUS = 0.22
const DOT_MODULE_RADIUS = 0.5

function normalizeErrorCorrection(value: string): CVQrCodeErrorCorrection {
  switch (value) {
    case 'L':
    case 'M':
    case 'Q':
    case 'H':
      return value
    default:
      return DEFAULT_ERROR_CORRECTION
  }
}

function normalizeQuietZone(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_QUIET_ZONE
  return Math.max(0, Math.floor(value))
}

function normalizeModuleShape(value: string): CVQrCodeModuleShape {
  switch (value) {
    case 'square':
    case 'rounded':
    case 'dot':
      return value
    default:
      return DEFAULT_MODULE_SHAPE
  }
}

export class CVQrCode extends ReatomLitElement {
  static elementName = 'cv-qr-code'

  static get properties() {
    return {
      value: {type: String, reflect: false},
      errorCorrection: {type: String, reflect: true, attribute: 'error-correction'},
      quietZone: {type: Number, reflect: true, attribute: 'quiet-zone'},
      moduleShape: {type: String, reflect: true, attribute: 'module-shape'},
      logoSize: {type: String, reflect: true, attribute: 'logo-size'},
      decorative: {type: Boolean, reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
    }
  }

  declare value: string
  declare errorCorrection: CVQrCodeErrorCorrection
  declare quietZone: number
  declare moduleShape: CVQrCodeModuleShape
  declare logoSize: CVQrCodeLogoSize
  declare decorative: boolean
  declare ariaLabel: string

  private renderData: CVQrCodeRenderData = EMPTY_RENDER_DATA

  constructor() {
    super()
    this.value = ''
    this.errorCorrection = DEFAULT_ERROR_CORRECTION
    this.quietZone = DEFAULT_QUIET_ZONE
    this.moduleShape = DEFAULT_MODULE_SHAPE
    this.logoSize = DEFAULT_LOGO_SIZE
    this.decorative = false
    this.ariaLabel = DEFAULT_ARIA_LABEL
  }

  static styles = [
    css`
      :host {
        display: inline-block;
        inline-size: var(--cv-qr-code-size, 192px);
        block-size: var(--cv-qr-code-size, 192px);
        line-height: 0;
        contain: content;
        --cv-qr-code-background: var(--cv-color-qr-background);
        --cv-qr-code-foreground: var(--cv-color-qr-foreground);
        --cv-qr-code-logo-backdrop-background: var(--cv-qr-code-background);
        --cv-qr-code-logo-radius: var(--cv-radius-md);
        --cv-qr-code-logo-size: 22%;
      }

      :host([logo-size='small']) {
        --cv-qr-code-logo-size: 16%;
      }

      :host([logo-size='large']) {
        --cv-qr-code-logo-size: 28%;
      }

      [part='base'] {
        display: block;
        position: relative;
        inline-size: 100%;
        block-size: 100%;
      }

      [part='svg'] {
        display: block;
        inline-size: 100%;
        block-size: 100%;
        shape-rendering: crispEdges;
      }

      [part='background'] {
        fill: var(--cv-qr-code-background);
      }

      [part='modules'] {
        fill: var(--cv-qr-code-foreground);
      }

      [part='module'] {
        fill: inherit;
      }

      [part='logo'] {
        display: grid;
        position: absolute;
        inset-block-start: 50%;
        inset-inline-start: 50%;
        inline-size: var(--cv-qr-code-logo-size);
        block-size: var(--cv-qr-code-logo-size);
        transform: translate(-50%, -50%);
        place-items: center;
        pointer-events: none;
      }

      :host(:not([has-logo])) [part='logo'] {
        display: none;
      }

      [part='logo-backdrop'] {
        position: absolute;
        inset: 0;
        border-radius: var(--cv-qr-code-logo-radius);
        background: var(--cv-qr-code-logo-backdrop-background);
      }

      [part='logo-content'] {
        display: grid;
        position: relative;
        box-sizing: border-box;
        inline-size: 100%;
        block-size: 100%;
        padding: 14%;
        overflow: hidden;
        border-radius: var(--cv-qr-code-logo-radius);
        place-items: center;
      }

      ::slotted(*) {
        max-inline-size: 100%;
        max-block-size: 100%;
      }

      [part='placeholder'] {
        display: block;
        inline-size: 100%;
        block-size: 100%;
        background: var(--cv-qr-code-background);
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

    if (
      changedProperties.has('value') ||
      changedProperties.has('errorCorrection') ||
      changedProperties.has('quietZone')
    ) {
      this.renderData = this.createRenderData()
    }

    this.toggleAttribute('empty', this.renderData.status === 'empty')
    this.toggleAttribute('invalid', this.renderData.status === 'invalid')
    if (this.renderData.status !== 'ready') {
      this.toggleAttribute('has-logo', false)
    }
  }

  private createRenderData(): CVQrCodeRenderData {
    if (!this.value) return EMPTY_RENDER_DATA

    const errorCorrection = normalizeErrorCorrection(this.errorCorrection)
    const quietZone = normalizeQuietZone(this.quietZone)

    try {
      const qr = qrcode(0, errorCorrection)
      qr.addData(this.value)
      qr.make()

      const moduleCount = qr.getModuleCount()
      const modules: CVQrCodeModule[] = []
      const commands: string[] = []

      for (let row = 0; row < moduleCount; row += 1) {
        for (let col = 0; col < moduleCount; col += 1) {
          if (qr.isDark(row, col)) {
            const x = col + quietZone
            const y = row + quietZone

            modules.push({x, y})
            commands.push(`M${x} ${y}h1v1h-1z`)
          }
        }
      }

      return {
        status: 'ready',
        viewBoxSize: moduleCount + quietZone * 2,
        modules,
        modulesPath: commands.join(' '),
      }
    } catch {
      return {status: 'invalid'}
    }
  }

  private renderModules(data: Extract<CVQrCodeRenderData, {status: 'ready'}>) {
    switch (normalizeModuleShape(this.moduleShape)) {
      case 'rounded':
        return svg`
          <g part="modules">
            ${data.modules.map(
              (module) => svg`
                <rect
                  part="module"
                  x="${module.x}"
                  y="${module.y}"
                  width="1"
                  height="1"
                  rx="${ROUNDED_MODULE_RADIUS}"
                  ry="${ROUNDED_MODULE_RADIUS}"
                ></rect>
              `,
            )}
          </g>
        `
      case 'dot':
        return svg`
          <g part="modules">
            ${data.modules.map(
              (module) => svg`
                <circle
                  part="module"
                  cx="${module.x + DOT_MODULE_RADIUS}"
                  cy="${module.y + DOT_MODULE_RADIUS}"
                  r="${DOT_MODULE_RADIUS}"
                ></circle>
              `,
            )}
          </g>
        `
      case 'square':
        return svg`<path part="modules" d=${data.modulesPath}></path>`
    }
  }

  private handleLogoSlotChange(event: Event): void {
    const slot = event.currentTarget as HTMLSlotElement
    const hasLogo = slot.assignedNodes({flatten: true}).some((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) return true
      return node.textContent?.trim()
    })

    this.toggleAttribute('has-logo', Boolean(hasLogo))
  }

  private renderLogo() {
    return html`
      <span part="logo" aria-hidden="true">
        <span part="logo-backdrop"></span>
        <span part="logo-content">
          <slot name="logo" @slotchange=${this.handleLogoSlotChange}></slot>
        </span>
      </span>
    `
  }

  protected override render() {
    const data = this.renderData

    if (data.status !== 'ready') {
      return html`
        <span part="base" aria-hidden="true">
          <span part="placeholder"></span>
        </span>
      `
    }

    return html`
      <span part="base">
        ${svg`
          <svg
            part="svg"
            viewBox="0 0 ${data.viewBoxSize} ${data.viewBoxSize}"
            role=${this.decorative ? nothing : 'img'}
            aria-label=${this.decorative ? nothing : this.ariaLabel || DEFAULT_ARIA_LABEL}
            aria-hidden=${this.decorative ? 'true' : nothing}
          >
            <rect
              part="background"
              x="0"
              y="0"
              width="${data.viewBoxSize}"
              height="${data.viewBoxSize}"
            ></rect>
            ${this.renderModules(data)}
          </svg>
        `}
        ${this.renderLogo()}
      </span>
    `
  }
}
