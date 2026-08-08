import {afterEach, describe, expect, it} from 'vitest'

import {CVAlertDialog} from './cv-alert-dialog'

const stylesToText = () =>
  (CVAlertDialog.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')

const settle = async (element: CVAlertDialog) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
  await Promise.resolve()
}

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('cv-alert-dialog', () => {
  it('keeps programmatic focus on the dialog surface visually silent', () => {
    const cssText = stylesToText()

    expect(cssText).toMatch(/\[part='content'\]:focus-visible\s*\{\s*outline:\s*none;/)
    expect(cssText).toMatch(/\[part='trigger'\]:focus-visible\s*\{[\s\S]*outline:\s*2px solid/)
  })

  it('defines discrete display presence for overlay', () => {
    const cssText = stylesToText()

    expect(cssText).toMatch(/\[part='overlay'\][\s\S]*transition:[\s\S]*display[\s\S]*allow-discrete/)
    expect(cssText).toMatch(/transition-behavior:\s*allow-discrete/)
  })

  it('opens from trigger and closes from cancel button', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    document.body.append(dialog)
    await settle(dialog)

    const trigger = dialog.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement
    const overlay = dialog.shadowRoot?.querySelector('[part="overlay"]') as HTMLElement
    const cancel = dialog.shadowRoot?.querySelector('[part="cancel"]') as HTMLButtonElement

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(dialog)
    expect(dialog.open).toBe(true)
    expect(overlay.hidden).toBe(false)

    cancel.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(dialog)
    expect(dialog.open).toBe(false)
    expect(overlay.hidden).toBe(true)
  })

  it('closes on Escape by default', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.open = true
    document.body.append(dialog)
    await settle(dialog)

    const content = dialog.shadowRoot?.querySelector('[part="content"]') as HTMLElement
    content.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
    await settle(dialog)

    expect(dialog.open).toBe(false)
  })

  it('keeps dialog open when closeOnAction is false', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.closeOnAction = false
    dialog.open = true

    let actionCount = 0
    dialog.addEventListener('cv-action', () => {
      actionCount += 1
    })

    document.body.append(dialog)
    await settle(dialog)

    const action = dialog.shadowRoot?.querySelector('[part="action"]') as HTMLButtonElement
    action.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(dialog)

    expect(actionCount).toBe(1)
    expect(dialog.open).toBe(true)
  })

  it('closes on overlay outside pointer', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.open = true
    document.body.append(dialog)
    await settle(dialog)

    const overlay = dialog.shadowRoot?.querySelector('[part="overlay"]') as HTMLElement
    overlay.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
    await settle(dialog)

    expect(dialog.open).toBe(false)
  })

  it('stays open on Escape when closeOnEscape is false', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.closeOnEscape = false
    dialog.open = true
    document.body.append(dialog)
    await settle(dialog)

    const content = dialog.shadowRoot?.querySelector('[part="content"]') as HTMLElement
    content.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
    await settle(dialog)

    expect(dialog.open).toBe(true)
  })

  it('stays open on overlay pointer when closeOnOutsidePointer is false', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.closeOnOutsidePointer = false
    dialog.open = true
    document.body.append(dialog)
    await settle(dialog)

    const overlay = dialog.shadowRoot?.querySelector('[part="overlay"]') as HTMLElement
    overlay.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
    await settle(dialog)

    expect(dialog.open).toBe(true)
  })

  it('ignores pointer-down that originates inside the content', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.open = true
    document.body.append(dialog)
    await settle(dialog)

    const content = dialog.shadowRoot?.querySelector('[part="content"]') as HTMLElement
    content.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
    await settle(dialog)

    expect(dialog.open).toBe(true)
  })

  it('closes when focus lands outside the dialog', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.open = true
    const outside = document.createElement('button')
    document.body.append(dialog, outside)
    await settle(dialog)

    outside.focus()
    await settle(dialog)

    expect(dialog.open).toBe(false)
  })

  it('keeps focus-outside dismiss off when closeOnOutsideFocus is false', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.closeOnOutsideFocus = false
    dialog.open = true
    const outside = document.createElement('button')
    document.body.append(dialog, outside)
    await settle(dialog)

    outside.focus()
    await settle(dialog)

    expect(dialog.open).toBe(true)
  })

  it('emits cv-cancel alongside the open state change', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.open = true

    const events: string[] = []
    dialog.addEventListener('cv-cancel', () => events.push('cancel'))
    dialog.addEventListener('cv-change', (event) => {
      events.push(`change:${(event as CustomEvent<{open: boolean}>).detail.open}`)
    })

    document.body.append(dialog)
    await settle(dialog)

    const cancel = dialog.shadowRoot?.querySelector('[part="cancel"]') as HTMLButtonElement
    cancel.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(dialog)

    expect(dialog.open).toBe(false)
    expect(events).toEqual(['change:false', 'cancel'])
  })

  it('focuses the cancel button by default when opened', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    document.body.append(dialog)
    await settle(dialog)

    const trigger = dialog.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement
    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(dialog)

    const cancel = dialog.shadowRoot?.querySelector('[part="cancel"]') as HTMLButtonElement
    expect(dialog.open).toBe(true)
    expect(dialog.shadowRoot?.activeElement).toBe(cancel)
  })

  it('focuses slotted light DOM content referenced by initial-focus-id', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.initialFocusId = 'confirm-input'
    const input = document.createElement('input')
    input.id = 'confirm-input'
    input.slot = 'description'
    dialog.append(input)
    document.body.append(dialog)
    await settle(dialog)

    dialog.open = true
    await settle(dialog)

    expect(document.activeElement).toBe(input)
  })

  it('reflects open state on trigger aria-expanded', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    document.body.append(dialog)
    await settle(dialog)

    const trigger = dialog.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    dialog.open = true
    await settle(dialog)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    dialog.open = false
    await settle(dialog)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('restores focus to the shadow trigger button when closed', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    document.body.append(dialog)
    await settle(dialog)

    const trigger = dialog.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement
    // Regression: the model targets `${idBase}-trigger` for focus restoration,
    // but the trigger button previously rendered without that id so focus was
    // never returned. The id must be present and resolvable.
    expect(trigger.id).toBe(`${dialog['idBase']}-trigger`)

    trigger.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(dialog)
    expect(dialog.open).toBe(true)

    const cancel = dialog.shadowRoot?.querySelector('[part="cancel"]') as HTMLButtonElement
    cancel.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(dialog)

    expect(dialog.open).toBe(false)
    expect(dialog.shadowRoot?.activeElement).toBe(trigger)
  })

  it('ignores Escape that a nested widget already consumed', async () => {
    CVAlertDialog.define()

    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    dialog.open = true
    document.body.append(dialog)
    await settle(dialog)

    const content = dialog.shadowRoot?.querySelector('[part="content"]') as HTMLElement
    const event = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true})
    // A nested widget consumed the Escape before the dialog saw it.
    event.preventDefault()
    content.dispatchEvent(event)
    await settle(dialog)

    expect(dialog.open).toBe(true)
  })

  it('locks body scroll while open and restores the previous overflow', async () => {
    CVAlertDialog.define()

    document.body.style.overflow = 'auto'
    const dialog = document.createElement('cv-alert-dialog') as CVAlertDialog
    document.body.append(dialog)
    await settle(dialog)

    dialog.open = true
    await settle(dialog)
    expect(document.body.style.overflow).toBe('hidden')

    dialog.open = false
    await settle(dialog)
    expect(document.body.style.overflow).toBe('auto')
  })
})
