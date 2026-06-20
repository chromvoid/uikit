import {afterEach, describe, expect, it} from 'vitest'

import {
  CVTimePicker,
  type CVTimePickerChangeEventDetail,
  type CVTimePickerInputEventDetail,
} from './cv-time-picker'
import {
  createTimePickerModel,
  isValidTimeValue,
  minutesToTime,
  normalizeMinuteStep,
  timeToMinutes,
} from './cv-time-picker.model'

CVTimePicker.define()

const supportsFormAssociated =
  typeof HTMLElement !== 'undefined' && 'attachInternals' in HTMLElement.prototype

const settle = async (element: CVTimePicker) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createTimePicker = async (attrs?: Partial<CVTimePicker>) => {
  const element = document.createElement('cv-time-picker') as CVTimePicker
  if (attrs) Object.assign(element, attrs)
  document.body.append(element)
  await settle(element)
  return element
}

const getInput = (element: CVTimePicker) =>
  element.shadowRoot!.querySelector('[part="input"]') as HTMLInputElement
const getIncrement = (element: CVTimePicker) =>
  element.shadowRoot!.querySelectorAll('[part="step-button"]')[0] as HTMLButtonElement
const getDecrement = (element: CVTimePicker) =>
  element.shadowRoot!.querySelectorAll('[part="step-button"]')[1] as HTMLButtonElement
const getClear = (element: CVTimePicker) =>
  element.shadowRoot!.querySelector('[part="clear-button"]') as HTMLButtonElement

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-time-picker model', () => {
  it('parses, formats, and normalizes time values', () => {
    expect(isValidTimeValue('09:30')).toBe(true)
    expect(isValidTimeValue('24:00')).toBe(false)
    expect(timeToMinutes('01:15')).toBe(75)
    expect(minutesToTime(24 * 60 + 5)).toBe('00:05')
    expect(normalizeMinuteStep(Number.NaN)).toBe(1)
    expect(normalizeMinuteStep(90)).toBe(60)
  })

  it('commits with step snapping and range clamping', () => {
    const model = createTimePickerModel('testTimePicker')
    model.actions.setConfig({value: '08:00', min: '09:00', max: '18:00', minuteStep: 15})
    model.actions.setInput('09:08', 'input')

    const change = model.actions.commit('input')

    expect(change.value).toBe('09:15')
    expect(change.previousValue).toBe('08:00')
    expect(model.actions.step(-1).value).toBe('09:00')
  })

  it('accepts digit-only drafts and commits complete shorthand input', () => {
    const model = createTimePickerModel('testTimePickerDigits')

    const partial = model.actions.setInput('42', 'input')
    expect(partial.invalid).toBe(false)
    expect(model.actions.commit('input')).toEqual({
      value: '',
      inputValue: '42',
      invalid: false,
      source: 'input',
      previousValue: '',
    })

    model.actions.setInput('942', 'input')
    expect(model.actions.commit('input').value).toBe('09:42')

    model.actions.setInput('2360', 'input')
    expect(model.state.invalid()).toBe(true)
  })
})

