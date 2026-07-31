import {afterEach, describe, expect, it, vi} from 'vitest'

import {createToastController} from '../toast/create-toast-controller'
import {CVToastRegion} from './cv-toast-region'

const settle = async (region: CVToastRegion) => {
  await region.updateComplete
  await Promise.resolve()
  await region.updateComplete
  await Promise.resolve()
}

function getToastItems(region: CVToastRegion): HTMLElement[] {
  return Array.from(region.shadowRoot?.querySelectorAll('[part="item"]') ?? []) as HTMLElement[]
}

async function mountRegion() {
  CVToastRegion.define()
  const region = document.createElement('cv-toast-region') as CVToastRegion
  document.body.append(region)
  await settle(region)
  return region
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('cv-toast-region', () => {
  it('supports push, dismiss and clear via imperative controller', async () => {
    const region = await mountRegion()

    const firstId = region.controller.push({message: 'Saved', durationMs: 0})
    await settle(region)
    expect(getToastItems(region)).toHaveLength(1)

    region.controller.dismiss(firstId)
    await settle(region)
    expect(getToastItems(region)).toHaveLength(0)

    region.controller.push({message: 'One', durationMs: 0})
    region.controller.push({message: 'Two', durationMs: 0})
    await settle(region)
    expect(getToastItems(region)).toHaveLength(2)

    region.controller.clear()
    await settle(region)
    expect(getToastItems(region)).toHaveLength(0)
  })

  it('updates a toast in place through the controller', async () => {
    const region = await mountRegion()
    const id = region.controller.push({message: 'Deleting…', level: 'loading', durationMs: 0})
    await settle(region)

    expect(region.controller.update(id, {message: 'Deleted', level: 'success', durationMs: 0})).toBe(true)
    await settle(region)

    const items = getToastItems(region)
    expect(items).toHaveLength(1)
    expect(items[0]?.getAttribute('data-level')).toBe('success')
    expect((items[0] as HTMLElement & {message: string}).message).toBe('Deleted')
  })

  it('auto-dismisses toasts and emits close events', async () => {
    vi.useFakeTimers()

    const region = await mountRegion()
    const closed: string[] = []

    region.addEventListener('cv-close', (event) => {
      closed.push((event as CustomEvent<{id: string}>).detail.id)
    })

    const id = region.controller.push({message: 'Auto', durationMs: 50})
    await settle(region)
    expect(getToastItems(region)).toHaveLength(1)

    vi.advanceTimersByTime(50)
    await settle(region)

    expect(getToastItems(region)).toHaveLength(0)
    expect(closed).toContain(id)
  })

  it('pauses and resumes auto-dismiss timers', async () => {
    vi.useFakeTimers()

    const region = await mountRegion()

    region.controller.push({message: 'Pauseable', durationMs: 100})
    await settle(region)

    vi.advanceTimersByTime(40)
    region.controller.pause()

    vi.advanceTimersByTime(500)
    await settle(region)
    expect(getToastItems(region)).toHaveLength(1)

    region.controller.resume()
    vi.advanceTimersByTime(59)
    await settle(region)
    expect(getToastItems(region)).toHaveLength(1)

    vi.advanceTimersByTime(1)
    await settle(region)
    expect(getToastItems(region)).toHaveLength(0)
  })

  it('pauses timers while focus is inside an action', async () => {
    vi.useFakeTimers()
    const region = await mountRegion()
    region.controller.push({
      message: 'Action',
      durationMs: 100,
      actions: [{label: 'Retry'}],
    })
    await settle(region)

    const action = region.shadowRoot
      ?.querySelector('cv-toast')
      ?.shadowRoot?.querySelector('[part="action"]') as HTMLButtonElement
    action.dispatchEvent(new FocusEvent('focusin', {bubbles: true, composed: true}))
    vi.advanceTimersByTime(200)
    await settle(region)
    expect(getToastItems(region)).toHaveLength(1)

    action.dispatchEvent(
      new FocusEvent('focusout', {bubbles: true, composed: true, relatedTarget: document.body}),
    )
    vi.advanceTimersByTime(100)
    await settle(region)
    expect(getToastItems(region)).toHaveLength(0)
  })

  it('keeps the region silent and renders one level-based role per toast', async () => {
    const region = await mountRegion()

    region.controller.push({message: 'Warn', level: 'warning', durationMs: 0})
    region.controller.push({message: 'Info', level: 'info', durationMs: 0})
    await settle(region)

    const base = region.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    expect(base.hasAttribute('role')).toBe(false)
    expect(base.hasAttribute('aria-live')).toBe(false)

    const warning = region.shadowRoot?.querySelector('[data-level="warning"]') as HTMLElement
    const info = region.shadowRoot?.querySelector('[data-level="info"]') as HTMLElement

    expect(warning.getAttribute('role')).toBe('alert')
    expect(info.getAttribute('role')).toBe('status')
  })

  it('emits close event for explicit dismiss', async () => {
    const region = await mountRegion()

    const closed: string[] = []
    region.addEventListener('cv-close', (event) => {
      closed.push((event as CustomEvent<{id: string}>).detail.id)
    })

    const id = region.controller.push({message: 'Manual', durationMs: 0})
    await settle(region)

    region.controller.dismiss(id)
    await settle(region)

    expect(closed).toEqual([id])
  })

  // --- Position attribute ---

  describe('position attribute', () => {
    it('defaults position to "top-end"', async () => {
      const region = await mountRegion()
      expect(region.position).toBe('top-end')
    })

    it('reflects position attribute', async () => {
      const region = await mountRegion()
      region.position = 'bottom-center'
      await settle(region)
      expect(region.getAttribute('position')).toBe('bottom-center')
    })

    it('accepts all valid position values', async () => {
      const positions = [
        'top-start',
        'top-center',
        'top-end',
        'bottom-start',
        'bottom-center',
        'bottom-end',
      ] as const
      for (const pos of positions) {
        const region = await mountRegion()
        region.position = pos
        await settle(region)
        expect(region.getAttribute('position')).toBe(pos)
        region.remove()
      }
    })
  })

  describe('top-layer presentation', () => {
    it('opens only while visible toasts exist', async () => {
      const region = await mountRegion()
      const showPopover = vi.fn()
      const hidePopover = vi.fn()
      Object.defineProperties(region, {
        showPopover: {value: showPopover, configurable: true},
        hidePopover: {value: hidePopover, configurable: true},
      })

      region.topLayer = true
      await settle(region)

      expect(region.getAttribute('popover')).toBe('manual')
      expect(showPopover).not.toHaveBeenCalled()

      const toastId = region.controller.push({message: 'Visible above dialogs', durationMs: 0})
      await settle(region)

      expect(showPopover).toHaveBeenCalledOnce()

      region.controller.dismiss(toastId)
      await settle(region)

      expect(hidePopover).toHaveBeenCalledOnce()
    })

    it('keeps fixed-position fallback when the Popover API is unavailable', async () => {
      const region = await mountRegion()
      Object.defineProperties(region, {
        showPopover: {value: undefined, configurable: true},
        hidePopover: {value: undefined, configurable: true},
      })

      region.topLayer = true
      region.controller.push({message: 'Fallback toast', durationMs: 0})
      await settle(region)

      expect(region.hasAttribute('popover')).toBe(false)
      expect(getToastItems(region)).toHaveLength(1)
    })

    it('reopens after it is portalled between connected top-layer hosts', async () => {
      const region = await mountRegion()
      const showPopover = vi.fn()
      const hidePopover = vi.fn()
      Object.defineProperties(region, {
        showPopover: {value: showPopover, configurable: true},
        hidePopover: {value: hidePopover, configurable: true},
      })
      region.topLayer = true
      region.controller.push({message: 'Moving toast', durationMs: 0})
      await settle(region)

      const nextHost = document.createElement('div')
      document.body.append(nextHost)
      nextHost.append(region)
      await settle(region)

      expect(hidePopover).toHaveBeenCalledOnce()
      expect(showPopover).toHaveBeenCalledTimes(2)
      expect(region.matches('[top-layer]')).toBe(true)
    })
  })

  // --- Max visible ---

  describe('max-visible attribute', () => {
    it('defaults maxVisible to 3', async () => {
      const region = await mountRegion()
      expect(region.maxVisible).toBe(3)
    })

    it('limits displayed toasts to maxVisible count', async () => {
      const region = await mountRegion()
      region.maxVisible = 2
      await settle(region)

      region.controller.push({message: 'A', durationMs: 0})
      region.controller.push({message: 'B', durationMs: 0})
      region.controller.push({message: 'C', durationMs: 0})
      await settle(region)

      expect(getToastItems(region)).toHaveLength(2)
    })

    it('changing maxVisible keeps live toasts and the same controller (no recreate)', async () => {
      const region = await mountRegion()
      const controllerBefore = region.controller

      const a = region.controller.push({message: 'A', durationMs: 0})
      const b = region.controller.push({message: 'B', durationMs: 0})
      await settle(region)
      expect(getToastItems(region)).toHaveLength(2)

      const closed: string[] = []
      region.addEventListener('cv-close', (event) => {
        closed.push((event as CustomEvent<{id: string}>).detail.id)
      })

      region.maxVisible = 5
      await settle(region)

      // Same controller object, no toasts wiped, no spurious cv-close.
      expect(region.controller).toBe(controllerBefore)
      expect(region.controller.model.state.items().map((item) => item.id)).toEqual([b, a])
      expect(getToastItems(region)).toHaveLength(2)
      expect(closed).toEqual([])
    })

    it('honors a declarative max-visible attribute set before first update', async () => {
      CVToastRegion.define()
      const region = document.createElement('cv-toast-region') as CVToastRegion
      region.setAttribute('max-visible', '5')
      document.body.append(region)
      await settle(region)

      expect(region.maxVisible).toBe(5)
      expect(region.controller.model.state.maxVisible()).toBe(5)

      for (const message of ['A', 'B', 'C', 'D', 'E']) {
        region.controller.push({message, durationMs: 0})
      }
      await settle(region)

      expect(getToastItems(region)).toHaveLength(5)
    })

    it('increasing maxVisible reveals queued toasts', async () => {
      const region = await mountRegion()
      region.maxVisible = 2
      await settle(region)

      region.controller.push({message: 'A', durationMs: 0})
      region.controller.push({message: 'B', durationMs: 0})
      region.controller.push({message: 'C', durationMs: 0})
      await settle(region)
      expect(getToastItems(region)).toHaveLength(2)

      region.maxVisible = 3
      await settle(region)
      expect(getToastItems(region)).toHaveLength(3)
    })
  })

  // --- Region ARIA structure ---

  describe('region ARIA structure', () => {
    it('does not create a second live region', async () => {
      const region = await mountRegion()
      const base = region.shadowRoot?.querySelector('[part="base"]') as HTMLElement
      expect(base.hasAttribute('aria-atomic')).toBe(false)
    })
  })

  // --- Overflow queueing ---

  describe('overflow queueing', () => {
    it('keeps overflow toasts queued and reveals them after a visible toast is dismissed', async () => {
      const region = await mountRegion()

      const first = region.controller.push({message: 'A', durationMs: 0})
      region.controller.push({message: 'B', durationMs: 0})
      region.controller.push({message: 'C', durationMs: 0})
      const newest = region.controller.push({message: 'D', durationMs: 0})
      await settle(region)

      // default maxVisible is 3; newest toasts are shown first, oldest is queued
      expect(getToastItems(region)).toHaveLength(3)
      expect(region.controller.model.state.items()).toHaveLength(4)
      const visibleIds = region.controller.model.state.visibleItems().map((item) => item.id)
      expect(visibleIds).not.toContain(first)

      region.controller.dismiss(newest)
      await settle(region)

      expect(getToastItems(region)).toHaveLength(3)
      const visibleAfter = region.controller.model.state.visibleItems().map((item) => item.id)
      expect(visibleAfter).toContain(first)
    })
  })

  // --- Dismiss all ---

  describe('dismiss all', () => {
    it('clear() emits a cv-close event for every dismissed toast', async () => {
      const region = await mountRegion()

      const closed: string[] = []
      region.addEventListener('cv-close', (event) => {
        closed.push((event as CustomEvent<{id: string}>).detail.id)
      })

      const first = region.controller.push({message: 'One', durationMs: 0})
      const second = region.controller.push({message: 'Two', durationMs: 0})
      await settle(region)

      region.controller.clear()
      await settle(region)

      expect(closed).toHaveLength(2)
      expect(closed).toContain(first)
      expect(closed).toContain(second)
    })
  })

  // --- Pause/resume corner cases ---

  describe('pause/resume corner cases', () => {
    it('a toast pushed while paused does not start its timer until resume', async () => {
      vi.useFakeTimers()

      const region = await mountRegion()
      region.controller.pause()

      region.controller.push({message: 'Held', durationMs: 50})
      await settle(region)

      vi.advanceTimersByTime(500)
      await settle(region)
      expect(getToastItems(region)).toHaveLength(1)

      region.controller.resume()
      vi.advanceTimersByTime(50)
      await settle(region)
      expect(getToastItems(region)).toHaveLength(0)
    })

    it('a persistent toast (durationMs 0) survives pause/resume cycles', async () => {
      vi.useFakeTimers()

      const region = await mountRegion()
      region.controller.push({message: 'Sticky', durationMs: 0})
      await settle(region)

      region.controller.pause()
      region.controller.resume()
      vi.advanceTimersByTime(60_000)
      await settle(region)

      expect(getToastItems(region)).toHaveLength(1)
    })
  })

  // --- Controller replacement ---

  describe('controller replacement', () => {
    it('renders toasts from a newly assigned controller without emitting spurious close events', async () => {
      const region = await mountRegion()

      let closeCount = 0
      region.addEventListener('cv-close', () => closeCount++)

      region.controller.push({message: 'Old', durationMs: 0})
      await settle(region)
      expect(getToastItems(region)).toHaveLength(1)

      region.controller = createToastController({maxVisible: 3})
      await settle(region)

      // old controller's toast disappears from DOM, but no cv-close is emitted
      expect(getToastItems(region)).toHaveLength(0)
      expect(closeCount).toBe(0)

      region.controller.push({message: 'New', durationMs: 0})
      await settle(region)
      expect(getToastItems(region)).toHaveLength(1)
    })
  })

  // --- Mouse hover pause/resume ---

  describe('mouse hover pause/resume', () => {
    it('pauses timers on mouseenter and resumes on mouseleave', async () => {
      vi.useFakeTimers()

      const region = await mountRegion()
      region.controller.push({message: 'Hover test', durationMs: 100})
      await settle(region)

      const base = region.shadowRoot?.querySelector('[part="base"]') as HTMLElement

      vi.advanceTimersByTime(30)
      base.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}))
      await settle(region)

      vi.advanceTimersByTime(500)
      await settle(region)
      expect(getToastItems(region)).toHaveLength(1)

      base.dispatchEvent(new MouseEvent('mouseleave', {bubbles: true}))
      await settle(region)

      vi.advanceTimersByTime(70)
      await settle(region)
      expect(getToastItems(region)).toHaveLength(0)
    })
  })
})
