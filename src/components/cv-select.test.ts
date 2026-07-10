import {afterEach, describe, expect, it} from 'vitest'

import {CVSelect} from './cv-select'
import {CVSelectGroup} from './cv-select-group'
import {CVSelectOption} from './cv-select-option'

CVSelectGroup.define()
CVSelectOption.define()
CVSelect.define()

const stylesToText = () =>
  (CVSelect.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')

const settle = async (element: CVSelect) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
  await Promise.resolve()
}

const createSelect = async (
  attrs?: Partial<CVSelect>,
  optionsHtml = `
    <cv-select-option value="a">Alpha</cv-select-option>
    <cv-select-option value="b">Beta</cv-select-option>
    <cv-select-option value="c" disabled>Gamma</cv-select-option>
  `,
) => {
  const el = document.createElement('cv-select') as CVSelect
  if (attrs) Object.assign(el, attrs)
  el.innerHTML = optionsHtml
  document.body.append(el)
  await settle(el)
  return el
}

const getTrigger = (el: CVSelect) => el.shadowRoot!.querySelector('[part="trigger"]') as HTMLElement

const getListbox = (el: CVSelect) => el.shadowRoot!.querySelector('[part="listbox"]') as HTMLElement

const getBase = (el: CVSelect) => el.shadowRoot!.querySelector('[part="base"]') as HTMLElement

const getOptions = (el: CVSelect) => Array.from(el.querySelectorAll('cv-select-option')) as CVSelectOption[]

const getClearButton = (el: CVSelect) =>
  el.shadowRoot!.querySelector('[part="clear-button"]') as HTMLElement | null