describe('cv-time-picker', () => {
  it('renders input, step controls, and default state', async () => {
    const element = await createTimePicker()

    expect(getInput(element)).not.toBeNull()
    expect(getIncrement(element)).not.toBeNull()
    expect(getDecrement(element)).not.toBeNull()
    expect(getClear(element)).not.toBeNull()
    expect(element.value).toBe('')
    expect(element.minuteStep).toBe(1)
    expect(element.hourCycle).toBe(24)
    expect(element.inputInvalid).toBe(false)
    expect(element.hasValue).toBe(false)
  })

  it('emits input on raw user input and change on commit', async () => {
    const element = await createTimePicker()
    const inputDetails: CVTimePickerInputEventDetail[] = []
    const changeDetails: CVTimePickerChangeEventDetail[] = []
    element.addEventListener('cv-input', (event) => {
      inputDetails.push((event as CustomEvent<CVTimePickerInputEventDetail>).detail)
    })
    element.addEventListener('cv-change', (event) => {
      changeDetails.push((event as CustomEvent<CVTimePickerChangeEventDetail>).detail)
    })

    const input = getInput(element)
    input.value = '09:30'
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
    await settle(element)

    expect(inputDetails[0]).toEqual({value: '', inputValue: '09:30', invalid: false, source: 'input'})
    expect(changeDetails).toEqual([{value: '09:30', previousValue: '', source: 'input'}])
    expect(element.value).toBe('09:30')
    expect(element.hasValue).toBe(true)
  })

  it('keeps short digit drafts valid and commits complete digit shorthand', async () => {
    const element = await createTimePicker()
    const inputDetails: CVTimePickerInputEventDetail[] = []
    element.addEventListener('cv-input', (event) => {
      inputDetails.push((event as CustomEvent<CVTimePickerInputEventDetail>).detail)
    })

    const input = getInput(element)
    input.value = '42'
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
    await settle(element)

    expect(element.inputInvalid).toBe(false)
    expect(inputDetails.at(-1)).toEqual({value: '', inputValue: '42', invalid: false, source: 'input'})

    input.value = '0942'
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
    input.dispatchEvent(new Event('change', {bubbles: true, composed: true}))
    await settle(element)

    expect(element.inputInvalid).toBe(false)
    expect(element.value).toBe('09:42')
    expect(getInput(element).value).toBe('09:42')
  })

  it('does not emit user events for programmatic value changes', async () => {
    const element = await createTimePicker()
    let inputCount = 0
    let changeCount = 0
    element.addEventListener('cv-input', () => inputCount++)
    element.addEventListener('cv-change', () => changeCount++)

    element.value = '10:00'
    await settle(element)

    expect(getInput(element).value).toBe('10:00')
    expect(inputCount).toBe(0)
    expect(changeCount).toBe(0)
  })

  it('steps, clamps, and clears through user controls', async () => {
    const element = await createTimePicker({value: '09:55', min: '09:00', max: '10:00', minuteStep: 10})
    const changeDetails: CVTimePickerChangeEventDetail[] = []
    element.addEventListener('cv-change', (event) => {
      changeDetails.push((event as CustomEvent<CVTimePickerChangeEventDetail>).detail)
    })

    getIncrement(element).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(element)
    expect(element.value).toBe('10:00')

    getDecrement(element).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(element)
    expect(element.value).toBe('09:50')

    getClear(element).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(element)
    expect(element.value).toBe('')
    expect(changeDetails.at(-1)).toEqual({value: '', previousValue: '09:50', source: 'clear'})
  })

  it('marks invalid draft input and avoids committing it', async () => {
    const element = await createTimePicker({value: '09:00'})
    let changeCount = 0
    element.addEventListener('cv-change', () => changeCount++)

    const input = getInput(element)
    input.value = '25:00'
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
    input.dispatchEvent(new Event('change', {bubbles: true, composed: true}))
    await settle(element)

    expect(element.value).toBe('09:00')
    expect(element.inputInvalid).toBe(true)
    expect(changeCount).toBe(0)
  })

  it('respects disabled and readonly interaction guards', async () => {
    const disabled = await createTimePicker({value: '09:00', disabled: true})
    getIncrement(disabled).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(disabled)
    expect(disabled.value).toBe('09:00')
    expect(getInput(disabled).disabled).toBe(true)

    const readonly = await createTimePicker({value: '09:00', readonly: true})
    getDecrement(readonly).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(readonly)
    expect(readonly.value).toBe('09:00')
    expect(getInput(readonly).readOnly).toBe(true)
  })

  it('resets to the captured default value through form reset callback', async () => {
    if (!supportsFormAssociated) return

    const element = await createTimePicker({value: '08:00'})
    element.value = '09:30'
    await settle(element)

    element.formResetCallback()
    await settle(element)

    expect(element.value).toBe('08:00')
  })

  it('exposes required validity through form-associated APIs', async () => {
    const element = await createTimePicker({required: true})

    expect(element.checkValidity()).toBe(false)
    expect(element.validationMessage).toBe('Please fill out this field.')

    element.value = '10:00'
    await settle(element)
    expect(element.checkValidity()).toBe(true)
  })
})
