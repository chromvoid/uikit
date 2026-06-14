import {afterEach, describe, expect, it} from 'vitest'

import {CVSliderMultiThumb} from './cv-slider-multi-thumb'

const settle = async (element: CVSliderMultiThumb) => {
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

const createPointerEvent = (
  type: string,
  init: MouseEventInit & {pointerId?: number; isPrimary?: boolean} = {},
) =>
  new MouseEvent(type, {
    bubbles: true,
    ...init,
  })

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-slider-multi-thumb', () => {
  it('handles keyboard updates and emits input/change', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [20, 80]
    slider.step = 5

    const inputValues: number[][] = []
    const changeValues: number[][] = []

    slider.addEventListener('cv-input', (event) => {
      inputValues.push((event as unknown as CustomEvent<{values: number[]}>).detail.values)
    })

    slider.addEventListener('cv-change', (event) => {
      changeValues.push((event as unknown as CustomEvent<{values: number[]}>).detail.values)
    })

    document.body.append(slider)
    await settle(slider)

    const thumbs = Array.from(
      slider.shadowRoot?.querySelectorAll('[part="thumb"]') ?? [],
    ) as HTMLButtonElement[]
    thumbs[0]!.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
    await settle(slider)

    expect(slider.values).toEqual([25, 80])
    expect(inputValues).toEqual([[25, 80]])
    expect(changeValues).toEqual([[25, 80]])
  })

  it('moves nearest thumb from track pointer drag and emits change on release', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [20, 80]
    slider.min = 0
    slider.max = 100

    const changeValues: number[][] = []
    slider.addEventListener('cv-change', (event) => {
      changeValues.push((event as unknown as CustomEvent<{values: number[]}>).detail.values)
    })

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    const base = slider.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 170, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointermove', {clientX: 180, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 180, clientY: 10}))
    await settle(slider)

    expect(slider.values).toEqual([20, 90])
    expect(changeValues.at(-1)).toEqual([20, 90])
  })

  it('keeps thumbs ordered and does not allow crossing', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [40, 60]

    document.body.append(slider)
    await settle(slider)

    const thumbs = Array.from(
      slider.shadowRoot?.querySelectorAll('[part="thumb"]') ?? [],
    ) as HTMLButtonElement[]
    for (let step = 0; step < 40; step += 1) {
      thumbs[1]!.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true}))
    }
    await settle(slider)

    expect(slider.values).toEqual([40, 40])
  })

  it('clamps Home/End to neighbouring thumb bounds instead of range bounds', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [20, 80]

    document.body.append(slider)
    await settle(slider)

    const thumbs = Array.from(
      slider.shadowRoot?.querySelectorAll('[part="thumb"]') ?? [],
    ) as HTMLButtonElement[]

    thumbs[1]!.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
    await settle(slider)
    expect(slider.values).toEqual([20, 20])

    thumbs[1]!.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
    await settle(slider)
    expect(slider.values).toEqual([20, 100])

    thumbs[0]!.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
    await settle(slider)
    expect(slider.values).toEqual([100, 100])
  })

  it('clamps pointer drags at the neighbouring thumb value', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [20, 80]
    slider.min = 0
    slider.max = 100

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    const base = slider.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    // Grab the lower thumb near its position, then drag far past the upper thumb.
    base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 50, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointermove', {clientX: 190, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 190, clientY: 10}))
    await settle(slider)

    expect(slider.values).toEqual([80, 80])
  })

  it('normalizes programmatic values silently without emitting events', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [20, 80]

    let inputCount = 0
    let changeCount = 0
    slider.addEventListener('cv-input', () => inputCount++)
    slider.addEventListener('cv-change', () => changeCount++)

    document.body.append(slider)
    await settle(slider)

    slider.values = [90, 10]
    await settle(slider)

    expect(slider.values).toEqual([10, 90])
    expect(inputCount).toBe(0)
    expect(changeCount).toBe(0)
  })

  it('exposes neighbour-aware aria bounds and value text per thumb', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [30, 70]
    slider.min = 0
    slider.max = 100

    document.body.append(slider)
    await settle(slider)

    const thumbs = Array.from(
      slider.shadowRoot?.querySelectorAll('[part="thumb"]') ?? [],
    ) as HTMLButtonElement[]

    expect(thumbs[0]!.getAttribute('aria-valuemin')).toBe('0')
    expect(thumbs[0]!.getAttribute('aria-valuemax')).toBe('70')
    expect(thumbs[1]!.getAttribute('aria-valuemin')).toBe('30')
    expect(thumbs[1]!.getAttribute('aria-valuemax')).toBe('100')
    expect(thumbs[0]!.getAttribute('aria-valuetext')).toBe('30')
    expect(thumbs[0]!.getAttribute('aria-label')).toBe('Thumb 1')
    expect(thumbs[1]!.getAttribute('aria-label')).toBe('Thumb 2')
  })

  it('does not emit events when keyboard input cannot change a thumb', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [20, 100]

    let inputCount = 0
    let changeCount = 0
    slider.addEventListener('cv-input', () => inputCount++)
    slider.addEventListener('cv-change', () => changeCount++)

    document.body.append(slider)
    await settle(slider)

    const thumbs = Array.from(
      slider.shadowRoot?.querySelectorAll('[part="thumb"]') ?? [],
    ) as HTMLButtonElement[]
    thumbs[1]!.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
    await settle(slider)

    expect(slider.values).toEqual([20, 100])
    expect(inputCount).toBe(0)
    expect(changeCount).toBe(0)
  })

  it('ignores non-left button presses on the track', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [20, 80]

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    const base = slider.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 170, clientY: 10, button: 2}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 170, clientY: 10, button: 2}))
    await settle(slider)

    expect(slider.values).toEqual([20, 80])
  })

  it('detaches document drag listeners when disconnected mid-drag', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [20, 80]

    const changeValues: number[][] = []
    slider.addEventListener('cv-change', (event) => {
      changeValues.push((event as unknown as CustomEvent<{values: number[]}>).detail.values)
    })

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    const base = slider.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 170, clientY: 10}))
    const valuesAfterPress = [...slider.values]
    slider.remove()

    document.dispatchEvent(createPointerEvent('pointermove', {clientX: 30, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 30, clientY: 10}))
    await settle(slider)

    expect(slider.values).toEqual(valuesAfterPress)
    expect(changeValues).toEqual([])
  })

  it('starts a drag from a pointerdown directly on a thumb', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [20, 80]
    slider.min = 0
    slider.max = 100

    const changeValues: number[][] = []
    slider.addEventListener('cv-change', (event) => {
      changeValues.push((event as unknown as CustomEvent<{values: number[]}>).detail.values)
    })

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    const thumbs = Array.from(
      slider.shadowRoot?.querySelectorAll('[part="thumb"]') ?? [],
    ) as HTMLButtonElement[]

    // mousedown/pointerdown directly on the upper thumb element must begin a
    // drag for THAT thumb, then track movement on the document.
    thumbs[1]!.dispatchEvent(createPointerEvent('pointerdown', {clientX: 160, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointermove', {clientX: 120, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 120, clientY: 10}))
    await settle(slider)

    expect(slider.values).toEqual([20, 60])
    expect(changeValues.at(-1)).toEqual([20, 60])
  })

  it('grabs the higher-index thumb when clicking right of coincident thumbs', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [50, 50]
    slider.min = 0
    slider.max = 100

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    const base = slider.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    // Both thumbs sit at 50 (=100px). Click/drag to the right: the higher-index
    // thumb (which can move right) must be grabbed so the range can open up.
    base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 120, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointermove', {clientX: 180, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 180, clientY: 10}))
    await settle(slider)

    expect(slider.values).toEqual([50, 90])
  })

  it('renders correct thumb positions for sub-unit ranges', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.min = 0
    slider.max = 0.5
    slider.step = 0.1
    slider.values = [0, 0.5]

    document.body.append(slider)
    await settle(slider)

    const thumbs = Array.from(
      slider.shadowRoot?.querySelectorAll('[part="thumb"]') ?? [],
    ) as HTMLButtonElement[]

    // With the real denominator of (max-min)=0.5, the upper thumb must sit at
    // 100%, not at 50% as the old Math.max(range, 1) denominator produced.
    expect(thumbs[0]!.getAttribute('style')).toContain('--cv-thumb-percentage:0%')
    expect(thumbs[1]!.getAttribute('style')).toContain('--cv-thumb-percentage:100%')
  })

  it('prevents keyboard and pointer updates when disabled', async () => {
    CVSliderMultiThumb.define()

    const slider = document.createElement('cv-slider-multi-thumb') as CVSliderMultiThumb
    slider.values = [30, 70]
    slider.disabled = true

    document.body.append(slider)
    await settle(slider)

    const track = slider.shadowRoot?.querySelector('[part="track"]') as HTMLElement
    const base = slider.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    const thumbs = Array.from(
      slider.shadowRoot?.querySelectorAll('[part="thumb"]') ?? [],
    ) as HTMLButtonElement[]
    thumbs[0]!.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
    base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 170, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 180, clientY: 10}))
    await settle(slider)

    expect(slider.values).toEqual([30, 70])
    expect(thumbs.every((thumb) => thumb.getAttribute('aria-disabled') === 'true')).toBe(true)
    expect(thumbs.every((thumb) => thumb.getAttribute('tabindex') === '-1')).toBe(true)
  })
})
