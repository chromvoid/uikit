import {afterEach, describe, expect, it} from 'vitest'

import {CVThemeProvider} from './cv-theme-provider'
import {CVThemePaletteControllerElement} from './cv-theme-palette-controller'
import {CVThemePaletteEditor} from './cv-theme-palette-editor'
import {CVThemePaletteSwatch} from './cv-theme-palette-swatch'
import type {CVThemePaletteSavedSnapshot} from './palette/index'

CVThemeProvider.define()
CVThemePaletteControllerElement.define()
CVThemePaletteEditor.define()
CVThemePaletteSwatch.define()

const settle = async (element: HTMLElement & {updateComplete?: Promise<unknown>}) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

afterEach(() => {
  document.body.innerHTML = ''
  window.localStorage.clear()
})

describe('cv-theme-palette-controller', () => {
  it('applies live preview tokens to the target theme provider', async () => {
    const provider = document.createElement('cv-theme-provider') as CVThemeProvider
    provider.id = 'app-theme'
    provider.mode = 'dark'
    document.body.append(provider)
    await settle(provider)

    const controller = document.createElement('cv-theme-palette-controller') as CVThemePaletteControllerElement
    controller['for'] = 'app-theme'
    controller.themeName = 'unit-palette-preview'
    document.body.append(controller)
    await settle(controller)
    await settle(provider)

    controller.model.actions.updateChannel('dark', 'primary', 'h', 220)
    await settle(provider)

    expect(provider.theme).toBe('unit-palette-preview')
    expect(provider.style.getPropertyValue('--cv-palette-primary')).toContain('220')
  })

  it('saves through the controller and emits the SSR handoff snapshot', async () => {
    const controller = document.createElement('cv-theme-palette-controller') as CVThemePaletteControllerElement
    controller.storageKey = 'unit-palette-save'
    controller.themeName = 'unit-palette-save-theme'
    document.body.append(controller)
    await settle(controller)

    const snapshots: CVThemePaletteSavedSnapshot[] = []
    controller.addEventListener('cv-palette-save', (event) => {
      snapshots.push((event as CustomEvent<CVThemePaletteSavedSnapshot>).detail)
    })

    controller.model.actions.updateChannel('light', 'accent', 'h', 300)
    const snapshot = controller.save()

    expect(snapshot?.themeName).toBe('unit-palette-save-theme')
    expect(snapshots).toHaveLength(1)
    const savedSnapshot = snapshots[0]!
    expect(savedSnapshot.recipe.schemes.light.accent.h).toBe(300)
    expect(savedSnapshot.tokens.light['--cv-palette-accent']).toContain('300')
    expect(window.localStorage.getItem('unit-palette-save') ?? '').not.toContain('"tokens"')
  })
})

describe('cv-theme-palette-editor', () => {
  it('renders controls from the host controller model and updates draft values', async () => {
    const controller = document.createElement('cv-theme-palette-controller') as CVThemePaletteControllerElement
    const editor = document.createElement('cv-theme-palette-editor') as CVThemePaletteEditor
    controller.append(editor)
    document.body.append(controller)
    await settle(controller)
    await settle(editor)

    const slider = editor.shadowRoot!.querySelector(
      "cv-slider[data-scheme='dark'][data-role='primary'][data-channel='h']",
    ) as HTMLElement

    slider.dispatchEvent(
      new CustomEvent('cv-input', {
        detail: {value: 240},
        bubbles: true,
        composed: true,
      }),
    )
    await settle(editor)

    expect(controller.model.state.draft().schemes.dark.primary.h).toBe(240)
    expect(editor.shadowRoot!.querySelector('button[data-kind="primary"]')?.hasAttribute('disabled')).toBe(false)
  })

  it('routes save button clicks through the host controller', async () => {
    const controller = document.createElement('cv-theme-palette-controller') as CVThemePaletteControllerElement
    controller.storageKey = 'unit-palette-editor-save'
    const editor = document.createElement('cv-theme-palette-editor') as CVThemePaletteEditor
    controller.append(editor)
    document.body.append(controller)
    await settle(controller)
    await settle(editor)

    const snapshots: CVThemePaletteSavedSnapshot[] = []
    controller.addEventListener('cv-palette-save', (event) => {
      snapshots.push((event as CustomEvent<CVThemePaletteSavedSnapshot>).detail)
    })

    controller.model.actions.updateChannel('dark', 'accent', 'h', 280)
    await settle(editor)
    ;(editor.shadowRoot!.querySelector('button[data-kind="primary"]') as HTMLButtonElement).click()

    expect(snapshots).toHaveLength(1)
    expect(window.localStorage.getItem('unit-palette-editor-save') ?? '').not.toBe('')
  })
})

describe('cv-theme-palette-swatch', () => {
  it('applies dynamic swatch color through an owned custom property', async () => {
    const swatch = document.createElement('cv-theme-palette-swatch') as CVThemePaletteSwatch
    swatch.color = 'hwb(200 10% 20%)'
    swatch.label = 'Preview'
    document.body.append(swatch)
    await settle(swatch)

    expect(swatch.style.getPropertyValue('--cv-theme-palette-swatch-color')).toBe('hwb(200 10% 20%)')
    expect(swatch.getAttribute('aria-label')).toBe('Preview')
  })
})
