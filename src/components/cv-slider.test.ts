import {afterEach, describe, expect, it} from 'vitest'

import {CVSlider} from './cv-slider'

const settle = async (element: CVSlider) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
  await Promise.resolve()
}

const mockTrackRect = (track: HTMLElement, rect: Partial<DOMRect>) => {
  Object.defineProperty(track, 'getBoundingClientRect', {
    configurable: true,
    value: () =>
      ({
        x: rect.x ?? rect.left ?? 0,
        y: rect.y ?? rect.top ?? 0,
        width: rect.width ?? 0,
        height: rect.height ?? 0,
        top: rect.top ?? 0,
        left: rect.left ?? 0,
        right: rect.right ?? (rect.left ?? 0) + (rect.width ?? 0),
        bottom: rect.bottom ?? (rect.top ?? 0) + (rect.height ?? 0),
        toJSON: () => ({}),
      }) as DOMRect,
  })
}

const createPointerEvent = (type: string, init: MouseEventInit & {pointerId?: number} = {}) =>
  new MouseEvent(type, {
    bubbles: true,
    ...init,
  })

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-slider', () => {
  it('does not render percentage through a style attribute binding', async () => {
    CVSlider.define()

    const originalSetAttribute = HTMLElement.prototype.setAttribute
    const styleAttributeWrites: string[] = []
    HTMLElement.prototype.setAttribute = function setAttribute(name: string, value: string) {
      if (name === 'style') {
        styleAttributeWrites.push(value)
      }
      return originalSetAttribute.call(this, name, value)
    }

    try {
      const slider = document.createElement('cv-slider') as CVSlider
      slider.min = 0
      slider.max = 100
      slider.value = 25

      document.body.append(slider)
      await settle(slider)

      const base = slider.shadowRoot?.querySelector('[part="base"]') as HTMLElement | null
      expect(styleAttributeWrites).toEqual([])
      expect(base?.style.getPropertyValue('--cv-slider-percentage')).toBe('25%')
    } finally {
      HTMLElement.prototype.setAttribute = originalSetAttribute
    }
  })

  it('handles keyboard value updates and emits input/change', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 10
    slider.value = 2

    const inputValues: number[] = []
    const changeValues: number[] = []

    slider.addEventListener('cv-input', (event) => {
      inputValues.push((event as unknown as CustomEvent<{value: number}>).detail.value)
    })

    slider.addEventListener('cv-change', (event) => {
      changeValues.push((event as unknown as CustomEvent<{value: number}>).detail.value)
    })

    document.body.append(slider)
    await settle(slider)

    const thumb = slider.shadowRoot?.querySelector('[part="thumb"]') as HTMLElement
    thumb.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
    await settle(slider)

    expect(slider.value).toBe(3)
    expect(inputValues).toEqual([3])
    expect(changeValues).toEqual([3])
  })

  it('updates value from pointer track interactions', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 100
    slider.value = 0

    const inputValues: number[] = []
    const changeValues: number[] = []

    slider.addEventListener('cv-input', (event) => {
      inputValues.push((event as unknown as CustomEvent<{value: number}>).detail.value)
    })

    slider.addEventListener('cv-change', (event) => {
      changeValues.push((event as unknown as CustomEvent<{value: number}>).detail.value)
    })

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    const base = slider.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    track.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointermove', {clientX: 150, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 150, clientY: 10}))
    await settle(slider)

    expect(slider.value).toBe(75)
    expect(base.style.getPropertyValue('--cv-slider-percentage')).toBe('75%')
    expect(inputValues.at(-1)).toBe(75)
    expect(changeValues).toEqual([75])
  })

  it('updates value from pointer interactions on the expanded base area', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 100
    slider.value = 0

    const inputValues: number[] = []
    const changeValues: number[] = []

    slider.addEventListener('cv-input', (event) => {
      inputValues.push((event as unknown as CustomEvent<{value: number}>).detail.value)
    })

    slider.addEventListener('cv-change', (event) => {
      changeValues.push((event as unknown as CustomEvent<{value: number}>).detail.value)
    })

    document.body.append(slider)
    await settle(slider)

    const base = slider.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 17, width: 200, height: 8})

    base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 0}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 100, clientY: 0}))
    await settle(slider)

    expect(slider.value).toBe(50)
    expect(inputValues).toEqual([50])
    expect(changeValues).toEqual([50])
  })

  it('supports vertical orientation pointer mapping', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.orientation = 'vertical'
    slider.min = 0
    slider.max = 100
    slider.value = 0

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 20, height: 200})

    track.dispatchEvent(createPointerEvent('pointerdown', {clientX: 10, clientY: 150}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 10, clientY: 150}))
    await settle(slider)

    expect(slider.value).toBe(25)
  })

  it('supports Home and End keys to jump to range bounds', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 10
    slider.max = 90
    slider.value = 50

    document.body.append(slider)
    await settle(slider)

    const thumb = slider.shadowRoot?.querySelector('[part="thumb"]') as HTMLElement
    thumb.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
    await settle(slider)
    expect(slider.value).toBe(90)

    thumb.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
    await settle(slider)
    expect(slider.value).toBe(10)
  })

  it('supports PageUp/PageDown using the large step', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 100
    slider.value = 50
    slider.largeStep = 25

    document.body.append(slider)
    await settle(slider)

    const thumb = slider.shadowRoot?.querySelector('[part="thumb"]') as HTMLElement
    thumb.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageUp', bubbles: true}))
    await settle(slider)
    expect(slider.value).toBe(75)

    thumb.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
    thumb.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
    await settle(slider)
    expect(slider.value).toBe(25)
  })

  it('avoids floating point drift with fractional steps', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 1
    slider.step = 0.1
    slider.value = 0.2

    document.body.append(slider)
    await settle(slider)

    const thumb = slider.shadowRoot?.querySelector('[part="thumb"]') as HTMLElement
    thumb.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
    await settle(slider)

    expect(slider.value).toBe(0.3)
    expect(thumb.getAttribute('aria-valuenow')).toBe('0.3')
  })

  it('falls back to step of 1 when step is zero or negative', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 10
    slider.step = 0
    slider.value = 5

    document.body.append(slider)
    await settle(slider)

    const thumb = slider.shadowRoot?.querySelector('[part="thumb"]') as HTMLElement
    thumb.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
    await settle(slider)

    expect(slider.value).toBe(6)
  })

  it('normalizes a swapped min/max range', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 100
    slider.max = 0
    slider.value = 50

    document.body.append(slider)
    await settle(slider)

    const thumb = slider.shadowRoot?.querySelector('[part="thumb"]') as HTMLElement
    expect(thumb.getAttribute('aria-valuemin')).toBe('0')
    expect(thumb.getAttribute('aria-valuemax')).toBe('100')
    expect(thumb.getAttribute('aria-valuenow')).toBe('50')
  })

  it('does not emit events when keyboard input cannot change the value', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 10
    slider.value = 10

    let inputCount = 0
    let changeCount = 0
    slider.addEventListener('cv-input', () => inputCount++)
    slider.addEventListener('cv-change', () => changeCount++)

    document.body.append(slider)
    await settle(slider)

    const thumb = slider.shadowRoot?.querySelector('[part="thumb"]') as HTMLElement
    thumb.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
    await settle(slider)

    expect(slider.value).toBe(10)
    expect(inputCount).toBe(0)
    expect(changeCount).toBe(0)
  })

  it('ignores pointer interaction when the track has no layout size', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 100
    slider.value = 40

    let inputCount = 0
    slider.addEventListener('cv-input', () => inputCount++)

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 0, height: 0})

    track.dispatchEvent(createPointerEvent('pointerdown', {clientX: 50, clientY: 5}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 50, clientY: 5}))
    await settle(slider)

    expect(slider.value).toBe(40)
    expect(inputCount).toBe(0)
  })

  it('ignores non-left button pointer presses', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 100
    slider.value = 10

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    track.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 10, button: 2}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 100, clientY: 10, button: 2}))
    await settle(slider)

    expect(slider.value).toBe(10)
  })

  it('aborts a drag without emitting cv-change on pointercancel', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 100
    slider.value = 0

    const changeValues: number[] = []
    slider.addEventListener('cv-change', (event) => {
      changeValues.push((event as unknown as CustomEvent<{value: number}>).detail.value)
    })

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    track.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointercancel', {clientX: 100, clientY: 10}))
    const valueAfterCancel = slider.value
    document.dispatchEvent(createPointerEvent('pointermove', {clientX: 180, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 180, clientY: 10}))
    await settle(slider)

    expect(slider.value).toBe(valueAfterCancel)
    expect(changeValues).toEqual([])
  })

  it('detaches document drag listeners when disconnected mid-drag', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 100
    slider.value = 0

    const changeValues: number[] = []
    slider.addEventListener('cv-change', (event) => {
      changeValues.push((event as unknown as CustomEvent<{value: number}>).detail.value)
    })

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    track.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 10}))
    const valueAfterPress = slider.value
    slider.remove()

    document.dispatchEvent(createPointerEvent('pointermove', {clientX: 180, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 180, clientY: 10}))
    await settle(slider)

    expect(slider.value).toBe(valueAfterPress)
    expect(changeValues).toEqual([])
  })

  it('prevents updates when disabled', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 10
    slider.value = 5
    slider.disabled = true

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    const thumb = slider.shadowRoot?.querySelector('[part="thumb"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 100, height: 10})

    thumb.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
    track.dispatchEvent(createPointerEvent('pointerdown', {clientX: 80, clientY: 5}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 80, clientY: 5}))
    await settle(slider)

    expect(slider.value).toBe(5)
    expect(thumb.getAttribute('aria-disabled')).toBe('true')
    expect(thumb.getAttribute('tabindex')).toBe('-1')
  })

  it('back-syncs the value property when the model clamps it', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 100

    document.body.append(slider)
    await settle(slider)

    slider.value = 200
    await settle(slider)

    const thumb = slider.shadowRoot?.querySelector('[part="thumb"]') as HTMLElement
    expect(thumb.getAttribute('aria-valuenow')).toBe('100')
    // The property must follow the clamped model value, not stay at 200.
    expect(slider.value).toBe(100)
  })

  it('does not act on arrow keys with a modifier or when defaultPrevented', async () => {
    CVSlider.define()

    const slider = document.createElement('cv-slider') as CVSlider
    slider.min = 0
    slider.max = 100
    slider.value = 50

    document.body.append(slider)
    await settle(slider)

    const thumb = slider.shadowRoot?.querySelector('[part="thumb"]') as HTMLElement

    const ctrlEvent = new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true, ctrlKey: true})
    thumb.dispatchEvent(ctrlEvent)
    await settle(slider)
    expect(slider.value).toBe(50)
    expect(ctrlEvent.defaultPrevented).toBe(false)

    const preEvent = new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true, cancelable: true})
    preEvent.preventDefault()
    thumb.dispatchEvent(preEvent)
    await settle(slider)
    expect(slider.value).toBe(50)
  })
})
