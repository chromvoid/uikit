import type {SpinbuttonModel} from '@chromvoid/headless-ui'
import {afterEach, describe, expect, it} from 'vitest'

import {CVSpinbutton} from './cv-spinbutton'

CVSpinbutton.define()

const supportsFormAssociated =
  typeof HTMLElement !== 'undefined' && 'attachInternals' in HTMLElement.prototype

const settle = async (element: CVSpinbutton) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createSpinbutton = async (attrs?: Partial<CVSpinbutton>) => {
  const el = document.createElement('cv-spinbutton') as CVSpinbutton
  if (attrs) Object.assign(el, attrs)
  document.body.append(el)
  await settle(el)
  return el
}

const getBase = (el: CVSpinbutton) => el.shadowRoot!.querySelector('[part="base"]') as HTMLElement
const getInput = (el: CVSpinbutton) => el.shadowRoot!.querySelector('[part="input"]') as HTMLInputElement
const getActions = (el: CVSpinbutton) => el.shadowRoot!.querySelector('[part="actions"]') as HTMLElement
const getIncrement = (el: CVSpinbutton) =>
  el.shadowRoot!.querySelector('[part="increment"]') as HTMLButtonElement
const getDecrement = (el: CVSpinbutton) =>
  el.shadowRoot!.querySelector('[part="decrement"]') as HTMLButtonElement
