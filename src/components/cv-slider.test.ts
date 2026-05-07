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
    mockTrackRect(track, {left: 0, top: 0, width: 200, height: 20})

    track.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointermove', {clientX: 150, clientY: 10}))
    document.dispatchEvent(createPointerEvent('pointerup', {clientX: 150, clientY: 10}))
    await settle(slider)

    expect(slider.value).toBe(75)
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
})
