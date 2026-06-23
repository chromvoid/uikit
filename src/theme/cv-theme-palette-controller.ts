import {css, html, LitElement} from 'lit'
import type {PropertyValues} from 'lit'

import {CVThemeProvider} from './cv-theme-provider'
import {
  createThemePaletteController,
  CV_THEME_PALETTE_STORAGE_KEY,
  type CVThemePaletteController,
  type CVThemePaletteSavedSnapshot,
} from './palette/index'

export type CVPaletteSaveEvent = CustomEvent<CVThemePaletteSavedSnapshot>

export class CVThemePaletteControllerElement extends LitElement {
  static elementName = 'cv-theme-palette-controller'

  static get properties() {
    return {
      for: {type: String, reflect: true},
      storageKey: {type: String, attribute: 'storage-key', reflect: true},
      themeName: {type: String, attribute: 'theme-name', reflect: true},
    }
  }

  declare ['for']: string
  declare storageKey: string
  declare themeName: string

  model: CVThemePaletteController

  constructor() {
    super()
    this['for'] = ''
    this.storageKey = CV_THEME_PALETTE_STORAGE_KEY
    this.themeName = 'cv-user-palette'
    this.model = this.createModel()
  }

  static styles = [
    css`
      :host {
        display: contents;
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
    this.syncModelConfig()
    this.model.actions.loadSaved()
    this.applyToProvider()
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)
    if (changedProperties.has('storageKey') || changedProperties.has('themeName')) {
      this.syncModelConfig()
    }
    if (changedProperties.has('for') || changedProperties.has('themeName')) {
      this.applyToProvider()
    }
  }

  save(): CVThemePaletteSavedSnapshot | null {
    const snapshot = this.model.actions.save()
    if (!snapshot) return null

    this.dispatchEvent(
      new CustomEvent<CVThemePaletteSavedSnapshot>('cv-palette-save', {
        detail: snapshot,
        bubbles: true,
        composed: true,
      }),
    )
    return snapshot
  }

  private createModel(): CVThemePaletteController {
    return createThemePaletteController({
      name: 'cvThemePaletteController',
      storageKey: this.storageKey,
      themeName: this.themeName,
      onPreview: () => this.applyToProvider(),
    })
  }

  private syncModelConfig(): void {
    this.model.actions.setStorageKey(this.storageKey)
    this.model.actions.setThemeName(this.themeName)
    this.syncEditors()
  }

  private resolveProvider(): CVThemeProvider | null {
    const targetId = this['for']
    if (!targetId) return null

    const root = this.getRootNode()
    const target =
      root instanceof Document || (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot)
        ? root.getElementById(targetId)
        : document.getElementById(targetId)

    return target instanceof CVThemeProvider ? target : null
  }

  private applyToProvider(): void {
    const provider = this.resolveProvider()
    if (!provider) return

    const themeName = this.model.state.themeName()
    if (provider.theme !== themeName) {
      provider.theme = themeName
    }
    provider.refreshTheme()
  }

  private syncEditors(): void {
    for (const editor of this.querySelectorAll('cv-theme-palette-editor')) {
      ;(editor as unknown as {model?: CVThemePaletteController; requestUpdate?: () => void}).model =
        this.model
      ;(editor as unknown as {requestUpdate?: () => void}).requestUpdate?.()
    }
  }

  protected override render() {
    return html`
      <slot @slotchange=${this.syncEditors}></slot>
    `
  }
}
