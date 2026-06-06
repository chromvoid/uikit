import {afterEach, describe, expect, it, vi} from 'vitest'

import {CVBottomSheet} from './cv-bottom-sheet'
import type {CVDialog} from './cv-dialog'

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
const setDialogTransitionDuration = (el: CVBottomSheet, duration: string) => {
  getDialogOverlay(el).style.transitionDuration = duration
  getDialogContent(el).style.transitionDuration = duration
}

function stylesToText(styles: unknown): string {
  const values = Array.isArray(styles) ? styles : [styles]
  return values
    .map((value) => {
      if (value == null) return ''
      return typeof value === 'object' && 'cssText' in (value as object)
        ? String((value as {cssText: string}).cssText)
        : String(value)
    })
    .join('\n')
}

function createPointerEvent(
  type: string,
  options: {clientY: number; pointerId?: number; button?: number},
): PointerEvent {
  const event = new Event(type, {
    bubbles: true,
    composed: true,
    cancelable: true,
  }) as PointerEvent
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
  it('reserves visual viewport keyboard space through the public sheet-level clearance hook', () => {
    const cssText = stylesToText(CVBottomSheet.styles)

    expect(cssText).toContain('--cv-bottom-sheet-overlay-block-end: calc(')
    expect(cssText).toContain('--safe-area-bottom-active')
    expect(cssText).toContain('--cv-bottom-sheet-keyboard-inset')
    expect(cssText).toContain('--cv-bottom-sheet-safe-bottom-inset')
    expect(cssText).toContain('--cv-bottom-sheet-keyboard-bottom-inset')
    expect(cssText).toContain('--cv-bottom-sheet-visible-viewport-block-size')
    expect(cssText).toContain('var(--visual-viewport-block-size, 100dvh)')
    expect(cssText).toMatch(
      /--cv-bottom-sheet-keyboard-bottom-inset:\s*var\(\s*--cv-bottom-sheet-keyboard-inset,\s*var\(--visual-viewport-bottom-inset,\s*0px\)\s*\);/,
    )
    expect(cssText).toContain(
      'var(--cv-bottom-sheet-safe-bottom-inset) + var(--cv-bottom-sheet-keyboard-bottom-inset)',
    )
    expect(cssText).toContain('var(--cv-bottom-sheet-visible-viewport-block-size)')
    expect(cssText).toContain('transform: translateY(calc(0px - var(--cv-bottom-sheet-overlay-block-end)));')
    expect(cssText).toContain('var(--cv-bottom-sheet-safe-bottom-inset)')
  })

  it('keeps the sheet footer in a reserved grid row while the body scrolls', () => {
    const cssText = stylesToText(CVBottomSheet.styles)

    expect(cssText).toMatch(
      /cv-dialog::part\(content\)\s*{[\s\S]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto;/,
    )
    expect(cssText).toMatch(/cv-dialog::part\(content\)\s*{[\s\S]*overflow:\s*hidden;/)
    expect(cssText).toMatch(/cv-dialog::part\(body\)\s*{[\s\S]*min-block-size:\s*0;/)
    expect(cssText).toMatch(/cv-dialog::part\(body\)\s*{[\s\S]*overflow:\s*auto;/)
  })

  it('defines detent sizing hooks without changing the default open-close mode', () => {
    const cssText = stylesToText(CVBottomSheet.styles)

    expect(cssText).toContain('cv-dialog.has-detents::part(content)')
    expect(cssText).toContain('--cv-bottom-sheet-detent-max-height')
    expect(cssText).toContain('--cv-bottom-sheet-detent-visible-height')
    expect(cssText).toContain('--cv-bottom-sheet-detent-offset')
    expect(cssText).toContain('--cv-bottom-sheet-collapsed-height')
    expect(cssText).toContain('--cv-bottom-sheet-middle-height')
    expect(cssText).toContain('--cv-bottom-sheet-expanded-height')
    expect(cssText).toContain('cv-dialog.has-detents::part(body)')
    expect(cssText).toContain('block-size: var(--cv-bottom-sheet-detent-visible-height)')
  })

  it('maps sheet movement to cv-dialog content motion variables without animating keyboard geometry', () => {
    const cssText = stylesToText(CVBottomSheet.styles)

    expect(cssText).toContain('--cv-dialog-content-transition-property: transform;')
    expect(cssText).not.toContain('--cv-dialog-content-transition-property: transform, max-block-size;')
    expect(cssText).toContain(
      '--cv-dialog-transition-easing-open: var(--cv-easing-decelerate, cubic-bezier(0, 0, 0.2, 1));',
    )
    expect(cssText).not.toMatch(/transition:\s*padding-block-end/)
    expect(cssText).toContain(
      '--cv-dialog-transition-duration: var(--cv-bottom-sheet-dismiss-duration, 180ms);',
    )
    expect(cssText).toContain('calc(100% + var(--cv-bottom-sheet-overlay-block-end) + 32px)')
    expect(cssText).toContain(
      '--cv-dialog-content-open-transform: translateY(var(--cv-bottom-sheet-drag-offset, 0px));',
    )
    expect(cssText).not.toContain('scale(')
  })

  it('keeps detent transforms in cv-dialog motion variables without a second dismiss class', () => {
    const cssText = stylesToText(CVBottomSheet.styles)

    expect(cssText).toMatch(
      /cv-dialog\.has-detents\s*{[\s\S]*--cv-dialog-content-open-transform:\s*translateY\(\s*calc\(var\(--cv-bottom-sheet-detent-offset,\s*0px\) \+ var\(--cv-bottom-sheet-drag-offset,\s*0px\)\)\s*\);/,
    )
    expect(cssText).not.toContain('is-dismissing')
  })

  it('keeps reduced-motion sheet displacement instant', () => {
    const cssText = stylesToText(CVBottomSheet.styles)

    expect(cssText).toContain('@media (prefers-reduced-motion: reduce)')
    expect(cssText).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*cv-dialog\s*{[\s\S]*--cv-dialog-transition-duration: 0ms;/,
    )
  })

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
    expect(getHandle(el)?.getAttribute('slot')).toBe('before-header')
    expect(el.shadowRoot!.querySelector('[part="grabber"]')).not.toBeNull()
    expect(dialog.querySelector('[slot="title"]')).not.toBeNull()
    expect(dialog.querySelector('[slot="before-header"]')).toBe(getHandle(el))
    expect(dialog.querySelector('slot:not([name])')).not.toBeNull()
    expect(dialog.querySelector('[slot="footer"]')).not.toBeNull()
    expect(dialog.getAttribute('exportparts')).toContain('content')
  })

  it('keeps the default header close icon when no header-close content is slotted', async () => {
    const el = await createBottomSheet()
    const dialog = getDialog(el)
    const forwardedHeaderCloseSlot = dialog.querySelector(
      'slot[name="header-close"][slot="header-close"]',
    ) as HTMLSlotElement | null

    expect(forwardedHeaderCloseSlot).not.toBeNull()
    expect(forwardedHeaderCloseSlot!.querySelector('svg')).not.toBeNull()
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
      closable: false,
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
    expect(dialog.closable).toBe(false)
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
    setDialogTransitionDuration(el, '120ms')
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))

    handle.dispatchEvent(createPointerEvent('pointerdown', {clientY: 0}))
    handle.dispatchEvent(createPointerEvent('pointermove', {clientY: 120}))

    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-drag-offset')).toBe('120px')

    handle.dispatchEvent(createPointerEvent('pointerup', {clientY: 120}))

    expect(dialog.classList.contains('is-dragging')).toBe(false)
    expect(dialog.classList.contains('is-dismissing')).toBe(false)
    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-drag-offset')).toBe('120px')
    expect(el.open).toBe(false)
    expect(changes).toEqual([{open: false}])
    await settle(el)

    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-drag-offset')).toBe('120px')
    vi.advanceTimersByTime(120)
    await settle(el)

    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-drag-offset')).toBe('')
    expect(changes).toEqual([{open: false}])
  })

  it('snaps back after a below-threshold drag without closing', async () => {
    vi.useFakeTimers()
    const el = await createBottomSheet({open: true})
    const changes: unknown[] = []
    const handle = getHandle(el)!
    const dialog = getDialog(el)
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))

    handle.dispatchEvent(createPointerEvent('pointerdown', {clientY: 0}))
    vi.advanceTimersByTime(1_000)
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
    setDialogTransitionDuration(el, '120ms')
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))

    handle.dispatchEvent(createPointerEvent('pointerdown', {clientY: 0}))
    handle.dispatchEvent(createPointerEvent('pointermove', {clientY: 120}))
    handle.dispatchEvent(createPointerEvent('pointerup', {clientY: 120}))

    expect(el.open).toBe(true)
    expect(changes).toEqual([])
    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-drag-offset')).toBe('')
  })

  it('ignores slotted cv-change events that do not carry dialog open state', async () => {
    const el = await createBottomSheet({open: true})
    const button = document.createElement('button')
    el.append(button)
    await settle(el)

    button.dispatchEvent(new CustomEvent('cv-change', {detail: {value: 12}, bubbles: true, composed: true}))
    await settle(el)

    expect(el.open).toBe(true)
  })

  it('ignores slotted cv-change events even when they carry an open state', async () => {
    const el = await createBottomSheet({open: true})
    const button = document.createElement('button')
    const changes: unknown[] = []
    el.append(button)
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))
    await settle(el)

    button.dispatchEvent(new CustomEvent('cv-change', {detail: {open: false}, bubbles: true, composed: true}))
    await settle(el)

    expect(el.open).toBe(true)
    expect(changes).toEqual([{open: false}])
  })

  it('hides the handle when show-handle is false', async () => {
    const el = await createBottomSheet({showHandle: false})

    expect(getHandle(el)).toBeNull()
  })

  it('applies the active detent class and exposes detent changes through events', async () => {
    const el = await createBottomSheet({
      open: true,
      detents: 'collapsed middle expanded',
      detent: 'collapsed',
    })
    const changes: unknown[] = []
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))

    const handle = getHandle(el)!
    expect(getDialog(el).classList.contains('has-detents')).toBe(true)
    expect(getDialog(el).classList.contains('detent-collapsed')).toBe(true)

    handle.click()
    await settle(el)

    expect(el.detent).toBe('middle')
    expect(getDialog(el).classList.contains('detent-middle')).toBe(true)
    expect(changes).toEqual([{open: true, detent: 'middle'}])

    handle.click()
    await settle(el)

    expect(el.detent).toBe('expanded')
    expect(getDialog(el).classList.contains('detent-expanded')).toBe(true)
    expect(changes).toEqual([
      {open: true, detent: 'middle'},
      {open: true, detent: 'expanded'},
    ])
  })

  it('snaps detented sheets up and down before dismissing from the collapsed detent', async () => {
    vi.useFakeTimers()
    const el = await createBottomSheet({
      open: true,
      detents: 'collapsed middle expanded',
      detent: 'collapsed',
    })
    const changes: unknown[] = []
    const handle = getHandle(el)!
    const dialog = getDialog(el)
    el.addEventListener('cv-change', (event) => changes.push((event as CustomEvent).detail))

    handle.dispatchEvent(createPointerEvent('pointerdown', {clientY: 200}))
    handle.dispatchEvent(createPointerEvent('pointermove', {clientY: 120}))
    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-drag-offset')).toBe('-80px')
    handle.dispatchEvent(createPointerEvent('pointerup', {clientY: 120}))
    await settle(el)

    expect(el.open).toBe(true)
    expect(el.detent).toBe('middle')

    handle.dispatchEvent(createPointerEvent('pointerdown', {clientY: 120}))
    handle.dispatchEvent(createPointerEvent('pointermove', {clientY: 210}))
    handle.dispatchEvent(createPointerEvent('pointerup', {clientY: 210}))
    await settle(el)

    expect(el.open).toBe(true)
    expect(el.detent).toBe('collapsed')

    handle.dispatchEvent(createPointerEvent('pointerdown', {clientY: 210}))
    handle.dispatchEvent(createPointerEvent('pointermove', {clientY: 310}))
    handle.dispatchEvent(createPointerEvent('pointerup', {clientY: 310}))

    expect(dialog.classList.contains('is-dragging')).toBe(false)
    expect(dialog.classList.contains('is-dismissing')).toBe(false)
    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-drag-offset')).toBe('100px')
    expect(el.open).toBe(false)
    await settle(el)
    expect(changes).toEqual([
      {open: true, detent: 'middle'},
      {open: true, detent: 'collapsed'},
      {open: false, detent: 'collapsed'},
    ])
  })

  it('preserves dialog lifecycle events', async () => {
    vi.useFakeTimers()
    const el = await createBottomSheet()
    const events: string[] = []

    el.addEventListener('cv-show', () => events.push('show'))
    el.addEventListener('cv-after-show', () => events.push('after-show'))

    setDialogTransitionDuration(el, '120ms')
    el.open = true
    await settle(el)

    expect(events).toEqual(['show'])

    vi.advanceTimersByTime(119)
    await settle(el)

    expect(events).toEqual(['show'])

    vi.advanceTimersByTime(1)
    await settle(el)

    expect(events).toEqual(['show', 'after-show'])
  })
})
