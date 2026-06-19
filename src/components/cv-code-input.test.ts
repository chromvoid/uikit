import {afterEach, describe, expect, it} from 'vitest'

import {CVCodeInput, type CVCodeInputCompleteEvent, type CVCodeInputInputEvent} from './cv-code-input'

CVCodeInput.define()

const settle = async (element: CVCodeInput) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createCodeInput = async (attrs?: Partial<CVCodeInput>) => {
  const element = document.createElement('cv-code-input') as CVCodeInput
  if (attrs) {
    Object.assign(element, attrs)
  }
  document.body.append(element)
  await settle(element)
  return element
}

const getInputs = (element: CVCodeInput) =>
  Array.from(element.shadowRoot!.querySelectorAll('[part="input"]')) as HTMLInputElement[]

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-code-input', () => {
  it('renders one native input per code character', async () => {
    const element = await createCodeInput({length: 4})
    const inputs = getInputs(element)

    expect(inputs).toHaveLength(4)
    expect(inputs[0]!.getAttribute('inputmode')).toBe('numeric')
    expect(inputs[0]!.getAttribute('autocomplete')).toBe('one-time-code')
    expect(inputs[1]!.getAttribute('autocomplete')).toBe('off')
  })

  it('syncs typed characters into the composite value and emits input/complete events', async () => {
    const element = await createCodeInput({length: 2})
    const inputEvents: Array<CVCodeInputInputEvent['detail']> = []
    const completeEvents: Array<CVCodeInputCompleteEvent['detail']> = []

    element.addEventListener('cv-input', (event) => {
      inputEvents.push((event as CVCodeInputInputEvent).detail)
    })
    element.addEventListener('cv-complete', (event) => {
      completeEvents.push((event as CVCodeInputCompleteEvent).detail)
    })

    const [first, second] = getInputs(element)
    first!.value = '1'
    first!.dispatchEvent(new InputEvent('input', {bubbles: true, data: '1'}))
    await settle(element)

    second!.value = '2'
    second!.dispatchEvent(new InputEvent('input', {bubbles: true, data: '2'}))
    await settle(element)

    expect(element.value).toBe('12')
    expect(inputEvents.map((event) => event.value)).toEqual(['1', '12'])
    expect(completeEvents).toEqual([{value: '12', complete: true}])
  })

  it('sets aria-invalid and fails validity when marked invalid', async () => {
    const element = await createCodeInput({invalid: true})

    expect(getInputs(element)[0]!.getAttribute('aria-invalid')).toBe('true')
    expect(element.checkValidity()).toBe(false)
  })
})
