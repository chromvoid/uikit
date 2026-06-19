import {afterEach, describe, expect, it} from 'vitest'

import {CVDatePicker} from './cv-date-picker'
import {CVDateTimePicker} from './cv-date-time-picker'

CVDatePicker.define()
CVDateTimePicker.define()

const settle = async (element: CVDateTimePicker) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-date-time-picker', () => {
  it('reuses cv-date-picker behavior under the date-time tag', async () => {
    const element = document.createElement('cv-date-time-picker') as CVDateTimePicker
    element.value = '2026-01-10T12:30'
    document.body.append(element)
    await settle(element)

    expect(element).toBeInstanceOf(CVDatePicker)
    expect(element).toBeInstanceOf(CVDateTimePicker)
    expect(element.shadowRoot!.querySelector('[part="input"]')).not.toBeNull()
    expect(element.value).toBe('2026-01-10T12:30')
  })

  it('opens from an initial open property under the date-time tag', async () => {
    const element = document.createElement('cv-date-time-picker') as CVDateTimePicker
    element.open = true
    document.body.append(element)
    await settle(element)

    const input = element.shadowRoot!.querySelector('[part="input"]') as HTMLInputElement
    const dialog = element.shadowRoot!.querySelector('[part="dialog"]') as HTMLElement

    expect(element.open).toBe(true)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(dialog.hidden).toBe(false)
  })

  it('registers date and date-time tags independently', () => {
    expect(customElements.get('cv-date-picker')).toBe(CVDatePicker)
    expect(customElements.get('cv-date-time-picker')).toBe(CVDateTimePicker)
  })
})
