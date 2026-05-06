import {afterEach, describe, expect, it, vi} from 'vitest'

import {CVBottomSheet} from './cv-bottom-sheet'
import {CVDialog} from './cv-dialog'

CVBottomSheet.define()

const settle = async (element: CVBottomSheet) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createBottomSheet = async (attrs?: Partial<CVBottomSheet>) => {
  const el = document.createElement('cv-bottom-sheet') as CVBottomSheet
  if (attrs) Object.assign(el, attrs)
  document.body.append(el)
  await settle(el)
  return el
}

const getDialog = (el: CVBottomSheet) => el.shadowRoot!.querySelector('cv-dialog') as CVDialog
const getDialogOverlay = (el: CVBottomSheet) =>
  getDialog(el).shadowRoot!.querySelector('[part="overlay"]') as HTMLElement
const getDialogContent = (el: CVBottomSheet) =>
  getDialog(el).shadowRoot!.querySelector('[part="content"]') as HTMLElement
const getHandle = (el: CVBottomSheet) => el.shadowRoot!.querySelector('[part="handle"]') as HTMLElement | null

function createPointerEvent(
  type: string,
  options: {clientY: number; pointerId?: number; button?: number},
): PointerEvent {
  const event = new Event(type, {bubbles: true, composed: true, cancelable: true}) as PointerEvent
  Object.defineProperties(event, {
    button: {value: options.button ?? 0},
    clientY: {value: options.clientY},
    pointerId: {value: options.pointerId ?? 1},
  })
  return event
}

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  vi.useRealTimers()
})

describe('cv-bottom-sheet', () => {
  it('renders a cv-dialog shell with sheet handle parts and forwarded slots', async () => {
    const el = await createBottomSheet()
    const title = document.createElement('span')
    title.slot = 'title'
    title.textContent = 'Details'
    const body = document.createElement('p')
    body.textContent = 'Sheet body'
    const footer = document.createElement('button')
    footer.slot = 'footer'
    footer.textContent = 'Done'
    el.append(title, body, footer)
    await settle(el)

    const dialog = getDialog(el)

    expect(dialog).not.toBeNull()
    expect(dialog.open).toBe(false)
    expect(getHandle(el)).not.toBeNull()
    expect(el.shadowRoot!.querySelector('[part="grabber"]')).not.toBeNull()
    expect(dialog.querySelector('[slot="title"]')).not.toBeNull()
    expect(dialog.querySelector('slot:not([name])')).not.toBeNull()
    expect(dialog.querySelector('[slot="footer"]')).not.toBeNull()
    expect(dialog.getAttribute('exportparts')).toContain('content')
  })

  it('forwards dialog properties to the underlying dialog', async () => {
    const el = await createBottomSheet({
      open: true,
      modal: false,
      type: 'alertdialog',
      closeOnEscape: false,
      closeOnOutsidePointer: false,
      closeOnOutsideFocus: false,
      initialFocusId: 'target',
      noHeader: true,
    })
    const dialog = getDialog(el)

    expect(dialog.open).toBe(true)
    expect(dialog.modal).toBe(false)
    expect(dialog.type).toBe('alertdialog')
    expect(dialog.closeOnEscape).toBe(false)
    expect(dialog.closeOnOutsidePointer).toBe(false)
    expect(dialog.closeOnOutsideFocus).toBe(false)
    expect(dialog.initialFocusId).toBe('target')
    expect(dialog.noHeader).toBe(true)
  })

  it('closes from backdrop click through dialog outside-pointer behavior', async () => {
    const el = await createBottomSheet({open: true})
    const changes: unknown[] = []
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))

    getDialogOverlay(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(el)

    expect(el.open).toBe(false)
    expect(changes).toEqual([{open: false}])
  })

  it('closes from Escape through dialog keyboard behavior', async () => {
    const el = await createBottomSheet({open: true})
    const changes: unknown[] = []
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))

    getDialogContent(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
    await settle(el)

    expect(el.open).toBe(false)
    expect(changes).toEqual([{open: false}])
  })

  it('drags the handle down before dismissing the sheet', async () => {
    vi.useFakeTimers()
    const el = await createBottomSheet({open: true})
    const changes: unknown[] = []
    const handle = getHandle(el)!
    const dialog = getDialog(el)
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))

    handle.dispatchEvent(createPointerEvent('pointerdown', {clientY: 0}))
    handle.dispatchEvent(createPointerEvent('pointermove', {clientY: 120}))

    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-drag-offset')).toBe('120px')

    handle.dispatchEvent(createPointerEvent('pointerup', {clientY: 120}))

    expect(dialog.classList.contains('is-dismissing')).toBe(true)
    expect(el.open).toBe(true)

    vi.advanceTimersByTime(180)
    await settle(el)

    expect(el.open).toBe(false)
    expect(changes).toEqual([{open: false}])
  })

  it('snaps back after a below-threshold drag without closing', async () => {
    const el = await createBottomSheet({open: true})
    const changes: unknown[] = []
    const handle = getHandle(el)!
    const dialog = getDialog(el)
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))

    handle.dispatchEvent(createPointerEvent('pointerdown', {clientY: 0}))
    handle.dispatchEvent(createPointerEvent('pointermove', {clientY: 40}))
    handle.dispatchEvent(createPointerEvent('pointerup', {clientY: 40}))

    expect(el.open).toBe(true)
    expect(changes).toEqual([])
    expect(dialog.classList.contains('is-dismissing')).toBe(false)
    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-drag-offset')).toBe('')
  })

  it('does not drag or close when drag-to-close is false', async () => {
    const el = await createBottomSheet({open: true, dragToClose: false})
    const changes: unknown[] = []
    const handle = getHandle(el)!
    const dialog = getDialog(el)
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))

    handle.dispatchEvent(createPointerEvent('pointerdown', {clientY: 0}))
    handle.dispatchEvent(createPointerEvent('pointermove', {clientY: 120}))
    handle.dispatchEvent(createPointerEvent('pointerup', {clientY: 120}))

    expect(el.open).toBe(true)
    expect(changes).toEqual([])
    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-drag-offset')).toBe('')
  })

  it('hides the handle when show-handle is false', async () => {
    const el = await createBottomSheet({showHandle: false})

    expect(getHandle(el)).toBeNull()
  })

  it('preserves dialog lifecycle events', async () => {
    const el = await createBottomSheet()
    const events: string[] = []

    el.addEventListener('cv-show', () => events.push('show'))
    el.addEventListener('cv-after-show', () => events.push('after-show'))

    el.open = true
    await settle(el)

    expect(events).toEqual(['show', 'after-show'])
  })
})
