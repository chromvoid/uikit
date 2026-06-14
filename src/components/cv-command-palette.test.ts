import {afterEach, describe, expect, it} from 'vitest'

import {CVCommandItem} from './cv-command-item'
import {CVCommandPalette} from './cv-command-palette'

const stylesToText = () =>
  (CVCommandPalette.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')

const settle = async (element: CVCommandPalette) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
  await Promise.resolve()
}

async function mountPalette(params: {closeOnExecute?: boolean; closeOnOutsidePointer?: boolean} = {}) {
  CVCommandItem.define()
  CVCommandPalette.define()

  const palette = document.createElement('cv-command-palette') as CVCommandPalette
  if (params.closeOnExecute === false) {
    palette.closeOnExecute = false
  }

  if (params.closeOnOutsidePointer === false) {
    palette.closeOnOutsidePointer = false
  }

  palette.innerHTML = `
    <span slot="trigger">Open palette</span>
    <cv-command-item value="open">Open file</cv-command-item>
    <cv-command-item value="close">Close file</cv-command-item>
    <cv-command-item value="delete" disabled>Delete file</cv-command-item>
  `

  document.body.append(palette)
  await settle(palette)

  const trigger = palette.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement
  const dialog = palette.shadowRoot?.querySelector('[part="dialog"]') as HTMLElement
  const input = palette.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement
  const items = Array.from(palette.querySelectorAll('cv-command-item')) as CVCommandItem[]

  return {palette, trigger, dialog, input, items}
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-command-palette', () => {
  it('defines discrete display presence for dialog', () => {
    const cssText = stylesToText()

    expect(cssText).toMatch(/\[part='dialog'\][\s\S]*transition:[\s\S]*display[\s\S]*allow-discrete/)
    expect(cssText).toMatch(/transition-behavior:\s*allow-discrete/)
  })

  it('opens and closes from trigger click', async () => {
    const {palette, trigger, dialog} = await mountPalette()

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    expect(palette.open).toBe(true)
    expect(dialog.hidden).toBe(false)

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    expect(palette.open).toBe(false)
    expect(dialog.hidden).toBe(true)
  })

  it('toggles by global Cmd/Ctrl+K shortcut', async () => {
    const {palette} = await mountPalette()

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'k', metaKey: true, bubbles: true}))
    await settle(palette)
    expect(palette.open).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'k', ctrlKey: true, bubbles: true}))
    await settle(palette)
    expect(palette.open).toBe(false)
  })

  it('filters visible commands from input value', async () => {
    const {palette, trigger, input, items} = await mountPalette()

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    input.value = 'close'
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
    await settle(palette)

    expect(items[0]!.hidden).toBe(true)
    expect(items[1]!.hidden).toBe(false)
  })

  it('executes active command on Enter and emits execute', async () => {
    const {palette, trigger, input, items} = await mountPalette()
    const executed: Array<string | null> = []

    palette.addEventListener('cv-execute', (event) => {
      executed.push((event as CustomEvent<{lastExecutedValue: string | null}>).detail.lastExecutedValue)
    })

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
    await settle(palette)

    expect(palette.value).toBe('close')
    expect(palette.lastExecutedValue).toBe('close')
    expect(palette.open).toBe(false)
    expect(items[1]!.selected).toBe(true)
    expect(executed.at(-1)).toBe('close')
  })

  it('keeps palette open when closeOnExecute is false', async () => {
    const {palette, trigger, items} = await mountPalette({closeOnExecute: false})

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    expect(palette.value).toBe('open')
    expect(palette.lastExecutedValue).toBe('open')
    expect(palette.open).toBe(true)
  })

  it('closes on Escape pressed in the input', async () => {
    const {palette, trigger, input} = await mountPalette()

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)
    expect(palette.open).toBe(true)

    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
    await settle(palette)

    expect(palette.open).toBe(false)
  })

  it('filters case-insensitively', async () => {
    const {palette, trigger, input, items} = await mountPalette()

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    input.value = 'CLOSE'
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
    await settle(palette)

    expect(items[0]!.hidden).toBe(true)
    expect(items[1]!.hidden).toBe(false)
  })

  it('does not execute on Enter when the filter matches nothing', async () => {
    const {palette, trigger, input} = await mountPalette()
    let executeCount = 0

    palette.addEventListener('cv-execute', () => {
      executeCount += 1
    })

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    input.value = 'zzz'
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
    await settle(palette)

    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
    await settle(palette)

    expect(executeCount).toBe(0)
    expect(palette.lastExecutedValue).toBe(null)
    expect(palette.open).toBe(true)
  })

  it('keeps the global shortcut working after disconnect and reconnect', async () => {
    const {palette} = await mountPalette()

    palette.remove()
    document.body.append(palette)
    await settle(palette)

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'k', metaKey: true, bubbles: true}))
    await settle(palette)

    expect(palette.open).toBe(true)
  })

  it('closes on outside pointer by default and can be disabled', async () => {
    const {palette, trigger} = await mountPalette({closeOnOutsidePointer: true})

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)
    expect(palette.open).toBe(true)

    document.body.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}))
    await settle(palette)
    expect(palette.open).toBe(false)

    const second = await mountPalette({closeOnOutsidePointer: false})
    second.trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(second.palette)

    document.body.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}))
    await settle(second.palette)
    expect(second.palette.open).toBe(true)
  })

  it('does not execute a disabled command on click', async () => {
    const {palette, trigger, items} = await mountPalette()
    let executeCount = 0
    palette.addEventListener('cv-execute', () => {
      executeCount += 1
    })

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    // items[2] is the disabled "delete" command.
    items[2]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    expect(executeCount).toBe(0)
    expect(palette.value).toBe('')
    expect(palette.lastExecutedValue).toBe(null)
    expect(palette.open).toBe(true)
  })

  it('reattaches command click listeners after remove() + append() (reconnect)', async () => {
    const {palette, trigger, items} = await mountPalette()

    palette.remove()
    document.body.append(palette)
    await settle(palette)

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(palette)

    expect(palette.value).toBe('open')
    expect(palette.lastExecutedValue).toBe('open')
  })

  it('opens with an uppercase configured shortcut key', async () => {
    CVCommandItem.define()
    CVCommandPalette.define()

    const palette = document.createElement('cv-command-palette') as CVCommandPalette
    palette.openShortcutKey = 'P'
    palette.innerHTML = `
      <span slot="trigger">Open palette</span>
      <cv-command-item value="open">Open file</cv-command-item>
    `
    document.body.append(palette)
    await settle(palette)

    // Browser delivers a lowercase event.key for an unmodified letter; the
    // model must fold the configured key to match.
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'p', metaKey: true, bubbles: true}))
    await settle(palette)

    expect(palette.open).toBe(true)
  })

  it('does not execute (or fire cv-execute) on a programmatic value write', async () => {
    const {palette, items} = await mountPalette()
    let executeCount = 0
    palette.addEventListener('cv-execute', () => {
      executeCount += 1
    })

    palette.value = 'open'
    await settle(palette)

    // Programmatic writes mirror selection only; they must not behave like an
    // activation (no lastExecutedValue, no cv-execute, no closeOnExecute side
    // effects).
    expect(palette.value).toBe('open')
    expect(items[0]!.selected).toBe(true)
    expect(palette.lastExecutedValue).toBe(null)
    expect(executeCount).toBe(0)
  })

  it('reverts a programmatic value write that names an unknown command', async () => {
    const {palette} = await mountPalette()

    palette.value = 'does-not-exist'
    await settle(palette)

    // Unknown id can never become a valid selection: the property is reverted to
    // the model's actual (empty) selection instead of leaving a desync.
    expect(palette.value).toBe('')
    expect(palette.lastExecutedValue).toBe(null)
  })
})
