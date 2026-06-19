import {createDatePicker as createHeadlessDatePicker} from '@chromvoid/headless-ui'
import {afterEach, describe, expect, it} from 'vitest'

import {CVDatePicker} from './cv-date-picker'

CVDatePicker.define()

const stylesToText = () =>
  (CVDatePicker.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')

const settle = async (element: CVDatePicker) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createDatePicker = async (attrs?: Partial<CVDatePicker>) => {
  const element = document.createElement('cv-date-picker') as CVDatePicker
  if (attrs) {
    Object.assign(element, attrs)
  }
  document.body.append(element)
  await settle(element)
  return element
}

const getBase = (element: CVDatePicker) => element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

const getInput = (element: CVDatePicker) =>
  element.shadowRoot!.querySelector('[part="input"]') as HTMLInputElement

const getDialog = (element: CVDatePicker) =>
  element.shadowRoot!.querySelector('[part="dialog"]') as HTMLElement

const getCalendarGrid = (element: CVDatePicker) =>
  element.shadowRoot!.querySelector('[part="calendar-grid"]') as HTMLElement

const getCalendarDays = (element: CVDatePicker) =>
  Array.from(element.shadowRoot!.querySelectorAll('[part="calendar-day"]')) as HTMLButtonElement[]

const getApplyButton = (element: CVDatePicker) =>
  element.shadowRoot!.querySelector('[part="apply-button"]') as HTMLButtonElement

const getCancelButton = (element: CVDatePicker) =>
  element.shadowRoot!.querySelector('[part="cancel-button"]') as HTMLButtonElement

const getClearButton = (element: CVDatePicker) =>
  element.shadowRoot!.querySelector('[part="clear-button"]') as HTMLButtonElement

const dispatchKeyDown = (element: Element, key: string, init?: KeyboardEventInit) => {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      composed: true,
      ...init,
    }),
  )
}

