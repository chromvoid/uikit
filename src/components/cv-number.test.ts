import {afterEach, describe, expect, it, vi} from 'vitest'

import {CVNumber} from './cv-number'

CVNumber.define()

const settle = async (element: CVNumber) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createNumber = async (attrs?: Partial<CVNumber>) => {
  const el = document.createElement('cv-number') as CVNumber
  if (attrs) Object.assign(el, attrs)
  document.body.append(el)
  await settle(el)
  return el
}

const getBase = (el: CVNumber) => el.shadowRoot!.querySelector('[part="base"]') as HTMLElement
const getInput = (el: CVNumber) => el.shadowRoot!.querySelector('[part="input"]') as HTMLInputElement
const getPrefix = (el: CVNumber) => el.shadowRoot!.querySelector('[part="prefix"]') as HTMLElement
const getSuffix = (el: CVNumber) => el.shadowRoot!.querySelector('[part="suffix"]') as HTMLElement
const getClearButton = (el: CVNumber) => el.shadowRoot!.querySelector('[part="clear-button"]') as HTMLElement
const getStepper = (el: CVNumber) => el.shadowRoot!.querySelector('[part="stepper"]') as HTMLElement
const getIncrement = (el: CVNumber) => el.shadowRoot!.querySelector('[part="increment"]') as HTMLButtonElement
const getDecrement = (el: CVNumber) => el.shadowRoot!.querySelector('[part="decrement"]') as HTMLButtonElement
const getStylesText = () =>
  (CVNumber.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')
const originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')
const originalVibrateDescriptor = Object.getOwnPropertyDescriptor(navigator, 'vibrate')

const createPointerEvent = (
  type: string,
  init: MouseEventInit & {pointerId?: number; pointerType?: string; isPrimary?: boolean} = {},
): PointerEvent => {
  const event = new MouseEvent(type, {
    bubbles: true,
    composed: true,
    cancelable: true,
    button: 0,
    ...init,
  }) as PointerEvent

  Object.defineProperties(event, {
    pointerId: {value: init.pointerId ?? 1},
    pointerType: {value: init.pointerType ?? 'touch'},
    isPrimary: {value: init.isPrimary ?? true},
  })

  return event
}

const createWheelEvent = (deltaY: number, init: WheelEventInit = {}) =>
  new WheelEvent('wheel', {
    bubbles: true,
    composed: true,
    cancelable: true,
    deltaY,
    ...init,
  })

const setMatchMedia = (matches: (query: string) => boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn((query: string) => {
      return {
        matches: matches(query),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList
    }),
  })
}

const setNavigatorVibrate = (vibrate: ReturnType<typeof vi.fn>) => {
  Object.defineProperty(navigator, 'vibrate', {
    configurable: true,
    value: vibrate,
  })
}

const restoreProperty = (target: object, key: PropertyKey, descriptor: PropertyDescriptor | undefined) => {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor)
  } else {
    Reflect.deleteProperty(target, key)
  }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
  restoreProperty(window, 'matchMedia', originalMatchMediaDescriptor)
  restoreProperty(navigator, 'vibrate', originalVibrateDescriptor)
})