const getModel = (el: CVSpinbutton): SpinbuttonModel => (el as unknown as {model: SpinbuttonModel}).model

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-spinbutton', () => {
  describe('shadow DOM structure', () => {
    it('renders base, input and action controls', async () => {
      const el = await createSpinbutton()
      expect(getBase(el)).not.toBeNull()
      expect(getInput(el)).not.toBeNull()
      expect(getActions(el)).not.toBeNull()
      expect(getIncrement(el)).not.toBeNull()
      expect(getDecrement(el)).not.toBeNull()
    })
  })

  describe('default property values', () => {
    it('exposes documented defaults', async () => {
      const el = await createSpinbutton()
      expect(el.name).toBe('')
      expect(el.value).toBe(0)
      expect(el.min).toBeNull()
      expect(el.max).toBeNull()
      expect(el.step).toBe(1)
      expect(el.largeStep).toBe(10)
      expect(el.disabled).toBe(false)
      expect(el.readOnly).toBe(false)
      expect(el.required).toBe(false)
      expect(getInput(el).getAttribute('inputmode')).toBe('decimal')
    })
  })

  describe('attribute reflection', () => {
    it('reflects number, boolean and string attributes', async () => {
      const el = await createSpinbutton({
        name: 'qty',
        value: 4,
        min: 0,
        max: 10,
        step: 2,
        largeStep: 8,
        disabled: true,
        readOnly: true,
        required: true,
      })

      expect(el.getAttribute('name')).toBe('qty')
      expect(el.getAttribute('value')).toBe('4')
      expect(el.getAttribute('min')).toBe('0')
      expect(el.getAttribute('max')).toBe('10')
      expect(el.getAttribute('step')).toBe('2')
      expect(el.getAttribute('large-step')).toBe('8')
      expect(el.hasAttribute('disabled')).toBe(true)
      expect(el.hasAttribute('read-only')).toBe(true)
      expect(el.hasAttribute('required')).toBe(true)
    })
  })

  describe('ARIA', () => {
    it('applies spinbutton role and range attrs to input', async () => {
      const el = await createSpinbutton({value: 3, min: 1, max: 9})
      const input = getInput(el)

      expect(input.getAttribute('role')).toBe('spinbutton')
      expect(input.getAttribute('aria-valuenow')).toBe('3')
      expect(input.getAttribute('aria-valuemin')).toBe('1')
      expect(input.getAttribute('aria-valuemax')).toBe('9')
    })

    it('marks readOnly and disabled semantics', async () => {
      const disabled = await createSpinbutton({disabled: true})
      expect(getInput(disabled).getAttribute('aria-disabled')).toBe('true')
      expect(getInput(disabled).disabled).toBe(true)

      const readOnly = await createSpinbutton({readOnly: true})
      expect(getInput(readOnly).getAttribute('aria-readonly')).toBe('true')
      expect(getInput(readOnly).readOnly).toBe(true)
    })
  })

  describe('events', () => {
    it('dispatches input/change pair for user increment', async () => {
      const el = await createSpinbutton({value: 1, min: 0, max: 10, step: 2})
      const inputDetails: Array<{value: number}> = []
      const changeDetails: Array<{value: number}> = []

      el.addEventListener('cv-input', (event) => {
        inputDetails.push((event as unknown as CustomEvent<{value: number}>).detail)
      })
      el.addEventListener('cv-change', (event) => {
        changeDetails.push((event as unknown as CustomEvent<{value: number}>).detail)
      })

      getIncrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(inputDetails).toEqual([{value: 4}])
      expect(changeDetails).toEqual([{value: 4}])
    })

    it('does not emit input/change for imperative API', async () => {
      const el = await createSpinbutton({value: 1})
      let inputCount = 0
      let changeCount = 0

      el.addEventListener('cv-input', () => inputCount++)
      el.addEventListener('cv-change', () => changeCount++)

      el.stepUp()
      await settle(el)

      expect(el.value).toBe(2)
      expect(inputCount).toBe(0)
      expect(changeCount).toBe(0)
    })
  })

  describe('behavior', () => {
    it('commits manual input on Enter with clamp+snap', async () => {
      const el = await createSpinbutton({value: 4, min: 0, max: 10, step: 2})
      const input = getInput(el)

      input.value = '7.4'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(8)
      expect(input.value).toBe('8')
    })

    it('commits manual input on blur', async () => {
      const el = await createSpinbutton({value: 0, step: 1})
      const input = getInput(el)

      input.value = '5'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(el.value).toBe(5)
    })

    it('does not commit on each raw input keystroke', async () => {
      const el = await createSpinbutton({value: 3})
      const input = getInput(el)

      input.value = '9'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe(3)
    })

    it('disables buttons only at actual range bounds', async () => {
      const atMax = await createSpinbutton({value: 10, min: 0, max: 10})
      expect(getIncrement(atMax).disabled).toBe(true)
      expect(getDecrement(atMax).disabled).toBe(false)

      const atMin = await createSpinbutton({value: 0, min: 0, max: 10})
      expect(getIncrement(atMin).disabled).toBe(false)
      expect(getDecrement(atMin).disabled).toBe(true)
    })

    it('supports truly unbounded values when min/max are absent', async () => {
      const el = await createSpinbutton({value: 1000, step: 5})
      getIncrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe(1005)
      expect(getIncrement(el).disabled).toBe(false)
      expect(getDecrement(el).disabled).toBe(false)
    })
  })

  describe('keyboard interaction', () => {
    it('steps with ArrowUp/ArrowDown and emits input/change', async () => {
      const el = await createSpinbutton({value: 4, min: 0, max: 10, step: 2})
      const input = getInput(el)
      const inputDetails: Array<{value: number}> = []
      const changeDetails: Array<{value: number}> = []

      el.addEventListener('cv-input', (event) => {
        inputDetails.push((event as unknown as CustomEvent<{value: number}>).detail)
      })
      el.addEventListener('cv-change', (event) => {
        changeDetails.push((event as unknown as CustomEvent<{value: number}>).detail)
      })

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)
      expect(el.value).toBe(6)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(2)
      expect(inputDetails).toEqual([{value: 6}, {value: 4}, {value: 2}])
      expect(changeDetails).toEqual([{value: 6}, {value: 4}, {value: 2}])
    })

    it('jumps with PageUp/PageDown using the large step', async () => {
      const el = await createSpinbutton({value: 50, min: 0, max: 100, largeStep: 25})
      const input = getInput(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageUp', bubbles: true}))
      await settle(el)
      expect(el.value).toBe(75)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(el)
      expect(el.value).toBe(25)
    })

    it('jumps to bounds with Home/End when min/max are set', async () => {
      const el = await createSpinbutton({value: 5, min: 1, max: 9})
      const input = getInput(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      await settle(el)
      expect(el.value).toBe(1)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      await settle(el)
      expect(el.value).toBe(9)
    })

    it('blocks keyboard stepping when readOnly without emitting events', async () => {
      const el = await createSpinbutton({value: 5, readOnly: true})
      const input = getInput(el)
      let inputCount = 0
      let changeCount = 0

      el.addEventListener('cv-input', () => inputCount++)
      el.addEventListener('cv-change', () => changeCount++)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(5)
      expect(inputCount).toBe(0)
      expect(changeCount).toBe(0)
    })
  })

  describe('range and parsing corner cases', () => {
    it('clamps at max without wrapping around', async () => {
      const el = await createSpinbutton({value: 10, min: 0, max: 10})
      let inputCount = 0
      el.addEventListener('cv-input', () => inputCount++)

      getIncrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      getInput(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(10)
      expect(inputCount).toBe(0)
    })

    it('normalizes a swapped min/max range', async () => {
      const el = await createSpinbutton({value: 5, min: 10, max: 0})
      const input = getInput(el)

      expect(input.getAttribute('aria-valuemin')).toBe('0')
      expect(input.getAttribute('aria-valuemax')).toBe('10')

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      await settle(el)
      expect(el.value).toBe(10)
    })

    it('avoids floating point drift with fractional steps', async () => {
      const el = await createSpinbutton({value: 0, step: 0.1})

      el.stepUp(3)
      await settle(el)

      expect(el.value).toBe(0.3)
      expect(getInput(el).getAttribute('aria-valuenow')).toBe('0.3')
    })

    it('commits exponent notation typed input', async () => {
      const el = await createSpinbutton({value: 0})
      const input = getInput(el)

      input.value = '1e2'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(100)
    })

    it('commits negative typed input', async () => {
      const el = await createSpinbutton({value: 0})
      const input = getInput(el)

      input.value = '-3'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(el.value).toBe(-3)
    })

    it('keeps prior value and stays silent for non-numeric text on blur', async () => {
      const el = await createSpinbutton({value: 5})
      const input = getInput(el)
      let inputCount = 0
      let changeCount = 0

      el.addEventListener('cv-input', () => inputCount++)
      el.addEventListener('cv-change', () => changeCount++)

      input.value = '12abc'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(el.value).toBe(5)
      expect(inputCount).toBe(0)
      expect(changeCount).toBe(0)
    })

    it('keeps prior value and stays silent for an emptied input on blur', async () => {
      const el = await createSpinbutton({value: 5})
      const input = getInput(el)
      let inputCount = 0

      el.addEventListener('cv-input', () => inputCount++)

      input.value = ''
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(el.value).toBe(5)
      expect(inputCount).toBe(0)
    })

    it('emits a single input/change pair when blur commits a new value', async () => {
      const el = await createSpinbutton({value: 0})
      const input = getInput(el)
      const inputDetails: Array<{value: number}> = []
      const changeDetails: Array<{value: number}> = []

      el.addEventListener('cv-input', (event) => {
        inputDetails.push((event as unknown as CustomEvent<{value: number}>).detail)
      })
      el.addEventListener('cv-change', (event) => {
        changeDetails.push((event as unknown as CustomEvent<{value: number}>).detail)
      })

      input.value = '7'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(inputDetails).toEqual([{value: 7}])
      expect(changeDetails).toEqual([{value: 7}])
    })

    it('ignores increment/decrement clicks when readOnly', async () => {
      const el = await createSpinbutton({value: 5, readOnly: true})

      getIncrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      getDecrement(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe(5)
    })
  })

  describe('imperative API', () => {
    it('supports step/page methods and set/get value', async () => {
      const el = await createSpinbutton({value: 10, step: 2, largeStep: 20})

      el.stepUp(2)
      el.stepDown()
      el.pageUp()
      el.pageDown(2)
      el.setValue(7)
      await settle(el)

      expect(el.getValue()).toBe(8)
    })

    it('supports setRange and updates bound behavior', async () => {
      const el = await createSpinbutton({value: 10})
      el.setRange(0, 10)
      await settle(el)

      expect(getIncrement(el).disabled).toBe(true)
      expect(getDecrement(el).disabled).toBe(false)
    })

    it('focus/select target the input element', async () => {
      const el = await createSpinbutton({value: 123})
      el.focus()
      el.select()
      await settle(el)

      const isHostFocused = document.activeElement === el
      const isInputFocused = el.shadowRoot?.activeElement === getInput(el)
      expect(isHostFocused || isInputFocused).toBe(true)
    })
  })

  describe('headless contract delegation', () => {
    it('spreads headless contract values on input/buttons', async () => {
      const el = await createSpinbutton({value: 7, min: 1, max: 9, step: 2, readOnly: true})
      const model = getModel(el)
      const spinbuttonProps = model.contracts.getSpinbuttonProps()
      const incrementProps = model.contracts.getIncrementButtonProps()
      const decrementProps = model.contracts.getDecrementButtonProps()
      const input = getInput(el)
      const increment = getIncrement(el)
      const decrement = getDecrement(el)

      expect(input.getAttribute('id')).toBe(spinbuttonProps.id)
      expect(input.getAttribute('role')).toBe(spinbuttonProps.role)
      expect(input.getAttribute('tabindex')).toBe(spinbuttonProps.tabindex)
      expect(input.getAttribute('aria-valuenow')).toBe(spinbuttonProps['aria-valuenow'])
      expect(input.getAttribute('aria-valuemin')).toBe(spinbuttonProps['aria-valuemin'])
      expect(input.getAttribute('aria-valuemax')).toBe(spinbuttonProps['aria-valuemax'])
      expect(input.getAttribute('aria-readonly')).toBe(spinbuttonProps['aria-readonly'])

      expect(increment.getAttribute('id')).toBe(incrementProps.id)
      expect(increment.getAttribute('tabindex')).toBe(incrementProps.tabindex)
      expect(increment.getAttribute('aria-label')).toBe(incrementProps['aria-label'])
      expect(increment.getAttribute('aria-disabled')).toBe(incrementProps['aria-disabled'])

      expect(decrement.getAttribute('id')).toBe(decrementProps.id)
      expect(decrement.getAttribute('tabindex')).toBe(decrementProps.tabindex)
      expect(decrement.getAttribute('aria-label')).toBe(decrementProps['aria-label'])
      expect(decrement.getAttribute('aria-disabled')).toBe(decrementProps['aria-disabled'])
    })
  })

  describe('form-associated integration', () => {
    it('supports checkValidity/reportValidity/setCustomValidity APIs', async () => {
      const el = await createSpinbutton({value: 3, name: 'qty'})
      expect(typeof el.checkValidity).toBe('function')
      expect(typeof el.reportValidity).toBe('function')
      expect(typeof el.setCustomValidity).toBe('function')

      el.setCustomValidity('Bad value')
      expect(el.checkValidity()).toBe(false)

      el.setCustomValidity('')
      expect(el.checkValidity()).toBe(true)
    })

    it('resets value to initial snapshot via reset callback when supported', async () => {
      if (!supportsFormAssociated) return

      const form = document.createElement('form')
      const el = document.createElement('cv-spinbutton') as CVSpinbutton
      el.value = 4
      form.append(el)
      document.body.append(form)
      await settle(el)

      el.setValue(9)
      await settle(el)
      expect(el.value).toBe(9)

      el.formResetCallback()
      await settle(el)
      expect(el.value).toBe(4)
    })

    it('restores the initial value on reset even when disabled', async () => {
      if (!supportsFormAssociated) return

      const form = document.createElement('form')
      const el = document.createElement('cv-spinbutton') as CVSpinbutton
      el.value = 4
      form.append(el)
      document.body.append(form)
      await settle(el)

      el.setValue(9)
      await settle(el)
      expect(el.value).toBe(9)

      el.disabled = true
      await settle(el)

      el.formResetCallback()
      await settle(el)
      // Native disabled inputs are still restored by a form reset; the model's
      // canMutate() gate must be bypassed for reset.
      expect(el.value).toBe(4)
    })

    it('restores form state even when disabled', async () => {
      if (!supportsFormAssociated) return

      const el = await createSpinbutton({value: 4})
      el.disabled = true
      await settle(el)

      el.formStateRestoreCallback('12')
      await settle(el)
      expect(el.value).toBe(12)
    })
  })

  describe('batch 9 regressions', () => {
    it('resyncs the displayed text after an invalid commit', async () => {
      const el = await createSpinbutton({value: 5})
      const input = getInput(el)

      input.value = 'abc'
      input.dispatchEvent(new Event('input', {bubbles: true}))
      await settle(el)

      input.dispatchEvent(new Event('blur', {bubbles: true}))
      await settle(el)

      // value/aria stay correct, and the visible text must snap back to it
      // rather than leaving the rejected "abc" in the field forever.
      expect(el.value).toBe(5)
      expect(input.value).toBe('5')
    })

    it('steps arrow keys from the typed draft, like native number inputs', async () => {
      const el = await createSpinbutton({value: 5, step: 1})
      const input = getInput(el)

      input.value = '70'
      input.dispatchEvent(new Event('input', {bubbles: true}))
      await settle(el)

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)

      expect(el.value).toBe(71)
    })
  })
})