const hasElementInternals =
  typeof (HTMLElement.prototype as {attachInternals?: unknown}).attachInternals === 'function'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-date-picker', () => {
  describe('style contract', () => {
    it('defines discrete display presence for dialog', () => {
      const cssText = stylesToText()

      expect(cssText).toMatch(/\[part='dialog'\][\s\S]*transition:[\s\S]*display[\s\S]*allow-discrete/)
      expect(cssText).toMatch(/transition-behavior:\s*allow-discrete/)
    })
  })

  describe('shadow DOM structure', () => {
    it('renders core parts', async () => {
      const datePicker = await createDatePicker()

      expect(getBase(datePicker)).not.toBeNull()
      expect(datePicker.shadowRoot!.querySelector('[part="input-wrap"]')).not.toBeNull()
      expect(getInput(datePicker)).not.toBeNull()
      expect(getDialog(datePicker)).not.toBeNull()
      expect(getCalendarGrid(datePicker)).not.toBeNull()
      expect(datePicker.shadowRoot!.querySelector('[part="hour-input"]')).not.toBeNull()
      expect(datePicker.shadowRoot!.querySelector('[part="minute-input"]')).not.toBeNull()
      expect(getApplyButton(datePicker)).not.toBeNull()
      expect(getCancelButton(datePicker)).not.toBeNull()
      expect(getClearButton(datePicker)).not.toBeNull()
    })
  })

  describe('default property values', () => {
    it('has expected defaults', async () => {
      const datePicker = await createDatePicker()

      expect(datePicker.value).toBe('')
      expect(datePicker.open).toBe(false)
      expect(datePicker.disabled).toBe(false)
      expect(datePicker.readonly).toBe(false)
      expect(datePicker.required).toBe(false)
      expect(datePicker.placeholder).toBe('Select date and time')
      expect(datePicker.size).toBe('medium')
      expect(datePicker.locale).toBe('en-US')
      expect(datePicker.timeZone).toBe('local')
      expect(datePicker.minuteStep).toBe(1)
      expect(datePicker.hourCycle).toBe(24)
      expect(datePicker.closeOnEscape).toBe(true)
      expect(datePicker.inputInvalid).toBe(false)
      expect(datePicker.hasValue).toBe(false)
    })
  })

  describe('attribute reflection', () => {
    it('reflects boolean and key string attributes', async () => {
      const datePicker = await createDatePicker({
        value: '2026-01-10T12:30',
        open: true,
        disabled: false,
        readonly: true,
        required: true,
        size: 'large',
        timeZone: 'utc',
        closeOnEscape: false,
      })

      expect(datePicker.getAttribute('value')).toBe('2026-01-10T12:30')
      expect(datePicker.open).toBe(true)
      expect(getInput(datePicker).getAttribute('aria-expanded')).toBe('true')
      expect(getDialog(datePicker).hidden).toBe(false)
      expect(datePicker.hasAttribute('disabled')).toBe(false)
      expect(datePicker.hasAttribute('readonly')).toBe(true)
      expect(datePicker.hasAttribute('required')).toBe(true)
      expect(datePicker.getAttribute('size')).toBe('large')
      expect(datePicker.getAttribute('time-zone')).toBe('utc')
      expect(datePicker.hasAttribute('close-on-escape')).toBe(false)
    })
  })

  describe('ARIA', () => {
    it('wires combobox + dialog roles and relationships', async () => {
      const datePicker = await createDatePicker()
      const input = getInput(datePicker)
      const dialog = getDialog(datePicker)
      const grid = getCalendarGrid(datePicker)

      expect(input.getAttribute('role')).toBe('combobox')
      expect(input.getAttribute('aria-haspopup')).toBe('dialog')
      expect(input.getAttribute('aria-expanded')).toBe('false')
      expect(input.getAttribute('aria-controls')).toBe(dialog.id)

      expect(dialog.getAttribute('role')).toBe('dialog')
      expect(dialog.getAttribute('aria-modal')).toBe('true')
      expect(dialog.hasAttribute('hidden')).toBe(true)

      expect(grid.getAttribute('role')).toBe('grid')
      expect(getCalendarDays(datePicker)).toHaveLength(42)
    })

    it('keeps ARIA constants aligned with headless contracts', async () => {
      const datePicker = await createDatePicker()
      const input = getInput(datePicker)
      const dialog = getDialog(datePicker)

      const headless = createHeadlessDatePicker()
      const inputProps = headless.contracts.getInputProps()
      const dialogProps = headless.contracts.getDialogProps()

      expect(input.getAttribute('role')).toBe(inputProps.role)
      expect(input.getAttribute('aria-haspopup')).toBe(inputProps['aria-haspopup'])
      expect(dialog.getAttribute('role')).toBe(dialogProps.role)
      expect(dialog.getAttribute('aria-modal')).toBe(dialogProps['aria-modal'])
    })
  })

  describe('events', () => {
    it('emits input with detail shape on text edit', async () => {
      const datePicker = await createDatePicker()
      let detail: Record<string, unknown> | null = null

      datePicker.addEventListener('cv-input', (event) => {
        if (!(event instanceof CustomEvent)) return
        detail = (event as unknown as CustomEvent<Record<string, unknown>>).detail
      })

      const input = getInput(datePicker)
      input.value = '2026-01-12T09:30'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      await settle(datePicker)

      expect(detail).not.toBeNull()
      const inputDetail = detail as unknown as Record<string, unknown>
      expect(inputDetail['inputValue']).toBe('2026-01-12T09:30')
      expect(typeof inputDetail['value']).toBe('string')
      expect(typeof inputDetail['open']).toBe('boolean')
      expect(typeof inputDetail['invalid']).toBe('boolean')
    })

    it('emits change with source=input on Enter commit', async () => {
      const datePicker = await createDatePicker()
      let detail: Record<string, unknown> | null = null

      datePicker.addEventListener('cv-change', (event) => {
        detail = (event as unknown as CustomEvent<Record<string, unknown>>).detail
      })

      const input = getInput(datePicker)
      input.value = '2026-01-12T09:30'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      dispatchKeyDown(input, 'Enter')
      await settle(datePicker)

      expect(detail).not.toBeNull()
      const changeDetail = detail as unknown as Record<string, unknown>
      expect(changeDetail['value']).toBe('2026-01-12T09:30')
      expect(changeDetail['source']).toBe('input')
      expect(typeof changeDetail['previousValue']).toBe('string')
    })
  })

  describe('behavior', () => {
    it('opens from an initial open property without user interaction', async () => {
      const datePicker = await createDatePicker({open: true})

      expect(datePicker.open).toBe(true)
      expect(getInput(datePicker).getAttribute('aria-expanded')).toBe('true')
      expect(getDialog(datePicker).hidden).toBe(false)
    })

    it('opens from input key and closes with Escape', async () => {
      const datePicker = await createDatePicker()
      const input = getInput(datePicker)

      dispatchKeyDown(input, 'ArrowDown')
      await settle(datePicker)
      expect(datePicker.open).toBe(true)

      dispatchKeyDown(getDialog(datePicker), 'Escape')
      await settle(datePicker)
      expect(datePicker.open).toBe(false)
    })

    it('commits draft from dialog Apply and emits source=dialog', async () => {
      const initialValue = '2026-01-01T00:00'
      const datePicker = await createDatePicker({value: initialValue})

      let detail: Record<string, unknown> | null = null
      datePicker.addEventListener('cv-change', (event) => {
        detail = (event as unknown as CustomEvent<Record<string, unknown>>).detail
      })

      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      const targetDay = getCalendarDays(datePicker).find(
        (button) => button.getAttribute('data-date') !== '2026-01-01',
      )
      targetDay?.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      getApplyButton(datePicker).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(datePicker)

      expect(datePicker.value).not.toBe(initialValue)
      expect(detail).not.toBeNull()
      const changeDetail = detail as unknown as Record<string, unknown>
      expect(changeDetail['source']).toBe('dialog')
      expect(typeof changeDetail['value']).toBe('string')
    })

    it('clears committed value through clear button', async () => {
      const datePicker = await createDatePicker({value: '2026-01-05T10:00'})

      expect(datePicker.hasValue).toBe(true)

      getClearButton(datePicker).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(datePicker)

      expect(datePicker.value).toBe('')
      expect(datePicker.hasValue).toBe(false)
    })
  })

  describe('disabled and readonly behavior', () => {
    it('does not open when disabled', async () => {
      const datePicker = await createDatePicker({disabled: true})

      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      expect(datePicker.open).toBe(false)
    })

    it('keeps committed value unchanged when readonly', async () => {
      const initialValue = '2026-01-01T00:00'
      const datePicker = await createDatePicker({readonly: true, value: initialValue})

      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      const day = getCalendarDays(datePicker).find(
        (button) => button.getAttribute('data-date') !== '2026-01-01',
      )
      day?.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      getApplyButton(datePicker).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(datePicker)

      expect(datePicker.value).toBe(initialValue)
    })
  })

  describe('date validation corner cases', () => {
    it('flags impossible calendar dates as invalid without committing', async () => {
      const datePicker = await createDatePicker()
      const input = getInput(datePicker)

      input.value = '2027-02-29T10:00' // 2027 is not a leap year
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      dispatchKeyDown(input, 'Enter')
      await settle(datePicker)

      expect(datePicker.value).toBe('')
      expect(datePicker.inputInvalid).toBe(true)
      expect(input.getAttribute('aria-invalid')).toBe('true')
    })

    it('accepts February 29 on a leap year', async () => {
      const datePicker = await createDatePicker()
      const input = getInput(datePicker)

      input.value = '2028-02-29T10:00'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      dispatchKeyDown(input, 'Enter')
      await settle(datePicker)

      expect(datePicker.value).toBe('2028-02-29T10:00')
      expect(datePicker.inputInvalid).toBe(false)
    })

    it('keeps partial typed dates uncommitted and marked invalid', async () => {
      const datePicker = await createDatePicker()
      const input = getInput(datePicker)

      input.value = '2026-01'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      dispatchKeyDown(input, 'Enter')
      await settle(datePicker)

      expect(datePicker.value).toBe('')
      expect(datePicker.inputInvalid).toBe(true)
    })

    it('commits date-only input with midnight time', async () => {
      const datePicker = await createDatePicker()
      const input = getInput(datePicker)

      input.value = '2026-03-05'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      dispatchKeyDown(input, 'Enter')
      await settle(datePicker)

      expect(datePicker.value).toBe('2026-03-05T00:00')
    })
  })

  describe('month navigation at year boundaries', () => {
    const getCurrentMonthDays = (element: CVDatePicker) =>
      getCalendarDays(element).filter((day) => day.getAttribute('data-month') === 'current')

    it('navigates from January back to December of the previous year', async () => {
      const datePicker = await createDatePicker({value: '2026-01-15T10:00'})
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      const prevButton = datePicker.shadowRoot!.querySelector(
        '[part="month-nav-button"][data-dir="prev"]',
      ) as HTMLButtonElement
      prevButton.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(datePicker)

      const currentDays = getCurrentMonthDays(datePicker)
      expect(currentDays[0]!.getAttribute('data-date')).toBe('2025-12-01')
      expect(currentDays).toHaveLength(31)
    })

    it('navigates from December forward to January of the next year', async () => {
      const datePicker = await createDatePicker({value: '2025-12-15T10:00'})
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      const nextButton = datePicker.shadowRoot!.querySelector(
        '[part="month-nav-button"][data-dir="next"]',
      ) as HTMLButtonElement
      nextButton.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(datePicker)

      const currentDays = getCurrentMonthDays(datePicker)
      expect(currentDays[0]!.getAttribute('data-date')).toBe('2026-01-01')
      expect(currentDays).toHaveLength(31)
    })

    it('moves a year back while preserving the month via the year nav button', async () => {
      const datePicker = await createDatePicker({value: '2026-03-10T10:00'})
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      const yearPrev = datePicker.shadowRoot!.querySelector(
        '[part="year-nav-button"][data-dir="prev"]',
      ) as HTMLButtonElement
      yearPrev.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(datePicker)

      const currentDays = getCurrentMonthDays(datePicker)
      expect(currentDays[0]!.getAttribute('data-date')).toBe('2025-03-01')
    })

    it('PageUp on the grid crosses the year boundary into December', async () => {
      const datePicker = await createDatePicker({value: '2026-01-15T10:00'})
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      dispatchKeyDown(getCalendarGrid(datePicker), 'PageUp')
      await settle(datePicker)

      const currentDays = getCurrentMonthDays(datePicker)
      expect(currentDays[0]!.getAttribute('data-date')).toBe('2025-12-01')
    })

    it('Shift+PageDown on the grid moves to the same month of the next year', async () => {
      const datePicker = await createDatePicker({value: '2026-01-15T10:00'})
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      dispatchKeyDown(getCalendarGrid(datePicker), 'PageDown', {shiftKey: true})
      await settle(datePicker)

      const currentDays = getCurrentMonthDays(datePicker)
      expect(currentDays[0]!.getAttribute('data-date')).toBe('2027-01-01')
    })
  })

  describe('min/max bounds', () => {
    it('disables out-of-range days in the calendar grid', async () => {
      const datePicker = await createDatePicker({
        value: '2026-01-15T10:00',
        min: '2026-01-10T00:00',
        max: '2026-01-20T23:59',
      })
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      const dayByDate = (date: string) =>
        getCalendarDays(datePicker).find((day) => day.getAttribute('data-date') === date)!

      expect(dayByDate('2026-01-09').disabled).toBe(true)
      expect(dayByDate('2026-01-09').getAttribute('aria-disabled')).toBe('true')
      expect(dayByDate('2026-01-10').disabled).toBe(false)
      expect(dayByDate('2026-01-20').disabled).toBe(false)
      expect(dayByDate('2026-01-21').disabled).toBe(true)
    })

    it('rejects committing a typed value below min', async () => {
      const datePicker = await createDatePicker({min: '2026-01-10T00:00'})
      const input = getInput(datePicker)

      input.value = '2026-01-05T10:00'
      input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
      dispatchKeyDown(input, 'Enter')
      await settle(datePicker)

      expect(datePicker.value).toBe('')
      expect(datePicker.inputInvalid).toBe(true)
    })

    it('does not move keyboard focus beyond the max date', async () => {
      const datePicker = await createDatePicker({
        value: '2026-01-20T10:00',
        max: '2026-01-20T23:59',
      })
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      dispatchKeyDown(getCalendarGrid(datePicker), 'ArrowRight')
      await settle(datePicker)

      const focusedDay = getCalendarDays(datePicker).find(
        (day) => day.getAttribute('tabindex') === '0',
      )
      expect(focusedDay?.getAttribute('data-date')).toBe('2026-01-20')
    })
  })

  describe('commit semantics', () => {
    it('does not emit cv-change when Enter commits an unchanged value', async () => {
      const datePicker = await createDatePicker({value: '2026-01-10T12:30'})
      let changeCount = 0
      datePicker.addEventListener('cv-change', () => changeCount++)

      dispatchKeyDown(getInput(datePicker), 'Enter')
      await settle(datePicker)

      expect(datePicker.value).toBe('2026-01-10T12:30')
      expect(changeCount).toBe(0)
    })

    it('reverts the draft selection on Cancel without emitting cv-change', async () => {
      const datePicker = await createDatePicker({value: '2026-01-10T12:30'})
      let changeCount = 0
      datePicker.addEventListener('cv-change', () => changeCount++)

      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      const otherDay = getCalendarDays(datePicker).find(
        (day) => day.getAttribute('data-date') === '2026-01-15',
      )!
      otherDay.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      getCancelButton(datePicker).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(datePicker)

      expect(datePicker.value).toBe('2026-01-10T12:30')
      expect(changeCount).toBe(0)
    })

    it('Escape on the input closes the open dialog', async () => {
      const datePicker = await createDatePicker()
      const input = getInput(datePicker)

      dispatchKeyDown(input, 'ArrowDown')
      await settle(datePicker)
      expect(datePicker.open).toBe(true)

      dispatchKeyDown(input, 'Escape')
      await settle(datePicker)
      expect(datePicker.open).toBe(false)
    })

    it('hides the clear button until a value is committed', async () => {
      const datePicker = await createDatePicker()
      expect(getClearButton(datePicker).hidden).toBe(true)

      datePicker.value = '2026-01-05T10:00'
      await settle(datePicker)
      expect(getClearButton(datePicker).hidden).toBe(false)
    })
  })

  describe('timezone-independent day math', () => {
    it('marks the committed midnight day as selected in UTC mode', async () => {
      const datePicker = await createDatePicker({timeZone: 'utc', value: '2026-01-01T00:00'})
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      const selectedDays = getCalendarDays(datePicker).filter(
        (day) => day.getAttribute('aria-selected') === 'true',
      )
      expect(selectedDays).toHaveLength(1)
      expect(selectedDays[0]!.getAttribute('data-date')).toBe('2026-01-01')
    })

    it('marks the committed midnight day as selected in local mode', async () => {
      const datePicker = await createDatePicker({value: '2026-01-01T00:00'})
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      const selectedDays = getCalendarDays(datePicker).filter(
        (day) => day.getAttribute('aria-selected') === 'true',
      )
      expect(selectedDays).toHaveLength(1)
      expect(selectedDays[0]!.getAttribute('data-date')).toBe('2026-01-01')
    })
  })

  describe('headless contract delegation', () => {
    it('keeps active descendant wiring inside rendered day cells', async () => {
      const datePicker = await createDatePicker()
      const input = getInput(datePicker)

      dispatchKeyDown(input, 'ArrowDown')
      await settle(datePicker)

      const activeId = input.getAttribute('aria-activedescendant')
      if (activeId) {
        expect(getDialog(datePicker).querySelector(`#${activeId}`)).not.toBeNull()
      }

      expect(input.getAttribute('aria-controls')).toBe(getDialog(datePicker).id)
    })
  })

  describe('regression: batch 4 fixes', () => {
    it('does not throw when value/min/max attributes are removed', async () => {
      const datePicker = await createDatePicker({value: '2026-01-15T10:00'})
      datePicker.setAttribute('min', '2026-01-10')
      datePicker.setAttribute('max', '2026-01-20')
      await settle(datePicker)

      // removeAttribute makes the String-typed property null; the model sync
      // path must not call null.trim().
      datePicker.removeAttribute('min')
      datePicker.removeAttribute('max')
      datePicker.removeAttribute('value')
      await expect(settle(datePicker)).resolves.toBeUndefined()

      expect(datePicker.value).toBe('')
    })

    it('keeps a value set in the same update that changes ariaLabel', async () => {
      const datePicker = await createDatePicker({value: '2026-01-10T12:30'})

      // Batch a config-rebuild prop (ariaLabel) with a value change. Before the
      // fix the early-return after rebuildModel() reverted the new value.
      datePicker.ariaLabel = 'Pick a date'
      datePicker.value = '2026-02-05T09:15'
      await settle(datePicker)

      expect(datePicker.value).toBe('2026-02-05T09:15')
      expect(getInput(datePicker).value).toBe('2026-02-05T09:15')
    })

    it('keeps a value set in the same update that changes closeOnEscape', async () => {
      const datePicker = await createDatePicker({value: '2026-01-10T12:30'})

      datePicker.closeOnEscape = false
      datePicker.value = '2026-03-03T08:00'
      await settle(datePicker)

      expect(datePicker.value).toBe('2026-03-03T08:00')
    })

    it('allows applying a draft when max is a date-only string', async () => {
      const datePicker = await createDatePicker({
        value: '2026-06-15T10:00',
        max: '2026-06-15',
      })
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      // The max day is selectable in the grid; Apply must also be enabled for a
      // draft on that day (raw-string compare would disable it).
      expect(getApplyButton(datePicker).disabled).toBe(false)
    })

    it('classifies year-boundary spillover days with the correct prev/next month', async () => {
      const datePicker = await createDatePicker({value: '2026-01-15T10:00'})
      dispatchKeyDown(getInput(datePicker), 'ArrowDown')
      await settle(datePicker)

      const dayByDate = (date: string) =>
        getCalendarDays(datePicker).find((day) => day.getAttribute('data-date') === date)

      // December 2025 days leading into January 2026 must be 'prev', not 'next'.
      const dec31 = dayByDate('2025-12-31')
      if (dec31) {
        expect(dec31.getAttribute('data-month')).toBe('prev')
      }
      // February 2026 days trailing January must be 'next'.
      const feb1 = dayByDate('2026-02-01')
      if (feb1) {
        expect(feb1.getAttribute('data-month')).toBe('next')
      }
    })
  })

  describe('form association', () => {
    it('declares formAssociated for the custom element', () => {
      expect(CVDatePicker.formAssociated).toBe(true)
    })

    it.skipIf(!hasElementInternals)('contributes committed value to FormData', async () => {
      const form = document.createElement('form')
      const datePicker = await createDatePicker({value: '2026-01-10T12:30'})
      datePicker.setAttribute('name', 'scheduledAt')

      form.append(datePicker)
      document.body.append(form)
      await settle(datePicker)

      const value = new FormData(form).get('scheduledAt')
      if (value === null) {
        return
      }

      expect(value).toBe('2026-01-10T12:30')
    })

    it('treats required date picker as invalid until it has a committed value', async () => {
      const datePicker = await createDatePicker({required: true})

      expect(datePicker.checkValidity()).toBe(false)

      datePicker.value = '2026-01-10T12:30'
      await settle(datePicker)

      expect(datePicker.checkValidity()).toBe(true)
    })
  })
})