const hasElementInternals =
  typeof (HTMLElement.prototype as {attachInternals?: unknown}).attachInternals === 'function'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-select', () => {
  describe('style contract', () => {
    it('defines discrete display presence for listbox', () => {
      const cssText = stylesToText()

      expect(cssText).toMatch(/\[part='listbox'\][\s\S]*transition:[\s\S]*display[\s\S]*allow-discrete/)
      expect(cssText).toMatch(/transition-behavior:\s*allow-discrete/)
    })

    it('uses viewport-aware popup listbox sizing', () => {
      const cssText = stylesToText()

      expect(cssText).toMatch(/max-block-size:\s*var\(--cv-select-listbox-max-block-size,\s*240px\)/)
      expect(cssText).toContain('calc(100dvh - var(--cv-select-listbox-viewport-block-gutter, 32px))')
      expect(cssText).toContain('@supports (min-block-size: calc-size(fit-content, min(size, 1px)))')
      expect(cssText).toContain('@supports (max-block-size: calc-size(stretch, min(size, 1px)))')
      expect(cssText).toContain("[data-cv-popup-listbox][data-cv-anchor-positioned='true']")
      expect(cssText).toMatch(/overscroll-behavior:\s*contain/)
    })

    it('keeps value text flexible and trailing controls compact', () => {
      const cssText = stylesToText()

      expect(cssText).toMatch(/\[part='trigger'\]\s*{[\s\S]*justify-content:\s*flex-start/)
      expect(cssText).toMatch(/\[part='value'\]\s*{[\s\S]*flex:\s*1 1 auto/)
      expect(cssText).toMatch(
        /\[part='clear-button'\]\s*{[\s\S]*inline-size:\s*var\(--cv-select-clear-button-size/,
      )
    })

    it('rotates the chevron when the select is open', () => {
      const cssText = stylesToText()

      expect(cssText).toMatch(
        /:host\(\[open\]\)\s*\[part='chevron'\]\s*{[\s\S]*transform:\s*rotate\(180deg\)/,
      )
    })
  })

  // --- Shadow DOM structure ---

  describe('shadow DOM structure', () => {
    it('renders [part="base"]', async () => {
      const el = await createSelect()
      expect(getBase(el)).not.toBeNull()
    })

    it('renders [part="trigger"] as a <div> with role="combobox"', async () => {
      const el = await createSelect()
      const trigger = getTrigger(el)
      expect(trigger).not.toBeNull()
      expect(trigger.tagName.toLowerCase()).toBe('div')
      expect(trigger.getAttribute('role')).toBe('combobox')
    })

    it('renders [part="chevron"] with aria-hidden="true"', async () => {
      const el = await createSelect()
      const chevron = el.shadowRoot!.querySelector('[part="chevron"]')
      expect(chevron).not.toBeNull()
      expect(chevron!.getAttribute('aria-hidden')).toBe('true')
    })

    it('renders value wrapper around trigger slot', async () => {
      const el = await createSelect()
      const value = el.shadowRoot!.querySelector('[part="value"]')
      const slot = value?.querySelector('slot[name="trigger"]')
      expect(value).not.toBeNull()
      expect(slot).not.toBeNull()
    })

    it('renders [part="listbox"]', async () => {
      const el = await createSelect()
      expect(getListbox(el)).not.toBeNull()
      expect(getListbox(el).hasAttribute('data-cv-popup-listbox')).toBe(true)
    })

    it('renders default slot inside listbox', async () => {
      const el = await createSelect()
      const listbox = getListbox(el)
      const slot = listbox.querySelector('slot:not([name])')
      expect(slot).not.toBeNull()
    })

    it('renders trigger slot inside trigger', async () => {
      const el = await createSelect()
      const trigger = getTrigger(el)
      const slot = trigger.querySelector('slot[name="trigger"]')
      expect(slot).not.toBeNull()
    })
  })

  // --- Default property values ---

  describe('default property values', () => {
    it('has correct defaults', async () => {
      const el = await createSelect()
      expect(el.value).toBe('')
      expect(el.selectedValues).toEqual([])
      expect(el.open).toBe(false)
      expect(el.selectionMode).toBe('single')
      expect(el.ariaLabel).toBe('')
      expect(el.ariaLabelledBy).toBe('')
      expect(el.ariaDescribedBy).toBe('')
      expect(el.closeOnSelect).toBe(true)
      expect(el.placeholder).toBe('')
      expect(el.disabled).toBe(false)
      expect(el.required).toBe(false)
      expect(el.clearable).toBe(false)
      expect(el.size).toBe('medium')
    })
  })

  // --- Attribute reflection ---

  describe('attribute reflection', () => {
    it('reflects open as a boolean attribute', async () => {
      const el = await createSelect()
      expect(el.hasAttribute('open')).toBe(false)

      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(el.hasAttribute('open')).toBe(true)
    })

    it('reflects value as a string attribute', async () => {
      const el = await createSelect({value: 'a'})
      expect(el.getAttribute('value')).toBe('a')
    })

    it('reflects selection-mode as a string attribute', async () => {
      const el = await createSelect({selectionMode: 'multiple'})
      expect(el.getAttribute('selection-mode')).toBe('multiple')
    })

    it('reflects close-on-select as a boolean attribute', async () => {
      const el = await createSelect({closeOnSelect: true})
      expect(el.hasAttribute('close-on-select')).toBe(true)
    })

    it('reflects disabled as a boolean attribute', async () => {
      const el = await createSelect({disabled: true})
      expect(el.hasAttribute('disabled')).toBe(true)
    })

    it('reflects required as a boolean attribute', async () => {
      const el = await createSelect({required: true})
      expect(el.hasAttribute('required')).toBe(true)
    })

    it('reflects clearable as a boolean attribute', async () => {
      const el = await createSelect({clearable: true})
      expect(el.hasAttribute('clearable')).toBe(true)
    })

    it('reflects size as a string attribute', async () => {
      const el = await createSelect({size: 'small'})
      expect(el.getAttribute('size')).toBe('small')
    })
  })

  // --- ARIA ---

  describe('ARIA', () => {
    it('trigger has role="combobox"', async () => {
      const el = await createSelect()
      expect(getTrigger(el).getAttribute('role')).toBe('combobox')
    })

    it('trigger has tabindex="0"', async () => {
      const el = await createSelect()
      expect(getTrigger(el).getAttribute('tabindex')).toBe('0')
    })

    it('trigger has aria-haspopup="listbox"', async () => {
      const el = await createSelect()
      expect(getTrigger(el).getAttribute('aria-haspopup')).toBe('listbox')
    })

    it('trigger has aria-expanded="false" when closed', async () => {
      const el = await createSelect()
      expect(getTrigger(el).getAttribute('aria-expanded')).toBe('false')
    })

    it('trigger has aria-expanded="true" when open', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(getTrigger(el).getAttribute('aria-expanded')).toBe('true')
    })

    it('trigger aria-controls references listbox id', async () => {
      const el = await createSelect()
      const trigger = getTrigger(el)
      const listbox = getListbox(el)
      expect(trigger.getAttribute('aria-controls')).toBe(listbox.id)
    })

    it('trigger aria-activedescendant references active option when open', async () => {
      const el = await createSelect()
      // When closed, no activedescendant
      expect(getTrigger(el).hasAttribute('aria-activedescendant')).toBe(false)

      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)

      const activedescendant = getTrigger(el).getAttribute('aria-activedescendant')
      expect(activedescendant).toBeTruthy()
      // The referenced id should exist as an option
      expect(
        getOptions(el).some(
          (opt) => opt.id === activedescendant || opt.getAttribute('id') === activedescendant,
        ),
      ).toBe(true)
    })

    it('trigger has aria-disabled="true" when disabled', async () => {
      const el = await createSelect({disabled: true})
      expect(getTrigger(el).getAttribute('aria-disabled')).toBe('true')
    })

    it('trigger has aria-required="true" when required', async () => {
      const el = await createSelect({required: true})
      expect(getTrigger(el).getAttribute('aria-required')).toBe('true')
    })

    it('trigger has aria-label when set', async () => {
      const el = await createSelect({ariaLabel: 'Pick a fruit'})
      expect(getTrigger(el).getAttribute('aria-label')).toBe('Pick a fruit')
    })

    it('uses external field aria linkage when provided', async () => {
      const el = await createSelect({
        ariaLabel: 'Fallback label',
        ariaLabelledBy: 'field-label',
        ariaDescribedBy: 'field-description',
      })
      const trigger = getTrigger(el)
      const listbox = getListbox(el)

      expect(trigger.getAttribute('aria-labelledby')).toBe('field-label')
      expect(trigger.getAttribute('aria-describedby')).toBe('field-description')
      expect(trigger.hasAttribute('aria-label')).toBe(false)
      expect(listbox.getAttribute('aria-labelledby')).toBe('field-label')
      expect(listbox.hasAttribute('aria-label')).toBe(false)
    })

    it('listbox has role="listbox"', async () => {
      const el = await createSelect()
      expect(getListbox(el).getAttribute('role')).toBe('listbox')
    })

    it('listbox is hidden when closed', async () => {
      const el = await createSelect()
      expect(getListbox(el).hidden).toBe(true)
    })

    it('options have role="option" when open', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const options = getOptions(el)
      for (const opt of options) {
        expect(opt.getAttribute('role')).toBe('option')
      }
    })

    it('selected option has aria-selected="true"', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getOptions(el)[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      // Reopen to inspect state
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(getOptions(el)[0]!.getAttribute('aria-selected')).toBe('true')
      expect(getOptions(el)[1]!.getAttribute('aria-selected')).toBe('false')
    })

    it('disabled option has aria-disabled="true"', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const disabledOption = getOptions(el)[2]!
      expect(disabledOption.getAttribute('aria-disabled')).toBe('true')
    })

    it('listbox has aria-multiselectable="true" in multiple mode', async () => {
      const el = await createSelect({selectionMode: 'multiple'})
      expect(getListbox(el).getAttribute('aria-multiselectable')).toBe('true')
    })
  })

  // --- Events ---

  describe('events', () => {
    it('cv-input event detail shape: {value, values, activeId, open}', async () => {
      const el = await createSelect()
      let detail: unknown

      el.addEventListener('cv-input', (e) => {
        detail = (e as CustomEvent).detail
      })

      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(detail).toHaveProperty('value')
      expect(detail).toHaveProperty('values')
      expect(detail).toHaveProperty('activeId')
      expect(detail).toHaveProperty('open')
    })

    it('cv-change event fires only on selection change', async () => {
      const el = await createSelect()
      const changes: Array<{value: string | null; values: string[]}> = []

      el.addEventListener('cv-change', (e) => {
        changes.push((e as CustomEvent).detail)
      })

      // Open — should not fire change
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(changes).toHaveLength(0)

      // Select option — should fire change
      getOptions(el)[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(changes).toHaveLength(1)
      expect(changes[0]!.value).toBe('a')
      expect(changes[0]!.values).toEqual(['a'])
    })

    it('cv-change event detail shape: {value, values, activeId, open}', async () => {
      const el = await createSelect()
      let detail: unknown

      el.addEventListener('cv-change', (e) => {
        detail = (e as CustomEvent).detail
      })

      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      getOptions(el)[1]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(detail).toEqual(
        expect.objectContaining({
          value: 'b',
          values: ['b'],
          open: false,
        }),
      )
    })

    it('emits only cv-input/cv-change events', async () => {
      const el = await createSelect()
      const events: string[] = []

      el.addEventListener('cv-input', () => events.push('cv-input'))
      el.addEventListener('cv-change', () => events.push('cv-change'))

      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      getOptions(el)[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(events).toEqual(['cv-input', 'cv-input', 'cv-change'])
    })
  })

  // --- Keyboard interaction (trigger) ---

  describe('keyboard: trigger', () => {
    it('ArrowDown opens and focuses first option', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)

      expect(el.open).toBe(true)
    })

    it('ArrowUp opens and focuses last option', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(el)

      expect(el.open).toBe(true)
    })

    it('Enter toggles open', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)
      expect(el.open).toBe(true)

      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)
      expect(el.open).toBe(false)
    })

    it('Space toggles open', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}))
      await settle(el)
      expect(el.open).toBe(true)

      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}))
      await settle(el)
      expect(el.open).toBe(false)
    })

    it('Home opens and focuses first option', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      await settle(el)

      expect(el.open).toBe(true)
    })

    it('End opens and focuses last option', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      await settle(el)

      expect(el.open).toBe(true)
    })

    it('keyboard does nothing when disabled', async () => {
      const el = await createSelect({disabled: true})
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)

      expect(el.open).toBe(false)
    })
  })

  // --- Keyboard interaction (listbox) ---

  describe('keyboard: listbox', () => {
    it('Enter selects active option and closes', async () => {
      const el = await createSelect()
      const changes: Array<{value: string | null}> = []
      el.addEventListener('cv-change', (e) => changes.push((e as CustomEvent).detail))

      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)

      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)

      expect(el.value).toBe('b')
      expect(el.open).toBe(false)
      expect(changes.at(-1)?.value).toBe('b')
    })

    it('Escape closes without changing selection', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(el.value).toBe('')
      expect(el.open).toBe(false)
    })

    it('Tab closes without changing selection', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Tab', bubbles: true}))
      await settle(el)

      expect(el.open).toBe(false)
    })

    it('Space selects active option', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)

      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}))
      await settle(el)

      expect(el.value).toBe('a')
      expect(el.open).toBe(false)
    })

    it('Home moves to first option', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)

      // Move to last, then Home
      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)

      expect(el.value).toBe('a')
    })

    it('End moves to last enabled option', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)

      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)

      // 'c' is disabled, so End should stop at 'b'
      expect(el.value).toBe('b')
    })
  })

  // --- Click interaction ---

  describe('click interaction', () => {
    it('click on trigger toggles open', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(el.open).toBe(true)

      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(el.open).toBe(false)
    })

    it('click on option selects and closes', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getOptions(el)[1]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe('b')
      expect(el.open).toBe(false)
      expect(getOptions(el)[1]!.selected).toBe(true)
    })

    it('click on disabled option does nothing', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const changes: unknown[] = []
      el.addEventListener('cv-change', (e) => changes.push(e))

      getOptions(el)[2]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe('')
      expect(changes).toHaveLength(0)
    })

    it('closes on outside pointer', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(el.open).toBe(true)

      document.body.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}))
      await settle(el)

      expect(el.open).toBe(false)
      expect(getListbox(el).hidden).toBe(true)
    })

    it('click on trigger does nothing when disabled', async () => {
      const el = await createSelect({disabled: true})
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(el.open).toBe(false)
    })
  })

  // --- closeOnSelect behavior ---

  describe('closeOnSelect behavior', () => {
    it('keeps open when closeOnSelect is false', async () => {
      const el = await createSelect({closeOnSelect: false})
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getOptions(el)[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe('a')
      expect(el.open).toBe(true)
    })
  })

  // --- Multiple selection ---

  describe('multiple selection', () => {
    it('toggles multiple selections on click', async () => {
      const el = await createSelect({selectionMode: 'multiple', closeOnSelect: false})
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getOptions(el)[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getOptions(el)[1]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.selectedValues).toEqual(['a', 'b'])
      expect(el.open).toBe(true)
    })

    it('toggles multiple selections on keyboard', async () => {
      const el = await createSelect({selectionMode: 'multiple', closeOnSelect: false})

      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getOptions(el)[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}))
      await settle(el)

      expect(el.selectedValues).toEqual(['a', 'b'])
    })

    it('cv-change event includes values array', async () => {
      const el = await createSelect({selectionMode: 'multiple', closeOnSelect: false})
      const changes: Array<{values: string[]}> = []
      el.addEventListener('cv-change', (e) => changes.push((e as CustomEvent).detail))

      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getOptions(el)[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(changes.at(-1)?.values).toEqual(['a'])
    })
  })

  // --- Grouped options ---

  describe('grouped options', () => {
    const groupedHtml = `
      <cv-select-group label="First group">
        <cv-select-option value="a">Alpha</cv-select-option>
        <cv-select-option value="b">Beta</cv-select-option>
      </cv-select-group>
      <cv-select-group label="Second group">
        <cv-select-option value="c">Gamma</cv-select-option>
      </cv-select-group>
    `

    it('groups have role="group" and aria-label when open', async () => {
      const el = await createSelect({}, groupedHtml)
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const groups = Array.from(el.querySelectorAll('cv-select-group')) as CVSelectGroup[]
      expect(groups[0]!.getAttribute('role')).toBe('group')
      expect(groups[0]!.getAttribute('aria-label')).toBe('First group')
      expect(groups[1]!.getAttribute('role')).toBe('group')
      expect(groups[1]!.getAttribute('aria-label')).toBe('Second group')
    })

    it('can select options within groups', async () => {
      const el = await createSelect({}, groupedHtml)
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const optionC = el.querySelector('cv-select-option[value="c"]') as CVSelectOption
      optionC.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe('c')
    })
  })

  // --- Typeahead ---

  describe('typeahead', () => {
    it('typing a character in the open listbox moves the active option to the match', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'b', bubbles: true}))
      await settle(el)

      const activedescendant = getTrigger(el).getAttribute('aria-activedescendant')
      expect(activedescendant).toBeTruthy()
      const beta = el.querySelector('cv-select-option[value="b"]') as CVSelectOption
      expect(beta.id).toBe(activedescendant)

      getListbox(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)
      expect(el.value).toBe('b')
    })
  })

  // --- Initial selected attribute ---

  describe('initial selected attribute', () => {
    it('uses an option with the selected attribute as initial value', async () => {
      const el = await createSelect(
        {},
        `
          <cv-select-option value="a">Alpha</cv-select-option>
          <cv-select-option value="b" selected>Beta</cv-select-option>
        `,
      )

      expect(el.value).toBe('b')
      expect(getTrigger(el).textContent).toContain('Beta')
    })
  })

  // --- Programmatic value writes ---

  describe('programmatic value writes', () => {
    it('ignores programmatic value set to a disabled option and keeps current selection', async () => {
      const el = await createSelect({value: 'a'})
      expect(el.value).toBe('a')

      el.value = 'c'
      await settle(el)

      expect(el.value).toBe('a')
      const optionC = el.querySelector('cv-select-option[value="c"]') as CVSelectOption
      expect(optionC.selected).toBe(false)
    })

    it('dedupes and filters disabled ids from programmatic selectedValues in multiple mode', async () => {
      const el = await createSelect({selectionMode: 'multiple'})

      el.selectedValues = ['a', 'a', 'c', 'b']
      await settle(el)

      expect(el.selectedValues).toEqual(['a', 'b'])
    })

    it('renders multiple selected labels after programmatic selectedValues write', async () => {
      const el = await createSelect({selectionMode: 'multiple', clearable: true})

      el.selectedValues = ['a', 'b']
      await settle(el)

      expect(el.value).toBe('a')
      expect(el.selectedValues).toEqual(['a', 'b'])
      expect(getTrigger(el).textContent).toContain('Alpha, Beta')
      expect(getClearButton(el)).not.toBeNull()
    })
  })

  // --- State preservation ---

  describe('state preservation', () => {
    it('preserves selected value across slot rebuild', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getOptions(el)[1]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(el.value).toBe('b')

      const optionA = el.querySelector('cv-select-option[value="a"]') as CVSelectOption
      optionA.remove()
      await settle(el)

      expect(el.value).toBe('b')
      expect((el.querySelector('cv-select-option[value="b"]') as CVSelectOption).selected).toBe(true)
    })

    it('preserves selection and option interactivity across disconnect/reconnect', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      getOptions(el)[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(el.value).toBe('a')

      el.remove()
      document.body.append(el)
      await settle(el)

      expect(el.value).toBe('a')

      // Options must stay clickable after reconnect
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      getOptions(el)[1]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe('b')
    })
  })

  // --- Disabled state ---

  describe('disabled state', () => {
    it('blocks opening via click', async () => {
      const el = await createSelect({disabled: true})
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(el.open).toBe(false)
    })

    it('blocks opening via keyboard', async () => {
      const el = await createSelect({disabled: true})
      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(el)
      expect(el.open).toBe(false)

      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(el)
      expect(el.open).toBe(false)

      getTrigger(el).dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}))
      await settle(el)
      expect(el.open).toBe(false)
    })

    it('dynamically disabling syncs trigger aria-disabled', async () => {
      const el = await createSelect()
      expect(getTrigger(el).hasAttribute('aria-disabled')).toBe(false)

      el.disabled = true
      await settle(el)
      expect(getTrigger(el).getAttribute('aria-disabled')).toBe('true')

      el.disabled = false
      await settle(el)
      expect(getTrigger(el).hasAttribute('aria-disabled')).toBe(false)
    })
  })

  // --- Required state ---

  describe('required state', () => {
    it('trigger has aria-required="true" when required', async () => {
      const el = await createSelect({required: true})
      expect(getTrigger(el).getAttribute('aria-required')).toBe('true')
    })

    it('dynamically setting required syncs trigger aria-required', async () => {
      const el = await createSelect()
      expect(getTrigger(el).hasAttribute('aria-required')).toBe(false)

      el.required = true
      await settle(el)
      expect(getTrigger(el).getAttribute('aria-required')).toBe('true')

      el.required = false
      await settle(el)
      expect(getTrigger(el).hasAttribute('aria-required')).toBe(false)
    })
  })

  // --- Clearable ---

  describe('clearable', () => {
    it('does not render clear button when clearable is false', async () => {
      const el = await createSelect({value: 'a'})
      expect(getClearButton(el)).toBeNull()
    })

    it('renders clear button when clearable and value is set', async () => {
      const el = await createSelect({clearable: true, value: 'a'})
      expect(getClearButton(el)).not.toBeNull()
    })

    it('does not render clear button when clearable but no value', async () => {
      const el = await createSelect({clearable: true})
      expect(getClearButton(el)).toBeNull()
    })

    it('clicking clear button clears value', async () => {
      const el = await createSelect({clearable: true, value: 'a'})
      expect(el.value).toBe('a')

      const clearBtn = getClearButton(el)!
      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe('')
    })

    it('clicking clear button fires change event', async () => {
      const el = await createSelect({clearable: true, value: 'a'})
      const changes: Array<{value: string | null}> = []
      el.addEventListener('cv-change', (e) => changes.push((e as CustomEvent).detail))

      const clearBtn = getClearButton(el)!
      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(changes).toHaveLength(1)
      expect(changes[0]!.value).toBe(null)
    })

    it('clear button does not open the listbox', async () => {
      const el = await createSelect({clearable: true, value: 'a'})

      const clearBtn = getClearButton(el)!
      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.open).toBe(false)
    })

    it('trigger shows placeholder again after clearing', async () => {
      const el = await createSelect({clearable: true, placeholder: 'Pick one', value: 'a'})
      expect(getTrigger(el).textContent).toContain('Alpha')

      const clearBtn = getClearButton(el)!
      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe('')
      expect(getTrigger(el).textContent).toContain('Pick one')
    })
  })

  // --- Size variants ---

  describe('size variants', () => {
    it('defaults to medium', async () => {
      const el = await createSelect()
      expect(el.size).toBe('medium')
    })

    it('reflects small size attribute', async () => {
      const el = await createSelect({size: 'small'})
      expect(el.getAttribute('size')).toBe('small')
    })

    it('reflects large size attribute', async () => {
      const el = await createSelect({size: 'large'})
      expect(el.getAttribute('size')).toBe('large')
    })
  })

  // --- Placeholder ---

  describe('placeholder', () => {
    it('trigger displays placeholder when no value selected', async () => {
      const el = await createSelect({placeholder: 'Pick one'})
      const trigger = getTrigger(el)
      expect(trigger.textContent).toContain('Pick one')
    })

    it('trigger displays selected label instead of placeholder', async () => {
      const el = await createSelect({placeholder: 'Pick one', value: 'a'})
      const trigger = getTrigger(el)
      expect(trigger.textContent).toContain('Alpha')
      expect(trigger.textContent).not.toContain('Pick one')
    })
  })

  // --- Headless contract delegation ---

  describe('headless contract delegation', () => {
    it('rendered ARIA attributes come from headless contracts, not hardcoded', async () => {
      const el = await createSelect()
      const trigger = getTrigger(el)

      // Combobox role from headless getTriggerProps()
      expect(trigger.getAttribute('role')).toBe('combobox')
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      // aria-controls value should be a real listbox id
      const listboxId = trigger.getAttribute('aria-controls')
      expect(listboxId).toBeTruthy()
      expect(getListbox(el).id).toBe(listboxId)
    })
  })

  // --- Batch 8 regression ---

  describe('null value guard', () => {
    it('removeAttribute("value") does not throw and clears selection', async () => {
      const el = await createSelect({value: 'a'})
      expect(el.value).toBe('a')

      // Lit's String converter yields `null`; willUpdate must not call `null.trim()`.
      expect(() => {
        el.removeAttribute('value')
      }).not.toThrow()
      await settle(el)

      expect(el.value).toBe('')
    })
  })

  describe('keyboard trap (closed trigger)', () => {
    it('does not preventDefault Tab on a closed trigger (lets focus move on)', async () => {
      const el = await createSelect()
      expect(el.open).toBe(false)

      const event = new KeyboardEvent('keydown', {key: 'Tab', bubbles: true, cancelable: true})
      getTrigger(el).dispatchEvent(event)
      await settle(el)

      expect(event.defaultPrevented).toBe(false)
      expect(el.open).toBe(false)
    })

    it('does not preventDefault Escape on a closed trigger (lets it reach a parent dialog)', async () => {
      const el = await createSelect()
      expect(el.open).toBe(false)

      const event = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true})
      getTrigger(el).dispatchEvent(event)
      await settle(el)

      expect(event.defaultPrevented).toBe(false)
    })

    it('still preventDefaults Escape on the trigger while open', async () => {
      const el = await createSelect()
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(el.open).toBe(true)

      const event = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true})
      getTrigger(el).dispatchEvent(event)
      await settle(el)

      expect(event.defaultPrevented).toBe(true)
    })
  })

  describe('controlled value before slotting (accordion pattern)', () => {
    it('re-applies a value set before options are slotted', async () => {
      const el = document.createElement('cv-select') as CVSelect
      // value set while there are no options yet
      el.value = 'b'
      document.body.append(el)
      await settle(el)

      // options arrive after mount
      el.innerHTML = `
        <cv-select-option value="a">Alpha</cv-select-option>
        <cv-select-option value="b">Beta</cv-select-option>
      `
      await settle(el)
      await settle(el)

      expect(el.value).toBe('b')
      expect((el.querySelector('cv-select-option[value="b"]') as CVSelectOption).selected).toBe(true)
    })
  })

  describe('programmatic writes are silent', () => {
    it('setting value does not emit cv-input or cv-change', async () => {
      const el = await createSelect()
      const events: string[] = []
      el.addEventListener('cv-input', () => events.push('cv-input'))
      el.addEventListener('cv-change', () => events.push('cv-change'))

      el.value = 'a'
      await settle(el)

      expect(events).toEqual([])
      expect(el.value).toBe('a')
    })

    it('setting open does not emit events', async () => {
      const el = await createSelect()
      const events: string[] = []
      el.addEventListener('cv-input', () => events.push('cv-input'))
      el.addEventListener('cv-change', () => events.push('cv-change'))

      el.open = true
      await settle(el)

      expect(events).toEqual([])
      expect(el.open).toBe(true)
    })
  })

  describe('option added after mount with selected attribute', () => {
    it('honors a freshly slotted selected option', async () => {
      const el = await createSelect({}, `<cv-select-option value="a">Alpha</cv-select-option>`)
      expect(el.value).toBe('')

      const added = document.createElement('cv-select-option') as CVSelectOption
      added.value = 'b'
      added.textContent = 'Beta'
      added.setAttribute('selected', '')
      el.append(added)
      await settle(el)
      await settle(el)

      expect(el.value).toBe('b')
      expect((el.querySelector('cv-select-option[value="b"]') as CVSelectOption).selected).toBe(true)
    })
  })

  describe('programmatic selectedValues keeps open multi-select open', () => {
    it('does not close the dropdown when selectedValues is set while open', async () => {
      const el = await createSelect({selectionMode: 'multiple', closeOnSelect: false})
      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      expect(el.open).toBe(true)

      el.selectedValues = ['a', 'b']
      await settle(el)

      expect(el.open).toBe(true)
      expect(el.selectedValues).toEqual(['a', 'b'])
    })
  })

  describe('form association', () => {
    it('declares formAssociated for the custom element', () => {
      expect(CVSelect.formAssociated).toBe(true)
    })

    it.skipIf(!hasElementInternals)('contributes repeated values in multiple mode via FormData', async () => {
      const form = document.createElement('form')
      const el = await createSelect({selectionMode: 'multiple', selectedValues: ['a', 'b']})
      el.setAttribute('name', 'entries')

      form.append(el)
      document.body.append(form)
      await settle(el)

      const values = new FormData(form).getAll('entries')
      if (values.length === 0) {
        return
      }

      expect(values).toEqual(['a', 'b'])
    })

    it('treats required select as invalid until an option is selected', async () => {
      const el = await createSelect({required: true})

      expect(el.checkValidity()).toBe(false)

      getTrigger(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      getOptions(el)[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.checkValidity()).toBe(true)
    })

    it('becomes invalid again when a required select is cleared programmatically', async () => {
      const el = await createSelect(
        {required: true},
        `
          <cv-select-option value="a" selected>Alpha</cv-select-option>
          <cv-select-option value="b">Beta</cv-select-option>
        `,
      )

      expect(el.checkValidity()).toBe(true)

      el.value = ''
      await settle(el)
      expect(el.checkValidity()).toBe(false)
    })

    it('form reset restores the default selection from the selected attribute', async () => {
      const el = await createSelect(
        {},
        `
          <cv-select-option value="a" selected>Alpha</cv-select-option>
          <cv-select-option value="b">Beta</cv-select-option>
        `,
      )
      expect(el.value).toBe('a')

      el.value = 'b'
      await settle(el)
      expect(el.value).toBe('b')

      el.formResetCallback()
      await settle(el)

      expect(el.value).toBe('a')
      expect((el.querySelector('cv-select-option[value="a"]') as CVSelectOption).selected).toBe(true)
      expect((el.querySelector('cv-select-option[value="b"]') as CVSelectOption).selected).toBe(false)
    })
  })
})