describe('cv-number', () => {
  describe('style contract', () => {
    it('renders filled variant with a visible non-prominent shell', () => {
      const stylesText = getStylesText()

      expect(stylesText).toMatch(
        /:host\(\[variant='filled'\]\) \[part='base'\]\s*{[\s\S]*background:\s*var\(--cv-color-surface-2/,
      )
      expect(stylesText).toMatch(
        /:host\(\[variant='filled'\]\) \[part='base'\]\s*{[\s\S]*border-color:\s*transparent;/,
      )
      expect(stylesText).toMatch(
        /:host\(\[variant='filled'\]\) \[part='base'\]\s*{[\s\S]*box-shadow:\s*inset 0 0 0 1px/,
      )
    })

    it('keeps stepper buttons constrained inside the control height', () => {
      const stylesText = getStylesText()

      expect(stylesText).toContain("[part='stepper']")
      expect(stylesText).toMatch(/\[part='stepper'\]\s*{[\s\S]*display:\s*inline-flex;/)
      expect(stylesText).toMatch(
        /\[part='stepper'\]\s*{[\s\S]*gap:\s*var\(--cv-number-stepper-button-gap\);/,
      )
      expect(stylesText).toMatch(/--cv-number-stepper-button-inline-size:\s*var\(--cv-number-stepper-width,\s*28px\);/)
      expect(stylesText).toMatch(
        /\[part='increment'\],\s*\n\s*\[part='decrement'\]\s*{[\s\S]*inline-size:\s*var\(--cv-number-stepper-button-inline-size\);/,
      )
      expect(stylesText).toMatch(
        /\[part='increment'\],\s*\n\s*\[part='decrement'\]\s*{[\s\S]*block-size:\s*max\(22px,\s*calc\(var\(--cv-number-height\) - 8px\)\);/,
      )
      expect(stylesText).toMatch(
        /:host\(\[stepper\]\) \[part='base'\]\s*{[\s\S]*touch-action:\s*pan-y pinch-zoom;/,
      )
      expect(stylesText).toContain(":host([stepper-active='increment']) [part='increment']")
      expect(stylesText).toMatch(/\[part='increment'\]\[aria-disabled='true'\]/)
    })
  })

  // ---------------------------------------------------------------------------
  // Shadow DOM structure
  // ---------------------------------------------------------------------------

  describe('shadow DOM structure', () => {
    it('renders [part="base"] as a <div>', async () => {
      const el = await createNumber()
      const base = getBase(el)
      expect(base).not.toBeNull()
      expect(base.tagName.toLowerCase()).toBe('div')
    })

    it('renders [part="input"] as an <input> with role="spinbutton"', async () => {
      const el = await createNumber()
      const input = getInput(el)
      expect(input).not.toBeNull()
      expect(input.tagName.toLowerCase()).toBe('input')
      expect(input.getAttribute('role')).toBe('spinbutton')
    })

    it('renders [part="input"] with inputmode="decimal"', async () => {
      const el = await createNumber()
      const input = getInput(el)
      expect(input.getAttribute('inputmode')).toBe('decimal')
    })

    it('renders [part="prefix"] containing slot[name="prefix"]', async () => {
      const el = await createNumber()
      const prefix = getPrefix(el)
      expect(prefix).not.toBeNull()
      expect(prefix.tagName.toLowerCase()).toBe('span')
      const slot = prefix.querySelector('slot[name="prefix"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="suffix"] containing slot[name="suffix"]', async () => {
      const el = await createNumber()
      const suffix = getSuffix(el)
      expect(suffix).not.toBeNull()
      expect(suffix.tagName.toLowerCase()).toBe('span')
      const slot = suffix.querySelector('slot[name="suffix"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="clear-button"] with role="button"', async () => {
      const el = await createNumber({clearable: true, value: 5})
      const clearBtn = getClearButton(el)
      expect(clearBtn).not.toBeNull()
      expect(clearBtn.tagName.toLowerCase()).toBe('span')
      expect(clearBtn.getAttribute('role')).toBe('button')
    })

    it('renders [part="clear-button"] with slot[name="clear-icon"]', async () => {
      const el = await createNumber({clearable: true, value: 5})
      const clearBtn = getClearButton(el)
      expect(clearBtn).not.toBeNull()
      const slot = clearBtn.querySelector('slot[name="clear-icon"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="stepper"] when stepper=true', async () => {
      const el = await createNumber({stepper: true})
      const stepperEl = getStepper(el)
      expect(stepperEl).not.toBeNull()
      expect(stepperEl.tagName.toLowerCase()).toBe('span')
    })

    it('renders [part="increment"] as a <button> when stepper=true', async () => {
      const el = await createNumber({stepper: true})
      const inc = getIncrement(el)
      expect(inc).not.toBeNull()
      expect(inc.tagName.toLowerCase()).toBe('button')
      expect(inc.getAttribute('type')).toBe('button')
    })

    it('renders [part="decrement"] as a <button> when stepper=true', async () => {
      const el = await createNumber({stepper: true})
      const dec = getDecrement(el)
      expect(dec).not.toBeNull()
      expect(dec.tagName.toLowerCase()).toBe('button')
      expect(dec.getAttribute('type')).toBe('button')
    })
  })

  // ---------------------------------------------------------------------------
  // Default property values
  // ---------------------------------------------------------------------------

  describe('default property values', () => {
    it('has correct defaults', async () => {
      const el = await createNumber()
      expect(el.value).toBe(0)
      expect(el.step).toBe(1)
      expect(el.largeStep).toBe(10)
      expect(el.disabled).toBe(false)
      expect(el.readOnly).toBe(false)
      expect(el.required).toBe(false)
      expect(el.clearable).toBe(false)
      expect(el.stepper).toBe(false)
      expect(el.size).toBe('medium')
      expect(el.variant).toBe('outlined')
      expect(el.placeholder).toBe('')
    })

    it('defaults min and max to undefined/null (unbounded)', async () => {
      const el = await createNumber()
      expect(el.min).toBeUndefined()
      expect(el.max).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // Attribute reflection
  // ---------------------------------------------------------------------------

  describe('attribute reflection', () => {
    it('reflects boolean attributes: disabled, read-only, required, clearable, stepper', async () => {
      const el = await createNumber({
        disabled: true,
        readOnly: true,
        required: true,
        clearable: true,
        stepper: true,
      })
      expect(el.hasAttribute('disabled')).toBe(true)
      expect(el.hasAttribute('read-only')).toBe(true)
      expect(el.hasAttribute('required')).toBe(true)
      expect(el.hasAttribute('clearable')).toBe(true)
      expect(el.hasAttribute('stepper')).toBe(true)
    })

    it('reflects string attributes: size, variant', async () => {
      const el = await createNumber({size: 'large', variant: 'filled'})
      expect(el.getAttribute('size')).toBe('large')
      expect(el.getAttribute('variant')).toBe('filled')
    })

    it('removes boolean attributes when set to false', async () => {
      const el = await createNumber({disabled: true})
      expect(el.hasAttribute('disabled')).toBe(true)

      el.disabled = false
      await settle(el)
      expect(el.hasAttribute('disabled')).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------

  describe('ARIA', () => {
    it('applies role="spinbutton" on the input element', async () => {
      const el = await createNumber()
      expect(getInput(el).getAttribute('role')).toBe('spinbutton')
    })

    it('applies aria-valuenow reflecting the current value', async () => {
      const el = await createNumber({value: 42})
      expect(getInput(el).getAttribute('aria-valuenow')).toBe('42')
    })

    it('applies aria-valuemin when min is set', async () => {
      const el = await createNumber({min: 0})
      expect(getInput(el).getAttribute('aria-valuemin')).toBe('0')
    })

    it('applies aria-valuemax when max is set', async () => {
      const el = await createNumber({max: 100})
      expect(getInput(el).getAttribute('aria-valuemax')).toBe('100')
    })

    it('does not apply aria-valuemin/max when not set', async () => {
      const el = await createNumber()
      const input = getInput(el)
      expect(input.hasAttribute('aria-valuemin')).toBe(false)
      expect(input.hasAttribute('aria-valuemax')).toBe(false)
    })

    it('applies aria-disabled="true" when disabled', async () => {
      const el = await createNumber({disabled: true})
      expect(getInput(el).getAttribute('aria-disabled')).toBe('true')
    })

    it('applies aria-readonly="true" when readOnly', async () => {
      const el = await createNumber({readOnly: true})
      expect(getInput(el).getAttribute('aria-readonly')).toBe('true')
    })

    it('applies aria-required="true" when required', async () => {
      const el = await createNumber({required: true})
      expect(getInput(el).getAttribute('aria-required')).toBe('true')
    })

    it('updates aria-valuenow when value changes', async () => {
      const el = await createNumber({value: 1})
      expect(getInput(el).getAttribute('aria-valuenow')).toBe('1')

      el.value = 99
      await settle(el)
      expect(getInput(el).getAttribute('aria-valuenow')).toBe('99')
    })

    it('passes aria-labelledby and aria-describedby through to the native spinbutton', async () => {
      const el = await createNumber()
      el.setAttribute('aria-labelledby', 'field-label')
      el.setAttribute('aria-describedby', 'field-description field-error')
      await settle(el)

      const input = getInput(el)
      expect(input.getAttribute('aria-labelledby')).toBe('field-label')
      expect(input.getAttribute('aria-describedby')).toBe('field-description field-error')
    })
  })

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  describe('events', () => {
    it('dispatches cv-change with {value: number} on stepper increment click', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const details: Array<{value: number}> = []

      el.addEventListener('cv-change', ((e: CustomEvent<{value: number}>) => {
        details.push(e.detail)
      }) as EventListener)

      getIncrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(details.length).toBe(1)
      expect(details[0]).toEqual({value: 6})
    })

    it('dispatches cv-change with {value: number} on stepper decrement click', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const details: Array<{value: number}> = []

      el.addEventListener('cv-change', ((e: CustomEvent<{value: number}>) => {
        details.push(e.detail)
      }) as EventListener)

      getDecrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(details.length).toBe(1)
      expect(details[0]).toEqual({value: 4})
    })

    it('dispatches cv-clear with {} detail when clear button is clicked', async () => {
      const el = await createNumber({value: 10, clearable: true})
      const details: unknown[] = []

      el.addEventListener('cv-clear', ((e: CustomEvent) => {
        details.push(e.detail)
      }) as EventListener)

      getClearButton(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(details.length).toBe(1)
      expect(details[0]).toEqual({})
    })

    it('dispatches cv-focus with {} detail on input focus', async () => {
      const el = await createNumber()
      const details: unknown[] = []

      el.addEventListener('cv-focus', (e) => {
        details.push((e as CustomEvent).detail)
      })

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      expect(details.length).toBe(1)
      expect(details[0]).toEqual({})
    })

    it('dispatches cv-blur with {} detail on input blur', async () => {
      const el = await createNumber()
      const details: unknown[] = []

      el.addEventListener('cv-blur', (e) => {
        details.push((e as CustomEvent).detail)
      })

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      getInput(el).dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(details.length).toBe(1)
      expect(details[0]).toEqual({})
    })

    it('dispatches cv-change on blur when value changed during focus', async () => {
      const el = await createNumber({value: 5, step: 1})
      const changes: Array<{value: number}> = []

      el.addEventListener('cv-change', (e) => {
        changes.push((e as CustomEvent<{value: number}>).detail)
      })

      const input = getInput(el)
      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      // Type a new value
      input.value = '10'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(el)

      // Blur to commit
      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(changes.length).toBe(1)
      expect(changes[0]).toEqual({value: 10})
    })

    it('does not dispatch cv-change from programmatic value set', async () => {
      const el = await createNumber({value: 0})
      let changeCount = 0

      el.addEventListener('cv-change', () => changeCount++)

      el.value = 99
      await settle(el)

      expect(changeCount).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Stepper buttons
  // ---------------------------------------------------------------------------

  describe('stepper buttons', () => {
    it('stepper buttons are hidden by default (stepper=false)', async () => {
      const el = await createNumber()
      const stepperEl = getStepper(el)
      // Either not rendered or hidden
      if (stepperEl) {
        expect(stepperEl.hidden || stepperEl.getAttribute('aria-hidden') === 'true').toBe(true)
      } else {
        expect(stepperEl).toBeNull()
      }
    })

    it('stepper buttons are visible when stepper=true', async () => {
      const el = await createNumber({stepper: true})
      const stepperEl = getStepper(el)
      expect(stepperEl).not.toBeNull()
      expect(getIncrement(el)).not.toBeNull()
      expect(getDecrement(el)).not.toBeNull()
    })

    it('increment click increases value by step', async () => {
      const el = await createNumber({value: 4, step: 2, stepper: true})

      getIncrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe(6)
    })

    it('decrement click decreases value by step', async () => {
      const el = await createNumber({value: 9, step: 3, stepper: true})

      getDecrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe(6)
    })

    it('increment respects max boundary', async () => {
      const el = await createNumber({value: 9, max: 10, step: 2, stepper: true})

      getIncrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBeLessThanOrEqual(10)
    })

    it('decrement respects min boundary', async () => {
      const el = await createNumber({value: 1, min: 0, step: 2, stepper: true})

      getDecrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBeGreaterThanOrEqual(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Stepper wheel and swipe gestures
  // ---------------------------------------------------------------------------

  describe('stepper wheel and swipe gestures', () => {
    it('desktop wheel up increments the focused stepper value', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const changes: Array<{value: number}> = []

      el.addEventListener('cv-change', (event) => {
        changes.push((event as CustomEvent<{value: number}>).detail)
      })

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      const event = createWheelEvent(-48)
      getBase(el).dispatchEvent(event)
      await settle(el)

      expect(el.value).toBe(6)
      expect(event.defaultPrevented).toBe(true)
      expect(changes).toEqual([{value: 6}])
    })

    it('desktop wheel down decrements the focused stepper value', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      getBase(el).dispatchEvent(
        createWheelEvent(48),
      )
      await settle(el)

      expect(el.value).toBe(4)
    })

    it('desktop wheel accumulates trackpad-sized deltas before stepping', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const changes: Array<{value: number}> = []

      el.addEventListener('cv-change', (event) => {
        changes.push((event as CustomEvent<{value: number}>).detail)
      })

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      const first = createWheelEvent(-16)
      const second = createWheelEvent(-16)
      const third = createWheelEvent(-16)

      getBase(el).dispatchEvent(first)
      getBase(el).dispatchEvent(second)
      await settle(el)

      expect(el.value).toBe(5)
      expect(first.defaultPrevented).toBe(true)
      expect(second.defaultPrevented).toBe(true)

      getBase(el).dispatchEvent(third)
      await settle(el)

      expect(el.value).toBe(6)
      expect(third.defaultPrevented).toBe(true)
      expect(changes).toEqual([{value: 6}])
    })

    it('desktop wheel normalizes line-mode deltas', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      const event = createWheelEvent(-3, {deltaMode: 1})
      getBase(el).dispatchEvent(event)
      await settle(el)

      expect(el.value).toBe(6)
      expect(event.defaultPrevented).toBe(true)
    })

    it('desktop wheel resets accumulated deltas when direction changes', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      getBase(el).dispatchEvent(createWheelEvent(-24))
      getBase(el).dispatchEvent(createWheelEvent(24))
      await settle(el)

      expect(el.value).toBe(5)
    })

    it('desktop wheel caps very large bursts', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      getBase(el).dispatchEvent(createWheelEvent(-480))
      await settle(el)

      expect(el.value).toBe(9)
    })

    it('does not hijack horizontal-dominant wheel gestures', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})
      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      const event = createWheelEvent(-48, {deltaX: 96})
      getBase(el).dispatchEvent(event)
      await settle(el)

      expect(el.value).toBe(5)
      expect(event.defaultPrevented).toBe(false)
    })

    it('does not use wheel stepping on coarse pointer environments', async () => {
      setMatchMedia((query) => {
        if (query === '(hover: hover) and (pointer: fine)') return false
        return false
      })
      const el = await createNumber({value: 5, step: 1, stepper: true})

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      const event = createWheelEvent(-48)
      getBase(el).dispatchEvent(event)
      await settle(el)

      expect(el.value).toBe(5)
      expect(event.defaultPrevented).toBe(false)
    })

    it('does not hijack wheel scroll when the stepper is not focused', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const event = createWheelEvent(-48)

      getBase(el).dispatchEvent(event)
      await settle(el)

      expect(el.value).toBe(5)
      expect(event.defaultPrevented).toBe(false)
    })

    it('does not apply wheel changes when stepper controls are hidden', async () => {
      const el = await createNumber({value: 5, step: 1})

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      const event = createWheelEvent(-48)
      getBase(el).dispatchEvent(event)
      await settle(el)

      expect(el.value).toBe(5)
      expect(event.defaultPrevented).toBe(false)
    })

    it('touch swipe right increments the stepper value', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const changes: Array<{value: number}> = []
      const base = getBase(el)

      el.addEventListener('cv-change', (event) => {
        changes.push((event as CustomEvent<{value: number}>).detail)
      })

      base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 20}))
      const move = createPointerEvent('pointermove', {clientX: 136, clientY: 22})
      base.dispatchEvent(move)
      base.dispatchEvent(createPointerEvent('pointerup', {clientX: 136, clientY: 22}))
      await settle(el)

      expect(el.value).toBe(6)
      expect(move.defaultPrevented).toBe(true)
      expect(changes).toEqual([{value: 6}])
    })

    it('touch swipe left decrements the stepper value', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const base = getBase(el)

      base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 140, clientY: 20}))
      base.dispatchEvent(createPointerEvent('pointermove', {clientX: 104, clientY: 22}))
      base.dispatchEvent(createPointerEvent('pointerup', {clientX: 104, clientY: 22}))
      await settle(el)

      expect(el.value).toBe(4)
    })

    it('touch swipe applies multiple thresholded steps in one value change', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const changes: Array<{value: number}> = []
      const base = getBase(el)

      el.addEventListener('cv-change', (event) => {
        changes.push((event as CustomEvent<{value: number}>).detail)
      })

      base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 20}))
      const move = createPointerEvent('pointermove', {clientX: 169, clientY: 21})
      base.dispatchEvent(move)
      base.dispatchEvent(createPointerEvent('pointerup', {clientX: 169, clientY: 21}))
      await settle(el)

      expect(el.value).toBe(7)
      expect(move.defaultPrevented).toBe(true)
      expect(changes).toEqual([{value: 7}])
    })

    it('touch swipe vibrates after a successful step', async () => {
      const vibrate = vi.fn(() => true)
      setNavigatorVibrate(vibrate)
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const base = getBase(el)

      base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 20}))
      base.dispatchEvent(createPointerEvent('pointermove', {clientX: 136, clientY: 22}))
      base.dispatchEvent(createPointerEvent('pointerup', {clientX: 136, clientY: 22}))
      await settle(el)

      expect(vibrate).toHaveBeenCalledWith(6)
    })

    it('touch swipe does not vibrate when reduced motion is requested', async () => {
      const vibrate = vi.fn(() => true)
      setNavigatorVibrate(vibrate)
      setMatchMedia((query) => query === '(prefers-reduced-motion: reduce)')
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const base = getBase(el)

      base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 20}))
      base.dispatchEvent(createPointerEvent('pointermove', {clientX: 136, clientY: 22}))
      base.dispatchEvent(createPointerEvent('pointerup', {clientX: 136, clientY: 22}))
      await settle(el)

      expect(el.value).toBe(6)
      expect(vibrate).not.toHaveBeenCalled()
    })

    it('touch swipe ignores vertical scroll gestures', async () => {
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const base = getBase(el)

      base.dispatchEvent(createPointerEvent('pointerdown', {clientX: 100, clientY: 20}))
      const move = createPointerEvent('pointermove', {clientX: 104, clientY: 58})
      base.dispatchEvent(move)
      base.dispatchEvent(createPointerEvent('pointerup', {clientX: 104, clientY: 58}))
      await settle(el)

      expect(el.value).toBe(5)
      expect(move.defaultPrevented).toBe(false)
    })

    it('long press repeats and suppresses the final click', async () => {
      vi.useFakeTimers()
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const increment = getIncrement(el)

      increment.dispatchEvent(createPointerEvent('pointerdown', {pointerType: 'mouse'}))
      vi.advanceTimersByTime(421)
      await settle(el)

      expect(el.value).toBe(6)

      increment.dispatchEvent(createPointerEvent('pointerup', {pointerType: 'mouse'}))
      increment.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe(6)
    })

    it('long press accelerates and stops after pointerup', async () => {
      vi.useFakeTimers()
      const el = await createNumber({value: 5, step: 1, stepper: true})
      const increment = getIncrement(el)

      increment.dispatchEvent(createPointerEvent('pointerdown', {pointerType: 'mouse'}))
      vi.advanceTimersByTime(730)
      await settle(el)

      const valueAfterRepeat = el.value
      expect(valueAfterRepeat).toBeGreaterThan(6)

      increment.dispatchEvent(createPointerEvent('pointerup', {pointerType: 'mouse'}))
      vi.advanceTimersByTime(500)
      await settle(el)

      expect(el.value).toBe(valueAfterRepeat)
    })

    it('long press resets when the element disconnects', async () => {
      vi.useFakeTimers()
      const el = await createNumber({value: 5, step: 1, stepper: true})

      getIncrement(el).dispatchEvent(createPointerEvent('pointerdown', {pointerType: 'mouse'}))
      el.remove()
      vi.advanceTimersByTime(800)
      await Promise.resolve()

      expect(el.value).toBe(5)
    })

    it('touch long press vibrates only for successful repeated steps', async () => {
      vi.useFakeTimers()
      const vibrate = vi.fn(() => true)
      setNavigatorVibrate(vibrate)
      const el = await createNumber({value: 5, step: 1, stepper: true})

      getIncrement(el).dispatchEvent(createPointerEvent('pointerdown', {pointerType: 'touch'}))
      vi.advanceTimersByTime(421)
      await settle(el)

      expect(el.value).toBe(6)
      expect(vibrate).toHaveBeenCalledWith(6)
    })
  })

  // ---------------------------------------------------------------------------
  // Clear button
  // ---------------------------------------------------------------------------

  describe('clear button', () => {
    it('is hidden when clearable=false', async () => {
      const el = await createNumber({value: 5})
      const clearBtn = getClearButton(el)
      if (clearBtn) {
        expect(clearBtn.hidden || clearBtn.getAttribute('aria-hidden') === 'true').toBe(true)
      } else {
        expect(clearBtn).toBeNull()
      }
    })

    it('is visible when clearable=true and value differs from defaultValue', async () => {
      const el = await createNumber({clearable: true, value: 42})
      const clearBtn = getClearButton(el)
      expect(clearBtn).not.toBeNull()
      expect(clearBtn.hidden).toBe(false)
    })

    it('clicking clear resets value to defaultValue', async () => {
      const el = await createNumber({clearable: true, value: 42})

      getClearButton(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      // defaultValue defaults to min ?? 0
      expect(el.value).toBe(0)
    })

    it('clicking clear dispatches cv-clear event', async () => {
      const el = await createNumber({clearable: true, value: 42})
      let cleared = false

      el.addEventListener('cv-clear', () => {
        cleared = true
      })

      getClearButton(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(cleared).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Keyboard interaction
  // ---------------------------------------------------------------------------

  describe('keyboard interaction', () => {
    it('ArrowUp increments value by step', async () => {
      const el = await createNumber({value: 5, step: 1})
      const input = getInput(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(6)
    })

    it('ArrowDown decrements value by step', async () => {
      const el = await createNumber({value: 5, step: 1})
      const input = getInput(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(4)
    })

    it('PageUp increments value by largeStep', async () => {
      const el = await createNumber({value: 5, largeStep: 10})
      const input = getInput(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageUp', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(15)
    })

    it('PageDown decrements value by largeStep', async () => {
      const el = await createNumber({value: 25, largeStep: 10})
      const input = getInput(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(15)
    })

    it('Home sets value to min when min is defined', async () => {
      const el = await createNumber({value: 50, min: 0})
      const input = getInput(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(0)
    })

    it('End sets value to max when max is defined', async () => {
      const el = await createNumber({value: 50, max: 100})
      const input = getInput(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(100)
    })

    it('Enter commits the draft text', async () => {
      const el = await createNumber({value: 5})
      const input = getInput(el)

      input.value = '42'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(42)
    })

    it('Escape clears value when clearable', async () => {
      const el = await createNumber({value: 42, clearable: true})
      const input = getInput(el)
      let cleared = false

      el.addEventListener('cv-clear', () => {
        cleared = true
      })

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(0)
      expect(cleared).toBe(true)
    })

    it('ArrowUp dispatches cv-change event', async () => {
      const el = await createNumber({value: 5, step: 1})
      const changes: Array<{value: number}> = []

      el.addEventListener('cv-change', (e) => {
        changes.push((e as CustomEvent<{value: number}>).detail)
      })

      getInput(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)

      expect(changes.length).toBe(1)
      expect(changes[0]).toEqual({value: 6})
    })
  })

  // ---------------------------------------------------------------------------
  // Disabled state blocks interaction
  // ---------------------------------------------------------------------------

  describe('disabled state blocks interaction', () => {
    it('disabled blocks stepper increment click', async () => {
      const el = await createNumber({value: 5, stepper: true, disabled: true})
      let changeCount = 0
      el.addEventListener('cv-change', () => changeCount++)

      getIncrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe(5)
      expect(changeCount).toBe(0)
    })

    it('disabled blocks stepper decrement click', async () => {
      const el = await createNumber({value: 5, stepper: true, disabled: true})
      let changeCount = 0
      el.addEventListener('cv-change', () => changeCount++)

      getDecrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe(5)
      expect(changeCount).toBe(0)
    })

    it('disabled blocks keyboard ArrowUp/Down', async () => {
      const el = await createNumber({value: 5, disabled: true})
      const input = getInput(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)
      expect(el.value).toBe(5)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)
      expect(el.value).toBe(5)
    })

    it('disabled blocks clear button click', async () => {
      const el = await createNumber({value: 10, clearable: true, disabled: true})
      let clearCount = 0
      el.addEventListener('cv-clear', () => clearCount++)

      const clearBtn = getClearButton(el)
      if (clearBtn) {
        clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
        await settle(el)
      }

      expect(el.value).toBe(10)
      expect(clearCount).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Read-only state blocks interaction
  // ---------------------------------------------------------------------------

  describe('read-only state blocks interaction', () => {
    it('readOnly blocks stepper increment click', async () => {
      const el = await createNumber({value: 5, stepper: true, readOnly: true})
      let changeCount = 0
      el.addEventListener('cv-change', () => changeCount++)

      getIncrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe(5)
      expect(changeCount).toBe(0)
    })

    it('readOnly blocks keyboard ArrowUp/Down', async () => {
      const el = await createNumber({value: 5, readOnly: true})
      const input = getInput(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)
      expect(el.value).toBe(5)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)
      expect(el.value).toBe(5)
    })

    it('readOnly blocks text input editing', async () => {
      const el = await createNumber({value: 5, readOnly: true})
      const input = getInput(el)

      input.value = '99'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(5)
    })

    it('readOnly rejected text does not stay visible (display resyncs via live binding)', async () => {
      const el = await createNumber({value: 5, readOnly: true})
      const input = getInput(el)

      input.value = '99'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(el)

      // The model ignores the typed value while read-only; the visible input
      // must snap back to the committed value rather than keep the typed text.
      expect(el.value).toBe(5)
      expect(input.value).toBe('5')
    })

    it('reflects native disabled attribute on the inner input', async () => {
      const el = await createNumber({value: 5, disabled: true})
      expect(getInput(el).hasAttribute('disabled')).toBe(true)
    })

    it('reflects native readonly attribute on the inner input', async () => {
      const el = await createNumber({value: 5, readOnly: true})
      expect(getInput(el).hasAttribute('readonly')).toBe(true)
      expect(getInput(el).hasAttribute('disabled')).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Sizes
  // ---------------------------------------------------------------------------

  describe('sizes', () => {
    it('reflects size="small" on the host', async () => {
      const el = await createNumber({size: 'small'})
      expect(el.getAttribute('size')).toBe('small')
    })

    it('reflects size="medium" on the host (default)', async () => {
      const el = await createNumber()
      expect(el.getAttribute('size')).toBe('medium')
    })

    it('reflects size="large" on the host', async () => {
      const el = await createNumber({size: 'large'})
      expect(el.getAttribute('size')).toBe('large')
    })

    it('updates size attribute dynamically', async () => {
      const el = await createNumber({size: 'small'})
      expect(el.getAttribute('size')).toBe('small')

      el.size = 'large'
      await settle(el)
      expect(el.getAttribute('size')).toBe('large')
    })
  })

  // ---------------------------------------------------------------------------
  // Variants
  // ---------------------------------------------------------------------------

  describe('variants', () => {
    it('reflects variant="outlined" on the host (default)', async () => {
      const el = await createNumber()
      expect(el.getAttribute('variant')).toBe('outlined')
    })

    it('reflects variant="filled" on the host', async () => {
      const el = await createNumber({variant: 'filled'})
      expect(el.getAttribute('variant')).toBe('filled')
    })

    it('updates variant attribute dynamically', async () => {
      const el = await createNumber({variant: 'outlined'})
      expect(el.getAttribute('variant')).toBe('outlined')

      el.variant = 'filled'
      await settle(el)
      expect(el.getAttribute('variant')).toBe('filled')
    })
  })

  // ---------------------------------------------------------------------------
  // Visual state host attributes
  // ---------------------------------------------------------------------------

  describe('visual state host attributes', () => {
    it('sets [focused] attribute when input is focused', async () => {
      const el = await createNumber()

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      expect(el.hasAttribute('focused')).toBe(true)
    })

    it('removes [focused] attribute when input is blurred', async () => {
      const el = await createNumber()

      getInput(el).dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      expect(el.hasAttribute('focused')).toBe(true)

      getInput(el).dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)
      expect(el.hasAttribute('focused')).toBe(false)
    })

    it('sets [filled] attribute when value differs from default', async () => {
      const el = await createNumber({value: 42})
      expect(el.hasAttribute('filled')).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Draft text behavior
  // ---------------------------------------------------------------------------

  describe('draft text', () => {
    it('typing in input updates the displayed text without committing', async () => {
      const el = await createNumber({value: 5})
      const input = getInput(el)

      input.value = '12'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(el)

      // Value should not be committed yet
      expect(el.value).toBe(5)
      // But the input should show the draft text
      expect(input.value).toBe('12')
    })

    it('blur commits draft text and updates value', async () => {
      const el = await createNumber({value: 5})
      const input = getInput(el)

      input.value = '20'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(el)

      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(el.value).toBe(20)
    })

    it('Enter commits draft text and updates value', async () => {
      const el = await createNumber({value: 5})
      const input = getInput(el)

      input.value = '30'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(30)
    })

    it('when no draft, input displays formatted value', async () => {
      const el = await createNumber({value: 42})
      const input = getInput(el)

      // No draft active — should display the formatted value
      expect(input.value).toBe('42')
    })
  })

  // ---------------------------------------------------------------------------
  // Model rebuild preserves in-flight draft and focus
  // ---------------------------------------------------------------------------

  describe('model rebuild preserves transient state', () => {
    it('keeps the in-flight draft text when an immutable option (max) changes mid-edit', async () => {
      const el = await createNumber({value: 5, max: 100})
      const input = getInput(el)

      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      input.value = '12'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(el)
      expect(input.value).toBe('12')

      // Changing max recreates the headless model — the draft must survive.
      el.max = 200
      await settle(el)

      expect(input.value).toBe('12')
      expect(el.value).toBe(5)
    })

    it('keeps the focus ring (focused attribute) when an immutable option changes while focused', async () => {
      const el = await createNumber({value: 5, min: 0})
      const input = getInput(el)

      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      expect(el.hasAttribute('focused')).toBe(true)

      el.min = 1
      await settle(el)

      expect(el.hasAttribute('focused')).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // defaultValue normalization (clear button visibility)
  // ---------------------------------------------------------------------------

  describe('defaultValue normalization', () => {
    it('clear button hides after clearing when defaultValue is below min', async () => {
      // min=5, defaultValue=0 -> normalized default is 5. After clearing,
      // value equals the normalized default so the clear button must hide.
      const el = await createNumber({value: 12, min: 5, defaultValue: 0, clearable: true})
      const clearBtn = getClearButton(el)
      expect(clearBtn.hasAttribute('hidden')).toBe(false)

      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe(5)
      expect(clearBtn.hasAttribute('hidden')).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Keydown modifiers / defaultPrevented
  // ---------------------------------------------------------------------------

  describe('keydown modifier and defaultPrevented handling', () => {
    it('ignores ArrowUp when a modifier key is held (browser/OS shortcut)', async () => {
      const el = await createNumber({value: 5, step: 1})

      getInput(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', ctrlKey: true, bubbles: true}))
      await settle(el)

      expect(el.value).toBe(5)
    })

    it('ignores a keydown that was already defaultPrevented upstream', async () => {
      const el = await createNumber({value: 5, step: 1})
      const event = new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true, cancelable: true})
      event.preventDefault()

      getInput(el).dispatchEvent(event)
      await settle(el)

      expect(el.value).toBe(5)
    })
  })

  // ---------------------------------------------------------------------------
  // Value normalization corner cases
  // ---------------------------------------------------------------------------

  describe('value normalization corner cases', () => {
    it('removing the value attribute keeps the previous committed value (no crash)', async () => {
      const el = await createNumber({value: 7})

      el.setAttribute('value', '12')
      await settle(el)
      expect(el.value).toBe(12)

      el.removeAttribute('value')
      await settle(el)
      expect(el.value).toBe(12)
    })

    it('ignores a programmatic NaN value and restores the previous value', async () => {
      const el = await createNumber({value: 7})

      el.value = NaN
      await settle(el)

      expect(el.value).toBe(7)
      expect(getInput(el).getAttribute('aria-valuenow')).toBe('7')
    })

    it('swaps min and max when min > max', async () => {
      const el = await createNumber({value: 5, min: 10, max: 0})
      const input = getInput(el)

      expect(input.getAttribute('aria-valuemin')).toBe('0')
      expect(input.getAttribute('aria-valuemax')).toBe('10')
    })

    it('sanitizes non-positive step to the default of 1', async () => {
      const el = await createNumber({value: 5, step: -5})

      getInput(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(6)
    })

    it('snaps a fractional initial value to the step grid', async () => {
      const el = await createNumber({value: 5.4, step: 1})
      expect(el.value).toBe(5)
    })
  })

  // ---------------------------------------------------------------------------
  // Boundary and no-op event behavior
  // ---------------------------------------------------------------------------

  describe('boundary and no-op event behavior', () => {
    it('ArrowUp at max does not dispatch cv-change', async () => {
      const el = await createNumber({value: 10, max: 10, step: 1})
      let changeCount = 0
      el.addEventListener('cv-change', () => changeCount++)

      getInput(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(10)
      expect(changeCount).toBe(0)
    })

    it('Home does nothing when min is not defined', async () => {
      const el = await createNumber({value: 50})
      let changeCount = 0
      el.addEventListener('cv-change', () => changeCount++)

      getInput(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(50)
      expect(changeCount).toBe(0)
    })

    it('Escape does nothing and is not prevented when not clearable', async () => {
      const el = await createNumber({value: 42})
      let clearCount = 0
      el.addEventListener('cv-clear', () => clearCount++)

      const event = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true})
      getInput(el).dispatchEvent(event)
      await settle(el)

      expect(el.value).toBe(42)
      expect(clearCount).toBe(0)
      expect(event.defaultPrevented).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Imperative numeric API
  // ---------------------------------------------------------------------------

  describe('imperative numeric API', () => {
    it('supports step/page methods and set/get value without emitting cv-change', async () => {
      const el = await createNumber({value: 10, step: 2, largeStep: 20})
      let changeCount = 0

      el.addEventListener('cv-change', () => changeCount++)

      el.stepUp(2)
      el.stepDown()
      el.pageUp()
      el.pageDown(2)
      el.setValue(7)
      await settle(el)

      expect(el.getValue()).toBe(8)
      expect(el.value).toBe(8)
      expect(changeCount).toBe(0)
    })

    it('supports setRange and updates bounded stepper behavior', async () => {
      const el = await createNumber({value: 10, stepper: true})

      el.setRange(0, 10)
      await settle(el)

      expect(getInput(el).getAttribute('aria-valuemin')).toBe('0')
      expect(getInput(el).getAttribute('aria-valuemax')).toBe('10')
      expect(getIncrement(el).getAttribute('aria-disabled')).toBe('true')
      expect(getDecrement(el).getAttribute('aria-disabled')).toBeNull()
    })

    it('accepts null setRange bounds as unbounded migration inputs', async () => {
      const el = await createNumber({value: 10, min: 0, max: 10, stepper: true})

      el.setRange(null, null)
      await settle(el)

      expect(getInput(el).hasAttribute('aria-valuemin')).toBe(false)
      expect(getInput(el).hasAttribute('aria-valuemax')).toBe(false)
      expect(getIncrement(el).getAttribute('aria-disabled')).toBeNull()
      expect(getDecrement(el).getAttribute('aria-disabled')).toBeNull()
    })

    it('focus/select target the inner input element', async () => {
      const el = await createNumber({value: 123})

      el.focus()
      el.select()
      await settle(el)

      const isHostFocused = document.activeElement === el
      const isInputFocused = el.shadowRoot?.activeElement === getInput(el)
      expect(isHostFocused || isInputFocused).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Draft text corner cases
  // ---------------------------------------------------------------------------

  describe('draft text corner cases', () => {
    it('invalid draft text reverts on blur without cv-change and resets the display', async () => {
      const el = await createNumber({value: 5})
      const input = getInput(el)
      let changeCount = 0
      el.addEventListener('cv-change', () => changeCount++)

      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      input.value = 'abc'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(el)

      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(el.value).toBe(5)
      expect(changeCount).toBe(0)
      expect(input.value).toBe('5')
    })

    it('committing an emptied input clears to the default value and fires cv-clear', async () => {
      const el = await createNumber({value: 5})
      const input = getInput(el)
      let clearCount = 0
      el.addEventListener('cv-clear', () => clearCount++)

      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      input.value = ''
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(el)

      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(el.value).toBe(0)
      expect(clearCount).toBe(1)
    })
  })

  // ---------------------------------------------------------------------------
  // Form association lifecycle
  // ---------------------------------------------------------------------------

  describe('form association lifecycle', () => {
    it('supports checkValidity/reportValidity/setCustomValidity APIs', async () => {
      const el = await createNumber({value: 3, name: 'qty'})
      expect(typeof el.checkValidity).toBe('function')
      expect(typeof el.reportValidity).toBe('function')
      expect(typeof el.setCustomValidity).toBe('function')

      el.setCustomValidity('Bad value')
      expect(el.checkValidity()).toBe(false)

      el.setCustomValidity('')
      expect(el.checkValidity()).toBe(true)
    })

    it('formResetCallback restores the value captured at first connect', async () => {
      const el = await createNumber({value: 9, defaultValue: 3})

      el.setValue(12)
      await settle(el)
      expect(el.value).toBe(12)

      el.formResetCallback()
      await settle(el)

      expect(el.value).toBe(9)
    })

    it('formResetCallback restores the initial value even when disabled', async () => {
      const el = await createNumber({value: 4})

      el.setValue(9)
      await settle(el)
      expect(el.value).toBe(9)

      el.disabled = true
      await settle(el)

      el.formResetCallback()
      await settle(el)

      expect(el.value).toBe(4)
    })

    it('formStateRestoreCallback restores a numeric string state', async () => {
      const el = await createNumber({value: 5})

      el.formStateRestoreCallback('17')
      await settle(el)

      expect(el.value).toBe(17)
    })

    it('formStateRestoreCallback restores state even when disabled', async () => {
      const el = await createNumber({value: 5})

      el.disabled = true
      await settle(el)

      el.formStateRestoreCallback('17')
      await settle(el)

      expect(el.value).toBe(17)
    })

    it('formStateRestoreCallback ignores a non-numeric string state', async () => {
      const el = await createNumber({value: 5})

      el.formStateRestoreCallback('not-a-number')
      await settle(el)

      expect(el.value).toBe(5)
    })
  })

  // ---------------------------------------------------------------------------
  // Headless contract delegation
  // ---------------------------------------------------------------------------

  describe('headless contract delegation', () => {
    it('input element receives ARIA attributes from headless getInputProps', async () => {
      const el = await createNumber({value: 7, min: 1, max: 9, required: true})
      const input = getInput(el)

      // These attributes should originate from contracts.getInputProps()
      expect(input.getAttribute('role')).toBe('spinbutton')
      expect(input.getAttribute('aria-valuenow')).toBe('7')
      expect(input.getAttribute('aria-valuemin')).toBe('1')
      expect(input.getAttribute('aria-valuemax')).toBe('9')
      expect(input.getAttribute('aria-required')).toBe('true')
      expect(input.hasAttribute('id')).toBe(true)
    })

    it('increment button receives attributes from headless getIncrementButtonProps', async () => {
      const el = await createNumber({value: 5, stepper: true})
      const inc = getIncrement(el)

      expect(inc.hasAttribute('id')).toBe(true)
      expect(inc.hasAttribute('tabindex')).toBe(true)
      expect(inc.hasAttribute('aria-label')).toBe(true)
    })

    it('decrement button receives attributes from headless getDecrementButtonProps', async () => {
      const el = await createNumber({value: 5, stepper: true})
      const dec = getDecrement(el)

      expect(dec.hasAttribute('id')).toBe(true)
      expect(dec.hasAttribute('tabindex')).toBe(true)
      expect(dec.hasAttribute('aria-label')).toBe(true)
    })

    it('clear button receives attributes from headless getClearButtonProps', async () => {
      const el = await createNumber({value: 5, clearable: true})
      const clearBtn = getClearButton(el)

      expect(clearBtn.getAttribute('role')).toBe('button')
      expect(clearBtn.hasAttribute('aria-label')).toBe(true)
      expect(clearBtn.hasAttribute('tabindex')).toBe(true)
    })

    it('disabled state propagates through headless to ARIA on input', async () => {
      const el = await createNumber({disabled: true})
      const input = getInput(el)

      expect(input.getAttribute('aria-disabled')).toBe('true')
    })

    it('readOnly state propagates through headless to ARIA on input', async () => {
      const el = await createNumber({readOnly: true})
      const input = getInput(el)

      expect(input.getAttribute('aria-readonly')).toBe('true')
    })
  })
})
